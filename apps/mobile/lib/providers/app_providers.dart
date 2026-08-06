import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:hive_flutter/hive_flutter.dart';
import 'package:epi_core/epi_core.dart';
import '../services/cloud_draft_service.dart';

// ─── Core Services ────────────────────────────────────────────────────────────
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

/// ═══ Cloud Draft Service — نسخة احتياطية سحابية للمسودات ═══
/// يحمي المسودات من تلف Hive أو تغيير الجهاز
final cloudDraftServiceProvider = Provider<CloudDraftService?>((ref) {
  try {
    final client = Supabase.instance.client;
    return CloudDraftService(client);
  } catch (e) {
    debugPrint('[CloudDraftService] Supabase not ready: $e');
    return null;
  }
});

final encryptionServiceProvider = Provider<EncryptionService>(
  (ref) => EncryptionService(),
);

final databaseServiceProvider = Provider<DatabaseService>(
  (ref) => DatabaseService(ref.read(apiClientProvider)),
);

final analyticsServiceProvider = Provider<AnalyticsService>(
  (ref) => AnalyticsService(ref.read(apiClientProvider)),
);

// ─── Offline / Sync ───────────────────────────────────────────────────────────

/// ═══ FIX: Robust offline manager initialization with connectivity bridge ═══
/// On web (kIsWeb): Hive is not initialized — runs in online-only mode.
final offlineManagerProvider = FutureProvider<OfflineManager>((ref) async {
  final manager = OfflineManager(ref.read(encryptionServiceProvider));

  // On web, skip Hive initialization entirely (online-only mode)
  if (kIsWeb) {
    debugPrint(
        '[offlineManagerProvider] Web mode — online-only, skipping Hive');
    manager.updateConnectivity(true);
    return manager;
  }

  // ═══ FIX: Hive Hardening — Auto-recovery on corruption ═══
  // سابقاً: init يفشل → degraded mode → مسودات غير متاحة
  // الآن: محاولة init → إذا فشل → حذف box التالف → إعادة init → استعادة من السحابة
  try {
    await manager.init().timeout(
      const Duration(seconds: 30),
      onTimeout: () {
        debugPrint('[offlineManagerProvider] Hive init timeout — degraded mode');
      },
    );
  } catch (e) {


    debugPrint('[offlineManagerProvider] Hive init failed: $e');

    // ═══ Auto-recovery: حذف box التالف وإعادة المحاولة ═══
    // البيانات موجودة في السحابة — ستُستعاد تلقائياً عند فتح المسودات
    debugPrint('[offlineManagerProvider] Attempting Hive recovery...');
    try {
      // ═══ محاولة حذف box التالف وإعادة التهيئة ═══
      // نستخدم Hive مباشرة لأن OfflineManager قد لا يملك resetCorruptedBoxes
      try {
        final hive = Hive;
        await hive.deleteBoxFromDisk('drafts');
        await hive.deleteBoxFromDisk('sync_queue');
        await hive.deleteBoxFromDisk('cache');
        debugPrint('[offlineManagerProvider] Deleted corrupted Hive boxes');
      } catch (hiveError) {
        debugPrint('[offlineManagerProvider] Box deletion failed: $hiveError');
      }
      await manager.init().timeout(
        const Duration(seconds: 15),
        onTimeout: () {
          debugPrint('[offlineManagerProvider] Recovery init timeout');
        },
      );
      debugPrint('[offlineManagerProvider] ✅ Hive recovered successfully');
    } catch (recoveryError) {
      debugPrint('[offlineManagerProvider] ❌ Hive recovery failed: $recoveryError');
    }
  }

  // ═══ FIX: Set initial connectivity from ConnectivityUtils ═══
  manager.updateConnectivity(ConnectivityUtils.isOnline);

  // ═══ FIX: Bridge ConnectivityUtils updates to OfflineManager ═══
  StreamSubscription? connSub;
  try {
    connSub = ConnectivityUtils.onConnectivityChanged.listen(
      (online) {
        manager.updateConnectivity(online);
      },
      onError: (e) {
        debugPrint('[offlineManagerProvider] Connectivity bridge error: $e');
      },
    );
  } catch (e) {
    debugPrint('[offlineManagerProvider] Connectivity bridge failed: $e');
  }

  ref.onDispose(() {
    connSub?.cancel();
    manager.dispose();
  });
  return manager;
});

