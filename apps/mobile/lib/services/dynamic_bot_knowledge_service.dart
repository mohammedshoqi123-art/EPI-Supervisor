import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';

/// ═══════════════════════════════════════════════════════════
/// DynamicBotKnowledge — قاعدة المعرفة الديناميكية
///
///  تجمع بين:
///  1. المعرفة الثابتة (من الكود - knowledge_base.dart)
///  2. المعرفة الديناميكية (من bot_knowledge table)
///
///  عند البحث: تُدمج النتائج من المصدرين مع ترتيب حسب relevance
/// ═══════════════════════════════════════════════════════════

class BotKnowledgeEntry {
  final String? id;
  final String topic;
  final String title;
  final String content;
  final String category;
  final List<String> keywords;
  final int priority;
  final bool isDynamic; // true = from DB, false = from code

  const BotKnowledgeEntry({
    this.id,
    required this.topic,
    required this.title,
    required this.content,
    this.category = 'general',
    this.keywords = const [],
    this.priority = 50,
    this.isDynamic = false,
  });

  factory BotKnowledgeEntry.fromMap(Map<String, dynamic> m) {
    return BotKnowledgeEntry(
      id: m['id'] as String?,
      topic: m['topic'] as String? ?? '',
      title: m['title'] as String? ?? m['topic'] as String? ?? '',
      content: m['content'] as String? ?? '',
      category: m['category'] as String? ?? 'general',
      keywords: ((m['keywords'] as List?) ?? [])
          .map((e) => e.toString())
          .toList(),
      priority: (m['priority'] as num?)?.toInt() ?? 50,
      isDynamic: true,
    );
  }
}

class BotConversationContext {
  final String? conversationId;
  final String? title;
  final String? summary;
  final Map<String, dynamic> childProfile;
  final String? lastTopic;
  final int messageCount;
  final DateTime? updatedAt;

  const BotConversationContext({
    this.conversationId,
    this.title,
    this.summary,
    this.childProfile = const {},
    this.lastTopic,
    this.messageCount = 0,
    this.updatedAt,
  });

  factory BotConversationContext.fromMap(Map<String, dynamic> m) {
    return BotConversationContext(
      conversationId: m['id'] as String?,
      title: m['title'] as String?,
      summary: m['summary'] as String?,
      childProfile: (m['child_profile'] as Map<String, dynamic>?) ?? {},
      lastTopic: m['last_topic'] as String?,
      messageCount: (m['message_count'] as num?)?.toInt() ?? 0,
      updatedAt: m['updated_at'] != null
          ? DateTime.tryParse(m['updated_at'].toString())
          : null,
    );
  }

  bool get hasContext =>
      summary != null ||
      lastTopic != null ||
      childProfile.isNotEmpty;
}

/// ═══════════════════════════════════════════════════════════
/// DynamicBotKnowledgeService
/// ═══════════════════════════════════════════════════════════

class DynamicBotKnowledgeService {
  final ApiClient _api;

  DynamicBotKnowledgeService(this._api);

  /// Search across both static (code) and dynamic (DB) knowledge
  /// Returns merged results sorted by relevance
  Future<List<BotKnowledgeEntry>> search(String query,
      {int limit = 5}) async {
    try {
      // 1. Search dynamic knowledge (DB) via RPC
      final dynamicResults = await _api.rpc('search_bot_knowledge', params: {
        'p_query': query,
        'p_limit': limit,
      });

      final dynamicEntries = dynamicResults
          .map((e) => BotKnowledgeEntry.fromMap(e as Map<String, dynamic>))
          .toList();

      // 2. Also search static knowledge (code) as fallback
      final staticEntry = _searchStaticKB(query);

      // 3. Merge: dynamic first (higher relevance), then static
      final all = <BotKnowledgeEntry>[...dynamicEntries];
      if (staticEntry != null && all.length < limit) {
        all.add(staticEntry);
      }

      return all.take(limit).toList();
    } catch (e) {
      debugPrint('[DynamicBotKnowledge] search error: $e');
      // Fallback: static KB only
      final staticEntry = _searchStaticKB(query);
      return staticEntry != null ? [staticEntry] : [];
    }
  }

