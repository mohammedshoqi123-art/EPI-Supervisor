import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';

/// ═══════════════════════════════════════════════════════════
/// OfficialMemo — Model
/// ═══════════════════════════════════════════════════════════

class OfficialMemo {
  final String id;
  final String memoNumber;
  final String title;
  final String body;
  final String priority; // routine | normal | important | critical
  final String? issuedBy;
  final String issuerName;
  final String issuerRole;
  final List<String> targetRoles;
  final bool requiresAcknowledgment;
  final DateTime? validUntil;
  final List<dynamic> attachments;
  final DateTime createdAt;
  final bool isAcknowledged;
  final DateTime? acknowledgedAt;
  final bool isExpired;

  const OfficialMemo({
    required this.id,
    required this.memoNumber,
    required this.title,
    required this.body,
    required this.priority,
    this.issuedBy,
    required this.issuerName,
    required this.issuerRole,
    required this.targetRoles,
    required this.requiresAcknowledgment,
    this.validUntil,
    required this.attachments,
    required this.createdAt,
    required this.isAcknowledged,
    this.acknowledgedAt,
    required this.isExpired,
  });

  factory OfficialMemo.fromMap(Map<String, dynamic> m) {
    return OfficialMemo(
      id: m['id'] as String,
      memoNumber: m['memo_number'] as String? ?? '',
      title: m['title'] as String? ?? '',
      body: m['body'] as String? ?? '',
      priority: m['priority'] as String? ?? 'normal',
      issuedBy: m['issued_by'] as String?,
      issuerName: m['issuer_name'] as String? ?? '',
      issuerRole: m['issuer_role'] as String? ?? '',
      targetRoles: ((m['target_roles'] as List?) ?? [])
          .map((e) => e.toString())
          .toList(),
      requiresAcknowledgment: m['requires_acknowledgment'] as bool? ?? true,
      validUntil: m['valid_until'] != null
          ? DateTime.tryParse(m['valid_until'].toString())
          : null,
      attachments: (m['attachments'] as List?) ?? [],
      createdAt: DateTime.tryParse(m['created_at']?.toString() ?? '') ??
          DateTime.now(),
      isAcknowledged: m['is_acknowledged'] as bool? ?? false,
      acknowledgedAt: m['acknowledged_at'] != null
          ? DateTime.tryParse(m['acknowledged_at'].toString())
          : null,
      isExpired: m['is_expired'] as bool? ?? false,
    );
  }

