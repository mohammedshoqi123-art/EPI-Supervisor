/// EPI NLP Engine — Advanced Arabic NLP for EPI Supervisor
/// Ported and enhanced from EPI-Bot's smart_nlp.dart
/// Features: Arabic normalization, fuzzy matching, synonym expansion, typo correction, intent detection

class EpiNLPEngine {
  // ═══════════════════════════════════════════════════════════
  // ARABIC NORMALIZATION
  // ═══════════════════════════════════════════════════════════

  /// Normalize Arabic text: remove diacritics, unify letters, convert digits
  static String normalize(String text) {
    var result = text;
    // Remove Arabic diacritics (tashkeel)
    result = result.replaceAll(RegExp(r'[\u064B-\u065F\u0670]'), '');
    // Unify Arabic letters
    result = result.replaceAll('أ', 'ا');
    result = result.replaceAll('إ', 'ا');
    result = result.replaceAll('آ', 'ا');
    result = result.replaceAll('ٱ', 'ا');
    result = result.replaceAll('ة', 'ه');
    result = result.replaceAll('ى', 'ي');
    result = result.replaceAll('ؤ', 'و');
    result = result.replaceAll('ئ', 'ي');
    // Convert Hindi digits to Arabic
    result = result.replaceAll('٠', '0');
    result = result.replaceAll('١', '1');
    result = result.replaceAll('٢', '2');
    result = result.replaceAll('٣', '3');
    result = result.replaceAll('٤', '4');
    result = result.replaceAll('٥', '5');
    result = result.replaceAll('٦', '6');
    result = result.replaceAll('٧', '7');
    result = result.replaceAll('٨', '8');
    result = result.replaceAll('٩', '9');
    // Remove punctuation
    result = result.replaceAll(RegExp(r'[،؟؛!»«\-_\.\,\;\:\!\?]'), ' ');
    // Collapse whitespace
    result = result.replaceAll(RegExp(r'\s+'), ' ').trim();
    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // FUZZY MATCHING — Levenshtein Distance
  // ═══════════════════════════════════════════════════════════

  /// Calculate Levenshtein edit distance between two strings
  static int levenshteinDistance(String s1, String s2) {
    if (s1 == s2) return 0;
    if (s1.isEmpty) return s2.length;
    if (s2.isEmpty) return s1.length;

    List<int> prev = List<int>.generate(s2.length + 1, (i) => i);
    List<int> curr = List<int>.filled(s2.length + 1, 0);

    for (int i = 1; i <= s1.length; i++) {
      curr[0] = i;
      for (int j = 1; j <= s2.length; j++) {
        final cost = s1[i - 1] == s2[j - 1] ? 0 : 1;
        curr[j] = [
          prev[j] + 1, // deletion
          curr[j - 1] + 1, // insertion
          prev[j - 1] + cost, // substitution
        ].reduce((a, b) => a < b ? a : b);
      }
      final temp = prev;
      prev = curr;
      curr = temp;
    }

    return prev[s2.length];
  }

  /// Calculate similarity ratio (0.0 - 1.0) between two strings
  static double similarity(String s1, String s2) {
    if (s1.isEmpty && s2.isEmpty) return 1.0;
    if (s1.isEmpty || s2.isEmpty) return 0.0;
    final maxLen = s1.length > s2.length ? s1.length : s2.length;
    final dist = levenshteinDistance(s1, s2);
    return 1.0 - (dist / maxLen);
  }

  /// Find best fuzzy match from a list of candidates
  static String? fuzzyFind(String input, List<String> candidates, {double threshold = 0.75}) {
    String? bestMatch;
    double bestScore = 0.0;

    final normalized = normalize(input);
    for (final candidate in candidates) {
      final normalizedCandidate = normalize(candidate);
      final score = similarity(normalized, normalizedCandidate);
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = candidate;
      }
    }
    return bestMatch;
  }

  /// Find all fuzzy matches above threshold
  static List<String> fuzzyFindAll(String input, List<String> candidates, {double threshold = 0.6}) {
    final results = <_FuzzyMatch>[];
    final normalized = normalize(input);

    for (final candidate in candidates) {
      final normalizedCandidate = normalize(candidate);
      final score = similarity(normalized, normalizedCandidate);
      if (score >= threshold) {
        results.add(_FuzzyMatch(candidate, score));
      }
    }

    results.sort((a, b) => b.score.compareTo(a.score));
    return results.map((r) => r.text).toList();
  }

