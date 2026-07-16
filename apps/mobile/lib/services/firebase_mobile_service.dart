import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:epi_core/epi_core.dart';

/// ═══════════════════════════════════════════════════════════════
///  Firebase Initialization for Mobile App
///
///  Call from main.dart before runApp():
///    await FirebaseMobileService.init();
/// ═══════════════════════════════════════════════════════════════

/// Background message handler — MUST be top-level
@pragma('vm:entry-point')
Future<void> firebaseBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('[Firebase] Background message: ${message.notification?.title}');
}

class FirebaseMobileService {
  static bool _initialized = false;

  /// Initialize Firebase + FCM + register token
  static Future<void> init() async {
    if (_initialized) return;

    try {
      // Initialize Firebase
      await Firebase.initializeApp();

      // Register background handler
      FirebaseMessaging.onBackgroundMessage(firebaseBackgroundHandler);

      // Request permission
      final settings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      debugPrint('[Firebase] Permission: ${settings.authorizationStatus}');

      // Get FCM token
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        debugPrint('[Firebase] Token: ${token.substring(0, 20)}...');
        // Register with core service
        await FcmNotificationService.init(token: token);
        // TODO: Register token with Supabase (call register_device_token RPC)
      }

      // Token refresh
      FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
        FcmNotificationService.updateToken(newToken);
        // TODO: Update token on server
      });

      // Foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('[Firebase] Foreground: ${message.notification?.title}');
        FcmNotificationService.handleMessage({
          'title': message.notification?.title ?? '',
          'body': message.notification?.body ?? '',
          'data': message.data,
        });
      });

      // App opened from notification
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[Firebase] Opened from notification: ${message.data}');
        // TODO: Navigate based on message data
      });

      _initialized = true;
      debugPrint('[Firebase] ✅ Initialized');
    } catch (e) {
      debugPrint('[Firebase] ❌ Init failed: $e');
      // App should work without Firebase
      await FcmNotificationService.init();
    }
  }
}
