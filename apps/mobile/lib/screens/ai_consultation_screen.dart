/// ═══════════════════════════════════════════════════════════════════════
///  شاشة الاستشارة الذكية v2 — واجهة محسّنة مع:
///  - أزرار اقتراح سريعة (Quick Replies)
///  - شارة حالة الاتصال (أونلاين/أوفلاين)
///  - بطاقة بيانات الطفل (Child Profile Card)
///  - معرف مصدر الرد (NLP محلي / AI سيرفر)
///  - ربط بيانات النظام (من صفحة التحليلات)
/// ═══════════════════════════════════════════════════════════════════════

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// ═══ استيراد المكونات الجديدة ═══
// import 'package:epi_core/src/ai/ai_router_v2.dart';
// import 'package:epi_core/src/ai/local_health_consultation.dart';
// import 'package:epi_core/src/ai/child_context_manager.dart';

/// ═══════════════════════════════════════════════════════════════════
///  نماذج البيانات
/// ═══════════════════════════════════════════════════════════════════

enum MsgSource { user, botLocal, botServer, system }

class ChatMessage {
  final String text;
  final MsgSource source;
  final DateTime time;
  final List<QuickReplyData> quickReplies;
  final String? intent;
  final double? confidence;

  ChatMessage({
    required this.text,
    required this.source,
    DateTime? time,
    this.quickReplies = const [],
    this.intent,
    this.confidence,
  }) : time = time ?? DateTime.now();

  bool get isBot => source != MsgSource.user;
}

class QuickReplyData {
  final String text;
  final String emoji;
  const QuickReplyData({required this.text, this.emoji = '💡'});
}

/// ═══════════════════════════════════════════════════════════════════
///  شاشة الاستشارة
/// ═══════════════════════════════════════════════════════════════════

class AIConsultationScreen extends ConsumerStatefulWidget {
  const AIConsultationScreen({super.key});

  @override
  ConsumerState<AIConsultationScreen> createState() => _AIConsultationScreenState();
}

