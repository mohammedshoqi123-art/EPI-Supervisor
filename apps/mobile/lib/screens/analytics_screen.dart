import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';
import 'analytics_widgets.dart';
import 'analytics_reports_tab.dart';
import 'dashboard_report.dart';

// ═══════════════════════════════════════════════════════════════════════════
//  FORM IDs
// ═══════════════════════════════════════════════════════════════════════════
const _readinessFormId = FormIds.readiness;
const _supervisionFormId = FormIds.supervision;

// ═══════════════════════════════════════════════════════════════════════════
//  FIELD DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const _readinessCriteria = [
  ('budget_received', 'الميزانية المالية', Icons.attach_money_rounded),
  ('routine_vaccines_available', 'اللقاحات الروتينية', Icons.vaccines_rounded),
  ('medicines_available', 'الأدوية', Icons.medication_rounded),
  (
    'reproductive_supplies_available',
    'الصحة الإنجابية',
    Icons.pregnant_woman_rounded
  ),
  ('staff_available', 'الكادر الصحي', Icons.people_rounded),
  ('preparatory_meeting_held', 'الاجتماع التحضيري', Icons.groups_rounded),
];

const _yesNoSections = {
  'معلومات الفريق': [
    'has_activity_plan',
    'has_doctor_or_trained',
    'wearing_uniform',
  ],
  'بيئة العمل والتنسيق': [
    'suitable_location',
    'community_coordination',
    'has_speaker',
    'has_transport',
    'previous_visit',
  ],
  'السجلات والوثائق': [
    'complete_records',
    'daily_work_forms',
    'correct_data_entry',
    'next_visit_noted',
  ],
  'بطاقات التحصين': ['child_vaccination_cards', 'women_vaccination_cards'],
  'جودة الخدمة': [
    'good_acceptance',
    'safe_vaccination',
    'respiratory_rate_check',
    'muac_measurement',
    'ors_provision',
    'clean_delivery_kit',
    'nutrition_assessment',
  ],
  'الفيتامينات والإحالة': [
    'vitamin_a_children',
    'vitamin_a_women',
    'facility_referral',
    'correct_medication',
    'nutrition_counseling',
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
    'daily_supply_tracking',
  ],
  'سياسة الالتحاق بالركب': [
    'has_vaccine_carrier',
    'vaccines_sufficient',
    'correct_vaccine_site',
    'catch_up_knowledge',
    'catch_up_training',
    'catch_up_2to5_registration',
    'team_target_knowledge',
  ],
  'تتبع المتخلفين': [
    'has_defaulter_mechanism',
    'has_previous_vaccination_records'
  ],
  'الآثار الجانبية': ['aefi_knowledge', 'aefi_mothers_info'],
};

const _fieldLabels = {
  'has_activity_plan': 'هل لدى الفريق خطة وخارطة؟',
  'has_doctor_or_trained': 'هل أحد أعضاء الفريق طبيب أو فني مدرب؟',
  'wearing_uniform': 'هل يلتزمون بالزي (البالطو)؟',
  'suitable_location': 'هل المكان مناسب ويضمن الخصوصية؟',
  'community_coordination': 'هل تم التنسيق المسبق مع المجتمع؟',
  'has_speaker': 'هل يتوفر مكبر صوت؟',
  'has_transport': 'هل توجد وسيلة نقل مناسبة؟',
  'previous_visit': 'هل تمت زيارة سابقة من المستوى الأعلى؟',
  'complete_records': 'هل تتوفر سجلات مكتملة؟',
  'daily_work_forms': 'هل توجد استمارات العمل اليومي؟',
  'correct_data_entry': 'هل يتم تدوين البيانات بشكل صحيح؟',
  'next_visit_noted': 'هل يتم تدوين العودة للزيارة القادمة؟',
  'child_vaccination_cards': 'هل يتم صرف بطاقة تحصين للأطفال؟',
  'women_vaccination_cards': 'هل يتم صرف بطاقة تحصين للنساء؟',
  'good_acceptance': 'هل يوجد إقبال جيد على الخدمة؟',
  'safe_vaccination': 'هل يتم ممارسة التطعيم الآمن؟',
  'respiratory_rate_check': 'هل يتم احتساب سرعة التنفس؟',
  'muac_measurement': 'هل يتم قياس محيط منتصف الذراع؟',
  'ors_provision': 'هل يتم إعطاء محلول الإرواء؟',
  'clean_delivery_kit': 'هل يتم تزويد علبة الولادة النظيفة؟',
  'nutrition_assessment': 'هل يقوم العامل بتقييم مشاكل التغذية؟',
  'vitamin_a_children': 'هل يعطي فيتامين أ للأطفال؟',
  'vitamin_a_women': 'هل يعطي فيتامين أ للنساء؟',
  'facility_referral': 'هل يتم الإحالة للمرفق الصحي؟',
  'correct_medication': 'هل يتم إعطاء الأدوية سليمة؟',
  'nutrition_counseling': 'النصح والإرشاد حول التغذية؟',
  'vaccine_disposal': 'هل يتم التخلص من اللقاحات الممزوجة؟',
  'safety_box_usage': 'هل يتم استخدام صندوق الأمان؟',
  'cold_chain_proper': 'هل اللقاحات محفوظة سليماً؟',
  'family_planning_available': 'هل توفر وسائل تنظيم الأسرة؟',
  'folic_iron_stock': 'هل يتوفر حمض الفوليك والحديد؟',
  'fetal_stethoscope': 'هل توجد سماعة جنين؟',
  'bp_device': 'هل يتوفر جهاز ضغط الدم؟',
  'muac_tape': 'هل تتوفر أشرطة قياس محيط الذراع؟',
  'height_board': 'هل تتوفر أشرطة قياس الطول؟',
  'thermometer': 'هل يتوفر ترمومتر؟',
  'scale': 'هل يوجد ميزان؟',
  'daily_supply_tracking': 'هل يتم تدوين حركة الإمداد يومياً؟',
  'has_vaccine_carrier': 'هل تتوفر حافظة لقاح مبردة؟',
  'vaccines_sufficient': 'هل اللقاحات كافية للجلسة؟',
  'correct_vaccine_site': 'هل يتم إعطاء اللقاح في الموضع الصحيح؟',
  'catch_up_knowledge': 'هل لدى العاملين معرفة بسياسة الالتحاق؟',
  'catch_up_training': 'هل تلقوا تدريب كافي؟',
  'catch_up_2to5_registration': 'هل يتم تسجيل أطفال 2-5 سنوات؟',
  'team_target_knowledge': 'هل لدى الفريق معرفة بالمستهدف؟',
  'has_defaulter_mechanism': 'هل توجد آلية لتتبع المتخلفين؟',
  'has_previous_vaccination_records': 'هل يوجد سجل تطعيم للجولات السابقة؟',
  'aefi_knowledge': 'هل لدى العامل معرفة بالآثار الجانبية؟',
  'aefi_mothers_info': 'هل يتم إعطاء معلومات للأمهات عن الآثار الجانبية؟',
};

const _serviceNumberFields = {
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

// ═══════════════════════════════════════════════════════════════════════════
//  PROVIDERS
// ═══════════════════════════════════════════════════════════════════════════

// ═══ FIX #2: Changed to family.autoDispose with campaignType + campaignRound params ═══
// Previously: hardcoded cache key + no campaign/round filtering + limit: 200
// Now: accepts campaignType + campaignRound + limit: 2000 (all submissions)
final _readinessSubsProvider = FutureProvider.family
    .autoDispose<List<Map<String, dynamic>>, ({String? campaignType, int? campaignRound})>(
  (ref, params) async {
  // ═══ FIX: استخدام fallback مباشرة (جلب إرساليات فردية) ═══
  // Previously: RPC يُرجع بيانات مُجمّعة بدون ready_for_launch → جدول فارغ
  // Now: جلب الإرساليات الفعلية مع حقل data الكامل
  final cache = await ref.watch(offlineDataCacheProvider.future);
  final cacheKey = 'readiness_subs_${params.campaignType ?? 'all'}_${params.campaignRound ?? 'all'}';
  return cache.incrementalGetList(
    cacheKey,
    ({String? createdAfter}) async {
      return ref.read(databaseServiceProvider).getSubmissions(
            formId: _readinessFormId,
            campaignType: params.campaignType,
            campaignRound: params.campaignRound,
            limit: 2000,
            lean: false,
            createdAfter: createdAfter,
          );
    },
    maxAge: const Duration(hours: 2),
    dateField: 'updated_at',
    idField: 'id',
  );
});

final _supervisionSubsProvider = FutureProvider.family
    .autoDispose<List<Map<String, dynamic>>, ({String? campaignType, int? campaignRound})>(
  (ref, params) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);
  final cacheKey = 'supervision_subs_${params.campaignType ?? 'all'}_${params.campaignRound ?? 'all'}';
  return cache.incrementalGetList(
    cacheKey,
    ({String? createdAfter}) async {
      return ref.read(databaseServiceProvider).getSubmissions(
            formId: _supervisionFormId,
            campaignType: params.campaignType,
            campaignRound: params.campaignRound,
            limit: 2000,
            lean: false, // ═══ NEEDS 'data' column for field-level analysis ═══
            createdAfter: createdAfter,
          );
    },
    maxAge: const Duration(hours: 2),
    dateField: 'updated_at',
    idField: 'id',
  );
});

