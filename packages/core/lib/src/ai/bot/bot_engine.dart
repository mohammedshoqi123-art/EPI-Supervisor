// ══════════════════════════════════════════════════════════════════════════
//  Bot Engine — محرك المحادثة الذكي للبوت
//  نسخة مُكيّفة من EPI-Bot chat_service.dart لتعمل مع EPI-Supervisor
// ══════════════════════════════════════════════════════════════════════════

import 'dart:math';
import 'vaccine_model.dart';
import 'vaccination_service.dart';
import 'knowledge_base.dart';
import 'smart_nlp.dart';
import 'context_manager.dart';
import 'bot_llm_service.dart';
import 'real_data_kb.dart';
import 'analytics_engine.dart';
import 'advanced_immunization_kb.dart';
import 'intermediate_management_kb.dart';
import 'deep_analytics_engine.dart';

class BotQuickReply {
  final String text;
  final String emoji;
  const BotQuickReply({required this.text, required this.emoji});
}

class BotResponse {
  final String text;
  final List<BotQuickReply>? quickReplies;
  BotResponse(this.text, this.quickReplies);
}

class BotMessage {
  final String id;
  final String text;
  final bool isBot;
  final DateTime timestamp;
  final List<BotQuickReply>? quickReplies;

  BotMessage({
    required this.id,
    required this.text,
    required this.isBot,
    required this.timestamp,
    this.quickReplies,
  });
}

class BotEngine {
  final List<BotMessage> _messages = [];
  List<BotMessage> get messages => List.unmodifiable(_messages);

  final ContextManager _ctx = ContextManager();

  bool _isAIEnabled = false;
  bool _isAILoading = false;
  bool get isAIEnabled => _isAIEnabled;
  bool get isAILoading => _isAILoading;
  BotAIStatus get aiStatus => BotLLMService.currentStatus;

  // ═══ Dynamic KB callback — set from UI to enable DB-based search ═══
  /// Returns dynamic knowledge entries from database (null = not available)
  Future<List<(String topic, String content, double relevance)>> Function(
      String query)? dynamicKBSearch;
  bool _searchedDynamicKB = false;
  List<(String, String, double)>? _dynamicKBResults;

  /// Search dynamic KB (call this before sendMessage in async context)
  Future<void> preSearchDynamicKB(String query) async {
    if (dynamicKBSearch == null) {
      _dynamicKBResults = null;
      return;
    }
    try {
      _dynamicKBResults = await dynamicKBSearch!(query);
    } catch (_) {
      _dynamicKBResults = null;
    }
  }

  void setAIEnabled(bool enabled) {
    _isAIEnabled = enabled;
  }

  Future<void> initializeAI(String apiKey,
      {String? baseUrl, String? model}) async {
    BotLLMService.configure(
      apiKey: apiKey,
      baseUrl: baseUrl,
      model: model,
    );
    final connected = await BotLLMService.testConnection();
    _isAIEnabled = connected;
  }

  void initialize() {
    if (_messages.isEmpty) {
      _addBotMessage(
        '🌟 مرحباً! أنا مستشار التحصين الصحي الموسع باليمن 🇾🇪\n\n'
        '🧠 فاهم كل شيء عن التطعيمات — اسألني براحتك!\n\n'
        '💉 تطعيمات طفلك (حسب عمره وحالته)\n'
        '⚠️ الآثار الجانبية (حرارة، تورم، تشنجات...)\n'
        '🦠 الأمراض التي تحمي منها التطعيمات\n'
        '👶 حالات خاصة (مبتسرين، سكري، قلب...)\n'
        '🍼 التغذية وتأثيرها على المناعة\n'
        '🚫 الرد على الأساطير (التوحد، العقم...)\n'
        '🏥 الأشراف الداعم وإدارة المستوى الوسيط\n'
        '❄️ سلسلة التبريد و VVM\n'
        '📜 تاريخ التحصين في اليمن\n'
        '📊 مؤشرات الأداء والتخطيط الدقيق\n'
        '🦠 الاستجابة للأوبئة والرصد الوبائي\n'
        '🏫 تحصين المدارس\n\n'
        '💡 قولي عمر طفلك وأعطيك تطعيماته!',
        quickReplies: _welcomeReplies(),
      );
    }
  }

  /// إرسال رسالة والحصول على رد
  /// تُرجع null إذا كان AI مفعّل ويرسل عبر الإنترنت
  BotMessage? sendMessage(String text) {
    _messages.add(BotMessage(
      id: _gid(),
      text: text,
      isBot: false,
      timestamp: DateTime.now(),
    ));

    // محاولة استخدام الذكاء الاصطناعي أولاً
    if (_isAIEnabled && BotLLMService.isOnline) {
      _sendMessageToAI(text);
      return null; // الرد سيأتي لاحقاً عبر callback
    }

    // استخدام النظام المحلي
    final ms = (200 + (text.length * 5)).clamp(200, 1200);
    final resp = _process(text);
    final msg = BotMessage(
      id: _gid(),
      text: resp.text,
      isBot: true,
      timestamp: DateTime.now(),
      quickReplies: resp.quickReplies,
    );
    _messages.add(msg);
    return msg;
  }

  /// إرسال رسالة مع رد callback (للـ AI)
  void sendMessageWithCallback(String text, void Function(BotMessage) onReply) {
    _messages.add(BotMessage(
      id: _gid(),
      text: text,
      isBot: false,
      timestamp: DateTime.now(),
    ));

    if (_isAIEnabled && BotLLMService.isOnline) {
      _isAILoading = true;
      _sendMessageToAIAsync(text).then((msg) {
        _isAILoading = false;
        onReply(msg);
      }).catchError((_) {
        _isAILoading = false;
        final resp = _process(text);
        final msg = BotMessage(
          id: _gid(),
          text: resp.text,
          isBot: true,
          timestamp: DateTime.now(),
          quickReplies: resp.quickReplies,
        );
        _messages.add(msg);
        onReply(msg);
      });
    } else {
      final resp = _process(text);
      final msg = BotMessage(
        id: _gid(),
        text: resp.text,
        isBot: true,
        timestamp: DateTime.now(),
        quickReplies: resp.quickReplies,
      );
      _messages.add(msg);
      onReply(msg);
    }
  }

