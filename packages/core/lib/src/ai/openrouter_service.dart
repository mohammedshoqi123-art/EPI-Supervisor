import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../errors/app_exceptions.dart';

/// OpenRouter AI Service — Gateway to multiple LLM models
/// Supports free models, Claude, GPT-4, Llama, Mistral, etc.
class OpenRouterService {
  static const String _baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  /// Available models with descriptions
  static const Map<String, String> availableModels = {
    'deepseek/deepseek-chat': 'DeepSeek V3 (شبه مجاني، قوي جداً)',
    'deepseek/deepseek-r1': 'DeepSeek R1 (تفكير عميق)',
    'google/gemini-2.0-flash-exp:free': 'Gemini Flash (مجاني)',
    'meta-llama/llama-3.3-70b-instruct:free': 'Llama 3.3 70B (مجاني)',
    'mistralai/mistral-7b-instruct:free': 'Mistral 7B (مجاني)',
    'qwen/qwen-2.5-72b-instruct:free': 'Qwen 2.5 72B (مجاني)',
    'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet (مميز)',
    'openai/gpt-4o': 'GPT-4o (مميز)',
  };

  /// Free models only (for auto-selection)
  static const List<String> freeModels = [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free',
  ];

  final String _apiKey;
  final http.Client _httpClient;

  final List<Map<String, String>> _history = [];
  static const int _maxHistory = 10;

  OpenRouterService(this._apiKey, {http.Client? httpClient})
      : _httpClient = httpClient ?? http.Client();

  bool get isAvailable => _apiKey.isNotEmpty;

  Map<String, String> get _headers => {
        'Authorization': 'Bearer $_apiKey',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://epi-supervisor.yemen.org',
        'X-Title': 'EPI Supervisor Yemen',
      };

  // ═══════════════════════════════════════════════════════════
  // CHAT
  // ═══════════════════════════════════════════════════════════

