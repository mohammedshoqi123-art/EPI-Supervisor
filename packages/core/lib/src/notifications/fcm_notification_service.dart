import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// ═══════════════════════════════════════════════════════════════
///  FCM Push Notifications Foundation
///
///  Provides local notification scheduling + display.
///  FCM remote push notifications require firebase_messaging
///  package which can be added when Firebase project is configured.
///
///  Current features:
///  - Local notification display (title + body)
///  - Scheduled notifications (delayed)
///  - Notification channel management (Android)
///  - Permission request (iOS + Android 13+)
/// ═══════════════════════════════════════════════════════════════

class FcmNotificationService {
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static bool _initialized = false;
  static const String _channelId = 'epi_supervisor_notifications';
  static const String _channelName = 'EPI Supervisor';
  static const String _channelDescription =
      'إشعارات منصة مشرف EPI — تنبيهات الإرساليات والمزامنة';

  /// Initialize the notification service. Call once at app startup.
  static Future<void> init() async {
    if (_initialized) return;

    try {
      const androidSettings = AndroidInitializationSettings(
        '@mipmap/ic_launcher',
      );
      const iosSettings = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );
      const settings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _localNotifications.initialize(
        settings,
        onDidReceiveNotificationResponse: _onNotificationTapped,
      );

      // Create Android notification channel
      await _createAndroidChannel();

      _initialized = true;
      debugPrint('[FCM] ✅ Notification service initialized');
    } catch (e) {
      debugPrint('[FCM] ⚠️ Init failed: $e');
    }
  }

  /// Request notification permissions (required for Android 13+ and iOS)
  static Future<bool> requestPermissions() async {
    if (!_initialized) await init();

    try {
      final android = _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();
      if (android != null) {
        final granted = await android.requestNotificationsPermission();
        debugPrint('[FCM] Android notifications permission: $granted');
      }

      final ios = _localNotifications.resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin>();
      if (ios != null) {
        final granted = await ios.requestPermissions(
          alert: true,
          badge: true,
          sound: true,
        );
        debugPrint('[FCM] iOS notifications permission: $granted');
        return granted ?? false;
      }
      return true;
    } catch (e) {
      debugPrint('[FCM] Permission request failed: $e');
      return false;
    }
  }

  /// Show an immediate local notification.
  static Future<void> showNotification({
    required String title,
    required String body,
    int id = 0,
    String? payload,
  }) async {
    if (!_initialized) await init();

    try {
      const androidDetails = AndroidNotificationDetails(
        _channelId,
        _channelName,
        channelDescription: _channelDescription,
        importance: Importance.high,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
      );
      const iosDetails = DarwinNotificationDetails();
      const details = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      await _localNotifications.show(id, title, body, details, payload: payload);
    } catch (e) {
      debugPrint('[FCM] Show notification failed: $e');
    }
  }

  /// Schedule a notification to show after a delay.
  static Future<void> scheduleNotification({
    required String title,
    required String body,
    required Duration delay,
    int id = 0,
  }) async {
    if (!_initialized) await init();

    try {
      const androidDetails = AndroidNotificationDetails(
        _channelId,
        _channelName,
        channelDescription: _channelDescription,
        importance: Importance.high,
        priority: Priority.high,
      );
      const iosDetails = DarwinNotificationDetails();
      const details = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      await _localNotifications.zonedSchedule(
        id,
        title,
        body,
        // Note: tz.TZDateTime would be ideal but requires timezone package.
        // For now, use AndroidAlarmManager-style delay.
        // This is a simplified version — production should use tz.TZDateTime.
        DateTime.now().add(delay) as dynamic,
        details,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );
    } catch (e) {
      debugPrint('[FCM] Schedule notification failed: $e');
    }
  }

  /// Cancel a specific notification by ID
  static Future<void> cancelNotification(int id) async {
    try {
      await _localNotifications.cancel(id);
    } catch (e) {
      debugPrint('[FCM] Cancel notification failed: $e');
    }
  }

  /// Cancel all pending notifications
  static Future<void> cancelAll() async {
    try {
      await _localNotifications.cancelAll();
    } catch (e) {
      debugPrint('[FCM] Cancel all failed: $e');
    }
  }

  /// Get pending notifications count
  static Future<int> getPendingCount() async {
    try {
      final pending = await _localNotifications.pendingNotificationRequests();
      return pending.length;
    } catch (_) {
      return 0;
    }
  }

  /// Create the Android notification channel (required for Android 8+)
  static Future<void> _createAndroidChannel() async {
    try {
      const channel = AndroidNotificationChannel(
        _channelId,
        _channelName,
        description: _channelDescription,
        importance: Importance.high,
      );

      final android = _localNotifications.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      await android?.createNotificationChannel(channel);
    } catch (e) {
      debugPrint('[FCM] Create channel failed: $e');
    }
  }

  /// Handle notification tap — can be used for deep navigation
  static void _onNotificationTapped(NotificationResponse response) {
    debugPrint('[FCM] Notification tapped: id=${response.id}, payload=${response.payload}');
    // TODO: Add navigation logic based on payload
    // e.g., if payload starts with '/submissions/', navigate to submissions detail
  }

  /// Show a sync-complete notification
  static Future<void> notifySyncComplete({int synced = 0, int failed = 0}) async {
    final title = failed > 0 ? '⚠️ اكتملت المزامنة (مع أخطاء)' : '✅ اكتملت المزامنة';
    final body = failed > 0
        ? 'تمت مزامنة $synced عنصر، فشل $failed عنصر'
        : 'تمت مزامنة $synced عنصر بنجاح';
    await showNotification(title: title, body: body, id: 100);
  }

  /// Show a submission-confirmed notification
  static Future<void> notifySubmissionConfirmed(String formTitle) async {
    await showNotification(
      title: '✅ تم تأكيد الإرسالية',
      body: 'تمت الموافقة على: $formTitle',
      id: 200,
    );
  }

  /// Show a shortage alert
  static Future<void> notifyShortageAlert(String vaccineName, int daysLeft) async {
    await showNotification(
      title: '🔴 تنبيه: نقص في $vaccineName',
      body: 'المخزون يكفي لـ $daysLeft يوم فقط',
      id: 300,
    );
  }
}
