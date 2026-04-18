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
// CHAT PERSISTENCE
// ═══════════════════════════════════════════════════════════

class _ChatStore {
  static const _box = 'ai_chat';
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
      final trimmed = msgs.length > 40 ? msgs.sublist(msgs.length - 40) : msgs;
      final box = await Hive.openBox<String>(_box);
      await box.put(_key, jsonEncode(trimmed.map((m) => m.toJson()).toList()));
    } catch (_) {}
  }

  static Future<void> clear() async {
    try {
      final box = await Hive.openBox<String>(_box);
      await box.delete(_key);
    } catch (_) {}
  }
}

// ═══════════════════════════════════════════════════════════
// AI CHAT SCREEN — Clean rebuild
// ═══════════════════════════════════════════════════════════

class AiChatScreenV2 extends ConsumerStatefulWidget {
  const AiChatScreenV2({super.key});

  @override
  ConsumerState<AiChatScreenV2> createState() => _AiChatScreenV2State();
}

class _AiChatScreenV2State extends ConsumerState<AiChatScreenV2> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<ChatMsg> _msgs = [];
  bool _loading = false;
  bool _mounted = true;
  DateTime? _lastSend;

  @override
  void initState() {
    super.initState();
    _restore();
  }

  @override
  void dispose() {
    _mounted = false;
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _restore() async {
    final saved = await _ChatStore.load();
    if (saved.isNotEmpty && _mounted) {
      setState(() => _msgs.addAll(saved));
    }
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

  // ═══ SEND MESSAGE ═══

  Future<void> _send(String text, {String? template}) async {
    if (text.trim().isEmpty || _loading) return;

    // Rate limit: 1 second between sends
    final now = DateTime.now();
    if (_lastSend != null &&
        now.difference(_lastSend!) < const Duration(seconds: 1)) {
      return;
    }
    _lastSend = now;

    _ctrl.clear();
    setState(() {
      _msgs.add(ChatMsg(role: 'user', content: text));
      _loading = true;
    });
    _scrollDown();
    await _ChatStore.save(_msgs);

    try {
      final api = ref.read(apiClientProvider);

      // Build history (last 6 messages, truncated)
      final history =
          _msgs.length > 6 ? _msgs.sublist(_msgs.length - 6) : _msgs;
      final historyJson = history
          .map((m) => {
                'role': m.role,
                'content': m.content.length > 500
                    ? '${m.content.substring(0, 500)}...'
                    : m.content,
              })
          .toList();

      // ✅ FIX: Wrap in try-catch with specific error messages
      final resp = await api.callFunction('ai-chat-v3', {
        'message': text,
        'history': historyJson,
        if (template != null) 'template': template,
      }).timeout(
        const Duration(seconds: 60),
        onTimeout: () {
          throw TimeoutException('انتهت مهلة الطلب');
        },
      );

      if (!_mounted) return;

      // ✅ FIX: Safe response parsing — handle missing/null fields
      final reply = resp['reply'] as String? ??
          resp['message'] as String? ??
          resp['error'] as String? ??
          '';
      final source = resp['source'] as String? ?? 'unknown';

      setState(() {
        _msgs.add(ChatMsg(
          role: 'assistant',
          content:
              reply.isNotEmpty ? reply : '⚠️ تم استلام رد فارغ. حاول مرة أخرى.',
          source: source,
        ));
        _loading = false;
      });
      await _ChatStore.save(_msgs);
    } on TimeoutException {
      if (!_mounted) return;
      setState(() {
        _msgs.add(ChatMsg(
          role: 'assistant',
          content:
              '⏱️ انتهت مهلة الطلب. قد يكون الخادم بطيئاً حالياً.\n\n'
              '💡 نصيحة: حاول مرة أخرى أو اسأل سؤالاً أقصر.',
          source: 'error',
        ));
        _loading = false;
      });
      await _ChatStore.save(_msgs);
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
        userMessage = '📡 لا يوجد اتصال بالإنترنت.\nتحقق من الاتصال وحاول مرة أخرى.';
      } else {
        userMessage =
            '⚠️ حدث خطأ أثناء الاتصال.\n\n'
            '🔧 حاول مرة أخرى. إذا استمر، أعد تشغيل التطبيق.';
      }

      setState(() {
        _msgs.add(ChatMsg(
          role: 'assistant',
          content: userMessage,
          source: 'error',
        ));
        _loading = false;
      });
      await _ChatStore.save(_msgs);
    }
    _scrollDown();
  }

  // ═══ BUILD ═══

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: cs.surfaceContainerLowest,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: cs.primary,
        foregroundColor: cs.onPrimary,
        title: const Row(
          children: [
            Icon(Icons.auto_awesome_rounded, size: 22),
            SizedBox(width: 10),
            Text(
              'المساعد الذكي',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                fontFamily: 'Cairo',
              ),
            ),
          ],
        ),
        actions: [
          if (_msgs.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_outline_rounded, size: 22),
              onPressed: () async {
                setState(() => _msgs.clear());
                await _ChatStore.clear();
              },
              tooltip: 'مسح المحادثة',
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _msgs.isEmpty ? _buildWelcome(cs) : _buildMessages(cs),
          ),
          if (_loading) _buildTypingIndicator(cs),
          _buildInputBar(cs),
        ],
      ),
    );
  }

  // ═══ WELCOME SCREEN ═══

  Widget _buildWelcome(ColorScheme cs) {
    final suggestions = [
      ('📊', 'ما حالة الإرساليات؟'),
      ('⚠️', 'أين النواقص الحرجة؟'),
      ('📈', 'اعرض تقرير الأسبوع'),
      ('🗺️', 'أي المحافظات تحتاج دعم؟'),
      ('💉', 'ما تغطية التطعيم؟'),
      ('✅', 'حلل جودة الإدخال'),
    ];

    final reports = [
      ('📅', 'daily', 'التقرير اليومي'),
      ('📊', 'weekly', 'التقرير الأسبوعي'),
      ('⚠️', 'shortages', 'تقرير النواقص'),
      ('💉', 'coverage', 'تقرير التغطية'),
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 20),
          // Logo
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [cs.primary, cs.tertiary],
              ),
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
          const SizedBox(height: 16),
          Text(
            'كيف أساعدك اليوم؟',
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
            style: TextStyle(
              fontSize: 13,
              fontFamily: 'Tajawal',
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),

          // Quick suggestions
          ...suggestions.map((s) => _suggestionTile(cs, s.$1, s.$2)),

          const SizedBox(height: 16),
          Divider(color: cs.outlineVariant),
          const SizedBox(height: 8),

          // Report templates
          Text(
            '📝 قوالب التقارير',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              fontFamily: 'Cairo',
              color: cs.onSurface,
            ),
          ),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.8,
            children:
                reports.map((r) => _reportCard(cs, r.$1, r.$2, r.$3)).toList(),
          ),
        ],
      ),
    );
  }

  Widget _suggestionTile(ColorScheme cs, String emoji, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () {
            HapticFeedback.lightImpact();
            _send(text);
          },
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
                    child: Text(emoji, style: const TextStyle(fontSize: 22)),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    text,
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
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

  Widget _reportCard(
      ColorScheme cs, String emoji, String templateId, String name) {
    return Material(
      color: cs.surfaceContainerLow,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {
          HapticFeedback.lightImpact();
          _send('أنشئ $name', template: templateId);
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(emoji, style: const TextStyle(fontSize: 24)),
              const SizedBox(height: 4),
              Text(
                name,
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: cs.onSurface,
                ),
                textAlign: TextAlign.center,
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: _msgs.length,
      itemBuilder: (context, i) => _buildBubble(_msgs[i], cs),
    );
  }

  Widget _buildBubble(ChatMsg msg, ColorScheme cs) {
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
              child:
                  Icon(Icons.auto_awesome_rounded, size: 18, color: cs.primary),
            ),
            const SizedBox(width: 10),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isUser ? cs.primary : cs.surfaceContainerHigh,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(isUser ? 18 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 18),
                    ),
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

  // ═══ TYPING INDICATOR ═══

  Widget _buildTypingIndicator(ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: cs.primaryContainer,
            child:
                Icon(Icons.auto_awesome_rounded, size: 16, color: cs.primary),
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
                      strokeWidth: 2, color: cs.primary),
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

  // ═══ INPUT BAR ═══

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
                        horizontal: 18, vertical: 12),
                  ),
                  onSubmitted: (t) => _send(t),
                  maxLines: null,
                ),
              ),
            ),
            const SizedBox(width: 8),
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
