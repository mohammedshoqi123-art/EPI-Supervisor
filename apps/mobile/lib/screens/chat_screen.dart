import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';
import '../services/memos_feedback_service.dart';
import '../services/chat_channel_service.dart';
import 'communication_tabs.dart';

/// ═══════════════════════════════════════════════════════════
/// ChatScreen — Hierarchical Communication Hub
///
/// 4 tabs:
///  1. 📢 تعاميم (Official Memos)
///  2. 💬 قنوات (All channels)
///  3. 📋 تغذية راجعة (Feedback Tickets)
///  4. ☀️ موجز (Daily Brief + Achievements + Emergency)
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
  // ═══ FIX: no 'data_entry' default while loading — null means "no role yet"
  // (tabs treat null as non-privileged; read-only UI stays unlocked) ═══
  String? _currentUserRole;
  bool _roleLoaded = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 4,
      vsync: this,
      initialIndex: widget.initialTab.clamp(0, 3),
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
      _currentUserName =
          client.auth.currentUser?.userMetadata?['full_name'] ??
              client.auth.currentUser?.email?.split('@').first ??
              'مستخدم';
      _loadUserRole();
    } catch (e) {
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
      if (mounted) {
        setState(() {
          _currentUserRole = response?['role'] as String? ?? 'data_entry';
          _roleLoaded = true;
        });
      }
    } catch (_) {
      // Profile fetch failed (likely offline) — fall back to the previous
      // default so read-only/write gating isn't stuck in the loading state.
      if (mounted) {
        setState(() {
          _currentUserRole ??= 'data_entry';
          _roleLoaded = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isConfigured = SupabaseConfig.isConfigured;

    // ═══ FIX: unread badges for the 4 top tabs (same provider instances the
    // tabs watch — no double realtime subscriptions) ═══
    int memosUnread = 0;
    int channelsUnread = 0;
    int ticketsUnread = 0;
    if (isConfigured) {
      // تعاميم: memos requiring acknowledgment and not yet acknowledged
      final memos = ref.watch(memosProvider).valueOrNull ?? const [];
      memosUnread = memos
          .where((m) => m.requiresAcknowledgment && !m.isAcknowledged)
          .length;

      // قنوات: total unread across all channels
      final channels = ref.watch(channelsProvider).valueOrNull ?? const [];
      channelsUnread =
          channels.fold<int>(0, (sum, c) => sum + c.unreadCount);

      // تغذية راجعة: received tickets still open (sent / in_progress)
      final tickets =
          ref.watch(feedbackTicketsProvider('received')).valueOrNull ??
              const [];
      ticketsUnread = tickets
          .where((t) => t.status == 'sent' || t.status == 'in_progress')
          .length;
    }

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
            fontSize: 12,
          ),
          unselectedLabelStyle: const TextStyle(
            fontFamily: 'Tajawal',
            fontWeight: FontWeight.w500,
            fontSize: 11,
          ),
          tabs: [
            _buildTabWithBadge(
                icon: Icons.campaign_rounded, label: 'تعاميم', count: memosUnread),
            _buildTabWithBadge(
                icon: Icons.forum_rounded, label: 'قنوات', count: channelsUnread),
            _buildTabWithBadge(
                icon: Icons.feedback_rounded,
                label: 'تغذية راجعة',
                count: ticketsUnread),
            const Tab(icon: Icon(Icons.wb_sunny_rounded), text: 'موجز'),
          ],
        ),
      ),
      body: !isConfigured
          ? _buildNotConfigured()
          : TabBarView(
              controller: _tabController,
              children: [
                MemosTab(
                  currentUserId: _currentUserId ?? '',
                  currentUserName: _currentUserName ?? 'مستخدم',
                  currentUserRole: _roleLoaded ? _currentUserRole : null,
                ),
                ChannelsTab(
                  currentUserId: _currentUserId ?? '',
                  currentUserName: _currentUserName ?? 'مستخدم',
                  currentUserRole: _roleLoaded ? _currentUserRole : null,
                ),
                FeedbackTab(
                  currentUserId: _currentUserId ?? '',
                  currentUserName: _currentUserName ?? 'مستخدم',
                  currentUserRole: _roleLoaded ? _currentUserRole : null,
                ),
                BriefTab(
                  userName: _currentUserName ?? 'مشرف',
                  currentUserId: _currentUserId ?? '',
                  currentUserName: _currentUserName ?? 'مستخدم',
                  currentUserRole: _roleLoaded ? _currentUserRole : null,
                ),
              ],
            ),
    );
  }

  /// ═══ FIX: tab icon wrapped in a badge Stack (same style as
  /// dashboard_header.dart) — shows the unread count when > 0 ═══
  Widget _buildTabWithBadge({
    required IconData icon,
    required String label,
    required int count,
  }) {
    return Tab(
      icon: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(icon),
          if (count > 0)
            Positioned(
              top: -4,
              right: -6,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                constraints:
                    const BoxConstraints(minWidth: 16, minHeight: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFB300),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFFFB300).withValues(alpha: 0.4),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: Text(
                  count > 99 ? '99+' : '$count',
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
      text: label,
    );
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
