import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/security/rbac_service.dart';
import 'package:epi_core/src/auth/auth_state.dart';
import 'package:epi_core/src/errors/app_exceptions.dart';

void main() {
  group('RBACService - canAccessResource', () {
    const adminId = 'admin-001';
    const userAId = 'user-A';
    const userBId = 'user-B';
    const govAlpha = 'gov-alpha';
    const govBeta = 'gov-beta';
    const distAlpha = 'dist-alpha';

    test('admin can access any resource', () {
      expect(
        RBACService.canAccessResource(
          UserRole.admin,
          resourceOwnerId: userBId,
          currentUserId: adminId,
          resourceGovernorateId: govBeta,
          userGovernorateId: govAlpha,
        ),
        isTrue,
      );
    });

    test('user can access own resources', () {
      expect(
        RBACService.canAccessResource(
          UserRole.data_entry,
          resourceOwnerId: userAId,
          currentUserId: userAId,
        ),
        isTrue,
      );
    });

    test('data_entry cannot access other users resources', () {
      expect(
        RBACService.canAccessResource(
          UserRole.data_entry,
          resourceOwnerId: userBId,
          currentUserId: userAId,
          resourceGovernorateId: govAlpha,
          userGovernorateId: govAlpha,
        ),
        isFalse,
      );
    });

    test('central can access all resources', () {
      expect(
        RBACService.canAccessResource(
          UserRole.central,
          resourceOwnerId: userBId,
          currentUserId: 'central-user',
          resourceGovernorateId: govBeta,
          userGovernorateId: govAlpha,
        ),
        isTrue,
      );
    });

    test('governorate can access same governorate resources', () {
      expect(
        RBACService.canAccessResource(
          UserRole.governorate,
          resourceOwnerId: userBId,
          currentUserId: userAId,
          resourceGovernorateId: govAlpha,
          userGovernorateId: govAlpha,
        ),
        isTrue,
      );
    });

    test('governorate cannot access different governorate resources', () {
      expect(
        RBACService.canAccessResource(
          UserRole.governorate,
          resourceOwnerId: userBId,
          currentUserId: userAId,
          resourceGovernorateId: govBeta,
          userGovernorateId: govAlpha,
        ),
        isFalse,
      );
    });

    test('district can access same district resources', () {
      expect(
        RBACService.canAccessResource(
          UserRole.district,
          resourceOwnerId: userBId,
          currentUserId: userAId,
          resourceDistrictId: distAlpha,
          userDistrictId: distAlpha,
        ),
        isTrue,
      );
    });

    test('null role cannot access anything', () {
      expect(
        RBACService.canAccessResource(
          null,
          resourceOwnerId: userAId,
          currentUserId: userAId,
        ),
        isFalse,
      );
    });
  });

  group('RBACService - canPerformAction', () {
    test('admin can perform all actions', () {
      for (final action in RBACAction.values) {
        expect(
          RBACService.canPerformAction(UserRole.admin, action),
          isTrue,
          reason: 'admin should be able to ${action.name}',
        );
      }
    });

    test('data_entry has limited actions', () {
      expect(RBACService.canPerformAction(UserRole.data_entry, RBACAction.submitForms), isTrue);
      expect(RBACService.canPerformAction(UserRole.data_entry, RBACAction.viewOwnData), isTrue);
      expect(RBACService.canPerformAction(UserRole.data_entry, RBACAction.exportData), isTrue);
      expect(RBACService.canPerformAction(UserRole.data_entry, RBACAction.viewAnalytics), isTrue);
      expect(RBACService.canPerformAction(UserRole.data_entry, RBACAction.useAI), isTrue);
      expect(RBACService.canPerformAction(UserRole.data_entry, RBACAction.viewMap), isTrue);

      expect(RBACService.canPerformAction(UserRole.data_entry, RBACAction.viewAllData), isFalse);
      expect(RBACService.canPerformAction(UserRole.data_entry, RBACAction.manageUsers), isFalse);
      expect(RBACService.canPerformAction(UserRole.data_entry, RBACAction.manageForms), isFalse);
      expect(RBACService.canPerformAction(UserRole.data_entry, RBACAction.approveSubmissions), isFalse);
      expect(RBACService.canPerformAction(UserRole.data_entry, RBACAction.manageGovernorates), isFalse);
      expect(RBACService.canPerformAction(UserRole.data_entry, RBACAction.viewAuditLogs), isFalse);
    });

    test('governorate can approve/reject but not manage users', () {
      expect(RBACService.canPerformAction(UserRole.governorate, RBACAction.approveSubmissions), isTrue);
      expect(RBACService.canPerformAction(UserRole.governorate, RBACAction.rejectSubmissions), isTrue);
      expect(RBACService.canPerformAction(UserRole.governorate, RBACAction.exportData), isTrue);

      expect(RBACService.canPerformAction(UserRole.governorate, RBACAction.viewAllData), isFalse);
      expect(RBACService.canPerformAction(UserRole.governorate, RBACAction.manageUsers), isFalse);
      expect(RBACService.canPerformAction(UserRole.governorate, RBACAction.manageGovernorates), isFalse);
    });

    test('null role cannot perform any action', () {
      for (final action in RBACAction.values) {
        expect(
          RBACService.canPerformAction(null, action),
          isFalse,
          reason: 'null role should NOT be able to ${action.name}',
        );
      }
    });
  });

  group('RBACService - assignableRoles', () {
    test('admin can assign all roles', () {
      final roles = RBACService.assignableRoles(UserRole.admin);
      expect(roles.length, equals(UserRole.values.length));
    });

    test('central can assign governorate and below', () {
      final roles = RBACService.assignableRoles(UserRole.central);
      expect(roles, contains(UserRole.governorate));
      expect(roles, contains(UserRole.district));
      expect(roles, contains(UserRole.data_entry));
      expect(roles, isNot(contains(UserRole.admin)));
      expect(roles, isNot(contains(UserRole.central)));
    });

    test('governorate can assign district and data_entry', () {
      final roles = RBACService.assignableRoles(UserRole.governorate);
      expect(roles, contains(UserRole.district));
      expect(roles, contains(UserRole.data_entry));
      expect(roles, isNot(contains(UserRole.admin)));
      expect(roles, isNot(contains(UserRole.central)));
      expect(roles, isNot(contains(UserRole.governorate)));
    });

    test('district can assign only data_entry', () {
      final roles = RBACService.assignableRoles(UserRole.district);
      expect(roles, equals([UserRole.data_entry]));
    });

    test('data_entry cannot assign any role', () {
      final roles = RBACService.assignableRoles(UserRole.data_entry);
      expect(roles, isEmpty);
    });
  });

  group('RBACService - enforcePermission', () {
    test('throws PermissionException for unauthorized action', () {
      expect(
        () => RBACService.enforcePermission(UserRole.data_entry, RBACAction.manageUsers),
        throwsA(isA<PermissionException>()),
      );
    });

    test('does not throw for authorized action', () {
      expect(
        () => RBACService.enforcePermission(UserRole.admin, RBACAction.manageUsers),
        returnsNormally,
      );
    });

    test('throws for null role', () {
      expect(
        () => RBACService.enforcePermission(null, RBACAction.viewOwnData),
        throwsA(isA<PermissionException>()),
      );
    });
  });
}
