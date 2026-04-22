import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart' hide TextDirection;
import 'package:epi_core/epi_core.dart';

// ═══ Provider للبوت ═══

final botEngineProvider = Provider<BotEngine>((ref) {
  final engine = BotEngine();
  engine.initialize();
  return engine;
});

// ═══ شاشة المحادثة مع البوت ═══

class BotChatScreen extends ConsumerStatefulWidget {
  const BotChatScreen({super.key});

  @override
  ConsumerState<BotChatScreen> createState() => _BotChatScreenState();
}

class _BotChatScreenState extends ConsumerState<BotChatScreen>
    with TickerProviderStateMixin {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  late BotEngine _engine;
  bool _isSending = false;
  late AnimationController _typingAnimCtrl;

  @override
  void initState() {
    super.initState();
    _typingAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
    _engine = ref.read(botEngineProvider);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    _typingAnimCtrl.dispose();
    super.dispose();
  }

  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent + 120,
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  Future<void> _send(String text) async {
    if (text.trim().isEmpty || _isSending) return;

    HapticFeedback.lightImpact();
    _ctrl.clear();

    setState(() => _isSending = true);
    _scrollDown();

    // Use callback-based sending for AI support
    _engine.sendMessageWithCallback(text, (reply) {
      if (mounted) {
        setState(() => _isSending = false);
        _scrollDown();
      }
    });

    // Immediately update UI with user message
    setState(() {});
    _scrollDown();
  }

  void _sendQuickReply(BotQuickReply qr) {
    _send(qr.text);
  }

  // ═══ Build ═══

  @override
  Widget build(BuildContext context) {
    final messages = _engine.messages;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: messages.isEmpty
                ? _buildWelcome()
                : _buildMessages(messages),
          ),
          if (_engine.isAILoading) _buildTypingIndicator(),
          _buildInputBar(),
        ],
      ),
    );
  }

  // ═══ Header ═══

  Widget _buildHeader() {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        left: 16,
        right: 16,
        bottom: 12,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF00897B), Color(0xFF00695C)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Center(
              child: Text('💉', style: TextStyle(fontSize: 24)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'مستشار التحصين الذكي',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _engine.isAIEnabled
                            ? const Color(0xFF4CAF50)
                            : const Color(0xFFFFA726),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _engine.isAIEnabled ? 'ذكاء اصطناعي مفعّل' : 'وضع محلي — بدون إنترنت',
                      style: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 11,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          _headerAction(Icons.refresh_rounded, () {
            setState(() => _engine.clearChat());
          }),
        ],
      ),
    );
  }

  Widget _headerAction(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  // ═══ Messages ═══

  Widget _buildMessages(List<BotMessage> messages) {
    return ListView.builder(
      controller: _scroll,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final msg = messages[index];
        return _buildBubble(msg);
      },
    );
  }

  Widget _buildBubble(BotMessage msg) {
    final isMe = !msg.isBot;
    final timeStr = DateFormat('HH:mm').format(msg.timestamp);

    return Padding(
      padding: EdgeInsets.only(
        bottom: 10,
        left: isMe ? 48 : 0,
        right: isMe ? 0 : 48,
      ),
      child: Column(
        crossAxisAlignment:
            isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          // Bot avatar row
          if (!isMe)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF00897B), Color(0xFF00695C)],
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Center(
                    child: Text('💉', style: TextStyle(fontSize: 16)),
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: _bubbleContent(msg, isMe, timeStr),
                ),
              ],
            )
          else
            _bubbleContent(msg, isMe, timeStr),

          // Quick replies
          if (msg.isBot && msg.quickReplies != null && msg.quickReplies!.isNotEmpty)
            _buildQuickReplies(msg.quickReplies!),
        ],
      ),
    );
  }

  Widget _bubbleContent(BotMessage msg, bool isMe, String timeStr) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isMe ? const Color(0xFF00897B) : Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(isMe ? 16 : 4),
          topRight: Radius.circular(isMe ? 4 : 16),
          bottomLeft: const Radius.circular(16),
          bottomRight: const Radius.circular(16),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isMe ? 0.1 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            msg.text,
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 14.5,
              height: 1.6,
              color: isMe ? Colors.white : const Color(0xFF1A2332),
            ),
            textDirection: TextDirection.rtl,
          ),
          const SizedBox(height: 4),
          Text(
            timeStr,
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 10,
              color: isMe
                  ? Colors.white.withValues(alpha: 0.65)
                  : const Color(0xFF9CA3AF),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickReplies(List<BotQuickReply> replies) {
    return Container(
      margin: const EdgeInsets.only(top: 8, right: 40),
      child: Wrap(
        spacing: 6,
        runSpacing: 6,
        children: replies.map((qr) {
          return GestureDetector(
            onTap: () => _sendQuickReply(qr),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFE0F2F1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: const Color(0xFF00897B).withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(qr.emoji, style: const TextStyle(fontSize: 14)),
                  const SizedBox(width: 4),
                  Text(
                    qr.text,
                    style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 12.5,
                      color: Color(0xFF00695C),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ═══ Welcome ═══

  Widget _buildWelcome() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.8, end: 1.0),
              duration: const Duration(milliseconds: 800),
              curve: Curves.elasticOut,
              builder: (context, value, child) =>
                  Transform.scale(scale: value, child: child),
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF00897B).withValues(alpha: 0.15),
                      const Color(0xFF00897B).withValues(alpha: 0.05),
                    ],
                  ),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Text('💉🇾🇪', style: TextStyle(fontSize: 40)),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'مستشار التحصين الذكي',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1A2332),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'اسألني أي شيء عن التطعيمات\n180+ موضوع معرفي — يعمل بدون إنترنت',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 14,
                height: 1.6,
                color: Colors.grey.shade500,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'مواضيع شائعة:',
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF6B7280),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: const [
                _WelcomeChip('وش تطعيمات طفلي؟', '💉'),
                _WelcomeChip('وش الآثار الجانبية؟', '⚠️'),
                _WelcomeChip('هل مجاني؟', '💰'),
                _WelcomeChip('هل يسبب أوتيزم؟', '🚫'),
                _WelcomeChip('الأشراف الداعم', '🔍'),
                _WelcomeChip('جدول التحصين', '📋'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ═══ Typing Indicator ═══

  Widget _buildTypingIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      alignment: Alignment.centerRight,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: const Color(0xFF00897B).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Center(child: Text('💉', style: TextStyle(fontSize: 14))),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: AnimatedBuilder(
              animation: _typingAnimCtrl,
              builder: (context, _) {
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: List.generate(3, (i) {
                    final delay = i * 0.3;
                    final value = ((_typingAnimCtrl.value + delay) % 1.0);
                    final opacity = (value < 0.5) ? value * 2 : (1 - value) * 2;
                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 2),
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: Color.lerp(
                          const Color(0xFF00897B).withValues(alpha: 0.2),
                          const Color(0xFF00897B),
                          opacity,
                        ),
                        shape: BoxShape.circle,
                      ),
                    );
                  }),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // ═══ Input Bar ═══

  Widget _buildInputBar() {
    return Container(
      padding: EdgeInsets.only(
        left: 12,
        right: 12,
        top: 10,
        bottom: MediaQuery.of(context).padding.bottom + 8,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          GestureDetector(
            onTap: _isSending ? null : () => _send(_ctrl.text),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                gradient: _ctrl.text.trim().isNotEmpty
                    ? const LinearGradient(
                        colors: [Color(0xFF00897B), Color(0xFF00695C)],
                      )
                    : null,
                color: _ctrl.text.trim().isNotEmpty
                    ? null
                    : const Color(0xFFE5E7EB),
                borderRadius: BorderRadius.circular(16),
              ),
              child: _isSending
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Icon(
                      Icons.send_rounded,
                      color: _ctrl.text.trim().isNotEmpty
                          ? Colors.white
                          : const Color(0xFF9CA3AF),
                      size: 22,
                    ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Container(
              constraints: const BoxConstraints(maxHeight: 120),
              decoration: BoxDecoration(
                color: const Color(0xFFF5F7FA),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
              ),
              child: TextField(
                controller: _ctrl,
                textDirection: TextDirection.rtl,
                maxLines: 4,
                minLines: 1,
                textInputAction: TextInputAction.newline,
                style: const TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 15,
                  color: Color(0xFF1A2332),
                ),
                decoration: const InputDecoration(
                  hintText: 'اسأل عن التطعيمات...',
                  hintStyle: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 14,
                    color: Color(0xFF9CA3AF),
                  ),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
                onChanged: (_) => setState(() {}),
                onSubmitted: (v) => _send(v),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ═══ Welcome Chip ═══

class _WelcomeChip extends StatelessWidget {
  final String text;
  final String emoji;
  const _WelcomeChip(this.text, this.emoji);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        // Navigate to bot chat and send the message
        // This would be handled by the parent
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFE0F2F1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFF00897B).withValues(alpha: 0.2),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: 4),
            Text(
              text,
              style: const TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 12.5,
                color: Color(0xFF00695C),
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
