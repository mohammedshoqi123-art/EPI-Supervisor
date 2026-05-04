/// ═══════════════════════════════════════════════════════════════════════
///  محرك الاستشارة الصحية المحلي — يعمل 100% بدون إنترنت
///  منقول ومُحسّن من EPI-Bot/chat_service.dart
///  يدعم: 40+ نية، قاعدة معرفة شاملة، نظام أسئلة توضيحية
/// ═══════════════════════════════════════════════════════════════════════

import 'epi_nlp_engine.dart';
import 'epi_knowledge_base.dart';
import 'child_context_manager.dart';

/// نتيجة الاستشارة
class ConsultationResult {
  final String text;
  final String intent;
  final double confidence;
  final List<QuickReply> quickReplies;
  final bool needsClarification;
  final String? clarificationQuestion;
  final List<String>? clarificationOptions;

  const ConsultationResult({
    required this.text,
    required this.intent,
    required this.confidence,
    this.quickReplies = const [],
    this.needsClarification = false,
    this.clarificationQuestion,
    this.clarificationOptions,
  });
}

/// زر اقتراح سريع
class QuickReply {
  final String text;
  final String emoji;

  const QuickReply({required this.text, this.emoji = '💡'});
}

/// محرك الاستشارة الرئيسي
class LocalHealthConsultation {
  final ChildContextManager _ctx = ChildContextManager();
  final EpiKnowledgeBase _kb = EpiKnowledgeBase();

  ChildContextManager get context => _ctx;

  /// إعادة تعيين المحادثة
  void resetConversation() {
    _ctx.reset();
  }

  /// الرسالة الترحيبية
  ConsultationResult getWelcomeMessage() {
    return ConsultationResult(
      text: '🌟 مرحباً! أنا مساعد التحصين الذكي 🇾🇪\n\n'
          '💉 تطعيمات طفلك (حسب عمره وحالته)\n'
          '⚠️ الآثار الجانبية (حرارة، تورم، تشنجات)\n'
          '🦠 الأمراض التي تحمي منها التطعيمات\n'
          '👶 حالات خاصة (مبتسرين، سكري، قلب)\n'
          '🍼 التغذية وتأثيرها على المناعة\n'
          '🏥 الإشراف وإدارة المستوى الوسيط\n'
          '❄️ سلسلة التبريد و VVM\n\n'
          '💡 قولي عمر طفلك وأعطيك تطعيماته!',
      intent: 'greeting',
      confidence: 1.0,
      quickReplies: _welcomeReplies(),
    );
  }

