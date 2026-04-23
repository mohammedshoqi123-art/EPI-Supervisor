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

final themeModeProvider = StateProvider<ThemeMode>((_) => ThemeMode.system);

/// حالة تهيئة Supabase
final supabaseInitProvider =
    StateProvider<SupabaseInitState>((_) => SupabaseInitState.initial);

enum SupabaseInitState { initial, initializing, ready, failed }

/// ═══ FIX: تهيئة Supabase مُزامنة قبل runApp لتجنب race condition ═══
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ═══ الخطوة 1: تحميل .env أولاً ═══
  try {
    final dotenv = await EnvLoader.load();
    if (dotenv.isNotEmpty) {
      SupabaseConfig.setFromEnv(
        url: dotenv['SUPABASE_URL'] ?? '',
        anonKey: dotenv['SUPABASE_ANON_KEY'] ?? '',
      );
    }
  } catch (_) {}

  // ═══ الخطوة 2: تهيئة Connectivity ═══
  try {
    await ConnectivityUtils.initialize()
        .timeout(const Duration(seconds: 5));
  } catch (_) {}

  // ═══ الخطوة 3: تهيئة Supabase مُزامنة (await) قبل runApp ═══
  // هذا يحل مشكلة Race Condition: AuthRepository لن يجد _client = null
  await _initSupabase();

  // ═══ الخطوة 4: تشغيل التطبيق بعد التهيئة ═══
  runApp(const ProviderScope(child: EpiSupervisorApp()));

  // ═══ الخطوة 5: تهيئة الخدمات غير الحرجة في الخلفية ═══
  Future.microtask(() async {
    try {
      if (SupabaseConfig.isConfigured) {
        NotificationService.init(ApiClient());
      }
    } catch (_) {}
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
          logLevel: RealtimeLogLevel.info,
        ),
        storageOptions: const StorageClientOptions(
          retryAttempts: 3,
        ),
      ).timeout(const Duration(seconds: 20));

      debugPrint('[Init] ✅ Supabase initialized (attempt $attempt)');
      return; // ← نجاح، اخرج
    } catch (e) {
      debugPrint('[Init] ❌ Supabase attempt $attempt/$maxRetries failed: $e');
      if (attempt < maxRetries) {
        final delay = Duration(seconds: 3 * attempt); // 3s, 6s
        debugPrint('[Init] Retrying in ${delay.inSeconds}s...');
        await Future.delayed(delay);
      }
    }
  }

  debugPrint('[Init] ⚠️ Supabase failed after $maxRetries attempts — running offline');
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
