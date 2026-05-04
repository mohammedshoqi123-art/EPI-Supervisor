import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_core/epi_core.dart';

// ─── Core Services ────────────────────────────────────────────────────────────
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final encryptionServiceProvider = Provider<EncryptionService>(
  (ref) => EncryptionService(),
);

final databaseServiceProvider = Provider<DatabaseService>(
  (ref) => DatabaseService(ref.read(apiClientProvider)),
);

final analyticsServiceProvider = Provider<AnalyticsService>(
  (ref) => AnalyticsService(ref.read(apiClientProvider)),
);

final geminiServiceProvider = Provider<GeminiService>(
  (ref) => GeminiService(ref.read(apiClientProvider)),
);

// ─── Offline / Sync ───────────────────────────────────────────────────────────

/// ═══ FIX: Robust offline manager initialization with connectivity bridge ═══
/// On web (kIsWeb): Hive is not initialized — runs in online-only mode.
final offlineManagerProvider = FutureProvider<OfflineManager>((ref) async {
  final manager = OfflineManager(ref.read(encryptionServiceProvider));

  // On web, skip Hive initialization entirely (online-only mode)
  if (kIsWeb) {
    debugPrint('[offlineManagerProvider] Web mode — online-only, skipping Hive');
    manager.updateConnectivity(true);
    return manager;
  }

  // On mobile, initialize Hive with timeout
  try {
    // ═══ FIX: timeout أطول (30 ثانية) للأجهزة البطيئة ═══
    await manager.init().timeout(
      const Duration(seconds: 60),
      onTimeout: () {
        debugPrint('[offlineManagerProvider] Hive init timed out after 60s');
        throw TimeoutException('Offline storage initialization timed out');
      },
    );
  } catch (e) {
    debugPrint('[offlineManagerProvider] Init failed: $e');
    rethrow;
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
final forceRefreshProvider = Provider<Future<void> Function(String cacheKey)>((
  ref,
) {
  return (String cacheKey) async {
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
  yield* Stream.periodic(
    const Duration(seconds: 300),
    (_) => offline.pendingCount,
  ).distinct();
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
  final int limit;
  final int offset;

  const SubmissionsFilter({
    this.status,
    this.formId,
    this.governorateId,
    this.districtId,
    this.campaignType,
    this.limit = 500, // ═══ PERFORMANCE: Default 500, use 999999 only when explicitly needed ═══
    this.offset = 0,
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
          limit == other.limit &&
          offset == other.offset;

  @override
  int get hashCode => Object.hash(
        status,
        formId,
        governorateId,
        districtId,
        campaignType,
        limit,
        offset,
      );

  String get cacheKey {
    final parts = <String>['submissions'];
    if (campaignType != null) parts.add('camp_$campaignType');
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
  return cache.getList(
    'governorates',
    () => ref.read(databaseServiceProvider).getGovernorates(),
    maxAge: const Duration(hours: 24),
  );
});

final districtsProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String?>((
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
    maxAge: const Duration(hours: 24),
  );
});

final healthFacilitiesProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String?>((
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
    maxAge: const Duration(hours: 24),
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
  }

  Future<void> selectCampaign(CampaignType campaign) async {
    if (campaign == state) return;
    state = campaign;
    try {
      // Save to Supabase
      final db = _ref.read(databaseServiceProvider);
      await db.setActiveCampaign(campaign.value);

      // ═══ FIX: DO NOT invalidate the persistent cache here! ═══
      // Calling cache.invalidate() deletes the Hive entries for forms, 
      // preventing offline access to the "other" campaign type.
      // Instead, we only invalidate the Riverpod providers themselves. 
      // This clears the app's memory but preserves the disk cache (Hive).

      // Invalidate all providers that depend on campaign
      _ref.invalidate(formsProvider);
      _ref.invalidate(dashboardAnalyticsProvider);
      _ref.invalidate(submissionTrendProvider);
      _ref.invalidate(governorateRankingProvider);
      _ref.invalidate(shortagesProvider);
      
      if (kDebugMode) {
        print('[CampaignNotifier] Campaign changed to ${campaign.value} - Providers invalidated');
      }
    } catch (e) {

      debugPrint('[CampaignNotifier] Save failed: $e');
    }
  }
}

final campaignProvider = StateNotifierProvider<CampaignNotifier, CampaignType>(
  (ref) => CampaignNotifier(ref),
);

// ─── Forms (filtered by active campaign) ────────────────────────────────────

final formsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final campaign = ref.watch(campaignProvider);
  final cache = await ref.watch(offlineDataCacheProvider.future);
  return cache.getList(
    'forms_${campaign.value}',
    () => ref
        .read(databaseServiceProvider)
        .getForms(campaignType: campaign.value),
    maxAge: const Duration(hours: 24), // Forms change rarely — cache 24h
  );
});

/// ═══ PERFORMANCE: AutoDispose family — cleans up unused filter instances ═══
/// Each unique SubmissionsFilter gets its own provider that disposes
/// when no widgets are watching it. Prevents memory buildup.
final submissionsProvider =
    FutureProvider.family.autoDispose<List<Map<String, dynamic>>, SubmissionsFilter>((
  ref,
  filter,
) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);
  return cache.getList(
    filter.cacheKey,
    () => ref.read(databaseServiceProvider).getSubmissions(
          formId: filter.formId,
          status: filter.status,
          governorateId: filter.governorateId,
          districtId: filter.districtId,
          campaignType: filter.campaignType,
          limit: filter.limit,
          offset: filter.offset,
        ),
    maxAge: const Duration(
      hours: 2,
    ), // Submissions cached 2h for offline access
  );
});

/// ═══ PERFORMANCE: Dedicated stats provider — avoids loading all submissions ═══
/// Returns {drafts: N, pending: N, submitted: N} using optimized queries.
class FormStats {
  final int drafts;
  final int pending;
  final int submitted;
  const FormStats({this.drafts = 0, this.pending = 0, this.submitted = 0});
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
    // Submitted count from cache or server
    final cache = await ref.read(offlineDataCacheProvider.future);
    final campaign = ref.read(campaignProvider);
    final filter = SubmissionsFilter(campaignType: campaign.value, limit: 500);
    final subs = await cache.getList(
      filter.cacheKey,
      () => ref.read(databaseServiceProvider).getSubmissions(
            campaignType: campaign.value,
            limit: 500,
          ),
      maxAge: const Duration(hours: 2),
    );
    submitted = subs
        .where((s) =>
            s['status'] == 'submitted' ||
            s['status'] == 'reviewed' ||
            s['status'] == 'approved' ||
            s['status'] == 'rejected')
        .length;
  } catch (_) {}

  return FormStats(drafts: drafts, pending: pending, submitted: submitted);
});