  void _sendMessageToAI(String text) async {
    _isAILoading = true;
    try {
      final history = _messages
          .map((m) => {
                'role': m.isBot ? 'assistant' : 'user',
                'content': m.text,
              })
          .toList();

      final response = await BotLLMService.sendMessage(
        userMessage: text,
        conversationHistory: history,
        childProfile: _ctx.child.toJson(),
      );

      _isAILoading = false;

      if (response.isFromLLM && response.text.isNotEmpty) {
        _ctx.lastTopic = _extractTopicFromMessage(text);
        _record('ai_response', text);

        final suggestions =
            BotLLMService.generateQuickReplySuggestions(text, response.text);
        final quickReplies = suggestions.map((s) {
          return BotQuickReply(text: s, emoji: _getEmojiForSuggestion(s));
        }).toList();

        _addBotMessage(response.text, quickReplies: quickReplies);
      } else {
        final resp = _process(text);
        _addBotMessage(resp.text, quickReplies: resp.quickReplies);
      }
    } catch (_) {
      _isAILoading = false;
      final resp = _process(text);
      _addBotMessage(resp.text, quickReplies: resp.quickReplies);
    }
  }

  Future<BotMessage> _sendMessageToAIAsync(String text) async {
    try {
      final history = _messages
          .map((m) => {
                'role': m.isBot ? 'assistant' : 'user',
                'content': m.text,
              })
          .toList();

      final response = await BotLLMService.sendMessage(
        userMessage: text,
        conversationHistory: history,
        childProfile: _ctx.child.toJson(),
      );

      if (response.isFromLLM && response.text.isNotEmpty) {
        _ctx.lastTopic = _extractTopicFromMessage(text);
        _record('ai_response', text);

        final suggestions =
            BotLLMService.generateQuickReplySuggestions(text, response.text);
        final quickReplies = suggestions.map((s) {
          return BotQuickReply(text: s, emoji: _getEmojiForSuggestion(s));
        }).toList();

        final msg = BotMessage(
          id: _gid(),
          text: response.text,
          isBot: true,
          timestamp: DateTime.now(),
          quickReplies: quickReplies,
        );
        _messages.add(msg);
        return msg;
      }

      final resp = _process(text);
      final msg = BotMessage(
        id: _gid(),
        text: resp.text,
        isBot: true,
        timestamp: DateTime.now(),
        quickReplies: resp.quickReplies,
      );
      _messages.add(msg);
      return msg;
    } catch (_) {
      final resp = _process(text);
      final msg = BotMessage(
        id: _gid(),
        text: resp.text,
        isBot: true,
        timestamp: DateTime.now(),
        quickReplies: resp.quickReplies,
      );
      _messages.add(msg);
      return msg;
    }
  }

  String _extractTopicFromMessage(String text) {
    final norm = SmartNLP.normalize(text);
    final topicKeywords = {
      'تطعيم': 'التطعيمات',
      'لقاح': 'اللقاحات',
      'تحصين': 'التحصين',
      'اثار': 'الآثار الجانبية',
      'جانبي': 'الآثار الجانبية',
      'حصبه': 'الحصبة',
      'شلل': 'شلل الأطفال',
      'خماسي': 'الخماسي',
      'رئوي': 'التطعيم الرئوي',
      'روتا': 'الروتا',
      'bcg': 'BCG',
      'اشراف': 'الإشراف الداعم',
      'وسيط': 'إدارة المستوى الوسيط',
    };
    for (final entry in topicKeywords.entries) {
      if (norm.contains(entry.key)) return entry.value;
    }
    return 'استفسار عام';
  }

  String _getEmojiForSuggestion(String suggestion) {
    final s = SmartNLP.normalize(suggestion);
    if (s.contains('اثار') || s.contains('جانبي')) return '⚠️';
    if (s.contains('مجاني') || s.contains('بلاش')) return '💰';
    if (s.contains('وين') || s.contains('اين')) return '📍';
    if (s.contains('حراره') || s.contains('سخون')) return '🌡️';
    if (s.contains('متى')) return '📅';
    return '💡';
  }

  // ═══ المعالجة الرئيسية ═══

