import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';
import '../services/memos_feedback_service.dart';
import 'dashboard_header.dart';
import 'dashboard_charts.dart';
import 'dashboard_widgets.dart';

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
    // ═══ PERFORMANCE FIX: Pulse once then stop — was infinite 60fps rebuilds ═══
    _pulseAnim.forward();
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) _pulseAnim.stop();
    });

    // ═══ NO auto-refresh on connectivity — user presses sync button ═══

    WidgetsBinding.instance.addPostFrameCallback((_) {
      // ═══ PERFORMANCE: Background sync — don't block UI ═══
      // ═══ FIX: فقط إذا كان الـ pendingCount > 0 و isOnline ═══
      Future.microtask(() async {
        try {
          // ⚠️ OFFLINE FIX: فحص مزدوج — isOnline و isConfigured
          if (!ConnectivityUtils.isOnline) return;
          if (!SupabaseConfig.isConfigured) return;
          SyncService? service;
          try {
            service = await ref.read(syncServiceProvider.future).timeout(
              const Duration(seconds: 5),
            );
          } on TimeoutException {
            service = null;
          }
          if (service == null) return;
          if (service.currentState.pendingCount > 0) {
            await service.sync().timeout(
              const Duration(seconds: 30),
              onTimeout: () => SyncCycleResult.empty(),
            );
          }
        } catch (e) {
          debugPrint('[Dashboard] Background sync failed: $e');
        }
      });
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
    // ═══ PERFORMANCE: Use .select() to minimize rebuild scope ═══
    final analytics = ref.watch(
      dashboardAnalyticsProvider(
        AnalyticsFilter(campaignType: ref.watch(campaignProvider).value, campaignRound: ref.watch(campaignRoundProvider)),
      ),
    );
    final authState = ref.watch(authStateProvider);
    final pendingCount = ref.watch(
      syncPendingCountProvider.select((v) => v.valueOrNull ?? 0),
    );
    final unreadNotifs = ref.watch(
      notificationCountProvider.select((v) => v.valueOrNull ?? 0),
    );
    final localDrafts = ref.watch(
      localDraftCountProvider.select((v) => v.valueOrNull ?? 0),
    );

    return Scaffold(
      body: RefreshIndicator(
        color: AppTheme.primaryColor,
        onRefresh: () async {
          HapticFeedback.mediumImpact();
          // ═══ FIX: فحص isOnline قبل أي محاولة شبكة ═══
          if (!ConnectivityUtils.isOnline) {
            // اعرض رسالة بدل ما تعلق
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('لا يمكن التحديث بدون إنترنت',
                      style: TextStyle(fontFamily: 'Tajawal')),
                  behavior: SnackBarBehavior.floating,
                  backgroundColor: Colors.orange,
                  duration: Duration(seconds: 2),
                ),
              );
            }
            return;
          }
          await ref.read(forceRefreshProvider)('dashboard_analytics');
          ref.invalidate(
            dashboardAnalyticsProvider(
              AnalyticsFilter(campaignType: ref.watch(campaignProvider).value, campaignRound: ref.watch(campaignRoundProvider)),
            ),
          );
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ═══ P1-1: Filter bar — campaign + round filter chips ═══
            SliverToBoxAdapter(
              child: DashboardFilterBar(
                campaignLabel: ref.watch(campaignProvider).displayLabel,
                campaignRound: ref.watch(campaignRoundProvider),
                showRoundFilter: ref.watch(campaignProvider).value == 'integrated_activity',
                onCampaignTap: () => _showCampaignSelector(),
                onRoundTap: () => _showRoundSelector(),
                onRefresh: () {
                  HapticFeedback.mediumImpact();
                  // ═══ FIX: فحص isOnline + رسالة واضحة ═══
                  if (!ConnectivityUtils.isOnline) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('لا يمكن التحديث بدون إنترنت',
                            style: TextStyle(fontFamily: 'Tajawal')),
                        behavior: SnackBarBehavior.floating,
                        backgroundColor: Colors.orange,
                        duration: Duration(seconds: 2),
                      ),
                    );
                    return;
                  }
                  ref.read(forceRefreshProvider)('dashboard_analytics');
                  ref.invalidate(
                    dashboardAnalyticsProvider(
                      AnalyticsFilter(
                        campaignType: ref.watch(campaignProvider).value,
                        campaignRound: ref.watch(campaignRoundProvider),
                      ),
                    ),
                  );
                },
              ),
            ),
            SliverToBoxAdapter(
              child: DashboardHeroHeader(
                userName: authState.valueOrNull?.fullName ?? 'مستخدم',
                campaignLabel: ref.watch(campaignProvider).displayLabel,
                unreadNotifications: unreadNotifs,
                unreadCommunication: _computeUnreadCommunication(ref),
                headerAnim: _headerAnim,
                pulseAnim: _pulseAnim,
                onNotificationsTap: () => context.go('/notifications'),
                onCommunicationTap: () => context.go('/chat'),
              ),
            ),
            // ═══ P1-5: Sync status bar ═══
            SliverToBoxAdapter(
              child: SyncStatusBar(
                pendingCount: pendingCount,
                isSyncing: false,
                onSync: () async {
                  HapticFeedback.mediumImpact();
                  // ═══ FIX: فحص isOnline + رسالة واضحة ═══
                  if (!ConnectivityUtils.isOnline) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('لا يمكن المزامنة بدون إنترنت',
                            style: TextStyle(fontFamily: 'Tajawal')),
                        behavior: SnackBarBehavior.floating,
                        backgroundColor: Colors.orange,
                        duration: Duration(seconds: 2),
                      ),
                    );
                    return;
                  }
                  try {
                    SyncService? service;
                    try {
                      service = await ref.read(syncServiceProvider.future).timeout(
                        const Duration(seconds: 5),
                      );
                    } on TimeoutException {
                      service = null;
                    }
                    if (service == null) return;
                    await service.sync().timeout(
                      const Duration(seconds: 30),
                      onTimeout: () => SyncCycleResult.empty(),
                    );
                  } catch (e) {
                    debugPrint('[Dashboard] Manual sync failed: $e');
                  }
                },
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
                            campaignType: ref.watch(campaignProvider).value,
                          ),
                        ),
                      ),
                    ),
                  ]),
                ),
                data: (data) => _buildDashboardContent(data, localDrafts),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  /// Compute unread communication count (memos + feedback tickets)
  /// Uses ref.watch for reactive updates (badge updates automatically)
  int _computeUnreadCommunication(WidgetRef ref) {
    int count = 0;
    // Unread memos (need acknowledgment)
    final memosAsync = ref.watch(memosProvider);
    final memos = memosAsync.valueOrNull ?? [];
    count += memos.where((m) => m.needsUrgentAcknowledgment).length;

    // Pending feedback tickets (not resolved/closed)
    final ticketsAsync = ref.watch(feedbackTicketsProvider('all'));
    final tickets = ticketsAsync.valueOrNull ?? [];
    count += tickets
        .where((t) => t.status != 'resolved' && t.status != 'closed')
        .length;

    return count;
  }

  SliverList _buildDashboardContent(
      Map<String, dynamic> data, int localDrafts) {
    final submissions = data['submissions'] as Map<String, dynamic>? ?? {};
    final total = submissions['total'] as int? ?? 0;
    final today = submissions['today'] as int? ?? 0;
    final drafts = localDrafts;

    return SliverList(
      delegate: SliverChildListDelegate([
        DashboardKPIGrid(
          total: total,
          today: today,
          drafts: drafts,
          cardsAnim: _cardsAnim,
        ),
        const SizedBox(height: 20),
        _sectionTitle('إجراءات سريعة'),
        const SizedBox(height: 12),
        DashboardQuickActions(
          selectedAction: _selectedQuickAction,
          onActionTapDown: (i) => setState(() => _selectedQuickAction = i),
          onActionTapCancel: () => setState(() => _selectedQuickAction = -1),
        ),
        const SizedBox(height: 20),
        _sectionTitle('النشاط الأسبوعي'),
        const SizedBox(height: 12),
        DashboardTrendLine(
          dayData: submissions['byDay'] as Map<String, dynamic>? ?? {},
        ),
        const SizedBox(height: 20),
        // ═══ P1-4: Governorate ranking — fetch independently ═══
        _sectionTitle('ترتيب المحافظات'),
        const SizedBox(height: 12),
        _buildGovernorateRanking(),
        const SizedBox(height: 20),
      ]),
    );
  }

  /// Fetch governorate ranking independently (not from analytics data)
  Widget _buildGovernorateRanking() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _getGovernorateRanking(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Container(
            height: 180,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(child: CircularProgressIndicator()),
          );
        }
        if (snapshot.hasError || !snapshot.hasData || snapshot.data!.isEmpty) {
          return Container(
            height: 100,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Center(
              child: Text('لا توجد بيانات للمحافظات', style: TextStyle(
                fontFamily: 'Tajawal', fontSize: 13,
                color: AppTheme.textHint.withValues(alpha: 0.5),
              )),
            ),
          );
        }

        final govCounts = <String, int>{};
        for (final g in snapshot.data!) {
          final name = g['name_ar'] as String? ?? 'غير محدد';
          final count = (g['count'] as num?)?.toInt() ?? 0;
          if (count > 0) govCounts[name] = count;
        }
        final sortedGovs = govCounts.entries.toList()
          ..sort((a, b) => b.value.compareTo(a.value));

        return GovernorateRankingChart(governorateData: sortedGovs);
      },
    );
  }

  /// ═══ PERFORMANCE FIX: Cache the future to prevent re-fetching on every build ═══
  /// Previously: FutureBuilder called _getGovernorateRanking() on every rebuild,
  /// creating a NEW future each time → constant network calls + spinner flicker.
  /// Now: future is created once and reused until campaign/round changes.
  Future<List<Map<String, dynamic>>>? _govRankingFuture;
  String? _govRankingCacheKey;

  Future<List<Map<String, dynamic>>> _getGovernorateRanking() async {
    // Return cached future if campaign/round hasn't changed
    final currentKey = '${ref.read(campaignProvider).value}_${ref.read(campaignRoundProvider)}';
    if (_govRankingFuture != null && _govRankingCacheKey == currentKey) {
      return _govRankingFuture!;
    }
    _govRankingCacheKey = currentKey;
    _govRankingFuture = _fetchGovernorateRanking();
    return _govRankingFuture!;
  }

  Future<List<Map<String, dynamic>>> _fetchGovernorateRanking() async {
    try {
      final analyticsService = ref.read(analyticsServiceProvider);
      final round = ref.read(campaignRoundProvider);
      return await analyticsService.getGovernorateRanking(
        campaignRound: ref.read(campaignProvider).value == 'integrated_activity' ? round : null,
      );
    } catch (e) {
      debugPrint('[Dashboard] Gov ranking failed: $e');
      return [];
    }
  }

  void _showCampaignSelector() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
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
            const SizedBox(height: 16),
            const Text('اختر النشاط', style: TextStyle(fontFamily: 'Cairo', fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            ...[
              ('polio_campaign', 'حملة شلل الأطفال', Icons.vaccines_rounded),
              ('integrated_activity', 'النشاط الإيصالي التكاملي', Icons.medical_services_rounded),
            ].map((item) {
              final value = item.$1;
              final label = item.$2;
              final icon = item.$3;
              final current = ref.read(campaignProvider).value;
              return ListTile(
                leading: Icon(icon, color: AppTheme.primaryColor),
                title: Text(label, style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14)),
                trailing: current == value
                    ? Icon(Icons.check_circle, color: AppTheme.primaryColor, size: 20)
                    : null,
                onTap: () {
                  HapticFeedback.lightImpact();
                  ref.read(campaignProvider.notifier).selectCampaign(CampaignType.fromString(value));
                  Navigator.pop(ctx);
                },
              );
            }),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  void _showRoundSelector() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
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
            const SizedBox(height: 16),
            const Text('اختر الجولة', style: TextStyle(fontFamily: 'Cairo', fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            ...List.generate(5, (i) {
              final round = i + 1;
              final current = ref.read(campaignRoundProvider);
              return ListTile(
                leading: Icon(
                  current == round ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                  color: AppTheme.primaryColor,
                ),
                title: Text('الجولة $round', style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14)),
                onTap: () {
                  HapticFeedback.lightImpact();
                  ref.read(campaignRoundProvider.notifier).selectRound(round);
                  Navigator.pop(ctx);
                },
              );
            }),
            const SizedBox(height: 20),
          ],
        ),
      ),
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
}
