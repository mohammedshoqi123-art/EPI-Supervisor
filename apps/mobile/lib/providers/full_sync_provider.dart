import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_core/epi_core.dart';
import 'package:epi_core/src/utils/connectivity_utils.dart';
import '../providers/app_providers.dart';

/// ═══════════════════════════════════════════════════════════════════════
/// Smart Full Data Sync — يجلب البيانات الذكية من السيرفر
/// ═══ الميزات ═══
/// 1. يتحقق من الكاش أولاً — إذا البيانات حديثة (< ساعة)، ما يسحبها
/// 2. يجلب فقط اللي تغيّر — بدل ما يسحب كل شي
/// 3. يعرض progress — يعرف المستخدم كم باقي
/// 4. يرفع الإرساليات المعلقة أولاً
/// ═══════════════════════════════════════════════════════════════════════

enum FullSyncState { idle, syncing, done, error }

/// Sync step result — tracks success/failure per step
class SyncStepResult {
  final String name;
  final bool success;
  final int count;
  final String? error;
  final bool skipped; // true if data was fresh (skipped)

  const SyncStepResult({
    required this.name,
    required this.success,
    this.count = 0,
    this.error,
    this.skipped = false,
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
  final int pendingSynced; // number of pending items uploaded

  const FullSyncResult({
    this.forms = 0,
    this.submissions = 0,
    this.governorates = 0,
    this.districts = 0,
    this.references = 0,
    this.facilities = 0,
    this.error,
    this.stepResults = const [],
    this.pendingSynced = 0,
  });

  int get total =>
      forms + submissions + governorates + districts + references + facilities;

  /// عدد الخطوات الناجحة
  int get successCount => stepResults.where((s) => s.success && !s.skipped).length;

  /// عدد الخطوات المتخطاة (بيانات حديثة)
  int get skippedCount => stepResults.where((s) => s.skipped).length;

  /// عدد الخطوات الفاشلة
  int get failureCount => stepResults.where((s) => !s.success && !s.skipped).length;

  /// هل كل الخطوات نجحت؟
  bool get allSuccess => stepResults.isNotEmpty && failureCount == 0;

  /// رسالة ملخص للمستخدم
  String get summary {
    if (error != null) return 'خطأ فادح: $error';
    final parts = <String>[];
    if (pendingSynced > 0) parts.add('$pendingSynced إرسالية مُزامنة');
    if (governorates > 0) parts.add('$governorates محافظة');
    if (districts > 0) parts.add('$districts مديرية');
    if (forms > 0) parts.add('$forms نموذج');
    if (submissions > 0) parts.add('$submissions إرسالية');
    if (references > 0) parts.add('$references مرجع');
    if (facilities > 0) parts.add('$facilities مرفق');
    if (parts.isEmpty) return 'لم تتم مزامنة أي بيانات';
    final base = 'تمت المزامنة: ${parts.join('، ')}';
    if (skippedCount > 0) {
      return '$base\nℹ️ $skippedCount خطوة متخطاة (بيانات حديثة)';
    }
    if (failureCount > 0) {
      return '$base\n⚠️ فشلت $failureCount خطوة من ${stepResults.length}';
    }
    return base;
  }
}

/// Progress callback — called on each step
typedef SyncProgressCallback = void Function(String step, int current, int total);

class FullSyncNotifier extends StateNotifier<FullSyncState> {
  final Ref _ref;
  Completer<FullSyncResult>? _activeCompleter; // ═══ FIX: Track active sync ═══

  FullSyncNotifier(this._ref) : super(FullSyncState.idle);

  /// مزامنة ذكية — تتحقق من الكاش أولاً
  Future<FullSyncResult> syncAll({SyncProgressCallback? onProgress}) async {
    // ═══ FIX: If sync is already running, wait for it instead of returning empty ═══
    // Previously: returned empty result → caller didn't know sync was running
    // Now: returns same result as the running sync
    if (state == FullSyncState.syncing) {
      if (_activeCompleter != null && !_activeCompleter!.isCompleted) {
        debugPrint('[FullSync] Sync already in progress — waiting for it');
        return _activeCompleter!.future;
      }
      // Stale state — reset
      state = FullSyncState.idle;
    }

    if (!ConnectivityUtils.isOnline) {
      state = FullSyncState.error;
      return const FullSyncResult(error: 'لا يمكن المزامنة بدون إنترنت');
    }

    state = FullSyncState.syncing;
    _activeCompleter = Completer<FullSyncResult>();
    int forms = 0, submissions = 0, govs = 0, dists = 0, refs = 0, facs = 0;
    int pendingSynced = 0;
    final steps = <SyncStepResult>[];

    try {
      final db = _ref.read(databaseServiceProvider);
      final cache = await _ref.read(offlineDataCacheProvider.future);
      final campaign = _ref.read(campaignProvider);

      // ═══ الخطوة 0: رفع الإرساليات المعلقة أولاً ═══
      onProgress?.call('رفع الإرساليات المعلقة...', 0, 7);
      try {
        if (!ConnectivityUtils.isOnline) {
          steps.add(SyncStepResult(name: 'الإرساليات المعلقة', success: false, error: 'لا يوجد اتصال'));
        } else {
          final syncService = await _ref.read(syncServiceProvider.future);
          final result = await syncService.sync();
          pendingSynced = result.synced;
          steps.add(SyncStepResult(name: 'الإرساليات المعلقة', success: true, count: result.synced));
          _log('✅ Pending synced: ${result.synced}');
        }
      } catch (e) {
        steps.add(SyncStepResult(name: 'الإرساليات المعلقة', success: false, error: e.toString()));
        _log('❌ Pending sync: $e');
      }

      // ═══ الخطوة 1-5: جلب البيانات المرجعية (بالتوازي) ═══
      // ═══ ذكي: يتحقق من الكاش — إذا حديث (< ساعة)، يتخطى ═══
      const staleThreshold = Duration(hours: 1);

      onProgress?.call('جلب البيانات المرجعية...', 1, 7);

      // Check which data is stale and needs refresh
      final needsRefresh = <String, bool>{};
      final cacheKeys = ['governorates', 'districts_all', 'forms_${campaign.value}', 'references', 'facilities_all'];

      for (final key in cacheKeys) {
        needsRefresh[key] = cache.isStale(key, staleThreshold);
      }

      // Only fetch stale data — skip fresh data
      final futures = <Future<Map<String, dynamic>>>[];

      // 1. Governorates
      if (needsRefresh['governorates'] == true) {
        futures.add(
          db.getGovernorates().then((data) async {
            await cache.putList('governorates', data);
            return {'name': 'المحافظات', 'data': data};
          }).catchError((e) => {'name': 'المحافظات', 'error': e}),
        );
      } else {
        futures.add(Future.value({'name': 'المحافظات', 'data': <Map<String, dynamic>>[], 'skipped': true}));
      }

      // 2. Districts
      if (needsRefresh['districts_all'] == true) {
        futures.add(
          db.getDistricts().then((data) async {
            await cache.putList('districts_all', data);
            return {'name': 'المديريات', 'data': data};
          }).catchError((e) => {'name': 'المديريات', 'error': e}),
        );
      } else {
        futures.add(Future.value({'name': 'المديريات', 'data': <Map<String, dynamic>>[], 'skipped': true}));
      }

      // 3. Forms
      if (needsRefresh['forms_${campaign.value}'] == true) {
        futures.add(
          db.getForms(campaignType: campaign.value).then((data) async {
            await cache.putList('forms_${campaign.value}', data);
            return {'name': 'النماذج', 'data': data};
          }).catchError((e) => {'name': 'النماذج', 'error': e}),
        );
      } else {
        futures.add(Future.value({'name': 'النماذج', 'data': <Map<String, dynamic>>[], 'skipped': true}));
      }

      // 4. References
      if (needsRefresh['references'] == true) {
        futures.add(
          db.getReferences().then((data) async {
            await cache.putList('references', data);
            return {'name': 'المراجع', 'data': data};
          }).catchError((e) => {'name': 'المراجع', 'error': e}),
        );
      } else {
        futures.add(Future.value({'name': 'المراجع', 'data': <Map<String, dynamic>>[], 'skipped': true}));
      }

      // 5. Facilities
      if (needsRefresh['facilities_all'] == true) {
        futures.add(
          db.getHealthFacilities().then((data) async {
            await cache.putList('facilities_all', data);
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
        );
      } else {
        futures.add(Future.value({'name': 'المرافق', 'data': <Map<String, dynamic>>[], 'skipped': true}));
      }

      // Wait for all parallel fetches
      final parallelResults = await Future.wait(futures, eagerError: false).timeout(
        const Duration(seconds: 30),
      );

      // Process results
      for (final result in parallelResults) {
        final name = result['name'] as String;
        final skipped = result['skipped'] == true;

        if (result.containsKey('error')) {
          steps.add(SyncStepResult(name: name, success: false, error: result['error'].toString()));
          _log('❌ $name: ${result['error']}');
        } else if (skipped) {
          steps.add(SyncStepResult(name: name, success: true, skipped: true));
          _log('⏭️ $name: skipped (fresh)');
        } else {
          final data = result['data'] as List;
          steps.add(SyncStepResult(name: name, success: true, count: data.length));
          _log('✅ $name: ${data.length}');
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

      // ═══ الخطوة 6: جلب الإرساليات (pagination) ═══
      onProgress?.call('جلب الإرساليات...', 6, 7);
      final subsStale = cache.isStale('submissions_camp_${campaign.value}_limit_2000', staleThreshold);

      if (subsStale) {
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
            if (allSubs.length >= 2000) break;
            if (DateTime.now().difference(subStart) > const Duration(seconds: 45)) {
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
          _log('✅ Submissions: $submissions (paginated)');
        } catch (e) {
          steps.add(SyncStepResult(name: 'الإرساليات', success: false, error: e.toString()));
          _log('❌ Submissions: $e');
        }
      } else {
        steps.add(SyncStepResult(name: 'الإرسالات', success: true, skipped: true));
        _log('⏭️ Submissions: skipped (fresh)');
      }

      // ═══ الخطوة 7: تحديث Providers ═══
      onProgress?.call('تحديث الواجهة...', 7, 7);
      _ref.invalidate(governoratesProvider);
      _ref.invalidate(districtsProvider);
      _ref.invalidate(formsProvider);
      _ref.invalidate(formStatsProvider);
      _ref.invalidate(dashboardAnalyticsProvider);

      // ═══ تحديد الحالة النهائية ═══
      final totalSynced = forms + submissions + govs + dists + refs + facs + pendingSynced;
      if (totalSynced == 0 && steps.every((s) => !s.skipped)) {
        state = FullSyncState.error;
        _log('⚠️ All sync steps returned 0 — possible network issue');
      } else if (steps.any((s) => !s.success && !s.skipped)) {
        state = FullSyncState.done; // partial success
        _log('⚠️ Partial sync: ${steps.where((s) => s.success).length}/${steps.length} steps succeeded');
      } else {
        state = FullSyncState.done;
        _log('✅ Complete: $forms forms, $submissions subs, $govs govs, $dists dists, $pendingSynced pending');
      }

      final result = FullSyncResult(
        forms: forms,
        submissions: submissions,
        governorates: govs,
        districts: dists,
        references: refs,
        facilities: facs,
        stepResults: steps,
        pendingSynced: pendingSynced,
      );
      if (_activeCompleter != null && !_activeCompleter!.isCompleted) {
        _activeCompleter!.complete(result);
      }
      return result;
    } catch (e) {
      state = FullSyncState.error;
      _log('❌ Fatal error: $e');
      final result = FullSyncResult(
        error: e.toString(),
        stepResults: steps,
      );
      if (_activeCompleter != null && !_activeCompleter!.isCompleted) {
        _activeCompleter!.complete(result);
      }
      return result;
    }
  }

  /// تسجيل آمن — فقط في debug mode
  void _log(String msg) {
    if (kDebugMode) {
      debugPrint('[FullSync] $msg');
    }
  }

  void reset() {
    state = FullSyncState.idle;
  }
}

final fullSyncProvider =
    StateNotifierProvider<FullSyncNotifier, FullSyncState>((ref) {
  return FullSyncNotifier(ref);
});