  BotResponse _process(String raw) {
    final norm = SmartNLP.normalize(raw);

    // ═══ Dynamic KB search (async results cached from previous call) ═══
    // Note: dynamicKBResults is populated by searchDynamicKB() which should
    // be called BEFORE _process() in async context
    if (_dynamicKBResults != null && _dynamicKBResults!.isNotEmpty) {
      final best = _dynamicKBResults!.first;
      _ctx.lastTopic = best.$1;
      _record('dynamic_kb', norm);
      _dynamicKBResults = null; // consume
      return BotResponse(best.$2, _ctxReplies(best.$1));
    }

    // التحليلات العميقة
    final deepResult = DeepAnalyticsEngine.analyzeQuery(norm);
    if (deepResult != null) {
      _ctx.lastTopic = deepResult.title;
      _record('deep_analytics', norm);
      final deepReplies = <BotQuickReply>[
        const BotQuickReply(text: 'تقييم المخاطر', emoji: '🎯'),
        const BotQuickReply(text: 'تنبؤات متقدمة', emoji: '🔮'),
        const BotQuickReply(text: 'تحسين الحملات', emoji: '🚀'),
      ];
      if (deepResult.actionItems.isNotEmpty) {
        return BotResponse(
          '${deepResult.detailedAnalysis}\n\n━━━━ إجراءات مطلوبة ━━━━\n${deepResult.actionItems.map((a) => "  ▶️ $a").join("\n")}',
          deepReplies,
        );
      }
      return BotResponse(deepResult.detailedAnalysis, deepReplies);
    }

    // الإحاطة التنفيذية
    if (norm.contains('احاطه تنفيذ') ||
        norm.contains('ملخص تنفيذ') ||
        norm.contains('تقرير شامل')) {
      _ctx.lastTopic = 'الإحاطة التنفيذية';
      return BotResponse(DeepAnalyticsEngine.getExecutiveBriefing(), [
        const BotQuickReply(text: 'تقييم المخاطر', emoji: '🎯'),
        const BotQuickReply(text: 'تحسين الحملات', emoji: '🚀'),
        const BotQuickReply(text: 'تحليل إشرافي', emoji: '🏥'),
      ]);
    }

    // تحليل البيانات
    final analyticsResult = AnalyticsEngine.analyzeQuery(norm);
    if (analyticsResult != null) {
      _ctx.lastTopic = analyticsResult.title;
      _record('analytics', norm);
      return BotResponse(analyticsResult.details, [
        const BotQuickReply(text: 'توصيات ذكية', emoji: '💡'),
        const BotQuickReply(text: 'تنبؤات 2026', emoji: '🔮'),
        const BotQuickReply(text: 'تحليل الفجوات', emoji: '📊'),
      ]);
    }

    // بحث في قاعدة البيانات الحقيقية
    final realDataResp = _searchRealDataKB(norm);
    if (realDataResp != null) return realDataResp;

    // الوضع الحالي
    if (norm.contains('وضع حالي') ||
        norm.contains('احصائيات') ||
        norm.contains('اخر ارقام')) {
      _ctx.lastTopic = 'الوضع الحالي';
      return BotResponse(AnalyticsEngine.getQuickStatus(), [
        const BotQuickReply(text: 'تحليل الحملات', emoji: '📊'),
        const BotQuickReply(text: 'توصيات ذكية', emoji: '💡'),
      ]);
    }

    // الشكر
    if (SmartNLP.isThanking(norm)) {
      return BotResponse(
          'العفو! 😊 أي سؤال ثاني عن التحصين أنا موجود!', _welcomeReplies());
    }

    // معالجة مباشرة
    final directResp = _handleDirectInput(norm, raw);
    if (directResp != null) return directResp;

    // أسئلة متعددة
    final parts = SmartNLP.splitMultipleQuestions(raw);
    if (parts.length > 1) {
      return _handleCompoundQuestions(parts, norm);
    }

    final intent = SmartNLP.detectIntent(norm,
        previousIntent: _ctx.lastTopic, lastTopic: _ctx.lastTopic);
    _ctx.extractEntities(norm);

    if (intent == 'greeting') return _handleGreeting(norm);

    final clar = _ctx.needsClarification(norm, intent);
    if (clar.needs) {
      _ctx.awaitingClarification = true;
      _ctx.clarificationContext = intent;
      return BotResponse(clar.question,
          clar.options.map((o) => BotQuickReply(text: o, emoji: '❓')).toList());
    }

    if (_ctx.awaitingClarification) {
      _ctx.awaitingClarification = false;
      return _handleClarificationResponse(norm, _ctx.clarificationContext);
    }

    if (SmartNLP.hasNegation(norm) && _ctx.lastTopic.isNotEmpty) {
      return _handleNegation(norm);
    }

    if (intent == 'follow_up') return _handleFollowUp(norm);

    // معالجة حسب النية
    switch (intent) {
      case 'age_query':
        return _handleAge(norm);
      case 'vaccine_list':
        return _handleVaccineList();
      case 'side_effects':
        return _handleSideEffects(norm);
      case 'emergency':
        return _handleEmergency(norm);
      case 'location':
        return _handleLocation();
      case 'cost':
        return _handleCost();
      case 'campaigns':
        return _handleCampaigns();
      case 'myths':
        return _handleMyths(norm);
      case 'special_cases':
        return _handleSpecialCases(norm);
      case 'nutrition':
        return _handleNutrition(norm);
      case 'cold_chain':
        return _handleColdChain(norm);
      case 'supervision':
        return _handleSupportiveSupervision(norm);
      case 'management':
        return _handleIntermediateManagement(norm);
      case 'reminder':
        return _handleReminder(norm);
      case 'diseases':
        return _handleDiseases(norm);
      case 'child_sick':
        return _handleChildSick(norm);
      default:
        break;
    }

    // بحث ذكي
    final found = _smartSearch(norm);
    if (found != null) {
      _ctx.lastTopic = found;
      final content = _kb[found] ??
          advancedImmunizationKB[found] ??
          intermediateManagementKB[found] ??
          'عذراً، لا تتوفر معلومات حالياً';
      return BotResponse(content, _ctxReplies(found));
    }

    return _handleDefault(norm);
  }

  // ═══ المعالجات ═══

