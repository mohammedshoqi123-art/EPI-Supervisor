import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
// ═══ PERFORMANCE: Use compute() for background JSON encoding ═══
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';
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
  static const String _failedSubmissionsKey = 'failed_submissions';  // ═══ FIX 2.1: Store failed sync items ═══

  static const int _maxRetries = 3;
  // ═══ FIX O3: Reduced from 5MB to 2MB — 5MB caused OOM on weak devices ═══
  // A single compressed photo (quality 60%, maxWidth 1024) is ~200-500KB base64.
  // Two photos + form data fits in 2MB comfortably.
  // On devices with 1-2GB RAM, 5MB + encryption = 10MB+ temp → OOM crash.
  static const int _maxPayloadSize = 2 * 1024 * 1024; // 2MB

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
          const Duration(seconds: 3), // ═══ FIX: 3s (was 5s) — faster startup ═══
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
          // ═══ FIX: Use path_provider instead of _box?.path (which is null when open fails) ═══
          try {
            final appDir = await getApplicationDocumentsDirectory().timeout(
              const Duration(seconds: 3),
              onTimeout: () => throw TimeoutException('path_provider timeout'),
            );
            // Hive stores boxes as .hive files in the app documents directory
            final boxPath = '${appDir.path}/$_boxName.hive';
            final boxFile = File(boxPath);
            if (await boxFile.exists()) {
              final backupPath = '$boxPath.corrupted.${DateTime.now().millisecondsSinceEpoch}';
              await boxFile.copy(backupPath);
              if (kDebugMode) {
                debugPrint('[OfflineManager] Corrupted box backed up to: $backupPath');
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

    // ═══ FIX R-C1: Store encryption key for old format migration ═══
    _encryptionKeyForMigration = const String.fromEnvironment('ENCRYPTION_KEY', defaultValue: '');
    if (_encryptionKeyForMigration.isEmpty) {
      try {
        _encryptionKeyForMigration = await EncryptionService.getOrCreateSecureKey();
      } catch (e) {
        if (kDebugMode) debugPrint('[OfflineManager] Could not get key for migration: $e');
      }
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

    // ═══ FIX: Cleanup old data to prevent storage bloat ═══
    await _cleanupOldData();

    _initialized = true;
    if (kDebugMode)
      debugPrint(
        '[OfflineManager] Initialized. Pending items: ${_getQueue().length}',
      );
  }

  // ═══ FIX: Serialize write operations to prevent race conditions ═══
  // WARNING: This lock is NOT reentrant. Do NOT call removeFromQueue()
  // or addToSyncQueue() from within a function that already holds the lock.
  // syncPendingItems() uses _saveQueue() directly (not removeFromQueue) to avoid deadlock.
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
  // ═══ FIX O(n): Sharded storage — each item in its own Hive key ═══
  // Previously: entire queue = single encrypted blob → O(n) decrypt+encrypt per operation
  // Now: each item = `sync_queue/$offlineId` (encrypted individually)
  //       index = `sync_queue_index` (plain JSON list of IDs)
  // addToSyncQueue = O(1): encrypt 1 item + append to index
  // removeFromQueue = O(1): delete 1 key + remove from index
  // _getQueue = O(n): read index + decrypt each item (only when needed)
  static const String _syncQueueIndexKey = 'sync_queue_index';

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

      // ═══ O(1): Encrypt single item + append to index ═══
      final encrypted = _encryption.encrypt(jsonEncode(submission));
      await _safeBox?.put('sync_queue/$offlineId', encrypted);

      // Update index
      final index = _getQueueIndex();
      index.add(offlineId);
      await _safeBox?.put(_syncQueueIndexKey, jsonEncode(index));
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

  /// Get the queue index (list of offline IDs)
  List<String> _getQueueIndex() {
    final data = _safeBox?.get(_syncQueueIndexKey);
    if (data == null || data.isEmpty) return [];
    try {
      return List<String>.from(jsonDecode(data));
    } catch (_) {
      return [];
    }
  }

  /// Read all queue items — decrypts each individually
  List<Map<String, dynamic>> _getQueue() {
    // ═══ FIX: Try sharded format first, fall back to legacy blob ═══
    final index = _getQueueIndex();
    if (index.isNotEmpty) {
      final items = <Map<String, dynamic>>[];
      for (final id in index) {
        final data = _safeBox?.get('sync_queue/$id');
        if (data == null || data.isEmpty) continue;
        try {
          final decrypted = _encryption.decrypt(data);
          items.add(Map<String, dynamic>.from(jsonDecode(decrypted)));
        } catch (e) {
          if (kDebugMode) print('[OfflineManager] Queue item decrypt error ($id): $e');
        }
      }
      return items;
    }

    // Legacy fallback: single blob format
    final data = _safeBox?.get(_syncQueueKey);
    if (data == null || data.isEmpty) return [];
    try {
      final decoded = jsonDecode(_encryption.decrypt(data));
      final items = List<Map<String, dynamic>>.from(decoded);
      // Migrate to sharded format
      _migrateQueueToSharded(items);
      return items;
    } catch (e) {
      if (kDebugMode) print('[OfflineManager] Queue decrypt error: $e');
      return [];
    }
  }

  /// Migrate legacy blob queue to sharded format
  Future<void> _migrateQueueToSharded(List<Map<String, dynamic>> items) async {
    try {
      if (kDebugMode) debugPrint('[OfflineManager] Migrating ${items.length} queue items to sharded format');
      final index = <String>[];
      for (final item in items) {
        final id = item['offline_id'] as String? ?? _uuid.v4();
        item['offline_id'] = id;
        final encrypted = _encryption.encrypt(jsonEncode(item));
        await _safeBox?.put('sync_queue/$id', encrypted);
        index.add(id);
      }
      await _safeBox?.put(_syncQueueIndexKey, jsonEncode(index));
      await _safeBox?.delete(_syncQueueKey); // Delete old blob
      if (kDebugMode) debugPrint('[OfflineManager] ✅ Queue migration complete');
    } catch (e) {
      if (kDebugMode) debugPrint('[OfflineManager] Queue migration failed: $e');
    }
  }

  Future<void> _saveQueue(List<Map<String, dynamic>> queue) async {
    // ═══ FIX: Rebuild sharded storage from scratch ═══
    // Delete old keys, write new ones
    final oldIndex = _getQueueIndex();
    final newIndex = <String>[];

    for (final item in queue) {
      final id = item['offline_id'] as String? ?? _uuid.v4();
      item['offline_id'] = id;
      final encrypted = _encryption.encrypt(jsonEncode(item));
      await _safeBox?.put('sync_queue/$id', encrypted);
      newIndex.add(id);
    }

    // Delete keys that are no longer in the queue
    final newSet = newIndex.toSet();
    for (final oldId in oldIndex) {
      if (!newSet.contains(oldId)) {
        await _safeBox?.delete('sync_queue/$oldId');
      }
    }

    await _safeBox?.put(_syncQueueIndexKey, jsonEncode(newIndex));
    // Delete legacy blob if it still exists
    await _safeBox?.delete(_syncQueueKey);
  }

  Future<List<Map<String, dynamic>>> getPendingItems() async {
    return _getQueue();
  }

  /// ═══ FIX: removeFromQueue with write lock to prevent race conditions ═══
  /// Previously: no lock → race condition with addToSyncQueue
  ///   Thread A reads queue (5 items), Thread B adds item (6),
  ///   Thread A saves (4 items) → new item lost!
  /// Now: protected by same mutex as addToSyncQueue/syncPendingItems
  Future<void> removeFromQueue(String offlineId) async {
    return _withWriteLock(() async {
      final queue = _getQueue();
      queue.removeWhere((item) => item['offline_id'] == offlineId);
      await _saveQueue(queue);
      _invalidatePendingCount();
    });
  }

  // ═══ PROPOSAL 3: Batch remove — 1× decrypt + 1× encrypt instead of N× ═══
  /// Remove multiple items from the queue in a single operation.
  /// This is critical for sync: previously, removing 50 synced items
  /// required 50× (decrypt + encrypt) = 100 operations on main thread.
  /// Now: 1× (decrypt + encrypt) regardless of batch size.
  Future<void> removeFromQueueBatch(List<String> offlineIds) async {
    if (offlineIds.isEmpty) return;
    return _withWriteLock(() async {
      final queue = _getQueue();
      final idSet = offlineIds.toSet();
      queue.removeWhere((item) => idSet.contains(item['offline_id']));
      await _saveQueue(queue);
      _invalidatePendingCount();
    });
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
    // ═══ FIX: Wrap with _withWriteLock to prevent race condition ═══
    // Previously: _getQueue() + _saveQueue() without lock
    // Now: protected by same mutex as addToSyncQueue/removeFromQueue
    return _withWriteLock(() async {
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
    }); // Close _withWriteLock
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

  // ═══════════════════════════════════════════════════════════════════════
  // FAILED SUBMISSIONS — FIX 2.1: Store failed sync items for recovery
  // ═══════════════════════════════════════════════════════════════════════
  // Instead of permanently deleting items after max retries,
  // move them to a separate storage so users can retry later.

  /// Save a failed submission (moved from sync queue after max retries)
  Future<void> saveFailedSubmission(Map<String, dynamic> item, String error) async {
    return _withWriteLock(() async {
      try {
        final failed = _getFailedSubmissions();
        final offlineId = item['offline_id'] as String? ?? 'unknown';
        failed[offlineId] = {
          'data': item,
          'error': error,
          'failed_at': DateTime.now().toIso8601String(),
          'retry_count': item['retry_count'] ?? 0,
        };
        final encrypted = _encryption.encrypt(jsonEncode(failed));
        await _safeBox?.put(_failedSubmissionsKey, encrypted);
        if (kDebugMode) debugPrint('[OfflineManager] Saved failed submission: $offlineId');
      } catch (e) {
        if (kDebugMode) debugPrint('[OfflineManager] Failed to save failed submission: $e');
      }
    });
  }

  /// Get all failed submissions
  List<Map<String, dynamic>> getFailedSubmissions() {
    final failed = _getFailedSubmissions();
    return failed.entries.map((e) {
      final data = Map<String, dynamic>.from(e.value['data'] ?? {});
      data['_failed_at'] = e.value['failed_at'];
      data['_error'] = e.value['error'];
      data['_retry_count'] = e.value['retry_count'];
      return data;
    }).toList();
  }

  /// Get count of failed submissions
  int get failedSubmissionCount => _getFailedSubmissions().length;

  /// Retry a failed submission — moves it back to sync queue
  Future<void> retryFailedSubmission(String offlineId) async {
    return _withWriteLock(() async {
      try {
        final failed = _getFailedSubmissions();
        if (!failed.containsKey(offlineId)) return;

        final item = failed[offlineId]['data'] as Map<String, dynamic>;
        item['retry_count'] = 0;  // Reset retry count
        item.remove('_failed_at');
        item.remove('_error');

        // Add back to sync queue
        final queue = _getQueue();
        queue.add(item);
        await _saveQueue(queue);

        // Remove from failed
        failed.remove(offlineId);
        final encrypted = _encryption.encrypt(jsonEncode(failed));
        await _safeBox?.put(_failedSubmissionsKey, encrypted);

        _invalidatePendingCount();
        if (kDebugMode) debugPrint('[OfflineManager] Retried failed submission: $offlineId');
      } catch (e) {
        if (kDebugMode) debugPrint('[OfflineManager] Failed to retry submission: $e');
      }
    });
  }

  /// Retry ALL failed submissions
  Future<int> retryAllFailedSubmissions() async {
    return _withWriteLock(() async {
      try {
        final failed = _getFailedSubmissions();
        if (failed.isEmpty) return 0;

        final queue = _getQueue();
        int count = 0;
        for (final entry in failed.entries) {
          final item = Map<String, dynamic>.from(entry.value['data'] ?? {});
          item['retry_count'] = 0;
          item.remove('_failed_at');
          item.remove('_error');
          queue.add(item);
          count++;
        }
        await _saveQueue(queue);

        // Clear all failed
        await _safeBox?.delete(_failedSubmissionsKey);
        _invalidatePendingCount();
        if (kDebugMode) debugPrint('[OfflineManager] Retried $count failed submissions');
        return count;
      } catch (e) {
        if (kDebugMode) debugPrint('[OfflineManager] Failed to retry all: $e');
        return 0;
      }
    });
  }

  /// Delete a specific failed submission (user chose to discard)
  Future<void> deleteFailedSubmission(String offlineId) async {
    return _withWriteLock(() async {
      try {
        final failed = _getFailedSubmissions();
        failed.remove(offlineId);
        final encrypted = _encryption.encrypt(jsonEncode(failed));
        await _safeBox?.put(_failedSubmissionsKey, encrypted);
      } catch (e) {
        if (kDebugMode) debugPrint('[OfflineManager] Failed to delete failed submission: $e');
      }
    });
  }

  Map<String, dynamic> _getFailedSubmissions() {
    final data = _safeBox?.get(_failedSubmissionsKey);
    if (data == null || data.isEmpty) return {};
    try {
      return Map<String, dynamic>.from(jsonDecode(_encryption.decrypt(data)));
    } catch (_) {
      return {};
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
  // ═══ FIX R-C1: Key source for old format migration ═══
  // The encryption key is needed for PBKDF2 re-derivation of old format data.
  // This is set during init() and used by _migrateDraftsToSharded().
  String _encryptionKeyForMigration = '';

  Future<void> _migrateDraftsToSharded() async {
    final oldBlob = _box?.get(_draftsKey);
    if (oldBlob == null || oldBlob.isEmpty) return; // No old data

    // Check if already migrated
    final index = _box?.get(_draftsIndexKey);
    if (index != null) return; // Already migrated

    try {
      if (kDebugMode) debugPrint('[OfflineManager] Migrating drafts to sharded storage...');

      // ═══ FIX R-C1: Try normal decrypt first, then old format migration ═══
      // Previously: _encryption.decrypt(oldBlob) threw FormatException for old format
      //   → catch block swallowed error → migration silently failed → drafts lost
      // Now: attempt PBKDF2 re-derivation for old format data in background Isolate
      String decryptedBlob;
      try {
        decryptedBlob = _encryption.decrypt(oldBlob);
      } catch (e) {
        // ═══ Old format detected — try PBKDF2 re-derivation ═══
        if (kDebugMode) debugPrint('[OfflineManager] Old format blob — attempting PBKDF2 migration...');
        final migrated = await EncryptionService.migrateOldFormatToNew(
          oldBlob,
          _encryptionKeyForMigration,
          _encryption,
        );
        if (migrated != null) {
          // Successfully migrated — decrypt with new format
          decryptedBlob = _encryption.decrypt(migrated);
          if (kDebugMode) debugPrint('[OfflineManager] ✅ Old format blob migrated via PBKDF2');
        } else {
          // ═══ FIX R-C1: Don't delete — preserve for manual recovery ═══
          // Previously: silently failed → old blob deleted → data lost forever
          // Now: keep old blob in separate key for recovery
          if (kDebugMode) debugPrint('[OfflineManager] ⚠️ Could not migrate old blob — preserving for recovery');
          await _box?.put('_unmigrated_drafts_blob', oldBlob);
          await _box?.delete(_draftsKey);
          return;
        }
      }

      final drafts = Map<String, dynamic>.from(jsonDecode(decryptedBlob));
      final draftIds = <String>[];

      for (final entry in drafts.entries) {
        final draftId = entry.key;
        final value = entry.value as Map<String, dynamic>;
        // Store each draft in its own key
        await _box?.put('drafts/$draftId', _encryption.encrypt(jsonEncode(value)));
        draftIds.add(draftId);
      }

      // Store the index (unencrypted — just a list of IDs)
      await _box?.put(_draftsIndexKey, _encryption.encrypt(jsonEncode(draftIds)));

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

      // ═══ FIX N-C1: شفّر على main isolate مباشرة ═══
      // Previously: compute() يُنشئ Isolate جديد → _pinnedKey = null → مفتاح عشوائي
      //   → المسودة تُشفّر بمفتاح مختلف → لا يمكن فكها → ضياع دائم!
      // Now: شفّر على main isolate حيث _pinnedKey مضبوط → <1ms (migrated key)
      String encrypted;
      try {
        final json = jsonEncode(draftData);
        encrypted = _encryption.encrypt(json);
      } catch (e) {
        // ═══ FIX: لا نرمي الخطأ — نحفظ كـ plain JSON ═══
        debugPrint('[OfflineManager] Encrypt failed — saving draft as plain JSON: $e');
        encrypted = jsonEncode(draftData); // Plain JSON fallback
      }

      await _box?.put('drafts/$draftId', encrypted);

      // Update index
      final indexStr = _box?.get(_draftsIndexKey) ?? '[]';
      List<String> index;
      try {
        // Try encrypted first, then plain JSON
        try {
          index = List<String>.from(jsonDecode(_encryption.decrypt(indexStr)));
        } catch (_) {
          index = List<String>.from(jsonDecode(indexStr));
        }
      } catch (_) {
        index = [];
      }
      if (!index.contains(draftId)) {
        index.add(draftId);
        // ═══ FIX: حفظ الـ index مع fallback ═══
        try {
          await _box?.put(_draftsIndexKey, _encryption.encrypt(jsonEncode(index)));
        } catch (e) {
          // Fallback: plain JSON index
          debugPrint('[OfflineManager] Index encrypt failed — saving as plain JSON: $e');
          await _box?.put(_draftsIndexKey, jsonEncode(index));
        }
      }
    });
  }

  /// Get a single draft — decrypts ONLY this draft (not all)
  /// ═══ FIX R-C1: Attempts old format migration if decrypt fails ═══
  Map<String, dynamic>? getDraft(String draftId) {
    final data = _box?.get('drafts/$draftId');
    if (data == null || data.isEmpty) return null;
    try {
      return Map<String, dynamic>.from(jsonDecode(_encryption.decrypt(data)));
    } catch (e) {
      // ═══ FIX R-C1: Try plain JSON first ═══
      try {
        return Map<String, dynamic>.from(jsonDecode(data));
      } catch (_) {
        // ═══ FIX R-C1: Try old format migration (sync attempt) ═══
        // If it's old format, we can't do PBKDF2 here (would block UI).
        // But we can check if it's old format and log it.
        if (EncryptionService.isOldFormat(data)) {
          debugPrint('[OfflineManager] Draft $draftId is old format — needs background migration');
          // Return a placeholder that indicates migration is needed
          // The UI should show this as "migrating..." and call migrateDraft() async
          return {
            '_needs_migration': true,
            'form_id': draftId,
            'data': <String, dynamic>{},
            'saved_at': null,
          };
        }
        debugPrint('[OfflineManager] Draft $draftId decrypt error: $e');
        return null;
      }
    }
  }

  /// ═══ FIX R-C1: Migrate a single old-format draft in background Isolate ═══
  /// Call this when getDraft() returns {_needs_migration: true}.
  /// Returns the migrated draft data, or null if migration fails.
  Future<Map<String, dynamic>?> migrateDraft(String draftId) async {
    final data = _box?.get('drafts/$draftId');
    if (data == null || data.isEmpty) return null;
    if (_encryptionKeyForMigration.isEmpty) return null;

    try {
      final plaintext = await EncryptionService.decryptOldFormat(data, _encryptionKeyForMigration);
      if (plaintext == null) return null;

      // Re-encrypt with new format
      final reEncrypted = _encryption.encrypt(plaintext);
      await _box?.put('drafts/$draftId', reEncrypted);

      if (kDebugMode) debugPrint('[OfflineManager] ✅ Draft $draftId migrated to new format');
      return Map<String, dynamic>.from(jsonDecode(plaintext));
    } catch (e) {
      if (kDebugMode) debugPrint('[OfflineManager] Draft $draftId migration failed: $e');
      return null;
    }
  }

  /// ═══ FIX R-C1: Get count of drafts that need migration ═══
  int getDraftsNeedingMigrationCount() {
    final indexStr = _box?.get(_draftsIndexKey) ?? '[]';
    List<String> index;
    try {
      try {
        index = List<String>.from(jsonDecode(_encryption.decrypt(indexStr)));
      } catch (_) {
        index = List<String>.from(jsonDecode(indexStr));
      }
    } catch (_) {
      return 0;
    }

    int count = 0;
    for (final draftId in index) {
      final data = _box?.get('drafts/$draftId');
      if (data != null && EncryptionService.isOldFormat(data)) {
        count++;
      }
    }
    return count;
  }

  /// ═══ FIX R-C1: Get recovered (unmigrated) drafts ═══
  Map<String, dynamic> getRecoveredDrafts() {
    final data = _box?.get('_recovered_drafts');
    if (data == null) return {};
    try {
      return Map<String, dynamic>.from(jsonDecode(data));
    } catch (_) {
      return {};
    }
  }

  /// Get all drafts — decrypts each individually (not one giant blob)
  List<Map<String, dynamic>> getAllDrafts() {
    final indexStr = _box?.get(_draftsIndexKey) ?? '[]';
    List<String> index;
    try {
      // ═══ FIX: Try encrypted first, then plain JSON ═══
      // Previously: only tried jsonDecode → failed on encrypted index → no drafts shown
      try {
        final decrypted = _encryption.decrypt(indexStr);
        index = List<String>.from(jsonDecode(decrypted));
      } catch (_) {
        index = List<String>.from(jsonDecode(indexStr));
      }
    } catch (_) {
      index = [];
    }

    // ═══ FIX: If index is empty, scan Hive keys as fallback ═══
    // This handles corrupted or missing index after migration
    if (index.isEmpty && _box != null && _box!.isOpen) {
      final draftKeys = _box!.keys
          .where((k) => k.toString().startsWith('drafts/'))
          .map((k) => k.toString().replaceFirst('drafts/', ''))
          .toList();
      if (draftKeys.isNotEmpty) {
        debugPrint('[OfflineManager] ⚠️ Index empty but found ${draftKeys.length} draft keys — rebuilding index');
        index = draftKeys;
        // Rebuild index for future fast reads
        _box!.put(_draftsIndexKey, _encryption.encrypt(jsonEncode(draftKeys)));
      }
    }

    final result = <Map<String, dynamic>>[];
    for (final draftId in index) {
      final data = _box?.get('drafts/$draftId');
      if (data == null || data.isEmpty) continue;
      try {
        // Try encrypted first
        final decrypted = _encryption.decrypt(data);
        final v = Map<String, dynamic>.from(jsonDecode(decrypted));
        result.add({
          'draft_id': draftId,
          'form_id': v['form_id'] ?? draftId,
          'data': v['data'],
          'saved_at': v['saved_at'],
        });
      } catch (decryptError) {
        // Fallback: try reading as plain JSON (may not be encrypted)
        try {
          final v = Map<String, dynamic>.from(jsonDecode(data));
          result.add({
            'draft_id': draftId,
            'form_id': v['form_id'] ?? draftId,
            'data': v['data'],
            'saved_at': v['saved_at'],
          });
          debugPrint('[OfflineManager] Draft $draftId read as plain JSON (not encrypted)');
        } catch (_) {
          // ═══ FIX: لا نتخطى المسودة — نُضيفها مع بيانات محدودة ═══
          // Previously: skipped silently → user sees empty list
          // Now: add with limited info so user can see the draft exists
          debugPrint('[OfflineManager] ⚠️ Draft $draftId failed to decrypt — showing limited info');
          result.add({
            'draft_id': draftId,
            'form_id': draftId,
            'data': <String, dynamic>{},
            'saved_at': null,
          });
        }
      }
    }

    // ═══ FALLBACK: افحص _recovered_drafts إذا لم نجد شيء ═══
    if (result.isEmpty) {
      final recoveredData = _box?.get('_recovered_drafts');
      if (recoveredData != null) {
        try {
          final recoveredMap = Map<String, dynamic>.from(jsonDecode(recoveredData));
          for (final entry in recoveredMap.entries) {
            result.add({
              'draft_id': entry.key,
              'form_id': entry.key,
              'data': <String, dynamic>{},
              'saved_at': null,
              '_recovered': true,
            });
          }
          if (kDebugMode && result.isNotEmpty) {
            debugPrint('[OfflineManager] Found ${result.length} recovered drafts');
          }
        } catch (_) {}
      }
    }

    return result;
  }

  /// Get draft form IDs — reads index
  /// ═══ FIX: Try both encrypted and plain JSON format + Hive key scan fallback ═══
  Set<String> getDraftFormIds() {
    // ═══ FIX #29: فحص أن Hive box مفتوح أولاً ═══
    if (_box == null || !_box!.isOpen) {
      debugPrint('[OfflineManager] getDraftFormIds: box not open — returning empty');
      return {};
    }

    final indexStr = _box?.get(_draftsIndexKey);
    if (indexStr == null || indexStr.isEmpty) {
      // ═══ FIX #29: Index فارغ — محاولة إعادة بناء من Hive keys ═══
      return _rebuildDraftsIndexFromKeys();
    }
    try {
      // Try decrypting first (new encrypted format)
      final decrypted = _encryption.decrypt(indexStr);
      if (decrypted.isNotEmpty) {
        return (jsonDecode(decrypted) as List).cast<String>().toSet();
      }
    } catch (_) {
      // Not encrypted or decryption failed — try plain JSON
    }
    // Fallback: try reading as plain JSON (old format)
    try {
      return (jsonDecode(indexStr) as List).cast<String>().toSet();
    } catch (e) {
      // ═══ FIX #29: كلا التنسيقين فشلا — إعادة بناء من Hive keys ═══
      debugPrint('[OfflineManager] getDraftFormIds: index corrupted ($e) — rebuilding from keys');
      return _rebuildDraftsIndexFromKeys();
    }
  }

  /// ═══ FIX #29: إعادة بناء drafts_index من Hive keys الفعلية ═══
  /// يُستدعى عندما يكون الـ index تالفاً أو فارغاً لكن توجد مسودات فعلية
  Set<String> _rebuildDraftsIndexFromKeys() {
    if (_box == null || !_box!.isOpen) return {};
    final draftKeys = _box!.keys
        .where((k) => k.toString().startsWith('drafts/'))
        .map((k) => k.toString().replaceFirst('drafts/', ''))
        .toList();
    if (draftKeys.isNotEmpty) {
      debugPrint('[OfflineManager] ⚠️ Rebuilt drafts index from ${draftKeys.length} Hive keys');
      // حفظ الـ index المُعاد بناؤه (مشفر)
      try {
        _box!.put(_draftsIndexKey, _encryption.encrypt(jsonEncode(draftKeys)));
      } catch (e) {
        debugPrint('[OfflineManager] Could not save rebuilt index: $e');
      }
    }
    return draftKeys.toSet();
  }

  /// Remove a draft — deletes ONLY this key (no decrypt + encrypt of all!)
  Future<void> removeDraft(String draftId) async {
    return _withWriteLock(() async {
      await _box?.delete('drafts/$draftId');

      // Update index
      final indexStr = _box?.get(_draftsIndexKey) ?? '[]';
      List<String> index;
      try {
        // Try encrypted first, then plain JSON
        try {
          index = List<String>.from(jsonDecode(_encryption.decrypt(indexStr)));
        } catch (_) {
          index = List<String>.from(jsonDecode(indexStr));
        }
      } catch (_) {
        index = [];
      }
      index.remove(draftId);
      await _box?.put(_draftsIndexKey, _encryption.encrypt(jsonEncode(index)));
    });
  }

  // ===== CACHE =====

  /// ═══ PERFORMANCE: In-memory cache to avoid decrypting entire blob on every read ═══
  /// Previously: every getCachedData() call → decrypt entire blob (hundreds of KB) → 10-50ms
  /// Now: decrypt once, cache in memory, only re-decrypt when data changes
  Map<String, dynamic>? _cacheMemory;
  String? _cacheRawSignature;
  // ═══ FIX Storage: تقليل حد الكاش لمنع نمو المساحة ═══
  // Previously: 50 entries × 200KB average = 10MB+ في Hive
  // Now: 20 entries + حد 500KB لكل entry + حد 2MB للكل
  static const int _maxCacheMemoryEntries = 20; // LRU limit
  static const int _maxSingleEntrySize = 500 * 1024; // 500KB per entry
  static const int _maxTotalCacheSize = 2 * 1024 * 1024; // 2MB total

  Future<void> cacheData(String key, Map<String, dynamic> data) async {
    return _withWriteLock(() async {
      final cache = _getCache();

      // ═══ FIX Storage: فحص حجم entry الواحد ═══
      final entryJson = jsonEncode(data);
      if (entryJson.length > _maxSingleEntrySize) {
        if (kDebugMode) {
          debugPrint('[OfflineManager] Cache entry too large ($key: ${entryJson.length ~/ 1024}KB > ${_maxSingleEntrySize ~/ 1024}KB) — skipping');
        }
        return; // لا نخزن entries ضخمة
      }

      // ═══ FIX: Remove old entry for same key first ═══
      cache.remove(key);

      // LRU eviction: remove oldest if over limit
      while (cache.length >= _maxCacheMemoryEntries) {
        String? oldestKey;
        DateTime? oldestTime;
        for (final e in cache.entries) {
          final t = DateTime.tryParse(e.value['cached_at'] ?? '');
          if (t != null && (oldestTime == null || t.isBefore(oldestTime))) {
            oldestTime = t;
            oldestKey = e.key;
          }
        }
        if (oldestKey != null) {
          cache.remove(oldestKey);
        } else {
          break;
        }
      }

      cache[key] = {
        'data': data,
        'cached_at': DateTime.now().toIso8601String(),
      };

      final jsonStr = jsonEncode(cache);

      // ═══ FIX Storage: حد 2MB للكل بدلاً من 5MB ═══
      if (jsonStr.length > _maxTotalCacheSize) {
        if (kDebugMode) {
          debugPrint('[OfflineManager] Cache blob too large (${jsonStr.length ~/ 1024}KB) — evicting to 1MB');
        }
        // Remove oldest entries until under 1MB
        while (cache.length > 5) {
          String? oldestKey;
          DateTime? oldestTime;
          for (final e in cache.entries) {
            final t = DateTime.tryParse(e.value['cached_at'] ?? '');
            if (t != null && (oldestTime == null || t.isBefore(oldestTime))) {
              oldestTime = t;
              oldestKey = e.key;
            }
          }
          if (oldestKey != null) {
            cache.remove(oldestKey);
          } else {
            break;
          }
          if (jsonEncode(cache).length < 1024 * 1024) break;
        }
      }

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

  // ═══════════════════════════════════════════════════════════════════════
  // STORAGE CLEANUP — prevent Hive from growing to 600MB+
  // ═══════════════════════════════════════════════════════════════════════

  /// Max Hive box size — 100MB. If exceeded, oldest data is purged.
  static const int _maxBoxSizeBytes = 100 * 1024 * 1024; // 100MB

  /// Cleanup old data to prevent storage bloat.
  /// Called once on init. Removes:
  ///   1. Drafts older than 30 days
  ///   2. Failed submissions older than 7 days
  ///   3. Cache entries older than 30 days
  ///   4. If total size > 100MB, removes oldest entries
  Future<void> _cleanupOldData() async {
    if (_box == null || !_box!.isOpen) return;

    try {
      int removedCount = 0;

      // 1. Clean old drafts (older than 30 days)
      final now = DateTime.now();
      final indexStr = _box!.get(_draftsIndexKey) ?? '[]';
      List<String> draftIndex;
      try {
        // Try encrypted first, then plain JSON
        try {
          draftIndex = List<String>.from(jsonDecode(_encryption.decrypt(indexStr)));
        } catch (_) {
          draftIndex = List<String>.from(jsonDecode(indexStr));
        }
      } catch (_) {
        draftIndex = [];
      }

      final draftsToRemove = <String>[];
      final draftsToPreserve = <String, String>{}; // id → raw data (for recovery)
      // ═══ FIX: Limit PBKDF2 migration attempts to prevent long init times ═══
      // Each attempt = ~2-3s (PBKDF2 600k in Isolate). Max 5 attempts = ~15s.
      int migrationAttempts = 0;
      const maxMigrationAttempts = 5;
      for (final draftId in draftIndex) {
        final data = _box!.get('drafts/$draftId');
        if (data == null || data.isEmpty) {
          draftsToRemove.add(draftId);
          continue;
        }
        try {
          String decrypted;
          try {
            decrypted = _encryption.decrypt(data);
          } catch (_) {
            // ═══ محاولة 1: plain JSON (عند فشل Isolate في saveDraft) ═══
            try {
              final v = jsonDecode(data);
              if (v is Map && v.containsKey('form_id') && v.containsKey('data')) {
                decrypted = data;  // plain JSON صالح — لا تُحذف!
                if (kDebugMode) debugPrint('[OfflineManager] Draft $draftId is plain JSON — keeping');
              }
            } catch (_) {}

            // ═══ محاولة 2: old format migration ═══
            if (decrypted == null && EncryptionService.isOldFormat(data) && _encryptionKeyForMigration.isNotEmpty && migrationAttempts < maxMigrationAttempts) {
              if (kDebugMode) debugPrint('[OfflineManager] Draft $draftId is old format — attempting migration...');
              migrationAttempts++;
              final migrated = await EncryptionService.decryptOldFormat(data, _encryptionKeyForMigration);
              if (migrated != null) {
                decrypted = migrated;
                // Re-encrypt with new format for future use
                try {
                  final reEncrypted = _encryption.encrypt(migrated);
                  await _box!.put('drafts/$draftId', reEncrypted);
                  if (kDebugMode) debugPrint('[OfflineManager] ✅ Draft $draftId migrated to new format');
                } catch (_) {
                  // Re-encryption failed, but we have the plaintext
                }
              } else {
                // ═══ FIX R-C1: Don't delete — preserve for manual recovery ═══
                if (kDebugMode) debugPrint('[OfflineManager] ⚠️ Draft $draftId old format migration failed — preserving');
                draftsToPreserve[draftId] = data;
                draftsToRemove.add(draftId); // Remove from active index
                continue;
              }
            } else {
              // Not old format or no key — preserve for recovery
              draftsToPreserve[draftId] = data;
              draftsToRemove.add(draftId);
              continue;
            }
          }
          final draft = jsonDecode(decrypted);
          final savedAt = DateTime.tryParse(draft['saved_at'] ?? '');
          if (savedAt != null && now.difference(savedAt).inDays > 30) {
            draftsToRemove.add(draftId);
          }
        } catch (_) {
          // ═══ FIX R-C1: Don't delete corrupted drafts — preserve for recovery ═══
          // Previously: draftsToRemove.add(draftId) → deleted forever
          // Now: preserve raw data in recovery storage
          draftsToPreserve[draftId] = data;
          draftsToRemove.add(draftId); // Remove from active index
        }
      }

      // ═══ FIX R-C1: Preserve unmigrated/corrupted drafts for manual recovery ═══
      if (draftsToPreserve.isNotEmpty) {
        final existingRecovery = _box!.get('_recovered_drafts') ?? '{}';
        Map<String, dynamic> recoveryMap;
        try {
          recoveryMap = Map<String, dynamic>.from(jsonDecode(existingRecovery));
        } catch (_) {
          recoveryMap = {};
        }
        recoveryMap.addAll(draftsToPreserve);
        await _box!.put('_recovered_drafts', jsonEncode(recoveryMap));
        if (kDebugMode) {
          debugPrint('[OfflineManager] 📦 Preserved ${draftsToPreserve.length} drafts for recovery');
        }
      }

      for (final id in draftsToRemove) {
        await _box!.delete('drafts/$id');
        draftIndex.remove(id);
        removedCount++;
      }
      if (draftsToRemove.isNotEmpty) {
        try {
          await _box!.put(_draftsIndexKey, _encryption.encrypt(jsonEncode(draftIndex)));
        } catch (_) {
          await _box!.put(_draftsIndexKey, jsonEncode(draftIndex));
        }
      }

      // 2. Clean old failed submissions (older than 7 days)
      final failed = _getFailedSubmissions();
      final failedToRemove = <String>[];
      for (final entry in failed.entries) {
        final failedAt = DateTime.tryParse(entry.value['failed_at'] ?? '');
        if (failedAt != null && now.difference(failedAt).inDays > 7) {
          failedToRemove.add(entry.key);
        }
      }
      for (final id in failedToRemove) {
        failed.remove(id);
        removedCount++;
      }
      if (failedToRemove.isNotEmpty) {
        final encrypted = _encryption.encrypt(jsonEncode(failed));
        await _safeBox?.put(_failedSubmissionsKey, encrypted);
      }

      // 3. Clean old cache entries (older than 7 days — was 30)
      // ═══ FIX Storage: تقليل مدة الاحتفاظ من 30 إلى 7 أيام ═══
      // Previously: 30 days → cache يحتفظ ببيانات قديمة ضخمة
      // Now: 7 days → بيانات أحدث فقط، مساحة أقل
      final cache = _getCache();
      final cacheToRemove = <String>[];
      for (final entry in cache.entries) {
        final cachedAt = DateTime.tryParse(entry.value['cached_at'] ?? '');
        if (cachedAt != null && now.difference(cachedAt).inDays > 7) {
          cacheToRemove.add(entry.key);
        }
      }
      for (final key in cacheToRemove) {
        cache.remove(key);
        removedCount++;
      }
      if (cacheToRemove.isNotEmpty) {
        final encrypted = _encryption.encrypt(jsonEncode(cache));
        await _safeBox?.put(_cacheKey, encrypted);
        _cacheMemory = cache;
      }

      // 4. Clean old sync queue items (older than 7 days — stuck items)
      final queueIndex = _getQueueIndex();
      final queueToRemove = <String>[];
      for (final id in queueIndex) {
        final data = _safeBox?.get('sync_queue/$id');
        if (data == null || data.isEmpty) {
          queueToRemove.add(id);
          continue;
        }
        try {
          final decrypted = _encryption.decrypt(data);
          final item = jsonDecode(decrypted);
          final createdAt = DateTime.tryParse(item['created_at'] ?? '');
          if (createdAt != null && now.difference(createdAt).inDays > 7) {
            queueToRemove.add(id);
            // Save to failed submissions before removing
            await saveFailedSubmission(item, 'Auto-cleanup: older than 7 days');
          }
        } catch (_) {
          queueToRemove.add(id); // corrupted item
        }
      }
      for (final id in queueToRemove) {
        await _safeBox?.delete('sync_queue/$id');
        queueIndex.remove(id);
        removedCount++;
      }
      if (queueToRemove.isNotEmpty) {
        await _safeBox?.put(_syncQueueIndexKey, jsonEncode(queueIndex));
        _invalidatePendingCount();
      }

      // 5. Check total box size — if > 100MB, log warning
      try {
        final appDir = await getApplicationDocumentsDirectory().timeout(
          const Duration(seconds: 3),
        );
        final boxFile = File('${appDir.path}/$_boxName.hive');
        if (await boxFile.exists()) {
          final sizeBytes = await boxFile.length();
          if (sizeBytes > _maxBoxSizeBytes) {
            if (kDebugMode) {
              debugPrint('[OfflineManager] ⚠️ Hive box is ${sizeBytes ~/ (1024*1024)}MB — clearing cache');
            }
            // Clear cache to reduce size
            await clearCache();
            removedCount++;
          }
        }
      } catch (_) {
        // Can't check size — skip
      }

      // ═══ FIX Storage: Hive compaction — يُزيل البيانات الميتة من الملف ═══
      // بدون compaction، الملف يبقى يكبر حتى مع الحذف
      if (removedCount > 0) {
        try {
          await _box!.compact();
          if (kDebugMode) {
            debugPrint('[OfflineManager] ✅ Hive compacted after removing $removedCount items');
          }
        } catch (e) {
          if (kDebugMode) debugPrint('[OfflineManager] Compact failed: $e');
        }
      }

      if (kDebugMode && removedCount > 0) {
        debugPrint('[OfflineManager] 🧹 Cleanup: removed $removedCount old entries');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[OfflineManager] Cleanup failed: $e');
      }
    }
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

class _EncodeParams {
  final Map<String, dynamic> data;
  final EncryptionService encryption;
  const _EncodeParams(this.data, this.encryption);
}

/// Top-level function for compute() — encodes + encrypts in background isolate
String _encodeAndEncryptInIsolate(_EncodeParams params) {
  final json = jsonEncode(params.data);
  return params.encryption.encrypt(json);
}