  /// المعالجة الرئيسية
  ConsultationResult process(String raw) {
    final corrected = EpiNLPEngine.correctTypos(raw);
    final norm = EpiNLPEngine.normalize(corrected);

    // استخراج الكيانات
    _ctx.extractEntities(norm);
    final intentResult = EpiNLPEngine.detectIntent(norm,
        previousIntent: _ctx.lastTopic, lastTopic: _ctx.lastTopic);
    _ctx.updatePhase(intentResult.intent);

    // كشف الشكر
    if (EpiNLPEngine.isThanking(norm)) {
      return ConsultationResult(
        text: 'العفو! 😊 أي سؤال ثاني عن التحصين أنا موجود!',
        intent: 'feedback',
        confidence: 1.0,
        quickReplies: _welcomeReplies(),
      );
    }

    // ═══ معالجة مباشرة للرسائل الشائعة ═══
    final direct = _handleDirect(norm);
    if (direct != null) return direct;

    // ═══ أسئلة متعددة في رسالة واحدة ═══
    final parts = EpiNLPEngine.splitMultipleQuestions(raw);
    if (parts.length > 1) return _handleCompound(parts, norm);

    // ═══ هل يحتاج توضيح؟ ═══
    final clar = _ctx.needsClarification(norm, intentResult.intent);
    if (clar.needs) {
      _ctx.awaitingClarification = true;
      _ctx.clarificationContext = intentResult.intent;
      return ConsultationResult(
        text: clar.question,
        intent: 'clarification',
        confidence: 1.0,
        needsClarification: true,
        clarificationQuestion: clar.question,
        clarificationOptions: clar.options,
        quickReplies:
            clar.options.map((o) => QuickReply(text: o, emoji: '❓')).toList(),
      );
    }

    // ═══ إذا كان ينتظر توضيح ═══
    if (_ctx.awaitingClarification) {
      _ctx.awaitingClarification = false;
      return _handleClarification(norm, _ctx.clarificationContext);
    }

    // ═══ نفي ═══
    if (EpiNLPEngine.hasNegation(norm) && _ctx.lastTopic.isNotEmpty) {
      return _handleNegation(norm);
    }

    // ═══ مقارنة ═══
    if (EpiNLPEngine.hasComparison(norm)) {
      return _handleComparison(norm);
    }

    // ═══ معالجة حسب النية ═══
    switch (intentResult.intent) {
      case 'age_query':
        return _handleAge(norm);
      case 'vaccine_list':
        return _handleVaccineList();
      case 'schedule_query':
        return _handleScheduleQuery(norm);
      case 'dose_count':
        return _handleDose(norm);
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
      case 'vaccine_types':
        return _handleVaccineTypes(norm);
      case 'myths':
        return _handleMyths(norm);
      case 'special_cases':
        return _handleSpecialCases(norm);
      case 'nutrition':
        return _handleNutrition(norm);
      case 'cold_chain':
        return _handleColdChain(norm);
      case 'travel':
        return _handleTravel();
      case 'history':
        return _handleHistory();
      case 'benefits':
        return _handleBenefits();
      case 'diseases':
        return _handleDiseases(norm);
      case 'child_sick':
        return _handleChildSick(norm);
      case 'reminder':
        return _handleReminder(norm);
      // ═══ نوايا إدارية ═══
      case 'query_submissions':
        return _handleAdminQuery('submissions', norm);
      case 'query_shortages':
        return _handleAdminQuery('shortages', norm);
      case 'query_analytics':
        return _handleAdminQuery('analytics', norm);
      case 'query_governorates':
        return _handleAdminQuery('governorates', norm);
      case 'analyze_trend':
        return _handleAdminQuery('trend', norm);
      case 'query_users':
        return _handleAdminQuery('users', norm);
      default:
        break;
    }

    // ═══ بحث ذكي شامل ═══
    final found = _smartSearch(norm);
    if (found != null) {
      _ctx.lastTopic = found;
      final content = _kb.getTopic(found) ?? 'عذراً، لا تتوفر معلومات حالياً';
      return ConsultationResult(
        text: content,
        intent: 'knowledge_search',
        confidence: 0.6,
        quickReplies: _ctxReplies(found),
      );
    }

    // ═══ رد افتراضي ═══
    return _handleDefault(norm);
  }

  // ══════════════════════════════════════════════════════════════════
  //  المعالجات المباشرة (Quick Replies)
  // ══════════════════════════════════════════════════════════════════

