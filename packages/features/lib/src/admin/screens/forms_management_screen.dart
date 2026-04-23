import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart' hide TextDirection;
import 'package:epi_shared/epi_shared.dart';

// ══════════════════════════════════════════════════════════════════════════════
// إدارة النماذج — Forms Management Screen (Admin)
// قائمة النماذج + إنشاء/تعديل شامل (حقول + إعدادات) + حذف
// ══════════════════════════════════════════════════════════════════════════════

final formsListProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final client = Supabase.instance.client;
  try {
    final response = await client
        .from('forms')
        .select('*')
        .isFilter('deleted_at', null)
        .order('created_at', ascending: false);
    return (response as List<dynamic>).cast<Map<String, dynamic>>();
  } catch (_) {
    return [];
  }
});

final formsStatsProvider = FutureProvider<Map<String, Map<String, int>>>((
  ref,
) async {
  final client = Supabase.instance.client;
  try {
    final forms =
        await client.from('forms').select('id').isFilter('deleted_at', null);
    final formIds =
        (forms as List<dynamic>).map((f) => f['id'] as String).toList();

    final Map<String, Map<String, int>> stats = {};
    for (final fid in formIds) {
      final subs = await client
          .from('form_submissions')
          .select('id, status')
          .eq('form_id', fid);

      final subList = subs as List<dynamic>;
      final counts = <String, int>{'total': subList.length};
      for (final s in subList) {
        final st = s['status'] ?? 'draft';
        counts[st] = (counts[st] ?? 0) + 1;
      }
      stats[fid] = counts;
    }
    return stats;
  } catch (_) {
    return {};
  }
});

class FormsManagementScreen extends ConsumerStatefulWidget {
  const FormsManagementScreen({super.key});

  @override
  ConsumerState<FormsManagementScreen> createState() =>
      _FormsManagementScreenState();
}

