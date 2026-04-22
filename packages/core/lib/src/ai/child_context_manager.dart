/// ═══════════════════════════════════════════════════════════════════════
///  Child Context Manager — يتتبع بيانات الطفل طوال المحادثة
///  منقول من EPI-Bot/context_manager.dart + تحسينات
/// ═══════════════════════════════════════════════════════════════════════

/// كيان الطفل المستخرج من المحادثة
class ChildProfile {
  String? name;
  int? ageMonths;
  int? ageWeeks;
  int? ageDays;
  String? gender; // ذكر / أنثى
  bool isPremature = false;
  bool hasChronicDisease = false;
  String? chronicDiseaseType;
  List<String> givenVaccines = [];
  List<String> mentionedSymptoms = [];
  DateTime? lastUpdated;

  ChildProfile();

  bool get hasBasicInfo => ageMonths != null || ageWeeks != null || ageDays != null;

  int get totalWeeks {
    if (ageWeeks != null) return ageWeeks!;
    if (ageMonths != null) return (ageMonths! * 30) ~/ 7;
    if (ageDays != null) return ageDays! ~/ 7;
    return 0;
  }

  int get totalMonths {
    if (ageMonths != null) return ageMonths!;
    if (ageWeeks != null) return (ageWeeks! * 7) ~/ 30;
    return 0;
  }

  String get ageDisplay {
    if (ageMonths != null && ageMonths! > 0) {
      if (ageMonths! >= 12) {
        final years = ageMonths! ~/ 12;
        final months = ageMonths! % 12;
        if (months == 0) return '$years سنة';
        return '$years سنة و $months أشهر';
      }
      return '$ageMonths أشهر';
    }
    if (ageWeeks != null && ageWeeks! > 0) return '$ageWeeks أسابيع';
    if (ageDays != null && ageDays! > 0) return '$ageDays أيام';
    return 'غير محدد';
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'ageMonths': ageMonths,
    'ageWeeks': ageWeeks,
    'ageDays': ageDays,
    'gender': gender,
    'isPremature': isPremature,
    'hasChronicDisease': hasChronicDisease,
    'chronicDiseaseType': chronicDiseaseType,
    'givenVaccines': givenVaccines,
    'mentionedSymptoms': mentionedSymptoms,
  };

  factory ChildProfile.fromJson(Map<String, dynamic> j) {
    final p = ChildProfile();
    p.name = j['name'] as String?;
    p.ageMonths = j['ageMonths'] as int?;
    p.ageWeeks = j['ageWeeks'] as int?;
    p.ageDays = j['ageDays'] as int?;
    p.gender = j['gender'] as String?;
    p.isPremature = j['isPremature'] as bool? ?? false;
    p.hasChronicDisease = j['hasChronicDisease'] as bool? ?? false;
    p.chronicDiseaseType = j['chronicDiseaseType'] as String?;
    p.givenVaccines = List<String>.from(j['givenVaccines'] as List? ?? []);
    p.mentionedSymptoms = List<String>.from(j['mentionedSymptoms'] as List? ?? []);
    return p;
  }

  void reset() {
    name = null;
    ageMonths = null;
    ageWeeks = null;
    ageDays = null;
    gender = null;
    isPremature = false;
    hasChronicDisease = false;
    chronicDiseaseType = null;
    givenVaccines.clear();
    mentionedSymptoms.clear();
    lastUpdated = null;
  }
}

/// حالة المحادثة
enum ConversationPhase {
  greeting,        // بداية المحادثة
  collecting,      // جمع معلومات
  consulting,      // تقديم استشارة
  followUp,        // متابعة
  clarification,   // طلب توضيح
  emergency,       // حالة طوارئ
}

/// دورة محادثة واحدة
class ConversationTurn {
  final String userMessage;
  final String botResponse;
  final String intent;
  final DateTime timestamp;
  final String topic;

  ConversationTurn({
    required this.userMessage,
    required this.botResponse,
    required this.intent,
    required this.timestamp,
    required this.topic,
  });
}

/// مدير السياق الرئيسي
class ChildContextManager {
  final ChildProfile child = ChildProfile();