  // ═══════════════════════════════════════════════════════════
  // SYNONYM EXPANSION — 200+ EPI-related synonym groups
  // ═══════════════════════════════════════════════════════════

  static const Map<String, List<String>> _synonymGroups = {
    'تطعيم': ['تطعيم', 'تحصين', 'لقاح', 'تلقح', 'تحصينات', 'تطعيمات', 'لقاحات'],
    'حملة': ['حمله', 'حملات', 'حمله الوطنيه', 'الحمله الوطنيه', 'NID', 'SNID', 'حمله شلل'],
    'تغطية': ['تغطيه', 'نسبه', 'نسبة', 'معدل', 'نسبه التغطيه', 'وصول'],
    'نقص': ['نقص', 'نواقص', 'احتياج', 'عجز', 'خلل', 'نقصان'],
    'إشراف': ['اشراف', 'اشرافي', 'زياره', 'زيارات', 'زياره اشرافيه', 'زياره ميدانيه'],
    'محافظة': ['محافظه', 'محافظات', 'محافظ', 'المنطقه', 'المناطق'],
    'مرفق': ['مرفق', 'مرافق', 'مرفق صحي', 'مركز صحي', 'مستوصف', 'وحده صحيه'],
    'تسرب': ['تسرب', 'انسحاب', 'dropout', 'ترك', 'تخلي'],
    'رفض': ['رفض', 'معارضه', 'ممانعه', 'مقاومه', 'امتناع'],
    'شلل': ['شلل', 'بوليو', 'polio', 'شلل الاطفال', 'OPV', 'IPV'],
    'حصبة': ['حصبه', 'حصبه', 'MR', 'M&R', 'روبيلا', 'حصبه المانيه'],
    'سلسلة تبريد': ['سلسله تبريد', 'ثلاجه', 'ثلاجات', 'تبريد', 'حفظ', 'سلاسه'],
    'تحصين ممتد': ['Penta', 'pentavalent', 'خماسي', 'بيتا', 'pentavalent'],
    'إرسالية': ['ارساليه', 'ارسال', 'استماره', 'بيانات', 'form'],
    'نواقص': ['نواقص', 'عجز', 'نقص', 'احتياجات', 'مشاكل'],
    'أداء': ['اداء', 'كفاءه', 'جوده', 'مستوى', 'مستوي'],
    'خطة': ['خطه', 'خطة', 'خطط', 'برنامج', 'جدول'],
    'مجتمع': ['مجتمع', 'اهل', 'سكان', 'عوائل', 'اسر'],
    'أعراض': ['اعراض', 'اعراض جانبيه', 'آثار', 'اثار', 'AEFI'],
    'تحليل': ['تحليل', 'analyses', 'analyst', 'دراسه', 'فحص'],
  };

  /// Expand a word to all its synonyms
  static List<String> expandSynonyms(String word) {
    final normalized = normalize(word);
    for (final entry in _synonymGroups.entries) {
      for (final synonym in entry.value) {
        if (normalize(synonym) == normalized) {
          return entry.value;
        }
      }
    }
    return [word];
  }

  /// Get all synonyms for a query — useful for search expansion
  static Set<String> getAllSynonyms(String query) {
    final words = normalize(query).split(' ');
    final allSynonyms = <String>{};
    for (final word in words) {
      allSynonyms.addAll(expandSynonyms(word));
    }
    return allSynonyms;
  }

  // ═══════════════════════════════════════════════════════════
  // TYPO CORRECTION — Common Arabic EPI typos
  // ═══════════════════════════════════════════════════════════

  static const Map<String, String> _typoCorrections = {
    'تحصبن': 'تحصين',
    'تطعن': 'تطعيم',
    'لقاحا': 'لقاحات',
    'حملت': 'حملات',
    'محاظة': 'محافظة',
    'محاظه': 'محافظة',
    'اسراريه': 'إرسالية',
    'استماره': 'استمارة',
    'ناقص': 'نواقص',
    'تفطيه': 'تغطية',
    'تغطي': 'تغطية',
    'اطفال': 'أطفال',
    'الاطفال': 'الأطفال',
    'حصبي': 'حصبة',
    'شلي': 'شلل',
    'ثلاج': 'ثلاجات',
    'مراق': 'مرفق',
    'مرافق صح': 'مرفق صحي',
    'خماس': 'خماسي',
    'تسربب': 'تسرب',
    'انسباب': 'انسحاب',
    'رفظ': 'رفض',
    'اشرافي': 'إشرافي',
    'زيارت': 'زيارات',
    'اقترح': 'اقتراحات',
    'توصيات': 'توصية',
    'تحليلل': 'تحليل',
    'خطب': 'خطة',
    'خططه': 'خطة',
    'بيات': 'بيانات',
    'جودت': 'جودة',
    'ادائ': 'أداء',
  };