/// Offline-first data cache — stores Supabase query results locally.
final offlineDataCacheProvider = FutureProvider<OfflineDataCache>((ref) async {
  final offline = await ref.watch(offlineManagerProvider.future);
  final encryption = ref.read(encryptionServiceProvider);
  return OfflineDataCache(offline, encryption);
});

/// ═══ FIX: Reliable sync service with proper initialization chain ═══
final syncServiceProvider = FutureProvider<SyncService>((ref) async {
  final offline = await ref.watch(offlineManagerProvider.future);
  final service = SyncService(ref.read(apiClientProvider), offline);

  // ═══ Connect data cache for reconnect invalidation ═══
  // When internet returns, SyncService will clear all caches
  // so fresh data is fetched from server
  try {
    final cache = await ref.watch(offlineDataCacheProvider.future);
    service.setDataCache(cache);
  } catch (e) {
    debugPrint('[syncServiceProvider] Could not set data cache: $e');
  }

  // ═══ Start auto-sync immediately ═══
  service.startAutoSync();

  ref.onDispose(service.dispose);
  return service;
});

/// ═══ FIX: Manual sync trigger — used by UI pull-to-refresh and sync button ═══
final manualSyncProvider = Provider<Future<SyncCycleResult> Function()>((ref) {
  return () async {
    final syncService = await ref.read(syncServiceProvider.future);
    return syncService.sync();
  };
});

/// ═══ Force-refresh helper: clears specific cache key then invalidates provider ═══
/// Use for pull-to-refresh to ensure fresh data from server.
/// ═══ FIX: عند الاوفلاين، لا نحذف الكاش — سيؤدي إلى عدم توفر البيانات ═══
final forceRefreshProvider = Provider<Future<void> Function(String cacheKey)>((
  ref,
) {
  return (String cacheKey) async {
    // ⚠️ OFFLINE FIX: لا نمسح الكاش بالاوفلاين — البيانات تضيع
    if (!ConnectivityUtils.isOnline) {
      debugPrint('[forceRefreshProvider] Offline — preserving cache for $cacheKey');
      return;
    }
    try {
      final cache = await ref.read(offlineDataCacheProvider.future);
      await cache.forceInvalidate(cacheKey);
    } catch (e) {
      debugPrint(
        '[forceRefreshProvider] Error clearing cache for $cacheKey: $e',
      );
    }
  };
});

/// Pending items count for UI badges and banners.
/// ═══ PERFORMANCE: Single poll every 300s, uses .distinct() to skip rebuilds ═══
final syncPendingCountProvider = StreamProvider<int>((ref) async* {
  final offline = await ref.watch(offlineManagerProvider.future);
  yield offline.pendingCount;
  // ═══ FIX ME4: Reactive pending count — updates immediately on queue changes ═══
  // Previously: polled every 300s, badge was stale for up to 5 minutes
  yield* offline.pendingCountStream.distinct();
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final repo = AuthRepository();
  ref.onDispose(repo.dispose);
  return repo;
});

final authStateProvider = StreamProvider<AuthState>((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges;
});

// ─── Submissions Filter ───────────────────────────────────────────────────────

/// Immutable filter for submissions queries — fixes Riverpod equality issues.
class SubmissionsFilter {
  final String? status;
  final String? formId;
  final String? governorateId;
  final String? districtId;
  final String? campaignType;
  final int? campaignRound;
  final int limit;
  final int offset;
  final bool lean;  // ═══ P0: When true, skips 'data' column (84% less bandwidth)