// ═══ P0-4: Precomputed KPI Provider — was 250,000 iterations per build()
// Now computed once and cached until data changes
final _analyticsKpiProvider = Provider.family
    .autoDispose<({int totalSubs, double complianceRate, int supervisorCount}), ({String? campaignType, int? campaignRound})>((
  ref,
  params,
) {
  final readiness = ref.watch(_readinessSubsProvider(params)).valueOrNull ?? [];
  final supervision = ref.watch(_supervisionSubsProvider(params)).valueOrNull ?? [];

  final totalSubs = readiness.length + supervision.length;

  // Precompute compliance rate from supervision data
  double complianceRate = 0;
  int yesCount = 0;
  int totalFields = 0;
  for (final s in supervision) {
    final data = s['data'] as Map<String, dynamic>? ?? {};
    for (final sectionFields in _yesNoSections.values) {
      for (final key in sectionFields) {
        final val = data[key];
        if (val == true) yesCount++;
        if (val == true || val == false) totalFields++;
      }
    }
  }
  if (totalFields > 0) {
    complianceRate = (yesCount / totalFields) * 100;
  }

  // Count unique supervisors
  final supervisors = <String>{};
  for (final s in [...readiness, ...supervision]) {
    final uid = s['submitted_by'] as String?;
    if (uid != null) supervisors.add(uid);
  }

  return (
    totalSubs: totalSubs,
    complianceRate: complianceRate,
    supervisorCount: supervisors.length,
  );
});

// ═══ Precomputed compliance cache — avoids 250,000 iterations per drill-down
final _complianceCache = <String, double>{};

