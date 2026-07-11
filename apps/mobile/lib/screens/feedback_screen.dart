import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_shared/epi_shared.dart';
import '../services/memos_feedback_service.dart';
import '../services/attachment_service.dart';
import 'attachment_widgets.dart';

/// ═══════════════════════════════════════════════════════════
/// FeedbackScreen — التغذية الراجعة المنظمة بحالات + SLA
/// ═══════════════════════════════════════════════════════════

class FeedbackScreen extends ConsumerStatefulWidget {
  const FeedbackScreen({super.key});

  @override
  ConsumerState<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends ConsumerState<FeedbackScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _currentFilter = 'all';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {
          switch (_tabController.index) {
            case 0:
              _currentFilter = 'all';
              break;
            case 1:
              _currentFilter = 'received';
              break;
            case 2:
              _currentFilter = 'overdue';
              break;
            case 3:
              _currentFilter = 'resolved';
              break;
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('التغذية الراجعة',
            style:
                TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700)),
        centerTitle: true,
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          labelStyle: const TextStyle(
              fontFamily: 'Cairo', fontWeight: FontWeight.w700, fontSize: 12),
          unselectedLabelStyle:
              const TextStyle(fontFamily: 'Tajawal', fontSize: 11),
          tabs: const [
            Tab(icon: Icon(Icons.list_rounded), text: 'الكل'),
            Tab(icon: Icon(Icons.inbox_rounded), text: 'واردة'),
            Tab(icon: Icon(Icons.warning_rounded), text: 'متأخرة'),
            Tab(icon: Icon(Icons.check_circle_rounded), text: 'محلولة'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            tooltip: 'تغذية راجعة جديدة',
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const FeedbackComposerScreen(),
                ),
              ).then((_) => ref.invalidate(feedbackTicketsProvider(_currentFilter)));
            },
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _TicketsListTab(filter: 'all'),
          _TicketsListTab(filter: 'received'),
          _TicketsListTab(filter: 'overdue'),
          _TicketsListTab(filter: 'resolved'),
        ],
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// _TicketsListTab — قائمة التذاكر
/// ═══════════════════════════════════════════════════════════

class _TicketsListTab extends ConsumerWidget {
  final String filter;

  const _TicketsListTab({required this.filter});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ticketsAsync = ref.watch(feedbackTicketsProvider(filter));

    return ticketsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded,
                size: 48, color: Color(0xFFEF4444)),
            const SizedBox(height: 12),
            Text('تعذّر تحميل التذاكر',
                style: TextStyle(fontFamily: 'Tajawal', color: Colors.grey.shade700)),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () =>
                  ref.invalidate(feedbackTicketsProvider(filter)),
              icon: const Icon(Icons.refresh),
              label: const Text('إعادة'),
            ),
          ],
        ),
      ),
      data: (tickets) {
        if (tickets.isEmpty) {
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
                      color: AppTheme.primaryColor.withValues(alpha: 0.08),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.feedback_outlined,
                        size: 44,
                        color: AppTheme.primaryColor.withValues(alpha: 0.5)),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'لا توجد تغذية راجعة',
                    style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 16,
                        fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    filter == 'overdue'
                        ? 'لا توجد تذاكر متأخرة — ممتاز!'
                        : 'ستظهر التذاكر هنا',
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 13,
                        color: Colors.grey.shade500),
                  ),
                ],
              ),
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async =>
              ref.invalidate(feedbackTicketsProvider(filter)),
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: tickets.length,
            itemBuilder: (context, index) {
              return _TicketCard(
                ticket: tickets[index],
                onTap: () {
                  HapticFeedback.lightImpact();
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) =>
                          FeedbackDetailScreen(ticket: tickets[index]),
                    ),
                  ).then((_) =>
                      ref.invalidate(feedbackTicketsProvider(filter)));
                },
              );
            },
          ),
        );
      },
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// _TicketCard — بطاقة تذكرة تغذية راجعة
/// ═══════════════════════════════════════════════════════════