  Future<String> chat(
    String message, {
    String? systemPrompt,
    Map<String, dynamic>? context,
    String model = 'deepseek/deepseek-chat',
    int maxTokens = 800,
    double temperature = 0.4,
    bool clearHistory = false,
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

    try {
      final resp = await _httpClient
          .post(
            Uri.parse(_baseUrl),
            headers: _headers,
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 60));

      // Rate limit with exponential backoff
      if (resp.statusCode == 429 && retryCount < 3) {
        final delay = Duration(seconds: retryCount * 4);
        await Future.delayed(delay);
        // Try next free model on rate limit
        final fallbackModel = _getNextFreeModel(model);
        return chat(
          message,
          systemPrompt: systemPrompt,
          context: context,
          model: fallbackModel,
          maxTokens: maxTokens,
          temperature: temperature,
          clearHistory: false,
          retryCount: retryCount + 1,
        );
      }

      // Model not available — try next free model
      if ((resp.statusCode == 400 || resp.statusCode == 404) && retryCount == 0) {
        return chat(
          message,
          systemPrompt: systemPrompt,
          context: context,
          model: _getNextFreeModel(model),
          maxTokens: maxTokens,
          temperature: temperature,
          retryCount: 1,
        );
      }

      if (resp.statusCode != 200) {
        throw AIException('OpenRouter error ${resp.statusCode}: ${resp.body}');
      }

      final data = jsonDecode(resp.body);
      final content = data['choices']?[0]?['message']?['content'] ?? '';

      _history.add({'role': 'user', 'content': message});
      _history.add({'role': 'assistant', 'content': content});
      if (_history.length > _maxHistory) {
        _history.removeRange(0, _history.length - _maxHistory);
      }

      return content;
    } on TimeoutException {
      throw AIException('OpenRouter timeout');
    } catch (e) {
      if (e is AIException) rethrow;
      throw AIException('OpenRouter error: $e');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STREAMING
  // ═══════════════════════════════════════════════════════════

  Stream<String> chatStream(
    String message, {
    String? systemPrompt,
    Map<String, dynamic>? context,
    String model = 'deepseek/deepseek-chat',
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

    final request = http.Request('POST', Uri.parse(_baseUrl))
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
      yield 'خطأ في الاتصال بـ OpenRouter.';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // FAST CHAT — uses free models
  // ═══════════════════════════════════════════════════════════

  Future<String> fastChat(String message, {String? systemPrompt}) async {
    return chat(
      message,
      systemPrompt: systemPrompt,
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      maxTokens: 300,
      temperature: 0.3,
    );
  }

  // ═══════════════════════════════════════════════════════════
  // INTENT EXTRACTION
  // ═══════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> extractIntent(String message) async {
    final response = await chat(
      '''Extract intent and entities from this Arabic message about EPI vaccination system.
Return JSON only with:
- intent: one of [query_submissions, query_shortages, query_analytics, generate_report, query_governorates, query_users, ask_guide, analyze_trend, compare_data, query_health, general_question]
- entities: {governorate?, district?, status?, severity?, date_range?, period?}
- confidence: 0.0-1.0

Message: $message''',
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      maxTokens: 300,
      temperature: 0.2,
      clearHistory: true,
    );

    try {
      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(response);
      if (jsonMatch != null) {
        return jsonDecode(jsonMatch.group(0)!);
      }
    } catch (_) {}
    return {'intent': 'general_question', 'confidence': 0.5};
  }

  // ═══════════════════════════════════════════════════════════
  // REPORT GENERATION
  // ═══════════════════════════════════════════════════════════

  Future<String> generateReport({
    required String templateType,
    required Map<String, dynamic> data,
  }) async {
    final prompts = {
      'daily': 'أنشئ تقريراً يومياً مفصلاً: ملخص الإرساليات، النواقص الحرجة، 3 توصيات عملية.',
      'weekly': 'حلل اتجاه الأسبوع: هل الإرساليات في تحسن؟ ما الأسباب؟ توصيات.',
      'governorate': 'رتب المحافظات بالأداء. الأفضل والأسوأ. نسب وسبب التفاوت.',
      'shortages': 'حلل النواقص: حسب الخطورة والموقع. أولويات المعالجة.',
      'coverage': 'حلل تغطية التطعيم: Penta3، dropout، حصبة. فجوات وتدخلات.',
      'supervision': 'أنشئ تقرير إشرافي: أداء الزيارات، الملاحظات، خطط التحسين.',
      'polio': 'حلل حملات الشلل: التغطية، المحافظات الأضعف، التوصيات.',
    };

    return chat(
      prompts[templateType] ?? 'أنشئ تقريراً بالبيانات المتاحة.',
      systemPrompt: 'أنت محلل بيانات متخصص في التطعيم اليمن. أجب بالعربية بتنظيم واضح مع عناوين وأرقام.',
      context: data,
      model: 'deepseek/deepseek-chat',
      maxTokens: 1200,
      temperature: 0.3,
      clearHistory: true,
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SMART SUGGESTIONS
  // ═══════════════════════════════════════════════════════════

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
        systemPrompt: 'أنت مساعد EPI الذكي. قدم اقتراحات مختصرة وعملية بالعربية.',
        model: 'meta-llama/llama-3.3-70b-instruct:free',
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

  // ═══════════════════════════════════════════════════════════
  // MODEL HELPERS
  // ═══════════════════════════════════════════════════════════

  String _getNextFreeModel(String currentModel) {
    final idx = freeModels.indexOf(currentModel);
    if (idx < 0 || idx >= freeModels.length - 1) {
      return freeModels[0];
    }
    return freeModels[idx + 1];
  }

  /// Get list of available model names for settings UI
  static List<Map<String, String>> getModelList() {
    return availableModels.entries
        .map((e) => {
              'id': e.key,
              'name': e.value,
              'isFree': e.key.endsWith(':free') ? 'true' : 'false',
            })
        .toList();
  }

  String _formatContext(Map<String, dynamic> ctx) {
    final parts = <String>[];
    if (ctx['submissions'] != null) {
      final s = ctx['submissions'] as Map;
      parts.add('إرسالات: كلي=${s['total']} اليوم=${s['today']}');
    }
    if (ctx['shortages'] != null) {
      final s = ctx['shortages'] as Map;
      parts.add('نواقص: كلي=${s['total']} محلول=${s['resolved']}');
    }
    return parts.join('\n');
  }

  void clearHistory() => _history.clear();
  void dispose() => _httpClient.close();
}
