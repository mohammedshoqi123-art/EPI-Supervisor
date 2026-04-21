import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_providers.dart';

// ═══════════════════════════════════════════════════════════════════════
//  Readiness Data Model
// ═══════════════════════════════════════════════════════════════════════

enum ReadinessStatus { ready, partial, notReady, unknown }

class GovernorateReadiness {
  final String governorateId;
  final String governorateName;
  final ReadinessStatus status;
  final bool? budgetReceived;
  final bool? routineVaccines;
  final bool? medicines;
  final bool? reproductiveSupplies;
  final bool? staffAvailable;
  final bool? meetingHeld;
  final String? postponementReasons;
  final String? postponedDate;
  final DateTime lastUpdated;
  final String supervisorTitle;
  final int submissionCount;

  const GovernorateReadiness({
    required this.governorateId,
    required this.governorateName,
    required this.status,
    this.budgetReceived,
    this.routineVaccines,
    this.medicines,
    this.reproductiveSupplies,
    this.staffAvailable,
    this.meetingHeld,
    this.postponementReasons,
    this.postponedDate,
    required this.lastUpdated,
    required this.supervisorTitle,
    required this.submissionCount,
  });

  int get completedCriteria {
    int count = 0;
    if (budgetReceived == true) count++;
    if (routineVaccines == true) count++;
    if (medicines == true) count++;
    if (reproductiveSupplies == true) count++;
    if (staffAvailable == true) count++;
    if (meetingHeld == true) count++;
    return count;
  }

  double get completionPercent => completedCriteria / 6.0;

