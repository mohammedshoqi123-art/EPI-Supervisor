import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';

import 'router/app_router.dart';
import 'screens/onboarding_screen.dart';

// Theme mode provider
final themeModeProvider = StateProvider<ThemeMode>((_) => ThemeMode.system);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Run the app FIRST — don't block on async init
  runApp(const ProviderScope(child: EpiSupervisorApp()));

  // Deferred init: use Future.microtask to run AFTER first frame renders
  Future.microtask(() async {
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

    // Validate env (non-blocking — show warning in UI if needed)
    try {
      EnvValidator.validate();
    } catch (_) {}

    // Init connectivity
    try {
      await ConnectivityUtils.initialize().timeout(const Duration(seconds: 5));
    } catch (_) {}

    // Init Supabase
    try {
      if (!EnvValidator.isOfflineMode && SupabaseConfig.url.isNotEmpty) {
        SupabaseConfig.validate();
        await Supabase.initialize(
          url: SupabaseConfig.url,
          anonKey: SupabaseConfig.anonKey,
          debug: AppConfig.isDevelopment,
        ).timeout(const Duration(seconds: 15));
      }
    } catch (_) {}

    // Init notifications
    try {
      if (SupabaseConfig.isConfigured) {
        NotificationService.init(ApiClient());
      }
    } catch (_) {}
  });
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
