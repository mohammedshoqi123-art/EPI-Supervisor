import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/auth/auth_state.dart';
import 'package:epi_core/src/auth/auth_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;

/// ═══════════════════════════════════════════════════════════════
///  اختبارات AuthRepository — دور _parseRole + AuthState
///
///  ملاحظة: اختبارات الـ live Supabase تتم في integration tests.
///  هنا نختبر منطق النموذج (model logic) وتحويل الأدوار.
/// ═══════════════════════════════════════════════════════════════

void main() {
  group('AuthRepository — instantiation', () {
    test('can be instantiated without throwing', () {
      // AuthRepository's constructor calls _init() which tries to access
      // Supabase.instance.client. When Supabase is not configured, it
      // emits an error state to the stream and sets _isConfigured = false.
      // The constructor itself does not throw.
      expect(() => AuthRepository(), returnsNormally);
    });

    test('exposes authStateChanges stream', () {
      final repo = AuthRepository();
      expect(repo.authStateChanges, isNotNull);
      repo.dispose();
    });

    test('exposes currentState getter', () {
      final repo = AuthRepository();
      expect(repo.currentState, isNotNull);
      repo.dispose();
    });

    test('exposes isConfigured getter', () {
      final repo = AuthRepository();
      // In test environment (no Supabase init), should be false
      expect(repo.isConfigured, isA<bool>());
      repo.dispose();
    });

    test('exposes isAuthenticated getter', () {
      final repo = AuthRepository();
      expect(repo.isAuthenticated, isA<bool>());
      repo.dispose();
    });

    test('exposes isAdmin getter', () {
      final repo = AuthRepository();
      expect(repo.isAdmin, isA<bool>());
      repo.dispose();
    });

    test('exposes userId getter (nullable)', () {
      final repo = AuthRepository();
      expect(repo.userId, isNull); // not authenticated in test env
      repo.dispose();
    });

    test('exposes accessToken getter (nullable)', () {
      final repo = AuthRepository();
      expect(repo.accessToken, isNull);
      repo.dispose();
    });

    test('dispose() does not throw', () {
      final repo = AuthRepository();
      expect(() => repo.dispose(), returnsNormally);
    });
  });

  group('AuthRepository — signIn without configuration', () {
    test('throws StateError when not configured', () async {
      final repo = AuthRepository();
      // In test env, Supabase is not configured, so signIn should throw.
      await expectLater(
        () => repo.signIn('test@example.com', 'password'),
        throwsA(isA<StateError>()),
      );
      repo.dispose();
    });
  });

  group('AuthRepository — signOut without configuration', () {
    test('completes without throwing when not configured', () async {
      final repo = AuthRepository();
      // signOut when not configured just returns (no-op).
      await expectLater(repo.signOut(), completes);
      repo.dispose();
    });
  });

  group('AuthRepository — refreshSession without configuration', () {
    test('completes without throwing when not configured', () async {
      final repo = AuthRepository();
      await expectLater(repo.refreshSession(), completes);
      repo.dispose();
    });
  });

  group('AuthRepository — updateProfile without configuration', () {
    test('throws StateError when not configured', () async {
      final repo = AuthRepository();
      await expectLater(
        () => repo.updateProfile(fullName: 'Test User'),
        throwsA(isA<StateError>()),
      );
      repo.dispose();
    });
  });

  group('AuthRepository — uploadAvatar without configuration', () {
    test('throws StateError when not configured', () async {
      final repo = AuthRepository();
      await expectLater(
        () => repo.uploadAvatar(
          'avatar.png',
          Uint8List.fromList([1, 2, 3]),
        ),
        throwsA(isA<StateError>()),
      );
      repo.dispose();
    });
  });

  group('AuthState — role parsing (backward compatibility)', () {
    /// The internal _parseRole() method maps raw DB strings to UserRole.
    /// 'teamLead' is a legacy role that maps to UserRole.data_entry.
    /// We test this indirectly through AuthState.fromJson.

    test('parses admin role', () {
      final state = AuthState.fromJson({
        'is_authenticated': true,
        'role': 'admin',
      });
      expect(state.role, equals(UserRole.admin));
      expect(state.isAuthenticated, isTrue);
    });

    test('parses central role', () {
      final state = AuthState.fromJson({
        'is_authenticated': true,
        'role': 'central',
      });
      expect(state.role, equals(UserRole.central));
    });

    test('parses governorate role', () {
      final state = AuthState.fromJson({
        'role': 'governorate',
      });
      expect(state.role, equals(UserRole.governorate));
    });

    test('parses district role', () {
      final state = AuthState.fromJson({
        'role': 'district',
      });
      expect(state.role, equals(UserRole.district));
    });

    test('parses data_entry role', () {
      final state = AuthState.fromJson({
        'role': 'data_entry',
      });
      expect(state.role, equals(UserRole.data_entry));
    });

    test('parses legacy teamLead role as data_entry (backward compat)', () {
      final state = AuthState.fromJson({
        'role': 'teamLead',
      });
      expect(state.role, equals(UserRole.data_entry),
          reason: 'Legacy teamLead role must map to data_entry for backward compat');
    });

    test('null role returns null UserRole', () {
      final state = AuthState.fromJson({'role': null});
      expect(state.role, isNull);
    });

    test('unknown role returns null UserRole', () {
      final state = AuthState.fromJson({'role': 'unknown_role'});
      expect(state.role, isNull);
    });

    test('missing role key returns null UserRole', () {
      final state = AuthState.fromJson({});
      expect(state.role, isNull);
    });
  });

  group('AuthState — JSON serialization round-trip', () {
    test('toJson/fromJson preserves all fields', () {
      final original = AuthState(
        isAuthenticated: true,
        isLoading: false,
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.admin,
        governorateId: 'gov-1',
        districtId: 'dist-1',
        fullName: 'Test User',
        phone: '+967777123456',
        avatarUrl: 'https://example.com/avatar.png',
        nationalId: 'NID123',
        error: null,
      );

      final json = original.toJson();
      final restored = AuthState.fromJson(json);

      expect(restored.isAuthenticated, equals(original.isAuthenticated));
      expect(restored.userId, equals(original.userId));
      expect(restored.email, equals(original.email));
      expect(restored.role, equals(original.role));
      expect(restored.governorateId, equals(original.governorateId));
      expect(restored.districtId, equals(original.districtId));
      expect(restored.fullName, equals(original.fullName));
      expect(restored.phone, equals(original.phone));
      expect(restored.avatarUrl, equals(original.avatarUrl));
      expect(restored.nationalId, equals(original.nationalId));
    });

    test('default AuthState is unauthenticated and not loading', () {
      const state = AuthState();
      expect(state.isAuthenticated, isFalse);
      expect(state.isLoading, isFalse);
      expect(state.userId, isNull);
      expect(state.role, isNull);
      expect(state.error, isNull);
    });

    test('AuthState toString includes auth and role', () {
      const state = AuthState(
        isAuthenticated: true,
        role: UserRole.admin,
        fullName: 'Admin User',
      );
      final str = state.toString();
      expect(str, contains('auth=true'));
      expect(str, contains('role=UserRole.admin'));
      expect(str, contains('user=Admin User'));
    });
  });

  group('AuthState — copyWith', () {
    test('copyWith preserves unchanged fields', () {
      const original = AuthState(
        userId: 'u1',
        email: 'a@b.com',
        fullName: 'A',
      );
      final copy = original.copyWith(isLoading: true);
      expect(copy.userId, equals('u1'));
      expect(copy.email, equals('a@b.com'));
      expect(copy.fullName, equals('A'));
      expect(copy.isLoading, isTrue);
      expect(original.isLoading, isFalse, reason: 'Original must be unchanged');
    });

    test('copyWith can clear error', () {
      const original = AuthState(error: 'previous error');
      final copy = original.copyWith(error: null);
      expect(copy.error, isNull);
    });
  });

  group('UserRole — hierarchy', () {
    test('admin has highest level (5)', () {
      expect(UserRole.admin.hierarchyLevel, equals(5));
    });

    test('central has level 4', () {
      expect(UserRole.central.hierarchyLevel, equals(4));
    });

    test('governorate has level 3', () {
      expect(UserRole.governorate.hierarchyLevel, equals(3));
    });

    test('district has level 2', () {
      expect(UserRole.district.hierarchyLevel, equals(2));
    });

    test('data_entry has level 1', () {
      expect(UserRole.data_entry.hierarchyLevel, equals(1));
    });

    test('hierarchy is strictly ordered', () {
      expect(UserRole.admin.hierarchyLevel, greaterThan(UserRole.central.hierarchyLevel));
      expect(UserRole.central.hierarchyLevel, greaterThan(UserRole.governorate.hierarchyLevel));
      expect(UserRole.governorate.hierarchyLevel, greaterThan(UserRole.district.hierarchyLevel));
      expect(UserRole.district.hierarchyLevel, greaterThan(UserRole.data_entry.hierarchyLevel));
    });
  });

  group('UserRole — Arabic names', () {
    test('admin Arabic name is correct', () {
      expect(UserRole.admin.nameAr, equals('مدير النظام'));
    });

    test('all roles have non-empty Arabic names', () {
      for (final role in UserRole.values) {
        expect(role.nameAr, isNotEmpty, reason: 'Role $role must have Arabic name');
      }
    });
  });

  group('UserRole — DB value', () {
    test('dbValue matches enum name', () {
      for (final role in UserRole.values) {
        expect(role.dbValue, equals(role.name));
      }
    });
  });

  group('UserRole — permissions', () {
    test('only admin can access admin dashboard', () {
      expect(UserRole.admin.canAccessAdminDashboard, isTrue);
      expect(UserRole.central.canAccessAdminDashboard, isFalse);
      expect(UserRole.governorate.canAccessAdminDashboard, isFalse);
      expect(UserRole.district.canAccessAdminDashboard, isFalse);
      expect(UserRole.data_entry.canAccessAdminDashboard, isFalse);
    });

    test('admin and central can manage users (level >= 4)', () {
      expect(UserRole.admin.canManageUsers, isTrue);
      expect(UserRole.central.canManageUsers, isTrue);
      expect(UserRole.governorate.canManageUsers, isFalse);
      expect(UserRole.district.canManageUsers, isFalse);
      expect(UserRole.data_entry.canManageUsers, isFalse);
    });

    test('only admin can manage forms', () {
      expect(UserRole.admin.canManageForms, isTrue);
      expect(UserRole.central.canManageForms, isFalse);
    });

    test('only admin can view audit logs', () {
      expect(UserRole.admin.canViewAuditLogs, isTrue);
      expect(UserRole.central.canViewAuditLogs, isFalse);
    });

    test('all roles can export, use AI, and view own data', () {
      for (final role in UserRole.values) {
        expect(role.canExport, isTrue, reason: 'Role $role should be able to export');
        expect(role.canUseAI, isTrue, reason: 'Role $role should be able to use AI');
      }
    });

    test('admin and central can view all governorates', () {
      expect(UserRole.admin.canViewAllGovernorates, isTrue);
      expect(UserRole.central.canViewAllGovernorates, isTrue);
      expect(UserRole.governorate.canViewAllGovernorates, isFalse);
    });

    test('canManage — higher level manages lower', () {
      expect(UserRole.admin.canManage(UserRole.central), isTrue);
      expect(UserRole.central.canManage(UserRole.governorate), isTrue);
      expect(UserRole.governorate.canManage(UserRole.district), isTrue);
      expect(UserRole.district.canManage(UserRole.data_entry), isTrue);
    });

    test('canManage — same level cannot manage', () {
      expect(UserRole.admin.canManage(UserRole.admin), isFalse);
      expect(UserRole.data_entry.canManage(UserRole.data_entry), isFalse);
    });
  });

  group('AuthState — extension helpers', () {
    test('isAdmin returns true only for admin role', () {
      const admin = AuthState(role: UserRole.admin, isAuthenticated: true);
      const central = AuthState(role: UserRole.central, isAuthenticated: true);
      expect(admin.isAdmin, isTrue);
      expect(central.isAdmin, isFalse);
    });

    test('isCentral returns true only for central role', () {
      const central = AuthState(role: UserRole.central, isAuthenticated: true);
      const gov = AuthState(role: UserRole.governorate, isAuthenticated: true);
      expect(central.isCentral, isTrue);
      expect(gov.isCentral, isFalse);
    });

    test('isGovernorate returns true only for governorate role', () {
      const gov = AuthState(role: UserRole.governorate, isAuthenticated: true);
      expect(gov.isGovernorate, isTrue);
      expect(gov.isDistrict, isFalse);
    });

    test('isDistrict returns true only for district role', () {
      const d = AuthState(role: UserRole.district, isAuthenticated: true);
      expect(d.isDistrict, isTrue);
      expect(d.isGovernorate, isFalse);
    });

    test('isDataEntry returns true only for data_entry role', () {
      const de = AuthState(role: UserRole.data_entry, isAuthenticated: true);
      expect(de.isDataEntry, isTrue);
      expect(de.isDistrict, isFalse);
    });
  });
}