  static ReadinessStatus parseStatus(String? value) {
    switch (value) {
      case 'جاهزة':
        return ReadinessStatus.ready;
      case 'جاهزة جزئياً':
      case 'جاهزة جزئيا':
        return ReadinessStatus.partial;
      case 'غير جاهزة':
        return ReadinessStatus.notReady;
      default:
        return ReadinessStatus.unknown;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  Readiness Provider
// ═══════════════════════════════════════════════════════════════════════

/// Readiness form ID for Integrated SIA
const _readinessFormId = '8aa0f3d5-7ab0-430f-85fd-4488c0c129bb';

final readinessDataProvider =
    FutureProvider<List<GovernorateReadiness>>((ref) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);
  final govData = await ref.watch(governoratesProvider.future);

  // Build governorate name lookup
  final govNames = <String, String>{};
  for (final g in govData) {
    govNames[g['id'] as String] = g['name_ar'] as String? ?? 'غير محدد';
  }

  // Fetch all readiness submissions
  final submissions = await cache.getList(
    'readiness_submissions_integrated',
    () => ref.read(databaseServiceProvider).getSubmissions(
          formId: _readinessFormId,
          limit: 500,
        ),
    maxAge: const Duration(hours: 2),
  );

  // Group by governorate — take latest submission per governorate
  final latestByGov = <String, Map<String, dynamic>>{};
  final countByGov = <String, int>{};

  for (final sub in submissions) {
    final data = sub['data'] as Map<String, dynamic>? ?? {};
    final govId =
        data['governorate_id'] as String? ?? sub['governorate_id'] as String?;
    if (govId == null) continue;

    countByGov[govId] = (countByGov[govId] ?? 0) + 1;

    final existing = latestByGov[govId];
    final createdAt = DateTime.tryParse(sub['created_at'] as String? ?? '') ??
        DateTime(2000);

    if (existing == null) {
      latestByGov[govId] = sub;
    } else {
      final existingDate =
          DateTime.tryParse(existing['created_at'] as String? ?? '') ??
              DateTime(2000);
      if (createdAt.isAfter(existingDate)) {
        latestByGov[govId] = sub;
      }
    }
  }

  // Convert to GovernorateReadiness objects
  final results = <GovernorateReadiness>[];
  latestByGov.forEach((govId, sub) {
    final data = sub['data'] as Map<String, dynamic>? ?? {};
    final readyStr = data['ready_for_launch'] as String?;
    final status = GovernorateReadiness.parseStatus(readyStr);
    final createdAt =
        DateTime.tryParse(sub['created_at'] as String? ?? '') ?? DateTime(2000);

    results.add(GovernorateReadiness(
      governorateId: govId,
      governorateName: govNames[govId] ?? 'غير محدد',
      status: status,
      budgetReceived: data['budget_received'] as bool?,
      routineVaccines: data['routine_vaccines_available'] as bool?,
      medicines: data['medicines_available'] as bool?,
      reproductiveSupplies: data['reproductive_supplies_available'] as bool?,
      staffAvailable: data['staff_available'] as bool?,
      meetingHeld: data['preparatory_meeting_held'] as bool?,
      postponementReasons: data['postponement_reasons'] as String?,
      postponedDate: data['postponed_launch_date'] as String?,
      lastUpdated: createdAt,
      supervisorTitle: data['supervisor_title'] as String? ?? '',
      submissionCount: countByGov[govId] ?? 1,
    ));
  });

  // Sort: not ready first, then partial, then ready
  results.sort((a, b) {
    final order = {
      ReadinessStatus.notReady: 0,
      ReadinessStatus.partial: 1,
      ReadinessStatus.unknown: 2,
      ReadinessStatus.ready: 3,
    };
    final cmp = (order[a.status] ?? 9).compareTo(order[b.status] ?? 9);
    if (cmp != 0) return cmp;
    return a.governorateName.compareTo(b.governorateName);
  });

  return results;
});

// ═══════════════════════════════════════════════════════════════════════
//  Analytics Screen
// ═══════════════════════════════════════════════════════════════════════

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'تحليلات النشاط الإيصال التكاملي',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700),
        ),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: theme.colorScheme.primary,
          labelStyle:
              const TextStyle(fontFamily: 'Tajawal', fontWeight: FontWeight.w600),
          unselectedLabelStyle: const TextStyle(fontFamily: 'Tajawal'),
          tabs: const [
            Tab(icon: Icon(Icons.verified_user_rounded), text: 'الجاهزية'),
            Tab(icon: Icon(Icons.bar_chart_rounded), text: 'الإشراف'),
            Tab(icon: Icon(Icons.warning_amber_rounded), text: 'النواقص'),
            Tab(icon: Icon(Icons.numbers_rounded), text: 'الأرقام'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _ReadinessTab(),
          _SupervisionTab(),
          _ShortagesTab(),
          _NumbersTab(),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  Tab 1: Governorate Readiness
// ═══════════════════════════════════════════════════════════════════════

class _ReadinessTab extends ConsumerWidget {
  const _ReadinessTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final readinessAsync = ref.watch(readinessDataProvider);

    return readinessAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, st) => _ErrorWidget(
        message: 'فشل تحميل بيانات الجاهزية',
        onRetry: () => ref.invalidate(readinessDataProvider),
      ),
      data: (data) {
        if (data.isEmpty) {
          return const _EmptyWidget(
            icon: Icons.assessment_outlined,
            message: 'لا توجد بيانات جاهزية حتى الآن',
          );
        }

        final ready = data.where((r) => r.status == ReadinessStatus.ready).length;
        final partial =
            data.where((r) => r.status == ReadinessStatus.partial).length;
        final notReady =
            data.where((r) => r.status == ReadinessStatus.notReady).length;

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(readinessDataProvider);
            await ref.read(readinessDataProvider.future);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Summary cards
              _ReadinessSummaryCards(
                total: data.length,
                ready: ready,
                partial: partial,
                notReady: notReady,
              ),
              const SizedBox(height: 16),

              // Section title
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text(
                  'جدول جاهزية المحافظات',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 4),

              // Table
              _ReadinessTable(data: data),
            ],
          ),
        );
      },
    );
  }
}

