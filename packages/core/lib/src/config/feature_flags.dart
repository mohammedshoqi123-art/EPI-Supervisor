import 'package:flutter/foundation.dart';

/// Simple feature flags for controlled rollouts.
///
/// Usage:
/// ```dart
/// if (FeatureFlags.aiChat) {
///   // Show AI chat feature
/// }
/// ```
///
/// Flags can be overridden at runtime via [setOverride] for A/B testing.
class FeatureFlags {
  FeatureFlags._();

  static final Map<String, bool> _overrides = {};

  // ─── Default Flag Values ──────────────────────────────────
  // Set to false to disable features in production without code changes.

  /// AI Chat assistant (requires Gemini API key)
  static bool get aiChat => _get('aiChat', defaultValue: true);

  /// Offline sync v2 (enhanced conflict resolution)
  static bool get syncV2 => _get('syncV2', defaultValue: true);

  /// Map heatmap layer
  static bool get mapHeatmap => _get('mapHeatmap', defaultValue: true);

  /// PDF/Word report generation
  static bool get reportGeneration => _get('reportGeneration', defaultValue: true);

  /// Push notifications
  static bool get pushNotifications => _get('pushNotifications', defaultValue: false);

  /// Biometric authentication
  static bool get biometricAuth => _get('biometricAuth', defaultValue: false);

  /// In-app analytics dashboard
  static bool get analyticsDashboard => _get('analyticsDashboard', defaultValue: true);

  /// Multi-language support (currently Arabic only)
  static bool get multiLanguage => _get('multiLanguage', defaultValue: false);

  // ─── Runtime Overrides ────────────────────────────────────

  /// Set a runtime override for a flag (for A/B testing or remote config).
  static void setOverride(String flag, bool value) {
    _overrides[flag] = value;
  }

  /// Clear all overrides.
  static void clearOverrides() {
    _overrides.clear();
  }

  /// Get all current flag values (for debugging).
  static Map<String, bool> getAllFlags() {
    return {
      'aiChat': aiChat,
      'syncV2': syncV2,
      'mapHeatmap': mapHeatmap,
      'reportGeneration': reportGeneration,
      'pushNotifications': pushNotifications,
      'biometricAuth': biometricAuth,
      'analyticsDashboard': analyticsDashboard,
      'multiLanguage': multiLanguage,
    };
  }

  // ─── Internal ─────────────────────────────────────────────
  static bool _get(String flag, {required bool defaultValue}) {
    if (_overrides.containsKey(flag)) return _overrides[flag]!;
    return defaultValue;
  }
}
