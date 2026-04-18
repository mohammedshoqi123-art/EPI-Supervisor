import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';

// ═══════════════════════════════════════════════════════════
// CHAT MESSAGE MODEL
// ═══════════════════════════════════════════════════════════

class ChatMsg {
  final String role;
  final String content;
  final String? source;
  final DateTime time;
  ChatMsg({
    required this.role,
    required this.content,
    this.source,
    DateTime? time,
  }) : time = time ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'role': role,
        'content': content,
        'source': source,
        'time': time.toIso8601String(),
      };

  factory ChatMsg.fromJson(Map<String, dynamic> j) => ChatMsg(
        role: j['role'] ?? 'assistant',
        content: j['content'] ?? '',
        source: j['source'],
        time: DateTime.tryParse(j['time'] ?? ''),
      );
}

// ═══════════════════════════════════════════════════════════
// CHAT PERSISTENCE — saves/restores conversation in Hive
// ═══════════════════════════════════════════════════════════

class _ChatPersistence {
  static const _boxName = 'ai_chat_history';
  static const _key = 'messages';

  static Future<List<ChatMsg>> load() async {
    try {
      final box = await Hive.openBox<String>(_boxName);
      final raw = box.get(_key);
      if (raw == null || raw.isEmpty) return [];
      final list = jsonDecode(raw) as List;
      return list
          .map((j) => ChatMsg.fromJson(Map<String, dynamic>.from(j)))
          .toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> save(List<ChatMsg> msgs) async {
    try {
      // Keep last 50 messages max
      final trimmed = msgs.length > 50 ? msgs.sublist(msgs.length - 50) : msgs;
      final box = await Hive.openBox<String>(_boxName);
      await box.put(_key, jsonEncode(trimmed.map((m) => m.toJson()).toList()));
    } catch (_) {}
  }

  static Future<void> clear() async {
    try {
      final box = await Hive.openBox<String>(_boxName);
      await box.delete(_key);
    } catch (_) {}
  }
}

// ═══════════════════════════════════════════════════════════
// AI CHAT SCREEN
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
  List<ChatMsg> _msgs = [];
  bool _loading = false;
  String? _streamingText;
  late TabController _tabCtrl;

  // FIX: Rate limiting — prevent rapid clicks
  DateTime? _lastSendTime;
  static const _minSendInterval = Duration(seconds: 1);

  // FIX: Track if widget is mounted for async safety
  bool _mounted = true;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _restoreChat();
  }

  @override
  void dispose() {
    _mounted = false;
    _ctrl.dispose();
    _scroll.dispose();
    _tabCtrl.dispose();
    super.dispose();
  }

  /// FIX: Restore conversation from Hive on page load
  Future<void> _restoreChat() async {
    final saved = await _ChatPersistence.load();
    if (saved.isNotEmpty && _mounted) {
      setState(() => _msgs = saved);
    }
  }

  /// FIX: Save conversation to Hive after every change
  Future<void> _saveChat() async {
    await _ChatPersistence.save(_msgs);
  }

  // ═══════════════════════════════════════════════════════════
  // SEND MESSAGE — with rate limiting
  // ═══════════════════════════════════════════════════════════

  Future<void> _send(String text, {String? mode, String? template}) async {
    if (text.trim().isEmpty || _loading) return;

    // FIX: Rate limit — minimum 1 second between sends
    final now = DateTime.now();
    if (_lastSendTime != null &&
        now.difference(_lastSendTime!) < _minSendInterval) {
      return;
    }
    _lastSendTime = now;

    _ctrl.clear();

    setState(() {
      if (mode == null && template == null) {
        _msgs.add(ChatMsg(role: 'user', content: text));
      }
      _loading = true;
      _streamingText = '';
    });
    _scrollDown();
    _saveChat();

    try {
      final api = ref.read(apiClientProvider);
      final campaign = ref.read(campaignProvider);
      final analytics = ref.read(
        dashboardAnalyticsProvider(
          AnalyticsFilter(campaignType: campaign.value),
        ),
      );

      // FIX: Build compact context — only essential numbers, not full data
      Map<String, dynamic>? ctx;
      analytics.whenData((d) => ctx = _compactContext(d));

      // Try streaming first (only for normal chat, not templates/modes)
      final useStream = mode == null && template == null;

      if (useStream) {
        await _sendStreaming(
          api,
          text,
          context: ctx,
          mode: mode,
          template: template,
        );
      } else {
        await _sendNormal(
          api,
          text,
          context: ctx,
          mode: mode,
          template: template,
        );
      }
    } catch (e) {
      // Show error to user
      if (!_mounted) return;
      setState(() {
        _msgs.add(
          ChatMsg(
            role: 'assistant',
            content:
                '⚠️ فشل الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
            source: 'error',
          ),
        );
        _loading = false;
        _streamingText = null;
      });
      _saveChat();
    }
    _scrollDown();
  }