  /// Search static knowledge base (from code)
  BotKnowledgeEntry? _searchStaticKB(String query) {
    try {
      // Import the static KB
      // Note: We can't import directly due to package boundaries
      // So we use a simple keyword match
      return null; // Will be handled by BotEngine's _smartSearch
    } catch (_) {
      return null;
    }
  }

  /// Get all dynamic knowledge entries (for admin management)
  Future<List<BotKnowledgeEntry>> getAllEntries() async {
    try {
      final client = Supabase.instance.client;
      final response = await client
          .from('bot_knowledge')
          .select('*')
          .eq('is_active', true)
          .order('priority', ascending: false)
          .order('topic');
      return (response as List)
          .map((e) => BotKnowledgeEntry.fromMap(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('[DynamicBotKnowledge] getAllEntries error: $e');
      return [];
    }
  }

  /// Create a new knowledge entry (admin only)
  Future<String?> createEntry({
    required String topic,
    required String title,
    required String content,
    String category = 'general',
    List<String> keywords = const [],
    int priority = 50,
  }) async {
    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      final response = await client.from('bot_knowledge').insert({
        'topic': topic,
        'title': title,
        'content': content,
        'category': category,
        'keywords': keywords,
        'priority': priority,
        'source': 'manual',
        'created_by': userId,
      }).select('id').single();
      return response['id'] as String?;
    } catch (e) {
      debugPrint('[DynamicBotKnowledge] createEntry error: $e');
      rethrow;
    }
  }

  /// Update an existing entry
  Future<void> updateEntry({
    required String id,
    String? topic,
    String? title,
    String? content,
    String? category,
    List<String>? keywords,
    int? priority,
  }) async {
    try {
      final client = Supabase.instance.client;
      final updates = <String, dynamic>{};
      if (topic != null) updates['topic'] = topic;
      if (title != null) updates['title'] = title;
      if (content != null) updates['content'] = content;
      if (category != null) updates['category'] = category;
      if (keywords != null) updates['keywords'] = keywords;
      if (priority != null) updates['priority'] = priority;
      await client.from('bot_knowledge').update(updates).eq('id', id);
    } catch (e) {
      debugPrint('[DynamicBotKnowledge] updateEntry error: $e');
      rethrow;
    }
  }

  /// Delete (deactivate) an entry
  Future<void> deleteEntry(String id) async {
    try {
      final client = Supabase.instance.client;
      await client.from('bot_knowledge').update({'is_active': false}).eq('id', id);
    } catch (e) {
      debugPrint('[DynamicBotKnowledge] deleteEntry error: $e');
      rethrow;
    }
  }

  // ═══ Conversation Memory ═══

  /// Save conversation context (auto-creates or updates)
  Future<String?> saveConversation({
    Map<String, dynamic> childProfile = const {},
    String? lastTopic,
    String? title,
    String? summary,
  }) async {
    try {
      final result = await _api.rpc('save_bot_conversation', params: {
        'p_child_profile': childProfile,
        'p_last_topic': lastTopic,
        'p_title': title,
        'p_summary': summary,
      });
      if (result.isNotEmpty) {
        return result.first['save_bot_conversation'] as String?;
      }
      return null;
    } catch (e) {
      debugPrint('[DynamicBotKnowledge] saveConversation error: $e');
      return null;
    }
  }

  /// Get the last conversation context for current user
  Future<BotConversationContext?> getLastConversation() async {
    try {
      final result = await _api.rpc('get_last_bot_conversation', params: {});
      if (result.isNotEmpty) {
        return BotConversationContext.fromMap(result.first);
      }
      return null;
    } catch (e) {
      debugPrint('[DynamicBotKnowledge] getLastConversation error: $e');
      return null;
    }
  }
}

/// ═══════════════════════════════════════════════════════════
/// Riverpod Providers
/// ═══════════════════════════════════════════════════════════

final dynamicBotKnowledgeServiceProvider =
    Provider<DynamicBotKnowledgeService>((ref) {
  return DynamicBotKnowledgeService(ref.read(apiClientProvider));
});

/// Provider for last conversation context
final lastBotConversationProvider =
    FutureProvider<BotConversationContext?>((ref) async {
  final service = ref.read(dynamicBotKnowledgeServiceProvider);
  return service.getLastConversation();
});
