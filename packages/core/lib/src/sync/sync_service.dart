import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import '../api/api_client.dart';
import '../config/supabase_config.dart';
import '../offline/offline_manager.dart';
import '../offline/offline_data_cache.dart';

/// Manages background synchronization of offline data.
/// Handles batch syncing, conflict resolution, retry with backoff, and dedup.
class SyncService {
  final ApiClient _api;
  final OfflineManager _offline;
  OfflineDataCache? _dataCache;
  Timer? _syncTimer;
  DateTime? _syncLockTime;
  bool _isSyncing = false;
  /// ═══ PERFORMANCE: 20 items per batch (was 50) — smaller batches = less UI blocking ═══
  static const int _maxBatchSize = 20;
  static const int _maxRetries = 5;
  static const int _staleLockSeconds = 180; // 3 دقائق قبل إعادة ضبط القفل

  /// Completer لمنع Race Condition — كل sync ينتظر اللي قبله
  Completer<SyncCycleResult>? _activeCompleter;

  final _syncStateController = StreamController<SyncState>.broadcast();
  Stream<SyncState> get syncState => _syncStateController.stream;
  SyncState _currentState = const SyncState();
  SyncState get currentState => _currentState;

  /// Debounce لمنع إطلاق مزامنتين متتاليتين من reconnect + timer
  DateTime? _lastSyncAttempt;
  static const _debounceWindow = Duration(seconds: 10);

  SyncService(this._api, this._offline) {
    _offline.connectivityStream.listen((isOnline) {
      if (isOnline && _offline.pendingCount > 0) {
        // ═══ FIX: نأخر قليلاً قبل المزامنة بعد عودة الإنترنت ═══
        // هذا يمنع تصادم مع إعادة تهيئة Supabase
        Timer(const Duration(seconds: 3), () {
          if (_offline.isOnline && _offline.pendingCount > 0) {
            _attemptSync('reconnect');
          }
        });
      }
    });
  }

  /// Set the data cache for manual refresh operations.
  void setDataCache(OfflineDataCache cache) {
    _dataCache = cache;
  }

  /// ═══ MANUAL: Force refresh all data from server ═══
  /// Called when user taps "مزامنة تكوين" in the drawer.
  /// Clears all cached data so next provider fetch gets fresh data from server.
  /// Submissions in the sync queue are NOT affected.
  Future<void> forceRefreshAll() async {
    try {
      final cache = _dataCache;
      if (cache != null) {
        await cache.invalidateAll();
        if (kDebugMode)
          debugPrint(
            '[SyncService] All caches cleared — next fetch will get fresh data',
          );
      }
    } catch (e) {
      if (kDebugMode) print('[SyncService] forceRefreshAll error: $e');
      rethrow;
    }
  }

  /// بدء المزامنة التلقائية
  void startAutoSync() {
    _syncTimer?.cancel();
    // ═══ PERFORMANCE: Only sync when there are pending items ═══
    // Previously: synced every 5 min even when queue was empty
    // Now: checks queue first, skips if empty
    _syncTimer = Timer.periodic(
      const Duration(minutes: 5),
      (_) {
        if (_offline.pendingCount > 0) {
          _attemptSync('timer');
        }
      },
    );
    // ═══ FIX: لا تبدأ محاولة أولى فوراً — انتظر 15s حتى لا تتصادم مع init ═══
    Timer(const Duration(seconds: 15), () {
      if (_offline.pendingCount > 0) {
        _attemptSync('initial');
      }
    });
    if (kDebugMode) print('[SyncService] Auto-sync started (every 5 min, smart)');
  }

  void stopAutoSync() {
    _syncTimer?.cancel();
    if (kDebugMode) print('[SyncService] Auto-sync stopped');
  }

