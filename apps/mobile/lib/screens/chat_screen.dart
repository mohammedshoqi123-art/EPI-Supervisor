import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';
import '../services/chat_channel_service.dart';
import 'channel_screen.dart';
import 'ai_chat_screen_v3.dart';

/// ═══════════════════════════════════════════════════════════
/// ChatScreen — Hierarchical Communication Hub
///
/// 3 tabs:
///  1. 📢 رسمي — official channels (announcements, feedback)
///  2. 💬 نقاش — open discussion channels
///  3. 🤖 مساعد ذكي — AI chat (delegated to AiChatScreenV3 embedded)
/// ═══════════════════════════════════════════════════════════

class ChatScreen extends ConsumerStatefulWidget {
  final int initialTab;

  const ChatScreen({super.key, this.initialTab = 0});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _currentUserId;
  String? _currentUserName;
  String _currentUserRole = 'data_entry';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 3,
      vsync: this,
      initialIndex: widget.initialTab.clamp(0, 2),
    );
    _initUser();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _initUser() {
    try {
      final client = Supabase.instance.client;
      _currentUserId = client.auth.currentUser?.id;
      _currentUserName = client.auth.currentUser?.userMetadata?['full_name'] ??
          client.auth.currentUser?.email?.split('@').first ??
          'مستخدم';
      // Get role from profiles
      _loadUserRole();
    } catch (e) {
      debugPrint('[ChatScreen] _initUser error: $e');
      _currentUserName = 'مستخدم';
    }
  }

  Future<void> _loadUserRole() async {
    try {
      final client = Supabase.instance.client;
      final response = await client
          .from('profiles')
          .select('role')
          .eq('id', client.auth.currentUser?.id ?? '')
          .maybeSingle();
      if (mounted && response != null) {
        setState(() {
          _currentUserRole = response['role'] as String? ?? 'data_entry';
        });
      }
    } catch (e) {
      debugPrint('[ChatScreen] _loadUserRole error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isConfigured = SupabaseConfig.isConfigured;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'مركز الاتصال',
          style: TextStyle(
            fontFamily: 'Cairo',
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          labelStyle: const TextStyle(
            fontFamily: 'Cairo',
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
          unselectedLabelStyle: const TextStyle(
            fontFamily: 'Tajawal',
            fontWeight: FontWeight.w500,
            fontSize: 12,
          ),
          tabs: const [
            Tab(icon: Icon(Icons.campaign_rounded), text: 'رسمي'),
            Tab(icon: Icon(Icons.forum_rounded), text: 'نقاش'),
            Tab(icon: Icon(Icons.smart_toy_rounded), text: 'مساعد ذكي'),
          ],
        ),
      ),
      body: !isConfigured
          ? _buildNotConfigured()
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOfficialTab(),
                _buildDiscussionTab(),
                _buildAITab(),
              ],
            ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Tab 1: رسمي — Official Channels (announcements + feedback)
  // ═══════════════════════════════════════════════════════════════

  Widget _buildOfficialTab() {
    return _ChannelListTab(
      filter: (channels) => channels
          .where((c) =>
              c.channelType == 'announcement' || c.channelType == 'feedback')
          .toList(),
      currentUserId: _currentUserId ?? '',
      currentUserName: _currentUserName ?? 'مستخدم',
      currentUserRole: _currentUserRole,
      emptyTitle: 'لا توجد قنوات رسمية',
      emptySubtitle: 'ستظهر هنا التعاميم والتوجيهات والتغذية الراجعة',
      emptyIcon: Icons.campaign_outlined,
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Tab 2: نقاش — Open Discussion Channels
  // ═══════════════════════════════════════════════════════════════

  Widget _buildDiscussionTab() {
    return _ChannelListTab(
      filter: (channels) => channels
          .where((c) => c.channelType == 'open' || c.channelType == 'inquiry')
          .toList(),
      currentUserId: _currentUserId ?? '',
      currentUserName: _currentUserName ?? 'مستخدم',
      currentUserRole: _currentUserRole,
      emptyTitle: 'لا توجد قنوات نقاش',
      emptySubtitle: 'ستظهر هنا قنوات النقاش المفتوح والاستفسارات',
      emptyIcon: Icons.forum_outlined,
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Tab 3: AI — مساعد ذكي
  // ═══════════════════════════════════════════════════════════════

  Widget _buildAITab() {
    return const AiChatScreenV3(embedded: true);
  }

  Widget _buildNotConfigured() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFFFED7AA).withValues(alpha: 0.5),
                    const Color(0xFFFED7AA).withValues(alpha: 0.2),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.cloud_off_rounded,
                size: 56,
                color: Color(0xFFF97316),
              ),
            ),
            const SizedBox(height: 28),
            const Text(
              'مركز الاتصال غير متاح',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1A2332),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'يتطلب الاتصال بخادم Supabase\nلعرض القنوات الرسمية والرسائل',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 14,
                height: 1.6,
                color: Colors.grey.shade500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// _ChannelListTab — Reusable channel list for both tabs
/// ═══════════════════════════════════════════════════════════

class _ChannelListTab extends ConsumerWidget {
  final List<ChatChannel> Function(List<ChatChannel>) filter;
  final String currentUserId;
  final String currentUserName;
  final String currentUserRole;
  final String emptyTitle;
  final String emptySubtitle;
  final IconData emptyIcon;

  const _ChannelListTab({
    required this.filter,
    required this.currentUserId,
    required this.currentUserName,
    required this.currentUserRole,
    required this.emptyTitle,
    required this.emptySubtitle,
    required this.emptyIcon,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final channelsAsync = ref.watch(channelsProvider);

    return channelsAsync.when(
      loading: () => const Center(
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
              'جاري تحميل القنوات...',
              style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 14,
                  color: Color(0xFF9CA3AF)),
            ),
          ],
        ),
      ),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded,
                  size: 56, color: Color(0xFFEF4444)),
              const SizedBox(height: 16),
              Text(
                'تعذّر تحميل القنوات',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey.shade700,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '$e',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 12,
                  color: Colors.grey.shade500,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.invalidate(channelsProvider),
                icon: const Icon(Icons.refresh),
                label: const Text('إعادة المحاولة',
                    style: TextStyle(fontFamily: 'Tajawal')),
              ),
            ],
          ),
        ),
      ),
      data: (allChannels) {
        final channels = filter(allChannels);

        if (channels.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 110,
                    height: 110,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.08),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      emptyIcon,
                      size: 48,
                      color: AppTheme.primaryColor.withValues(alpha: 0.5),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    emptyTitle,
                    style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1A2332),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    emptySubtitle,
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

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(channelsProvider),
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: channels.length,
            itemBuilder: (context, index) {
              final channel = channels[index];
              return _ChannelCard(
                channel: channel,
                currentUserRole: currentUserRole,
                onTap: () {
                  HapticFeedback.lightImpact();
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ChannelScreen(
                        channel: channel,
                        currentUserId: currentUserId,
                        currentUserName: currentUserName,
                        currentUserRole: currentUserRole,
                      ),
                    ),
                  ).then((_) {
                    // Refresh unread counts when returning
                    ref.invalidate(channelsProvider);
                  });
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
/// _ChannelCard — Channel list item
/// ═══════════════════════════════════════════════════════════

class _ChannelCard extends StatelessWidget {
  final ChatChannel channel;
  final VoidCallback onTap;
  final String currentUserRole;

  const _ChannelCard({
    required this.channel,
    required this.onTap,
    required this.currentUserRole,
  });

  @override
  Widget build(BuildContext context) {
    final color = Color(channel.colorValue);
    final hasUnread = channel.unreadCount > 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: hasUnread
              ? color.withValues(alpha: 0.4)
              : Colors.grey.shade100,
          width: hasUnread ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: hasUnread ? 0.06 : 0.03),
            blurRadius: 8,
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
                // Channel icon
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                        color: color.withValues(alpha: 0.2)),
                  ),
                  child: Icon(
                    _getChannelIcon(channel.icon),
                    color: color,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                // Content
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
                                color: color,
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
                            const Text(
                              ' • ',
                              style: TextStyle(
                                fontSize: 10,
                                color: Color(0xFF9CA3AF),
                              ),
                            ),
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
                          // Write permission indicator
                          if (!channel.canWrite(currentUserRole))
                            Icon(
                              Icons.lock_outline_rounded,
                              size: 12,
                              color: Colors.grey.shade400,
                            ),
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
    };
    return map[iconName] ?? Icons.chat_bubble_outline_rounded;
  }
}
