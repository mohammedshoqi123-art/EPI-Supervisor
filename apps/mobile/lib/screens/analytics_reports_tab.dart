/// ═══════════════════════════════════════════════════════════
/// Dynamic Reports Tab — تقارير ديناميكية لكل استمارة
///
/// كل استمارة في قاعدة البيانات تلقى تقرير تلقائياً.
/// لو أضفت استمارة جديدة من لوحة التحكم → تظهر هنا فوراً.
///
/// يستخدم get_form_analytics RPC (server-side aggregation).
/// ═══════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';
import '../../providers/app_providers.dart';

// ═══════════════════════════════════════════════════════════
// Campaign color/icon mapping
// ═══════════════════════════════════════════════════════════

const _campaignColors = {
  'polio_campaign': Color(0xFF1E88E5),
  'integrated_activity': Color(0xFF43A047),
  'measles_campaign': Color(0xFFE53935),
};

const _campaignIcons = {
  'polio_campaign': Icons.vaccines_rounded,
  'integrated_activity': Icons.integration_instructions_rounded,
  'measles_campaign': Icons.coronavirus_rounded,
};

const _campaignLabels = {
  'polio_campaign': 'شلل الأطفال',
  'integrated_activity': 'إيصالي تكاملي',
  'measles_campaign': 'حملة الحصبة',
};

Color _getCampaignColor(String? type) =>
    _campaignColors[type] ?? const Color(0xFF607D8B);

IconData _getCampaignIcon(String? type) =>
    _campaignIcons[type] ?? Icons.description_rounded;

String _getCampaignLabel(String? type) =>
    _campaignLabels[type] ?? type ?? 'أخرى';

// ═══════════════════════════════════════════════════════════
// Main Reports Tab Widget
// ═══════════════════════════════════════════════════════════

class DynamicReportsTab extends ConsumerStatefulWidget {
  final int? campaignRound;
  /// ═══ FIX: onGenerate signature now supports formId + formTitle for 'form_report' type ═══
  /// Signature: (type, format, period, {formId, formTitle})
  /// When type == 'form_report', formId and formTitle MUST be provided.
  final Future<void> Function(
    String type,
    String format,
    String period, {
    String? formId,
    String? formTitle,
  })? onGenerate;

  const DynamicReportsTab({
    super.key,
    this.campaignRound,
    this.onGenerate,
  });

  @override
  ConsumerState<DynamicReportsTab> createState() => _DynamicReportsTabState();
}

class _DynamicReportsTabState extends ConsumerState<DynamicReportsTab> {
  String _filterCampaign = 'all';