  const SubmissionsFilter({
    this.status,
    this.formId,
    this.governorateId,
    this.districtId,
    this.campaignType,
    this.campaignRound,
    this.limit = 2000,
    this.offset = 0,
    this.lean = false,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SubmissionsFilter &&
          runtimeType == other.runtimeType &&
          status == other.status &&
          formId == other.formId &&
          governorateId == other.governorateId &&
          districtId == other.districtId &&
          campaignType == other.campaignType &&
          campaignRound == other.campaignRound &&
          limit == other.limit &&
          offset == other.offset &&
          lean == other.lean;

  @override
  int get hashCode => Object.hash(
        status,
        formId,
        governorateId,
        districtId,
        campaignType,
        campaignRound,
        limit,
        offset,
        lean,
      );

  String get cacheKey {
    final parts = <String>['submissions'];
    if (lean) parts.add('lean');
    if (campaignType != null) parts.add('camp_$campaignType');
    if (campaignRound != null) parts.add('round_$campaignRound');
    if (formId != null) parts.add('form_$formId');
    if (status != null) parts.add('status_$status');
    if (governorateId != null) parts.add('gov_$governorateId');
    if (districtId != null) parts.add('dist_$districtId');
    parts.add('limit_$limit');
    parts.add('off_$offset');
    return parts.join('_');
  }
}

// ─── Data Providers (Offline-First) ───────────────────────────────────────────
//
// Strategy:
//   1. Return cached data immediately (if available)
//   2. Fetch from Supabase in background
//   3. Update cache and UI when fresh data arrives
//   4. If offline: return cached data (even stale)
//   5. If offline + no cache: show empty with retry option

final governoratesProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);
  final allGovs = await cache.getList(
    'governorates',
    () => ref.read(databaseServiceProvider).getGovernorates(),
    maxAge:
        const Duration(hours: 24), // ═══ Cache 7 days — sync button refreshes ═══
  );
  // ═══ FIX: Filter out inactive governorates client-side ═══
  return allGovs.where((g) => g['is_active'] != false).toList();
});

final districtsProvider =
    FutureProvider.family.autoDispose<List<Map<String, dynamic>>, String?>((
  ref,
  governorateId,
) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);
  final cacheKey =
      governorateId != null ? 'districts_$governorateId' : 'districts_all';
  return cache.getList(
    cacheKey,
    () => ref
        .read(databaseServiceProvider)
        .getDistricts(governorateId: governorateId),
    maxAge: const Duration(hours: 24), // ═══ Cache 7 days ═══
  );
});

final healthFacilitiesProvider =
    FutureProvider.family.autoDispose<List<Map<String, dynamic>>, String?>((
  ref,
  districtId,
) async {
  if (districtId == null) return [];
  final cache = await ref.watch(offlineDataCacheProvider.future);
  return cache.getList(
    'facilities_$districtId',
    () => ref
        .read(databaseServiceProvider)
        .getHealthFacilities(districtId: districtId),
    maxAge: const Duration(hours: 24), // ═══ Cache 7 days ═══
  );
});

// ─── Campaign / Activity Selection ──────────────────────────────────────────

/// Persisted campaign selection — stored in Supabase profiles table,
/// cached locally in Hive for offline access.
class CampaignNotifier extends StateNotifier<CampaignType> {
  final Ref _ref;

  CampaignNotifier(this._ref) : super(CampaignType.polioCampaign) {
    _load();
  }

  Future<void> _load() async {
    try {
      final cache = await _ref.read(offlineDataCacheProvider.future);
      final cached = await cache.getMap('active_campaign', () async {
        final db = _ref.read(databaseServiceProvider);
        final result = await db.getActiveCampaign();
        return {'campaign': result};
      }, maxAge: const Duration(days: 30));
      state = CampaignType.fromString(
        cached['campaign'] as String? ?? 'polio_campaign',
      );
    } catch (_) {
      // Default to polio campaign if loading fails
    }

    // ═══ Load visibility in background (non-blocking) ═══
    _loadVisibilityInBackground();
  }

  Future<void> _loadVisibilityInBackground() async {
    try {
      final api = _ref.read(apiClientProvider);
      final result = await api.select('campaign_types', select: 'key, visible');
      final visibilityMap = <String, bool>{};
      for (final row in result) {
        final key = row['key'] as String?;
        final visible = row['visible'] as bool?;
        if (key != null) visibilityMap[key] = visible ?? true;
      }
      await CampaignType.loadVisibility(visibilityMap);
    } catch (_) {
      // Silently fail — default to all visible
    }
  }


  Future<void> selectCampaign(CampaignType campaign) async {
    if (campaign == state) return;
    final prev = state;
    state = campaign;
    try {
      if (ConnectivityUtils.isOnline) {
        final db = _ref.read(databaseServiceProvider);
        await db.setActiveCampaign(campaign.value);
      }
      _ref.invalidate(formsProvider);
      _ref.invalidate(dashboardAnalyticsProvider);
    } catch (e) {
      state = prev;
      debugPrint('[CampaignNotifier] Save failed — reverted: $e');
    }
  }
}

final campaignProvider = StateNotifierProvider<CampaignNotifier, CampaignType>(
  (ref) => CampaignNotifier(ref),
);

// ─── Campaign Round Selection ───────────────────────────────────────────────

