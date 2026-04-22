/// EPI Knowledge Base — Comprehensive Yemen EPI knowledge for the Supervisor system
/// Ported and enhanced from EPI-Bot's multiple knowledge bases
/// Covers: Vaccines, schedules, supervision, management, campaigns, cold chain, AEFI

class EpiKnowledgeBase {
  // ═══════════════════════════════════════════════════════════
  // VACCINATION SCHEDULE — Yemen National Schedule
  // ═══════════════════════════════════════════════════════════

  static const List<Map<String, dynamic>> vaccinationSchedule = [
    {
      'vaccine': 'BCG',
      'age': 'عند الولادة',
      'ageMonths': 0,
      'disease': 'السل (الدرن)',
      'route': 'عبر الجلد',
      'site': 'الذراع الأيمن',
      'dose': '0.05 مل',
    },
    {
      'vaccine': 'OPV-0',
      'age': 'عند الولادة',
      'ageMonths': 0,
      'disease': 'شلل الأطفال',
      'route': 'فموي',
      'site': 'الفم',
      'dose': '2 نقطة',
    },
    {
      'vaccine': 'HepB-0',
      'age': 'عند الولادة',
      'ageMonths': 0,
      'disease': 'التهاب الكبد B',
      'route': 'عضلي',
      'site': 'الفخذ الأيسر',
      'dose': '0.5 مل',
    },
    {
      'vaccine': 'OPV-1 + Penta-1 + PCV-1 + Rota-1',
      'age': 'شهران',
      'ageMonths': 2,
      'disease': 'شلل الأطفال + الخماسي + الرئوي + الروتا',
      'route': 'فموي + عضلي + عضلي + فموي',
      'site': 'الفم + الفخذ + الفخذ + الفم',
      'dose': '2 نقطة + 0.5 مل + 0.5 مل + 1.5 مل',
    },
    {
      'vaccine': 'OPV-2 + Penta-2 + PCV-2 + Rota-2',
      'age': '4 أشهر',
      'ageMonths': 4,
      'disease': 'شلل الأطفال + الخماسي + الرئوي + الروتا',
      'route': 'فموي + عضلي + عضلي + فموي',
      'site': 'الفم + الفخذ + الفخذ + الفم',
      'dose': '2 نقطة + 0.5 مل + 0.5 مل + 1.5 مل',
    },
    {
      'vaccine': 'OPV-3 + Penta-3 + PCV-3 + IPV',
      'age': '6 أشهر',
      'ageMonths': 6,
      'disease': 'شلل الأطفال + الخماسي + الرئوي + شلل حقن',
      'route': 'فموي + عضلي + عضلي + عضلي',
      'site': 'الفم + الفخذ + الفخذ + الفخذ',
      'dose': '2 نقطة + 0.5 مل + 0.5 مل + 0.5 مل',
    },
    {
      'vaccine': 'MR-1',
      'age': '9 أشهر',
      'ageMonths': 9,
      'disease': 'الحصبة + الحصبة الألمانية',
      'route': 'تحت الجلد',
      'site': 'الذراع الأيسر',
      'dose': '0.5 مل',
    },
    {
      'vaccine': 'MR-2',
      'age': '18 شهر',
      'ageMonths': 18,
      'disease': 'الحصبة + الحصبة الألمانية (جرعة تعزيزية)',
      'route': 'تحت الجلد',
      'site': 'الذراع الأيسر',
      'dose': '0.5 مل',
    },
    {
      'vaccine': 'Td',
      'age': '6 سنوات (الصف الأول)',
      'ageMonths': 72,
      'disease': 'الكزاز + الدفتيريا',
      'route': 'عضلي',
      'site': 'الذراع',
      'dose': '0.5 مل',
    },
  ];

  // ═══════════════════════════════════════════════════════════
  // VACCINE DETAILS
  // ═══════════════════════════════════════════════════════════