  ConsultationResult? _handleDirect(String norm) {
    // تطعيمات الطفل
    if (norm.contains('تطعيمات طفلي') ||
        norm.contains('تطعيمات الطفل') ||
        norm.contains('وش تطعيمات') ||
        norm.contains('ايش تطعيمات') ||
        norm.contains('تطعيمات ولدي') ||
        norm.contains('تطعيمات بنتي')) {
      if (_ctx.child.hasBasicInfo) return _handleAge(norm);
      _ctx.awaitingClarification = true;
      _ctx.clarificationContext = 'age_query';
      return ConsultationResult(
        text: '📅 عشان أقدر أعطيك تطعيمات طفلك بالضبط، كم عمره؟',
        intent: 'clarification',
        confidence: 1.0,
        needsClarification: true,
        quickReplies: [
          const QuickReply(text: 'عمره شهر', emoji: '📅'),
          const QuickReply(text: 'عمره 3 شهور', emoji: '📅'),
          const QuickReply(text: 'عمره 6 شهور', emoji: '📅'),
          const QuickReply(text: 'عمره 9 شهور', emoji: '📅'),
          const QuickReply(text: 'عمره سنة', emoji: '📅'),
        ],
      );
    }

    // الآثار الجانبية
    if (norm.contains('الاثار الجانبيه') ||
        norm.contains('الآثار الجانبية') ||
        norm.contains('وش الآثار') ||
        norm.contains('وش اثار')) {
      _ctx.lastTopic = 'آثار جانبية';
      return ConsultationResult(
        text: _kb.getTopic('آثار جانبية') ?? '',
        intent: 'side_effects',
        confidence: 0.95,
        quickReplies: _ctxReplies('side_effects'),
      );
    }

    // مجاني
    if (norm.contains('مجاني') ||
        norm.contains('هل مجاني') ||
        norm.contains('بلاش')) {
      _ctx.lastTopic = 'مجاناً';
      return ConsultationResult(
        text: _kb.getTopic('مجاناً') ??
            '✅ جميع التطعيمات مجانية في اليمن!\n\nالتطعيمات تُقدم مجاناً في جميع المراكز الصحية الحكومية.',
        intent: 'cost',
        confidence: 0.95,
        quickReplies: const [
          QuickReply(text: 'وين أطعم؟', emoji: '📍'),
          QuickReply(text: 'متى التطعيم؟', emoji: '📅'),
        ],
      );
    }

    // أوتيزم / توحد
    if (norm.contains('اوتيزم') ||
        norm.contains('توحد') ||
        norm.contains('هل يسبب اوتيزم')) {
      _ctx.lastTopic = 'التطعيم والتوحد';
      return ConsultationResult(
        text: _kb.getTopic('التطعيم والتوحد') ?? '',
        intent: 'myths',
        confidence: 0.95,
        quickReplies: _ctxReplies('myths'),
      );
    }

    // عقم
    if (norm.contains('عقم') || norm.contains('خصوبه')) {
      _ctx.lastTopic = 'التطعيم والعقم';
      return ConsultationResult(
        text: _kb.getTopic('التطعيم والعقم') ?? '',
        intent: 'myths',
        confidence: 0.95,
        quickReplies: _ctxReplies('myths'),
      );
    }

    // ولدي مريض
    if (norm.contains('ولدي مريض') ||
        norm.contains('طفلي مريض') ||
        norm.contains('بنتي مريض') ||
        norm.contains('هل اطعم وهو مريض')) {
      return _handleChildSick(norm);
    }

    // إشراف داعم
    if (norm.contains('اشراف') ||
        norm.contains('إشراف') ||
        norm.contains('اشراف داعم')) {
      _ctx.lastTopic = 'الإشراف الداعم';
      return ConsultationResult(
        text: _kb.getTopic('الإشراف الداعم') ?? '',
        intent: 'supervision',
        confidence: 0.9,
        quickReplies: const [
          QuickReply(text: 'إدارة المستوى الوسيط', emoji: '📋'),
          QuickReply(text: 'مؤشرات الأداء', emoji: '📊'),
          QuickReply(text: 'التخطيط الدقيق', emoji: '📝'),
        ],
      );
    }

    // متى أخاف
    if (norm.contains('متى اخاف') ||
        norm.contains('متى اخاف عليه') ||
        norm.contains('متى اقلق')) {
      return _handleEmergency(norm);
    }

    return null;
  }

  // ══════════════════════════════════════════════════════════════════
  //  معالجات النوايا
  // ══════════════════════════════════════════════════════════════════