class _FormsManagementScreenState extends ConsumerState<FormsManagementScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 900;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: AppTheme.backgroundLight,
        appBar: AppBar(
          backgroundColor: AppTheme.primaryColor,
          title: const Text(
            'إدارة النماذج',
            style: TextStyle(fontFamily: 'Cairo'),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.add_circle_outline),
              onPressed: () => _openFormEditor(),
              tooltip: 'إنشاء نموذج',
            ),
          ],
        ),
        body: Column(
          children: [
            // Search
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: TextField(
                onChanged: (v) => setState(() => _searchQuery = v),
                textDirection: TextDirection.rtl,
                decoration: InputDecoration(
                  hintText: 'بحث في النماذج...',
                  prefixIcon: const Icon(
                    Icons.search,
                    color: AppTheme.textSecondary,
                  ),
                  filled: true,
                  fillColor: AppTheme.backgroundLight,
                  border: OutlineInputBorder(
                    borderRadius: AppTheme.radiusMedium,
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
              ),
            ),
            Expanded(child: _buildFormsList(isWide)),
          ],
        ),
      ),
    );
  }

  Widget _buildFormsList(bool isWide) {
    return Consumer(
      builder: (context, ref, _) {
        final formsAsync = ref.watch(formsListProvider);
        final statsAsync = ref.watch(formsStatsProvider);

        return formsAsync.when(
          loading: () => ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: 5,
            itemBuilder: (_, __) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Container(
                height: 100,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: AppTheme.radiusMedium,
                ),
              ),
            ),
          ),
          error: (err, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 48,
                  color: AppTheme.errorColor,
                ),
                const SizedBox(height: 16),
                const Text(
                  'فشل تحميل النماذج',
                  style: TextStyle(fontFamily: 'Tajawal'),
                ),
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  onPressed: () => ref.invalidate(formsListProvider),
                  icon: const Icon(Icons.refresh),
                  label: const Text('إعادة المحاولة'),
                ),
              ],
            ),
          ),
          data: (forms) {
            final filtered = _searchQuery.isEmpty
                ? forms
                : forms.where((f) {
                    final name = (f['title_ar'] ?? f['title_en'] ?? '')
                        .toString()
                        .toLowerCase();
                    return name.contains(_searchQuery.toLowerCase());
                  }).toList();

            if (filtered.isEmpty) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.description_outlined,
                      size: 64,
                      color: AppTheme.textHint,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _searchQuery.isEmpty
                          ? 'لا توجد نماذج بعد'
                          : 'لا توجد نتائج',
                      style: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 16,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () => _openFormEditor(),
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text(
                        'إنشاء نموذج جديد',
                        style: TextStyle(fontFamily: 'Tajawal'),
                      ),
                    ),
                  ],
                ),
              );
            }

            final stats = statsAsync.valueOrNull ?? {};

            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: Row(
                    children: [
                      Text(
                        '${filtered.length} نموذج',
                        style: AppTheme.bodyM.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const Spacer(),
                      TextButton.icon(
                        onPressed: () => _openFormEditor(),
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text(
                          'نموذج جديد',
                          style: TextStyle(fontFamily: 'Tajawal'),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final form = filtered[index];
                      final formStats = stats[form['id']] ?? {'total': 0};
                      final isActive = form['is_active'] ?? true;
                      final schema =
                          form['schema'] as Map<String, dynamic>? ?? {};
                      final schemaFields =
                          (schema['fields'] as List<dynamic>?)?.length ?? 0;
                      final sections =
                          (schema['sections'] as List<dynamic>?)?.length ?? 0;
                      final totalFields = sections > 0
                          ? (schema['sections'] as List).fold<int>(
                              0,
                              (s, sec) =>
                                  s +
                                  ((sec['fields'] as List?)?.length ?? 0),
                            )
                          : schemaFields;
                      final createdAt = form['created_at'] != null
                          ? DateFormat(
                              'd/M/yyyy',
                            ).format(DateTime.parse(form['created_at']))
                          : '—';

                      return _buildFormCard(
                        form,
                        formStats,
                        isActive,
                        totalFields,
                        createdAt,
                        isWide,
                      );
                    },
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildFormCard(
    Map<String, dynamic> form,
    Map<String, int> stats,
    bool isActive,
    int totalFields,
    String createdAt,
    bool isWide,
  ) {
    final campaignType = form['campaign_type'] as String? ?? 'polio_campaign';
    final campaignLabel = campaignType == 'integrated_activity'
        ? 'نشاط متكامل'
        : 'حملة شلل';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: AppTheme.radiusMedium),
      child: InkWell(
        borderRadius: AppTheme.radiusMedium,
        onTap: () => _openFormEditor(existingForm: form),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isActive
                          ? AppTheme.primaryColor.withValues(alpha: 0.1)
                          : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.assignment_rounded,
                      color: isActive ? AppTheme.primaryColor : Colors.grey,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                form['title_ar'] ??
                                    form['title_en'] ??
                                    'بدون عنوان',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: isActive ? null : Colors.grey,
                                ),
                              ),
                            ),
                            _buildStatusChip(isActive),
                          ],
                        ),
                        if (form['description_ar'] != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              form['description_ar'],
                              style: const TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 12,
                                color: AppTheme.textSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                      ],
                    ),
                  ),
                  // Action buttons
                  IconButton(
                    icon: const Icon(
                      Icons.edit_rounded,
                      color: AppTheme.infoColor,
                    ),
                    onPressed: () => _openFormEditor(existingForm: form),
                    tooltip: 'تعديل شامل',
                  ),
                  IconButton(
                    icon: Icon(
                      isActive ? Icons.toggle_on : Icons.toggle_off,
                      color: isActive ? AppTheme.successColor : Colors.grey,
                      size: 28,
                    ),
                    onPressed: () => _toggleFormActive(form),
                    tooltip: isActive ? 'تعطيل' : 'تفعيل',
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.delete_outline,
                      color: AppTheme.errorColor,
                    ),
                    onPressed: () => _deleteForm(form['id']),
                    tooltip: 'حذف',
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 6,
                children: [
                  _buildInfoChip(
                    Icons.layers_outlined,
                    '$totalFields حقل',
                  ),
                  _buildInfoChip(
                    Icons.upload_file,
                    '${stats['total'] ?? 0} إرسالية',
                  ),
                  _buildInfoChip(
                    Icons.category_outlined,
                    campaignLabel,
                  ),
                  if ((stats['submitted'] ?? 0) > 0)
                    _buildInfoChip(
                      Icons.pending_actions,
                      '${stats['submitted']} مرسل',
                      color: AppTheme.warningColor,
                    ),
                  if ((stats['approved'] ?? 0) > 0)
                    _buildInfoChip(
                      Icons.check_circle_outline,
                      '${stats['approved']} معتمد',
                      color: AppTheme.successColor,
                    ),
                  _buildInfoChip(
                    Icons.calendar_today_outlined,
                    createdAt,
                  ),
                  _buildInfoChip(
                    Icons.tag,
                    'v${form['version'] ?? 1}',
                  ),
                  if (form['requires_gps'] == true)
                    _buildInfoChip(
                      Icons.location_on,
                      'GPS',
                      color: Colors.red,
                    ),
                  if (form['requires_photo'] == true)
                    _buildInfoChip(
                      Icons.camera_alt,
                      'صورة',
                      color: Colors.amber,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(bool isActive) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: (isActive ? AppTheme.successColor : AppTheme.textHint)
            .withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        isActive ? 'نشط' : 'معطل',
        style: TextStyle(
          fontFamily: 'Tajawal',
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: isActive ? AppTheme.successColor : AppTheme.textHint,
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label, {Color? color}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color ?? AppTheme.textHint),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontFamily: 'Tajawal',
            fontSize: 12,
            color: color ?? AppTheme.textSecondary,
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  //  FULL FORM EDITOR — replaces the simple dialog
  // ═══════════════════════════════════════════════════════════════════

  void _openFormEditor({Map<String, dynamic>? existingForm}) {
    final isEdit = existingForm != null;

    // Controllers
    final titleArCtrl = TextEditingController(
      text: existingForm?['title_ar'] ?? '',
    );
    final titleEnCtrl = TextEditingController(
      text: existingForm?['title_en'] ?? '',
    );
    final descCtrl = TextEditingController(
      text: existingForm?['description_ar'] ?? '',
    );

    // Settings
    bool isActive = existingForm?['is_active'] ?? true;
    bool requiresGps = existingForm?['requires_gps'] ?? false;
    bool requiresPhoto = existingForm?['requires_photo'] ?? false;
    int maxPhotos = existingForm?['max_photos'] ?? 5;
    String campaignType =
        existingForm?['campaign_type'] ?? 'polio_campaign';

    // Allowed roles
    final allRoles = [
      'data_entry',
      'district',
      'governorate',
      'central',
      'admin',
    ];
    final roleLabels = {
      'data_entry': 'إدخال بيانات',
      'district': 'مديرية',
      'governorate': 'محافظة',
      'central': 'مركزي',
      'admin': 'مسؤول',
    };
    List<String> allowedRoles = List<String>.from(
      existingForm?['allowed_roles'] ?? allRoles,
    );

    // Schema fields
    final schema =
        existingForm?['schema'] as Map<String, dynamic>? ?? {};
    final sectionsRaw = schema['sections'] as List? ?? [];
    final fieldsRaw = schema['fields'] as List? ?? [];
    List<Map<String, dynamic>> flatFields = fieldsRaw
        .map((f) => Map<String, dynamic>.from(f as Map))
        .toList();
    List<Map<String, dynamic>> sections = sectionsRaw
        .map((s) => Map<String, dynamic>.from(s as Map))
        .toList();
    bool useSections = sections.isNotEmpty;

    // Field type definitions
    final fieldTypes = {
      'text': 'نص',
      'number': 'رقم',
      'phone': 'جوال',
      'textarea': 'نص طويل',
      'select': 'قائمة اختيار',
      'multiselect': 'اختيار متعدد',
      'yesno': 'نعم / لا',
      'date': 'تاريخ',
      'gps': 'موقع GPS',
      'photo': 'صورة',
    };

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          // Helper to add a field
          void addField({int? sectionIdx}) {
            final keyCtrl = TextEditingController();
            final labelCtrl = TextEditingController();
            final hintCtrl = TextEditingController();
            String fieldType = 'text';
            bool fieldRequired = false;
            List<String> fieldOptions = [];

            showDialog(
              context: ctx,
              builder: (ctx2) => StatefulBuilder(
                builder: (ctx2, setFieldState) {
                  return Directionality(
                    textDirection: TextDirection.rtl,
                    child: AlertDialog(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      title: const Text(
                        'إضافة حقل',
                        style: TextStyle(fontFamily: 'Cairo'),
                      ),
                      content: SizedBox(
                        width: 400,
                        child: SingleChildScrollView(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              TextField(
                                controller: keyCtrl,
                                decoration: const InputDecoration(
                                  labelText: 'المفتاح (إنجليزي)',
                                  hintText: 'patient_name',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextField(
                                controller: labelCtrl,
                                decoration: const InputDecoration(
                                  labelText: 'التسمية (عربي)',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextField(
                                controller: hintCtrl,
                                decoration: const InputDecoration(
                                  labelText: 'نص المساعدة',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                              const SizedBox(height: 12),
                              DropdownButtonFormField<String>(
                                value: fieldType,
                                decoration: const InputDecoration(
                                  labelText: 'نوع الحقل',
                                  border: OutlineInputBorder(),
                                ),
                                items: fieldTypes.entries
                                    .map(
                                      (e) => DropdownMenuItem(
                                        value: e.key,
                                        child: Text(e.value),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (v) =>
                                    setFieldState(() => fieldType = v!),
                              ),
                              const SizedBox(height: 12),
                              SwitchListTile(
                                title: const Text(
                                  'مطلوب',
                                  style: TextStyle(fontFamily: 'Tajawal'),
                                ),
                                value: fieldRequired,
                                onChanged: (v) => setFieldState(
                                  () => fieldRequired = v,
                                ),
                              ),
                              if (fieldType == 'select' ||
                                  fieldType == 'multiselect') ...[
                                const SizedBox(height: 12),
                                const Align(
                                  alignment: Alignment.centerRight,
                                  child: Text(
                                    'الخيارات:',
                                    style: TextStyle(
                                      fontFamily: 'Tajawal',
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                ...fieldOptions.asMap().entries.map(
                                      (e) => Padding(
                                        padding:
                                            const EdgeInsets.only(bottom: 8),
                                        child: Row(
                                          children: [
                                            Expanded(
                                              child: TextField(
                                                controller:
                                                    TextEditingController(
                                                        text: e.value),
                                                decoration: InputDecoration(
                                                  labelText:
                                                      'خيار ${e.key + 1}',
                                                  border:
                                                      const OutlineInputBorder(),
                                                  isDense: true,
                                                ),
                                                onChanged: (v) =>
                                                    fieldOptions[e.key] = v,
                                              ),
                                            ),
                                            IconButton(
                                              icon: const Icon(
                                                Icons.remove_circle,
                                                color: Colors.red,
                                              ),
                                              onPressed: () => setFieldState(
                                                () => fieldOptions
                                                    .removeAt(e.key),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                TextButton.icon(
                                  onPressed: () => setFieldState(
                                    () => fieldOptions.add(''),
                                  ),
                                  icon: const Icon(Icons.add),
                                  label: const Text('إضافة خيار'),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx2),
                          child: const Text('إلغاء'),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            if (keyCtrl.text.trim().isEmpty ||
                                labelCtrl.text.trim().isEmpty) {
                              return;
                            }
                            final field = <String, dynamic>{
                              'key': keyCtrl.text.trim(),
                              'type': fieldType,
                              'label_ar': labelCtrl.text.trim(),
                              'required': fieldRequired,
                            };
                            if (hintCtrl.text.trim().isNotEmpty) {
                              field['hint'] = hintCtrl.text.trim();
                            }
                            if (fieldType == 'select' ||
                                fieldType == 'multiselect') {
                              field['options'] = fieldOptions
                                  .where((o) => o.trim().isNotEmpty)
                                  .toList();
                            }
                            setDialogState(() {
                              if (sectionIdx != null) {
                                (sections[sectionIdx]['fields'] as List)
                                    .add(field);
                              } else {
                                flatFields.add(field);
                              }
                            });
                            Navigator.pop(ctx2);
                          },
                          child: const Text('إضافة'),
                        ),
                      ],
                    ),
                  );
                },
              ),
            );
          }

          // Helper to delete a field
          void deleteField(int idx, {int? sectionIdx}) {
            setDialogState(() {
              if (sectionIdx != null) {
                (sections[sectionIdx]['fields'] as List).removeAt(idx);
              } else {
                flatFields.removeAt(idx);
              }
            });
          }

          // Helper to add a section
          void addSection() {
            final ctrl = TextEditingController();
            showDialog(
              context: ctx,
              builder: (ctx2) => Directionality(
                textDirection: TextDirection.rtl,
                child: AlertDialog(
                  title: const Text('قسم جديد'),
                  content: TextField(
                    controller: ctrl,
                    decoration: const InputDecoration(
                      labelText: 'عنوان القسم',
                      border: OutlineInputBorder(),
                    ),
                    autofocus: true,
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx2),
                      child: const Text('إلغاء'),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        if (ctrl.text.trim().isNotEmpty) {
                          setDialogState(() {
                            sections.add({
                              'title': ctrl.text.trim(),
                              'fields': <Map<String, dynamic>>[],
                            });
                          });
                        }
                        Navigator.pop(ctx2);
                      },
                      child: const Text('إضافة'),
                    ),
                  ],
                ),
              ),
            );
          }

          // Save handler
          Future<void> saveForm() async {
            if (titleArCtrl.text.trim().length < 2) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('العنوان مطلوب (حرفين على الأقل)'),
                  backgroundColor: AppTheme.errorColor,
                ),
              );
              return;
            }

            try {
              final client = Supabase.instance.client;
              final user = client.auth.currentUser;

              final schemaData = useSections
                  ? {
                      'sections': sections
                          .map(
                            (s) => Map<String, dynamic>.from(s)
                              ..remove('expanded'),
                          )
                          .toList(),
                    }
                  : {'fields': flatFields};

              final data = <String, dynamic>{
                'title_ar': titleArCtrl.text.trim(),
                'title_en':
                    titleEnCtrl.text.trim().isNotEmpty
                        ? titleEnCtrl.text.trim()
                        : titleArCtrl.text.trim(),
                'description_ar': descCtrl.text.trim().isNotEmpty
                    ? descCtrl.text.trim()
                    : null,
                'schema': schemaData,
                'is_active': isActive,
                'requires_gps': requiresGps,
                'requires_photo': requiresPhoto,
                'max_photos': maxPhotos,
                'allowed_roles': allowedRoles,
                'campaign_type': campaignType,
                'updated_at': DateTime.now().toIso8601String(),
              };

              if (isEdit) {
                data['version'] =
                    (existingForm!['version'] as int? ?? 1) + 1;
                await client
                    .from('forms')
                    .update(data)
                    .eq('id', existingForm!['id']);
              } else {
                data['created_at'] = DateTime.now().toIso8601String();
                data['created_by'] = user?.id;
                await client.from('forms').insert(data);
              }

              // Refresh
              try {
                final cache =
                    await ref.read(offlineDataCacheProvider.future);
                final campaign = ref.read(campaignProvider);
                await cache.forceInvalidate('forms_${campaign.value}');
                await cache.forceInvalidate('forms_all');
              } catch (_) {}
              ref.invalidate(formsListProvider);
              ref.invalidate(formsStatsProvider);

              if (ctx.mounted) {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      isEdit
                          ? 'تم تحديث النموذج ✅'
                          : 'تم إنشاء النموذج ✅',
                      style: const TextStyle(fontFamily: 'Tajawal'),
                    ),
                    backgroundColor: AppTheme.successColor,
                  ),
                );
              }
            } catch (e) {
              if (ctx.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'فشل: $e',
                      style: const TextStyle(fontFamily: 'Tajawal'),
                    ),
                    backgroundColor: AppTheme.errorColor,
                  ),
                );
              }
            }
          }

          // Build the field tile widget
          Widget buildFieldTile(Map<String, dynamic> field, int idx,
              {int? sectionIdx}) {
            final type = field['type'] as String? ?? 'text';
            final typeName = fieldTypes[type] ?? type;
            final options = field['options'] as List?;
            return Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.drag_indicator,
                    size: 18,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              field['label_ar'] ?? field['key'] ?? '—',
                              style: const TextStyle(
                                fontFamily: 'Tajawal',
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                            if (field['required'] == true)
                              Container(
                                margin: const EdgeInsets.only(right: 6),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 5,
                                  vertical: 1,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade50,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'مطلوب',
                                  style: TextStyle(
                                    fontSize: 9,
                                    color: Colors.red.shade700,
                                    fontFamily: 'Tajawal',
                                  ),
                                ),
                              ),
                          ],
                        ),
                        Text(
                          '$typeName${options != null ? ' (${options.length} خيارات)' : ''} — ${field['key'] ?? ''}',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey.shade500,
                            fontFamily: 'Tajawal',
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete, size: 18, color: Colors.red),
                    onPressed: () =>
                        deleteField(idx, sectionIdx: sectionIdx),
                  ),
                ],
              ),
            );
          }

          // ═══ MAIN DIALOG ═══
          return Directionality(
            textDirection: TextDirection.rtl,
            child: Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Container(
                width: MediaQuery.of(context).size.width * 0.85,
                height: MediaQuery.of(context).size.height * 0.9,
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Row(
                      children: [
                        Icon(
                          isEdit
                              ? Icons.edit_note_rounded
                              : Icons.add_circle_outline,
                          color: AppTheme.primaryColor,
                          size: 28,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          isEdit
                              ? 'تعديل النموذج: ${existingForm!['title_ar']}'
                              : 'إنشاء نموذج جديد',
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const Divider(),
                    const SizedBox(height: 8),

                    // Scrollable content
                    Expanded(
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // ═══ Basic Info ═══
                            _dialogSectionTitle('📋 المعلومات الأساسية'),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: titleArCtrl,
                                    decoration: const InputDecoration(
                                      labelText: 'العنوان (عربي) *',
                                      border: OutlineInputBorder(),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextField(
                                    controller: titleEnCtrl,
                                    decoration: const InputDecoration(
                                      labelText: 'العنوان (إنجليزي)',
                                      border: OutlineInputBorder(),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: descCtrl,
                              maxLines: 3,
                              decoration: const InputDecoration(
                                labelText: 'الوصف',
                                border: OutlineInputBorder(),
                                alignLabelWithHint: true,
                              ),
                            ),
                            const SizedBox(height: 20),

                            // ═══ Settings ═══
                            _dialogSectionTitle('⚙️ الإعدادات'),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: SwitchListTile(
                                    title: const Text(
                                      'النموذج نشط',
                                      style: TextStyle(
                                        fontFamily: 'Tajawal',
                                        fontSize: 13,
                                      ),
                                    ),
                                    value: isActive,
                                    onChanged: (v) =>
                                        setDialogState(() => isActive = v),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                      side: BorderSide(
                                        color: Colors.grey.shade300,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: SwitchListTile(
                                    title: const Text(
                                      '📍 يتطلب GPS',
                                      style: TextStyle(
                                        fontFamily: 'Tajawal',
                                        fontSize: 13,
                                      ),
                                    ),
                                    value: requiresGps,
                                    onChanged: (v) => setDialogState(
                                      () => requiresGps = v,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                      side: BorderSide(
                                        color: Colors.grey.shade300,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: SwitchListTile(
                                    title: const Text(
                                      '📷 يتطلب صورة',
                                      style: TextStyle(
                                        fontFamily: 'Tajawal',
                                        fontSize: 13,
                                      ),
                                    ),
                                    value: requiresPhoto,
                                    onChanged: (v) => setDialogState(
                                      () => requiresPhoto = v,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                      side: BorderSide(
                                        color: Colors.grey.shade300,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    value: campaignType,
                                    decoration: const InputDecoration(
                                      labelText: 'نوع الحملة',
                                      border: OutlineInputBorder(),
                                    ),
                                    items: const [
                                      DropdownMenuItem(
                                        value: 'polio_campaign',
                                        child: Text('حملة شلل'),
                                      ),
                                      DropdownMenuItem(
                                        value: 'integrated_activity',
                                        child: Text('نشاط متكامل'),
                                      ),
                                    ],
                                    onChanged: (v) => setDialogState(
                                      () => campaignType = v!,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // ═══ Allowed Roles ═══
                            _dialogSectionTitle('👥 الصلاحيات'),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: allRoles.map((role) {
                                final selected =
                                    allowedRoles.contains(role);
                                return FilterChip(
                                  label: Text(
                                    roleLabels[role] ?? role,
                                    style: const TextStyle(
                                      fontFamily: 'Tajawal',
                                      fontSize: 12,
                                    ),
                                  ),
                                  selected: selected,
                                  onSelected: (v) => setDialogState(() {
                                    if (v) {
                                      allowedRoles.add(role);
                                    } else {
                                      allowedRoles.remove(role);
                                    }
                                  }),
                                  selectedColor: AppTheme.primaryColor
                                      .withValues(alpha: 0.2),
                                  checkmarkColor: AppTheme.primaryColor,
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 20),

                            // ═══ Schema / Fields ═══
                            _dialogSectionTitle('🏗️ حقول النموذج'),
                            const SizedBox(height: 8),
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: InkWell(
                                      onTap: () => setDialogState(
                                        () => useSections = false,
                                      ),
                                      borderRadius: BorderRadius.circular(10),
                                      child: Container(
                                        padding:
                                            const EdgeInsets.symmetric(
                                          vertical: 10,
                                        ),
                                        decoration: BoxDecoration(
                                          color: !useSections
                                              ? AppTheme.primaryColor
                                              : Colors.transparent,
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          'حقول مباشرة',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            fontFamily: 'Tajawal',
                                            fontWeight: FontWeight.w600,
                                            color: !useSections
                                                ? Colors.white
                                                : Colors.grey,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    child: InkWell(
                                      onTap: () => setDialogState(
                                        () => useSections = true,
                                      ),
                                      borderRadius: BorderRadius.circular(10),
                                      child: Container(
                                        padding:
                                            const EdgeInsets.symmetric(
                                          vertical: 10,
                                        ),
                                        decoration: BoxDecoration(
                                          color: useSections
                                              ? AppTheme.primaryColor
                                              : Colors.transparent,
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          'مقسم بأقسام',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            fontFamily: 'Tajawal',
                                            fontWeight: FontWeight.w600,
                                            color: useSections
                                                ? Colors.white
                                                : Colors.grey,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),

                            // Fields list
                            if (!useSections) ...[
                              if (flatFields.isEmpty)
                                Container(
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade50,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: Colors.grey.shade200,
                                    ),
                                  ),
                                  child: const Center(
                                    child: Text(
                                      'لا توجد حقول — اضغط "إضافة حقل" للبدء',
                                      style: TextStyle(
                                        fontFamily: 'Tajawal',
                                        color: AppTheme.textHint,
                                      ),
                                    ),
                                  ),
                                )
                              else
                                ...flatFields.asMap().entries.map(
                                      (e) => buildFieldTile(
                                        e.value,
                                        e.key,
                                      ),
                                    ),
                              const SizedBox(height: 8),
                              OutlinedButton.icon(
                                onPressed: () => addField(),
                                icon: const Icon(Icons.add),
                                label: const Text('إضافة حقل'),
                                style: OutlinedButton.styleFrom(
                                  minimumSize:
                                      const Size(double.infinity, 44),
                                  foregroundColor: AppTheme.primaryColor,
                                  side: const BorderSide(
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                              ),
                            ] else ...[
                              // Sections
                              if (sections.isEmpty)
                                Container(
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade50,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: Colors.grey.shade200,
                                    ),
                                  ),
                                  child: const Center(
                                    child: Text(
                                      'لا توجد أقسام — اضغط "إضافة قسم" للبدء',
                                      style: TextStyle(
                                        fontFamily: 'Tajawal',
                                        color: AppTheme.textHint,
                                      ),
                                    ),
                                  ),
                                )
                              else
                                ...sections.asMap().entries.map((entry) {
                                  final sec = entry.value;
                                  final secIdx = entry.key;
                                  final secFields =
                                      (sec['fields'] as List?)
                                              ?.cast<
                                                  Map<String, dynamic>>() ??
                                          [];
                                  final expanded =
                                      sec['expanded'] == true;
                                  return Card(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    child: Column(
                                      children: [
                                        ListTile(
                                          leading: const Icon(
                                            Icons.folder_rounded,
                                            color: Colors.teal,
                                          ),
                                          title: Text(
                                            sec['title'] ?? '—',
                                            style: const TextStyle(
                                              fontFamily: 'Cairo',
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                          subtitle: Text(
                                            '${secFields.length} حقل',
                                            style: const TextStyle(
                                              fontFamily: 'Tajawal',
                                              fontSize: 12,
                                            ),
                                          ),
                                          trailing: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              IconButton(
                                                icon: const Icon(
                                                  Icons.add,
                                                  size: 20,
                                                  color: Colors.teal,
                                                ),
                                                onPressed: () => addField(
                                                  sectionIdx: secIdx,
                                                ),
                                              ),
                                              IconButton(
                                                icon: const Icon(
                                                  Icons.delete,
                                                  size: 20,
                                                  color: Colors.red,
                                                ),
                                                onPressed: () =>
                                                    setDialogState(() =>
                                                        sections.removeAt(
                                                            secIdx)),
                                              ),
                                              Icon(
                                                expanded
                                                    ? Icons.expand_less
                                                    : Icons.expand_more,
                                              ),
                                            ],
                                          ),
                                          onTap: () => setDialogState(
                                            () => sec['expanded'] =
                                                !expanded,
                                          ),
                                        ),
                                        if (expanded)
                                          Padding(
                                            padding:
                                                const EdgeInsets.all(12),
                                            child: Column(
                                              children: [
                                                ...secFields
                                                    .asMap()
                                                    .entries
                                                    .map(
                                                      (e) =>
                                                          buildFieldTile(
                                                        e.value,
                                                        e.key,
                                                        sectionIdx:
                                                            secIdx,
                                                      ),
                                                    ),
                                              ],
                                            ),
                                          ),
                                      ],
                                    ),
                                  );
                                }),
                              const SizedBox(height: 8),
                              OutlinedButton.icon(
                                onPressed: addSection,
                                icon: const Icon(Icons.create_new_folder),
                                label: const Text('إضافة قسم'),
                                style: OutlinedButton.styleFrom(
                                  minimumSize:
                                      const Size(double.infinity, 44),
                                  foregroundColor: Colors.teal,
                                  side:
                                      const BorderSide(color: Colors.teal),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),

                    const Divider(),

                    // Footer actions
                    Row(
                      children: [
                        Text(
                          useSections
                              ? '${sections.length} قسم'
                              : '${flatFields.length} حقل',
                          style: const TextStyle(
                            fontFamily: 'Tajawal',
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: () => Navigator.pop(ctx),
                          child: const Text('إلغاء'),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton.icon(
                          onPressed: saveForm,
                          icon: Icon(
                            isEdit ? Icons.save : Icons.add,
                            size: 18,
                          ),
                          label: Text(isEdit ? 'حفظ التعديلات' : 'إنشاء'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24,
                              vertical: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _dialogSectionTitle(String title) {
    return Row(
      children: [
        Container(
          width: 3,
          height: 18,
          decoration: BoxDecoration(
            color: AppTheme.primaryColor,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontFamily: 'Cairo',
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  //  CRUD Operations
  // ═══════════════════════════════════════════════════════════════════

  Future<void> _toggleFormActive(Map<String, dynamic> form) async {
    try {
      final client = Supabase.instance.client;
      final newStatus = !(form['is_active'] as bool? ?? true);
      await client
          .from('forms')
          .update({
            'is_active': newStatus,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', form['id']);

      ref.invalidate(formsListProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              newStatus ? 'تم تفعيل النموذج ✅' : 'تم تعطيل النموذج ⚠️',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('خطأ: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _deleteForm(String id) async {
    final confirmed = await EpiDialog.show(
      context,
      title: 'حذف النموذج',
      content: 'سيتم حذف النموذج وجميع إرسالياته. هل أنت متأكد؟',
      confirmText: 'حذف',
      isDanger: true,
    );
    if (confirmed != true) return;

    try {
      await Supabase.instance.client.from('forms').update({
        'deleted_at': DateTime.now().toIso8601String(),
        'is_active': false,
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', id);
      ref.invalidate(formsListProvider);
      ref.invalidate(formsStatsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تم حذف النموذج',
              style: TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }
}