class _AIConsultationScreenState extends ConsumerState<AIConsultationScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isTyping = false;
  bool _isOnline = false; // يتغير حسب حالة الشبكة
  bool _showChildCard = false;

  // بيانات الطفل
  String? _childName;
  int? _childAgeMonths;
  String? _childGender;

  @override
  void initState() {
    super.initState();
    _initChat();
  }

  void _initChat() {
    // رسالة ترحيب
    setState(() {
      _messages.add(ChatMessage(
        text: '🌟 مرحباً! أنا مساعد التحصين الذكي 🇾🇪\n\n'
            '💉 تطعيمات طفلك (حسب عمره وحالته)\n'
            '⚠️ الآثار الجانبية (حرارة، تورم، تشنجات)\n'
            '🦠 الأمراض التي تحمي منها التطعيمات\n'
            '👶 حالات خاصة (مبتسرين، سكري، قلب)\n'
            '🏥 الإشراف وإدارة المستوى الوسيط\n'
            '📊 تحليلات النظام (أونلاين)\n\n'
            '💡 قولي عمر طفلك وأعطيك تطعيماته!',
        source: MsgSource.botLocal,
        quickReplies: const [
          QuickReplyData(text: 'تطعيمات طفلي', emoji: '💉'),
          QuickReplyData(text: 'الآثار الجانبية', emoji: '⚠️'),
          QuickReplyData(text: 'هل مجاني؟', emoji: '💰'),
          QuickReplyData(text: 'وين أطعم؟', emoji: '📍'),
          QuickReplyData(text: 'حالات خاصة', emoji: '👶'),
          QuickReplyData(text: 'تحليلات النظام', emoji: '📊'),
        ],
      ));
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage(String text) {
    if (text.trim().isEmpty) return;

    // إضافة رسالة المستخدم
    setState(() {
      _messages.add(ChatMessage(text: text.trim(), source: MsgSource.user));
      _isTyping = true;
    });
    _controller.clear();
    _scrollToBottom();

    // ═══ المعالجة ═══
    // TODO: ربط بـ AIRouterV2.process(text, isOnline: _isOnline, analyticsData: ...)
    // حالياً: محاكاة الرد
    Future.delayed(Duration(milliseconds: 300 + text.length * 10), () {
      final response = _processLocally(text);
      setState(() {
        _messages.add(response);
        _isTyping = false;
      });
      _scrollToBottom();
    });
  }

  /// معالجة محلية مؤقتة (للاختبار)
  ChatMessage _processLocally(String text) {
    final lower = text.toLowerCase();

    // استخراج بيانات الطفل
    final ageMatch = RegExp(r'عمره?\s*(\d+)\s*(شهر|شهور|شه)').firstMatch(lower);
    if (ageMatch != null) {
      final months = int.tryParse(ageMatch.group(1)!);
      if (months != null) {
        _childAgeMonths = months;
        _showChildCard = true;
      }
    }
    if (lower.contains('ولد') || lower.contains('ولدي') || lower.contains('ابني')) {
      _childGender = 'ذكر';
    }
    if (lower.contains('بنت') || lower.contains('بنتي')) {
      _childGender = 'أنثى';
    }

    // ردود حسب الكلمات المفتاحية
    if (lower.contains('تطعيمات') || lower.contains('لقاحات')) {
      if (_childAgeMonths != null) {
        return ChatMessage(
          text: '💉 تطعيمات طفلك ($_childAgeMonths أشهر):\n\n'
              '${_getVaccinesForAge(_childAgeMonths!)}\n\n'
              '💡 لا تنسَ التطعيمات حسب الجدول الزمني!',
          source: MsgSource.botLocal,
          intent: 'vaccine_list',
          quickReplies: const [
            QuickReplyData(text: 'وش الآثار الجانبية؟', emoji: '⚠️'),
            QuickReplyData(text: 'هل مجاني؟', emoji: '💰'),
            QuickReplyData(text: 'وين أطعم؟', emoji: '📍'),
          ],
        );
      }
      return ChatMessage(
        text: '📅 كم عمر طفلك؟ عشان أقدر أعطيك التطعيمات المطلوبة',
        source: MsgSource.botLocal,
        intent: 'age_query',
        quickReplies: const [
          QuickReplyData(text: 'عمره شهر', emoji: '📅'),
          QuickReplyData(text: 'عمره شهرين', emoji: '📅'),
          QuickReplyData(text: 'عمره 6 شهور', emoji: '📅'),
          QuickReplyData(text: 'عمره سنة', emoji: '📅'),
        ],
      );
    }

    if (lower.contains('اثار') || lower.contains('أعراض') || lower.contains('جانبي')) {
      return ChatMessage(
        text: '📋 الآثار الجانبية للتطعيمات:\n\n'
            '✅ طبيعية وتزول خلال 1-3 أيام:\n'
            '• ألم واحمرار مكان الحقن\n'
            '• حرارة خفيفة (أقل من 38.5°)\n'
            '• تورم بسيط\n'
            '• بكاء أو نعاس\n\n'
            '🚨 اطلب طبيب فوراً:\n'
            '• تشنجات أو صعوبة تنفس\n'
            '• تورم الوجه أو الحلق\n'
            '• حرارة فوق 40°\n\n'
            '⏰ انتظر 15-30 دقيقة بعد التطعيم في المركز',
        source: MsgSource.botLocal,
        intent: 'side_effects',
        quickReplies: const [
          QuickReplyData(text: 'متى أخاف؟', emoji: '🚨'),
          QuickReplyData(text: 'حرارة بعد التطعيم', emoji: '🌡️'),
        ],
      );
    }

    if (lower.contains('مجاني') || lower.contains('بلاش') || lower.contains('بفلوس')) {
      return ChatMessage(
        text: '💰 هل التطعيم مجاني؟\n\n'
            '✅ نعم! جميع التطعيمات مجانية 100%\n\n'
            '• في المراكز الصحية الحكومية\n'
            '• خلال الحملات الوطنية\n'
            '• حتى في المناطق النائية\n\n'
            '🚫 أي شخص يطلب فلوس مقابل التطعيم → اشتكِ عليه!',
        source: MsgSource.botLocal,
        intent: 'cost',
        quickReplies: const [
          QuickReplyData(text: 'وين أطعم؟', emoji: '📍'),
          QuickReplyData(text: 'متى التطعيم؟', emoji: '📅'),
        ],
      );
    }

    if (lower.contains('وين') || lower.contains('اين') || lower.contains('مركز')) {
      return ChatMessage(
        text: '📍 وين تطعم طفلك:\n\n'
            '• جميع المراكز الصحية الحكومية\n'
            '• الوحدات الصحية\n'
            '• خلال الحملات (مدارس وأسواق)\n\n'
            '✅ التطعيم مجاني في كل الأماكن\n'
            '💡 اسأل أقرب مركز صحي منك عن المواعيد',
        source: MsgSource.botLocal,
        intent: 'location',
        quickReplies: const [
          QuickReplyData(text: 'هل مجاني؟', emoji: '💰'),
          QuickReplyData(text: 'متى التطعيم؟', emoji: '📅'),
        ],
      );
    }

    if (lower.contains('توحد') || lower.contains('اوتيزم')) {
      return ChatMessage(
        text: '🚫 هل التطعيم يسبب التوحد؟\n\n'
            '❌ لا! هذا أسطورة مُدحضة تماماً\n\n'
            '📚 الأدلة العلمية:\n'
            '• دراسة 2019 على 650,000 طفل — لا علاقة\n'
            '• الدراسة الأصلية سُحبت بسبب تزوير\n'
            '• WHO, UNICEF تؤكد السلامة\n\n'
            '💡 التوحد يظهر في نفس الفترة الزمنية — صدفة وليس سببية',
        source: MsgSource.botLocal,
        intent: 'myths',
        quickReplies: const [
          QuickReplyData(text: 'هل التطعيم يضر؟', emoji: '❓'),
          QuickReplyData(text: 'هل يسبب عقم؟', emoji: '❓'),
        ],
      );
    }

    if (lower.contains('تحليلات') || lower.contains('احصائيات') || lower.contains('ارقام')) {
      if (_isOnline) {
        return ChatMessage(
          text: '📊 جاري تحميل تحليلات النظام...\n\n'
              '• الإرساليات اليوم: —\n'
              '• النواقص النشطة: —\n'
              '• أداء المحافظات: —\n\n'
              '🔄 يتم جلب البيانات من السيرفر',
          source: MsgSource.botServer,
          intent: 'analytics',
          quickReplies: const [
            QuickReplyData(text: 'تحليل أعمق', emoji: '📊'),
            QuickReplyData(text: 'توصيات', emoji: '💡'),
          ],
        );
      }
      return ChatMessage(
        text: '📊 تحليلات النظام تحتاج إنترنت\n\n'
            '🔄 اتصل بالإنترنت وحاول مرة أخرى\n\n'
            '💡 أقدر أساعدك بالاستشارات الصحية بدون إنترنت!',
        source: MsgSource.system,
        intent: 'offline',
        quickReplies: const [
          QuickReplyData(text: 'تطعيمات طفلي', emoji: '💉'),
          QuickReplyData(text: 'الآثار الجانبية', emoji: '⚠️'),
        ],
      );
    }

    // رد افتراضي
    return ChatMessage(
      text: '🤔 ما فهمت السؤال تماماً. جرب تسأل عن:\n\n'
          '💉 تطعيمات طفلك حسب عمره\n'
          '⚠️ الآثار الجانبية للتطعيمات\n'
          '📍 وين تطعم (مراكز صحية)\n'
          '📊 تحليلات النظام (أونلاين)',
      source: MsgSource.botLocal,
      intent: 'default',
      quickReplies: const [
        QuickReplyData(text: 'تطعيمات طفلي', emoji: '💉'),
        QuickReplyData(text: 'الآثار الجانبية', emoji: '⚠️'),
        QuickReplyData(text: 'هل مجاني؟', emoji: '💰'),
      ],
    );
  }

  String _getVaccinesForAge(int months) {
    if (months == 0) return '🔴 BCG (ضد السل)\n💧 OPV0 (شلل فموي)\n💉 HepB0 (كبد ب)';
    if (months < 4) return '💧 OPV1-2\n5️⃣ الخماسي 1-2\n🫁 PCV1-2\n🦠 Rota1-2';
    if (months < 6) return '💧 OPV3\n5️⃣ الخماسي 3\n🫁 PCV3\n💉 IPV1 (شلل حقن)';
    if (months < 9) return '🔴 MR1 (الحصبة — 9 أشهر)\n💧 OPV4\n💉 IPV2 (شلل حقن)\n🌟 فيتامين أ (100,000 و.د)';
    if (months < 18) return '🔴 MR2 (18 شهر)\n💪 Penta4 (خماسي تعزيزية)\n💧 OPV5\n🌟 فيتامين أ (200,000 و.د)';
    return '🏫 Td (مدرسي)\n🔴 MR تعزيزية\n🌟 فيتامين أ (200,000 و.د)';
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent + 100,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            // شارة حالة الاتصال
            Container(
              width: 10, height: 10,
              decoration: BoxDecoration(
                color: _isOnline ? Colors.green : Colors.orange,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('المساعد الذكي',
                      style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700, fontSize: 16)),
                  Text(_isOnline ? 'متصل — AI + تحليلات' : 'أوفلاين — استشارات صحية',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w400)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // زر بطاقة الطفل
          if (_showChildCard)
            IconButton(
              icon: const Icon(Icons.child_care_rounded),
              tooltip: 'بيانات الطفل',
              onPressed: () => _showChildProfileSheet(context),
            ),
          // زر إعادة تعيين
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'محادثة جديدة',
            onPressed: () {
              setState(() {
                _messages.clear();
                _childAgeMonths = null;
                _childGender = null;
                _showChildCard = false;
              });
              _initChat();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // ═══ بطاقة بيانات الطفل ═══
          if (_showChildCard && _childAgeMonths != null)
            _ChildProfileCard(
              ageMonths: _childAgeMonths!,
              gender: _childGender,
              onTap: () => _showChildProfileSheet(context),
            ),

          // ═══ قائمة الرسائل ═══
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length && _isTyping) {
                  return _TypingIndicator();
                }
                return _MessageBubble(message: _messages[index], onQuickReply: _sendMessage);
              },
            ),
          ),

          // ═══ حقل الإدخال ═══
          _InputBar(
            controller: _controller,
            onSend: _sendMessage,
            isOnline: _isOnline,
            onToggleOnline: () => setState(() => _isOnline = !_isOnline),
          ),
        ],
      ),
    );
  }

  void _showChildProfileSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('🧒 بيانات الطفل',
                style: TextStyle(fontFamily: 'Cairo', fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.cake_rounded),
              title: const Text('العمر'),
              subtitle: Text(_childAgeMonths != null ? '$_childAgeMonths أشهر' : 'غير محدد'),
            ),
            ListTile(
              leading: const Icon(Icons.person_rounded),
              title: const Text('الجنس'),
              subtitle: Text(_childGender ?? 'غير محدد'),
            ),
            ListTile(
              leading: const Icon(Icons.vaccines_rounded),
              title: const Text('التطعيمات القادمة'),
              subtitle: Text(_childAgeMonths != null ? _getVaccinesForAge(_childAgeMonths!) : 'حدد العمر أولاً'),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => Navigator.pop(ctx),
              icon: const Icon(Icons.check),
              label: const Text('تم'),
            ),
          ],
        ),
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════════════
///  Widgets
/// ═══════════════════════════════════════════════════════════════════

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final Function(String) onQuickReply;

  const _MessageBubble({required this.message, required this.onQuickReply});

  @override
  Widget build(BuildContext context) {
    final isUser = message.source == MsgSource.user;
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          // فقاعة الرسالة
          Row(
            mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
            children: [
              if (!isUser) _BotAvatar(source: message.source),
              if (!isUser) const SizedBox(width: 8),
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isUser
                        ? theme.colorScheme.primary
                        : message.source == MsgSource.system
                            ? Colors.grey.shade200
                            : Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isUser ? 16 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 16),
                    ),
                    boxShadow: [
                      if (!isUser)
                        BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 2)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        message.text,
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 14,
                          color: isUser ? Colors.white : Colors.black87,
                          height: 1.5,
                        ),
                      ),
                      // شارة مصدر الرد
                      if (!isUser && message.source != MsgSource.system)
                        Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                message.source == MsgSource.botLocal
                                    ? Icons.offline_bolt_rounded
                                    : Icons.cloud_done_rounded,
                                size: 12,
                                color: message.source == MsgSource.botLocal
                                    ? Colors.orange.shade400
                                    : Colors.blue.shade400,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                message.source == MsgSource.botLocal ? 'محلي' : 'سيرفر',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: message.source == MsgSource.botLocal
                                      ? Colors.orange.shade400
                                      : Colors.blue.shade400,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              if (isUser) const SizedBox(width: 8),
              if (isUser)
                CircleAvatar(
                  radius: 16,
                  backgroundColor: theme.colorScheme.primaryContainer,
                  child: Icon(Icons.person_rounded, size: 18, color: theme.colorScheme.primary),
                ),
            ],
          ),

          // أزرار الاقتراح السريع
          if (!isUser && message.quickReplies.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8, left: 40),
              child: Wrap(
                spacing: 6,
                runSpacing: 6,
                children: message.quickReplies.map((qr) {
                  return ActionChip(
                    avatar: Text(qr.emoji, style: const TextStyle(fontSize: 14)),
                    label: Text(qr.text, style: const TextStyle(fontSize: 12, fontFamily: 'Cairo')),
                    onPressed: () => onQuickReply(qr.text),
                    backgroundColor: Colors.blue.shade50,
                    side: BorderSide(color: Colors.blue.shade100),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }
}

class _BotAvatar extends StatelessWidget {
  final MsgSource source;
  const _BotAvatar({required this.source});

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: 16,
      backgroundColor: source == MsgSource.botServer
          ? Colors.blue.shade100
          : Colors.green.shade100,
      child: Icon(
        source == MsgSource.botServer ? Icons.cloud_rounded : Icons.smart_toy_rounded,
        size: 18,
        color: source == MsgSource.botServer
            ? Colors.blue.shade700
            : Colors.green.shade700,
      ),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: Colors.green.shade100,
            child: Icon(Icons.smart_toy_rounded, size: 18, color: Colors.green.shade700),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _Dot(delay: 0),
                const SizedBox(width: 4),
                _Dot(delay: 200),
                const SizedBox(width: 4),
                _Dot(delay: 400),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Dot extends StatefulWidget {
  final int delay;
  const _Dot({required this.delay});

  @override
  State<_Dot> createState() => _DotState();
}

class _DotState extends State<_Dot> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(duration: const Duration(milliseconds: 600), vsync: this);
    _anim = Tween<double>(begin: 0.4, end: 1.0).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _ctrl.repeat(reverse: true);
    });
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _anim,
      child: Container(width: 8, height: 8, decoration: BoxDecoration(color: Colors.grey.shade400, shape: BoxShape.circle)),
    );
  }
}

