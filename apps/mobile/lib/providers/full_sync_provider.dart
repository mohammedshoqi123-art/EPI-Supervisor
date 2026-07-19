import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_core/epi_core.dart';
import 'package:epi_core/src/utils/connectivity_utils.dart';
import '../providers/app_providers.dart';

/// ═══════════════════════════════════════════════════════════════════════
/// Full Data Sync — يجلب ALL data من السيرفر ويخزنها بالكاش
/// بعد المزامنة: كل الشاشات تقرأ من الكاش (سريع)
/// ═══════════════════════════════════════════════════════════════════════

enum FullSyncState { idle, syncing, done, error }

/// Sync step result — tracks success/failure per step
class SyncStepResult {
  final String name;
  final bool success;
  final int count;
  final String? error;

  const SyncStepResult({
    required this.name,
    required this.success,
    this.count = 0,
    this.error,
  });
}

class FullSyncResult {
  final int forms;
  final int submissions;
  final int governorates;
  final int districts;
  final int references;
  final int facilities;
  final String? error;
  final List<SyncStepResult> stepResults;

  const FullSyncResult({
    this.forms = 0,
    this.submissions = 0,
    this.governorates = 0,
    this.districts = 0,
    this.references = 0,
    this.facilities = 0,
    this.error,
    this.stepResults = const [],
  });

  int get total =>
      forms + submissions + governorates + districts + references + facilities;

  /// عدد الخطوات الناجحة
  int get successCount => stepResults.where((s) => s.success).length;

  /// عدد الخطوات الفاشلة
  int get failureCount => stepResults.where((s) => !s.success).length;

  /// هل كل الخطوات نجحت؟
  bool get allSuccess => stepResults.isNotEmpty && failureCount == 0;

  /// رسالة ملخص للمستخدم
  String get summary {
    if (error != null) return 'خطأ فادح: $error';
    final parts = <String>[];
    if (governorates > 0) parts.add('$governorates محافظة');
    if (districts > 0) parts.add('$districts مديرية');
    if (forms > 0) parts.add('$forms نموذج');
    if (submissions > 0) parts.add('$submissions إرسالية');
    if (references > 0) parts.add('$references مرجع');
    if (facilities > 0) parts.add('$facilities مرفق');
    if (parts.isEmpty) return 'لم تتم مزامنة أي بيانات';
    final base = 'تمت المزامنة: ${parts.join('، ')}';
    if (failureCount > 0) {
      return '$base\n⚠️ فشلت $failureCount خطوة من ${stepResults.length}';
    }
    return base;
  }
}

class FullSyncNotifier extends StateNotifier<FullSyncState> {
  final Ref _ref;

  FullSyncNotifier(this._ref) : super(FullSyncState.idle);

