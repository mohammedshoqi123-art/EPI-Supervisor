import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';
import '../providers/full_sync_provider.dart';

/// ═══════════════════════════════════════════════════════════════════════
/// FirstLoginTourScreen — الدليل التعليمي عند أول تسجيل دخول
///
/// الهدف المزدوج (طلب المستخدم 2026-11):
/// 1) تعليم المستخدم استخدام النظام خطوة بخطوة (التالي ← التالي ← التالي)
/// 2) أثناء الجولة تُحمَّل صفحات النظام كاملة في الخلفية (مزامنة كاملة:
///    الإرساليات المعلقة، المحافظات، المديريات، النماذج، المراجع، المرفقات)
///    فلا يشعر المستخدم بتعليق أو بطء بعد الدخول
///
/// - تظهر مرة واحدة لكل مستخدم (SharedPreferences: first_login_tour_<uid>)
/// - شريط حالة صغير يعرض تقدم التجهيز في كل الصفحات
/// - زر المتابعة يعمل دائماً — لا مسدوديات: إذا فشلت الشبكة يكمل النظام
///   التجهيز تلقائياً في الخلفية كالمعتاد
/// ═══════════════════════════════════════════════════════════════════════

class FirstLoginTourScreen extends ConsumerStatefulWidget {
  final String userId;

  const FirstLoginTourScreen({super.key, required this.userId});

  static String _prefsKey(String userId) => 'first_login_tour_completed_$userId';

  static Future<bool> isCompleted(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_prefsKey(userId)) ?? false;
  }

  static Future<void> markCompleted(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefsKey(userId), true);
  }

  @override
  ConsumerState<FirstLoginTourScreen> createState() =>
      _FirstLoginTourScreenState();
}

