import 'dart:convert';
import '../huggingface/hf_service.dart';

/// Represents a database function that the AI can call
class AIFunction {
  final String name;
  final String descriptionAr;
  final String descriptionEn;
  final String queryType;
  final List<FunctionParameter> parameters;
  final String Function(Map<String, dynamic> params) buildQuery;

  const AIFunction({
    required this.name,
    required this.descriptionAr,
    required this.descriptionEn,
    required this.queryType,
    required this.parameters,
    required this.buildQuery,
});
}

class FunctionParameter {
  final String name;
  final String type;
  final String descriptionAr;
  final bool required;

  const FunctionParameter({
    required this.name,
    required this.type,
    required this.descriptionAr,
    this.required = false,
});
}

/// Result from a function call
class FunctionCallResult {
  final String functionName;
  final Map<String, dynamic> parameters;
  final String query;
  final dynamic data;
  final bool success;
  final String? error;

  FunctionCallResult({
    required this.functionName,
    required this.parameters,
    required this.query,
    this.data,
    required this.success,
    this.error,
});
}

/// Function Calling Engine
/// Lets the AI query the database by selecting and parameterizing functions
class FunctionCallingEngine {
  final HuggingFaceService _hf;
  final List<AIFunction> _functions = [];

  FunctionCallingEngine(this._hf) {
    _registerDefaultFunctions();
  }

  /// Analyze a user message and determine the best function to call
  Future<FunctionCallResult?> analyzeAndCall(
    String userMessage,
    Future<dynamic> Function(String query, Map<String, params) executor,
  ) async {
    // Step 1: Classify intent
    final intentResult = await _hf.getTopIntent(userMessage);
    final queryType = IntentLabels.intentToQueryType(intentResult.intent);

    // Step 2: Find matching functions
    final matchingFunctions = _functions
        .where((f) => f.queryType == queryType || f.queryType == 'any')
        .toList();

    if (matchingFunctions.isEmpty) return null;

    // Step 3: Extract parameters from user message
    final bestFunction = matchingFunctions.first;
    final params = await _extractParameters(userMessage, bestFunction);

    // Step 4: Build and execute query
    try {
      final query = bestFunction.buildQuery(params);
      final data = await executor(query, params);

      return FunctionCallResult(
        functionName: bestFunction.name,
        parameters: params,
        query: query,
        data: data,
        success: true,
      );
    } catch (e) {
      return FunctionCallResult(
        functionName: bestFunction.name,
        parameters: params,
        query: '',
        success: false,
        error: e.toString(),
      );
    }
  }

  /// Extract parameters from natural language using NER + QA
  Future<Map<String, dynamic>> _extractParameters(
    String message,
    AIFunction function,
  ) async {
    final params = <String, dynamic>{};

    // Use regex for common patterns
    final governorate = _extractGovernorate(message);
    if (governorate != null) params['governorate'] = governorate;

    final district = _extractDistrict(message);
    if (district != null) params['district'] = district;

    final dateRange = _extractDateRange(message);
    if (dateRange != null) params['date_range'] = dateRange;

    final status = _extractStatus(message);
    if (status != null) params['status'] = status;

    final severity = _extractSeverity(message);
    if (severity != null) params['severity'] = severity;

    return params;
  }

  String? _extractGovernorate(String msg) {
    final governorates = [
      'صنعاء', 'عدن', 'تعز', 'الحديدة', 'إب', 'ذمار', 'حجة',
      'المحويت', 'الجوف', 'مأرب', 'البيضاء', 'أبين', 'شبوة',
      'لحج', 'الضالع', 'حضرموت', 'المهرة', 'سقطرى', 'عمران',
      'صعدة', 'ريمة'
    ];
    for (final gov in governorates) {
      if (msg.contains(gov)) return gov;
    }
    return null;
  }

  String? _extractDistrict(String msg) {
    // Common districts pattern: "مديرية XXX"
    final match = RegExp(r'مديرية\s+(\S+)').firstMatch(msg);
    return match?.group(1);
  }

