import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_providers.dart';

// ═══════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const _supervisionFormId = '97a4f2b3-c573-4812-b58c-5b0acf814e24';

/// Yes/No fields grouped by section — for compliance percentage analysis
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
  'بطاقات التحصين': [
    'child_vaccination_cards',
    'women_vaccination_cards',
  ],
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
    'cold_chain_proper',
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
    'has_previous_vaccination_records',
  ],
  'الآثار الجانبية': [
    'aefi_knowledge',
    'aefi_mothers_info',
  ],
};

/// Arabic labels for yes/no fields
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

/// Numeric service fields
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

final supervisionSubmissionsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);
  return cache.getList(
    'supervision_submissions_integrated',
    () => ref.read(databaseServiceProvider).getSubmissions(
          formId: _supervisionFormId,
          limit: 500,
        ),
    maxAge: const Duration(hours: 2),
  );
});

// ═══════════════════════════════════════════════════════════════════════════
//  ANALYTICS SCREEN
// ═══════════════════════════════════════════════════════════════════════════

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'تحليلات الإشراف التكاملي',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700),
        ),
        centerTitle: true,
        bottom: TabBar(
          controller: _tab,
          isScrollable: true,
          labelStyle:
              const TextStyle(fontFamily: 'Tajawal', fontWeight: FontWeight.w600),
          unselectedLabelStyle: const TextStyle(fontFamily: 'Tajawal'),
          tabs: const [
            Tab(icon: Icon(Icons.dashboard_rounded), text: 'نظرة عامة'),
            Tab(icon: Icon(Icons.numbers_rounded), text: 'المترددين'),
            Tab(icon: Icon(Icons.description_rounded), text: 'التحديات'),
            Tab(icon: Icon(Icons.photo_library_rounded), text: 'الصور'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tab,
        children: const [
          _OverviewTab(),
          _ServiceNumbersTab(),
          _ChallengesTab(),
          _PhotosTab(),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TAB 1: OVERVIEW — Governorates → Districts → Supervisors → Compliance
// ═══════════════════════════════════════════════════════════════════════════

class _OverviewTab extends ConsumerWidget {
  const _OverviewTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subsAsync = ref.watch(supervisionSubmissionsProvider);
    final govAsync = ref.watch(governoratesProvider);
    final distAsync = ref.watch(districtsProvider(null));

    return subsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorWidget(
        message: 'فشل تحميل البيانات',
        onRetry: () => ref.invalidate(supervisionSubmissionsProvider),
      ),
      data: (subs) {
        // Filter out test data — keep only submissions with governorate_id
        final realSubs = subs.where((s) {
          final d = s['data'] as Map<String, dynamic>? ?? {};
          return d['governorate_id'] != null;
        }).toList();

        if (realSubs.isEmpty) {
          return const _EmptyWidget(
            message: 'لا توجد إرساليات إشراف حتى الآن',
          );
        }

        // Build governorate name lookup
        final govNames = <String, String>{};
        final govData = govAsync.valueOrNull ?? [];
        for (final g in govData) {
          govNames[g['id'] as String] = g['name_ar'] as String? ?? '';
        }

        // Build district name lookup
        final distNames = <String, String>{};
        final distData = distAsync.valueOrNull ?? [];
        for (final d in distData) {
          distNames[d['id'] as String] = d['name_ar'] as String? ?? '';
        }

        // Group by governorate
        final byGov = <String, List<Map<String, dynamic>>>{};
        for (final s in realSubs) {
          final d = s['data'] as Map<String, dynamic>? ?? {};
          final govId = d['governorate_id'] as String;
          byGov.putIfAbsent(govId, () => []).add(s);
        }

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(supervisionSubmissionsProvider);
            await ref.read(supervisionSubmissionsProvider.future);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Total submissions header
              _TotalHeader(count: realSubs.length),
              const SizedBox(height: 16),

              // Governorate cards
              ...byGov.entries.map((entry) {
                final govId = entry.key;
                final govSubs = entry.value;
                final govName = govNames[govId] ?? 'محافظة ${govId.substring(0, 6)}';
                return _GovernorateCard(
                  govName: govName,
                  submissions: govSubs,
                  distNames: distNames,
                  govNames: govNames,
                );
              }),
            ],
          ),
        );
      },
    );
  }
}

