// ═══════════════════════════════════════════════════════════════════════════
//  DATA IMPORT TAB — تبويب «البيانات» في صفحة التحليلات
// ═══════════════════════════════════════════════════════════════════════════
//
//  استيراد البيانات من ملف Excel (.xlsx) لجميع النماذج بجميع حقولها،
//  وفق صلاحيات المستخدم:
//    • النماذج: فقط المستمارات المسموح بدوره (allowed_roles + is_active)
//    • الحقول: فقط الحقول الظاهرة لدوره (visible_roles / hidden_roles)
//    • النطاق: محافظة/مديرية المستخدم تُرفق من حسابه تلقائياً؛
//      المدير والمركزي فقط يمكنهما استهداف محافظة أخرى (المركزي ضمن
//      المحافظات المعينة له فقط).
//
//  الدعم الأوفلاين: الإرساليات تُضاف إلى قائمة المزامنة المحلية
//  (OfflineManager.addToSyncQueue) — تعمل أونلاين وأوفلاين وتُرسل تلقائياً.
// ═══════════════════════════════════════════════════════════════════════════

import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';

import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';

import '../providers/app_providers.dart';
import '../services/excel_import_service.dart';

class DataImportTab extends ConsumerStatefulWidget {
  /// يُستدعى بعد اكتمال الاستيراد (عدد الصفوف المستوردة).
  final void Function(int importedCount) onImported;

  const DataImportTab({super.key, required this.onImported});

  @override
  ConsumerState<DataImportTab> createState() => _DataImportTabState();
}

class _DataImportTabState extends ConsumerState<DataImportTab> {
  String? _selectedFormId;
  String? _selectedGovId; // للمدير/المركزي فقط
  ExcelParseResult? _result;
  bool _parsing = false;
  bool _importing = false;
  bool _exportingTemplate = false;
  int _imported = 0;
  int _importTotal = 0;

  // ─────────────────────────────────────────────────────────────────
  //  الصلاحيات
  // ─────────────────────────────────────────────────────────────────

  int get _userLevel =>
      ref.read(authStateProvider).valueOrNull?.role?.hierarchyLevel ?? 0;

  /// المدير (5) والمركزي (4) فقط يمكنهما استهداف محافظة مختلفة.
  bool get _canChooseGovernorate => _userLevel >= 4;

  String? get _userRoleName =>
      ref.read(authStateProvider).valueOrNull?.role?.dbValue;

  // ─────────────────────────────────────────────────────────────────
  //  النماذج المسموحة (نفس منطق formsProvider)
  // ─────────────────────────────────────────────────────────────────

  List<Map<String, dynamic>> _allowedForms(List<Map<String, dynamic>> forms) {
    final roleValue = _userRoleName;
    return forms.where((f) {
      if (f['is_active'] != true) return false;
      if (roleValue == null || roleValue == 'admin') return true;
      final allowed = f['allowed_roles'];
      if (allowed is! List || allowed.isEmpty) return true;
      return allowed.contains(roleValue);
    }).toList();
  }

  // ─────────────────────────────────────────────────────────────────
  //  الحقول القابلة للاستيراد + خرائط المراجع
  // ─────────────────────────────────────────────────────────────────

