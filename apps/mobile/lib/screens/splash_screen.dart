import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';

import '../main.dart' show supabaseInitialized, awaitSupabaseReady;
import '../providers/app_providers.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  bool _hasNavigated = false;
  String _status = 'جاري التحميل...';
  Timer? _waitTimer;
  int _waitSeconds = 0;

  @override
  void initState() {
    super.initState();
    _navigate();
    // ═══ FIX: مؤقت تحديث الحالة كل ثانية — يحافظ على استجابة UI ═══
    _waitTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted || _hasNavigated) return;
      _waitSeconds++;
      setState(() {
        if (_waitSeconds < 3) {
          _status = 'جاري التحميل...';
        } else if (_waitSeconds < 8) {
          _status = 'جاري الاتصال بالخادم...';
        } else if (_waitSeconds < 15) {
          _status = 'الاتصال بطيء — لا يزال يحاول...';
        } else if (_waitSeconds < 25) {
          _status = 'الاتصال يأخذ وقتاً طويلاً — تحقق من الإنترنت';
        } else {
          _status = 'محاولة أخيرة...';
        }
      });
    });
  }

  @override
  void dispose() {
    _waitTimer?.cancel();
    super.dispose();
  }

  Future<void> _navigate() async {
    // Fix: short visual delay
    await Future.delayed(const Duration(milliseconds: 200));
    if (!mounted || _hasNavigated) return;

    // ═══ إذا Supabase مو مُعدّ — روح للّوجن ═══
    if (!SupabaseConfig.isConfigured) {
      setState(() => _status = 'Supabase غير مُعدّ — الانتقال لتسجيل الدخول');
      if (!mounted || _hasNavigated) return;
      _hasNavigated = true;
      _waitTimer?.cancel();
      context.go('/login');
      return;
    }

    // ═══ PERFORMANCE: Check connectivity FIRST — if offline, don't wait for Supabase ═══
    // Previously: waited 10s even when offline (useless)
    // Now: if offline, proceed to dashboard immediately (offline mode)
    if (!ConnectivityUtils.isOnline) {
      debugPrint('[Splash] Offline — proceeding to dashboard immediately');
      _hasNavigated = true;
      _waitTimer?.cancel();
      context.go('/dashboard');
      return;
    }

    // ═══ FIX: انتظر Supabase.initialize ينتهي (في الخلفية) ═══
    // main.dart يبدأ Supabase في الخلفية، نحن ننتظره هنا
    // ═══ FIX: Await Supabase using Completer — no polling ═══
    // Previously: polled supabaseInitialized bool every 1s (wasteful)
    // Now: awaits Completer (instant notification when ready)
    final supabaseReady = await awaitSupabaseReady(
      timeout: const Duration(seconds: 10),
    );

    if (!mounted || _hasNavigated) return;

    if (!supabaseReady) {
      // ═══ FIX: Supabase لم يتهيأ بعد — proceed immediately ═══
      debugPrint('[Splash] Supabase not ready after 10s — proceeding offline');
      _hasNavigated = true;
      _waitTimer?.cancel();
      context.go('/dashboard');
      return;
    }

    // ═══ تحقق من الجلسة ═══
    try {
      final client = Supabase.instance.client;
      final session = client.auth.currentSession;

      if (session != null) {
        setState(() => _status = 'تم العثور على جلسة — جاري التحميل...');

        // ═══ FIX: مهلة 10s فقط (بدل 20s) — لا نحظر التطبيق ═══
        try {
          await ref.read(authStateProvider.future).timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              debugPrint('[Splash] Profile load timed out — going to dashboard anyway');
              throw TimeoutException('Profile load timed out');
            },
          );
        } catch (e) {
          // المستخدم مصادق → روح للداشبورد
          debugPrint('[Splash] Profile failed ($e) but user is authenticated — proceeding');
        }

        if (!mounted || _hasNavigated) return;
        _hasNavigated = true;
        _waitTimer?.cancel();
        context.go('/dashboard');
      } else {
        setState(() => _status = 'الانتقال لتسجيل الدخول...');
        if (!mounted || _hasNavigated) return;
        _hasNavigated = true;
        _waitTimer?.cancel();
        context.go('/login');
      }
    } catch (e) {
      // ═══ Supabase init فشل — روح للّوجن (مو crash) ═══
      debugPrint('[Splash] Supabase access failed: $e');
      setState(() => _status = 'الانتقال لتسجيل الدخول...');
      if (!mounted || _hasNavigated) return;
      _hasNavigated = true;
      _waitTimer?.cancel();
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [AppTheme.primaryColor, AppTheme.primaryDark],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Image.asset(
                  'assets/images/logo.png',
                  width: 120,
                  height: 120,
                  errorBuilder: (_, __, ___) => Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.assignment_outlined,
                      size: 64,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                AppStrings.appName,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'نظام الاشراف الالكتروني لبرنامج التحصين الصحي الموسع',
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 14,
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
              const SizedBox(height: 48),
              const CircularProgressIndicator(
                color: Colors.white,
                strokeWidth: 2,
              ),
              const SizedBox(height: 16),
              Text(
                _status,
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 12,
                  color: Colors.white.withValues(alpha: 0.6),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
