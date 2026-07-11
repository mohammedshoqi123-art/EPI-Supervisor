import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_shared/epi_shared.dart';
import '../services/memos_feedback_service.dart';
import '../services/chat_channel_service.dart';
import 'memos_screen.dart';
import 'feedback_screen.dart';
import 'daily_brief_widget.dart';
import 'channel_screen.dart';

/// ═══════════════════════════════════════════════════════════
/// Communication Tabs — Embedded widgets for ChatScreen
///
///  4 tabs:
///   1. 📢 تعاميم (Official Memos)
///   2. 💬 قنوات (All channels — official + discussion merged)
///   3. 📋 تغذية راجعة (Feedback Tickets)
///   4. ☀️ موجز (Daily Brief + Achievements + Emergency)
/// ═══════════════════════════════════════════════════════════

/// ═══════════════════════════════════════════════════════════
/// Tab 1: MemosTab — embedded version of MemosScreen
/// ═══════════════════════════════════════════════════════════

class MemosTab extends ConsumerStatefulWidget {
  final String currentUserId;
  final String currentUserName;
  final String currentUserRole;

  const MemosTab({
    super.key,
    required this.currentUserId,
    required this.currentUserName,
    required this.currentUserRole,
  });

  @override
  ConsumerState<MemosTab> createState() => _MemosTabState();
}