  static const Map<String, Map<String, dynamic>> vaccineDetails = {
    'BCG': {
      'nameAr': 'لقاح السل',
      'type': 'حي مضعف',
      'disease': 'السل (الدرن)',
      'storage': '2-8 درجة مئوية',
      'reconstitution': 'مذيب SSG خاص',
      'openVial': 'لا يمكن إعادة استخدامة بعد فتحه',
      'sideEffects': 'تقرح موضعي طبيعي خلال 2-4 أسابيع',
      'contraindications': 'نقص المناعة، أقل من 2000 جرام',
    },
    'OPV': {
      'nameAr': 'لقاح شلل الأطفال الفموي',
      'type': 'حي مضعف',
      'disease': 'شلل الأطفال',
      'storage': '-20 درجة (طويل) أو 2-8 درجة (قصير)',
      'openVial': 'يمكن استخدامه في جلسة التطعيم',
      'sideEffects': 'VAPP نادر جداً (1 من 2.4 مليون)',
      'contraindications': 'نقص المناعة الشديد',
    },
    'Penta': {
      'nameAr': 'اللقاح الخماسي',
      'type': 'مقتول + توكسويد',
      'components': ['DPT', 'HepB', 'Hib'],
      'disease': 'الدفتيريا + السعال الديكي + الكزاز + الكبد B + المستدمية',
      'storage': '2-8 درجة مئوية',
      'openVial': 'يمكن استخدامه خلال 6 ساعات',
      'sideEffects': 'حمى خفيفة، ألم موضعي',
      'contraindications': 'حساسية شديدة سابقة',
    },
    'PCV': {
      'nameAr': 'لقاح المكورات الرئوية',
      'type': 'مقترن',
      'disease': 'الالتهاب الرئوي + التهاب السحايا',
      'storage': '2-8 درجة مئوية',
      'openVial': 'يمكن استخدامه خلال 6 ساعات',
      'sideEffects': 'حمى خفيفة، احمرار',
      'contraindications': 'حساسية سابقة للقاح',
    },
    'Rotavirus': {
      'nameAr': 'لقاح الروتا',
      'type': 'حي مضعف',
      'disease': 'إسهال الروتا',
      'storage': '2-8 درجة مئوية',
      'openVial': 'يستخدم فوراً - لا يمكن حفظه',
      'sideEffects': 'إسهال خفيف، حمى',
      'contraindications': 'انفتال الأمعاء سابقاً، نقص المناعة',
      'maxAge': 'الجرعة الأولى قبل 15 أسبوع، الأخيرة قبل 32 أسبوع',
    },
    'MR': {
      'nameAr': 'لقاح الحصبة والحصبة الألمانية',
      'type': 'حي مضعف',
      'disease': 'الحصبة + الحصبة الألمانية (روبيلا)',
      'storage': '2-8 درجة مئوية أو -20 درجة',
      'reconstitution': 'مذيب معقم',
      'openVial': 'يستخدم خلال 6 ساعات',
      'sideEffects': 'حمى بعد 5-12 يوم، طفح جلدي خفيف',
      'contraindications': 'نقص المناعة الشديد، حمل',
    },
    'IPV': {
      'nameAr': 'لقاح شلل الأطفال الحقن',
      'type': 'مقتول',
      'disease': 'شلل الأطفال',
      'storage': '2-8 درجة مئوية',
      'openVial': 'يمكن استخدامه خلال 6 ساعات',
      'sideEffects': 'ألم موضعي',
      'contraindications': 'حساسية للستريبتومايسين/البوليميكسين',
    },
  };

  // ═══════════════════════════════════════════════════════════
  // EPI QUALITY INDICATORS
  // ═══════════════════════════════════════════════════════════

