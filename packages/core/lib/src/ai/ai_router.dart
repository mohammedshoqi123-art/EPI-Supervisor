import 'huggingface/hf_service.dart';
import 'rag/rag_pipeline.dart';
import 'function_calling/function_calling_engine.dart';
import 'enhanced_local_ai.dart';
import 'smart_analytics.dart';
import '../offline/offline_manager.dart';

/// Unified AI Router
/// Routes queries to the best available AI service based on:
/// - Network availability
/// - Query type
/// - Model availability
class AIRouter {
  final HuggingFaceService? _hf;
  final RagPipeline? _rag;
  final FunctionCallingEngine? _fnCall;
  final EnhancedLocalAI _localAI;
  final OfflineManager _offline;

  // Conversation memory
  final List<Map<String, String>> _memory = [];
  static const int _maxMemorySize = 20;

  AIRouter({
    HuggingFaceService? hf,
    RagPipeline? rag,
    FunctionCallingEngine? fnCall,
    OfflineManager? offline,
  })  : _hf = hf,
        _rag = rag,
        _fnCall = fnCall,
        _localAI = EnhancedLocalAI(),
        _offline = offline ?? OfflineManager();

  /// Initialize the AI system
  Future<void> init() async {
    // Build RAG knowledge base if HF is available
    if (_hf != null && _rag != null) {
      try {
        await _rag.buildKnowledgeBase();
      } catch (e) {
        print('RAG init failed (will work without it): $e');
      }
    }
  }

  /// Main entry point — process any query
  Future<AIResponse> query(
    String message, {
    Map<String, dynamic>? data,
    Future<dynamic> Function(String query, Map<String, dynamic> params)?
        dbExecutor,
  }) async {
    final isOnline = _hf != null;
    final hasRAG = _rag?.isReady ?? false;
    final hasFnCall = _fnCall != null && dbExecutor != null;

    // Store in memory
    _addToMemory('user', message);

    AIResponse response;

    if (!isOnline) {
      // FULL OFFLINE MODE
      response = _handleOffline(message, data ?? {});
    } else {
      // ONLINE MODE — Try enhanced pipeline
      try {
        response = await _handleOnline(
          message,
          data: data,
          dbExecutor: dbExecutor,
          hasRAG: hasRAG,
          hasFnCall: hasFnCall,
        );
      } catch (e) {
        // Fallback to offline if online fails
        print('Online AI failed, falling back to local: $e');
        response = _handleOffline(message, data ?? {});
      }
    }

    _addToMemory('assistant', response.text);
    return response;
  }

  /// Handle query offline
  AIResponse _handleOffline(String message, Map<String, dynamic> data) {
    final result = _localAI.processQuery(message, data);
    return AIResponse(
      text: result.response,
      source: AIResponseSource.local,
      confidence: result.confidence,
      metadata: {'mode': 'offline'},
    );
  }