class _MemosTabState extends ConsumerState<MemosTab>
    with SingleTickerProviderStateMixin {
  late TabController _subTabController;

  @override
  void initState() {
    super.initState();
    _subTabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _subTabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Sub-tab bar (الواردة / إلزامي / المُقَرّ بها)
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFFF3F4F6),
            borderRadius: BorderRadius.circular(12),
          ),
          child: TabBar(
            controller: _subTabController,
            indicatorColor: AppTheme.primaryColor,
            labelColor: Colors.white,
            unselectedLabelColor: AppTheme.primaryColor,
            labelStyle: const TextStyle(
                fontFamily: 'Cairo', fontWeight: FontWeight.w700, fontSize: 12),
            unselectedLabelStyle:
                const TextStyle(fontFamily: 'Tajawal', fontSize: 11),
            indicator: BoxDecoration(
              color: AppTheme.primaryColor,
              borderRadius: BorderRadius.circular(10),
            ),
            indicatorSize: TabBarIndicatorSize.tab,
            dividerColor: Colors.transparent,
            tabs: const [
              Tab(text: 'الواردة'),
              Tab(text: 'إلزامي'),
              Tab(text: 'مُقَرّ بها'),
            ],
          ),
        ),
        // Sub-tab content
        Expanded(
          child: TabBarView(
            controller: _subTabController,
            children: [
              _MemosListTab(
                filter: (m) => true,
                currentUserId: widget.currentUserId,
                currentUserName: widget.currentUserName,
                currentUserRole: widget.currentUserRole,
              ),
              _MemosListTab(
                filter: (m) => m.needsUrgentAcknowledgment && !m.isExpired,
                currentUserId: widget.currentUserId,
                currentUserName: widget.currentUserName,
                currentUserRole: widget.currentUserRole,
                showBatchAck: true, // Show "acknowledge all" button
              ),
              _MemosListTab(
                filter: (m) => m.isAcknowledged,
                currentUserId: widget.currentUserId,
                currentUserName: widget.currentUserName,
                currentUserRole: widget.currentUserRole,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// Tab 2: ChannelsTab — all channels (official + discussion merged)
/// ═══════════════════════════════════════════════════════════

class ChannelsTab extends ConsumerStatefulWidget {
  final String currentUserId;
  final String currentUserName;
  final String currentUserRole;

  const ChannelsTab({
    super.key,
    required this.currentUserId,
    required this.currentUserName,
    required this.currentUserRole,
  });

  @override
  ConsumerState<ChannelsTab> createState() => _ChannelsTabState();
}

class _ChannelsTabState extends ConsumerState<ChannelsTab> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final channelsAsync = ref.watch(channelsProvider);

    return Column(
      children: [
        // ═══ Search bar ═══
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TextField(
            controller: _searchController,
            textDirection: TextDirection.rtl,
            style: const TextStyle(fontFamily: 'Tajawal', fontSize: 13),
            decoration: InputDecoration(
              hintText: 'بحث في القنوات...',
              hintStyle: const TextStyle(
                  fontFamily: 'Tajawal', fontSize: 12, color: Color(0xFF9CA3AF)),
              prefixIcon:
                  const Icon(Icons.search_rounded, size: 20, color: Color(0xFF9CA3AF)),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _searchQuery = '');
                      },
                    )
                  : null,
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
            onChanged: (value) => setState(() => _searchQuery = value.toLowerCase()),
          ),
        ),
        // ═══ Channels list ═══
        Expanded(
          child: channelsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline_rounded,
                      size: 48, color: Color(0xFFEF4444)),
                  const SizedBox(height: 12),
                  Text('تعذّر تحميل القنوات',
                      style: TextStyle(
                          fontFamily: 'Tajawal', color: Colors.grey.shade700)),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () => ref.invalidate(channelsProvider),
                    icon: const Icon(Icons.refresh),
                    label: const Text('إعادة'),
                  ),
                ],
              ),
            ),
            data: (channels) {
              if (channels.isEmpty) {
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
                    child: Icon(Icons.forum_outlined,
                        size: 44,
                        color: AppTheme.primaryColor.withValues(alpha: 0.5)),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'لا توجد قنوات',
                    style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 16,
                        fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'ستظهر القنوات الهرمية هنا',
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

        // Sort: emergency first, then official, then by sort_order
        channels.sort((a, b) {
          // Emergency first
          if (a.code == 'emergency' && b.code != 'emergency') return -1;
          if (b.code == 'emergency' && a.code != 'emergency') return 1;
          // Then official
          if (a.isOfficial && !b.isOfficial) return -1;
          if (b.isOfficial && !a.isOfficial) return 1;
          // Then by sort_order
          return a.sortOrder.compareTo(b.sortOrder);
        });

        // Filter by search query
        final filteredChannels = _searchQuery.isEmpty
            ? channels
            : channels.where((c) {
                final name = c.name.toLowerCase();
                final desc = (c.description ?? '').toLowerCase();
                final lastMsg = (c.lastMessageContent ?? '').toLowerCase();
                return name.contains(_searchQuery) ||
                    desc.contains(_searchQuery) ||
                    lastMsg.contains(_searchQuery);
              }).toList();

        if (filteredChannels.isEmpty && _searchQuery.isNotEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.search_off_rounded,
                      size: 48, color: Colors.grey.shade400),
                  const SizedBox(height: 12),
                  Text('لا توجد نتائج',
                      style: TextStyle(
                          fontFamily: 'Tajawal', color: Colors.grey.shade600)),
                ],
              ),
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(channelsProvider),
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: filteredChannels.length,
            itemBuilder: (context, index) {
              final channel = filteredChannels[index];
              return _EmbeddedChannelCard(
                channel: channel,
                currentUserRole: widget.currentUserRole,
                onTap: () {
                  HapticFeedback.lightImpact();
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ChannelScreen(
                        channel: channel,
                        currentUserId: widget.currentUserId,
                        currentUserName: widget.currentUserName,
                        currentUserRole: widget.currentUserRole,
                      ),
                    ),
                  ).then((_) => ref.invalidate(channelsProvider));
                },
              );
            },
          ),
        );
      },
          ),
        ),
      ],
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// _EmbeddedChannelCard — channel card for embedded use
/// ═══════════════════════════════════════════════════════════

class _EmbeddedChannelCard extends StatelessWidget {
  final ChatChannel channel;
  final String currentUserRole;
  final VoidCallback onTap;