  static const Map<String, Map<String, dynamic>> qualityIndicators = {
    'Penta1': {
      'nameAr': 'تغطية الجرعة الأولى الخماسي',
      'target': 90,
      'meaning': 'وصول الخدمة — نسبة الأطفال الذين تلقوا الجرعة الأولى',
      'calculation': '(عدد Penta1 / الفئة المستهدفة) × 100',
    },
    'Penta3': {
      'nameAr': 'تغطية الجرعة الثالثة الخماسي',
      'target': 90,
      'meaning': 'اكتمال التحصين — الأطفال الذين أكملوا الجرعات الثلاث',
      'calculation': '(عدد Penta3 / الفئة المستهدفة) × 100',
    },
    'Dropout': {
      'nameAr': 'معدل التسرب',
      'target': '< 10%',
      'meaning': 'نسبة الأطفال الذين بدأوا ولم يكملوا',
      'calculation': '((Penta1 - Penta3) / Penta1) × 100',
      'interpretation': {
        '<10%': 'ممتاز',
        '10-20%': 'متوسط - يحتاج متابعة',
        '>20%': 'ضعيف - يحتاج تدخل فوري',
      },
    },
    'BCG': {
      'nameAr': 'تغطية لقاح السل',
      'target': 90,
      'meaning': 'مؤشر الوصول عند الولادة',
      'calculation': '(عدد BCG / الولادات المتوقعة) × 100',
    },
    'MR1': {
      'nameAr': 'تغطية جرعة الحصبة الأولى',
      'target': 90,
      'meaning': 'مؤشر الحماية الجماعية من الحصبة',
      'calculation': '(عدد MR1 / الفئة المستهدفة) × 100',
    },
    'MR2': {
      'nameAr': 'تغطية جرعة الحصبة الثانية',
      'target': 95,
      'meaning': 'مؤشر اكتمال المناعة ضد الحصبة',
      'calculation': '(عدد MR2 / الفئة المستهدفة) × 100',
    },
    'DPT1_to_DPT3': {
      'nameAr': 'معدل الاحتفاظ',
      'target': '> 90%',
      'meaning': 'نسبة الأطفال الذين أكملوا السلسلة من الذين بدأوها',
      'calculation': '(Penta3 / Penta1) × 100',
    },
  };

  // ═══════════════════════════════════════════════════════════
  // SUPERVISION CHECKLIST
  // ═══════════════════════════════════════════════════════════

  static const Map<String, List<Map<String, String>>> supervisionChecklist = {
    'سلسلة التبريد': [
      {'item': 'درجة حرارة الثلاجة', 'standard': '2-8 درجة مئوية', 'method': 'قراءة الثرمومتر مرتين يومياً'},
      {'item': 'ترتيب اللقاحات', 'standard': 'BCG و MR في الرف العلوي، البقية في الرف السفلي', 'method': 'فحص بصري'},
      {'item': 'حالة VVM', 'standard': 'جميع القوارير في المرحلة 1 أو 2', 'method': 'فحص كل قارورة'},
      {'item': 'سجل درجات الحرارة', 'standard': 'مسجل يومياً بدون انقطاع', 'method': 'مراجعة السجل'},
      {'item': 'الطوارئ', 'standard': 'خطة طوارئ مكتوبة ومعلنة', 'method': 'توثيق الخطة'},
    ],
    'جلسة التطعيم': [
      {'item': 'تاريخ انتهاء اللقاح', 'standard': 'جميع اللقاحات صالحة', 'method': 'فحص كل قارورة'},
      {'item': 'الأدوات المعقمة', 'standard': 'سرنجات AD أو عادية معقمة', 'method': 'فحص بصري'},
      {'item': 'طريقة الحقن', 'standard': 'الطريقة الصحيحة حسب اللقاح', 'method': 'ملاحظة مباشرة'},
      {'item': 'التخلص من النفايات', 'method': 'صناديق أمان مملوءة < 3/4', 'standard': 'فحص الصناديق'},
      {'item': 'مراقبة ما بعد التطعيم', 'standard': '30 دقيقة مراقبة بعد التطعيم', 'method': 'ملاحظة'},
    ],
    'التسجيل والبيانات': [
      {'item': 'سجل التطعيم', 'standard': 'مسجل بشكل كامل ودقيق', 'method': 'مراجعة عينات'},
      {'item': 'بطاقة التطعيم', 'standard': 'معطاة للأم ومحدثة', 'method': 'سؤال الأمهات'},
      {'item': 'التقرير الشهري', 'standard': 'مرسل في الوقت المحدد', 'method': 'مراجعة السجلات'},
      {'item': 'متابعة المتسربين', 'standard': 'قائمة محدثة ونشطة', 'method': 'مراجعة القائمة'},
    ],
    'التواصل المجتمعي': [
      {'item': 'التثقيف الصحي', 'standard': 'جلسات توعية منتظمة', 'method': 'سؤال الأمهات'},
      {'item': 'معالجة الرفض', 'standard': 'خطة محلية للتعامل مع الرفض', 'method': 'مراجعة الوثائق'},
      {'item': 'تنسيق مع المجتمع', 'standard': 'علاقة فعالة مع القيادات', 'method': 'مقابلة القيادات'},
    ],
  };