  BotResponse? _handleDirectInput(String norm, String raw) {
    if (norm.contains('تطعيمات طفلي') ||
        norm.contains('تطعيمات الطفل') ||
        norm.contains('وش تطعيمات') ||
        norm.contains('ايش تطعيمات')) {
      if (_ctx.child.hasBasicInfo) return _handleAge(norm);
      _ctx.awaitingClarification = true;
      _ctx.clarificationContext = 'age_query';
      return BotResponse('📅 عشان أقدر أعطيك تطعيمات طفلك بالضبط، كم عمره؟', [
        const BotQuickReply(text: 'عمره شهر', emoji: '📅'),
        const BotQuickReply(text: 'عمره 3 شهور', emoji: '📅'),
        const BotQuickReply(text: 'عمره 6 شهور', emoji: '📅'),
        const BotQuickReply(text: 'عمره سنة', emoji: '📅'),
      ]);
    }

    if (norm.contains('الاثار الجانبيه') ||
        norm.contains('الآثار الجانبية') ||
        norm.contains('وش الآثار') ||
        norm.contains('ايش الآثار')) {
      _ctx.lastTopic = 'آثار جانبية';
      return BotResponse(_kb['آثار جانبية'] ?? '', _ctxReplies('side_effects'));
    }

    if (norm.contains('مجاني') ||
        norm.contains('هل مجاني') ||
        norm.contains('مجانا') ||
        norm.contains('بلاش')) {
      _ctx.lastTopic = 'مجاناً';
      return BotResponse(_kb['مجاناً'] ?? '', [
        const BotQuickReply(text: 'وين أطعم؟', emoji: '📍'),
        const BotQuickReply(text: 'متى التطعيم؟', emoji: '📅'),
      ]);
    }

    if (norm.contains('اوتيزم') ||
        norm.contains('هل يسبب اوتيزم') ||
        norm.contains('توحد')) {
      _ctx.lastTopic = 'التطعيم والتوحد';
      return BotResponse(_kb['التطعيم والتوحد'] ?? '', _ctxReplies('myths'));
    }

    if (norm.contains('عقم') || norm.contains('هل يسبب عقم')) {
      _ctx.lastTopic = 'التطعيم والعقم';
      return BotResponse(_kb['التطعيم والعقم'] ?? '', _ctxReplies('myths'));
    }

    if (norm.contains('الاشراف الداعم') ||
        norm.contains('اشراف داعم') ||
        norm.contains('إشراف داعم')) {
      return _handleSupportiveSupervision(norm);
    }

    if (norm.contains('المستوى الوسيط') ||
        norm.contains('اداره المستوى') ||
        norm.contains('مدير مكتب')) {
      return _handleIntermediateManagement(norm);
    }

    if (norm.contains('مؤشرات اداء') ||
        norm.contains('kpi') ||
        norm.contains('مؤشرات')) {
      return _handleIntermediateManagement(norm);
    }

    if (norm.contains('حمل') ||
        norm.contains('nids') ||
        norm.contains('تطعيم לאומי') ||
        norm.contains('حملات')) {
      return _handleCampaigns();
    }

    if (norm.contains('وباء') ||
        norm.contains('استجابة') ||
        norm.contains('فاشيه') ||
        norm.contains('outbreak')) {
      return _handleOutbreakResponse(norm);
    }

    // أمراض
    if (norm.contains('الامراض') || norm.contains('الأمراض')) {
      return _handleDiseases(norm);
    }

    // التغذية
    if (norm.contains('التغذيه') || norm.contains('التغذية')) {
      return _handleNutrition(norm);
    }

    // متى أخاف
    if (norm.contains('متى اخاف') || norm.contains('متى اقلق')) {
      return _handleEmergency(norm);
    }

    // وين أطعم
    if (norm.contains('وين اطعم') || norm.contains('اين اطعم')) {
      return _handleLocation();
    }

    // جدول التحصين
    if (norm.contains('جدول التحصين') ||
        norm.contains('جدول التطعيم') ||
        norm.contains('كل التطعيمات')) {
      _ctx.lastTopic = 'جدول التحصين';
      return BotResponse(
          _kb['جدول التحصين لدون العام'] ?? _kb['متى أطعم'] ?? '',
          _ctxReplies('vaccine_list'));
    }

    // مبتسرين
    if (norm.contains('مبتسرين') ||
        norm.contains('خديج') ||
        norm.contains('مبتسر')) {
      _ctx.lastTopic = 'للأطفال المبتسرين';
      return BotResponse(
          _kb['للأطفال المبتسرين'] ?? '', _ctxReplies('special'));
    }

    // حوامل
    if (norm.contains('حوامل') || norm.contains('حامل')) {
      _ctx.lastTopic = 'الحوامل';
      return BotResponse(_kb['الحوامل'] ?? '', _ctxReplies('special'));
    }

    // HIV
    if (norm.contains('hiv') || norm.contains('ايدز')) {
      _ctx.lastTopic = 'HIV';
      return BotResponse(
          _kb['تطعيم الأطفال المصابين بـ HIV'] ?? '', _ctxReplies('special'));
    }

    // سكر
    if (norm.contains('سكر') && !norm.contains('ما ي')) {
      _ctx.lastTopic = 'سكري';
      return BotResponse(
          _kb['الأطفال المصابين بالسكري'] ?? '', _ctxReplies('special'));
    }

    // متى التطعيم
    if (norm.contains('متى التطعيم') || norm.contains('متى التطعيمات')) {
      _ctx.lastTopic = 'متى أطعم';
      return BotResponse(_kb['متى أطعم'] ?? '', _ctxReplies('vaccine_list'));
    }

    // سلسلة التبريد
    if (norm.contains('السلسله البارده') ||
        norm.contains('سلسلة التبريد') ||
        norm.contains('التبريد')) {
      _ctx.lastTopic = 'سلسلة التبريد';
      return BotResponse(_kb['سلسلة التبريد'] ?? '', _ctxReplies('cold_chain'));
    }

    return null;
  }

  BotResponse _handleAge(String n) {
    final age = SmartNLP.extractAge(n);
    if (age != null) {
      final months = age.months > 0 ? age.months : (age.weeks * 7) ~/ 30;
      final weeks = age.weeks > 0 ? age.weeks : (age.months * 30) ~/ 7;
      _ctx.child.ageMonths = months;
      _ctx.child.ageWeeks = weeks;
      _ctx.child.lastUpdated = DateTime.now();

      final m = _ctx.child.ageMonths!;
      final w = _ctx.child.ageWeeks!;
      final due = VaccinationService().getVaccinesDueAtAge(w, m);
      final upcoming = VaccinationService().getUpcomingVaccines(w, m);
      final overdue = VaccinationService()
          .getOverdueVaccines(w, m, _ctx.child.givenVaccines);

      final buf = StringBuffer();
      buf.writeln('📅 عمر طفلك: ${_ctx.child.ageDisplay}');

      if (overdue.isNotEmpty) {
        buf.writeln('\n⚠️ تطعيمات متأخرة (أعطها فوراً!):');
        for (final v in overdue) {
          buf.writeln('  ⚠️ ${v.iconEmoji} ${v.nameAr} — ${v.doseNumber}');
        }
      }

      final completed = due.where((v) => !overdue.contains(v)).toList();
      if (completed.isNotEmpty) {
        buf.writeln('\n✅ تطعيمات يجب أن تكون مُعطاة:');
        for (final v in completed) {
          buf.writeln('  ✅ ${v.iconEmoji} ${v.nameAr} — ${v.doseNumber}');
        }
      }

      if (upcoming.isNotEmpty) {
        buf.writeln('\n⏰ التطعيمات القادمة:');
        for (final v in upcoming)
          buf.writeln('  📋 ${v.iconEmoji} ${v.nameAr}');
      }

      if (due.isEmpty && upcoming.isEmpty) {
        buf.writeln('\n✅ جميع التطعيمات الأساسية مكتملة لهذا العمر!');
      }

      if (overdue.isNotEmpty) {
        buf.writeln(
            '\n🚨 ⚡ مهم: عندك ${overdue.length} تطعيمات متأخرة! روح المركز الصحي اليوم!');
      }

      _ctx.lastTopic = 'عمر الطفل';
      return BotResponse(buf.toString(), [
        const BotQuickReply(text: 'وش الآثار الجانبية؟', emoji: '⚠️'),
        const BotQuickReply(text: 'هل أطعم وهو مريض؟', emoji: '🤒'),
        const BotQuickReply(text: 'وين أطعمه؟', emoji: '📍'),
        const BotQuickReply(text: 'هل مجاني؟', emoji: '💰'),
      ]);
    }

    _ctx.awaitingClarification = true;
    _ctx.clarificationContext = 'age_query';
    return BotResponse('📅 كم عمر طفلك؟ (أكتب العمر بالشهور أو الأسابيع)', [
      const BotQuickReply(text: 'عمره شهر', emoji: '📅'),
      const BotQuickReply(text: 'عمره 3 شهور', emoji: '📅'),
      const BotQuickReply(text: 'عمره 6 شهور', emoji: '📅'),
      const BotQuickReply(text: 'عمره سنة', emoji: '📅'),
    ]);
  }

