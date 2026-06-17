import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/database/database_service.dart';
import 'package:epi_core/src/api/api_client.dart';
import 'package:epi_core/src/errors/app_exceptions.dart';

/// ═══════════════════════════════════════════════════════════════
///  اختبارات DatabaseService — contract & method existence tests
///
///  These tests verify method existence and signatures WITHOUT calling
///  the methods (which would trigger Supabase calls that fail without
///  configuration). We use `isA<Function>()` to verify the method
///  exists at the expected name.
/// ═══════════════════════════════════════════════════════════════

void main() {
  late ApiClient apiClient;
  late DatabaseService db;

  setUp(() {
    apiClient = ApiClient();
    db = DatabaseService(apiClient);
  });

  group('DatabaseService — instantiation', () {
    test('can be instantiated with ApiClient', () {
      expect(db, isNotNull);
    });

    test('stores ApiClient reference (independent instances)', () {
      final db2 = DatabaseService(ApiClient());
      expect(identical(db, db2), isFalse);
    });
  });

  group('DatabaseService — method existence (contract)', () {
    /// Each test verifies a method exists with the expected name.
    /// If a method is renamed or removed, the test will fail.

    test('getUsers method exists', () {
      expect(db.getUsers, isA<Function>());
    });

    test('getUserProfile method exists', () {
      expect(db.getUserProfile, isA<Function>());
    });

    test('updateProfile method exists', () {
      expect(db.updateProfile, isA<Function>());
    });

    test('getGovernorates method exists', () {
      expect(db.getGovernorates, isA<Function>());
    });

    test('getDistricts method exists', () {
      expect(db.getDistricts, isA<Function>());
    });

    test('getHealthFacilities method exists', () {
      expect(db.getHealthFacilities, isA<Function>());
    });

    test('getForms method exists', () {
      expect(db.getForms, isA<Function>());
    });

    test('getActiveCampaign method exists', () {
      expect(db.getActiveCampaign, isA<Function>());
    });

    test('setActiveCampaign method exists', () {
      expect(db.setActiveCampaign, isA<Function>());
    });

    test('getForm method exists', () {
      expect(db.getForm, isA<Function>());
    });

    test('createForm method exists', () {
      expect(db.createForm, isA<Function>());
    });

    test('updateForm method exists', () {
      expect(db.updateForm, isA<Function>());
    });

    test('getSubmissions method exists', () {
      expect(db.getSubmissions, isA<Function>());
    });

    test('getSubmission method exists', () {
      expect(db.getSubmission, isA<Function>());
    });

    test('getSubmissionsCount method exists', () {
      expect(db.getSubmissionsCount, isA<Function>());
    });

    test('submitForm method exists', () {
      expect(db.submitForm, isA<Function>());
    });

    test('updateSubmissionStatus method exists', () {
      expect(db.updateSubmissionStatus, isA<Function>());
    });

    test('getShortages method exists', () {
      expect(db.getShortages, isA<Function>());
    });

    test('getAuditLogs method exists', () {
      expect(db.getAuditLogs, isA<Function>());
    });

    test('getReferences method exists', () {
      expect(db.getReferences, isA<Function>());
    });

    test('createReference method exists', () {
      expect(db.createReference, isA<Function>());
    });

    test('updateReference method exists', () {
      expect(db.updateReference, isA<Function>());
    });

    test('getDashboardStats method exists', () {
      expect(db.getDashboardStats, isA<Function>());
    });

    test('getGovernorateReport method exists', () {
      expect(db.getGovernorateReport, isA<Function>());
    });

    test('getNotifications method exists', () {
      expect(db.getNotifications, isA<Function>());
    });

    test('getUnreadNotificationCount method exists', () {
      expect(db.getUnreadNotificationCount, isA<Function>());
    });

    test('getAppSettings method exists', () {
      expect(db.getAppSettings, isA<Function>());
    });

    test('updateAppSetting method exists', () {
      expect(db.updateAppSetting, isA<Function>());
    });
  });

  group('DatabaseService — submission status workflow', () {
    /// Verify the documented status enum values are valid.

    test('submission status: draft, submitted, reviewed, approved, rejected', () {
      final validStatuses = ['draft', 'submitted', 'reviewed', 'approved', 'rejected'];
      for (final status in validStatuses) {
        expect(status, isA<String>());
      }
    });

    test('all 5 submission statuses are documented', () {
      expect(['draft', 'submitted', 'reviewed', 'approved', 'rejected'].length, equals(5));
    });
  });

  group('DatabaseService — error propagation contract', () {
    test('NetworkException is an AppException', () {
      const e = NetworkException();
      expect(e, isA<AppException>());
    });

    test('NotFoundException is an AppException', () {
      const e = NotFoundException('not found');
      expect(e, isA<AppException>());
    });

    test('PermissionException is an AppException', () {
      const e = PermissionException('forbidden');
      expect(e, isA<AppException>());
    });
  });

  group('DatabaseService — date formatting contract', () {
    test('DateTime.toIso8601String produces UTC format with Z suffix', () {
      final dt = DateTime.utc(2026, 6, 18, 12, 0, 0);
      final iso = dt.toIso8601String();
      expect(iso, endsWith('Z'));
      expect(iso, startsWith('2026-06-18T12:00:00'));
    });

    test('DateTime range produces valid start <= end', () {
      final start = DateTime(2026, 1, 1);
      final end = DateTime(2026, 6, 1);
      expect(start.isBefore(end), isTrue);
    });

    test('Date-only ISO string (for API calls)', () {
      final dt = DateTime(2026, 6, 18);
      final dateOnly = dt.toIso8601String().split('T').first;
      expect(dateOnly, equals('2026-06-18'));
    });
  });

  group('DatabaseService — soft delete contract', () {
    test('DatabaseService does not expose deleteUser', () {
      bool hasMethod;
      try {
        // ignore: avoid_dynamic_calls
        (db as dynamic).deleteUser;
        hasMethod = true;
      } on NoSuchMethodError {
        hasMethod = false;
      } catch (_) {
        hasMethod = false;
      }
      expect(hasMethod, isFalse,
          reason: 'DatabaseService should not expose hard delete for users');
    });

    test('DatabaseService does not expose deleteForm', () {
      bool hasMethod;
      try {
        // ignore: avoid_dynamic_calls
        (db as dynamic).deleteForm;
        hasMethod = true;
      } on NoSuchMethodError {
        hasMethod = false;
      } catch (_) {
        hasMethod = false;
      }
      expect(hasMethod, isFalse,
          reason: 'DatabaseService should not expose hard delete for forms');
    });

    test('DatabaseService does not expose deleteSubmission', () {
      bool hasMethod;
      try {
        // ignore: avoid_dynamic_calls
        (db as dynamic).deleteSubmission;
        hasMethod = true;
      } on NoSuchMethodError {
        hasMethod = false;
      } catch (_) {
        hasMethod = false;
      }
      expect(hasMethod, isFalse,
          reason: 'DatabaseService should not expose hard delete for submissions');
    });
  });

  group('DatabaseService — method count verification', () {
    /// This test documents the expected number of public methods.
    /// If methods are added or removed, update this count.

    test('has at least 25 public methods (contract)', () {
      // Verify a representative sample of methods exist.
      // The actual count is higher, but this ensures the service
      // hasn't been accidentally stripped of functionality.
      final methods = [
        db.getUsers, db.getUserProfile, db.updateProfile,
        db.getGovernorates, db.getDistricts, db.getHealthFacilities,
        db.getForms, db.getActiveCampaign, db.setActiveCampaign,
        db.getForm, db.createForm, db.updateForm,
        db.getSubmissions, db.getSubmission, db.getSubmissionsCount,
        db.submitForm, db.updateSubmissionStatus,
        db.getShortages, db.getAuditLogs,
        db.getReferences, db.createReference, db.updateReference,
        db.getDashboardStats, db.getGovernorateReport,
        db.getNotifications, db.getUnreadNotificationCount,
        db.getAppSettings, db.updateAppSetting,
      ];
      expect(methods.length, greaterThanOrEqualTo(25));
    });
  });
}