  // ═══════════════════════════════════════════════════════════
  // AEFI — Adverse Events Following Immunization
  // ═══════════════════════════════════════════════════════════

  static const Map<String, Map<String, dynamic>> aefiTypes = {
    'minor': {
      'nameAr': 'أعراض بسيطة (طبيعية)',
      'examples': ['حمى خفيفة (< 38°C)', 'ألم واحمرار مكان الحقن', 'تورم خفيف', 'بكاء الطفل'],
      'management': 'كمادات باردة، خافض حرارة (باراسيتامول)، طمأنة الأم',
      'urgency': 'عادي — لا يحتاج إبلاغ فوري',
    },
    'moderate': {
      'nameAr': 'أعراض متوسطة',
      'examples': ['حمى مرتفعة (> 39°C)', 'بكاء مستمر > 3 ساعات', 'تورم كبير > 5 سم', 'طفح جلدي'],
      'management': 'فحص طبي، باراسيتامول، مراقبة لمدة 24 ساعة',
      'urgency': 'يحتاج إبلاغ خلال 24 ساعة',
    },
    'severe': {
      'nameAr': 'أعراض شديدة',
      'examples': ['تشنجات', 'غيبوبة', 'صدمة تأقية', 'شلل', 'انفتال الأمعاء'],
      'management': 'إسعاف فوري → نقل للمستشفى → إبلاغ فوري',
      'urgency': 'إبلاغ فوري خلال ساعة!',
    },
  };

  // ═══════════════════════════════════════════════════════════
  // YEMEN GOVERNORATES — EPI related data
  // ═══════════════════════════════════════════════════════════

  static const List<String> governorates = [
    'أمانة العاصمة', 'عدن', 'تعز', 'الحديدة', 'إب', 'حضرموت',
    'المهرة', 'شبوة', 'حجة', 'صعدة', 'الجوف', 'مأرب',
    'الضالع', 'لحج', 'أبين', 'ريمة', 'صنعاء', 'ذمار',
    'البيضاء', 'عمران', 'المحويت', 'سقطرى',
  ];

  // ═══════════════════════════════════════════════════════════
  // SEARCH — Find relevant knowledge entries
  // ═══════════════════════════════════════════════════════════

