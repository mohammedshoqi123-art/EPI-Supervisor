import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../config/app_config.dart';
import '../security/encryption_service.dart';
import '../errors/app_exceptions.dart';
import 'offline_manager.dart';

/// Offline-first data cache that stores Supabase query results locally.
/// Provides instant data access even without network connectivity.
///
/// Architecture:
///   UI → Provider → OfflineDataCache → [Cache Hit? return cached]
///                                      → [Cache Miss? fetch from API, cache, return]
///
/// When offline:
///   UI → Provider → OfflineDataCache → [Return cached data, stale is OK]
class OfflineDataCache {
  static const String _cacheBoxKey = 'data_cache';
  static const String _metadataKey = 'cache_metadata';

  // ═══ INCREMENTAL SYNC: Counter for periodic full refresh ═══
  // Every N incremental syncs, force a full refresh to catch updates/deletes
  static const int _incrementalSyncsBeforeFullRefresh = 3; // ═══ FIX: 3 (was 5) — faster detection of deleted records ═══
  final Map<String, int> _incrementalSyncCounts = {};

  final OfflineManager _offline;
  final EncryptionService _encryption;

  // In-memory cache for fastest access (LRU-style)
  final Map<String, _CacheEntry> _memoryCache = {};
  /// ═══ PERFORMANCE: 200 entries (was 100) — reduces Hive reads for frequently accessed data ═══
  static const int _maxMemoryEntries = 200;

  // ═══ PERFORMANCE: Track in-flight background refreshes to prevent duplicates ═══
  final Set<String> _refreshingKeys = {};

  OfflineDataCache(this._offline, this._encryption);

  // ═══════════════════════════════════════════════════════════════════════
  // CORE: Get data with offline-first strategy
  // ═══════════════════════════════════════════════════════════════════════

  /// Get data using offline-first strategy:
  /// 1. Return memory cache immediately (if available and fresh)
  /// 2. Fetch from network in background if stale
  /// 3. Update cache when network data arrives
  /// 4. If offline: return ANY cached data (even days-old stale data)
  /// 5. If nothing cached at all: rethrow
  ///
  /// [cacheKey] - unique key for this data (e.g., 'forms', 'submissions_all')
  /// [fetchFn] - function to fetch fresh data from Supabase
  /// [maxAge] - maximum age before cache is considered stale (default: 24 hours)
  /// [forceRefresh] - skip cache and always fetch fresh
  Future<List<Map<String, dynamic>>> getList(
    String cacheKey,
    Future<List<Map<String, dynamic>>> Function() fetchFn, {
    Duration maxAge = const Duration(hours: 24),
    bool forceRefresh = false,
  }) async {
    if (!forceRefresh) {
      // 1. Memory cache — if fresh enough, return immediately
      final memCached = _getFromMemory<List>(cacheKey, maxAge);
      if (memCached != null) {
        if (_isStale(cacheKey, maxAge)) {
          _refreshInBackground(cacheKey, fetchFn);
        }
        return List<Map<String, dynamic>>.from(memCached);
      }

      // 2. Persistent cache — if fresh enough, return immediately
      final persisted = _getFromPersistentRaw<List>(cacheKey);
      if (persisted != null) {
        _putToMemory(cacheKey, persisted);
        // Still refresh in background if online and data is old
        if (_offline.isOnline && _isStale(cacheKey, maxAge)) {
          _refreshInBackground(cacheKey, fetchFn);
        }
        return List<Map<String, dynamic>>.from(persisted);
      }
    }

    // 3. No cached data — fetch from network
    // ⚠️ OFFLINE FIX: لا تحاول الشبكة بدون إنترنت — استخدم stale cache فوراً
    if (!_offline.isOnline) {
      final staleMemory =
          _getFromMemory<List>(cacheKey, const Duration(days: 365));
      if (staleMemory != null)
        return List<Map<String, dynamic>>.from(staleMemory);

      final stalePersisted = _getFromPersistentRaw<List>(cacheKey);
      if (stalePersisted != null) {
        _putToMemory(cacheKey, stalePersisted);
        return List<Map<String, dynamic>>.from(stalePersisted);
      }

      // ═══ OFFLINE FALLBACK: Try to find related cached data ═══
      // When exact key not found (e.g., 'submissions_camp_polio_campaign_round_1'),
      // try broader keys (e.g., 'submissions_camp_polio_campaign') or any submissions_* key.
      // This prevents empty screens when the user changes filters offline.
      final relatedData = _findRelatedCache(cacheKey);
      if (relatedData != null) {
        _putToMemory(cacheKey, relatedData);
        if (relatedData is List) {
          return List<Map<String, dynamic>>.from(relatedData);
        }
      }

      // Nothing cached + offline → throw friendly error
      throw Exception('لا توجد بيانات مخزنة ولا يوجد اتصال بالإنترنت');
    }

    try {
      // ═══ FIX: مهلة 15s على fetchFn — لا نحظر UI لمدة طويلة ═══
      // ═══ PERFORMANCE: Yield to UI thread before heavy network call ═══
      await Future.delayed(Duration.zero);
      final data = await fetchFn().timeout(
        const Duration(seconds: 15),
        onTimeout: () => throw TimeoutException('Network timeout for $cacheKey'),
      );
      await _saveToCache(cacheKey, data);
      return data;
    } catch (e) {
      // 4. Network failed — ALWAYS try stale cache (memory or disk), never rethrow empty
      if (kDebugMode) {
        debugPrint(
            '[OfflineDataCache] Network failed for $cacheKey, using stale cache: $e');
      }

      final staleMemory =
          _getFromMemory<List>(cacheKey, const Duration(days: 365));
      if (staleMemory != null)
        return List<Map<String, dynamic>>.from(staleMemory);

      final stalePersisted = _getFromPersistentRaw<List>(cacheKey);
      if (stalePersisted != null) {
        _putToMemory(cacheKey, stalePersisted);
        return List<Map<String, dynamic>>.from(stalePersisted);
      }

      // Absolutely nothing cached — rethrow
      rethrow;
    }
  }

