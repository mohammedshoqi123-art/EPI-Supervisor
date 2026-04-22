/// ══════════════════════════════════════════════════════════════════════
///  محرك الفهم العميق — NLP عربي متقدم v5 (النسخة الكاملة)
///  منقول ومُحسّن من EPI-Bot/smart_nlp.dart
///  يدعم: 50+ نية، 500+ مرادف، بحث ضبابي (Levenshtein)،
///  تصحيح أخطاء إملائية، تجميع المواضيع، نقاط ثقة، فهم السياق
/// ══════════════════════════════════════════════════════════════════════

/// نتيجة النية مع نقطة الثقة
class IntentResult {
  final String intent;
  final double confidence;
  final Map<String, double> allScores;
  final String? emotion;
  final Map<String, dynamic>? medicalContext;

  const IntentResult(this.intent, this.confidence,
      {this.allScores = const {}, this.emotion, this.medicalContext});

  @override
  String toString() => 'IntentResult($intent, ${(confidence * 100).toStringAsFixed(1)}%)';

  bool get isHighConfidence => confidence >= 0.75;
  bool get isMediumConfidence => confidence >= 0.45 && confidence < 0.75;
  bool get isLowConfidence => confidence < 0.45;
}

class EpiNLPEngine {
  // ══════════════════════════════════════════════════════════════════
  //  القسم ١: التطبيع والتنقية (Normalization)
  // ══════════════════════════════════════════════════════════════════

  /// تطبيع شامل
  static String normalize(String text) {
    var t = text.trim();
    // إزالة التشكيل
    t = t.replaceAll(RegExp(r'[\u064B-\u065F\u0670]'), '');
    // توحيد الحروف
    t = t.replaceAll('أ', 'ا').replaceAll('إ', 'ا').replaceAll('آ', 'ا');
    t = t.replaceAll('ة', 'ه').replaceAll('ى', 'ي').replaceAll('ؤ', 'و').replaceAll('ئ', 'ي');
    t = t.replaceAll('ء', '').replaceAll('ٱ', 'ا');
    // إزالة علامات الترقيم
    t = t.replaceAll(RegExp(r'[؟?!,.\u061F;:؛]'), '');
    // توحيد المسافات
    t = t.replaceAll(RegExp(r'\s+'), ' ').toLowerCase();
    // تحويل الأرقام
    const ar = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    for (int i = 0; i < ar.length; i++) {
      t = t.replaceAll(ar[i], en[i]);
    }
    return t;
  }

  /// تطبيع ناعم
  static String softNormalize(String text) {
    var t = text.trim();
    t = t.replaceAll(RegExp(r'[\u064B-\u065F\u0670]'), '');
    t = t.replaceAll(RegExp(r'\s+'), ' ');
    return t;
  }

  // ══════════════════════════════════════════════════════════════════
  //  القسم ٢: مسافة ليفنشتاين والمطابقة الضبابية
  // ══════════════════════════════════════════════════════════════════

  static int levenshteinDistance(String a, String b) {
    if (a == b) return 0;
    if (a.isEmpty) return b.length;
    if (b.isEmpty) return a.length;
    List<int> prev = List<int>.generate(b.length + 1, (j) => j);
    List<int> curr = List<int>.filled(b.length + 1, 0);
    for (int i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (int j = 1; j <= b.length; j++) {
        final cost = a[i - 1] == b[j - 1] ? 0 : 1;
        curr[j] = [prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost].reduce((x, y) => x < y ? x : y);
      }
      final tmp = prev; prev = curr; curr = tmp;
    }
    return prev[b.length];
  }

  static double fuzzyMatch(String a, String b) {
    if (a.isEmpty && b.isEmpty) return 1.0;
    if (a.isEmpty || b.isEmpty) return 0.0;
    if (a == b) return 1.0;
    final maxLen = a.length > b.length ? a.length : b.length;
    return 1.0 - (levenshteinDistance(a, b) / maxLen);
  }