  BotResponse _handleVaccineList() {
    final schedule = VaccinationService().getFullSchedule();
    final buf = StringBuffer('💉 جدول التطعيمات الكامل:\n\n');
    for (final e in schedule.entries) {
      buf.writeln('📍 ${e.key}:');
      for (final v in e.value) buf.writeln('  ${v.iconEmoji} ${v.nameAr}');
      buf.writeln('');
    }
    buf.writeln(
        '📊 المجموع: ${VaccinationService.allVaccines.length} تطعيم ضد 11 مرض\n💡 اكتب عمر طفلك لمعرفة تطعيماته!');
    _ctx.lastTopic = 'جدول التطعيم';
    return BotResponse(buf.toString(), [
      const BotQuickReply(text: 'عمره 6 أشهر', emoji: '📅'),
      const BotQuickReply(text: 'وش الآثار؟', emoji: '⚠️'),
    ]);
  }

  BotResponse _handleSideEffects(String n) {
    final temp = SmartNLP.extractTemperature(n);
    if (temp != null) {
      _ctx.child.mentionedSymptoms.add('حرارة');
      _ctx.lastTopic = 'حرارة بعد التطعيم';
      final urgency = temp >= 39.5
          ? '🚨 حرارة عالية! اطلب طبيب فوراً'
          : temp >= 38.5
              ? '⚠️ حرارة متوسطة — راقب الطفل عن كثب'
              : '✅ حرارة خفيفة — طبيعية بعد التطعيم';
      return BotResponse(
        '🌡️ حرارة طفلك: ${temp}°\n$urgency\n\n${_kb['حرارة بعد التطعيم'] ?? ''}',
        [
          const BotQuickReply(text: 'متى أخاف؟', emoji: '🚨'),
          const BotQuickReply(text: 'متى أروح للطبيب؟', emoji: '🏥')
        ],
      );
    }

    if (n.contains('حراره') ||
        n.contains('سخون') ||
        n.contains('يسخن') ||
        n.contains('حمى')) {
      _ctx.lastTopic = 'حرارة بعد التطعيم';
      return BotResponse(
        _kb['حرارة بعد التطعيم'] ??
            '🌡️ الحرارة بعد التطعيم طبيعية. كم حرارته؟',
        [
          const BotQuickReply(text: 'حرارته 38', emoji: '🌡️'),
          const BotQuickReply(text: 'حرارته 39.5', emoji: '🌡️'),
          const BotQuickReply(text: 'متى أخاف؟', emoji: '🚨')
        ],
      );
    }

    if (n.contains('تشنج') || n.contains('نوبه') || n.contains('يرتعش')) {
      _ctx.lastTopic = 'تشنجات بعد التطعيم';
      return BotResponse(
          _kb['تشنجات بعد التطعيم'] ??
              '🚨 التشنجات حالة طوارئ — اطلب الإسعاف فوراً!',
          [
            const BotQuickReply(text: 'وش أسوي الحين؟', emoji: '🚨'),
          ]);
    }

    if (n.contains('تورم') || n.contains('انتفاخ') || n.contains('ورم')) {
      _ctx.lastTopic = 'تتورم مكان الحقن';
      return BotResponse(
          _kb['تتورم مكان الحقن'] ??
              '💡 التورم البسيط مكان الحقن طبيعي ويروح خلال أيام.',
          _ctxReplies('side_effects'));
    }

    _ctx.lastTopic = 'آثار جانبية';
    return BotResponse(_kb['آثار جانبية'] ?? '', _ctxReplies('side_effects'));
  }

  BotResponse _handleEmergency(String n) {
    if (RegExp(r'تشنج|نوبه|يرتعش|ما يتنفس|اختنق|فقد وعي').hasMatch(n)) {
      return BotResponse(
        '🚨 ⚡️ حالة طوارئ!\n\n'
        '1. اطلب الإسعاف فوراً (333 أو 119)\n'
        '2. ضع الطفل على جانبه في وضع التعافي\n'
        '3. لا تضع شيء في فمه أبداً\n'
        '4. دوّن مدة الحالة والحرارة\n\n'
        '⏰ لا تنتظر! اذهب للمستشفى أو اطلب إسعاف الآن!',
        [const BotQuickReply(text: 'وش أسوي بعد كذا؟', emoji: '🚨')],
      );
    }

    final temp = SmartNLP.extractTemperature(n);
    if (temp != null && temp >= 39) {
      return BotResponse(
        '🚨 حرارة طفلك ${temp}° عالية! ⚠️\n\n'
        '📋 افعل هذا فوراً:\n'
        '1. كمادات ماء دافئ على الجبهة\n'
        '2. أزع عنه الملابس الزائدة\n'
        '3. أعطه بارادول حسب وزنه\n'
        '4. إذا لم تنخفض خلال ساعة ← اذهب للمستشفى\n\n'
        '⚠️ لا تعطه أسبرين أبداً للطفل!',
        [
          const BotQuickReply(text: 'كم جرعة بارادول؟', emoji: '💊'),
          const BotQuickReply(text: 'متى أروح للمستشفى؟', emoji: '🏥')
        ],
      );
    }

    return BotResponse(
      '🚨 متى تطلب طبيب فوراً؟\n\n'
      '━━ خلال دقائق (طوارئ) ━━\n'
      '🔴 صعوبة تنفس\n🔴 تورم وجه/حلق\n🔴 شحوب شديد أو فقد وعي\n🔴 تشنجات\n\n'
      '━━ خلال ساعات ━━\n'
      '🟠 حرارة أكثر من 39.5°\n🟠 بكاء مستمر أكثر من 3 ساعات\n🟠 طفح جلدي شديد\n\n'
      '⏰ انتظر 15-30 دقيقة بعد التطعيم في المركز الصحي!\n📞 خط الطوارئ: 333 أو 119',
      [
        const BotQuickReply(text: 'حرارة بعد التطعيم', emoji: '🌡️'),
        const BotQuickReply(text: 'تشنجات', emoji: '🚨')
      ],
    );
  }

