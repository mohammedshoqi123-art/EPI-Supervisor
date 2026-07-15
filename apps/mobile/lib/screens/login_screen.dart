import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';

import '../providers/app_providers.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _biometricLoading = false;
  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;
  final LocalAuthentication _localAuth = LocalAuthentication();

  Future<bool> _canUseBiometric() async {
    try {
      final canCheck = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      return canCheck && isDeviceSupported;
    } catch (_) {
      return false;
    }
  }

  Future<void> _loginWithBiometric() async {
    setState(() => _biometricLoading = true);
    HapticFeedback.lightImpact();
    try {
      final authenticated = await _localAuth.authenticate(
        localizedReason: 'تحقق من هويتك لتسجيل الدخول',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );
      if (authenticated) {
        HapticFeedback.mediumImpact();
        // ═══ FIX: Actually check for stored session and auto-login ═══
        try {
          final client = Supabase.instance.client;
          final session = client.auth.currentSession;
          if (session != null) {
            // Session exists — GoRouter redirect will handle navigation
            if (mounted) {
              context.showSuccess('تم التحقق — جاري تسجيل الدخول...');
            }
          } else {
            // No stored session — user needs to login first
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('لا توجد جلسة محفوظة — سجّل دخولك أولاً',
                      style: TextStyle(fontFamily: 'Tajawal')),
                  behavior: SnackBarBehavior.floating,
                  backgroundColor: Colors.orange,
                ),
              );
            }
          }
        } catch (e) {
          if (mounted) context.showError('خطأ في التحقق: $e');
        }
      }
    } catch (e) {
      HapticFeedback.heavyImpact();
      if (mounted) context.showError('فشل التحقق: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _biometricLoading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _slideAnim =
        Tween<Offset>(begin: const Offset(0, 0.15), end: Offset.zero).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic),
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  /// Show forget password dialog — sends a password reset email via Supabase Auth
  Future<void> _showForgetPasswordDialog() async {
    final emailController = TextEditingController(
      text: _emailController.text.trim(),
    );

    await showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text(
          'استعادة كلمة المرور',
          style: TextStyle(fontFamily: 'Cairo', fontSize: 18),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'أدخل بريدك الإلكتروني وسيتم إرسال رابط استعادة كلمة المرور',
              style: TextStyle(fontFamily: 'Tajawal', fontSize: 13),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: emailController,
              decoration: const InputDecoration(
                labelText: 'البريد الإلكتروني',
                hintText: 'example@email.com',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
              textDirection: TextDirection.ltr,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () async {
              final email = emailController.text.trim();
              if (email.isEmpty || !email.contains('@')) {
                if (dialogContext.mounted) {
                  ScaffoldMessenger.of(dialogContext).showSnackBar(
                    const SnackBar(content: Text('الرجاء إدخال بريد صحيح')),
                  );
                }
                return;
              }

              try {
                final client = Supabase.instance.client;
                await client.auth.resetPasswordForEmail(email);
                if (dialogContext.mounted) {
                  Navigator.pop(dialogContext);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('تم إرسال رابط الاستعادة إلى $email'),
                      backgroundColor: Colors.green,
                    ),
                  );
                }
              } catch (e) {
                if (dialogContext.mounted) {
                  ScaffoldMessenger.of(dialogContext).showSnackBar(
                    SnackBar(
                      content: Text('فشل الإرسال: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('إرسال'),
          ),
        ],
      ),
    );
    emailController.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) {
      HapticFeedback.heavyImpact();
      return;
    }

    HapticFeedback.lightImpact();
    setState(() => _isLoading = true);

    // ═══ FIX: إعادة محاولة تلقائية (3 محاولات مع backoff) ═══
    // Skip retries if offline — no point retrying without internet
    final isOffline = !ConnectivityUtils.isOnline;
    final maxRetries = isOffline ? 1 : 3;
    Exception? lastError;

    for (int attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        final auth = ref.read(authRepositoryProvider);
        await auth.signIn(
          _emailController.text.trim(),
          _passwordController.text,
        );
        // ═══ نجاح — GoRouter ينقل تلقائياً ═══
        lastError = null;
        break;
      } catch (e) {
        lastError = e is Exception ? e : Exception(e.toString());
        debugPrint('[Login] Attempt $attempt/$maxRetries failed: $e');

        // لا تعيد المحاولة على أخطاء بيانات الدخول
        final errStr = e.toString().toLowerCase();
        if (errStr.contains('invalid') ||
            errStr.contains('wrong') ||
            errStr.contains('not found') ||
            errStr.contains('email')) {
          break; // خطأ بيانات — لا فائدة من إعادة المحاولة
        }

        // Don't retry on network errors if offline
        if (isOffline) break;

        if (attempt < maxRetries) {
          final delay = Duration(seconds: 2 * attempt);
          debugPrint('[Login] Retrying in ${delay.inSeconds}s...');
          await Future.delayed(delay);
        }
      }
    }

    if (lastError != null) {
      HapticFeedback.heavyImpact();
      if (mounted) {
        final errStr = lastError.toString();
        String message = 'فشل تسجيل الدخول';
        if (errStr.contains('SocketException') ||
            errStr.contains('Failed host')) {
          message = 'لا يوجد اتصال بالإنترنت. تحقق من الشبكة.';
        } else if (errStr.contains('timeout') || errStr.contains('Timeout')) {
          message = 'انتهت مهلة الاتصال. حاول مرة أخرى.';
        } else if (errStr.contains('invalid') || errStr.contains('Invalid')) {
          message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        } else if (errStr.contains('not configured')) {
          message = 'Supabase غير مُعدّ. تحقق من الإعدادات.';
        }
        context.showError(message);
      }
    }

    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppTheme.primaryColor,
              AppTheme.primaryDark,
              Color(0xFF004D40),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            stops: [0.0, 0.6, 1.0],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: FadeTransition(
                opacity: _fadeAnim,
                child: SlideTransition(
                  position: _slideAnim,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo image
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: AppTheme.glassmorphism,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.asset(
                            'assets/images/logo.png',
                            width: 100,
                            height: 100,
                            errorBuilder: (_, __, ___) => const Icon(
                              Icons.assignment_outlined,
                              size: 56,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        "EPI Supervisor's",
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'نظام الاشراف الالكتروني لبرنامج التحصين الصحي الموسع',
                        style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 14,
                          color: Colors.white.withValues(alpha: 0.75),
                        ),
                      ),
                      const SizedBox(height: 48),

                      // Supabase not configured warning
                      if (!SupabaseConfig.isConfigured)
                        Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.orange.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: Colors.orange.withValues(alpha: 0.3),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.warning_amber,
                                color: Colors.orange,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Supabase غير مُعدّ.\n• تأكد من ملف .env أو مرر --dart-define=SUPABASE_URL=... و SUPABASE_ANON_KEY=...',
                                  style: TextStyle(
                                    fontFamily: 'Tajawal',
                                    fontSize: 11,
                                    color: Colors.orange.shade100,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                      // Login Form Card
                      Container(
                        padding: const EdgeInsets.all(28),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.12),
                              blurRadius: 30,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const Text(
                                'تسجيل الدخول',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 24,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textPrimary,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'مرحباً بعودتك! أدخل بياناتك للمتابعة',
                                style: TextStyle(
                                  fontFamily: 'Tajawal',
                                  fontSize: 13,
                                  color: AppTheme.textSecondary,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 28),

                              // Email Field
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                child: EpiTextField(
                                  label: 'البريد الإلكتروني',
                                  controller: _emailController,
                                  keyboardType: TextInputType.emailAddress,
                                  prefixIcon: Icons.email_outlined,
                                  validator: (v) {
                                    if (v == null || v.isEmpty)
                                      return 'البريد مطلوب';
                                    if (!v.isValidEmail) return 'بريد غير صالح';
                                    return null;
                                  },
                                ),
                              ),
                              const SizedBox(height: 18),

                              // Password Field
                              EpiTextField(
                                label: 'كلمة المرور',
                                controller: _passwordController,
                                obscureText: _obscurePassword,
                                prefixIcon: Icons.lock_outlined,
                                suffix: IconButton(
                                  icon: AnimatedSwitcher(
                                    duration: const Duration(milliseconds: 200),
                                    child: Icon(
                                      _obscurePassword
                                          ? Icons.visibility
                                          : Icons.visibility_off,
                                      key: ValueKey(_obscurePassword),
                                    ),
                                  ),
                                  onPressed: () => setState(
                                    () => _obscurePassword = !_obscurePassword,
                                  ),
                                ),
                                validator: (v) {
                                  if (v == null || v.isEmpty)
                                    return 'كلمة المرور مطلوبة';
                                  if (v.length < 6)
                                    return 'قصيرة جداً (6 أحرف على الأقل)';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 32),

                              // Login Button
                              SizedBox(
                                height: 52,
                                child: DecoratedBox(
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [
                                        AppTheme.primaryColor,
                                        AppTheme.primaryDark,
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(14),
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppTheme.primaryColor.withValues(
                                          alpha: 0.35,
                                        ),
                                        blurRadius: 12,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: Semantics(
                                    button: true,
                                    enabled: !_isLoading,
                                    label: _isLoading ? 'دخول — جاري التحميل' : 'دخول',
                                    hint: 'اضغط لتسجيل الدخول',
                                    child: ElevatedButton(
                                    onPressed: _isLoading ? null : _login,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.transparent,
                                      shadowColor: Colors.transparent,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                    ),
                                    child: _isLoading
                                        ? const SizedBox(
                                            width: 22,
                                            height: 22,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2.5,
                                              color: Colors.white,
                                            ),
                                          )
                                        : const Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                'دخول',
                                                style: TextStyle(
                                                  fontFamily: 'Cairo',
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w700,
                                                  color: Colors.white,
                                                ),
                                              ),
                                              SizedBox(width: 8),
                                              Icon(
                                                Icons.arrow_forward,
                                                color: Colors.white,
                                                size: 20,
                                              ),
                                            ],
                                          ),
                                  ),
                                  ),
                                ),
                              ),

                              // Forget password link
                              Align(
                                alignment: Alignment.centerLeft,
                                child: TextButton(
                                  onPressed: _isLoading
                                      ? null
                                      : () => _showForgetPasswordDialog(),
                                  child: Text(
                                    'نسيت كلمة المرور؟',
                                    style: TextStyle(
                                      fontFamily: 'Tajawal',
                                      fontSize: 12,
                                      color: AppTheme.primaryColor,
                                      decoration: TextDecoration.underline,
                                    ),
                                  ),
                                ),
                              ),

                              // Biometric login button
                              const SizedBox(height: 8),
                              FutureBuilder<bool>(
                                future: _canUseBiometric(),
                                builder: (context, snapshot) {
                                  if (snapshot.data != true)
                                    return const SizedBox.shrink();
                                  return SizedBox(
                                    height: 48,
                                    child: OutlinedButton.icon(
                                      onPressed: _biometricLoading
                                          ? null
                                          : _loginWithBiometric,
                                      icon: _biometricLoading
                                          ? const SizedBox(
                                              width: 18,
                                              height: 18,
                                              child: CircularProgressIndicator(
                                                  strokeWidth: 2))
                                          : const Icon(
                                              Icons.fingerprint_rounded,
                                              size: 22),
                                      label: const Text(
                                        'دخول بالبصمة',
                                        style: TextStyle(
                                          fontFamily: 'Cairo',
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      style: OutlinedButton.styleFrom(
                                        shape: RoundedRectangleBorder(
                                            borderRadius:
                                                BorderRadius.circular(14)),
                                        side: BorderSide(
                                            color: AppTheme.primaryColor
                                                .withValues(alpha: 0.3)),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 32),
                      // Footer
                      Text(
                        'الإصدار ${AppConfig.appVersion}',
                        style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 11,
                          color: Colors.white.withValues(alpha: 0.4),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