  ConsultationResult _handleAge(String norm) {
    // استخراج العمر
    final age = EpiNLPEngine.extractAge(norm);
    if (age != null) {
      _ctx.child.ageMonths = age.months;
      _ctx.child.ageWeeks = age.weeks;
      _ctx.child.ageDays = age.days;
      _ctx.child.lastUpdated = DateTime.now();
    }

    if (!_ctx.child.hasBasicInfo) {
      return ConsultationResult(
        text: '📅 كم عمر طفلك؟ أقدر أساعدك بالتطعيمات المطلوبة',
        intent: 'age_query',
        confidence: 0.5,
        quickReplies: const [
          QuickReply(text: 'عمره شهر', emoji: '📅'),
          QuickReply(text: 'عمره شهرين', emoji: '📅'),
          QuickReply(text: 'عمره 6 شهور', emoji: '📅'),
          QuickReply(text: 'عمره سنة', emoji: '📅'),
        ],
      );
    }

    // التطعيمات المطلوبة حسب العمر
    final vaccines =
        _kb.getVaccinesByAge(_ctx.child.totalMonths, _ctx.child.totalWeeks);
    _ctx.lastTopic = 'تطعيمات حسب العمر';

    final buf = StringBuffer();
    buf.writeln(
        '💉 تطعيمات ${_ctx.child.name != null ? _ctx.child.name! : "طفلك"} (${_ctx.child.ageDisplay}):');
    buf.writeln('');

    if (vaccines.isEmpty) {
      buf.writeln('✅ كل التطعيمات الأساسية مكتملة! 🎉');
      buf.writeln('لا تنسَ التطعيمات التعزيزية في عمر 18 شهر و 6 سنوات.');
    } else {
      for (final v in vaccines) {
        buf.writeln('${v['emoji']} ${v['name']} — ${v['description']}');
      }
    }

    if (_ctx.child.isPremature) {
      buf.writeln(
          '\n👶 ملاحظة: الأطفال المبتسرين يأخذون نفس الجدول حسب العمر الزمني (وليس حسب تاريخ الولادة)');
    }
    if (_ctx.child.hasChronicDisease) {
      buf.writeln(
          '\n⚠️ ${_ctx.child.chronicDiseaseType}: استشر الطبيب قبل التطعيم');
    }

    return ConsultationResult(
      text: buf.toString(),
      intent: 'age_query',
      confidence: 0.95,
      quickReplies: const [
        QuickReply(text: 'وش الآثار الجانبية؟', emoji: '⚠️'),
        QuickReply(text: 'هل مجاني؟', emoji: '💰'),
        QuickReply(text: 'وين أطعم؟', emoji: '📍'),
        QuickReply(text: 'جرعات أكثر؟', emoji: '🔢'),
      ],
    );
  }

  ConsultationResult _handleVaccineList() {
    if (_ctx.child.hasBasicInfo) return _handleAge('');
    _ctx.awaitingClarification = true;
    _ctx.clarificationContext = 'age_query';
    return ConsultationResult(
      text: '📅 عشان أقدر أعطيك تطعيمات طفلك بالضبط، كم عمره؟',
      intent: 'vaccine_list',
      confidence: 1.0,
      needsClarification: true,
      quickReplies: const [
        QuickReply(text: 'عمره شهر', emoji: '📅'),
        QuickReply(text: 'عمره 3 شهور', emoji: '📅'),
        QuickReply(text: 'عمره 6 شهور', emoji: '📅'),
        QuickReply(text: 'عمره سنة', emoji: '📅'),
      ],
    );
  }

  ConsultationResult _handleScheduleQuery(String norm) {
    _ctx.lastTopic = 'متى أطعم';
    final schedule = _kb.getFullSchedule();
    return ConsultationResult(
      text: schedule,
      intent: 'schedule_query',
      confidence: 0.9,
      quickReplies: _welcomeReplies(),
    );
  }

  ConsultationResult _handleDose(String norm) {
    _ctx.lastTopic = 'كم جرعة';
    return ConsultationResult(
      text: _kb.getTopic('كم جرعة') ?? '',
      intent: 'dose_count',
      confidence: 0.9,
      quickReplies: _ctxReplies('vaccine_list'),
    );
  }

  ConsultationResult _handleSideEffects(String norm) {
    // تحديد أي تطعيم
    String? vaccine;
    if (norm.contains('خماسي'))
      vaccine = 'خماسي';
    else if (norm.contains('حصبه') || norm.contains('حصبة'))
      vaccine = 'حصبة';
    else if (norm.contains('شلل'))
      vaccine = 'شلل';
    else if (norm.contains('روتا'))
      vaccine = 'روتا';
    else if (norm.contains('رئوي'))
      vaccine = 'رئوي';
    else if (norm.contains('بي سي جي') || norm.contains('bcg')) vaccine = 'bcg';

    _ctx.lastTopic = 'آثار جانبية';
    _ctx.lastVaccine = vaccine ?? '';

    final text = vaccine != null
        ? (_kb.getTopic('آثار $vaccine') ?? _kb.getTopic('آثار جانبية') ?? '')
        : (_kb.getTopic('آثار جانبية') ?? '');

    return ConsultationResult(
      text: text,
      intent: 'side_effects',
      confidence: 0.9,
      quickReplies: const [
        QuickReply(text: 'متى أخاف؟', emoji: '🚨'),
        QuickReply(text: 'حرارة بعد التطعيم', emoji: '🌡️'),
        QuickReply(text: 'هل طبيعي؟', emoji: '✅'),
      ],
    );
  }