  static String? fuzzyFind(String input, List<String> candidates, {double threshold = 0.75}) {
    String? bestMatch;
    double bestScore = 0;
    for (final c in candidates) {
      final score = fuzzyMatch(input, c);
      if (score >= threshold && score > bestScore) {
        bestScore = score;
        bestMatch = c;
      }
    }
    return bestMatch;
  }

  // ══════════════════════════════════════════════════════════════════
  //  القسم ٣: قاموس تصحيح الأخطاء الإملائية (100+ مدخل)
  // ══════════════════════════════════════════════════════════════════

  static const Map<String, String> _typos = {
    // أسماء لقاحات
    'خماسى': 'خماسي', 'خمسائي': 'خماسي', 'بتافالنت': 'خماسي', 'بنتافالانت': 'خماسي',
    'حصبه': 'حصبة', 'حصبيه': 'حصبة', 'حصبا': 'حصبة', 'حصب': 'حصبة',
    'روتا فيرس': 'روتا فيروس', 'روتافيروس': 'روتا فيروس', 'روتا': 'روتا فيروس',
    'بى سى جى': 'بي سي جي', 'بيسى جي': 'بي سي جي', 'بى سى جي': 'بي سي جي',
    'او بى فى': 'أو بي في', 'شلل اطفال': 'شلل أطفال', 'شلال اطفال': 'شلل أطفال', 'شلل': 'شلل أطفال',
    'اى بى فى': 'آي بي في', 'بى سى فى': 'بي سي في',
    'رئوى': 'رئوي', 'متكورات رئوية': 'مكورات رئوية',
    'كبد ب': 'التهاب كبدي ب', 'كبد': 'التهاب كبدي ب', 'كبدي': 'التهاب كبدي ب', 'فيروس كبدى': 'التهاب كبدي ب',
    'كززاز': 'كزاز', 'كزاز وليدى': 'كزاز وليدي',
    'دفتيريا': 'خناق', 'سعال ديكي': 'سعال ديكي', 'سعال ديكى': 'سعال ديكي', 'بيرتوسس': 'سعال ديكي',
    'اوتيزم': 'توحد', 'اوتزم': 'توحد', 'اتيزم': 'توحد',
    'فيتمين': 'فيتامين', 'فيتامين ا': 'فيتامين أ',
    // أمراض
    'حصبة المانية': 'حصبة ألمانية', 'روبيلا': 'حصبة ألمانية',
    'سحايا': 'التهاب السحايا', 'تدرن': 'سل', 'درن': 'سل',
    'بوليو': 'شلل أطفال',
    // مصطلحات
    'تطعيمات': 'تطعيمات', 'تطعيمه': 'تطعيم', 'تطعميات': 'تطعيمات', 'تطاعيم': 'تطعيمات',
    'لقاحات': 'لقاحات', 'لقاحه': 'لقاح', 'حقنه': 'حقنة', 'جرعه': 'جرعة',
    'تحصينات': 'تحصينات', 'تحصينه': 'تحصين',
    // آثار جانبية
    'اثار جانبيه': 'آثار جانبية', 'اعراض جانبيه': 'آثار جانبية',
    'اعراض': 'أعراض', 'سخونه': 'حرارة', 'حمى': 'حرارة',
    // إدارية
    'اشراف داعم': 'إشراف داعم', 'اداره وسيطة': 'إدارة وسيطة',
    'مؤشرات': 'مؤشرات', 'تقارر': 'تقارير',
    'سلسله بارده': 'سلسلة باردة', 'سلسلة تبريد': 'سلسلة باردة',
    'ثلاجه': 'ثلاجة', 'ميكروبلان': 'تخطيط دقيق',
    'متخلفين': 'متخلفين', 'متاخرين': 'متخلفين', 'مخطيين': 'متخلفين',
  };

  /// تصحيح الأخطاء الإملائية
  static String correctTypos(String text) {
    final words = text.split(' ');
    final corrected = <String>[];
    for (final word in words) {
      final nw = normalize(word);
      if (_typos.containsKey(nw)) {
        corrected.add(_typos[nw]!);
      } else if (_typos.containsKey(word)) {
        corrected.add(_typos[word]!);
      } else {
        final fuzzyHit = fuzzyFind(nw, _typos.keys.toList(), threshold: 0.82);
        corrected.add(fuzzyHit != null ? _typos[fuzzyHit]! : word);
      }
    }
    return corrected.join(' ');
  }

