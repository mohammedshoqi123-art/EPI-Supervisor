import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';

/// ═══════════════════════════════════════════════════════════
/// AIChatThread — Model
/// ═══════════════════════════════════════════════════════════

class AIChatThread {
  final String id;
  final String title;
  final String? lastSummary;
  final int messageCount;
  final bool isActive;
  final bool isPinned;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AIChatThread({
    required this.id,
    required this.title,
    this.lastSummary,
    required this.messageCount,
    required this.isActive,
    required this.isPinned,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AIChatThread.fromMap(Map<String, dynamic> m) {
    return AIChatThread(
      id: m['id'] as String,
      title: m['title'] as String? ?? 'محادثة جديدة',
      lastSummary: m['last_summary'] as String?,
      messageCount: (m['message_count'] as num?)?.toInt() ?? 0,
      isActive: m['is_active'] as bool? ?? true,
      isPinned: m['is_pinned'] as bool? ?? false,
      createdAt: DateTime.tryParse(m['created_at']?.toString() ?? '') ??
          DateTime.now(),
      updatedAt: DateTime.tryParse(m['updated_at']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// AIChatThreadService — Service for conversation threads
/// ═══════════════════════════════════════════════════════════

class AIChatThreadService {
  final ApiClient _api;

  AIChatThreadService(this._api);

  /// Get all threads for current user
  Future<List<AIChatThread>> getThreads() async {
    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      if (userId == null) return [];

      final response = await client
          .from('ai_chat_threads')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('is_pinned', ascending: false)
          .order('updated_at', ascending: false)
          .limit(50);

      return (response as List)
          .map((e) => AIChatThread.fromMap(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('[AIChatThreadService] getThreads error: $e');
      return [];
    }
  }

  /// Create a new thread
  Future<String?> createThread({String? title}) async {
    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      if (userId == null) return null;

      final response = await client.from('ai_chat_threads').insert({
        'user_id': userId,
        'title': title ?? 'محادثة جديدة',
        'is_active': true,
        'is_pinned': false,
      }).select('id').single().timeout(const Duration(seconds: 15));

      return response['id'] as String?;
    } catch (e) {
      debugPrint('[AIChatThreadService] createThread error: $e');
      return null;
    }
  }

  /// Update thread title
  Future<void> updateTitle(String threadId, String title) async {
    try {
      final client = Supabase.instance.client;
      await client
          .from('ai_chat_threads')
          .update({'title': title}).eq('id', threadId);
    } catch (e) {
      debugPrint('[AIChatThreadService] updateTitle error: $e');
    }
  }

  /// Toggle pin
  Future<void> togglePin(String threadId, bool pinned) async {
    try {
      final client = Supabase.instance.client;
      await client
          .from('ai_chat_threads')
          .update({'is_pinned': pinned}).eq('id', threadId);
    } catch (e) {
      debugPrint('[AIChatThreadService] togglePin error: $e');
    }
  }

  /// Delete (soft delete) a thread
  Future<void> deleteThread(String threadId) async {
    try {
      final client = Supabase.instance.client;
      await client
          .from('ai_chat_threads')
          .update({'is_active': false}).eq('id', threadId);
    } catch (e) {
      debugPrint('[AIChatThreadService] deleteThread error: $e');
    }
  }

  /// Save a message to a thread
  Future<void> saveMessage({
    required String threadId,
    required String role,
    required String content,
    String? source,
    String? provider,
    int? providerTier,
    int? confidence,
    int? latencyMs,
    List<dynamic>? groundingSources,
    List<String>? followups,
  }) async {
    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      if (userId == null) return;

      await client.from('ai_chat_messages').insert({
        'thread_id': threadId,
        'user_id': userId,
        'role': role,
        'content': content,
        if (source != null) 'source': source,
        if (provider != null) 'provider': provider,
        if (providerTier != null) 'provider_tier': providerTier,
        if (confidence != null) 'confidence': confidence,
        if (latencyMs != null) 'latency_ms': latencyMs,
        if (groundingSources != null) 'grounding_sources': groundingSources,
        if (followups != null) 'followups': followups,
      }).timeout(const Duration(seconds: 15));
    } catch (e) {
      debugPrint('[AIChatThreadService] saveMessage error: $e');
    }
  }

  /// Load messages for a thread
  Future<List<Map<String, dynamic>>> getMessages(String threadId) async {
    try {
      final client = Supabase.instance.client;
      final response = await client
          .from('ai_chat_messages')
          .select('*')
          .eq('thread_id', threadId)
          .order('created_at', ascending: true)
          .limit(100);

      return (response as List).cast<Map<String, dynamic>>();
    } catch (e) {
      debugPrint('[AIChatThreadService] getMessages error: $e');
      return [];
    }
  }

  /// Update thread summary (for memory across sessions)
  Future<void> updateSummary(String threadId, String summary) async {
    try {
      final client = Supabase.instance.client;
      await client
          .from('ai_chat_threads')
          .update({'last_summary': summary}).eq('id', threadId);
    } catch (e) {
      debugPrint('[AIChatThreadService] updateSummary error: $e');
    }
  }
}

/// ═══════════════════════════════════════════════════════════
/// Riverpod Providers
/// ═══════════════════════════════════════════════════════════

final aiChatThreadServiceProvider = Provider<AIChatThreadService>((ref) {
  return AIChatThreadService(ref.read(apiClientProvider));
});

/// Stream of threads (auto-refreshes every 30 seconds)
final aiChatThreadsProvider =
    StreamProvider<List<AIChatThread>>((ref) async* {
  final service = ref.read(aiChatThreadServiceProvider);
  final controller = StreamController<List<AIChatThread>>();

  Future<void> refresh() async {
    final threads = await service.getThreads();
    if (!controller.isClosed) controller.add(threads);
  }

  await refresh();
  final timer = Timer.periodic(const Duration(seconds: 30), (_) => refresh());

  ref.onDispose(() {
    timer.cancel();
    controller.close();
  });

  await for (final threads in controller.stream) {
    yield threads;
  }
});
