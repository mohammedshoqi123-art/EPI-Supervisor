import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:math' as math;
import 'package:shared_preferences/shared_preferences.dart';

/// Premium Onboarding — 3 animated pages with particle background
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
  late AnimationController _entryController;
  late Animation<double> _entryAnim;

  static const _pages = [
    _PageData(
      gradient: [Color(0xFF00897B), Color(0xFF00695C), Color(0xFF004D40)],
      accentColor: Color(0xFF64FFDA),
      icon: Icons.assignment_rounded,
      title: 'نماذج ذكية\nتتفاعل معك',
      subtitle: 'املأ الاستمارات الميدانية إلكترونياً مع دعم GPS، صور توثيقية، '
          'وحفظ تلقائي — حتى بدون إنترنت',
      features: ['حفظ تلقائي', 'GPS تلقائي', 'صور توثيقية'],
    ),
    _PageData(
      gradient: [Color(0xFF1565C0), Color(0xFF0D47A1), Color(0xFF0A2463)],
      accentColor: Color(0xFF82B1FF),
      icon: Icons.cloud_sync_rounded,
      title: 'مزامنة ذكية\nبلا انقطاع',
      subtitle: 'بياناتك في أمان — تُحفظ محلياً أولاً ثم تتم المزامنة '
          'تلقائياً فور عودة الاتصال. لا تفقد أي إرسالية',
      features: ['حفظ محلي آمن', 'مزامنة تلقائية', 'عمل بدون إنترنت'],
    ),
    _PageData(
      gradient: [Color(0xFF6A1B9A), Color(0xFF4A148C), Color(0xFF311B92)],
      accentColor: Color(0xFFEA80FC),
      icon: Icons.insights_rounded,
      title: 'تحليلات لحظية\nقرارات أذكى',
      subtitle: 'لوحة تحكم تفاعلية مع خرائط، نسب أداء، تقارير PDF، '
          'ومساعد ذكي يحلل البيانات ويقترح الحلول',
      features: ['خرائط تفاعلية', 'تقارير PDF', 'مساعد ذكي'],
    ),
  ];

  @override
  void initState() {
    super.initState();

    _bgController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 20),
    )..repeat();

    _entryController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _entryAnim = CurvedAnimation(
      parent: _entryController,
      curve: Curves.easeOutCubic,
    );
    _entryController.forward();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _bgController.dispose();
    _entryController.dispose();
    super.dispose();
  }

  void _nextPage() {
    HapticFeedback.lightImpact();
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 500),
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
    final page = _pages[_currentPage];
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: AnimatedBuilder(
        animation: _bgController,
        builder: (context, _) {
          return Stack(
            children: [
              // Animated gradient background
              AnimatedContainer(
                duration: const Duration(milliseconds: 600),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: page.gradient,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),

              // Floating particles
              ...List.generate(12, (i) {
                final angle = _bgController.value * 2 * math.pi + i * 0.5;
                final radius = 80.0 + (i % 4) * 60.0;
                final x = size.width / 2 + math.cos(angle) * radius;
                final y = size.height / 2 + math.sin(angle * 0.7) * radius;
                final opacity = 0.08 + (i % 3) * 0.04;
                final sz = 4.0 + (i % 5) * 3.0;
                return Positioned(
                  left: x,
                  top: y,
                  child: Container(
                    width: sz,
                    height: sz,
                    decoration: BoxDecoration(
                      color: page.accentColor.withValues(alpha: opacity),
                      shape: BoxShape.circle,
                    ),
                  ),
                );
              }),

              // Large glow circle
              Positioned(
                top: -size.height * 0.15,
                right: -size.width * 0.2,
                child: Container(
                  width: size.width * 0.6,
                  height: size.width * 0.6,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: page.accentColor.withValues(alpha: 0.06),
                  ),
                ),
              ),

              // Content
              FadeTransition(
                opacity: _entryAnim,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0, 0.05),
                    end: Offset.zero,
                  ).animate(_entryAnim),
                  child: SafeArea(
                    child: Column(
                      children: [
                        // Skip button
                        Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 8),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              TextButton(
                                onPressed: _skip,
                                style: TextButton.styleFrom(
                                  foregroundColor:
                                      Colors.white.withValues(alpha: 0.7),
                                ),
                                child: const Text(
                                  'تخطي',
                                  style: TextStyle(
                                    fontFamily: 'Tajawal',
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Pages
                        Expanded(
                          child: PageView.builder(
                            controller: _pageController,
                            itemCount: _pages.length,
                            onPageChanged: (index) {
                              setState(() => _currentPage = index);
                              HapticFeedback.selectionClick();
                              _entryController.reset();
                              _entryController.forward();
                            },
                            itemBuilder: (context, index) =>
                                _buildPage(_pages[index], size),
                          ),
                        ),

                        // Bottom section
                        Padding(
                          padding: const EdgeInsets.fromLTRB(32, 0, 32, 40),
                          child: Column(
                            children: [
                              // Page indicator
                              _buildPageIndicator(),
                              const SizedBox(height: 32),

                              // CTA Button
                              _buildCTAButton(page),
                              const SizedBox(height: 16),

                              // Page counter
                              Text(
                                '${_currentPage + 1} من ${_pages.length}',
                                style: TextStyle(
                                  fontFamily: 'Tajawal',
                                  fontSize: 12,
                                  color: Colors.white.withValues(alpha: 0.4),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildPage(_PageData page, Size size) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Spacer(flex: 1),

          // Icon with glow
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.08),
              border: Border.all(
                color: page.accentColor.withValues(alpha: 0.2),
                width: 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: page.accentColor.withValues(alpha: 0.15),
                  blurRadius: 40,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: Icon(
              page.icon,
              size: 48,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 48),

          // Title
          Text(
            page.title,
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontSize: 30,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              height: 1.3,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),

          // Subtitle
          Text(
            page.subtitle,
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 15,
              color: Colors.white.withValues(alpha: 0.75),
              height: 1.7,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),

          // Feature chips
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: page.features
                .map((f) => Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 7),
                      decoration: BoxDecoration(
                        color: page.accentColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: page.accentColor.withValues(alpha: 0.25),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check_circle_rounded,
                              size: 14, color: page.accentColor),
                          const SizedBox(width: 6),
                          Text(
                            f,
                            style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: page.accentColor,
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
    );
  }

  Widget _buildPageIndicator() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(_pages.length, (index) {
        final isActive = _currentPage == index;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeInOut,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          width: isActive ? 32 : 8,
          height: 8,
          decoration: BoxDecoration(
            color: isActive
                ? _pages[_currentPage].accentColor
                : Colors.white.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(4),
          ),
        );
      }),
    );
  }

  Widget _buildCTAButton(_PageData page) {
    final isLast = _currentPage == _pages.length - 1;

    return SizedBox(
      width: double.infinity,
      height: 56,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ElevatedButton(
          onPressed: _nextPage,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: page.gradient.first,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                isLast ? 'ابدأ الاستخدام' : 'متابعة',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: page.gradient.first,
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: page.gradient.first.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isLast
                      ? Icons.rocket_launch_rounded
                      : Icons.arrow_forward_rounded,
                  color: page.gradient.first,
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
