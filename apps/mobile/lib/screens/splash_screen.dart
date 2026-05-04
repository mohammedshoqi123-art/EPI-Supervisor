import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';

import '../providers/app_providers.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  bool _hasNavigated = false;
  String _status = 'جاري التحميل...';

  @override
  void initState() {
    super.initState();
    _navigate();
  }

  Future<void> _navigate() async {
    // ═══ وقت أقصر للـ splash — فقط للوجو ═══
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted || _hasNavigated) return;

    // ═══ إذا Supabase مو مُعدّ — روح للّوجن ═══
    if (!SupabaseConfig.isConfigured) {
      setState(() => _status = 'Supabase غير مُعدّ — الانتقال لتسجيل الدخول');
      await Future.delayed(const Duration(milliseconds: 500));
      if (!mounted || _hasNavigated) return;
      _hasNavigated = true;
      context.go('/login');
      return;
    }

    // ═══ تحقق من الجلسة ═══
    try {
      final client = Supabase.instance.client;
      final session = client.auth.currentSession;

      if (session != null) {
        setState(() => _status = 'تم العثور على جلسة — جاري التحميل...');

        // ═══ FIX: timeout أطول (20 ثانية) بدلاً من 10 ═══
        try {
          await ref.read(authStateProvider.future).timeout(
            const Duration(seconds: 20),
            onTimeout: () {
              debugPrint(
                  '[Splash] Profile load timed out — going to dashboard anyway');
              throw TimeoutException('Profile load timed out');
            },
          );
        } catch (_) {
          // ═══ القاعدة الذهبية: فشل Profile ≠ فشل دخول ═══
          // المستخدم مصادق → روح للداشبورد
          debugPrint(
              '[Splash] Profile failed but user is authenticated — proceeding');
        }

        if (!mounted || _hasNavigated) return;
        _hasNavigated = true;
        context.go('/dashboard');
      } else {
        setState(() => _status = 'الانتقال لتسجيل الدخول...');
        await Future.delayed(const Duration(milliseconds: 300));
        if (!mounted || _hasNavigated) return;
        _hasNavigated = true;
        context.go('/login');
      }
    } catch (e) {
      // ═══ Supabase init فشل — روح للّوجن (مو crash) ═══
      debugPrint('[Splash] Supabase access failed: $e');
      setState(() => _status = 'الانتقال لتسجيل الدخول...');
      await Future.delayed(const Duration(milliseconds: 300));
      if (!mounted || _hasNavigated) return;
      _hasNavigated = true;
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
