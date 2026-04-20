import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb, kDebugMode;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';

import 'router/app_router.dart';
import 'screens/onboarding_screen.dart';

// Theme mode provider
final themeModeProvider = StateProvider<ThemeMode>((_) => ThemeMode.system);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Global error handler for uncaught Flutter errors
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('Flutter Error: ${details.exception}');
    debugPrint('Stack: ${details.stack}');
  };

  // Set error widget builder BEFORE runApp — catches build errors gracefully
  ErrorWidget.builder = (FlutterErrorDetails details) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Container(
        color: const Color(0xFFF5F5F5),
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              const Text(
                'حدث خطأ في عرض الصفحة',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF333333),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                details.exceptionAsString(),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 12,
                  color: Color(0xFF666666),
                ),
                maxLines: 5,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  };

  // ─── Load .env file BEFORE any validation ────────────────────
  final dotenv = await EnvLoader.load();
  if (dotenv.isNotEmpty) {
    SupabaseConfig.setFromEnv(
      url: dotenv['SUPABASE_URL'] ?? '',
      anonKey: dotenv['SUPABASE_ANON_KEY'] ?? '',
    );
  }

  // Validate all environment variables first
  try {
    EnvValidator.validate();
  } catch (e) {
    runApp(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  const Text(
                    'خطأ في الإعدادات',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    e.toString(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontFamily: 'Tajawal'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    return;
  }

  // Initialize connectivity monitoring
  try {
    await ConnectivityUtils.initialize();
  } catch (e) {
    debugPrint('ConnectivityUtils init failed: $e');
  }

  // Initialize Supabase only if online mode is available
  if (!EnvValidator.isOfflineMode) {
    try {
      SupabaseConfig.validate();
      await Supabase.initialize(
        url: SupabaseConfig.url,
        anonKey: SupabaseConfig.anonKey,
        debug: AppConfig.isDevelopment,
      );
    } catch (e) {
      runApp(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.red,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'خطأ في إعدادات Supabase',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      e.toString(),
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontFamily: 'Tajawal'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
      return;
    }
  }

  // Initialize Notification Service with API client
  try {
    if (SupabaseConfig.isConfigured) {
      NotificationService.init(ApiClient());
    }
  } catch (e) {
    debugPrint('NotificationService init failed: $e');
  }

  // Lock to portrait on mobile only (web supports all orientations)
  if (!kIsWeb) {
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
  }

  // Set system overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  // Run app first — Sentry will init after first frame (non-blocking)
  runApp(const ProviderScope(child: EpiSupervisorApp()));

  // Defer Sentry init — skip on web (not supported)
  if (SentryConfig.isEnabled && !kIsWeb) {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        await SentryFlutter.init((options) {
          options.dsn = const String.fromEnvironment(
            'SENTRY_DSN',
            defaultValue: '',
          );
          options.environment = const String.fromEnvironment(
            'ENV',
            defaultValue: 'development',
          );
          options.release = 'epi-supervisor@${AppConfig.appVersion}';
          options.tracesSampleRate = 0.2;
          options.enableAutoPerformanceTracing = false;
          options.attachStacktrace = true;
        }).timeout(const Duration(seconds: 8));
      } catch (e) {
        debugPrint('[Sentry] Deferred init failed: $e');
      }
    });
  }
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
  }

  Future<void> _checkOnboarding() async {
    try {
      final completed = await OnboardingScreen.isCompleted()
          .timeout(const Duration(seconds: 5), onTimeout: () => true);
      if (mounted) {
        setState(() {
          _showOnboarding = !completed;
          _checkingOnboarding = false;
        });
      }
    } catch (e) {
      // If onboarding check fails (e.g. on web), skip it
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