  Future<List<ExcelImportField>> _buildFields(
      Map<String, dynamic> form) async {
    final schemaRaw = form['schema'];
    final schema = schemaRaw is Map ? Map<String, dynamic>.from(schemaRaw) : <String, dynamic>{};
    final fields = ExcelImportService.importableFields(
      schema: schema,
      userRole: _userRoleName,
    );

    // خرائط المراجع (الاسم العربي → ID) من الكاش المحلي أو الشبكة
    Map<String, String> govMap = {};
    Map<String, String> distMap = {};
    Map<String, String> facMap = {};
    try {
      final govs = await ref.read(governoratesProvider.future)
          .timeout(const Duration(seconds: 10), onTimeout: () => []);
      govMap = {
        for (final g in govs)
          if (g['name_ar'] != null) g['name_ar'].toString(): g['id'].toString(),
      };
    } catch (_) {}
    try {
      final dists = await ref.read(districtsProvider(null).future)
          .timeout(const Duration(seconds: 10), onTimeout: () => []);
      distMap = {
        for (final d in dists)
          if (d['name_ar'] != null) d['name_ar'].toString(): d['id'].toString(),
      };
    } catch (_) {}
    try {
      final cache = await ref.read(offlineDataCacheProvider.future);
      final all = <String, String>{};
      // facilities_all من المزامنة + أي مفتاح facilities_<districtId> مخزن
      final keys = cache.getCacheKeys().where((k) => k.startsWith('facilities_'));
      for (final key in keys) {
        try {
          final list = cache.getCachedDataList(key) ?? const [];
          for (final f in list) {
            if (f['name_ar'] != null && f['id'] != null) {
              all[f['name_ar'].toString()] = f['id'].toString();
            }
          }
        } catch (_) {}
      }
      facMap = all;
    } catch (_) {}

    // إثراء حقول المراجع بأسمائها (للقالب والدليل)
    return fields.map((f) {
      if (f.type == 'governorate') {
        return ExcelImportField(
          key: f.key,
          label: f.label,
          type: f.type,
          required: f.required,
          options: f.options,
          sectionTitle: f.sectionTitle,
          showIf: f.showIf,
          referenceNames: govMap.keys.toList(),
        );
      }
      if (f.type == 'district') {
        return ExcelImportField(
          key: f.key,
          label: f.label,
          type: f.type,
          required: f.required,
          options: f.options,
          sectionTitle: f.sectionTitle,
          showIf: f.showIf,
          referenceNames: distMap.keys.toList(),
        );
      }
      if (f.type == 'health_facility') {
        return ExcelImportField(
          key: f.key,
          label: f.label,
          type: f.type,
          required: f.required,
          options: f.options,
          sectionTitle: f.sectionTitle,
          showIf: f.showIf,
          referenceNames: facMap.keys.toList(),
        );
      }
      return f;
    }).toList();
  }

  Future<Map<String, String>> _governorateNameMap() async {
    try {
      final govs = await ref.read(governoratesProvider.future)
          .timeout(const Duration(seconds: 10), onTimeout: () => []);
      return {
        for (final g in govs)
          if (g['name_ar'] != null) g['name_ar'].toString(): g['id'].toString(),
      };
    } catch (_) {
      return {};
    }
  }

  Future<Map<String, String>> _districtNameMap() async {
    try {
      final dists = await ref.read(districtsProvider(null).future)
          .timeout(const Duration(seconds: 10), onTimeout: () => []);
      return {
        for (final d in dists)
          if (d['name_ar'] != null) d['name_ar'].toString(): d['id'].toString(),
      };
    } catch (_) {
      return {};
    }
  }

  Future<Map<String, String>> _facilityNameMap() async {
    try {
      final cache = await ref.read(offlineDataCacheProvider.future);
      final all = <String, String>{};
      final keys = cache.getCacheKeys().where((k) => k.startsWith('facilities_'));
      for (final key in keys) {
        try {
          final list = cache.getCachedDataList(key) ?? const [];
          for (final f in list) {
            if (f['name_ar'] != null && f['id'] != null) {
              all[f['name_ar'].toString()] = f['id'].toString();
            }
          }
        } catch (_) {}
      }
      return all;
    } catch (_) {
      return {};
    }
  }

  // ─────────────────────────────────────────────────────────────────
  //  1) تحميل القالب
  // ─────────────────────────────────────────────────────────────────