  ConversationPhase phase = ConversationPhase.greeting;
  String lastTopic = '';
  String lastVaccine = '';
  String lastDisease = '';
  String pendingClarification = '';

  final List<ConversationTurn> history = [];
  final Map<String, dynamic> extractedEntities = {};
  final List<String> discussedTopics = [];
  int turnCount = 0;

  bool awaitingClarification = false;
  String clarificationContext = '';
  List<String> clarificationOptions = [];

  /// تسجيل دورة محادثة جديدة
  void recordTurn(String userMessage, String botResponse, String intent) {
    history.add(ConversationTurn(
      userMessage: userMessage,
      botResponse: botResponse,
      intent: intent,
      timestamp: DateTime.now(),
      topic: lastTopic,
    ));
    turnCount++;
    if (history.length > 20) history.removeAt(0);
  }

  /// استخراج كيانات من رسالة المستخدم
  void extractEntities(String normalized) {
    _extractChildAge(normalized);
    _extractChildGender(normalized);
    _extractChildName(normalized);
    _extractSymptoms(normalized);
    _extractChronicConditions(normalized);
    _extractPrematurity(normalized);
    _extractVaccineHistory(normalized);
  }

  void _extractChildAge(String n) {
    // عمره X شهر
    final ageMatch = RegExp(r'عمره?\s*(\d+)\s*(شهر|شهور|شه)').firstMatch(n);
    if (ageMatch != null) {
      child.ageMonths = int.tryParse(ageMatch.group(1)!);
      child.lastUpdated = DateTime.now();
      return;
    }
    // عنده X شهر
    final hasMatch = RegExp(r'عنده[ا]?\s*(\d+)\s*(شه|شهر)?').firstMatch(n);
    if (hasMatch != null) {
      final v = int.tryParse(hasMatch.group(1)!);
      if (v != null && v <= 72) {
        child.ageMonths = v;
        child.lastUpdated = DateTime.now();
        return;
      }
    }
    // X اسبوع
    final weekMatch = RegExp(r'(\d+)\s*(اسبوع|اسابيع)').firstMatch(n);
    if (weekMatch != null) {
      child.ageWeeks = int.tryParse(weekMatch.group(1)!);
      child.ageMonths = (child.ageWeeks! * 7) ~/ 30;
      child.lastUpdated = DateTime.now();
      return;
    }
    // X يوم / يومين
    if (n.contains('يومين')) {
      child.ageDays = 2;
      child.ageWeeks = 0;
      child.ageMonths = 0;
      child.lastUpdated = DateTime.now();
      return;
    }
    final dayMatch = RegExp(r'(\d+)\s*(يوم|ايام)').firstMatch(n);
    if (dayMatch != null) {
      child.ageDays = int.tryParse(dayMatch.group(1)!);
      child.ageWeeks = (child.ageDays! ~/ 7);
      child.ageMonths = 0;
      child.lastUpdated = DateTime.now();
      return;
    }
    // ولد اليوم
    if (n.contains('ولده') || n.contains('ولد اليوم') || n.contains('مولود جديد')) {
      child.ageDays = 0;
      child.ageWeeks = 0;
      child.ageMonths = 0;
      child.lastUpdated = DateTime.now();
      return;
    }
    // عمره شهر (بدون رقم)
    if (n.contains('عمره شهر') && !RegExp(r'\d').hasMatch(n.split('شهر')[0])) {
      child.ageMonths = 1;
      child.ageWeeks = 4;
      child.lastUpdated = DateTime.now();
      return;
    }
    if (n.contains('عمره شهرين')) {
      child.ageMonths = 2;
      child.ageWeeks = 8;
      child.lastUpdated = DateTime.now();
      return;
    }
    // عمره سنه
    if (n.contains('عمره سنه') || n.contains('عمرها سنه') ||
        n.contains('سنه وحده') || n.contains('سنة واحدة')) {
      child.ageMonths = 12;
      child.lastUpdated = DateTime.now();
      return;
    }
    if (n.contains('سنتين')) {
      child.ageMonths = 24;
      child.lastUpdated = DateTime.now();
      return;
    }
  }