  BotResponse _handleChildSick(String n) {
    final symptoms = _ctx.child.mentionedSymptoms;
    if (symptoms.contains('تشنجات') ||
        n.contains('تشنج') ||
        n.contains('يرتعش')) {
      return BotResponse(
        '🚨 اطلب طبيب فوراً!\n\n'
        '⚠️ التشنجات حالة طوارئ:\n'
        '1. اطلب الإسعاف\n'
        '2. ضع الطفل على جانبه\n'
        '3. لا تضع شيء في فمه\n\n'
        '⏰ لا تنتظر — اذهب للمستشفى الآن!',
        [const BotQuickReply(text: 'وش أسوي؟', emoji: '🚨')],
      );
    }

    return BotResponse(
      '🤒 هل طفلك مريض؟\n\n'
      '📌 القاعدة الذهبية:\n'
      '• مرض بسيط (زكام، إسهال خفيف) ← يُطعم ✅\n'
      '• حرارة أقل من 38.5° ← يُطعم ✅\n'
      '• حرارة أكثر من 38.5° ← انتظر ⏳\n'
      '• مرض شديد ← انتظر حتى يتحسن ⏳\n\n'
      '💡 وش أعراض طفلك بالضبط؟',
      [
        const BotQuickReply(text: 'حرارته عالية', emoji: '🌡️'),
        const BotQuickReply(text: 'عنده إسهال', emoji: '💧')
      ],
    );
  }

  BotResponse _handleMyths(String n) {
    if (n.contains('اوتيزم') || n.contains('توحد')) {
      _ctx.lastTopic = 'التطعيم والتوحد';
      return BotResponse(_kb['التطعيم والتوحد'] ?? '', _ctxReplies('myths'));
    }
    if (n.contains('عقم') || n.contains('خصوبه')) {
      _ctx.lastTopic = 'التطعيم والعقم';
      return BotResponse(_kb['التطعيم والعقم'] ?? '', _ctxReplies('myths'));
    }
    _ctx.lastTopic = 'أساطير';
    return BotResponse(_kb['أساطير'] ?? '', [
      const BotQuickReply(text: 'هل يسبب أوتيزم؟', emoji: '🚫'),
      const BotQuickReply(text: 'هل يسبب عقم؟', emoji: '🚫'),
      const BotQuickReply(text: 'هل التطعيمات مضرة؟', emoji: '🚫'),
    ]);
  }

  BotResponse _handleSpecialCases(String n) {
    if (n.contains('مبتسر') || n.contains('خديج')) {
      _ctx.lastTopic = 'للأطفال المبتسرين';
      return BotResponse(
          _kb['للأطفال المبتسرين'] ?? '', _ctxReplies('special'));
    }
    if (n.contains('حامل') || n.contains('حوامل')) {
      _ctx.lastTopic = 'الحوامل';
      return BotResponse(_kb['الحوامل'] ?? '', _ctxReplies('special'));
    }
    return BotResponse('👶 حالات خاصة:', [
      const BotQuickReply(text: 'مبتسرين', emoji: '👶'),
      const BotQuickReply(text: 'حوامل', emoji: '🤰'),
      const BotQuickReply(text: 'سكر', emoji: '🟡'),
      const BotQuickReply(text: 'قلب', emoji: '❤️'),
    ]);
  }

  BotResponse _handleLocation() {
    _ctx.lastTopic = 'أين التطعيم';
    return BotResponse(_kb['أين التطعيم'] ?? '', [
      const BotQuickReply(text: 'هل مجاني؟', emoji: '💰'),
      const BotQuickReply(text: 'متى التطعيم؟', emoji: '📅'),
    ]);
  }

  BotResponse _handleCost() {
    _ctx.lastTopic = 'مجاناً';
    return BotResponse(_kb['مجاناً'] ?? '', [
      const BotQuickReply(text: 'وين أطعم؟', emoji: '📍'),
      const BotQuickReply(text: 'متى التطعيم؟', emoji: '📅'),
    ]);
  }

  BotResponse _handleCampaigns() {
    _ctx.lastTopic = 'حملات التطعيم';
    return BotResponse(_kb['حملات التطعيم'] ?? '', [
      const BotQuickReply(text: 'وين أطعم؟', emoji: '📍'),
      const BotQuickReply(text: 'هل مجاني؟', emoji: '💰'),
    ]);
  }

  BotResponse _handleDiseases(String n) {
    _ctx.lastTopic = 'الأمراض';
    return BotResponse(
      '🦠 الأمراض التي تحمي منها التطعيمات:\n\n'
      '1. السل\n2. شلل الأطفال\n3. الخناق\n4. الكزاز\n5. السعال الديبي\n'
      '6. التهاب الكبد B\n7. المستدمية النزلية\n8. الحصبة\n'
      '9. الحصبة الألمانية\n10. المكورات الرئوية\n11. الروتا فيروس\n\n'
      '💡 اسألني عن أي مرض بالتفصيل!',
      [
        const BotQuickReply(text: 'الحصبة', emoji: '🦠'),
        const BotQuickReply(text: 'شلل الأطفال', emoji: '🦠')
      ],
    );
  }

  BotResponse _handleNutrition(String n) {
    if (n.contains('رضاع') || n.contains('يرضع')) {
      _ctx.lastTopic = 'الرضاعة والتطعيم';
      return BotResponse(
          _kb['الرضاعة والتطعيم'] ?? '', _ctxReplies('nutrition'));
    }
    _ctx.lastTopic = 'تغذية الطفل والتطعيم';
    return BotResponse(
        _kb['تغذية الطفل والتطعيم'] ?? '', _ctxReplies('nutrition'));
  }

  BotResponse _handleColdChain(String n) {
    if (n.contains('vvm')) {
      _ctx.lastTopic = 'VVM';
      return BotResponse(_kb['VVM'] ?? '', _ctxReplies('cold_chain'));
    }
    _ctx.lastTopic = 'سلسلة التبريد';
    return BotResponse(_kb['سلسلة التبريد'] ?? '', _ctxReplies('cold_chain'));
  }

  BotResponse _handleSupportiveSupervision(String n) {
    _ctx.lastTopic = 'الأشراف الداعم';
    return BotResponse(
      _kb['الأشراف الداعم للتحصين'] ??
          '🔍 الإشراف الداعم للتحصين:\n\n'
              'عملية منظمة لتحسين أداء خدمات التحصين من خلال الزيارات الميدانية والتغذية الراجعة.\n\n'
              '📋 المكونات:\n'
              '1️⃣ التقييم 2️⃣ التغذية الراجعة 3️⃣ حل المشكلات 4️⃣ التدريب أثناء العمل 5️⃣ المتابعة',
      [
        const BotQuickReply(text: 'إدارة المستوى الوسيط', emoji: '🏢'),
        const BotQuickReply(text: 'مؤشرات الأداء', emoji: '📊')
      ],
    );
  }