  /// Correct common Arabic typos in EPI context
  static String correctTypos(String text) {
    var result = text;
    _typoCorrections.forEach((typo, correction) {
      result = result.replaceAll(typo, correction);
    });

    // Fuzzy correction for words not in dictionary
    final words = result.split(' ');
    final corrected = <String>[];
    for (final word in words) {
      if (word.length < 3) {
        corrected.add(word);
        continue;
      }
      final fuzzyMatch = fuzzyFind(word, _typoCorrections.keys.toList(), threshold: 0.82);
      if (fuzzyMatch != null) {
        corrected.add(_typoCorrections[fuzzyMatch]!);
      } else {
        corrected.add(word);
      }
    }
    return corrected.join(' ');
  }

  // ═══════════════════════════════════════════════════════════
  // STOP WORDS — Arabic + Yemeni dialect
  // ═══════════════════════════════════════════════════════════

  static const Set<String> _stopWords = {
    'في', 'من', 'على', 'الى', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك',
    'تلك', 'التي', 'الذي', 'الذين', 'هو', 'هي', 'هم', 'هن', 'أنا',
    'نحن', 'انت', 'انتم', 'كان', 'كانت', 'يكون', 'تكون', 'ليس',
    'ليست', 'هل', 'ما', 'كيف', 'لماذا', 'متى', 'أين', 'كم', 'أي',
    'لا', 'لم', 'لن', 'قد', 'سوف', 'بعد', 'قبل', 'بين', 'حتى',
    'إذا', 'اذا', 'انه', 'انها', 'بأن', 'انه', 'لكن', 'ولكن',
    'او', 'أو', 'ثم', 'و', 'ف', 'ب', 'ل', 'ال', 'يا', 'ايش',
    'وش', 'ليش', 'كيفك', 'شنو', 'هلق', 'الحين', 'عادي',
  };

  /// Remove stop words from text
  static List<String> removeStopWords(String text) {
    final words = normalize(text).split(' ');
    return words.where((w) => !_stopWords.contains(w) && w.length > 1).toList();
  }

  // ═══════════════════════════════════════════════════════════
  // INTENT DETECTION — EPI-specific weighted intents
  // ═══════════════════════════════════════════════════════════

  static const Map<String, Map<String, double>> _intentKeywords = {
    'query_submissions': {
      'ارساليه': 1.0, 'ارساليات': 1.0, 'استماره': 0.9, 'استمارات': 0.9,
      'بيانات': 0.5, 'عدد': 0.4, 'كم': 0.3,
    },
    'query_shortages': {
      'نقص': 1.0, 'نواقص': 1.0, 'احتياج': 0.9, 'عجز': 0.8,
      'حرج': 0.7, 'خطر': 0.6, 'مشكله': 0.4,
    },
    'query_analytics': {
      'تحليل': 1.0, 'احصائيات': 0.9, 'ارقام': 0.6, 'مؤشرات': 0.8,
      'احصاء': 0.7, 'بيانات': 0.5,
    },
    'generate_report': {
      'تقرير': 1.0, 'تقارير': 0.9, 'ملخص': 0.7, 'تقرر': 0.8,
      'اصنع': 0.5, 'انشئ': 0.6, 'ولد': 0.4,
    },
    'query_governorates': {
      'محافظه': 1.0, 'محافظات': 1.0, 'منطقه': 0.7, 'مناطق': 0.7,
      'ترتيب': 0.5, 'افضل': 0.4, 'اسوا': 0.4,
    },
    'query_vaccination': {
      'تطعيم': 1.0, 'تحصين': 0.9, 'لقاح': 0.9, 'تغطيه': 0.8,
      'وصول': 0.7, 'جرعه': 0.7, 'تسرب': 0.6,
    },
    'query_campaign': {
      'حمله': 1.0, 'حملات': 1.0, 'شلل': 0.8, 'NID': 0.9,
      'SNID': 0.9, 'حمله وطنيه': 1.0,
    },
    'query_supervision': {
      'اشراف': 1.0, 'اشرافي': 0.9, 'زياره': 0.8, 'ميداني': 0.7,
      'تقييم': 0.6, 'ملاحظه': 0.5,
    },
    'query_cold_chain': {
      'ثلاجه': 1.0, 'تبريد': 0.9, 'سلسله': 0.8, 'حفظ': 0.7,
      'VVM': 0.9, 'درجه حراره': 0.8,
    },
    'query_aefi': {
      'اعراض': 1.0, 'جانبيه': 0.9, 'ضاره': 0.8, 'AEFI': 1.0,
      'خطر': 0.5, 'تسمم': 0.7,
    },
    'query_coverage': {
      'تغطيه': 1.0, 'نسبه': 0.8, 'معدل': 0.7, 'وصول': 0.8,
      'Penta': 0.9, 'dropout': 0.9, 'انسحاب': 0.7,
    },
    'ask_guide': {
      'كيف': 0.6, 'طريقه': 0.8, 'دليل': 0.9, 'شرح': 0.7,
      'استخدام': 0.7, 'مساعده': 0.5,
    },
    'analyze_trend': {
      'اتجاه': 1.0, 'تطور': 0.8, 'مقارنه': 0.7, 'تحسن': 0.6,
      'تراجع': 0.6, 'تغير': 0.5,
    },
    'general_question': {
      'ما': 0.2, 'هل': 0.2, 'ليش': 0.1,
    },
  };