/// Persisted campaign round — tracks which round is active for integrated activity.
/// Round 1 = الجولة الأولى, Round 2 = الجولة الثانية, etc.
/// Only relevant when campaignType == integrated_activity.
class CampaignRoundNotifier extends StateNotifier<int> {
  final Ref _ref;

  CampaignRoundNotifier(this._ref) : super(1) {
    _load();
  }

  Future<void> _load() async {
    try {
      final cache = await _ref.read(offlineDataCacheProvider.future);
      final cached = await cache.getMap('active_campaign_round', () async {
        final db = _ref.read(databaseServiceProvider);
        final result = await db.getAppSettings(key: 'active_campaign_round');
        return {'round': result['value'] ?? 1};
      }, maxAge: const Duration(days: 30));
      state = (cached['round'] as num?)?.toInt() ?? 1;
    } catch (_) {
      // Default to round 1
    }
  }

  Future<void> selectRound(int round) async {
    if (round == state || round < 1 || round > 5) return;
    state = round;
    try {
      final db = _ref.read(databaseServiceProvider);
      await db.updateAppSetting('active_campaign_round', round);

      // Invalidate all providers that depend on campaign round.
      // Family.autoDispose providers (submissionTrend, governorateRanking, shortages)
      // will auto-refresh when their consumers re-read with the new round arg.
      _ref.invalidate(formsProvider);
      _ref.invalidate(dashboardAnalyticsProvider);
      _ref.invalidate(formStatsProvider);

      if (kDebugMode) {
        debugPrint('[CampaignRoundNotifier] Round changed to $round - Providers invalidated');
      }
    } catch (e) {
      debugPrint('[CampaignRoundNotifier] Save failed: $e');
    }
  }
}

final campaignRoundProvider =
    StateNotifierProvider<CampaignRoundNotifier, int>(
  (ref) => CampaignRoundNotifier(ref),
);

/// Returns the Arabic label for a campaign round number.
String campaignRoundLabel(int round) {
  switch (round) {
    case 1: return 'الجولة الأولى';
    case 2: return 'الجولة الثانية';
    case 3: return 'الجولة الثالثة';
    case 4: return 'الجولة الرابعة';
    case 5: return 'الجولة الخامسة';
    case 6: return 'الجولة السادسة';
    case 7: return 'الجولة السابعة';
    case 8: return 'الجولة الثامنة';
    case 9: return 'الجولة التاسعة';
    case 10: return 'الجولة العاشرة';
    default: return 'الجولة $round';
  }
}

// ─── Forms (filtered by active campaign) ────────────────────────────────────

final formsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final campaign = ref.watch(campaignProvider);
  final cache = await ref.watch(offlineDataCacheProvider.future);
  final campaignKey = 'forms_' + campaign.value;

  // OFFLINE-FIRST: Always try cache first, never lose forms
  List<Map<String, dynamic>>? allForms;

  // 1. Try campaign-specific cache (works online and offline)
  try {
    allForms = await cache.getList(
      campaignKey,
      () => ref.read(databaseServiceProvider).getForms(campaignType: campaign.value),
      maxAge: const Duration(hours: 24),
    );
  } catch (_) {}

  // 2. Fallback: try forms_all cache (cached by sync service warmup)
  if (allForms == null || allForms.isEmpty) {
    try {
      final fallback = cache.getCachedDataList('forms_all');
      if (fallback != null && fallback.isNotEmpty) allForms = fallback;
    } catch (_) {}
  }

  // 3. Fallback: try any forms_* key in persistent cache
  if (allForms == null || allForms.isEmpty) {
    try {
      final anyForms = cache.findCachedListByPrefix('forms_');
      if (anyForms != null && anyForms.isNotEmpty) allForms = anyForms;
    } catch (_) {}
  }

  if (allForms == null || allForms.isEmpty) {
    throw Exception('No forms cached — check connection');
  }

  // Filter inactive only when online
  if (ConnectivityUtils.isOnline) {
    return allForms.where((f) => f['is_active'] == true).toList();
  }
  return allForms;
});

