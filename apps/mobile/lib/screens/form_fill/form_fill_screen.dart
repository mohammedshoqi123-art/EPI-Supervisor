import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:uuid/uuid.dart';
import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';
import '../../providers/app_providers.dart';
import 'form_field_builders.dart';
import 'form_review_sheet.dart';
import 'section_navigation_bar.dart';
import 'compact_progress_bar.dart';

// ⚠️ ConnectivityUtils for offline checks
import 'package:epi_core/src/utils/connectivity_utils.dart';

class FormFillScreen extends ConsumerStatefulWidget {
  final String formId;
  final String? draftId;
  const FormFillScreen({super.key, required this.formId, this.draftId});

  @override
  ConsumerState<FormFillScreen> createState() => _FormFillScreenState();
}

class _FormFillScreenState extends ConsumerState<FormFillScreen> {
  final _formKey = GlobalKey<FormState>();
  final Map<String, dynamic> _formData = {};
  final Map<String, TextEditingController> _textControllers = {};
  bool _isLoading = false;
  bool _isSavingDraft = false;
  bool _isGettingLocation = false;
  bool _hasUnsavedChanges = false;
  Map<String, dynamic>? _formSchema;

  // Support both formats: sections (new) and flat fields (old)
  List<dynamic> _sections = [];
  List<dynamic> _flatFields = [];

  double? _gpsLat;
  double? _gpsLng;
  final Map<String, List<XFile>> _photosByField = {};

  // Auto-save timer
  Timer? _autoSaveTimer;

  // ═══ Section Navigation ═══
  late PageController _pageController;
  int _currentSectionIndex = 0;

  // ═══ Section Grouping: merge small sections into pages ═══
  // Each page can contain multiple sections
  List<List<int>> _sectionPages = []; // _sectionPages[pageIndex] = [sectionIndices]

  // ⚠️ PERF: Cache _allFields instead of recomputing on every build
  List<Map<String, dynamic>> _allFieldsCache = [];
  // ⚠️ PERF: Cache field type lookup for _syncControllersToFormData
  final Map<String, String> _fieldTypeCache = {};

  late String _draftId;

  @override
  void initState() {
    super.initState();
    _draftId = widget.draftId ?? const Uuid().v4();
    _pageController = PageController();
    _loadForm();
    // ⚠️ PERF: 60 ثانية — PBKDF2 encryption مكلف، 30s تسبب تجميد
    _autoSaveTimer = Timer.periodic(const Duration(seconds: 60), (_) {
      if (_hasUnsavedChanges && _formData.isNotEmpty) {
        _autoSave(showFeedback: false);
      }
    });
  }

