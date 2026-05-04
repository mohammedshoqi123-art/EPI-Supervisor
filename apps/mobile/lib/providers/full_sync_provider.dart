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

  int get total => forms + submissions + governorates + districts + references + facilities;
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

      // ═══ 4. Submissions (ALL — up to 2000) ═══
      try {
        final subData = await db.getSubmissions(
          campaignType: campaign.value,
          limit: 2000,
        );
        final filter = SubmissionsFilter(
          campaignType: campaign.value,
          limit: 2000,
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

      // ═══ 6. Health Facilities (for each district) ═══
      try {
        // Get districts first
        final allDists = await db.getDistricts();
        for (final dist in allDists) {
          final distId = dist['id'] as String?;
          if (distId == null) continue;
          try {
            final facData = await db.getHealthFacilities(districtId: distId);
            await cache.putList('facilities_$distId', facData);
            facs += facData.length;
          } catch (_) {}
        }
        debugPrint('[FullSync] ✅ Facilities: $facs');
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
      _ref.invalidate(submissionsProvider);
      _ref.invalidate(formStatsProvider);
      _ref.invalidate(dashboardAnalyticsProvider);
      _ref.invalidate(shortagesProvider);
      _ref.invalidate(submissionTrendProvider);
      _ref.invalidate(governorateRankingProvider);

      state = FullSyncState.done;
      debugPrint('[FullSync] ✅ Complete: $forms forms, $submissions subs, $govs govs, $dists dists');

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

final fullSyncProvider = StateNotifierProvider<FullSyncNotifier, FullSyncState>((ref) {
  return FullSyncNotifier(ref);
});
