import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
// ═══ PERFORMANCE: Use compute() for background JSON encoding ═══
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
class OfflineManager {
  static const String _boxName = 'epi_offline';
  static const String _syncQueueKey = 'sync_queue';
  static const String _draftsKey = 'drafts';
  static const String _cacheKey = 'cache';
  static const String _conflictsKey = 'sync_conflicts';

  static const int _maxRetries = 3;
  // ═══ FIX O3: Increased from 1MB to 5MB — 1MB was rejecting submissions with 2+ photos ═══
  // A single compressed photo (quality 70%, maxWidth 1280) is ~300-800KB base64.
  // Two photos + form data easily exceeds 1MB, causing silent submission failure.
  static const int _maxPayloadSize = 5 * 1024 * 1024; // 5MB

  Box<String>? _box;
  final EncryptionService _encryption;
  final _connectivityController = StreamController<bool>.broadcast();
  final _pendingCountController = StreamController<int>.broadcast();
  final _uuid = const Uuid();

  bool _initialized = false;

  // ═══ FIX: Use late-initialized connectivity status, default to true ═══
  bool _isOnline = true;
  bool get isOnline => _isOnline;
  Stream<bool> get connectivityStream => _connectivityController.stream;
  /// ═══ FIX ME4: Reactive pending count stream ═══
  Stream<int> get pendingCountStream => _pendingCountController.stream;

