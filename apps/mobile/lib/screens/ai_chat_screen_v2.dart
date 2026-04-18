import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../providers/app_providers.dart';

// ═══════════════════════════════════════════════════════════
// CHAT MESSAGE MODEL
// ═══════════════════════════════════════════════════════════

class ChatMsg {
  final String role;
  final String content;
  final String? source;
  final DateTime time;
  final String id;

  ChatMsg({
    required this.role,
    required this.content,
    this.source,
    DateTime? time,
    String? id,
  }) : time = time ?? DateTime.now(),
       id = id ?? DateTime.now().millisecondsSinceEpoch.toString();

  Map<String, dynamic> toJson() => {
    'role': role,
    'content': content,
    'source': source,
    'time': time.toIso8601String(),
    'id': id,
  };

  factory ChatMsg.fromJson(Map<String, dynamic> j) => ChatMsg(
    role: j['role'] ?? 'assistant',
    content: j['content'] ?? '',
    source: j['source'],
    time: DateTime.tryParse(j['time'] ?? ''),
    id: j['id'],
  );
}

// ═══════════════════════════════════════════════════════════
// CHAT PERSISTENCE (isolated from UI thread)
// ═══════════════════════════════════════════════════════════

class _ChatStore {
  static const _box = 'ai_chat_v2';
  static const _key = 'msgs';

