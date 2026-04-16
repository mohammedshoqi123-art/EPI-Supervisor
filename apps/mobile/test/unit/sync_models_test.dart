import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/offline/sync_models.dart';

void main() {
  group('SyncPriority', () {
    test('priority values are ordered correctly', () {
      expect(SyncPriority.critical.value, greaterThan(SyncPriority.high.value));
      expect(SyncPriority.high.value, greaterThan(SyncPriority.normal.value));
      expect(SyncPriority.normal.value, greaterThan(SyncPriority.low.value));
    });

    test('critical has highest value (100)', () {
      expect(SyncPriority.critical.value, equals(100));
    });
  });

  group('SyncQueueEntry', () {
    late SyncQueueEntry baseEntry;

    setUp(() {
      baseEntry = SyncQueueEntry(
        id: 'test-001',
        type: 'form_submission',
        payload: {'form_id': 'abc', 'data': {'field': 'value'}},
        priority: SyncPriority.high,
        status: QueueItemStatus.pending,
        createdAt: DateTime(2024, 1, 1),
      );
    });

    test('pending entry is ready for retry', () {
      expect(baseEntry.isReadyForRetry, isTrue);
    });

    test('retrying entry respects backoff', () {
      final retrying = baseEntry.copyWith(
        status: QueueItemStatus.retrying,
        retryCount: 1,
        lastAttemptAt: DateTime.now().subtract(const Duration(seconds: 5)),
      );
      // Backoff for retry 1 is 30s, only 5s passed
      expect(retrying.isReadyForRetry, isFalse);
    });

    test('retrying entry is ready after backoff elapses', () {
      final retrying = baseEntry.copyWith(
        status: QueueItemStatus.retrying,
        retryCount: 0,
        lastAttemptAt: DateTime.now().subtract(const Duration(seconds: 15)),
      );
      // Backoff for retry 0 is 10s, 15s passed
      expect(retrying.isReadyForRetry, isTrue);
    });

    test('hasFailed is true when max retries exceeded', () {
      final failed = baseEntry.copyWith(retryCount: 5);
      expect(failed.hasFailed, isTrue);
    });

    test('hasFailed is false below max retries', () {
      expect(baseEntry.hasFailed, isFalse);
    });

    test('copyWith preserves unset fields', () {
      final updated = baseEntry.copyWith(status: QueueItemStatus.syncing);
      expect(updated.status, equals(QueueItemStatus.syncing));
      expect(updated.id, equals('test-001'));
      expect(updated.type, equals('form_submission'));
      expect(updated.priority, equals(SyncPriority.high));
    });

    test('toJson roundtrip preserves data', () {
      final json = baseEntry.toJson();
      final restored = SyncQueueEntry.fromJson(json);
      expect(restored.id, equals(baseEntry.id));
      expect(restored.type, equals(baseEntry.type));
      expect(restored.priority, equals(baseEntry.priority));
      expect(restored.status, equals(baseEntry.status));
    });

    test('fromJson handles missing optional fields', () {
      final json = {
        'id': 'test-002',
        'type': 'profile_update',
        'payload': {},
        'created_at': '2024-01-01T00:00:00.000Z',
      };
      final entry = SyncQueueEntry.fromJson(json);
      expect(entry.priority, equals(SyncPriority.normal));
      expect(entry.status, equals(QueueItemStatus.pending));
      expect(entry.retryCount, equals(0));
      expect(entry.lastError, isNull);
    });

    test('backoff increases with retry count', () {
      expect(baseEntry.copyWith(retryCount: 0).nextRetryDelay.inSeconds, equals(10));
      expect(baseEntry.copyWith(retryCount: 1).nextRetryDelay.inSeconds, equals(30));
      expect(baseEntry.copyWith(retryCount: 2).nextRetryDelay.inSeconds, equals(90));
      expect(baseEntry.copyWith(retryCount: 3).nextRetryDelay.inSeconds, equals(300));
      expect(baseEntry.copyWith(retryCount: 4).nextRetryDelay.inSeconds, equals(900));
      // Max backoff caps at 900s
      expect(baseEntry.copyWith(retryCount: 10).nextRetryDelay.inSeconds, equals(900));
    });
  });

  group('SyncItemResult', () {
    test('ok result is success', () {
      final result = SyncItemResult.ok('id-1');
      expect(result.success, isTrue);
      expect(result.isDuplicate, isFalse);
      expect(result.hasConflict, isFalse);
    });

    test('duplicate result is success but flagged', () {
      final result = SyncItemResult.duplicate('id-1');
      expect(result.success, isTrue);
      expect(result.isDuplicate, isTrue);
    });

    test('conflict result is not success', () {
      final result = SyncItemResult.conflict('id-1', {'status': 'approved'});
      expect(result.success, isFalse);
      expect(result.hasConflict, isTrue);
    });

    test('error result has error message', () {
      final result = SyncItemResult.error('id-1', 'Network timeout');
      expect(result.success, isFalse);
      expect(result.error, equals('Network timeout'));
    });
  });

  group('SyncCycleSummary', () {
    test('allSuccessful when no failures or conflicts', () {
      final summary = SyncCycleSummary(synced: 5, duplicates: 1);
      expect(summary.allSuccessful, isTrue);
    });

    test('allSuccessful is false with conflicts', () {
      final summary = SyncCycleSummary(synced: 5, conflicts: 1);
      expect(summary.allSuccessful, isFalse);
    });

    test('hasErrors is true with failures', () {
      final summary = SyncCycleSummary(failed: 1);
      expect(summary.hasErrors, isTrue);
    });

    test('hasErrors is true with error list', () {
      final summary = SyncCycleSummary(errors: ['timeout']);
      expect(summary.hasErrors, isTrue);
    });
  });

  group('QueueCounts', () {
    test('total sums all active items', () {
      const counts = QueueCounts(pending: 5, retrying: 2, syncing: 1, failed: 3);
      expect(counts.total, equals(8)); // pending + retrying + syncing
    });

    test('isEmpty when no active items', () {
      const counts = QueueCounts(failed: 5);
      expect(counts.isEmpty, isTrue);
    });

    test('hasActivity when syncing', () {
      const counts = QueueCounts(syncing: 1);
      expect(counts.hasActivity, isTrue);
    });
  });

  group('ConflictResolver', () {
    test('serverWins returns server data', () {
      final conflict = DataConflictV2(
        id: 'c1',
        entityType: 'form_submission',
        entityId: 'e1',
        localData: {'status': 'submitted', 'data': {'local': true}},
        serverData: {'status': 'approved', 'data': {'local': false}},
        detectedAt: DateTime.now(),
      );
      final resolved = ConflictResolver.resolve(conflict, ConflictStrategy.serverWins);
      expect(resolved['status'], equals('approved'));
    });

    test('localWins returns local data', () {
      final conflict = DataConflictV2(
        id: 'c1',
        entityType: 'form_submission',
        entityId: 'e1',
        localData: {'status': 'submitted', 'data': {'local': true}},
        serverData: {'status': 'approved', 'data': {'local': false}},
        detectedAt: DateTime.now(),
      );
      final resolved = ConflictResolver.resolve(conflict, ConflictStrategy.localWins);
      expect(resolved['data'], equals({'local': true}));
    });

    test('smartMerge keeps admin fields from server', () {
      final conflict = DataConflictV2(
        id: 'c1',
        entityType: 'form_submission',
        entityId: 'e1',
        localData: {
          'data': {'field': 'local_value'},
          'gps_lat': 15.3,
          'status': 'submitted',
        },
        serverData: {
          'data': {'field': 'server_value'},
          'gps_lat': 15.4,
          'status': 'approved',
          'reviewed_by': 'admin-001',
        },
        detectedAt: DateTime.now(),
      );
      final resolved = ConflictResolver.resolve(conflict, ConflictStrategy.smartMerge);
      // Admin fields from server
      expect(resolved['status'], equals('approved'));
      expect(resolved['reviewed_by'], equals('admin-001'));
      // Field data from local
      expect(resolved['data'], equals({'field': 'local_value'}));
      expect(resolved['gps_lat'], equals(15.3));
      // Merge metadata
      expect(resolved['_conflict_resolved'], isTrue);
    });
  });

  group('DataConflictV2', () {
    test('differingFields excludes timestamp fields', () {
      final conflict = DataConflictV2(
        id: 'c1',
        entityType: 'form_submission',
        entityId: 'e1',
        localData: {
          'status': 'submitted',
          'data': {'v': 1},
          'updated_at': '2024-01-01',
        },
        serverData: {
          'status': 'approved',
          'data': {'v': 2},
          'updated_at': '2024-01-02',
        },
        detectedAt: DateTime.now(),
      );
      final fields = conflict.differingFields;
      expect(fields, contains('status'));
      expect(fields, contains('data'));
      expect(fields, isNot(contains('updated_at')));
    });

    test('toJson and fromJson roundtrip', () {
      final conflict = DataConflictV2(
        id: 'c1',
        entityType: 'form_submission',
        entityId: 'e1',
        localData: {'a': 1},
        serverData: {'a': 2},
        detectedAt: DateTime(2024, 6, 15, 12, 0),
      );
      final json = conflict.toJson();
      final restored = DataConflictV2.fromJson(json);
      expect(restored.id, equals(conflict.id));
      expect(restored.localData, equals(conflict.localData));
      expect(restored.serverData, equals(conflict.serverData));
    });
  });

  group('NetworkSnapshot', () {
    test('isOnline is true when status is online', () {
      const snapshot = NetworkSnapshot(status: NetworkStatus.online);
      expect(snapshot.isOnline, isTrue);
    });

    test('isOnline is false when offline', () {
      const snapshot = NetworkSnapshot(status: NetworkStatus.offline);
      expect(snapshot.isOnline, isFalse);
    });

    test('isSyncing when status is syncing', () {
      const snapshot = NetworkSnapshot(status: NetworkStatus.syncing);
      expect(snapshot.isSyncing, isTrue);
    });

    test('hasPending when pending items > 0', () {
      const snapshot = NetworkSnapshot(status: NetworkStatus.offline, pendingItems: 5);
      expect(snapshot.hasPending, isTrue);
    });

    test('offlineDuration calculates correctly', () {
      final lastOnline = DateTime.now().subtract(const Duration(hours: 2));
      final snapshot = NetworkSnapshot(
        status: NetworkStatus.offline,
        lastOnlineAt: lastOnline,
      );
      final duration = snapshot.offlineDuration;
      expect(duration, isNotNull);
      expect(duration!.inHours, equals(2));
    });

    test('indicator shows correct emoji', () {
      expect(
        const NetworkSnapshot(status: NetworkStatus.online).indicator,
        equals('🟢'),
      );
      expect(
        const NetworkSnapshot(status: NetworkStatus.online, pendingItems: 5).indicator,
        equals('🟡'),
      );
      expect(
        const NetworkSnapshot(status: NetworkStatus.syncing).indicator,
        equals('🟡'),
      );
      expect(
        const NetworkSnapshot(status: NetworkStatus.offline).indicator,
        equals('🔴'),
      );
    });
  });
}