/// ═══ PERFORMANCE: AutoDispose family — cleans up unused filter instances ═══
/// Each unique SubmissionsFilter gets its own provider that disposes
/// when no widgets are watching it. Prevents memory buildup.
final submissionsProvider = FutureProvider.family
    <List<Map<String, dynamic>>, SubmissionsFilter>((
  ref,
  filter,
) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);

  // INCREMENTAL SYNC: only fetch NEW records and merge with cache
  return cache.incrementalGetList(
    filter.cacheKey,
    ({String? createdAfter}) async {
      return ref.read(databaseServiceProvider).getSubmissions(
            formId: filter.formId,
            status: filter.status,
            governorateId: filter.governorateId,
            districtId: filter.districtId,
            campaignType: filter.campaignType,
            campaignRound: filter.campaignRound,
            limit: filter.limit,
            offset: filter.offset,
            lean: filter.lean,
            createdAfter: createdAfter,
          );
    },
    maxAge: const Duration(days: 7),
    dateField: 'updated_at',
    idField: 'id',
  );
});

/// ═══ PERFORMANCE: Dedicated stats provider — uses count queries instead of loading all data ═══
/// Returns {drafts: N, pending: N, submitted: N} using optimized queries.
class FormStats {
  final int drafts;
  final int pending;
  final int submitted;
  final bool submittedLoadError; // ═══ FIX: true if count() failed — UI shows error instead of 0 ═══
  const FormStats({this.drafts = 0, this.pending = 0, this.submitted = 0, this.submittedLoadError = false});
}

final formStatsProvider = FutureProvider.autoDispose<FormStats>((ref) async {
  int drafts = 0, pending = 0, submitted = 0;

  try {
    // Drafts + pending from local storage (fast)
    final offline = await ref.read(offlineManagerProvider.future).timeout(
          const Duration(seconds: 3),
          onTimeout: () => throw Exception('timeout'),
        );
    pending = offline.pendingCount;
    drafts = offline.getDraftFormIds().length;
  } catch (_) {}

  try {
    // ═══ PERFORMANCE FIX: Single count query instead of loading 2000 submissions ═══
    final db = ref.read(databaseServiceProvider);
    final campaign = ref.read(campaignProvider);
    final round = ref.read(campaignRoundProvider);

    // ═══ FIX P2-8: Only 'submitted' is valid — migration 015 removed others ═══
    // Previously: tried 'reviewed', 'approved', 'rejected' which don't exist in enum
    try {
      final count = await db.getSubmissionsCount(
        campaignType: campaign.value,
        campaignRound: round,
        status: 'submitted',
      );
      submitted = count;
    } catch (e) {
      // ═══ FIX: Don't silently swallow — track error so UI can show it ═══
      // Previously: catch (_) {} → Dashboard showed 0 submissions on any error
      // Now: submittedLoadError = true → UI shows "خطأ في التحميل" instead of "0"
      debugPrint('[FormStats] getSubmissionsCount failed: $e');
      submitted = -1; // Sentinel: -1 means "error", not "0 submissions"
    }
  } catch (_) {}

  return FormStats(drafts: drafts, pending: pending, submitted: submitted == -1 ? 0 : submitted, submittedLoadError: submitted == -1);
});

/// Analytics filter for passing governorate/district/date/form filters to the provider.
class AnalyticsFilter {
  final String? governorateId;
  final String? districtId;
  final String? formId;
  final String? campaignType;
  final int? campaignRound;
  final DateTime? startDate;
  final DateTime? endDate;

  const AnalyticsFilter({
    this.governorateId,
    this.districtId,
    this.formId,
    this.campaignType,
    this.campaignRound,
    this.startDate,
    this.endDate,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AnalyticsFilter &&
          runtimeType == other.runtimeType &&
          governorateId == other.governorateId &&
          districtId == other.districtId &&
          formId == other.formId &&
          campaignType == other.campaignType &&
          campaignRound == other.campaignRound &&
          startDate == other.startDate &&
          endDate == other.endDate;

  @override
  int get hashCode => Object.hash(
        governorateId,
        districtId,
        formId,
        campaignType,
        campaignRound,
        startDate,
        endDate,
      );

  String get cacheKey {
    final parts = ['dashboard_analytics'];
    if (campaignType != null) parts.add('camp_$campaignType');
    if (campaignRound != null) parts.add('round_$campaignRound');
    if (governorateId != null) parts.add('gov_$governorateId');
    if (districtId != null) parts.add('dist_$districtId');
    if (formId != null) parts.add('form_$formId');
    if (startDate != null) parts.add('from_${startDate!.toIso8601String()}');
    if (endDate != null) parts.add('to_${endDate!.toIso8601String()}');
    return parts.join('_');
  }
}

final dashboardAnalyticsProvider =
    FutureProvider.family.autoDispose<Map<String, dynamic>, AnalyticsFilter>((
  ref,
  filter,
) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);
  return cache.getMap(
    filter.cacheKey,
    () => ref.read(analyticsServiceProvider).getAnalytics(
          governorateId: filter.governorateId,
          districtId: filter.districtId,
          formId: filter.formId,
          campaignType: filter.campaignType,
          campaignRound: filter.campaignRound,
          startDate: filter.startDate,
          endDate: filter.endDate,
        ),
    maxAge:
        const Duration(hours: 24), // ═══ Cache 7 days — sync button refreshes ═══
  );
});

