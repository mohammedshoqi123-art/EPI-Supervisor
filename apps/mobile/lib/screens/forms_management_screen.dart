import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';
import 'form_editor_screen.dart';

/// إدارة النماذج — Forms Management (Add + Full Edit + Schema Editor + Toggle)
class FormsManagementScreen extends ConsumerStatefulWidget {
  const FormsManagementScreen({super.key});

  @override
  ConsumerState<FormsManagementScreen> createState() =>
      _FormsManagementScreenState();
}

class _FormsManagementScreenState extends ConsumerState<FormsManagementScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _forms = [];
  Map<String, Map<String, int>> _stats = {};
  String? _error;
  String? _campaignFilter; // ═══ null = الكل
  Timer? _searchDebounce;
  final _searchController = TextEditingController();

  static const _campaignLabels = {
    'measles_campaign': '🦠 حملة الحصبة',
    'polio_campaign': '🧬 حملة شلل الأطفال',
    'integrated_activity': '📋 النشاط التكاملي',
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> get _filteredForms {
    final q = _searchController.text.trim().toLowerCase();
    return _forms.where((f) {
      if (_campaignFilter != null && f['campaign_type'] != _campaignFilter) {
        return false;
      }
      if (q.isEmpty) return true;
      final title = (f['title_ar'] as String? ?? '').toLowerCase();
      final desc = (f['description_ar'] as String? ?? '').toLowerCase();
      return title.contains(q) || desc.contains(q);
    }).toList();
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final client = Supabase.instance.client;

      // ═══ Server-side stats via RPC (GROUP BY على الخادم) — كانت تجلب
      // جدول الإرساليات كاملاً إلى الجهاز في كل فتح للشاشة، وتحتسب المحذوفة ═══
      Map<String, Map<String, int>> stats = {};
      List<Map<String, dynamic>> forms;
      try {
        // ═══ Future.wait<dynamic> صريحة: PostgrestBuilder يُطبّق Future لكن
        // الاستنتاج التلقائي يفشل عند خلط from() مع rpc() ═══
        final results = await Future.wait<dynamic>([
          client
              .from('forms')
              .select('*')
              .isFilter('deleted_at', null)
              .order('created_at', ascending: false),
          client.rpc('form_submission_stats'),
        ]);
        forms = (results[0] as List<dynamic>).cast<Map<String, dynamic>>();
        for (final row in (results[1] as List<dynamic>)) {
          final r = row as Map<String, dynamic>;
          final fid = r['form_id'] as String?;
          if (fid == null) continue;
          stats[fid] = {
            'total': (r['total'] as num?)?.toInt() ?? 0,
            'submitted': (r['submitted'] as num?)?.toInt() ?? 0,
            'draft': (r['draft'] as num?)?.toInt() ?? 0,
          };
        }
      } catch (_) {
        // ═══ Fallback: APK قديم من دوال الخادم — حساب محلي مع فلتر المحذوف ═══
        final results = await Future.wait([
          client
              .from('forms')
              .select('*')
              .isFilter('deleted_at', null)
              .order('created_at', ascending: false),
          client
              .from('form_submissions')
              .select('form_id, status')
              .isFilter('deleted_at', null),
        ]);
        forms = (results[0] as List<dynamic>).cast<Map<String, dynamic>>();
        for (final sub in (results[1] as List<dynamic>).cast<Map<String, dynamic>>()) {
          final fid = sub['form_id'] as String?;
          if (fid == null) continue;
          final counts = stats.putIfAbsent(fid, () => <String, int>{});
          counts['total'] = (counts['total'] ?? 0) + 1;
          final st = sub['status'] ?? 'draft';
          counts[st] = (counts[st] ?? 0) + 1;
        }
      }

      // Ensure all forms have stats (even if 0 submissions)
      for (final f in forms) {
        final fid = f['id'] as String;
        stats.putIfAbsent(fid, () => {'total': 0});
      }

      if (mounted) {
        setState(() {
          _forms = forms;
          _stats = stats;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('[FormsManagement] Load error: $e');
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _addForm() async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(builder: (ctx) => const FormEditorScreen()),
    );
    if (result == null) return;

    try {
      final client = Supabase.instance.client;
      final user = client.auth.currentUser;

      final insertData = <String, dynamic>{
        'title_ar': result['title_ar'],
        'title_en': result['title_en'] ?? result['title_ar'],
        'description_ar': result['description_ar'],
        'schema': result['schema'] ?? {'fields': []},
        'requires_gps': result['requires_gps'] ?? false,
        'requires_photo': result['requires_photo'] ?? false,
        'max_photos': result['max_photos'] ?? 5,
        'allowed_roles': result['allowed_roles'] ??
            ['data_entry', 'district', 'governorate', 'central', 'admin'],
        // ═══ FIX: كانت polio_campaign الثابتة — مخفية عن الجميع عدا المدير ═══
        'campaign_type': result['campaign_type'] ??
            ref.read(campaignProvider).value,
        'is_active': true,
        'created_by': user?.id,
      };

      await client.from('forms').insert(insertData).timeout(const Duration(seconds: 15));

      // Invalidate caches
      try {
        final cache = await ref.read(offlineDataCacheProvider.future);
        final campaign = ref.read(campaignProvider);
        await cache.forceInvalidate('forms_${campaign.value}');
        await cache.forceInvalidate('forms_all');
      } catch (_) {}
      ref.invalidate(formsProvider);

      await Future.delayed(const Duration(milliseconds: 300));
      await _loadData();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تم إضافة النموذج ✅',
              style: TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      debugPrint('[FormsManagement] Add error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'فشل الإضافة: ${e.toString()}',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.errorColor,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  Future<void> _editForm(Map<String, dynamic> form) async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(builder: (ctx) => FormEditorScreen(existingForm: form)),
    );
    if (result == null) return;

    try {
      final client = Supabase.instance.client;

      // ═══ FIX: Build update map with safe defaults ═══
      final updateData = <String, dynamic>{
        'title_ar': result['title_ar'],
        'title_en': result['title_en'] ?? form['title_en'] ?? '',
        'description_ar': result['description_ar'],
        'schema': result['schema'],
        'requires_gps': result['requires_gps'] ?? false,
        'requires_photo': result['requires_photo'] ?? false,
        'max_photos': result['max_photos'] ?? 5,
        'allowed_roles':
            result['allowed_roles'] ?? form['allowed_roles'] ?? ['data_entry'],
        'campaign_type': result['campaign_type'] ??
            form['campaign_type'] ??
            CampaignType.measlesCampaign.value,
        'version': (form['version'] as int? ?? 1) + 1,
      };

      await client.from('forms').update(updateData).eq('id', form['id']).timeout(const Duration(seconds: 15));

      // ═══ FIX: Invalidate BOTH local cache and Riverpod providers ═══
      try {
        final cache = await ref.read(offlineDataCacheProvider.future);
        final campaign = ref.read(campaignProvider);
        await cache.forceInvalidate('forms_${campaign.value}');
        await cache.forceInvalidate('forms_all');
      } catch (_) {}
      ref.invalidate(formsProvider);

      // ═══ FIX: Reload with small delay to ensure Supabase consistency ═══
      await Future.delayed(const Duration(milliseconds: 300));
      await _loadData();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تم تحديث النموذج ✅',
              style: TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      debugPrint('[FormsManagement] Edit error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'فشل التحديث: ${e.toString()}',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.errorColor,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  Future<void> _deleteForm(Map<String, dynamic> form) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: AppTheme.errorColor),
              SizedBox(width: 8),
              Text(
                'حذف النموذج',
                style: TextStyle(fontFamily: 'Cairo', fontSize: 18),
              ),
            ],
          ),
          content: Text(
            'هل أنت متأكد من حذف "${form['title_ar']}"؟',
            style: const TextStyle(fontFamily: 'Tajawal'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text(
                'إلغاء',
                style: TextStyle(fontFamily: 'Tajawal'),
              ),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.errorColor,
              ),
              child: const Text(
                'حذف',
                style: TextStyle(fontFamily: 'Tajawal', color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
    if (confirmed != true) return;

    try {
      final client = Supabase.instance.client;
      final user = client.auth.currentUser;
      await client.from('forms').update({
        'deleted_at': DateTime.now().toIso8601String(),
        'deleted_by': user?.id, // ═══ سجل من حذف (كان عموداً يتيمة بلا قيمة) ═══
        'is_active': false,
      }).eq('id', form['id']).timeout(const Duration(seconds: 15));

      try {
        final cache = await ref.read(offlineDataCacheProvider.future);
        final campaign = ref.read(campaignProvider);
        await cache.invalidate('forms_${campaign.value}');
        await cache.invalidate('forms_all');
      } catch (_) {}
      ref.invalidate(formsProvider);

      await Future.delayed(const Duration(milliseconds: 300));
      await _loadData();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تم حذف النموذج ✅',
              style: TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      debugPrint('[FormsManagement] Delete error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'فشل الحذف: ${e.toString()}',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  Future<void> _toggleFormActive(Map<String, dynamic> form) async {
    try {
      final client = Supabase.instance.client;
      final newStatus = !(form['is_active'] as bool? ?? true);
      await client
          .from('forms')
          .update({'is_active': newStatus}).eq('id', form['id']);

      try {
        final cache = await ref.read(offlineDataCacheProvider.future);
        final campaign = ref.read(campaignProvider);
        await cache.invalidate('forms_${campaign.value}');
        await cache.invalidate('forms_all');
      } catch (_) {}
      ref.invalidate(formsProvider);

      await Future.delayed(const Duration(milliseconds: 200));
      await _loadData();

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
      debugPrint('[FormsManagement] Toggle error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'خطأ: ${e.toString()}',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'إدارة النماذج',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700),
        ),
        centerTitle: true,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [AppTheme.primaryColor, AppTheme.primaryDark],
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
            ),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadData,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addForm,
        backgroundColor: AppTheme.primaryColor,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text(
          'نموذج جديد',
          style: TextStyle(
            fontFamily: 'Tajawal',
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: Column(
        children: [
          // ═══ بحث + فلتر حملة ═══
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'بحث بعنوان النموذج...',
                hintStyle: const TextStyle(fontFamily: 'Tajawal'),
                prefixIcon: const Icon(Icons.search_rounded),
                isDense: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.grey.shade100,
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {});
                        },
                      )
                    : null,
              ),
              onChanged: (_) {
                _searchDebounce?.cancel();
                _searchDebounce =
                    Timer(const Duration(milliseconds: 300), () {
                  if (mounted) setState(() {});
                });
              },
            ),
          ),
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              children: [
                _campaignChip(null, 'الكل (${_forms.length})'),
                ..._campaignLabels.entries
                    .map((e) => _campaignChip(e.key, e.value)),
              ],
            ),
          ),
          if (_forms.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _summaryStat('الكل', _filteredForms.length, AppTheme.primaryColor),
                  _summaryStat(
                    'مفعل',
                    _filteredForms.where((f) => f['is_active'] == true).length,
                    AppTheme.successColor,
                  ),
                  _summaryStat(
                    'معطل',
                    _filteredForms.where((f) => f['is_active'] != true).length,
                    AppTheme.errorColor,
                  ),
                ],
              ),
            ),
          Expanded(child: _buildContent()),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _summaryStat(String label, int count, Color color) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(
              '$count',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 11,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) return const Center(child: EpiLoading.shimmer());
    if (_error != null)
      return Center(
        child: EpiErrorWidget(message: _error!, onRetry: _loadData),
      );
    if (_forms.isEmpty)
      return Center(
        child: EpiEmptyState(
          icon: Icons.description_outlined,
          title: 'لا توجد نماذج',
          subtitle: 'اضغط على "نموذج جديد" للبدء',
          actionText: 'إعادة تحميل',
          onAction: _loadData,
        ),
      );

    return RefreshIndicator(
      onRefresh: _loadData,
      child: _filteredForms.isEmpty && _forms.isNotEmpty
          ? ListView(children: const [
              SizedBox(height: 80),
              Center(
                child: Text(
                  'لا نتائج مطابقة للبحث/الفلتر',
                  style: TextStyle(fontFamily: 'Tajawal', color: Colors.grey),
                ),
              ),
            ])
          : ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _filteredForms.length,
        itemBuilder: (context, i) => _buildFormCard(_filteredForms[i]),
      ),
    );
  }

  Widget _campaignChip(String? value, String label) {
    final selected = _campaignFilter == value;
    return Padding(
      padding: const EdgeInsets.only(left: 8),
      child: ChoiceChip(
        label: Text(
          label,
          style: TextStyle(
            fontFamily: 'Tajawal',
            fontSize: 12,
            color: selected ? Colors.white : AppTheme.textSecondary,
          ),
        ),
        selected: selected,
        selectedColor: AppTheme.primaryColor,
        backgroundColor: Colors.grey.shade100,
        onSelected: (_) => setState(() => _campaignFilter = value),
      ),
    );
  }

  Widget _buildFormCard(Map<String, dynamic> form) {
    final isActive = form['is_active'] as bool? ?? true;
    final fid = form['id'] as String;
    final stats = _stats[fid] ?? {};
    final total = stats['total'] ?? 0;
    final approved = stats['approved'] ?? 0;
    final submitted = stats['submitted'] ?? 0;
    final schema = form['schema'] as Map<String, dynamic>? ?? {};
    final fields = schema['fields'] as List? ?? [];
    final sections = schema['sections'] as List? ?? [];
    final totalFields = sections.isNotEmpty
        ? sections.fold<int>(
            0,
            (sum, s) => sum + ((s['fields'] as List?)?.length ?? 0),
          )
        : fields.length;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => _showFormActions(form),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isActive
                          ? AppTheme.primaryColor.withValues(alpha: 0.1)
                          : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.assignment_rounded,
                      color: isActive ? AppTheme.primaryColor : Colors.grey,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          form['title_ar'] ?? '—',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: isActive ? null : Colors.grey,
                          ),
                        ),
                        if (form['description_ar'] != null)
                          Text(
                            form['description_ar'],
                            style: const TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                  Switch(
                    value: isActive,
                    onChanged: (_) => _toggleFormActive(form),
                    activeColor: AppTheme.successColor,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  _statChip('$total إرسالية', AppTheme.primaryColor),
                  const SizedBox(width: 8),
                  _statChip('$submitted معلق', AppTheme.warningColor),
                  const SizedBox(width: 8),
                  _statChip('$approved معتمد', AppTheme.successColor),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  // ═══ شريحة الحملة — المدير يرى الآن أنشطة كل نموذج ═══
                  _tagChip(
                    _campaignLabels[form['campaign_type']] ??
                        (form['campaign_type'] as String? ?? '—'),
                    AppTheme.infoColor,
                  ),
                  const SizedBox(width: 8),
                  _statChip('$totalFields حقل', Colors.indigo),
                  const SizedBox(width: 8),
                  if (sections.isNotEmpty)
                    _statChip('${sections.length} أقسام', Colors.teal),
                  const SizedBox(width: 8),
                  if (form['requires_gps'] == true)
                    _tagChip('📍 GPS', AppTheme.infoColor),
                  if (form['requires_photo'] == true)
                    _tagChip('📷 صورة', AppTheme.warningColor),
                  const Spacer(),
                  Text(
                    'v${form['version'] ?? 1}',
                    style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 11,
                      color: AppTheme.textHint,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: 'Tajawal',
          fontSize: 11,
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _tagChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Text(
        label,
        style: TextStyle(fontFamily: 'Tajawal', fontSize: 10, color: color),
      ),
    );
  }

  void _showFormActions(Map<String, dynamic> form) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            const Icon(
              Icons.assignment_rounded,
              size: 48,
              color: AppTheme.primaryColor,
            ),
            const SizedBox(height: 8),
            Text(
              form['title_ar'] ?? '—',
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            const Divider(),
            _actionTile(
              Icons.edit_rounded,
              'تعديل شامل (حقول + عناوين + إعدادات)',
              AppTheme.primaryColor,
              () {
                Navigator.pop(ctx);
                _editForm(form);
              },
            ),
            _actionTile(
              Icons.toggle_on_rounded,
              (form['is_active'] as bool? ?? true) ? 'تعطيل' : 'تفعيل',
              AppTheme.warningColor,
              () {
                Navigator.pop(ctx);
                _toggleFormActive(form);
              },
            ),
            _actionTile(
              Icons.delete_forever_rounded,
              'حذف النموذج',
              AppTheme.errorColor,
              () {
                Navigator.pop(ctx);
                _deleteForm(form);
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _actionTile(
    IconData icon,
    String title,
    Color color,
    VoidCallback onTap,
  ) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 22),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontFamily: 'Tajawal',
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: onTap,
    );
  }
}