  ConsultationResult _handleEmergency(String norm) {
    _ctx.lastTopic = 'طوارئ';
    return ConsultationResult(
      text: _kb.getTopic('حالات الطوارئ') ??
          '🚨 متى تذهب للطبيب فوراً:\n\n'
              '• تشنجات أو نوبات\n'
              '• صعوبة في التنفس\n'
              '• تورم الوجه أو الحلق\n'
              '• طفح جلدي شديد\n'
              '• حرارة فوق 40°\n'
              '• بكاء مستمر أكثر من 3 ساعات\n'
              '• شحوب شديد أو ضعف عام\n\n'
              '⏰ انتظر 15-30 دقيقة بعد التطعيم في المركز الصحي',
      intent: 'emergency',
      confidence: 0.95,
      quickReplies: const [
        QuickReply(text: 'اسعاف فوري', emoji: '🚨'),
        QuickReply(text: 'متى أروح للطبيب؟', emoji: '🏥'),
      ],
    );
  }

  ConsultationResult _handleLocation() {
    _ctx.lastTopic = 'مكان التطعيم';
    return ConsultationResult(
      text: _kb.getTopic('أماكن التطعيم') ??
          '📍 وين تطعم طفلك:\n\n'
              '• جميع المراكز الصحية الحكومية\n'
              '• الوحدات الصحية\n'
              '• خلال الحملات الوطنية (في المدارس والأسواق)\n\n'
              '✅ التطعيم مجاني في كل الأماكن\n'
              '💡 اسأل أقرب مركز صحي منك عن مواعيد التطعيم',
      intent: 'location',
      confidence: 0.9,
      quickReplies: const [
        QuickReply(text: 'هل مجاني؟', emoji: '💰'),
        QuickReply(text: 'متى التطعيم؟', emoji: '📅'),
      ],
    );
  }

  ConsultationResult _handleCost() {
    _ctx.lastTopic = 'مجاناً';
    return ConsultationResult(
      text: _kb.getTopic('مجاناً') ??
          '💰 هل التطعيم مجاني؟\n\n'
              '✅ نعم! جميع التطعيمات مجانية 100%\n\n'
              '• في المراكز الصحية الحكومية\n'
              '• خلال الحملات الوطنية\n'
              '• حتى في المناطق النائية\n\n'
              '🚫 أي شخص يطلب فلوس مقابل التطعيم → اشتكِ عليه!',
      intent: 'cost',
      confidence: 0.95,
      quickReplies: const [
        QuickReply(text: 'وين أطعم؟', emoji: '📍'),
        QuickReply(text: 'متى التطعيم؟', emoji: '📅'),
      ],
    );
  }

  ConsultationResult _handleCampaigns() {
    _ctx.lastTopic = 'حملات التطعيم';
    return ConsultationResult(
      text: _kb.getTopic('حملات التطعيم') ??
          '🚐 حملات التطعيم الوطنية:\n\n'
              '• حملات شلل الأطفال (OPV) — سنوياً\n'
              '• حملة MR (الحصبة) — حسب الحاجة\n'
              '• أيام التحصين الوطني (NIDs)\n\n'
              '📅 الحملات تعلن عبر الإعلام والمساجد\n'
              '✅ التطعيم مجاني خلال الحملات',
      intent: 'campaigns',
      confidence: 0.9,
      quickReplies: _welcomeReplies(),
    );
  }

  ConsultationResult _handleVaccineTypes(String norm) {
    _ctx.lastTopic = 'أنواع التطعيمات';
    return ConsultationResult(
      text: _kb.getTopic('أنواع التطعيمات') ?? '',
      intent: 'vaccine_types',
      confidence: 0.9,
      quickReplies: const [
        QuickReply(text: 'الخماسي', emoji: '5️⃣'),
        QuickReply(text: 'شلل الأطفال', emoji: '💧'),
        QuickReply(text: 'الحصبة', emoji: '🔴'),
        QuickReply(text: 'الروتا', emoji: '🦠'),
      ],
    );
  }

