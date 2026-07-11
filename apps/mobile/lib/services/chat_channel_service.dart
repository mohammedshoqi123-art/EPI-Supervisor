import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';

/// ═══════════════════════════════════════════════════════════
/// ChatChannel — Model
/// ═══════════════════════════════════════════════════════════

class ChatChannel {
  final String id;
  final String name;
  final String? description;
  final String? code;
  final String channelType; // announcement | feedback | open | inquiry
  final List<String> targetRoles;
  final String? targetGovernorateId;
  final String? targetDistrictId;
  final String icon;
  final String color;
  final int sortOrder;
  final bool isOfficial;
  final bool isAnnouncement;
  final int unreadCount;
  final String? lastMessageContent;
  final DateTime? lastMessageAt;
  final String? lastSenderName;

  const ChatChannel({
    required this.id,
    required this.name,
    this.description,
    this.code,
    required this.channelType,
    required this.targetRoles,
    this.targetGovernorateId,
    this.targetDistrictId,
    required this.icon,
    required this.color,
    required this.sortOrder,
    required this.isOfficial,
    required this.isAnnouncement,
    this.unreadCount = 0,
    this.lastMessageContent,
    this.lastMessageAt,
    this.lastSenderName,
  });

  factory ChatChannel.fromMap(Map<String, dynamic> m) {
    return ChatChannel(
      id: m['id'] as String,
      name: m['name'] as String,
      description: m['description'] as String?,
      code: m['code'] as String?,
      channelType: m['channel_type'] as String? ?? 'open',
      targetRoles: ((m['target_roles'] as List?) ?? [])
          .map((e) => e.toString())
          .toList(),
      targetGovernorateId: m['target_governorate_id'] as String?,
      targetDistrictId: m['target_district_id'] as String?,
      icon: m['icon'] as String? ?? 'chat_bubble_outline',
      color: m['color'] as String? ?? '00897B',
      sortOrder: m['sort_order'] as int? ?? 99,
      isOfficial: m['is_official'] as bool? ?? false,
      isAnnouncement: m['is_announcement'] as bool? ?? false,
      unreadCount: m['unread_count'] as int? ?? 0,
      lastMessageContent: m['last_message_content'] as String?,
      lastMessageAt: m['last_message_at'] != null
          ? DateTime.tryParse(m['last_message_at'].toString())
          : null,
      lastSenderName: m['last_sender_name'] as String?,
    );
  }

  /// Helper: can current user write to this channel?
  bool canWrite(String userRole) {
    return targetRoles.contains(userRole);
  }

  /// Channel color as Color
  int get colorValue => int.parse('0xFF$color');

  /// Channel type label in Arabic
  String get typeLabelAr {
    switch (channelType) {
      case 'announcement':
        return 'إعلان رسمي';
      case 'feedback':
        return 'تغذية راجعة';
      case 'inquiry':
        return 'استفسار';
      default:
        return 'نقاش مفتوح';
    }
  }
}

/// ═══════════════════════════════════════════════════════════
/// ChatChannelService — Service layer
/// ═══════════════════════════════════════════════════════════

class ChatChannelService {
  final ApiClient _api;

  ChatChannelService(this._api);

  /// Fetch all channels accessible to the current user with unread counts
  Future<List<ChatChannel>> getUserChannels() async {
    try {
      final result = await _api.rpc('get_user_channels', params: {});
      return (result as List)
          .map((e) => ChatChannel.fromMap(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('[ChatChannelService] getUserChannels error: $e');
      // Fallback: direct query
      try {
        final client = Supabase.instance.client;
        final response = await client
            .from('chat_channels')
            .select('*')
            .eq('is_active', true)
            .order('is_official', ascending: false)
            .order('sort_order', ascending: true);
        return (response as List)
            .map((e) => ChatChannel.fromMap(e as Map<String, dynamic>))
            .toList();
      } catch (e2) {
        debugPrint('[ChatChannelService] Fallback query error: $e2');
        return [];
      }
    }
  }
}

/// ═══════════════════════════════════════════════════════════
/// Riverpod Providers
/// ═══════════════════════════════════════════════════════════

final chatChannelServiceProvider = Provider<ChatChannelService>((ref) {
  return ChatChannelService(ref.read(apiClientProvider));
});

/// Stream of channels (refreshed every 30 seconds + on demand)
final channelsProvider = StreamProvider<List<ChatChannel>>((ref) async* {
  final service = ref.read(chatChannelServiceProvider);

  // Use a controller for periodic refresh
  final controller = StreamController<List<ChatChannel>>();

  Future<void> refresh() async {
    final channels = await service.getUserChannels();
    if (!controller.isClosed) controller.add(channels);
  }

  // Initial data
  await refresh();

  // Start periodic refresh every 30 seconds
  final refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) async {
    await refresh();
  });

  // Clean up when provider is disposed
  ref.onDispose(() {
    refreshTimer.cancel();
    controller.close();
  });

  await for (final channels in controller.stream) {
    yield channels;
  }
});
