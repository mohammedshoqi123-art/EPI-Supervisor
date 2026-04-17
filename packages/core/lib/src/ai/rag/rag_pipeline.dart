import 'dart:convert';
import 'dart:math';
import '../huggingface/hf_service.dart';

/// Document chunk for the knowledge base
class KnowledgeDocument {
  final String id;
  final String content;
  final String category;
  final Map<String, dynamic>? metadata;
  List<double>? embedding;

  KnowledgeDocument({
    required this.id,
    required this.content,
    required this.category,
    this.metadata,
    this.embedding,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'content': content,
    'category': category,
    'metadata': metadata,
  };

  factory KnowledgeDocument.fromJson(Map<String, dynamic> json) =>
      KnowledgeDocument(
        id: json['id'] as String,
        content: json['content'] as String,
        category: json['category'] as String,
        metadata: json['metadata'] as Map<String, dynamic>?,
      );
}

/// Search result with relevance score
class RagResult {
  final KnowledgeDocument document;
  final double score;

  RagResult({required this.document, required this.score});
}

/// Retrieval-Augmented Generation Pipeline
/// Uses embeddings for semantic search + context injection for LLM
class RagPipeline {
  final HuggingFaceService _hf;
  final List<KnowledgeDocument> _documents = [];
  bool _embeddingsReady = false;

  RagPipeline(this._hf);

  /// Build the knowledge base from EPI data
  Future<void> buildKnowledgeBase() async {
    _documents.clear();

    // Add EPI knowledge documents
    _addEpiKnowledge();

    // Generate embeddings for all documents
    await _generateAllEmbeddings();
    _embeddingsReady = true;
  }

