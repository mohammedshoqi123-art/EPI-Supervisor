/// ═══════════════════════════════════════════════════════════════════════
///  AI Router v2 — توجيه ذكي بين الاستشارة المحلية والتحليلات السيرفر
///  يفرق بين:
///  - استشارة صحية → دائماً محلي (NLP)
///  - تحليل بيانات → سيرفر (مع fallback محلي)
///  - أسئلة إدارية → سيرفر (مع رسالة أوفلاين)
/// ═══════════════════════════════════════════════════════════════════════

import 'epi_nlp_engine.dart';
import 'local_health_consultation.dart';
import 'enhanced_local_ai.dart';
import 'child_context_manager.dart';

enum ResponseSource {
  healthLocal,    // استشارة صحية محلية
  analyticsLocal, // تحليل بيانات محلي
  serverAI,       // AI سيرفر (Groq/MIMO)
  serverAnalytics,// تحليل سيرفر
  offline,        // أوفلاين بدون بيانات
}

class AIResponseV2 {
  final String text;
  final ResponseSource source;
  final double confidence;
  final String intent;
  final List<QuickReply> quickReplies;
  final Map<String, dynamic>? metadata;

  const AIResponseV2({
    required this.text,
    required this.source,
    required this.confidence,
    required this.intent,
    this.quickReplies = const [],
    this.metadata,
  });
}

class AIRouterV2 {
  final LocalHealthConsultation _healthEngine = LocalHealthConsultation();
  final EnhancedLocalAI _analyticsEngine = EnhancedLocalAI();

  ChildContextManager get healthContext => _healthEngine.context;

  /// إعادة تعيين المحادثة
  void resetConversation() {
    _healthEngine.resetConversation();
    _analyticsEngine.clearHistory();
  }

  /// الرسالة الترحيبية
  AIResponseV2 getWelcome() {
    final result = _healthEngine.getWelcomeMessage();
    return AIResponseV2(
      text: result.text,
      source: ResponseSource.healthLocal,
      confidence: 1.0,
      intent: 'greeting',
      quickReplies: result.quickReplies,
    );
  }

  /// نقطة الدخول الرئيسية — تحليل وتوجيه
  Future<AIResponseV2> process(
    String message, {
    bool isOnline = false,
    Map<String, dynamic>? analyticsData,
    Future<String?> Function(String intent, Map<String, dynamic> params)? serverExecutor,
  }) async {
    final norm = EpiNLPEngine.normalize(message);
    final intentResult = EpiNLPEngine.detectIntent(norm);

    // ═══ 1. استشارة صحية → دائماً محلي ═══
    if (_isHealthConsultation(intentResult.intent)) {
      final result = _healthEngine.process(message);
      return AIResponseV2(
        text: result.text,
        source: ResponseSource.healthLocal,
        confidence: result.confidence,
        intent: result.intent,
        quickReplies: result.quickReplies,
      );
    }

    // ═══ 2. تحليل بيانات → سيرفر أولاً، ثم محلي ═══
    if (_isAnalyticsQuery(intentResult.intent)) {
      // محاولة السيرفر أولاً
      if (isOnline && serverExecutor != null) {
        try {
          final serverResult = await serverExecutor(intentResult.intent, analyticsData ?? {});
          if (serverResult != null && serverResult.isNotEmpty) {
            return AIResponseV2(
              text: serverResult,
              source: ResponseSource.serverAnalytics,
              confidence: 0.9,
              intent: intentResult.intent,
              quickReplies: const [
                QuickReply(text: 'تحليل أعمق', emoji: '📊'),
                QuickReply(text: 'توصيات', emoji: '💡'),
                QuickReply(text: 'تنبؤات', emoji: '🔮'),
              ],
            );
          }
        } catch (_) {}
      }

      // Fallback محلي للتحليلات
      final localResult = _analyticsEngine.processQuery(message, analyticsData ?? {});
      if (localResult.confidence > 0.3) {
        return AIResponseV2(
          text: localResult.response,
          source: ResponseSource.analyticsLocal,
          confidence: localResult.confidence,
          intent: intentResult.intent,
          quickReplies: const [
            QuickReply(text: 'توصيات ذكية', emoji: '💡'),
            QuickReply(text: 'تحليل الاتجاه', emoji: '📈'),
            QuickReply(text: 'جودة البيانات', emoji: '✅'),
          ],
        );
      }
    }

    // ═══ 3. أسئلة إدارية عامة ═══
    if (_isAdminQuery(intentResult.intent)) {
      if (!isOnline) {
        return AIResponseV2(
          text: '📊 هذا الاستعلام يحتاج بيانات من النظام.\n\n'
              '🔄 يرجى التأكد من اتصالك بالإنترنت.\n\n'
              '💡 أقدر أساعدك بالاستشارات الصحية والتطعيمات بدون إنترنت.',
          source: ResponseSource.offline,
          confidence: 0.5,
          intent: intentResult.intent,
          quickReplies: _healthEngine.getWelcomeMessage().quickReplies,
        );
      }
      // أونلاين → أرسل للسيرفر
      if (serverExecutor != null) {
        try {
          final serverResult = await serverExecutor(intentResult.intent, analyticsData ?? {});
          if (serverResult != null) {
            return AIResponseV2(
              text: serverResult,
              source: ResponseSource.serverAI,
              confidence: 0.85,
              intent: intentResult.intent,
            );
          }
        } catch (_) {}
      }
    }

    // ═══ 4. Fallback: استشارة صحية ═══
    final healthResult = _healthEngine.process(message);
    return AIResponseV2(
      text: healthResult.text,
      source: ResponseSource.healthLocal,
      confidence: healthResult.confidence,
      intent: healthResult.intent,
      quickReplies: healthResult.quickReplies,
    );
  }

  /// هل الاستعلام استشارة صحية؟
  bool _isHealthConsultation(String intent) {
    const healthIntents = {
      'age_query', 'vaccine_list', 'schedule_query', 'dose_count',
      'side_effects', 'emergency', 'location', 'cost', 'campaigns',
      'vaccine_types', 'myths', 'special_cases', 'nutrition', 'cold_chain',
      'travel', 'history', 'benefits', 'diseases', 'child_sick', 'reminder',
      'greeting', 'feedback', 'negation', 'clarification', 'comparison',
      'follow_up', 'general_question', 'default',
    };
    return healthIntents.contains(intent);
  }

  /// هل الاستعلام تحليل بيانات؟
  bool _isAnalyticsQuery(String intent) {
    const analyticsIntents = {
      'query_submissions', 'query_shortages', 'query_analytics',
      'analyze_trend', 'query_health', 'query_governorates',
      'generate_report',
    };
    return analyticsIntents.contains(intent);
  }

  /// هل الاستعلام إداري؟
  bool _isAdminQuery(String intent) {
    const adminIntents = {
      'query_users', 'ask_guide', 'supervision', 'management',
    };
    return adminIntents.contains(intent);
  }

  /// حالة النظام
  Map<String, dynamic> get status => {
    'health_engine': 'active',
    'analytics_engine': 'active',
    'child_profile': healthContext.child.hasBasicInfo ? 'loaded' : 'empty',
    'conversation_turns': healthContext.turnCount,
  };
}
