import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/offline/sync_models.dart';

void main() {
  group('SyncPriority', () {
    test('critical has highest value', () {
      expect(SyncPriority.critical.value, equals(100));
      expect(SyncPriority.critical.value, greaterThan(SyncPriority.high.value));
      expect(SyncPriority.high.value, greaterThan(SyncPriority.normal.value));
      expect(SyncPriority.normal.value, greaterThan(SyncPriority.low.value));
    });

    test('has 4 levels', () {
      expect(SyncPriority.values.length, equals(4));
    });
  });

  group('QueueItemStatus', () {
    test('has all expected statuses', () {
      expect(QueueItemStatus.values, contains(QueueItemStatus.pending));
      expect(QueueItemStatus.values, contains(QueueItemStatus.syncing));
      expect(QueueItemStatus.values, contains(QueueItemStatus.retrying));
      expect(QueueItemStatus.values, contains(QueueItemStatus.failed));
      expect(QueueItemStatus.values, contains(QueueItemStatus.completed));
    });
  });

  group('ConflictStrategy', () {
    test('has all strategies', () {
      expect(ConflictStrategy.values, contains(ConflictStrategy.localWins));
      expect(ConflictStrategy.values, contains(ConflictStrategy.serverWins));
      expect(ConflictStrategy.values, contains(ConflictStrategy.merge));
      expect(ConflictStrategy.values, contains(ConflictStrategy.smartMerge));
    });
  });

  group('SyncQueueEntry', () {
    late SyncQueueEntry entry;

    setUp(() {
      entry = SyncQueueEntry(
        id: 'test-123',
        type: 'form_submission',
        payload: {
          'form_id': 'abc',
          'data': {'field1': 'value1'},
        },
        priority: SyncPriority.critical,
        createdAt: DateTime.now(),
      );
    });

    test('stores basic properties', () {
      expect(entry.id, equals('test-123'));
      expect(entry.type, equals('form_submission'));
      expect(entry.priority, equals(SyncPriority.critical));
      expect(entry.status, equals(QueueItemStatus.pending));
      expect(entry.retryCount, equals(0));
    });

    test('pending items are ready for retry', () {
      expect(entry.isReadyForRetry, isTrue);
    });

    test('retrying items respect backoff', () {
      final retrying = SyncQueueEntry(
        id: 'retry-1',
        type: 'form_submission',
        payload: {},
        createdAt: DateTime.now(),
        status: QueueItemStatus.retrying,
        retryCount: 0,
        lastAttemptAt: DateTime.now(), // Just now — backoff not elapsed
      );
      // 10 second backoff for retry 0 — should not be ready yet
      expect(retrying.isReadyForRetry, isFalse);
    });

    test('retrying items become ready after backoff', () {
      final retrying = SyncQueueEntry(
        id: 'retry-2',
        type: 'form_submission',
        payload: {},
        createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
        status: QueueItemStatus.retrying,
        retryCount: 0,
        lastAttemptAt: DateTime.now().subtract(const Duration(seconds: 15)),
      );
      // 10 second backoff, 15 seconds passed — should be ready
      expect(retrying.isReadyForRetry, isTrue);
    });

    test('hasFailed is true when status is failed', () {
      final failed = SyncQueueEntry(
        id: 'fail-1',
        type: 'form_submission',
        payload: {},
        createdAt: DateTime.now(),
        status: QueueItemStatus.failed,
      );
      expect(failed.hasFailed, isTrue);
    });

    test('hasFailed is true when retryCount >= maxRetries', () {
      final exhausted = SyncQueueEntry(
        id: 'exhausted-1',
        type: 'form_submission',
        payload: {},
        createdAt: DateTime.now(),
        retryCount: SyncQueueEntry.maxRetries,
      );
      expect(exhausted.hasFailed, isTrue);
    });

    test('copyWith creates modified copy', () {
      final modified = entry.copyWith(
        status: QueueItemStatus.syncing,
        retryCount: 2,
      );
      expect(modified.id, equals(entry.id));
      expect(modified.status, equals(QueueItemStatus.syncing));
      expect(modified.retryCount, equals(2));
      expect(
        entry.status,
        equals(QueueItemStatus.pending),
      ); // Original unchanged
    });

    test('toJson and fromJson roundtrip', () {
      final json = entry.toJson();
      final restored = SyncQueueEntry.fromJson(json);
      expect(restored.id, equals(entry.id));
      expect(restored.type, equals(entry.type));
      expect(restored.priority, equals(entry.priority));
      expect(restored.payload, equals(entry.payload));
    });

    test('backoff increases with retry count', () {
      expect(entry.nextRetryDelay.inSeconds, equals(10)); // retry 0

      final r1 = entry.copyWith(retryCount: 1);
      expect(r1.nextRetryDelay.inSeconds, equals(30));

      final r2 = entry.copyWith(retryCount: 2);
      expect(r2.nextRetryDelay.inSeconds, equals(90));

      final r3 = entry.copyWith(retryCount: 3);
      expect(r3.nextRetryDelay.inSeconds, equals(300)); // 5 min

      final r4 = entry.copyWith(retryCount: 4);
      expect(r4.nextRetryDelay.inSeconds, equals(900)); // 15 min
    });
  });

  group('OfflineSyncResult', () {
    test('success factory creates success result', () {
      final result = OfflineSyncResult.success('item-1', {'id': 'server-123'});
      expect(result.isSuccess, isTrue);
      expect(result.isError, isFalse);
      expect(result.offlineId, equals('item-1'));
    });

    test('error factory creates error result', () {
      final result = OfflineSyncResult.error('item-2', 'Network timeout');
      expect(result.isError, isTrue);
      expect(result.isSuccess, isFalse);
      expect(result.errorMessage, equals('Network timeout'));
    });

    test('conflict factory creates conflict result', () {
      final result = OfflineSyncResult.conflict('item-3', {'server': 'data'});
      expect(result.isConflict, isTrue);
      expect(result.isSuccess, isFalse);
    });

    test('duplicate factory creates duplicate result', () {
      final result = OfflineSyncResult.duplicate('item-4', {});
      expect(result.isDuplicate, isTrue);
    });
  });

  group('SyncModels — Enums', () {
    test('NetworkStatus has correct values', () {
      expect(NetworkStatus.values.length, equals(3));
      expect(NetworkStatus.values, contains(NetworkStatus.online));
      expect(NetworkStatus.values, contains(NetworkStatus.offline));
      expect(NetworkStatus.values, contains(NetworkStatus.syncing));
    });

    test('OfflineSyncStatus has correct values', () {
      expect(OfflineSyncStatus.values, contains(OfflineSyncStatus.success));
      expect(OfflineSyncStatus.values, contains(OfflineSyncStatus.conflict));
      expect(OfflineSyncStatus.values, contains(OfflineSyncStatus.error));
      expect(OfflineSyncStatus.values, contains(OfflineSyncStatus.duplicate));
    });
  });
}
