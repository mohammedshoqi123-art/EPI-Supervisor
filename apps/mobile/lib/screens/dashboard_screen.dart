import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';
import '../providers/realtime_sync_provider.dart';
import '../services/memos_feedback_service.dart';
import 'dashboard_header.dart';
import 'dashboard_charts.dart';
import 'dashboard_widgets.dart';

// ═══ PERFORMANCE: Riverpod provider for governorate ranking ═══
// Replaces FutureBuilder to prevent re-fetching on every rebuild
final _governorateRankingProvider = FutureProvider.family
    .autoDispose<List<Map<String, dynamic>>, String>((
  ref,
  cacheKey,
) async {
  try {
    final analyticsService = ref.read(analyticsServiceProvider);
    final campaign = ref.read(campaignProvider);
    final round = ref.read(campaignRoundProvider);
    return await analyticsService.getGovernorateRanking(
      campaignRound: campaign.value == 'integrated_activity' ? round : null,
    ).timeout(const Duration(seconds: 15));
  } catch (e) {
    debugPrint('[Dashboard] Gov ranking failed: $e');
    return [];
  }
});

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

    // ═══ FIX: Realtime Sync — refresh Dashboard when data changes on server ═══
    // Previously: changes by other users required manual refresh
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        final realtimeSync = ref.read(realtimeSyncProvider);
        realtimeSync.onChange.listen((table) {
          if (!mounted) return;
          if (table == 'form_submissions' || table == 'feedback_tickets' || table == 'official_memos') {
            final campaign = ref.read(campaignProvider);
            final round = ref.read(campaignRoundProvider);
            ref.invalidate(dashboardAnalyticsProvider(
              AnalyticsFilter(campaignType: campaign.value, campaignRound: round),
            ));
            ref.invalidate(formStatsProvider);
            ref.invalidate(notificationCountProvider);
          }
        });
      } catch (e) {
        debugPrint('[Dashboard] Realtime listener setup failed: $e');
      }
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
    // Watch campaign values ONCE, reuse throughout build
    final campaignValue = ref.watch(campaignProvider.select((c) => c.value));
    final campaignDisplayLabel = ref.watch(campaignProvider.select((c) => c.displayLabel));
    final campaignRound = ref.watch(campaignRoundProvider);
    final showRoundFilter = campaignValue == 'integrated_activity';

    final analytics = ref.watch(
      dashboardAnalyticsProvider(
        AnalyticsFilter(campaignType: campaignValue, campaignRound: campaignRound),
      ),
    );
    // ═══ FIX: Only watch specific fields from authState to minimize rebuilds ═══
    final isAuthenticated = ref.watch(
      authStateProvider.select((v) => v.valueOrNull?.isAuthenticated ?? false),
    );
    final userRole = ref.watch(
      authStateProvider.select((v) => v.valueOrNull?.role),
    );
    final userName = ref.watch(
      authStateProvider.select((v) => v.valueOrNull?.fullName ?? 'مستخدم'),
    );
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
          // ═══ FIX: Clear cache + invalidate + wait for re-fetch ═══
          final filter = AnalyticsFilter(
            campaignType: ref.read(campaignProvider).value,
            campaignRound: ref.read(campaignRoundProvider),
          );
          await ref.read(forceRefreshProvider)(filter.cacheKey);
          ref.invalidate(dashboardAnalyticsProvider(filter));
          // Wait for provider to complete re-fetch
          try {
            await ref.read(dashboardAnalyticsProvider(filter).future);
          } catch (_) {}
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ═══ P1-1: Filter bar — campaign + round filter chips ═══
            SliverToBoxAdapter(
              child: DashboardFilterBar(
                campaignLabel: campaignDisplayLabel,
                campaignRound: campaignRound,
                showRoundFilter: showRoundFilter,
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
                        campaignType: campaignValue,
                        campaignRound: campaignRound,
                      ),
                    ),
                  );
                },
              ),
            ),
            SliverToBoxAdapter(
              child: DashboardHeroHeader(
                userName: userName,
                campaignLabel: campaignDisplayLabel,
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
            // ═══ Communication Center Quick Access Card ═══
            SliverToBoxAdapter(
              child: _CommunicationQuickCard(
                unreadCommunication: _computeUnreadCommunication(ref),
                onTap: () => context.go('/chat'),
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
                            campaignType: campaignValue,
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
  /// ═══ PERFORMANCE: Uses .select() to minimize rebuild scope ═══
  /// Previously: watched full memos + tickets lists → rebuild on ANY change
  /// Now: watches only the count → rebuild only when count changes
  /// Compute unread communication count (memos + feedback tickets)
  /// ═══ PERFORMANCE: Uses .select() to minimize rebuild scope ═══
  /// Previously: watched full memos + tickets lists → rebuild on ANY change
  /// Now: watches only the count → rebuild only when count changes
  int _computeUnreadCommunication(WidgetRef ref) {
    int count = 0;
    // Unread memos (need acknowledgment) — watch only the filtered count
    final memosCount = ref.watch(memosProvider.select((v) {
      final memos = v.valueOrNull ?? [];
      return memos.where((m) => m.needsUrgentAcknowledgment).length;
    }));
    count += memosCount;

    // Pending feedback tickets — watch only the filtered count
    final ticketsCount = ref.watch(feedbackTicketsProvider('all').select((v) {
      final tickets = v.valueOrNull ?? [];
      return tickets.where((t) => t.status != 'resolved' && t.status != 'closed').length;
    }));
    count += ticketsCount;

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
    final rankingAsync = ref.watch(_governorateRankingProvider(
      '${ref.read(campaignProvider).value}_${ref.read(campaignRoundProvider)}',
    ));

    return rankingAsync.when(
      loading: () => Container(
        height: 180,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Container(
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
      ),
      data: (data) {
        if (data.isEmpty) {
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
        for (final g in data) {
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
            ...CampaignType.visibleValues.map((campaign) {
              final value = campaign.value;
              final label = campaign.labelAr;
              final icon = campaign == CampaignType.polioCampaign
                  ? Icons.vaccines_rounded
                  : Icons.medical_services_rounded;
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

// ═══ Communication Quick Access Card — بارز في الصفحة الرئيسية ═══
class _CommunicationQuickCard extends StatelessWidget {
  final int unreadCommunication;
  final VoidCallback onTap;

  const _CommunicationQuickCard({
    required this.unreadCommunication,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: unreadCommunication > 0
                    ? [const Color(0xFFFF8F00), const Color(0xFFFF6D00)]
                    : [const Color(0xFF6366F1), const Color(0xFF4F46E5)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: (unreadCommunication > 0
                          ? const Color(0xFFFF8F00)
                          : const Color(0xFF6366F1))
                      .withValues(alpha: 0.3),
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
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    unreadCommunication > 0
                        ? Icons.mark_unread_chat_alt_rounded
                        : Icons.forum_rounded,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'مركز الاتصال',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        unreadCommunication > 0
                            ? '$unreadCommunication تذاكر/تعاميم جديدة بانتظارك'
                            : 'التذاكر، التعاميم، التغذية الراجعة، والمحادثات',
                        style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 12,
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                      ),
                    ],
                  ),
                ),
                if (unreadCommunication > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '$unreadCommunication',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFFFF6D00),
                      ),
                    ),
                  )
                else
                  Icon(
                    Icons.arrow_forward_ios_rounded,
                    color: Colors.white.withValues(alpha: 0.7),
                    size: 18,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