  BotResponse _handleIntermediateManagement(String n) {
    _ctx.lastTopic = 'إدارة المستوى الوسيط';
    return BotResponse(
      _kb['إدارة المستوى الوسيط'] ??
          '🏢 إدارة المستوى الوسيط في التحصين:\n\n'
              'المستوى الوسيط هو مكتب الصحة بالمحافظة.\n\n'
              '📋 المهام: التخطيط الدقيق، الإشراف الداعم، متابعة مؤشرات الأداء، إدارة المخزون، رفع التقارير.',
      [
        const BotQuickReply(text: 'مؤشرات الأداء', emoji: '📊'),
        const BotQuickReply(text: 'إشراف داعم', emoji: '🔍'),
        const BotQuickReply(text: 'تخطيط دقيق', emoji: '📋')
      ],
    );
  }

  BotResponse _handleOutbreakResponse(String n) {
    _ctx.lastTopic = 'الاستجابة للأوبئة';
    return BotResponse(
      '🦠 الاستجابة للأوبئة والفاشيات:\n\n'
      '📌 الخطوات:\n1️⃣ التأكد من التشخيص والإبلاغ\n2️⃣ تحديد نطاق الفاشية\n'
      '3️⃣ تفعيل فريق الاستجابة السريعة\n4️⃣ حملة تحصين استجابية\n5️⃣ تعزيز الرصد الوبائي\n\n'
      '⚠️ تتطلب استجابة خلال 72 ساعة!',
      [
        const BotQuickReply(text: 'حملات', emoji: '🚐'),
        const BotQuickReply(text: 'توعية', emoji: '📢')
      ],
    );
  }

  BotResponse _handleReminder(String n) {
    if (_ctx.child.hasBasicInfo) {
      final upcoming = VaccinationService().getUpcomingVaccines(
        _ctx.child.ageWeeks ?? 0,
        _ctx.child.ageMonths ?? 0,
      );
      if (upcoming.isNotEmpty) {
        final buf = StringBuffer(
            '⏰ تذكير بالتطعيمات القادمة (${_ctx.child.ageDisplay}):\n\n');
        for (final v in upcoming) buf.writeln('📋 ${v.iconEmoji} ${v.nameAr}');
        return BotResponse(buf.toString(),
            [const BotQuickReply(text: 'وين أطعم؟', emoji: '📍')]);
      }
      return BotResponse(
          '✅ لا توجد تطعيمات قريبة لطفلك في العمر الحالي.', _welcomeReplies());
    }
    return BotResponse('📅 قولي عمر طفلك أولاً.', [
      const BotQuickReply(text: 'عمره 3 شهور', emoji: '📅'),
      const BotQuickReply(text: 'عمره 6 أشهر', emoji: '📅'),
    ]);
  }

  BotResponse _handleGreeting(String n) {
    return BotResponse(
      '🌟 هلا وغلا! مرحباً بك في مستشار التحصين 🇾🇪💉\n\n'
      '💡 اسألني عن أي شيء:\n• تطعيمات طفلك\n• الآثار الجانبية\n• الأشراف الداعم\n• الإدارة الوسيطة',
      _welcomeReplies(),
    );
  }

  BotResponse _handleClarificationResponse(String n, String context) {
    if (context == 'age_query') return _handleAge(n);
    return _handleDefault(n);
  }

  BotResponse _handleNegation(String n) {
    return BotResponse(
      '👍 ما يبي يطعمه الحين — مافي مشكلة!\n\n'
      '📌 بس تذكر:\n• التطعيم المتأخر أفضل من عدم التطعيم\n• لا تحتاج تبدأ من جديد\n• استأنف الجدول لما يتحسن',
      [const BotQuickReply(text: 'متى أرجع أطعمه؟', emoji: '⏰')],
    );
  }

  BotResponse _handleFollowUp(String n) {
    if (RegExp(r'^(نعم|ايوه|ايه|اي|يب|اوك|اوكي)').hasMatch(n)) {
      if (_ctx.lastTopic.isNotEmpty && _kb.containsKey(_ctx.lastTopic)) {
        return BotResponse(
            _kb[_ctx.lastTopic] ?? '', _ctxReplies(_ctx.lastTopic));
      }
    }
    if (RegExp(r'^(طيب|تمام|زين|اوكي|اوك|شكرا|فاهمت|فهمت)').hasMatch(n)) {
      return BotResponse('💡 تمام! عندك سؤال ثاني؟', _welcomeReplies());
    }
    return BotResponse('🤔 ممكن توضح أكثر وش تقصد بالضبط؟', _welcomeReplies());
  }

  BotResponse _handleCompoundQuestions(List<String> parts, String norm) {
    final buf = StringBuffer();
    List<BotQuickReply>? allReplies;
    for (int i = 0; i < parts.length && i < 3; i++) {
      final p = SmartNLP.normalize(parts[i]);
      final resp = _process(p);
      if (i > 0) buf.writeln('\n━━━━━━━━━━━━━━━━━━━━\n');
      buf.writeln(resp.text);
      if (resp.quickReplies != null && resp.quickReplies!.isNotEmpty) {
        allReplies = resp.quickReplies;
      }
    }
    return BotResponse(buf.toString(), allReplies ?? _welcomeReplies());
  }