  /// محاولة مزامنة مع debouncing
  Future<void> _attemptSync(String trigger) async {
    // ═══ FIX: فحص isOnline أول شيء — لا تضيع وقت بالاوفلاين ═══
    if (!_offline.isOnline) {
      if (kDebugMode && trigger != 'timer')
        debugPrint('[SyncService] Offline — skipping sync ($trigger)');
      return;
    }

    // ═══ FIX: Debounce — تجاهل المحاولات المتكررة خلال 10 ثوانٍ ═══
    final now = DateTime.now();
    if (_lastSyncAttempt != null &&
        now.difference(_lastSyncAttempt!).compareTo(_debounceWindow) < 0) {
      if (kDebugMode) print('[SyncService] Debounced ($trigger)');
      return;
    }
    _lastSyncAttempt = now;

    if (_isSyncing) {
      // ═══ FIX: إذا في sync شغال، ننتظره بدل ما نتجاوزه ═══
      if (_activeCompleter != null && !_activeCompleter!.isCompleted) {
        if (kDebugMode)
          debugPrint('[SyncService] Waiting for active sync ($trigger)');
        await _activeCompleter!.future;
      }
      return;
    }
    if (!_offline.isInitialized) return;

    final pending = _offline.pendingCount;
    if (pending == 0) return;

    if (kDebugMode)
      debugPrint('[SyncService] Triggered by $trigger ($pending items)');
    await sync();
  }

