import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';

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
}

class AiChatScreenV2 extends ConsumerStatefulWidget {
  const AiChatScreenV2({super.key});

  @override
  ConsumerState<AiChatScreenV2> createState() => _AiChatScreenV2State();
}

class _AiChatScreenV2State extends ConsumerState<AiChatScreenV2>
    with TickerProviderStateMixin {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<ChatMsg> _msgs = [];
  bool _loading = false;
  String? _streamingText;
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    _tabCtrl.dispose();
    super.dispose();
  }

  // ═══════════════════════════════════════════════════════════
  // SEND MESSAGE
  // ═══════════════════════════════════════════════════════════

  Future<void> _send(String text, {String? mode, String? template}) async {
    if (text.trim().isEmpty || _loading) return;
    _ctrl.clear();

    setState(() {
      if (mode == null && template == null) {
        _msgs.add(ChatMsg(role: 'user', content: text));
      }
      _loading = true;
      _streamingText = '';
    });
    _scrollDown();

    try {
      final api = ref.read(apiClientProvider);
      final campaign = ref.read(campaignProvider);
      final analytics = ref.read(
        dashboardAnalyticsProvider(
          AnalyticsFilter(campaignType: campaign.value),
        ),
      );

      Map<String, dynamic>? ctx;
      analytics.whenData((d) => ctx = d);

      // Try streaming first
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
      setState(() {
        _msgs.add(
          ChatMsg(role: 'assistant', content: 'حدث خطأ: $e', source: 'error'),
        );
        _loading = false;
        _streamingText = null;
      });
    }
    _scrollDown();
  }

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
        'history': _msgs
            .take(10)
            .map((m) => {'role': m.role, 'content': m.content})
            .toList(),
        if (context != null) 'context': context,
        if (mode != null) 'mode': mode,
        if (template != null) 'template': template,
        'stream': true,
      })) {
        buffer.write(chunk);
        setState(() => _streamingText = buffer.toString());
        _scrollDown();
      }

      setState(() {
        _msgs.add(
          ChatMsg(
            role: 'assistant',
            content: buffer.toString(),
            source: 'groq',
          ),
        );
        _loading = false;
        _streamingText = null;
      });
    } catch (_) {
      // Fallback to normal
      await _sendNormal(
        api,
        text,
        context: context,
        mode: mode,
        template: template,
      );
    }
  }

  Future<void> _sendNormal(
    ApiClient api,
    String text, {
    Map<String, dynamic>? context,
    String? mode,
    String? template,
  }) async {
    final resp = await api.callFunction('ai-chat-v3', {
      'message': text,
      'history': _msgs
          .take(10)
          .map((m) => {'role': m.role, 'content': m.content})
          .toList(),
      if (context != null) 'context': context,
      if (mode != null) 'mode': mode,
      if (template != null) 'template': template,
    });

    final reply = resp['reply'] as String? ?? 'عذراً، لم أتمكن من المعالجة.';
    final source = resp['source'] as String? ?? 'unknown';

    setState(() {
      _msgs.add(ChatMsg(role: 'assistant', content: reply, source: source));
      _loading = false;
      _streamingText = null;
    });
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
                'Groq + MiMo + HuggingFace',
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
            onPressed: () => setState(() => _msgs.clear()),
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
        // AI Icon
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
      _Guide('📡', 'العمل بدون إنترنت', 'offline_mode'),
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
            // Guide button
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
            // Text field
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
            // Send button
            Container(
              decoration: BoxDecoration(
                gradient: _loading
                    ? null
                    : LinearGradient(colors: [cs.primary, cs.tertiary]),
                color: _loading ? cs.surfaceContainerHigh : null,
                borderRadius: BorderRadius.circular(16),
              ),
              child: IconButton(
                icon: Icon(
                  Icons.send_rounded,
                  color: _loading ? cs.onSurfaceVariant : cs.onPrimary,
                  size: 20,
                ),
                onPressed: _loading ? null : () => _send(_ctrl.text),
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
        'streaming' => '⚡ جارٍ الكتابة...',
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
