import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// ═══════════════════════════════════════════════════════════════════════
/// CloudDraftService — نسخة احتياطية سحابية للمسودات
///
/// الغرض: حفظ المسودات في Supabase كـ backup حتى لو تلف Hive
/// 
/// الاستخدام:
/// - backupDraft() → حفظ في السحابة (non-blocking)
/// - fetchDraft() → جلب من السحابة
/// - fetchAllDrafts() → جلب كل المسودات السحابية
/// - deleteDraft() → حذف من السحابة بعد الإرسال
///
/// المبدأ: Hive هو المصدر الأساسي، السحابة هي الشباك الأماني
/// ═══════════════════════════════════════════════════════════════════════

class CloudDraftService {
  final SupabaseClient _client;
  
  // Rate limiting: لا نرسل أكثر من طلب واحد كل 5 ثوانٍ لنفس المسودة
  final Map<String, DateTime> _lastBackupTime = {};
  static const _minBackupInterval = Duration(seconds: 5);
  
  // Queue للعمليات المعلقة (non-blocking)
  final List<_PendingBackup> _pendingQueue = [];
  bool _isProcessingQueue = false;
  
  CloudDraftService(this._client);

  /// ═══ حفظ مسودة في السحابة (non-blocking, rate-limited) ═══
  /// يُستدعى من saveDraft() بعد الحفظ المحلي مباشرة
  /// لا يحظر UI — يعمل في الخلفية
  Future<void> backupDraft({
    required String draftId,
    required String formId,
    required Map<String, dynamic> data,
  }) async {
    // Rate limiting: تخطي إذا آخر backup كان قبل أقل من 5 ثوانٍ
    final lastTime = _lastBackupTime[draftId];
    if (lastTime != null && DateTime.now().difference(lastTime) < _minBackupInterval) {
      debugPrint('[CloudDraft] Rate limited — skipping backup for ${draftId.substring(0, 8)}');
      return;
    }
    
    // أضف إلى queue بدلاً من الانتظار
    _pendingQueue.add(_PendingBackup(
      draftId: draftId,
      formId: formId,
      data: data,
      timestamp: DateTime.now(),
    ));
    _lastBackupTime[draftId] = DateTime.now();
    
    // معالجة Queue في الخلفية
    _processQueueInBackground();
  }

  /// معالجة Queue في الخلفية — لا ت_blocking
  void _processQueueInBackground() {
    if (_isProcessingQueue || _pendingQueue.isEmpty) return;
    _isProcessingQueue = true;
    
    // تشغيل في microtask حتى لا ي_blocking UI
    Future.microtask(() async {
      while (_pendingQueue.isNotEmpty) {
        final pending = _pendingQueue.removeAt(0);
        try {
          final userId = _client.auth.currentUser?.id;
          if (userId == null) {
            debugPrint('[CloudDraft] No user — skipping backup');
            continue;
          }
          
          await _client.from('draft_backups').upsert({
            'draft_id': pending.draftId,
            'form_id': pending.formId,
            'user_id': userId,
            'data': pending.data,
            'saved_at': DateTime.now().toIso8601String(),
          }, onConflict: 'draft_id,user_id').timeout(
            const Duration(seconds: 10),
            onTimeout: () => throw TimeoutException('Cloud backup timeout'),
          );
          
          debugPrint('[CloudDraft] ✅ Backup saved: ${pending.draftId.substring(0, 8)}');
        } catch (e) {
          // Non-critical — لا نرمي exception
          debugPrint('[CloudDraft] ❌ Backup failed: $e');
          // إعادة المحاولة مرة واحدة بعد 5 ثوانٍ
          if (pending.retryCount < 1) {
            _pendingQueue.add(pending.copyWith(retryCount: pending.retryCount + 1));
          }
        }
      }
      _isProcessingQueue = false;
    });
  }