  Map<String, String>? _extractDateRange(String msg) {
    if (msg.contains('اليوم') || msg.contains('حالياً')) {
      return {'period': 'today'};
    }
    if (msg.contains('أمس')) {
      return {'period': 'yesterday'};
    }
    if (msg.contains('هذا الأسبوع') || msg.contains('الاسبوع')) {
      return {'period': 'this_week'};
    }
    if (msg.contains('هذا الشهر')) {
      return {'period': 'this_month'};
    }
    if (msg.contains('آخر 7') || msg.contains('آخر سبعة')) {
      return {'period': 'last_7_days'};
    }
    if (msg.contains('آخر 30') || msg.contains('آخر ثلاثين')) {
      return {'period': 'last_30_days'};
    }

    // Try to extract specific dates
    final dateMatch = RegExp(r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})').firstMatch(msg);
    if (dateMatch != null) {
      return {'specific_date': dateMatch.group(1)!};
    }

    return null;
  }

  String? _extractStatus(String msg) {
    if (msg.contains('مرفوض') || msg.contains('رفض')) return 'rejected';
    if (msg.contains('مقبول') || msg.contains('موافقة') || msg.contains('معتمد')) return 'approved';
    if (msg.contains('قيد المراجعة') || msg.contains('مراجعة')) return 'reviewed';
    if (msg.contains('مرسل') || msg.contains('إرسال')) return 'submitted';
    if (msg.contains('مسودة')) return 'draft';
    return null;
  }

  String? _extractSeverity(String msg) {
    if (msg.contains('حرج') || msg.contains('عاجل')) return 'critical';
    if (msg.contains('عالي') || msg.contains('مرتفع')) return 'high';
    if (msg.contains('متوسط') || msg.contains('متوسطة')) return 'medium';
    if (msg.contains('منخفض') || msg.contains('بسيط')) return 'low';
    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // REGISTERED FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  void _registerDefaultFunctions() {
    _functions.addAll([
      // Submissions queries
      AIFunction(
        name: 'count_submissions',
        descriptionAr: 'عدد الإرساليات',
        descriptionEn: 'Count form submissions',
        queryType: 'submissions',
        parameters: [
          FunctionParameter(name: 'governorate', type: 'string', descriptionAr: 'اسم المحافظة'),
          FunctionParameter(name: 'status', type: 'string', descriptionAr: 'حالة الإرسالية'),
          FunctionParameter(name: 'date_range', type: 'map', descriptionAr: 'الفترة الزمنية'),
        ],
        buildQuery: (p) {
          final conditions = <String>['deleted_at IS NULL'];
          if (p['governorate'] != null) {
            conditions.add(
              "governorate_id IN (SELECT id FROM governorates WHERE name_ar = '\${p['governorate']}')"
            );
          }
          if (p['status'] != null) {
            conditions.add("status = '\${p['status']}'");
          }
          final where = conditions.join(' AND ');
          return 'SELECT COUNT(*) as total, '
              'COUNT(*) FILTER (WHERE status = \'approved\') as approved, '
              'COUNT(*) FILTER (WHERE status = \'rejected\') as rejected, '
              'COUNT(*) FILTER (WHERE status = \'submitted\') as pending '
              'FROM form_submissions WHERE $where';
        },
      ),

      AIFunction(
        name: 'submissions_by_governorate',
        descriptionAr: 'إرساليات حسب المحافظة',
        descriptionEn: 'Submissions grouped by governorate',
        queryType: 'submissions',
        parameters: [
          FunctionParameter(name: 'date_range', type: 'map', descriptionAr: 'الفترة الزمنية'),
        ],
        buildQuery: (_) => '''
          SELECT g.name_ar, COUNT(fs.id) as total,
            COUNT(fs.id) FILTER (WHERE fs.status = 'approved') as approved,
            COUNT(fs.id) FILTER (WHERE fs.status = 'rejected') as rejected
          FROM form_submissions fs
          JOIN governorates g ON fs.governorate_id = g.id
          WHERE fs.deleted_at IS NULL
          GROUP BY g.name_ar
          ORDER BY total DESC
        ''',
      ),

      // Shortages queries
      AIFunction(
        name: 'count_shortages',
        descriptionAr: 'عدد النواقص',
        descriptionEn: 'Count supply shortages',
        queryType: 'shortages',
        parameters: [
          FunctionParameter(name: 'severity', type: 'string', descriptionAr: 'مستوى الخطورة'),
          FunctionParameter(name: 'governorate', type: 'string', descriptionAr: 'المحافظة'),
        ],
        buildQuery: (p) {
          final conditions = <String>['deleted_at IS NULL'];
          if (p['severity'] != null) {
            conditions.add("severity = '\${p['severity']}'");
          }
          if (p['governorate'] != null) {
            conditions.add(
              "governorate_id IN (SELECT id FROM governorates WHERE name_ar = '\${p['governorate']}')"
            );
          }
          final where = conditions.join(' AND ');
          return 'SELECT COUNT(*) as total, '
              'COUNT(*) FILTER (WHERE is_resolved) as resolved, '
              'COUNT(*) FILTER (WHERE NOT is_resolved) as pending, '
              'COUNT(*) FILTER (WHERE severity = \'critical\') as critical '
              'FROM supply_shortages WHERE $where';
        },
      ),

      AIFunction(
        name: 'shortages_by_governorate',
        descriptionAr: 'النواقص حسب المحافظة',
        descriptionEn: 'Shortages grouped by governorate',
        queryType: 'shortages',
        parameters: [],
        buildQuery: (_) => '''
          SELECT g.name_ar,
            COUNT(ss.id) as total,
            COUNT(ss.id) FILTER (WHERE ss.severity = 'critical') as critical,
            COUNT(ss.id) FILTER (WHERE NOT ss.is_resolved) as unresolved
          FROM supply_shortages ss
          JOIN governorates g ON ss.governorate_id = g.id
          WHERE ss.deleted_at IS NULL
          GROUP BY g.name_ar
          ORDER BY critical DESC, total DESC
        ''',
      ),

      // Analytics
      AIFunction(
        name: 'dashboard_stats',
        descriptionAr: 'إحصائيات لوحة التحكم',
        descriptionEn: 'Dashboard statistics',
        queryType: 'analytics',
        parameters: [],
        buildQuery: (_) => '''
          SELECT
            (SELECT COUNT(*) FROM form_submissions WHERE deleted_at IS NULL) as total_submissions,
            (SELECT COUNT(*) FROM form_submissions WHERE deleted_at IS NULL AND DATE(created_at) = CURRENT_DATE) as today_submissions,
            (SELECT COUNT(*) FROM supply_shortages WHERE deleted_at IS NULL AND NOT is_resolved) as active_shortages,
            (SELECT COUNT(*) FROM supply_shortages WHERE deleted_at IS NULL AND severity = 'critical' AND NOT is_resolved) as critical_shortages,
            (SELECT COUNT(*) FROM profiles WHERE is_active) as active_users
        ''',
      ),

      // Governorates
      AIFunction(
        name: 'governorate_performance',
        descriptionAr: 'أداء المحافظات',
        descriptionEn: 'Governorate performance ranking',
        queryType: 'governorates',
        parameters: [],
        buildQuery: (_) => '''
          SELECT g.name_ar,
            COUNT(fs.id) as submissions,
            COUNT(fs.id) FILTER (WHERE fs.status = 'approved') as approved,
            ROUND(COUNT(fs.id) FILTER (WHERE fs.status = 'approved')::numeric /
              NULLIF(COUNT(fs.id), 0) * 100, 1) as approval_rate
          FROM governorates g
          LEFT JOIN form_submissions fs ON g.id = fs.governorate_id AND fs.deleted_at IS NULL
          GROUP BY g.name_ar
          ORDER BY approval_rate DESC NULLS LAST
        ''',
      ),

      // Users
      AIFunction(
        name: 'active_users',
        descriptionAr: 'المستخدمين النشطين',
        descriptionEn: 'Active users',
        queryType: 'users',
        parameters: [],
        buildQuery: (_) => '''
          SELECT p.full_name, p.role, g.name_ar as governorate,
            COUNT(fs.id) as submissions_count
          FROM profiles p
          LEFT JOIN governorates g ON p.governorate_id = g.id
          LEFT JOIN form_submissions fs ON p.id = fs.submitted_by AND fs.deleted_at IS NULL
          WHERE p.is_active AND p.deleted_at IS NULL
          GROUP BY p.full_name, p.role, g.name_ar
          ORDER BY submissions_count DESC
        ''',
      ),

      // Trend analysis
      AIFunction(
        name: 'submission_trend',
        descriptionAr: 'اتجاه الإرساليات',
        descriptionEn: 'Submission trend over time',
        queryType: 'trend',
        parameters: [],
        buildQuery: (_) => '''
          SELECT DATE(created_at) as date,
            COUNT(*) as count,
            COUNT(*) FILTER (WHERE status = 'approved') as approved
          FROM form_submissions
          WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at)
          ORDER BY date
        ''',
      ),
    ]);
  }

  List<AIFunction> get availableFunctions => List.unmodifiable(_functions);

  void registerFunction(AIFunction fn) => _functions.add(fn);
}