  /// Update connectivity status from external source (ConnectivityUtils).
  void updateConnectivity(bool online) {
    if (_isOnline != online) {
      _isOnline = online;
      if (!_connectivityController.isClosed) {
        _connectivityController.add(_isOnline);
      }
      if (kDebugMode)
        debugPrint(
          '[OfflineManager] Connectivity changed: ${online ? "online" : "offline"}',
        );
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
          const Duration(seconds: 5),
          onTimeout: () {
            throw TimeoutException('Hive box open timed out');
          },
        );
      } catch (e) {
        // ═══ FIX ME3: Hive corruption recovery ═══
        // If box open fails (corrupted file from power loss, etc.),
        // backup corrupted file for diagnostics, then delete and retry.
        if (kDebugMode) {
          debugPrint('[OfflineManager] Box open failed, attempting recovery: $e');
        }
        try {
          // ═══ IMPROVEMENT: Backup corrupted file before deleting ═══
          // This allows post-mortem diagnostics of data corruption.
          try {
            // Try to get box path from the box object itself
            final boxPath = _box?.path;
            if (boxPath != null) {
              final backupPath = '$boxPath.corrupted.${DateTime.now().millisecondsSinceEpoch}';
              final file = File(boxPath);
              if (await file.exists()) {
                await file.copy(backupPath);
                if (kDebugMode) {
                  debugPrint('[OfflineManager] Corrupted box backed up to: $backupPath');
                }
              }
            }
          } catch (backupError) {
            if (kDebugMode) {
              debugPrint('[OfflineManager] Could not backup corrupted box: $backupError');
            }
          }
          await Hive.deleteBoxFromDisk(_boxName);
        } catch (_) {}

        await Hive.initFlutter().timeout(
          const Duration(seconds: 5),
          onTimeout: () {
            if (kDebugMode) print('Hive.initFlutter timed out');
            throw TimeoutException('Hive initialization timed out');
          },
        );
        _box = await Hive.openBox<String>(_boxName).timeout(
          const Duration(seconds: 5),
          onTimeout: () {
            throw TimeoutException('Hive box open timed out after recovery');
          },
        );
        if (kDebugMode) {
          debugPrint('[OfflineManager] ✅ Recovered from Hive corruption (data reset)');
        }
      }
    } catch (e) {
      if (kDebugMode) print('[OfflineManager] Init failed: $e');
      rethrow;
    }

    // ═══ PROPOSAL 1: Initialize EncryptionService with stable salt ═══
    // PBKDF2 (600k iterations) runs ONCE here, in a BACKGROUND ISOLATE
    // so the UI thread is not blocked. Then all encrypt/decrypt use the
    // pinned key = <1ms per operation.
    if (!EncryptionService.isInitialized) {
      await EncryptionService.initialize(
        encryptionKey: const String.fromEnvironment('ENCRYPTION_KEY', defaultValue: ''),
        saltSource: () {
          final saltStr = _box?.get(EncryptionService.saltStorageKey);
          if (saltStr == null) return null;
          return Uint8List.fromList(base64Decode(saltStr));
        },
        onSaltCreated: (salt) {
          _box?.put(EncryptionService.saltStorageKey, base64Encode(salt));
        },
      ).timeout(
        const Duration(seconds: 8),
        onTimeout: () {
          debugPrint('[OfflineManager] Encryption init timed out — continuing without');
        },
      );
    }

    // ═══ PROPOSAL 2: Migrate old blob drafts to sharded storage ═══
    await _migrateDraftsToSharded();

    // ═══ FIX: Recover stuck items from previous crashes ═══
    await _recoverStuckSyncingItems();

    _initialized = true;
    if (kDebugMode)
      debugPrint(
        '[OfflineManager] Initialized. Pending items: ${_getQueue().length}',
      );
  }

  // ═══ FIX: Serialize write operations to prevent race conditions ═══
  final _lockQueue = <Completer<void>>[];

  Future<T> _withWriteLock<T>(Future<T> Function() action) async {
    final prevLock = _lockQueue.isNotEmpty ? _lockQueue.last : null;
    final myLock = Completer<void>();
    _lockQueue.add(myLock);

    if (prevLock != null) {
      await prevLock.future;
    }

    try {
      return await action();
    } finally {
      myLock.complete();
      _lockQueue.remove(myLock);
    }
  }

  // ═══ FIX: Recover items stuck in "syncing" state from previous crashes/restarts ═══
  Future<void> _recoverStuckSyncingItems() async {
    if (_box == null || !_box!.isOpen) return;

    final data = _safeBox?.get(_syncQueueKey);
    if (data == null || data.isEmpty) return;

    try {
      final decoded = jsonDecode(_encryption.decrypt(data));
      final queue = List<Map<String, dynamic>>.from(decoded);

      int recovered = 0;
      for (int i = 0; i < queue.length; i++) {
        final item = queue[i];
        if (item['_syncing'] == true) {
          // Reset stuck items: remove the _syncing flag, reset retry count
          // so they get picked up on next sync attempt
          queue[i] = Map<String, dynamic>.from(item);
          queue[i].remove('_syncing');
          queue[i]['retry_count'] = (item['retry_count'] ?? 0);
          queue[i]['_recovered'] = true;
          recovered++;
        }
      }

      if (recovered > 0) {
        final encrypted = _encryption.encrypt(jsonEncode(queue));
        await _safeBox?.put(_syncQueueKey, encrypted);
        if (kDebugMode)
          debugPrint('[OfflineManager] Recovered $recovered stuck syncing items');
      }
    } catch (e) {
      if (kDebugMode) print('[OfflineManager] Recovery check failed: $e');
    }
  }

  // ===== SUBMISSIONS QUEUE =====

  /// Add a submission to the offline sync queue with a unique idempotency key.
  Future<String> addToSyncQueue(Map<String, dynamic> submission) async {
    return _withWriteLock(() async {
      final offlineId = _uuid.v4();
      submission['offline_id'] = offlineId;
      submission['idempotency_key'] = offlineId;
      submission['created_at'] = DateTime.now().toIso8601String();
      submission['retry_count'] = 0;

      // Validate payload size
      final payloadSize = jsonEncode(submission).length;
      if (payloadSize > _maxPayloadSize) {
        throw ValidationException(
          'Submission payload too large (${payloadSize ~/ 1024}KB, max ${_maxPayloadSize ~/ 1024}KB)',
          fieldErrors: {'size': 'exceeds 1MB limit'},
        );
      }

      final queue = _getQueue();
      queue.add(submission);
      await _saveQueue(queue);
      _invalidatePendingCount();

      return offlineId;
    });
  }

  /// Safe box access — returns null if not initialized (web-safe)
  Box<String>? get _safeBox {
    final b = _box;
    if (b == null || !b.isOpen) return null;
    return b;
  }

  List<Map<String, dynamic>> _getQueue() {
    final data = _safeBox?.get(_syncQueueKey);
    if (data == null || data.isEmpty) return [];
    try {
      // ═══ PERFORMANCE: Decrypt + decode in one step ═══
      final decoded = jsonDecode(_encryption.decrypt(data));
      return List<Map<String, dynamic>>.from(decoded);
    } catch (e) {
      if (kDebugMode) print('[OfflineManager] Queue decrypt error: $e');
      return [];
    }
  }

  Future<void> _saveQueue(List<Map<String, dynamic>> queue) async {
    // ═══ PERFORMANCE: Encode + encrypt in one step ═══
    final encrypted = _encryption.encrypt(jsonEncode(queue));
    await _safeBox?.put(_syncQueueKey, encrypted);
  }

  Future<List<Map<String, dynamic>>> getPendingItems() async {
    return _getQueue();
  }

  Future<void> removeFromQueue(String offlineId) async {
    final queue = _getQueue();
    queue.removeWhere((item) => item['offline_id'] == offlineId);
    await _saveQueue(queue);
    _invalidatePendingCount();
  }

  // ═══ PROPOSAL 3: Batch remove — 1× decrypt + 1× encrypt instead of N× ═══
  /// Remove multiple items from the queue in a single operation.
  /// This is critical for sync: previously, removing 50 synced items
  /// required 50× (decrypt + encrypt) = 100 operations on main thread.
  /// Now: 1× (decrypt + encrypt) regardless of batch size.
  Future<void> removeFromQueueBatch(List<String> offlineIds) async {
    if (offlineIds.isEmpty) return;
    final queue = _getQueue();
    final idSet = offlineIds.toSet();
    queue.removeWhere((item) => idSet.contains(item['offline_id']));
    await _saveQueue(queue);
    _invalidatePendingCount();
  }

  Future<void> clearQueue() async {
    await _safeBox?.delete(_syncQueueKey);
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

  /// Force recalculate count (call after queue changes)
  void _invalidatePendingCount() {
    _cachedPendingCount = -1;
    // ═══ FIX ME4: Emit new count to stream ═══
    if (!_pendingCountController.isClosed) {
      _pendingCountController.add(pendingCount);
    }
  }

  /// Sync all pending items with retry logic and conflict handling.
  /// ═══ FIX: Process in-memory, save ONCE at end — prevents data loss on crash ═══
  Future<List<OfflineSyncResult>> syncPendingItems(
    Future<Map<String, dynamic>> Function(Map<String, dynamic>) submitFn,
  ) async {
    final pending = _getQueue();
    if (pending.isEmpty) return [];

    final results = <OfflineSyncResult>[];
    final remaining = <Map<String, dynamic>>[];
    final successfullySynced = <String>[];

    // ═══ FIX: Mark items as _syncing to prevent duplicate processing ═══
    // If we crash during sync, _recoverStuckSyncingItems will reset them on next init
    for (final item in pending) {
      item['_syncing'] = true;
    }

    for (final item in pending) {
      try {
        // Add sync metadata
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
          successfullySynced.add(item['offline_id']);
          results.add(
            OfflineSyncResult.duplicate(item['offline_id'], response),
          );
        } else if (response['conflict'] == true) {
          await _saveConflict(item, response);
          successfullySynced.add(item['offline_id']);
          results.add(OfflineSyncResult.conflict(item['offline_id'], response));
        } else if (response['success'] == true) {
          successfullySynced.add(item['offline_id']);
          results.add(OfflineSyncResult.success(item['offline_id'], response));
        } else {
          final retryCount = (item['retry_count'] ?? 0) as int;
          if (retryCount < _maxRetries) {
            item['retry_count'] = retryCount + 1;
            item['last_retry_at'] = DateTime.now().toIso8601String();
            item.remove('_syncing');
            remaining.add(item);
            results.add(
              OfflineSyncResult.error(
                item['offline_id'],
                'Unexpected server response',
              ),
            );
          } else {
            item.remove('_syncing');
            remaining.add(item);
            results.add(
              OfflineSyncResult.error(
                item['offline_id'],
                'Unexpected server response',
              ),
            );
          }
        }
      } on ApiException catch (e) {
        final retryCount = (item['retry_count'] ?? 0) as int;
        if (_isRetryableError(e) && retryCount < _maxRetries) {
          item['retry_count'] = retryCount + 1;
          item['last_retry_at'] = DateTime.now().toIso8601String();
          item.remove('_syncing');
          remaining.add(item);
          results.add(
            OfflineSyncResult.error(
              item['offline_id'],
              'RETRY_${retryCount + 1}/$_maxRetries: ${e.message}',
            ),
          );
        } else {
          await _logSyncError(item, e);
          item.remove('_syncing');
          remaining.add(item); // Keep for manual review
          results.add(OfflineSyncResult.error(item['offline_id'], e.message));
        }
      } catch (e) {
        await _logSyncError(item, e);
        item.remove('_syncing');
        remaining.add(item);
        results.add(OfflineSyncResult.error(item['offline_id'], e.toString()));
      }
    }

    // ═══ FIX: Save ONCE — remaining items only. No intermediate writes. ═══
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

  // ===== CONFLICTS =====

  /// Save a conflict between local and server data for manual resolution.
  /// Public method so SyncService can record conflicts during batch sync.
  Future<void> saveConflict(
    Map<String, dynamic> local,
    Map<String, dynamic> server,
  ) async {
    try {
      final conflicts = _getConflicts();
      conflicts[local['offline_id']] = {
        'local': local,
        'server': server,
        'detected_at': DateTime.now().toIso8601String(),
        'resolved': false,
      };
      final encrypted = _encryption.encrypt(jsonEncode(conflicts));
      await _safeBox?.put(_conflictsKey, encrypted);
    } catch (e) {
      if (kDebugMode) print('Failed to save conflict: $e');
    }
  }

  Future<void> _saveConflict(
    Map<String, dynamic> local,
    Map<String, dynamic> server,
  ) async {
    return saveConflict(local, server);
  }

  Map<String, dynamic> _getConflicts() {
    final data = _safeBox?.get(_conflictsKey);
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

  Future<void> resolveConflict(
    String offlineId, {
    bool useLocal = false,
  }) async {
    final conflicts = _getConflicts();
    if (conflicts.containsKey(offlineId)) {
      conflicts[offlineId]['resolved'] = true;
      conflicts[offlineId]['resolution'] =
          useLocal ? 'local_wins' : 'server_wins';
      conflicts[offlineId]['resolved_at'] = DateTime.now().toIso8601String();
      final encrypted = _encryption.encrypt(jsonEncode(conflicts));
      await _safeBox?.put(_conflictsKey, encrypted);
    }
  }

  Future<void> _logSyncError(Map<String, dynamic> item, dynamic error) async {
    if (kDebugMode) print('Sync error for ${item['offline_id']}: $error');
  }

  void _logSyncSummary(List<OfflineSyncResult> results) {
    if (kDebugMode && results.isNotEmpty) {
      final success = results.where((r) => r.isSuccess).length;
      final duplicates = results.where((r) => r.isDuplicate).length;
      final conflicts = results.where((r) => r.isConflict).length;
      final errors = results.where((r) => r.isError).length;
      debugPrint(
        'Sync summary: $success ok, $duplicates dup, $conflicts conflict, $errors error',
      );
    }
  }

  // ===== DRAFTS (SHARDED STORAGE — Proposal 2) =====
  // Each draft is stored in its own Hive key: drafts/$draftId
  // An unencrypted index (drafts_index) stores the list of draft IDs.
  // This means: saveDraft = encrypt 1 item (not all),
  //             removeDraft = delete 1 key (not decrypt+encrypt all),
  //             getDraftFormIds = read index (no decrypt at all!)

  static const String _draftsIndexKey = 'drafts_index';

  /// Migrate old blob-format drafts to sharded storage (called once on init)
  Future<void> _migrateDraftsToSharded() async {
    final oldBlob = _box?.get(_draftsKey);
    if (oldBlob == null || oldBlob.isEmpty) return; // No old data

    // Check if already migrated
    final index = _box?.get(_draftsIndexKey);
    if (index != null) return; // Already migrated

    try {
      if (kDebugMode) debugPrint('[OfflineManager] Migrating drafts to sharded storage...');
      final drafts = Map<String, dynamic>.from(jsonDecode(_encryption.decrypt(oldBlob)));
      final draftIds = <String>[];

      for (final entry in drafts.entries) {
        final draftId = entry.key;
        final value = entry.value as Map<String, dynamic>;
        // Store each draft in its own key
        await _box?.put('drafts/$draftId', _encryption.encrypt(jsonEncode(value)));
        draftIds.add(draftId);
      }

      // Store the index (unencrypted — just a list of IDs)
      await _box?.put(_draftsIndexKey, jsonEncode(draftIds));

      // Delete old blob
      await _box?.delete(_draftsKey);

      if (kDebugMode) debugPrint('[OfflineManager] Migrated ${draftIds.length} drafts to sharded storage');
    } catch (e) {
      if (kDebugMode) debugPrint('[OfflineManager] Draft migration failed: $e');
    }
  }

  /// Save a draft — encrypts ONLY this draft (not all drafts)
  Future<void> saveDraft(
      String draftId, String formId, Map<String, dynamic> data) async {
    return _withWriteLock(() async {
      final draftData = {
        'form_id': formId,
        'data': data,
        'saved_at': DateTime.now().toIso8601String(),
      };

      // ═══ PERFORMANCE: For large data (>50KB), use Isolate for JSON encoding ═══
      // Small data: encode on UI thread (fast enough)
      // Large data (with photos): encode in background isolate
      final jsonString = jsonEncode(draftData);
      String encrypted;

      if (jsonString.length > 50 * 1024) {
        // Large payload — encrypt in background isolate
        try {
          encrypted = await compute(_encryptInIsolate, _EncryptParams(
            jsonString,
            _encryption,
          )).timeout(
            const Duration(seconds: 5),
            onTimeout: () => _encryption.encrypt(jsonString),
          );
        } catch (e) {
          // Fallback to main thread
          encrypted = _encryption.encrypt(jsonString);
        }
      } else {
        // Small payload — encrypt on UI thread (<1ms)
        encrypted = _encryption.encrypt(jsonString);
      }

      await _box?.put('drafts/$draftId', encrypted);

      // Update index (unencrypted — just IDs, no decrypt needed)
      final indexStr = _box?.get(_draftsIndexKey) ?? '[]';
      final index = List<String>.from(jsonDecode(indexStr));
      if (!index.contains(draftId)) {
        index.add(draftId);
        await _box?.put(_draftsIndexKey, jsonEncode(index));
      }
    });
  }

  /// Get a single draft — decrypts ONLY this draft (not all)
  Map<String, dynamic>? getDraft(String draftId) {
    final data = _box?.get('drafts/$draftId');
    if (data == null || data.isEmpty) return null;
    try {
      return Map<String, dynamic>.from(jsonDecode(_encryption.decrypt(data)));
    } catch (e) {
      if (kDebugMode) print('[OfflineManager] Draft decrypt error: $e');
      return null;
    }
  }

  /// Get all drafts — decrypts each individually (not one giant blob)
  List<Map<String, dynamic>> getAllDrafts() {
    final indexStr = _box?.get(_draftsIndexKey) ?? '[]';
    final index = List<String>.from(jsonDecode(indexStr));
    final result = <Map<String, dynamic>>[];

    for (final draftId in index) {
      final data = _box?.get('drafts/$draftId');
      if (data == null || data.isEmpty) continue;
      try {
        final v = Map<String, dynamic>.from(jsonDecode(_encryption.decrypt(data)));
        result.add({
          'draft_id': draftId,
          'form_id': v['form_id'] ?? draftId,
          'data': v['data'],
          'saved_at': v['saved_at'],
        });
      } catch (e) {
        debugPrint('[OfflineManager] ⚠️ Draft $draftId failed to decrypt: $e');
      }
    }
    return result;
  }

  /// Get draft form IDs — reads index ONLY (NO decryption!)
  /// This was the #5 performance killer: previously decrypted ALL drafts
  /// just to count the keys. Now: reads a plain JSON list = <1ms.
  Set<String> getDraftFormIds() {
    final indexStr = _box?.get(_draftsIndexKey);
    if (indexStr == null || indexStr.isEmpty) return {};
    try {
      return (jsonDecode(indexStr) as List).cast<String>().toSet();
    } catch (_) {
      return {};
    }
  }

  /// Remove a draft — deletes ONLY this key (no decrypt + encrypt of all!)
  Future<void> removeDraft(String draftId) async {
    return _withWriteLock(() async {
      await _box?.delete('drafts/$draftId');

      // Update index
      final indexStr = _box?.get(_draftsIndexKey) ?? '[]';
      final index = List<String>.from(jsonDecode(indexStr));
      index.remove(draftId);
      await _box?.put(_draftsIndexKey, jsonEncode(index));
    });
  }

  // ===== CACHE =====

  /// ═══ PERFORMANCE: In-memory cache to avoid decrypting entire blob on every read ═══
  /// Previously: every getCachedData() call → decrypt entire blob (hundreds of KB) → 10-50ms
  /// Now: decrypt once, cache in memory, only re-decrypt when data changes
  Map<String, dynamic>? _cacheMemory;
  String? _cacheRawSignature;
  static const int _maxCacheMemoryEntries = 50; // LRU limit

  // ═══ No cache size limit — let Hive handle storage ═══

  Future<void> cacheData(String key, Map<String, dynamic> data) async {
    return _withWriteLock(() async {
      final cache = _getCache();

      // LRU eviction: remove oldest if over limit
      if (cache.length >= _maxCacheMemoryEntries && !cache.containsKey(key)) {
        String? oldestKey;
        DateTime? oldestTime;
        for (final e in cache.entries) {
          final t = DateTime.tryParse(e.value['cached_at'] ?? '');
          if (t != null && (oldestTime == null || t.isBefore(oldestTime))) {
            oldestTime = t;
            oldestKey = e.key;
          }
        }
        if (oldestKey != null) cache.remove(oldestKey);
      }

      cache[key] = {
        'data': data,
        'cached_at': DateTime.now().toIso8601String(),
      };

      final encrypted = _encryption.encrypt(jsonEncode(cache));
      await _safeBox?.put(_cacheKey, encrypted);
      _cacheMemory = cache;
      _cacheRawSignature = null;
    });
  }

  Map<String, dynamic> _getCache() {
    // ═══ PERFORMANCE: Return memory cache if available ═══
    if (_cacheMemory != null) return _cacheMemory!;

    final data = _safeBox?.get(_cacheKey);
    if (data == null || data.isEmpty) return {};

    // 1. Try decrypting with current key
    try {
      final decrypted = _encryption.decrypt(data);
      final cache = Map<String, dynamic>.from(jsonDecode(decrypted));
      _cacheMemory = cache; // Cache in memory
      return cache;
    } catch (decryptError) {
      // 2. Decryption failed — try reading as plain JSON
      //    (handles migration from unencrypted versions)
      try {
        final cache = Map<String, dynamic>.from(jsonDecode(data));
        _cacheMemory = cache;
        return cache;
      } catch (_) {
        // 3. Both failed — data is corrupted, key changed, OR old encryption format
        if (kDebugMode) {
          debugPrint(
            '[OfflineManager] ⚠️ Cache corrupted or old format — clearing',
          );
        }
        _safeBox?.delete(_cacheKey);
        _cacheMemory = null;
        return {};
      }
    }
  }

  /// Invalidate memory cache — call when Hive data changes externally
  void _invalidateCacheMemory() {
    _cacheMemory = null;
  }

  /// Get cached data by key.
  ///
  /// Always returns data if it exists and is within maxOfflineRetention (30 days).
  /// The freshness/staleness decision is made by the CALLER (OfflineDataCache),
  /// NOT here — so this layer never silently drops data.
  ///
  /// [offlineOverride] — kept for API compatibility, no longer changes behavior.
  Map<String, dynamic>? getCachedData(
    String key, {
    bool offlineOverride = false,
  }) {
    final cache = _getCache();
    final entry = cache[key];
    if (entry == null) return null;

    final cachedAt = DateTime.tryParse(entry['cached_at'] ?? '');
    if (cachedAt != null) {
      final age = DateTime.now().difference(cachedAt);
      // Only discard data older than the hard retention limit (30 days)
      if (age > AppConfig.maxOfflineRetention) {
        if (kDebugMode) {
          debugPrint(
            '[OfflineManager] Cache expired (>${AppConfig.maxOfflineRetention.inDays}d) for $key — discarded',
          );
        }
        return null;
      }
    }

    return entry['data'];
  }

  Future<void> clearCache() async {
    await _safeBox?.delete(_cacheKey);
    _invalidateCacheMemory();
  }

  /// Remove a specific key from the persistent cache.
  /// Used for force-refresh on pull-to-refresh.
  Future<void> removeCacheKey(String key) async {
    return _withWriteLock(() async {
      final cache = _getCache();
      cache.remove(key);
      final encrypted = _encryption.encrypt(jsonEncode(cache));
      await _safeBox?.put(_cacheKey, encrypted);
      // Update memory cache
      _cacheMemory = cache;
    });
  }

  /// Get all keys currently in the persistent cache.
  /// Used by OfflineDataCache.invalidateByPrefix() for prefix-based invalidation.
  List<String> getCacheKeys() {
    final cache = _getCache();
    return cache.keys.toList();
  }

  void dispose() {
    _connectivityController.close();
    _pendingCountController.close();
  }
}

// ═══ PERFORMANCE: Isolate helpers for background encryption ═══
// These must be top-level functions for compute() to work

class _EncryptParams {
  final String jsonString;
  final EncryptionService encryption;
  const _EncryptParams(this.jsonString, this.encryption);
}

/// Top-level function for compute() — encrypts JSON string in background isolate
String _encryptInIsolate(_EncryptParams params) {
  return params.encryption.encrypt(params.jsonString);
}
