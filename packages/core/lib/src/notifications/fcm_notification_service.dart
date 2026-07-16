import 'dart:async';
import 'package:flutter/foundation.dart';

/// ═══════════════════════════════════════════════════════════════
///  FCM Push Notifications Service
///
///  This is a lightweight wrapper. Firebase initialization happens
///  in the mobile app's main.dart. This service provides the
///  interface for token management and message handling.
///
///  Full Firebase integration requires:
///  - firebase_core + firebase_messaging in mobile pubspec.yaml
///  - google-services.json (Android) / GoogleService-Info.plist (iOS)
/// ═══════════════════════════════════════════════════════════════

class FcmNotificationService {
  static bool _initialized = false;
  static String? _token;
  static final _messageController = StreamController<Map<String, dynamic>>.broadcast();

  /// Stream of foreground messages (as raw maps)
  static Stream<Map<String, dynamic>> get onMessage => _messageController.stream;

  /// Current FCM token
  static String? get token => _token;

  /// Whether the service is initialized
  static bool get isInitialized => _initialized;

  /// Initialize — called from mobile app after Firebase init
  static Future<void> init({String? token}) async {
    _token = token;
    _initialized = true;
    debugPrint('[FCM] Service initialized (token: ${token?.substring(0, 20)}...)');
  }

  /// Update token (called when Firebase refreshes it)
  static void updateToken(String newToken) {
    _token = newToken;
    debugPrint('[FCM] Token updated: ${newToken.substring(0, 20)}...');
  }

  /// Push a message to the stream (called from Firebase message handler)
  static void handleMessage(Map<String, dynamic> data) {
    _messageController.add(data);
  }

  /// Subscribe to a topic
  static Future<void> subscribeToTopic(String topic) async {
    debugPrint('[FCM] Subscribe to topic: $topic (implement in mobile app)');
  }

  /// Unsubscribe from a topic
  static Future<void> unsubscribeFromTopic(String topic) async {
    debugPrint('[FCM] Unsubscribe from topic: $topic (implement in mobile app)');
  }

  /// Send token to server for registration
  static Future<void> registerTokenWithServer({
    required Future<void> Function(String token) registerFn,
  }) async {
    if (_token == null) return;
    try {
      await registerFn(_token!);
      debugPrint('[FCM] Token registered with server');
    } catch (e) {
      debugPrint('[FCM] Failed to register token: $e');
    }
  }

  /// Show a sync-complete notification (local)
  static Future<void> notifySyncComplete({int synced = 0, int failed = 0}) async {
    final title = failed > 0 ? '⚠️ اكتملت المزامنة (مع أخطاء)' : '✅ اكتملت المزامنة';
    final body = failed > 0
        ? 'تمت مزامنة $synced عنصر، فشل $failed عنصر'
        : 'تمت مزامنة $synced عنصر بنجاح';
    debugPrint('[FCM] Notification: $title — $body');
  }

  /// Show a submission-confirmed notification (local)
  static Future<void> notifySubmissionConfirmed(String formTitle) async {
    debugPrint('[FCM] Notification: ✅ تم تأكيد الإرسالية — $formTitle');
  }

  /// Show a shortage alert (local)
  static Future<void> notifyShortageAlert(String vaccineName, int daysLeft) async {
    debugPrint('[FCM] Notification: 🔴 تنبيه نقص — $vaccineName ($daysLeft يوم)');
  }
}