double _cachedAvgCompliance(List<Map<String, dynamic>> subs, String cacheKey) {
  if (_complianceCache.containsKey(cacheKey)) {
    return _complianceCache[cacheKey]!;
  }
  final result = _calcAvgCompliance(subs);
  _complianceCache[cacheKey] = result;
  // Keep cache small
  if (_complianceCache.length > 50) {
    _complianceCache.remove(_complianceCache.keys.first);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN — 5 TABS
// ═══════════════════════════════════════════════════════════════════════════

class AnalyticsScreen extends ConsumerStatefulWidget {
  /// Optional initial tab index (0-4). Used to deep-link from dashboard.
  final int initialTab;

  const AnalyticsScreen({super.key, this.initialTab = 0});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;
  StreamSubscription? _syncSub;

  @override
  void initState() {
    super.initState();
    // ═══ Clamp initialTab to valid range [0, 5] ═══
    final initial = widget.initialTab.clamp(0, 5);
    _tab = TabController(
      length: 6,
      vsync: this,
      initialIndex: initial,
    );
    // Listen to sync service — invalidate analytics providers after each sync
    _listenToSync();

    // ═══ NO auto-refresh — user presses sync button ═══
  }

  void _listenToSync() {
    // Delay to ensure providers are available
    Future.microtask(() async {
      try {
        final syncService = await ref.read(syncServiceProvider.future);
        _syncSub = syncService.syncState.listen((state) {
          // ═══ PERFORMANCE: Only invalidate if user is on analytics screen ═══
          // Use a debounce to avoid rapid invalidations during batch sync
          if (!state.isSyncing && mounted) {
            _debouncedRefresh();
          }
        });
      } catch (_) {}
    });
  }

  // ═══ FIX #2: Build params from current campaign/round selection ═══
  ({String? campaignType, int? campaignRound}) get _currentParams {
    final campaign = ref.read(campaignProvider).value;
    final round = ref.read(campaignRoundProvider);
    return (
      campaignType: campaign != 'all' ? campaign : null,
      campaignRound: round,
    );
  }

  // ═══ Debounce refresh — prevents rapid invalidations ═══
  Timer? _refreshDebounce;
  void _debouncedRefresh() {
    _refreshDebounce?.cancel();
    _refreshDebounce = Timer(const Duration(seconds: 2), () {
      if (mounted) {
        final params = _getAnalyticsParams(ref);
        ref.invalidate(_readinessSubsProvider(params));
        ref.invalidate(_supervisionSubsProvider(params));
      }
    });
  }

  @override
  void dispose() {
    _refreshDebounce?.cancel();  // ⚠️ PERF FIX: was leaking
    _syncSub?.cancel();
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('تحليلات النشاط الإيصال التكاملي',
            style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700)),
        centerTitle: true,
        bottom: TabBar(
          controller: _tab,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          indicatorSize: TabBarIndicatorSize.label,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          labelStyle: const TextStyle(
              fontFamily: 'Tajawal', fontWeight: FontWeight.w700, fontSize: 13),
          unselectedLabelStyle: const TextStyle(
              fontFamily: 'Tajawal', fontWeight: FontWeight.w400, fontSize: 12),
          indicator: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            color: Colors.white.withValues(alpha: 0.15),
          ),
          dividerHeight: 0,
          tabs: const [
            Tab(icon: Icon(Icons.verified_user_rounded), text: 'الجاهزية'),
            Tab(icon: Icon(Icons.checklist_rounded), text: 'الالتزام'),
            Tab(icon: Icon(Icons.groups_3_rounded), text: 'المترددين'),
            Tab(icon: Icon(Icons.report_problem_rounded), text: 'التحديات'),
            Tab(icon: Icon(Icons.assessment_rounded), text: 'التقارير'),
            Tab(icon: Icon(Icons.local_hospital_rounded), text: 'تقييم المرافق'),
          ],
        ),
      ),
      body: Column(
        children: [
          // ═══ P2-5: KPI Bar — 4 quick stats above tabs ═══
          _buildKPIBar(),
          Expanded(
            child: TabBarView(
              controller: _tab,
              children: [
                const _ReadinessTab(),
                const _ComplianceTab(),
                const _NumbersTab(),
                const _ChallengesTab(),
                ReportsTab(
                  campaignLabel: ref.watch(campaignProvider).displayLabel,
                  campaignRound: ref.watch(campaignRoundProvider),
                  onGenerate: (type, format, period) =>
                      _generateReport(type, format, period),
                ),
                const _HealthFacilityAssessmentTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKPIBar() {
    // ═══ P0-4: Use precomputed KPI provider — was 250,000 iterations per build
    // Now: 0 iterations in build(), computed once in provider and cached
    final params = _getAnalyticsParams(ref);

    // ═══ FIX #30: فحص حالة التحميل والخطأ قبل عرض KPI ═══
    // Previously: _analyticsKpiProvider يُخفي أخطاء providers بـ .valueOrNull ?? []
    // Now: نعرض loading shimmer أو error message قبل حساب KPI
    final readinessAsync = ref.watch(_readinessSubsProvider(params));
    final supervisionAsync = ref.watch(_supervisionSubsProvider(params));

    // حالة التحميل — shimmer indicator
    final isLoading = readinessAsync.isLoading || supervisionAsync.isLoading;
    if (isLoading && !readinessAsync.hasValue && !supervisionAsync.hasValue) {
      return Container(
        height: 80,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Center(
          child: SizedBox(
            width: 24, height: 24,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }

    // حالة الخطأ — رسالة مع إعادة المحاولة
    final hasError = readinessAsync.hasError || supervisionAsync.hasError;
    if (hasError && !readinessAsync.hasValue && !supervisionAsync.hasValue) {
      return Container(
        height: 80,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 18, color: Colors.orange[700]),
              const SizedBox(width: 8),
              Text(
                'خطأ في تحميل التحليلات',
                style: TextStyle(
                  fontFamily: 'Tajawal', fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(width: 8),
              TextButton(
                onPressed: () {
                  ref.invalidate(_readinessSubsProvider(params));
                  ref.invalidate(_supervisionSubsProvider(params));
                },
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text('إعادة المحاولة', style: TextStyle(fontSize: 11)),
              ),
            ],
          ),
        ),
      );
    }

    // الحالة العادية — عرض KPI
    final kpi = ref.watch(_analyticsKpiProvider(params));

    return AnalyticsKPIBar(
      totalSubmissions: kpi.totalSubs,
      complianceRate: kpi.complianceRate,
      supervisorCount: kpi.supervisorCount,
      challengeCount: 0, // Will be updated by ChallengesTab
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // REPORT GENERATION — powers the Reports tab
  // ═══════════════════════════════════════════════════════════════

  /// Readiness criteria keys (extracted from _readinessCriteria tuples)
  static const _readinessCriteriaKeys = [
    'budget_received',
    'routine_vaccines_available',
    'medicines_available',
    'reproductive_supplies_available',
    'staff_available',
    'preparatory_meeting_held',
  ];

  /// Main report generation entry point — called from ReportsTab.onGenerate
  Future<void> _generateReport(String type, String format, String period) async {
    // ═══ FIX: فحص isOnline — لا نحظر التطبيق بالاوفلاين ═══
    if (!ConnectivityUtils.isOnline) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('لا يمكن إنشاء التقارير بدون إنترنت',
                style: TextStyle(fontFamily: 'Tajawal')),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 3),
          ),
        );
      }
      return;
    }
    // ═══ Route specialized reports ═══
    if (type == 'supervisor_leaderboard') {
      await _generateSupervisorLeaderboard();
      return;
    }
    if (type == 'round_comparison') {
      await _generateRoundComparison();
      return;
    }
    if (type == 'readiness_report') {
      await _generateFormReport('readiness', 'استمارة الجاهزية');
      return;
    }
    if (type == 'supervision_report') {
      await _generateFormReport('supervision', 'استمارة الإشراف');
      return;
    }
    if (type == 'assessment_report') {
      await _generateFormReport('assessment', 'استمارة تقييم المرافق');
      return;
    }

    // ═══ Standard reports: fetch analytics data then generate ═══
    List<ReadinessGovData>? readinessData;
    List<ComplianceSectionData>? complianceData;
    List<ServiceNumberData>? serviceNumbersData;
    List<ChallengeData>? challengesData;

    try {
      // Use cached providers instead of direct DB calls — avoids re-fetching 2000 records
      final params = _currentParams;
      final readinessSubs = ref.read(_readinessSubsProvider(params)).valueOrNull ?? [];
      if (readinessSubs.isNotEmpty) {
        readinessData = _processReadinessData(readinessSubs);
      }

      final supervisionSubs = ref.read(_supervisionSubsProvider(params)).valueOrNull ?? [];
      if (supervisionSubs.isNotEmpty) {
        complianceData = _processComplianceData(supervisionSubs);
        serviceNumbersData = _processServiceNumbersData(supervisionSubs);
        challengesData = _processChallengesData(supervisionSubs);
      }
    } catch (_) {
      // Analytics data is optional — report will still generate without it
    }

    if (!mounted) return;

    await DashboardReportExporter.generateAndShare(
      context: context,
      type: type,
      analyticsData: ref
          .read(
            dashboardAnalyticsProvider(
              AnalyticsFilter(
                campaignType: ref.read(campaignProvider).value,
                campaignRound: ref.read(campaignRoundProvider),
              ),
            ),
          )
          .valueOrNull,
      fetchGovRanking: () async {
        try {
          return await ref.read(analyticsServiceProvider).getGovernorateRanking(
            campaignRound: ref.read(campaignRoundProvider),
          );
        } catch (_) {
          return null;
        }
      },
      readinessData: readinessData,
      complianceData: complianceData,
      serviceNumbersData: serviceNumbersData,
      challengesData: challengesData,
    );
  }

  /// ═══ Supervisor Leaderboard Report ═══
  Future<void> _generateSupervisorLeaderboard() async {
    try {
      final db = ref.read(databaseServiceProvider);
      final campaign = ref.read(campaignProvider).value;
      final round = ref.read(campaignRoundProvider);

      final subs = await db.getSubmissions(
        campaignType: campaign,
        campaignRound: round,
        limit: 2000,
      lean: false, // ═══ FIX: Analytics NEEDS 'data' column ═══
      );

      // Aggregate by user
      final userStats = <String, Map<String, dynamic>>{};
      for (final s in subs) {
        final uid = s['submitted_by'] as String? ?? 'unknown';
        final name =
            (s['profiles'] as Map?)?['full_name'] as String? ?? 'غير معروف';
        if (!userStats.containsKey(uid)) {
          userStats[uid] = {'name': name, 'total': 0, 'submitted': 0};
        }
        userStats[uid]!['total'] = (userStats[uid]!['total'] as int) + 1;
        if (s['status'] == 'submitted') {
          userStats[uid]!['submitted'] =
              (userStats[uid]!['submitted'] as int) + 1;
        }
      }

      final ranked = userStats.values.toList()
        ..sort((a, b) => (b['total'] as int).compareTo(a['total'] as int));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                '🏆 تم توليد تقرير ترتيب المشرفين (${ranked.length} مشرف)'),
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

  /// ═══ Per-Form PDF Report ═══
  Future<void> _generateFormReport(String formType, String formName) async {
    if (!mounted) return;
    try {
      final db = ref.read(databaseServiceProvider);
      final round = ref.read(campaignRoundProvider);
      final campaign = ref.read(campaignProvider).value;

      // Get form ID
      String formId;
      switch (formType) {
        case 'readiness':
          formId = _readinessFormId;
          break;
        case 'supervision':
          formId = _supervisionFormId;
          break;
        case 'assessment':
          formId = _assessmentFormId;
          break;
        default:
          return;
      }

      // Fetch submissions
      final subs = await db.getSubmissions(
        formId: formId,
        campaignType: campaign,
        campaignRound: round,
        limit: 2000,
        lean: false,
      ).timeout(const Duration(seconds: 30));

      if (subs.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('لا توجد بيانات ل$formName'),
              backgroundColor: Colors.orange,
            ),
          );
        }
        return;
      }

      // Process data based on form type
      List<ReadinessGovData>? readinessData;
      List<ComplianceSectionData>? complianceData;
      List<ServiceNumberData>? serviceNumbersData;
      List<ChallengeData>? challengesData;

      if (formType == 'readiness') {
        readinessData = _processReadinessData(subs);
      } else if (formType == 'supervision') {
        complianceData = _processComplianceData(subs);
        serviceNumbersData = _processServiceNumbersData(subs);
        challengesData = _processChallengesData(subs);
      }

      // Build analytics data
      final analyticsData = <String, dynamic>{
        'submissions': {
          'total': subs.length,
          'byStatus': _countByStatus(subs),
        },
      };

      // Add form-specific metrics
      if (formType == 'assessment') {
        analyticsData['assessment_metrics'] = _processAssessmentMetrics(subs);
      }

      if (!mounted) return;

      // Generate PDF
      await DashboardReportExporter.generateAndShare(
        context: context,
        type: 'full',
        analyticsData: analyticsData,
        fetchGovRanking: () async {
          try {
            return await ref.read(analyticsServiceProvider).getGovernorateRanking(
              campaignRound: round,
            );
          } catch (_) {
            return null;
          }
        },
        readinessData: readinessData,
        complianceData: complianceData,
        serviceNumbersData: serviceNumbersData,
        challengesData: challengesData,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Map<String, int> _countByStatus(List<Map<String, dynamic>> subs) {
    final counts = <String, int>{};
    for (final s in subs) {
      final status = s['status'] as String? ?? 'unknown';
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }

  Map<String, dynamic> _processAssessmentMetrics(List<Map<String, dynamic>> subs) {
    int defaulterListYes = 0;
    int villageListYes = 0;
    int updatedPlanYes = 0;
    int populationDataYes = 0;
    int coveragePlanYes = 0;
    int planReviewedYes = 0;
    int reverseCoverageYes = 0;
    int higherVisitYes = 0;
    int routineCoverage85Yes = 0;

    for (final sub in subs) {
      final data = sub['data'] as Map<String, dynamic>? ?? {};
      if (data['has_defaulter_list'] == true || data['has_defaulter_list'] == 'yes') defaulterListYes++;
      if (data['has_village_list'] == true || data['has_village_list'] == 'yes') villageListYes++;
      if (data['has_updated_plan'] == true || data['has_updated_plan'] == 'yes') updatedPlanYes++;
      if (data['has_population_data'] == true || data['has_population_data'] == 'yes') populationDataYes++;
      if (data['has_coverage_plan'] == true || data['has_coverage_plan'] == 'yes') coveragePlanYes++;
      if (data['plan_reviewed_by_higher_level'] == true || data['plan_reviewed_by_higher_level'] == 'yes') planReviewedYes++;
      if (data['has_reverse_coverage'] == true || data['has_reverse_coverage'] == 'yes') reverseCoverageYes++;
      if (data['has_higher_level_visit'] == true || data['has_higher_level_visit'] == 'yes') higherVisitYes++;
      if (data['routine_coverage_above_85'] == true || data['routine_coverage_above_85'] == 'yes') routineCoverage85Yes++;
    }

    final total = subs.length;
    return {
      'total': total,
      'metrics': {
        'قائمة المتخلفين': {'yes': defaulterListYes, 'total': total},
        'قائمة القرى': {'yes': villageListYes, 'total': total},
        'خطة محدّثة': {'yes': updatedPlanYes, 'total': total},
        'بيانات سكانية': {'yes': populationDataYes, 'total': total},
        'خطة التغطية': {'yes': coveragePlanYes, 'total': total},
        'مراجعة الخطة': {'yes': planReviewedYes, 'total': total},
        'تغطية راجعة': {'yes': reverseCoverageYes, 'total': total},
        'زيارة المستوى الأعلى': {'yes': higherVisitYes, 'total': total},
        'تغطية >85%': {'yes': routineCoverage85Yes, 'total': total},
      },
    };
  }

  /// ═══ Round Comparison Report ═══
  Future<void> _generateRoundComparison() async {
    try {
      final db = ref.read(databaseServiceProvider);
      final campaign = ref.read(campaignProvider).value;
      final currentRound = ref.read(campaignRoundProvider);

      final currentSubs = await db.getSubmissions(
        campaignType: campaign,
        campaignRound: currentRound,
        limit: 2000,
      lean: false, // ═══ FIX: Analytics NEEDS 'data' column ═══
      );

      final prevRound = currentRound > 1 ? currentRound - 1 : 1;
      final prevSubs = await db.getSubmissions(
        campaignType: campaign,
        campaignRound: prevRound,
        limit: 2000,
      lean: false, // ═══ FIX: Analytics NEEDS 'data' column ═══
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                '🔄 مقارنة الجولة $currentRound مع الجولة $prevRound: ${currentSubs.length} vs ${prevSubs.length}'),
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

  // ═══ Data processing helpers (same logic as dashboard) ═══

  List<ReadinessGovData> _processReadinessData(List<Map<String, dynamic>> subs) {
    final govAsync = ref.read(governoratesProvider);
    final govNames = <String, String>{};
    for (final g in (govAsync.valueOrNull ?? [])) {
      govNames[g['id'] as String? ?? ''] = g['name_ar'] as String? ?? '';
    }

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
        } else if (val is String) {
          // ═══ FIX: Try parsing string numbers ═══
          final parsed = int.tryParse(val);
          if (parsed != null) {
            totals[key] = (totals[key] ?? 0) + parsed;
            counts[key] = (counts[key] ?? 0) + 1;
          }
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

// ═══════════════════════════════════════════════════════════════════════════
//  TAB 1: READINESS — Smart governorate readiness with AI insights
// ═══════════════════════════════════════════════════════════════════════════

class _ReadinessTab extends ConsumerWidget {
  const _ReadinessTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subsAsync = ref.watch(_readinessSubsProvider(_getAnalyticsParams(ref)));
    final govAsync = ref.watch(governoratesProvider);

    return subsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) {
        // ═══ OFFLINE FIX: Show helpful message instead of generic error ═══
        final isOffline = !ConnectivityUtils.isOnline;
        return _ErrRetry(
          msg: isOffline
              ? 'لا توجد بيانات مخزنة للجاهزية — قم بالمزامنة أولاً'
              : 'فشل تحميل بيانات الجاهزية',
          onRetry: isOffline
              ? null // Disable retry when offline
              : () => ref.invalidate(_readinessSubsProvider(_getAnalyticsParams(ref))),
        );
      },
      data: (subs) {
        final govNames = <String, String>{};
        for (final g in (govAsync.valueOrNull ?? [])) {
          govNames[g['id'] as String? ?? ''] = g['name_ar'] as String? ?? '';
        }

        // Latest submission per governorate
        final latestByGov = <String, Map<String, dynamic>>{};
        final countByGov = <String, int>{};
        for (final s in subs) {
          final d = s['data'] as Map<String, dynamic>? ?? {};
          // ═══ FIX: البحث عن governorate_id في كلا المكانين ═══
          // Previously: d['governorate_id'] فقط → فشل إذا كان في sub مباشرة
          // Now: d['governorate_id'] أو sub['governorate_id']
          final govId = (d['governorate_id'] as String?) ?? (s['governorate_id'] as String?);
          if (govId == null || govId.isEmpty) continue;
          countByGov[govId] = (countByGov[govId] ?? 0) + 1;
          final existing = latestByGov[govId];
          if (existing == null ||
              (s['created_at'] as String? ?? '')
                      .compareTo(existing['created_at'] as String? ?? '') >
                  0) {
            latestByGov[govId] = s;
          }
        }

        if (latestByGov.isEmpty) {
          return const _Empty(
              icon: Icons.assessment_outlined, msg: 'لا توجد بيانات جاهزية');
        }

        // Build analysis data
        final govData = <_GovReadiness>[];
        final criteriaFails = <String, List<String>>{};

        latestByGov.forEach((govId, sub) {
          final d = sub['data'] as Map<String, dynamic>? ?? {};
          final govName = govNames[govId] ?? 'غير محدد';
          final readyStr = d['ready_for_launch'] as String?;
          final status = readyStr == 'جاهزة'
              ? _ReadyStatus.ready
              : readyStr == 'جاهزة جزئياً' || readyStr == 'جاهزة جزئيا'
                  ? _ReadyStatus.partial
                  : readyStr == 'غير جاهزة'
                      ? _ReadyStatus.notReady
                      : _ReadyStatus.unknown;

          final criteria = <String, bool?>{};
          for (final (key, _, _) in _readinessCriteria) {
            criteria[key] = d[key] as bool?;
          }

          final score = criteria.values.where((v) => v == true).length;
          final total = criteria.length;

          // Track which criteria fail
          for (final (key, label, _) in _readinessCriteria) {
            if (d[key] == false) {
              criteriaFails.putIfAbsent(label, () => []).add(govName);
            }
          }

          govData.add(_GovReadiness(
            govId: govId,
            govName: govName,
            status: status,
            score: score,
            total: total,
            criteria: criteria,
            reasons: d['postponement_reasons'] as String?,
            postponedDate: d['postponed_launch_date'] as String?,
            lastUpdated:
                DateTime.tryParse(sub['created_at'] as String? ?? '') ??
                    DateTime(2000),
            supervisorTitle: d['supervisor_title'] as String? ?? '',
            submissionCount: countByGov[govId] ?? 1,
          ));
        });

        // Sort: worst first
        govData.sort((a, b) {
          final order = {
            _ReadyStatus.notReady: 0,
            _ReadyStatus.partial: 1,
            _ReadyStatus.unknown: 2,
            _ReadyStatus.ready: 3
          };
          final cmp = (order[a.status] ?? 9).compareTo(order[b.status] ?? 9);
          return cmp != 0 ? cmp : a.score.compareTo(b.score);
        });

        // AI Insights
        final insights = _buildInsights(govData, criteriaFails);

        final ready =
            govData.where((g) => g.status == _ReadyStatus.ready).length;
        final partial =
            govData.where((g) => g.status == _ReadyStatus.partial).length;
        final notReady =
            govData.where((g) => g.status == _ReadyStatus.notReady).length;

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(_readinessSubsProvider(_getAnalyticsParams(ref)));
            await ref.read(_readinessSubsProvider(_getAnalyticsParams(ref)).future);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Summary chips
              Row(children: [
                _Chip(label: 'جاهزة', count: ready, color: Colors.green),
                const SizedBox(width: 8),
                _Chip(label: 'جزئياً', count: partial, color: Colors.orange),
                const SizedBox(width: 8),
                _Chip(label: 'غير جاهزة', count: notReady, color: Colors.red),
                const SizedBox(width: 8),
                _Chip(
                    label: 'الإجمالي',
                    count: govData.length,
                    color: Colors.blue),
              ]),
              const SizedBox(height: 16),

              // ═══ AI INSIGHTS BOX ═══
              if (insights.isNotEmpty) ...[
                _InsightsBox(insights: insights),
                const SizedBox(height: 16),
              ],

              // Governorate table
              const Text('جدول جاهزية المحافظات',
                  style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 18,
                      fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              ...govData.map((g) => _ReadinessGovCard(data: g)),
            ],
          ),
        );
      },
    );
  }

  static List<String> _buildInsights(
      List<_GovReadiness> govData, Map<String, List<String>> criteriaFails) {
    final insights = <String>[];

    // Worst criteria
    if (criteriaFails.isNotEmpty) {
      final sorted = criteriaFails.entries.toList()
        ..sort((a, b) => b.value.length.compareTo(a.value.length));
      final worst = sorted.first;
      if (worst.value.length > 1) {
        insights.add(
            '⚠️ "${worst.key}" هو أضعف معيار — فشل في ${worst.value.length} محافظات (${worst.value.join("، ")})');
      }
    }

    // Not-ready governorates
    final notReady =
        govData.where((g) => g.status == _ReadyStatus.notReady).toList();
    if (notReady.isNotEmpty) {
      insights.add(
          '🔴 ${notReady.length} محافظة غير جاهزة: ${notReady.map((g) => g.govName).join("، ")}');
    }

    // Perfect governorates
    final perfect = govData.where((g) => g.score == g.total).toList();
    if (perfect.isNotEmpty) {
      insights.add(
          '🟢 ${perfect.length} محافظة حققت جميع المعايير: ${perfect.map((g) => g.govName).join("، ")}');
    }

    // Staff shortage is common
    if (criteriaFails.containsKey('الكادر الصحي') &&
        criteriaFails['الكادر الصحي']!.length >= 2) {
      insights.add(
          '💡 نقص الكادر الصحي مشكلة مشتركة — ${criteriaFails["الكادر الصحي"]!.length} محافظات تفتقر إليه');
    }

    return insights;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TAB 2: COMPLIANCE — Drill-down governorate → district → supervisor
// ═══════════════════════════════════════════════════════════════════════════

class _ComplianceTab extends ConsumerWidget {
  const _ComplianceTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subsAsync = ref.watch(_supervisionSubsProvider(_getAnalyticsParams(ref)));
    final govAsync = ref.watch(governoratesProvider);
    final distAsync = ref.watch(districtsProvider(null));

    return subsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) {
        final isOffline = !ConnectivityUtils.isOnline;
        return _ErrRetry(
          msg: isOffline
              ? 'لا توجد بيانات مخزنة للإشراف — قم بالمزامنة أولاً'
              : 'فشل تحميل بيانات الإشراف',
          onRetry: isOffline
              ? null
              : () => ref.invalidate(_supervisionSubsProvider(_getAnalyticsParams(ref))),
        );
      },
      data: (subs) {
        final realSubs = subs.where((s) {
          final d = s['data'] as Map<String, dynamic>? ?? {};
          return d['governorate_id'] != null;
        }).toList();

        if (realSubs.isEmpty) {
          return const _Empty(
              icon: Icons.analytics_outlined,
              msg:
                  'لا توجد إرساليات إشراف\nستظهر التحليلات عند إدخال استمارات إشراف');
        }

        final govNames = <String, String>{};
        for (final g in (govAsync.valueOrNull ?? [])) {
          govNames[g['id'] as String? ?? ''] = g['name_ar'] as String? ?? '';
        }
        final distNames = <String, String>{};
        for (final d in (distAsync.valueOrNull ?? [])) {
          distNames[d['id'] as String? ?? ''] = d['name_ar'] as String? ?? '';
        }

        // Group by governorate
        final byGov = <String, List<Map<String, dynamic>>>{};
        for (final s in realSubs) {
          final d = s['data'] as Map<String, dynamic>? ?? {};
          final govId = d['governorate_id'] as String? ?? 'unknown';
          byGov.putIfAbsent(govId, () => []).add(s);
        }

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(_supervisionSubsProvider(_getAnalyticsParams(ref)));
            await ref.read(_supervisionSubsProvider(_getAnalyticsParams(ref)).future);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _HeaderBar(
                  icon: Icons.assignment_turned_in_rounded,
                  label: 'إجمالي الزيارات الإشرافية',
                  value: '${realSubs.length}',
                  sub: 'في ${byGov.length} محافظة'),
              const SizedBox(height: 16),

              // ═══ P3-8: Compliance Heatmap for latest submission ═══
              if (realSubs.isNotEmpty) ...[
                Builder(builder: (context) {
                  // Get latest submission data for heatmap
                  final latest = realSubs.first;
                  final data = latest['data'] as Map<String, dynamic>? ?? {};
                  // Convert _yesNoSections to the format ComplianceHeatmap expects
                  final sections = <String, List<(String, String)>>{};
                  for (final entry in _yesNoSections.entries) {
                    sections[entry.key] = entry.value
                        .map((key) => (key as String, _fieldLabels[key] ?? key))
                        .toList();
                  }
                  return ComplianceHeatmap(sections: sections, data: data);
                }),
                const SizedBox(height: 16),
              ],

              const Text('المحافظات (اضغط للتفاصيل)',
                  style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 16,
                      fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              ...byGov.entries.map((e) {
                final govName = govNames[e.key] ?? 'غير محدد';
                return _GovDrillCard(
                    govName: govName,
                    submissions: e.value,
                    distNames: distNames);
              }),
            ],
          ),
        );
      },
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TAB 3: SERVICE NUMBERS
// ═══════════════════════════════════════════════════════════════════════════

class _NumbersTab extends ConsumerWidget {
  const _NumbersTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subsAsync = ref.watch(_supervisionSubsProvider(_getAnalyticsParams(ref)));

    return subsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) {
        final isOffline = !ConnectivityUtils.isOnline;
        return _ErrRetry(
          msg: isOffline
              ? 'لا توجد بيانات مخزنة — قم بالمزامنة أولاً'
              : 'فشل تحميل البيانات',
          onRetry: isOffline
              ? null
              : () => ref.invalidate(_supervisionSubsProvider(_getAnalyticsParams(ref))),
        );
      },
      data: (subs) {
        // ═══ FIX: Accept all supervision subs — check both data-level and top-level fields ═══
        final realSubs = subs.where((s) {
          final d = s['data'] as Map<String, dynamic>? ?? {};
          // Accept if has governorate_id anywhere, or if has any service number field
          if (d['governorate_id'] != null) return true;
          if (s['governorate_id'] != null) return true;
          // Also accept if has any numeric service field
          for (final key in _serviceNumberFields.keys) {
            if (d[key] is num) return true;
          }
          return false;
        }).toList();

        if (realSubs.isEmpty && subs.isNotEmpty) {
          // ═══ Debug: show available keys to help diagnose field name mismatches ═══
          final allKeys = <String>{};
          for (final s in subs.take(3)) {
            final d = s['data'] as Map<String, dynamic>? ?? {};
            allKeys.addAll(d.keys);
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const _Empty(
                  icon: Icons.numbers, msg: 'لا توجد بيانات أعداد مطابقة'),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border:
                      Border.all(color: Colors.orange.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(children: [
                      Icon(Icons.bug_report, size: 16, color: Colors.orange),
                      SizedBox(width: 6),
                      Text('تشخيص: المفاتيح الموجودة في البيانات',
                          style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 13,
                              fontWeight: FontWeight.w700)),
                    ]),
                    const SizedBox(height: 8),
                    Text(
                      allKeys.join('، '),
                      style:
                          const TextStyle(fontFamily: 'Tajawal', fontSize: 12),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'عدد الإرساليات: ${subs.length}',
                      style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 11,
                          color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
            ],
          );
        }

        if (realSubs.isEmpty) {
          return const _Empty(icon: Icons.numbers, msg: 'لا توجد بيانات أعداد');
        }

        final totals = <String, int>{};
        final counts = <String, int>{};
        for (final s in realSubs) {
          final d = s['data'] as Map<String, dynamic>? ?? {};
          for (final key in _serviceNumberFields.keys) {
            // Check both data-level and top-level
            final val = d[key] ?? s[key];
            if (val is num) {
              totals[key] = (totals[key] ?? 0) + val.toInt();
              counts[key] = (counts[key] ?? 0) + 1;
            } else if (val is String) {
              // Try parsing string numbers
              final parsed = int.tryParse(val);
              if (parsed != null) {
                totals[key] = (totals[key] ?? 0) + parsed;
                counts[key] = (counts[key] ?? 0) + 1;
              }
            }
          }
        }

        final grandTotal = totals.values.fold<int>(0, (s, v) => s + v);
        final maxVal = totals.values.isEmpty
            ? 1
            : totals.values.reduce((a, b) => a > b ? a : b);

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(_supervisionSubsProvider(_getAnalyticsParams(ref)));
            await ref.read(_supervisionSubsProvider(_getAnalyticsParams(ref)).future);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _HeaderBar(
                  icon: Icons.people_rounded,
                  label: 'إجمالي المترددين',
                  value: '$grandTotal',
                  sub: 'من ${realSubs.length} زيارة',
                  color: Colors.teal),
              const SizedBox(height: 16),
              ..._serviceNumberFields.entries.map((entry) {
                final total = totals[entry.key] ?? 0;
                final count = counts[entry.key] ?? 0;
                final avg =
                    count > 0 ? (total / count).toStringAsFixed(1) : '0';
                final ratio = maxVal > 0 ? total / maxVal : 0.0;
                return _NumberCard(
                    label: entry.value, total: total, avg: avg, ratio: ratio);
              }),
            ],
          ),
        );
      },
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TAB 4: CHALLENGES & RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

class _ChallengesTab extends ConsumerWidget {
  const _ChallengesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subsAsync = ref.watch(_supervisionSubsProvider(_getAnalyticsParams(ref)));
    final govAsync = ref.watch(governoratesProvider);

    return subsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) {
        final isOffline = !ConnectivityUtils.isOnline;
        return _ErrRetry(
          msg: isOffline
              ? 'لا توجد بيانات مخزنة — قم بالمزامنة أولاً'
              : 'فشل تحميل البيانات',
          onRetry: isOffline
              ? null
              : () => ref.invalidate(_supervisionSubsProvider(_getAnalyticsParams(ref))),
        );
      },
      data: (subs) {
        final realSubs = subs.where((s) {
          final d = s['data'] as Map<String, dynamic>? ?? {};
          return d['challenges'] != null ||
              d['actions_taken'] != null ||
              d['recommendations'] != null;
        }).toList();

        if (realSubs.isEmpty) {
          return const _Empty(
              icon: Icons.description_outlined,
              msg: 'لا توجد تحديات أو توصيات مسجلة');
        }

        final govNames = <String, String>{};
        for (final g in (govAsync.valueOrNull ?? [])) {
          govNames[g['id'] as String? ?? ''] = g['name_ar'] as String? ?? '';
        }

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(_supervisionSubsProvider(_getAnalyticsParams(ref)));
            await ref.read(_supervisionSubsProvider(_getAnalyticsParams(ref)).future);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // ═══ P2-7: Challenges categorized by severity ═══
              ChallengesCategoryCard(
                challenges: realSubs.map((s) {
                  final d = s['data'] as Map<String, dynamic>? ?? {};
                  final govId = d['governorate_id'] as String?;
                  final govName = govNames[govId] ?? '';
                  return {
                    'challenge': d['main_challenge'] ?? d['challenge'] ?? '',
                    'suggestion': d['suggestion'] ?? d['solution'] ?? '',
                    'governorate': govName,
                  };
                }).where((c) => (c['challenge'] as String).isNotEmpty).toList(),
              ),
              const SizedBox(height: 16),
              // Original list (kept for detail)
              ...realSubs.map((sub) {
              final d = sub['data'] as Map<String, dynamic>? ?? {};
              final sup = d['supervisor_name'] as String? ?? 'غير محدد';
              final date =
                  (sub['created_at'] as String? ?? '').substring(0, 10);
              return Card(
                margin: const EdgeInsets.only(bottom: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(children: [
                          CircleAvatar(
                              radius: 18,
                              backgroundColor:
                                  Colors.indigo.withValues(alpha: 0.1),
                              child: Text(sup.isNotEmpty ? sup[0] : '?',
                                  style: const TextStyle(
                                      color: Colors.indigo,
                                      fontWeight: FontWeight.w700))),
                          const SizedBox(width: 10),
                          Expanded(
                              child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                Text(sup,
                                    style: const TextStyle(
                                        fontFamily: 'Cairo',
                                        fontWeight: FontWeight.w600)),
                                Text(date,
                                    style: TextStyle(
                                        fontFamily: 'Tajawal',
                                        fontSize: 12,
                                        color: Colors.grey.shade500)),
                              ])),
                        ]),
                        const SizedBox(height: 14),
                        if ((d['challenges'] as String?)?.trim().isNotEmpty ??
                            false)
                          _TextBlock(
                              title: 'التحديات',
                              text: d['challenges'],
                              icon: Icons.warning_amber_rounded,
                              color: Colors.red),
                        if ((d['actions_taken'] as String?)
                                ?.trim()
                                .isNotEmpty ??
                            false)
                          _TextBlock(
                              title: 'الإجراءات المتخذة',
                              text: d['actions_taken'],
                              icon: Icons.build_rounded,
                              color: Colors.blue),
                        if ((d['recommendations'] as String?)
                                ?.trim()
                                .isNotEmpty ??
                            false)
                          _TextBlock(
                              title: 'التوصيات',
                              text: d['recommendations'],
                              icon: Icons.lightbulb_rounded,
                              color: Colors.green),
                      ]),
                ),
              );
            }).toList(),
            ],
          ),
        );
      },
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  DATA MODELS
// ═══════════════════════════════════════════════════════════════════════════

