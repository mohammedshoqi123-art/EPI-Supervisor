import 'dart:async';
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

class FormFillScreen extends ConsumerStatefulWidget {
  final String formId;
  const FormFillScreen({super.key, required this.formId});

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
  String? _currentDraftId; // Active draft ID for multi-draft support

  // Support both formats: sections (new) and flat fields (old)
  List<dynamic> _sections = [];
  List<dynamic> _flatFields = [];

  double? _gpsLat;
  double? _gpsLng;
  final List<XFile> _pickedPhotos = [];

  // Auto-save timer
  Timer? _autoSaveTimer;

  @override
  void initState() {
    super.initState();
    _loadForm();
    // ═══ FIX: Auto-save every 60s instead of 30s — reduces Hive encryption overhead ═══
    // PBKDF2 encryption is expensive; 60s still protects against data loss
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
      final cachedForms = cache.getCachedDataList('forms');
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

      // ═══ AUTO-FILL: populate fields from user profile ═══
      _autoFillFromProfile();

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

      // Get all drafts for this form
      final formDrafts = offline.getDraftsForForm(widget.formId);

      if (formDrafts.isEmpty) {
        // No drafts — start fresh
        return;
      }

      if (formDrafts.length == 1) {
        // Single draft — load directly
        _applyDraft(formDrafts.first);
        return;
      }

      // Multiple drafts — show picker dialog
      if (!mounted) return;
      final selected = await _showDraftPickerDialog(formDrafts);
      if (selected != null) {
        _applyDraft(selected);
      }
    } on TimeoutException {
      // Non-critical
    } catch (_) {
      // Non-critical
    }
  }

  /// Apply a draft's data to the form fields.
  void _applyDraft(Map<String, dynamic> draft) {
    final draftData = Map<String, dynamic>.from(draft['data'] ?? {});
    _currentDraftId = draft['draftId'] as String?;

    setState(() {
      _formData.addAll(draftData);
      _hasUnsavedChanges = false;
    });

    for (final entry in draftData.entries) {
      if (_textControllers.containsKey(entry.key)) {
        _textControllers[entry.key]!.text = entry.value?.toString() ?? '';
      }
    }

    // Restore GPS coordinates from draft data
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

  /// Show dialog to pick from multiple drafts.
  Future<Map<String, dynamic>?> _showDraftPickerDialog(
    List<Map<String, dynamic>> drafts,
  ) async {
    return showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(ctx).size.height * 0.6,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  'اختر مسودة للاستمرار',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  'يوجد ${drafts.length} مسودات محفوظة لهذا النموذج',
                  style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 13,
                    color: Colors.grey.shade600,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: drafts.length + 1, // +1 for "start fresh" option
                  itemBuilder: (ctx, index) {
                    if (index == drafts.length) {
                      // "Start fresh" option
                      return ListTile(
                        leading: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            Icons.add_rounded,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        title: const Text(
                          'بدء مسودة جديدة',
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        subtitle: Text(
                          'بدون استعادة بيانات سابقة',
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 12,
                            color: Colors.grey.shade500,
                          ),
                        ),
                        onTap: () => Navigator.pop(ctx),
                      );
                    }

                    final draft = drafts[index];
                    final savedAt = draft['saved_at'] as String? ?? '';
                    final fieldCount =
                        (draft['data'] as Map?)?.length ?? 0;
                    final timeAgo = _formatTimeAgo(savedAt);

                    return ListTile(
                      leading: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFFB8C00), Color(0xFFF57C00)],
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.edit_note,
                          color: Colors.white,
                          size: 22,
                        ),
                      ),
                      title: Text(
                        'مسودة ${index + 1}',
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      subtitle: Text(
                        '$fieldCount حقول — $timeAgo',
                        style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 12,
                          color: Colors.grey.shade500,
                        ),
                      ),
                      trailing: IconButton(
                        icon: Icon(
                          Icons.delete_outline,
                          color: Colors.red.shade400,
                          size: 20,
                        ),
                        onPressed: () async {
                          final offline = await ref
                              .read(offlineManagerProvider.future);
                          await offline.removeDraft(
                            widget.formId,
                            draft['draftId'] as String,
                          );
                          drafts.removeAt(index);
                          if (drafts.isEmpty) {
                            if (ctx.mounted) Navigator.pop(ctx);
                          } else {
                            (ctx as Element).markNeedsBuild();
                          }
                        },
                      ),
                      onTap: () => Navigator.pop(ctx, draft),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  /// Format a timestamp as relative time (e.g. "منذ 5 دقائق").
  String _formatTimeAgo(String isoTime) {
    final date = DateTime.tryParse(isoTime);
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'الآن';
    if (diff.inMinutes < 60) return 'منذ ${diff.inMinutes} دقيقة';
    if (diff.inHours < 24) return 'منذ ${diff.inHours} ساعة';
    return 'منذ ${diff.inDays} يوم';
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
    _pickedPhotos.clear(); // Release photo references to prevent OOM
    super.dispose();
  }

  List<Map<String, dynamic>> get _allFields {
    if (_sections.isNotEmpty) {
      return _sections
          .expand((s) => (s['fields'] as List? ?? []))
          .cast<Map<String, dynamic>>()
          .toList();
    }
    return _flatFields.cast<Map<String, dynamic>>().toList();
  }

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
    for (final entry in _textControllers.entries) {
      _formData[entry.key] = entry.value.text;
    }
  }

  Future<void> _submit() async {
    _syncControllersToFormData();

    final formState = _formKey.currentState;
    if (formState == null) return;
    if (!formState.validate()) return;

    final missingFields = <String>[];
    for (final field in _allFields) {
      final key = field['key'] as String? ?? '';
      final type = field['type'] as String? ?? 'text';
      final label = field['label_ar'] as String? ?? key;
      final isRequired = field['required'] == true;
      if (!isRequired) continue;

      switch (type) {
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
          if (_pickedPhotos.isEmpty) missingFields.add(label);
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
      final submissionData = {
        'form_id': widget.formId,
        'data': Map<String, dynamic>.from(_formData),
        if (_gpsLat != null) 'gps_lat': _gpsLat,
        if (_gpsLng != null) 'gps_lng': _gpsLng,
        'created_at': DateTime.now().toIso8601String(),
      };

      await offline.addToSyncQueue(submissionData);
      await offline.saveDraft(
        widget.formId,
        Map<String, dynamic>.from(_formData),
      );

      if (offline.isOnline) {
        ref.read(syncServiceProvider.future).then((syncService) async {
          try {
            final result = await syncService.sync();
            if (kDebugMode) {
              print(
                '[FormSubmit] Immediate sync: ${result.synced} synced, ${result.failed} failed',
              );
            }
            if (result.synced > 0) {
              try {
                await offline.removeAllDraftsForForm(widget.formId);
              } catch (_) {}
            }
          } catch (e) {
            if (kDebugMode)
              print('[FormSubmit] Immediate sync failed (will retry): $e');
          }
        }).catchError((e) {
          if (kDebugMode) print('[FormSubmit] SyncService not available: $e');
        });
      }

      if (mounted) {
        if (offline.isOnline) {
          context.showSuccess('تم الحفظ والإرسال ✅');
        } else {
          context.showSuccess(AppStrings.formSubmittedOffline);
        }
        context.pop();
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
      context.showWarning('املأ بعض الحقول أولاً قبل الحفظ');
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
      final savedId = await offline.saveDraft(
        widget.formId,
        Map<String, dynamic>.from(_formData),
        draftId: _currentDraftId,
      );
      _currentDraftId ??= savedId; // Store ID for subsequent saves
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

    try {
      final offline = await ref.read(offlineManagerProvider.future).timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          throw TimeoutException('Offline storage not ready for auto-save');
        },
      );
      final savedId = await offline.saveDraft(
        widget.formId,
        Map<String, dynamic>.from(_formData),
        draftId: _currentDraftId,
      );
      _currentDraftId ??= savedId;
      _hasUnsavedChanges = false;
      if (showFeedback && mounted) {
        context.showSuccess('تم الحفظ التلقائي');
      }
    } on TimeoutException {
      // Silent
    } catch (_) {
      // Silent
    }
  }

  void _markChanged() {
    _hasUnsavedChanges = true;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
                          pickedPhotos: _pickedPhotos,
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
                            pickedPhotos: _pickedPhotos,
                          ),
                        ),
                      const SizedBox(height: 24),
                      EpiButton(
                        text: AppStrings.submit,
                        isLoading: _isLoading,
                        onPressed: _submit,
                        width: double.infinity,
                        icon: Icons.send,
                      ),
                    ],
                  ),
                ),
    );
  }
}