  /// Detect intent from Arabic text with confidence scores
  static List<IntentResult> detectIntents(String text, {int topN = 3}) {
    final normalized = correctTypos(normalize(text));
    final words = normalized.split(' ');

    final scores = <String, double>{};

    for (final entry in _intentKeywords.entries) {
      double score = 0.0;
      for (final word in words) {
        for (final keyword in entry.value.entries) {
          if (normalize(keyword.key) == word || similarity(normalize(keyword.key), word) > 0.8) {
            score += keyword.value;
          }
        }
        // Also check synonyms
        final synonyms = expandSynonyms(word);
        for (final synonym in synonyms) {
          for (final keyword in entry.value.entries) {
            if (normalize(keyword.key) == normalize(synonym)) {
              score += keyword.value * 0.7; // Slightly lower weight for synonym matches
            }
          }
        }
      }
      if (score > 0) {
        scores[entry.key] = score;
      }
    }

    // Sort by score descending
    final sorted = scores.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    // Calculate confidence as percentage of top score
    final maxScore = sorted.isNotEmpty ? sorted.first.value : 0.0;

    return sorted.take(topN).map((e) => IntentResult(
      intent: e.key,
      confidence: maxScore > 0 ? (e.value / maxScore).clamp(0.0, 1.0) : 0.0,
      score: e.value,
    )).toList();
  }

  // ═══════════════════════════════════════════════════════════
  // SENTIMENT ANALYSIS — Arabic EPI context
  // ═══════════════════════════════════════════════════════════

  static const Map<String, List<String>> _sentimentPatterns = {
    'worry': ['قلق', 'خائف', 'خايف', 'خوف', 'مقلق', 'مخيف', 'خطر'],
    'urgency': ['عاجل', 'فوري', 'ضروري', 'الان', 'حالا', 'سريع', 'طوارئ'],
    'frustration': ['محبط', 'زعلان', 'متضايق', 'مستاء', 'مشكله', 'يع', 'اح'],
    'confusion': ['محتار', 'مو فاهم', 'كيف', 'ليش', 'شنو', 'ايش', 'مش فاهم'],
    'gratitude': ['شكرا', 'شكر', 'يعطيك العافيه', 'مشكور', 'جزاك', 'ممتاز', 'رائع'],
    'relief': ['الحمدلله', 'حمدلله', 'خير', 'ان شاء الله', 'تمام', 'زين'],
  };

