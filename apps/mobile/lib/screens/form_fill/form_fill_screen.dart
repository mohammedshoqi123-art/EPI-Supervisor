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

  // ⚠️ PERF: Cache _allFields instead of recomputing on every build
  List<Map<String, dynamic>> _allFieldsCache = [];
  // ⚠️ PERF: Cache field type lookup for _syncControllersToFormData
  final Map<String, String> _fieldTypeCache = {};

  late String _draftId;

  @override
  void initState() {
    super.initState();
    _draftId = widget.draftId ?? const Uuid().v4();
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
      final cache = await ref.read(offlineDataCacheProvider.future).timeout(
            const Duration(seconds: 5),
            onTimeout: () => throw Exception('timeout'),
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
        final db = ref.read(databaseServiceProvider);
        form = await db.getForm(widget.formId).timeout(
              const Duration(seconds: 15),
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
      if (mounted) context.showError('فشل تحميل النموذج: ${e.toString()}');
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
        for (final field in _allFields) {
          if (field['type'] == 'gps') {
            final key = field['key'] as String;
            final gpsStr = _formData[key] as String?;
            if (gpsStr != null && gpsStr.contains(',')) {
              final parts = gpsStr.split(',').map((s) => s.trim()).toList();
              if (parts.length == 2) {
                final lat = double.tryParse(parts[0]);
                final lng = double.tryParse(parts[1]);
                if (lat != null && lng != null) {
                  _gpsLat = lat;
                  _gpsLng = lng;
                }
              }
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

      // Skip if already has a value (e.g., from draft)
      if (_formData.containsKey(key) && _formData[key] != null) continue;

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
          _formData[key] = authState.role?.nameAr ?? '';
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
    }
  }

  @override
  void dispose() {
    _autoSaveTimer?.cancel();
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
        setState(() => _isGettingLocation = false);
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) context.showError('تم رفض إذن الموقع');
          setState(() => _isGettingLocation = false);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted)
          context.showError(
            'تم رفض إذن الموقع نهائياً. يرجى تفعيله من الإعدادات',
          );
        setState(() => _isGettingLocation = false);
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 30),
      );

      setState(() {
        _gpsLat = position.latitude;
        _gpsLng = position.longitude;
        _isGettingLocation = false;
      });

      for (final field in _allFields) {
        if (field['type'] == 'gps') {
          final key = field['key'] as String;
          _formData[key] =
              '${position.latitude.toStringAsFixed(6)}, ${position.longitude.toStringAsFixed(6)}';
        }
      }
      _markChanged();

      if (mounted) context.showSuccess('تم تحديد الموقع بنجاح');
    } catch (e) {
      setState(() => _isGettingLocation = false);
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
  }

  Future<void> _submit() async {
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

  Future<void> _autoSave({bool showFeedback = false}) async {
    _syncControllersToFormData();
    if (_formData.isEmpty) return;

    if (!mounted) return;

    try {
      final offline = await ref.read(offlineManagerProvider.future).timeout(
        const Duration(seconds: 10), // ⚠️ FIX: 10s بدلاً من 5s
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
      if (showFeedback && mounted) {
        context.showSuccess('تم الحفظ التلقائي');
      }
    } on TimeoutException {
      // صامت — سيحاول مرة أخرى في الـ timer القادم
    } catch (e) {
      debugPrint('[AutoSave] Failed: $e');
    }
  }

  void _markChanged() {
    _hasUnsavedChanges = true;
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
          if (condField != null && _formData[condField] != condValue) continue;
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
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // ═══ Simple progress text (no Builder, no iteration) ═══
                      if (_sections.isNotEmpty && _hasUnsavedChanges)
                        Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.orange.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.edit_rounded, size: 14, color: Colors.orange),
                              SizedBox(width: 6),
                              Text('تغييرات غير محفوظة', style: TextStyle(fontSize: 11, fontFamily: 'Tajawal', color: Colors.orange, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      // ═══ Active campaign round indicator (only for integrated_activity) ═══
                      Builder(builder: (context) {
                        final campaign = ref.watch(campaignProvider);
                        final round = ref.watch(campaignRoundProvider);
                        if (campaign.value != 'integrated_activity') {
                          return const SizedBox.shrink();
                        }
                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: AppTheme.primaryColor.withValues(alpha: 0.25),
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.refresh_rounded,
                                size: 18,
                                color: AppTheme.primaryColor,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'يتم التعبئة في:',
                                      style: TextStyle(
                                        fontFamily: 'Tajawal',
                                        fontSize: 11,
                                        color: AppTheme.textSecondary,
                                      ),
                                    ),
                                    Text(
                                      campaignRoundLabel(round),
                                      style: TextStyle(
                                        fontFamily: 'Tajawal',
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.primaryColor,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                      if (_formSchema?['description_ar'] != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: Text(
                            _formSchema!['description_ar'],
                            style: const TextStyle(
                              fontFamily: 'Tajawal',
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ),
                      if (_sections.isNotEmpty)
                        ...buildFormSections(
                          sections: _sections,
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
                        )
                      else
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
                      EpiButton(
                        text: 'مراجعة وإرسال',
                        isLoading: _isLoading,
                        onPressed: () {
                          if (!_formKey.currentState!.validate()) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('يرجى تعبئة جميع الحقول المطلوبة', style: TextStyle(fontFamily: 'Tajawal')), behavior: SnackBarBehavior.floating),
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
                    ],
                  ),
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
