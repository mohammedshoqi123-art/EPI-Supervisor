import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_core/epi_core.dart';

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
  
  // ═══ FIX D-4: الدمج بدل الإسقاط ═══
  // Previously: أي حفظ خلال 5 ثوانٍ من السابق كان يُهدر نهائياً (لا يُرسل
  // ولا يُصطف) — آخر تعديل قبل إغلاق التطبيق يضيع.
  // Now: الحفظ خلال نافذة الـ rate limit يُدمج مع العنصر المعلق الموجود
  // (يستبدل بياناته بأحدث نسخة) — الطابور يرسل دائماً أحدث حالة.
  final Map<String, DateTime> _lastBackupTime = {};
  static const _minBackupInterval = Duration(seconds: 5);
  static const _maxRetries = 3; // كانت 1 — D-4: تحمّل انقطاع قصير
  
  // Queue للعمليات المعلقة (non-blocking)
  final List<_PendingBackup> _pendingQueue = [];
  bool _isProcessingQueue = false;
  
  CloudDraftService(this._client);

  /// ═══ حفظ مسودة في السحابة (non-blocking, merge-safe) ═══
  /// يُستدعى من saveDraft() بعد الحفظ المحلي مباشرة
  /// لا يحظر UI — يعمل في الخلفية
  Future<void> backupDraft({
    required String draftId,
    required String formId,
    required Map<String, dynamic> data,
  }) async {
    final lastTime = _lastBackupTime[draftId];
    final withinWindow = lastTime != null &&
        DateTime.now().difference(lastTime) < _minBackupInterval;

    // ═══ FIX D-4: داخل نافذة الـ rate limit ندمج بدل أن نهدر ═══
    if (withinWindow) {
      final existingIndex = _pendingQueue.indexWhere((p) => p.draftId == draftId);
      if (existingIndex != -1) {
        // أحدث نسخة تحل محل المعلق القديم — لا فقدان لآخر حفظ
        _pendingQueue[existingIndex] = _PendingBackup(
          draftId: draftId,
          formId: formId,
          data: data,
          timestamp: DateTime.now(),
          retryCount: _pendingQueue[existingIndex].retryCount,
        );
        debugPrint('[CloudDraft] Merged into pending queue: ${draftId.substring(0, 8)}');
        return;
      }
      // لا يوجد معلق — أضف أحدث نسخة على أي حال (الإرسال سيمر لاحقاً)
      // نحدّث الطابع الزمني فقط عندما نضيف فعلاً حتى لا نمدد النافذة بلا داعٍ
    }

    _pendingQueue.add(_PendingBackup(
      draftId: draftId,
      formId: formId,
      data: data,
      timestamp: DateTime.now(),
    ));
    _lastBackupTime[draftId] = DateTime.now();

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
          // ═══ FIX D-4: 3 محاولات بدل 1 مع تراجع متزايد (5s/15s/45s) ═══
          if (pending.retryCount < _maxRetries) {
            final next = pending.copyWith(retryCount: pending.retryCount + 1);
            // أعد إدراج العنصر في مقدمة الطابور مع تأجيل via retries counter
            Future.delayed(Duration(seconds: 5 * (1 << next.retryCount)), () {
              _pendingQueue.insert(0, next);
              _processQueueInBackground();
            });
          } else {
            debugPrint('[CloudDraft] ⚠️ Giving up on ${pending.draftId.substring(0, 8)} after $_maxRetries retries — local Hive copy remains source of truth');
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
  /// ═══ FIX D-2: معطّلة — الحذف التلقائي السحابي أُلغي ═══
  /// لا يوجد أي مسار في التطبيق يستدعيها، وقد جُعلت @Deprecated لمنع
  /// إعادة استعمالها مستقبلاً. الحذف الآن يدوي فقط من قبل المستخدم.
  @Deprecated('D-2: الحذف التلقائي معطّل — استخدم deleteDraft اليدوي فقط')
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

  /// ═══ FIX D-4: إفراغ الطابور إلى Hive عند إغلاق/إيقاف التطبيق ═══
  /// تُستدعى من main.dart في AppLifecycleState.paused/detached
  Future<void> flushQueueToStorage(OfflineManager offlineManager) async {
    try {
      if (_pendingQueue.isEmpty) return;
      await offlineManager.savePendingCloudQueue(
        _pendingQueue.map((p) => p.toJson()).toList(),
      );
      debugPrint('[CloudDraft] 💾 Flushed ${_pendingQueue.length} pending backups to Hive');
    } catch (e) {
      debugPrint('[CloudDraft] ❌ Flush queue failed: $e');
    }
  }

  /// ═══ FIX D-4: استرجاع الطابور من Hive عند الإقلاع والاستئناف ═══
  /// تُستدعى من main.dart بعد تهيئة OfflineManager
  Future<void> restoreQueueFromStorage(OfflineManager offlineManager) async {
    try {
      final items = offlineManager.getPendingCloudQueue() as List;
      if (items.isEmpty) return;
      await offlineManager.clearPendingCloudQueue();
      int restored = 0;
      for (final item in items) {
        final draftId = item['draft_id'] as String?;
        if (draftId == null) continue;
        // لا نسترجع نسخة أقدم من المعلق الحالي
        final existing = _pendingQueue.indexWhere((p) => p.draftId == draftId);
        if (existing != -1) continue;
        _pendingQueue.add(_PendingBackup(
          draftId: draftId,
          formId: (item['form_id'] as String?) ?? draftId,
          data: Map<String, dynamic>.from(item['data'] as Map? ?? {}),
          timestamp: DateTime.tryParse(item['timestamp'] as String? ?? '') ?? DateTime.now(),
        ));
        restored++;
      }
      if (restored > 0) {
        debugPrint('[CloudDraft] ♻️ Restored $restored pending backups from Hive');
        _processQueueInBackground();
      }
    } catch (e) {
      debugPrint('[CloudDraft] ❌ Restore queue failed: $e');
    }
  }

  /// عدد النسخ المعلقة (للتشخيص)
  int get pendingCount => _pendingQueue.length;
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

  /// ═══ FIX D-4: تسلسل الطابور للتثبيت في Hive ═══
  Map<String, dynamic> toJson() => {
        'draft_id': draftId,
        'form_id': formId,
        'data': data,
        'timestamp': timestamp.toIso8601String(),
        'retry_count': retryCount,
      };
}