  /// Search for relevant documents given a query
  Future<List<RagResult>> search(String query, {int topK = 5}) async {
    if (!_embeddingsReady || _documents.isEmpty) {
      return [];
    }

    // Generate query embedding
    final queryEmbedding = await _hf.generateEmbedding(query);

    // Compute similarities
    final results = <RagResult>[];
    for (final doc in _documents) {
      if (doc.embedding == null) continue;
      final similarity = HuggingFaceService.cosineSimilarity(
        queryEmbedding,
        doc.embedding!,
      );
      if (similarity > 0.3) {
        // minimum threshold
        results.add(RagResult(document: doc, score: similarity));
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score.compareTo(a.score));
    return results.take(topK).toList();
  }

  /// Get context string for LLM injection
  Future<String> getRelevantContext(String query, {int topK = 3}) async {
    final results = await search(query, topK: topK);
    if (results.isEmpty) return '';

    final buffer = StringBuffer();
    buffer.writeln('== معلومات ذات صلة من قاعدة المعرفة ==');

    for (final result in results) {
      buffer.writeln(
        '\n[${result.document.category}] '
        '(صلة: ${(result.score * 100).toStringAsFixed(0)}%)',
      );
      buffer.writeln(result.document.content);
    }

    return buffer.toString();
  }

  /// Add a document to the knowledge base (with embedding)
  Future<void> addDocument(KnowledgeDocument doc) async {
    doc.embedding = await _hf.generateEmbedding(doc.content);
    _documents.add(doc);
  }

  /// Add multiple documents at once (batch embedding)
  Future<void> addDocuments(List<KnowledgeDocument> docs) async {
    if (docs.isEmpty) return;

    final texts = docs.map((d) => d.content).toList();
    final embeddings = await _hf.generateEmbeddings(texts);

    for (int i = 0; i < docs.length; i++) {
      docs[i].embedding = embeddings[i];
      _documents.add(docs[i]);
    }
  }

  /// Update knowledge base from Supabase data
  Future<void> syncFromDatabase(
    List<Map<String, dynamic>> submissions,
    List<Map<String, dynamic>> shortages,
    List<Map<String, dynamic>> governorates,
  ) async {
    final newDocs = <KnowledgeDocument>[];

    // Convert submissions to searchable documents
    for (final sub in submissions) {
      newDocs.add(
        KnowledgeDocument(
          id: 'sub_${sub['id']}',
          content: _submissionToText(sub),
          category: 'submission',
          metadata: sub,
        ),
      );
    }

    // Convert shortages
    for (final short in shortages) {
      newDocs.add(
        KnowledgeDocument(
          id: 'short_${short['id']}',
          content: _shortageToText(short),
          category: 'shortage',
          metadata: short,
        ),
      );
    }

    // Convert governorates
    for (final gov in governorates) {
      newDocs.add(
        KnowledgeDocument(
          id: 'gov_${gov['id']}',
          content: _governorateToText(gov),
          category: 'governorate',
          metadata: gov,
        ),
      );
    }

    if (newDocs.isNotEmpty) {
      await addDocuments(newDocs);
    }
  }

  int get documentCount => _documents.length;
  bool get isReady => _embeddingsReady;

  // ═══════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════

  Future<void> _generateAllEmbeddings() async {
    // Batch process to avoid API limits (10 at a time)
    const batchSize = 10;
    for (int i = 0; i < _documents.length; i += batchSize) {
      final end = min(i + batchSize, _documents.length);
      final batch = _documents.sublist(i, end);
      final texts = batch.map((d) => d.content).toList();

      try {
        final embeddings = await _hf.generateEmbeddings(texts);
        for (int j = 0; j < batch.length; j++) {
          batch[j].embedding = embeddings[j];
        }
      } catch (e) {
        // If embedding fails, skip this batch
        print('Embedding batch $i-$end failed: $e');
      }

      // Small delay between batches
      if (i + batchSize < _documents.length) {
        await Future.delayed(const Duration(milliseconds: 500));
      }
    }
  }

  void _addEpiKnowledge() {
    // Vaccination schedule
    _documents.add(
      KnowledgeDocument(
        id: 'epi_schedule',
        content: '''
جدول التطعيم اليمن:
- الولادة: BCG + OPV0 + HepB ولادي
- 6 أسابيع: Penta1 + OPV1 + PCV1 + Rota1
- 10 أسابيع: Penta2 + OPV2 + PCV2 + Rota2
- 14 أسبوع: Penta3 + OPV3 + PCV3 + IPV
- 9 أشهر: MR (حصبة وحصبة ألمانية)
- 18 شهر: MR الجرعة الثانية
- 5 سنوات: DPT booster
''',
        category: 'vaccination',
      ),
    );

    // EPI indicators
    _documents.add(
      KnowledgeDocument(
        id: 'epi_indicators',
        content: '''
مؤشرات EPI الرئيسية:
- Penta3 coverage (تغطية اللقاح الثلاثي): مؤشر الوصول. الهدف >90%
- Dropout rate (نسبة الانسحاب): Penta1 إلى Penta3. المقبول <10%
- Measles coverage (تغطية الحصبة): مؤشر الحماية الجماعية
- Dropout formula: (Penta1 - Penta3) / Penta1 × 100
- Health Score: 80+=ممتاز, 50-79=متوسط, <50=ضعيف
- معدل الرفض: <5%=جيد, 5-15%=يحتاج تدريب, >15%=مشكلة خطيرة
''',
        category: 'indicators',
      ),
    );

    // Platform features
    _documents.add(
      KnowledgeDocument(
        id: 'platform_features',
        content: '''
ميزات منصة مشرف EPI:
- نماذج ديناميكية: 10 أنواع حقول (نص، رقم، اختيار، GPS، صورة)
- عمل بدون إنترنت: حفظ محلي + مزامنة تلقائية
- تقارير PDF: يومي، أسبوعي، محافظات، نواقص، جودة
- خرائط تفاعلية: OpenStreetMap مع clustering
- مساعد ذكي: MiMo AI + HuggingFace
- 5 أدوار: مدير النظام > مركزي > محافظة > مديرية > إدخال بيانات
- نظام مزامنة: Priority Queue + Exponential Backoff + Smart Merge
''',
        category: 'platform',
      ),
    );

    // Challenges
    _documents.add(
      KnowledgeDocument(
        id: 'epi_challenges',
        content: '''
تحديات التطعيم في اليمن:
- 27% من الأطفال غير مطعمين بالكامل
- ظهور حالات شلل الأطفال 2020-2021
- النزوح الداخلي يعيق الوصول
- ضعف البنية التحتية الصحية
- انقطاع الكهرباء يؤثر على سلسلة التبريد
- نقص الكوادر الصحية المدربة
- صعوبة الوصول للمناطق النائية
''',
        category: 'challenges',
      ),
    );

    // Governorate info
    _documents.add(
      KnowledgeDocument(
        id: 'yemen_governorates',
        content: '''
محافظات اليمن (22 محافظة):
صنعاء، عدن، تعز، الحديدة، إب، ذمار، حجة، المحويت، الجوف، مأرب، البيضاء، أبين، شبوة، لحج، الضالع، حضرموت، المهرة، سقطرى، عمران، صعدة، ريمة، אמנ
''',
        category: 'governorate',
      ),
    );
  }

  String _submissionToText(Map<String, dynamic> sub) {
    final status = sub['status'] ?? 'غير معروف';
    final gov = sub['governorate_name'] ?? '';
    final dist = sub['district_name'] ?? '';
    final date = sub['created_at'] ?? '';
    return 'إرسالية $status في $gov - $dist بتاريخ $date';
  }

  String _shortageToText(Map<String, dynamic> short) {
    final item = short['item_name'] ?? '';
    final severity = short['severity'] ?? '';
    final gov = short['governorate_name'] ?? '';
    return 'نقص $severity: $item في $gov';
  }

  String _governorateToText(Map<String, dynamic> gov) {
    final name = gov['name_ar'] ?? '';
    final pop = gov['population'] ?? 'غير معروف';
    return 'محافظة $name - عدد السكان: $pop';
  }
}