  BotResponse _handleDefault(String n) {
    final age = SmartNLP.extractAge(n);
    if (age != null) return _handleAge(n);

    final temp = SmartNLP.extractTemperature(n);
    if (temp != null && temp > 38.5) {
      _ctx.child.mentionedSymptoms.add('حرارة');
      _ctx.lastTopic = 'حرارة بعد التطعيم';
      return BotResponse(
        '🌡️ حرارة طفلك ${temp}° — ${temp >= 39.5 ? '⚠️ عالية!' : 'راقب الوضع'}\n\n${_kb['حرارة بعد التطعيم'] ?? ''}',
        [const BotQuickReply(text: 'متى أخاف؟', emoji: '🚨')],
      );
    }

    if (_ctx.turnCount <= 1) {
      return BotResponse(
        '🤖 أهلاً! أنا مستشار التحصين الذكي 🇾🇪\n\n'
        'جرب تقولي:\n'
        '• "عمر طفلي 6 أشهر وش تطعيماته؟"\n'
        '• "وش الآثار الجانبية للخماسي؟"\n'
        '• "هل التطعيم يسبب أوتيزم؟"\n'
        '• "الأشراف الداعم للتحصين"\n\n'
        'أو اختر من الاقتراحات 👇',
        _welcomeReplies(),
      );
    }

    if (_ctx.lastTopic.isNotEmpty) {
      return BotResponse(
        '🤔 مش فاهم قصدك بالضبط. تبي تعرف أكثر عن "${_ctx.lastTopic}"؟\n\n'
        '💡 أو جرب تسأل بطريقة ثانية!',
        _welcomeReplies(),
      );
    }

    return BotResponse(
      '🤖 أقدر أساعدك في كل شيء متعلق بالتحصين!\n\n'
      '💡 جرب تسأل عن تطعيمات طفلك أو الآثار الجانبية.',
      _welcomeReplies(),
    );
  }

  // ═══ بحث في قاعدة البيانات الحقيقية ═══

  BotResponse? _searchRealDataKB(String n) {
    final dataKeywords = [
      'حمله شلل',
      'حملات شلل',
      'تغطيه',
      'تغطية',
      'افضل محافظه',
      'اقوى محافظه',
      'اضعف محافظه',
      'تعز',
      'الحديده',
      'المكلا',
      'عدن',
      'لحج',
      'مارب',
      'ابين',
      'حجه',
      'البيضاء',
      'الجوف',
      'توص',
      'بيانات حقيقي',
      'تقارير',
      'ارقام رسمي',
    ];

    bool hasDataKeyword = false;
    for (final kw in dataKeywords) {
      if (n.contains(kw)) {
        hasDataKeyword = true;
        break;
      }
    }
    if (!hasDataKeyword) return null;

    for (final entry in realDataKnowledgeBase.entries) {
      final keyNorm = SmartNLP.normalize(entry.key);
      for (final word in n.split(' ')) {
        if (word.length > 3 && keyNorm.contains(word)) {
          return BotResponse(entry.value, [
            const BotQuickReply(text: 'توصيات ذكية', emoji: '💡'),
            const BotQuickReply(text: 'تنبؤات 2026', emoji: '🔮'),
          ]);
        }
      }
    }
    return null;
  }

  String? _smartSearch(String n) {
    // بحث ضبابي
    final kbKeys = _kb.keys.toList();
    final fuzzyKey = SmartNLP.fuzzyFind(n, kbKeys, threshold: 0.72);
    if (fuzzyKey != null) return fuzzyKey;

    // بحث بالكلمات
    final words = n.split(' ').where((w) => w.length > 2).toList();
    for (final word in words) {
      for (final key in _kb.keys) {
        final kn = SmartNLP.normalize(key);
        if (kn.contains(word) && word.length > 3) return key;
      }
      for (final key in advancedImmunizationKB.keys) {
        final kn = SmartNLP.normalize(key);
        if (kn.contains(word) && word.length > 3) return key;
      }
    }

    return null;
  }

  // ═══ أدوات مساعدة ═══

  Map<String, String> get _kb => fullKnowledgeBase;

  void _record(String intent, String msg) {
    _ctx.recordTurn(msg, '', intent);
  }

  List<BotQuickReply> _welcomeReplies() => const [
        BotQuickReply(text: 'وش تطعيمات طفلي؟', emoji: '💉'),
        BotQuickReply(text: 'وش الآثار الجانبية؟', emoji: '⚠️'),
        BotQuickReply(text: 'هل مجاني؟', emoji: '💰'),
        BotQuickReply(text: 'هل يسبب أوتيزم؟', emoji: '🚫'),
        BotQuickReply(text: 'ولدي مريض', emoji: '🤒'),
        BotQuickReply(text: 'الأشراف الداعم', emoji: '🔍'),
        BotQuickReply(text: 'إدارة المستوى الوسيط', emoji: '🏢'),
        BotQuickReply(text: 'جدول التحصين', emoji: '📋'),
        BotQuickReply(text: 'سلسلة التبريد', emoji: '❄️'),
      ];

  List<BotQuickReply> _ctxReplies(String topic) {
    final m = {
      'side_effects': [
        const BotQuickReply(text: 'حرارة بعد التطعيم', emoji: '🌡️'),
        const BotQuickReply(text: 'تشنجات', emoji: '🚨'),
        const BotQuickReply(text: 'متى أخاف؟', emoji: '⚠️')
      ],
      'special': [
        const BotQuickReply(text: 'مبتسرين', emoji: '👶'),
        const BotQuickReply(text: 'حوامل', emoji: '🤰'),
        const BotQuickReply(text: 'سكر', emoji: '🟡'),
        const BotQuickReply(text: 'قلب', emoji: '❤️')
      ],
      'myths': [
        const BotQuickReply(text: 'هل يسبب أوتيزم؟', emoji: '🚫'),
        const BotQuickReply(text: 'هل يسبب عقم؟', emoji: '🚫'),
        const BotQuickReply(text: 'هل مضرة؟', emoji: '🚫')
      ],
      'nutrition': [
        const BotQuickReply(text: 'الرضاعة والتطعيم', emoji: '🍼'),
        const BotQuickReply(text: 'فيتامين أ', emoji: '🌟')
      ],
      'cold_chain': [
        const BotQuickReply(text: 'وش هو VVM؟', emoji: '🔍'),
        const BotQuickReply(text: 'سلسلة التبريد', emoji: '❄️')
      ],
      'vaccine_list': [
        const BotQuickReply(text: 'عمره 6 أشهر', emoji: '📅'),
        const BotQuickReply(text: 'وش الآثار؟', emoji: '⚠️')
      ],
    };
    return m[topic] ?? _welcomeReplies();
  }

  void _addBotMessage(String text, {List<BotQuickReply>? quickReplies}) {
    _messages.add(BotMessage(
      id: _gid(),
      text: text,
      isBot: true,
      timestamp: DateTime.now(),
      quickReplies: quickReplies,
    ));
  }

  String _gid() =>
      '${DateTime.now().millisecondsSinceEpoch}_${Random().nextInt(99999)}';

  void clearChat() {
    _messages.clear();
    _ctx.reset();
    initialize();
  }
}
