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
//
// ملاحظة: إشعار البناء الأول (notifyListeners في المُنشئ) يحدث قبل
// إرفاق المستمع في الاختبارات — فلا يُحتسب، وهذا مقصود.
// ═══════════════════════════════════════════════════════════════════════
import 'dart:async';

import 'package:epi_core/epi_core.dart' show AuthState, UserRole;
import 'package:flutter_test/flutter_test.dart';
import 'package:epi_supervisor/router/app_router.dart'
    show GoRouterRefreshStream;

void main() {
  test('identical re-emission after login does not notify', () async {
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
    await pumpEventQueue();
    expect(notifications, 1);

    // 2) profile loaded — same user, role now attached → meaningful change
    controller.add(const AuthState(
      isAuthenticated: true,
      userId: 'u-1',
      email: 'a@b.c',
      role: UserRole.data_entry,
    ));
    await pumpEventQueue();
    expect(notifications, 2);

    // 3) token refresh / profile re-load — identical values, NO notify
    //    (هذا بالضبط الانبعاث الذي كان يعيد إنشاء الراوتر ويمسح الجولة)
    controller.add(const AuthState(
      isAuthenticated: true,
      userId: 'u-1',
      email: 'a@b.c',
      role: UserRole.data_entry,
    ));
    await pumpEventQueue();
    expect(notifications, 2);

    listenable.dispose();
  });

  test('role escalation re-evaluates RBAC (notify) without user change',
      () async {
    final controller = StreamController<AuthState>.broadcast();
    addTearDown(controller.close);
    var notifications = 0;
    final listenable = GoRouterRefreshStream(controller.stream)
      ..addListener(() => notifications++);

    controller.add(const AuthState(
        isAuthenticated: true, userId: 'u-2', role: UserRole.data_entry));
    await pumpEventQueue();
    expect(notifications, 1);

    // profile re-load: same user, promoted role → guards must re-run
    controller.add(const AuthState(
        isAuthenticated: true, userId: 'u-2', role: UserRole.admin));
    await pumpEventQueue();
    expect(notifications, 2);

    listenable.dispose();
  });

  test('logout always notifies; repeated signed-out does not', () async {
    final controller = StreamController<AuthState>.broadcast();
    addTearDown(controller.close);
    var notifications = 0;
    final listenable = GoRouterRefreshStream(controller.stream)
      ..addListener(() => notifications++);

    controller.add(const AuthState(
        isAuthenticated: true, userId: 'u-3', role: UserRole.admin));
    await pumpEventQueue();
    expect(notifications, 1);

    controller.add(const AuthState(isAuthenticated: false));
    await pumpEventQueue();
    expect(notifications, 2, reason: 'logout is a meaningful change');

    // repeated signed-out emissions — no change
    controller.add(const AuthState(isAuthenticated: false));
    await pumpEventQueue();
    expect(notifications, 2);

    listenable.dispose();
  });
}
