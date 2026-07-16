import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

/// ═══════════════════════════════════════════════════════════════
///  FCM Push Notifications Service
///
///  Handles:
///  - Firebase initialization
///  - FCM token registration
///  - Foreground message handling
///  - Background message handling
///  - Token refresh tracking
/// ═══════════════════════════════════════════════════════════════

/// Background message handler — MUST be a top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('[FCM] Background message: ${message.messageId}');
  // Background messages are handled by the system notification tray
}

class FcmNotificationService {
  static bool _initialized = false;
  static String? _token;
  static final _messageController = StreamController<RemoteMessage>.broadcast();

  /// Stream of foreground messages
  static Stream<RemoteMessage> get onMessage => _messageController.stream;

  /// Current FCM token
  static String? get token => _token;

  /// Initialize Firebase and FCM
  static Future<void> init() async {
    if (_initialized) return;

    try {
      // Initialize Firebase
      await Firebase.initializeApp();

      // Register background handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Request permission (iOS + Android 13+)
      final settings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      debugPrint('[FCM] Permission status: ${settings.authorizationStatus}');

      // Get FCM token
      _token = await FirebaseMessaging.instance.getToken();
      debugPrint('[FCM] Token: ${_token?.substring(0, 20)}...');

      // Listen for token refresh
      FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
        _token = newToken;
        debugPrint('[FCM] Token refreshed: ${newToken.substring(0, 20)}...');
        // TODO: Send new token to server
      });

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('[FCM] Foreground message: ${message.notification?.title}');
        _messageController.add(message);
      });

      // Handle message when app is opened from notification
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[FCM] App opened from notification: ${message.data}');
        // TODO: Navigate to relevant screen based on message data
      });

      // Check if app was opened from a notification
      final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('[FCM] App launched from notification: ${initialMessage.data}');
        // TODO: Navigate to relevant screen
      }

      _initialized = true;
      debugPrint('[FCM] ✅ Initialized successfully');
    } catch (e) {
      debugPrint('[FCM] ❌ Initialization failed: $e');
      // Don't rethrow — app should work without push notifications
    }
  }

  /// Subscribe to a topic (e.g., 'all_users', 'governorate_aden')
  static Future<void> subscribeToTopic(String topic) async {
    try {
      await FirebaseMessaging.instance.subscribeToTopic(topic);
      debugPrint('[FCM] Subscribed to topic: $topic');
    } catch (e) {
      debugPrint('[FCM] Failed to subscribe to topic $topic: $e');
    }
  }

  /// Unsubscribe from a topic
  static Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await FirebaseMessaging.instance.unsubscribeFromTopic(topic);
      debugPrint('[FCM] Unsubscribed from topic: $topic');
    } catch (e) {
      debugPrint('[FCM] Failed to unsubscribe from topic $topic: $e');
    }
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
}
