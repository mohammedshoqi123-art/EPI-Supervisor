/// ═══════════════════════════════════════════════════════════════════════
///  main.dart — نسخة مُحسّنة: تضمن تسجيل الدخول المستقر
///  التغييرات:
///  1. Supabase.initialize في الخلفية عند الاوفلاين — لا ننتظر
///  2. لا signOut تلقائي أبداً
///  3. Splash فوري — لا نحظر التطبيق على init
///  4. الحفاظ على نظام الأوفلاين سليم
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

/// ═══ FIX: لا نحظر runApp على Supabase init ═══
/// السابق: await _initSupabase() → 51s حظر عند الاوفلاين (3 محاولات × 15s)
/// الجديد: ابدأ Supabase في الخلفية + runApp فوراً
/// SplashScreen يتعامل مع حالة "غير جاهز بعد"
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ═══ الخطوة 1: تحميل .env (سريع، < 100ms) ═══
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

  // ═══ الخطوة 2: Sentry + Connectivity (سريع) ═══
  await SentryConfig.init(appRunner: () async {
    try {
      // ═══ PERFORMANCE: Non-blocking — returns immediately, probes run in background ═══
      ConnectivityUtils.initialize().catchError((e) {
        debugPrint('[Init] ⚠️ Connectivity init failed: $e');
      });
    } catch (e) {
      debugPrint('[Init] ⚠️ Connectivity init failed: $e');
    }

    // ═══ FIX: لا ننتظر Supabase — ابدأه في الخلفية ═══
    // السابق: await _initSupabase() مع 3 محاولات × 15s = 51s حظر عند الاوفلاين
    // الجديد: fire-and-forget — SplashScreen ينتظر قائمة قصيرة فقط
    _initSupabaseInBackground();

    // ═══ الخطوة 4: Error Boundary + تشغيل التطبيق فوراً ═══
    // ═══ FIX: Catch all Flutter errors — show friendly error screen instead of crash ═══
    ErrorWidget.builder = (FlutterErrorDetails details) {
      debugPrint('[ErrorBoundary] ${details.exception}');
      return MaterialApp(
        home: Scaffold(
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  const Text(
                    'حدث خطأ غير متوقع',
                    style: TextStyle(fontFamily: 'Cairo', fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    details.exception.toString(),
                    style: const TextStyle(fontFamily: 'Tajawal', fontSize: 12, color: Colors.grey),
                    textAlign: TextAlign.center,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      // Restart app
                      runApp(const ProviderScope(child: EpiSupervisorApp()));
                    },
                    child: const Text('إعادة المحاولة', style: TextStyle(fontFamily: 'Tajawal')),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    };

    FlutterError.onError = (FlutterErrorDetails details) {
      debugPrint('[FlutterError] ${details.exception}');
      // Report to Sentry
      SentryConfig.captureError(details.exception, details.stack ?? StackTrace.current);
    };

    runApp(const ProviderScope(child: EpiSupervisorApp()));

    // ═══ الخطوة 5: تهيئة الخدمات غير الحرجة في الخلفية ═══
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        if (SupabaseConfig.isConfigured) {
          NotificationService.init(ApiClient());
        }
        await FcmNotificationService.init();
        await FcmNotificationService.requestPermissions();
      } catch (e) {
        debugPrint('[Init] ⚠️ NotificationService init failed: $e');
      }
    });
  });
}

/// Track whether Supabase.initialize has been called successfully
/// Public so SplashScreen can poll until ready
bool supabaseInitialized = false;

/// ═══ FIX: Supabase Init مع 3 محاولات + reconnect ═══
void _initSupabaseInBackground() {
  if (EnvValidator.isOfflineMode || SupabaseConfig.url.isEmpty) {
    debugPrint('[Init] Offline mode or no URL — skipping Supabase');
    return;
  }

  _tryInitSupabaseWithRetry().then((success) {
    if (!success) {
      debugPrint('[Init] Supabase failed — will retry on reconnect');
      StreamSubscription<bool>? connSub;
      connSub = ConnectivityUtils.onConnectivityChanged.listen((online) {
        if (online && !supabaseInitialized) {
          _tryInitSupabaseWithRetry().then((ok) {
            if (ok) connSub?.cancel();
          });
        }
      });
    }
  });
}

/// 3 محاولات: 10s, 15s, 20s
Future<bool> _tryInitSupabaseWithRetry() async {
  const timeouts = [10, 15, 20];
  const delays = [0, 3, 6];
  for (int i = 0; i < 3; i++) {
    if (supabaseInitialized) return true;
    if (delays[i] > 0) await Future.delayed(Duration(seconds: delays[i]));
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
          logLevel: RealtimeLogLevel.warn,
        ),
        storageOptions: const StorageClientOptions(retryAttempts: 3),
      ).timeout(Duration(seconds: timeouts[i]));
      supabaseInitialized = true;
      debugPrint('[Init] ✅ Supabase initialized (attempt ${i + 1})');
      return true;
    } catch (e) {
      debugPrint('[Init] ❌ Attempt ${i + 1}/3 failed: $e');
    }
  }
  return false;
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
    // ═══ FIX: انتظر حتى Supabase جاهز فعلاً قبل تهيئة Realtime ═══
    // السابق: Future.delayed(3s) — قد يحاول قبل Supabase.init ينتهي
    // الجديد: polling على supabaseInitialized flag
    _waitForSupabaseReady().then((_) {
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

  /// Wait until Supabase is initialized (max 30 seconds)
  Future<void> _waitForSupabaseReady() async {
    for (int i = 0; i < 30; i++) {
      if (supabaseInitialized) return;
      await Future.delayed(const Duration(seconds: 1));
    }
    debugPrint('[App] Supabase not ready after 30s — skipping realtime sync');
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