  ConsultationResult _handleMyths(String norm) {
    _ctx.lastTopic = 'أساطير';
    String myth = 'أساطير عامة';
    if (norm.contains('توحد') || norm.contains('اوتيزم'))
      myth = 'التطعيم والتوحد';
    else if (norm.contains('عقم'))
      myth = 'التطعيم والعقم';
    else if (norm.contains('ضرر') ||
        norm.contains('مضرة') ||
        norm.contains('خطر')) myth = 'هل التطعيم يضر';

    return ConsultationResult(
      text: _kb.getTopic(myth) ?? _kb.getTopic('أساطير') ?? '',
      intent: 'myths',
      confidence: 0.9,
      quickReplies: _welcomeReplies(),
    );
  }

  ConsultationResult _handleSpecialCases(String norm) {
    String caseType = 'حالات خاصة';
    if (norm.contains('مبتسر') || norm.contains('خديج'))
      caseType = 'للأطفال المبتسرين';
    else if (norm.contains('حوامل') || norm.contains('حامل'))
      caseType = 'الحوامل';
    else if (norm.contains('سكر'))
      caseType = 'الأطفال المصابين بالسكري';
    else if (norm.contains('قلب'))
      caseType = 'الأطفال المصابين بالقلب';
    else if (norm.contains('hiv') || norm.contains('ايدز'))
      caseType = 'تطعيم الأطفال المصابين بـ HIV';

    _ctx.lastTopic = caseType;
    return ConsultationResult(
      text: _kb.getTopic(caseType) ??
          '👶 حالات خاصة:\n\nاستشر الطبيب المختص قبل التطعيم',
      intent: 'special_cases',
      confidence: 0.85,
      quickReplies: _welcomeReplies(),
    );
  }

  ConsultationResult _handleNutrition(String norm) {
    _ctx.lastTopic = 'التغذية';
    return ConsultationResult(
      text: _kb.getTopic('التغذية والتطعيم') ??
          _kb.getTopic('الرضاعة والتطعيم') ??
          '',
      intent: 'nutrition',
      confidence: 0.85,
      quickReplies: const [
        QuickReply(text: 'فيتامين أ', emoji: '🌟'),
        QuickReply(text: 'الرضاعة الطبيعية', emoji: '🍼'),
      ],
    );
  }

  ConsultationResult _handleColdChain(String norm) {
    _ctx.lastTopic = 'سلسلة التبريد';
    return ConsultationResult(
      text: _kb.getTopic('سلسلة التبريد') ?? '',
      intent: 'cold_chain',
      confidence: 0.9,
      quickReplies: const [
        QuickReply(text: 'VVM', emoji: '🌡️'),
        QuickReply(text: 'سياسة القارورة المفتوحة', emoji: '💉'),
      ],
    );
  }

  ConsultationResult _handleTravel() {
    _ctx.lastTopic = 'السفر';
    return ConsultationResult(
      text: _kb.getTopic('تطعيمات السفر') ?? '',
      intent: 'travel',
      confidence: 0.85,
      quickReplies: _welcomeReplies(),
    );
  }

  ConsultationResult _handleHistory() {
    _ctx.lastTopic = 'تاريخ التحصين';
    return ConsultationResult(
      text: _kb.getTopic('تاريخ التحصين في اليمن') ?? '',
      intent: 'history',
      confidence: 0.85,
      quickReplies: _welcomeReplies(),
    );
  }

  ConsultationResult _handleBenefits() {
    _ctx.lastTopic = 'فوائد التطعيم';
    return ConsultationResult(
      text:
          _kb.getTopic('فوائد التطعيم') ?? _kb.getTopic('تعريف التطعيم') ?? '',
      intent: 'benefits',
      confidence: 0.85,
      quickReplies: _welcomeReplies(),
    );
  }

