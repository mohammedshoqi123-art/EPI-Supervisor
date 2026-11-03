// ═══════════════════════════════════════════════════════════════════════════
//  DATA EXPORT TAB — تبويب «البيانات» في صفحة التحليلات
// ═══════════════════════════════════════════════════════════════════════════
//
//  تصدير مباشر (بدون معاينة) لجميع بيانات النماذج بجميع حقولها إلى ملف
//  Excel (.xlsx) وفق صلاحيات المستخدم:
//    • النماذج: فقط الاستمارات المسموح بدوره (allowed_roles + is_active)
//    • الحقول: فقط الحقول الظاهرة لدوره (visible_roles / hidden_roles)
//    • النطاق: الصفوف تأتي من الخادم مقيّدةً بالدور أصلاً (fetch_submissions)؛
//      المدير يختار أي محافظة، والمركزي ضمن المعيّن له، وما دون ذلك نطاقه.
//
//  التدفق المطلوب من المستخدم: اختر الاستمارة ← اضغط «تصدير Excel» ←
//  يُجلب ويُولَّد ويُشارك مباشرة. لا معاينة تُحمّل البيانات عند فتح التبويب.
//
//  الموثوقية:
//    • الجلب أونلاين عبر getSubmissions (RPC) — مهلة 90 ثانية.
//    • عند فشل الشبكة: fallback تلقائي إلى الكاش المحلي (نفس مفتاح
//      submissionsProvider) أو أي كاش submissions_* مطابق للنموذج.
//    • كل خطأ يظهر كرسالة واضحة مع بقاء زر التصدير جاهزاً لإعادة المحاولة.
// ═══════════════════════════════════════════════════════════════════════════

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import 'package:epi_core/epi_core.dart';

import '../providers/app_providers.dart';

class DataExportTab extends ConsumerStatefulWidget {
  const DataExportTab({super.key});

  @override
  ConsumerState<DataExportTab> createState() => _DataExportTabState();
}

class _DataExportTabState extends ConsumerState<DataExportTab> {
  String? _selectedFormId;
  String? _selectedGovId; // للمدير/المركزي فقط
  bool _exporting = false;
  String? _lastError;

  // ─────────────────────────────────────────────────────────────────
  //  الصلاحيات
  // ─────────────────────────────────────────────────────────────────

  int get _userLevel =>
      ref.read(authStateProvider).valueOrNull?.role?.hierarchyLevel ?? 0;

  /// المدير (5) والمركزي (4) فقط يمكنهما اختيار نطاق المحافظات.
  bool get _canChooseGovernorate => _userLevel >= 4;

  bool get _isAdmin => _userLevel >= 5;

  String? get _userRoleName =>
      ref.read(authStateProvider).valueOrNull?.role?.dbValue;

  String? get _userGovernorateId =>
      ref.read(authStateProvider).valueOrNull?.governorateId;

  List<String> get _assignedGovernorateIds =>
      ref.read(authStateProvider).valueOrNull?.assignedGovernorates ?? const [];

  /// الجولة تُمرر فقط للنشاط التكاملي (نفس منطق _effectiveRound).
  int? get _effectiveRound {
    final campaign = ref.read(campaignProvider).value;
    final round = ref.read(campaignRoundProvider);
    return campaign == 'integrated_activity' ? round : null;
  }

  /// محافظة الفلتر: اختيار المدير/المركزي، أو محافظة المستخدم تلقائياً.
  String? get _scopeGovernorateId {
    if (_canChooseGovernorate) return _selectedGovId;
    return _userGovernorateId;
  }

  // ─────────────────────────────────────────────────────────────────
  //  خرائط المراجع (ID → الاسم العربي) من الكاش أو الشبكة
  // ─────────────────────────────────────────────────────────────────

  Future<Map<String, String>> _governorateIdToName() async {
    try {
      final govs = await ref.read(governoratesProvider.future).timeout(
            const Duration(seconds: 10),
            onTimeout: () => [],
          );
      return {
        for (final g in govs)
          if (g['id'] != null && g['name_ar'] != null)
            g['id'].toString(): g['name_ar'].toString(),
      };
    } catch (_) {
      return {};
    }
  }