class _ReadinessSummaryCards extends StatelessWidget {
  final int total, ready, partial, notReady;
  const _ReadinessSummaryCards({
    required this.total,
    required this.ready,
    required this.partial,
    required this.notReady,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _SummaryCard(
            label: 'جاهزة',
            count: ready,
            total: total,
            color: Colors.green,
            icon: Icons.check_circle_rounded,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _SummaryCard(
            label: 'جزئياً',
            count: partial,
            total: total,
            color: Colors.orange,
            icon: Icons.warning_rounded,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _SummaryCard(
            label: 'غير جاهزة',
            count: notReady,
            total: total,
            color: Colors.red,
            icon: Icons.cancel_rounded,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _SummaryCard(
            label: 'الإجمالي',
            count: total,
            total: total,
            color: Colors.blue,
            icon: Icons.location_city_rounded,
          ),
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final int count, total;
  final Color color;
  final IconData icon;

  const _SummaryCard({
    required this.label,
    required this.count,
    required this.total,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final pct = total > 0 ? (count / total * 100).toStringAsFixed(0) : '0';
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 4),
          Text(
            '$count',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          Text(
            '$pct%',
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 11,
              color: color.withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _ReadinessTable extends StatelessWidget {
  final List<GovernorateReadiness> data;
  const _ReadinessTable({required this.data});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.dividerColor),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Column(
          children: [
            // Header row
            _TableRow(
              isHeader: true,
              cells: [
                _TableCellData('المحافظة', flex: 3),
                _TableCellData('الحالة', flex: 2),
                _TableCellData('المعايير', flex: 2),
                _TableCellData('آخر تحديث', flex: 2),
              ],
            ),
            // Data rows
            ...data.map((r) => _ReadinessRow(data: r)),
          ],
        ),
      ),
    );
  }
}

class _ReadinessRow extends StatelessWidget {
  final GovernorateReadiness data;
  const _ReadinessRow({required this.data});

  @override
  Widget build(BuildContext context) {
    final (statusIcon, statusText, statusColor) = switch (data.status) {
      ReadinessStatus.ready => ('✅', 'جاهزة', Colors.green),
      ReadinessStatus.partial => ('⚠️', 'جزئياً', Colors.orange),
      ReadinessStatus.notReady => ('❌', 'غير جاهزة', Colors.red),
      ReadinessStatus.unknown => ('❓', 'غير محدد', Colors.grey),
    };

    final hasReasons = data.postponementReasons != null &&
        data.postponementReasons!.trim().isNotEmpty;

    return InkWell(
      onTap: () => _showDetailSheet(context, data),
      child: Column(
        children: [
          _TableRow(
            cells: [
              _TableCellData(data.governorateName, flex: 3),
              _TableCellData('$statusIcon $statusText', flex: 2, color: statusColor),
              _TableCellData('${data.completedCriteria}/6', flex: 2),
              _TableCellData(
                '${data.lastUpdated.day}/${data.lastUpdated.month}',
                flex: 2,
              ),
            ],
          ),
          // Show postponement reasons inline if not ready
          if (hasReasons && data.status == ReadinessStatus.notReady)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              color: Colors.red.withValues(alpha: 0.06),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, size: 14, color: Colors.red),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'سبب: ${data.postponementReasons}',
                      style: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 11,
                        color: Colors.red,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          Divider(height: 1, color: Theme.of(context).dividerColor.withValues(alpha: 0.3)),
        ],
      ),
    );
  }

  void _showDetailSheet(BuildContext context, GovernorateReadiness r) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        minChildSize: 0.4,
        expand: false,
        builder: (_, controller) => _ReadinessDetailSheet(
          data: r,
          scrollController: controller,
        ),
      ),
    );
  }
}

class _ReadinessDetailSheet extends StatelessWidget {
  final GovernorateReadiness data;
  final ScrollController scrollController;
  const _ReadinessDetailSheet({
    required this.data,
    required this.scrollController,
  });