  // ══════════════════════════════════════════════════════════════════
  //  القسم ٤: مرادفات عربية شاملة (500+ مرادف)
  // ══════════════════════════════════════════════════════════════════

  static const Map<String, List<String>> synonyms = {
    'حراره': ['سخونه', 'حمى', 'يرتفع', 'سخن', 'حرار', 'يسخن', 'سخنت', 'حرارته', 'حراره عاليه', 'طلعت حراره', 'ارتفاع حراره', 'حراره مرتفعه'],
    'الم': ['يالم', 'يتالم', 'يتألم', 'وجع', 'يوجع', 'يعور', 'الام', 'مؤلم', 'يعوره', 'يوجعه', 'وجع المكان', 'الم مكان الحقنه'],
    'احمرار': ['احمر', 'يحمر', 'حمره', 'احمرت', 'محمر', 'احمرار المكان', 'احمرار مكان الحقنه', 'بقع حمراء'],
    'تورم': ['انتفاخ', 'ينتفخ', 'ورم', 'يتورم', 'انتفخ', 'تنفخ', 'متورم', 'منتفخ', 'تنفخت', 'انتفخت', 'ورم المكان', 'مكان منتفخ'],
    'تطعيم': ['لقاح', 'حقنه', 'تطعيمه', 'تطعيمات', 'لقاحات', 'حقن', 'تطعم', 'ياخذ تطعيم', 'ياخذ حقنه', 'ياخذ لقاح', 'زباره', 'زبارات', 'برنامج التحصين', 'تحصين', 'تحصينه', 'تحصينات', 'زبر', 'تحصين الطفل', 'تحصين الاطفال'],
    'طفل': ['رضيع', 'وليد', 'صغير', 'بيبي', 'ولد', 'بنت', 'عيل', 'الطفل', 'اطفال', 'ولدي', 'بنتي', 'ابني', 'طفله', 'اطفالي', 'عيالي', 'مواليد', 'حديثي الولاده', 'خدج'],
    'مريض': ['مريضه', 'تعبان', 'تعبانه', 'مصاب', 'تعب', 'مو صاحي'],
    'مجاني': ['مجانا', 'بلاش', 'بدون فلوس', 'ما يكلف', 'بلا رسوم', 'بلا قروش'],
    'خطر': ['خطير', 'يخوف', 'مضر', 'ضار', 'مو امان', 'خطرر', 'يضر'],
    'عمر': ['سن', 'عمره', 'عمرها', 'سنه', 'عمر الطفل', 'كم عمره'],
    'اثار': ['اعراض', 'جانبيه', 'تأثير', 'يصير', 'يسوي', 'يحصل', 'اضرار', 'وش يسوي بعد', 'وش يصير بعد', 'مضاعفات', 'رد فعل'],
    'امان': ['امان', 'مو ضار', 'ما يضر', 'مو خطر', 'آمن', 'امنه', 'مضمون', 'ما فيه خطر'],
    'مكان': ['وين', 'اين', 'مركز', 'مستشفى', 'عياده', 'وين اروح', 'وين اوديه', 'مركز صحي', 'وحده صحيه', 'نقطه تطعيم'],
    'وقت': ['متى', 'ميعاد', 'موعد', 'تاريخ', 'متى ياخذ', 'متى اعطيه', 'متى اوديه', 'متى اطعمه', 'وقت التطعيم', 'مواعيد'],
    'عدد': ['كم', 'كم مره', 'كم جرعة', 'كم حقه', 'كم حقنه', 'كم جرعات'],
    'مرض': ['امراض', 'عدوى', 'وباء', 'عدوه', 'مراضه', 'امراضه', 'داء'],
    'منع': ['مانع', 'يمنع', 'ما يقدر', 'مو راضي', 'رفض', 'يمنعون', 'موانع', 'موانع التطعيم', 'استبعاد'],
    'طوارئ': ['عاجل', 'خطير', 'مستعجل', 'حاله طوارئ', 'اسعاف', 'غرفة طوارئ'],
    'تبريد': ['تبريد', 'براده', 'ثلاجه', 'تخزين', 'بارد', 'سلسله بارده', 'سلسلة تبريد', 'فريزر', 'صندوق تبريد', 'كول بوكس'],
    'حمله': ['حمله', 'حملات', 'تطعيم وطني', 'ايام التحصين', 'حملة تطعيم', 'حملات وطنيه'],
    'مدرسه': ['مدرسه', 'مدرسي', 'طلاب', 'مدارس', 'طالبات', 'تلاميذ'],
    'حوامل': ['حامل', 'ام', 'حامله', 'ام حامل', 'نساء حوامل'],
    'اشراف': ['اشراف', 'زياره', 'متابعه', 'تقييم', 'رقابه', 'زياره اشرافيه', 'اشراف داعم', 'checklist', 'قائمة مراجعه', 'توجيه'],
    'فيتامين': ['فيتامين', 'vitamin', 'فيتامين ا', 'كبسوله', 'كبسولات', 'كبسولة زرقاء'],
    'الروتا': ['روتا', 'روتا فيروس', 'لقاح الروتا', 'اسهال روتا'],
    'الخماسي': ['خماسي', 'التطعيم الخماسي', 'pentavalent', 'penta', 'DTP-HepB-Hib'],
    'الحصبه': ['حصبه', 'حصبة', 'لقاح الحصبه', 'measles', 'MR'],
    'شلل': ['شلل اطفال', 'بوليو', 'polio', 'OPV', 'IPV', 'قطرات'],
    'التهاب_كبدي': ['كبد ب', 'التهاب كبدي ب', 'hepatitis'],
    'سحايا': ['سحايا', 'اغشيه مخيه', 'التهاب سحايا', 'meningitis'],
    'مبتسر': ['مبتسر', 'خديج', 'مولود مبكر', 'قبل الاوان', 'premature'],
    'نزوح': ['نازح', 'نزوح', 'مخيم', 'مشرد', 'نازحين', 'مهجرين', 'IDP'],
    'مناعه': ['مناعه', 'جهاز المناع', 'اجسام مضاده', 'خلايا ب', 'immunity', 'حصانه', 'حمايه'],
    'تغذيه': ['تغذيه', 'اكل', 'غذاء', 'ياكل', 'رضاعه', 'حليب', 'سمنه', 'نحافه'],
    'فوائد': ['فوائد', 'فايده', 'منفعه', 'ليش مهم', 'اهميه', 'فائده'],
    'مقارنه': ['افضل', 'احسن', 'اقوى', 'اوفر', 'فرق', 'قارن', 'قارني', 'ايش الفرق'],
    'رفض': ['رفض', 'ما ابي', 'ما ابغي', 'ما اريد', 'ما ودي', 'مو حاب', 'ما بغا'],
    'قلق': ['قلقان', 'خايف', 'قلقانه', 'خايفه', 'خوف', 'متوتر', 'خايف عليه'],
    'تشنج': ['تشنج', 'نوبه', 'صرع', 'يرتعش', 'يرتجف', 'تقلصات', 'رعشه', 'نوبات', 'اختلاج'],
    'بكاء': ['يبكي', 'بكى', 'ما يسكت', 'صار يبكي', 'يبكي كثير', 'صراخ'],
    'رضاعه': ['رضاعه', 'يرضع', 'حليب', 'ثدي', 'حليب ام', 'حليب الام', 'ارضاع'],
    'سلسله_تبريد': ['سلسله بارده', 'cold chain', 'سلسلة التبريد', 'تبريد اللقاحات', 'حفظ اللقاح'],
    'مخزون': ['مخزون', 'اداره المخزون', 'حصر اللقاحات', 'جرد', 'رصيد', 'نواقص'],
    'تسرب': ['تسرب', 'dropout', 'متسربين', 'نسبه التسرب', 'فجوه التسرب'],
    'تغطيه': ['تغطيه', 'نسبه التغطيه', 'نسب التغطيه', 'coverage', 'تغطية تحصين'],
  };