enum _ReadyStatus { ready, partial, notReady, unknown }

class _GovReadiness {
  final String govId, govName;
  final _ReadyStatus status;
  final int score, total;
  final Map<String, bool?> criteria;
  final String? reasons, postponedDate, supervisorTitle;
  final DateTime lastUpdated;
  final int submissionCount;

  _GovReadiness({
    required this.govId,
    required this.govName,
    required this.status,
    required this.score,
    required this.total,
    required this.criteria,
    this.reasons,
    this.postponedDate,
    required this.supervisorTitle,
    required this.lastUpdated,
    required this.submissionCount,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPLIANCE DRILL-DOWN
// ═══════════════════════════════════════════════════════════════════════════

class _GovDrillCard extends StatelessWidget {
  final String govName;
  final List<Map<String, dynamic>> submissions;
  final Map<String, String> distNames;
  const _GovDrillCard(
      {required this.govName,
      required this.submissions,
      required this.distNames});

  @override
  Widget build(BuildContext context) {
    final avgPct = _cachedAvgCompliance(submissions, 'gov_${govName.hashCode}_${submissions.length}');
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) => _DistrictListScreen(
                    govName: govName,
                    submissions: submissions,
                    distNames: distNames))),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(children: [
            Row(children: [
              Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.location_city_rounded,
                      color: Colors.blue, size: 22)),
              const SizedBox(width: 12),
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text(govName,
                        style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 15,
                            fontWeight: FontWeight.w700)),
                    Text(
                        '${submissions.length} زيارة • التزام ${(avgPct * 100).toStringAsFixed(0)}%',
                        style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 12,
                            color: Colors.grey.shade500)),
                  ])),
              const Icon(Icons.arrow_forward_ios_rounded,
                  size: 16, color: Colors.grey),
            ]),
            const SizedBox(height: 8),
            ClipRRect(
                borderRadius: BorderRadius.circular(3),
                child: LinearProgressIndicator(
                    value: avgPct,
                    minHeight: 5,
                    backgroundColor: Colors.grey.shade200,
                    valueColor: AlwaysStoppedAnimation(avgPct > 0.8
                        ? Colors.green
                        : avgPct > 0.5
                            ? Colors.orange
                            : Colors.red))),
          ]),
        ),
      ),
    );
  }
}

