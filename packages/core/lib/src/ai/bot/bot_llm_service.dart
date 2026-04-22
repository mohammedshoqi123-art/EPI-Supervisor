// ══════════════════════════════════════════════════════════════════════════
//  Bot LLM Service — خدمة الذكاء الاصطناعي للبوت
//  نسخة مُكيّفة من EPI-Bot لتعمل مع EPI-Supervisor
// ══════════════════════════════════════════════════════════════════════════

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'knowledge_base.dart';
import 'smart_nlp.dart';
import 'real_data_kb.dart';
import 'advanced_immunization_kb.dart';
import 'intermediate_management_kb.dart';

enum BotAIStatus { online, offline, error, loading }

class BotAIResponse {
  final String text;
  final bool isFromLLM;
  final List<String> relevantTopics;
  final BotAIStatus status;

  const BotAIResponse({
    required this.text,
    this.isFromLLM = false,
    this.relevantTopics = const [],
    this.status = BotAIStatus.offline,
  });
}

class BotLLMService {
  static String _apiKey = '';
  static String _apiBaseUrl = 'https://api.openai.com/v1';
  static String _model = 'gpt-4o-mini';
  static double _temperature = 0.6;
  static int _maxTokens = 2048;
  static BotAIStatus _status = BotAIStatus.offline;

  static String get apiKey => _apiKey;
  static String get apiBaseUrl => _apiBaseUrl;
  static String get model => _model;
  static BotAIStatus get currentStatus => _status;
  static bool get isOnline => _status == BotAIStatus.online;
  static bool get isConfigured => _apiKey.isNotEmpty;

  static void configure({
    required String apiKey,
    String? baseUrl,
    String? model,
    double? temperature,
    int? maxTokens,
  }) {
    _apiKey = apiKey;
    if (baseUrl != null) _apiBaseUrl = baseUrl;
    if (model != null) _model = model;
    if (temperature != null) _temperature = temperature;
    if (maxTokens != null) _maxTokens = maxTokens;
  }

