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
  final String id;

  ChatMsg({
    required this.role,
    required this.content,
    this.source,
    DateTime? time,
    String? id,
  })  : time = time ?? DateTime.now(),
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
// CHAT PERSISTENCE
// ═══════════════════════════════════════════════════════════

class _ChatStore {
  static const _box = 'ai_chat_v3';
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

  static Future<void> clear() async {
    try {
      final box = await Hive.openBox<String>(_box);
      await box.delete(_key);
      unawaited(box.close());
    } catch (_) {}
  }
}

// ═══════════════════════════════════════════════════════════
// AI CHAT SCREEN V3 — Premium 3-Tab Edition
// ═══════════════════════════════════════════════════════════

class AiChatScreenV3 extends ConsumerStatefulWidget {
  const AiChatScreenV3({super.key});

  @override
  ConsumerState<AiChatScreenV3> createState() => _AiChatScreenV3State();
}

class _AiChatScreenV3State extends ConsumerState<AiChatScreenV3>
    with TickerProviderStateMixin {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<ChatMsg> _msgs = [];
  bool _loading = false;
  bool _mounted = true;
  DateTime? _lastSend;
  late AnimationController _typingAnimCtrl;
  bool _showWelcome = true;

  // ═══ Bot state (unified local→AI) ═══
  final _botCtrl = TextEditingController();
  final _botScroll = ScrollController();
  late BotEngine _botEngine;
  final List<BotMessage> _botMsgs = [];
  bool _botLoading = false;

  @override
  void initState() {
    super.initState();
    _typingAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
    _restore();
    _botEngine = BotEngine();
    _botEngine.initialize();
  }

  @override
  void dispose() {
    _mounted = false;
    _ctrl.dispose();
    _scroll.dispose();
    _botCtrl.dispose();
    _botScroll.dispose();
    _typingAnimCtrl.dispose();
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
    if (_lastSend != null && now.difference(_lastSend!) < const Duration(seconds: 1)) return;
    _lastSend = now;

    _ctrl.clear();
    setState(() {
      _showWelcome = false;
      _msgs.add(ChatMsg(role: 'user', content: text));
      _loading = true;
    });
    _scrollDown();
    unawaited(_ChatStore.save(_msgs));

    try {
      final api = ref.read(apiClientProvider);
      final modelSelection = ref.read(aiModelSelectionProvider);

      // Determine which provider to use
      String selectedProvider = modelSelection.provider;
      if (modelSelection.autoSelect) {
        final notifier = ref.read(aiModelSelectionProvider.notifier);
        selectedProvider = notifier.selectBestProvider(text);
      }

      // Try client-side AI providers first (Z AI, OpenRouter) before Edge Function
      if (selectedProvider == 'zai') {
        final zai = ref.read(zaiServiceProvider);
        if (zai != null) {
          try {
            final kbCtx = EpiKnowledgeBase.getRelevantContext(text);
            final systemPrompt = _buildSystemPrompt() + (kbCtx.isNotEmpty ? '\n\n$kbCtx' : '');
            final resp = await zai.chat(text, systemPrompt: systemPrompt, maxTokens: 800)
                .timeout(const Duration(seconds: 45));
            if (_mounted) {
              setState(() {
                _msgs.add(ChatMsg(role: 'assistant', content: resp, source: 'zai'));
                _loading = false;
              });
              unawaited(_ChatStore.save(_msgs));
            }
            return;
          } catch (_) {
            // Fall through to Edge Function
          }
        }
      }

      if (selectedProvider == 'openrouter') {
        final orService = ref.read(openRouterServiceProvider);
        if (orService != null) {
          try {
            final kbCtx = EpiKnowledgeBase.getRelevantContext(text);
            final systemPrompt = _buildSystemPrompt() + (kbCtx.isNotEmpty ? '\n\n$kbCtx' : '');
            final resp = await orService.chat(text, systemPrompt: systemPrompt, maxTokens: 800)
                .timeout(const Duration(seconds: 60));
            if (_mounted) {
              setState(() {
                _msgs.add(ChatMsg(role: 'assistant', content: resp, source: 'openrouter'));
                _loading = false;
              });
              unawaited(_ChatStore.save(_msgs));
            }
            return;
          } catch (_) {
            // Fall through to Edge Function
          }
        }
      }

      // Default: Edge Function (ai-chat-v3) with streaming
      final history = _msgs.length > 6 ? _msgs.sublist(_msgs.length - 6) : _msgs;
      final historyJson = history
          .map((m) => {
                'role': m.role,
                'content': m.content.length > 500 ? '${m.content.substring(0, 500)}...' : m.content,
              })
          .toList();

      setState(() {
        _msgs.add(ChatMsg(role: 'assistant', content: '', source: 'streaming'));
      });

      final buffer = StringBuffer();
      bool gotAnyText = false;

      await for (final chunk in api.callFunctionStream('ai-chat-v3', {
        'message': text,
        'history': historyJson,
        'stream': true,
        if (template != null) 'template': template,
      }).timeout(const Duration(seconds: 60), onTimeout: (sink) {
        sink.close();
        throw TimeoutException('انتهت مهلة الطلب');
      })) {
        if (!_mounted) return;
        gotAnyText = true;
        buffer.write(chunk);
        setState(() {
          if (_msgs.isNotEmpty && _msgs.last.role == 'assistant') {
            _msgs[_msgs.length - 1] = ChatMsg(
              role: 'assistant',
              content: buffer.toString(),
              source: 'streaming',
            );
          }
        });
        _scrollDown();
      }

      if (!_mounted) return;

      if (!gotAnyText) {
        final resp = await api.callFunction('ai-chat-v3', {
          'message': text,
          'history': historyJson,
          if (template != null) 'template': template,
        }).timeout(const Duration(seconds: 45));
        final reply = resp['reply'] as String? ?? resp['message'] as String? ?? '';
        final source = resp['source'] as String? ?? 'unknown';
        setState(() {
          if (_msgs.isNotEmpty && _msgs.last.role == 'assistant') {
            _msgs[_msgs.length - 1] = ChatMsg(
              role: 'assistant',
              content: reply.isNotEmpty ? reply : '⚠️ تم استلام رد فارغ.',
              source: source,
            );
          }
          _loading = false;
        });
      } else {
        HapticFeedback.lightImpact();
        setState(() {
          if (_msgs.isNotEmpty && _msgs.last.role == 'assistant') {
            _msgs[_msgs.length - 1] = ChatMsg(
              role: 'assistant',
              content: buffer.toString(),
              source: 'groq_stream',
            );
          }
          _loading = false;
        });
      }
      unawaited(_ChatStore.save(_msgs));
    } on TimeoutException {
      if (!_mounted) return;
      setState(() {
        _msgs.add(ChatMsg(
          role: 'assistant',
          content: '⏱️ انتهت مهلة الطلب. حاول مرة أخرى أو اسأل سؤالاً أقصر.',
          source: 'error',
        ));
        _loading = false;
      });
      unawaited(_ChatStore.save(_msgs));
    } catch (e) {
      if (!_mounted) return;
      final errorMsg = e.toString();
      String userMessage;
      if (errorMsg.contains('Unauthorized') || errorMsg.contains('401')) {
        userMessage = '🔒 انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.';
      } else if (errorMsg.contains('429')) {
        userMessage = '⏳ أرسلت رسائل كثيرة. انتظر دقيقة وحاول مرة أخرى.';
      } else if (errorMsg.contains('Network') || errorMsg.contains('Socket')) {
        userMessage = '📡 لا يوجد اتصال بالإنترنت. تحقق من الاتصال.';
      } else {
        userMessage = '⚠️ حدث خطأ. حاول مرة أخرى.';
      }
      setState(() {
        _msgs.add(ChatMsg(role: 'assistant', content: userMessage, source: 'error'));
        _loading = false;
      });
      unawaited(_ChatStore.save(_msgs));
    }
    _scrollDown();
  }

  String _buildSystemPrompt() {
    return '''أنت "مساعد EPI" — متخصص في برنامج التطعيم الموسع في اليمن ومنصة مشرف EPI.
التطعيمات: BCG, OPV/IPV, Penta, PCV, Rotavirus, MR, HepB.
المؤشرات: Penta3=وصول, Dropout=استمرارية, الحصبة=حماية جماعية.
قواعد: مختصر (≤120 كلمة). أرقام من البيانات. توصيات عملية. العربية.''';
  }

  Future<void> _clearChat() async {
    HapticFeedback.mediumImpact();
    final ok = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _buildDeleteSheet(ctx),
    );
    if (ok != true || !_mounted) return;
    setState(() { _msgs.clear(); _showWelcome = true; });
    Future.microtask(() async => await _ChatStore.clear());
  }

  void _copyMessage(ChatMsg msg) {
    HapticFeedback.lightImpact();
    Clipboard.setData(ClipboardData(text: msg.content));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(children: [
          Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
          SizedBox(width: 8),
          Text('تم النسخ!', style: TextStyle(fontFamily: 'Tajawal')),
        ]),
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
        backgroundColor: const Color(0xFF00897B),
      ),
    );
  }

  String _sourceLabel(String s) => switch (s) {
        'groq' || 'groq_stream' => '⚡ Groq AI',
        'zai' => '🤖 Z AI',
        'openrouter' => '🌐 OpenRouter/DeepSeek',
        'mimo' => '📡 MiMo AI',
        'function_call' => '📊 من بيانات النظام',
        'rag' => '📚 من قاعدة المعرفة',
        'local' => '📱 محلي',
        _ => '',
      };

  // ═══ BUILD ═══

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: cs.surface,
        appBar: _buildAppBar(cs),
        body: Column(
          children: [
            _buildTabBar(cs),
            Expanded(
              child: TabBarView(
                children: [
                  _buildReportsPdfTab(cs),
                  _buildBotTab(cs),
                  _buildChatTab(cs),
                  _buildAlertsTab(cs),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══ APP BAR ═══

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
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: cs.onPrimary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: cs.onPrimary.withValues(alpha: 0.2), width: 1),
            ),
            child: Stack(children: [
              Center(child: Icon(Icons.auto_awesome_rounded, size: 20, color: cs.onPrimary)),
              Positioned(
                bottom: 2, right: 2,
                child: Container(
                  width: 8, height: 8,
                  decoration: BoxDecoration(
                    color: const Color(0xFF4CAF50),
                    shape: BoxShape.circle,
                    border: Border.all(color: cs.primary, width: 1.5),
                  ),
                ),
              ),
            ]),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('المساعد الذكي', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, fontFamily: 'Cairo')),
              Text('متعدد النماذج + بيانات النظام', style: TextStyle(fontSize: 10, fontFamily: 'Tajawal', color: cs.onPrimary.withValues(alpha: 0.7))),
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
      bottom: null,
    );
  }

  // ═══ TAB BAR ═══

  Widget _buildTabBar(ColorScheme cs) {
    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(bottom: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.3))),
      ),
      child: TabBar(
        labelColor: cs.primary,
        unselectedLabelColor: cs.onSurfaceVariant,
        indicatorColor: cs.primary,
        indicatorSize: TabBarIndicatorSize.label,
        labelStyle: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700, fontSize: 13),
        unselectedLabelStyle: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w500, fontSize: 12),
        tabs: const [
          Tab(text: 'تقارير PDF', icon: Icon(Icons.picture_as_pdf_rounded, size: 20)),
          Tab(text: 'مستشار التحصين', icon: Icon(Icons.vaccines_rounded, size: 20)),
          Tab(text: 'مساعد النظام', icon: Icon(Icons.smart_toy_rounded, size: 20)),
          Tab(text: 'تنبيهات ذكية', icon: Icon(Icons.notifications_active_rounded, size: 20)),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 1: PDF EXPORT REPORTS
  // ═══════════════════════════════════════════════════════════

  Widget _buildReportsPdfTab(ColorScheme cs) {
    final pdfReports = [
      _PdfReport('daily', '📅', 'التقرير اليومي', 'إرساليات، نواقص، مؤشرات يومية', const Color(0xFF1976D2)),
      _PdfReport('weekly', '📊', 'التقرير الأسبوعي', 'اتجاهات، مقارنات أسبوعية', const Color(0xFF388E3C)),
      _PdfReport('monthly', '📆', 'التقرير الشهري', 'ملخص شامل للشهر', const Color(0xFF7B1FA2)),
      _PdfReport('coverage', '💉', 'تقرير التغطية', 'Penta3، حصبة، تسرب', const Color(0xFF00897B)),
      _PdfReport('shortages', '⚠️', 'تقرير النواقص', 'نواقص حرجة ومستلزمات', const Color(0xFFD32F2F)),
      _PdfReport('governorate', '🗺️', 'تقرير المحافظات', 'ترتيب أداء المحافظات', const Color(0xFFE65100)),
      _PdfReport('supervision', '📋', 'التقرير الإشرافي', 'زيارات، ملاحظات، توصيات', const Color(0xFFF57C00)),
      _PdfReport('comprehensive', '📑', 'التقرير الشامل', 'كل البيانات في تقرير واحد', const Color(0xFF0097A7)),
    ];

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('📄 تقارير PDF', style: TextStyle(fontFamily: 'Cairo', fontSize: 18, fontWeight: FontWeight.w800, color: cs.onSurface)),
          const SizedBox(height: 4),
          Text('صدّر تقارير احترافية بصيغة PDF', style: TextStyle(fontFamily: 'Tajawal', fontSize: 12, color: cs.onSurfaceVariant)),
          const SizedBox(height: 20),
          GridView.count(
            crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: 1.1,
            children: pdfReports.map((r) => _buildPdfCard(cs, r)).toList(),
          ),
          const SizedBox(height: 24),
          _buildExportAllCard(cs),
          const SizedBox(height: 28),
        ],
      ),
    );
  }

  Widget _buildPdfCard(ColorScheme cs, _PdfReport r) {
    return Material(
      color: cs.surfaceContainerLow, borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _exportPdf(r),
        child: Container(padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: r.color.withValues(alpha: 0.12))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
            Row(children: [Text(r.emoji, style: const TextStyle(fontSize: 28)), const Spacer(), Icon(Icons.download_rounded, size: 18, color: r.color.withValues(alpha: 0.6))]),
            const Spacer(),
            Text(r.title, style: TextStyle(fontFamily: 'Cairo', fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurface)),
            const SizedBox(height: 4),
            Text(r.desc, style: TextStyle(fontFamily: 'Tajawal', fontSize: 10, color: cs.onSurfaceVariant), maxLines: 2, overflow: TextOverflow.ellipsis),
          ]),
        ),
      ),
    );
  }

  Widget _buildExportAllCard(ColorScheme cs) {
    return Material(
      color: cs.surfaceContainerLow, borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => _exportPdf(_PdfReport('all', '📑', 'كل التقارير', '', const Color(0xFF00897B))),
        child: Container(width: double.infinity, padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(20),
            gradient: LinearGradient(colors: [cs.primaryContainer.withValues(alpha: 0.5), cs.tertiaryContainer.withValues(alpha: 0.2)], begin: Alignment.topRight, end: Alignment.bottomLeft)),
          child: Row(children: [
            Container(width: 52, height: 52, decoration: BoxDecoration(gradient: LinearGradient(colors: [cs.primary, cs.tertiary]), borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: cs.primary.withValues(alpha: 0.3), blurRadius: 12)]),
              child: const Icon(Icons.download_rounded, color: Colors.white, size: 26)),
            const SizedBox(width: 16),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('تصدير الكل', style: TextStyle(fontFamily: 'Cairo', fontSize: 16, fontWeight: FontWeight.w800, color: cs.onSurface)),
              const SizedBox(height: 4),
              Text('تقرير شامل يحتوي كل الأقسام', style: TextStyle(fontFamily: 'Tajawal', fontSize: 12, color: cs.onSurfaceVariant)),
            ])),
            Icon(Icons.arrow_back_ios_rounded, size: 16, color: cs.onSurfaceVariant.withValues(alpha: 0.4)),
          ]),
        ),
      ),
    );
  }

  Future<void> _exportPdf(_PdfReport r) async {
    HapticFeedback.mediumImpact();
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)), const SizedBox(width: 12),
        Text('جاري إنشاء \${r.title}...', style: const TextStyle(fontFamily: 'Tajawal'))]),
      duration: const Duration(seconds: 3), behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), margin: const EdgeInsets.all(16)));
    try {
      final file = await ReportGenerator.generatePDFReport(reportType: r.id, context: context);
      if (_mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Row(children: [const Icon(Icons.check_circle, color: Colors.white, size: 20), const SizedBox(width: 8),
            Expanded(child: Text('تم إنشاء \${r.title}!', style: const TextStyle(fontFamily: 'Tajawal')))]),
          backgroundColor: const Color(0xFF4CAF50), behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16), duration: const Duration(seconds: 5)));
      }
    } catch (e) {
      if (_mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('فشل: \$e', style: const TextStyle(fontFamily: 'Tajawal')),
          backgroundColor: const Color(0xFFD32F2F), behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), margin: const EdgeInsets.all(16)));
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 2: SMART CHAT
  // ═══════════════════════════════════════════════════════════

  Widget _buildChatTab(ColorScheme cs) {
    return Column(
      children: [
        // Model selector
        _buildModelSelector(cs),
        Expanded(
          child: _showWelcome && _msgs.isEmpty ? _buildWelcome(cs) : _buildMessages(cs),
        ),
        if (_loading) _buildTypingIndicator(cs),
        _buildInputBar(cs),
      ],
    );
  }

  Widget _buildModelSelector(ColorScheme cs) {
    final modelSelection = ref.watch(aiModelSelectionProvider);
    final providers = [
      _ModelOption('auto', '🤖 تلقائي', null),
      _ModelOption('groq', '⚡ Groq', null),
      _ModelOption('zai', '🤖 Z AI', null),
      _ModelOption('openrouter', '🌐 OpenRouter', 'deepseek/deepseek-chat'),
      _ModelOption('gemini', '📡 Gemini', null),
      _ModelOption('local', '📱 محلي', null),
    ];

    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: providers.length,
        separatorBuilder: (_, __) => const SizedBox(width: 6),
        itemBuilder: (context, i) {
          final p = providers[i];
          final isSelected = p.id == 'auto' ? modelSelection.autoSelect : (!modelSelection.autoSelect && modelSelection.provider == p.id);
          return ChoiceChip(
            label: Text(p.label, style: TextStyle(fontFamily: 'Cairo', fontSize: 11, fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500)),
            selected: isSelected,
            onSelected: (_) {
              HapticFeedback.lightImpact();
              if (p.id == 'auto') {
                ref.read(aiModelSelectionProvider.notifier).toggleAutoSelect();
              } else {
                ref.read(aiModelSelectionProvider.notifier).selectProvider(p.id);
                if (p.model != null) ref.read(aiModelSelectionProvider.notifier).selectModel(p.model!);
              }
            },
            selectedColor: cs.primaryContainer,
            backgroundColor: cs.surfaceContainerHigh,
            side: BorderSide(color: isSelected ? cs.primary : cs.outlineVariant.withValues(alpha: 0.3)),
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.symmetric(horizontal: 8),
          );
        },
      ),
    );
  }

  Widget _buildWelcome(ColorScheme cs) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(children: [
        const SizedBox(height: 8),
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.0, end: 1.0),
          duration: const Duration(milliseconds: 800),
          curve: Curves.easeOutBack,
          builder: (context, value, child) => Transform.scale(scale: value, child: child),
          child: Container(
            width: 72, height: 72,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [cs.primary, cs.tertiary], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(22),
              boxShadow: [BoxShadow(color: cs.primary.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 8))],
            ),
            child: Icon(Icons.auto_awesome_rounded, size: 36, color: cs.onPrimary),
          ),
        ),
        const SizedBox(height: 16),
        Text('مرحباً بك أيها المشرف الداعم 👋', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, fontFamily: 'Cairo', color: cs.onSurface)),
        const SizedBox(height: 6),
        Text('اسألني عن بيانات النظام، التغطية، أو أدلة سير العمل', style: TextStyle(fontSize: 12, fontFamily: 'Tajawal', color: cs.onSurfaceVariant)),
        const SizedBox(height: 24),

        // Quick queries
        _sectionLabel('📊 التحصين والبيانات', cs),
        const SizedBox(height: 10),
        _quickCard(cs, Icons.bar_chart_rounded, 'التغطية والجرعة الصفرية', 'ما هي مؤشرات التغطية والجرعة الصفرية؟', const Color(0xFF2196F3)),
        _quickCard(cs, Icons.vaccines_rounded, 'حملات التطعيم', 'حلل أداء حملات شلل الأطفال الأخيرة', const Color(0xFF9C27B0)),
        _quickCard(cs, Icons.warning_amber_rounded, 'الإمداد والنواقص', 'أين توجد نواقص حرجة في المستلزمات؟', const Color(0xFFFF5722)),

        const SizedBox(height: 18),
        _sectionLabel('📋 الإشراف الداعم', cs),
        const SizedBox(height: 10),
        _quickCard(cs, Icons.assignment_turned_in_rounded, 'مؤشرات الإشراف', 'كيف أقيم نموذج استمارة الإشراف الميداني؟', const Color(0xFF4CAF50)),
        _quickCard(cs, Icons.people_alt_rounded, 'الرفض المجتمعي', 'كيف نعالج الرفض المجتمعي والشائعات؟', const Color(0xFFFF9800)),
        _quickCard(cs, Icons.medical_information_rounded, 'الأحداث الضارة', 'أخبرني عن أنواع الأحداث الضارة بعد التطعيم', const Color(0xFF00897B)),
        const SizedBox(height: 28),
      ]),
    );
  }

  Widget _sectionLabel(String text, ColorScheme cs) {
    return Align(alignment: Alignment.centerRight, child: Text(text, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, fontFamily: 'Cairo', color: cs.onSurface)));
  }

  Widget _quickCard(ColorScheme cs, IconData icon, String title, String query, Color accent) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => _send(query),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: accent.withValues(alpha: 0.12), width: 1)),
            child: Row(children: [
              Container(width: 40, height: 40, decoration: BoxDecoration(color: accent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)), child: Icon(icon, size: 20, color: accent)),
              const SizedBox(width: 12),
              Expanded(child: Text(title, style: TextStyle(fontFamily: 'Cairo', fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurface))),
              Icon(Icons.arrow_back_ios_rounded, size: 12, color: cs.onSurfaceVariant.withValues(alpha: 0.35)),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _buildMessages(ColorScheme cs) {
    return ListView.builder(
      controller: _scroll,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemCount: _msgs.length,
      itemBuilder: (context, i) => _buildBubble(_msgs[i], cs),
    );
  }

  Widget _buildBubble(ChatMsg msg, ColorScheme cs) {
    final isUser = msg.role == 'user';
    final isError = msg.source == 'error';
    final isData = msg.source == 'function_call';
    final isStreaming = msg.source == 'streaming' && _loading;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: isError ? [cs.errorContainer, cs.error.withValues(alpha: 0.3)] : [cs.primaryContainer, cs.tertiaryContainer]),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(isError ? Icons.warning_rounded : isData ? Icons.analytics_rounded : Icons.auto_awesome_rounded, size: 16, color: isError ? cs.error : cs.primary),
            ),
            const SizedBox(width: 10),
          ],
          Flexible(child: Column(
            crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onLongPress: () => _copyMessage(msg),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isUser ? cs.primary : isError ? cs.errorContainer : isData ? cs.primaryContainer.withValues(alpha: 0.5) : cs.surfaceContainerHigh,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(20), topRight: const Radius.circular(20),
                      bottomLeft: Radius.circular(isUser ? 20 : 6), bottomRight: Radius.circular(isUser ? 6 : 20),
                    ),
                    boxShadow: [BoxShadow(color: (isUser ? cs.primary : Colors.black).withValues(alpha: isUser ? 0.15 : 0.05), blurRadius: 12, offset: const Offset(0, 3))],
                  ),
                  child: isStreaming && msg.content.isEmpty
                      ? _buildTypingDots(cs)
                      : SelectableText.rich(
                          TextSpan(children: [
                            ..._parseMarkdown(msg.content, TextStyle(fontFamily: 'Tajawal', color: isUser ? cs.onPrimary : isError ? cs.onErrorContainer : cs.onSurface, fontSize: 14, height: 1.8),
                              TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w800, color: isUser ? cs.onPrimary : isError ? cs.onErrorContainer : cs.onSurface, fontSize: 14, height: 1.8), cs),
                            if (isStreaming) WidgetSpan(child: _StreamingCursor(color: isUser ? cs.onPrimary : cs.onSurface)),
                          ]),
                          textDirection: TextDirection.rtl,
                        ),
                ),
              ),
              if (!isUser && msg.source != null && msg.source != 'error' && msg.source != 'streaming')
                Padding(
                  padding: const EdgeInsets.only(top: 4, right: 8),
                  child: Text(_sourceLabel(msg.source!), style: TextStyle(fontSize: 10, fontFamily: 'Tajawal', color: cs.onSurfaceVariant.withValues(alpha: 0.5))),
                ),
            ],
          )),
          if (isUser) ...[
            const SizedBox(width: 10),
            Container(width: 32, height: 32, decoration: BoxDecoration(gradient: LinearGradient(colors: [cs.tertiaryContainer, cs.tertiary.withValues(alpha: 0.2)]), borderRadius: BorderRadius.circular(10)),
              child: Icon(Icons.person_rounded, size: 16, color: cs.tertiary)),
          ],
        ],
      ),
    );
  }

  Widget _buildTypingDots(ColorScheme cs) {
    return Row(mainAxisSize: MainAxisSize.min, children: List.generate(3, (i) {
      return AnimatedBuilder(
        animation: _typingAnimCtrl,
        builder: (context, _) {
          final progress = (_typingAnimCtrl.value + i * 0.3) % 1.0;
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 3),
            width: 8 + (progress * 4), height: 8 + (progress * 4),
            decoration: BoxDecoration(color: cs.primary.withValues(alpha: 0.3 + progress * 0.7), shape: BoxShape.circle),
          );
        },
      );
    }));
  }

  List<TextSpan> _parseMarkdown(String text, TextStyle baseStyle, TextStyle boldStyle, ColorScheme cs) {
    final spans = <TextSpan>[];
    final exp = RegExp(r'(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)');
    int start = 0;
    for (final match in exp.allMatches(text)) {
      if (match.start > start) spans.add(TextSpan(text: text.substring(start, match.start), style: baseStyle));
      final matched = match.group(0)!;
      if (matched.startsWith('**') && matched.endsWith('**')) {
        spans.add(TextSpan(text: matched.substring(2, matched.length - 2), style: boldStyle));
      } else if (matched.startsWith('_') && matched.endsWith('_')) {
        spans.add(TextSpan(text: matched.substring(1, matched.length - 1), style: baseStyle.copyWith(fontStyle: FontStyle.italic)));
      } else if (matched.startsWith('`') && matched.endsWith('`')) {
        spans.add(TextSpan(text: matched.substring(1, matched.length - 1), style: baseStyle.copyWith(fontFamily: 'monospace', backgroundColor: cs.onSurface.withValues(alpha: 0.05), color: cs.primary)));
      }
      start = match.end;
    }
    if (start < text.length) spans.add(TextSpan(text: text.substring(start), style: baseStyle));
    return spans;
  }

  Widget _buildTypingIndicator(ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(children: [
        Container(width: 32, height: 32, decoration: BoxDecoration(gradient: LinearGradient(colors: [cs.primaryContainer, cs.tertiaryContainer]), borderRadius: BorderRadius.circular(10)),
          child: Icon(Icons.auto_awesome_rounded, size: 16, color: cs.primary)),
        const SizedBox(width: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(color: cs.surfaceContainerHigh, borderRadius: BorderRadius.circular(18)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            _buildDot(cs.primary, 0), const SizedBox(width: 4), _buildDot(cs.primary, 150), const SizedBox(width: 4), _buildDot(cs.primary, 300),
          ]),
        ),
      ]),
    );
  }

  Widget _buildDot(Color color, int delay) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.4, end: 1.0),
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeInOut,
      builder: (context, value, child) => Opacity(opacity: value, child: child),
      child: Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
    );
  }

  Widget _buildInputBar(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      decoration: BoxDecoration(color: cs.surface, border: Border(top: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.2)))),
      child: SafeArea(
        top: false,
        child: Row(children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(color: cs.surfaceContainerHigh, borderRadius: BorderRadius.circular(24)),
              child: TextField(
                controller: _ctrl,
                textDirection: TextDirection.rtl,
                style: TextStyle(fontFamily: 'Tajawal', fontSize: 14, color: cs.onSurface),
                decoration: InputDecoration(
                  hintText: 'اسأل المساعد الذكي...',
                  hintStyle: TextStyle(fontFamily: 'Tajawal', fontSize: 14, color: cs.onSurfaceVariant.withValues(alpha: 0.5)),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                ),
                onSubmitted: (text) => _send(text),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Container(
            decoration: BoxDecoration(gradient: LinearGradient(colors: [cs.primary, cs.tertiary]), shape: BoxShape.circle, boxShadow: [BoxShadow(color: cs.primary.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4))]),
            child: IconButton(
              icon: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
              onPressed: _loading ? null : () => _send(_ctrl.text),
            ),
          ),
        ]),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 3: VACCINATION BOT (Unified Local → AI)
  // ═══════════════════════════════════════════════════════════

  Widget _buildBotTab(ColorScheme cs) {
    return Column(
      children: [
        // Source indicator bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFF00897B).withValues(alpha: 0.08),
            border: Border(bottom: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.2))),
          ),
          child: Row(
            children: [
              const Text('💉', style: TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Expanded(child: Text('محلي أولاً ← ذكاء اصطناعي تلقائياً', style: TextStyle(fontFamily: 'Tajawal', fontSize: 11, color: cs.onSurfaceVariant))),
              if (_botEngine.isAIEnabled)
                Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(color: const Color(0xFF4CAF50).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                  child: const Text('AI ✓', style: TextStyle(fontFamily: 'Cairo', fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF2E7D32)))),
            ],
          ),
        ),
        Expanded(child: _botMsgs.isEmpty ? _buildBotWelcome(cs) : _buildBotMessages(cs)),
        if (_botLoading) _buildBotTyping(cs),
        _buildBotInputBar(cs),
      ],
    );
  }

  Widget _buildBotWelcome(ColorScheme cs) {
    final topics = [
      ('💉', 'وش تطعيمات طفلي؟', 'حسب عمر الطفل', const Color(0xFF00897B)),
      ('⚠️', 'وش الآثار الجانبية؟', 'حرارة، تورم، تشنجات', const Color(0xFFFF5722)),
      ('💰', 'هل مجاني؟', 'معلومات التكلفة', const Color(0xFF4CAF50)),
      ('🚫', 'هل يسبب أوتيزم؟', 'الرد على الأساطير', const Color(0xFF9C27B0)),
      ('🔍', 'الأشراف الداعم', 'زيارات وتقييم', const Color(0xFF2196F3)),
      ('🏢', 'إدارة المستوى الوسيط', 'تخطيط ومؤشرات', const Color(0xFFFF9800)),
      ('📋', 'جدول التحصين الكامل', 'كل التطعيمات', const Color(0xFF00897B)),
      ('❄️', 'سلسلة التبريد', 'VVM والتخزين', const Color(0xFF03A9F4)),
    ];
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(children: [
        const SizedBox(height: 8),
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.8, end: 1.0),
          duration: const Duration(milliseconds: 800),
          curve: Curves.elasticOut,
          builder: (c, v, child) => Transform.scale(scale: v, child: child),
          child: Container(width: 80, height: 80,
            decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF00897B), Color(0xFF00695C)]),
              borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: const Color(0xFF00897B).withValues(alpha: 0.3), blurRadius: 20)]),
            child: const Center(child: Text('💉🇾🇪', style: TextStyle(fontSize: 36)))),
        ),
        const SizedBox(height: 16),
        Text('مستشار التحصين الذكي', style: TextStyle(fontFamily: 'Cairo', fontSize: 20, fontWeight: FontWeight.w800, color: cs.onSurface)),
        const SizedBox(height: 4),
        Text('180+ موضوع — محلي أولاً ← AI تلقائياً', textAlign: TextAlign.center,
          style: TextStyle(fontFamily: 'Tajawal', fontSize: 12, color: cs.onSurfaceVariant, height: 1.5)),
        const SizedBox(height: 24),
        Text('📌 مواضيع شائعة', style: TextStyle(fontFamily: 'Cairo', fontSize: 14, fontWeight: FontWeight.w700, color: cs.onSurface)),
        const SizedBox(height: 12),
        ...topics.map((t) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Material(
            color: cs.surfaceContainerLow, borderRadius: BorderRadius.circular(14),
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: () => _sendBotMessage(t.$2),
              child: Container(padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: t.$4.withValues(alpha: 0.12))),
                child: Row(children: [
                  Text(t.$1, style: const TextStyle(fontSize: 22)), const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(t.$2, style: TextStyle(fontFamily: 'Cairo', fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurface)),
                    Text(t.$3, style: TextStyle(fontFamily: 'Tajawal', fontSize: 11, color: cs.onSurfaceVariant)),
                  ])),
                  Icon(Icons.arrow_back_ios_rounded, size: 12, color: cs.onSurfaceVariant.withValues(alpha: 0.35)),
                ])),
            ),
          ),
        )),
        const SizedBox(height: 20),
      ]),
    );
  }

  Widget _buildBotMessages(ColorScheme cs) {
    return ListView.builder(
      controller: _botScroll, physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      itemCount: _botMsgs.length,
      itemBuilder: (context, i) {
        final msg = _botMsgs[i];
        final isMe = !msg.isBot;
        return Padding(
          padding: EdgeInsets.only(bottom: 10, left: isMe ? 48 : 0, right: isMe ? 0 : 48),
          child: Column(crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start, children: [
            if (!isMe)
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(width: 30, height: 30,
                  decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF00897B), Color(0xFF00695C)]), borderRadius: BorderRadius.circular(10)),
                  child: const Center(child: Text('💉', style: TextStyle(fontSize: 14)))),
                const SizedBox(width: 8),
                Flexible(child: _botBubbleContent(msg, isMe, cs)),
              ])
            else
              _botBubbleContent(msg, isMe, cs),
            if (msg.isBot && msg.quickReplies != null && msg.quickReplies!.isNotEmpty)
              Container(margin: const EdgeInsets.only(top: 6, right: 38),
                child: Wrap(spacing: 6, runSpacing: 6, children: msg.quickReplies!.map((qr) =>
                  GestureDetector(onTap: () => _sendBotMessage(qr.text),
                    child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(color: const Color(0xFFE0F2F1), borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFF00897B).withValues(alpha: 0.25))),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Text(qr.emoji, style: const TextStyle(fontSize: 13)), const SizedBox(width: 4),
                        Text(qr.text, style: const TextStyle(fontFamily: 'Tajawal', fontSize: 12, color: Color(0xFF00695C), fontWeight: FontWeight.w600)),
                      ])))).toList())),
          ]),
        );
      },
    );
  }

  Widget _botBubbleContent(BotMessage msg, bool isMe, ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isMe ? cs.primary : cs.surfaceContainerLow,
        borderRadius: BorderRadius.only(topLeft: Radius.circular(isMe ? 16 : 4), topRight: Radius.circular(isMe ? 4 : 16),
          bottomLeft: const Radius.circular(16), bottomRight: const Radius.circular(16)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8)],
      ),
      child: SelectableText(msg.text,
        style: TextStyle(fontFamily: 'Tajawal', fontSize: 14, height: 1.6, color: isMe ? cs.onPrimary : cs.onSurface),
        textDirection: TextDirection.rtl),
    );
  }

  Widget _buildBotTyping(ColorScheme cs) {
    return Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8), alignment: Alignment.centerRight,
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 26, height: 26, decoration: BoxDecoration(color: const Color(0xFF00897B).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
          child: const Center(child: Text('💉', style: TextStyle(fontSize: 12)))),
        const SizedBox(width: 8),
        Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(color: cs.surfaceContainerLow, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8)]),
          child: AnimatedBuilder(animation: _typingAnimCtrl, builder: (c, _) => Row(mainAxisSize: MainAxisSize.min,
            children: List.generate(3, (i) {
              final v = ((_typingAnimCtrl.value + i * 0.3) % 1.0);
              final o = (v < 0.5) ? v * 2 : (1 - v) * 2;
              return Container(margin: const EdgeInsets.symmetric(horizontal: 2), width: 7, height: 7,
                decoration: BoxDecoration(color: Color.lerp(const Color(0xFF00897B).withValues(alpha: 0.2), const Color(0xFF00897B), o), shape: BoxShape.circle));
            })))),
      ]));
  }

  Widget _buildBotInputBar(ColorScheme cs) {
    return Container(
      padding: EdgeInsets.only(left: 12, right: 12, top: 10, bottom: MediaQuery.of(context).padding.bottom + 8),
      decoration: BoxDecoration(color: cs.surface, boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, -2))]),
      child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
        GestureDetector(onTap: _botLoading ? null : () => _sendBotMessage(_botCtrl.text),
          child: AnimatedContainer(duration: const Duration(milliseconds: 200), width: 46, height: 46,
            decoration: BoxDecoration(gradient: _botCtrl.text.trim().isNotEmpty ? const LinearGradient(colors: [Color(0xFF00897B), Color(0xFF00695C)]) : null,
              color: _botCtrl.text.trim().isNotEmpty ? null : cs.surfaceContainerHigh, borderRadius: BorderRadius.circular(14)),
            child: _botLoading ? Padding(padding: const EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2, color: cs.onPrimary))
              : Icon(Icons.send_rounded, color: _botCtrl.text.trim().isNotEmpty ? cs.onPrimary : cs.onSurfaceVariant, size: 20))),
        const SizedBox(width: 10),
        Expanded(child: Container(constraints: const BoxConstraints(maxHeight: 100),
          decoration: BoxDecoration(color: cs.surfaceContainerHighest, borderRadius: BorderRadius.circular(14), border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.3))),
          child: TextField(controller: _botCtrl, textDirection: TextDirection.rtl, maxLines: 3, minLines: 1,
            style: TextStyle(fontFamily: 'Tajawal', fontSize: 14, color: cs.onSurface),
            decoration: InputDecoration(hintText: 'اسأل عن التطعيمات...', hintStyle: TextStyle(fontFamily: 'Tajawal', fontSize: 13, color: cs.onSurfaceVariant),
              border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10)),
            onChanged: (_) => setState(() {}), onSubmitted: (v) => _sendBotMessage(v)))),
      ]),
    );
  }

  /// ═══ UNIFIED: Local first → AI fallback ═══
  Future<void> _sendBotMessage(String text) async {
    if (text.trim().isEmpty || _botLoading) return;
    HapticFeedback.lightImpact();
    _botCtrl.clear();
    setState(() {
      _botMsgs.add(BotMessage(id: '${DateTime.now().millisecondsSinceEpoch}', text: text, isBot: false, timestamp: DateTime.now()));
      _botLoading = true;
    });
    _botScrollDown();

    try {
      // Step 1: Local engine
      final localResp = _botEngine.sendMessage(text);
      if (localResp != null && !_isGenericResponse(localResp.text)) {
        setState(() { _botMsgs.add(localResp); _botLoading = false; });
        _botScrollDown();
        return;
      }
      if (localResp != null) setState(() => _botMsgs.add(localResp));

      // Step 2: AI fallback
      try {
        final api = ref.read(apiClientProvider);
        final hist = _botMsgs.length > 6 ? _botMsgs.sublist(_botMsgs.length - 6) : _botMsgs;
        final histJson = hist.map((m) => {'role': m.isBot ? 'assistant' : 'user',
          'content': m.text.length > 300 ? '${m.text.substring(0, 300)}...' : m.text}).toList();
        final resp = await api.callFunction('ai-chat-v3', {'message': text, 'history': histJson, 'template': 'vaccination'})
          .timeout(const Duration(seconds: 30));
        final reply = resp['reply'] as String? ?? '';
        if (reply.isNotEmpty && _mounted) {
          if (localResp != null && _botMsgs.isNotEmpty && _botMsgs.last.isBot) _botMsgs.removeLast();
          setState(() {
            _botMsgs.add(BotMessage(id: '${DateTime.now().millisecondsSinceEpoch}', text: reply, isBot: true,
              timestamp: DateTime.now(), quickReplies: _botSuggestions(text)));
            _botLoading = false;
          });
        } else { setState(() => _botLoading = false); }
      } catch (_) { setState(() => _botLoading = false); }
    } catch (_) {
      setState(() {
        _botMsgs.add(BotMessage(id: '${DateTime.now().millisecondsSinceEpoch}', text: '⚠️ حدث خطأ. حاول مرة أخرى.',
          isBot: true, timestamp: DateTime.now(),
          quickReplies: const [BotQuickReply(text: 'وش تطعيمات طفلي؟', emoji: '💉'), BotQuickReply(text: 'وش الآثار؟', emoji: '⚠️')]));
        _botLoading = false;
      });
    }
    _botScrollDown();
  }

  bool _isGenericResponse(String t) => t.contains('🤖 أقدر أساعدك') || t.contains('مش فاهم قصدك') ||
    t.contains('جرب تسأل') || t.contains('أو اختر من الاقتراحات') || t.contains('أهلاً! أنا مستشار التحصين الذكي');

  List<BotQuickReply> _botSuggestions(String lastMsg) {
    final n = SmartNLP.normalize(lastMsg);
    if (n.contains('حرار') || n.contains('سخون')) return const [BotQuickReply(text: 'متى أخاف؟', emoji: '🚨'), BotQuickReply(text: 'متى أروح للطبيب؟', emoji: '🏥')];
    if (n.contains('تطعيم') || n.contains('لقاح')) return const [BotQuickReply(text: 'وش الآثار الجانبية؟', emoji: '⚠️'), BotQuickReply(text: 'كم جرعة؟', emoji: '🔢')];
    return const [BotQuickReply(text: 'وش تطعيمات طفلي؟', emoji: '💉'), BotQuickReply(text: 'وش الآثار؟', emoji: '⚠️'), BotQuickReply(text: 'هل مجاني؟', emoji: '💰')];
  }

  void _botScrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_botScroll.hasClients) _botScroll.animateTo(_botScroll.position.maxScrollExtent + 100, duration: const Duration(milliseconds: 350), curve: Curves.easeOutCubic);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 4: SMART ALERTS
  // ═══════════════════════════════════════════════════════════

  Widget _buildAlertsTab(ColorScheme cs) {
    // Get data for alerts analysis
    final analyticsAsync = ref.watch(dashboardAnalyticsProvider(const AnalyticsFilter()));
    final shortagesAsync = ref.watch(shortagesProvider);

    return analyticsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => _buildAlertsContent(cs, {}, []),
      data: (analytics) {
        return shortagesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => _buildAlertsContent(cs, analytics, []),
          data: (shortages) => _buildAlertsContent(cs, analytics, shortages),
        );
      },
    );
  }

  Widget _buildAlertsContent(ColorScheme cs, Map<String, dynamic> analytics, List<dynamic> shortages) {
    // Build data map for SmartAlertsEngine
    final data = <String, dynamic>{
      ...analytics,
      'shortages': {
        'total': shortages.length,
        'pending': shortages.where((s) => (s as Map<String, dynamic>)['status'] != 'resolved').length,
        'resolved': shortages.where((s) => (s as Map<String, dynamic>)['status'] == 'resolved').length,
        'bySeverity': {
          'critical': shortages.where((s) => (s as Map<String, dynamic>)['severity'] == 'critical').length,
          'high': shortages.where((s) => (s as Map<String, dynamic>)['severity'] == 'high').length,
        },
      },
    };

    final alerts = SmartAlertsEngine.analyzeAlerts(data);
    final briefing = SmartAlertsEngine.generateBriefing(data);
    final supervisionPriorities = SmartAlertsEngine.getSupervisionPriorities(data);

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Executive Briefing
          if (briefing.summary.isNotEmpty) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [cs.primaryContainer.withValues(alpha: 0.5), cs.tertiaryContainer.withValues(alpha: 0.2)], begin: Alignment.topRight, end: Alignment.bottomLeft),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: cs.primary.withValues(alpha: 0.1)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Icon(Icons.auto_awesome_rounded, color: cs.primary, size: 22),
                  const SizedBox(width: 10),
                  Text('الملخص التنفيذي', style: TextStyle(fontFamily: 'Cairo', fontSize: 16, fontWeight: FontWeight.w800, color: cs.onSurface)),
                  const Spacer(),
                  if (briefing.criticalAlerts > 0)
                    Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: cs.error, borderRadius: BorderRadius.circular(12)),
                      child: Text('${briefing.criticalAlerts} حرج', style: const TextStyle(fontFamily: 'Cairo', fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white))),
                ]),
                const SizedBox(height: 12),
                SelectableText(briefing.summary, textDirection: TextDirection.rtl,
                  style: TextStyle(fontFamily: 'Tajawal', fontSize: 13, color: cs.onSurface, height: 1.8)),
              ]),
            ),
            const SizedBox(height: 24),
          ],

          // Alerts List
          if (alerts.isNotEmpty) ...[
            Text('🔔 التنبيهات النشطة (${alerts.length})', style: TextStyle(fontFamily: 'Cairo', fontSize: 16, fontWeight: FontWeight.w700, color: cs.onSurface)),
            const SizedBox(height: 12),
            ...alerts.map((alert) => _buildAlertCard(cs, alert)),
            const SizedBox(height: 24),
          ] else ...[
            Center(child: Padding(
              padding: const EdgeInsets.all(40),
              child: Column(children: [
                Icon(Icons.check_circle_outline, size: 48, color: cs.primary.withValues(alpha: 0.5)),
                const SizedBox(height: 12),
                Text('لا توجد تنبيهات حالياً', style: TextStyle(fontFamily: 'Cairo', fontSize: 16, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant)),
                Text('النظام يعمل بشكل طبيعي ✅', style: TextStyle(fontFamily: 'Tajawal', fontSize: 12, color: cs.onSurfaceVariant)),
              ]),
            )),
          ],

          // Supervision Priorities
          if (supervisionPriorities.isNotEmpty) ...[
            Text('📋 أولويات الزيارات الإشرافية', style: TextStyle(fontFamily: 'Cairo', fontSize: 16, fontWeight: FontWeight.w700, color: cs.onSurface)),
            const SizedBox(height: 12),
            ...supervisionPriorities.take(5).map((p) => _buildPriorityCard(cs, p)),
            const SizedBox(height: 24),
          ],

          // Recommendations
          if (briefing.recommendations.isNotEmpty) ...[
            Text('💡 التوصيات', style: TextStyle(fontFamily: 'Cairo', fontSize: 16, fontWeight: FontWeight.w700, color: cs.onSurface)),
            const SizedBox(height: 12),
            ...briefing.recommendations.take(5).map((rec) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(margin: const EdgeInsets.only(top: 6), width: 6, height: 6, decoration: BoxDecoration(color: cs.primary, shape: BoxShape.circle)),
                const SizedBox(width: 10),
                Expanded(child: Text(rec, style: TextStyle(fontFamily: 'Tajawal', fontSize: 13, color: cs.onSurface, height: 1.6))),
              ]),
            )),
          ],
        ],
      ),
    );
  }

  Widget _buildAlertCard(ColorScheme cs, SmartAlert alert) {
    final severityColor = switch (alert.severity) {
      AlertSeverity.critical => const Color(0xFFD32F2F),
      AlertSeverity.high => const Color(0xFFFF5722),
      AlertSeverity.medium => const Color(0xFF2196F3),
      AlertSeverity.low => const Color(0xFF7B1FA2),
      AlertSeverity.info => const Color(0xFF388E3C),
    };

    final severityText = switch (alert.severity) {
      AlertSeverity.critical => 'حرج',
      AlertSeverity.high => 'عالي',
      AlertSeverity.medium => 'متوسط',
      AlertSeverity.low => 'منخفض',
      AlertSeverity.info => 'إيجابي',
    };

    final iconData = switch (alert.type) {
      'critical_shortage' => Icons.inventory_2_rounded,
      'low_coverage' => Icons.trending_down_rounded,
      'high_dropout' => Icons.person_remove_rounded,
      'anomaly_detected' => Icons.search_rounded,
      'cold_chain_breach' => Icons.ac_unit_rounded,
      'supervision_overdue' => Icons.assignment_late_rounded,
      'campaign_risk' => Icons.campaign_rounded,
      'data_quality' => Icons.error_outline_rounded,
      'outbreak_risk' => Icons.coronavirus_rounded,
      'positive_trend' => Icons.trending_up_rounded,
      _ => Icons.notifications_rounded,
    };

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: severityColor.withValues(alpha: 0.15), width: 1),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(width: 40, height: 40, decoration: BoxDecoration(color: severityColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                child: Icon(iconData, size: 20, color: severityColor)),
              const SizedBox(width: 12),
              Expanded(child: Text(alert.title, style: TextStyle(fontFamily: 'Cairo', fontSize: 14, fontWeight: FontWeight.w700, color: cs.onSurface))),
              Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: severityColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                child: Text(severityText, style: TextStyle(fontFamily: 'Cairo', fontSize: 11, fontWeight: FontWeight.w700, color: severityColor))),
            ]),
            const SizedBox(height: 10),
            Text(alert.message, style: TextStyle(fontFamily: 'Tajawal', fontSize: 13, color: cs.onSurface, height: 1.6)),
            if (alert.action != null) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: severityColor.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(10)),
                child: Row(children: [
                  Icon(Icons.lightbulb_outline_rounded, size: 16, color: severityColor),
                  const SizedBox(width: 8),
                  Expanded(child: Text(alert.action!, style: TextStyle(fontFamily: 'Tajawal', fontSize: 12, color: cs.onSurface, height: 1.5))),
                ]),
              ),
            ],
          ]),
        ),
      ),
    );
  }

  Widget _buildPriorityCard(ColorScheme cs, SupervisionPriority p) {
    final urgencyColor = p.urgencyScore >= 5 ? const Color(0xFFD32F2F) : p.urgencyScore >= 3 ? const Color(0xFFFF9800) : const Color(0xFF2196F3);
    final daysLeft = p.suggestedDate.difference(DateTime.now()).inDays;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), border: Border.all(color: urgencyColor.withValues(alpha: 0.12), width: 1)),
          child: Row(children: [
            Container(width: 36, height: 36, decoration: BoxDecoration(color: urgencyColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
              child: Icon(Icons.place_rounded, size: 18, color: urgencyColor)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(p.governorate, style: TextStyle(fontFamily: 'Cairo', fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurface)),
              Text(p.reason, style: TextStyle(fontFamily: 'Tajawal', fontSize: 11, color: cs.onSurfaceVariant), maxLines: 1, overflow: TextOverflow.ellipsis),
            ])),
            Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: urgencyColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
              child: Text(daysLeft <= 1 ? 'غداً' : '$daysLeft أيام', style: TextStyle(fontFamily: 'Cairo', fontSize: 11, fontWeight: FontWeight.w700, color: urgencyColor))),
          ]),
        ),
      ),
    );
  }

  // ═══ DELETE SHEET ═══

  Widget _buildDeleteSheet(BuildContext ctx) {
    final cs = Theme.of(ctx).colorScheme;
    return Container(
      decoration: BoxDecoration(color: cs.surface, borderRadius: const BorderRadius.vertical(top: Radius.circular(24))),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 40, height: 4, decoration: BoxDecoration(color: cs.onSurfaceVariant.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 20),
        Container(width: 56, height: 56, decoration: BoxDecoration(color: cs.errorContainer, shape: BoxShape.circle), child: Icon(Icons.delete_outline_rounded, size: 28, color: cs.error)),
        const SizedBox(height: 16),
        Text('مسح المحادثة', style: TextStyle(fontFamily: 'Cairo', fontSize: 18, fontWeight: FontWeight.w700, color: cs.onSurface)),
        const SizedBox(height: 8),
        Text('سيتم حذف جميع الرسائل نهائياً.', textAlign: TextAlign.center, style: TextStyle(fontFamily: 'Tajawal', fontSize: 13, color: cs.onSurfaceVariant, height: 1.6)),
        const SizedBox(height: 24),
        Row(children: [
          Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(ctx, false), style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
            child: Text('إلغاء', style: TextStyle(fontFamily: 'Cairo', color: cs.onSurface)))),
          const SizedBox(width: 12),
          Expanded(child: FilledButton(onPressed: () => Navigator.pop(ctx, true), style: FilledButton.styleFrom(backgroundColor: cs.error, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
            child: const Text('مسح', style: TextStyle(fontFamily: 'Cairo')))),
        ]),
      ]),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// HELPER WIDGETS & MODELS
// ═══════════════════════════════════════════════════════════

class _StreamingCursor extends StatefulWidget {
  final Color color;
  const _StreamingCursor({required this.color});

  @override
  State<_StreamingCursor> createState() => _StreamingCursorState();
}

class _StreamingCursorState extends State<_StreamingCursor> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 530))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _ctrl,
      child: Text('▎', style: TextStyle(color: widget.color, fontSize: 14)),
    );
  }
}

class _PdfReport {
  final String id;
  final String emoji;
  final String title;
  final String desc;
  final Color color;
  const _PdfReport(this.id, this.emoji, this.title, this.desc, this.color);
}

class _ModelOption {
  final String id;
  final String label;
  final String? model;
  const _ModelOption(this.id, this.label, this.model);
}