  /// Search knowledge base for relevant information
  static List<KnowledgeEntry> search(String query) {
    final normalized = EpiNLPEngine.normalize(query);
    final results = <KnowledgeEntry>[];
    double score;

    // Search vaccination schedule
    for (final entry in vaccinationSchedule) {
      score = _calculateRelevance(normalized, [
        entry['vaccine'] as String,
        entry['disease'] as String,
        entry['age'] as String,
      ]);
      if (score > 0.3) {
        results.add(KnowledgeEntry(
          category: 'جدول التطعيم',
          title: 'لقاح ${entry['vaccine']}',
          content: '${entry['vaccine']} — العمر: ${entry['age']}\n'
              'المرض: ${entry['disease']}\n'
              'الطريقة: ${entry['route']}\n'
              'الموقع: ${entry['site']}\n'
              'الجرعة: ${entry['dose']}',
          relevance: score,
        ));
      }
    }

    // Search vaccine details
    for (final entry in vaccineDetails.entries) {
      final details = entry.value;
      score = _calculateRelevance(normalized, [
        entry.key,
        details['nameAr'] as String,
        details['disease'] as String,
        details['type'] as String,
      ]);
      if (score > 0.3) {
        results.add(KnowledgeEntry(
          category: 'تفاصيل اللقاح',
          title: details['nameAr'] as String,
          content: '${details['nameAr']} (${entry.key})\n'
              'النوع: ${details['type']}\n'
              'المرض: ${details['disease']}\n'
              'التخزين: ${details['storage']}\n'
              'الآثار الجانبية: ${details['sideEffects']}\n'
              'موانع الاستعمال: ${details['contraindications']}',
          relevance: score,
        ));
      }
    }

    // Search quality indicators
    for (final entry in qualityIndicators.entries) {
      final details = entry.value;
      score = _calculateRelevance(normalized, [
        entry.key,
        details['nameAr'] as String,
        details['meaning'] as String,
      ]);
      if (score > 0.3) {
        results.add(KnowledgeEntry(
          category: 'مؤشرات الجودة',
          title: details['nameAr'] as String,
          content: '${details['nameAr']} (${entry.key})\n'
              'المعنى: ${details['meaning']}\n'
              'المستهدف: ${details['target']}\n'
              'الحساب: ${details['calculation']}',
          relevance: score,
        ));
      }
    }

    // Search AEFI
    for (final entry in aefiTypes.entries) {
      final details = entry.value;
      score = _calculateRelevance(normalized, [
        entry.key,
        details['nameAr'] as String,
        ...(details['examples'] as List).cast<String>(),
      ]);
      if (score > 0.3) {
        results.add(KnowledgeEntry(
          category: 'الأحداث الضارة',
          title: details['nameAr'] as String,
          content: '${details['nameAr']}\n'
              'الأمثلة: ${(details['examples'] as List).join('، ')}\n'
              'التعامل: ${details['management']}\n'
              'الإلحاح: ${details['urgency']}',
          relevance: score,
        ));
      }
    }

    results.sort((a, b) => b.relevance.compareTo(a.relevance));
    return results;
  }

  /// Get context string for AI prompts
  static String getRelevantContext(String query, {int maxEntries = 3}) {
    final results = search(query);
    if (results.isEmpty) return '';

    final buffer = StringBuffer('معلومات من قاعدة المعرفة:\n');
    for (int i = 0; i < results.length && i < maxEntries; i++) {
      buffer.writeln('\n[${results[i].category}] ${results[i].title}:');
      buffer.writeln(results[i].content);
    }
    return buffer.toString();
  }

  // ═══════════════════════════════════════════════════════════
  // HELPER
  // ═══════════════════════════════════════════════════════════

  static double _calculateRelevance(String normalizedQuery, List<String> fields) {
    final queryWords = normalizedQuery.split(' ');
    int totalMatches = 0;
    int totalWords = 0;

    for (final word in queryWords) {
      if (word.length < 2) continue;
      totalWords++;
      for (final field in fields) {
        final normalizedField = EpiNLPEngine.normalize(field);
        if (normalizedField.contains(word)) {
          totalMatches++;
          break;
        }
        // Fuzzy match
        final fieldWords = normalizedField.split(' ');
        for (final fw in fieldWords) {
          if (EpiNLPEngine.similarity(word, fw) > 0.8) {
            totalMatches++;
            break;
          }
        }
      }
    }

    return totalWords > 0 ? totalMatches / totalWords : 0.0;
  }
}

// ═══════════════════════════════════════════════════════════
// DATA MODELS
// ═══════════════════════════════════════════════════════════

class KnowledgeEntry {
  final String category;
  final String title;
  final String content;
  final double relevance;

  const KnowledgeEntry({
    required this.category,
    required this.title,
    required this.content,
    required this.relevance,
  });
}