class _DistrictListScreen extends StatelessWidget {
  final String govName;
  final List<Map<String, dynamic>> submissions;
  final Map<String, String> distNames;
  const _DistrictListScreen(
      {required this.govName,
      required this.submissions,
      required this.distNames});

  @override
  Widget build(BuildContext context) {
    final byDist = <String, List<Map<String, dynamic>>>{};
    for (final s in submissions) {
      final d = s['data'] as Map<String, dynamic>? ?? {};
      final distId = d['district_id'] as String? ?? 'unknown';
      byDist.putIfAbsent(distId, () => []).add(s);
    }

    return Scaffold(
      appBar: AppBar(
          title: Text(govName,
              style: const TextStyle(
                  fontFamily: 'Cairo', fontWeight: FontWeight.w700))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('المديريات (${byDist.length})',
              style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 18,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ...byDist.entries.map((e) {
            final distName = distNames[e.key] ??
                (e.key == 'unknown'
                    ? 'غير محدد'
                    : 'مديرية ${e.key.substring(0, 6)}');
            final avgPct = _cachedAvgCompliance(e.value, 'dist_${e.key.hashCode}_${e.value.length}');
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              child: ListTile(
                leading: CircleAvatar(
                    backgroundColor: Colors.teal.withValues(alpha: 0.1),
                    child: const Icon(Icons.map_rounded,
                        color: Colors.teal, size: 20)),
                title: Text(distName,
                    style: const TextStyle(
                        fontFamily: 'Cairo', fontWeight: FontWeight.w600)),
                subtitle: Text(
                    '${e.value.length} زيارة • ${(avgPct * 100).toStringAsFixed(0)}% التزام',
                    style:
                        const TextStyle(fontFamily: 'Tajawal', fontSize: 12)),
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => _SupervisorListScreen(
                            title: distName, submissions: e.value))),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _SupervisorListScreen extends StatelessWidget {
  final String title;
  final List<Map<String, dynamic>> submissions;
  const _SupervisorListScreen({required this.title, required this.submissions});

  @override
  Widget build(BuildContext context) {
    final bySup = <String, List<Map<String, dynamic>>>{};
    for (final s in submissions) {
      final d = s['data'] as Map<String, dynamic>? ?? {};
      final name = d['supervisor_name'] as String? ?? 'غير محدد';
      bySup.putIfAbsent(name, () => []).add(s);
    }

    return Scaffold(
      appBar: AppBar(
          title: Text(title,
              style: const TextStyle(
                  fontFamily: 'Cairo', fontWeight: FontWeight.w700))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('المشرفون',
              style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 18,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ...bySup.entries.map((e) {
            final avgPct = _cachedAvgCompliance(e.value, 'sup_${e.key.hashCode}_${e.value.length}');
            final d0 = e.value.first['data'] as Map<String, dynamic>? ?? {};
            final role = d0['supervisor_title'] as String? ?? '';
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                leading: CircleAvatar(
                    backgroundColor: Colors.indigo.withValues(alpha: 0.1),
                    child: Text(e.key.isNotEmpty ? e.key[0] : '?',
                        style: const TextStyle(
                            color: Colors.indigo,
                            fontWeight: FontWeight.w700))),
                title: Text(e.key,
                    style: const TextStyle(
                        fontFamily: 'Cairo', fontWeight: FontWeight.w600)),
                subtitle: Text(
                    '$role • ${(avgPct * 100).toStringAsFixed(0)}% التزام',
                    style:
                        const TextStyle(fontFamily: 'Tajawal', fontSize: 12)),
                onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => _FullComplianceScreen(
                            title: e.key, submissions: e.value))),
              ),
            );
          }),
          const Divider(height: 32),
          const Text('تحليل الالتزام التفصيلي',
              style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 18,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          _ComplianceSectionAnalysis(submissions: submissions),
        ],
      ),
    );
  }
}

class _FullComplianceScreen extends StatelessWidget {
  final String title;
  final List<Map<String, dynamic>> submissions;
  const _FullComplianceScreen({required this.title, required this.submissions});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title: Text('تحليل: $title',
              style: const TextStyle(
                  fontFamily: 'Cairo', fontWeight: FontWeight.w700))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('${submissions.length} إرسالية',
              style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 13,
                  color: Colors.grey.shade500)),
          const SizedBox(height: 16),
          _ComplianceSectionAnalysis(submissions: submissions),
        ],
      ),
    );
  }
}