  Future<Map<String, String>> _districtIdToName() async {
    try {
      final dists = await ref.read(districtsProvider(null).future).timeout(
            const Duration(seconds: 10),
            onTimeout: () => [],
          );
      return {
        for (final d in dists)
          if (d['id'] != null && d['name_ar'] != null)
            d['id'].toString(): d['name_ar'].toString(),
      };
    } catch (_) {
      return {};
    }
  }

  Future<Map<String, String>> _facilityIdToName() async {
    try {
      final cache = await ref.read(offlineDataCacheProvider.future);
      final all = <String, String>{};
      final keys =
          cache.getCacheKeys().where((k) => k.startsWith('facilities_'));
      for (final key in keys) {
        try {
          final list = cache.getCachedDataList(key) ?? const [];
          for (final f in list) {
            if (f['id'] != null && f['name_ar'] != null) {
              all[f['id'].toString()] = f['name_ar'].toString();
            }
          }
        } catch (_) {}
      }
      return all;
    } catch (_) {
      return {};
    }
  }

  /// حقول التصدير (مفلترة بالدور) مُثراة بخريطة ID → اسم للمراجع.
  Future<List<ExcelExportField>> _enrichedFields(
      Map<String, dynamic> form) async {
    final schemaRaw = form['schema'];
    final schema = schemaRaw is Map
        ? Map<String, dynamic>.from(schemaRaw)
        : <String, dynamic>{};
    final base = ExcelExportService.exportableFields(
      schema: schema,
      userRole: _userRoleName,
    );

    final govMap = await _governorateIdToName();
    final distMap = await _districtIdToName();
    final facMap = await _facilityIdToName();

    return base.map((f) {
      if (f.type == 'governorate') return _copyField(f, govMap);
      if (f.type == 'district') return _copyField(f, distMap);
      if (f.type == 'health_facility') return _copyField(f, facMap);
      return f;
    }).toList();
  }

