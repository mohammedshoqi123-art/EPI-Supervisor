import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';
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
  String _currentUserRole = 'data_entry';

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
      if (mounted && response != null) {
        setState(() {
          _currentUserRole = response['role'] as String? ?? 'data_entry';
        });
      }
    } catch (_) {}
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
            fontSize: 12,
          ),
          unselectedLabelStyle: const TextStyle(
            fontFamily: 'Tajawal',
            fontWeight: FontWeight.w500,
            fontSize: 11,
          ),
          tabs: const [
            Tab(icon: Icon(Icons.campaign_rounded), text: 'تعاميم'),
            Tab(icon: Icon(Icons.forum_rounded), text: 'قنوات'),
            Tab(icon: Icon(Icons.feedback_rounded), text: 'تغذية راجعة'),
            Tab(icon: Icon(Icons.wb_sunny_rounded), text: 'موجز'),
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
                  currentUserRole: _currentUserRole,
                ),
                ChannelsTab(
                  currentUserId: _currentUserId ?? '',
                  currentUserName: _currentUserName ?? 'مستخدم',
                  currentUserRole: _currentUserRole,
                ),
                FeedbackTab(
                  currentUserId: _currentUserId ?? '',
                  currentUserName: _currentUserName ?? 'مستخدم',
                  currentUserRole: _currentUserRole,
                ),
                BriefTab(
                  userName: _currentUserName ?? 'مشرف',
                  currentUserId: _currentUserId ?? '',
                  currentUserName: _currentUserName ?? 'مستخدم',
                  currentUserRole: _currentUserRole,
                ),
              ],
            ),
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
