/// ═══════════════════════════════════════════════════════════════════════
///  main.dart — نسخة مُحسّنة: تضمن تسجيل الدخول المستقر
///  التغييرات:
///  1. Supabase.initialize مُزامن (await) قبل runApp
///  2. لا signOut تلقائي أبداً
///  3. إعادة محاولة init عند الفشل (مع backoff)
///  4. Splash screen ينتظر الجلسة قبل التوجيه
///  5. الحفاظ على نظام الأوفلاين سليم
/// ═══════════════════════════════════════════════════════════════════════

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';

import 'router/app_router.dart';
import 'screens/onboarding_screen.dart';
import 'providers/realtime_sync_provider.dart';

final themeModeProvider = StateProvider<ThemeMode>((_) => ThemeMode.system);

/// حالة تهيئة Supabase
final supabaseInitProvider =
    StateProvider<SupabaseInitState>((_) => SupabaseInitState.initial);

enum SupabaseInitState { initial, initializing, ready, failed }

/// ═══ FIX: تهيئة Supabase مُزامنة قبل runApp لتجنب race condition ═══
/// Sentry يتم تهيئته أولاً لالتقاط أي أخطاء أثناء الإقلاع.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ═══ الخطوة 1: تحميل .env أولاً (يحتوي على SENTRY_DSN) ═══
  try {
    final dotenv = await EnvLoader.load();
    if (dotenv.isNotEmpty) {
      SupabaseConfig.setFromEnv(
        url: dotenv['SUPABASE_URL'] ?? '',
        anonKey: dotenv['SUPABASE_ANON_KEY'] ?? '',
      );
    }
  } catch (e) {
    debugPrint('[Init] ⚠️ Env load failed: $e');
  }

  // ═══ الخطوة 2: تهيئة Sentry (يلتقط كل الأخطاء بعدها) ═══
  await SentryConfig.init(appRunner: () async {
    // ═══ الخطوة 3: تهيئة Connectivity ═══
    try {
      await ConnectivityUtils.initialize().timeout(const Duration(seconds: 5));
    } catch (e) {
      debugPrint('[Init] ⚠️ Connectivity init failed: $e');
    }

    // ═══ الخطوة 4: تهيئة Supabase مُزامنة (await) قبل runApp ═══
    await _initSupabase();

    // ═══ الخطوة 5: تشغيل التطبيق بعد التهيئة ═══
    runApp(const ProviderScope(child: EpiSupervisorApp()));

    // ═══ الخطوة 6: تهيئة الخدمات غير الحرجة في الخلفية ═══
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        if (SupabaseConfig.isConfigured) {
          NotificationService.init(ApiClient());
        }
      } catch (e) {
        debugPrint('[Init] ⚠️ NotificationService init failed: $e');
      }
    });
  });
}

/// ═══ تهيئة Supabase مع إعادة محاولة (3 محاولات مع backoff) ═══
Future<void> _initSupabase() async {
  if (EnvValidator.isOfflineMode || SupabaseConfig.url.isEmpty) {
    debugPrint('[Init] Offline mode or no URL — skipping Supabase');
    return;
  }

  const maxRetries = 3;
  for (int attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      SupabaseConfig.validate();

      await Supabase.initialize(
        url: SupabaseConfig.url,
        anonKey: SupabaseConfig.anonKey,
        debug: AppConfig.isDevelopment,
        authOptions: const FlutterAuthClientOptions(
          authFlowType: AuthFlowType.pkce,
          autoRefreshToken: true,
        ),
        realtimeClientOptions: const RealtimeClientOptions(
          logLevel: RealtimeLogLevel.warn, // ═══ PERFORMANCE: warn instead of info ═══
        ),
        storageOptions: const StorageClientOptions(
          retryAttempts: 3,
        ),
      ).timeout(const Duration(seconds: 15)); // ═══ Reduced from 20s ═══

      debugPrint('[Init] ✅ Supabase initialized (attempt $attempt)');
      return;
    } catch (e) {
      debugPrint('[Init] ❌ Supabase attempt $attempt/$maxRetries failed: $e');
      if (attempt < maxRetries) {
        final delay = Duration(seconds: 2 * attempt); // ═══ Reduced backoff ═══
        debugPrint('[Init] Retrying in ${delay.inSeconds}s...');
        await Future.delayed(delay);
      }
    }
  }

  debugPrint(
      '[Init] ⚠️ Supabase failed after $maxRetries attempts — running offline');
}

class EpiSupervisorApp extends ConsumerStatefulWidget {
  const EpiSupervisorApp({super.key});

  @override
  ConsumerState<EpiSupervisorApp> createState() => _EpiSupervisorAppState();
}

class _EpiSupervisorAppState extends ConsumerState<EpiSupervisorApp> {
  bool _showOnboarding = false;
  bool _checkingOnboarding = true;

  @override
  void initState() {
    super.initState();
    _checkOnboarding();
    // ═══ Start Realtime Sync — listen for admin dashboard changes ═══
    _initRealtimeSync();
  }

  void _initRealtimeSync() {
    // Delay to ensure Supabase is ready
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        try {
          ref.read(realtimeSyncProvider);
          debugPrint('[App] Realtime sync initialized');
        } catch (e) {
          debugPrint('[App] Realtime sync failed: $e');
        }
      }
    });
  }

  Future<void> _checkOnboarding() async {
    try {
      // Fix: default to false (show onboarding) on timeout — safer to show
      // onboarding twice than to skip it entirely on slow devices.
      final completed = await OnboardingScreen.isCompleted()
          .timeout(const Duration(seconds: 5), onTimeout: () => false);
      if (mounted) {
        setState(() {
          _showOnboarding = !completed;
          _checkingOnboarding = false;
        });
      }
    } catch (e) {
      debugPrint('Onboarding check failed: $e');
      if (mounted) {
        setState(() {
          _showOnboarding = false;
          _checkingOnboarding = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checkingOnboarding) {
      return const MaterialApp(
        home: Scaffold(body: Center(child: CircularProgressIndicator())),
      );
    }

    if (_showOnboarding) {
      return MaterialApp(
        title: AppConfig.appNameAr,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ref.watch(themeModeProvider),
        locale: const Locale('ar', 'IQ'),
        supportedLocales: const [Locale('ar', 'IQ'), Locale('en', 'US')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: Directionality(
          textDirection: TextDirection.rtl,
          child: OnboardingScreen(
            onComplete: () => setState(() => _showOnboarding = false),
          ),
        ),
      );
    }

    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: AppConfig.appNameAr,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ref.watch(themeModeProvider),
      routerConfig: router,
      locale: const Locale('ar', 'IQ'),
      supportedLocales: const [Locale('ar', 'IQ'), Locale('en', 'US')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      builder: (context, child) {
        return Directionality(textDirection: TextDirection.rtl, child: child!);
      },
    );
  }
}