  /// ═══ Incremental Sync — only fetch NEW records and merge with cache ═══
  /// Returns cached data immediately, then fetches records newer than
  /// the latest `created_at` in cache and merges them.
  /// This avoids re-fetching 2000+ records every time.
  Future<List<Map<String, dynamic>>> incrementalGetList(
    String cacheKey,
    Future<List<Map<String, dynamic>>> Function({String? createdAfter}) fetchFn, {
    Duration maxAge = const Duration(hours: 24),
    String dateField = 'created_at',
    String idField = 'id',
  }) async {
    // 1. Get existing cached data (memory or persistent)
    List<Map<String, dynamic>> existing = [];
    final memCached = _getFromMemory<List>(cacheKey, maxAge);
    if (memCached != null) {
      existing = List<Map<String, dynamic>>.from(memCached);
    } else {
      final persisted = _getFromPersistentRaw<List>(cacheKey);
      if (persisted != null) {
        existing = List<Map<String, dynamic>>.from(persisted);
        _putToMemory(cacheKey, persisted);
      }
    }

    // 2. Find latest created_at in cache
    String? latestDate;
    if (existing.isNotEmpty) {
      for (final item in existing) {
        final d = item[dateField]?.toString() ?? '';
        if (d.isNotEmpty && (latestDate == null || d.compareTo(latestDate) > 0)) {
          latestDate = d;
        }
      }
    }

    // ═══ PERIODIC FULL REFRESH: every N incremental syncs, force full fetch ═══
    // This catches updated records that incremental sync misses.
    final syncCount = (_incrementalSyncCounts[cacheKey] ?? 0) + 1;
    _incrementalSyncCounts[cacheKey] = syncCount;
    final forceFullRefresh = syncCount % _incrementalSyncsBeforeFullRefresh == 0;

    if (forceFullRefresh && existing.isNotEmpty) {
      _incrementalSyncCounts[cacheKey] = 0;
      if (kDebugMode) {
        debugPrint('[OfflineDataCache] Periodic full refresh for $cacheKey (every $_incrementalSyncsBeforeFullRefresh syncs)');
      }
      try {
        // FIX: 45s timeout (was 15s) — large datasets with data JSONB need more time
        final allData = await fetchFn().timeout(
          const Duration(seconds: 45),
          onTimeout: () => throw TimeoutException('Full refresh timeout for $cacheKey'),
        );
        if (allData.isNotEmpty) {
          await _saveToCache(cacheKey, allData);
          return allData;
        }
      } catch (e) {
        if (kDebugMode) {
          debugPrint('[OfflineDataCache] Full refresh failed, falling back to incremental: $e');
        }
        // Fall through to incremental sync
      }
    }

    if (!_offline.isOnline) {
      if (existing.isNotEmpty) return existing;
      throw Exception('لا توجد بيانات مخزنة ولا يوجد اتصال بالإنترنت');
    }

    try {
      // 3. Fetch only new records (after latest cached date)
      // FIX: 45s timeout (was 15s) — fetch_submissions with 200+ rows needs more time
      final newRecords = await fetchFn(createdAfter: latestDate).timeout(
        const Duration(seconds: 45),
        onTimeout: () => throw TimeoutException('Incremental fetch timeout for $cacheKey'),
      );

      if (newRecords.isEmpty) {
        // No new records — return existing cache
        return existing;
      }

      // 4. Merge: add new records, dedup by idField
      final existingIds = existing.map((e) => e[idField]?.toString()).toSet();
      final trulyNew = newRecords.where((r) {
        final id = r[idField]?.toString();
        return id != null && !existingIds.contains(id);
      }).toList();

      if (trulyNew.isEmpty) return existing;

      // 5. Merge and save
      final merged = [...existing, ...trulyNew];
      await _saveToCache(cacheKey, merged);

      if (kDebugMode) {
        debugPrint('[OfflineDataCache] Incremental sync: ${existing.length} existing + ${trulyNew.length} new = ${merged.length} total');
      }

      return merged;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[OfflineDataCache] Incremental fetch failed for $cacheKey, using cache: $e');
      }
      if (existing.isNotEmpty) return existing;
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getMap(
    String cacheKey,
    Future<Map<String, dynamic>> Function() fetchFn, {
    Duration maxAge = const Duration(hours: 24),
    bool forceRefresh = false,
  }) async {
    if (!forceRefresh) {
      // 1. Memory cache
      final memCached = _getFromMemory<Map>(cacheKey, maxAge);
      if (memCached != null) {
        if (_isStale(cacheKey, maxAge)) {
          _refreshMapInBackground(cacheKey, fetchFn);
        }
        return Map<String, dynamic>.from(memCached);
      }

      // 2. Persistent cache — always return if available
      final persisted = _getFromPersistentRaw<Map>(cacheKey);
      if (persisted != null) {
        _putToMemory(cacheKey, persisted);
        if (_offline.isOnline && _isStale(cacheKey, maxAge)) {
          _refreshMapInBackground(cacheKey, fetchFn);
        }
        return Map<String, dynamic>.from(persisted);
      }
    }

    // ⚠️ OFFLINE FIX: لا تحاول الشبكة بدون إنترنت
    if (!_offline.isOnline) {
      final staleMemory =
          _getFromMemory<Map>(cacheKey, const Duration(days: 365));
      if (staleMemory != null) return Map<String, dynamic>.from(staleMemory);

      final stalePersisted = _getFromPersistentRaw<Map>(cacheKey);
      if (stalePersisted != null) {
        _putToMemory(cacheKey, stalePersisted);
        return Map<String, dynamic>.from(stalePersisted);
      }

      // ═══ OFFLINE FALLBACK: Try to find related cached data ═══
      final relatedData = _findRelatedCache(cacheKey);
      if (relatedData != null) {
        _putToMemory(cacheKey, relatedData);
        if (relatedData is Map) {
          return Map<String, dynamic>.from(relatedData);
        }
      }

      throw Exception('لا توجد بيانات مخزنة ولا يوجد اتصال بالإنترنت');
    }

    try {
      // ═══ FIX: مهلة 15s على fetchFn — لا نحظر UI لمدة طويلة ═══
      // ═══ PERFORMANCE: Yield to UI thread before heavy network call ═══
      await Future.delayed(Duration.zero);
      final data = await fetchFn().timeout(
        const Duration(seconds: 15),
        onTimeout: () => throw TimeoutException('Network timeout for $cacheKey'),
      );
      await _saveToCache(cacheKey, data);
      return data;
    } catch (e) {
      // Network failed — always try stale fallback
      final staleMemory =
          _getFromMemory<Map>(cacheKey, const Duration(days: 365));
      if (staleMemory != null) return Map<String, dynamic>.from(staleMemory);

      final stalePersisted = _getFromPersistentRaw<Map>(cacheKey);
      if (stalePersisted != null) {
        _putToMemory(cacheKey, stalePersisted);
        return Map<String, dynamic>.from(stalePersisted);
      }

      rethrow;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CACHE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════

  /// Save data to both memory and persistent cache
  Future<void> _saveToCache(String key, dynamic data) async {
    // Memory cache
    _putToMemory(key, data);

    // Persistent cache (via OfflineManager)
    if (data is Map) {
      await _offline.cacheData(key, Map<String, dynamic>.from(data));
    } else if (data is List) {
      await _offline.cacheData(key, {'_list': data, '_type': 'list'});
    }
  }

  /// Public: Save a list to both memory and persistent cache
  /// Used by FullSync to pre-populate cache from server data
  Future<void> putList(String key, List<Map<String, dynamic>> data) async {
    await _saveToCache(key, data);
  }

  /// Get from memory cache if not expired
  dynamic _getFromMemory<T>(String key, Duration maxAge) {
    final entry = _memoryCache[key];
    if (entry == null) return null;
    final age = DateTime.now().difference(entry.timestamp);
    if (age > maxAge) return null;
    if (entry.data is T) return entry.data;
    return null;
  }

  /// Get from persistent storage — IGNORES expiry, returns whatever is stored.
  /// Expiry decisions are made by the caller (getList/getMap) not here,
  /// because offline users should always see their cached data.
  dynamic _getFromPersistentRaw<T>(String key) {
    final cached = _offline.getCachedData(key, offlineOverride: true);
    if (cached == null) return null;
    if (T == List && cached['_type'] == 'list') return cached['_list'];
    if (T == List) return null;
    return cached;
  }

  /// Legacy method — kept for backwards compatibility with forceInvalidate callers.
  dynamic _getFromPersistent<T>(
    String key,
    Duration maxAge, {
    bool offlineOverride = false,
  }) {
    return _getFromPersistentRaw<T>(key);
  }

  /// Put data into memory cache with LRU eviction
  void _putToMemory(String key, dynamic data) {
    // Evict oldest if at capacity
    if (_memoryCache.length >= _maxMemoryEntries) {
      final oldest = _memoryCache.entries.reduce(
        (a, b) => a.value.timestamp.isBefore(b.value.timestamp) ? a : b,
      );
      _memoryCache.remove(oldest.key);
    }

    _memoryCache[key] = _CacheEntry(data: data, timestamp: DateTime.now());
  }

  /// Check if cache entry is stale
  bool _isStale(String key, Duration maxAge) {
    final entry = _memoryCache[key];
    if (entry == null) return true;
    return DateTime.now().difference(entry.timestamp) > maxAge;
  }

  /// Public: Check if cache entry is stale (for smart sync)
  bool isStale(String key, Duration maxAge) {
    // Check memory cache first
    final entry = _memoryCache[key];
    if (entry != null) {
      return DateTime.now().difference(entry.timestamp) > maxAge;
    }
    // Check persistent cache
    final persisted = _offline.getCachedData(key, offlineOverride: true);
    if (persisted == null) return true;
    // If it's in persistent cache, consider it fresh enough
    // (persistent cache has its own retention logic)
    return false;
  }

  /// ═══ OFFLINE FALLBACK: Find related cached data by prefix ═══
  /// When exact key not found, try to find a broader key with the same prefix.
  /// Example: 'submissions_camp_polio_campaign_round_1' → try 'submissions_camp_polio_campaign'
  /// ═══ FIX: Filter by campaign type to avoid returning wrong data ═══
  dynamic _findRelatedCache(String cacheKey) {
    // ═══ FIX: Better prefix matching — use everything before _camp_ or _round_ ═══
    // Previously: parts.first = just first word (e.g., 'submissions')
    // → matched ANY submissions key, even for different campaigns
    // Now: use prefix before _camp_ to be more specific
    String prefix;
    if (cacheKey.contains('_camp_')) {
      prefix = cacheKey.substring(0, cacheKey.indexOf('_camp_'));
    } else if (cacheKey.contains('_round_')) {
      prefix = cacheKey.substring(0, cacheKey.indexOf('_round_'));
    } else {
      // No campaign/round filter — use first two parts
      final parts = cacheKey.split('_');
      prefix = parts.length >= 2 ? '${parts[0]}_${parts[1]}' : parts.first;
    }

    if (prefix.length < 3) return null;

    // ═══ FIX: Extract campaign type from the requested key to filter matches ═══
    String? campaignFilter;
    if (cacheKey.contains('_camp_')) {
      final campIdx = cacheKey.indexOf('_camp_');
      final afterCamp = cacheKey.substring(campIdx + 6);
      final nextUnderscore = afterCamp.indexOf('_');
      campaignFilter = nextUnderscore >= 0 ? afterCamp.substring(0, nextUnderscore) : afterCamp;
    }

    // Try to find in memory cache with same prefix AND same campaign
    for (final entry in _memoryCache.entries) {
      if (entry.key.startsWith(prefix)) {
        // ═══ FIX: Only return if campaign matches (or no campaign filter) ═══
        if (campaignFilter == null || entry.key.contains(campaignFilter)) {
          return entry.value.data;
        }
      }
    }

    // Try to find in persistent cache with same prefix AND same campaign
    try {
      final allKeys = _offline.getCacheKeys();
      for (final key in allKeys) {
        if (key.startsWith(prefix)) {
          // ═══ FIX: Only return if campaign matches (or no campaign filter) ═══
          if (campaignFilter == null || key.contains(campaignFilter)) {
            final cached = _offline.getCachedData(key);
            if (cached != null) {
              // Handle list wrapper format
              if (cached is Map && cached['_type'] == 'list') {
                return cached['_list'];
              }
              return cached;
            }
          }
        }
      }
    } catch (_) {}

    return null;
  }

  /// Background refresh — fire and forget
  void _refreshInBackground(
    String key,
    Future<List<Map<String, dynamic>>> Function() fetchFn,
  ) {
    // ═══ PERFORMANCE: Skip if already refreshing this key ═══
    if (_refreshingKeys.contains(key)) return;
    _refreshingKeys.add(key);

    fetchFn().then((data) async {
      await _saveToCache(key, data);
      _refreshingKeys.remove(key);
      if (kDebugMode)
        debugPrint('[OfflineDataCache] Background refresh complete for $key');
    }).catchError((e) {
      _refreshingKeys.remove(key);
      if (kDebugMode)
        debugPrint('[OfflineDataCache] Background refresh failed for $key: $e');
    });
  }

  void _refreshMapInBackground(
    String key,
    Future<Map<String, dynamic>> Function() fetchFn,
  ) {
    // ═══ PERFORMANCE: Skip if already refreshing this key ═══
    if (_refreshingKeys.contains(key)) return;
    _refreshingKeys.add(key);

    fetchFn().then((data) async {
      await _saveToCache(key, data);
      _refreshingKeys.remove(key);
    }).catchError((e) {
      _refreshingKeys.remove(key);
      if (kDebugMode)
        debugPrint('[OfflineDataCache] Background refresh failed for $key: $e');
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INVALIDATION
  // ═══════════════════════════════════════════════════════════════════════

  /// Invalidate a specific cache key — clears BOTH memory and persistent cache.
  /// This ensures the next read fetches fresh data from server.
  Future<void> invalidate(String key) async {
    _memoryCache.remove(key);
    await _offline.removeCacheKey(key);
    if (kDebugMode)
      debugPrint(
        '[OfflineDataCache] Invalidated cache for $key (memory + persistent)',
      );
  }

  /// Invalidate all cached data
  Future<void> invalidateAll() async {
    _memoryCache.clear();
    await _offline.clearCache();
    if (kDebugMode) print('[OfflineDataCache] All caches cleared');
  }

  /// Invalidate all cache keys matching a prefix — clears BOTH memory and Hive.
  /// ═══ FIX: Previous sync invalidation only checked _memoryCache.keys (via getDebugInfo),
  /// missing keys that were evicted from memory (LRU) but still persisted in Hive.
  /// This caused stale data to be served after sync, especially in the Numbers/Visitors tab.
  Future<void> invalidateByPrefix(String prefix) async {
    // 1. Clear matching memory cache keys
    final memoryKeys =
        _memoryCache.keys.where((k) => k.startsWith(prefix)).toList();
    for (final key in memoryKeys) {
      _memoryCache.remove(key);
    }

    // 2. Clear matching persistent (Hive) cache keys
    final persistentKeys =
        _offline.getCacheKeys().where((k) => k.startsWith(prefix)).toList();
    for (final key in persistentKeys) {
      await _offline.removeCacheKey(key);
    }

    final total = memoryKeys.length + persistentKeys.length;
    if (kDebugMode && total > 0) {
      debugPrint('[OfflineDataCache] Invalidated $total keys by prefix "$prefix" '
          '(memory: ${memoryKeys.length}, persistent: ${persistentKeys.length})');
    }
  }

  /// Check if we have any cached data for a key (including stale when offline).
  bool hasCachedData(String key) {
    if (_memoryCache.containsKey(key)) return true;
    if (_offline.getCachedData(key) != null) return true;
    // Offline fallback: check for stale data
    if (!_offline.isOnline) {
      return _offline.getCachedData(key, offlineOverride: true) != null;
    }
    return false;
  }

  /// Force-clear a specific cache key so next fetch is fresh from server.
  /// Use this for pull-to-refresh: clear the cache, then fetch.
  Future<void> forceInvalidate(String key) async {
    _memoryCache.remove(key);
    await _offline.removeCacheKey(key);
    if (kDebugMode) print('[OfflineDataCache] Force invalidated: $key');
  }

  /// Get cached data as a raw value (for stats, counts, etc.).
  /// Uses offline override to always return data when offline.
  dynamic getCachedData(String key) {
    var data = _offline.getCachedData(key);
    if (data == null && !_offline.isOnline) {
      data = _offline.getCachedData(key, offlineOverride: true);
    }
    return data;
  }

  /// Cache a single form's data for offline access
  Future<void> cacheFormData(
    String formId,
    Map<String, dynamic> formData,
  ) async {
    final cachedForms = getCachedDataList('forms_all') ?? [];
    // Update or add the form in the cached list
    bool found = false;
    for (int i = 0; i < cachedForms.length; i++) {
      if (cachedForms[i]['id'] == formId) {
        cachedForms[i] = formData;
        found = true;
        break;
      }
    }
    if (!found) {
      cachedForms.add(formData);
    }
    await _saveToCache('forms_all', cachedForms);
  }

  /// Get cached data as a list (handles the list wrapper format).
  /// Uses offline override to return data even when cache is "stale" —
  /// because offline users need their data regardless of age.
  List<Map<String, dynamic>>? getCachedDataList(String key) {
    // Try fresh first, then fallback to stale (offline override)
    dynamic cached = _offline.getCachedData(key);
    cached ??= _offline.getCachedData(key, offlineOverride: true);

    if (cached == null) return null;

    // Handle list wrapper: { _type: 'list', _list: [...] }
    if (cached is Map) {
      if (cached['_type'] == 'list' && cached['_list'] is List) {
        final list = cached['_list'] as List;
        return list
            .cast<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }
      return null;
    }

    // If it's directly a list
    if (cached is List) {
      return cached
          .cast<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }

    return null;
  }

  /// Find cached list by key prefix — returns first match
  /// Used as fallback when specific cache key is empty
  List<Map<String, dynamic>>? findCachedListByPrefix(String prefix) {
    try {
      final allKeys = _offline.getCacheKeys();
      for (final key in allKeys) {
        if (key.startsWith(prefix)) {
          final result = getCachedDataList(key);
          if (result != null && result.isNotEmpty) return result;
        }
      }
    } catch (_) {}
    return null;
  }

  /// Get cache status for debugging
  Map<String, dynamic> getDebugInfo() {
    return {
      'memoryEntries': _memoryCache.length,
      'maxMemoryEntries': _maxMemoryEntries,
      'keys': _memoryCache.keys.toList(),
    };
  }
}

/// Internal cache entry with timestamp
class _CacheEntry {
  final dynamic data;
  final DateTime timestamp;

  _CacheEntry({required this.data, required this.timestamp});
}
