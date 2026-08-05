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
    // ═══ PERFORMANCE FIX v2: Ultra-fast splash — 100ms visual only ═══
    await Future.delayed(const Duration(milliseconds: 100));
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

    // ═══ PERFORMANCE: Check connectivity FIRST — if offline, dash immediately ═══
    // Don't waste time waiting for Supabase if we're offline — go straight to dashboard
    // and let the offline cache serve whatever was saved last session.
    if (!ConnectivityUtils.isOnline) {
      debugPrint('[Splash] Offline — proceeding to dashboard immediately (offline cache)');
      _hasNavigated = true;
      _waitTimer?.cancel();
      // Even offline, route based on whether a session token exists in local storage
      try {
        final client = Supabase.instance.client;
        final session = client.auth.currentSession;
        context.go(session != null ? '/dashboard' : '/login');
      } catch (_) {
        context.go('/login');
      }
      return;
    }

    // ═══ Online: Wait for Supabase.initialize with SHORT timeout ═══
    // 3s is enough — Supabase.initialize is fast on a healthy network.
    // If it takes longer, we proceed in offline-mode (cached data + retry in background).
    final supabaseReady = await awaitSupabaseReady(
      timeout: const Duration(seconds: 3),
    );

    if (!mounted || _hasNavigated) return;

    if (!supabaseReady) {
      debugPrint('[Splash] Supabase not ready after 3s — proceeding with cached session');
      _hasNavigated = true;
      _waitTimer?.cancel();
      // Try to use any locally-cached session — don't block UI on auth
      try {
        final client = Supabase.instance.client;
        final session = client.auth.currentSession;
        context.go(session != null ? '/dashboard' : '/login');
      } catch (_) {
        context.go('/login');
      }
      return;
    }

    // ═══ Supabase ready — check session quickly ═══
    try {
      final client = Supabase.instance.client;
      final session = client.auth.currentSession;

      if (session != null) {
        // ═══ PERFORMANCE: Don't wait for full profile fetch — go to dashboard NOW ═══
        // The dashboard's authStateProvider will fetch the profile in the background
        // and the UI will update reactively. This shaves 1-3s off startup.
        debugPrint('[Splash] Session found — proceeding to dashboard (profile loads in background)');
        _hasNavigated = true;
        _waitTimer?.cancel();
        context.go('/dashboard');

        // Kick off profile fetch in background — don't await
        ref.read(authStateProvider.future).timeout(
          const Duration(seconds: 10),
        ).then((_) {
          debugPrint('[Splash] ✅ Background profile fetch complete');
        }).catchError((e) {
          debugPrint('[Splash] ⚠️ Background profile fetch failed: $e');
        });
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
