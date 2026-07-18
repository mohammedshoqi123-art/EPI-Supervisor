import 'package:flutter/foundation.dart';
import 'package:epi_core/epi_core.dart';

/// ═══════════════════════════════════════════════════════════════
///  Firebase Initialization for Mobile App
///
///  This is a STUB that initializes FcmNotificationService without
///  requiring Firebase packages at compile time.
///
///  To enable real Firebase push notifications:
///  1. Add firebase_core + firebase_messaging to pubspec.yaml
///  2. Add google-services.json (Android) / GoogleService-Info.plist (iOS)
///  3. Replace this file with the full Firebase implementation
/// ═══════════════════════════════════════════════════════════════

class FirebaseMobileService {
  static bool _initialized = false;

  /// Initialize — currently a stub, extend with real Firebase when ready
  static Future<void> init() async {
    if (_initialized) return;

    try {
      // Initialize the core FCM service (without Firebase — just logging)
      await FcmNotificationService.init();

      _initialized = true;
      debugPrint('[Firebase] ✅ Service initialized (stub mode)');
      debugPrint('[Firebase] To enable real push notifications:');
      debugPrint('[Firebase] 1. Add firebase_core + firebase_messaging to pubspec.yaml');
      debugPrint('[Firebase] 2. Configure google-services.json / GoogleService-Info.plist');
      debugPrint('[Firebase] 3. Replace this stub with full implementation');
    } catch (e) {
      debugPrint('[Firebase] ❌ Init failed: $e');
    }
  }
}
