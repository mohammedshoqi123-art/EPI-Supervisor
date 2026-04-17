import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:uuid/uuid.dart';
import '../config/app_config.dart';
import '../security/encryption_service.dart';
import '../errors/app_exceptions.dart';
import 'sync_models.dart';

// Re-export models from sync_models.dart
export 'sync_models.dart' show OfflineSyncStatus, OfflineSyncResult;

/// Manages offline data storage, sync queue, drafts, and cache.
/// Handles conflict resolution and retry logic for reliable offline-first operation.
///
/// ═══ v2.1 — Per-key storage ═══
/// - Cache: each entry stored as Hive["cache_&lt;key&gt;"] (was single blob)
/// - Drafts: each draft stored as Hive["draft_&lt;formId&gt;"] (was single blob)
/// - Write locks: per-key instead of global (allows parallel writes to different keys)
/// - Migration: old single-blob format auto-migrated on first init
class OfflineManager {
  static const String _boxName = 'epi_offline';
  static const String _syncQueueKey = 'sync_queue';
  static const String _conflictsKey = 'sync_conflicts';

  // ─── Per-key prefixes ───
  static const String _cachePrefix = 'cache_';
  static const String _draftPrefix = 'draft_';

  // ─── Legacy keys (old single-blob format — for migration) ───
  static const String _legacyCacheKey = 'cache';
  static const String _legacyDraftsKey = 'drafts';

  // ─── Index keys (plain-text lists of keys for fast lookup) ───
  static const String _cacheIndexKey = 'cache_index';
  static const String _draftsIndexKey = 'drafts_index';

  // ─── Migration marker ───
  static const String _migrationDoneKey = '_migration_v2_done';

  static const int _maxRetries = 3;
  static const int _maxPayloadSize = 1024 * 1024; // 1MB

  Box<String>? _box;
  final EncryptionService _encryption;
  final _connectivityController = StreamController<bool>.broadcast();
  final _uuid = const Uuid();

  bool _initialized = false;

  // ═══ FIX: Use late-initialized connectivity status, default to true ═══
  bool _isOnline = true;
  bool get isOnline => _isOnline;
  Stream<bool> get connectivityStream => _connectivityController.stream;

  /// Update connectivity status from external source (ConnectivityUtils).
  void updateConnectivity(bool online) {
    if (_isOnline != online) {
      _isOnline = online;
      if (!_connectivityController.isClosed) {
        _connectivityController.add(_isOnline);
      }
      if (kDebugMode)
        print(
            '[OfflineManager] Connectivity changed: ${online ? "online" : "offline"}');
    }
  }

  /// Whether the offline storage is initialized and ready
  bool get isInitialized => _box != null && _box!.isOpen;

  OfflineManager(this._encryption);