  Future<void> _downloadTemplate(Map<String, dynamic> form) async {
    if (_exportingTemplate) return;
    setState(() => _exportingTemplate = true);
    try {
      final fields = await _buildFields(form);
      if (fields.isEmpty) {
        _snack('لا توجد حقول قابلة للاستيراد في هذا النموذج', Colors.orange);
        return;
      }
      final bytes = ExcelImportService.buildTemplateBytes(
        fields: fields,
        formTitle: (form['title_ar'] as String?) ?? '',
      );
      if (bytes == null) throw Exception('تعذّر توليد الملف');
      final dir = await getTemporaryDirectory();
      final title = ((form['title_ar'] as String?) ?? 'نموذج')
          .replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
      final file = File(
          '${dir.path}/قالب_${title}_${DateTime.now().millisecondsSinceEpoch}.xlsx');
      await file.writeAsBytes(bytes);
      await SharePlus.instance.share(ShareParams(
        files: [XFile(file.path)],
        text: 'قالب استيراد بيانات: ${form['title_ar'] ?? ''}',
      ));
    } catch (e) {
      _snack('فشل توليد القالب: $e', Colors.red);
    } finally {
      if (mounted) setState(() => _exportingTemplate = false);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  //  2) اختيار الملف وتحليله
  // ─────────────────────────────────────────────────────────────────

  Future<void> _pickAndParse(Map<String, dynamic> form) async {
    if (_parsing || _importing) return;
    setState(() => _parsing = true);
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['xlsx'],
        withData: false,
      );
      if (result == null || result.files.isEmpty) return;
      final path = result.files.single.path;
      if (path == null) {
        _snack('تعذّر الوصول إلى الملف', Colors.red);
        return;
      }
      final fields = await _buildFields(form);
      if (fields.isEmpty) {
        _snack('لا توجد حقول قابلة للاستيراد في هذا النموذج', Colors.orange);
        return;
      }
      final bytes = await File(path).readAsBytes();
      final parsed = ExcelImportService.parseWorkbookBytes(
        bytes: bytes,
        fields: fields,
        governorateNameToId: await _governorateNameMap(),
        districtNameToId: await _districtNameMap(),
        facilityNameToId: await _facilityNameMap(),
      );
      setState(() {
        _result = parsed;
        _selectedFormId = form['id']?.toString() ?? _selectedFormId;
      });
    } catch (e) {
      _snack('فشل تحليل الملف: $e', Colors.red);
    } finally {
      if (mounted) setState(() => _parsing = false);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  //  3) الاستيراد الفعلي — كل صف إرسالية في قائمة المزامنة
  // ─────────────────────────────────────────────────────────────────

  Future<void> _confirmAndImport(Map<String, dynamic> form) async {
    final result = _result;
    if (result == null || _importing) return;
    final validRows = result.rows.where((r) => r.isValid).toList();
    if (validRows.isEmpty) {
      _snack('لا توجد صفوف صالحة للاستيراد', Colors.orange);
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تأكيد الاستيراد',
            style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
        content: Text(
          'سيتم استيراد ${validRows.length} إرسالية إلى استمارة '
          '«${form['title_ar'] ?? ''}».\n\n'
          '• الإرساليات تُحفظ محلياً أولاً ثم تُرسل تلقائياً.\n'
          '• يعمل الاستيراد حتى بدون إنترنت وستُرسل عند توفر الاتصال.\n'
          '• لا يمكن التراجع بعد الاستيراد.',
          style: const TextStyle(fontFamily: 'Tajawal', fontSize: 13, height: 1.6),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('إلغاء', style: TextStyle(fontFamily: 'Tajawal')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('استيراد',
                style: TextStyle(fontFamily: 'Tajawal')),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() {
      _importing = true;
      _imported = 0;
      _importTotal = validRows.length;
    });

    int queued = 0;
    int failed = 0;
    try {
      final offline = await ref.read(offlineManagerProvider.future).timeout(
            const Duration(seconds: 10),
            onTimeout: () => throw Exception('التخزين المحلي غير جاهز'),
          );
      final campaign = ref.read(campaignProvider).value;
      final round = ref.read(campaignRoundProvider);
      final effectiveRound = campaign == 'integrated_activity' ? round : null;

      // نطاق المستخدم — المدير/المركزي يختار المحافظة، والبقية من حسابه
      final auth = ref.read(authStateProvider).valueOrNull;
      final String? govOverride;
      final String? distOverride;
      if (_userLevel >= 5) {
        govOverride = _selectedGovId;
        distOverride = null;
      } else if (_userLevel == 4) {
        govOverride = _selectedGovId ?? auth?.governorateId;
        distOverride = null;
      } else {
        govOverride = null; // الخادم يعتمد محافظة/مديرية الحساب
        distOverride = null;
      }

      for (final row in validRows) {
        try {
          await offline.addToSyncQueue({
            'form_id': form['id']?.toString() ?? '',
            'data': row.data,
            if (effectiveRound != null) 'campaign_round': effectiveRound,
            if (govOverride != null) 'governorate_id': govOverride,
            if (distOverride != null) 'district_id': distOverride,
          });
          queued++;
        } catch (_) {
          failed++;
        }
        if (mounted && (queued + failed) % 3 == 0) {
          setState(() => _imported = queued);
          await Future.delayed(Duration.zero);
        }
      }

      // مزامنة فورية إن كان متصلاً
      if (ConnectivityUtils.isOnline && queued > 0) {
        try {
          final syncService = await ref.read(syncServiceProvider.future).timeout(
                const Duration(seconds: 15),
                onTimeout: () => throw Exception('timeout'),
              );
          await syncService.sync().timeout(
                const Duration(seconds: 60),
                onTimeout: () => SyncCycleResult.empty(),
              );
        } catch (_) {}
      }

      // تحديث العدادات المحلية
      try {
        ref.invalidate(formStatsProvider);
      } catch (_) {}

      if (mounted) {
        _snack(
          failed == 0
              ? 'تم استيراد $queued إرسالية بنجاح ✅'
              : 'تم استيراد $queued وفشل $failed',
          failed == 0 ? Colors.green : Colors.orange,
        );
      }
      widget.onImported(queued);
      if (mounted) setState(() => _result = null);
    } catch (e) {
      _snack('فشل الاستيراد: $e', Colors.red);
    } finally {
      if (mounted) {
        setState(() {
          _importing = false;
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  //  دليل الحقول (Bottom Sheet)
  // ─────────────────────────────────────────────────────────────────

  Future<void> _showFieldGuide(List<ExcelImportField> fields, String formTitle) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(ctx).size.height * 0.8,
        ),
        decoration: BoxDecoration(
          color: Theme.of(ctx).colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 14),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                'دليل حقول الاستيراد — $formTitle',
                style: const TextStyle(
                    fontFamily: 'Cairo', fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 8),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                itemCount: fields.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (ctx, i) {
                  final f = fields[i];
                  return ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      '${f.label}${f.required ? ' *' : ''}',
                      style: const TextStyle(
                          fontFamily: 'Tajawal', fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                    subtitle: Text(
                      'النوع: ${_typeLabel(f.type)}'
                      '${f.options.isNotEmpty ? ' — الخيارات: ${f.options.join('، ')}' : ''}',
                      style: const TextStyle(fontFamily: 'Tajawal', fontSize: 11.5),
                    ),
                    trailing: f.required
                        ? const Icon(Icons.star_rounded, color: Colors.red, size: 16)
                        : null,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  static String _typeLabel(String type) {
    switch (type) {
      case 'text':
        return 'نص';
      case 'textarea':
        return 'نص طويل';
      case 'number':
        return 'رقم';
      case 'yesno':
        return 'نعم/لا';
      case 'select':
        return 'اختيار من قائمة';
      case 'multiselect':
        return 'اختيار متعدد';
      case 'date':
        return 'تاريخ';
      case 'datetime':
        return 'تاريخ ووقت';
      case 'governorate':
        return 'محافظة';
      case 'district':
        return 'مديرية';
      case 'health_facility':
        return 'مرفق صحي';
      default:
        return type;
    }
  }

  void _snack(String msg, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(fontFamily: 'Tajawal')),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────
  //  الواجهة
  // ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final formsAsync = ref.watch(formsProvider);

    return formsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off_rounded, size: 56, color: Colors.grey),
              const SizedBox(height: 12),
              Text(
                'لا توجد نماذج مخزنة بعد.\nاتصل بالإنترنت مرة واحدة لتحميلها.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontFamily: 'Tajawal', fontSize: 13),
              ),
            ],
          ),
        ),
      ),
      data: (allForms) {
        final forms = _allowedForms(allForms)
            .where((f) => f['schema'] != null)
            .toList();
        if (forms.isEmpty) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'لا توجد نماذج مسموحة لدورك الحالي لاستيراد بياناتها.',
                textAlign: TextAlign.center,
                style: TextStyle(fontFamily: 'Tajawal', fontSize: 13),
              ),
            ),
          );
        }

        // تأكد من صلاحية النموذج المحدد
        final validIds = forms.map((f) => f['id']?.toString()).toSet();
        if (_selectedFormId == null || !validIds.contains(_selectedFormId)) {
          _selectedFormId = forms.first['id']?.toString();
        }
        final form = forms.firstWhere(
          (f) => f['id']?.toString() == _selectedFormId,
          orElse: () => forms.first,
        );
        final formTitle = (form['title_ar'] as String?) ?? 'نموذج';

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _sectionCard(
              title: 'اختيار الاستمارة',
              icon: Icons.description_rounded,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedFormId,
                      isExpanded: true,
                      style: const TextStyle(
                          fontFamily: 'Tajawal', fontSize: 14, color: Colors.black87),
                      items: forms.map<DropdownMenuItem<String>>((f) {
                        return DropdownMenuItem<String>(
                          value: f['id']?.toString(),
                          child: Text(f['title_ar']?.toString() ?? 'بدون عنوان'),
                        );
                      }).toList(),
                      onChanged: (v) {
                        if (v == null) return;
                        setState(() {
                          _selectedFormId = v;
                          _result = null; // تغيير النموذج يلغي نتائج التحليل السابقة
                        });
                      },
                    ),
                  ),
                ],
              ),
            ),

            if (_canChooseGovernorate) ...[
              const SizedBox(height: 12),
              _governorateScopeCard(),
            ],

            const SizedBox(height: 12),
            _sectionCard(
              title: 'خطوات الاستيراد',
              icon: Icons.checklist_rounded,
              child: Column(
                children: [
                  _stepRow(1, 'حمّل قالب Excel الخاص بالاستمارة'),
                  _stepRow(2, 'عبّئ الصفوف — كل صف إرسالية واحدة (راجع ورقة «الدليل» في القالب)'),
                  _stepRow(3, 'اختر الملف المعبأ وراجع النتائج ثم استورد'),
                ],
              ),
            ),

            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _ActionCard(
                    icon: Icons.download_rounded,
                    label: 'تحميل القالب',
                    color: AppTheme.primaryColor,
                    busy: _exportingTemplate,
                    onTap: () => _downloadTemplate(form),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ActionCard(
                    icon: Icons.upload_file_rounded,
                    label: 'اختيار ملف الاستيراد',
                    color: Colors.blueAccent,
                    busy: _parsing,
                    onTap: () => _pickAndParse(form),
                  ),
                ),
              ],
            ),

            if (_result != null) ...[
              const SizedBox(height: 12),
              _buildResultCard(form, formTitle),
            ],

            const SizedBox(height: 12),
            Center(
              child: TextButton.icon(
                onPressed: () async {
                  final fields = await _buildFields(form);
                  if (context.mounted) _showFieldGuide(fields, formTitle);
                },
                icon: const Icon(Icons.menu_book_rounded, size: 18),
                label: const Text('دليل الحقول وتنسيقاتها',
                    style: TextStyle(fontFamily: 'Tajawal', fontSize: 13)),
              ),
            ),
            const SizedBox(height: 80),
          ],
        );
      },
    );
  }

  // ── بطاقة نطاق المحافظة (المدير/المركزي) ──
  Widget _governorateScopeCard() {
    final auth = ref.watch(authStateProvider.select((v) => v.valueOrNull));
    final govsAsync = ref.watch(governoratesProvider);

    // المركزي: المحافظات المعينة له فقط؛ المدير: الكل
    List<Map<String, dynamic>> govs = const [];
    if (_userLevel >= 5) {
      govs = govsAsync.valueOrNull ?? const [];
    } else {
      final assigned = auth?.assignedGovernorates ?? const [];
      govs = (govsAsync.valueOrNull ?? const [])
          .where((g) => assigned.contains(g['id']?.toString()))
          .toList();
    }

    // ضبط الاختيار الافتراضي
    if (_selectedGovId != null &&
        !govs.any((g) => g['id']?.toString() == _selectedGovId)) {
      _selectedGovId = null;
    }
    if (_selectedGovId == null && govs.length == 1) {
      _selectedGovId = govs.first['id']?.toString();
    }

    return _sectionCard(
      title: 'نطاق البيانات المستوردة',
      icon: Icons.public_rounded,
      child: govs.isEmpty
          ? const Text(
              'لا توجد محافظات مخزنة بعد — اتصل بالإنترنت مرة واحدة ثم أعد المحاولة.',
              style: TextStyle(fontFamily: 'Tajawal', fontSize: 12),
            )
          : DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedGovId,
                hint: const Text('اختر المحافظة المستهدفة (اختياري)',
                    style: TextStyle(fontFamily: 'Tajawal', fontSize: 13)),
                isExpanded: true,
                items: govs.map<DropdownMenuItem<String>>((g) {
                  return DropdownMenuItem<String>(
                    value: g['id']?.toString(),
                    child: Text(g['name_ar']?.toString() ?? '',
                        style: const TextStyle(fontFamily: 'Tajawal', fontSize: 13)),
                  );
                }).toList(),
                onChanged: (v) => setState(() => _selectedGovId = v),
              ),
            ),
    );
  }

  // ── بطاقة نتائج التحليل ──
  Widget _buildResultCard(Map<String, dynamic> form, String formTitle) {
    final result = _result!;
    if (result.fatalError != null) {
      return _sectionCard(
        title: 'نتيجة التحليل',
        icon: Icons.error_outline_rounded,
        accentColor: Colors.red,
        child: Text(result.fatalError!,
            style: const TextStyle(fontFamily: 'Tajawal', fontSize: 13)),
      );
    }

    final validRows = result.rows.where((r) => r.isValid).toList();
    final invalidRows = result.rows.where((r) => !r.isValid).toList();

    return _sectionCard(
      title: 'نتيجة التحليل — $formTitle',
      icon: Icons.fact_check_rounded,
      accentColor: validRows.isEmpty ? Colors.orange : Colors.green,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ملخص
          Row(
            children: [
              _countChip('${result.validCount}', 'صالحة', Colors.green),
              const SizedBox(width: 8),
              _countChip('${result.invalidCount}', 'أخطاء', Colors.red),
              const SizedBox(width: 8),
              _countChip('${result.rows.length}', 'الإجمالي', Colors.blueGrey),
            ],
          ),

          if (result.exampleRowSkipped) ...[
            const SizedBox(height: 8),
            _warningBox(
              'تم تجاهل صف المثال تلقائياً — احذفه من الملف عند التعبئة الفعلية.',
              Colors.blueGrey,
            ),
          ],

          if (result.missingRequiredHeaders.isNotEmpty) ...[
            const SizedBox(height: 10),
            _warningBox(
              'أعمدة مطلوبة غير موجودة في الملف: '
              '${result.missingRequiredHeaders.join('، ')}',
              Colors.red,
            ),
          ],
          if (result.unmappedHeaders.isNotEmpty) ...[
            const SizedBox(height: 8),
            _warningBox(
              'أعمدة غير معروفة (سيتم تجاهلها): '
              '${result.unmappedHeaders.take(8).join('، ')}'
              '${result.unmappedHeaders.length > 8 ? ' …' : ''}',
              Colors.orange,
            ),
          ],

          // معاينة الصفوف
          if (result.rows.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Text('معاينة أول 10 صفوف:',
                style: TextStyle(
                    fontFamily: 'Tajawal', fontWeight: FontWeight.w700, fontSize: 13)),
            const SizedBox(height: 6),
            ...result.rows.take(10).map((row) => _previewRowTile(row)),
            if (result.rows.length > 10)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  '… و${result.rows.length - 10} صف آخر',
                  style: const TextStyle(
                      fontFamily: 'Tajawal', fontSize: 11, color: Colors.grey),
                ),
              ),
          ],

          // زر الاستيراد
          if (validRows.isNotEmpty) ...[
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _importing ? null : () => _confirmAndImport(form),
                icon: _importing
                    ? const SizedBox(
                        width: 18, height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.import_export_rounded),
                label: Text(
                  _importing
                      ? 'جاري الاستيراد… ${_imported}/${_importTotal}'
                      : 'استيراد ${validRows.length} إرسالية',
                  style: const TextStyle(fontFamily: 'Tajawal'),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _previewRowTile(ExcelImportRow row) {
    final ok = row.isValid;
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: ok ? Colors.green.withValues(alpha: 0.06) : Colors.red.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: ok ? Colors.green.withValues(alpha: 0.3) : Colors.red.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(ok ? Icons.check_circle_rounded : Icons.error_rounded,
              size: 16, color: ok ? Colors.green : Colors.red),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('صف ${row.rowNumber}${ok ? ' — صالح' : ''}',
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: ok ? Colors.green.shade700 : Colors.red.shade700)),
                if (!ok)
                  ...row.errors.take(3).map((e) => Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          '• $e',
                          style: const TextStyle(
                              fontFamily: 'Tajawal', fontSize: 11, color: Colors.red),
                        ),
                      )),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── مكونات مساعدة ──

  Widget _sectionCard({
    required String title,
    required IconData icon,
    required Widget child,
    Color? accentColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: accentColor ?? AppTheme.primaryColor),
              const SizedBox(width: 8),
              Text(title,
                  style: const TextStyle(
                      fontFamily: 'Cairo', fontWeight: FontWeight.w700, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
  }

  Widget _stepRow(int n, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 10,
            backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.12),
            child: Text('$n',
                style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primaryColor)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text,
                style: const TextStyle(fontFamily: 'Tajawal', fontSize: 12.5, height: 1.5)),
          ),
        ],
      ),
    );
  }

  Widget _countChip(String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(value,
              style: TextStyle(
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  color: color)),
          const SizedBox(width: 4),
          Text(label,
              style: TextStyle(fontFamily: 'Tajawal', fontSize: 11, color: color)),
        ],
      ),
    );
  }

  Widget _warningBox(String text, Color color) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(text,
          style: TextStyle(fontFamily: 'Tajawal', fontSize: 11.5, color: color)),
    );
  }
}

// ── بطاقة زر إجراء ──
class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool busy;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
    this.busy = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: busy ? null : onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          child: Column(
            children: [
              busy
                  ? SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2, color: color))
                  : Icon(icon, color: color, size: 26),
              const SizedBox(height: 8),
              Text(label,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      color: color)),
            ],
          ),
        ),
      ),
    );
  }
}