class _ComplianceSectionAnalysis extends StatelessWidget {
  final List<Map<String, dynamic>> submissions;
  const _ComplianceSectionAnalysis({required this.submissions});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: _yesNoSections.entries.map((section) {
        final fields = section.value;
        final fieldStats = <String, ({int yes, int total})>{};
        for (final key in fields) {
          int yes = 0, total = 0;
          for (final s in submissions) {
            final d = s['data'] as Map<String, dynamic>? ?? {};
            if (d.containsKey(key)) {
              total++;
              if (d[key] == true) yes++;
            }
          }
          fieldStats[key] = (yes: yes, total: total);
        }
        final secTotal = fieldStats.values.fold<int>(0, (s, v) => s + v.total);
        final secYes = fieldStats.values.fold<int>(0, (s, v) => s + v.yes);
        final secPct = secTotal > 0 ? secYes / secTotal : 0.0;

        return Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 2))
              ]),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(
                  child: Text(section.key,
                      style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 15,
                          fontWeight: FontWeight.w700))),
              Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                      color: _pctColor(secPct).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12)),
                  child: Text('${(secPct * 100).toStringAsFixed(0)}%',
                      style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: _pctColor(secPct)))),
            ]),
            const SizedBox(height: 4),
            ClipRRect(
                borderRadius: BorderRadius.circular(3),
                child: LinearProgressIndicator(
                    value: secPct,
                    minHeight: 5,
                    backgroundColor: Colors.grey.shade200,
                    valueColor: AlwaysStoppedAnimation(_pctColor(secPct)))),
            const SizedBox(height: 10),
            ...fields.map((key) {
              final stats = fieldStats[key];
              if (stats == null || stats.total == 0)
                return const SizedBox.shrink();
              final pct = stats.yes / stats.total;
              final label = _fieldLabels[key] ?? key;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Row(children: [
                  Expanded(
                      flex: 5,
                      child: Text(label,
                          style: const TextStyle(
                              fontFamily: 'Tajawal', fontSize: 12),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis)),
                  const SizedBox(width: 8),
                  Expanded(
                      flex: 3,
                      child: Row(children: [
                        Expanded(
                            child: ClipRRect(
                                borderRadius: BorderRadius.circular(3),
                                child: LinearProgressIndicator(
                                    value: pct,
                                    minHeight: 8,
                                    backgroundColor: Colors.grey.shade200,
                                    valueColor:
                                        AlwaysStoppedAnimation(pct == 1.0
                                            ? Colors.green
                                            : pct >= 0.5
                                                ? Colors.orange
                                                : Colors.red)))),
                        const SizedBox(width: 6),
                        SizedBox(
                            width: 36,
                            child: Text('${(pct * 100).toStringAsFixed(0)}%',
                                style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: pct == 1.0
                                        ? Colors.green
                                        : pct >= 0.5
                                            ? Colors.orange
                                            : Colors.red))),
                      ])),
                ]),
              );
            }),
          ]),
        );
      }).toList(),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SHARED WIDGETS