class _TicketCard extends StatelessWidget {
  final FeedbackTicket ticket;
  final VoidCallback onTap;

  const _TicketCard({required this.ticket, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final statusColor = Color(ticket.statusColor);
    final isOverdue = ticket.isOverdue;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isOverdue
              ? const Color(0xFFEF4444).withValues(alpha: 0.4)
              : Colors.grey.shade100,
          width: isOverdue ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black
                .withValues(alpha: isOverdue ? 0.06 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ═══ Row 1: ticket number + status ═══
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        ticket.ticketNumber,
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: statusColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        ticket.subject,
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        ticket.statusLabelAr,
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // ═══ Row 2: from → to ═══
                Row(
                  children: [
                    Icon(Icons.person_outline_rounded,
                        size: 12, color: Colors.grey.shade500),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        '${ticket.fromName} ← ${_roleLabelAr(ticket.toRole)}',
                        style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 11,
                          color: Colors.grey.shade600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                // ═══ Row 3: category + priority + SLA ═══
                Row(
                  children: [
                    _chip(ticket.categoryLabelAr, const Color(0xFF607D8B)),
                    const SizedBox(width: 4),
                    _chip(ticket.priorityLabelAr, _priorityColor(ticket.priority)),
                    const Spacer(),
                    if (isOverdue)
                      const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.warning_rounded,
                              size: 12, color: Color(0xFFEF4444)),
                          SizedBox(width: 3),
                          Text(
                            'متأخرة',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFFEF4444),
                            ),
                          ),
                        ],
                      )
                    else if (ticket.slaDeadline != null &&
                        ticket.status != 'resolved' &&
                        ticket.status != 'closed')
                      _slaRemaining(ticket.slaDeadline!),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _chip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontFamily: 'Tajawal',
          fontSize: 9,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _slaRemaining(DateTime deadline) {
    final remaining = deadline.difference(DateTime.now());
    String text;
    Color color;
    if (remaining.isNegative) {
      text = 'متأخرة';
      color = const Color(0xFFEF4444);
    } else if (remaining.inHours < 4) {
      text = 'باقي ${remaining.inHours}س';
      color = const Color(0xFFF57C00);
    } else {
      text = 'باقي ${remaining.inHours}س';
      color = const Color(0xFF388E3C);
    }
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.schedule_rounded, size: 12, color: color),
        const SizedBox(width: 3),
        Text(
          text,
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    );
  }

  Color _priorityColor(String p) {
    switch (p) {
      case 'critical':
        return const Color(0xFFD32F2F);
      case 'high':
        return const Color(0xFFF57C00);
      case 'low':
        return const Color(0xFF607D8B);
      default:
        return const Color(0xFF1976D2);
    }
  }

  String _roleLabelAr(String role) {
    switch (role) {
      case 'admin':
        return 'مدير النظام';
      case 'central':
        return 'المركزي';
      case 'governorate':
        return 'المحافظة';
      case 'district':
        return 'المديرية';
      case 'data_entry':
        return 'مدخل البيانات';
      default:
        return role;
    }
  }
}

/// ═══════════════════════════════════════════════════════════
/// FeedbackDetailScreen — تفاصيل التذكرة + ردود + تحديث الحالة
/// ═══════════════════════════════════════════════════════════

class FeedbackDetailScreen extends ConsumerStatefulWidget {
  final FeedbackTicket ticket;

  const FeedbackDetailScreen({super.key, required this.ticket});

  @override
  ConsumerState<FeedbackDetailScreen> createState() =>
      _FeedbackDetailScreenState();
}

class _FeedbackDetailScreenState extends ConsumerState<FeedbackDetailScreen> {
  final _replyCtrl = TextEditingController();
  List<Map<String, dynamic>> _responses = [];
  bool _loadingResponses = true;
  bool _sendingReply = false;
  List<Attachment> _attachments = [];
  bool _loadingAttachments = true;

