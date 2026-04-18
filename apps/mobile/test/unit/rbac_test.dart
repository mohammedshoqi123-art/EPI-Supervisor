import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/security/rbac_service.dart';
import 'package:epi_core/src/auth/auth_state.dart';
import 'package:epi_core/src/errors/app_exceptions.dart';

void main() {
  group('RBACService — Role Hierarchy', () {
    test('admin has highest hierarchy level (5)', () {
      expect(UserRole.admin.hierarchyLevel, equals(5));
    });

    test('central has hierarchy level 4', () {
      expect(UserRole.central.hierarchyLevel, equals(4));
    });

    test('governorate has hierarchy level 3', () {
      expect(UserRole.governorate.hierarchyLevel, equals(3));
    });

    test('district has hierarchy level 2', () {
      expect(UserRole.district.hierarchyLevel, equals(2));
    });

    test('data_entry has lowest hierarchy level (1)', () {
      expect(UserRole.data_entry.hierarchyLevel, equals(1));
    });

    test('hierarchy is strictly ordered', () {
      expect(
        UserRole.admin.hierarchyLevel > UserRole.central.hierarchyLevel,
        isTrue,
      );
      expect(
        UserRole.central.hierarchyLevel > UserRole.governorate.hierarchyLevel,
        isTrue,
      );
      expect(
        UserRole.governorate.hierarchyLevel > UserRole.district.hierarchyLevel,
        isTrue,
      );
      expect(
        UserRole.district.hierarchyLevel > UserRole.data_entry.hierarchyLevel,
        isTrue,
      );
    });
  });

  group('RBACService — canAccessResource', () {
    const ownerId = 'user-123';
    const otherId = 'user-456';
    const govId = 'gov-1';
    const otherGovId = 'gov-2';
    const distId = 'dist-1';
    const otherDistId = 'dist-2';

    test('null role cannot access anything', () {
      expect(
        RBACService.canAccessResource(
          null,
          resourceOwnerId: ownerId,
          currentUserId: otherId,
        ),
        isFalse,
      );
    });

    test('admin can access any resource', () {
      expect(
        RBACService.canAccessResource(
          UserRole.admin,
          resourceOwnerId: ownerId,
          currentUserId: otherId,
          resourceGovernorateId: otherGovId,
          resourceDistrictId: otherDistId,
          userGovernorateId: govId,
          userDistrictId: distId,
        ),
        isTrue,
      );
    });

    test('any user can access their own resource', () {
      for (final role in UserRole.values) {
        expect(
          RBACService.canAccessResource(
            role,
            resourceOwnerId: ownerId,
            currentUserId: ownerId,
          ),
          isTrue,
          reason: '${role.name} should access own resource',
        );
      }
    });

    test('central can access any resource', () {
      expect(
        RBACService.canAccessResource(
          UserRole.central,
          resourceOwnerId: otherId,
          currentUserId: 'different-user',
          resourceGovernorateId: otherGovId,
          userGovernorateId: govId,
        ),
        isTrue,
      );
    });

    test('governorate can only access same governorate resources', () {
      // Same governorate — allowed
      expect(
        RBACService.canAccessResource(
          UserRole.governorate,
          resourceOwnerId: otherId,
          currentUserId: 'self',
          resourceGovernorateId: govId,
          userGovernorateId: govId,
        ),
        isTrue,
      );

      // Different governorate — denied
      expect(
        RBACService.canAccessResource(
          UserRole.governorate,
          resourceOwnerId: otherId,
          currentUserId: 'self',
          resourceGovernorateId: otherGovId,
          userGovernorateId: govId,
        ),
        isFalse,
      );
    });

    test('district can only access same district resources', () {
      // Same district — allowed
      expect(
        RBACService.canAccessResource(
          UserRole.district,
          resourceOwnerId: otherId,
          currentUserId: 'self',
          resourceGovernorateId: govId,
          resourceDistrictId: distId,
          userGovernorateId: govId,
          userDistrictId: distId,
        ),
        isTrue,
      );

      // Different district — denied
      expect(
        RBACService.canAccessResource(
          UserRole.district,
          resourceOwnerId: otherId,
          currentUserId: 'self',
          resourceGovernorateId: govId,
          resourceDistrictId: otherDistId,
          userGovernorateId: govId,
          userDistrictId: distId,
        ),
        isFalse,
      );
    });

    test('data_entry can only access own resources', () {
      // Own resource — allowed
      expect(
        RBACService.canAccessResource(
          UserRole.data_entry,
          resourceOwnerId: ownerId,
          currentUserId: ownerId,
        ),
        isTrue,
      );

      // Other's resource — denied
      expect(
        RBACService.canAccessResource(
          UserRole.data_entry,
          resourceOwnerId: otherId,
          currentUserId: ownerId,
        ),
        isFalse,
      );
    });
  });

  group('RBACService — canPerformAction', () {
    test('null role cannot perform any action', () {
      for (final action in RBACAction.values) {
        expect(
          RBACService.canPerformAction(null, action),
          isFalse,
          reason: 'null role should not perform ${action.name}',
        );
      }
    });

    test('admin can perform all actions', () {
      for (final action in RBACAction.values) {
        expect(
          RBACService.canPerformAction(UserRole.admin, action),
          isTrue,
          reason: 'admin should perform ${action.name}',
        );
      }
    });

    test('manageUsers requires central+ (level 4+)', () {
      expect(
        RBACService.canPerformAction(UserRole.central, RBACAction.manageUsers),
        isTrue,
      );
      expect(
        RBACService.canPerformAction(
          UserRole.governorate,
          RBACAction.manageUsers,
        ),
        isFalse,
      );
      expect(
        RBACService.canPerformAction(UserRole.district, RBACAction.manageUsers),
        isFalse,
      );
      expect(
        RBACService.canPerformAction(
          UserRole.data_entry,
          RBACAction.manageUsers,
        ),
        isFalse,
      );
    });

    test('manageForms requires central+ (level 4+)', () {
      expect(
        RBACService.canPerformAction(UserRole.central, RBACAction.manageForms),
        isTrue,
      );
      expect(
        RBACService.canPerformAction(
          UserRole.governorate,
          RBACAction.manageForms,
        ),
        isFalse,
      );
    });

    test('approveSubmissions requires governorate+ (level 3+)', () {
      expect(
        RBACService.canPerformAction(
          UserRole.central,
          RBACAction.approveSubmissions,
        ),
        isTrue,
      );
      expect(
        RBACService.canPerformAction(
          UserRole.governorate,
          RBACAction.approveSubmissions,
        ),
        isTrue,
      );
      expect(
        RBACService.canPerformAction(
          UserRole.district,
          RBACAction.approveSubmissions,
        ),
        isFalse,
      );
      expect(
        RBACService.canPerformAction(
          UserRole.data_entry,
          RBACAction.approveSubmissions,
        ),
        isFalse,
      );
    });

    test('all roles can export data', () {
      for (final role in UserRole.values) {
        expect(
          RBACService.canPerformAction(role, RBACAction.exportData),
          isTrue,
        );
      }
    });

    test('all roles can submit forms', () {
      for (final role in UserRole.values) {
        expect(
          RBACService.canPerformAction(role, RBACAction.submitForms),
          isTrue,
        );
      }
    });

    test('all roles can use AI', () {
      for (final role in UserRole.values) {
        expect(RBACService.canPerformAction(role, RBACAction.useAI), isTrue);
      }
    });

    test('manageGovernorates is admin-only', () {
      expect(
        RBACService.canPerformAction(
          UserRole.admin,
          RBACAction.manageGovernorates,
        ),
        isTrue,
      );
      expect(
        RBACService.canPerformAction(
          UserRole.central,
          RBACAction.manageGovernorates,
        ),
        isFalse,
      );
      expect(
        RBACService.canPerformAction(
          UserRole.governorate,
          RBACAction.manageGovernorates,
        ),
        isFalse,
      );
    });

    test('manageDistricts is admin-only', () {
      expect(
        RBACService.canPerformAction(
          UserRole.admin,
          RBACAction.manageDistricts,
        ),
        isTrue,
      );
      expect(
        RBACService.canPerformAction(
          UserRole.central,
          RBACAction.manageDistricts,
        ),
        isFalse,
      );
    });

    test('viewAuditLogs requires central+ (level 4+)', () {
      expect(
        RBACService.canPerformAction(
          UserRole.central,
          RBACAction.viewAuditLogs,
        ),
        isTrue,
      );
      expect(
        RBACService.canPerformAction(
          UserRole.governorate,
          RBACAction.viewAuditLogs,
        ),
        isFalse,
      );
    });
  });

  group('RBACService — assignableRoles', () {
    test('admin can assign all roles', () {
      final roles = RBACService.assignableRoles(UserRole.admin);
      expect(roles.length, equals(UserRole.values.length));
      expect(roles, containsAll(UserRole.values));
    });

    test('central can assign governorate, district, data_entry', () {
      final roles = RBACService.assignableRoles(UserRole.central);
      expect(
        roles,
        containsAll([
          UserRole.governorate,
          UserRole.district,
          UserRole.data_entry,
        ]),
      );
      expect(roles, isNot(contains(UserRole.admin)));
      expect(roles, isNot(contains(UserRole.central)));
    });

    test('governorate can assign district, data_entry', () {
      final roles = RBACService.assignableRoles(UserRole.governorate);
      expect(roles, containsAll([UserRole.district, UserRole.data_entry]));
      expect(roles, isNot(contains(UserRole.admin)));
      expect(roles, isNot(contains(UserRole.central)));
      expect(roles, isNot(contains(UserRole.governorate)));
    });

    test('district can only assign data_entry', () {
      final roles = RBACService.assignableRoles(UserRole.district);
      expect(roles, equals([UserRole.data_entry]));
    });

    test('data_entry cannot assign any role', () {
      final roles = RBACService.assignableRoles(UserRole.data_entry);
      expect(roles, isEmpty);
    });
  });

  group('RBACService — enforcePermission', () {
    test('throws PermissionException when insufficient permissions', () {
      expect(
        () => RBACService.enforcePermission(
          UserRole.data_entry,
          RBACAction.manageUsers,
        ),
        throwsA(isA<PermissionException>()),
      );
    });

    test('does not throw when permissions are sufficient', () {
      expect(
        () => RBACService.enforcePermission(
          UserRole.admin,
          RBACAction.manageUsers,
        ),
        returnsNormally,
      );
    });

    test('null role throws PermissionException', () {
      expect(
        () => RBACService.enforcePermission(null, RBACAction.submitForms),
        throwsA(isA<PermissionException>()),
      );
    });
  });

  group('UserRole — Properties', () {
    test('dbValue matches enum name', () {
      expect(UserRole.admin.dbValue, equals('admin'));
      expect(UserRole.central.dbValue, equals('central'));
      expect(UserRole.governorate.dbValue, equals('governorate'));
      expect(UserRole.district.dbValue, equals('district'));
      expect(UserRole.data_entry.dbValue, equals('data_entry'));
    });

    test('nameAr returns Arabic name', () {
      expect(UserRole.admin.nameAr, equals('مدير النظام'));
      expect(UserRole.central.nameAr, equals('مركزي'));
      expect(UserRole.governorate.nameAr, equals('محافظة'));
      expect(UserRole.district.nameAr, equals('منطقة'));
      expect(UserRole.data_entry.nameAr, equals('مدخل بيانات'));
    });

    test('canAccessAdminDashboard is admin-only', () {
      expect(UserRole.admin.canAccessAdminDashboard, isTrue);
      for (final role in UserRole.values.where((r) => r != UserRole.admin)) {
        expect(role.canAccessAdminDashboard, isFalse);
      }
    });

    test('canManageUsers requires hierarchy >= 4', () {
      expect(UserRole.admin.canManageUsers, isTrue);
      expect(UserRole.central.canManageUsers, isTrue);
      expect(UserRole.governorate.canManageUsers, isFalse);
      expect(UserRole.district.canManageUsers, isFalse);
      expect(UserRole.data_entry.canManageUsers, isFalse);
    });

    test('canApprove requires hierarchy >= 3', () {
      expect(UserRole.admin.canApprove, isTrue);
      expect(UserRole.central.canApprove, isTrue);
      expect(UserRole.governorate.canApprove, isTrue);
      expect(UserRole.district.canApprove, isFalse);
      expect(UserRole.data_entry.canApprove, isFalse);
    });

    test('canExport is true for all roles', () {
      for (final role in UserRole.values) {
        expect(role.canExport, isTrue);
      }
    });

    test('canUseAI is true for all roles', () {
      for (final role in UserRole.values) {
        expect(role.canUseAI, isTrue);
      }
    });

    test('canManage checks hierarchy correctly', () {
      expect(UserRole.admin.canManage(UserRole.central), isTrue);
      expect(UserRole.admin.canManage(UserRole.data_entry), isTrue);
      expect(UserRole.central.canManage(UserRole.governorate), isTrue);
      expect(UserRole.governorate.canManage(UserRole.district), isTrue);
      expect(UserRole.district.canManage(UserRole.data_entry), isTrue);
      // Same level or lower — cannot manage
      expect(UserRole.central.canManage(UserRole.central), isFalse);
      expect(UserRole.data_entry.canManage(UserRole.admin), isFalse);
      expect(UserRole.governorate.canManage(UserRole.central), isFalse);
    });
  });

  group('AuthState — Serialization', () {
    test('toJson and fromJson roundtrip', () {
      const state = AuthState(
        isAuthenticated: true,
        userId: 'user-123',
        email: 'test@epi.gov.ye',
        role: UserRole.admin,
        governorateId: 'gov-1',
        districtId: 'dist-1',
        fullName: 'مدير النظام',
        phone: '777123456',
      );

      final json = state.toJson();
      final restored = AuthState.fromJson(json);

      expect(restored.isAuthenticated, equals(state.isAuthenticated));
      expect(restored.userId, equals(state.userId));
      expect(restored.email, equals(state.email));
      expect(restored.role, equals(state.role));
      expect(restored.governorateId, equals(state.governorateId));
      expect(restored.districtId, equals(state.districtId));
      expect(restored.fullName, equals(state.fullName));
      expect(restored.phone, equals(state.phone));
    });

    test('copyWith preserves unchanged fields', () {
      const original = AuthState(
        isAuthenticated: true,
        userId: 'user-123',
        role: UserRole.admin,
      );

      final updated = original.copyWith(fullName: 'Updated Name');

      expect(updated.isAuthenticated, equals(true));
      expect(updated.userId, equals('user-123'));
      expect(updated.role, equals(UserRole.admin));
      expect(updated.fullName, equals('Updated Name'));
    });

    test('fromJson handles missing fields gracefully', () {
      final state = AuthState.fromJson({});
      expect(state.isAuthenticated, isFalse);
      expect(state.userId, isNull);
      expect(state.role, isNull);
    });

    test('_parseRole handles backward compat teamLead', () {
      final state = AuthState.fromJson({'role': 'teamLead'});
      expect(state.role, equals(UserRole.data_entry));
    });
  });
}