class _TotalHeader extends StatelessWidget {
  final int count;
  const _TotalHeader({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.primary.withValues(alpha: 0.7),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.assignment_turned_in_rounded,
              color: Colors.white, size: 32),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'إجمالي إرساليات الإشراف',
                style: TextStyle(
                    fontFamily: 'Tajawal',
                    color: Colors.white70,
                    fontSize: 13),
              ),
              Text(
                '$count إرسالية',
                style: const TextStyle(
                    fontFamily: 'Cairo',
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w800),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _GovernorateCard extends StatelessWidget {
  final String govName;
  final List<Map<String, dynamic>> submissions;
  final Map<String, String> distNames;
  final Map<String, String> govNames;
  const _GovernorateCard({
    required this.govName,
    required this.submissions,
    required this.distNames,
    required this.govNames,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => _DistrictDrillDown(
              govName: govName,
              submissions: submissions,
              distNames: distNames,
            ),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.location_city_rounded,
                        color: Colors.blue, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          govName,
                          style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 16,
                              fontWeight: FontWeight.w700),
                        ),
                        Text(
                          '${submissions.length} إرسالية',
                          style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 12,
                              color: Colors.grey.shade500),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios_rounded,
                      size: 16, color: Colors.grey),
                ],
              ),
              const SizedBox(height: 12),
              // Compliance bar
              _buildComplianceSummary(submissions),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildComplianceSummary(List<Map<String, dynamic>> subs) {
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
    final pct = totalFields > 0 ? totalYes / totalFields : 0.0;
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('متوسط الالتزام',
                style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 12,
                    color: Colors.grey.shade600)),
            Text('${(pct * 100).toStringAsFixed(0)}%',
                style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: pct > 0.8
                        ? Colors.green
                        : pct > 0.5
                            ? Colors.orange
                            : Colors.red)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 6,
            backgroundColor: Colors.grey.shade200,
            valueColor: AlwaysStoppedAnimation(
              pct > 0.8
                  ? Colors.green
                  : pct > 0.5
                      ? Colors.orange
                      : Colors.red,
            ),
          ),
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  DISTRICT DRILL-DOWN
// ═══════════════════════════════════════════════════════════════════════════

class _DistrictDrillDown extends StatelessWidget {
  final String govName;
  final List<Map<String, dynamic>> submissions;
  final Map<String, String> distNames;
  const _DistrictDrillDown({
    required this.govName,
    required this.submissions,
    required this.distNames,
  });