  @override
  Widget build(BuildContext context) {
    final (statusIcon, statusText, statusColor) = switch (data.status) {
      ReadinessStatus.ready => ('✅', 'جاهزة', Colors.green),
      ReadinessStatus.partial => ('⚠️', 'جاهزة جزئياً', Colors.orange),
      ReadinessStatus.notReady => ('❌', 'غير جاهزة', Colors.red),
      ReadinessStatus.unknown => ('❓', 'غير محدد', Colors.grey),
    };

    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.all(24),
      children: [
        // Handle
        Center(
          child: Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Governorate name
        Text(
          data.governorateName,
          style: const TextStyle(
            fontFamily: 'Cairo',
            fontSize: 24,
            fontWeight: FontWeight.w800,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),

        // Status badge
        Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: statusColor.withValues(alpha: 0.3)),
            ),
            child: Text(
              '$statusIcon $statusText',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: statusColor,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Center(
          child: Text(
            '${data.completedCriteria} من 6 معايير مكتملة (${(data.completionPercent * 100).toStringAsFixed(0)}%)',
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 13,
              color: Colors.grey.shade600,
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Criteria checklist
        const Text(
          'معايير الجاهزية',
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        _CriteriaItem(label: 'استلام الميزانية المالية', value: data.budgetReceived),
        _CriteriaItem(label: 'توفر اللقاحات الروتينية', value: data.routineVaccines),
        _CriteriaItem(label: 'توفر الأدوية', value: data.medicines),
        _CriteriaItem(
            label: 'توفر مستلزمات الصحة الإنجابية',
            value: data.reproductiveSupplies),
        _CriteriaItem(label: 'توفر الكادر الصحي', value: data.staffAvailable),
        _CriteriaItem(
            label: 'الاجتماع التحضيري للحملة', value: data.meetingHeld),

        const SizedBox(height: 16),

        // Postponement info
        if (data.status == ReadinessStatus.notReady ||
            data.status == ReadinessStatus.partial) ...[
          const Text(
            'معلومات التأجيل',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          if (data.postponementReasons != null &&
              data.postponementReasons!.trim().isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'أسباب التأجيل:',
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    data.postponementReasons!,
                    style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          if (data.postponedDate != null && data.postponedDate!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'تاريخ التدشين المؤجل: ${data.postponedDate}',
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 13,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ],

        const SizedBox(height: 16),

        // Meta info
        Row(
          children: [
            Icon(Icons.person_outline, size: 16, color: Colors.grey.shade500),
            const SizedBox(width: 4),
            Text(
              data.supervisorTitle,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 12,
                color: Colors.grey.shade500,
              ),
            ),
            const Spacer(),
            Icon(Icons.update, size: 16, color: Colors.grey.shade500),
            const SizedBox(width: 4),
            Text(
              '${data.lastUpdated.day}/${data.lastUpdated.month}/${data.lastUpdated.year}',
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 12,
                color: Colors.grey.shade500,
              ),
            ),
          ],
        ),
        Text(
          'عدد الإرساليات: ${data.submissionCount}',
          style: TextStyle(
            fontFamily: 'Tajawal',
            fontSize: 12,
            color: Colors.grey.shade500,
          ),
        ),
      ],
    );
  }
}

class _CriteriaItem extends StatelessWidget {
  final String label;
  final bool? value;
  const _CriteriaItem({required this.label, this.value});

  @override
  Widget build(BuildContext context) {
    final icon = value == true
        ? Icons.check_circle_rounded
        : value == false
            ? Icons.cancel_rounded
            : Icons.help_outline_rounded;
    final color = value == true
        ? Colors.green
        : value == false
            ? Colors.red
            : Colors.grey;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  Shared Table Widgets
// ═══════════════════════════════════════════════════════════════════════

class _TableCellData {
  final String text;
  final int flex;
  final Color? color;
  const _TableCellData(this.text, {this.flex = 1, this.color});
}

class _TableRow extends StatelessWidget {
  final List<_TableCellData> cells;
  final bool isHeader;
  const _TableRow({required this.cells, this.isHeader = false});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bgColor =
        isHeader ? theme.colorScheme.primary.withValues(alpha: 0.08) : null;

    return Container(
      color: bgColor,
      padding: EdgeInsets.symmetric(
        horizontal: 12,
        vertical: isHeader ? 10 : 8,
      ),
      child: Row(
        children: cells.map((c) {
          return Expanded(
            flex: c.flex,
            child: Text(
              c.text,
              style: TextStyle(
                fontFamily: isHeader ? 'Cairo' : 'Tajawal',
                fontSize: isHeader ? 12 : 13,
                fontWeight: isHeader ? FontWeight.w700 : FontWeight.w500,
                color: c.color,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  Placeholder Tabs (to be built next)
// ═══════════════════════════════════════════════════════════════════════

class _SupervisionTab extends StatelessWidget {
  const _SupervisionTab();
  @override
  Widget build(BuildContext context) {
    return const _EmptyWidget(
      icon: Icons.bar_chart_rounded,
      message: 'تحليلات الإشراف — قيد التطوير',
    );
  }
}

class _ShortagesTab extends StatelessWidget {
  const _ShortagesTab();
  @override
  Widget build(BuildContext context) {
    return const _EmptyWidget(
      icon: Icons.warning_amber_rounded,
      message: 'تحليلات النواقص — قيد التطوير',
    );
  }
}

class _NumbersTab extends StatelessWidget {
  const _NumbersTab();
  @override
  Widget build(BuildContext context) {
    return const _EmptyWidget(
      icon: Icons.numbers_rounded,
      message: 'تحليلات الأعداد — قيد التطوير',
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  Shared UI
// ═══════════════════════════════════════════════════════════════════════

class _ErrorWidget extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorWidget({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 12),
            Text(
              message,
              style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text(
                'إعادة المحاولة',
                style: TextStyle(fontFamily: 'Tajawal'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyWidget extends StatelessWidget {
  final IconData icon;
  final String message;
  const _EmptyWidget({required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(
              message,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 16,
                color: Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