// ═══════════════════════════════════════════════════════════════════════════

double _calcAvgCompliance(List<Map<String, dynamic>> subs) {
  int totalYes = 0, totalFields = 0;
  for (final s in subs) {
    final d = s['data'] as Map<String, dynamic>? ?? {};
    for (final section in _yesNoSections.values) {
      for (final key in section) {
        if (d.containsKey(key)) {
          totalFields++;
          if (d[key] == true) totalYes++;
        }
      }
    }
  }
  return totalFields > 0 ? totalYes / totalFields : 0.0;
}

Color _pctColor(double pct) => pct > 0.8
    ? Colors.green
    : pct > 0.5
        ? Colors.orange
        : Colors.red;

class _Chip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  const _Chip({required this.label, required this.count, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
            color: color.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: color.withValues(alpha: 0.25))),
        child: Column(children: [
          Text('$count',
              style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: color)),
          Text(label,
              style: const TextStyle(fontFamily: 'Tajawal', fontSize: 11),
              textAlign: TextAlign.center),
        ]),
      ),
    );
  }
}

class _HeaderBar extends StatelessWidget {
  final IconData icon;
  final String label, value, sub;
  final Color color;
  const _HeaderBar(
      {required this.icon,
      required this.label,
      required this.value,
      required this.sub,
      this.color = Colors.blue});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          gradient:
              LinearGradient(colors: [color, color.withValues(alpha: 0.7)]),
          borderRadius: BorderRadius.circular(16)),
      child: Row(children: [
        Icon(icon, color: Colors.white, size: 32),
        const SizedBox(width: 16),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label,
              style: const TextStyle(
                  fontFamily: 'Tajawal', color: Colors.white70, fontSize: 13)),
          Text(value,
              style: const TextStyle(
                  fontFamily: 'Cairo',
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w800)),
        ]),
        const Spacer(),
        Text(sub,
            style: const TextStyle(
                fontFamily: 'Tajawal', color: Colors.white70, fontSize: 12)),
      ]),
    );
  }
}

class _InsightsBox extends StatelessWidget {
  final List<String> insights;
  const _InsightsBox({required this.insights});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
          gradient: LinearGradient(colors: [
            Colors.indigo.withValues(alpha: 0.06),
            Colors.purple.withValues(alpha: 0.04)
          ]),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.indigo.withValues(alpha: 0.15))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [
          Icon(Icons.auto_awesome_rounded, color: Colors.indigo, size: 20),
          SizedBox(width: 8),
          Text('تحليلات ذكية',
              style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: Colors.indigo)),
        ]),
        const SizedBox(height: 10),
        ...insights.map((insight) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 3),
            child: Text(insight,
                style: const TextStyle(fontFamily: 'Tajawal', fontSize: 13)))),
      ]),
    );
  }
}

class _ReadinessGovCard extends StatelessWidget {
  final _GovReadiness data;
  const _ReadinessGovCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final (icon, text, color) = switch (data.status) {
      _ReadyStatus.ready => ('✅', 'جاهزة', Colors.green),
      _ReadyStatus.partial => ('⚠️', 'جزئياً', Colors.orange),
      _ReadyStatus.notReady => ('❌', 'غير جاهزة', Colors.red),
      _ReadyStatus.unknown => ('❓', 'غير محدد', Colors.grey),
    };
    final hasReasons = data.reasons != null && data.reasons!.trim().isNotEmpty;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
          builder: (_) => DraggableScrollableSheet(
            initialChildSize: 0.6,
            maxChildSize: 0.9,
            minChildSize: 0.4,
            expand: false,
            builder: (_, ctrl) => ListView(
              controller: ctrl,
              padding: const EdgeInsets.all(24),
              children: [
                Center(
                    child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                            color: Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(2)))),
                const SizedBox(height: 20),
                Text(data.govName,
                    style: const TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 24,
                        fontWeight: FontWeight.w800),
                    textAlign: TextAlign.center),
                const SizedBox(height: 8),
                Center(
                    child: Text('${data.score} من ${data.total} معايير مكتملة',
                        style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 13,
                            color: Colors.grey.shade600))),
                const SizedBox(height: 20),
                const Text('معايير الجاهزية',
                    style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 16,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                ..._readinessCriteria.map((c) {
                  final val = data.criteria[c.$1];
                  final ic = val == true
                      ? Icons.check_circle_rounded
                      : val == false
                          ? Icons.cancel_rounded
                          : Icons.help_outline_rounded;
                  final col = val == true
                      ? Colors.green
                      : val == false
                          ? Colors.red
                          : Colors.grey;
                  return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(children: [
                        Icon(ic, color: col, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                            child: Text(c.$2,
                                style: const TextStyle(
                                    fontFamily: 'Tajawal', fontSize: 14)))
                      ]));
                }),
                if (hasReasons) ...[
                  const SizedBox(height: 16),
                  const Text('أسباب التأجيل',
                      style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 16,
                          fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                          color: Colors.red.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color: Colors.red.withValues(alpha: 0.2))),
                      child: Text(data.reasons!,
                          style: const TextStyle(
                              fontFamily: 'Tajawal', fontSize: 14))),
                ],
                const SizedBox(height: 16),
                Row(children: [
                  Text(data.supervisorTitle ?? 'غير محدد',
                      style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 12,
                          color: Colors.grey.shade500)),
                  const Spacer(),
                  Text(
                      '${data.lastUpdated.day}/${data.lastUpdated.month}/${data.lastUpdated.year}',
                      style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 12,
                          color: Colors.grey.shade500)),
                ]),
              ],
            ),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(children: [
            Row(children: [
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text(data.govName,
                        style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 16,
                            fontWeight: FontWeight.w700)),
                    Text(
                        '${data.score}/${data.total} معايير • ${data.submissionCount} إرسالية',
                        style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 11,
                            color: Colors.grey.shade500)),
                  ])),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: color.withValues(alpha: 0.3))),
                child: Text('$icon $text',
                    style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: color)),
              ),
            ]),
            const SizedBox(height: 10),
            Row(
                children: _readinessCriteria.map((c) {
              final val = data.criteria[c.$1];
              final col = val == true
                  ? Colors.green
                  : val == false
                      ? Colors.red
                      : Colors.grey.shade300;
              return Expanded(
                  child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 2),
                      height: 6,
                      decoration: BoxDecoration(
                          color: col, borderRadius: BorderRadius.circular(3))));
            }).toList()),
            if (hasReasons && data.status == _ReadyStatus.notReady) ...[
              const SizedBox(height: 8),
              Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: Colors.red.withValues(alpha: 0.15))),
                  child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.info_outline,
                            size: 14, color: Colors.red),
                        const SizedBox(width: 6),
                        Expanded(
                            child: Text('سبب: ${data.reasons}',
                                style: const TextStyle(
                                    fontFamily: 'Tajawal',
                                    fontSize: 11,
                                    color: Colors.red),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis)),
                      ])),
            ],
          ]),
        ),
      ),
    );
  }
}

