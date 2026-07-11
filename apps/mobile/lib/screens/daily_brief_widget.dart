import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/memos_feedback_service.dart';

/// ═══════════════════════════════════════════════════════════
/// DailyBriefWidget — موجز الصباح الذكي
///
///  يظهر في أعلى صفحة الشات يعرض:
///   - عدد التعاميم غير المقروءة (إلزامي)
///   - تغذية راجعة بانتظار ردك
///   - إحصائيات أمس (إرساليات)
///   - مهام اليوم (زيارات مجدولة)
/// ═══════════════════════════════════════════════════════════

class DailyBriefWidget extends ConsumerWidget {
  final String userName;

  const DailyBriefWidget({super.key, required this.userName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memosAsync = ref.watch(memosProvider);
    final ticketsAsync = ref.watch(feedbackTicketsProvider('received'));

    // Today's date label
    final now = DateTime.now();
    final dayName = _dayNameAr(now.weekday);
    final dateStr = '${now.day}/${now.month}/${now.year}';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF00897B), Color(0xFF00695C)],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF00897B).withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ═══ Header ═══
            Row(
              children: [
                const Text(
                  '☀️',
                  style: TextStyle(fontSize: 24),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'صباح الخير، $userName',
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        '$dayName • $dateStr',
                        style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 11,
                          color: Colors.white.withValues(alpha: 0.8),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.wb_sunny_outlined,
                    color: Colors.white70, size: 22),
              ],
            ),
            const SizedBox(height: 14),
            // ═══ Stats grid ═══
            Row(
              children: [
                Expanded(
                  child: _briefStat(
                    icon: Icons.description_rounded,
                    label: 'تعاميم بانتظارك',
                    valueAsync: memosAsync,
                    valueBuilder: (memos) {
                      final pending = memos
                          .where((m) => m.needsUrgentAcknowledgment)
                          .length;
                      return '$pending';
                    },
                    color: const Color(0xFFFFCDD2),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _briefStat(
                    icon: Icons.feedback_rounded,
                    label: 'تغذية بانتظار ردك',
                    valueAsync: ticketsAsync,
                    valueBuilder: (tickets) {
                      final pending = tickets
                          .where((t) =>
                              t.status != 'resolved' &&
                              t.status != 'closed')
                          .length;
                      return '$pending';
                    },
                    color: const Color(0xFFFFE0B2),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _briefStat(
                    icon: Icons.warning_rounded,
                    label: 'متأخرة عن SLA',
                    valueAsync: ticketsAsync,
                    valueBuilder: (tickets) {
                      final overdue = tickets
                          .where((t) => t.isOverdue)
                          .length;
                      return '$overdue';
                    },
                    color: const Color(0xFFEF9A9A),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _briefStat(
                    icon: Icons.send_rounded,
                    label: 'إرسالياتي أمس',
                    valueAsync: memosAsync,
                    valueBuilder: (_) => '—',
                    color: const Color(0xFFC8E6C9),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // ═══ Quick action ═══
            if (memosAsync.hasValue)
              ...memosAsync.value!.where((m) => m.needsUrgentAcknowledgment).take(1).map((memo) {
                return Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFD32F2F).withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: const Color(0xFFFFCDD2).withValues(alpha: 0.5)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.priority_high_rounded,
                          color: Colors.white, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'تعميم إلزامي بانتظار إقرارك',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              memo.title,
                              style: TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 10,
                                color: Colors.white.withValues(alpha: 0.9),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Widget _briefStat<T>({
    required IconData icon,
    required String label,
    required AsyncValue<T> valueAsync,
    required String Function(T) valueBuilder,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 9,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          valueAsync.when(
            loading: () => const SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(
                  strokeWidth: 2, color: Colors.white),
            ),
            error: (_, __) => const Text(
              '—',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
            data: (value) => Text(
              valueBuilder(value),
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _dayNameAr(int weekday) {
    const names = [
      'الإثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الجمعة',
      'السبت',
      'الأحد'
    ];
    return names[weekday - 1];
  }
}

/// ═══════════════════════════════════════════════════════════
/// AchievementBoard — بورد الإنجازات الأسبوعية
/// ═══════════════════════════════════════════════════════════

class AchievementBoard extends ConsumerWidget {
  const AchievementBoard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // For now, show a placeholder until achievements table is populated by cron
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFFD700).withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFFD700).withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('🏆', style: TextStyle(fontSize: 18)),
              const SizedBox(width: 8),
              const Text(
                'بورد الإنجازات الأسبوعي',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1A2332),
                ),
              ),
              const Spacer(),
              Icon(Icons.emoji_events_outlined,
                  size: 18, color: const Color(0xFFFFD700).withValues(alpha: 0.7)),
            ],
          ),
          const SizedBox(height: 12),
          // Achievement items
          _achievementItem(
            icon: '🥇',
            title: 'أعلى محافظة في نسبة الالتزام',
            value: 'عدن',
            metric: '94%',
            color: const Color(0xFFFFD700),
          ),
          const SizedBox(height: 8),
          _achievementItem(
            icon: '⚡',
            title: 'أسرع رد على التغذية الراجعة',
            value: 'أ. سالم',
            metric: '2 ساعة',
            color: const Color(0xFF42A5F5),
          ),
          const SizedBox(height: 8),
          _achievementItem(
            icon: '🎯',
            title: 'أعلى عدد إرساليات',
            value: 'مديرية المعلا',
            metric: '38 إرسالية',
            color: const Color(0xFF66BB6A),
          ),
          const SizedBox(height: 10),
          Center(
            child: Text(
              'يتم التحديث كل يوم أحد',
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 10,
                color: Colors.grey.shade500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _achievementItem({
    required String icon,
    required String title,
    required String value,
    required String metric,
    required Color color,
  }) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(icon, style: const TextStyle(fontSize: 16)),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 11,
                  color: Color(0xFF6B7280),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                value,
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1A2332),
                ),
              ),
            ],
          ),
        ),
        Text(
          metric,
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
      ],
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// EmergencyBanner — بانر قناة الطوارئ (يظهر أحمر وامض)
/// ═══════════════════════════════════════════════════════════

class EmergencyBanner extends StatefulWidget {
  final int emergencyCount;
  final VoidCallback onTap;

  const EmergencyBanner({
    super.key,
    required this.emergencyCount,
    required this.onTap,
  });

  @override
  State<EmergencyBanner> createState() => _EmergencyBannerState();
}

class _EmergencyBannerState extends State<EmergencyBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.emergencyCount == 0) return const SizedBox.shrink();

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Color.lerp(const Color(0xFFD32F2F), const Color(0xFFFF1744),
                    _controller.value)!,
                Color.lerp(const Color(0xFFB71C1C), const Color(0xFFD32F2F),
                    _controller.value)!,
              ],
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
            ),
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFD32F2F)
                    .withValues(alpha: 0.3 + 0.2 * _controller.value),
                blurRadius: 10 + 4 * _controller.value,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: widget.onTap,
              borderRadius: BorderRadius.circular(14),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 12),
                child: Row(
                  children: [
                    const Icon(Icons.warning_rounded,
                        color: Colors.white, size: 24),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '🚨 قناة الطوارئ',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            '${widget.emergencyCount} حالة طوارئ نشطة',
                            style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 11,
                              color: Colors.white.withValues(alpha: 0.9),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${widget.emergencyCount}',
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// SmartRepliesBar — شريط الردود الجاهزة الذكية
/// ═══════════════════════════════════════════════════════════

class SmartRepliesBar extends StatelessWidget {
  final List<String> replies;
  final Function(String) onReplySelected;

  const SmartRepliesBar({
    super.key,
    required this.replies,
    required this.onReplySelected,
  });

  @override
  Widget build(BuildContext context) {
    if (replies.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            const Padding(
              padding: EdgeInsets.only(left: 6),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.auto_awesome_rounded,
                      size: 14, color: Color(0xFF00897B)),
                  SizedBox(width: 4),
                  Text(
                    'ردود مقترحة',
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF00897B),
                    ),
                  ),
                  SizedBox(width: 8),
                ],
              ),
            ),
            ...replies.map((reply) {
              return Padding(
                padding: const EdgeInsets.only(left: 6),
                child: GestureDetector(
                  onTap: () => onReplySelected(reply),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF00897B).withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                          color: const Color(0xFF00897B)
                              .withValues(alpha: 0.2)),
                    ),
                    child: Text(
                      reply,
                      style: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 11,
                        color: Color(0xFF00695C),
                      ),
                    ),
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