  @override
  Widget build(BuildContext context) {
    // Group by district
    final byDist = <String, List<Map<String, dynamic>>>{};
    for (final s in submissions) {
      final d = s['data'] as Map<String, dynamic>? ?? {};
      final distId = d['district_id'] as String? ?? 'غير محدد';
      byDist.putIfAbsent(distId, () => []).add(s);
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(govName,
            style: const TextStyle(
                fontFamily: 'Cairo', fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'المديريات (${byDist.length})',
            style: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 18,
                fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          ...byDist.entries.map((entry) {
            final distId = entry.key;
            final distSubs = entry.value;
            final distName =
                distNames[distId] ?? (distId == 'غير محدد'
                    ? 'غير محدد'
                    : 'مديرية ${distId.substring(0, 6)}');
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => _SupervisorDrillDown(
                      title: distName,
                      submissions: distSubs,
                    ),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.teal.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.map_rounded,
                            color: Colors.teal, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(distName,
                                style: const TextStyle(
                                    fontFamily: 'Cairo',
                                    fontWeight: FontWeight.w600)),
                            Text('${distSubs.length} زيارة',
                                style: TextStyle(
                                    fontFamily: 'Tajawal',
                                    fontSize: 12,
                                    color: Colors.grey.shade500)),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios_rounded,
                          size: 14, color: Colors.grey),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SUPERVISOR DRILL-DOWN → Full compliance analysis
// ═══════════════════════════════════════════════════════════════════════════

class _SupervisorDrillDown extends StatelessWidget {
  final String title;
  final List<Map<String, dynamic>> submissions;
  const _SupervisorDrillDown({required this.title, required this.submissions});

  @override
  Widget build(BuildContext context) {
    // Group by supervisor name
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
                fontFamily: 'Cairo', fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Supervisors list
          const Text('المشرفون',
              style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 18,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ...bySup.entries.map((entry) {
            final supName = entry.key;
            final supSubs = entry.value;
            final titles = supSubs
                .map((s) =>
                    ((s['data'] as Map?)?.cast<String, dynamic>() ?? {})['supervisor_title']
                        as String? ??
                    '')
                .toSet()
                .join(', ');
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: Colors.indigo.withValues(alpha: 0.1),
                  child: Text(supName.isNotEmpty ? supName[0] : '?',
                      style: const TextStyle(
                          color: Colors.indigo, fontWeight: FontWeight.w700)),
                ),
                title: Text(supName,
                    style: const TextStyle(
                        fontFamily: 'Cairo', fontWeight: FontWeight.w600)),
                subtitle: Text('$titles • ${supSubs.length} زيارة',
                    style: const TextStyle(fontFamily: 'Tajawal', fontSize: 12)),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => _ComplianceAnalysisScreen(
                      title: supName,
                      submissions: supSubs,
                    ),
                  ),
                ),
              ),
            );
          }),
          const Divider(height: 32),
          // Full compliance for all submissions in this district
          const Text('تحليل الالتزام التفصيلي',
              style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 18,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          _ComplianceAnalysis(submissions: submissions),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPLANCIY ANALYSIS SCREEN (per supervisor or all)
// ═══════════════════════════════════════════════════════════════════════════

class _ComplianceAnalysisScreen extends StatelessWidget {
  final String title;
  final List<Map<String, dynamic>> submissions;
  const _ComplianceAnalysisScreen(
      {required this.title, required this.submissions});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('تحليل: $title',
            style: const TextStyle(
                fontFamily: 'Cairo', fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('${submissions.length} إرسالية',
              style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 13,
                  color: Colors.grey.shade500)),
          const SizedBox(height: 16),
          _ComplianceAnalysis(submissions: submissions),
        ],
      ),
    );
  }
}

class _ComplianceAnalysis extends StatelessWidget {
  final List<Map<String, dynamic>> submissions;
  const _ComplianceAnalysis({required this.submissions});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: _yesNoSections.entries.map((section) {
        final sectionTitle = section.key;
        final fields = section.value;

        // Calculate yes/no per field across all submissions
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

        final sectionTotal =
            fieldStats.values.fold<int>(0, (s, v) => s + v.total);
        final sectionYes =
            fieldStats.values.fold<int>(0, (s, v) => s + v.yes);
        final sectionPct =
            sectionTotal > 0 ? sectionYes / sectionTotal : 0.0;

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Section header with percentage
              Row(
                children: [
                  Expanded(
                    child: Text(
                      sectionTitle,
                      style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 15,
                          fontWeight: FontWeight.w700),
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: (sectionPct > 0.8
                              ? Colors.green
                              : sectionPct > 0.5
                                  ? Colors.orange
                                  : Colors.red)
                          .withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${(sectionPct * 100).toStringAsFixed(0)}%',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: sectionPct > 0.8
                            ? Colors.green
                            : sectionPct > 0.5
                                ? Colors.orange
                                : Colors.red,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              // Section bar
              ClipRRect(
                borderRadius: BorderRadius.circular(3),
                child: LinearProgressIndicator(
                  value: sectionPct,
                  minHeight: 5,
                  backgroundColor: Colors.grey.shade200,
                  valueColor: AlwaysStoppedAnimation(
                    sectionPct > 0.8
                        ? Colors.green
                        : sectionPct > 0.5
                            ? Colors.orange
                            : Colors.red,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              // Individual fields
              ...fields.map((key) {
                final stats = fieldStats[key];
                if (stats == null || stats.total == 0) {
                  return const SizedBox.shrink();
                }
                final pct = stats.yes / stats.total;
                final label = _fieldLabels[key] ?? key;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 5,
                        child: Text(
                          label,
                          style: const TextStyle(
                              fontFamily: 'Tajawal', fontSize: 12),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Percentage bar
                      Expanded(
                        flex: 3,
                        child: Row(
                          children: [
                            Expanded(
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(3),
                                child: LinearProgressIndicator(
                                  value: pct,
                                  minHeight: 8,
                                  backgroundColor: Colors.grey.shade200,
                                  valueColor: AlwaysStoppedAnimation(
                                    pct == 1.0
                                        ? Colors.green
                                        : pct >= 0.5
                                            ? Colors.orange
                                            : Colors.red,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            SizedBox(
                              width: 36,
                              child: Text(
                                '${(pct * 100).toStringAsFixed(0)}%',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: pct == 1.0
                                      ? Colors.green
                                      : pct >= 0.5
                                          ? Colors.orange
                                          : Colors.red,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        );
      }).toList(),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TAB 2: SERVICE NUMBERS
// ═══════════════════════════════════════════════════════════════════════════

class _ServiceNumbersTab extends ConsumerWidget {
  const _ServiceNumbersTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subsAsync = ref.watch(supervisionSubmissionsProvider);

    return subsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorWidget(
        message: 'فشل تحميل البيانات',
        onRetry: () => ref.invalidate(supervisionSubmissionsProvider),
      ),
      data: (subs) {
        final realSubs = subs.where((s) {
          final d = s['data'] as Map<String, dynamic>? ?? {};
          return d['governorate_id'] != null;
        }).toList();

        if (realSubs.isEmpty) {
          return const _EmptyWidget(message: 'لا توجد بيانات');
        }

        // Aggregate service numbers
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

        final grandTotal =
            totals.values.fold<int>(0, (sum, v) => sum + v);

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(supervisionSubmissionsProvider);
            await ref.read(supervisionSubmissionsProvider.future);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Grand total header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.teal, Colors.teal.withValues(alpha: 0.7)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.people_rounded,
                        color: Colors.white, size: 32),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('إجمالي المترددين',
                            style: TextStyle(
                                fontFamily: 'Tajawal',
                                color: Colors.white70,
                                fontSize: 13)),
                        Text('$grandTotal',
                            style: const TextStyle(
                                fontFamily: 'Cairo',
                                color: Colors.white,
                                fontSize: 28,
                                fontWeight: FontWeight.w800)),
                      ],
                    ),
                    const Spacer(),
                    Text(
                        'من ${realSubs.length} زيارة',
                        style: const TextStyle(
                            fontFamily: 'Tajawal',
                            color: Colors.white70,
                            fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Service number cards
              ..._serviceNumberFields.entries.map((entry) {
                final key = entry.key;
                final label = entry.value;
                final total = totals[key] ?? 0;
                final count = counts[key] ?? 0;
                final avg = count > 0 ? (total / count).toStringAsFixed(1) : '0';
                final maxVal = totals.values.isEmpty
                    ? 1
                    : totals.values.reduce((a, b) => a > b ? a : b);
                final ratio = maxVal > 0 ? total / maxVal : 0.0;

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(label,
                                  style: const TextStyle(
                                      fontFamily: 'Tajawal',
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600)),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
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
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: ratio,
                            minHeight: 6,
                            backgroundColor: Colors.grey.shade200,
                            valueColor: const AlwaysStoppedAnimation(Colors.teal),
                          ),
                        ),
                      ],
                    ),
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

// ═══════════════════════════════════════════════════════════════════════════
//  TAB 3: CHALLENGES, ACTIONS, RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

class _ChallengesTab extends ConsumerWidget {
  const _ChallengesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subsAsync = ref.watch(supervisionSubmissionsProvider);

    return subsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorWidget(
        message: 'فشل تحميل البيانات',
        onRetry: () => ref.invalidate(supervisionSubmissionsProvider),
      ),
      data: (subs) {
        final realSubs = subs.where((s) {
          final d = s['data'] as Map<String, dynamic>? ?? {};
          return d['challenges'] != null ||
              d['actions_taken'] != null ||
              d['recommendations'] != null;
        }).toList();

        if (realSubs.isEmpty) {
          return const _EmptyWidget(
            icon: Icons.description_outlined,
            message: 'لا توجد تحديات أو توصيات مسجلة',
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(supervisionSubmissionsProvider);
            await ref.read(supervisionSubmissionsProvider.future);
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: realSubs.length,
            itemBuilder: (context, index) {
              final sub = realSubs[index];
              final d = sub['data'] as Map<String, dynamic>? ?? {};
              final supervisor =
                  d['supervisor_name'] as String? ?? 'غير محدد';
              final date = (sub['created_at'] as String? ?? '').substring(0, 10);
              final challenges = d['challenges'] as String?;
              final actions = d['actions_taken'] as String?;
              final recommendations = d['recommendations'] as String?;

              return Card(
                margin: const EdgeInsets.only(bottom: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: Colors.indigo.withValues(alpha: 0.1),
                            child: Text(
                                supervisor.isNotEmpty ? supervisor[0] : '?',
                                style: const TextStyle(
                                    color: Colors.indigo,
                                    fontWeight: FontWeight.w700)),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(supervisor,
                                    style: const TextStyle(
                                        fontFamily: 'Cairo',
                                        fontWeight: FontWeight.w600)),
                                Text(date,
                                    style: TextStyle(
                                        fontFamily: 'Tajawal',
                                        fontSize: 12,
                                        color: Colors.grey.shade500)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Challenges
                      if (challenges != null && challenges.trim().isNotEmpty)
                        _TextSection(
                          title: 'التحديات والصعوبات',
                          text: challenges,
                          icon: Icons.warning_amber_rounded,
                          color: Colors.red,
                        ),

                      // Actions taken
                      if (actions != null && actions.trim().isNotEmpty)
                        _TextSection(
                          title: 'الإجراءات المتخذة',
                          text: actions,
                          icon: Icons.build_rounded,
                          color: Colors.blue,
                        ),

                      // Recommendations
                      if (recommendations != null &&
                          recommendations.trim().isNotEmpty)
                        _TextSection(
                          title: 'التوصيات',
                          text: recommendations,
                          icon: Icons.lightbulb_rounded,
                          color: Colors.green,
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class _TextSection extends StatelessWidget {
  final String title;
  final String text;
  final IconData icon;
  final Color color;
  const _TextSection({
    required this.title,
    required this.text,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Text(title,
                  style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: color)),
            ],
          ),
          const SizedBox(height: 6),
          Text(text,
              style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14),
              textDirection: TextDirection.rtl),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TAB 4: PHOTOS
// ═══════════════════════════════════════════════════════════════════════════

class _PhotosTab extends ConsumerWidget {
  const _PhotosTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subsAsync = ref.watch(supervisionSubmissionsProvider);

    return subsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorWidget(
        message: 'فشل تحميل البيانات',
        onRetry: () => ref.invalidate(supervisionSubmissionsProvider),
      ),
      data: (subs) {
        // Collect all photos from submissions
        final photos = <({String url, String supervisor, String date})>[];
        for (final s in subs) {
          final d = s['data'] as Map<String, dynamic>? ?? {};
          final supervisor =
              d['supervisor_name'] as String? ?? 'غير محدد';
          final date = (s['created_at'] as String? ?? '').substring(0, 10);

          // Photos from submission photos array
          final subPhotos = s['photos'] as List?;
          if (subPhotos != null) {
            for (final p in subPhotos) {
              if (p is String && p.isNotEmpty) {
                photos.add((url: p, supervisor: supervisor, date: date));
              }
            }
          }

          // Photo URL from data
          final photoUrl = d['supervision_photo'] as String?;
          if (photoUrl != null && photoUrl.isNotEmpty) {
            photos.add((url: photoUrl, supervisor: supervisor, date: date));
          }
        }

        if (photos.isEmpty) {
          return const _EmptyWidget(
            icon: Icons.photo_library_outlined,
            message: 'لا توجد صور توثيقية حتى الآن',
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(supervisionSubmissionsProvider);
            await ref.read(supervisionSubmissionsProvider.future);
          },
          child: GridView.builder(
            padding: const EdgeInsets.all(12),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 0.85,
            ),
            itemCount: photos.length,
            itemBuilder: (context, index) {
              final photo = photos[index];
              return GestureDetector(
                onTap: () => _showFullPhoto(context, photo),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.network(
                        photo.url,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: Colors.grey.shade200,
                          child: const Icon(Icons.broken_image_rounded,
                              size: 40, color: Colors.grey),
                        ),
                      ),
                      // Overlay with info
                      Positioned(
                        bottom: 0,
                        left: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                              colors: [
                                Colors.black.withValues(alpha: 0.7),
                                Colors.transparent,
                              ],
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                photo.supervisor,
                                style: const TextStyle(
                                  fontFamily: 'Tajawal',
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                photo.date,
                                style: TextStyle(
                                  fontFamily: 'Tajawal',
                                  color: Colors.white.withValues(alpha: 0.8),
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  void _showFullPhoto(
      BuildContext context, ({String url, String supervisor, String date}) photo) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                photo.url,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => Container(
                  height: 200,
                  color: Colors.grey.shade900,
                  child: const Center(
                    child: Icon(Icons.broken_image_rounded,
                        size: 48, color: Colors.white54),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${photo.supervisor} — ${photo.date}',
                style: const TextStyle(
                    fontFamily: 'Tajawal', color: Colors.white, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SHARED WIDGETS
// ═══════════════════════════════════════════════════════════════════════════

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
            Text(message,
                style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14),
                textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('إعادة المحاولة',
                  style: TextStyle(fontFamily: 'Tajawal')),
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
  const _EmptyWidget({this.icon = Icons.inbox_rounded, required this.message});

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
            Text(message,
                style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 16,
                    color: Colors.grey.shade500),
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