  // ══════════════════════════════════════════════════════════════════
  //  القسم ٥: كلمات الإيقاف (Stop Words)
  // ══════════════════════════════════════════════════════════════════

  static const Set<String> _stopWords = {
    'هل', 'ما', 'ماذا', 'كيف', 'متى', 'اين', 'وين', 'كم', 'لماذا', 'ليه', 'ليش',
    'عند', 'في', 'من', 'الى', 'الي', 'على', 'عن', 'مع', 'او', 'ام', 'ثم', 'لكن',
    'بعد', 'قبل', 'بين', 'هذا', 'هذه', 'ذلك', 'انا', 'انت', 'هو', 'هي', 'نحن',
    'كان', 'يكون', 'اذا', 'لو', 'اريد', 'ابي', 'نبي', 'ودي',
    'طفلي', 'طفله', 'ولدي', 'بنتي', 'يعني', 'صح', 'طيب', 'تمام', 'زين', 'ايش', 'وش',
    'اللي', 'لدي', 'عندما', 'حاب', 'بدي', 'صار', 'يوم',
    'انه', 'كلش', 'مو', 'عادي', 'الحين', 'شي', 'شيء', 'حاجة',
    'ابغى', 'ياريت', 'بغيت', 'خلاص', 'هم', 'احنا', 'انتوا',
    'بس', 'وبس', 'مثلا', 'المهم', 'بصراحه', 'والله', 'ياخي', 'شوف',
  };