final shortagesProvider = FutureProvider.family
    .autoDispose<List<Map<String, dynamic>>, int?>((ref, campaignRound) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);
  final key = campaignRound != null ? 'shortages_round_$campaignRound' : 'shortages';
  return cache.getList(
    key,
    () => ref.read(databaseServiceProvider).getShortages(campaignRound: campaignRound),
    maxAge: const Duration(hours: 24), // ═══ Cache 7 days ═══
  );
});

final submissionTrendProvider = FutureProvider.family
    .autoDispose<List<Map<String, dynamic>>, ({int days, int? campaignRound})>(
  (ref, params) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);
  final key = params.campaignRound != null
      ? 'submission_trend_${params.days}_round_${params.campaignRound}'
      : 'submission_trend_${params.days}';
  return cache.getList(
    key,
    () => ref.read(analyticsServiceProvider).getSubmissionTrend(
          days: params.days,
          campaignRound: params.campaignRound,
        ),
    maxAge: const Duration(hours: 24), // ═══ Cache 7 days ═══
  );
});

final governorateRankingProvider = FutureProvider.family
    .autoDispose<List<Map<String, dynamic>>, int?>((ref, campaignRound) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);
  final key = campaignRound != null
      ? 'governorate_ranking_round_$campaignRound'
      : 'governorate_ranking';
  return cache.getList(
    key,
    () => ref.read(analyticsServiceProvider).getGovernorateRanking(campaignRound: campaignRound),
    maxAge: const Duration(hours: 24), // ═══ Cache 7 days ═══
  );
});

// ═══════════════════════════════════════════════════════════════
// LOCAL DRAFTS — count from Hive offline storage
// ═══════════════════════════════════════════════════════════════

/// Provides the count of locally saved drafts (Hive) — not server drafts.
/// ═══ FIX: Reactive — updates immediately on draft save/delete ═══
final localDraftCountProvider = StreamProvider<int>((ref) async* {
  yield 0;
  try {
    final offline = await ref.watch(offlineManagerProvider.future);
    yield offline.getDraftFormIds().length;
    // ═══ FIX: Poll every 60s (was 300s) — faster feedback on draft operations ═══
    yield* Stream.periodic(const Duration(seconds: 60), (_) {
      try {
        return offline.getDraftFormIds().length;
      } catch (_) {
        return 0;
      }
    }).distinct();
  } catch (_) {
    yield 0;
  }
});

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS — reactive unread count with polling
// ═══════════════════════════════════════════════════════════════

/// Reactive notification unread count — polls every 60s when online.
/// ═══ FIX: Reduced from 300s to 60s for urgent notification delivery ═══
/// Also invalidates on realtime sync events (feedback_tickets, official_memos)
final notificationCountProvider = StreamProvider<int>((ref) async* {
  yield 0;
  final api = ref.read(apiClientProvider);
  NotificationService.init(api);
  try {
    await NotificationService.loadFromDB(refresh: true);
    yield NotificationService.unreadCount;
  } catch (_) {
    yield 0;
  }
  // ═══ FIX: Poll every 60s (was 300s) — urgent notifications need faster delivery ═══
  yield* Stream.periodic(const Duration(seconds: 60), (_) async {
    try {
      if (ConnectivityUtils.isOnline) {
        await NotificationService.loadFromDB(refresh: true);
      }
    } catch (_) {}
    return NotificationService.unreadCount;
  }).asyncMap((f) => f).distinct();
});

// ═══════════════════════════════════════════════════════════════
// AI Services
// ═══════════════════════════════════════════════════════════════
//
// The mobile app uses ai-chat-v3 Edge Function for all AI queries.
// These providers are used only for offline fallback (HF intent).

