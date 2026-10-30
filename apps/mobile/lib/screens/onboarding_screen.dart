import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:math' as math;
import 'package:shared_preferences/shared_preferences.dart';

/// ═══════════════════════════════════════════════════════════════════════
/// OnboardingScreen — الواجهة التعريفية (تُعرض مرة واحدة قبل تسجيل الدخول)
///
/// تصميم v2 — 2026-10-30:
/// - صفحة ترحيب بشعار التطبيق واسم المنصة
/// - 3 صفحات ميزات: النماذج والأوفلاين، معرض صور الإشراف (جديد)، التحليلات والمساعد
/// - حركات دخول متدرجة لكل صفحة + مؤشرات متحركة + خلفية متدرجة ناعمة
/// - محسّنة للـ RTL بالكامل
/// ═══════════════════════════════════════════════════════════════════════

class OnboardingScreen extends StatefulWidget {
  final VoidCallback onComplete;

  const OnboardingScreen({super.key, required this.onComplete});

  static const String _prefsKey = 'onboarding_completed';

  static Future<bool> isCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_prefsKey) ?? false;
  }

  static Future<void> markCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefsKey, true);
  }

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  final _pageController = PageController();
  int _currentPage = 0;

  late AnimationController _bgController;

  static const _pages = <_PageData>[
    // ── 1) النماذج + الأوفلاين ──
    _PageData(
      gradient: [Color(0xFF00897B), Color(0xFF00695C), Color(0xFF004D40)],
      accentColor: Color(0xFF64FFDA),
      icon: Icons.assignment_rounded,
      title: 'نماذج ذكية تعمل بدون إنترنت',
      subtitle:
          'املأ الاستمارات الميدانية إلكترونياً مع دعم GPS والصور التوثيقية '
          'والحفظ التلقائي — بياناتك محفوظة على جهازك حتى مع انقطاع الشبكة',
      features: ['حفظ تلقائي فوري', 'GPS تلقائي', 'يعمل 100% أوفلاين'],
    ),
    // ── 2) المعرض + المزامنة ──
    _PageData(
      gradient: [Color(0xFF1565C0), Color(0xFF0D47A1), Color(0xFF0A2463)],
      accentColor: Color(0xFF82B1FF),
      icon: Icons.photo_library_rounded,
      title: 'معرض صور ومزامنة ذكية',
      subtitle:
          'كل صور الإشراف الميداني في معرض واحد مع إمكانية التصفح والتقريب. '
          'وعند عودة الاتصال تُرسل إرسالياتك تلقائياً وآمنة — دون فقدان أي بيانات',
      features: ['معرض صور الإشراف', 'مزامنة تلقائية', 'لا فقدان للبيانات'],
    ),
    // ── 3) التحليلات + المساعد ──
    _PageData(
      gradient: [Color(0xFF6A1B9A), Color(0xFF4A148C), Color(0xFF311B92)],
      accentColor: Color(0xFFEA80FC),
      icon: Icons.insights_rounded,
      title: 'تحليلات لحظية ومساعد ذكي',
      subtitle:
          'لوحة تحكم تفاعلية مع خرائط وتقارير PDF وExcel، ومساعد ذكي '
          'يجيب على أسئلتك عن الحملة بأرقام دقيقة من قاعدة البيانات',
      features: ['خرائط تفاعلية', 'تقارير PDF وExcel', 'مساعد ذكي بالعربية'],
    ),
  ];

  @override
  void initState() {
    super.initState();
    _bgController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 24),
    )..repeat();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _bgController.dispose();
    super.dispose();
  }

  void _nextPage() {
    HapticFeedback.lightImpact();
    if (_currentPage < _pages.length) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 480),
        curve: Curves.easeInOutCubic,
      );
    } else {
      _complete();
    }
  }

  void _skip() {
    HapticFeedback.selectionClick();
    _complete();
  }

  Future<void> _complete() async {
    await OnboardingScreen.markCompleted();
    if (mounted) widget.onComplete();
  }

  @override
  Widget build(BuildContext context) {
    final page = _currentPage == 0 ? null : _pages[_currentPage - 1];
    final size = MediaQuery.of(context).size;
    final isLast = _currentPage == _pages.length;

    return Scaffold(
      body: AnimatedBuilder(
        animation: _bgController,
        builder: (context, _) {
          // الألوان: صفحة الترحيب تدرج العلامة، وصفحات الميزات تدرجها الخاص
          final List<Color> gradient = page?.gradient ??
              const [Color(0xFF00695C), Color(0xFF004D40), Color(0xFF00332E)];
          final Color accent = page?.accentColor ?? const Color(0xFF64FFDA);

          return Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: gradient,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Stack(
              children: [
                // أنماط هندسية ناعمة (دوائر شفافة)
                Positioned(
                  top: -size.height * 0.18,
                  left: -size.width * 0.25,
                  child: _glowCircle(size.width * 0.65, accent, 0.07),
                ),
                Positioned(
                  bottom: -size.height * 0.12,
                  right: -size.width * 0.3,
                  child: _glowCircle(size.width * 0.75, accent, 0.05),
                ),

                // جزيئات عائمة خفيفة
                ...List.generate(10, (i) {
                  final angle = _bgController.value * 2 * math.pi + i * 0.63;
                  final radius = 70.0 + (i % 4) * 55.0;
                  final x = size.width / 2 + math.cos(angle) * radius;
                  final y = size.height / 2 + math.sin(angle * 0.7) * radius;
                  return Positioned(
                    left: x,
                    top: y,
                    child: Container(
                      width: 3.0 + (i % 4) * 2.5,
                      height: 3.0 + (i % 4) * 2.5,
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.10 + (i % 3) * 0.04),
                        shape: BoxShape.circle,
                      ),
                    ),
                  );
                }),

                SafeArea(
                  child: Column(
                    children: [
                      // تخطي (يظهر فقط في صفحات الميزات)
                      Align(
                        alignment: AlignmentDirectional.centerEnd,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 6),
                          child: TextButton(
                            onPressed: _currentPage == 0 ? null : _skip,
                            style: TextButton.styleFrom(
                              foregroundColor:
                                  Colors.white.withValues(alpha: 0.65),
                            ),
                            child: Text(
                              _currentPage == 0 ? '' : 'تخطي',
                              style: const TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ),
                      ),

                      Expanded(
                        child: PageView.builder(
                          controller: _pageController,
                          itemCount: _pages.length + 1, // ترحيب + 3 ميزات
                          onPageChanged: (index) {
                            setState(() => _currentPage = index);
                            HapticFeedback.selectionClick();
                          },
                          itemBuilder: (context, index) => index == 0
                              ? _buildWelcomePage()
                              : _FeaturePage(
                                  data: _pages[index - 1],
                                  // المفتاح يعيد تشغيل حركة الدخول مع كل تغيير صفحة
                                  key: ValueKey('feature-$index'),
                                ),
                        ),
                      ),

                      // الأسفل: المؤشرات + زر الإجراء
                      Padding(
                        padding: const EdgeInsets.fromLTRB(32, 0, 32, 34),
                        child: Column(
                          children: [
                            _buildPageIndicator(),
                            const SizedBox(height: 26),
                            _buildCTAButton(isLast, accent, gradient.first),
                            const SizedBox(height: 12),
                            Text(
                              '${_currentPage + 1} من ${_pages.length + 1}',
                              style: TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 12,
                                color: Colors.white.withValues(alpha: 0.35),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ── صفحة الترحيب: شعار + اسم التطبيق + رسالة ──
  Widget _buildWelcomePage() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Spacer(flex: 2),

          // الشعار داخل هالة متوهجة
          Container(
            width: 150,
            height: 150,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.10),
              border: Border.all(
                color: const Color(0xFF64FFDA).withValues(alpha: 0.35),
                width: 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF64FFDA).withValues(alpha: 0.22),
                  blurRadius: 60,
                  spreadRadius: 10,
                ),
              ],
            ),
            padding: const EdgeInsets.all(22),
            child: ClipOval(
              child: Image.asset(
                'assets/images/logo.png',
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const Icon(
                  Icons.health_and_safety_rounded,
                  size: 60,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(height: 36),

          const Text(
            'EPI Supervisor',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 34,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'منصة الإشراف الميداني\nلبرنامج التحصين الموسّع',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 19,
              fontWeight: FontWeight.w700,
              color: Color(0xFF64FFDA),
              height: 1.5,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'جولة تعريفية سريعة بالتطبيق قبل البدء — '
            'اضغط متابعة للانتقال',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 14,
              color: Colors.white.withValues(alpha: 0.7),
              height: 1.7,
            ),
          ),

          const Spacer(flex: 3),
        ],
      ),
    );
  }

  Widget _glowCircle(double size, Color color, double opacity) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: opacity),
      ),
    );
  }

  Widget _buildPageIndicator() {
    final count = _pages.length + 1;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (index) {
        final isActive = _currentPage == index;
        final color = _currentPage == 0
            ? const Color(0xFF64FFDA)
            : _pages[_currentPage - 1].accentColor;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeInOut,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          width: isActive ? 30 : 8,
          height: 8,
          decoration: BoxDecoration(
            color: isActive
                ? color
                : Colors.white.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(4),
          ),
        );
      }),
    );
  }

  Widget _buildCTAButton(bool isLast, Color accent, Color bgColor) {
    // نص وزر الصفحة الأخيرة
    final label = isLast ? 'ابدأ الآن' : (_currentPage == 0 ? 'لنبدأ' : 'متابعة');
    final buttonTextColor =
        isLast ? const Color(0xFF311B92) : bgColor;

    return SizedBox(
      width: double.infinity,
      height: 56,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.18),
              blurRadius: 22,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ElevatedButton(
          onPressed: _nextPage,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: buttonTextColor,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: buttonTextColor,
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: buttonTextColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isLast
                      ? Icons.rocket_launch_rounded
                      : Icons.arrow_forward_rounded,
                  color: buttonTextColor,
                  size: 18,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// صفحة ميزة — حركة دخول متدرجة (تُعاد عند فتح الصفحة بسبب الـ key)
class _FeaturePage extends StatelessWidget {
  final _PageData data;

  const _FeaturePage({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 550),
      curve: Curves.easeOutCubic,
      builder: (context, t, child) {
        return Opacity(
          opacity: t,
          child: Transform.translate(
            offset: Offset(0, 24 * (1 - t)),
            child: child,
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 30),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Spacer(flex: 1),

            // أيقونة الميزة داخل هالة
            Container(
              width: 122,
              height: 122,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.08),
                border: Border.all(
                  color: data.accentColor.withValues(alpha: 0.25),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: data.accentColor.withValues(alpha: 0.16),
                    blurRadius: 44,
                    spreadRadius: 6,
                  ),
                ],
              ),
              child: Icon(
                data.icon,
                size: 50,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 44),

            Text(
              data.title,
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: Colors.white,
                height: 1.35,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 18),

            Text(
              data.subtitle,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 14.5,
                color: Colors.white.withValues(alpha: 0.78),
                height: 1.75,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 30),

            // شرائح الميزات
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: data.features
                  .map((f) => Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 7),
                        decoration: BoxDecoration(
                          color: data.accentColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: data.accentColor.withValues(alpha: 0.28),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.check_circle_rounded,
                                size: 14, color: data.accentColor),
                            const SizedBox(width: 6),
                            Text(
                              f,
                              style: TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: data.accentColor,
                              ),
                            ),
                          ],
                        ),
                      ))
                  .toList(),
            ),

            const Spacer(flex: 2),
          ],
        ),
      ),
    );
  }
}

class _PageData {
  final List<Color> gradient;
  final Color accentColor;
  final IconData icon;
  final String title;
  final String subtitle;
  final List<String> features;

  const _PageData({
    required this.gradient,
    required this.accentColor,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.features,
  });
}