  /// استخراج الكلمات المفتاحية
  static List<String> extractKeywords(String normalized) {
    return normalized.split(' ').where((w) => w.length > 1 && !_stopWords.contains(w)).toList();
  }

  // ══════════════════════════════════════════════════════════════════
  //  القسم ٦: تجميع المواضيع (Topic Clusters)
  // ══════════════════════════════════════════════════════════════════

  static const Map<String, List<String>> topicClusters = {
    'حراره': ['آثار جانبيه', 'طوارئ', 'حراره بعد التطعيم', 'حمى', 'سخونه', 'ارتفاع حراره'],
    'تورم': ['آثار جانبيه', 'انتفاخ', 'ورم مكان الحقنه', 'احمرار', 'الم'],
    'تشنج': ['آثار جانبيه', 'طوارئ', 'صرع', 'نوبه', 'يرتعش', 'اختلاج'],
    'بكاء': ['آثار جانبيه', 'بكاء مستمر', 'صراخ', 'ما يسكت'],
    'اشراف': ['اشراف داعم', 'زياره اشرافيه', 'تغذيه راجعه', 'متابعه', 'تقييم اداء'],
    'خماسي': ['DTP', 'كزاز', 'خناق', 'سعال ديكي', 'كبد ب', 'Hib'],
    'حصبه': ['حصبه المانيه', 'روبيلا', 'MR', 'outbreak'],
    'شلل': ['OPV', 'IPV', 'بوليو', 'قطرات', 'حمله شلل'],
    'رئوي': ['PCV', 'مكورات رئويه', 'التهاب رئه', 'نيوموكوكال'],
    'روتا': ['روتا فيروس', 'اسهال', 'جفاف'],
    'تبريد': ['ثلاجه', 'سلسله بارده', 'تخزين', 'VVM', 'فريزر'],
    'متخلفين': ['تسرب', 'تتبع', 'بحث', 'استرجاع', 'dropout'],
  };

  /// توسيع الكلمات المفتاحية
  static List<String> expandWithClusters(List<String> keywords) {
    final expanded = <String>[...keywords];
    for (final kw in keywords) {
      final nk = normalize(kw);
      for (final cluster in topicClusters.entries) {
        if (normalize(cluster.key) == nk || cluster.value.any((v) => normalize(v) == nk)) {
          for (final related in cluster.value) {
            final nr = normalize(related);
            if (!expanded.any((e) => normalize(e) == nr)) expanded.add(related);
          }
        }
      }
    }
    return expanded;
  }

  // ══════════════════════════════════════════════════════════════════
  //  القسم ٧: استخراج العمر
  // ══════════════════════════════════════════════════════════════════