  static Future<List<ChatMsg>> load() async {
    try {
      final box = await Hive.openBox<String>(_box);
      final raw = box.get(_key);
      if (raw == null || raw.isEmpty) return [];
      return (jsonDecode(raw) as List)
          .map((j) => ChatMsg.fromJson(Map<String, dynamic>.from(j)))
          .toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> save(List<ChatMsg> msgs) async {
    try {
      final trimmed = msgs.length > 60 ? msgs.sublist(msgs.length - 60) : msgs;
      final box = await Hive.openBox<String>(_box);
      await box.put(_key, jsonEncode(trimmed.map((m) => m.toJson()).toList()));
    } catch (_) {}
  }

  /// ═══ FIX: Non-blocking clear — runs Hive delete in background ═══
  /// The old version called setState + Hive.clear() simultaneously,
  /// causing the UI to freeze while waiting for Hive I/O on mobile.
  static Future<void> clear() async {
    try {
      // Use compute-friendly approach: open box, delete key, close
      final box = await Hive.openBox<String>(_box);
      await box.delete(_key);
      // Don't await close — let it happen in background
      unawaited(box.close());
    } catch (_) {}
  }
}

// ═══════════════════════════════════════════════════════════
// AI CHAT SCREEN — Premium Edition
// ═══════════════════════════════════════════════════════════

class AiChatScreenV2 extends ConsumerStatefulWidget {
  const AiChatScreenV2({super.key});

  @override
  ConsumerState<AiChatScreenV2> createState() => _AiChatScreenV2State();
}

class _AiChatScreenV2State extends ConsumerState<AiChatScreenV2>
    with TickerProviderStateMixin {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final _listKey = GlobalKey<AnimatedListState>();
  final List<ChatMsg> _msgs = [];
  bool _loading = false;
  bool _mounted = true;
  DateTime? _lastSend;
  late AnimationController _typingAnimCtrl;
  late AnimationController _fadeCtrl;
  bool _showWelcome = true;

  @override
  void initState() {
    super.initState();
    _typingAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    )..forward();
    _restore();
  }

  @override
  void dispose() {
    _mounted = false;
    _ctrl.dispose();
    _scroll.dispose();
    _typingAnimCtrl.dispose();
    _fadeCtrl.dispose();
    super.dispose();
  }

  Future<void> _restore() async {
    final saved = await _ChatStore.load();
    if (saved.isNotEmpty && _mounted) {
      setState(() {
        _msgs.addAll(saved);
        _showWelcome = false;
      });
    }
  }

  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent + 80,
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  // ═══ SEND MESSAGE ═══

  Future<void> _send(String text, {String? template}) async {
    if (text.trim().isEmpty || _loading) return;

    final now = DateTime.now();
    if (_lastSend != null &&
        now.difference(_lastSend!) < const Duration(seconds: 1)) {
      return;
    }
    _lastSend = now;

    _ctrl.clear();
    setState(() {
      _showWelcome = false;
      _msgs.add(ChatMsg(role: 'user', content: text));
      _loading = true;
    });
    _scrollDown();
    // Save in background — don't block UI
    unawaited(_ChatStore.save(_msgs));

    try {
      final api = ref.read(apiClientProvider);

      final history = _msgs.length > 6
          ? _msgs.sublist(_msgs.length - 6)
          : _msgs;
      final historyJson = history
          .map(
            (m) => {
              'role': m.role,
              'content': m.content.length > 500
                  ? '${m.content.substring(0, 500)}...'
                  : m.content,
            },
          )
          .toList();

      final resp = await api
          .callFunction('ai-chat-v3', {
            'message': text,
            'history': historyJson,
            if (template != null) 'template': template,
          })
          .timeout(
            const Duration(seconds: 60),
            onTimeout: () {
              throw TimeoutException('انتهت مهلة الطلب');
            },
          );

      if (!_mounted) return;

      final reply =
          resp['reply'] as String? ??
          resp['message'] as String? ??
          resp['error'] as String? ??
          '';
      final source = resp['source'] as String? ?? 'unknown';

      setState(() {
        _msgs.add(
          ChatMsg(
            role: 'assistant',
            content: reply.isNotEmpty
                ? reply
                : '⚠️ تم استلام رد فارغ. حاول مرة أخرى.',
            source: source,
          ),
        );
        _loading = false;
      });
      unawaited(_ChatStore.save(_msgs));
    } on TimeoutException {
      if (!_mounted) return;
      setState(() {
        _msgs.add(
          ChatMsg(
            role: 'assistant',
            content:
                '⏱️ انتهت مهلة الطلب. قد يكون الخادم بطيئاً حالياً.\n\n'
                '💡 نصيحة: حاول مرة أخرى أو اسأل سؤالاً أقصر.',
            source: 'error',
          ),
        );
        _loading = false;
      });
      unawaited(_ChatStore.save(_msgs));
    } catch (e) {
      if (!_mounted) return;
      final errorMsg = e.toString();
      String userMessage;

      if (errorMsg.contains('Unauthorized') || errorMsg.contains('401')) {
        userMessage = '🔒 انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.';
      } else if (errorMsg.contains('Rate limit') || errorMsg.contains('429')) {
        userMessage = '⏳ أرسلت رسائل كثيرة. انتظر دقيقة وحاول مرة أخرى.';
      } else if (errorMsg.contains('Network') ||
          errorMsg.contains('Socket') ||
          errorMsg.contains('Failed host')) {
        userMessage =
            '📡 لا يوجد اتصال بالإنترنت.\nتحقق من الاتصال وحاول مرة أخرى.';
      } else {
        userMessage =
            '⚠️ حدث خطأ أثناء الاتصال.\n\n'
            '🔧 حاول مرة أخرى. إذا استمر، أعد تشغيل التطبيق.';
      }

      setState(() {
        _msgs.add(
          ChatMsg(role: 'assistant', content: userMessage, source: 'error'),
        );
        _loading = false;
      });
      unawaited(_ChatStore.save(_msgs));
    }
    _scrollDown();
  }

  // ═══ FIX: Delete chat without freeze ═══
  // Root cause: setState(() => _msgs.clear()) forced full ListView rebuild
  // while Hive I/O was blocking the UI thread.
  // Fix: Clear list immediately (fast), then persist in background.
  Future<void> _clearChat() async {
    HapticFeedback.mediumImpact();

    final ok = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _buildDeleteSheet(ctx),
    );

    if (ok != true || !_mounted) return;

    // 1. Optimistic UI update — instant, no rebuild
    setState(() {
      _msgs.clear();
      _showWelcome = true;
    });

    // 2. Clear Hive in background — never block UI
    // Using Future.microtask to ensure setState completes first
    Future.microtask(() async {
      await _ChatStore.clear();
    });
  }