  /// FIX: Build compact context — only key numbers, not full JSON
  Map<String, dynamic> _compactContext(Map<String, dynamic> data) {
    final subs = data['submissions'] as Map<String, dynamic>? ?? {};
    final byStatus = subs['byStatus'] as Map<String, dynamic>? ?? {};
    final shorts = data['shortages'] as Map<String, dynamic>? ?? {};

    return {
      'submissions': {
        'total': subs['total'] ?? 0,
        'today': subs['today'] ?? 0,
        'byStatus': byStatus,
      },
      'shortages': {
        'total': shorts['total'] ?? 0,
        'resolved': shorts['resolved'] ?? 0,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════
  // STREAMING — falls back to normal request on failure
  // ═══════════════════════════════════════════════════════════

  Future<void> _sendStreaming(
    ApiClient api,
    String text, {
    Map<String, dynamic>? context,
    String? mode,
    String? template,
  }) async {
    final buffer = StringBuffer();

    try {
      await for (final chunk in api.callFunctionStream('ai-chat-v3', {
        'message': text,
        'history': _buildHistory(6),
        if (context != null) 'context': context,
        if (mode != null) 'mode': mode,
        if (template != null) 'template': template,
        'stream': true,
      })) {
        if (!_mounted) return;
        buffer.write(chunk);
        setState(() => _streamingText = buffer.toString());
        _scrollDown();
      }

      if (!_mounted) return;
      final content = buffer.toString().trim();
      setState(() {
        _msgs.add(
          ChatMsg(
            role: 'assistant',
            content: content.isNotEmpty ? content : '⚠️ تم استلام رد فارغ.',
            source: 'groq',
          ),
        );
        _loading = false;
        _streamingText = null;
      });
      _saveChat();
    } catch (_) {
      // Fallback: streaming → normal (no offline)
      await _sendNormal(
        api,
        text,
        context: context,
        mode: mode,
        template: template,
      );
    }
  }

  // ═══════════════════════════════════════════════════════════
  // NORMAL REQUEST
  // ═══════════════════════════════════════════════════════════

  Future<void> _sendNormal(
    ApiClient api,
    String text, {
    Map<String, dynamic>? context,
    String? mode,
    String? template,
  }) async {
    try {
      final resp = await api.callFunction('ai-chat-v3', {
        'message': text,
        'history': _buildHistory(6),
        if (context != null) 'context': context,
        if (mode != null) 'mode': mode,
        if (template != null) 'template': template,
      });

      if (!_mounted) return;
      final reply = resp['reply'] as String? ?? 'عذراً، لم أتمكن من المعالجة.';
      final source = resp['source'] as String? ?? 'unknown';

      // Check if reply is an error message
      final displayReply = (reply.isEmpty)
          ? '⚠️ تم استلام رد فارغ من الخادم. حاول مرة أخرى.'
          : reply;

      setState(() {
        _msgs.add(
          ChatMsg(role: 'assistant', content: displayReply, source: source),
        );
        _loading = false;
        _streamingText = null;
      });
      _saveChat();
    } catch (e) {
      if (!_mounted) return;
      setState(() {
        _msgs.add(
          ChatMsg(
            role: 'assistant',
            content:
                '⚠️ فشل الاتصال: ${e.toString().length > 100 ? "خطأ في الشبكة" : e}',
            source: 'error',
          ),
        );
        _loading = false;
        _streamingText = null;
      });
      _saveChat();
    }
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  /// FIX: Build trimmed history — last N messages, content truncated to 500 chars
  List<Map<String, String>> _buildHistory(int maxMessages) {
    final recent = _msgs.length > maxMessages
        ? _msgs.sublist(_msgs.length - maxMessages)
        : _msgs;
    return recent
        .where((m) => m.role == 'user' || m.role == 'assistant')
        .map((m) => {
              'role': m.role,
              'content': m.content.length > 500
                  ? '${m.content.substring(0, 500)}...'
                  : m.content,
            })
        .toList();
  }

  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent + 60,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // BUILD
  // ═══════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Scaffold(
      backgroundColor: cs.surfaceContainerLowest,
      appBar: _buildAppBar(cs),
      body: Column(
        children: [
          if (_msgs.isEmpty) Expanded(child: _buildWelcome(cs)),
          if (_msgs.isNotEmpty) Expanded(child: _buildMessages(cs)),
          if (_loading && _streamingText == null) _buildTypingIndicator(cs),
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
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: cs.onPrimary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.auto_awesome_rounded, size: 20),
          ),
          const SizedBox(width: 10),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'المساعد الذكي',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Cairo',
                ),
              ),
              Text(
                'Groq + HuggingFace + Offline',
                style: TextStyle(
                  fontSize: 10,
                  fontFamily: 'Tajawal',
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        if (_msgs.isNotEmpty)
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded, size: 22),
            onPressed: () async {
              setState(() => _msgs.clear());
              await _ChatPersistence.clear();
            },
            tooltip: 'مسح المحادثة',
          ),
        const SizedBox(width: 4),
      ],
      bottom: _msgs.isEmpty
          ? TabBar(
              controller: _tabCtrl,
              indicatorColor: cs.onPrimary,
              labelColor: cs.onPrimary,
              unselectedLabelColor: cs.onPrimary.withValues(alpha: 0.6),
              indicatorSize: TabBarIndicatorSize.tab,
              labelStyle: const TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
              tabs: const [
                Tab(
                  icon: Icon(Icons.lightbulb_outline_rounded, size: 18),
                  text: 'اقتراحات',
                ),
                Tab(
                  icon: Icon(Icons.description_rounded, size: 18),
                  text: 'تقارير',
                ),
                Tab(
                  icon: Icon(Icons.help_outline_rounded, size: 18),
                  text: 'الدليل',
                ),
              ],
            )
          : null,
    );
  }

  // ═══════════════════════════════════════════════════════════
  // WELCOME SCREEN
  // ═══════════════════════════════════════════════════════════

  Widget _buildWelcome(ColorScheme cs) {
    return TabBarView(
      controller: _tabCtrl,
      children: [
        _buildSuggestionsTab(cs),
        _buildReportsTab(cs),
        _buildGuideTab(cs),
      ],
    );
  }

  Widget _buildSuggestionsTab(ColorScheme cs) {
    final items = [
      _Sugg('📊', 'ما حالة الإرساليات اليوم؟', 'عرض إحصائيات فورية'),
      _Sugg('⚠️', 'أين النواقص الحرجة؟', 'تحديد النواقص ومستوى الخطورة'),
      _Sugg('📈', 'اعرض تقرير الأسبوع', 'تحليل اتجاه الأسبوع الحالي'),
      _Sugg('🗺️', 'أي المحافظات تحتاج دعم؟', 'ترتيب بالأداء'),
      _Sugg('💉', 'ما تغطية التطعيم؟', 'تحليل Penta3 ونسبة الانسحاب'),
      _Sugg('✅', 'حلل جودة الإدخال', 'نسبة الرفض واكتمال الحقول'),
      _Sugg('🔄', 'قارن الأسبوع الحالي بالسابق', 'نسب تغيير'),
      _Sugg('👥', 'تقييم أداء المشرفين', 'عدد وجودة الإرساليات'),
    ];

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SizedBox(height: 12),
        Center(
          child: Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [cs.primary, cs.tertiary]),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: cs.primary.withValues(alpha: 0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
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
        const SizedBox(height: 16),
        Text(
          'كيف أساعدك اليوم؟',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            fontFamily: 'Cairo',
            color: cs.onSurface,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'اختر اقتراحاً أو اكتب سؤالك',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13,
            fontFamily: 'Tajawal',
            color: cs.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 24),
        ...items.map(
          (s) => _SuggestionTile(
            s: s,
            onTap: () {
              HapticFeedback.lightImpact();
              _send(s.question);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildReportsTab(ColorScheme cs) {
    final templates = [
      _Tmpl('daily', '📅', 'التقرير اليومي', 'ملخص شامل ليوم العمل'),
      _Tmpl('weekly', '📊', 'التقرير الأسبوعي', 'تحليل اتجاه الأسبوع'),
      _Tmpl('governorate', '🗺️', 'تقرير المحافظات', 'مقارنة أداء المحافظات'),
      _Tmpl('shortages', '⚠️', 'تقرير النواقص', 'تحليل النواقص والحلول'),
      _Tmpl('quality', '✅', 'تقرير جودة البيانات', 'اكتمال ودقة الإدخال'),
      _Tmpl('coverage', '💉', 'تقرير التغطية', 'تغطية التطعيمات وفجوات'),
    ];

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SizedBox(height: 8),
        Text(
          '📝 اختر قالب تقرير',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            fontFamily: 'Cairo',
            color: cs.onSurface,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'سيتم إنشاؤه تلقائياً بناءً على البيانات الحالية',
          style: TextStyle(
            fontSize: 12,
            fontFamily: 'Tajawal',
            color: cs.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.2,
          children: templates
              .map(
                (t) => _ReportCard(
                  t: t,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    _send('أنشئ ${t.name}', template: t.id);
                  },
                ),
              )
              .toList(),
        ),
      ],
    );
  }

  Widget _buildGuideTab(ColorScheme cs) {
    final guides = [
      _Guide('📝', 'كيف أملأ استمارة؟', 'fill_a_form'),
      _Guide('📊', 'كيف أشاهد التحليلات؟', 'view_analytics'),
      _Guide('🗺️', 'كيف أستخدم الخريطة؟', 'use_map'),
      _Guide('📤', 'كيف أُصدّر PDF؟', 'export_pdf'),
      _Guide('👥', 'إدارة المستخدمين', 'manage_users'),
      _Guide('🔄', 'المزامنة اليدوية', 'manual_sync'),
    ];

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SizedBox(height: 8),
        Text(
          '📖 دليل الاستخدام',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            fontFamily: 'Cairo',
            color: cs.onSurface,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'اسألني عن أي ميزة وسأشرحها',
          style: TextStyle(
            fontSize: 12,
            fontFamily: 'Tajawal',
            color: cs.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 16),
        ...guides.map(
          (g) => _GuideTile(
            g: g,
            onTap: () {
              HapticFeedback.lightImpact();
              _send('اشرح لي ${g.question}', mode: 'guide');
            },
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MESSAGES LIST
  // ═══════════════════════════════════════════════════════════

  Widget _buildMessages(ColorScheme cs) {
    final items = <Widget>[];
    for (int i = 0; i < _msgs.length; i++) {
      items.add(_MsgBubble(msg: _msgs[i], cs: cs));
    }
    if (_streamingText != null && _streamingText!.isNotEmpty) {
      items.add(
        _MsgBubble(
          msg: ChatMsg(
            role: 'assistant',
            content: _streamingText!,
            source: 'streaming',
          ),
          cs: cs,
        ),
      );
    }

    return ListView(
      controller: _scroll,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      children: items,
    );
  }

  Widget _buildTypingIndicator(ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: cs.primaryContainer,
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
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: cs.primary,
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  'جارٍ التفكير...',
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

  // ═══════════════════════════════════════════════════════════
  // INPUT BAR
  // ═══════════════════════════════════════════════════════════

  Widget _buildInputBar(ColorScheme cs) {
    final canSend = _lastSendTime == null ||
        DateTime.now().difference(_lastSendTime!) > _minSendInterval;

    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
        decoration: BoxDecoration(
          color: cs.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              decoration: BoxDecoration(
                color: cs.primaryContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: IconButton(
                icon: Icon(
                  Icons.menu_book_rounded,
                  color: cs.primary,
                  size: 22,
                ),
                onPressed: () {
                  if (_msgs.isEmpty)
                    _tabCtrl.animateTo(2);
                  else
                    _send('أحتاج مساعدة', mode: 'guide');
                },
                tooltip: 'الدليل',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: _ctrl,
                  textDirection: TextDirection.rtl,
                  style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'اسألني أي شيء...',
                    hintStyle: TextStyle(
                      fontFamily: 'Tajawal',
                      color: cs.onSurfaceVariant.withValues(alpha: 0.6),
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 12,
                    ),
                  ),
                  onSubmitted: (t) => _send(t),
                  maxLines: null,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              decoration: BoxDecoration(
                gradient: (_loading || !canSend)
                    ? null
                    : LinearGradient(colors: [cs.primary, cs.tertiary]),
                color: (_loading || !canSend) ? cs.surfaceContainerHigh : null,
                borderRadius: BorderRadius.circular(16),
              ),
              child: IconButton(
                icon: Icon(
                  Icons.send_rounded,
                  color: (_loading || !canSend)
                      ? cs.onSurfaceVariant
                      : cs.onPrimary,
                  size: 20,
                ),
                onPressed:
                    (_loading || !canSend) ? null : () => _send(_ctrl.text),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// WIDGETS
// ═══════════════════════════════════════════════════════════

class _MsgBubble extends StatelessWidget {
  final ChatMsg msg;
  final ColorScheme cs;
  const _MsgBubble({required this.msg, required this.cs});

  @override
  Widget build(BuildContext context) {
    final isUser = msg.role == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            CircleAvatar(
              radius: 18,
              backgroundColor: cs.primaryContainer,
              child: Icon(
                Icons.auto_awesome_rounded,
                size: 18,
                color: cs.primary,
              ),
            ),
            const SizedBox(width: 10),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: isUser ? cs.primary : cs.surfaceContainerHigh,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(isUser ? 18 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 18),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: SelectableText(
                    msg.content,
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      color: isUser ? cs.onPrimary : cs.onSurface,
                      fontSize: 14,
                      height: 1.6,
                    ),
                  ),
                ),
                if (!isUser && msg.source != null) ...[
                  const SizedBox(height: 4),
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: Text(
                      _sourceLabel(msg.source!),
                      style: TextStyle(
                        fontSize: 10,
                        color: cs.onSurfaceVariant.withValues(alpha: 0.5),
                        fontFamily: 'Tajawal',
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 10),
            CircleAvatar(
              radius: 18,
              backgroundColor: cs.tertiaryContainer,
              child: Icon(Icons.person_rounded, size: 18, color: cs.tertiary),
            ),
          ],
        ],
      ),
    );
  }

  String _sourceLabel(String s) => switch (s) {
        'groq' => '⚡ Groq',
        'mimo' => '🤖 MiMo',
        'function_call' => '📊 من قاعدة البيانات',
        'rag' => '📚 من قاعدة المعرفة',
        'error' => '⚠️ خطأ',
        _ => '',
      };
}

class _SuggestionTile extends StatelessWidget {
  final _Sugg s;
  final VoidCallback onTap;
  const _SuggestionTile({required this.s, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: cs.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(s.emoji, style: const TextStyle(fontSize: 22)),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        s.question,
                        style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: cs.onSurface,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        s.hint,
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
                  color: cs.onSurfaceVariant.withValues(alpha: 0.4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ReportCard extends StatelessWidget {
  final _Tmpl t;
  final VoidCallback onTap;
  const _ReportCard({required this.t, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Material(
      color: cs.surfaceContainerLow,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(t.emoji, style: const TextStyle(fontSize: 30)),
              const Spacer(),
              Text(
                t.name,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: cs.onSurface,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                t.desc,
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 10,
                  color: cs.onSurfaceVariant,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GuideTile extends StatelessWidget {
  final _Guide g;
  final VoidCallback onTap;
  const _GuideTile({required this.g, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Text(g.emoji, style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    g.question,
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: cs.onSurface,
                    ),
                  ),
                ),
                Icon(
                  Icons.arrow_back_ios_rounded,
                  size: 14,
                  color: cs.onSurfaceVariant.withValues(alpha: 0.4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ═══ Helper data classes ═══
class _Sugg {
  final String emoji, question, hint;
  _Sugg(this.emoji, this.question, this.hint);
}

class _Tmpl {
  final String id, emoji, name, desc;
  _Tmpl(this.id, this.emoji, this.name, this.desc);
}

class _Guide {
  final String emoji, question, feature;
  _Guide(this.emoji, this.question, this.feature);
}