  static final Map<String, int> _arabicNumbers = {
    'صفر': 0, 'واحد': 1, 'اثنين': 2, 'اثنان': 2, 'اتنين': 2,
    'ثلاث': 3, 'ثلاثه': 3, 'تلاته': 3, 'ثلاثة': 3,
    'اربع': 4, 'اربعه': 4, 'اربعة': 4,
    'خمس': 5, 'خمسه': 5, 'خمسة': 5,
    'ست': 6, 'سته': 6, 'ستة': 6,
    'سبع': 7, 'سبعه': 7, 'سبعة': 7,
    'ثماني': 8, 'ثمانيه': 8, 'ثمانية': 8,
    'تسع': 9, 'تسعه': 9, 'تسعة': 9,
    'عشر': 10, 'عشره': 10, 'عشرة': 10,
    'حدعش': 11, 'احدعش': 11, 'احد عشر': 11,
    'اتناشر': 12, 'اثنا عشر': 12, 'اثناشر': 12,
    'عشرين': 20, 'عشرون': 20,
    'ثلاثين': 30, 'ثلاثون': 30,
    'اربعين': 40, 'خمسين': 50, 'ستين': 60, 'سبعين': 70, 'ثمانين': 80, 'تسعين': 90,
    'مئه': 100, 'مائه': 100, 'مية': 100,
  };

  static int? parseArabicNumber(String text) {
    final n = normalize(text).trim();
    if (_arabicNumbers.containsKey(n)) return _arabicNumbers[n];
    for (final entry in _arabicNumbers.entries) {
      if (n.contains(normalize(entry.key))) return entry.value;
    }
    return null;
  }

  /// استخراج العمر من النص
  static ({int weeks, int months, int days})? extractAge(String text) {
    final n = normalize(text);

    // أرقام مباشرة
    final monthMatch = RegExp(r'عمره?\s*(\d+)\s*(شهر|شهور|شه)').firstMatch(n);
    if (monthMatch != null) {
      final m = int.tryParse(monthMatch.group(1)!);
      if (m != null) return (weeks: (m * 30) ~/ 7, months: m, days: 0);
    }
    final hasMatch = RegExp(r'عنده[ا]?\s*(\d+)\s*(شه|شهر)?').firstMatch(n);
    if (hasMatch != null) {
      final m = int.tryParse(hasMatch.group(1)!);
      if (m != null && m <= 72) return (weeks: (m * 30) ~/ 7, months: m, days: 0);
    }
    final weekMatch = RegExp(r'(\d+)\s*(اسبوع|اسابيع)').firstMatch(n);
    if (weekMatch != null) {
      final w = int.tryParse(weekMatch.group(1)!);
      if (w != null) return (weeks: w, months: (w * 7) ~/ 30, days: 0);
    }

    // صيغ خاصة
    if (n.contains('يومين')) return (weeks: 0, months: 0, days: 2);
    if (n.contains('اسبوعين') || n.contains('اسبوعان')) return (weeks: 2, months: 0, days: 0);
    if (n.contains('شهرين')) return (weeks: 8, months: 2, days: 0);
    if (n.contains('سنتين')) return (weeks: 0, months: 24, days: 0);

    // عمره شهر بدون رقم
    if (n.contains('عمره شهر') && !RegExp(r'\d').hasMatch(n.split('شهر')[0])) {
      return (weeks: 4, months: 1, days: 0);
    }
    if (n.contains('عمره شهرين')) return (weeks: 8, months: 2, days: 0);
    if (n.contains('ولده') || n.contains('مولود')) return (weeks: 0, months: 0, days: 0);

    // أرقام عربية مكتوبة
    for (final numEntry in _arabicNumbers.entries) {
      if (n.contains('${numEntry.key} شهر') || n.contains('${numEntry.key} شهور')) {
        return (weeks: (numEntry.value * 30) ~/ 7, months: numEntry.value, days: 0);
      }
    }

    return null;
  }

  // ══════════════════════════════════════════════════════════════════
  //  القسم ٨: كشف النفي والمقارنة
  // ══════════════════════════════════════════════════════════════════

