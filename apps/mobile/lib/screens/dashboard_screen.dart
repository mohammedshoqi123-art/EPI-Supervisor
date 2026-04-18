import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';
import 'dashboard_header.dart';
import 'dashboard_charts.dart';
import 'dashboard_report.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen>
    with TickerProviderStateMixin {
  late AnimationController _headerAnim;
  late AnimationController _cardsAnim;
  late AnimationController _pulseAnim;
  int _selectedQuickAction = -1;

  @override
  void initState() {
    super.initState();
    _headerAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _cardsAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _pulseAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _headerAnim.forward();
    Future.delayed(
      const Duration(milliseconds: 200),
      () => _cardsAnim.forward(),
    );
    _pulseAnim.repeat(reverse: true);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(syncServiceProvider.future).then((service) {
        if (service.currentState.pendingCount > 0) {
          service.sync().catchError((_) => SyncCycleResult.empty());
        }
      }).catchError((_) => null);
    });
  }

  @override
  void dispose() {
    _headerAnim.dispose();
    _cardsAnim.dispose();
    _pulseAnim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final analytics = ref.watch(
      dashboardAnalyticsProvider(
        AnalyticsFilter(campaignType: ref.read(campaignProvider).value),
      ),
    );
    final authState = ref.watch(authStateProvider);
    final pendingAsync = ref.watch(syncPendingCountProvider);
    final pendingCount = pendingAsync.valueOrNull ?? 0;

    return Scaffold(
      body: RefreshIndicator(
        color: AppTheme.primaryColor,
        onRefresh: () async {
          HapticFeedback.mediumImpact();
          if (!ConnectivityUtils.isOnline) return;
          await ref.read(forceRefreshProvider)('dashboard_analytics');
          ref.invalidate(
            dashboardAnalyticsProvider(
              AnalyticsFilter(campaignType: ref.read(campaignProvider).value),
            ),
          );
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: DashboardHeroHeader(
                userName: authState.valueOrNull?.fullName ?? 'مستخدم',
                campaignLabel: ref.read(campaignProvider).displayLabel,
                headerAnim: _headerAnim,
                pulseAnim: _pulseAnim,
                onNotificationsTap: () => context.go('/notifications'),
              ),
            ),
            if (pendingCount > 0)
              SliverToBoxAdapter(
                child: DashboardSyncBanner(
                  pendingCount: pendingCount,
                  onSyncTap: () => ref.read(syncServiceProvider.future).then(
                        (s) =>
                            s.sync().catchError((_) => SyncCycleResult.empty()),
                      ),
                ),
              ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: analytics.when(
                loading: () => SliverList(
                  delegate: SliverChildListDelegate([
                    const SizedBox(height: 200),
                    const Center(child: EpiLoading.shimmer()),
                  ]),
                ),
                error: (e, _) => SliverList(
                  delegate: SliverChildListDelegate([
                    const SizedBox(height: 100),
                    EpiErrorWidget(
                      message: e.toString(),
                      onRetry: () => ref.invalidate(
                        dashboardAnalyticsProvider(
                          AnalyticsFilter(
                            campaignType: ref.read(campaignProvider).value,
                          ),
                        ),
                      ),
                    ),
                  ]),
                ),
                data: (data) => _buildDashboardContent(data),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  SliverList _buildDashboardContent(Map<String, dynamic> data) {
    final submissions = data['submissions'] as Map<String, dynamic>? ?? {};
    final shortages = data['shortages'] as Map<String, dynamic>? ?? {};
    final total = submissions['total'] as int? ?? 0;
    final today = submissions['today'] as int? ?? 0;
    final totalShortages = shortages['total'] as int? ?? 0;
    final resolved = shortages['resolved'] as int? ?? 0;
    final bySeverity = shortages['bySeverity'] as Map<String, dynamic>? ?? {};
    final critical = bySeverity['critical'] as int? ?? 0;
    final completionRate =
        totalShortages > 0 ? ((resolved / totalShortages) * 100).round() : 0;

    return SliverList(
      delegate: SliverChildListDelegate([
        DashboardKPIGrid(
          total: total,
          today: today,
          shortages: totalShortages,
          resolved: resolved,
          critical: critical,
          completionRate: completionRate,
          cardsAnim: _cardsAnim,
        ),
        const SizedBox(height: 20),
        DashboardHealthRing(data: data),
        const SizedBox(height: 20),
        _sectionTitle('إجراءات سريعة'),
        const SizedBox(height: 12),
        DashboardQuickActions(
          selectedAction: _selectedQuickAction,
          onActionTapDown: (i) => setState(() => _selectedQuickAction = i),
          onActionTapCancel: () => setState(() => _selectedQuickAction = -1),
          onExportPdf: _exportPdfReport,
        ),
        const SizedBox(height: 20),
        _sectionTitle('توزيع الحالات'),
        const SizedBox(height: 12),
        DashboardStatusDonut(
          data: submissions['byStatus'] as Map<String, dynamic>? ?? {},
        ),
        const SizedBox(height: 20),
        _sectionTitle('النشاط الأسبوعي'),
        const SizedBox(height: 12),
        DashboardTrendLine(
          dayData: submissions['byDay'] as Map<String, dynamic>? ?? {},
        ),
        const SizedBox(height: 20),
        _sectionTitle('آخر النشاطات'),
        const SizedBox(height: 12),
        DashboardActivityFeed(data: data),
        const SizedBox(height: 20),
      ]),
    );
  }

  Widget _sectionTitle(String title) {
    return Row(
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
        Text(
          title,
          style: const TextStyle(
            fontFamily: 'Cairo',
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  void _exportPdfReport() {
    DashboardReportExporter.showExportSheet(
      context: context,
      onGenerate: (type) => DashboardReportExporter.generateAndShare(
        context: context,
        type: type,
        analyticsData: ref
            .read(
              dashboardAnalyticsProvider(
                AnalyticsFilter(campaignType: ref.read(campaignProvider).value),
              ),
            )
            .valueOrNull,
        fetchGovRanking: () async {
          try {
            return await ref
                .read(analyticsServiceProvider)
                .getGovernorateRanking();
          } catch (_) {
            return null;
          }
        },
        fetchShortages: () async {
          try {
            return await ref.read(databaseServiceProvider).getShortages();
          } catch (_) {
            return null;
          }
        },
      ),
    );
  }
}