class _FirstLoginTourScreenState extends ConsumerState<FirstLoginTourScreen>
    with SingleTickerProviderStateMixin {
  final _pageController = PageController();
  int _currentPage = 0;

  // ── حالة تجهيز النظام في الخلفية ──
  bool _warmupStarted = false;
  bool _warmupDone = false;
  String? _warmupError; // null = تمام، 'offline' = بلا شبكة، غيره = رسالة
  String? _warmupStep; // اسم الخطوة الحالية
  int _warmupCurrent = 0;
  int _warmupTotal = 0;

  late final AnimationController _fadeController =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 420))
        ..forward();

  @override
  void initState() {
    super.initState();
    // الجولة تبدأ التجهيز فوراً — أقرب وقت ممكن لأقصى استفادة أثناء التعلم
    _startWarmup();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  // ═════════════════════════════════════════════════════════════════════
  // تجهيز النظام في الخلفية — مزامنة كاملة أثناء تعلم المستخدم
  // ملاحظة: MainShell يشغّل syncAll تلقائياً أيضاً بعد 3 ثوانٍ —
  // FullSyncNotifier يدمج الطلبات المتزامنة (ينتظر المزامنة الجارية)،
  // فلن تحدث مزامنة مزدوجة أبداً.
  // ═════════════════════════════════════════════════════════════════════
  void _startWarmup() {
    if (_warmupStarted) return;
    _warmupStarted = true;

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!ConnectivityUtils.isOnline) {
        if (mounted) {
          setState(() {
            _warmupDone = true;
            _warmupError = 'offline';
          });
        }
        return;
      }

      try {
        final notifier = ref.read(fullSyncProvider.notifier);
        final result = await notifier.syncAll(onProgress: (step, current, total) {
          if (mounted) {
            setState(() {
              _warmupStep = step;
              _warmupCurrent = current;
              _warmupTotal = total;
            });
          }
        }).timeout(
          const Duration(seconds: 150),
          onTimeout: () => const FullSyncResult(error: 'انتهت المهلة'),
        );
        if (mounted) {
          setState(() {
            _warmupDone = true;
            _warmupError = result.error;
          });
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _warmupDone = true;
            _warmupError = e.toString();
          });
        }
      }
    });
  }

  void _nextPage() {
    HapticFeedback.lightImpact();
    if (_currentPage < _pages.length + 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 460),
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
    try {
      await FirstLoginTourScreen.markCompleted(widget.userId);
      // بيانات المزامنة وصلت أثناء الجولة — حدّث كل مزودات الشاشة الرئيسية
      // حتى يرى المستخدم الأرقام الطازجة فور إغلاق الدليل
      ref.invalidate(dashboardAnalyticsProvider);
      ref.invalidate(formStatsProvider);
      ref.invalidate(notificationCountProvider);
      ref.invalidate(formsProvider);
    } catch (_) {
      // لا نمنع الدخول أبداً بسبب فشل حفظ العلم
    }
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final page = _currentPage == 0 || _currentPage == _pages.length + 1
        ? null
        : _pages[_currentPage - 1];
    final isReadyPage = _currentPage == _pages.length + 1;
    final isLast = isReadyPage;

    final List<Color> gradient = page?.gradient ??
        (isReadyPage
            ? const [Color(0xFF1B5E20), Color(0xFF0D3D12), Color(0xFF062A0A)]
            : const [Color(0xFF00695C), Color(0xFF004D40), Color(0xFF00332E)]);
    final Color accent = page?.accentColor ??
        (isReadyPage ? const Color(0xFFB9F6CA) : const Color(0xFF64FFDA));

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: gradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // تخطي الجولة
              Align(
                alignment: AlignmentDirectional.centerEnd,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                  child: TextButton(
                    onPressed: _currentPage == 0 ? null : _skip,
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.white.withValues(alpha: 0.65),
                    ),
                    child: Text(
                      _currentPage == 0 ? '' : 'تخطي الجولة',
                      style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14),
                    ),
                  ),
                ),
              ),

              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: _pages.length + 2, // ترحيب + 6 أقسام + صفحة الجاهزية
                  onPageChanged: (index) {
                    setState(() => _currentPage = index);
                    HapticFeedback.selectionClick();
                  },
                  itemBuilder: (context, index) {
                    if (index == 0) return _buildWelcomePage();
                    if (index == _pages.length + 1) return _buildReadyPage();
                    return _TopicPage(
                      data: _pages[index - 1],
                      key: ValueKey('tour-$index'),
                    );
                  },
                ),
              ),

              // شريط حالة تجهيز النظام — يظهر في كل الصفحات
              _buildWarmupChip(accent),

              // المؤشرات + زر الإجراء
              Padding(
                padding: const EdgeInsets.fromLTRB(32, 10, 32, 26),
                child: Column(
                  children: [
                    _buildPageIndicator(),
                    const SizedBox(height: 20),
                    _buildCTAButton(isLast, accent, gradient.first),
                    const SizedBox(height: 10),
                    Text(
                      '${_currentPage + 1} من ${_pages.length + 2}',
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
      ),
    );
  }

  // ── صفحة الترحيب ──
  Widget _buildWelcomePage() {
    return FadeTransition(
      opacity: CurvedAnimation(parent: _fadeController, curve: Curves.easeOut),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Spacer(flex: 2),
            Container(
              width: 140,
              height: 140,
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
              padding: const EdgeInsets.all(20),
              child: ClipOval(
                child: Image.asset(
                  'assets/images/logo.png',
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Icon(
                    Icons.health_and_safety_rounded,
                    size: 56,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'أهلاً بك في نظام الإشراف الميداني',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 25,
                fontWeight: FontWeight.w800,
                color: Colors.white,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'لبرنامج التحصين الموسّع',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: Color(0xFF64FFDA),
              ),
            ),
            const SizedBox(height: 22),
            Text(
              'جولة سريعة تشرح لك النظام خطوة بخطوة.\n'
              'أثناء تصفحك للجولة يجهّز النظام كل صفحاته '
              'في الخلفية — عند انتهائك يكون كل شيء جاهزاً.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 14.5,
                color: Colors.white.withValues(alpha: 0.75),
                height: 1.8,
              ),
            ),
            const Spacer(flex: 3),
          ],
        ),
      ),
    );
  }

  // ── صفحة الجاهزية الأخيرة ──
  Widget _buildReadyPage() {
    final bool ready = _warmupDone && _warmupError == null;
    final bool offline = _warmupDone && _warmupError == 'offline';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 30),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Spacer(flex: 2),
          Container(
            width: 122,
            height: 122,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.08),
              border: Border.all(
                color: const Color(0xFFB9F6CA).withValues(alpha: 0.3),
                width: 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFB9F6CA).withValues(alpha: 0.16),
                  blurRadius: 44,
                  spreadRadius: 6,
                ),
              ],
            ),
            child: offline
                ? const Icon(Icons.wifi_off_rounded, size: 48, color: Colors.white)
                : ready
                    ? const Icon(Icons.verified_rounded, size: 52, color: Colors.white)
                    : const SizedBox(
                        width: 44,
                        height: 44,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 3,
                        ),
                      ),
          ),
          const SizedBox(height: 36),
          Text(
            offline
                ? 'أنت الآن بدون إنترنت'
                : ready
                    ? 'النظام جاهز بالكامل!'
                    : 'جاري تجهيز صفحات النظام…',
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontSize: 25,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            offline
                ? 'لا مشكلة — كل ميزات النظام تعمل بالبيانات المحفوظة على جهازك، '
                    'وسيتم تحديث كل شيء تلقائياً عند عودة الاتصال.'
                : ready
                    ? 'تم تحميل كل الصفحات والبيانات بنجاح. '
                        'اضغط «ابدأ الآن» وانطلق في عملك الميداني.'
                    : 'خذ وقتك في تصفح بقية الجولة — '
                        'سيصلك تنبيه هنا فور اكتمال التحميل.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 14.5,
              color: Colors.white.withValues(alpha: 0.78),
              height: 1.8,
            ),
          ),
          const Spacer(flex: 3),
        ],
      ),
    );
  }

  // ── شريط حالة التجهيز (كل الصفحات) ──
  Widget _buildWarmupChip(Color accent) {
    final bool ready = _warmupDone && _warmupError == null;
    final bool offline = _warmupDone && _warmupError == 'offline';
    final String text;
    final IconData icon;
    final Color color;

    if (offline) {
      icon = Icons.wifi_off_rounded;
      color = const Color(0xFFFFB74D);
      text = 'وضع أوفلاين — ستتم المزامنة تلقائياً عند عودة الشبكة';
    } else if (ready) {
      icon = Icons.check_circle_rounded;
      color = const Color(0xFF81C784);
      text = 'تم تجهيز النظام بالكامل';
    } else {
      icon = Icons.sync_rounded;
      color = accent;
      final stepTxt = (_warmupStep != null && _warmupStep!.isNotEmpty)
          ? ' — $_warmupStep'
          : '';
      final countTxt = _warmupTotal > 0 ? ' ($_warmupCurrent/$_warmupTotal)' : '';
      text = 'جاري تجهيز صفحات النظام$stepTxt$countTxt';
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 4, 24, 0),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.22),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: color.withValues(alpha: 0.35)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!ready && !offline)
              const SizedBox(
                width: 13,
                height: 13,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white70),
              )
            else
              Icon(icon, size: 15, color: color),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                text,
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.white.withValues(alpha: 0.85),
                ),
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPageIndicator() {
    final count = _pages.length + 2;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (index) {
        final isActive = _currentPage == index;
        final color = _currentPage == 0 || _currentPage == _pages.length + 1
            ? const Color(0xFF64FFDA)
            : _pages[_currentPage - 1].accentColor;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeInOut,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          width: isActive ? 30 : 8,
          height: 8,
          decoration: BoxDecoration(
            color: isActive ? color : Colors.white.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(4),
          ),
        );
      }),
    );
  }

  Widget _buildCTAButton(bool isLast, Color accent, Color bgColor) {
    final label = isLast ? 'ابدأ الآن' : (_currentPage == 0 ? 'لنبدأ الجولة' : 'التالي');
    final buttonTextColor =
        isLast ? const Color(0xFF062A0A) : bgColor;

    return SizedBox(
      width: double.infinity,
      height: 54,
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

// ═══════════════════════════════════════════════════════════════════════
// صفحة قسم من الجولة — حركة دخول متدرجة (تُعاد عند فتح الصفحة بسبب الـ key)
// ═══════════════════════════════════════════════════════════════════════

class _TopicPage extends StatelessWidget {
  final _TourPageData data;

  const _TopicPage({super.key, required this.data});

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

            // أيقونة القسم داخل هالة
            Container(
              width: 118,
              height: 118,
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
              child: Icon(data.icon, size: 48, color: Colors.white),
            ),
            const SizedBox(height: 40),

            Text(
              data.title,
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: Colors.white,
                height: 1.35,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),

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
            const SizedBox(height: 26),

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

// ═══════════════════════════════════════════════════════════════════════
// بيانات صفحات الجولة — تعليم كل قسم من النظام
// ═══════════════════════════════════════════════════════════════════════

class _TourPageData {
  final List<Color> gradient;
  final Color accentColor;
  final IconData icon;
  final String title;
  final String subtitle;
  final List<String> features;

  const _TourPageData({
    required this.gradient,
    required this.accentColor,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.features,
  });
}

const List<_TourPageData> _pages = <_TourPageData>[
  // 1) لوحة التحكم
  _TourPageData(
    gradient: [Color(0xFF00897B), Color(0xFF00695C), Color(0xFF004D40)],
    accentColor: Color(0xFF64FFDA),
    icon: Icons.space_dashboard_rounded,
    title: 'لوحة التحكم — مركز عملياتك',
    subtitle:
        'شاشة البداية تعرض أرقام الحملة لحظة بلحظة: الإرساليات، الإشعارات، '
        'وأدوات الوصول السريع لكل ما تحتاجه في الميدان',
    features: ['إحصائيات لحظية', 'إجراءات سريعة', 'تنبيهات فورية'],
  ),
  // 2) النماذج
  _TourPageData(
    gradient: [Color(0xFF1565C0), Color(0xFF0D47A1), Color(0xFF0A2463)],
    accentColor: Color(0xFF82B1FF),
    icon: Icons.assignment_rounded,
    title: 'تعبئة الاستمارات الميدانية',
    subtitle:
        'من تبويب «النماذج» اختر الاستمارة المناسبة ثم املأ الحقول — '
        'الموقع الجغرافي والتاريخ يُعبَّآن تلقائياً، والحفظ التلقائي يحميك من أي انقطاع',
    features: ['تعبئة تلقائية للبيانات', 'حفظ تلقائي أثناء الكتابة', 'التحقق قبل الإرسال'],
  ),
  // 3) الأوفلاين
  _TourPageData(
    gradient: [Color(0xFF455A64), Color(0xFF263238), Color(0xFF102027)],
    accentColor: Color(0xFFFFCC80),
    icon: Icons.cloud_off_rounded,
    title: 'يعمل كاملاً بدون إنترنت',
    subtitle:
        'ضعف الشبكة في الميدان لا يوقفك: كل استمارة تُحفظ على جهازك كمسودة، '
        'وعند عودة الاتصال تُرسل تلقائياً وبهذا الترتيب — دون فقدان أي بيانات',
    features: ['مسودات محفوظة على الجهاز', 'إرسال تلقائي عند عودة الشبكة', 'لا فقدان للبيانات إطلاقاً'],
  ),
  // 4) حالة الاستمارات
  _TourPageData(
    gradient: [Color(0xFFAD1457), Color(0xFF880E4F), Color(0xFF4A0D27)],
    accentColor: Color(0xFFFF80AB),
    icon: Icons.fact_check_rounded,
    title: 'متابعة حالة إرسالياتك',
    subtitle:
        'من «حالة الاستمارات» تتابع كل إرسالية: هل قيد المراجعة أم مقبولة أم مرفوضة، '
        'وتقرأ ملاحظات المراجع مباشرة وتعرف سبب الرفض إن وُجد',
    features: ['حالة كل إرسالية', 'ملاحظات المراجع', 'بحث وتصفية سريعان'],
  ),
  // 5) الخريطة والتقارير
  _TourPageData(
    gradient: [Color(0xFF6A1B9A), Color(0xFF4A148C), Color(0xFF311B92)],
    accentColor: Color(0xFFEA80FC),
    icon: Icons.map_rounded,
    title: 'الخريطة والتحليلات والتقارير',
    subtitle:
        'خريطة تفاعلية لمواقع الزيارات، تحليلات تُظهر بياناتك حسب صلاحيتك، '
        'وتقارير PDF وExcel جاهزة للمشاركة بضغطة واحدة',
    features: ['خريطة الزيارات', 'تحليلات حسب صلاحيتك', 'تقارير PDF وExcel'],
  ),
  // 6) المساعد الذكي
  _TourPageData(
    gradient: [Color(0xFFEF6C00), Color(0xFFE65100), Color(0xFF7A2E00)],
    accentColor: Color(0xFFFFD180),
    icon: Icons.auto_awesome_rounded,
    title: 'المساعد الذكي والمراجع',
    subtitle:
        'اسأل المساعد الذكي بأرقام دقيقة من قاعدة البيانات: كم إرسالية اليوم؟ '
        'وفي «المراجع» تجد الأدلة والدليل التعليمي متى احتجت',
    features: ['أسئلة بأرقام دقيقة', 'مراجع وأدلة الاستخدام', 'متاح في كل وقت'],
  ),
];
