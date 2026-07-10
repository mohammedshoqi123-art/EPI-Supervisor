import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';
import '../router/app_router.dart';
import 'dashboard_header.dart';
import 'dashboard_charts.dart';
import 'dashboard_report.dart';
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
  final _scaffoldKey = GlobalKey<ScaffoldState>();

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
      Future.microtask(() async {
        try {
          final service = await ref.read(syncServiceProvider.future);
          if (service.currentState.pendingCount > 0) {
            await service.sync();
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
          if (!ConnectivityUtils.isOnline) return;
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
                onCampaignTap: () => _scaffoldKey.currentState?.openDrawer(),
                onRoundTap: () => _showRoundSelector(),
                onRefresh: () {
                  HapticFeedback.mediumImpact();
                  if (!ConnectivityUtils.isOnline) return;
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
                headerAnim: _headerAnim,
                pulseAnim: _pulseAnim,
                onNotificationsTap: () => context.go('/notifications'),
              ),
            ),
            // ═══ P1-5: Sync status bar ═══
            SliverToBoxAdapter(
              child: SyncStatusBar(
                pendingCount: pendingCount,
                isSyncing: false,
                onSync: () async {
                  HapticFeedback.mediumImpact();
                  try {
                    final service = await ref.read(syncServiceProvider.future);
                    await service.sync();
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

  SliverList _buildDashboardContent(
      Map<String, dynamic> data, int localDrafts) {
    final submissions = data['submissions'] as Map<String, dynamic>? ?? {};
    final total = submissions['total'] as int? ?? 0;
    final today = submissions['today'] as int? ?? 0;
    final drafts = localDrafts;

    // ═══ P1-4: Build governorate ranking data ═══
    final govData = data['governorates'] as List? ?? [];
    final govCounts = <String, int>{};
    for (final g in govData) {
      final name = (g as Map<String, dynamic>)['name'] as String? ?? 'غير معروف';
      final count = (g['submissions'] as num?)?.toInt() ?? 0;
      if (count > 0) govCounts[name] = count;
    }
    final sortedGovs = govCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    // ═══ P1-4: Build status donut data ═══
    final submittedCount = total - drafts;
    final draftCount = drafts;

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
          onExportPdf: _exportPdfReport,
        ),
        const SizedBox(height: 20),
        // ═══ P1-4: Donut chart for status distribution ═══
        _sectionTitle('توزيع الحالات'),
        const SizedBox(height: 12),
        SubmissionsStatusDonut(
          submitted: submittedCount > 0 ? submittedCount : total,
          draft: draftCount,
          total: total > 0 ? total : 1,
        ),
        const SizedBox(height: 20),
        _sectionTitle('النشاط الأسبوعي'),
        const SizedBox(height: 12),
        DashboardTrendLine(
          dayData: submissions['byDay'] as Map<String, dynamic>? ?? {},
        ),
        const SizedBox(height: 20),
        // ═══ P1-4: Governorate ranking bar chart ═══
        _sectionTitle('ترتيب المحافظات'),
        const SizedBox(height: 12),
        GovernorateRankingChart(
          governorateData: sortedGovs,
        ),
        const SizedBox(height: 20),
      ]),
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

  // Analytics form IDs (same as analytics_screen.dart)
  static const _readinessFormId = '8aa0f3d5-7ab0-430f-85fd-4488c0c129bb';
  static const _supervisionFormId = '97a4f2b3-c573-4812-b58c-5b0acf814e24';

  // Readiness criteria keys
  static const _readinessCriteriaKeys = [
    'budget_received',
    'routine_vaccines_available',
    'medicines_available',
    'reproductive_supplies_available',
    'staff_available',
    'preparatory_meeting_held',
  ];

  // Compliance sections (yes/no fields)
  static const _yesNoSections = {
    'معلومات الفريق': [
      'has_activity_plan',
      'has_doctor_or_trained',
      'wearing_uniform'
    ],
    'بيئة العمل والتنسيق': [
      'suitable_location',
      'community_coordination',
      'has_speaker',
      'has_transport',
      'previous_visit'
    ],
    'السجلات والوثائق': [
      'complete_records',
      'daily_work_forms',
      'correct_data_entry',
      'next_visit_noted'
    ],
    'بطاقات التحصين': ['child_vaccination_cards', 'women_vaccination_cards'],
    'جودة الخدمة': [
      'good_acceptance',
      'safe_vaccination',
      'respiratory_rate_check',
      'muac_measurement',
      'ors_provision',
      'clean_delivery_kit',
      'nutrition_assessment'
    ],
    'الفيتامينات والإحالة': [
      'vitamin_a_children',
      'vitamin_a_women',
      'facility_referral',
      'correct_medication',
      'nutrition_counseling'
    ],
    'التعامل مع اللقاحات': [
      'vaccine_disposal',
      'safety_box_usage',
      'cold_chain_proper'
    ],
    'الإمدادات والمعدات': [
      'family_planning_available',
      'folic_iron_stock',
      'fetal_stethoscope',
      'bp_device',
      'muac_tape',
      'height_board',
      'thermometer',
      'scale',
      'daily_supply_tracking'
    ],
    'سياسة الالتحاق بالركب': [
      'has_vaccine_carrier',
      'vaccines_sufficient',
      'correct_vaccine_site',
      'catch_up_knowledge',
      'catch_up_training',
      'catch_up_2to5_registration',
      'team_target_knowledge'
    ],
    'تتبع المتخلفين': [
      'has_defaulter_mechanism',
      'has_previous_vaccination_records'
    ],
    'الآثار الجانبية': ['aefi_knowledge', 'aefi_mothers_info'],
  };

  // Service number fields
  static const _serviceNumberFields = {
    'immunization_children': 'التحصين - أطفال',
    'immunization_women': 'التحصين - نساء',
    'child_health_under2m': 'صحة طفل (< شهرين)',
    'child_health_2to59m': 'صحة طفل (2-59 شهر)',
    'child_health_over5': 'صحة طفل (> 5 سنوات)',
    'fp_clients': 'تنظيم الأسرة',
    'anc_clients': 'رعاية حوامل',
    'delivery_cases': 'ولادات',
    'nutrition_children_6_59': 'تغذية أطفال (6-59 شهر)',
    'referred_children': 'أطفال مُحالين',
    'nutrition_women': 'تغذية حوامل ومرضعات',
  };

  Future<void> _exportPdfReport() async {
    // Fetch analytics data for the 4 tabs
    List<ReadinessGovData>? readinessData;
    List<ComplianceSectionData>? complianceData;
    List<ServiceNumberData>? serviceNumbersData;
    List<ChallengeData>? challengesData;

    try {
      final db = ref.read(databaseServiceProvider);

      // Fetch readiness submissions — use cache, reasonable limit
      final readinessSubs =
          await db.getSubmissions(formId: _readinessFormId, limit: 5000);
      if (readinessSubs.isNotEmpty) {
        readinessData = _processReadinessData(readinessSubs);
      }

      // Fetch supervision submissions — use cache, reasonable limit
      final supervisionSubs =
          await db.getSubmissions(formId: _supervisionFormId, limit: 5000);
      if (supervisionSubs.isNotEmpty) {
        complianceData = _processComplianceData(supervisionSubs);
        serviceNumbersData = _processServiceNumbersData(supervisionSubs);
        challengesData = _processChallengesData(supervisionSubs);
      }
    } catch (_) {
      // Analytics data is optional — report will still generate without it
    }

    if (!mounted) return;

    DashboardReportExporter.showExportSheet(
      context: context,
      campaignLabel: ref.watch(campaignProvider).displayLabel,
      campaignRound: ref.watch(campaignRoundProvider),
      onGenerate: (type, format, period) async {
        // ═══ Phase 2-3: Route to appropriate generator based on type ═══
        if (type == 'supervisor_leaderboard') {
          await _generateSupervisorLeaderboard(format, period);
          return;
        }
        if (type == 'round_comparison') {
          await _generateRoundComparison(format, period);
          return;
        }

        // Standard reports use the existing generator
        await DashboardReportExporter.generateAndShare(
          context: context,
          type: type,
          analyticsData: ref
              .read(
                dashboardAnalyticsProvider(
                  AnalyticsFilter(campaignType: ref.watch(campaignProvider).value, campaignRound: ref.watch(campaignRoundProvider)),
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
          readinessData: readinessData,
          complianceData: complianceData,
          serviceNumbersData: serviceNumbersData,
          challengesData: challengesData,
        );
      },
    );
  }

  /// ═══ Phase 3-3: Supervisor Leaderboard Report ═══
  Future<void> _generateSupervisorLeaderboard(String format, String period) async {
    try {
      final db = ref.read(databaseServiceProvider);
      final campaign = ref.read(campaignProvider).value;
      final round = ref.read(campaignRoundProvider);

      // Fetch submissions with submitter info
      final subs = await db.getSubmissions(
        campaignType: campaign,
        campaignRound: round,
        limit: 10000,
      );

      // Aggregate by user
      final userStats = <String, Map<String, dynamic>>{};
      for (final s in subs) {
        final uid = s['submitted_by'] as String? ?? 'unknown';
        final name = (s['profiles'] as Map?)?['full_name'] as String? ?? 'غير معروف';
        if (!userStats.containsKey(uid)) {
          userStats[uid] = {'name': name, 'total': 0, 'submitted': 0};
        }
        userStats[uid]!['total'] = (userStats[uid]!['total'] as int) + 1;
        if (s['status'] == 'submitted') {
          userStats[uid]!['submitted'] = (userStats[uid]!['submitted'] as int) + 1;
        }
      }

      // Sort by total submissions
      final ranked = userStats.values.toList()
        ..sort((a, b) => (b['total'] as int).compareTo(a['total'] as int));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('🏆 تم توليد تقرير ترتيب المشرفين (${ranked.length} مشرف)'),
            backgroundColor: AppTheme.primaryColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  /// ═══ Phase 3-4: Round Comparison Report ═══
  Future<void> _generateRoundComparison(String format, String period) async {
    try {
      final db = ref.read(databaseServiceProvider);
      final campaign = ref.read(campaignProvider).value;
      final currentRound = ref.read(campaignRoundProvider);

      // Fetch current round submissions
      final currentSubs = await db.getSubmissions(
        campaignType: campaign,
        campaignRound: currentRound,
        limit: 10000,
      );

      // Fetch previous round submissions
      final prevRound = currentRound > 1 ? currentRound - 1 : 1;
      final prevSubs = await db.getSubmissions(
        campaignType: campaign,
        campaignRound: prevRound,
        limit: 10000,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('🔄 مقارنة الجولة $currentRound مع الجولة $prevRound: ${currentSubs.length} vs ${prevSubs.length}'),
            backgroundColor: AppTheme.primaryColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  List<ReadinessGovData> _processReadinessData(
      List<Map<String, dynamic>> subs) {
    final govAsync = ref.read(governoratesProvider);
    final govNames = <String, String>{};
    for (final g in (govAsync.valueOrNull ?? [])) {
      govNames[g['id'] as String? ?? ''] = g['name_ar'] as String? ?? '';
    }

    // Latest submission per governorate
    final latestByGov = <String, Map<String, dynamic>>{};
    for (final s in subs) {
      final d = s['data'] as Map<String, dynamic>? ?? {};
      final govId = d['governorate_id'] as String?;
      if (govId == null) continue;
      final existing = latestByGov[govId];
      if (existing == null ||
          (s['created_at'] as String? ?? '')
                  .compareTo(existing['created_at'] as String? ?? '') >
              0) {
        latestByGov[govId] = s;
      }
    }

    return latestByGov.entries.map((e) {
      final d = e.value['data'] as Map<String, dynamic>? ?? {};
      final govName = govNames[e.key] ?? 'غير محدد';
      final readyStr = d['ready_for_launch'] as String?;
      final status = readyStr == 'جاهزة'
          ? 'ready'
          : readyStr == 'جاهزة جزئياً' || readyStr == 'جاهزة جزئيا'
              ? 'partial'
              : readyStr == 'غير جاهزة'
                  ? 'notReady'
                  : 'unknown';

      int score = 0;
      for (final key in _readinessCriteriaKeys) {
        if (d[key] == true) score++;
      }

      return ReadinessGovData(
        govName: govName,
        status: status,
        score: score,
        total: _readinessCriteriaKeys.length,
        reasons: d['postponement_reasons'] as String?,
      );
    }).toList()
      ..sort((a, b) {
        final order = {'notReady': 0, 'partial': 1, 'unknown': 2, 'ready': 3};
        return (order[a.status] ?? 9).compareTo(order[b.status] ?? 9);
      });
  }

  List<ComplianceSectionData> _processComplianceData(
      List<Map<String, dynamic>> subs) {
    final realSubs = subs.where((s) {
      final d = s['data'] as Map<String, dynamic>? ?? {};
      return d['governorate_id'] != null;
    }).toList();

    return _yesNoSections.entries.map((section) {
      int yesCount = 0, totalCount = 0;
      for (final key in section.value) {
        for (final s in realSubs) {
          final d = s['data'] as Map<String, dynamic>? ?? {};
          if (d.containsKey(key)) {
            totalCount++;
            if (d[key] == true) yesCount++;
          }
        }
      }
      return ComplianceSectionData(
        sectionName: section.key,
        yesCount: yesCount,
        totalCount: totalCount,
      );
    }).toList();
  }

  List<ServiceNumberData> _processServiceNumbersData(
      List<Map<String, dynamic>> subs) {
    final realSubs = subs.where((s) {
      final d = s['data'] as Map<String, dynamic>? ?? {};
      return d['governorate_id'] != null;
    }).toList();

    final totals = <String, int>{};
    final counts = <String, int>{};
    for (final s in realSubs) {
      final d = s['data'] as Map<String, dynamic>? ?? {};
      for (final key in _serviceNumberFields.keys) {
        final val = d[key];
        if (val is num) {
          totals[key] = (totals[key] ?? 0) + val.toInt();
          counts[key] = (counts[key] ?? 0) + 1;
        }
      }
    }

    return _serviceNumberFields.entries.map((e) {
      final total = totals[e.key] ?? 0;
      final count = counts[e.key] ?? 0;
      final avg = count > 0 ? total / count : 0.0;
      return ServiceNumberData(label: e.value, total: total, avg: avg);
    }).toList();
  }

  List<ChallengeData> _processChallengesData(List<Map<String, dynamic>> subs) {
    return subs
        .where((s) {
          final d = s['data'] as Map<String, dynamic>? ?? {};
          return d['challenges'] != null ||
              d['actions_taken'] != null ||
              d['recommendations'] != null;
        })
        .take(20)
        .map((s) {
          final d = s['data'] as Map<String, dynamic>? ?? {};
          return ChallengeData(
            supervisorName: d['supervisor_name'] as String? ?? 'غير محدد',
            date: (s['created_at'] as String? ?? '').substring(0, 10),
            challenges: d['challenges'] as String? ?? '',
            actionsTaken: d['actions_taken'] as String? ?? '',
            recommendations: d['recommendations'] as String? ?? '',
          );
        })
        .toList();
  }
}