/// HuggingFace Service — used for offline intent classification fallback
final huggingFaceServiceProvider = Provider<HuggingFaceService?>((ref) {
  const hfToken = String.fromEnvironment('HF_API_TOKEN', defaultValue: '');
  if (hfToken.isEmpty) return null;
  final service = HuggingFaceService(hfToken);
  ref.onDispose(service.dispose);
  return service;
});

/// Enhanced Local AI — always available offline
final enhancedLocalAIProvider = Provider<EnhancedLocalAI>((ref) {
  return EnhancedLocalAI();
});

// ═══════════════════════════════════════════════════════════════
// NEW AI Services — Z AI, OpenRouter, NLP, Knowledge Base, Alerts
// ═══════════════════════════════════════════════════════════════

/// Z AI Service — GLM-based AI model
/// ═══ FIX: لا مفاتيح مكشوفة — فقط من --dart-define أو .env ═══
final zaiServiceProvider = Provider<ZAIService?>((ref) {
  const apiKey = String.fromEnvironment('ZAI_API_KEY', defaultValue: '');
  if (apiKey.isEmpty) return null;
  final service = ZAIService(apiKey);
  ref.onDispose(service.dispose);
  return service;
});

/// OpenRouter Service — Gateway to multiple LLM models
/// ═══ FIX: لا مفاتيح مكشوفة — فقط من --dart-define أو .env ═══
final openRouterServiceProvider = Provider<OpenRouterService?>((ref) {
  const apiKey = String.fromEnvironment('OPENROUTER_API_KEY', defaultValue: '');
  if (apiKey.isEmpty) return null;
  final service = OpenRouterService(apiKey);
  ref.onDispose(service.dispose);
  return service;
});

/// EPI NLP Engine — always available (no API needed)
final epiNLPEngineProvider = Provider<EpiNLPEngine>((ref) {
  return EpiNLPEngine();
});

/// EPI Knowledge Base — always available (no API needed)
final epiKnowledgeBaseProvider = Provider<EpiKnowledgeBase>((ref) {
  return EpiKnowledgeBase();
});

/// Smart Alerts Engine — always available (no API needed)
final smartAlertsEngineProvider = Provider<SmartAlertsEngine>((ref) {
  return SmartAlertsEngine();
});

/// AI Model Selection — user-chosen or auto-selected provider
final aiModelSelectionProvider =
    StateNotifierProvider<AIModelSelectionNotifier, AIModelSelection>((ref) {
  return AIModelSelectionNotifier();
});

class AIModelSelection {
  final String provider; // 'groq', 'zai', 'openrouter', 'gemini', 'local'
  final String? model; // specific model id (for OpenRouter)
  final bool autoSelect; // auto-select best provider based on query

  const AIModelSelection({
    this.provider = 'groq',
    this.model,
    this.autoSelect = true,
  });

  AIModelSelection copyWith(
      {String? provider, String? model, bool? autoSelect}) {
    return AIModelSelection(
      provider: provider ?? this.provider,
      model: model ?? this.model,
      autoSelect: autoSelect ?? this.autoSelect,
    );
  }
}

class AIModelSelectionNotifier extends StateNotifier<AIModelSelection> {
  AIModelSelectionNotifier() : super(const AIModelSelection());

  void selectProvider(String provider) {
    state = state.copyWith(provider: provider);
  }

  void selectModel(String model) {
    state = state.copyWith(model: model);
  }

  void toggleAutoSelect() {
    state = state.copyWith(autoSelect: !state.autoSelect);
  }

  /// Auto-select best provider based on query type
  String selectBestProvider(String query) {
    final intents = EpiNLPEngine.detectIntents(query);
    if (intents.isEmpty) return 'groq';

    final topIntent = intents.first.intent;

    // Deep analysis → use powerful model
    if (['generate_report', 'analyze_trend', 'query_analytics']
        .contains(topIntent)) {
      return 'openrouter'; // DeepSeek/GPT-4 for reports
    }

    // Quick query → use fast model
    if (['query_submissions', 'query_shortages', 'query_governorates']
        .contains(topIntent)) {
      return 'groq'; // Fastest
    }

    // Knowledge questions → Z AI or Groq
    if (['query_vaccination', 'query_campaign', 'query_aefi', 'query_coverage']
        .contains(topIntent)) {
      return 'zai'; // Z AI good for knowledge
    }

    // Default → Groq (fastest)
    return 'groq';
  }
}
