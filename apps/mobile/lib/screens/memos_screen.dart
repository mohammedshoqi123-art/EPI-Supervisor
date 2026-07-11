import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_shared/epi_shared.dart';
import '../services/memos_feedback_service.dart';
import '../services/attachment_service.dart';
import 'attachment_widgets.dart';

/// ═══════════════════════════════════════════════════════════
/// MemosScreen — قائمة التعاميم الرسمية
/// ═══════════════════════════════════════════════════════════

class MemosScreen extends ConsumerStatefulWidget {
  const MemosScreen({super.key});

  @override
  ConsumerState<MemosScreen> createState() => _MemosScreenState();
}

class _MemosScreenState extends ConsumerState<MemosScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
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
        title: const Text(
          'التعاميم الرسمية',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700),
        ),
        centerTitle: true,
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          labelStyle: const TextStyle(
              fontFamily: 'Cairo', fontWeight: FontWeight.w700, fontSize: 13),
          unselectedLabelStyle:
              const TextStyle(fontFamily: 'Tajawal', fontSize: 12),
          tabs: const [
            Tab(icon: Icon(Icons.inbox_rounded), text: 'الواردة'),
            Tab(icon: Icon(Icons.priority_high_rounded), text: 'إلزامي'),
            Tab(icon: Icon(Icons.history_rounded), text: 'المُقَرّ بها'),
          ],
        ),
        actions: [
          // Compose button — admin/central/governorate only
          IconButton(
            icon: const Icon(Icons.edit_note_rounded),
            tooltip: 'إصدار تعميم',
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const MemoComposerScreen(),
                ),
              ).then((_) => ref.invalidate(memosProvider));
            },
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _MemosListTab(filter: (m) => true),
          _MemosListTab(
              filter: (m) => m.needsUrgentAcknowledgment && !m.isExpired),
          _MemosListTab(filter: (m) => m.isAcknowledged),
        ],
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// _MemosListTab — قائمة التعاميم مع فلتر
/// ═══════════════════════════════════════════════════════════

class _MemosListTab extends ConsumerWidget {
  final bool Function(OfficialMemo) filter;

  const _MemosListTab({required this.filter});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memosAsync = ref.watch(memosProvider);