  Future<void> _loadForm() async {
    setState(() => _isLoading = true);
    Map<String, dynamic>? form;

    try {
      // ═══ FIX: مهلة قصيرة على cache — لا نحظر UI لـ 5s ═══
      final cache = await ref.read(offlineDataCacheProvider.future).timeout(
            const Duration(seconds: 3),
            onTimeout: () => throw Exception('cache_init_timeout'),
          );
      // Fix: try multiple cache keys since formsProvider uses campaign-specific key
      // First try the specific form cache, then try campaign-specific list
      final campaignValue = ref.read(campaignProvider).value;
      List<Map<String, dynamic>>? cachedForms;
      // Try campaign-specific cache key first (matches formsProvider)
      cachedForms = cache.getCachedDataList('forms_$campaignValue');
      // Also try 'forms_all' as fallback (may be populated by full sync)
      cachedForms ??= cache.getCachedDataList('forms_all');
      if (cachedForms != null) {
        for (final f in cachedForms) {
          if (f['id'] == widget.formId) {
            form = f;
            break;
          }
        }
      }

      if (form == null) {
        // ⚠️ OFFLINE FIX: لا تحاول الشبكة بدون إنترنت
        if (!ConnectivityUtils.isOnline) {
          setState(() => _isLoading = false);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('لا يمكن تحميل النموذج بدون إنترنت — لم يتم تخزينه مسبقاً', style: TextStyle(fontFamily: 'Tajawal')),
                behavior: SnackBarBehavior.floating,
                backgroundColor: Colors.orange,
                duration: Duration(seconds: 3),
              ),
            );
            // العودة للصفحة السابقة بعد عرض الرسالة
            Future.delayed(const Duration(seconds: 2), () {
              if (mounted) Navigator.of(context).pop();
            });
          }
          return;
        }
        final db = ref.read(databaseServiceProvider);
        // ═══ FIX: مهلة 10s بدل 15s — لا نحظر UI ═══
        form = await db.getForm(widget.formId).timeout(
              const Duration(seconds: 10),
              onTimeout: () => throw TimeoutException('Network timeout'),
            );
        await cache.cacheFormData(widget.formId, form);
      }

      final schema = form['schema'] as Map<String, dynamic>? ?? {};

      setState(() {
        _formSchema = form;
        _sections = (schema['sections'] as List?) ?? [];
        _flatFields = (schema['fields'] as List?) ?? [];
        _isLoading = false;
      });

      // ⚠️ PERF: Build cache ONCE after form loads
      _buildFieldsCache();
      // بناء صفحات الأقسام المجمعة
      _buildSectionPages();

      // ═══ AUTO-FILL: populate fields from user profile ═══
      _autoFillFromProfile();
      // ⚠️ FIX: بعد التعبئة التلقائية، لا تعتبرها "تغييرات غير محفوظة"
      // المستخدم لم يغير شيئاً بنفسه بعد
      _hasUnsavedChanges = false;

      await _loadDraft();
    } on TimeoutException {
      setState(() => _isLoading = false);
      if (mounted)
        context.showError('انتهت مهلة تحميل النموذج — تحقق من الاتصال');
    } catch (e) {
      debugPrint('[FormFillScreen] Load form error: $e');
      setState(() => _isLoading = false);
      if (mounted) {
        // ═══ FIX: رسالة واضحة إذا فشل cache init ═══
        if (e.toString().contains('cache_init_timeout')) {
          context.showError('التخزين المحلي غير جاهز. حاول إعادة فتح التطبيق.');
        } else {
          context.showError('فشل تحميل النموذج: ${e.toString()}');
        }
      }
    }
  }

  Future<void> _loadDraft() async {
    try {
      final offline = await ref.read(offlineManagerProvider.future).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw TimeoutException(
            'Offline storage not ready for draft loading',
          );
        },
      );
      final draft = offline.getDraft(_draftId);
      if (draft != null && draft['data'] != null) {
        final draftData = Map<String, dynamic>.from(draft['data']);
        setState(() {
          _formData.addAll(draftData);
          _hasUnsavedChanges = false;
        });
        for (final entry in draftData.entries) {
          if (_textControllers.containsKey(entry.key)) {
            _textControllers[entry.key]!.text = entry.value?.toString() ?? '';
          }
        }

        // ═══ FIX: Restore GPS coordinates from draft data ═══
        // GPS fields store "lat, lng" as a string in _formData
        // We must restore _gpsLat/_gpsLng so the UI shows "تم تحديد الموقع ✓"
        // ═══ FIX: Support both String ("lat, lng") and Map ({lat, lng, accuracy}) formats ═══
        // Old drafts may have Map format from _getCurrentLocationForField()
        for (final field in _allFields) {
          if (field['type'] == 'gps') {
            final key = field['key'] as String;
            final gpsData = _formData[key];
            double? lat, lng;

            if (gpsData is String && gpsData.contains(',')) {
              // Format: "33.300000, 44.300000"
              final parts = gpsData.split(',').map((s) => s.trim()).toList();
              if (parts.length == 2) {
                lat = double.tryParse(parts[0]);
                lng = double.tryParse(parts[1]);
              }
            } else if (gpsData is Map) {
              // Format: {lat: 33.3, lng: 44.3, accuracy: 10} (legacy)
              lat = (gpsData['lat'] as num?)?.toDouble();
              lng = (gpsData['lng'] as num?)?.toDouble();
              // Normalize to String format for consistency
              if (lat != null && lng != null) {
                _formData[key] =
                    '${lat.toStringAsFixed(6)}, ${lng.toStringAsFixed(6)}';
              }
            } else if (gpsData is num) {
              // Edge case: stored as single number (shouldn't happen but be safe)
              debugPrint('[Draft] Unexpected GPS format: $gpsData');
            }

            if (lat != null && lng != null) {
              _gpsLat = lat;
              _gpsLng = lng;
            }
          }
        }

        if (mounted) {
          context.showInfo('تم استعادة المسودة السابقة');
        }
      }
    } on TimeoutException {
      // Non-critical
    } catch (_) {
      // Non-critical
    }
  }

  /// Auto-fill form fields from the authenticated user's profile.
  /// Fields are auto-filled ONLY if they are empty (not overwritten by draft).
  void _autoFillFromProfile() {
    final authState = ref.read(authStateProvider).valueOrNull;
    if (authState == null || !authState.isAuthenticated) return;

    for (final field in _allFields) {
      final key = field['key'] as String? ?? '';
      final type = field['type'] as String? ?? '';
      final autoFill = field['auto_fill'] as String? ?? '';

      // Skip if already has a value (e.g., from draft)
      if (_formData.containsKey(key) && _formData[key] != null) continue;

      // ═══ Handle auto_fill from schema ═══
      if (autoFill.isNotEmpty) {
        switch (autoFill) {
          case 'profile.full_name':
            _formData[key] = authState.fullName ?? '';
            continue;
          case 'profile.phone':
            _formData[key] = authState.phone ?? '';
            continue;
          case 'profile.email':
            _formData[key] = authState.email ?? '';
            continue;
          case 'profile.position':
            _formData[key] = authState.position ?? '';
            continue;
          case 'profile.governorate_id':
            if (authState.governorateId != null) {
              _formData[key] = authState.governorateId;
            }
            continue;
          case 'profile.district_id':
            if (authState.districtId != null) {
              _formData[key] = authState.districtId;
            }
            continue;
          case 'current_time':
            final now = TimeOfDay.now();
            _formData[key] = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
            continue;
          case 'campaign_round_name':
            // Will be filled by campaign round context
            _formData[key] = _getCampaignRoundName();
            continue;
        }
      }

      switch (key) {
        // Submission ID — always generate fresh UUID
        case 'submission_id':
        case 'submission_number':
        case 'form_number':
        case 'رقم_الاستمارة':
          _formData[key] = const Uuid().v4();
          break;

        // Supervisor name — from profile
        case 'supervisor_name':
        case 'name':
        case 'full_name':
        case 'اسم_المشرف':
        case 'الاسم':
          _formData[key] = authState.fullName ?? '';
          break;

        // Phone — from profile
        case 'phone':
        case 'mobile':
        case 'رقم_الجوال':
        case 'الهاتف':
          _formData[key] = authState.phone ?? '';
          break;

        // Role — from profile
        case 'role':
        case 'الصفة':
        case 'supervisor_role':
          _formData[key] = authState.position ?? authState.role?.nameAr ?? '';
          break;

        // Email — from profile
        case 'email':
        case 'البريد':
        case 'الايميل':
          _formData[key] = authState.email ?? '';
          break;
      }

      // Governorate — auto-select if field type is governorate
      if (type == 'governorate' && authState.governorateId != null) {
        _formData[key] = authState.governorateId;
      }

      // District — auto-select if field type is district
      if (type == 'district' && authState.districtId != null) {
        _formData[key] = authState.districtId;
        _formData['district_id'] = authState.districtId;
      }

      // GPS — auto-detect current location
      if (type == 'gps' && (field['auto_detect'] == true || autoFill == 'current_location')) {
        _getCurrentLocationForField(key);
      }

      // Time — auto-fill with current time
      if (type == 'time' && autoFill == 'current_time') {
        final now = TimeOfDay.now();
        _formData[key] = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
      }
    }
  }

  String _getCampaignRoundName() {
    // Get campaign round from context or default to 1
    final round = ref.read(campaignRoundProvider);
    final campaign = ref.read(campaignProvider);
    final roundLabel = campaignRoundLabel(round);
    
    // Build activity name based on campaign type and round
    if (campaign == CampaignType.integratedActivity) {
      return '$roundLabel من النشاط الايصالي التكاملي';
    } else if (campaign == CampaignType.polioCampaign) {
      return '$roundLabel من حملة شلل الأطفال';
    }
    return roundLabel;
  }

  Future<void> _getCurrentLocationForField(String fieldKey) async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) return;
      }
      if (permission == LocationPermission.deniedForever) return;

      // ═══ FIX: Timeout على GPS — يمنع التعليق في الأماكن المغلقة ═══
      // ═══ IMPROVEMENT: Use medium accuracy for faster response ═══
      // High accuracy requires GPS chip → slow indoors, drains battery
      // Medium accuracy uses WiFi/cell towers → fast, works indoors
      Position? position;
      try {
        position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,  // Faster than high
          timeLimit: const Duration(seconds: 8),
        ).timeout(
          const Duration(seconds: 10),
          onTimeout: () => throw TimeoutException('GPS timeout'),
        );
      } on TimeoutException {
        // Fallback to last known position
        debugPrint('[GPS] High accuracy timeout — trying last known position');
        position = await Geolocator.getLastKnownPosition();
        if (position != null) {
          if (mounted) context.showSuccess('تم استخدام آخر موقع معروف');
        } else {
          if (mounted) context.showError('لم يتم العثور على موقع — حاول في مكان مفتوح');
          return;
        }
      }

      if (position == null) return;

      final lat = position.latitude;
      final lng = position.longitude;
      final acc = position.accuracy;
      // ═══ FIX: Store GPS as String (consistent with _getLocation) ═══
      // Previously: stored as Map {lat, lng, accuracy} — broke draft loading
      // Now: stored as "lat, lng" String — matches draft restore logic
      setState(() {
        _formData[fieldKey] =
            '${lat.toStringAsFixed(6)}, ${lng.toStringAsFixed(6)}';
        _gpsLat = lat;
        _gpsLng = lng;
      });
    } catch (e) {
      debugPrint('Error getting location: $e');
      if (mounted) context.showError('فشل الحصول على الموقع: ${e.toString()}');
    }
  }

  @override
  void dispose() {
    _autoSaveTimer?.cancel();
    _pageController.dispose();
    for (final controller in _textControllers.values) {
      controller.dispose();
    }
    _textControllers.clear();
    super.dispose();
  }

  /// ⚠️ PERF: Build cache once — avoids O(n) allocation per build
  void _buildFieldsCache() {
    if (_sections.isNotEmpty) {
      _allFieldsCache = _sections
          .expand((s) => (s['fields'] as List? ?? []))
          .cast<Map<String, dynamic>>()
          .toList();
    } else {
      _allFieldsCache = _flatFields.cast<Map<String, dynamic>>().toList();
    }
    // Build type lookup map for O(1) access in _syncControllersToFormData
    _fieldTypeCache.clear();
    for (final f in _allFieldsCache) {
      final key = f['key'] as String?;
      final type = f['type'] as String? ?? 'text';
      if (key != null) _fieldTypeCache[key] = type;
    }
  }

  List<Map<String, dynamic>> get _allFields => _allFieldsCache;

  Future<void> _getLocation() async {
    setState(() => _isGettingLocation = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) context.showError('خدمة الموقع غير مفعّلة');
        if (mounted) setState(() => _isGettingLocation = false);
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) context.showError('تم رفض إذن الموقع');
          if (mounted) setState(() => _isGettingLocation = false);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted) {
          context.showError(
            'تم رفض إذن الموقع نهائياً. يرجى تفعيله من الإعدادات',
          );
          setState(() => _isGettingLocation = false);
        }
        return;
      }

      // ═══ FIX: Timeout + fallback — medium accuracy for speed ═══
      Position? position;
      try {
        position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,  // Faster than high
          timeLimit: const Duration(seconds: 8),
        ).timeout(
          const Duration(seconds: 10),
          onTimeout: () => throw TimeoutException('GPS timeout'),
        );
      } on TimeoutException {
        debugPrint('[GPS] High accuracy timeout — trying last known position');
        position = await Geolocator.getLastKnownPosition();
        if (position != null && mounted) {
          context.showSuccess('تم استخدام آخر موقع معروف');
        }
      }

      if (position == null) {
        if (mounted) context.showError('لم يتم العثور على موقع — حاول في مكان مفتوح');
        if (mounted) setState(() => _isGettingLocation = false);
        return;
      }

      final posLat = position.latitude;
      final posLng = position.longitude;
      if (mounted) {
        setState(() {
          _gpsLat = posLat;
          _gpsLng = posLng;
          _isGettingLocation = false;
        });
      }

      for (final field in _allFields) {
        if (field['type'] == 'gps') {
          final key = field['key'] as String;
          _formData[key] =
              '${posLat.toStringAsFixed(6)}, ${posLng.toStringAsFixed(6)}';
        }
      }
      _markChanged();

      if (mounted) context.showSuccess('تم تحديد الموقع بنجاح');
    } catch (e) {
      if (mounted) setState(() => _isGettingLocation = false);
      if (mounted) context.showError('فشل الحصول على الموقع: ${e.toString()}');
    }
  }

  void _syncControllersToFormData() {
    // ⚠️ PERF: O(1) lookup via _fieldTypeCache instead of O(n) scan
    final textFieldTypes = {'text', 'textarea', 'phone', 'email', 'number', 'date', 'time'};
    for (final entry in _textControllers.entries) {
      final key = entry.key;
      final type = _fieldTypeCache[key] ?? 'text';

      if (textFieldTypes.contains(type)) {
        if (type == 'number') {
          final numValue = num.tryParse(entry.value.text);
          if (numValue != null) {
            _formData[key] = numValue;
          }
        } else {
          _formData[key] = entry.value.text;
        }
      }
    }

    // ═══ FIX: Sync GPS coordinates to _formData ═══
    // Previously: _gpsLat/_gpsLng were separate from _formData
    // Now: ensure GPS data is always in _formData for auto-save
    if (_gpsLat != null && _gpsLng != null) {
      for (final field in _allFields) {
        if (field['type'] == 'gps') {
          final key = field['key'] as String;
          // Only update if not already set (user may have set it manually)
          if (_formData[key] == null || _formData[key] is Map) {
            _formData[key] =
                '${_gpsLat!.toStringAsFixed(6)}, ${_gpsLng!.toStringAsFixed(6)}';
          }
        }
      }
    }
  }

  /// ═══ Rate limiting: prevent double-submit ═══
  DateTime? _lastSubmitTime;
  static const _submitDebounce = Duration(seconds: 2);

  Future<void> _submit() async {
    // ═══ FIX: Prevent double-submit (debounce) ═══
    final now = DateTime.now();
    if (_lastSubmitTime != null && now.difference(_lastSubmitTime!) < _submitDebounce) {
      debugPrint('[FormFill] Submit debounced — too fast');
      return;
    }
    _lastSubmitTime = now;

    _syncControllersToFormData();

    final formState = _formKey.currentState;
    if (formState == null) {
      // ⚠️ FIX: Show error instead of silent return
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('خطأ في النموذج — لا يمكن الإرسال', style: TextStyle(fontFamily: 'Tajawal')),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }
    if (!formState.validate()) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('يرجى تصحيح الأخطاء في النموذج', style: TextStyle(fontFamily: 'Tajawal')),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      return;
    }

    final missingFields = <String>[];
    for (final field in _allFields) {
      final key = field['key'] as String? ?? '';
      final type = field['type'] as String? ?? 'text';
      final label = field['label_ar'] as String? ?? key;
      final isRequired = field['required'] == true;
      if (!isRequired) continue;

      switch (type) {
        case 'select':
        case 'health_facility':
          if (_formData[key] == null || (_formData[key] as String?)?.isEmpty == true)
            missingFields.add(label);
          break;
        case 'multiselect':
          final val = _formData[key] as List?;
          if (val == null || val.isEmpty) missingFields.add(label);
          break;
        case 'yesno':
          if (_formData[key] == null) missingFields.add(label);
          break;
        case 'date':
        case 'time':
          if (_formData[key] == null ||
              (_formData[key] as String?)?.isEmpty == true)
            missingFields.add(label);
          break;
        case 'gps':
          if (_gpsLat == null) missingFields.add(label);
          break;
        case 'photo':
          if ((_photosByField[key] ?? []).isEmpty) missingFields.add(label);
          break;
        case 'governorate':
          if (_formData[key] == null) missingFields.add(label);
          break;
        case 'district':
          if (_formData[key] == null) missingFields.add(label);
          break;
      }
    }
    if (missingFields.isNotEmpty) {
      context.showWarning('الحقول التالية مطلوبة: ${missingFields.join("، ")}');
      return;
    }

    final requiresGps = _formSchema?['requires_gps'] == true;
    if (requiresGps && _gpsLat == null) {
      final shouldGetLocation = await context.showConfirmDialog(
        title: 'موقع GPS مطلوب',
        message: 'هذا النموذج يتطلب تحديد الموقع. هل تريد تحديده الآن؟',
        confirmText: 'تحديد الموقع',
      );
      if (shouldGetLocation == true) {
        await _getLocation();
        if (_gpsLat == null) return;
      } else {
        return;
      }
    }

    setState(() => _isLoading = true);

    // ═══ WEB: Submit directly to Supabase (bypass offline storage) ═══
    if (kIsWeb) {
      try {
        final db = ref.read(databaseServiceProvider);
        final campaignRound = ref.read(campaignRoundProvider);
        
        // Submit directly via Edge Function
        await db.submitForm({
          'form_id': widget.formId,
          'data': Map<String, dynamic>.from(_formData),
          if (_gpsLat != null) 'gps_lat': _gpsLat,
          if (_gpsLng != null) 'gps_lng': _gpsLng,
          'campaign_round': campaignRound,
        }).timeout(const Duration(seconds: 30));

        if (mounted) {
          try { ref.invalidate(formStatsProvider); } catch (_) {}
          _hasUnsavedChanges = false;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم الإرسال بنجاح ✅', style: TextStyle(fontFamily: 'Tajawal')),
              behavior: SnackBarBehavior.floating,
              backgroundColor: Colors.green,
            ),
          );
          Navigator.of(context).pop();
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('فشل الإرسال: $e', style: const TextStyle(fontFamily: 'Tajawal')),
              behavior: SnackBarBehavior.floating,
              backgroundColor: Colors.red,
            ),
          );
        }
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
      return;
    }

    // ═══ MOBILE: Use offline storage + sync queue ═══

    // ═══ FIX: Check if campaign round is locked before submitting ═══
    final campaignRound = ref.read(campaignRoundProvider);
    final campaignType = ref.read(campaignProvider).value;
    if (ConnectivityUtils.isOnline) {
      try {
        final db = ref.read(databaseServiceProvider);
        final isLocked = await db.isRoundLocked(campaignType, campaignRound).timeout(
          const Duration(seconds: 5),
          onTimeout: () => false,
        );
        if (isLocked && mounted) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'الجولة $campaignRound مغلقة — لا يمكن إدخال بيانات. يرجى اختيار الجولة التالية.',
                style: const TextStyle(fontFamily: 'Tajawal'),
              ),
              behavior: SnackBarBehavior.floating,
              backgroundColor: Colors.orange,
              duration: const Duration(seconds: 4),
            ),
          );
          return;
        }
      } catch (e) {
        // If check fails, allow submission (don't block user)
        debugPrint('[Submit] Round lock check failed: $e — allowing submission');
      }
    }

    final OfflineManager offline;
    try {
      offline = await ref.read(offlineManagerProvider.future).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw TimeoutException('Offline storage not ready');
        },
      );
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        context.showError('التخزين المحلي غير جاهز. حاول إعادة فتح التطبيق.');
      }
      return;
    }

    try {
      // ═══ FIX #3: Convert photos to base64 for offline storage & sync ═══
      final Map<String, dynamic> dataWithPhotos =
          Map<String, dynamic>.from(_formData);

      // Find photo fields and convert XFile paths to base64
      // Fix: use compute() to offload base64 encoding to a background isolate
      // to prevent UI jank when encoding multiple large photos.
      for (final field in _allFields) {
        final key = field['key'] as String? ?? '';
        final type = field['type'] as String? ?? 'text';
        if (type == 'photo' && dataWithPhotos.containsKey(key)) {
          final paths = dataWithPhotos[key] as List?;
          if (paths != null && paths.isNotEmpty) {
            // Encode photos in background isolate
            final pathList = paths.map((p) => p.toString()).toList();
            try {
              final base64Photos = await compute(
                _encodePhotosToBase64,
                pathList,
              );
              dataWithPhotos[key] = base64Photos;
            } catch (e) {
              debugPrint('[Submit] Photo encode (isolate) failed: $e');
              // Fallback: encode on main thread
              final List<String> base64Photos = [];
              for (final path in pathList) {
                try {
                  final file = XFile(path);
                  final bytes = await file.readAsBytes();
                  base64Photos.add(base64Encode(bytes));
                } catch (e2) {
                  debugPrint('[Submit] Photo encode (fallback) failed: $e2');
                }
              }
              dataWithPhotos[key] = base64Photos;
            }
          }
        }
      }

      final campaignRound = ref.read(campaignRoundProvider);
      final submissionData = {
        'form_id': widget.formId,
        'data': dataWithPhotos,
        if (_gpsLat != null) 'gps_lat': _gpsLat,
        if (_gpsLng != null) 'gps_lng': _gpsLng,
        'photos_count': _photosByField.values.fold(0, (sum, list) => sum + list.length),
        'campaign_round': campaignRound,
        'created_at': DateTime.now().toIso8601String(),
      };

      await offline.addToSyncQueue(submissionData);
      await offline.saveDraft(
        _draftId,
        widget.formId,
        Map<String, dynamic>.from(_formData),
      );

      // ═══ FIX O2: Await sync result before showing success message ═══
      // Previously: sync was fire-and-forget, showing "sent ✅" even if sync failed
      bool syncSucceeded = false;
      if (offline.isOnline) {
        try {
          final syncService = await ref.read(syncServiceProvider.future).timeout(
            const Duration(seconds: 15),
            onTimeout: () => throw TimeoutException('Sync service timeout'),
          );
          final result = await syncService.sync().timeout(
            const Duration(seconds: 30),
            onTimeout: () => throw TimeoutException('Sync timeout'),
          );
          if (kDebugMode) {
            debugPrint('[FormSubmit] Sync: ${result.synced} synced, ${result.failed} failed');
          }
          if (result.synced > 0) {
            syncSucceeded = true;
            try {
              await offline.removeDraft(_draftId);
            } catch (_) {}
          }
        } catch (e) {
          if (kDebugMode)
            debugPrint('[FormSubmit] Sync failed (will retry later): $e');
        }
      }

      if (mounted) {
        // ═══ FIX P0-3: Invalidate providers so UI refreshes after submit ═══
        // Wrapped in try-catch to prevent crash if widget is disposing
        try {
          if (mounted) {
            ref.invalidate(formStatsProvider);
          }
        } catch (_) {}

        if (syncSucceeded) {
          context.showSuccess('تم الحفظ والإرسال بنجاح ✅');
        } else if (offline.isOnline) {
          context.showSuccess('تم الحفظ. سيتم الإرسال تلقائياً قريباً');
        } else {
          context.showSuccess(AppStrings.formSubmittedOffline);
        }
        // ═══ FIX: Set _hasUnsavedChanges = false before pop to prevent PopScope loop ═══
        _hasUnsavedChanges = false;
        if (mounted) Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        context.showError('فشل حفظ البيانات محلياً: ${e.toString()}');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveDraft() async {
    _syncControllersToFormData();

    if (_formData.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('املأ بعض الحقول أولاً قبل الحفظ', style: TextStyle(fontFamily: 'Tajawal')),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    // ═══ WEB: لا يمكن حفظ مسودة على الويب (لا Hive) ═══
    if (kIsWeb) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('على الويب: استخدم زر الإرسال مباشرة (لا يوجد حفظ محلي)', style: TextStyle(fontFamily: 'Tajawal')),
          behavior: SnackBarBehavior.floating,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    setState(() => _isSavingDraft = true);
    try {
      final offline = await ref.read(offlineManagerProvider.future).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw TimeoutException('Offline storage not ready');
        },
      );
      await offline.saveDraft(
        _draftId,
        widget.formId,
        Map<String, dynamic>.from(_formData),
      );
      _hasUnsavedChanges = false;
      if (mounted) context.showSuccess(AppStrings.draftSaved);
    } on TimeoutException {
      if (mounted) context.showError('التخزين المحلي غير جاهز. حاول مرة أخرى.');
    } catch (e) {
      final errorMsg = e.toString();
      if (mounted) {
        if (errorMsg.contains('LateInitializationError') ||
            errorMsg.contains('Hive')) {
          context.showError('خطأ في التخزين المحلي. حاول إعادة فتح التطبيق.');
        } else {
          context.showError('فشل حفظ المسودة: $errorMsg');
        }
      }
    } finally {
      if (mounted) setState(() => _isSavingDraft = false);
    }
  }

  int _autoSaveFailCount = 0;
  // ═══ FIX: Track last saved data hash to avoid redundant saves ═══
  // ═══ PERFORMANCE: Use length-based hash instead of .toString() (expensive for large maps with base64 photos)
  int _lastSavedDataHash = 0;

  /// Fast hash for change detection — avoids expensive .toString() on large maps
  int _computeDataHash() {
    int hash = _formData.length;
    for (final entry in _formData.entries) {
      // Use key length + value type as hash — fast, no string conversion
      hash = (hash * 31 + entry.key.length) & 0x7FFFFFFF;
      if (entry.value is String) {
        hash = (hash * 31 + (entry.value as String).length) & 0x7FFFFFFF;
      } else if (entry.value is num) {
        hash = (hash * 31 + (entry.value as num).toInt()) & 0x7FFFFFFF;
      } else if (entry.value is List) {
        hash = (hash * 31 + (entry.value as List).length) & 0x7FFFFFFF;
      } else if (entry.value is Map) {
        hash = (hash * 31 + (entry.value as Map).length) & 0x7FFFFFFF;
      }
    }
    return hash;
  }

  Future<void> _autoSave({bool showFeedback = false}) async {
    _syncControllersToFormData();
    if (_formData.isEmpty) return;

    // ═══ FIX: Skip save if data hasn't changed ═══
    // ═══ PERFORMANCE: Fast hash instead of .toString() — O(n) vs O(n²) for large maps
    final currentHash = _computeDataHash();
    if (currentHash == _lastSavedDataHash) return;

    if (!mounted) return;

    // ═══ FIX 2.2: Retry logic — 3 attempts with exponential backoff ═══
    // Previously: single attempt, silent failure
    // Now: 3 attempts (immediate, 1s, 3s), then show warning
    for (int attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 1s, 3s
          await Future.delayed(Duration(seconds: attempt == 1 ? 1 : 3));
          if (!mounted) return;
        }

        final offline = await ref.read(offlineManagerProvider.future).timeout(
          const Duration(seconds: 5),  // ═══ FIX: 5s (was 10s) ═══
          onTimeout: () {
            throw TimeoutException('Offline storage not ready for auto-save');
          },
        );
        if (!mounted) return;
        await offline.saveDraft(
          _draftId,
          widget.formId,
          Map<String, dynamic>.from(_formData),
        );
        _hasUnsavedChanges = false;
        _lastSavedDataHash = currentHash; // Track saved state (already computed)
        _autoSaveFailCount = 0; // Reset on success
        if (showFeedback && mounted) {
          context.showSuccess('تم الحفظ التلقائي');
        }
        return; // Success — exit retry loop
      } on TimeoutException {
        _autoSaveFailCount++;
        debugPrint('[AutoSave] Attempt ${attempt + 1}/3 timed out');
        if (attempt == 2 && _autoSaveFailCount >= 3 && mounted) {
          context.showError('⚠️ الحفظ التلقائي يفشل — تحقق من التخزين المحلي');
          _autoSaveFailCount = 0;
        }
      } catch (e) {
        _autoSaveFailCount++;
        debugPrint('[AutoSave] Attempt ${attempt + 1}/3 failed: $e');
        if (attempt == 2 && _autoSaveFailCount >= 3 && mounted) {
          context.showError('⚠️ الحفظ التلقائي يفشل: ${e.toString()}');
          _autoSaveFailCount = 0;
        }
      }
    }
  }

  void _markChanged() {
    // ═══ setState ضروري لإعادة بناء الحقول الشرطية (showIf) ═══
    // بدون setState: buildFormSections ما تعيد تقييم showIf
    // → الحقول المشرطية (مثل: هل تمت مراجعتها؟) ما تظهر/تختفي
    setState(() {
      _hasUnsavedChanges = true;
    });
  }

  /// Build review sections for the review bottom sheet
  List<SectionReview> _buildReviewSections() {
    final reviews = <SectionReview>[];
    if (_sections.isEmpty) return reviews;

    for (int i = 0; i < _sections.length; i++) {
      final sec = _sections[i] as Map<String, dynamic>;
      final title = sec['title_ar'] as String? ?? '';
      final fields = (sec['fields'] as List?) ?? [];

      int fieldCount = 0, answeredCount = 0, yesNoCount = 0, yesCount = 0;
      bool isComplete = true;

      for (final f in fields) {
        final field = f as Map<String, dynamic>;
        final key = field['key'] as String?;
        final type = field['type'] as String? ?? 'text';
        final required = field['required'] as bool? ?? false;

        final showIf = field['showIf'];
        if (showIf != null) {
          final condField = showIf['field'] as String?;
          final condValue = showIf['value'];
          if (condField != null) {
            final current = _formData[condField];
            bool matches = current == condValue;
            if (!matches && current is bool && condValue is String) {
              matches = (current && condValue == 'yes') || (!current && condValue == 'no');
            }
            if (!matches) continue;
          }
        }

        fieldCount++;
        final val = key != null ? _formData[key] : null;
        bool isAnswered = false;
        if (val != null) {
          if (val is String && val.isNotEmpty) isAnswered = true;
          else if (val is bool) isAnswered = true;
          else if (val is num) isAnswered = true;
          else if (val is List && val.isNotEmpty) isAnswered = true;
        }
        if (isAnswered) answeredCount++;
        if (required && !isAnswered) isComplete = false;
        if (type == 'yesno') { yesNoCount++; if (val == true) yesCount++; }
      }
      reviews.add(SectionReview(number: i + 1, title: title, isComplete: isComplete, fieldCount: fieldCount, answeredCount: answeredCount, yesNoCount: yesNoCount, yesCount: yesCount));
    }
    return reviews;
  }

  int get _totalPhotosCount {
    int count = 0;
    for (final photos in _photosByField.values) { count += photos.length; }
    return count;
  }

  ({int total, int yes}) get _yesNoStats {
    int total = 0, yes = 0;
    for (final sec in _sections) {
      final fields = (sec['fields'] as List?) ?? [];
      for (final f in fields) {
        final field = f as Map<String, dynamic>;
        if (field['type'] == 'yesno') {
          total++;
          if (_formData[field['key']] == true) yes++;
        }
      }
    }
    return (total: total, yes: yes);
  }

  // ═══ Section Navigation Methods ═══

  /// تجميع الأقسام في صفحات — كل صفحة تحتوي عدة أقسام صغيرة
  void _buildSectionPages() {
    _sectionPages = [];
    if (_sections.isEmpty) return;

    List<int> currentPage = [];
    int currentFieldCount = 0;
    // ═══ زيادة الحد الأقصى لتقليل عدد الصفحات ═══
    // الهدف: 12 قسم → 6 صفحات
    const maxFieldsPerPage = 15;

    for (int i = 0; i < _sections.length; i++) {
      final section = _sections[i] as Map<String, dynamic>;
      final fields = (section['fields'] as List?) ?? [];
      final fieldCount = fields.length;

      // إذا كان القسم يحتوي على حقول كثيرة جداً، اجعله صفحة مستقلة
      if (fieldCount >= maxFieldsPerPage) {
        if (currentPage.isNotEmpty) {
          _sectionPages.add(List.from(currentPage));
          currentPage = [];
          currentFieldCount = 0;
        }
        _sectionPages.add([i]);
        continue;
      }

      // إذا إضافة هذا القسم ستتجاوز الحد، ابدأ صفحة جديدة
      if (currentFieldCount + fieldCount > maxFieldsPerPage && currentPage.isNotEmpty) {
        _sectionPages.add(List.from(currentPage));
        currentPage = [];
        currentFieldCount = 0;
      }

      currentPage.add(i);
      currentFieldCount += fieldCount;
    }

    // أضف الصفحة الأخيرة
    if (currentPage.isNotEmpty) {
      _sectionPages.add(currentPage);
    }
  }

  void _goToSection(int index) {
    if (index < 0 || index >= _sectionPages.length) return;
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
    );
  }

  void _nextSection() {
    if (_currentSectionIndex < _sectionPages.length - 1) {
      _goToSection(_currentSectionIndex + 1);
    }
  }

  void _previousSection() {
    if (_currentSectionIndex > 0) {
      _goToSection(_currentSectionIndex - 1);
    }
  }

  /// بناء بيانات التنقل للصفحات
  List<SectionNavItem> _buildSectionNavItems() {
    if (_sections.isEmpty || _sectionPages.isEmpty) return [];

    return _sectionPages.asMap().entries.map((entry) {
      final pageIndex = entry.key;
      final sectionIndices = entry.value;

      int totalFields = 0, filledFields = 0;
      int requiredFields = 0, filledRequiredFields = 0;
      int yesNoFields = 0, yesCount = 0;
      String title = '';

      for (final sectionIdx in sectionIndices) {
        final section = _sections[sectionIdx] as Map<String, dynamic>;
        final sectionTitle = section['title_ar'] as String? ?? '';
        final fields = (section['fields'] as List?)?.cast<Map<String, dynamic>>() ?? [];

        // عنوان الصفحة: الأقسام المجمعة
        if (title.isEmpty) {
          title = sectionTitle;
        } else if (sectionIndices.length <= 3) {
          title = '$title، $sectionTitle';
        }

        for (final field in fields) {
          final key = field['key'] as String? ?? '';
          final type = field['type'] as String? ?? 'text';
          final isRequired = field['required'] == true;

          // تحقق من شرط الإظهار
          final showIf = field['showIf'];
          if (showIf != null) {
            final condField = showIf['field'] as String?;
            final condValue = showIf['value'];
            if (condField != null) {
              final current = _formData[condField];
              bool matches = current == condValue;
              if (!matches && current is bool && condValue is String) {
                matches = (current && condValue == 'yes') || (!current && condValue == 'no');
              }
              if (!matches) continue;
            }
          }

          totalFields++;
          if (isRequired) requiredFields++;

          final val = _formData[key];
          bool isFilled = false;
          if (val != null) {
            if (val is String && val.isNotEmpty) isFilled = true;
            else if (val is bool) isFilled = true;
            else if (val is num && val != 0) isFilled = true;
            else if (val is List && val.isNotEmpty) isFilled = true;
          }

          if (isFilled) {
            filledFields++;
            if (isRequired) filledRequiredFields++;
          }

          if (type == 'yesno') {
            yesNoFields++;
            if (val == true) yesCount++;
          }
        }
      }

      // عنوان مختصر للصفحة
      if (title.length > 20) {
        title = 'صفحة ${pageIndex + 1}';
      }

      return SectionNavItem(
        key: 'page_$pageIndex',
        title: title,
        totalFields: totalFields,
        filledFields: filledFields,
        requiredFields: requiredFields,
        filledRequiredFields: filledRequiredFields,
        yesNoFields: yesNoFields,
        yesCount: yesCount,
      );
    }).toList();
  }

  /// حساب إحصائيات التقدم الكلية
  ({int totalFields, int filledFields, int requiredFields, int filledRequired, int totalYesNo, int yesCount, int photosCount}) get _globalStats {
    int totalFields = 0, filledFields = 0;
    int requiredFields = 0, filledRequired = 0;
    int totalYesNo = 0, yesCount = 0;

    for (final field in _allFields) {
      final key = field['key'] as String? ?? '';
      final type = field['type'] as String? ?? 'text';
      final isRequired = field['required'] == true;

      totalFields++;
      if (isRequired) requiredFields++;

      final val = _formData[key];
      bool isFilled = false;
      if (val != null) {
        if (val is String && val.isNotEmpty) isFilled = true;
        else if (val is bool) isFilled = true;
        else if (val is num && val != 0) isFilled = true;
        else if (val is List && val.isNotEmpty) isFilled = true;
      }

      if (isFilled) {
        filledFields++;
        if (isRequired) filledRequired++;
      }

      if (type == 'yesno') {
        totalYesNo++;
        if (val == true) yesCount++;
      }
    }

    return (
      totalFields: totalFields,
      filledFields: filledFields,
      requiredFields: requiredFields,
      filledRequired: filledRequired,
      totalYesNo: totalYesNo,
      yesCount: yesCount,
      photosCount: _totalPhotosCount,
    );
  }

  @override
  Widget build(BuildContext context) {
    // ═══ FIX: PopScope without infinite loop ═══
    // Previous code: context.pop() after dialog triggered PopScope again
    // because _hasUnsavedChanges was still true → infinite loop → app crash
    return PopScope(
      canPop: !_hasUnsavedChanges,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;

        // ⚠️ إظهار رسالة تحذيرية عند محاولة الخروج ببيانات غير محفوظة
        final shouldSave = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 28),
                SizedBox(width: 8),
                Text('تغييرات غير محفوظة', style: TextStyle(fontFamily: 'Tajawal', fontWeight: FontWeight.bold)),
              ],
            ),
            content: const Text(
              'لديك بيانات غير محفوظة في هذه الاستمارة.\n\nهل تريد حفظها كمسودة قبل الخروج؟',
              style: TextStyle(fontFamily: 'Tajawal', fontSize: 14),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('إلغاء', style: TextStyle(fontFamily: 'Tajawal')),
              ),
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                child: const Text('خروج بدون حفظ', style: TextStyle(fontFamily: 'Tajawal', color: Colors.red)),
              ),
              FilledButton.icon(
                onPressed: () async {
                  // ⚠️ FIX: احفظ أولاً ثم أغلق (كان يغلق قبل الحفظ)
                  await _saveDraft();
                  if (ctx.mounted) Navigator.of(ctx).pop(true);
                },
                icon: const Icon(Icons.save, size: 18),
                label: const Text('حفظ وخروج', style: TextStyle(fontFamily: 'Tajawal')),
              ),
            ],
          ),
        );

        if (shouldSave == true && mounted) {
          // ⚠️ CRITICAL: اضبط _hasUnsavedChanges = false قبل pop لمنع التكرار
          _hasUnsavedChanges = false;
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
      appBar: EpiAppBar(
        title: _formSchema?['title_ar'] ?? 'تعبئة النموذج',
        actions: [
          TextButton.icon(
            onPressed: _isSavingDraft ? null : _saveDraft,
            icon: _isSavingDraft
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.save, color: Colors.white, size: 20),
            label: const Text(
              'حفظ',
              style: TextStyle(color: Colors.white, fontFamily: 'Tajawal'),
            ),
          ),
        ],
      ),
      body: _isLoading && _formSchema == null
          ? const EpiLoading()
          : _allFields.isEmpty
              ? const EpiEmptyState(
                  icon: Icons.description,
                  title: 'لا توجد حقول في النموذج',
                )
              : Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      // ═══ شريط التقدم المدمج ═══
                      if (_sections.isNotEmpty) ...[
                        Builder(builder: (context) {
                          final stats = _globalStats;
                          return CompactProgressBar(
                            filledFields: stats.filledFields,
                            totalFields: stats.totalFields,
                            filledRequired: stats.filledRequired,
                            totalRequired: stats.requiredFields,
                            currentSection: _currentSectionIndex,
                            totalSections: _sectionPages.length,
                          );
                        }),
                        // ═══ شريط التنقل بين الصفحات ═══
                        SectionNavigationBar(
                          sections: _buildSectionNavItems(),
                          currentIndex: _currentSectionIndex,
                          onSectionTap: _goToSection,
                          onNext: _nextSection,
                          onPrevious: _previousSection,
                        ),
                      ],
                      // ═══ محتوى النموذج ═══
                      Expanded(
                        child: _sections.isNotEmpty
                            ? PageView.builder(
                                controller: _pageController,
                                itemCount: _sectionPages.length,
                                onPageChanged: (index) {
                                  setState(() => _currentSectionIndex = index);
                                },
                                itemBuilder: (context, pageIndex) {
                                  return _buildPageView(pageIndex);
                                },
                              )
                            : _buildFlatFieldsList(),
                      ),
                      // ═══ زر الإرسال ═══
                      _buildSubmitButton(context),
                    ],
                  ),
                ),
      ),
    );
  }

  /// بناء صفحة تحتوي عدة أقسام
  Widget _buildPageView(int pageIndex) {
    final sectionIndices = _sectionPages[pageIndex];
    final sectionsToShow = sectionIndices.map((i) => _sections[i]).toList();

    // بناء widgets لجميع الأقسام في الصفحة
    final allWidgets = buildFormSections(
      sections: sectionsToShow,
      formData: _formData,
      textControllers: _textControllers,
      isGettingLocation: _isGettingLocation,
      gpsLat: _gpsLat,
      gpsLng: _gpsLng,
      flatFields: _flatFields,
      markChanged: _markChanged,
      getLocation: _getLocation,
      runSetState: (fn) => setState(fn),
      formSchema: _formSchema,
      photosByField: _photosByField,
    );

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        // مؤشر الحمل (فقط للصفحة الأولى)
        if (pageIndex == 0) ...[
          Builder(builder: (context) {
            final campaign = ref.watch(campaignProvider);
            final round = ref.watch(campaignRoundProvider);
            if (campaign.value != 'integrated_activity') {
              return const SizedBox.shrink();
            }
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  Icon(Icons.refresh_rounded, size: 16, color: AppTheme.primaryColor),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('يتم التعبئة في:', style: TextStyle(fontFamily: 'Tajawal', fontSize: 10, color: AppTheme.textSecondary)),
                        Text(campaignRoundLabel(round), style: TextStyle(fontFamily: 'Tajawal', fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
          // وصف النموذج
          if (_formSchema?['description_ar'] != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                _formSchema!['description_ar'],
                style: const TextStyle(fontFamily: 'Tajawal', color: AppTheme.textSecondary, fontSize: 13),
              ),
            ),
        ],
        // حقول الأقسام
        ...allWidgets,
        const SizedBox(height: 16),
      ],
    );
  }

  /// بناء قائمة الحقول المسطحة (بدون أقسام)
  Widget _buildFlatFieldsList() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (_formSchema?['description_ar'] != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Text(
              _formSchema!['description_ar'],
              style: const TextStyle(fontFamily: 'Tajawal', color: AppTheme.textSecondary),
            ),
          ),
        ..._flatFields.map(
          (field) => buildFormField(
            field: field as Map<String, dynamic>,
            formData: _formData,
            textControllers: _textControllers,
            isGettingLocation: _isGettingLocation,
            gpsLat: _gpsLat,
            gpsLng: _gpsLng,
            markChanged: _markChanged,
            getLocation: _getLocation,
            runSetState: (fn) => setState(fn),
            formSchema: _formSchema,
            photosByField: _photosByField,
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  /// بناء زر الإرسال
  Widget _buildSubmitButton(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: EpiButton(
          text: 'مراجعة وإرسال',
          isLoading: _isLoading,
          onPressed: () {
            if (!_formKey.currentState!.validate()) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('يرجى تعبئة جميع الحقول المطلوبة', style: TextStyle(fontFamily: 'Tajawal')),
                  behavior: SnackBarBehavior.floating,
                ),
              );
              return;
            }
            _syncControllersToFormData();
            FormReviewSheet.show(
              context,
              sections: _buildReviewSections(),
              gpsLat: _gpsLat,
              gpsLng: _gpsLng,
              photosCount: _totalPhotosCount,
              totalYesNoCount: _yesNoStats.total,
              yesCount: _yesNoStats.yes,
              onConfirm: () => _submit(),
            );
          },
          width: double.infinity,
          icon: Icons.fact_check_rounded,
        ),
      ),
    );
  }
}

/// Top-level function for compute() — encodes photos to base64 in a background isolate.
/// Must be top-level (not a class method) to be callable from compute().
/// Uses dart:io File (not XFile) because XFile doesn't have readAsBytesSync().
List<String> _encodePhotosToBase64(List<String> paths) {
  // ignore: avoid_web_libraries_in_flutter
  final result = <String>[];
  for (final path in paths) {
    try {
      // Use dart:io File for synchronous reading in isolate
      final bytes = File(path).readAsBytesSync();
      result.add(base64Encode(bytes));
    } catch (_) {
      // Skip failed photos — don't crash the isolate
    }
  }
  return result;
}