class _NumberCard extends StatelessWidget {
  final String label, avg;
  final int total;
  final double ratio;
  const _NumberCard(
      {required this.label,
      required this.total,
      required this.avg,
      required this.ratio});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(children: [
          Row(children: [
            Expanded(
                child: Text(label,
                    style: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 14,
                        fontWeight: FontWeight.w600))),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('$total',
                  style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: Colors.teal)),
              Text('متوسط: $avg/زيارة',
                  style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 11,
                      color: Colors.grey.shade500)),
            ]),
          ]),
          const SizedBox(height: 8),
          ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                  value: ratio,
                  minHeight: 6,
                  backgroundColor: Colors.grey.shade200,
                  valueColor: const AlwaysStoppedAnimation(Colors.teal))),
        ]),
      ),
    );
  }
}

class _TextBlock extends StatelessWidget {
  final String title;
  final String? text;
  final IconData icon;
  final Color color;
  const _TextBlock(
      {required this.title,
      this.text,
      required this.icon,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: color.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.15))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(title,
              style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: color))
        ]),
        const SizedBox(height: 6),
        Text(text ?? '',
            style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14)),
      ]),
    );
  }
}

class _ErrRetry extends StatelessWidget {
  final String msg;
  final VoidCallback? onRetry; // ═══ Nullable for offline case ═══
  const _ErrRetry({required this.msg, this.onRetry});
  @override
  Widget build(BuildContext context) => Center(
      child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(
              onRetry == null ? Icons.wifi_off_rounded : Icons.error_outline,
              size: 48,
              color: onRetry == null ? Colors.orange : Colors.red,
            ),
            const SizedBox(height: 12),
            Text(msg,
                style: const TextStyle(fontFamily: 'Tajawal'),
                textAlign: TextAlign.center),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              ElevatedButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh),
                  label: const Text('إعادة المحاولة',
                      style: TextStyle(fontFamily: 'Tajawal'))),
            ],
          ])));
}

class _Empty extends StatelessWidget {
  final IconData icon;
  final String msg;
  const _Empty({this.icon = Icons.inbox_rounded, required this.msg});
  @override
  Widget build(BuildContext context) => Center(
      child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(msg,
                style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 16,
                    color: Colors.grey.shade500),
                textAlign: TextAlign.center),
          ])));
}

// ═══ FIX: Global helper for campaign params — accessible from all widget classes ═══
({String? campaignType, int? campaignRound}) _getAnalyticsParams(WidgetRef ref) {
  final campaign = ref.read(campaignProvider).value;
  final round = ref.read(campaignRoundProvider);
  return (
    campaignType: campaign != 'all' ? campaign : null,
    campaignRound: round,
  );
}

// ═══ Health Facility Assessment Tab ═══
const _assessmentFormId = FormIds.healthFacilityAssessment;

class _HealthFacilityAssessmentTab extends ConsumerWidget {
  const _HealthFacilityAssessmentTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final params = _getAnalyticsParams(ref);
    final subsAsync = ref.watch(_assessmentSubsProvider(params));

    return subsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrRetry(
        msg: 'خطأ: $e',
        onRetry: () => ref.invalidate(_assessmentSubsProvider),
      ),
      data: (subs) {
        if (subs.isEmpty) {
          return const _Empty(
            icon: Icons.local_hospital_outlined,
            msg: 'لا توجد بيانات تقييم المرافق الصحية',
          );
        }

        // Calculate metrics
        int defaulterListYes = 0;
        int villageListYes = 0;
        int updatedPlanYes = 0;
        int populationDataYes = 0;
        int coveragePlanYes = 0;
        int planReviewedYes = 0;
        int reverseCoverageYes = 0;
        int higherVisitYes = 0;
        int routineCoverage85Yes = 0;

        for (final sub in subs) {
          final data = sub['data'] as Map<String, dynamic>? ?? {};
          if (data['has_defaulter_list'] == true || data['has_defaulter_list'] == 'yes') defaulterListYes++;
          if (data['has_village_list'] == true || data['has_village_list'] == 'yes') villageListYes++;
          if (data['has_updated_plan'] == true || data['has_updated_plan'] == 'yes') updatedPlanYes++;
          if (data['has_population_data'] == true || data['has_population_data'] == 'yes') populationDataYes++;
          if (data['has_coverage_plan'] == true || data['has_coverage_plan'] == 'yes') coveragePlanYes++;
          if (data['plan_reviewed_by_higher_level'] == true || data['plan_reviewed_by_higher_level'] == 'yes') planReviewedYes++;
          if (data['has_reverse_coverage'] == true || data['has_reverse_coverage'] == 'yes') reverseCoverageYes++;
          if (data['has_higher_level_visit'] == true || data['has_higher_level_visit'] == 'yes') higherVisitYes++;
          if (data['routine_coverage_above_85'] == true || data['routine_coverage_above_85'] == 'yes') routineCoverage85Yes++;
        }

        final total = subs.length;
        final metrics = [
          ('قائمة المتخلفين', defaulterListYes, total),
          ('قائمة القرى', villageListYes, total),
          ('خطة محدّثة', updatedPlanYes, total),
          ('بيانات سكانية', populationDataYes, total),
          ('خطة التغطية', coveragePlanYes, total),
          ('مراجعة الخطة', planReviewedYes, total),
          ('تغطية راجعة', reverseCoverageYes, total),
          ('زيارة المستوى الأعلى', higherVisitYes, total),
          ('تغطية >85%', routineCoverage85Yes, total),
        ];

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Summary Cards
              Row(
                children: [
                  _SummaryCard(
                    icon: Icons.local_hospital_rounded,
                    label: 'إجمالي التقييمات',
                    value: '$total',
                    color: Colors.blue,
                  ),
                  const SizedBox(width: 12),
                  _SummaryCard(
                    icon: Icons.check_circle_rounded,
                    label: 'مُرسلة',
                    value: '${subs.where((s) => s['status'] == 'submitted').length}',
                    color: Colors.green,
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Metrics Progress
              const Text(
                'مؤشرات الجاهزية الرئيسية',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 12),
              ...metrics.map((m) {
                final (name, count, t) = m;
                final pct = t > 0 ? (count / t * 100) : 0.0;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(name, style: const TextStyle(fontFamily: 'Tajawal', fontSize: 13)),
                          Text(
                            '${pct.toStringAsFixed(0)}% ($count/$t)',
                            style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: pct >= 80 ? Colors.green : pct >= 50 ? Colors.orange : Colors.red,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      LinearProgressIndicator(
                        value: pct / 100,
                        backgroundColor: Colors.grey.shade200,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          pct >= 80 ? Colors.green : pct >= 50 ? Colors.orange : Colors.red,
                        ),
                        minHeight: 8,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }
}

// Provider for health facility assessment submissions
final _assessmentSubsProvider = FutureProvider.family
    .autoDispose<List<Map<String, dynamic>>, ({String? campaignType, int? campaignRound})>(
  (ref, params) async {
    final cache = await ref.watch(offlineDataCacheProvider.future);
    final cacheKey = 'assessment_subs_${params.campaignType ?? 'all'}_${params.campaignRound ?? 'all'}';
    return cache.incrementalGetList(
      cacheKey,
      ({String? createdAfter}) async {
        return ref.read(databaseServiceProvider).getSubmissions(
              formId: _assessmentFormId,
              campaignType: params.campaignType,
              campaignRound: params.campaignRound,
              limit: 2000,
              lean: false,
              createdAfter: createdAfter,
            );
      },
      maxAge: const Duration(hours: 2),
      dateField: 'updated_at',
      idField: 'id',
    );
  },
);

class _SummaryCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _SummaryCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontFamily: 'Cairo',
                fontWeight: FontWeight.w700,
                fontSize: 24,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 12,
                color: color.withValues(alpha: 0.8),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
