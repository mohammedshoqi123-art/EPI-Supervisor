import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../errors/app_exceptions.dart';

/// HuggingFace Inference API Service
/// Base layer for all HuggingFace model interactions
class HuggingFaceService {
  static const String _baseUrl =
      'https://router.huggingface.co/hf-inference/models';

  final String _apiToken;
  final http.Client _httpClient;

  // Request tracking for rate limiting
  int _requestCount = 0;
  DateTime _windowStart = DateTime.now();
  static const int _maxRequestsPerMinute = 25; // stay under 30 limit
  static const int _rateWindowSeconds = 60;

  // Cache for repeated queries
  final Map<String, _CachedResponse> _cache = {};
  static const Duration _cacheTTL = Duration(minutes: 5);

  HuggingFaceService(this._apiToken, {http.Client? httpClient})
    : _httpClient = httpClient ?? http.Client();

  /// Check if the service is available
  Future<bool> isAvailable() async {
    try {
      final response = await _httpClient.get(
        Uri.parse('$_baseUrl/intfloat/multilingual-e5-large'),
        headers: _headers,
      );
      return response.statusCode != 401;
    } catch (_) {
      return false;
    }
  }

  Map<String, String> get _headers => {
    'Authorization': 'Bearer $_apiToken',
    'Content-Type': 'application/json',
  };

  /// Rate-limited request with caching
  Future<dynamic> _request(
    String modelId,
    Map<String, dynamic> body, {
    Duration timeout = const Duration(seconds: 30),
  }) async {
    // Check cache
    final cacheKey = '$modelId:${jsonEncode(body)}';
    final cached = _cache[cacheKey];
    if (cached != null && !cached.isExpired) {
      return cached.data;
    }

    // Rate limit check
    await _waitForRateLimit();

    final url = '$_baseUrl/$modelId';
    try {
      final response = await _httpClient
          .post(Uri.parse(url), headers: _headers, body: jsonEncode(body))
          .timeout(timeout);

      _requestCount++;

      if (response.statusCode == 429) {
        // Rate limited — wait and retry once
        await Future.delayed(const Duration(seconds: 5));
        return _request(modelId, body, timeout: timeout);
      }

      if (response.statusCode != 200) {
        throw AIException(
          'HF API error ${response.statusCode}: ${response.body}',
        );
      }

      final data = jsonDecode(response.body);

      // Cache successful responses
      _cache[cacheKey] = _CachedResponse(data, DateTime.now());

      return data;
    } on TimeoutException {
      throw AIException('HF API timeout for model: $modelId');
    } catch (e) {
      if (e is AIException) rethrow;
      throw AIException('HF API error: $e');
    }
  }