  /// Handle query online with full pipeline
  Future<AIResponse> _handleOnline(
    String message, {
    Map<String, dynamic>? data,
    Future<dynamic> Function(String query, Map<String, dynamic> params)?
        dbExecutor,
    required bool hasRAG,
    required bool hasFnCall,
  }) async {
    // Step 1: Intent Classification
    Map<String, double>? intentScores;
    String? topIntent;
    try {
      final intentResult = await _hf!.getTopIntent(message);
      topIntent = intentResult.intent;
      intentScores = await _hf!.classifyIntent(message);
    } catch (_) {}

    // Step 2: RAG — Get relevant context
    String ragContext = '';
    List<RagResult>? ragResults;
    if (hasRAG) {
      try {
        ragResults = await _rag!.search(message, topK: 3);
        if (ragResults.isNotEmpty) {
          ragContext = await _rag!.getRelevantContext(message, topK: 3);
        }
      } catch (_) {}
    }

    // Step 3: Function Calling — Try to query DB directly
    FunctionCallResult? fnResult;
    if (hasFnCall && topIntent != null && topIntent != 'general_question') {
      try {
        fnResult = await _fnCall!.analyzeAndCall(message, dbExecutor!);
      } catch (_) {}
    }

    // Step 4: Build context for LLM
    final contextParts = <String>[];
    if (ragContext.isNotEmpty) contextParts.add(ragContext);
    if (fnResult?.success == true && fnResult?.data != null) {
      contextParts.add('== بيانات من قاعدة البيانات ==\n${fnResult!.data}');
    }
    if (data != null && data.isNotEmpty) {
      contextParts.add('== إحصائيات حالية ==\n${_formatData(data)}');
    }

    // Step 5: Build response
    // If we have function call results, format them directly
    if (fnResult?.success == true && fnResult?.data != null) {
      final formatted = _formatFunctionResult(fnResult!, message);
      return AIResponse(
        text: formatted,
        source: AIResponseSource.functionCall,
        confidence: 0.9,
        metadata: {
          'function': fnResult.functionName,
          'intent': topIntent,
          'intent_scores': intentScores,
        },
      );
    }

    // If we have RAG results, provide knowledge-based answer
    if (ragResults != null && ragResults.isNotEmpty) {
      final bestResult = ragResults.first;
      if (bestResult.score > 0.6) {
        return AIResponse(
          text: bestResult.document.content,
          source: AIResponseSource.rag,
          confidence: bestResult.score,
          metadata: {
            'intent': topIntent,
            'document_id': bestResult.document.id,
          },
        );
      }
    }

    // Fallback: Use offline AI with context
    final enhancedData = Map<String, dynamic>.from(data ?? {});
    if (fnResult?.data != null) {
      enhancedData['db_result'] = fnResult!.data;
    }

    final localResult = _localAI.processQuery(message, enhancedData);
    return AIResponse(
      text: localResult.response,
      source: AIResponseSource.hybrid,
      confidence: localResult.confidence,
      metadata: {
        'intent': topIntent,
        'has_rag': ragResults?.isNotEmpty ?? false,
        'has_fn_call': fnResult?.success ?? false,
      },
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MEMORY
  // ═══════════════════════════════════════════════════════════

  void _addToMemory(String role, String content) {
    _memory.add({'role': role, 'content': content});
    if (_memory.length > _maxMemorySize) {
      _memory.removeRange(0, _memory.length - _maxMemorySize);
    }
  }

  List<Map<String, String>> get memory => List.unmodifiable(_memory);

  void clearMemory() {
    _memory.clear();
    _localAI.clearHistory();
  }

  // ═══════════════════════════════════════════════════════════
  // FORMATTING
  // ═══════════════════════════════════════════════════════════

  String _formatData(Map<String, dynamic> data) {
    final parts = <String>[];
    if (data['submissions'] != null) {
      final s = data['submissions'] as Map;
      parts.add('إرسالات: كلي=${s['total']} اليوم=${s['today']}');
    }
    if (data['shortages'] != null) {
      final s = data['shortages'] as Map;
      parts.add('نواقص: كلي=${s['total']} محلول=${s['resolved']}');
    }
    return parts.join('\n');
  }

  String _formatFunctionResult(FunctionCallResult result, String originalQuery) {
    final data = result.data;

    if (data is List && data.isNotEmpty) {
      final first = data.first as Map<String, dynamic>;

      // Count queries
      if (first.containsKey('total')) {
        final total = first['total'] ?? 0;
        final approved = first['approved'] ?? 0;
        final rejected = first['rejected'] ?? 0;
        final pending = first['pending'] ?? 0;

        final buffer = StringBuffer();
        buffer.writeln('📊 النتائج:');
        buffer.writeln('• الإجمالي: $total');
        if (approved > 0) buffer.writeln('• معتمد: $approved');
        if (rejected > 0) buffer.writeln('• مرفوض: $rejected');
        if (pending > 0) buffer.writeln('• قيد المراجعة: $pending');
        return buffer.toString();
      }

      // Governorate performance
      if (first.containsKey('name_ar')) {
        final buffer = StringBuffer();
        buffer.writeln('🗺️ الأداء حسب المحافظة:');
        for (int i = 0; i < data.length && i < 10; i++) {
          final row = data[i] as Map<String, dynamic>;
          final name = row['name_ar'] ?? '';
          final count = row['submissions'] ?? row['total'] ?? 0;
          final rate = row['approval_rate'];
          final rateStr = rate != null ? ' (${rate}%)' : '';
          buffer.writeln('• $name: $count$rateStr');
        }
        return buffer.toString();
      }

      // Generic list
      return '📋 تم العثور على ${data.length} نتيجة:\n${data.map((d) => '• $d').join('\n')}';
    }

    if (data is Map) {
      // Dashboard stats
      if (data.containsKey('total_submissions')) {
        return '📊 إحصائيات النظام:\n'
            '• إجمالي الإرساليات: ${data['total_submissions']}\n'
            '• إرساليات اليوم: ${data['today_submissions']}\n'
            '• نواقص نشطة: ${data['active_shortages']}\n'
            '• نواقص حرجة: ${data['critical_shortages']}\n'
            '• مستخدمين نشطين: ${data['active_users']}';
      }
    }

    return '📋 تم جلب البيانات بنجاح.';
  }

  /// Get current mode description
  String get currentMode {
    if (_hf == null) return 'محلي (بدون إنترنت)';
    if (_rag?.isReady == true) return 'متصل (RAG + AI)';
    return 'متصل (AI)';
  }

  /// Get system status
  Map<String, dynamic> get systemStatus => {
        'online': _hf != null,
        'rag_ready': _rag?.isReady ?? false,
        'rag_documents': _rag?.documentCount ?? 0,
        'function_calls': _fnCall?.availableFunctions.length ?? 0,
        'memory_size': _memory.length,
        'mode': currentMode,
      };
}

// ═══════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════

enum AIResponseSource {
  local,         // Pure offline AI
  rag,           // RAG knowledge base
  functionCall,  // Database query
  hybrid,        // Online + local
  huggingface,   // Direct HF model
}

class AIResponse {
  final String text;
  final AIResponseSource source;
  final double confidence;
  final Map<String, dynamic>? metadata;

  AIResponse({
    required this.text,
    required this.source,
    required this.confidence,
    this.metadata,
  });
}
