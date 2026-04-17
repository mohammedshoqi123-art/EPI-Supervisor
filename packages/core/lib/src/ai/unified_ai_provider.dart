import 'groq_service.dart';
import 'huggingface/hf_service.dart';
import 'rag/rag_pipeline.dart';
import 'function_calling/function_calling_engine.dart';
import 'enhanced_local_ai.dart';
import '../offline/offline_manager.dart';

/// AI Provider priority: Groq (fast) → HuggingFace (tasks) → MiMo (fallback) → Local
enum AIProvider { groq, huggingface, mimo, local }

class UnifiedAIResponse {
  final String text;
  final AIProvider provider;
  final double confidence;
  final Map<String, dynamic>? metadata;
  final bool fromCache;

  UnifiedAIResponse({
    required this.text,
    required this.provider,
    this.confidence = 0.0,
    this.metadata,
    this.fromCache = false,
  });
}

/// Master AI service — intelligently routes to best provider
class UnifiedAIProvider {
  final GroqService? _groq;
  final HuggingFaceService? _hf;
  final RagPipeline? _rag;
  final FunctionCallingEngine? _fnCall;
  final EnhancedLocalAI _local;
  final OfflineManager _offline;

  // Simple response cache
  final Map<String, _CacheEntry> _cache = {};

  UnifiedAIProvider({
    GroqService? groq,
    HuggingFaceService? hf,
    RagPipeline? rag,
    FunctionCallingEngine? fnCall,
    OfflineManager? offline,
  }) : _groq = groq,
       _hf = hf,
       _rag = rag,
       _fnCall = fnCall,
       _local = EnhancedLocalAI(),
       _offline = offline ?? OfflineManager();

  bool get isOnline => _offline.isOnline;
  bool get hasGroq => _groq?.isAvailable ?? false;
  bool get hasHF => _hf != null;
  bool get hasRAG => _rag?.isReady ?? false;

  // ═══════════════════════════════════════════════════════════
  // MAIN QUERY
  // ═══════════════════════════════════════════════════════════