  /// تنفيذ دورة مزامنة كاملة
  Future<SyncCycleResult> sync() async {
    // ⚠️ OFFLINE FIX: لا تحاول المزامنة بدون إنترنت
    if (!_offline.isOnline) {
      if (kDebugMode) debugPrint('[SyncService] Offline — skipping sync');
      return SyncCycleResult.empty();
    }

    // ═══ FIX: إذا sync شغال، نرجع نفس الـ Completer ═══
    if (_isSyncing) {
      final lockAge = _syncLockTime != null
          ? DateTime.now().difference(_syncLockTime!).inSeconds
          : 0;

      if (lockAge > _staleLockSeconds) {
        if (kDebugMode)
          debugPrint('[SyncService] Stale lock (${lockAge}s), resetting');
        _isSyncing = false;
        _activeCompleter?.complete(SyncCycleResult.empty());
        _activeCompleter = null;
      } else if (_activeCompleter != null && !_activeCompleter!.isCompleted) {
        // نرجع نفس الـ result حق sync الجاري
        return _activeCompleter!.future;
      } else {
        return SyncCycleResult.empty();
      }
    }

    if (!_offline.isInitialized) return SyncCycleResult.empty();

    final pendingItems = await _offline.getPendingItems();
    if (pendingItems.isEmpty) return SyncCycleResult.empty();

    // ═══ FIX: Deduplication — نزيل العناصر المكررة ═══
    final seen = <String>{};
    final uniqueItems = <Map<String, dynamic>>[];
    for (final item in pendingItems) {
      final id = item['offline_id'] as String? ?? '';
      if (id.isNotEmpty && seen.add(id)) {
        uniqueItems.add(item);
      }
    }

    if (uniqueItems.isEmpty) return SyncCycleResult.empty();

    _isSyncing = true;
    _syncLockTime = DateTime.now();
    _activeCompleter = Completer<SyncCycleResult>();
    _updateState(isSyncing: true);

    final result = SyncCycleResult();

    try {
      // ═══ معالجة العناصر دفعات ═══
      for (int offset = 0;
          offset < uniqueItems.length;
          offset += _maxBatchSize) {
        final batchEnd = (offset + _maxBatchSize).clamp(0, uniqueItems.length);
        final batch = uniqueItems.sublist(offset, batchEnd);

        if (kDebugMode)
          debugPrint(
            '[SyncService] Batch: ${batch.length} items ($offset/${uniqueItems.length})',
          );

        // ═══ FIX: تصفية العناصر التي تجاوزت الحد الأقصى ═══
        final toRetry = <Map<String, dynamic>>[];
        final toArchive = <Map<String, dynamic>>[];

        for (final item in batch) {
          final retryCount = (item['retry_count'] ?? 0) as int;
          if (retryCount >= _maxRetries) {
            toArchive.add(item);
          } else {
            toRetry.add(item);
          }
        }

        // ═══ FIX 2.1: Save failed items for recovery instead of permanent deletion ═══
        // Previously: items were permanently deleted after max retries
        // Now: items are saved to failed_submissions storage for user recovery
        final archivedIds = <String>[];
        for (final item in toArchive) {
          final offlineId = item['offline_id'] as String? ?? '';
          archivedIds.add(offlineId);
          // Save to failed submissions storage (not permanent deletion)
          await _offline.saveFailedSubmission(
            item,
            'Max retries ($_maxRetries) exceeded',
          );
          if (kDebugMode)
            debugPrint('[SyncService] Saved failed item for recovery: $offlineId');
          result.archived++;
          result.errors.add(
            SyncError(
              offlineId: offlineId,
              error: 'Max retries ($_maxRetries) exceeded — saved for recovery',
            ),
          );
        }
        // Batch remove all archived items from sync queue
        if (archivedIds.isNotEmpty) {
          await _offline.removeFromQueueBatch(archivedIds);
        }

        if (toRetry.isEmpty) continue;

        try {
          // تجهيز البيانات
          final items = toRetry.map((item) {
            final payload = Map<String, dynamic>.from(item);
            payload.remove('_syncing');
            payload.remove('_recovered');
            return payload;
          }).toList();

          final response = await _api.callFunction(
              SupabaseConfig.fnSyncOffline, {'items': items}).timeout(
            const Duration(seconds: 45), // ═══ FIX: 45s بدل 90s — لا نحظر UI ═══
            onTimeout: () {
              if (kDebugMode) print('[SyncService] Timeout');
              throw TimeoutException('Batch sync timed out');
            },
          );

          final serverResults = (response['results'] as List?) ?? [];
          final serverErrors = (response['errors'] as List?) ?? [];

          // ═══ PROPOSAL 3: Collect IDs to remove, batch at end ═══
          final syncedIds = <String>[];
          for (final item in toRetry) {
            final offlineId = item['offline_id'] as String? ?? '';

            final match = serverResults.cast<Map<String, dynamic>>().firstWhere(
                  (r) => r['offline_id'] == offlineId,
                  orElse: () => <String, dynamic>{},
                );

            if (match.isNotEmpty) {
              final status = match['status'] as String? ?? 'error';
              switch (status) {
                case 'synced':
                  syncedIds.add(offlineId);
                  result.synced++;
                case 'duplicate':
                  syncedIds.add(offlineId);
                  result.duplicates++;
                case 'conflict':
                  await _offline.saveConflict(item, match);
                  syncedIds.add(offlineId);
                  result.conflicts++;
                  result.conflictDetails.add(
                    OfflineSyncResult.conflict(offlineId, match),
                  );
                default:
                  // ═══ FIX: backoff تدريجي ═══
                  final retryCount = (item['retry_count'] ?? 0) as int;
                  final backoffSeconds = _calculateBackoff(retryCount);
                  item['retry_count'] = retryCount + 1;
                  item['last_retry_at'] = DateTime.now().toIso8601String();
                  item['next_retry_at'] = DateTime.now()
                      .add(Duration(seconds: backoffSeconds))
                      .toIso8601String();
                  result.failed++;
                  result.errors.add(
                    SyncError(
                      offlineId: offlineId,
                      error: match['error'] ??
                          'Unknown error (retry ${retryCount + 1}/$_maxRetries in ${backoffSeconds}s)',
                    ),
                  );
              }
            } else {
              final errMatch =
                  serverErrors.cast<Map<String, dynamic>>().firstWhere(
                        (e) => e['offline_id'] == offlineId,
                        orElse: () => <String, dynamic>{},
                      );
              final retryCount = (item['retry_count'] ?? 0) as int;
              final backoffSeconds = _calculateBackoff(retryCount);
              item['retry_count'] = retryCount + 1;
              item['last_retry_at'] = DateTime.now().toIso8601String();
              item['next_retry_at'] = DateTime.now()
                  .add(Duration(seconds: backoffSeconds))
                  .toIso8601String();
              result.failed++;
              result.errors.add(
                SyncError(
                  offlineId: offlineId,
                  error: errMatch['error'] ??
                      'No response (retry ${retryCount + 1}/$_maxRetries)',
                ),
              );
            }
          }

          // ═══ FIX F-1: Expose synced IDs in result for specific-item checking ═══
          result.syncedIds.addAll(syncedIds);

          // ═══ PROPOSAL 3: Batch remove all synced/duplicate/conflict items ═══
          // Previously: 50× (decrypt + encrypt) for 50 synced items
          // Now: 1× (decrypt + encrypt) for all items at once
          if (syncedIds.isNotEmpty) {
            await _offline.removeFromQueueBatch(syncedIds);
          }
        } on TimeoutException {
          // ═══ FIX: Save timed-out items to failed_submissions immediately ═══
          // Previously: applied backoff → retried 5 times over ~1 hour → then saved
          // Now: save immediately so user can see and retry manually
          for (final item in toRetry) {
            final offlineId = item['offline_id'] as String? ?? '';
            await _offline.saveFailedSubmission(item, 'Batch sync timeout');
            result.failed++;
            result.errors.add(
              SyncError(offlineId: offlineId, error: 'Timeout — saved for manual retry'),
            );
          }
          // Remove from sync queue
          final timeoutIds = toRetry.map((i) => i['offline_id'] as String).toList();
          await _offline.removeFromQueueBatch(timeoutIds);
        } catch (e) {
          if (kDebugMode) print('[SyncService] Batch error: $e');
          _applyBackoffToBatch(toRetry, result, e.toString());
        }

        // ═══ PERFORMANCE: Yield to UI thread between sync batches ═══
        // Prevents UI freeze when syncing many items
        await Future.delayed(Duration.zero);
      }

      // ═══ FIX: Invalidate ONLY submission-related caches after successful sync ═══
      // Previously: ALL caches were invalidated (governorates, districts, forms, etc.)
      // This caused unnecessary re-fetches of data that didn't change.
      // Now: only invalidate caches affected by the sync (submissions + analytics).
      // Reference data (governorates, districts, forms, facilities, references)
      // is refreshed by the user via the drawer's sync button, not automatically.
      if (result.synced > 0 || result.duplicates > 0) {
        _offline.updateConnectivity(true);

        final cache = _dataCache;
        if (cache != null) {
          // Only invalidate submission-dependent caches
          const prefixes = [
            'submissions',
            'dashboard_analytics',
            'shortages',
            'submission_trend',
            'governorate_ranking',
            'readiness_subs',
            'supervision_subs',
          ];

          int invalidated = 0;
          for (final prefix in prefixes) {
            await cache.invalidateByPrefix(prefix);
            invalidated++;
          }

          if (kDebugMode)
            debugPrint(
              '[SyncService] Invalidated $invalidated cache prefixes (submissions only)',
            );
        }
      }

      // ═══ FIX: Warm up forms cache for all campaign types ═══
      // Ensures both 'polio_campaign' and 'integrated_activity' forms
      // are cached locally whenever we are online.
      if (_offline.isOnline) {
        await _warmUpFormsCache();
      }
    } catch (e) {
      if (kDebugMode) print('[SyncService] Cycle error: $e');
      result.errors.add(SyncError(error: e.toString()));

      final errorStr = e.toString().toLowerCase();
      if (errorStr.contains('network') ||
          errorStr.contains('socket') ||
          errorStr.contains('connection') ||
          errorStr.contains('failed host') ||
          errorStr.contains('timeout')) {
        _offline.updateConnectivity(false);
      }
    } finally {
      _isSyncing = false;
      _syncLockTime = null;
      _updateState(
        isSyncing: false,
        lastSync: DateTime.now(),
        pendingCount: _offline.pendingCount,
      );
      if (_activeCompleter != null && !_activeCompleter!.isCompleted) {
        _activeCompleter!.complete(result);
      }
      _activeCompleter = null;
    }

    if (kDebugMode) {
      debugPrint(
        '[SyncService] Done: +${result.synced} dup=${result.duplicates} '
        'conf=${result.conflicts} fail=${result.failed} archive=${result.archived} '
        'remain=${_offline.pendingCount}',
      );
    }

    return result;
  }