  /// Detect sentiment from Arabic text
  static List<SentimentResult> analyzeSentiment(String text) {
    final normalized = normalize(text);
    final results = <SentimentResult>[];

    for (final entry in _sentimentPatterns.entries) {
      int matchCount = 0;
      for (final pattern in entry.value) {
        if (normalized.contains(normalize(pattern))) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        final confidence = (matchCount / entry.value.length).clamp(0.0, 1.0);
        results.add(SentimentResult(
          sentiment: entry.key,
          confidence: confidence,
          matchCount: matchCount,
        ));
      }
    }

    results.sort((a, b) => b.confidence.compareTo(a.confidence));
    return results;
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════

  /// Check if text is a greeting
  static bool isGreeting(String text) {
    final normalized = normalize(text);
    return ['مرحبا', 'هلا', 'السلام عليكم', 'سلام', 'اهلا', 'صباح الخير', 'مساء الخير']
        .any((g) => normalized.contains(normalize(g)));
  }

  /// Check if text is a thank you
  static bool isThanking(String text) {
    final normalized = normalize(text);
    return ['شكرا', 'شكر', 'مشكور', 'يعطيك العافيه', 'جزاك الله']
        .any((g) => normalized.contains(normalize(g)));
  }

  /// Extract age from Arabic text
  static int? extractAge(String text) {
    // Pattern: "عمره X شهور/أسابيع/سنوات"
    final ageMatch = RegExp(r'عمر[هها]?\s*(\d+)\s*(شهر|اسبوع|أسبوع|سنه|سنة|يوم)')
        .firstMatch(text);
    if (ageMatch != null) {
      final num = int.tryParse(ageMatch.group(1) ?? '') ?? 0;
      final unit = ageMatch.group(2) ?? '';
      if (unit.contains('شهر')) return num;
      if (unit.contains('اسبوع') || unit.contains('أسبوع')) return (num / 4.3).round();
      if (unit.contains('سنه') || unit.contains('سنة')) return num * 12;
      if (unit.contains('يوم')) return (num / 30).round();
    }

    // Fallback: just a number followed by month/year
    final simpleMatch = RegExp(r'(\d+)\s*(شهر|شهور|سنه|سنة)').firstMatch(text);
    if (simpleMatch != null) {
      final num = int.tryParse(simpleMatch.group(1) ?? '') ?? 0;
      final unit = simpleMatch.group(2) ?? '';
      if (unit.contains('شهر')) return num;
      if (unit.contains('سنه') || unit.contains('سنة')) return num * 12;
    }

    return null;
  }

  /// Detect if text mentions a specific vaccine
  static String? detectVaccineMention(String text) {
    final normalized = normalize(text);
    const vaccineNames = {
      'BCG': ['bcg', 'بي سي جي', 'الدرن'],
      'OPV': ['opv', 'شلل فموي'],
      'IPV': ['ipv', 'شلل حقن'],
      'Penta': ['penta', 'pentavalent', 'خماسي', 'بيتا'],
      'PCV': ['pcv', 'نيموكوكال', 'رئوي'],
      'Rotavirus': ['rotavirus', 'روتا', 'روتافيرس'],
      'MR': ['mr', 'حصبه', 'روبيلا'],
      'HepB': ['hepb', 'كبد', 'التهاب كبدي'],
      'TT': ['tt', 'td', 'كزاز', 'دفتيريا'],
      'Vitamin A': ['فيتامين', 'vitamin', 'فيتامين ا'],
    };

    for (final entry in vaccineNames.entries) {
      for (final name in entry.value) {
        if (normalized.contains(normalize(name))) {
          return entry.key;
        }
      }
    }
    return null;
  }

  /// Split compound questions
  static List<String> splitMultipleQuestions(String text) {
    final parts = <String>[];
    // Split by "و" when used as question connector
    final segments = text.split(RegExp(r'\s+و\s+'));
    for (final segment in segments) {
      final trimmed = segment.trim();
      if (trimmed.isNotEmpty) parts.add(trimmed);
    }
    // Also split by question marks
    if (parts.length <= 1 && text.contains('؟')) {
      final qParts = text.split('؟');
      for (final p in qParts) {
        final trimmed = p.trim();
        if (trimmed.isNotEmpty) parts.add(trimmed);
      }
    }
    return parts.length > 1 ? parts : [text];
  }
}

// ═══════════════════════════════════════════════════════════
// DATA MODELS
// ═══════════════════════════════════════════════════════════

class IntentResult {
  final String intent;
  final double confidence;
  final double score;

  const IntentResult({
    required this.intent,
    required this.confidence,
    required this.score,
  });

  @override
  String toString() => 'IntentResult($intent, confidence: ${confidence.toStringAsFixed(2)}, score: ${score.toStringAsFixed(2)})';
}

class SentimentResult {
  final String sentiment;
  final double confidence;
  final int matchCount;

  const SentimentResult({
    required this.sentiment,
    required this.confidence,
    required this.matchCount,
  });

  @override
  String toString() => 'SentimentResult($sentiment, confidence: ${confidence.toStringAsFixed(2)})';
}

class _FuzzyMatch {
  final String text;
  final double score;
  const _FuzzyMatch(this.text, this.score);
}
