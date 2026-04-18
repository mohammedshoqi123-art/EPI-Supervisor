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
// AI CHAT SCREEN
// ═══════════════════════════════════════════════════════════

class AiChatScreenV2 extends ConsumerStatefulWidget {
  const AiChatScreenV2({super.key});

  @override
  ConsumerState<AiChatScreenV2> createState() => _AiChatScreenV2State();
}

class _AiChatScreenV2State extends ConsumerState<AiChatScreenV2>
    with SingleTickerProviderStateMixin {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<ChatMsg> _msgs = [];
  bool _loading = false;
  bool _mounted = true;
  DateTime? _lastSend;
  late AnimationController _typingAnimCtrl;

  @override
  void initState() {
    super.initState();
    _typingAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
    _restore();
  }

  @override
  void dispose() {
    _mounted = false;
    _ctrl.dispose();
    _scroll.dispose();
    _typingAnimCtrl.dispose();
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
          duration: const Duration(milliseconds: 300),
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
      _msgs.add(ChatMsg(role: 'user', content: text));
      _loading = true;
    });
    _scrollDown();
    await _ChatStore.save(_msgs);

    try {
      final api = ref.read(apiClientProvider);

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
          content: '⏱️ انتهت مهلة الطلب. قد يكون الخادم بطيئاً حالياً.\n\n'
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
        userMessage =
            '📡 لا يوجد اتصال بالإنترنت.\nتحقق من الاتصال وحاول مرة أخرى.';
      } else {
        userMessage = '⚠️ حدث خطأ أثناء الاتصال.\n\n'
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
    final tt = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: cs.surface,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: cs.primary,
        foregroundColor: cs.onPrimary,
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: cs.onPrimary.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Icons.auto_awesome_rounded,
                  size: 18, color: cs.onPrimary),
            ),
            const SizedBox(width: 10),
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
            IconButton(
              icon: const Icon(Icons.delete_outline_rounded, size: 20),
              onPressed: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('مسح المحادثة',
                        style: TextStyle(fontFamily: 'Cairo')),
                    content: const Text('هل أنت متأكد من مسح كل الرسائل؟',
                        style: TextStyle(fontFamily: 'Tajawal')),
                    actions: [
                      TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('إلغاء')),
                      FilledButton(
                          onPressed: () => Navigator.pop(context, true),
                          child: const Text('مسح')),
                    ],
                  ),
                );
                if (ok == true) {
                  setState(() => _msgs.clear());
                  await _ChatStore.clear();
                }
              },
              tooltip: 'مسح المحادثة',
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _msgs.isEmpty ? _buildWelcome(cs, tt) : _buildMessages(cs),
          ),
          if (_loading) _buildTypingIndicator(cs),
          _buildInputBar(cs),
        ],
      ),
    );
  }

  // ═══ WELCOME SCREEN ═══

  Widget _buildWelcome(ColorScheme cs, TextTheme tt) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 16),
          // Hero
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.0, end: 1.0),
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeOutBack,
            builder: (context, value, child) => Transform.scale(
              scale: value,
              child: child,
            ),
            child: Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [cs.primary, cs.tertiary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: cs.primary.withValues(alpha: 0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Icon(Icons.auto_awesome_rounded,
                  size: 36, color: cs.onPrimary),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'كيف أساعدك اليوم؟',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              fontFamily: 'Cairo',
              color: cs.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'المساعد متصل ببيانات النظام مباشرة',
            style: TextStyle(
              fontSize: 12,
              fontFamily: 'Tajawal',
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),

          // Data query cards
          _sectionLabel('📊 استعلامات سريعة من النظام', cs),
          const SizedBox(height: 10),
          _quickQueryCard(cs, '📊', 'حالة الإرساليات',
              'عرض إحصائيات الإرساليات حسب الحالة', 'ما حالة الإرساليات؟'),
          _quickQueryCard(cs, '⚠️', 'النواقص الحرجة',
              'عرض النواقص الميدانية ومستوى الخطورة', 'أين النواقص الحرجة؟'),
          _quickQueryCard(cs, '🏛️', 'أداء المحافظات',
              'ترتيب المحافظات حسب عدد الإرساليات', 'أي المحافظات تحتاج دعم؟'),
          _quickQueryCard(cs, '👥', 'المستخدمين',
              'عرض إحصائيات المستخدمين والأدوار', 'كم عدد المستخدمين؟'),

          const SizedBox(height: 20),
          _sectionLabel('🤖 اسأل أي شيء', cs),
          const SizedBox(height: 10),
          _quickQueryCard(cs, '💉', 'تغطية التطعيم',
              'اسأل عن تغطية Penta, OPV, MR', 'ما تغطية التطعيم؟'),
          _quickQueryCard(cs, '📈', 'تحليل واتجاهات', 'تحليل أداء الحملات',
              'حلل أداء الأسبوع'),
          _quickQueryCard(
              cs, '📋', 'إنشاء تقرير', 'توليد تقرير تلقائي', 'أنشئ تقرير يومي'),

          const SizedBox(height: 20),
          _sectionLabel('📝 قوالب التقارير', cs),
          const SizedBox(height: 10),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 2.2,
            children: [
              _reportCard(cs, '📅', 'daily', 'يومي'),
              _reportCard(cs, '📊', 'weekly', 'أسبوعي'),
              _reportCard(cs, '⚠️', 'shortages', 'النواقص'),
              _reportCard(cs, '💉', 'coverage', 'التغطية'),
            ],
          ),
          const SizedBox(height: 16),
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
          fontSize: 13,
          fontWeight: FontWeight.w700,
          fontFamily: 'Cairo',
          color: cs.onSurface,
        ),
      ),
    );
  }

  Widget _quickQueryCard(
      ColorScheme cs, String emoji, String title, String desc, String query) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () {
            HapticFeedback.lightImpact();
            _send(query);
          },
          child: Padding(
            padding: const EdgeInsets.all(12),
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
                    child: Text(emoji, style: const TextStyle(fontSize: 20)),
                  ),
                ),
                const SizedBox(width: 12),
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
                Icon(Icons.arrow_back_ios_rounded,
                    size: 14,
                    color: cs.onSurfaceVariant.withValues(alpha: 0.4)),
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
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          HapticFeedback.lightImpact();
          _send('أنشئ تقرير $name', template: templateId);
        },
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Row(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'تقرير $name',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: _msgs.length,
      itemBuilder: (context, i) => _buildBubble(_msgs[i], cs),
    );
  }

  Widget _buildBubble(ChatMsg msg, ColorScheme cs) {
    final isUser = msg.role == 'user';
    final isError = msg.source == 'error';
    final isData = msg.source == 'function_call';

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
              backgroundColor:
                  isError ? cs.errorContainer : cs.primaryContainer,
              child: Icon(
                isError ? Icons.warning_rounded : Icons.auto_awesome_rounded,
                size: 18,
                color: isError ? cs.error : cs.primary,
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
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isUser
                        ? cs.primary
                        : isError
                            ? cs.errorContainer
                            : isData
                                ? cs.primaryContainer.withValues(alpha: 0.5)
                                : cs.surfaceContainerHigh,
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
                      color: isUser
                          ? cs.onPrimary
                          : isError
                              ? cs.onErrorContainer
                              : cs.onSurface,
                      fontSize: 14,
                      height: 1.7,
                    ),
                  ),
                ),
                if (!isUser && msg.source != null && msg.source != 'error') ...[
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
        'groq' => '⚡ Groq AI',
        'mimo' => '🤖 MiMo AI',
        'function_call' => '📊 من بيانات النظام',
        'rag' => '📚 من قاعدة المعرفة',
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
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: cs.primary,
                  ),
                ),
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
                    hintText: 'اسأل عن بيانات النظام أو التطعيم...',
                    hintStyle: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 13,
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
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
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
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
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
