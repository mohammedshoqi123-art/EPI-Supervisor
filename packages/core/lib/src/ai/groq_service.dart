import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;
import '../errors/app_exceptions.dart';

/// Groq LLM Service — Ultra-fast inference (~200ms)
/// Models: llama-3.3-70b (best), llama-3.1-8b (fastest), allam-2-7b (Arabic)
class GroqService {
  static const String _baseUrl = 'https://api.groq.com/openai/v1';

  /// Primary and fallback model IDs
  static const String _modelPrimary = 'llama-3.3-70b-versatile';
  static const String _modelFast = 'llama-3.1-8b-instant';
  static const String _modelFallback =
      'llama3-70b-8192'; // older stable Groq model

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

  /// Chat completion with exponential backoff + model fallback
  Future<String> chat(
    String message, {
    String? systemPrompt,
    Map<String, dynamic>? context,
    String model = _modelPrimary,
    int maxTokens = 800,
    double temperature = 0.4,
    bool clearHistory = false,
    bool jsonMode = false,
    int retryCount = 0,
  }) async {
    if (clearHistory) _history.clear();

    final messages = <Map<String, String>>[];

    if (systemPrompt != null) {
      messages.add({'role': 'system', 'content': systemPrompt});
    }

    if (context != null) {
      messages.add({
        'role': 'system',
        'content': 'البيانات الحالية:\n${_formatContext(context)}',
      });
    }

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

      // Exponential backoff on rate limit (max 3 retries)
      if (resp.statusCode == 429 && retryCount < 3) {
        final delay = Duration(seconds: pow(2, retryCount).toInt());
        await Future.delayed(delay);
        return chat(
          message,
          systemPrompt: systemPrompt,
          context: context,
          model: model,
          maxTokens: maxTokens,
          temperature: temperature,
          clearHistory: false,
          jsonMode: jsonMode,
          retryCount: retryCount + 1,
        );
      }

      // Fallback to secondary model on primary model errors
      if ((resp.statusCode == 400 || resp.statusCode == 404) &&
          model == _modelPrimary &&
          retryCount == 0) {
        return chat(
          message,
          systemPrompt: systemPrompt,
          context: context,
          model: _modelFallback,
          maxTokens: maxTokens,
          temperature: temperature,
          retryCount: 1,
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

  Future<String> fastChat(String message, {String? systemPrompt}) async {
    return chat(
      message,
      systemPrompt: systemPrompt,
      model: _modelFast,
      maxTokens: 300,
      temperature: 0.3,
    );
  }

  // ═══════════════════════════════════════════════════════════
  // JSON RESPONSE
  // ═══════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> chatJson(
    String message, {
    String? systemPrompt,
    String model = _modelPrimary,
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

  Stream<String> chatStream(
    String message, {
    String? systemPrompt,
    Map<String, dynamic>? context,
    String model = _modelFast,
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
  // INTENT EXTRACTION
  // ═══════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> extractIntent(String message) async {
    return chatJson(
      message,
      systemPrompt:
          '''Extract intent and entities from the Arabic message about EPI vaccination system.
Return JSON with:
- intent: one of [query_submissions, query_shortages, query_analytics, generate_report, query_governorates, query_users, ask_guide, analyze_trend, compare_data, query_health, general_question]
- entities: {governorate?, district?, status?, severity?, date_range?, period?}
- confidence: 0.0-1.0''',
      model: _modelFast,
    );
  }

  // ═══════════════════════════════════════════════════════════
  // REPORT GENERATION — Enhanced Templates
  // ═══════════════════════════════════════════════════════════

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
      'monthly_summary':
          'أنشئ ملخصاً شهرياً شاملاً: مقارنة بالشهر الماضي، أبرز الإنجازات، التحديات، وخطة الشهر القادم.',
      'field_coverage':
          'حلل التغطية الميدانية بالتفصيل: نسبة وصول كل لقاح (BCG, OPV, Penta, MR)، معدلات الانسحاب، والمناطق الأكثر خطورة. قدم تدخلات مقترحة.',
    };

    return chat(
      prompts[templateType] ?? 'أنشئ تقريراً بالبيانات المتاحة.',
      systemPrompt:
          'أنت محلل بيانات متخصص في التطعيم اليمن. أجب بالعربية بتنظيم واضح مع عناوين وأرقام.',
      context: data,
      model: _modelPrimary,
      maxTokens: 1200,
      temperature: 0.3,
      clearHistory: true,
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SMART SUGGESTIONS — Context-aware
  // ═══════════════════════════════════════════════════════════

  /// Returns 5 smart, context-aware suggestions based on live system data
  Future<List<String>> getSmartSuggestions({
    Map<String, dynamic>? context,
  }) async {
    final contextSummary = context != null ? _formatContext(context) : '';

    final prompt = contextSummary.isNotEmpty
        ? 'بناءً على هذه البيانات:\n$contextSummary\n\nاقترح 5 أسئلة ذكية ومفيدة يجب أن يسألها مشرف EPI الآن. كل سطر سؤال واحد. لا ترقيم.'
        : 'اقترح 5 أسئلة متنوعة وذكية لمشرف EPI. كل سطر سؤال واحد. لا ترقيم.';

    try {
      final resp = await chat(
        prompt,
        systemPrompt:
            'أنت مساعد EPI الذكي. قدم اقتراحات مختصرة وعملية بالعربية.',
        model: _modelFast,
        maxTokens: 250,
        temperature: 0.7,
        clearHistory: true,
      );
      return resp
          .split('\n')
          .map((s) => s.trim())
          .where((s) => s.length > 8)
          .take(5)
          .toList();
    } catch (_) {
      return _defaultSuggestions();
    }
  }

  List<String> _defaultSuggestions() => [
        '📊 ما حالة الإرساليات اليوم؟',
        '⚠️ أين النواقص الحرجة؟',
        '📈 اعرض تقرير أسبوعي',
        '🗺️ أي المحافظات تحتاج دعم؟',
        '💉 ما تغطية التطعيم؟',
      ];

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