/// Analytics filter for passing governorate/district/date/form filters to the provider.
class AnalyticsFilter {
  final String? governorateId;
  final String? districtId;
  final String? formId;
  final String? campaignType;
  final DateTime? startDate;
  final DateTime? endDate;

  const AnalyticsFilter({
    this.governorateId,
    this.districtId,
    this.formId,
    this.campaignType,
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
          startDate == other.startDate &&
          endDate == other.endDate;

  @override
  int get hashCode => Object.hash(
        governorateId,
        districtId,
        formId,
        campaignType,
        startDate,
        endDate,
      );

  String get cacheKey {
    final parts = ['dashboard_analytics'];
    if (campaignType != null) parts.add('camp_$campaignType');
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
          startDate: filter.startDate,
          endDate: filter.endDate,
        ),
    maxAge: const Duration(hours: 2), // Analytics cached 2h for offline
  );
});

final shortagesProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);
  return cache.getList(
    'shortages',
    () => ref.read(databaseServiceProvider).getShortages(),
    maxAge: const Duration(hours: 2),
  );
});

final submissionTrendProvider =
    FutureProvider.family<List<Map<String, dynamic>>, int>((ref, days) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);
  return cache.getList(
    'submission_trend_$days',
    () => ref.read(analyticsServiceProvider).getSubmissionTrend(days: days),
    maxAge: const Duration(hours: 1),
  );
});

final governorateRankingProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);
  return cache.getList(
    'governorate_ranking',
    () => ref.read(analyticsServiceProvider).getGovernorateRanking(),
    maxAge: const Duration(hours: 1),
  );
});

// ═══════════════════════════════════════════════════════════════
// LOCAL DRAFTS — count from Hive offline storage
// ═══════════════════════════════════════════════════════════════

/// Provides the count of locally saved drafts (Hive) — not server drafts.
/// ═══ PERFORMANCE: Poll every 300s (was 60s), cached in-memory ═══
final localDraftCountProvider = StreamProvider<int>((ref) async* {
  yield 0;
  try {
    final offline = await ref.watch(offlineManagerProvider.future);
    yield offline.getDraftFormIds().length;
    yield* Stream.periodic(const Duration(seconds: 300), (_) {
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

/// Reactive notification unread count — polls every 300s when online.
/// ═══ PERFORMANCE: 300s interval (was 60s), only fetches when online ═══
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
  yield* Stream.periodic(const Duration(seconds: 300), (_) async {
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
final aiModelSelectionProvider = StateNotifierProvider<AIModelSelectionNotifier, AIModelSelection>((ref) {
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

  AIModelSelection copyWith({String? provider, String? model, bool? autoSelect}) {
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
    if (['generate_report', 'analyze_trend', 'query_analytics'].contains(topIntent)) {
      return 'openrouter'; // DeepSeek/GPT-4 for reports
    }

    // Quick query → use fast model
    if (['query_submissions', 'query_shortages', 'query_governorates'].contains(topIntent)) {
      return 'groq'; // Fastest
    }

    // Knowledge questions → Z AI or Groq
    if (['query_vaccination', 'query_campaign', 'query_aefi', 'query_coverage'].contains(topIntent)) {
      return 'zai'; // Z AI good for knowledge
    }

    // Default → Groq (fastest)
    return 'groq';
  }
}