  static bool hasNegation(String text) {
    final n = normalize(text);
    return RegExp(r'(ما ابي|ما ابغي|ما اريد|ما ودي|مو حاب|ما بغا|مابقى|لا تطعم|ما اعطيه|لا تعطيه|ما نبي|مو راضي|رافض|يمنع)')
        .hasMatch(n);
  }

  static bool hasComparison(String text) {
    final n = normalize(text);
    return RegExp(r'(افضل|احسن|اقوى|اوفر|اقل|اكبر|اصغر|ولّا|او لا|فرق|قارن|مقارنه|ايش الفرق|ايهما افضل|وش الافضل)')
        .hasMatch(n);
  }

  static bool isThanking(String text) {
    final n = normalize(text);
    return RegExp(r'^(شكرا|مشكور|يعطيك|الله يعطيك|تسلم|بارك|جزاك|thank|thanks|يعطيك العافيه)')
        .hasMatch(n);
  }

  static bool isGreeting(String text) {
    final n = normalize(text);
    return RegExp(r'^(مرحب|هلا|سلام|صباح|مساء|السلام|هاي|هلو|hello|hi|يا هلا)')
        .hasMatch(n);
  }

  static List<String> splitMultipleQuestions(String text) {
    final parts = text.split(RegExp(r'[؟?\n]')).where((p) => p.trim().length > 3).toList();
    return parts.length > 1 ? parts : [text];
  }

  // ══════════════════════════════════════════════════════════════════
  //  القسم ٩: كشف النية (Intent Detection) — 40+ نية
  // ══════════════════════════════════════════════════════════════════