    return memosAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded,
                size: 48, color: Color(0xFFEF4444)),
            const SizedBox(height: 12),
            Text('تعذّر تحميل التعاميم',
                style: TextStyle(fontFamily: 'Tajawal', color: Colors.grey.shade700)),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () => ref.invalidate(memosProvider),
              icon: const Icon(Icons.refresh),
              label: const Text('إعادة'),
            ),
          ],
        ),
      ),
      data: (allMemos) {
        final memos = allMemos.where(filter).toList();

        if (memos.isEmpty) {
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
                    child: Icon(Icons.description_outlined,
                        size: 44,
                        color: AppTheme.primaryColor.withValues(alpha: 0.5)),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'لا توجد تعاميم',
                    style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 16,
                        fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'ستظهر التعاميم الرسمية هنا',
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
          onRefresh: () async => ref.invalidate(memosProvider),
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: memos.length,
            itemBuilder: (context, index) {
              return _MemoCard(
                memo: memos[index],
                onTap: () {
                  HapticFeedback.lightImpact();
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) =>
                          MemoDetailScreen(memo: memos[index]),
                    ),
                  ).then((_) => ref.invalidate(memosProvider));
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
/// _MemoCard — بطاقة تعميم
/// ═══════════════════════════════════════════════════════════

class _MemoCard extends StatelessWidget {
  final OfficialMemo memo;
  final VoidCallback onTap;

  const _MemoCard({required this.memo, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final color = Color(memo.priorityColor);
    final needsAck = memo.needsUrgentAcknowledgment;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: needsAck ? color.withValues(alpha: 0.4) : Colors.grey.shade100,
          width: needsAck ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: needsAck ? 0.06 : 0.03),
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
                // ═══ Header: number + priority + ack status ═══
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        memo.priority == 'critical'
                            ? Icons.warning_rounded
                            : Icons.description_rounded,
                        color: color,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            memo.memoNumber,
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: color,
                            ),
                          ),
                          Text(
                            memo.title,
                            style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    if (needsAck)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: color,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'إلزامي',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      )
                    else if (memo.isAcknowledged)
                      const Icon(Icons.check_circle_rounded,
                          color: Color(0xFF22C55E), size: 20),
                  ],
                ),
                const SizedBox(height: 10),
                // ═══ Body preview ═══
                Text(
                  memo.body,
                  style: const TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                // ═══ Footer ═══
                Row(
                  children: [
                    Icon(Icons.person_outline_rounded,
                        size: 12, color: Colors.grey.shade500),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        memo.issuerName,
                        style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 10,
                          color: Colors.grey.shade600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Icon(Icons.access_time_rounded,
                        size: 12, color: Colors.grey.shade400),
                    const SizedBox(width: 3),
                    Text(
                      _formatDate(memo.createdAt),
                      style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 10,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inHours < 1) return 'قبل ${diff.inMinutes} د';
    if (diff.inDays < 1) return 'قبل ${diff.inHours} س';
    if (diff.inDays < 7) return 'قبل ${diff.inDays} ي';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

/// ═══════════════════════════════════════════════════════════
/// MemoDetailScreen — تفاصيل التعميم + إقرار الاستلام
/// ═══════════════════════════════════════════════════════════

class MemoDetailScreen extends ConsumerStatefulWidget {
  final OfficialMemo memo;

  const MemoDetailScreen({super.key, required this.memo});

  @override
  ConsumerState<MemoDetailScreen> createState() => _MemoDetailScreenState();
}

class _MemoDetailScreenState extends ConsumerState<MemoDetailScreen> {
  bool _acknowledging = false;
  Map<String, dynamic>? _ackStats;
  List<Attachment> _attachments = [];
  bool _loadingAttachments = true;

  @override
  void initState() {
    super.initState();
    _loadAckStats();
    _loadAttachments();
  }

  Future<void> _loadAttachments() async {
    try {
      final attachments =
          await AttachmentService.getAttachments(memoId: widget.memo.id);
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

  Future<void> _loadAckStats() async {
    // Only for admin/central
    final service = ref.read(officialMemosServiceProvider);
    try {
      final stats = await service.getAcknowledgmentStats(widget.memo.id);
      if (mounted) setState(() => _ackStats = stats);
    } catch (_) {}
  }

  Future<void> _acknowledge() async {
    setState(() => _acknowledging = true);
    HapticFeedback.mediumImpact();
    try {
      final service = ref.read(officialMemosServiceProvider);
      await service.acknowledgeMemo(widget.memo.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Text('تم إقرار استلام التعميم',
                    style: TextStyle(fontFamily: 'Tajawal')),
              ],
            ),
            backgroundColor: const Color(0xFF22C55E),
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        ref.invalidate(memosProvider);
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
      if (mounted) setState(() => _acknowledging = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = Color(widget.memo.priorityColor);
    final needsAck = widget.memo.needsUrgentAcknowledgment;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.memo.memoNumber,
          style: const TextStyle(
              fontFamily: 'Cairo', fontSize: 14, fontWeight: FontWeight.w700),
        ),
        backgroundColor: color,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // ═══ Priority + status banner ═══
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: color.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        widget.memo.priority == 'critical'
                            ? Icons.warning_rounded
                            : Icons.info_outline_rounded,
                        color: color,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'الأولوية: ${widget.memo.priorityLabelAr}',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: color,
                              ),
                            ),
                            if (widget.memo.isExpired)
                              const Text(
                                '⚠️ انتهت صلاحية هذا التعميم',
                                style: TextStyle(
                                  fontFamily: 'Tajawal',
                                  fontSize: 11,
                                  color: Color(0xFFEF4444),
                                ),
                              )
                            else if (widget.memo.validUntil != null)
                              Text(
                                'صالح حتى: ${_formatDate(widget.memo.validUntil!)}',
                                style: TextStyle(
                                  fontFamily: 'Tajawal',
                                  fontSize: 10,
                                  color: color.withValues(alpha: 0.7),
                                ),
                              ),
                          ],
                        ),
                      ),
                      if (widget.memo.isAcknowledged)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF22C55E),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.check_circle_rounded,
                                  color: Colors.white, size: 14),
                              SizedBox(width: 4),
                              Text(
                                'مُقَرّ',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // ═══ Title ═══
                Text(
                  widget.memo.title,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 12),
                // ═══ Issuer info ═══
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      const CircleAvatar(
                        radius: 18,
                        backgroundColor: AppTheme.primaryColor,
                        child: Icon(Icons.person_rounded,
                            color: Colors.white, size: 18),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.memo.issuerName,
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              '${_roleLabelAr(widget.memo.issuerRole)} • ${_formatDate(widget.memo.createdAt)}',
                              style: const TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 11,
                                color: Color(0xFF9CA3AF),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // ═══ Body ═══
                const Text(
                  'نص التعميم',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF6B7280),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Text(
                    widget.memo.body,
                    style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 14,
                      height: 1.7,
                      color: Color(0xFF1A2332),
                    ),
                  ),
                ),
                // ═══ Attachments ═══
                if (!_loadingAttachments && _attachments.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  AttachmentList(attachments: _attachments),
                ],
                // ═══ Ack Stats (admin only) ═══
                if (_ackStats != null) ...[
                  const SizedBox(height: 20),
                  _buildAckStats(),
                ],
              ],
            ),
          ),
          // ═══ Acknowledge button ═══
          if (needsAck)
            Container(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 12,
                bottom: MediaQuery.of(context).padding.bottom + 12,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _acknowledging ? null : _acknowledge,
                  style: FilledButton.styleFrom(
                    backgroundColor: color,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: _acknowledging
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.check_circle_outline_rounded),
                  label: Text(
                    'أقرأتُ التعميم',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildAckStats() {
    final total = (_ackStats!['total_recipients'] as num?)?.toInt() ?? 0;
    final ack = (_ackStats!['acknowledged_count'] as num?)?.toInt() ?? 0;
    final pending = (_ackStats!['pending_count'] as num?)?.toInt() ?? 0;
    final rate = (_ackStats!['acknowledgment_rate'] as num?)?.toDouble() ?? 0;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.analytics_outlined, size: 16, color: Color(0xFF6B7280)),
              SizedBox(width: 6),
              Text(
                'متابعة الاستلام',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF6B7280),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _statItem('المستلمون', total, const Color(0xFF1976D2)),
              const SizedBox(width: 8),
              _statItem('أقروا', ack, const Color(0xFF388E3C)),
              const SizedBox(width: 8),
              _statItem('بانتظار', pending, const Color(0xFFF57C00)),
            ],
          ),
          const SizedBox(height: 10),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: total > 0 ? ack / total : 0,
              backgroundColor: Colors.grey.shade300,
              valueColor: AlwaysStoppedAnimation(Color(
                  rate >= 80 ? 0xFF388E3C : (rate >= 50 ? 0xFFF57C00 : 0xFFD32F2F))),
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'نسبة الاستلام: ${rate.toStringAsFixed(1)}%',
            style: const TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 11,
              color: Color(0xFF6B7280),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statItem(String label, int value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(
              '$value',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 10,
                color: Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  String _roleLabelAr(String role) {
    switch (role) {
      case 'admin':
        return 'مدير النظام';
      case 'central':
        return 'مركزي';
      case 'governorate':
        return 'محافظة';
      case 'district':
        return 'مديرية';
      case 'data_entry':
        return 'مدخل بيانات';
      default:
        return role;
    }
  }
}

/// ═══════════════════════════════════════════════════════════
/// MemoComposerScreen — إصدار تعميم جديد (admin/central/governorate)
/// ═══════════════════════════════════════════════════════════

class MemoComposerScreen extends ConsumerStatefulWidget {
  const MemoComposerScreen({super.key});

  @override
  ConsumerState<MemoComposerScreen> createState() =>
      _MemoComposerScreenState();
}

class _MemoComposerScreenState extends ConsumerState<MemoComposerScreen> {
  final _titleCtrl = TextEditingController();
  final _bodyCtrl = TextEditingController();
  String _priority = 'normal';
  bool _requiresAck = true;
  List<String> _targetRoles = [
    'admin',
    'central',
    'governorate',
    'district',
    'data_entry'
  ];
  DateTime? _validUntil;
  bool _sending = false;
  final List<Attachment> _attachments = [];

  @override
  void dispose() {
    _titleCtrl.dispose();
    _bodyCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickAttachment() async {
    HapticFeedback.lightImpact();
    final att = await AttachmentPicker.show(context, folder: 'memos');
    if (att != null && mounted) {
      setState(() => _attachments.add(att));
    }
  }

  void _removeAttachment(int index) {
    HapticFeedback.lightImpact();
    setState(() => _attachments.removeAt(index));
  }

  Future<void> _submit() async {
    if (_titleCtrl.text.trim().isEmpty || _bodyCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('يرجى ملء العنوان والنص',
              style: TextStyle(fontFamily: 'Tajawal')),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    setState(() => _sending = true);
    HapticFeedback.mediumImpact();

    try {
      final service = ref.read(officialMemosServiceProvider);
      final memoId = await service.createMemo(
        title: _titleCtrl.text.trim(),
        body: _bodyCtrl.text.trim(),
        priority: _priority,
        targetRoles: _targetRoles,
        requiresAcknowledgment: _requiresAck,
        validUntil: _validUntil,
      );

      // Save attachments metadata
      if (memoId != null && _attachments.isNotEmpty) {
        for (final att in _attachments) {
          await AttachmentService.saveAttachmentMetadata(
            attachment: att,
            memoId: memoId,
          );
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Text('تم إصدار التعميم بنجاح',
                    style: TextStyle(fontFamily: 'Tajawal')),
              ],
            ),
            backgroundColor: const Color(0xFF22C55E),
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        ref.invalidate(memosProvider);
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
        title: const Text('إصدار تعميم',
            style:
                TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700)),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Title
          _label('عنوان التعميم'),
          const SizedBox(height: 6),
          TextField(
            controller: _titleCtrl,
            textDirection: TextDirection.rtl,
            style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14),
            decoration: _inputDecoration('مثال: تعميم ببدء الجولة الثانية'),
          ),
          const SizedBox(height: 16),

          // Body
          _label('نص التعميم'),
          const SizedBox(height: 6),
          TextField(
            controller: _bodyCtrl,
            textDirection: TextDirection.rtl,
            maxLines: 8,
            style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14, height: 1.6),
            decoration: _inputDecoration('اكتب نص التعميم هنا...'),
          ),
          const SizedBox(height: 16),

          // Priority
          _label('الأولوية'),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            children: [
              'routine',
              'normal',
              'important',
              'critical',
            ].map((p) {
              final isSelected = _priority == p;
              final color = _priorityColor(p);
              return ChoiceChip(
                label: Text(_priorityLabelAr(p),
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                        color: isSelected ? Colors.white : color)),
                selected: isSelected,
                selectedColor: color,
                onSelected: (_) => setState(() => _priority = p),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // Target roles
          _label('الموجَّه إلى'),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              ('admin', 'مدير النظام'),
              ('central', 'مركزي'),
              ('governorate', 'محافظة'),
              ('district', 'مديرية'),
              ('data_entry', 'مدخل بيانات'),
            ].map((r) {
              final isSelected = _targetRoles.contains(r.$1);
              return FilterChip(
                label: Text(r.$2,
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                        color: isSelected
                            ? Colors.white
                            : AppTheme.primaryColor)),
                selected: isSelected,
                selectedColor: AppTheme.primaryColor,
                onSelected: (sel) {
                  setState(() {
                    if (sel) {
                      _targetRoles.add(r.$1);
                    } else {
                      _targetRoles.remove(r.$1);
                    }
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // Requires acknowledgment
          SwitchListTile(
            title: const Text('إقرار الاستلام إلزامي',
                style: TextStyle(fontFamily: 'Tajawal', fontSize: 13)),
            subtitle: Text(
                _requiresAck
                    ? 'كل مستلم يجب أن يضغط "أقرأتُ"'
                    : 'مجرد إشعار — لا إقرار مطلوب',
                style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 11,
                    color: Colors.grey.shade500)),
            value: _requiresAck,
            activeColor: AppTheme.primaryColor,
            onChanged: (v) => setState(() => _requiresAck = v),
          ),

          // Valid until
          ListTile(
            leading: const Icon(Icons.event_rounded, color: Color(0xFF607D8B)),
            title: Text(
                _validUntil == null
                    ? 'صلاحية دائمة'
                    : 'ينتهي في: ${_validUntil!.day}/${_validUntil!.month}/${_validUntil!.year}',
                style: const TextStyle(fontFamily: 'Tajawal', fontSize: 13)),
            trailing: _validUntil != null
                ? IconButton(
                    icon: const Icon(Icons.clear_rounded),
                    onPressed: () => setState(() => _validUntil = null),
                  )
                : null,
            onTap: () async {
              final dt = await showDatePicker(
                context: context,
                initialDate: DateTime.now().add(const Duration(days: 30)),
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 365)),
              );
              if (dt != null) setState(() => _validUntil = dt);
            },
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
                style: TextStyle(
                    fontFamily: 'Tajawal', fontSize: 13)),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 10),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
              side: BorderSide(color: Colors.grey.shade300),
            ),
          ),
          const SizedBox(height: 24),

          // Submit button
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
            label: Text(_sending ? 'جاري الإصدار...' : 'إصدار التعميم',
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

  String _priorityLabelAr(String p) {
    switch (p) {
      case 'critical':
        return 'حرج جداً';
      case 'important':
        return 'هام';
      case 'routine':
        return 'روتيني';
      default:
        return 'عادي';
    }
  }

  Color _priorityColor(String p) {
    switch (p) {
      case 'critical':
        return const Color(0xFFD32F2F);
      case 'important':
        return const Color(0xFFF57C00);
      case 'routine':
        return const Color(0xFF607D8B);
      default:
        return const Color(0xFF1976D2);
    }
  }
}