  ConsultationResult _handleDiseases(String norm) {
    _ctx.lastTopic = 'الأمراض';
    return ConsultationResult(
      text: _kb.getTopic('أمراض التحصين') ?? '',
      intent: 'diseases',
      confidence: 0.85,
      quickReplies: const [
        QuickReply(text: 'السل', emoji: '🔴'),
        QuickReply(text: 'شلل الأطفال', emoji: '💧'),
        QuickReply(text: 'الخناق', emoji: '🟡'),
        QuickReply(text: 'الحصبة', emoji: '🔴'),
      ],
    );
  }

  ConsultationResult _handleChildSick(String norm) {
    _ctx.lastTopic = 'الطفل مريض';
    return ConsultationResult(
      text: _kb.getTopic('هل أطعم وهو مريض') ??
          '🤒 هل أطعم طفلي وهو مريض؟\n\n'
              '✅ نعم في معظم الحالات:\n'
              '• زكام خفيف أو سعال\n'
              '• إسهال خفيف بدون جفاف\n'
              '• حرارة أقل من 38.5°\n\n'
              '⚠️ أجل التطعيم إذا:\n'
              '• حرارة عالية (أكثر من 38.5°)\n'
              '• مرض حاد شديد\n'
              '• يتناول أدوية كبت المناعة\n\n'
              '💡 سخونه خفيفه مو سبب لتأخير التطعيم!',
      intent: 'child_sick',
      confidence: 0.9,
      quickReplies: const [
        QuickReply(text: 'متى أخاف؟', emoji: '🚨'),
        QuickReply(text: 'متى أروح للطبيب؟', emoji: '🏥'),
      ],
    );
  }

  ConsultationResult _handleReminder(String norm) {
    if (_ctx.child.hasBasicInfo) {
      final dueVaccines = _kb.getDueVaccines(_ctx.child.totalMonths);
      if (dueVaccines.isNotEmpty) {
        return ConsultationResult(
          text:
              '⏰ تذكير بتطعيمات ${_ctx.child.name ?? "طفلك"}:\n\n${dueVaccines.map((v) => "• ${v['name']} — ${v['description']}").join("\n")}\n\nلا تتأخر! كل يوم تأخير = خطر أكبر',
          intent: 'reminder',
          confidence: 0.9,
          quickReplies: const [
            QuickReply(text: 'وين أطعم؟', emoji: '📍'),
            QuickReply(text: 'هل مجاني؟', emoji: '💰'),
          ],
        );
      }
    }
    return ConsultationResult(
      text:
          '⏰ أقدر أعطيك تذكيرات بالتطعيمات المطلوبة!\n\nقولي عمر طفلك وأحسب لك التطعيمات القادمة',
      intent: 'reminder',
      confidence: 0.5,
      quickReplies: const [
        QuickReply(text: 'عمره 3 شهور', emoji: '📅'),
        QuickReply(text: 'عمره 6 شهور', emoji: '📅'),
      ],
    );
  }

  ConsultationResult _handleClarification(String norm, String context) {
    switch (context) {
      case 'age_query':
        final age = EpiNLPEngine.extractAge(norm);
        if (age != null) {
          _ctx.child.ageMonths = age.months;
          _ctx.child.ageWeeks = age.weeks;
          _ctx.child.ageDays = age.days;
          _ctx.child.lastUpdated = DateTime.now();
        }
        return _handleAge(norm);
      case 'side_effects':
        return _handleSideEffects(norm);
      default:
        return _handleDefault(norm);
    }
  }

  ConsultationResult _handleNegation(String norm) {
    return ConsultationResult(
      text:
          '👌 ما في مشكلة. إذا تبي مساعدة في أي وقت، أنا هنا!\n\n💡 اسألني عن أي شيء يخص التحصين',
      intent: 'negation',
      confidence: 0.9,
      quickReplies: _welcomeReplies(),
    );
  }

  ConsultationResult _handleComparison(String norm) {
    return ConsultationResult(
      text:
          '📊 المقارنة:\n\nكل التطعيمات مجدولة حسب الدليل الرسمي لوزارة الصحة. الجدول مُعتمد من WHO و UNICEF.\n\n💡 إذا عندك سؤال عن تطعيم محدد، قولي وأشرح لك بالتفصيل',
      intent: 'comparison',
      confidence: 0.7,
      quickReplies: _welcomeReplies(),
    );
  }

