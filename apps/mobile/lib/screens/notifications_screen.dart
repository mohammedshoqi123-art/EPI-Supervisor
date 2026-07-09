import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';
import '../providers/app_providers.dart';
import '../router/app_router.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String _filter = 'all'; // all, unread, urgent

  @override
  void initState() {
    super.initState();
    _loadNotifications();

    // ═══ NO auto-refresh — user presses sync button ═══
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    try {
      // Ensure service is initialized
      final api = ref.read(apiClientProvider);
      NotificationService.init(api);
      await NotificationService.loadFromDB(refresh: true);
    } catch (e) {
      debugPrint('Load notifications error: $e');
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _loadMore() async {
    if (_isLoadingMore || !NotificationService.hasMore) return;
    setState(() => _isLoadingMore = true);
    try {
      await NotificationService.loadFromDB();
    } catch (_) {}
    if (mounted) setState(() => _isLoadingMore = false);
  }

  @override
  Widget build(BuildContext context) {
    final notifications = NotificationService.all;
    final unreadCount = NotificationService.unreadCount;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'الإشعارات',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700),
        ),
        centerTitle: true,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [AppTheme.primaryColor, AppTheme.primaryDark],
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
            ),
          ),
        ),
        actions: [
          if (unreadCount > 0)
            TextButton.icon(
              onPressed: () async {
                await NotificationService.markAllAsRead();
                if (mounted) setState(() {});
              },
              icon: const Icon(Icons.done_all, size: 18, color: Colors.white),
              label: Text(
                '$unreadCount',
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: EpiLoading.shimmer())
          : notifications.isEmpty
              ? _buildEmptyState()
              : Column(
                  children: [
                    _buildFilterChips(unreadCount),
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: _loadNotifications,
                        child: _buildFilteredList(notifications),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildFilterChips(int unreadCount) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          _filterChip('all', 'الكل', null),
          const SizedBox(width: 8),
          _filterChip('unread', 'غير مقروء', unreadCount),
          const SizedBox(width: 8),
          _filterChip('urgent', 'عاجل', null),
        ],
      ),
    );
  }

  Widget _filterChip(String value, String label, int? count) {
    final isSelected = _filter == value;
    return FilterChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
          )),
          if (count != null && count > 0) ...[
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white.withValues(alpha: 0.3) : AppTheme.errorColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: isSelected ? Colors.white : Colors.white,
                ),
              ),
            ),
          ],
        ],
      ),
      selected: isSelected,
      onSelected: (_) => setState(() => _filter = value),
      selectedColor: AppTheme.primaryColor,
      labelStyle: TextStyle(color: isSelected ? Colors.white : AppTheme.textSecondary),
      backgroundColor: AppTheme.surfaceLight,
      side: BorderSide(
        color: isSelected ? AppTheme.primaryColor : AppTheme.textHint.withValues(alpha: 0.3),
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      showCheckmark: false,
    );
  }

  Widget _buildFilteredList(List<AppNotification> notifications) {
    final filtered = notifications.where((n) {
      switch (_filter) {
        case 'unread':
          return !n.read;
        case 'urgent':
          return n.type == AppNotificationType.warning ||
                 n.type == AppNotificationType.error ||
                 n.category == 'urgent' ||
                 n.category == 'critical';
        default:
          return true;
      }
    }).toList();

    if (filtered.isEmpty) {
      return ListView(
        children: [
          const SizedBox(height: 100),
          Center(
            child: Column(
              children: [
                Icon(Icons.filter_alt_off_rounded, size: 48, color: AppTheme.textHint.withValues(alpha: 0.4)),
                const SizedBox(height: 12),
                Text('لا توجد إشعارات في هذا التصنيف', style: TextStyle(
                  fontFamily: 'Tajawal', fontSize: 13, color: AppTheme.textHint,
                )),
              ],
            ),
          ),
        ],
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 4),
      itemCount: filtered.length + (NotificationService.hasMore ? 1 : 0),
      separatorBuilder: (_, __) => const Divider(height: 1, indent: 72),
      itemBuilder: (context, index) {
        if (index >= filtered.length) return _buildLoadMoreButton();
        return _buildNotificationTile(filtered[index]);
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_off_outlined,
            size: 72,
            color: AppTheme.textHint.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          const Text(
            'لا توجد إشعارات',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'ستظهر هنا الإشعارات الجديدة عند وصولها',
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 14,
              color: AppTheme.textHint,
            ),
          ),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: _loadNotifications,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('تحديث', style: TextStyle(fontFamily: 'Tajawal')),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationTile(AppNotification notification) {
    final icon = _getIconForType(notification.type);
    final color = _getColorForType(notification.type);
    final timeAgo = _formatTimeAgo(notification.createdAt);

    return Dismissible(
      key: ValueKey(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 20),
        color: AppTheme.errorColor.withValues(alpha: 0.1),
        child: const Icon(Icons.delete_outline, color: AppTheme.errorColor),
      ),
      onDismissed: (_) async {
        // Actually delete the notification from local list + DB
        await NotificationService.delete(notification.id);
        if (mounted) {
          setState(() {});
        }
      },
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 22),
        ),
        title: Text(
          notification.title,
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 14,
            fontWeight: notification.read ? FontWeight.normal : FontWeight.w700,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              notification.body,
              style: const TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 13,
                color: AppTheme.textSecondary,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    notification.category,
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 10,
                      color: color,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  timeAgo,
                  style: const TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 11,
                    color: AppTheme.textHint,
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: !notification.read
            ? Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryColor.withValues(alpha: 0.3),
                      blurRadius: 6,
                    ),
                  ],
                ),
              )
            : null,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        onTap: () async {
          if (!notification.read) {
            await NotificationService.markAsRead(notification.id);
            if (mounted) setState(() {});
          }
        },
      ),
    );
  }

  Widget _buildLoadMoreButton() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: _isLoadingMore
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : OutlinedButton.icon(
                onPressed: _loadMore,
                icon: const Icon(Icons.expand_more, size: 18),
                label: const Text(
                  'تحميل المزيد',
                  style: TextStyle(fontFamily: 'Tajawal'),
                ),
              ),
      ),
    );
  }

  IconData _getIconForType(AppNotificationType type) {
    switch (type) {
      case AppNotificationType.success:
        return Icons.check_circle_rounded;
      case AppNotificationType.warning:
        return Icons.warning_rounded;
      case AppNotificationType.error:
        return Icons.error_rounded;
      case AppNotificationType.sync:
        return Icons.sync_rounded;
      case AppNotificationType.info:
        return Icons.info_rounded;
    }
  }

  Color _getColorForType(AppNotificationType type) {
    switch (type) {
      case AppNotificationType.success:
        return AppTheme.successColor;
      case AppNotificationType.warning:
        return AppTheme.warningColor;
      case AppNotificationType.error:
        return AppTheme.errorColor;
      case AppNotificationType.sync:
        return AppTheme.primaryColor;
      case AppNotificationType.info:
        return AppTheme.infoColor;
    }
  }

  String _formatTimeAgo(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inMinutes < 1) return 'الآن';
    if (diff.inMinutes < 60) return 'منذ ${diff.inMinutes} دقيقة';
    if (diff.inHours < 24) return 'منذ ${diff.inHours} ساعة';
    if (diff.inDays < 7) return 'منذ ${diff.inDays} يوم';
    return '${date.day}/${date.month}/${date.year}';
  }
}