  @override
  Widget build(BuildContext context) {
    final formsAsync = ref.watch(formsProvider);
    final campaignRound = ref.watch(campaignRoundProvider);

    return formsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorRetry(
        msg: 'تعذّر تحميل النماذج',
        onRetry: () => ref.invalidate(formsProvider),
      ),
      data: (forms) {
        final activeForms =
            forms.where((f) => f['is_active'] == true).toList();

        if (activeForms.isEmpty) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'لا توجد نماذج متاحة',
                style: TextStyle(fontFamily: 'Tajawal', fontSize: 14),
              ),
            ),
          );
        }

        // Group forms by campaign type
        final grouped = <String, List<Map<String, dynamic>>>{};
        for (final form in activeForms) {
          final ct = form['campaign_type'] as String? ?? 'أخرى';
          grouped.putIfAbsent(ct, () => []).add(form);
        }

        // Apply campaign filter
        List<Map<String, dynamic>> filteredForms;
        if (_filterCampaign == 'all') {
          filteredForms = activeForms;
        } else {
          filteredForms = activeForms
              .where((f) => f['campaign_type'] == _filterCampaign)
              .toList();
        }

        return CustomScrollView(
          slivers: [
            // ═══ Header ═══
            SliverToBoxAdapter(child: _buildHeader(context)),

            // ═══ Campaign filter chips ═══
            SliverToBoxAdapter(
              child: _buildCampaignFilter(grouped.keys.toList()),
            ),

            // ═══ Form report cards ═══
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    if (index >= filteredForms.length) return null;
                    final form = filteredForms[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _FormReportCard(
                        form: form,
                        campaignRound: campaignRound,
                        onTap: () => _showFormReport(context, form),
                      ),
                    );
                  },
                  childCount: filteredForms.length,
                ),
              ),
            ),

            // ═══ General reports section ═══
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                child: Row(
                  children: [
                    Container(
                      width: 4,
                      height: 20,
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'تقارير عامة',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ═══ General report cards ═══
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 1.3,
                ),
                delegate: SliverChildListDelegate([
                  _GeneralReportCard(
                    icon: Icons.today_rounded,
                    label: 'ملخص يومي',
                    subtitle: 'إرساليات اليوم',
                    color: const Color(0xFF1E88E5),
                    onTap: () => widget.onGenerate?.call(
                        'daily', 'pdf', '1'),
                  ),
                  _GeneralReportCard(
                    icon: Icons.compare_arrows_rounded,
                    label: 'مقارنة الجولات',
                    subtitle: 'جولة 1 vs جولة 2',
                    color: const Color(0xFF00897B),
                    onTap: () => widget.onGenerate?.call(
                        'round_comparison', 'pdf', '30'),
                  ),
                  _GeneralReportCard(
                    icon: Icons.assessment_rounded,
                    label: 'تقرير شامل',
                    subtitle: 'كل البيانات',
                    color: const Color(0xFFE53935),
                    onTap: () =>
                        widget.onGenerate?.call('full', 'pdf', '30'),
                  ),
                ]),
              ),
            ),
          ],
        );
      },
    );
  }

  // ═══ Header ═══
  Widget _buildHeader(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primaryColor, AppTheme.primaryDark],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.assessment_rounded,
                color: Colors.white, size: 28),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'مركز التقارير',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'تقرير لكل استمارة — تلقائياً',
                  style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.75),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══ Campaign filter chips ═══
  Widget _buildCampaignFilter(List<String> campaignTypes) {
    return SizedBox(
      height: 42,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _FilterChip(
            label: 'الكل',
            icon: Icons.grid_view_rounded,
            color: AppTheme.primaryColor,
            selected: _filterCampaign == 'all',
            onTap: () => setState(() => _filterCampaign = 'all'),
          ),
          ...campaignTypes.map((ct) => _FilterChip(
                label: _getCampaignLabel(ct),
                icon: _getCampaignIcon(ct),
                color: _getCampaignColor(ct),
                selected: _filterCampaign == ct,
                onTap: () => setState(() => _filterCampaign = ct),
              )),
        ],
      ),
    );
  }

  // ═══ Show detailed report bottom sheet ═══
  void _showFormReport(
      BuildContext context, Map<String, dynamic> form) {
    final formId = form['id'] as String;
    final formTitle = form['title_ar'] as String? ?? 'تقرير';
    final campaignType = form['campaign_type'] as String?;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _FormReportSheet(
        formId: formId,
        formTitle: formTitle,
        campaignType: campaignType,
        campaignRound: widget.campaignRound,
        onExport: widget.onGenerate,
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// Form Report Card — بطاقة تقرير الاستمارة
// ═══════════════════════════════════════════════════════════

class _FormReportCard extends ConsumerWidget {
  final Map<String, dynamic> form;
  final int? campaignRound;
  final VoidCallback onTap;

  const _FormReportCard({
    required this.form,
    this.campaignRound,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formId = form['id'] as String;
    final formTitle = form['title_ar'] as String? ?? 'بدون عنوان';
    final campaignType = form['campaign_type'] as String?;
    final color = _getCampaignColor(campaignType);
    final icon = _getCampaignIcon(campaignType);

    // Get submission count from form stats
    final statsAsync = ref.watch(formStatsProvider);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.08),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          children: [
            // Top color bar
            Container(
              height: 4,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [color, color.withValues(alpha: 0.5)],
                ),
                borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(18)),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  // Icon
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: color, size: 22),
                  ),
                  const SizedBox(width: 12),
                  // Title + campaign
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          formTitle,
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: color.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            _getCampaignLabel(campaignType),
                            style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: color,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Arrow
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(Icons.arrow_back_ios_rounded,
                        size: 14, color: color),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// Form Report Sheet — تفاصيل التقرير في bottom sheet
// ═══════════════════════════════════════════════════════════

class _FormReportSheet extends ConsumerStatefulWidget {
  final String formId;
  final String formTitle;
  final String? campaignType;
  final int? campaignRound;
  /// ═══ FIX: Updated signature to support formId + formTitle ═══
  final Future<void> Function(
    String type,
    String format,
    String period, {
    String? formId,
    String? formTitle,
  })? onExport;

  const _FormReportSheet({
    required this.formId,
    required this.formTitle,
    this.campaignType,
    this.campaignRound,
    this.onExport,
  });

  @override
  ConsumerState<_FormReportSheet> createState() => _FormReportSheetState();
}

class _FormReportSheetState extends ConsumerState<_FormReportSheet> {
  @override
  Widget build(BuildContext context) {
    final color = _getCampaignColor(widget.campaignType);
    final analyticsAsync = ref.watch(_formAnalyticsProvider(
      _AnalyticsParams(
        formId: widget.formId,
        campaignRound: widget.campaignRound,
      ),
    ));

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (ctx, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 10),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                          _getCampaignIcon(widget.campaignType),
                          color: color,
                          size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.formTitle,
                            style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            _getCampaignLabel(widget.campaignType),
                            style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 11,
                              color: color,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(ctx),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              // Content
              Expanded(
                child: analyticsAsync.when(
                  loading: () => const Center(
                      child: CircularProgressIndicator()),
                  error: (e, _) => Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.error_outline,
                            size: 48, color: Colors.grey[400]),
                        const SizedBox(height: 12),
                        Text('فشل تحميل التحليلات',
                            style: TextStyle(
                                fontFamily: 'Tajawal',
                                color: Colors.grey[600])),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () => ref.invalidate(
                              _formAnalyticsProvider(_AnalyticsParams(
                            formId: widget.formId,
                            campaignRound: widget.campaignRound,
                          ))),
                          child: const Text('إعادة المحاولة'),
                        ),
                      ],
                    ),
                  ),
                  data: (analytics) =>
                      _buildAnalyticsContent(analytics, color),
                ),
              ),
              // Export buttons
              _buildExportBar(color),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAnalyticsContent(
      Map<String, dynamic> analytics, Color color) {
    final totalSubmissions =
        analytics['total_submissions'] as int? ?? 0;
    final fields = analytics['analytics'] as List? ?? [];

    if (totalSubmissions == 0) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.inbox_rounded, size: 56, color: Colors.grey[300]),
            const SizedBox(height: 12),
            Text(
              'لا توجد إرساليات بعد',
              style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 14,
                  color: Colors.grey[500]),
            ),
          ],
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Total submissions card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [color.withValues(alpha: 0.05), Colors.white],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withValues(alpha: 0.15)),
          ),
          child: Row(
            children: [
              Icon(Icons.inventory_2_rounded, color: color, size: 28),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$totalSubmissions',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: color,
                    ),
                  ),
                  const Text(
                    'إجمالي الإرساليات',
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                        color: Colors.grey),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Section title
        Row(
          children: [
            Container(
              width: 4,
              height: 18,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 10),
            const Text(
              'تحليل الحقول',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Field analytics cards
        ...fields.map<Widget>((field) => _FieldAnalyticsCard(
              field: field,
              color: color,
            )),
      ],
    );
  }

  Widget _buildExportBar(Color color) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _ExportButton(
              icon: Icons.picture_as_pdf_rounded,
              label: 'PDF',
              color: const Color(0xFFE53935),
              onTap: () => widget.onExport?.call(
                'form_report',
                'pdf',
                '30',
                formId: widget.formId,
                formTitle: widget.formTitle,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _ExportButton(
              icon: Icons.table_chart_rounded,
              label: 'Excel',
              color: const Color(0xFF43A047),
              onTap: () => widget.onExport?.call(
                'form_report',
                'excel',
                '30',
                formId: widget.formId,
                formTitle: widget.formTitle,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// Field Analytics Card — بطاقة تحليل حقل واحد
// ═══════════════════════════════════════════════════════════

class _FieldAnalyticsCard extends StatelessWidget {
  final Map<String, dynamic> field;
  final Color color;

  const _FieldAnalyticsCard({required this.field, required this.color});

  @override
  Widget build(BuildContext context) {
    final type = field['type'] as String? ?? '';
    final label = field['label_ar'] as String? ??
        field['label'] as String? ??
        field['field_key'] as String? ??
        '';

    switch (type) {
      case 'yesno':
        return _buildYesNo(field, label);
      case 'avg':
        return _buildAvg(field, label);
      case 'sum':
        return _buildSum(field, label);
      case 'count':
        return _buildCount(field, label);
      case 'bar':
        return _buildBar(field, label);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildYesNo(Map<String, dynamic> field, String label) {
    final yes = field['yes'] as int? ?? 0;
    final total = field['total'] as int? ?? 0;
    final pct = field['percentage'] as num? ?? 0;
    final emoji = pct >= 80 ? '✅' : pct >= 50 ? '⚠️' : '❌';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Text(
                '$emoji ${pct.round()}%',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: pct >= 80
                      ? const Color(0xFF43A047)
                      : pct >= 50
                          ? const Color(0xFFFF8F00)
                          : const Color(0xFFE53935),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: pct / 100,
              backgroundColor: Colors.grey[200],
              valueColor: AlwaysStoppedAnimation(
                pct >= 80
                    ? const Color(0xFF43A047)
                    : pct >= 50
                        ? const Color(0xFFFF8F00)
                        : const Color(0xFFE53935),
              ),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '$yes / $total',
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 10,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvg(Map<String, dynamic> field, String label) {
    final avg = field['avg']?.toString() ?? 'N/A';
    return _statTile(label, avg, Icons.analytics_rounded);
  }

  Widget _buildSum(Map<String, dynamic> field, String label) {
    final sum = field['sum']?.toString() ?? 'N/A';
    return _statTile(label, sum, Icons.add_circle_rounded);
  }

  Widget _buildCount(Map<String, dynamic> field, String label) {
    final count = field['count']?.toString() ?? 'N/A';
    return _statTile(label, count, Icons.tag_rounded);
  }

  Widget _buildBar(Map<String, dynamic> field, String label) {
    final distribution = field['distribution'] as Map? ?? {};
    if (distribution.isEmpty) return const SizedBox.shrink();

    final entries = distribution.entries.toList();
    final maxVal = entries.fold<int>(
        0,
        (max, e) =>
            (e.value as num? ?? 0).toInt() > max
                ? (e.value as num? ?? 0).toInt()
                : max);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          ...entries.take(5).map((e) {
            final val = (e.value as num?)?.toInt() ?? 0;
            final pct = maxVal > 0 ? val / maxVal : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: Text(
                      e.key.toString(),
                      style: const TextStyle(
                          fontFamily: 'Tajawal', fontSize: 11),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Expanded(
                    flex: 4,
                    child: Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 6),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(3),
                        child: LinearProgressIndicator(
                          value: pct,
                          backgroundColor: Colors.grey[200],
                          valueColor:
                              AlwaysStoppedAnimation(color),
                          minHeight: 5,
                        ),
                      ),
                    ),
                  ),
                  SizedBox(
                    width: 30,
                    child: Text(
                      '$val',
                      textAlign: TextAlign.left,
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: color,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _statTile(String label, String value, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                  fontFamily: 'Tajawal', fontSize: 12),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// Helper widgets
// ═══════════════════════════════════════════════════════════

class _FilterChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.icon,
    required this.color,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 8),
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: selected ? color : Colors.grey[100],
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? color : Colors.grey[300]!,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon,
                  size: 15,
                  color: selected ? Colors.white : Colors.grey[600]),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 12,
                  fontWeight:
                      selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? Colors.white : Colors.grey[700],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GeneralReportCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _GeneralReportCard({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.08),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const Spacer(),
            Text(
              label,
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              subtitle,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 10,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ExportButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ExportButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorRetry extends StatelessWidget {
  final String msg;
  final VoidCallback onRetry;

  const _ErrorRetry({required this.msg, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.error_outline, size: 48, color: Colors.grey[400]),
          const SizedBox(height: 12),
          Text(msg,
              style: TextStyle(
                  fontFamily: 'Tajawal', color: Colors.grey[600])),
          const SizedBox(height: 8),
          TextButton(onPressed: onRetry, child: const Text('إعادة المحاولة')),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// Analytics Provider — calls get_form_analytics RPC
// ═══════════════════════════════════════════════════════════

class _AnalyticsParams {
  final String formId;
  final int? campaignRound;

  const _AnalyticsParams({required this.formId, this.campaignRound});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is _AnalyticsParams &&
          formId == other.formId &&
          campaignRound == other.campaignRound;

  @override
  int get hashCode => formId.hashCode ^ campaignRound.hashCode;
}

final _formAnalyticsProvider = FutureProvider.family<
    Map<String, dynamic>, _AnalyticsParams>((ref, params) async {
  final db = ref.read(databaseServiceProvider);
  final result = await db.rpcSingle('get_form_analytics', params: {
    'p_form_id': params.formId,
    'p_campaign_round': params.campaignRound,
    'p_governorate_id': null,
  });
  return Map<String, dynamic>.from(result ?? {});
});
