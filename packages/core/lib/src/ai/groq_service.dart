import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../errors/app_exceptions.dart';

/// Groq LLM Service — Ultra-fast inference (~200ms)
/// Models: llama-3.3-70b (best), llama-3.1-8b (fastest), allam-2-7b (Arabic)
class GroqService {
  static const String _baseUrl = 'https://api.groq.com/openai/v1';

  final String _apiKey;
  final http.Client _httpClient;

  final List<Map<String, String>> _history = [];
  static const int _maxHistory = 10;

  // Rate tracking
  int _tokensUsed = 0;
  DateTime _windowStart = DateTime.now();

  GroqService(this._apiKey, {http.Client? httpClient})
    : _httpClient = httpClient ?? http.Client();

  bool get isAvailable => _apiKey.isNotEmpty;

  Map<String, String> get _headers => {
    'Authorization': 'Bearer $_apiKey',
    'Content-Type': 'application/json',
  };

  // ═══════════════════════════════════════════════════════════
  // CHAT
  // ═══════════════════════════════════════════════════════════

  /// Chat completion — uses fast model for simple, versatile for complex
  Future<String> chat(
    String message, {
    String? systemPrompt,
    Map<String, dynamic>? context,
    String model = 'llama-3.3-70b-versatile',
    int maxTokens = 800,
    double temperature = 0.4,
    bool clearHistory = false,
    bool jsonMode = false,
  }) async {
    if (clearHistory) _history.clear();

    final messages = <Map<String, String>>[];

    if (systemPrompt != null) {
      messages.add({'role': 'system', 'content': systemPrompt});
    }

    // Add context as system message
    if (context != null) {
      messages.add({
        'role': 'system',
        'content': 'البيانات الحالية:\n${_formatContext(context)}',
      });
    }

    // History
    messages.addAll(_history.take(_maxHistory));
    messages.add({'role': 'user', 'content': message});

    final body = <String, dynamic>{
      'model': model,
      'messages': messages,
      'max_tokens': maxTokens,
      'temperature': temperature,
    };

    if (jsonMode) {
      body['response_format'] = {'type': 'json_object'};
    }

    try {
      final resp = await _httpClient
          .post(
            Uri.parse('$_baseUrl/chat/completions'),
            headers: _headers,
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 30));

      if (resp.statusCode == 429) {
        await Future.delayed(const Duration(seconds: 2));
        return chat(
          message,
          systemPrompt: systemPrompt,
          context: context,
          model: model,
        );
      }

      if (resp.statusCode != 200) {
        throw AIException('Groq error ${resp.statusCode}: ${resp.body}');
      }

      final data = jsonDecode(resp.body);
      final content = data['choices']?[0]?['message']['content'] ?? '';
      final usage = data['usage'];
      if (usage != null) _tokensUsed += (usage['total_tokens'] as int?) ?? 0;

      _history.add({'role': 'user', 'content': message});
      _history.add({'role': 'assistant', 'content': content});
      if (_history.length > _maxHistory) {
        _history.removeRange(0, _history.length - _maxHistory);
      }

      return content;
    } on TimeoutException {
      throw AIException('Groq timeout');
    } catch (e) {
      if (e is AIException) rethrow;
      throw AIException('Groq error: $e');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // FAST QUERY — uses 8b for speed
  // ═══════════════════════════════════════════════════════════

  /// Ultra-fast response using llama-3.1-8b-instant (~200ms)
  Future<String> fastChat(String message, {String? systemPrompt}) async {
    return chat(
      message,
      systemPrompt: systemPrompt,
      model: 'llama-3.1-8b-instant',
      maxTokens: 300,
      temperature: 0.3,
    );
  }

  // ═══════════════════════════════════════════════════════════
  // JSON RESPONSE — structured data
  // ═══════════════════════════════════════════════════════════

  /// Get structured JSON response
  Future<Map<String, dynamic>> chatJson(
    String message, {
    String? systemPrompt,
    String model = 'llama-3.3-70b-versatile',
  }) async {
    final response = await chat(
      message,
      systemPrompt: systemPrompt ?? 'Return valid JSON only. No markdown.',
      model: model,
      jsonMode: true,
      maxTokens: 500,
      temperature: 0.2,
    );
    try {
      return jsonDecode(response) as Map<String, dynamic>;
    } catch (_) {
      return {'text': response};
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STREAMING
  // ═══════════════════════════════════════════════════════════

  /// Stream chat response token by token
  Stream<String> chatStream(
    String message, {
    String? systemPrompt,
    Map<String, dynamic>? context,
    String model = 'llama-3.1-8b-instant',
    int maxTokens = 800,
  }) async* {
    final messages = <Map<String, String>>[];
    if (systemPrompt != null) {
      messages.add({'role': 'system', 'content': systemPrompt});
    }
    if (context != null) {
      messages.add({'role': 'system', 'content': _formatContext(context)});
    }
    messages.addAll(_history.take(_maxHistory));
    messages.add({'role': 'user', 'content': message});

    final body = jsonEncode({
      'model': model,
      'messages': messages,
      'max_tokens': maxTokens,
      'temperature': 0.4,
      'stream': true,
    });

    final request =
        http.Request('POST', Uri.parse('$_baseUrl/chat/completions'))
          ..headers.addAll(_headers)
          ..body = body;

    try {
      final streamed = await _httpClient.send(request);
      final decoder = const Utf8Decoder();
      String buffer = '';

      await for (final chunk in streamed.stream.transform(decoder)) {
        buffer += chunk;
        final lines = buffer.split('\n');
        buffer = lines.removeLast();

        for (final line in lines) {
          final trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          final data = trimmed.substring(6);
          if (data == '[DONE]') return;

          try {
            final json = jsonDecode(data);
            final content = json['choices']?[0]?['delta']?['content'];
            if (content != null && content.isNotEmpty) {
              yield content as String;
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      yield 'خطأ في الاتصال.';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // INTENT EXTRACTION (using Groq instead of HF for speed)
  // ═══════════════════════════════════════════════════════════

  /// Extract intent and entities from user message
  Future<Map<String, dynamic>> extractIntent(String message) async {
    return chatJson(
      message,
      systemPrompt:
          '''Extract intent and entities from the Arabic message about EPI vaccination system.
Return JSON with:
- intent: one of [query_submissions, query_shortages, query_analytics, generate_report, query_governorates, query_users, ask_guide, analyze_trend, compare_data, query_health, general_question]
- entities: {governorate?, district?, status?, severity?, date_range?, period?}
- confidence: 0.0-1.0''',
      model: 'llama-3.1-8b-instant',
    );
  }

  // ═══════════════════════════════════════════════════════════
  // REPORT GENERATION
  // ═══════════════════════════════════════════════════════════

  /// Generate a formatted report
  Future<String> generateReport({
    required String templateType,
    required Map<String, dynamic> data,
  }) async {
    final prompts = {
      'daily':
          'أنشئ تقريراً يومياً مفصلاً: ملخص الإرساليات، النواقص الحرجة، 3 توصيات عملية.',
      'weekly': 'حلل اتجاه الأسبوع: هل الإرساليات في تحسن؟ ما الأسباب؟ توصيات.',
      'governorate': 'رتب المحافظات بالأداء. الأفضل والأسوأ. نسب وسبب التفاوت.',
      'shortages': 'حلل النواقص: حسب الخطورة والموقع. أولويات المعالجة.',
      'quality': 'حلل جودة الإدخال: نسبة الرفض، اكتمال الحقول، أكثر الأخطاء.',
      'coverage': 'حلل تغطية التطعيم: Penta3، dropout، حصبة. فجوات وتدخلات.',
    };

    return chat(
      prompts[templateType] ?? 'أنشئ تقريراً بالبيانات المتاحة.',
      systemPrompt: 'أنت محلل بيانات متخصص في التطعيم اليمن. أجب بالعربية.',
      context: data,
      model: 'llama-3.3-70b-versatile',
      maxTokens: 1000,
      temperature: 0.3,
      clearHistory: true,
    );
  }

  String _formatContext(Map<String, dynamic> ctx) {
    final parts = <String>[];
    if (ctx['submissions'] != null) {
      final s = ctx['submissions'] as Map;
      parts.add('إرسالات: كلي=${s['total']} اليوم=${s['today']}');
      if (s['byStatus'] != null) {
        final by = s['byStatus'] as Map;
        parts.add(
          'حالات: ${by.entries.map((e) => '${e.key}=${e.value}').join(' ')}',
        );
      }
    }
    if (ctx['shortages'] != null) {
      final s = ctx['shortages'] as Map;
      parts.add(
        'نواقص: كلي=${s['total']} محلول=${s['resolved']} معلق=${s['pending']}',
      );
    }
    return parts.join('\n');
  }

  void clearHistory() => _history.clear();
  int get totalTokensUsed => _tokensUsed;
  void dispose() => _httpClient.close();
}
