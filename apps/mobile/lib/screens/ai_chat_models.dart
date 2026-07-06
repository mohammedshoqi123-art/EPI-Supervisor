import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// ═══════════════════════════════════════════════════════════
///  Chat Message Model + Persistence
///
///  Extracted from ai_chat_screen_v3.dart for separation of concerns.
///  This file contains only the data model and storage logic —
///  the UI remains in ai_chat_screen_v3.dart.
/// ═══════════════════════════════════════════════════════════

class ChatMsg {
  final String role;
  final String content;
  final String? source;
  final DateTime time;
  final String id;

  // ─── New: AI Gateway metadata (Patent-Pending Hybrid Gateway) ───
  final String? provider;            // e.g. 'groq', 'pollinations', 'zai'
  final int? providerTier;           // 1-4
  final int? providerConfidence;     // 0-100
  final int? latencyMs;              // response time in ms
  final bool? raced;                 // true if won parallel race
  final List<String>? attemptedProviders;  // all providers attempted
  final List<String>? toolsUsed;     // tool calls made

  ChatMsg({
    required this.role,
    required this.content,
    this.source,
    DateTime? time,
    String? id,
    this.provider,
    this.providerTier,
    this.providerConfidence,
    this.latencyMs,
    this.raced,
    this.attemptedProviders,
    this.toolsUsed,
  })  : time = time ?? DateTime.now(),
        id = id ?? DateTime.now().millisecondsSinceEpoch.toString();

  Map<String, dynamic> toJson() => {
        'role': role,
        'content': content,
        'source': source,
        'time': time.toIso8601String(),
        'id': id,
        if (provider != null) 'provider': provider,
        if (providerTier != null) 'provider_tier': providerTier,
        if (providerConfidence != null) 'provider_confidence': providerConfidence,
        if (latencyMs != null) 'latency_ms': latencyMs,
        if (raced != null) 'raced': raced,
        if (attemptedProviders != null) 'attempted_providers': attemptedProviders,
        if (toolsUsed != null) 'tools_used': toolsUsed,
      };

  factory ChatMsg.fromJson(Map<String, dynamic> j) => ChatMsg(
        role: j['role'] ?? 'assistant',
        content: j['content'] ?? '',
        source: j['source'],
        time: DateTime.tryParse(j['time'] ?? '') ?? DateTime.now(),
        id: j['id'],
        provider: j['provider'],
        providerTier: j['provider_tier'],
        providerConfidence: j['provider_confidence'],
        latencyMs: j['latency_ms'],
        raced: j['raced'],
        attemptedProviders: j['attempted_providers'] != null
            ? List<String>.from(j['attempted_providers'])
            : null,
        toolsUsed: j['tools_used'] != null
            ? List<String>.from(j['tools_used'])
            : null,
      );

  /// Whether this message is from the user (vs. assistant/bot)
  bool get isUser => role == 'user';

  /// Whether this message is from an AI service (vs. local bot)
  bool get isFromAI => source != null && source != 'local' && source != 'greeting_handler';

  /// Whether this message won a parallel race (multiple providers competed)
  bool get didRace => raced == true && (attemptedProviders?.length ?? 0) > 1;

  /// Whether this response is high-confidence (>=80%)
  bool get isHighConfidence => (providerConfidence ?? 0) >= 80;

  /// Whether this response is low-confidence (<50%) — UI should warn user
  bool get isLowConfidence => (providerConfidence ?? 100) < 50 && providerConfidence != null;

  /// Human-readable latency label
  String get latencyLabel {
    final ms = latencyMs;
    if (ms == null) return '';
    if (ms < 1000) return '${ms}ms';
    return '${(ms / 1000).toStringAsFixed(1)}s';
  }

  /// Provider display info with icon
  ({String label, String emoji, int color}) get providerInfo {
    switch (provider) {
      case 'groq':
        return (label: 'Groq Llama 3.3', emoji: '⚡', color: 0xFFF97316);
      case 'pollinations':
        return (label: 'Pollinations GPT', emoji: '🌸', color: 0xFFEC4899);
      case 'zai':
        return (label: 'ZAI GLM-4', emoji: '🤖', color: 0xFF3B82F6);
      case 'huggingface':
        return (label: 'HuggingFace Llama', emoji: '🤗', color: 0xFFFFD21E);
      case 'openrouter':
        return (label: 'DeepSeek', emoji: '🌐', color: 0xFF8B5CF6);
      case 'mimo':
        return (label: 'MiMo AI', emoji: '📡', color: 0xFF06B6D4);
      default:
        return (label: source ?? 'AI', emoji: '✨', color: 0xFF6B7280);
    }
  }
}

/// ═══════════════════════════════════════════════════════════
///  CHAT PERSISTENCE
/// ═══════════════════════════════════════════════════════════

class ChatStore {
  static const _box = 'ai_chat_v3';
  static const _key = 'msgs';

  /// Load all messages from local storage.
  /// Returns empty list on error or if no messages are stored.
  static Future<List<ChatMsg>> load() async {
    try {
      final box = await Hive.openBox<String>(_box);
      final raw = box.get(_key);
      if (raw == null || raw.isEmpty) return [];
      return (jsonDecode(raw) as List)
          .map((j) => ChatMsg.fromJson(Map<String, dynamic>.from(j)))
          .toList();
    } catch (e) {
      if (kDebugMode) debugPrint('[ChatStore] load error: $e');
      return [];
    }
  }

  /// Save messages to local storage.
  /// Keeps only the last 60 messages to prevent unbounded storage growth.
  static Future<void> save(List<ChatMsg> msgs) async {
    try {
      final trimmed = msgs.length > 60 ? msgs.sublist(msgs.length - 60) : msgs;
      final box = await Hive.openBox<String>(_box);
      await box.put(_key, jsonEncode(trimmed.map((m) => m.toJson()).toList()));
    } catch (e) {
      if (kDebugMode) debugPrint('[ChatStore] save error: $e');
    }
  }

  /// Clear all stored messages.
  static Future<void> clear() async {
    try {
      final box = await Hive.openBox<String>(_box);
      await box.delete(_key);
      unawaited(box.close());
    } catch (e) {
      if (kDebugMode) debugPrint('[ChatStore] clear error: $e');
    }
  }

  /// Get the count of stored messages without loading them all.
  static Future<int> count() async {
    try {
      final box = await Hive.openBox<String>(_box);
      final raw = box.get(_key);
      if (raw == null || raw.isEmpty) return 0;
      return (jsonDecode(raw) as List).length;
    } catch (_) {
      return 0;
    }
  }
}
