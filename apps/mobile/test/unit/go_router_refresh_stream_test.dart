// ═══════════════════════════════════════════════════════════════════════
// GoRouterRefreshStream tests — السبب الجذري لاختفاء الجولة التعليمية
//
// كان routerProvider يعيد إنشاء GoRouter عند كل انبعاث من مجرى المصادقة
// (_loadProfile يُصدر مرتين، المؤقت الاستباقي كل 3 دقائق) فيُصفَّر مكدس
// التنقل وتختفي الجولة فور ظهورها. الآن الراوتر يُنشأ مرة واحدة والـ
// redirect يُوقظ فقط عبر هذا الـ Listenable عند التغيرات ذات المعنى.
//
// هذه الاختبارات تثبت أن الإشعارات تُطلق فقط عند تغير دخول/خروج/دور —
// وليس عند كل انبعاث (تحديث Token، تحميل Profile بنفس القيم، إلخ).
// ═══════════════════════════════════════════════════════════════════════
import 'dart:async';

import 'package:epi_core/epi_core.dart' show AuthState, UserRole;
import 'package:flutter_test/flutter_test.dart';
import 'package:epi_supervisor/router/app_router.dart'
    show GoRouterRefreshStream;

void main() {
  test('notifies once on construction', () {
    final controller = StreamController<AuthState>.broadcast();
    addTearDown(controller.close);
    var notifications = 0;
    final listenable = GoRouterRefreshStream(controller.stream)
      ..addListener(() => notifications++);
    // constructor fires one immediate notify
    expect(notifications, 1);
    listenable.dispose();
  });

  test('login → profile-load (same user, role arrives) → single notify', () {
    final controller = StreamController<AuthState>.broadcast();
    addTearDown(controller.close);
    var notifications = 0;
    final listenable = GoRouterRefreshStream(controller.stream)
      ..addListener(() => notifications++);

    // 1) signedIn — user id arrives (no role yet)
    controller.add(const AuthState(
      isAuthenticated: true,
      userId: 'u-1',
      email: 'a@b.c',
    ));
    // 2) profile loaded — same user, role now attached
    controller.add(const AuthState(
      isAuthenticated: true,
      userId: 'u-1',
      email: 'a@b.c',
      role: UserRole.data_entry,
    ));
    // 3) token refresh — identical values, no change
    controller.add(const AuthState(
      isAuthenticated: true,
      userId: 'u-1',
      email: 'a@b.c',
      role: UserRole.data_entry,
    ));

    expect(notifications, 1 + 2, reason: 'constructor + login + role change; '
        'identical re-emission must NOT notify');
    listenable.dispose();
  });

  test('role escalation re-evaluates RBAC (notify) without user change', () {
    final controller = StreamController<AuthState>.broadcast();
    addTearDown(controller.close);
    var notifications = 0;
    final listenable = GoRouterRefreshStream(controller.stream)
      ..addListener(() => notifications++);

    controller.add(const AuthState(
        isAuthenticated: true, userId: 'u-2', role: UserRole.data_entry));
    expect(notifications, 2); // constructor + login

    // profile re-load: same user, promoted role → guards must re-run
    controller.add(const AuthState(
        isAuthenticated: true, userId: 'u-2', role: UserRole.admin));
    expect(notifications, 3);
    listenable.dispose();
  });

  test('logout always notifies', () {
    final controller = StreamController<AuthState>.broadcast();
    addTearDown(controller.close);
    var notifications = 0;
    final listenable = GoRouterRefreshStream(controller.stream)
      ..addListener(() => notifications++);

    controller.add(const AuthState(
        isAuthenticated: true, userId: 'u-3', role: UserRole.admin));
    expect(notifications, 2);

    controller.add(const AuthState(isAuthenticated: false));
    expect(notifications, 3, reason: 'logout is a meaningful change');

    // repeated signed-out emissions — no change
    controller.add(const AuthState(isAuthenticated: false));
    expect(notifications, 3);
    listenable.dispose();
  });
}