  void _extractChildGender(String n) {
    if (RegExp(r'ولد|ولدي|ابني|اخوي|ولده').hasMatch(n)) child.gender = 'ذكر';
    if (RegExp(r'بنت|بنتي|اختي|بنتها').hasMatch(n)) child.gender = 'أنثى';
  }

  void _extractChildName(String n) {
    final nameMatch = RegExp(r'(?:اسمه|اسمها|سميته|سميتها|يسمونه|يسمونها)\s+(\w+)').firstMatch(n);
    if (nameMatch != null) child.name = nameMatch.group(1);
  }

  void _extractSymptoms(String n) {
    final symptoms = {
      'حراره': 'حرارة', 'سخونه': 'حرارة', 'حمى': 'حرارة', 'يرتفع': 'حرارة',
      'اسهال': 'إسهال', 'ماء ابيض': 'إسهال',
      'قيء': 'قيء', 'يرجع': 'قيء',
      'سعال': 'سعال', 'كحه': 'سعال', 'كحة': 'سعال',
      'زكام': 'زكام', 'رشح': 'زكام', 'انفلونزا': 'زكام',
      'طفح': 'طفح جلدي', 'حبوب': 'طفح جلدي',
      'الم': 'ألم', 'يتالم': 'ألم', 'يتألم': 'ألم', 'وجع': 'ألم',
      'تورم': 'تورم', 'انتفاخ': 'تورم', 'ينتفخ': 'تورم',
      'يبكي': 'بكاء', 'بكاء': 'بكاء', 'صار يبكي': 'بكاء',
      'تشنج': 'تشنجات', 'نوبه': 'تشنجات',
      'ما ياكل': 'رفض الطعام', 'يرفض': 'رفض الطعام',
      'نعاس': 'نعاس', 'تعبان': 'تعب عام',
      'احمرار': 'احمرار', 'احمر': 'احمرار',
    };
    for (final e in symptoms.entries) {
      if (n.contains(e.key) && !child.mentionedSymptoms.contains(e.value)) {
        child.mentionedSymptoms.add(e.value);
      }
    }
  }

  void _extractChronicConditions(String n) {
    final conditions = {
      RegExp(r'سكري|انسولين'): 'سكري',
      RegExp(r'قلب|cardiac'): 'قلب',
      RegExp(r'hiv|ايدز'): 'HIV',
      RegExp(r'سرطان|اورام|كيماوي'): 'سرطان',
      RegExp(r'ربو|asma'): 'ربو',
      RegExp(r'صرع|epilepsy'): 'صرع',
    };
    for (final e in conditions.entries) {
      if (e.key.hasMatch(n)) {
        child.hasChronicDisease = true;
        child.chronicDiseaseType = e.value;
      }
    }
  }

  void _extractPrematurity(String n) {
    if (RegExp(r'مبتسر|خديج|مبكر|premature|حضانه').hasMatch(n)) {
      child.isPremature = true;
    }
  }

  void _extractVaccineHistory(String n) {
    final vaccines = {
      'bcg': 'bcg', 'بي سي جي': 'bcg',
      'شلل': 'opv', 'بوليو': 'opv',
      'خماسي': 'penta',
      'رئوي': 'pcv',
      'روتا': 'rota',
      'حصبه': 'mr', 'حصبة': 'mr',
    };
    for (final e in vaccines.entries) {
      if (n.contains(e.key) && RegExp(r'اخذ|عطوه|خذ|طعموه|سوى|اخد').hasMatch(n)) {
        if (!child.givenVaccines.contains(e.value)) child.givenVaccines.add(e.value);
      }
    }
  }

