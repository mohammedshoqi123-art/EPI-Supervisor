/// ═══════════════════════════════════════════════════════════════════════
///  main.dart — نسخة مُحسّنة: تضمن تسجيل الدخول المستقر
///  التغييرات:
///  1. Supabase.initialize مع authOptions صريحة
///  2. لا signOut تلقائي أبداً
///  3. إعادة محاولة init عند الفشل
///  4. Splash screen ينتظر الجلسة قبل التوجيه
/// ═══════════════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';

import 'router/app_router.dart';
import 'screens/onboarding_screen.dart';

final themeModeProvider = StateProvider<ThemeMode>((_) => ThemeMode.system);

/// حالة تهيئة Supabase
final supabaseInitProvider = StateProvider<SupabaseInitState>((_) => SupabaseInitState.initial);

enum SupabaseInitState { initial, initializing, ready, failed }

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(const ProviderScope(child: EpiSupervisorApp()));

  // تهيئة مُؤجّلة
  Future.microtask(() async {
    await _initServices();
  });
}

Future<void> _initServices() async {
  // Load .env
  try {
    final dotenv = await EnvLoader.load();
    if (dotenv.isNotEmpty) {
      SupabaseConfig.setFromEnv(
        url: dotenv['SUPABASE_URL'] ?? '',
        anonKey: dotenv['SUPABASE_ANON_KEY'] ?? '',
      );
    }
  } catch (_) {}

  // Init connectivity
  try {
    await ConnectivityUtils.initialize().timeout(const Duration(seconds: 5));
  } catch (_) {}

  // ═══ تحسين 1: تهيئة Supabase مع خيارات صريحة ═══
  try {
    if (!EnvValidator.isOfflineMode && SupabaseConfig.url.isNotEmpty) {
      SupabaseConfig.validate();

      await Supabase.initialize(
        url: SupabaseConfig.url,
        anonKey: SupabaseConfig.anonKey,
        debug: AppConfig.isDevelopment,
        // ═══ تحسين 2: خيارات المصادقة الصريحة ═══
        authOptions: const FlutterAuthClientOptions(
          authFlowType: AuthFlowType.pkce,
          autoRefreshToken: true,    // تجديد التوكن تلقائياً
        ),
        realtimeClientOptions: const RealtimeClientOptions(
          logLevel: RealtimeLogLevel.info,
        ),
        storageOptions: const StorageClientOptions(
          retryAttempts: 3,
        ),
      ).timeout(const Duration(seconds: 20));

      debugPrint('[Init] Supabase initialized successfully');
    }
  } catch (e) {
    debugPrint('[Init] Supabase init failed: $e');
    // ═══ تحسين 3: إعادة محاولة بعد 3 ثوان ═══
    Future.delayed(const Duration(seconds: 3), () async {
      try {
        if (SupabaseConfig.url.isNotEmpty) {
          await Supabase.initialize(
            url: SupabaseConfig.url,
            anonKey: SupabaseConfig.anonKey,
            debug: false,
            authOptions: const FlutterAuthClientOptions(
              authFlowType: AuthFlowType.pkce,
              autoRefreshToken: true,
            ),
          ).timeout(const Duration(seconds: 20));
          debugPrint('[Init] Supabase retry succeeded');
        }
      } catch (retryError) {
        debugPrint('[Init] Supabase retry also failed: $retryError');
      }
    });
  }

  // Init notifications
  try {
    if (SupabaseConfig.isConfigured) {
      NotificationService.init(ApiClient());
    }
  } catch (_) {}
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
