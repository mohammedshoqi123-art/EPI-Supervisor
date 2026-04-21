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
  if (kIsWeb) debugPrint('[INIT] Flutter binding initialized');

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
  if (kIsWeb) debugPrint('[INIT] EnvLoader done, dotenv keys: ${dotenv.keys.length}');
  if (dotenv.isNotEmpty) {
    SupabaseConfig.setFromEnv(
      url: dotenv['SUPABASE_URL'] ?? '',
      anonKey: dotenv['SUPABASE_ANON_KEY'] ?? '',
    );
  }

  // Validate all environment variables first
  try {
    EnvValidator.validate();
    if (kIsWeb) debugPrint('[INIT] EnvValidator passed');
  } catch (e) {
    if (kIsWeb) debugPrint('[INIT] EnvValidator FAILED: $e');
    // In web, show a nicer error page instead of crashing
    if (kIsWeb) {
      runApp(_ErrorApp(
        title: 'خطأ في الإعدادات',
        message: 'لم يتم تكوين متغيرات البيئة.\nيرجى إضافة SUPABASE_URL و SUPABASE_ANON_KEY في GitHub Secrets ثم إعادة النشر.',
      ));
      return;
    }
    runApp(_ErrorApp(title: 'خطأ في الإعدادات', message: e.toString()));
    return;
  }

  // Initialize connectivity monitoring
  try {
    if (kIsWeb) debugPrint('[INIT] ConnectivityUtils starting...');
    await ConnectivityUtils.initialize();
    if (kIsWeb) debugPrint('[INIT] ConnectivityUtils done');
  } catch (e) {
    debugPrint('ConnectivityUtils init failed: $e');
  }

  // Initialize Supabase only if online mode is available
  if (!EnvValidator.isOfflineMode) {
    try {
      SupabaseConfig.validate();
      if (kIsWeb) debugPrint('[INIT] Supabase.initialize starting... URL: ${SupabaseConfig.url}');
      await Supabase.initialize(
        url: SupabaseConfig.url,
        anonKey: SupabaseConfig.anonKey,
        debug: AppConfig.isDevelopment,
      ).timeout(const Duration(seconds: 15));
      if (kIsWeb) debugPrint('[INIT] Supabase.initialize done');
    } catch (e) {
      if (kIsWeb) debugPrint('[INIT] Supabase.initialize FAILED: $e');
      runApp(_ErrorApp(title: 'خطأ في إعدادات Supabase', message: e.toString()));
      return;
    }
  } else {
    if (kIsWeb) debugPrint('[INIT] Offline mode, skipping Supabase');
  }

  // Initialize Notification Service with API client
  try {
    if (kIsWeb) debugPrint('[INIT] NotificationService starting...');
    if (SupabaseConfig.isConfigured) {
      NotificationService.init(ApiClient());
    }
    if (kIsWeb) debugPrint('[INIT] NotificationService done');
  } catch (e) {
    debugPrint('NotificationService init failed: $e');
  }

  if (kIsWeb) debugPrint('[INIT] runApp() starting...');
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

/// Web-safe error app — shows error message with proper MaterialApp setup
class _ErrorApp extends StatelessWidget {
  final String title;
  final String message;
  const _ErrorApp({required this.title, required this.message});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar', 'IQ'),
      supportedLocales: const [Locale('ar', 'IQ')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: Directionality(
        textDirection: TextDirection.rtl,
        child: Scaffold(
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
                  const SizedBox(height: 8),
                  Text(message, textAlign: TextAlign.center, style: const TextStyle(fontFamily: 'Tajawal')),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