  Future<void> _waitForRateLimit() async {
    final now = DateTime.now();
    if (now.difference(_windowStart).inSeconds >= _rateWindowSeconds) {
      _requestCount = 0;
      _windowStart = now;
    }
    if (_requestCount >= _maxRequestsPerMinute) {
      final waitMs =
          _rateWindowSeconds * 1000 -
          now.difference(_windowStart).inMilliseconds;
      if (waitMs > 0) {
        await Future.delayed(Duration(milliseconds: waitMs + 100));
      }
      _requestCount = 0;
      _windowStart = DateTime.now();
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EMBEDDINGS
  // ═══════════════════════════════════════════════════════════

  /// Generate embeddings for a list of texts
  /// Uses intfloat/multilingual-e5-large (1024-dim, multilingual including Arabic)
  Future<List<List<double>>> generateEmbeddings(List<String> texts) async {
    final result = await _request('intfloat/multilingual-e5-large', {
      'inputs': texts,
    });

    if (result is List) {
      return result
          .map<List<double>>(
            (e) =>
                (e as List).map<double>((v) => (v as num).toDouble()).toList(),
          )
          .toList();
    }
    throw AIException('Unexpected embeddings response format');
  }

  /// Generate a single embedding
  Future<List<double>> generateEmbedding(String text) async {
    final results = await generateEmbeddings([text]);
    return results.first;
  }

  /// Generate fast embeddings using BGE (768-dim, faster)
  Future<List<List<double>>> generateFastEmbeddings(List<String> texts) async {
    final result = await _request('BAAI/bge-base-en-v1.5', {'inputs': texts});

    if (result is List) {
      return result
          .map<List<double>>(
            (e) =>
                (e as List).map<double>((v) => (v as num).toDouble()).toList(),
          )
          .toList();
    }
    throw AIException('Unexpected fast embeddings response format');
  }

  // ═══════════════════════════════════════════════════════════
  // INTENT CLASSIFICATION
  // ═══════════════════════════════════════════════════════════

  /// Classify user intent using zero-shot classification
  Future<Map<String, double>> classifyIntent(
    String text, {
    List<String>? customLabels,
  }) async {
    final labels = customLabels ?? IntentLabels.defaultLabels;

    final result = await _request('facebook/bart-large-mnli', {
      'inputs': text,
      'parameters': {'candidate_labels': labels},
    });

    if (result is List && result.isNotEmpty) {
      final item = result.first;
      final labelList = item['labels'] as List;
      final scoreList = item['scores'] as List;

      final Map<String, double> scores = {};
      for (int i = 0; i < labelList.length; i++) {
        scores[labelList[i] as String] = (scoreList[i] as num).toDouble();
      }
      return scores;
    }

    throw AIException('Unexpected classification response');
  }

  /// Get the top intent with confidence
  Future<({String intent, double confidence})> getTopIntent(String text) async {
    final scores = await classifyIntent(text);
    final sorted = scores.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return (intent: sorted.first.key, confidence: sorted.first.value);
  }

  // ═══════════════════════════════════════════════════════════
  // QUESTION ANSWERING
  // ═══════════════════════════════════════════════════════════

  /// Answer a question given context using XLM-RoBERTa
  Future<({String answer, double score})> answerQuestion(
    String question,
    String context,
  ) async {
    final result = await _request('deepset/xlm-roberta-base-squad2', {
      'inputs': {'question': question, 'context': context},
    });

    if (result is Map) {
      return (
        answer: result['answer'] as String? ?? '',
        score: (result['score'] as num?)?.toDouble() ?? 0.0,
      );
    }

    throw AIException('Unexpected QA response');
  }

  // ═══════════════════════════════════════════════════════════
  // SUMMARIZATION
  // ═══════════════════════════════════════════════════════════

  /// Summarize text
  Future<String> summarize(String text, {int maxLength = 150}) async {
    final result = await _request('facebook/bart-large-cnn', {
      'inputs': text,
      'parameters': {'max_length': maxLength, 'min_length': 30},
    });

    if (result is List && result.isNotEmpty) {
      return result.first['summary_text'] as String? ?? text;
    }

    return text;
  }

  // ═══════════════════════════════════════════════════════════
  // SIMILARITY
  // ═══════════════════════════════════════════════════════════

  /// Compute cosine similarity between two embedding vectors
  static double cosineSimilarity(List<double> a, List<double> b) {
    if (a.length != b.length) return 0.0;

    double dotProduct = 0.0;
    double normA = 0.0;
    double normB = 0.0;

    for (int i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA == 0 || normB == 0) return 0.0;
    return dotProduct / (normA * normB);
  }

  /// Clear cache
  void clearCache() => _cache.clear();

  /// Dispose resources
  void dispose() => _httpClient.close();
}

// ═══════════════════════════════════════════════════════════
// SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════

class IntentLabels {
  static const List<String> defaultLabels = [
    'query_submissions', // سؤال عن الإرساليات
    'query_shortages', // سؤال عن النواقص
    'query_analytics', // سؤال عن التحليلات
    'generate_report', // طلب تقرير
    'query_governorates', // سؤال عن المحافظات
    'query_users', // سؤال عن المستخدمين
    'ask_guide', // سؤال عن كيفية الاستخدام
    'analyze_trend', // تحليل اتجاه
    'compare_data', // مقارنة بيانات
    'query_health', // سؤال عن التطعيمات
    'general_question', // سؤال عام
  ];

  /// Map intent to database query type
  static String intentToQueryType(String intent) {
    const mapping = {
      'query_submissions': 'submissions',
      'query_shortages': 'shortages',
      'query_analytics': 'analytics',
      'generate_report': 'report',
      'query_governorates': 'governorates',
      'query_users': 'users',
      'query_health': 'health',
      'analyze_trend': 'trend',
      'compare_data': 'comparison',
    };
    return mapping[intent] ?? 'general';
  }
}

class _CachedResponse {
  final dynamic data;
  final DateTime timestamp;
  static const Duration ttl = Duration(minutes: 5);

  _CachedResponse(this.data, this.timestamp);

  bool get isExpired => DateTime.now().difference(timestamp) > ttl;
}
