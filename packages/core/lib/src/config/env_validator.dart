import 'package:flutter/foundation.dart';
import 'supabase_config.dart';

/// Validates required environment variables at startup.
/// Supports offline-first mode where Supabase is optional.
class EnvValidator {
  static const bool _offlineMode = bool.fromEnvironment(
    'OFFLINE_MODE',
    defaultValue: false,
  );

  /// Whether the app is running in full offline mode
  static bool get isOfflineMode => _offlineMode || SupabaseConfig.url.isEmpty;

  /// Validate all required environment variables.
  /// In offline mode, Supabase checks are skipped entirely.
  static void validate() {
    if (isOfflineMode) {
      if (kDebugMode) {
        debugPrint('📴 Offline mode — skipping Supabase env validation');
      }
      return;
    }

    final errors = <String>[];

    final supabaseUrl = SupabaseConfig.url;
    final supabaseKey = SupabaseConfig.anonKey;

    if (supabaseUrl.isEmpty || _isPlaceholder(supabaseUrl)) {
      errors.add('SUPABASE_URL is not configured');
    } else if (!supabaseUrl.startsWith('https://')) {
      errors.add('SUPABASE_URL: Must start with https://');
    }

    if (supabaseKey.isEmpty || _isPlaceholder(supabaseKey)) {
      errors.add('SUPABASE_ANON_KEY is not configured');
    } else if (supabaseKey.length < 32) {
      errors.add('SUPABASE_ANON_KEY: Key too short (expected >= 32 chars)');
    }

    // Optional variables — warn but don't fail
    const geminiKey = String.fromEnvironment(
      'GEMINI_API_KEY',
      defaultValue: '',
    );
    const sentryDsn = String.fromEnvironment('SENTRY_DSN', defaultValue: '');
    const encKey = String.fromEnvironment('ENCRYPTION_KEY', defaultValue: '');

    // ═══ ENCRYPTION_KEY: مطلوب في الإنتاج — بدونه التطبيق ي crash ═══
    if (encKey.isEmpty || _isPlaceholder(encKey)) {
      if (kDebugMode) {
        debugPrint(
          '🚨 CRITICAL: ENCRYPTION_KEY is not configured. '
          'Local storage encryption will FAIL at runtime — '
          'pass --dart-define=ENCRYPTION_KEY=<32+ chars> when building.',
        );
      }
      if (!kDebugMode) {
        errors.add('ENCRYPTION_KEY is not configured (required for offline storage)');
      }
    } else if (encKey.length < 32) {
      if (kDebugMode) {
        debugPrint('⚠️ ENCRYPTION_KEY too short (${encKey.length} chars, need >= 32)');
      }
      if (!kDebugMode) {
        errors.add('ENCRYPTION_KEY too short (${encKey.length} chars, need >= 32)');
      }
    }

    if (kDebugMode) {
      if (geminiKey.isEmpty || _isPlaceholder(geminiKey)) {
        debugPrint('⚠️ Optional: GEMINI_API_KEY not configured');
      }
      if (sentryDsn.isEmpty || _isPlaceholder(sentryDsn)) {
        debugPrint('⚠️ Optional: SENTRY_DSN not configured');
      }
    }

    if (errors.isNotEmpty) {
      final message =
          'Environment validation failed:\n${errors.map((e) => '  ❌ $e').join('\n')}';
      if (kDebugMode) print('🚨 $message');
      throw StateError(message);
    }

    if (kDebugMode) print('✅ Environment variables validated');
  }

  /// Validate without throwing — returns list of errors
  static List<String> validateQuiet() {
    if (isOfflineMode) return [];
    final errors = <String>[];
    final supabaseUrl = SupabaseConfig.url;
    final supabaseKey = SupabaseConfig.anonKey;

    if (supabaseUrl.isEmpty || _isPlaceholder(supabaseUrl)) {
      errors.add('SUPABASE_URL is not configured');
    }
    if (supabaseKey.isEmpty || _isPlaceholder(supabaseKey)) {
      errors.add('SUPABASE_ANON_KEY is not configured');
    }
    return errors;
  }

  static bool _isPlaceholder(String value) {
    final lower = value.toLowerCase();
    return lower.contains('change_me') ||
        lower.contains('your-') ||
        lower.contains('placeholder') ||
        lower.contains('xxx') ||
        lower == 'default';
  }
}