class _InputBar extends StatelessWidget {
  final TextEditingController controller;
  final Function(String) onSend;
  final bool isOnline;
  final VoidCallback onToggleOnline;

  const _InputBar({
    required this.controller,
    required this.onSend,
    required this.isOnline,
    required this.onToggleOnline,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 8 + 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, -2))],
      ),
      child: Row(
        children: [
          // زر تبديل الأونلاين
          IconButton(
            icon: Icon(
              isOnline ? Icons.cloud_rounded : Icons.cloud_off_rounded,
              color: isOnline ? Colors.blue : Colors.orange,
            ),
            onPressed: onToggleOnline,
            tooltip: isOnline ? 'متصل — اضغط للتبديل' : 'أوفلاين — اضغط للتبديل',
          ),
          Expanded(
            child: TextField(
              controller: controller,
              textInputAction: TextInputAction.send,
              onSubmitted: onSend,
              maxLines: null,
              textDirection: TextDirection.rtl,
              style: const TextStyle(fontFamily: 'Cairo', fontSize: 14),
              decoration: InputDecoration(
                hintText: 'اسأل عن التحصين...',
                hintStyle: TextStyle(color: Colors.grey.shade400, fontFamily: 'Cairo'),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.grey.shade50,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [theme.colorScheme.primary, theme.colorScheme.primary.withOpacity(0.8)]),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
              onPressed: () => onSend(controller.text),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChildProfileCard extends StatelessWidget {
  final int ageMonths;
  final String? gender;
  final VoidCallback onTap;

  const _ChildProfileCard({required this.ageMonths, this.gender, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.blue.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.blue.shade100),
        ),
        child: Row(
          children: [
            Icon(Icons.child_care_rounded, color: Colors.blue.shade600, size: 20),
            const SizedBox(width: 8),
            Text(
              'عمره $ageMonths أشهر${gender != null ? " • $gender" : ""}',
              style: TextStyle(fontFamily: 'Cairo', fontSize: 13, color: Colors.blue.shade700, fontWeight: FontWeight.w600),
            ),
            const Spacer(),
            Icon(Icons.edit_rounded, size: 16, color: Colors.blue.shade400),
          ],
        ),
      ),
    );
  }
}