  static Future<bool> testConnection() async {
    if (_apiKey.isEmpty) {
      _status = BotAIStatus.offline;
      return false;
    }
    _status = BotAIStatus.loading;
    try {
      final response = await http.post(
        Uri.parse('$_apiBaseUrl/chat/completions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_apiKey',
        },
        body: jsonEncode({
          'model': _model,
          'messages': [
            {'role': 'user', 'content': 'مرحبا'}
          ],
          'max_tokens': 10,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        _status = BotAIStatus.online;
        return true;
      }
      _status = BotAIStatus.error;
      return false;
    } catch (_) {
      _status = BotAIStatus.offline;
      return false;
    }
  }

  static Future<BotAIResponse> sendMessage({
    required String userMessage,
    required List<Map<String, String>> conversationHistory,
    Map<String, dynamic>? childProfile,
  }) async {
    if (!isOnline || _apiKey.isEmpty) {
      return const BotAIResponse(text: '', isFromLLM: false, status: BotAIStatus.offline);
    }

    try {
      // Build RAG context
      final ragContext = _buildRAGContext(userMessage);
      final systemPrompt = _buildSystemPrompt(ragContext, childProfile);

      final messages = <Map<String, String>>[
        {'role': 'system', 'content': systemPrompt},
      ];

      // Add last 10 messages for context
      final recentHistory = conversationHistory.length > 10
          ? conversationHistory.sublist(conversationHistory.length - 10)
          : conversationHistory;
      messages.addAll(recentHistory);

      messages.add({'role': 'user', 'content': userMessage});

      final response = await http.post(
        Uri.parse('$_apiBaseUrl/chat/completions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_apiKey',
        },
        body: jsonEncode({
          'model': _model,
          'messages': messages,
          'temperature': _temperature,
          'max_tokens': _maxTokens,
        }),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final content = data['choices'][0]['message']['content'] as String;
        return BotAIResponse(
          text: content,
          isFromLLM: true,
          status: BotAIStatus.online,
        );
      }

      return const BotAIResponse(text: '', isFromLLM: false, status: BotAIStatus.error);
    } catch (_) {
      return const BotAIResponse(text: '', isFromLLM: false, status: BotAIStatus.error);
    }
  }

  static String _buildRAGContext(String query) {
    final norm = SmartNLP.normalize(query);
    final buffer = StringBuffer();
    int found = 0;

    // Search main knowledge base
    for (final entry in fullKnowledgeBase.entries) {
      if (found >= 5) break;
      final keyNorm = SmartNLP.normalize(entry.key);
      final words = norm.split(' ');
      bool match = false;
      for (final word in words) {
        if (word.length > 2 && keyNorm.contains(word)) {
          match = true;
          break;
        }
      }
      if (match) {
        buffer.writeln('【${entry.key}】');
        buffer.writeln(entry.value.substring(0, entry.value.length > 500 ? 500 : entry.value.length));
        buffer.writeln();
        found++;
      }
    }

    // Search advanced KB
    for (final entry in advancedImmunizationKB.entries) {
      if (found >= 8) break;
      final valNorm = SmartNLP.normalize(entry.value);
      int hits = 0;
      for (final word in norm.split(' ')) {
        if (word.length > 3 && valNorm.contains(word)) hits++;
      }
      if (hits >= 2) {
        buffer.writeln('【${entry.key}】');
        buffer.writeln(entry.value.substring(0, entry.value.length > 400 ? 400 : entry.value.length));
        buffer.writeln();
        found++;
      }
    }

    return buffer.toString();
  }

  static String _buildSystemPrompt(String ragContext, Map<String, dynamic>? childProfile) {
    final buf = StringBuffer();
    buf.writeln('أنت "مستشار التحصين الصحي الموسع" — مساعد ذكي متخصص في برنامج التحصين باليمن 🇾🇪');
    buf.writeln();
    buf.writeln('تعليمات:');
    buf.writeln('- أجب باللغة العربية دائماً');
    buf.writeln('- كن دقيقاً طبياً واستند للإرشادات الرسمية');
    buf.writeln('- استخدم نبرة ودودة ومهنية');
    buf.writeln('- إذا كان السؤال طارئاً (تشنجات، صعوبة تنفس) حث على طلب المساعدة الطبية فوراً');
    buf.writeln('- لا تشخص الأمراض ولا تصف أدوية');
    buf.writeln('- استخدم الإيموجي بشكل مناسب');

    if (childProfile != null && childProfile.isNotEmpty) {
      buf.writeln();
      buf.writeln('معلومات الطفل:');
      if (childProfile['name'] != null) buf.writeln('- الاسم: ${childProfile['name']}');
      if (childProfile['ageMonths'] != null) buf.writeln('- العمر: ${childProfile['ageMonths']} أشهر');
      if (childProfile['gender'] != null) buf.writeln('- الجنس: ${childProfile['gender']}');
      if (childProfile['mentionedSymptoms'] != null) buf.writeln('- الأعراض: ${childProfile['mentionedSymptoms']}');
    }

    if (ragContext.isNotEmpty) {
      buf.writeln();
      buf.writeln('=== معلومات مرجعية من قاعدة المعرفة ===');
      buf.writeln(ragContext);
      buf.writeln('=== نهاية المعلومات المرجعية ===');
    }

    return buf.toString();
  }

  static List<String> generateQuickReplySuggestions(String userMessage, String botResponse) {
    final suggestions = <String>[];
    final norm = SmartNLP.normalize(userMessage);
    final respNorm = SmartNLP.normalize(botResponse);

    if (respNorm.contains('اثار') || respNorm.contains('جانبي')) {
      suggestions.add('متى أخاف؟');
    }
    if (respNorm.contains('تطعيم') || respNorm.contains('لقاح')) {
      suggestions.add('وش الآثار الجانبية؟');
    }
    if (respNorm.contains('حراره')) {
      suggestions.add('متى أروح للطبيب؟');
    }
    if (respNorm.contains('مجاني') || respNorm.contains('مجانا')) {
      suggestions.add('وين أطعم؟');
    }

    if (suggestions.isEmpty) {
      suggestions.addAll(['وش تطعيمات طفلي؟', 'وش الآثار الجانبية؟', 'هل مجاني؟']);
    }

    return suggestions.take(3).toList();
  }
}