  /// ═══ Warm up forms cache for all campaign types ═══
  /// ═══ PERFORMANCE: Only warm up if cache is empty (first sync after install) ═══
  /// Previously: 3 network calls after EVERY sync
  /// Now: only when cache has no forms data
  Future<void> _warmUpFormsCache() async {
    final cache = _dataCache;
    if (cache == null) return;

    try {
      // ═══ FIX N-8: Check if ALL form cache keys exist, not just any one ═══
      // Previously: skipped if ANY key existed (e.g. forms_polio_campaign cached
      //   but forms_all not → forms_all never warmed up)
      // Now: only skips if ALL required keys are cached
      final hasAllForms = cache.hasCachedData('forms_all') &&
          cache.hasCachedData('forms_polio_campaign') &&
          cache.hasCachedData('forms_integrated_activity');

      if (hasAllForms) {
        if (kDebugMode)
          debugPrint('[SyncService] Forms cache already warm — skipping');
        return;
      }

      // First time — warm up cache
      await cache.getList(
        'forms_all',
        () => _api.callFunction(SupabaseConfig.fnGetForms, {}).then(
          (resp) => List<Map<String, dynamic>>.from(resp['forms'] ?? []),
        ),
        maxAge: const Duration(hours: 12),
      );

      const types = ['polio_campaign', 'integrated_activity'];
      for (final type in types) {
        await cache.getList(
          'forms_$type',
          () => _api.callFunction(
              SupabaseConfig.fnGetForms, {'campaign_type': type}).then(
            (resp) => List<Map<String, dynamic>>.from(resp['forms'] ?? []),
          ),
          maxAge: const Duration(hours: 12),
        );
      }
      if (kDebugMode)
        debugPrint('[SyncService] Forms cache warmed up for all campaign types');
    } catch (e) {
      if (kDebugMode) print('[SyncService] Warm-up failed: $e');
    }
  }