  /// ═══ جلب مسودة من السحابة ═══
  /// يُستدعى عندما local draft فارغ أو تالف
  Future<Map<String, dynamic>?> fetchDraft(String draftId) async {
    try {
      final userId = _client.auth.currentUser?.id;
      if (userId == null) return null;
      
      final response = await _client
          .from('draft_backups')
          .select('data, saved_at, form_id')
          .eq('draft_id', draftId)
          .eq('user_id', userId)
          .maybeSingle()
          .timeout(const Duration(seconds: 10));
      
      if (response != null && response['data'] != null) {
        final data = response['data'];
        // تأكد أن البيانات ليست فارغة
        if (data is Map && data.isNotEmpty) {
          debugPrint('[CloudDraft] ✅ Fetched draft ${draftId.substring(0, 8)} from cloud');
          return {
            'data': Map<String, dynamic>.from(data),
            'saved_at': response['saved_at'],
            'form_id': response['form_id'],
          };
        }
      }
    } catch (e) {
      debugPrint('[CloudDraft] ❌ Fetch failed: $e');
    }
    return null;
  }

  /// ═══ جلب كل المسودات السحابية للمستخدم ═══
  /// يُستخدم في شاشة الحالة لعرض المسودات المفقودة محلياً
  Future<List<Map<String, dynamic>>> fetchAllDrafts() async {
    try {
      final userId = _client.auth.currentUser?.id;
      if (userId == null) return [];
      
      final response = await _client
          .from('draft_backups')
          .select('draft_id, form_id, data, saved_at')
          .eq('user_id', userId)
          .order('saved_at', ascending: false)
          .timeout(const Duration(seconds: 15));
      
      if (response is List) {
        return response.map((row) => {
          'draft_id': row['draft_id'],
          'form_id': row['form_id'],
          'data': row['data'] ?? {},
          'saved_at': row['saved_at'],
          '_source': 'cloud', // علامة للتمييز
        }).toList();
      }
    } catch (e) {
      debugPrint('[CloudDraft] ❌ Fetch all failed: $e');
    }
    return [];
  }

  /// ═══ حذف مسودة من السحابة ═══
  /// يُستدعى بعد إرسال المسودة بنجاح
  Future<void> deleteDraft(String draftId) async {
    try {
      final userId = _client.auth.currentUser?.id;
      if (userId == null) return;
      
      await _client
          .from('draft_backups')
          .delete()
          .eq('draft_id', draftId)
          .eq('user_id', userId)
          .timeout(const Duration(seconds: 5));
      
      debugPrint('[CloudDraft] ✅ Deleted draft ${draftId.substring(0, 8)} from cloud');
    } catch (e) {
      debugPrint('[CloudDraft] ❌ Delete failed: $e');
    }
  }

  /// ═══ مسح كل المسودات السحابية القديمة ═══
  /// يُستدعى دورياً لتنظيف المسودات الأقدم من 30 يوم
  Future<void> cleanupOldDrafts() async {
    try {
      final userId = _client.auth.currentUser?.id;
      if (userId == null) return;
      
      final cutoff = DateTime.now().subtract(const Duration(days: 30));
      await _client
          .from('draft_backups')
          .delete()
          .eq('user_id', userId)
          .lt('saved_at', cutoff.toIso8601String())
          .timeout(const Duration(seconds: 10));
      
      debugPrint('[CloudDraft] ✅ Cleaned up old drafts');
    } catch (e) {
      debugPrint('[CloudDraft] ❌ Cleanup failed: $e');
    }
  }

  /// ═══ التحقق من الاتصال ═══
  bool get isOnline {
    try {
      return _client.auth.currentUser != null;
    } catch (_) {
      return false;
    }
  }
}

/// عنصر Queue معلق
class _PendingBackup {
  final String draftId;
  final String formId;
  final Map<String, dynamic> data;
  final DateTime timestamp;
  final int retryCount;
  
  const _PendingBackup({
    required this.draftId,
    required this.formId,
    required this.data,
    required this.timestamp,
    this.retryCount = 0,
  });
  
  _PendingBackup copyWith({int? retryCount}) {
    return _PendingBackup(
      draftId: draftId,
      formId: formId,
      data: data,
      timestamp: timestamp,
      retryCount: retryCount ?? this.retryCount,
    );
  }
}