  ConsultationResult _handleCompound(List<String> parts, String norm) {
    final buf = StringBuffer();
    for (int i = 0; i < parts.length && i < 3; i++) {
      final result = process(parts[i].trim());
      if (i > 0) buf.writeln('\n━━━━━━━━━━━━━━━━\n');
      buf.writeln(result.text);
    }
    return ConsultationResult(
      text: buf.toString(),
      intent: 'compound',
      confidence: 0.8,
      quickReplies: _welcomeReplies(),
    );
  }

  /// معالجة الاستعلامات الإدارية — توجيه للسيرفر
  ConsultationResult _handleAdminQuery(String type, String norm) {
    return ConsultationResult(
      text: '📊 هذا الاستعلام يحتاج بيانات من النظام.\n\n'
          '🔄 يرجى التأكد من اتصالك بالإنترنت للحصول على أحدث البيانات.\n\n'
          '💡 في وضع بدون إنترنت، أقدر أساعدك بالاستشارات الصحية والتطعيمات.',
      intent: 'admin_redirect',
      confidence: 0.5,
      quickReplies: _welcomeReplies(),
    );
  }

  ConsultationResult _handleDefault(String norm) {
    return ConsultationResult(
      text: '🤔 ما فهمت السؤال تماماً. جرب تسأل عن:\n\n'
          '💉 تطعيمات طفلك حسب عمره\n'
          '⚠️ الآثار الجانبية للتطعيمات\n'
          '🦠 الأمراض اللي تحميها التطعيمات\n'
          '👶 حالات خاصة (مبتسرين، سكري...)\n'
          '📍 وين تطعم (مراكز صحية)',
      intent: 'default',
      confidence: 0.1,
      quickReplies: _welcomeReplies(),
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  البحث الذكي
  // ══════════════════════════════════════════════════════════════════

  String? _smartSearch(String norm) {
    final keywords = EpiNLPEngine.extractKeywords(norm);
    final expanded = EpiNLPEngine.expandWithClusters(keywords);

    final allTopics = _kb.getAllTopicKeys();
    for (final topic in allTopics) {
      final topicNorm = EpiNLPEngine.normalize(topic);
      for (final kw in expanded) {
        if (topicNorm.contains(EpiNLPEngine.normalize(kw)) ||
            EpiNLPEngine.normalize(kw).contains(topicNorm)) {
          return topic;
        }
      }
    }

    // Fuzzy search
    for (final kw in expanded) {
      final hit = EpiNLPEngine.fuzzyFind(
          kw, allTopics.map((t) => EpiNLPEngine.normalize(t)).toList(),
          threshold: 0.8);
      if (hit != null) {
        final idx =
            allTopics.indexWhere((t) => EpiNLPEngine.normalize(t) == hit);
        if (idx >= 0) return allTopics[idx];
      }
    }

    return null;
  }

  // ══════════════════════════════════════════════════════════════════
  //  مساعدات (Helpers)
  // ══════════════════════════════════════════════════════════════════

  List<QuickReply> _welcomeReplies() => const [
        QuickReply(text: 'تطعيمات طفلي', emoji: '💉'),
        QuickReply(text: 'الآثار الجانبية', emoji: '⚠️'),
        QuickReply(text: 'هل مجاني؟', emoji: '💰'),
        QuickReply(text: 'وين أطعم؟', emoji: '📍'),
        QuickReply(text: 'حالات خاصة', emoji: '👶'),
        QuickReply(text: 'أسئلة شائعة', emoji: '❓'),
      ];

  List<QuickReply> _ctxReplies(String topic) {
    switch (topic) {
      case 'side_effects':
        return const [
          QuickReply(text: 'متى أخاف؟', emoji: '🚨'),
          QuickReply(text: 'حرارة بعد التطعيم', emoji: '🌡️')
        ];
      case 'cold_chain':
        return const [
          QuickReply(text: 'VVM', emoji: '🌡️'),
          QuickReply(text: 'القارورة المفتوحة', emoji: '💉')
        ];
      case 'myths':
        return const [
          QuickReply(text: 'التطعيم والتوحد', emoji: '🚫'),
          QuickReply(text: 'هل التطعيم يضر؟', emoji: '❓')
        ];
      default:
        return _welcomeReplies();
    }
  }
}