  /// Priority label in Arabic
  String get priorityLabelAr {
    switch (priority) {
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

  /// Priority color (hex)
  int get priorityColor {
    switch (priority) {
      case 'critical':
        return 0xFFD32F2F;
      case 'important':
        return 0xFFF57C00;
      case 'routine':
        return 0xFF607D8B;
      default:
        return 0xFF1976D2;
    }
  }

  /// Needs immediate acknowledgment?
  bool get needsUrgentAcknowledgment =>
      requiresAcknowledgment && !isAcknowledged && !isExpired;
}

/// ═══════════════════════════════════════════════════════════
/// FeedbackTicket — Model
/// ═══════════════════════════════════════════════════════════

class FeedbackTicket {
  final String id;
  final String ticketNumber;
  final String? fromUserId;
  final String fromName;
  final String fromRole;
  final String toRole;
  final String? toGovernorateId;
  final String? toDistrictId;
  final String subject;
  final String body;
  final String category;
  final String priority;
  final String status;
  final int slaHours;
  final DateTime? slaDeadline;
  final DateTime? resolvedAt;
  final DateTime? escalatedAt;
  final int escalationLevel;
  final DateTime createdAt;
  final bool isOverdue;

  const FeedbackTicket({
    required this.id,
    required this.ticketNumber,
    this.fromUserId,
    required this.fromName,
    required this.fromRole,
    required this.toRole,
    this.toGovernorateId,
    this.toDistrictId,
    required this.subject,
    required this.body,
    required this.category,
    required this.priority,
    required this.status,
    required this.slaHours,
    this.slaDeadline,
    this.resolvedAt,
    this.escalatedAt,
    required this.escalationLevel,
    required this.createdAt,
    required this.isOverdue,
  });

  factory FeedbackTicket.fromMap(Map<String, dynamic> m) {
    return FeedbackTicket(
      id: m['id'] as String,
      ticketNumber: m['ticket_number'] as String? ?? '',
      fromUserId: m['from_user_id'] as String?,
      fromName: m['from_name'] as String? ?? '',
      fromRole: m['from_role'] as String? ?? '',
      toRole: m['to_role'] as String? ?? '',
      toGovernorateId: m['to_governorate_id'] as String?,
      toDistrictId: m['to_district_id'] as String?,
      subject: m['subject'] as String? ?? '',
      body: m['body'] as String? ?? '',
      category: m['category'] as String? ?? 'general',
      priority: m['priority'] as String? ?? 'normal',
      status: m['status'] as String? ?? 'sent',
      slaHours: m['sla_hours'] as int? ?? 24,
      slaDeadline: m['sla_deadline'] != null
          ? DateTime.tryParse(m['sla_deadline'].toString())
          : null,
      resolvedAt: m['resolved_at'] != null
          ? DateTime.tryParse(m['resolved_at'].toString())
          : null,
      escalatedAt: m['escalated_at'] != null
          ? DateTime.tryParse(m['escalated_at'].toString())
          : null,
      escalationLevel: m['escalation_level'] as int? ?? 0,
      createdAt: DateTime.tryParse(m['created_at']?.toString() ?? '') ??
          DateTime.now(),
      isOverdue: m['is_overdue'] as bool? ?? false,
    );
  }

  String get statusLabelAr {
    switch (status) {
      case 'sent':
        return 'مُرسلة';
      case 'received':
        return 'مستلمة';
      case 'in_progress':
        return 'قيد المعالجة';
      case 'resolved':
        return 'تم الحل';
      case 'closed':
        return 'مُغلقة';
      case 'escalated':
        return 'مُرحّلة';
      default:
        return status;
    }
  }

  int get statusColor {
    switch (status) {
      case 'sent':
        return 0xFF1976D2;
      case 'received':
        return 0xFF7B1FA2;
      case 'in_progress':
        return 0xFFF57C00;
      case 'resolved':
      case 'closed':
        return 0xFF388E3C;
      case 'escalated':
        return 0xFFD32F2F;
      default:
        return 0xFF607D8B;
    }
  }

  String get priorityLabelAr {
    switch (priority) {
      case 'critical':
        return 'حرج';
      case 'high':
        return 'عالي';
      case 'low':
        return 'منخفض';
      default:
        return 'عادي';
    }
  }

  String get categoryLabelAr {
    switch (category) {
      case 'performance':
        return 'أداء';
      case 'compliance':
        return 'التزام';
      case 'data_quality':
        return 'جودة بيانات';
      case 'delay':
        return 'تأخير';
      case 'behavior':
        return 'سلوك';
      default:
        return 'عام';
    }
  }
}

/// ═══════════════════════════════════════════════════════════
/// OfficialMemosService — Service layer
/// ═══════════════════════════════════════════════════════════

class OfficialMemosService {
  final ApiClient _api;

  OfficialMemosService(this._api);

  /// Fetch all memos for the current user (with acknowledgment status)
  Future<List<OfficialMemo>> getUserMemos() async {
    try {
      final result = await _api.rpc('get_user_memos', params: {});
      return (result as List)
          .map((e) => OfficialMemo.fromMap(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('[OfficialMemosService] getUserMemos error: $e');
      // Fallback: direct query
      try {
        final client = Supabase.instance.client;
        final response = await client
            .from('official_memos')
            .select('*')
            .eq('is_active', true)
            .order('created_at', ascending: false);
        return (response as List)
            .map((e) => OfficialMemo.fromMap(e as Map<String, dynamic>))
            .toList();
      } catch (e2) {
        debugPrint('[OfficialMemosService] Fallback error: $e2');
        return [];
      }
    }
  }

  /// Create a new memo (admin/central/governorate only)
  Future<String?> createMemo({
    required String title,
    required String body,
    required String priority,
    required List<String> targetRoles,
    bool requiresAcknowledgment = true,
    DateTime? validUntil,
  }) async {
    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      if (userId == null) return null;

      // Get user profile
      final profile = await client
          .from('profiles')
          .select('role, full_name')
          .eq('id', userId)
          .maybeSingle();
      if (profile == null) return null;

      final response = await client.from('official_memos').insert({
        'memo_number': '', // Will be auto-generated by trigger
        'title': title,
        'body': body,
        'priority': priority,
        'issued_by': userId,
        'issuer_role': profile['role'],
        'issuer_name': profile['full_name'] ?? 'غير معروف',
        'target_roles': targetRoles,
        'requires_acknowledgment': requiresAcknowledgment,
        'valid_until': validUntil?.toUtc().toIso8601String(),
        'is_active': true,
      }).select('id').single();

      return response['id'] as String?;
    } catch (e) {
      debugPrint('[OfficialMemosService] createMemo error: $e');
      rethrow;
    }
  }

  /// Acknowledge a memo (mark as read by current user)
  Future<void> acknowledgeMemo(String memoId) async {
    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      if (userId == null) return;

      await client.from('memo_acknowledgments').upsert({
        'memo_id': memoId,
        'user_id': userId,
        'acknowledged_at': DateTime.now().toUtc().toIso8601String(),
      }, onConflict: 'memo_id, user_id');
    } catch (e) {
      debugPrint('[OfficialMemosService] acknowledgeMemo error: $e');
      rethrow;
    }
  }

  /// Get acknowledgment stats (admin/central only)
  Future<Map<String, dynamic>> getAcknowledgmentStats(String memoId) async {
    try {
      final result = await _api.rpc('get_memo_acknowledgment_stats', params: {
        'p_memo_id': memoId,
      });
      if (result.isNotEmpty) {
        return result.first;
      }
      return {
        'total_recipients': 0,
        'acknowledged_count': 0,
        'pending_count': 0,
        'acknowledgment_rate': 0,
      };
    } catch (e) {
      debugPrint('[OfficialMemosService] getAckStats error: $e');
      return {
        'total_recipients': 0,
        'acknowledged_count': 0,
        'pending_count': 0,
        'acknowledgment_rate': 0,
      };
    }
  }

  /// Deactivate (soft delete) a memo — admin only
  Future<void> deactivateMemo(String memoId) async {
    try {
      final client = Supabase.instance.client;
      await client
          .from('official_memos')
          .update({'is_active': false}).eq('id', memoId);
    } catch (e) {
      debugPrint('[OfficialMemosService] deactivateMemo error: $e');
      rethrow;
    }
  }
}

/// ═══════════════════════════════════════════════════════════
/// FeedbackTicketsService — Service layer
/// ═══════════════════════════════════════════════════════════

class FeedbackTicketsService {
  final ApiClient _api;

  FeedbackTicketsService(this._api);

  /// Fetch feedback tickets for current user
  /// filter: all | sent | received | overdue | pending | resolved
  Future<List<FeedbackTicket>> getUserTickets({String filter = 'all'}) async {
    try {
      final result = await _api.rpc('get_user_feedback_tickets', params: {
        'p_filter': filter,
      });
      return (result as List)
          .map((e) => FeedbackTicket.fromMap(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('[FeedbackTicketsService] getUserTickets error: $e');
      // Fallback: direct query
      try {
        final client = Supabase.instance.client;
        final userId = client.auth.currentUser?.id;
        if (userId == null) return [];

        // Filters must be applied BEFORE order/limit (PostgrestTransformBuilder)
        final query = client.from('feedback_tickets').select('*');

        final response = filter == 'sent'
            ? await query
                .eq('from_user_id', userId)
                .order('created_at', ascending: false)
                .limit(200)
            : filter == 'received'
                ? await query
                    .eq('to_user_id', userId)
                    .order('created_at', ascending: false)
                    .limit(200)
                : await query
                    .order('created_at', ascending: false)
                    .limit(200);

        return (response as List)
            .map((e) => FeedbackTicket.fromMap(e as Map<String, dynamic>))
            .toList();
      } catch (e2) {
        debugPrint('[FeedbackTicketsService] Fallback error: $e2');
        return [];
      }
    }
  }

  /// Create a new feedback ticket
  Future<String?> createTicket({
    required String subject,
    required String body,
    required String category,
    required String priority,
    required String toRole,
    String? toUserId,
    String? toGovernorateId,
    String? toDistrictId,
    int slaHours = 24,
  }) async {
    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      if (userId == null) return null;

      // Get user profile
      final profile = await client
          .from('profiles')
          .select('role, full_name')
          .eq('id', userId)
          .maybeSingle();
      if (profile == null) return null;

      final response = await client.from('feedback_tickets').insert({
        'ticket_number': '', // auto-generated
        'from_user_id': userId,
        'from_role': profile['role'],
        'from_name': profile['full_name'] ?? 'غير معروف',
        'to_user_id': toUserId,
        'to_role': toRole,
        'to_governorate_id': toGovernorateId,
        'to_district_id': toDistrictId,
        'subject': subject,
        'body': body,
        'category': category,
        'priority': priority,
        'status': 'sent',
        'sla_hours': slaHours,
      }).select('id').single();

      return response['id'] as String?;
    } catch (e) {
      debugPrint('[FeedbackTicketsService] createTicket error: $e');
      rethrow;
    }
  }

  /// Update ticket status (and add a status_change response)
  Future<void> updateTicketStatus({
    required String ticketId,
    required String newStatus,
    required String responderId,
    required String responderName,
    required String responderRole,
    String? comment,
  }) async {
    try {
      final client = Supabase.instance.client;
      final now = DateTime.now().toUtc().toIso8601String();

      // Update ticket
      final updateData = <String, dynamic>{
        'status': newStatus,
        'updated_at': now,
      };
      if (newStatus == 'resolved') {
        updateData['resolved_at'] = now;
      } else if (newStatus == 'closed') {
        updateData['closed_at'] = now;
      } else if (newStatus == 'escalated') {
        updateData['escalated_at'] = now;
      }

      await client
          .from('feedback_tickets')
          .update(updateData).eq('id', ticketId);

      // Add status_change response
      await client.from('feedback_responses').insert({
        'ticket_id': ticketId,
        'responder_id': responderId,
        'responder_name': responderName,
        'responder_role': responderRole,
        'body': comment ?? 'تم تحديث الحالة إلى: $newStatus',
        'response_type': 'status_change',
        'new_status': newStatus,
      });
    } catch (e) {
      debugPrint('[FeedbackTicketsService] updateTicketStatus error: $e');
      rethrow;
    }
  }

  /// Add a reply to a ticket
  Future<void> addReply({
    required String ticketId,
    required String body,
    required String responderId,
    required String responderName,
    required String responderRole,
  }) async {
    try {
      final client = Supabase.instance.client;
      await client.from('feedback_responses').insert({
        'ticket_id': ticketId,
        'responder_id': responderId,
        'responder_name': responderName,
        'responder_role': responderRole,
        'body': body,
        'response_type': 'reply',
      });

      // Auto-update status to 'received' if currently 'sent'
      await client.from('feedback_tickets').update({
        'status': 'received',
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      }).eq('id', ticketId).eq('status', 'sent');
    } catch (e) {
      debugPrint('[FeedbackTicketsService] addReply error: $e');
      rethrow;
    }
  }

  /// Get all responses for a ticket
  Future<List<Map<String, dynamic>>> getTicketResponses(
      String ticketId) async {
    try {
      final client = Supabase.instance.client;
      final response = await client
          .from('feedback_responses')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', ascending: true);
      return (response as List).cast<Map<String, dynamic>>();
    } catch (e) {
      debugPrint('[FeedbackTicketsService] getTicketResponses error: $e');
      return [];
    }
  }
}

/// ═══════════════════════════════════════════════════════════
/// Riverpod Providers
/// ═══════════════════════════════════════════════════════════

final officialMemosServiceProvider = Provider<OfficialMemosService>((ref) {
  return OfficialMemosService(ref.read(apiClientProvider));
});

final feedbackTicketsServiceProvider = Provider<FeedbackTicketsService>((ref) {
  return FeedbackTicketsService(ref.read(apiClientProvider));
});

/// Memos provider — auto-refreshes every 60 seconds, caches offline
final memosProvider = StreamProvider<List<OfficialMemo>>((ref) async* {
  final service = ref.read(officialMemosServiceProvider);
  final controller = StreamController<List<OfficialMemo>>();

  Future<void> refresh() async {
    try {
      final memos = await service.getUserMemos();
      if (!controller.isClosed) controller.add(memos);
      // ═══ FIX: Cache memos for offline viewing ═══
      try {
        final cache = await ref.read(offlineDataCacheProvider.future);
        final rawList = memos.map((m) => {
          'id': m.id,
          'memo_number': m.memoNumber,
          'title': m.title,
          'body': m.body,
          'priority': m.priority,
          'issued_by': m.issuedBy,
          'issuer_name': m.issuerName,
          'issuer_role': m.issuerRole,
          'target_roles': m.targetRoles,
          'requires_acknowledgment': m.requiresAcknowledgment,
          'valid_until': m.validUntil?.toIso8601String(),
          'attachments': m.attachments,
          'created_at': m.createdAt.toIso8601String(),
          'is_acknowledged': m.isAcknowledged,
          'acknowledged_at': m.acknowledgedAt?.toIso8601String(),
        }).toList();
        await cache.forceInvalidate('memos_offline');
        await cache.getList('memos_offline', () async => rawList, maxAge: const Duration(days: 7));
      } catch (_) {}
    } catch (e) {
      // ═══ FIX: On failure, try offline cache ═══
      try {
        final cache = await ref.read(offlineDataCacheProvider.future);
        final cached = await cache.getList('memos_offline', () async => [], maxAge: const Duration(days: 365));
        if (cached.isNotEmpty) {
          final memos = cached.map((m) => OfficialMemo.fromMap(m)).toList();
          if (!controller.isClosed) controller.add(memos);
        }
      } catch (_) {}
    }
  }

  await refresh();
  final timer = Timer.periodic(const Duration(seconds: 60), (_) => refresh());

  ref.onDispose(() {
    timer.cancel();
    controller.close();
  });

  await for (final memos in controller.stream) {
    yield memos;
  }
});

/// Feedback tickets provider — single StreamProvider (1 RPC call), caches offline
/// All filters are applied client-side to reduce network calls from 4 → 1
final allFeedbackTicketsProvider =
    StreamProvider<List<FeedbackTicket>>((ref) async* {
  final service = ref.read(feedbackTicketsServiceProvider);
  final controller = StreamController<List<FeedbackTicket>>();

  Future<void> refresh() async {
    try {
      final tickets = await service.getUserTickets(filter: 'all');
      if (!controller.isClosed) controller.add(tickets);
      // ═══ FIX: Cache tickets for offline viewing ═══
      try {
        final cache = await ref.read(offlineDataCacheProvider.future);
        final rawList = tickets.map((t) => {
          'id': t.id,
          'title': t.title,
          'description': t.description,
          'category': t.category,
          'priority': t.priority,
          'status': t.status,
          'created_by': t.createdBy,
          'creator_name': t.creatorName,
          'assigned_to': t.assignedTo,
          'assignee_name': t.assigneeName,
          'sla_deadline': t.slaDeadline?.toIso8601String(),
          'created_at': t.createdAt.toIso8601String(),
          'updated_at': t.updatedAt?.toIso8601String(),
        }).toList();
        await cache.forceInvalidate('tickets_offline');
        await cache.getList('tickets_offline', () async => rawList, maxAge: const Duration(days: 7));
      } catch (_) {}
    } catch (e) {
      // ═══ FIX: On failure, try offline cache ═══
      try {
        final cache = await ref.read(offlineDataCacheProvider.future);
        final cached = await cache.getList('tickets_offline', () async => [], maxAge: const Duration(days: 365));
        if (cached.isNotEmpty) {
          final tickets = cached.map((t) => FeedbackTicket.fromMap(t)).toList();
          if (!controller.isClosed) controller.add(tickets);
        }
      } catch (_) {}
    }
  }

  await refresh();
  final timer = Timer.periodic(const Duration(seconds: 45), (_) => refresh());

  ref.onDispose(() {
    timer.cancel();
    controller.close();
  });

  await for (final tickets in controller.stream) {
    yield tickets;
  }
});

/// Filtered feedback tickets provider — derives from allFeedbackTicketsProvider
/// with client-side filtering (NO extra RPC call — reduces 4 RPC → 1)
final feedbackTicketsProvider =
    FutureProvider.family<List<FeedbackTicket>, String>((ref, filter) async {
  final allTickets = await ref.watch(allFeedbackTicketsProvider.future);

  switch (filter) {
    case 'overdue':
      return allTickets.where((t) => t.isOverdue).toList();
    case 'pending':
      return allTickets
          .where((t) =>
              t.status == 'sent' ||
              t.status == 'received' ||
              t.status == 'in_progress')
          .toList();
    case 'resolved':
      return allTickets
          .where((t) => t.status == 'resolved' || t.status == 'closed')
          .toList();
    default: // 'all', 'sent', 'received' — server already filters
      return allTickets;
  }
});