  ExcelExportField _copyField(
      ExcelExportField f, Map<String, String> refNames) {
    return ExcelExportField(
      key: f.key,
      label: f.label,
      type: f.type,
      options: f.options,
      sectionTitle: f.sectionTitle,
      required: f.required,
      showIf: f.showIf,
      referenceNamesById: refNames,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  //  جلب الإرساليات — أونلاين أولاً ثم الكاش المحلي
  // ─────────────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> _fetchSubmissions(
      Map<String, dynamic> form) async {
    final formId = form['id']?.toString();
    List<Map<String, dynamic>> subs = [];
    bool networkFailed = false;

    // 1) أونلاين — نفس مسار التقارير (RPC fetch_submissions، الصلاحيات من الخادم)
    try {
      subs = await ref
          .read(databaseServiceProvider)
          .getSubmissions(
            formId: formId,
            governorateId: _scopeGovernorateId,
            campaignRound: _effectiveRound,
            limit: 10000,
            lean: false,
          )
          .timeout(const Duration(seconds: 90));
    } catch (_) {
      networkFailed = true;
    }

    if (subs.isNotEmpty) return subs;

    // 2) أوفلاين — الكاش المحلي بنفس مفتاح submissionsProvider
    try {
      final cache = await ref.read(offlineDataCacheProvider.future);
      final filter = SubmissionsFilter(
        formId: formId,
        governorateId: _scopeGovernorateId,
        campaignRound: _effectiveRound,
        lean: false,
        limit: 10000,
      );
      final cached = cache.getCachedDataList(filter.cacheKey);
      if (cached != null && cached.isNotEmpty) return cached;

      // 3) آخر fallback: أي كاش submissions_* يحتوي صفوف هذا النموذج
      final any = cache.findCachedListByPrefix('submissions_');
      if (any != null && any.isNotEmpty) {
        final rows = any
            .where((s) =>
                formId == null || s['form_id']?.toString() == formId)
            .toList();
        if (rows.isNotEmpty) return rows;
      }
    } catch (_) {}

    if (networkFailed) {
      throw Exception('تعذّر جلب البيانات من الشبكة ولا يوجد نسخة محلية مخزنة');
    }
    return const [];
  }

  // ─────────────────────────────────────────────────────────────────
  //  التصدير المباشر — بضغطة واحدة
  // ─────────────────────────────────────────────────────────────────

  Future<void> _exportExcel(Map<String, dynamic> form) async {
    if (_exporting) return;
    setState(() {
      _exporting = true;
      _lastError = null;
    });
    try {
      final fields = await _enrichedFields(form);
      if (fields.isEmpty) {
        _snack('لا توجد حقول قابلة للتصدير في هذا النموذج', Colors.orange);
        return;
      }

      final submissions = await _fetchSubmissions(form);
      if (submissions.isEmpty) {
        _snack('لا توجد إرساليات لهذه الاستمارة في نطاق صلاحياتك',
            Colors.orange);
        return;
      }

      final result = ExcelExportService.buildExportBytes(
        fields: fields,
        submissions: submissions,
      );
      if (!result.isSuccess || result.bytes == null) {
        setState(() => _lastError = result.error ?? 'تعذّر توليد الملف');
        _snack(result.error ?? 'تعذّر توليد الملف', Colors.red);
        return;
      }

      final dir = await getTemporaryDirectory();
      final title = ((form['title_ar'] as String?) ?? 'نموذج')
          .replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
      final stamp = DateTime.now();
      final two = (int n) => n.toString().padLeft(2, '0');
      final file = File(
          '${dir.path}/بيانات_${title}_${stamp.year}-${two(stamp.month)}-${two(stamp.day)}.xlsx');
      await file.writeAsBytes(result.bytes!);
      await SharePlus.instance.share(ShareParams(
        files: [XFile(file.path)],
        text: 'تصدير بيانات: ${form['title_ar'] ?? ''} '
            '(${result.rowCount} إرسالية)',
      ));
    } catch (e) {
      final msg = e.toString().replaceFirst('Exception: ', '');
      setState(() => _lastError = msg);
      _snack('فشل التصدير: $msg', Colors.red);
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  void _snack(String message, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content:
          Text(message, style: const TextStyle(fontFamily: 'Tajawal')),
      backgroundColor: color,
    ));
  }

  // ─────────────────────────────────────────────────────────────────
  //  الواجهة — بلا معاينة: اختيار + زر مباشر
  // ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final formsAsync = ref.watch(formsProvider);

    return formsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorRetry(
        message: 'تعذّر تحميل النماذج — تحقق من الاتصال وأعد المحاولة',
        onRetry: () => ref.invalidate(formsProvider),
      ),
      data: (forms) {
        if (forms.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.folder_off_rounded,
                      size: 56, color: Colors.grey[400]),
                  const SizedBox(height: 12),
                  Text(
                    'لا توجد نماذج متاحة',
                    style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
          );
        }

        final selectedForm = _formById(forms, _selectedFormId) ?? forms.first;
        _selectedFormId = selectedForm['id']?.toString();
        final color = _campaignColors[selectedForm['campaign_type']] ??
            const Color(0xFF607D8B);

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _FormSelector(
              forms: forms,
              selectedId: _selectedFormId,
              onChanged: (id) => setState(() {
                _selectedFormId = id;
                _lastError = null;
              }),
            ),
            const SizedBox(height: 12),
            _ScopeSelector(
              canChoose: _canChooseGovernorate,
              isAdmin: _isAdmin,
              assignedIds: _assignedGovernorateIds,
              selectedGovId: _selectedGovId,
              onGovernorateChanged: (id) =>
                  setState(() => _selectedGovId = id),
            ),
            const SizedBox(height: 12),

            // ── بطاقة التصدير المباشر ──
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(Icons.ios_share_rounded,
                          color: color, size: 22),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text('تصدير Excel مباشر',
                          style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: Colors.grey.shade800)),
                    ),
                  ]),
                  const SizedBox(height: 8),
                  Text(
                    'اضغط الزر ليتم جلب جميع إرساليات «${selectedForm['title_ar'] ?? ''}» '
                    'المسموحة بصلاحياتك، وتوليد ملف Excel بجميع حقولها ومشاركته فوراً.',
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 11.5,
                        height: 1.5,
                        color: Colors.grey.shade600),
                  ),
                  if (_lastError != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(children: [
                        const Icon(Icons.error_outline_rounded,
                            size: 18, color: Colors.red),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(_lastError!,
                              style: const TextStyle(
                                  fontFamily: 'Tajawal',
                                  fontSize: 11.5,
                                  color: Colors.red)),
                        ),
                      ]),
                    ),
                  ],
                  const SizedBox(height: 14),
                  FilledButton.icon(
                    onPressed: _exporting
                        ? null
                        : () => _exportExcel(selectedForm),
                    style: FilledButton.styleFrom(
                      backgroundColor: color,
                      disabledBackgroundColor: color.withValues(alpha: 0.5),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: _exporting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.download_rounded, size: 20),
                    label: Text(
                      _exporting ? 'جاري التصدير...' : 'تصدير Excel',
                      style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 14,
                          fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _PermissionsInfoCard(
              userLevel: _userLevel,
              roleLabel: _roleLabelAr(_userRoleName),
            ),
          ],
        );
      },
    );
  }

  Map<String, dynamic>? _formById(
      List<Map<String, dynamic>> forms, String? id) {
    if (id == null) return null;
    for (final f in forms) {
      if (f['id']?.toString() == id) return f;
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Widgets مساعدة
// ═══════════════════════════════════════════════════════════════════════════

const _campaignColors = {
  'polio_campaign': Color(0xFF1E88E5),
  'integrated_activity': Color(0xFF43A047),
  'measles_campaign': Color(0xFFE53935),
};

const _campaignLabels = {
  'polio_campaign': 'شلل الأطفال',
  'integrated_activity': 'إيصالي تكاملي',
  'measles_campaign': 'حملة الحصبة',
};

String _roleLabelAr(String? role) {
  switch (role) {
    case 'admin':
      return 'مدير النظام';
    case 'central':
      return 'مستوى مركزي';
    case 'governorate':
      return 'منسق محافظة';
    case 'district':
      return 'منسق مديرية';
    case 'data_entry':
      return 'مُدخل بيانات';
    default:
      return role ?? '—';
  }
}

/// اختيار الاستمارة — قائمة منسدلة بألوان الحملة.
class _FormSelector extends StatelessWidget {
  final List<Map<String, dynamic>> forms;
  final String? selectedId;
  final void Function(String?) onChanged;

  const _FormSelector({
    required this.forms,
    required this.selectedId,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final value = forms.any((f) => f['id']?.toString() == selectedId)
        ? selectedId
        : forms.first['id']?.toString();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: DropdownButtonFormField<String>(
        value: value,
        isExpanded: true,
        decoration: const InputDecoration(
          labelText: 'اختر الاستمارة',
          labelStyle: TextStyle(fontFamily: 'Tajawal', fontSize: 12),
          border: InputBorder.none,
          icon: Icon(Icons.description_rounded, size: 20),
        ),
        style: const TextStyle(
            fontFamily: 'Cairo', fontSize: 13, color: Colors.black87),
        items: [
          for (final f in forms)
            DropdownMenuItem(
              value: f['id']?.toString(),
              child: Text(
                '${f['title_ar'] ?? 'استمارة'} '
                '(${_campaignLabels[f['campaign_type']] ?? 'أخرى'})',
                overflow: TextOverflow.ellipsis,
              ),
            ),
        ],
        onChanged: onChanged,
      ),
    );
  }
}

/// نطاق المحافظات — المدير أي محافظة، والمركزي ضمن المعيّنة له.
class _ScopeSelector extends ConsumerWidget {
  final bool canChoose;
  final bool isAdmin;
  final List<String> assignedIds;
  final String? selectedGovId;
  final void Function(String?) onGovernorateChanged;

  const _ScopeSelector({
    required this.canChoose,
    required this.isAdmin,
    required this.assignedIds,
    required this.selectedGovId,
    required this.onGovernorateChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!canChoose) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFF5F7FA),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Row(children: [
          Icon(Icons.lock_outline_rounded,
              size: 18, color: Colors.grey.shade600),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'نطاق البيانات: نطاقك الخاص حسب صلاحياتك (يفرضه الخادم)',
              style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 12,
                  color: Colors.grey.shade700),
            ),
          ),
        ]),
      );
    }

    return FutureBuilder<List<Map<String, dynamic>>>(
      future: ref.read(governoratesProvider.future).timeout(
            const Duration(seconds: 10),
            onTimeout: () => [],
          ),
      builder: (context, snap) {
        var govs = snap.data ?? const <Map<String, dynamic>>[];
        if (!isAdmin && assignedIds.isNotEmpty) {
          govs = govs
              .where((g) => assignedIds.contains(g['id']?.toString()))
              .toList();
        }
        final allowedValues = <String>{
          '',
          for (final g in govs) g['id'].toString()
        };
        final currentValue =
            (selectedGovId != null && allowedValues.contains(selectedGovId))
                ? selectedGovId
                : '';

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: DropdownButtonFormField<String>(
            value: currentValue,
            isExpanded: true,
            decoration: InputDecoration(
              labelText: isAdmin
                  ? 'نطاق المحافظات (الكل أو محافظة محددة)'
                  : 'نطاق المحافظات (المعيّنة لك)',
              labelStyle: const TextStyle(fontFamily: 'Tajawal', fontSize: 12),
              border: InputBorder.none,
              icon: const Icon(Icons.public_rounded, size: 20),
            ),
            style: const TextStyle(
                fontFamily: 'Cairo', fontSize: 13, color: Colors.black87),
            items: [
              const DropdownMenuItem(
                value: '',
                child: Text('الكل', overflow: TextOverflow.ellipsis),
              ),
              for (final g in govs)
                DropdownMenuItem(
                  value: g['id']?.toString(),
                  child: Text('${g['name_ar'] ?? ''}',
                      overflow: TextOverflow.ellipsis),
                ),
            ],
            onChanged: (v) => onGovernorateChanged(v == '' ? null : v),
          ),
        );
      },
    );
  }
}