  Future<UnifiedAIResponse> query(
    String message, {
    Map<String, dynamic>? data,
    Future<dynamic> Function(String, Map<String, dynamic>)? dbExecutor,
    String? mode,
    String? template,
  }) async {
    // Cache check
    final cacheKey = '${message.hashCode}_${data?.hashCode ?? 0}';
    final cached = _cache[cacheKey];
    if (cached != null && !cached.isExpired) {
      return UnifiedAIResponse(
        text: cached.text,
        provider: cached.provider,
        fromCache: true,
      );
    }

    // OFFLINE: Use local AI
    if (!isOnline || (!hasGroq && !hasHF)) {
      return _handleOffline(message, data);
    }

    // ONLINE: Full pipeline
    try {
      return await _handleOnline(
        message,
        data: data,
        dbExecutor: dbExecutor,
        mode: mode,
        template: template,
      );
    } catch (e) {
      // Fallback to local on any error
      return _handleOffline(message, data);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STREAMING
  // ═══════════════════════════════════════════════════════════

  Stream<String> queryStream(
    String message, {
    Map<String, dynamic>? data,
    String? systemPrompt,
  }) {
    if (_groq?.isAvailable == true) {
      return _groq!.chatStream(
        message,
        systemPrompt: systemPrompt ?? _buildSystemPrompt(),
        context: data,
      );
    }
    // No streaming available, return single response as stream
    return Stream.fromFuture(query(message, data: data).then((r) => r.text));
  }

  // ═══════════════════════════════════════════════════════════
  // SPECIALIZED QUERIES
  // ═══════════════════════════════════════════════════════════

  /// Fast intent extraction
  Future<Map<String, dynamic>> extractIntent(String message) async {
    if (hasGroq) {
      return _groq!.extractIntent(message);
    }
    if (hasHF) {
      final result = await _hf!.getTopIntent(message);
      return {'intent': result.intent, 'confidence': result.confidence};
    }
    return {'intent': 'general_question', 'confidence': 0.5};
  }

  /// Generate report
  Future<String> generateReport(
    String templateType,
    Map<String, dynamic> data,
  ) async {
    if (hasGroq) {
      return _groq!.generateReport(templateType: templateType, data: data);
    }
    return _handleOffline('تقرير $templateType', data).then((r) => r.text);
  }

  /// Suggestions
  Future<List<String>> getSuggestions({Map<String, dynamic>? context}) async {
    if (hasGroq) {
      final resp = await _groq!.chat(
        'اقترح 5 اقتراحات متنوعة لمستخدم منصة مشرف EPI. كل سطر اقتراح واحد بدون ترقيم.',
        systemPrompt: 'أنت مساعد ذكي لمنصة إشراف التطعيم اليمن.',
        model: 'llama-3.1-8b-instant',
        maxTokens: 200,
        clearHistory: true,
      );
      return resp
          .split('\n')
          .where((s) => s.trim().length > 5)
          .take(5)
          .toList();
    }
    return _defaultSuggestions();
  }

  // ═══════════════════════════════════════════════════════════
  // INTERNAL HANDLERS
  // ═══════════════════════════════════════════════════════════

  Future<UnifiedAIResponse> _handleOnline(
    String message, {
    Map<String, dynamic>? data,
    Future<dynamic> Function(String, Map<String, dynamic>)? dbExecutor,
    String? mode,
    String? template,
  }) async {
    // Step 1: Intent (Groq fast or HF)
    final intent = await extractIntent(message);
    final intentStr = intent['intent'] as String? ?? 'general_question';

    // Step 2: Function Calling — try DB query
    if (dbExecutor != null && _isDataQuery(intentStr)) {
      final queryType = _intentToQueryType(intentStr);
      if (queryType != null) {
        try {
          final dbResult = await dbExecutor(queryType, {});
          if (dbResult != null) {
            return UnifiedAIResponse(
              text: _formatDBResult(intentStr, dbResult),
              provider: AIProvider.groq,
              confidence: 0.95,
              metadata: {'intent': intentStr, 'source': 'function_call'},
            );
          }
        } catch (_) {}
      }
    }

    // Step 3: RAG context
    String ragContext = '';
    if (hasRAG) {
      try {
        ragContext = await _rag!.getRelevantContext(message, topK: 3);
      } catch (_) {}
    }

    // Step 4: LLM response (Groq preferred)
    if (hasGroq) {
      final systemPrompt = _buildSystemPrompt(ragContext: ragContext);
      final resp = await _groq!.chat(
        message,
        systemPrompt: systemPrompt,
        context: data,
        model: mode == 'suggestions'
            ? 'llama-3.1-8b-instant'
            : 'llama-3.3-70b-versatile',
        maxTokens: template != null ? 1000 : 800,
      );

      final response = UnifiedAIResponse(
        text: resp,
        provider: AIProvider.groq,
        confidence: 0.85,
        metadata: {'intent': intentStr, 'model': 'groq'},
      );

      // Cache
      _cache['${message.hashCode}_${data?.hashCode ?? 0}'] = _CacheEntry(
        resp,
        AIProvider.groq,
        DateTime.now(),
      );

      return response;
    }

    // Fallback to HF QA if available
    if (hasHF && ragContext.isNotEmpty) {
      final qaResult = await _hf!.answerQuestion(message, ragContext);
      if (qaResult.score > 0.5) {
        return UnifiedAIResponse(
          text: qaResult.answer,
          provider: AIProvider.huggingface,
          confidence: qaResult.score,
        );
      }
    }

    return _handleOffline(message, data);
  }

  UnifiedAIResponse _handleOffline(String message, Map<String, dynamic>? data) {
    final result = _local.processQuery(message, data ?? {});
    return UnifiedAIResponse(
      text: result.response,
      provider: AIProvider.local,
      confidence: result.confidence,
      metadata: {'mode': 'offline'},
    );
  }

  String _buildSystemPrompt({String ragContext = ''}) {
    var prompt =
        '''أنت "مساعد EPI" — متخصص في برنامج التطعيم الموسع في اليمن ومنصة مشرف EPI.

التطعيمات: BCG, OPV/IPV, Penta, PCV, Rotavirus, MR, HepB.
المؤشرات: Penta3=وصول, Dropout=استمرارية, الحصبة=حماية جماعية.
Health Score: 80+=ممتاز, 50-79=متوسط, <50=ضعيف.
المنصة: 5 أدوار (admin>central>governorate>district>data_entry).

قواعد: مختصر (≤120 كلمة). أرقام من البيانات. توصيات عملية. العربية.''';

    if (ragContext.isNotEmpty) {
      prompt += '\n\nمعلومات ذات صلة:\n$ragContext';
    }

    return prompt;
  }

  bool _isDataQuery(String intent) => [
    'query_submissions',
    'query_shortages',
    'query_analytics',
    'query_governorates',
    'query_users',
  ].contains(intent);

  String? _intentToQueryType(String intent) => {
    'query_submissions': 'submissions',
    'query_shortages': 'shortages',
    'query_analytics': 'analytics',
    'query_governorates': 'governorates',
    'query_users': 'users',
  }[intent];

  String _formatDBResult(String intent, dynamic data) {
    if (data is Map) {
      if (intent == 'query_submissions') {
        final byStatus = data['byStatus'] as Map? ?? {};
        return '📊 الإرساليات:\n'
            '• الإجمالي: ${data['total'] ?? 0}\n'
            '• معتمدة: ${byStatus['approved'] ?? 0}\n'
            '• مرفوضة: ${byStatus['rejected'] ?? 0}\n'
            '• قيد المراجعة: ${byStatus['submitted'] ?? 0}';
      }
      if (intent == 'query_shortages') {
        final bySev = data['bySeverity'] as Map? ?? {};
        return '⚠️ النواقص:\n'
            '• الإجمالي: ${data['total'] ?? 0}\n'
            '• حرجة: ${bySev['critical'] ?? 0} 🔴\n'
            '• محلولة: ${data['resolved'] ?? 0}';
      }
      if (intent == 'query_analytics') {
        return '📈 إحصائيات:\n'
            '• إرساليات: ${data['total_submissions'] ?? 0}\n'
            '• نواقص نشطة: ${data['active_shortages'] ?? 0}\n'
            '• مستخدمين: ${data['active_users'] ?? 0}';
      }
    }
    return '📋 تم جلب البيانات.';
  }

  List<String> _defaultSuggestions() => [
    '📊 ما حالة الإرساليات اليوم؟',
    '⚠️ أين النواقص الحرجة؟',
    '📈 اعرض تقرير أسبوعي',
    '🗺️ أي المحافظات تحتاج دعم؟',
    '💉 ما تغطية التطعيم؟',
  ];

  Map<String, dynamic> get status => {
    'groq': hasGroq,
    'huggingface': hasHF,
    'rag': hasRAG,
    'online': isOnline,
    'cache_size': _cache.length,
  };
}

class _CacheEntry {
  final String text;
  final AIProvider provider;
  final DateTime timestamp;
  static const Duration _ttl = Duration(minutes: 3);

  _CacheEntry(this.text, this.provider, this.timestamp);
  bool get isExpired => DateTime.now().difference(timestamp) > _ttl;
}