  /// هل السؤال يتطلب توضيحاً؟
  ({bool needs, String question, List<String> options}) needsClarification(
      String normalized, String intent) {
    // عمر الطفل غير محدد
    if ((intent == 'age_query' || intent == 'vaccine_list') && !child.hasBasicInfo) {
      if (!normalized.contains(RegExp(r'عمر|شهر|اسبوع|سن|عند|عنده|يوم'))) {
        return (
          needs: true,
          question: '📅 عشان أقدر أعطيك تطعيمات طفلك بالضبط، كم عمره؟',
          options: ['عمره شهر', 'عمره 3 شهور', 'عمره 6 شهور', 'عمره 9 شهور', 'عمره سنة'],
        );
      }
    }

    // سؤال عن الآثار بدون تحديد تطعيم
    if (intent == 'side_effects' && lastVaccine.isEmpty && lastTopic.isEmpty) {
      final v = _detectAnyVaccine(normalized);
      if (v == null) {
        return (
          needs: true,
          question: '⚠️ عن أي تطعيم تسأل عن الآثار الجانبية؟',
          options: ['الخماسي', 'BCG', 'الحصبة', 'الروتا', 'الرئوي', 'شلل الأطفال'],
        );
      }
    }

    // سؤال مبهم
    if (normalized.length < 8 && !_isGreeting(normalized) && !_isYesNo(normalized)) {
      return (
        needs: true,
        question: '🤔 ممكن توضح أكثر وش تقصد؟',
        options: ['وش تطعيمات طفلي؟', 'وش الآثار الجانبية؟', 'هل التطعيم مجاني؟'],
      );
    }

    return (needs: false, question: '', options: []);
  }

  bool _isGreeting(String n) => RegExp(r'مرحب|سلام|هلا|صباح|مساء').hasMatch(n);
  bool _isYesNo(String n) => RegExp(r'^(نعم|لا|ايه|اي|يب|ايوه|مو|ايوا)$').hasMatch(n);

  String? _detectAnyVaccine(String n) {
    final v = {
      'bcg': ['bcg', 'بي سي جي'],
      'opv': ['شلل'],
      'penta': ['خماسي'],
      'pcv': ['رئوي'],
      'rota': ['روتا'],
      'mr': ['حصبه', 'حصبة'],
    };
    for (final e in v.entries) {
      for (final k in e.value) {
        if (n.contains(k)) return e.key;
      }
    }
    return null;
  }

  /// هل السؤال متابعة؟
  bool isFollowUpQuestion(String normalized) {
    return RegExp(r'^(نعم|ايوه|ايه|اي|يب|اشرح|وضح|بالتفصيل|تفاصيل|كم|ليه|ليش|طيب|تمام|واضح|فهمت|اوكي)')
        .hasMatch(normalized);
  }

  /// بناء سياق للاستشارة
  String buildConsultationContext() {
    final buf = StringBuffer();
    if (child.hasBasicInfo) buf.writeln('عمر الطفل: ${child.ageDisplay}');
    if (child.gender != null) buf.writeln('الجنس: ${child.gender}');
    if (child.name != null) buf.writeln('الاسم: ${child.name}');
    if (child.isPremature) buf.writeln('مبتسر: نعم');
    if (child.hasChronicDisease) buf.writeln('مرض مزمن: ${child.chronicDiseaseType}');
    if (child.mentionedSymptoms.isNotEmpty) buf.writeln('الأعراض: ${child.mentionedSymptoms.join(", ")}');
    if (child.givenVaccines.isNotEmpty) buf.writeln('تطعيمات أخذها: ${child.givenVaccines.join(", ")}');
    return buf.toString().trim();
  }

  /// تحديث مرحلة المحادثة
  void updatePhase(String intent) {
    if (intent == 'emergency' || child.mentionedSymptoms.contains('تشنجات')) {
      phase = ConversationPhase.emergency;
    } else if (awaitingClarification) {
      phase = ConversationPhase.clarification;
    } else if (turnCount <= 2) {
      phase = ConversationPhase.greeting;
    } else if (child.hasBasicInfo) {
      phase = ConversationPhase.consulting;
    } else {
      phase = ConversationPhase.collecting;
    }
  }

  void reset() {
    lastTopic = '';
    lastVaccine = '';
    lastDisease = '';
    pendingClarification = '';
    awaitingClarification = false;
    clarificationContext = '';
    clarificationOptions = [];
    phase = ConversationPhase.greeting;
    history.clear();
    extractedEntities.clear();
    discussedTopics.clear();
    turnCount = 0;
    child.reset();
  }
}