  Future<void> init() async {
    if (_initialized) {
      if (kDebugMode) print('[OfflineManager] Already initialized, skipping');
      return;
    }

    try {
      try {
        _box = await Hive.openBox<String>(_boxName).timeout(
          const Duration(seconds: 10),
          onTimeout: () {
            throw TimeoutException('Hive box open timed out');
          },
        );
      } catch (_) {
        await Hive.initFlutter().timeout(
          const Duration(seconds: 10),
          onTimeout: () {
            if (kDebugMode) print('Hive.initFlutter timed out');
            throw TimeoutException('Hive initialization timed out');
          },
        );
        _box = await Hive.openBox<String>(_boxName).timeout(
          const Duration(seconds: 10),
          onTimeout: () {
            throw TimeoutException('Hive box open timed out after init');
          },
        );
      }
    } catch (e) {
      if (kDebugMode) print('[OfflineManager] Init failed: $e');
      rethrow;
    }

    // ═══ Migrate old single-blob format to per-key (one-time) ═══
    await _migrateOldFormat();

    // ═══ FIX: Recover stuck items from previous crashes ═══
    await _recoverStuckSyncingItems();

    _initialized = true;
    if (kDebugMode)
      print(
          '[OfflineManager] Initialized. Pending items: ${_getQueue().length}');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MIGRATION: Old single-blob → per-key format (one-time, non-destructive)
  // ═══════════════════════════════════════════════════════════════════════

  Future<void> _migrateOldFormat() async {
    if (_safeBox.get(_migrationDoneKey) == '1') {
      if (kDebugMode) print('[OfflineManager] Migration already done, skipping');
      return;
    }

    int migrated = 0;

    // Migrate old cache blob → per-key entries
    try {
      final oldCacheRaw = _safeBox.get(_legacyCacheKey);
      if (oldCacheRaw != null && oldCacheRaw.isNotEmpty) {
        Map<String, dynamic> oldCache;
        try {
          final decrypted = _encryption.decrypt(oldCacheRaw);
          oldCache = Map<String, dynamic>.from(jsonDecode(decrypted));
        } catch (_) {
          // Might be unencrypted legacy data
          try {
            oldCache = Map<String, dynamic>.from(jsonDecode(oldCacheRaw));
          } catch (_) {
            oldCache = {};
          }
        }

        if (oldCache.isNotEmpty) {
          final index = <String>[];
          for (final entry in oldCache.entries) {
            final hiveKey = '$_cachePrefix${entry.key}';
            final value = entry.value;
            final encrypted = _encryption.encrypt(jsonEncode(value));
            await _safeBox.put(hiveKey, encrypted);
            index.add(entry.key);
            migrated++;
          }
          await _safeBox.put(_cacheIndexKey, jsonEncode(index));
          await _safeBox.delete(_legacyCacheKey);
          if (kDebugMode)
            print('[OfflineManager] Migrated ${oldCache.length} cache entries');
        }
      }
    } catch (e) {
      if (kDebugMode) print('[OfflineManager] Cache migration error: $e');
    }

    // Migrate old drafts blob → per-key entries
    try {
      final oldDraftsRaw = _safeBox.get(_legacyDraftsKey);
      if (oldDraftsRaw != null && oldDraftsRaw.isNotEmpty) {
        Map<String, dynamic> oldDrafts;
        try {
          final decrypted = _encryption.decrypt(oldDraftsRaw);
          oldDrafts = Map<String, dynamic>.from(jsonDecode(decrypted));
        } catch (_) {
          try {
            oldDrafts = Map<String, dynamic>.from(jsonDecode(oldDraftsRaw));
          } catch (_) {
            oldDrafts = {};
          }
        }

        if (oldDrafts.isNotEmpty) {
          final index = <String>[];
          for (final entry in oldDrafts.entries) {
            final hiveKey = '$_draftPrefix${entry.key}';
            final value = entry.value;
            final encrypted = _encryption.encrypt(jsonEncode(value));
            await _safeBox.put(hiveKey, encrypted);
            index.add(entry.key);
            migrated++;
          }
          await _safeBox.put(_draftsIndexKey, jsonEncode(index));
          await _safeBox.delete(_legacyDraftsKey);
          if (kDebugMode)
            print('[OfflineManager] Migrated ${oldDrafts.length} drafts');
        }
      }
    } catch (e) {
      if (kDebugMode) print('[OfflineManager] Drafts migration error: $e');
    }

    await _safeBox.put(_migrationDoneKey, '1');
    if (kDebugMode && migrated > 0)
      print('[OfflineManager] Migration complete: $migrated migrated items');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PER-KEY WRITE LOCKS (allows parallel writes to different keys)
  // ═══════════════════════════════════════════════════════════════════════

  final Map<String, Completer<void>> _keyLocks = {};

  Future<T> _withKeyLock<T>(String key, Future<T> Function() action) async {
    final prevLock = _keyLocks[key];
    final myLock = Completer<void>();
    _keyLocks[key] = myLock;

    if (prevLock != null) {
      await prevLock.future;
    }

    try {
      return await action();
    } finally {
      myLock.complete();
      if (_keyLocks[key] == myLock) {
        _keyLocks.remove(key);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CRASH RECOVERY
  // ═══════════════════════════════════════════════════════════════════════

  Future<void> _recoverStuckSyncingItems() async {
    if (_box == null || !_box!.isOpen) return;

    final data = _safeBox.get(_syncQueueKey);
    if (data == null || data.isEmpty) return;

    try {
      final decoded = jsonDecode(_encryption.decrypt(data));
      final queue = List<Map<String, dynamic>>.from(decoded);

      int recovered = 0;
      for (int i = 0; i < queue.length; i++) {
        final item = queue[i];
        if (item['_syncing'] == true) {
          queue[i] = Map<String, dynamic>.from(item);
          queue[i].remove('_syncing');
          queue[i]['retry_count'] = (item['retry_count'] ?? 0);
          queue[i]['_recovered'] = true;
          recovered++;
        }
      }

      if (recovered > 0) {
        final encrypted = _encryption.encrypt(jsonEncode(queue));
        await _safeBox.put(_syncQueueKey, encrypted);
        if (kDebugMode)
          print('[OfflineManager] Recovered $recovered stuck syncing items');
      }
    } catch (e) {
      if (kDebugMode) print('[OfflineManager] Recovery check failed: $e');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SAFE BOX ACCESS
  // ═══════════════════════════════════════════════════════════════════════

  Box<String> get _safeBox {
    final b = _box;
    if (b == null || !b.isOpen) {
      throw StateError('OfflineManager not initialized. Call init() first.');
    }
    return b;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SUBMISSIONS QUEUE (unchanged — single blob is fine for queue)
  // ═══════════════════════════════════════════════════════════════════════

  /// Add a submission to the offline sync queue with a unique idempotency key.
  Future<String> addToSyncQueue(Map<String, dynamic> submission) async {
    return _withKeyLock('sync_queue', () async {
      final offlineId = _uuid.v4();
      submission['offline_id'] = offlineId;
      submission['idempotency_key'] = offlineId;
      submission['created_at'] = DateTime.now().toIso8601String();
      submission['retry_count'] = 0;

      final payloadSize = jsonEncode(submission).length;
      if (payloadSize > _maxPayloadSize) {
        throw ValidationException(
            'Submission payload too large (${payloadSize ~/ 1024}KB, max ${_maxPayloadSize ~/ 1024}KB)',
            fieldErrors: {'size': 'exceeds 1MB limit'});
      }

      final queue = _getQueue();
      queue.add(submission);
      await _saveQueue(queue);
      _invalidatePendingCount();

      return offlineId;
    });
  }

  List<Map<String, dynamic>> _getQueue() {
    final data = _safeBox.get(_syncQueueKey);
    if (data == null || data.isEmpty) return [];
    try {
      final decoded = jsonDecode(_encryption.decrypt(data));
      return List<Map<String, dynamic>>.from(decoded);
    } catch (e) {
      if (kDebugMode) print('[OfflineManager] Queue decrypt error: $e');
      return [];
    }
  }

  Future<void> _saveQueue(List<Map<String, dynamic>> queue) async {
    final encrypted = _encryption.encrypt(jsonEncode(queue));
    await _safeBox.put(_syncQueueKey, encrypted);
  }

  Future<List<Map<String, dynamic>>> getPendingItems() async {
    return _getQueue();
  }

  Future<void> removeFromQueue(String offlineId) async {
    return _withKeyLock('sync_queue', () async {
      final queue = _getQueue();
      queue.removeWhere((item) => item['offline_id'] == offlineId);
      await _saveQueue(queue);
      _invalidatePendingCount();
    });
  }

  Future<void> clearQueue() async {
    await _safeBox.delete(_syncQueueKey);
    _invalidatePendingCount();
  }

  // ✅ FIX: Cache pending count to avoid decrypting queue on every access
  int _cachedPendingCount = -1;
  int get pendingCount {
    if (_cachedPendingCount < 0) {
      _cachedPendingCount = _getQueue().length;
    }
    return _cachedPendingCount;
  }

  void _invalidatePendingCount() {
    _cachedPendingCount = -1;
  }

  /// Sync all pending items with retry logic and conflict handling.
  Future<List<OfflineSyncResult>> syncPendingItems(
      Future<Map<String, dynamic>> Function(Map<String, dynamic>)
          submitFn) async {
    final pending = _getQueue();
    if (pending.isEmpty) return [];

    final results = <OfflineSyncResult>[];
    final remaining = <Map<String, dynamic>>[];

    for (final item in pending) {
      item['_syncing'] = true;
    }

    for (final item in pending) {
      try {
        final payload = Map<String, dynamic>.from(item);
        payload.remove('_syncing');
        payload.remove('_recovered');
        payload['sync_metadata'] = {
          'client_timestamp': DateTime.now().toIso8601String(),
          'app_version': AppConfig.appVersion,
          'retry_count': item['retry_count'] ?? 0,
        };

        final response = await submitFn(payload);

        if (response['status'] == 'duplicate') {
          results
              .add(OfflineSyncResult.duplicate(item['offline_id'], response));
        } else if (response['conflict'] == true) {
          await _saveConflict(item, response);
          results.add(OfflineSyncResult.conflict(item['offline_id'], response));
        } else if (response['success'] == true) {
          results.add(OfflineSyncResult.success(item['offline_id'], response));
        } else {
          final retryCount = (item['retry_count'] ?? 0) as int;
          item['retry_count'] = retryCount + 1;
          item['last_retry_at'] = DateTime.now().toIso8601String();
          item.remove('_syncing');
          remaining.add(item);
          results.add(OfflineSyncResult.error(
              item['offline_id'], 'Unexpected server response'));
        }
      } on ApiException catch (e) {
        final retryCount = (item['retry_count'] ?? 0) as int;
        if (_isRetryableError(e) && retryCount < _maxRetries) {
          item['retry_count'] = retryCount + 1;
          item['last_retry_at'] = DateTime.now().toIso8601String();
          item.remove('_syncing');
          remaining.add(item);
          results.add(OfflineSyncResult.error(item['offline_id'],
              'RETRY_${retryCount + 1}/$_maxRetries: ${e.message}'));
        } else {
          item.remove('_syncing');
          remaining.add(item);
          results.add(OfflineSyncResult.error(item['offline_id'], e.message));
        }
      } catch (e) {
        item.remove('_syncing');
        remaining.add(item);
        results.add(OfflineSyncResult.error(item['offline_id'], e.toString()));
      }
    }

    await _saveQueue(remaining);
    _invalidatePendingCount();

    _logSyncSummary(results);
    return results;
  }

  bool _isRetryableError(ApiException e) {
    final code = e.code;
    if (code == null) return true;
    return code.startsWith('5') ||
        code == 'NETWORK' ||
        code == 'timeout' ||
        code == 'ETIMEDOUT' ||
        code == 'ECONNREFUSED';
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONFLICTS (unchanged)
  // ═══════════════════════════════════════════════════════════════════════

  Future<void> saveConflict(
      Map<String, dynamic> local, Map<String, dynamic> server) async {
    try {
      final conflicts = _getConflicts();
      conflicts[local['offline_id']] = {
        'local': local,
        'server': server,
        'detected_at': DateTime.now().toIso8601String(),
        'resolved': false,
      };
      final encrypted = _encryption.encrypt(jsonEncode(conflicts));
      await _safeBox.put(_conflictsKey, encrypted);
    } catch (e) {
      if (kDebugMode) print('Failed to save conflict: $e');
    }
  }

  Future<void> _saveConflict(
      Map<String, dynamic> local, Map<String, dynamic> server) async {
    return saveConflict(local, server);
  }

  Map<String, dynamic> _getConflicts() {
    final data = _safeBox.get(_conflictsKey);
    if (data == null || data.isEmpty) return {};
    try {
      return Map<String, dynamic>.from(jsonDecode(_encryption.decrypt(data)));
    } catch (_) {
      return {};
    }
  }

  List<Map<String, dynamic>> getUnresolvedConflicts() {
    final conflicts = _getConflicts();
    return conflicts.entries
        .where((e) => e.value['resolved'] != true)
        .map((e) => {'id': e.key, ...Map<String, dynamic>.from(e.value)})
        .toList();
  }

  Future<void> resolveConflict(String offlineId,
      {bool useLocal = false}) async {
    final conflicts = _getConflicts();
    if (conflicts.containsKey(offlineId)) {
      conflicts[offlineId]['resolved'] = true;
      conflicts[offlineId]['resolution'] =
          useLocal ? 'local_wins' : 'server_wins';
      conflicts[offlineId]['resolved_at'] = DateTime.now().toIso8601String();
      final encrypted = _encryption.encrypt(jsonEncode(conflicts));
      await _safeBox.put(_conflictsKey, encrypted);
    }
  }

  void _logSyncSummary(List<OfflineSyncResult> results) {
    if (kDebugMode && results.isNotEmpty) {
      final success = results.where((r) => r.isSuccess).length;
      final duplicates = results.where((r) => r.isDuplicate).length;
      final conflicts = results.where((r) => r.isConflict).length;
      final errors = results.where((r) => r.isError).length;
      print(
          'Sync summary: $success ok, $duplicates dup, $conflicts conflict, $errors error');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DRAFTS — per-key storage (each draft = separate Hive entry)
  // ═══════════════════════════════════════════════════════════════════════

  Future<void> saveDraft(String formId, Map<String, dynamic> data) async {
    return _withKeyLock('draft_$formId', () async {
      final entry = {
        'data': data,
        'saved_at': DateTime.now().toIso8601String(),
      };
      final encrypted = _encryption.encrypt(jsonEncode(entry));
      await _safeBox.put('$_draftPrefix$formId', encrypted);

      // Update index
      final index = _getDraftIndex();
      if (!index.contains(formId)) {
        index.add(formId);
        await _safeBox.put(_draftsIndexKey, jsonEncode(index));
      }
    });
  }

  Map<String, dynamic>? getDraft(String formId) {
    final raw = _safeBox.get('$_draftPrefix$formId');
    if (raw == null || raw.isEmpty) return null;
    try {
      final decoded = jsonDecode(_encryption.decrypt(raw));
      return Map<String, dynamic>.from(decoded['data'] ?? decoded);
    } catch (e) {
      if (kDebugMode) print('[OfflineManager] Draft decrypt error ($formId): $e');
      return null;
    }
  }

  Set<String> getDraftFormIds() {
    return _getDraftIndex().toSet();
  }

  Future<void> removeDraft(String formId) async {
    return _withKeyLock('draft_$formId', () async {
      await _safeBox.delete('$_draftPrefix$formId');
      final index = _getDraftIndex();
      index.remove(formId);
      await _safeBox.put(_draftsIndexKey, jsonEncode(index));
    });
  }

  List<String> _getDraftIndex() {
    final raw = _safeBox.get(_draftsIndexKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      return List<String>.from(jsonDecode(raw));
    } catch (_) {
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CACHE — per-key storage (each cache entry = separate Hive entry)
  //
  // Offline behavior PRESERVED:
  //   - getCachedData() checks normal expiry (24h) when online
  //   - getCachedData(offlineOverride: true) → returns data up to 30 days old
  //   - When offline → data is NEVER discarded (up to 30 days)
  //   - 30-day limit = AppConfig.maxOfflineRetention
  // ═══════════════════════════════════════════════════════════════════════

  /// Save data to persistent cache. Each key gets its own Hive entry.
  Future<void> cacheData(String key, Map<String, dynamic> data) async {
    return _withKeyLock('cache_$key', () async {
      final entry = {
        'data': data,
        'cached_at': DateTime.now().toIso8601String(),
      };
      final encrypted = _encryption.encrypt(jsonEncode(entry));
      await _safeBox.put('$_cachePrefix$key', encrypted);

      // Update index
      final index = _getCacheIndex();
      if (!index.contains(key)) {
        index.add(key);
        await _safeBox.put(_cacheIndexKey, jsonEncode(index));
      }
    });
  }

  /// Get cached data by key.
  ///
  /// Offline behavior (UNCHANGED):
  ///   - When offline or [offlineOverride]=true: returns data up to 30 days old
  ///   - When online: returns data only if younger than [AppConfig.cacheExpiry] (24h)
  ///   - 30-day limit = [AppConfig.maxOfflineRetention]
  Map<String, dynamic>? getCachedData(String key,
      {bool offlineOverride = false}) {
    final raw = _safeBox.get('$_cachePrefix$key');
    if (raw == null || raw.isEmpty) return null;

    try {
      final entry = jsonDecode(_encryption.decrypt(raw));
      final cachedAt = DateTime.tryParse(entry['cached_at'] ?? '');
      if (cachedAt != null) {
        final age = DateTime.now().difference(cachedAt);

        // Offline or override: allow data up to 30 days old
        if (offlineOverride || !_isOnline) {
          if (age > AppConfig.maxOfflineRetention) {
            if (kDebugMode)
              print(
                  '[OfflineManager] Cache expired (>${AppConfig.maxOfflineRetention.inDays} days) for $key');
            return null;
          }
          return entry['data'];
        }

        // Online: normal expiry check
        if (age > AppConfig.cacheExpiry) {
          return null;
        }
      }

      return entry['data'];
    } catch (_) {
      return null;
    }
  }

  /// Clear all cached data (all cache_ prefixed keys).
  Future<void> clearCache() async {
    final index = _getCacheIndex();
    for (final key in index) {
      await _safeBox.delete('$_cachePrefix$key');
    }
    // Safety: also clean any orphaned cache_ keys not in index
    for (final hiveKey in _safeBox.keys) {
      if (hiveKey is String && hiveKey.startsWith(_cachePrefix)) {
        await _safeBox.delete(hiveKey);
      }
    }
    await _safeBox.delete(_cacheIndexKey);
  }

  /// Remove a specific key from the persistent cache.
  Future<void> removeCacheKey(String key) async {
    return _withKeyLock('cache_$key', () async {
      await _safeBox.delete('$_cachePrefix$key');
      final index = _getCacheIndex();
      index.remove(key);
      await _safeBox.put(_cacheIndexKey, jsonEncode(index));
    });
  }

  List<String> _getCacheIndex() {
    final raw = _safeBox.get(_cacheIndexKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      return List<String>.from(jsonDecode(raw));
    } catch (_) {
      return [];
    }
  }

  void dispose() {
    _connectivityController.close();
  }
}