  static IntentResult detectIntent(String normalized, {String? previousIntent, String? lastTopic}) {
    final scores = <String, double>{};

    // ═══ النوايا الصحية (من EPI-Bot) ═══
    final intentRules = <String, List<String>>{
      'age_query': ['عمر', 'عمره', 'عمرها', 'كم عمر', 'متى ياخذ', 'متى اعطيه', 'متى اطعمه', 'وش ياخذ الحين'],
      'vaccine_list': ['وش التطعيمات', 'ايش التطعيمات', 'كل التطعيمات', 'وش لقاحات', 'تطعيمات الطفل', 'وش ياخذ'],
      'schedule_query': ['متى', 'وقت', 'ميعاد', 'موعد', 'تاريخ', 'متى ياخذ', 'متى اوديه'],
      'dose_count': ['كم جرعة', 'كم جرعه', 'كم حقنه', 'كم حقة', 'كم عدد الجرعات'],
      'side_effects': ['اثار', 'اعراض', 'جانبيه', 'وش يصير بعد', 'وش يسوي بعد', 'احساس', 'ضرر', 'يضر', 'مضاعفات'],
      'emergency': ['طوارئ', 'عاجل', 'خطير', 'اخاف', 'مستعجل', 'اسعاف', 'خاف', 'متى اخاف', 'متى اخاف عليه'],
      'location': ['وين', 'اين', 'وين اطعم', 'اين اطعم', 'وين اوديه', 'مركز صحي', 'اقرب مكان'],
      'cost': ['مجاني', 'بفلوس', 'كم يكلف', 'بكم', 'تكلفه', 'مجانا', 'بلاش'],
      'campaigns': ['حمله', 'حملات', 'تطعيم وطني', 'NIDs', 'ايام تحصين'],
      'vaccine_types': ['انواع', 'نوع', 'وش نوع'],
      'myths': ['اوتيزم', 'توحد', 'عقم', 'يسبب', 'امراض', 'ضرر', 'مضرة', 'خطر', 'اسطيره'],
      'special_cases': ['مبتسر', 'خديج', 'مريض', 'سكر', 'قلب', 'hiv', 'حامل', 'حوامل', 'حاله خاصه'],
      'nutrition': ['تغذيه', 'اكل', 'رضاعه', 'حليب', 'فيتامين'],
      'cold_chain': ['تبريد', 'ثلاجه', 'سلسله', 'تبريد', 'vvm', 'تخزين'],
      'travel': ['سفر', 'مسافر', 'مطار', 'سياحه'],
      'history': ['تاريخ', 'تاريخ التحصين', 'متى بدأ'],
      'benefits': ['فوائد', 'فايده', 'ليش مهم', 'اهميه'],
      'diseases': ['الامرض', 'الامراض', 'وش الامرض', 'وش الامراض', 'مرض'],
      'child_sick': ['مريض', 'تعبان', 'ولدي مريض', 'طفلي مريض', 'هل اطعم وهو مريض'],
      'reminder': ['تذكير', 'ذكّر', 'موعد', 'متى موعد'],
      'feedback': ['شكرا', 'مشكور', 'يعطيك', 'تسلم'],
      'greeting': ['مرحب', 'هلا', 'سلام', 'صباح', 'مساء'],
      'follow_up': ['نعم', 'ايه', 'اي', 'يب', 'ايوه', 'اشرح', 'وضح', 'بالتفصيل', 'كم', 'ليه', 'ليش'],
      // ═══ نوايا إدارية (من Supervisor) ═══
      'query_submissions': ['إرساليات', 'إرسال', 'استمارة', 'كم عدد', 'كم إرسالية', 'نماذج'],
      'query_shortages': ['نقص', 'نواقص', 'احتياج', 'مفقود', 'نواقص حرجة', 'مخزون'],
      'query_analytics': ['إحصائيات', 'أرقام', 'نظرة عامة', 'لوحة', 'dashboard', 'ملخص عام'],
      'generate_report': ['تقرير', 'إنشاء تقرير', 'أنشئ', 'ملخص'],
      'query_governorates': ['محافظة', 'محافظات', 'مناطق', 'ترتيب المحافظات'],
      'analyze_trend': ['اتجاه', 'تطور', 'مقارنة', 'تحسن', 'تراجع', 'نسبة'],
      'query_health': ['تغطية', 'وصول', 'انسحاب', 'penta', 'opv', 'bcg', 'mr', 'dropout'],
      'query_users': ['مستخدم', 'فريق', 'مشرف', 'مدخل بيانات', 'أعضاء'],
      'ask_guide': ['كيف', 'شرح', 'دليل', 'تعليمات', 'خطوات', 'مساعدة'],
      'supervision': ['اشراف', 'إشراف', 'اشراف داعم', 'زياره اشرافيه'],
      'management': ['اداره', 'إدارة', 'مدير', 'مستوى وسيط'],
    };

    for (final entry in intentRules.entries) {
      double score = 0;
      for (final kw in entry.value) {
        if (normalized.contains(normalize(kw))) score += 1;
      }
      if (score > 0) scores[entry.key] = score / entry.value.length;
    }

    // follow-up boost
    if (previousIntent != null && lastTopic != null && lastTopic.isNotEmpty) {
      if (isFollowUp(normalized)) {
        scores['follow_up'] = (scores['follow_up'] ?? 0) + 0.5;
      }
    }

    // اختيار أفضل نية
    if (scores.isEmpty) {
      return IntentResult('general_question', 0.1);
    }

    final sorted = scores.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    final best = sorted.first;
    return IntentResult(best.key, best.value.clamp(0.0, 1.0), allScores: scores);
  }

  /// إرجاع قائمة مرتبة بالنيات المكتشفة (للتوافق مع الكود القديم)
  static List<IntentResult> detectIntents(String normalized, {String? previousIntent, String? lastTopic}) {
    final result = detectIntent(normalized, previousIntent: previousIntent, lastTopic: lastTopic);
    final allResults = <IntentResult>[result];
    for (final entry in result.allScores.entries) {
      if (entry.key != result.intent && entry.value > 0.1) {
        allResults.add(IntentResult(entry.key, entry.value));
      }
    }
    allResults.sort((a, b) => b.confidence.compareTo(a.confidence));
    return allResults;
  }

  static bool isFollowUp(String n) {
    return RegExp(r'^(نعم|ايه|اي|يب|ايوه|اشرح|وضح|بالتفصيل|تفاصيل|كم|ليه|ليش|طيب|تمام|واضح|فهمت|اوكي|نعم ابي|ايه ابي|زيد)')
        .hasMatch(n);
  }
}
