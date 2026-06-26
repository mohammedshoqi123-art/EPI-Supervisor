import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';

/// ═══════════════════════════════════════════════════════════════════════
/// Full Data Sync — يجلب ALL data من السيرفر ويخزنها بالكاش
/// بعد المزامنة: كل الشاشات تقرأ من الكاش (سريع)
/// المستخدم يضغط الزرار بأي وقت يبي يحدث البيانات
/// ═══════════════════════════════════════════════════════════════════════

enum FullSyncState { idle, syncing, done, error }

class FullSyncResult {
  final int forms;
  final int submissions;
  final int governorates;
  final int districts;
  final int references;
  final int facilities;
  final String? error;

  const FullSyncResult({
    this.forms = 0,
    this.submissions = 0,
    this.governorates = 0,
    this.districts = 0,
    this.references = 0,
    this.facilities = 0,
    this.error,
  });

  int get total =>
      forms + submissions + governorates + districts + references + facilities;
}

class FullSyncNotifier extends StateNotifier<FullSyncState> {
  final Ref _ref;

  FullSyncNotifier(this._ref) : super(FullSyncState.idle);

  /// جلب ALL data من السيرفر وحفظها بالكاش
  Future<FullSyncResult> syncAll() async {
    if (state == FullSyncState.syncing) {
      return const FullSyncResult();
    }

    state = FullSyncState.syncing;
    int forms = 0, submissions = 0, govs = 0, dists = 0, refs = 0, facs = 0;

    try {
      final db = _ref.read(databaseServiceProvider);
      final cache = await _ref.read(offlineDataCacheProvider.future);
      final campaign = _ref.read(campaignProvider);

      // ═══ 1. Governorates ═══
      try {
        final govData = await db.getGovernorates();
        await cache.putList('governorates', govData);
        govs = govData.length;
        debugPrint('[FullSync] ✅ Governorates: $govs');
      } catch (e) {
        debugPrint('[FullSync] ❌ Governorates: $e');
      }

      // ═══ 2. Districts ═══
      try {
        final distData = await db.getDistricts();
        await cache.putList('districts_all', distData);
        dists = distData.length;
        debugPrint('[FullSync] ✅ Districts: $dists');
      } catch (e) {
        debugPrint('[FullSync] ❌ Districts: $e');
      }

      // ═══ 3. Forms (for current campaign) ═══
      try {
        final formData = await db.getForms(campaignType: campaign.value);
        await cache.putList('forms_${campaign.value}', formData);
        forms = formData.length;
        debugPrint('[FullSync] ✅ Forms: $forms');
      } catch (e) {
        debugPrint('[FullSync] ❌ Forms: $e');
      }

      // ═══ 4. Submissions (limit 500 — cache handles the rest) ═══
      try {
        final subData = await db.getSubmissions(
          campaignType: campaign.value,
          limit: 500, // ═══ PERFORMANCE: Reduced from 2000 ═══
        );
        final filter = SubmissionsFilter(
          campaignType: campaign.value,
          limit: 500,
        );
        await cache.putList(filter.cacheKey, subData);
        submissions = subData.length;
        debugPrint('[FullSync] ✅ Submissions: $submissions');
      } catch (e) {
        debugPrint('[FullSync] ❌ Submissions: $e');
      }

      // ═══ 5. References ═══
      try {
        final refData = await db.getReferences();
        await cache.putList('references', refData);
        refs = refData.length;
        debugPrint('[FullSync] ✅ References: $refs');
      } catch (e) {
        debugPrint('[FullSync] ❌ References: $e');
      }

      // ═══ 6. Health Facilities (ALL in single query — no N+1) ═══
      try {
        // ═══ PERFORMANCE FIX: Single query instead of loop per district ═══
        final facData = await db.getHealthFacilities();
        await cache.putList('facilities_all', facData);
        facs = facData.length;

        // Also cache per-district for quick lookup
        final byDistrict = <String, List<Map<String, dynamic>>>{};
        for (final fac in facData) {
          final distId = fac['district_id'] as String? ?? '';
          if (distId.isNotEmpty) {
            byDistrict.putIfAbsent(distId, () => []).add(fac);
          }
        }
        for (final entry in byDistrict.entries) {
          await cache.putList('facilities_${entry.key}', entry.value);
        }

        debugPrint('[FullSync] ✅ Facilities: $facs (${byDistrict.length} districts)');
      } catch (e) {
        debugPrint('[FullSync] ❌ Facilities: $e');
      }

      // ═══ 7. Sync pending uploads ═══
      try {
        final syncService = await _ref.read(syncServiceProvider.future);
        final result = await syncService.sync();
        debugPrint('[FullSync] ✅ Pending synced: ${result.synced}');
      } catch (e) {
        debugPrint('[FullSync] ❌ Pending sync: $e');
      }

      // ═══ 8. Invalidate Riverpod providers to pick up new cache ═══
      _ref.invalidate(governoratesProvider);
      _ref.invalidate(districtsProvider);
      _ref.invalidate(formsProvider);
      _ref.invalidate(formStatsProvider);
      _ref.invalidate(dashboardAnalyticsProvider);
      // Note: submissionsProvider, shortagesProvider, submissionTrendProvider, governorateRankingProvider
      // are now FutureProvider.family.autoDispose — their consumers re-read with the new context
      // automatically when invalidated providers downstream change.

      // Fix: check if at least some data was fetched — don't report success if all failed
      final totalSynced = forms + submissions + govs + dists + refs + facs;
      if (totalSynced == 0) {
        state = FullSyncState.error;
        debugPrint('[FullSync] ⚠️ All sync steps returned 0 items — possible network issue');
      } else {
        state = FullSyncState.done;
        debugPrint(
            '[FullSync] ✅ Complete: $forms forms, $submissions subs, $govs govs, $dists dists');
      }

      return FullSyncResult(
        forms: forms,
        submissions: submissions,
        governorates: govs,
        districts: dists,
        references: refs,
        facilities: facs,
      );
    } catch (e) {
      state = FullSyncState.error;
      debugPrint('[FullSync] ❌ Fatal error: $e');
      return FullSyncResult(error: e.toString());
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