  const _EmbeddedChannelCard({
    required this.channel,
    required this.currentUserRole,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = Color(channel.colorValue);
    final hasUnread = channel.unreadCount > 0;
    final isEmergency = channel.code == 'emergency';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: hasUnread
              ? (isEmergency ? const Color(0xFFEF4444) : color)
                  .withValues(alpha: 0.4)
              : Colors.grey.shade100,
          width: hasUnread ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isEmergency ? 0.1 : 0.03),
            blurRadius: isEmergency ? 12 : 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                    border:
                        Border.all(color: color.withValues(alpha: 0.2)),
                  ),
                  child: Icon(
                    _getChannelIcon(channel.icon),
                    color: color,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (channel.isOfficial)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 1),
                              margin: const EdgeInsets.only(left: 4),
                              decoration: BoxDecoration(
                                color: (isEmergency
                                        ? const Color(0xFFEF4444)
                                        : color)
                                    .withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                isEmergency ? 'طوارئ' : 'رسمي',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 8,
                                  fontWeight: FontWeight.w700,
                                  color: isEmergency
                                      ? const Color(0xFFEF4444)
                                      : color,
                                ),
                              ),
                            ),
                          Expanded(
                            child: Text(
                              channel.name,
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: hasUnread
                                    ? const Color(0xFF1A2332)
                                    : const Color(0xFF374151),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (hasUnread)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: isEmergency
                                    ? const Color(0xFFEF4444)
                                    : color,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '${channel.unreadCount}',
                                style: const TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      if (channel.lastMessageContent != null)
                        Text(
                          channel.lastMessageContent!,
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 12,
                            color: hasUnread
                                ? const Color(0xFF4B5563)
                                : const Color(0xFF9CA3AF),
                            fontWeight: hasUnread
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        )
                      else if (channel.description != null)
                        Text(
                          channel.description!,
                          style: const TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 11,
                            color: Color(0xFF9CA3AF),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          if (channel.lastSenderName != null)
                            Flexible(
                              child: Text(
                                channel.lastSenderName!,
                                style: TextStyle(
                                  fontFamily: 'Tajawal',
                                  fontSize: 10,
                                  color: color.withValues(alpha: 0.8),
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          if (channel.lastSenderName != null &&
                              channel.lastMessageAt != null)
                            const Text(' • ',
                                style: TextStyle(
                                    fontSize: 10, color: Color(0xFF9CA3AF))),
                          if (channel.lastMessageAt != null)
                            Text(
                              _formatTime(channel.lastMessageAt!),
                              style: const TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 10,
                                color: Color(0xFF9CA3AF),
                              ),
                            ),
                          const Spacer(),
                          if (!channel.canWrite(currentUserRole))
                            Icon(Icons.lock_outline_rounded,
                                size: 12, color: Colors.grey.shade400),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'الآن';
    if (diff.inHours < 1) return 'قبل ${diff.inMinutes} د';
    if (diff.inDays < 1) return 'قبل ${diff.inHours} س';
    if (diff.inDays < 7) return 'قبل ${diff.inDays} ي';
    return '${dt.day}/${dt.month}';
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
      'warning': Icons.warning_rounded,
    };
    return map[iconName] ?? Icons.chat_bubble_outline_rounded;
  }
}

/// ═══════════════════════════════════════════════════════════
/// Tab 3: FeedbackTab — embedded version of FeedbackScreen
/// ═══════════════════════════════════════════════════════════

class FeedbackTab extends ConsumerStatefulWidget {
  final String currentUserId;
  final String currentUserName;
  final String currentUserRole;

  const FeedbackTab({
    super.key,
    required this.currentUserId,
    required this.currentUserName,
    required this.currentUserRole,
  });

  @override
  ConsumerState<FeedbackTab> createState() => _FeedbackTabState();
}

class _FeedbackTabState extends ConsumerState<FeedbackTab>
    with SingleTickerProviderStateMixin {
  late TabController _subTabController;
  String _currentFilter = 'all';

  @override
  void initState() {
    super.initState();
    _subTabController = TabController(length: 4, vsync: this);
    _subTabController.addListener(() {
      if (!_subTabController.indexIsChanging) {
        setState(() {
          switch (_subTabController.index) {
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
    _subTabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Header with create button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: TabBar(
                    controller: _subTabController,
                    labelColor: Colors.white,
                    unselectedLabelColor: AppTheme.primaryColor,
                    labelStyle: const TextStyle(
                        fontFamily: 'Cairo',
                        fontWeight: FontWeight.w700,
                        fontSize: 11),
                    unselectedLabelStyle:
                        const TextStyle(fontFamily: 'Tajawal', fontSize: 10),
                    indicator: BoxDecoration(
                      color: AppTheme.primaryColor,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    indicatorSize: TabBarIndicatorSize.tab,
                    dividerColor: Colors.transparent,
                    tabs: const [
                      Tab(text: 'الكل'),
                      Tab(text: 'واردة'),
                      Tab(text: 'متأخرة'),
                      Tab(text: 'محلولة'),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const FeedbackComposerScreen(),
                    ),
                  ).then((_) {
                    // Invalidate all 4 filters to ensure UI consistency
                    ref.invalidate(allFeedbackTicketsProvider);
                  });
                },
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.add_rounded, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
        // Sub-tab content
        Expanded(
          child: TabBarView(
            controller: _subTabController,
            children: [
              _TicketsListTab(filter: 'all'),
              _TicketsListTab(filter: 'received'),
              _TicketsListTab(filter: 'overdue'),
              _TicketsListTab(filter: 'resolved'),
            ],
          ),
        ),
      ],
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// Tab 4: BriefTab — موجز + إنجازات + طوارئ
/// ═══════════════════════════════════════════════════════════

class BriefTab extends ConsumerWidget {
  final String userName;
  final String currentUserId;
  final String currentUserName;
  final String currentUserRole;

  const BriefTab({
    super.key,
    required this.userName,
    required this.currentUserId,
    required this.currentUserName,
    required this.currentUserRole,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        // ═══ Daily brief ═══
        DailyBriefWidget(userName: userName),
        const SizedBox(height: 12),
        // ═══ Emergency banner ═══
        Consumer(
          builder: (context, ref, _) {
            final channelsAsync = ref.watch(channelsProvider);
            return channelsAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data: (channels) {
                final emergency = channels
                    .where((c) => c.code == 'emergency' && c.unreadCount > 0)
                    .toList();
                if (emergency.isEmpty) return const SizedBox.shrink();
                return EmergencyBanner(
                  emergencyCount: emergency.first.unreadCount,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ChannelScreen(
                          channel: emergency.first,
                          currentUserId: currentUserId,
                          currentUserName: currentUserName,
                          currentUserRole: currentUserRole,
                        ),
                      ),
                    );
                  },
                );
              },
            );
          },
        ),
        const SizedBox(height: 12),
        // ═══ Achievement board ═══
        const AchievementBoard(),
        const SizedBox(height: 12),
        // ═══ Quick stats section ═══
        _buildQuickStats(context, ref),
      ],
    );
  }

  Widget _buildQuickStats(BuildContext context, WidgetRef ref) {
    final memosAsync = ref.watch(memosProvider);
    final ticketsAsync = ref.watch(feedbackTicketsProvider('all'));

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.analytics_outlined,
                  size: 18, color: AppTheme.primaryColor),
              SizedBox(width: 8),
              Text(
                'إحصائيات سريعة',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          memosAsync.when(
            loading: () => const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(strokeWidth: 2)),
            error: (_, __) => const Text('—'),
            data: (memos) {
              final pending = memos
                  .where((m) => m.needsUrgentAcknowledgment)
                  .length;
              return _statRow('تعاميم إلزامية', pending,
                  Icons.description_rounded, const Color(0xFFEF4444));
            },
          ),
          const SizedBox(height: 8),
          ticketsAsync.when(
            loading: () => const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(strokeWidth: 2)),
            error: (_, __) => const Text('—'),
            data: (tickets) {
              final overdue = tickets.where((t) => t.isOverdue).length;
              final pending = tickets
                  .where((t) =>
                      t.status != 'resolved' && t.status != 'closed')
                  .length;
              return Column(
                children: [
                  _statRow('تغذية راجعة قيد المتابعة', pending,
                      Icons.feedback_rounded, const Color(0xFFF57C00)),
                  const SizedBox(height: 8),
                  _statRow('تذاكر متأخرة عن SLA', overdue,
                      Icons.warning_rounded, const Color(0xFFEF4444)),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _statRow(String label, int value, IconData icon, Color color) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 12,
              color: Color(0xFF6B7280),
            ),
          ),
        ),
        Text(
          '$value',
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
      ],
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// Helper: Memos list tab (extracted from MemosScreen)
/// ═══════════════════════════════════════════════════════════

class _MemosListTab extends ConsumerStatefulWidget {
  final bool Function(OfficialMemo) filter;
  final String currentUserId;
  final String currentUserName;
  final String currentUserRole;
  final bool showBatchAck; // Show "acknowledge all" button (for mandatory tab)

  const _MemosListTab({
    required this.filter,
    required this.currentUserId,
    required this.currentUserName,
    required this.currentUserRole,
    this.showBatchAck = false,
  });

  @override
  ConsumerState<_MemosListTab> createState() => _MemosListTabState();
}

class _MemosListTabState extends ConsumerState<_MemosListTab> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  /// Batch acknowledge all pending memos in this tab
  Future<void> _batchAcknowledge() async {
    final memos = ref.read(memosProvider).valueOrNull ?? [];
    final pending = memos.where(widget.filter).toList();

    if (pending.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('لا توجد تعاميم بانتظار الإقرار',
              style: TextStyle(fontFamily: 'Tajawal')),
        ),
      );
      return;
    }

    HapticFeedback.mediumImpact();

    // Confirm
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('إقرار الكل',
            style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700)),
        content: Text(
            'سيتم إقرار ${pending.length} تعميم. هل أنت متأكد؟',
            style: const TextStyle(fontFamily: 'Tajawal')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('إلغاء',
                style: TextStyle(fontFamily: 'Tajawal')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('إقرار الكل',
                style: TextStyle(fontFamily: 'Cairo')),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final service = ref.read(officialMemosServiceProvider);
    int successCount = 0;
    for (final memo in pending) {
      try {
        await service.acknowledgeMemo(memo.id);
        successCount++;
      } catch (_) {
        // Continue even if some fail
      }
    }

    if (mounted) {
      ref.invalidate(memosProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded,
                  color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Text('تم إقرار $successCount من ${pending.length} تعميم',
                  style: const TextStyle(fontFamily: 'Tajawal')),
            ],
          ),
          backgroundColor: const Color(0xFF22C55E),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final memosAsync = ref.watch(memosProvider);

    return Column(
      children: [
        // ═══ Search bar + optional batch acknowledge ═══
        Row(
          children: [
            Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: TextField(
                  controller: _searchController,
                  textDirection: TextDirection.rtl,
                  style: const TextStyle(fontFamily: 'Tajawal', fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'بحث في التعاميم...',
                    hintStyle: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                        color: Color(0xFF9CA3AF)),
                    prefixIcon: const Icon(Icons.search_rounded,
                        size: 20, color: Color(0xFF9CA3AF)),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                  ),
                  onChanged: (value) =>
                      setState(() => _searchQuery = value.toLowerCase()),
                ),
              ),
            ),
            // ═══ Batch acknowledge button ═══
            if (widget.showBatchAck)
              Container(
                margin: const EdgeInsets.only(left: 12, top: 4, bottom: 4),
                child: FilledButton.icon(
                  onPressed: _batchAcknowledge,
                  icon: const Icon(Icons.done_all_rounded, size: 16),
                  label: const Text('إقرار الكل',
                      style:
                          TextStyle(fontFamily: 'Cairo', fontSize: 11)),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                  ),
                ),
              ),
          ],
        ),
        // ═══ Memos list ═══
        Expanded(
          child: memosAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline_rounded,
                      size: 48, color: Color(0xFFEF4444)),
                  const SizedBox(height: 12),
                  Text('تعذّر تحميل التعاميم',
                      style: TextStyle(
                          fontFamily: 'Tajawal', color: Colors.grey.shade700)),
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
              var memos = allMemos.where(widget.filter).toList();

              // Filter by search query
              if (_searchQuery.isNotEmpty) {
                memos = memos.where((m) {
                  final title = m.title.toLowerCase();
                  final body = m.body.toLowerCase();
                  final number = m.memoNumber.toLowerCase();
                  final issuer = m.issuerName.toLowerCase();
                  return title.contains(_searchQuery) ||
                      body.contains(_searchQuery) ||
                      number.contains(_searchQuery) ||
                      issuer.contains(_searchQuery);
                }).toList();
              }

              if (memos.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withValues(alpha: 0.08),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                              Icons.description_outlined,
                              size: 36,
                              color: AppTheme.primaryColor
                                  .withValues(alpha: 0.5)),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _searchQuery.isNotEmpty
                              ? 'لا توجد نتائج'
                              : 'لا توجد تعاميم',
                          style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 15,
                              fontWeight: FontWeight.w700),
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
                    return MemoCard(
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
          ),
        ),
      ],
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// Helper: Tickets list tab (extracted from FeedbackScreen)
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
                  ref.invalidate(allFeedbackTicketsProvider),
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
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.08),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.feedback_outlined,
                        size: 36,
                        color: AppTheme.primaryColor.withValues(alpha: 0.5)),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'لا توجد تغذية راجعة',
                    style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 15,
                        fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async =>
              ref.invalidate(allFeedbackTicketsProvider),
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: tickets.length,
            itemBuilder: (context, index) {
              return TicketCard(
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
                      ref.invalidate(allFeedbackTicketsProvider));
                },
              );
            },
          ),
        );
      },
    );
  }
}
