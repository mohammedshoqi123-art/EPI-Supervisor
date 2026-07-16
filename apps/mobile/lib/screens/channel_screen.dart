import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart' hide TextDirection;
import '../services/chat_channel_service.dart';
import '../services/attachment_service.dart';
import 'attachment_widgets.dart';

/// ═══════════════════════════════════════════════════════════
/// ChannelScreen — single channel view with messages
/// ═══════════════════════════════════════════════════════════

class ChannelScreen extends StatefulWidget {
  final ChatChannel channel;
  final String currentUserId;
  final String currentUserName;
  final String currentUserRole;

  const ChannelScreen({
    super.key,
    required this.channel,
    required this.currentUserId,
    required this.currentUserName,
    required this.currentUserRole,
  });

  @override
  State<ChannelScreen> createState() => _ChannelScreenState();
}

class _ChannelScreenState extends State<ChannelScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  RealtimeChannel? _realtimeChannel;

  // ═══ Fallback timer (canceled in dispose) ═══
  Timer? _fallbackTimer;

  // ═══ Attachments state ═══
  final List<Attachment> _pendingAttachments = [];
  final Map<String, List<Attachment>> _messageAttachmentsCache = {};

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _subscribeToRealtime();
    _markAsRead();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _realtimeChannel?.unsubscribe();
    _fallbackTimer?.cancel();
    super.dispose();
  }

  void _subscribeToRealtime() {
    try {
      final client = Supabase.instance.client;
      final channelCode = widget.channel.code ?? 'general';
      _realtimeChannel = client.channel('chat-${widget.channel.id}');

      // Subscribe to new messages by room code
      _realtimeChannel!.onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'chat_messages',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'room',
          value: channelCode,
        ),
        callback: (payload) {
          if (mounted) _loadMessages(silent: true);
        },
      );

      _realtimeChannel!.subscribe();
    } catch (e) {
      debugPrint('[ChannelScreen] Realtime subscribe failed: $e');
      _fallbackTimer?.cancel();
      _fallbackTimer = Timer.periodic(const Duration(seconds: 15), (_) {
        if (mounted) _loadMessages(silent: true);
      });
    }
  }

  Future<void> _loadMessages({bool silent = false}) async {
    try {
      final client = Supabase.instance.client;
      final channelCode = widget.channel.code ?? 'general';

      // Prefer channel_id filter when available, fallback to room
      final response = widget.channel.id.isNotEmpty
          ? await client
              .from('chat_messages')
              .select('*')
              .eq('channel_id', widget.channel.id)
              .order('created_at', ascending: true)
              .limit(200)
          : await client
              .from('chat_messages')
              .select('*')
              .eq('room', channelCode)
              .order('created_at', ascending: true)
              .limit(200);

      if (mounted) {
        setState(() {
          _messages = (response as List).cast<Map<String, dynamic>>();
          if (!silent) _isLoading = false;
        });
        _scrollToBottom();
        _markAsRead();
      }
    } catch (e) {
      if (mounted && !silent) setState(() => _isLoading = false);
    }
  }

  Future<void> _markAsRead() async {
    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      if (userId == null) return;
      await client.from('chat_read_state').upsert({
        'user_id': userId,
        'channel_id': widget.channel.id,
        'unread_count': 0,
        'last_read_at': DateTime.now().toUtc().toIso8601String(),
      }, onConflict: 'user_id, channel_id');
    } catch (e) {
      debugPrint('[ChannelScreen] markAsRead error: $e');
    }
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

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    final attachments = List<Attachment>.from(_pendingAttachments);
    if (text.isEmpty && attachments.isEmpty) return;
    if (text.length > 1000) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('الرسالة طويلة جداً (الحد الأقصى 1000 حرف)'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isSending = true;
      _pendingAttachments.clear();
    });
    _messageController.clear();
    HapticFeedback.lightImpact();

    try {
      final client = Supabase.instance.client;
      final insertData = <String, dynamic>{
        'sender_id': widget.currentUserId,
        'sender_name': widget.currentUserName,
        'content': text.isEmpty && attachments.isNotEmpty
            ? '📎 مرفق'
            : text,
        'room': widget.channel.code ?? 'general',
        'is_official': widget.channel.isAnnouncement,
        'priority': widget.channel.isAnnouncement ? 'high' : 'normal',
      };

      // channel_id is optional — only include if channel has a valid id
      if (widget.channel.id.isNotEmpty) {
        insertData['channel_id'] = widget.channel.id;
      }

      final msgResponse =
          await client.from('chat_messages').insert(insertData).select('id').single();
      final messageId = msgResponse['id'] as String?;

      // Save attachments metadata
      if (messageId != null && attachments.isNotEmpty) {
        for (final att in attachments) {
          await AttachmentService.saveAttachmentMetadata(
            attachment: att,
            messageId: messageId,
          );
        }
      }

      await _loadMessages(silent: true);
    } catch (e) {
      if (mounted) {
        _messageController.text = text;
        // Restore attachments on failure
        _pendingAttachments.addAll(attachments);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.error_outline, color: Colors.white, size: 20),
                SizedBox(width: 8),
                Text('فشل الإرسال — حاول مرة أخرى',
                    style: TextStyle(fontFamily: 'Tajawal')),
              ],
            ),
            backgroundColor: const Color(0xFFEF4444),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  /// Pick an attachment to attach to the next message
  Future<void> _pickAttachment() async {
    HapticFeedback.lightImpact();
    final att = await AttachmentPicker.show(
      context,
      folder: 'chat/${widget.channel.code ?? widget.channel.id}',
    );
    if (att != null && mounted) {
      setState(() => _pendingAttachments.add(att));
    }
  }

  /// Remove a pending attachment
  void _removeAttachment(int index) {
    HapticFeedback.lightImpact();
    setState(() => _pendingAttachments.removeAt(index));
  }

  /// Fetch attachments for a message (with caching)
  Future<List<Attachment>> _getMessageAttachments(String messageId) async {
    if (_messageAttachmentsCache.containsKey(messageId)) {
      return _messageAttachmentsCache[messageId]!;
    }
    final attachments =
        await AttachmentService.getAttachments(messageId: messageId);
    _messageAttachmentsCache[messageId] = attachments;
    return attachments;
  }

  bool get _canWrite {
    return widget.channel.targetRoles.contains(widget.currentUserRole);
  }

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  String _dateLabel(DateTime date) {
    final now = DateTime.now();
    if (_isSameDay(date, now)) return 'اليوم';
    if (_isSameDay(date, now.subtract(const Duration(days: 1)))) return 'أمس';
    return DateFormat('d MMMM yyyy', 'ar').format(date);
  }

  bool _shouldShowAvatar(int index) {
    if (index == _messages.length - 1) return true;
    return _messages[index]['sender_id'] != _messages[index + 1]['sender_id'];
  }

  bool _shouldShowName(int index) {
    if (index == 0) return true;
    return _messages[index]['sender_id'] != _messages[index - 1]['sender_id'];
  }

  bool _shouldShowDateSeparator(int index) {
    if (index == 0) return true;
    final current =
        DateTime.tryParse(_messages[index]['created_at'] ?? '') ??
            DateTime.now();
    final prev =
        DateTime.tryParse(_messages[index - 1]['created_at'] ?? '') ??
            DateTime.now();
    return !_isSameDay(current, prev);
  }

  @override
  Widget build(BuildContext context) {
    final channelColor = Color(widget.channel.colorValue);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: channelColor,
        foregroundColor: Colors.white,
        titleSpacing: 0,
        title: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                _getChannelIcon(widget.channel.icon),
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.channel.name,
                    style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (widget.channel.isOfficial)
                    Row(
                      children: [
                        Icon(Icons.verified_rounded,
                            size: 12, color: Colors.white.withValues(alpha: 0.9)),
                        const SizedBox(width: 3),
                        Text(
                          widget.channel.typeLabelAr,
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 10,
                            color: Colors.white.withValues(alpha: 0.85),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => _loadMessages(),
            tooltip: 'تحديث',
          ),
        ],
      ),
      body: Column(
        children: [
          // Channel info banner
          if (widget.channel.description != null)
            _buildChannelBanner(channelColor),
          // Messages
          Expanded(
            child: _isLoading
                ? _buildLoadingState()
                : _messages.isEmpty
                    ? _buildEmptyState()
                    : _buildMessagesList(channelColor),
          ),
          // Input bar
          _buildInputBar(channelColor),
        ],
      ),
    );
  }

  Widget _buildChannelBanner(Color color) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        border: Border(
          bottom: BorderSide(color: color.withValues(alpha: 0.15)),
        ),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline_rounded, size: 16, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              widget.channel.description!,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 11,
                color: color.withValues(alpha: 0.85),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessagesList(Color channelColor) {
    final items = <Widget>[];

    for (int i = 0; i < _messages.length; i++) {
      if (_shouldShowDateSeparator(i)) {
        final date =
            DateTime.tryParse(_messages[i]['created_at'] ?? '') ??
            DateTime.now();
        items.add(_dateSeparator(_dateLabel(date)));
      }

      final msg = _messages[i];
      final isMe = msg['sender_id'] == widget.currentUserId;
      final showAvatar = _shouldShowAvatar(i);
      final showName = _shouldShowName(i);
      final isOfficial =
          (msg['is_official'] as bool?) ?? widget.channel.isAnnouncement;
      final priority = (msg['priority'] as String?) ?? 'normal';

      items.add(_buildMessageBubble(
        msg,
        isMe,
        showAvatar,
        showName,
        isOfficial,
        priority,
        channelColor,
      ));
    }

    return ListView(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      children: items,
    );
  }

  Widget _dateSeparator(String label) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          const Expanded(child: Divider(color: Color(0xFFE5E7EB))),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                label,
                style: const TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF9CA3AF),
                ),
              ),
            ),
          ),
          const Expanded(child: Divider(color: Color(0xFFE5E7EB))),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(
    Map<String, dynamic> msg,
    bool isMe,
    bool showAvatar,
    bool showName,
    bool isOfficial,
    String priority,
    Color channelColor,
  ) {
    final createdAt =
        DateTime.tryParse(msg['created_at'] ?? '') ?? DateTime.now();
    final timeStr = DateFormat('HH:mm').format(createdAt);
    final senderName = (msg['sender_name'] ?? 'مستخدم') as String;
    final avatarInitial = senderName.isNotEmpty
        ? senderName.substring(0, math.min(2, senderName.length))
        : '؟';

    final isCritical = priority == 'critical' || priority == 'high';
    final bubbleColor = isMe
        ? channelColor
        : (isOfficial ? const Color(0xFFFFEBEE) : Colors.white);
    final textColor =
        isMe ? Colors.white : (isOfficial ? const Color(0xFFB71C1C) : const Color(0xFF1A2332));

    return Padding(
      padding: EdgeInsets.only(
        bottom: showAvatar ? 12 : 2,
        left: isMe ? 48 : 0,
        right: isMe ? 0 : 48,
      ),
      child: Row(
        mainAxisAlignment:
            isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe)
            showAvatar
                ? _avatar(avatarInitial, _avatarColor(senderName))
                : const SizedBox(width: 36),
          const SizedBox(width: 6),
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isMe && showName)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4, right: 8),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          senderName,
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: _avatarColor(senderName),
                          ),
                        ),
                        if (isOfficial) ...[
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'رسمي',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 8,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFFEF4444),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                GestureDetector(
                  onLongPress: () => _showMessageOptions(msg, isMe),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: bubbleColor,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(isMe ? 16 : 4),
                        topRight: Radius.circular(isMe ? 4 : 16),
                        bottomLeft: const Radius.circular(16),
                        bottomRight: const Radius.circular(16),
                      ),
                      border: isOfficial && !isMe
                          ? Border.all(
                              color: const Color(0xFFEF4444).withValues(alpha: 0.3),
                              width: 1)
                          : null,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(
                              alpha: isMe ? 0.12 : 0.04),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        if (isCritical && !isMe)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.priority_high_rounded,
                                    size: 14, color: Color(0xFFEF4444)),
                                const SizedBox(width: 4),
                                Text(
                                  priority == 'critical'
                                      ? 'عاجل جداً'
                                      : 'هام',
                                  style: const TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFFEF4444),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        Text(
                          msg['content'] ?? '',
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 14.5,
                            height: 1.5,
                            color: textColor,
                          ),
                        ),
                        // ═══ Attachments ═══
                        if (msg['id'] != null)
                          FutureBuilder<List<Attachment>>(
                            future: _getMessageAttachments(msg['id'] as String),
                            builder: (context, snapshot) {
                              if (!snapshot.hasData ||
                                  snapshot.data!.isEmpty) {
                                return const SizedBox.shrink();
                              }
                              return Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: snapshot.data!
                                      .map((att) => AttachmentBubble(
                                            attachment: att,
                                            isMe: isMe,
                                          ))
                                      .toList(),
                                ),
                              );
                            },
                          ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
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
                            if (isMe) ...[
                              const SizedBox(width: 4),
                              Icon(
                                Icons.done_all_rounded,
                                size: 14,
                                color:
                                    Colors.white.withValues(alpha: 0.65),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _avatar(String initials, Color color) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color, color.withValues(alpha: 0.7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.25),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Center(
        child: Text(
          initials,
          style: const TextStyle(
            fontFamily: 'Cairo',
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Color _avatarColor(String name) {
    final colors = [
      const Color(0xFF00897B),
      const Color(0xFF5C6BC0),
      const Color(0xFF26A69A),
      const Color(0xFF7E57C2),
      const Color(0xFF42A5F5),
      const Color(0xFF66BB6A),
      const Color(0xFFFFA726),
      const Color(0xFFEF5350),
    ];
    final hash = name.codeUnits.fold(0, (a, b) => a + b);
    return colors[hash % colors.length];
  }

  void _showMessageOptions(Map<String, dynamic> msg, bool isMe) {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 12),
            _optionTile(Icons.copy_rounded, 'نسخ الرسالة', () {
              Clipboard.setData(ClipboardData(text: msg['content'] ?? ''));
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('تم النسخ!',
                      style: TextStyle(fontFamily: 'Tajawal')),
                  duration: Duration(seconds: 1),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }),
            if (isMe)
              _optionTile(Icons.delete_outline_rounded, 'حذف', () {
                Navigator.pop(context);
                _deleteMessage(msg['id']);
              }, color: const Color(0xFFEF4444)),
          ],
        ),
      ),
    );
  }

  Widget _optionTile(IconData icon, String label, VoidCallback onTap,
      {Color color = const Color(0xFF6B7280)}) {
    return ListTile(
      leading: Icon(icon, color: color, size: 22),
      title: Text(
        label,
        style: TextStyle(fontFamily: 'Tajawal', color: color, fontSize: 14),
      ),
      onTap: onTap,
      horizontalTitleGap: 8,
    );
  }

  Future<void> _deleteMessage(dynamic id) async {
    if (id == null) return;
    try {
      final client = Supabase.instance.client;
      await client.from('chat_messages').delete().eq('id', id);
      await _loadMessages(silent: true);
    } catch (_) {}
  }

  Widget _buildInputBar(Color channelColor) {
    if (!_canWrite) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFF9FAFB),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.lock_outline_rounded,
                size: 16, color: Colors.grey.shade500),
            const SizedBox(width: 8),
            Text(
              'هذه قناة للقراءة فقط — لا يحق لك الإرسال هنا',
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      );
    }

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
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ═══ Pending attachments preview ═══
          if (_pendingAttachments.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Align(
                alignment: Alignment.centerRight,
                child: AttachmentChips(
                  attachments: _pendingAttachments,
                  onRemove: _removeAttachment,
                ),
              ),
            ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // ═══ Attachment button ═══
              GestureDetector(
                onTap: _isSending ? null : _pickAttachment,
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: channelColor.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                        color: channelColor.withValues(alpha: 0.2)),
                  ),
                  child: Icon(
                    Icons.attach_file_rounded,
                    color: channelColor,
                    size: 22,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // ═══ Send button ═══
              GestureDetector(
                onTap: _isSending ? null : _sendMessage,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: (_messageController.text.trim().isNotEmpty ||
                            _pendingAttachments.isNotEmpty)
                        ? LinearGradient(colors: [
                            channelColor,
                            channelColor.withValues(alpha: 0.8),
                          ])
                        : null,
                    color: (_messageController.text.trim().isNotEmpty ||
                            _pendingAttachments.isNotEmpty)
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
                          color: (_messageController.text.trim().isNotEmpty ||
                                  _pendingAttachments.isNotEmpty)
                              ? Colors.white
                              : const Color(0xFF9CA3AF),
                          size: 22,
                        ),
                ),
              ),
              const SizedBox(width: 10),
              // ═══ Text field ═══
              Expanded(
                child: Container(
                  constraints: const BoxConstraints(maxHeight: 120),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F7FA),
                    borderRadius: BorderRadius.circular(16),
                    border:
                        Border.all(color: const Color(0xFFE5E7EB), width: 1),
                  ),
                  child: TextField(
                    controller: _messageController,
                    textDirection: TextDirection.rtl,
                    maxLines: 4,
                    minLines: 1,
                    textInputAction: TextInputAction.newline,
                    style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 15,
                      color: Color(0xFF1A2332),
                    ),
                    decoration: InputDecoration(
                      hintText: 'اكتب رسالتك في ${widget.channel.name}...',
                      hintStyle: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 14,
                        color: Color(0xFF9CA3AF),
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                    ),
                    onChanged: (_) => setState(() {}),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 48,
            height: 48,
            child: CircularProgressIndicator(strokeWidth: 3),
          ),
          SizedBox(height: 16),
          Text(
            'جاري تحميل الرسائل...',
            style: TextStyle(
                fontFamily: 'Tajawal', fontSize: 14, color: Color(0xFF9CA3AF)),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Color(widget.channel.colorValue).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _getChannelIcon(widget.channel.icon),
                size: 44,
                color: Color(widget.channel.colorValue),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'لا توجد رسائل بعد',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1A2332),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _canWrite
                  ? 'كن أول من يبدأ النقاش في ${widget.channel.name}'
                  : 'ستظهر هنا الرسائل المستلمة من هذه القناة',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 13,
                color: Colors.grey.shade500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getChannelIcon(String iconName) {
    const map = {
      'campaign': Icons.campaign_rounded,
      'account_balance': Icons.account_balance_rounded,
      'feedback': Icons.feedback_rounded,
      'rate_review': Icons.rate_review_rounded,
      'help_outline': Icons.help_outline_rounded,
      'forum': Icons.forum_rounded,
      'chat_bubble_outline': Icons.chat_bubble_outline_rounded,
    };
    return map[iconName] ?? Icons.chat_bubble_outline_rounded;
  }
}