  /// جلب ALL data من السيرفر وحفظها بالكاش
  Future<FullSyncResult> syncAll() async {
    if (state == FullSyncState.syncing) {
      return const FullSyncResult();
    }

    if (!ConnectivityUtils.isOnline) {
      state = FullSyncState.error;
      return const FullSyncResult(error: 'لا يمكن المزامنة بدون إنترنت');
    }

    state = FullSyncState.syncing;
    int forms = 0, submissions = 0, govs = 0, dists = 0, refs = 0, facs = 0;
    final steps = <SyncStepResult>[];

    try {
      final db = _ref.read(databaseServiceProvider);
      final cache = await _ref.read(offlineDataCacheProvider.future);
      final campaign = _ref.read(campaignProvider);

      // ═══ FIX: Parallel fetch — Governorates + Districts + Forms + References + Facilities ═══
      // Previously: 5 sequential network calls = 5 × RTT (round-trip time).
      // Now: all 5 in parallel = 1 × RTT. Submissions still sequential (pagination).

      final parallelResults = await Future.wait([
        // 1. Governorates
        db.getGovernorates().then((data) async {
          await cache.putList('governorates', data);
          return {'name': 'المحافظات', 'data': data};
        }).catchError((e) => {'name': 'المحافظات', 'error': e}),

        // 2. Districts
        db.getDistricts().then((data) async {
          await cache.putList('districts_all', data);
          return {'name': 'المديريات', 'data': data};
        }).catchError((e) => {'name': 'المديريات', 'error': e}),

        // 3. Forms (for current campaign)
        db.getForms(campaignType: campaign.value).then((data) async {
          await cache.putList('forms_${campaign.value}', data);
          return {'name': 'النماذج', 'data': data};
        }).catchError((e) => {'name': 'النماذج', 'error': e}),

        // 4. References
        db.getReferences().then((data) async {
          await cache.putList('references', data);
          return {'name': 'المراجع', 'data': data};
        }).catchError((e) => {'name': 'المراجع', 'error': e}),

        // 5. Health Facilities
        db.getHealthFacilities().then((data) async {
          await cache.putList('facilities_all', data);
          // Also cache by district
          final byDistrict = <String, List<Map<String, dynamic>>>{};
          for (final fac in data) {
            final distId = fac['district_id'] as String? ?? '';
            if (distId.isNotEmpty) {
              byDistrict.putIfAbsent(distId, () => []).add(fac);
            }
          }
          for (final entry in byDistrict.entries) {
            await cache.putList('facilities_${entry.key}', entry.value);
          }
          return {'name': 'المرافق', 'data': data};
        }).catchError((e) => {'name': 'المرافق', 'error': e}),
      ], eagerError: false).timeout(const Duration(seconds: 45));

      // Process parallel results
      for (final result in parallelResults) {
        final name = result['name'] as String;
        if (result.containsKey('error')) {
          steps.add(SyncStepResult(name: name, success: false, error: result['error'].toString()));
          _log('❌ $name: ${result['error']}');
        } else {
          final data = result['data'] as List;
          steps.add(SyncStepResult(name: name, success: true, count: data.length));
          _log('✅ $name: ${data.length}');
          // Update counters
          switch (name) {
            case 'المحافظات': govs = data.length; break;
            case 'المديريات': dists = data.length; break;
            case 'النماذج': forms = data.length; break;
            case 'المراجع': refs = data.length; break;
            case 'المرافق': facs = data.length; break;
          }
        }
      }

      await Future.delayed(Duration.zero);

      // ═══ 4. Submissions (pagination with timeout) ═══
      try {
        final allSubs = <Map<String, dynamic>>[];
        const pageSize = 2000;
        int offset = 0;
        bool hasMore = true;
        final subStart = DateTime.now();

        while (hasMore) {
          final batch = await db.getSubmissions(
            campaignType: campaign.value,
            limit: pageSize,
            offset: offset,
          ).timeout(const Duration(seconds: 15));
          if (batch.isEmpty || batch.length < pageSize) hasMore = false;
          allSubs.addAll(batch);
          offset += pageSize;
          await Future.delayed(Duration.zero);
          if (allSubs.length >= 5000) break;
          if (DateTime.now().difference(subStart) > const Duration(seconds: 60)) {
            _log('⚠️ Submissions timeout at ${allSubs.length}');
            hasMore = false;
          }
        }

        final filter = SubmissionsFilter(
          campaignType: campaign.value,
          limit: allSubs.length,
        );
        await cache.putList(filter.cacheKey, allSubs);
        submissions = allSubs.length;
        steps.add(SyncStepResult(name: 'الإرساليات', success: true, count: submissions));
        _log('✅ Submissions: $submissions (paginated, ${offset ~/ pageSize} batches)');
      } catch (e) {
        steps.add(SyncStepResult(name: 'الإرساليات', success: false, error: e.toString()));
        _log('❌ Submissions: $e');
      }
      // ═══ PERFORMANCE: Yield to UI thread after heavy submissions sync ═══
      await Future.delayed(Duration.zero);

      // References + Facilities are already synced in parallel block above

      // ═══ 7. Sync pending uploads ═══
      try {
        // ⚠️ OFFLINE FIX: تجاوز المزامنة بدون إنترنت
        if (!ConnectivityUtils.isOnline) {
          steps.add(SyncStepResult(name: 'الإرسالات المعلقة', success: false, error: 'لا يوجد اتصال'));
          _log('⚠️ Pending sync skipped — offline');
        } else {
          final syncService = await _ref.read(syncServiceProvider.future);
          final result = await syncService.sync();
          steps.add(SyncStepResult(name: 'الإرسالات المعلقة', success: true, count: result.synced));
          _log('✅ Pending synced: ${result.synced}');
        }
      } catch (e) {
        steps.add(SyncStepResult(name: 'الإرسالات المعلقة', success: false, error: e.toString()));
        _log('❌ Pending sync: $e');
      }

      // ═══ 8. Invalidate Riverpod providers ═══
      _ref.invalidate(governoratesProvider);
      _ref.invalidate(districtsProvider);
      _ref.invalidate(formsProvider);
      _ref.invalidate(formStatsProvider);
      _ref.invalidate(dashboardAnalyticsProvider);

      // ═══ 9. Determine final state ═══
      final totalSynced = forms + submissions + govs + dists + refs + facs;
      if (totalSynced == 0) {
        state = FullSyncState.error;
        _log('⚠️ All sync steps returned 0 — possible network issue');
      } else if (steps.any((s) => !s.success)) {
        state = FullSyncState.done; // partial success
        _log('⚠️ Partial sync: ${steps.where((s) => s.success).length}/${steps.length} steps succeeded');
      } else {
        state = FullSyncState.done;
        _log('✅ Complete: $forms forms, $submissions subs, $govs govs, $dists dists');
      }

      return FullSyncResult(
        forms: forms,
        submissions: submissions,
        governorates: govs,
        districts: dists,
        references: refs,
        facilities: facs,
        stepResults: steps,
      );
    } catch (e) {
      state = FullSyncState.error;
      _log('❌ Fatal error: $e');
      return FullSyncResult(
        error: e.toString(),
        stepResults: steps,
      );
    }
  }

  /// تسجيل آمن — فقط في debug mode
  void _log(String msg) {
    if (kDebugMode) {
      debugPrint('[FullSync] $msg');
    }
    // TODO: في الإنتاج، أرسل الأخطاء إلى Sentry/Crashlytics
  }

  void reset() {
    state = FullSyncState.idle;
  }
}

final fullSyncProvider =
    StateNotifierProvider<FullSyncNotifier, FullSyncState>((ref) {
  return FullSyncNotifier(ref);
});