  Widget _buildDeleteSheet(BuildContext ctx) {
    final cs = Theme.of(ctx).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: cs.onSurfaceVariant.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          // Icon
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: cs.errorContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.delete_outline_rounded,
              size: 28,
              color: cs.error,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'مسح المحادثة',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: cs.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'سيتم حذف جميع الرسائل نهائياً.\nلا يمكن التراجع عن هذا الإجراء.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 13,
              color: cs.onSurfaceVariant,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Text(
                    'إلغاء',
                    style: TextStyle(fontFamily: 'Cairo', color: cs.onSurface),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  style: FilledButton.styleFrom(
                    backgroundColor: cs.error,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text(
                    'مسح',
                    style: TextStyle(fontFamily: 'Cairo'),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ═══ COPY MESSAGE ═══

  void _copyMessage(ChatMsg msg) {
    HapticFeedback.lightImpact();
    Clipboard.setData(ClipboardData(text: msg.content));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
              SizedBox(width: 8),
              Text('تم النسخ!', style: TextStyle(fontFamily: 'Tajawal')),
            ],
          ),
          duration: const Duration(seconds: 1),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          margin: const EdgeInsets.all(16),
          backgroundColor: const Color(0xFF00897B),
        ),
      );
    }
  }

  // ═══ BUILD ═══

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: cs.surface,
      appBar: _buildAppBar(cs),
      body: Column(
        children: [
          Expanded(
            child: _showWelcome && _msgs.isEmpty
                ? _buildWelcome(cs, tt)
                : _buildMessages(cs),
          ),
          if (_loading) _buildTypingIndicator(cs),
          _buildInputBar(cs),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(ColorScheme cs) {
    return AppBar(
      elevation: 0,
      backgroundColor: cs.primary,
      foregroundColor: cs.onPrimary,
      flexibleSpace: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [cs.primary, cs.tertiary],
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
          ),
        ),
      ),
      title: Row(
        children: [
          // AI Avatar with glow
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: cs.onPrimary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: cs.onPrimary.withValues(alpha: 0.2),
                width: 1,
              ),
            ),
            child: Stack(
              children: [
                Center(
                  child: Icon(
                    Icons.auto_awesome_rounded,
                    size: 20,
                    color: cs.onPrimary,
                  ),
                ),
                // Online indicator
                Positioned(
                  bottom: 2,
                  right: 2,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: const Color(0xFF4CAF50),
                      shape: BoxShape.circle,
                      border: Border.all(color: cs.primary, width: 1.5),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'المساعد الذكي',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Cairo',
                ),
              ),
              Text(
                'متصل ببيانات النظام',
                style: TextStyle(
                  fontSize: 10,
                  fontFamily: 'Tajawal',
                  color: cs.onPrimary.withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        if (_msgs.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(left: 8),
            decoration: BoxDecoration(
              color: cs.onPrimary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: IconButton(
              icon: const Icon(Icons.delete_outline_rounded, size: 20),
              onPressed: _clearChat,
              tooltip: 'مسح المحادثة',
            ),
          ),
      ],
    );
  }

  // ═══ WELCOME SCREEN ═══

  Widget _buildWelcome(ColorScheme cs, TextTheme tt) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 8),
          // Hero with animation
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.0, end: 1.0),
            duration: const Duration(milliseconds: 800),
            curve: Curves.easeOutBack,
            builder: (context, value, child) =>
                Transform.scale(scale: value, child: child),
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [cs.primary, cs.tertiary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: cs.primary.withValues(alpha: 0.3),
                    blurRadius: 24,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Icon(
                Icons.auto_awesome_rounded,
                size: 40,
                color: cs.onPrimary,
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'كيف أساعدك اليوم؟',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              fontFamily: 'Cairo',
              color: cs.onSurface,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'المساعد متصل ببيانات النظام مباشرة',
            style: TextStyle(
              fontSize: 13,
              fontFamily: 'Tajawal',
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 28),

          // Quick query cards
          _sectionLabel('📊 استعلامات سريعة', cs),
          const SizedBox(height: 12),
          _quickQueryCard(
            cs,
            Icons.bar_chart_rounded,
            'حالة الإرساليات',
            'عرض إحصائيات الإرساليات حسب الحالة',
            'ما حالة الإرساليات؟',
            const Color(0xFF2196F3),
          ),
          _quickQueryCard(
            cs,
            Icons.warning_amber_rounded,
            'النواقص الحرجة',
            'عرض النواقص الميدانية ومستوى الخطورة',
            'أين النواقص الحرجة؟',
            const Color(0xFFFF5722),
          ),
          _quickQueryCard(
            cs,
            Icons.location_city_rounded,
            'أداء المحافظات',
            'ترتيب المحافظات حسب عدد الإرساليات',
            'أي المحافظات تحتاج دعم؟',
            const Color(0xFF9C27B0),
          ),
          _quickQueryCard(
            cs,
            Icons.people_alt_rounded,
            'المستخدمين',
            'عرض إحصائيات المستخدمين والأدوار',
            'كم عدد المستخدمين؟',
            const Color(0xFF00897B),
          ),

          const SizedBox(height: 20),
          _sectionLabel('🤖 اسأل أي شيء', cs),
          const SizedBox(height: 12),
          _quickQueryCard(
            cs,
            Icons.vaccines_rounded,
            'تغطية التطعيم',
            'اسأل عن تغطية Penta, OPV, MR',
            'ما تغطية التطعيم؟',
            const Color(0xFF4CAF50),
          ),
          _quickQueryCard(
            cs,
            Icons.trending_up_rounded,
            'تحليل واتجاهات',
            'تحليل أداء الحملات',
            'حلل أداء الأسبوع',
            const Color(0xFFFF9800),
          ),
          _quickQueryCard(
            cs,
            Icons.description_rounded,
            'إنشاء تقرير',
            'توليد تقرير تلقائي',
            'أنشئ تقرير يومي',
            const Color(0xFF607D8B),
          ),

          const SizedBox(height: 20),
          _sectionLabel('📝 قوالب التقارير', cs),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 2.4,
            children: [
              _reportCard(cs, '📅', 'daily', 'يومي', const Color(0xFF1976D2)),
              _reportCard(
                cs,
                '📊',
                'weekly',
                'أسبوعي',
                const Color(0xFF388E3C),
              ),
              _reportCard(
                cs,
                '⚠️',
                'shortages',
                'النواقص',
                const Color(0xFFD32F2F),
              ),
              _reportCard(
                cs,
                '💉',
                'coverage',
                'التغطية',
                const Color(0xFF7B1FA2),
              ),
            ],
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _sectionLabel(String text, ColorScheme cs) {
    return Align(
      alignment: Alignment.centerRight,
      child: Text(
        text,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          fontFamily: 'Cairo',
          color: cs.onSurface,
        ),
      ),
    );
  }

  Widget _quickQueryCard(
    ColorScheme cs,
    IconData icon,
    String title,
    String desc,
    String query,
    Color accentColor,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        elevation: 0,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            HapticFeedback.lightImpact();
            _send(query);
          },
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: accentColor.withValues(alpha: 0.12),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, size: 24, color: accentColor),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: cs.onSurface,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        desc,
                        style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 11,
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_back_ios_rounded,
                  size: 14,
                  color: cs.onSurfaceVariant.withValues(alpha: 0.35),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _reportCard(
    ColorScheme cs,
    String emoji,
    String templateId,
    String name,
    Color accent,
  ) {
    return Material(
      color: cs.surfaceContainerLow,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {
          HapticFeedback.lightImpact();
          _send('أنشئ تقرير $name', template: templateId);
        },
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: accent.withValues(alpha: 0.12), width: 1),
          ),
          child: Row(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 22)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'تقرير $name',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurface,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ═══ MESSAGES LIST ═══

  Widget _buildMessages(ColorScheme cs) {
    return ListView.builder(
      controller: _scroll,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemCount: _msgs.length,
      itemBuilder: (context, i) => _buildBubble(_msgs[i], cs, i),
    );
  }

  Widget _buildBubble(ChatMsg msg, ColorScheme cs, int index) {
    final isUser = msg.role == 'user';
    final isError = msg.source == 'error';
    final isData = msg.source == 'function_call';

    return TweenAnimationBuilder<double>(
      key: ValueKey(msg.id),
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) => Opacity(
        opacity: value,
        child: Transform.translate(
          offset: Offset(0, (1 - value) * 12),
          child: child,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Row(
          mainAxisAlignment: isUser
              ? MainAxisAlignment.end
              : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isUser) ...[
              _buildAvatar(cs, isError, isData),
              const SizedBox(width: 10),
            ],
            Flexible(
              child: Column(
                crossAxisAlignment: isUser
                    ? CrossAxisAlignment.end
                    : CrossAxisAlignment.start,
                children: [
                  // Message bubble
                  GestureDetector(
                    onLongPress: () => _copyMessage(msg),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: isUser
                            ? cs.primary
                            : isError
                            ? cs.errorContainer
                            : isData
                            ? cs.primaryContainer.withValues(alpha: 0.5)
                            : cs.surfaceContainerHigh,
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(20),
                          topRight: const Radius.circular(20),
                          bottomLeft: Radius.circular(isUser ? 20 : 6),
                          bottomRight: Radius.circular(isUser ? 6 : 20),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: (isUser ? cs.primary : Colors.black)
                                .withValues(alpha: isUser ? 0.15 : 0.05),
                            blurRadius: 12,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: _buildMessageContent(msg, cs, isUser, isError),
                    ),
                  ),
                  // Source label
                  if (!isUser && msg.source != null && msg.source != 'error')
                    Padding(
                      padding: const EdgeInsets.only(top: 4, right: 8),
                      child: Text(
                        _sourceLabel(msg.source!),
                        style: TextStyle(
                          fontSize: 10,
                          fontFamily: 'Tajawal',
                          color: cs.onSurfaceVariant.withValues(alpha: 0.5),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (isUser) ...[const SizedBox(width: 10), _buildUserAvatar(cs)],
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar(ColorScheme cs, bool isError, bool isData) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isError
              ? [cs.errorContainer, cs.error.withValues(alpha: 0.3)]
              : isData
              ? [cs.primaryContainer, cs.primary.withValues(alpha: 0.2)]
              : [cs.primaryContainer, cs.tertiaryContainer],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: (isError ? cs.error : cs.primary).withValues(alpha: 0.15),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Icon(
        isError
            ? Icons.warning_rounded
            : isData
            ? Icons.analytics_rounded
            : Icons.auto_awesome_rounded,
        size: 18,
        color: isError
            ? cs.error
            : isData
            ? cs.primary
            : cs.primary,
      ),
    );
  }

  Widget _buildUserAvatar(ColorScheme cs) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [cs.tertiaryContainer, cs.tertiary.withValues(alpha: 0.2)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(Icons.person_rounded, size: 18, color: cs.tertiary),
    );
  }

  Widget _buildMessageContent(
    ChatMsg msg,
    ColorScheme cs,
    bool isUser,
    bool isError,
  ) {
    final textColor = isUser
        ? cs.onPrimary
        : isError
        ? cs.onErrorContainer
        : cs.onSurface;

    // Simple markdown-like formatting
    final lines = msg.content.split('\n');
    return SelectableText(
      msg.content,
      style: TextStyle(
        fontFamily: 'Tajawal',
        color: textColor,
        fontSize: 14,
        height: 1.8,
      ),
    );
  }

  String _sourceLabel(String s) => switch (s) {
    'groq' => '⚡ Groq AI',
    'mimo' => '🤖 MiMo AI',
    'function_call' => '📊 من بيانات النظام',
    'rag' => '📚 من قاعدة المعرفة',
    _ => '',
  };

  // ═══ TYPING INDICATOR ═══

  Widget _buildTypingIndicator(ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [cs.primaryContainer, cs.tertiaryContainer],
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              Icons.auto_awesome_rounded,
              size: 16,
              color: cs.primary,
            ),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDot(cs.primary, 0),
                const SizedBox(width: 4),
                _buildDot(cs.primary, 1),
                const SizedBox(width: 4),
                _buildDot(cs.primary, 2),
                const SizedBox(width: 10),
                Text(
                  'جارٍ التحليل...',
                  style: TextStyle(
                    fontFamily: 'Tajawal',
                    color: cs.onSurfaceVariant,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDot(Color color, int index) {
    return AnimatedBuilder(
      animation: _typingAnimCtrl,
      builder: (context, child) {
        final progress = (_typingAnimCtrl.value + index * 0.3) % 1.0;
        final opacity = (0.3 + 0.7 * (1 - (progress - 0.5).abs() * 2)).clamp(
          0.3,
          1.0,
        );
        return Opacity(opacity: opacity, child: child);
      },
      child: Container(
        width: 7,
        height: 7,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
    );
  }

  // ═══ INPUT BAR ═══

  Widget _buildInputBar(ColorScheme cs) {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
        decoration: BoxDecoration(
          color: cs.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: cs.outline.withValues(alpha: 0.1),
                    width: 1,
                  ),
                ),
                child: TextField(
                  controller: _ctrl,
                  textDirection: TextDirection.rtl,
                  style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'اسأل عن بيانات النظام أو التطعيم...',
                    hintStyle: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 13,
                      color: cs.onSurfaceVariant.withValues(alpha: 0.5),
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                  ),
                  onSubmitted: (t) => _send(t),
                  maxLines: null,
                  textInputAction: TextInputAction.send,
                ),
              ),
            ),
            const SizedBox(width: 10),
            // Send button
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                gradient: _loading
                    ? null
                    : LinearGradient(
                        colors: [cs.primary, cs.tertiary],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                color: _loading ? cs.surfaceContainerHigh : null,
                borderRadius: BorderRadius.circular(16),
                boxShadow: _loading
                    ? null
                    : [
                        BoxShadow(
                          color: cs.primary.withValues(alpha: 0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 3),
                        ),
                      ],
              ),
              child: _loading
                  ? Padding(
                      padding: const EdgeInsets.all(12),
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: cs.onSurfaceVariant,
                      ),
                    )
                  : IconButton(
                      icon: Icon(
                        Icons.send_rounded,
                        color: cs.onPrimary,
                        size: 22,
                      ),
                      onPressed: () => _send(_ctrl.text),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
