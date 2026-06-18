import 'package:flutter/foundation.dart';

/// ═══════════════════════════════════════════════════════════════
///  FCM Push Notifications Foundation (Stub)
///
///  This is a stub implementation. The full implementation requires
///  flutter_local_notifications package, which is currently incompatible
///  with the project's Kotlin version (kotlin-stdlib 2.2.0 conflict).
///
///  When the Kotlin ecosystem stabilizes, add flutter_local_notifications
///  to pubspec.yaml and implement the full methods below.
///
///  All methods are no-ops in this stub — they log but don't show
///  actual notifications.
/// ═══════════════════════════════════════════════════════════════

class FcmNotificationService {
  static bool _initialized = false;

  /// Initialize the notification service. Call once at app startup.
  static Future<void> init() async {
    _initialized = true;
    debugPrint('[FCM] Notification service initialized (stub mode)');
  }

  /// Request notification permissions
  static Future<bool> requestPermissions() async {
    debugPrint('[FCM] Permission request (stub mode — always true)');
    return true;
  }

  /// Show an immediate local notification.
  static Future<void> showNotification({
    required String title,
    required String body,
    int id = 0,
    String? payload,
  }) async {
    debugPrint('[FCM] Notification (stub): $title — $body');
  }

  /// Schedule a notification to show after a delay.
  static Future<void> scheduleNotification({
    required String title,
    required String body,
    required Duration delay,
    int id = 0,
  }) async {
    debugPrint('[FCM] Scheduled notification (stub): $title in ${delay.inSeconds}s');
  }

  /// Cancel a specific notification by ID
  static Future<void> cancelNotification(int id) async {
    debugPrint('[FCM] Cancel notification $id (stub)');
  }

  /// Cancel all pending notifications
  static Future<void> cancelAll() async {
    debugPrint('[FCM] Cancel all (stub)');
  }

  /// Get pending notifications count
  static Future<int> getPendingCount() async => 0;

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