/// بطاقة شرح الصلاحيات المطبقة.
class _PermissionsInfoCard extends StatelessWidget {
  final int userLevel;
  final String roleLabel;

  const _PermissionsInfoCard(
      {required this.userLevel, required this.roleLabel});

  @override
  Widget build(BuildContext context) {
    final scopeText = switch (userLevel) {
      >= 5 => 'تصدير جميع المحافظات — كل النماذج وكل الحقول',
      4 => 'المحافظات المعيّنة لك فقط، وكل الحقول الظاهرة لدورك',
      3 => 'محافظتك فقط، وكل الحقول الظاهرة لدورك',
      2 => 'مديريتك فقط، وكل الحقول الظاهرة لدورك',
      _ => 'إرسالياتك فقط، وكل الحقول الظاهرة لدورك',
    };
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F5F1),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Icon(Icons.verified_user_rounded,
            size: 20, color: Color(0xFF00897B)),
        const SizedBox(width: 10),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('صلاحيات التصدير — $roleLabel',
                style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 12.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF00695C))),
            const SizedBox(height: 3),
            Text(
              scopeText,
              style: const TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 11.5,
                  height: 1.5,
                  color: Color(0xFF00695C)),
            ),
            const SizedBox(height: 3),
            const Text(
              'أعمدة الملف: المحافظة، المديرية، المُرسِل، الحالة، التاريخ، '
              'الإحداثيات، عدد الصور، الملاحظات، ثم حقول الاستمارة كاملة.',
              style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 11,
                  height: 1.5,
                  color: Color(0xFF4B6B65)),
            ),
          ]),
        ),
      ]),
    );
  }
}

class _ErrorRetry extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorRetry({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 52, color: Colors.grey[400]),
            const SizedBox(height: 12),
            Text(message,
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 13,
                    color: Colors.grey.shade600)),
            const SizedBox(height: 14),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('إعادة المحاولة',
                  style: TextStyle(fontFamily: 'Tajawal')),
            ),
          ],
        ),
      ),
    );
  }
}
