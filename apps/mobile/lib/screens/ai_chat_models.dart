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

  ChatMsg({
    required this.role,
    required this.content,
    this.source,
    DateTime? time,
    String? id,
  })  : time = time ?? DateTime.now(),
        id = id ?? DateTime.now().millisecondsSinceEpoch.toString();

  Map<String, dynamic> toJson() => {
        'role': role,
        'content': content,
        'source': source,
        'time': time.toIso8601String(),
        'id': id,
      };

  factory ChatMsg.fromJson(Map<String, dynamic> j) => ChatMsg(
        role: j['role'] ?? 'assistant',
        content: j['content'] ?? '',
        source: j['source'],
        time: DateTime.tryParse(j['time'] ?? '') ?? DateTime.now(),
        id: j['id'],
      );

  /// Whether this message is from the user (vs. assistant/bot)
  bool get isUser => role == 'user';

  /// Whether this message is from an AI service (vs. local bot)
  bool get isFromAI => source != null && source != 'local' && source != 'greeting_handler';
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