  @override
  void initState() {
    super.initState();
    _loadResponses();
    _loadAttachments();
  }

  @override
  void dispose() {
    _replyCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadAttachments() async {
    try {
      final attachments = await AttachmentService.getAttachments(
          feedbackTicketId: widget.ticket.id);
      if (mounted) {
        setState(() {
          _attachments = attachments;
          _loadingAttachments = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingAttachments = false);
    }
  }

  Future<void> _loadResponses() async {
    try {
      final service = ref.read(feedbackTicketsServiceProvider);
      final responses = await service.getTicketResponses(widget.ticket.id);
      if (mounted) {
        setState(() {
          _responses = responses;
          _loadingResponses = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loadingResponses = false);
    }
  }

  Future<void> _sendReply() async {
    if (_replyCtrl.text.trim().isEmpty) return;
    setState(() => _sendingReply = true);
    HapticFeedback.lightImpact();

    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      if (userId == null) return;

      final profile = await client
          .from('profiles')
          .select('role, full_name')
          .eq('id', userId)
          .maybeSingle();
      if (profile == null) return;

      final service = ref.read(feedbackTicketsServiceProvider);
      await service.addReply(
        ticketId: widget.ticket.id,
        body: _replyCtrl.text.trim(),
        responderId: userId,
        responderName: profile['full_name'] ?? 'غير معروف',
        responderRole: profile['role'] ?? 'data_entry',
      );

      _replyCtrl.clear();
      await _loadResponses();
      ref.invalidate(feedbackTicketsProvider('all'));
      ref.invalidate(feedbackTicketsProvider('received'));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل: $e',
                style: const TextStyle(fontFamily: 'Tajawal')),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _sendingReply = false);
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    HapticFeedback.mediumImpact();
    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      if (userId == null) return;

      final profile = await client
          .from('profiles')
          .select('role, full_name')
          .eq('id', userId)
          .maybeSingle();
      if (profile == null) return;

      final service = ref.read(feedbackTicketsServiceProvider);
      await service.updateTicketStatus(
        ticketId: widget.ticket.id,
        newStatus: newStatus,
        responderId: userId,
        responderName: profile['full_name'] ?? 'غير معروف',
        responderRole: profile['role'] ?? 'data_entry',
        comment: 'تم تحديث الحالة إلى: $newStatus',
      );

      await _loadResponses();
      ref.invalidate(feedbackTicketsProvider('all'));
      ref.invalidate(feedbackTicketsProvider('received'));
      ref.invalidate(feedbackTicketsProvider('overdue'));
      ref.invalidate(feedbackTicketsProvider('resolved'));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('تم تحديث الحالة',
                style: const TextStyle(fontFamily: 'Tajawal')),
            backgroundColor: const Color(0xFF22C55E),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل: $e',
                style: const TextStyle(fontFamily: 'Tajawal')),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = Color(widget.ticket.statusColor);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.ticket.ticketNumber,
          style: const TextStyle(
              fontFamily: 'Cairo', fontSize: 14, fontWeight: FontWeight.w700),
        ),
        backgroundColor: statusColor,
        foregroundColor: Colors.white,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded),
            onSelected: _updateStatus,
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'received', child: Text('تم الاستلام')),
              const PopupMenuItem(value: 'in_progress', child: Text('قيد المعالجة')),
              const PopupMenuItem(value: 'resolved', child: Text('تم الحل')),
              const PopupMenuItem(value: 'closed', child: Text('إغلاق')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // ═══ Ticket info ═══
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: statusColor.withValues(alpha: 0.05),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.ticket.subject,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.person_outline_rounded,
                        size: 14, color: Colors.grey.shade600),
                    const SizedBox(width: 4),
                    Text(
                      '${widget.ticket.fromName} → ${_roleLabelAr(widget.ticket.toRole)}',
                      style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    _infoChip('الفئة', widget.ticket.categoryLabelAr),
                    const SizedBox(width: 8),
                    _infoChip('الأولوية', widget.ticket.priorityLabelAr),
                    const SizedBox(width: 8),
                    _infoChip('الحالة', widget.ticket.statusLabelAr),
                  ],
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    widget.ticket.body,
                    style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 13,
                      height: 1.6,
                      color: Color(0xFF1A2332),
                    ),
                  ),
                ),
                // ═══ Attachments ═══
                if (!_loadingAttachments && _attachments.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  AttachmentList(attachments: _attachments),
                ],
                if (widget.ticket.isOverdue)
                  Container(
                    margin: const EdgeInsets.only(top: 8),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.warning_rounded,
                            size: 14, color: Color(0xFFEF4444)),
                        SizedBox(width: 6),
                        Text(
                          'هذه التذكرة متأخرة عن SLA المحدد',
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 11,
                            color: Color(0xFFEF4444),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          // ═══ Responses ═══
          Expanded(
            child: _loadingResponses
                ? const Center(child: CircularProgressIndicator())
                : _responses.isEmpty
                    ? const Center(
                        child: Text(
                          'لا توجد ردود بعد',
                          style: TextStyle(
                              fontFamily: 'Tajawal',
                              color: Color(0xFF9CA3AF)),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _responses.length,
                        itemBuilder: (context, index) {
                          final r = _responses[index];
                          return _ResponseBubble(response: r);
                        },
                      ),
          ),
          // ═══ Reply input ═══
          Container(
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
                Expanded(
                  child: Container(
                    constraints: const BoxConstraints(maxHeight: 100),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F7FA),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TextField(
                      controller: _replyCtrl,
                      textDirection: TextDirection.rtl,
                      maxLines: 3,
                      minLines: 1,
                      style: const TextStyle(
                          fontFamily: 'Tajawal', fontSize: 13),
                      decoration: const InputDecoration(
                        hintText: 'اكتب ردك...',
                        hintStyle: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 12,
                            color: Color(0xFF9CA3AF)),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _sendingReply ? null : _sendReply,
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: _replyCtrl.text.trim().isNotEmpty
                          ? AppTheme.primaryColor
                          : const Color(0xFFE5E7EB),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: _sendingReply
                        ? const Padding(
                            padding: EdgeInsets.all(10),
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : Icon(Icons.send_rounded,
                            color: _replyCtrl.text.trim().isNotEmpty
                                ? Colors.white
                                : const Color(0xFF9CA3AF),
                            size: 20),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Text(
        '$label: $value',
        style: TextStyle(
          fontFamily: 'Tajawal',
          fontSize: 10,
          color: Colors.grey.shade700,
        ),
      ),
    );
  }

  String _roleLabelAr(String role) {
    switch (role) {
      case 'admin':
        return 'مدير النظام';
      case 'central':
        return 'المركزي';
      case 'governorate':
        return 'المحافظة';
      case 'district':
        return 'المديرية';
      case 'data_entry':
        return 'مدخل البيانات';
      default:
        return role;
    }
  }
}

/// ═══════════════════════════════════════════════════════════
/// _ResponseBubble — فقاعة رد على التذكرة
/// ═══════════════════════════════════════════════════════════

class _ResponseBubble extends StatelessWidget {
  final Map<String, dynamic> response;

  const _ResponseBubble({required this.response});

  @override
  Widget build(BuildContext context) {
    final client = Supabase.instance.client;
    final currentUserId = client.auth.currentUser?.id;
    final responderId = response['responder_id'] as String?;
    final isMe = responderId == currentUserId;
    final responderName = response['responder_name'] as String? ?? '';
    final body = response['body'] as String? ?? '';
    final type = response['response_type'] as String? ?? 'reply';
    final createdAt =
        DateTime.tryParse(response['created_at']?.toString() ?? '') ??
            DateTime.now();

    final isStatusChange = type == 'status_change';
    final bubbleColor = isMe
        ? AppTheme.primaryColor
        : (isStatusChange ? const Color(0xFFFFF3E0) : Colors.white);
    final textColor =
        isMe ? Colors.white : (isStatusChange ? const Color(0xFFE65100) : const Color(0xFF1A2332));

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment:
            isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: bubbleColor,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(isMe ? 12 : 4),
                  topRight: Radius.circular(isMe ? 4 : 12),
                  bottomLeft: const Radius.circular(12),
                  bottomRight: const Radius.circular(12),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!isMe || isStatusChange)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 3),
                      child: Text(
                        isStatusChange
                            ? '🔄 تحديث حالة'
                            : responderName,
                        style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: isStatusChange
                              ? const Color(0xFFE65100)
                              : AppTheme.primaryColor,
                        ),
                      ),
                    ),
                  Text(
                    body,
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 12.5,
                      height: 1.5,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}',
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 9,
                      color: isMe
                          ? Colors.white.withValues(alpha: 0.7)
                          : const Color(0xFF9CA3AF),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// FeedbackComposerScreen — إنشاء تذكرة تغذية راجعة جديدة
/// ═══════════════════════════════════════════════════════════

class FeedbackComposerScreen extends ConsumerStatefulWidget {
  const FeedbackComposerScreen({super.key});

  @override
  ConsumerState<FeedbackComposerScreen> createState() =>
      _FeedbackComposerScreenState();
}

class _FeedbackComposerScreenState
    extends ConsumerState<FeedbackComposerScreen> {
  final _subjectCtrl = TextEditingController();
  final _bodyCtrl = TextEditingController();
  String _category = 'general';
  String _priority = 'normal';
  String _toRole = 'governorate';
  int _slaHours = 24;
  bool _sending = false;
  final List<Attachment> _attachments = [];

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _bodyCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickAttachment() async {
    HapticFeedback.lightImpact();
    final att = await AttachmentPicker.show(context, folder: 'feedback');
    if (att != null && mounted) {
      setState(() => _attachments.add(att));
    }
  }

  void _removeAttachment(int index) {
    HapticFeedback.lightImpact();
    setState(() => _attachments.removeAt(index));
  }

  Future<void> _submit() async {
    if (_subjectCtrl.text.trim().isEmpty || _bodyCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('يرجى ملء الموضوع والنص',
              style: TextStyle(fontFamily: 'Tajawal')),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    setState(() => _sending = true);
    HapticFeedback.mediumImpact();

    try {
      final service = ref.read(feedbackTicketsServiceProvider);
      final ticketId = await service.createTicket(
        subject: _subjectCtrl.text.trim(),
        body: _bodyCtrl.text.trim(),
        category: _category,
        priority: _priority,
        toRole: _toRole,
        slaHours: _slaHours,
      );

      // Save attachments metadata
      if (ticketId != null && _attachments.isNotEmpty) {
        for (final att in _attachments) {
          await AttachmentService.saveAttachmentMetadata(
            attachment: att,
            feedbackTicketId: ticketId,
          );
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle_rounded,
                    color: Colors.white, size: 18),
                SizedBox(width: 8),
                Text('تم إرسال التغذية الراجعة',
                    style: TextStyle(fontFamily: 'Tajawal')),
              ],
            ),
            backgroundColor: const Color(0xFF22C55E),
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        ref.invalidate(feedbackTicketsProvider('all'));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل: $e',
                style: const TextStyle(fontFamily: 'Tajawal')),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('تغذية راجعة جديدة',
            style:
                TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700)),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _label('الموجَّه إلى (دور)'),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            children: [
              ('central', 'مركزي'),
              ('governorate', 'محافظة'),
              ('district', 'مديرية'),
              ('data_entry', 'مدخل بيانات'),
            ].map((r) {
              final isSelected = _toRole == r.$1;
              return ChoiceChip(
                label: Text(r.$2,
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                        color: isSelected
                            ? Colors.white
                            : AppTheme.primaryColor)),
                selected: isSelected,
                selectedColor: AppTheme.primaryColor,
                onSelected: (_) => setState(() => _toRole = r.$1),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          _label('الموضوع'),
          const SizedBox(height: 6),
          TextField(
            controller: _subjectCtrl,
            textDirection: TextDirection.rtl,
            style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14),
            decoration: _inputDecoration('مثال: تأخر رفع تقرير الجاهزية'),
          ),
          const SizedBox(height: 16),

          _label('النص'),
          const SizedBox(height: 6),
          TextField(
            controller: _bodyCtrl,
            textDirection: TextDirection.rtl,
            maxLines: 6,
            style: const TextStyle(
                fontFamily: 'Tajawal', fontSize: 14, height: 1.6),
            decoration: _inputDecoration('اشرح التغذية الراجعة بالتفصيل...'),
          ),
          const SizedBox(height: 16),

          _label('الفئة'),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            children: [
              ('performance', 'أداء'),
              ('compliance', 'التزام'),
              ('data_quality', 'جودة بيانات'),
              ('delay', 'تأخير'),
              ('behavior', 'سلوك'),
              ('general', 'عام'),
            ].map((c) {
              final isSelected = _category == c.$1;
              return ChoiceChip(
                label: Text(c.$2,
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                        color: isSelected
                            ? Colors.white
                            : const Color(0xFF607D8B))),
                selected: isSelected,
                selectedColor: const Color(0xFF607D8B),
                onSelected: (_) => setState(() => _category = c.$1),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          _label('الأولوية'),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            children: [
              ('low', 'منخفض'),
              ('normal', 'عادي'),
              ('high', 'عالي'),
              ('critical', 'حرج'),
            ].map((p) {
              final isSelected = _priority == p.$1;
              final color = _priorityColor(p.$1);
              return ChoiceChip(
                label: Text(p.$2,
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                        color: isSelected ? Colors.white : color)),
                selected: isSelected,
                selectedColor: color,
                onSelected: (_) => setState(() => _priority = p.$1),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          _label('SLA (مهلة الرد بالساعات)'),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            children: [4, 12, 24, 48, 72].map((h) {
              final isSelected = _slaHours == h;
              return ChoiceChip(
                label: Text('$h ساعة',
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                        color: isSelected
                            ? Colors.white
                            : AppTheme.primaryColor)),
                selected: isSelected,
                selectedColor: AppTheme.primaryColor,
                onSelected: (_) => setState(() => _slaHours = h),
              );
            }).toList(),
          ),

          // ═══ Attachments section ═══
          const SizedBox(height: 16),
          _label('المرفقات (صور / PDF / Excel)'),
          const SizedBox(height: 8),
          if (_attachments.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: AttachmentChips(
                attachments: _attachments,
                onRemove: _removeAttachment,
              ),
            ),
          OutlinedButton.icon(
            onPressed: _pickAttachment,
            icon: const Icon(Icons.attach_file_rounded, size: 18),
            label: const Text('إضافة مرفق',
                style: TextStyle(fontFamily: 'Tajawal', fontSize: 13)),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 10),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
              side: BorderSide(color: Colors.grey.shade300),
            ),
          ),
          const SizedBox(height: 24),

          FilledButton.icon(
            onPressed: _sending ? null : _submit,
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            icon: _sending
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.send_rounded),
            label: Text(_sending ? 'جاري الإرسال...' : 'إرسال التغذية الراجعة',
                style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 14,
                    fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Widget _label(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontFamily: 'Cairo',
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: Color(0xFF374151),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(
          fontFamily: 'Tajawal', fontSize: 13, color: Color(0xFF9CA3AF)),
      filled: true,
      fillColor: const Color(0xFFF9FAFB),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.grey.shade200),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: AppTheme.primaryColor, width: 1.5),
      ),
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    );
  }

  Color _priorityColor(String p) {
    switch (p) {
      case 'critical':
        return const Color(0xFFD32F2F);
      case 'high':
        return const Color(0xFFF57C00);
      case 'low':
        return const Color(0xFF607D8B);
      default:
        return const Color(0xFF1976D2);
    }
  }
}