  /// ═══ Backoff أسي: 10s → 20s → 40s → 80s → 160s ═══
  int _calculateBackoff(int retryCount) {
    return (10 * pow(2, retryCount)).toInt().clamp(10, 600);
  }

  /// تطبيق backoff على دفعة كاملة
  void _applyBackoffToBatch(
    List<Map<String, dynamic>> batch,
    SyncCycleResult result,
    String error,
  ) {
    for (final item in batch) {
      final retryCount = (item['retry_count'] ?? 0) as int;
      final backoffSeconds = _calculateBackoff(retryCount);
      item['retry_count'] = retryCount + 1;
      item['last_retry_at'] = DateTime.now().toIso8601String();
      item['next_retry_at'] = DateTime.now()
          .add(Duration(seconds: backoffSeconds))
          .toIso8601String();
      result.failed++;
      result.errors.add(
        SyncError(
          offlineId: item['offline_id'] as String? ?? '',
          error: '$error (retry ${retryCount + 1}/$_maxRetries)',
        ),
      );
    }
  }

  List<Map<String, dynamic>> getConflicts() {
    return _offline.getUnresolvedConflicts();
  }

  Future<void> resolveConflict(
    String offlineId, {
    bool useLocal = false,
  }) async {
    await _offline.resolveConflict(offlineId, useLocal: useLocal);
  }

  void _updateState({bool? isSyncing, DateTime? lastSync, int? pendingCount}) {
    _currentState = _currentState.copyWith(
      isSyncing: isSyncing,
      lastSync: lastSync,
      pendingCount: pendingCount,
    );
    if (!_syncStateController.isClosed) {
      _syncStateController.add(_currentState);
    }
  }

  void dispose() {
    _syncTimer?.cancel();
    _syncStateController.close();
  }
}

/// حالة خدمة المزامنة
class SyncState {
  final bool isSyncing;
  final DateTime? lastSync;
  final int pendingCount;

  const SyncState({
    this.isSyncing = false,
    this.lastSync,
    this.pendingCount = 0,
  });

  SyncState copyWith({bool? isSyncing, DateTime? lastSync, int? pendingCount}) {
    return SyncState(
      isSyncing: isSyncing ?? this.isSyncing,
      lastSync: lastSync ?? this.lastSync,
      pendingCount: pendingCount ?? this.pendingCount,
    );
  }
}

/// نتيجة دورة مزامنة
class SyncCycleResult {
  int synced = 0;
  int duplicates = 0;
  int conflicts = 0;
  int failed = 0;
  int archived = 0;
  List<SyncError> errors = [];
  List<OfflineSyncResult> conflictDetails = [];
  /// ═══ FIX F-1: Track which specific items were synced ═══
  /// Previously: form_fill_screen checked result.synced > 0 (total queue count)
  /// Now: can check result.syncedIds.contains(myOfflineId) for specific item
  List<String> syncedIds = [];

  SyncCycleResult();
  factory SyncCycleResult.empty() => SyncCycleResult();

  bool get hasErrors => errors.isNotEmpty;
  bool get hasConflicts => conflicts > 0;
  int get total => synced + duplicates + conflicts + failed + archived;

  @override
  String toString() =>
      'SyncCycleResult(synced=$synced, dup=$duplicates, conflict=$conflicts, '
      'failed=$failed, archived=$archived, syncedIds=${syncedIds.length})';
}

/// خطأ مزامنة فردي
class SyncError {
  final String? offlineId;
  final String error;

  SyncError({this.offlineId, required this.error});

  @override
  String toString() => 'SyncError(${offlineId ?? "?"}: $error)';
}
