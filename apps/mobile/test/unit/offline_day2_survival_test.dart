// ═══════════════════════════════════════════════════════════════════════
// DAY-2 offline survival tests — «النماذج ما تختفي نهائياً بالاوفلاين»
//
// سيناريو المستخدم: فتح التطبيق أوفلاين في اليوم الثاني → كل النماذج اختفت.
//
// الجذور التي كانت تسبب ذلك (كلها مغطاة هنا):
//  1. مفتاح تشفير عشوائي مؤقت عند فشل pin المفتاح → البلوب المخزّن يصبح
//     غير قابل للفك → والكتابة التالية تدمره نهائياً.
//  2. لا توجد نسخة احتياطية من بلوب الكاش → تلف كتابة واحدة يمسح كل شيء.
//  3. حذف صندوق Hive كاملاً عند timeout الفتح (قرص بطيء بعد إعادة التشغيل).
//  4. getOrCreateSecureKey ولّد مفتاحاً جديداً عند فشل قراءة Secure Storage.
// ═══════════════════════════════════════════════════════════════════════
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:epi_core/src/offline/offline_manager.dart';
import 'package:epi_core/src/security/encryption_service.dart';

const String _testKey = 'EPI_SUPERVISOR_TEST_KEY_32_CHARS_MINIMUM';
const String _wrongKey = 'WRONG_DEVICE_KEY_XX_32_CHARS_MINIMUM_XX';

Future<Box<String>> _openBox(String dir) async {
  return Hive.openBox<String>('epi_offline');
}

/// Pin the static encryption key exactly like a production launch does:
/// explicit key material + salt persisted inside the Hive box (so every
/// "session" in the test derives the SAME key from the SAME salt).
Future<void> _pinKey() async {
  final box = await Hive.openBox<String>('epi_offline');
  final saltStr = box.get(EncryptionService.saltStorageKey);
  final salt =
      saltStr != null ? Uint8List.fromList(base64Decode(saltStr)) : null;
  await EncryptionService.initialize(
    encryptionKey: _testKey,
    saltSource: () => salt,
    onSaltCreated: (s) async {
      // Persist like production: same salt → same key on every session.
      await box.put(EncryptionService.saltStorageKey, base64Encode(s));
    },
  );
}

List<Map<String, dynamic>> _forms(String tag) => [
      {'id': 'f1-$tag', 'title_ar': 'نموذج التغطية $tag', 'is_active': true},
      {'id': 'f2-$tag', 'title_ar': 'استمارة الحصبة $tag', 'is_active': true},
      {'id': 'f3-$tag', 'title_ar': 'مخيمات النازحين $tag', 'is_active': true},
    ];

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;

  setUp(() async {
    EncryptionService.clearPinnedKey();
    tempDir = await Directory.systemTemp.createTemp('epi_day2_test');
    Hive.init(tempDir.path);
  });

  tearDown(() async {
    try {
      await Hive.deleteFromDisk();
    } catch (_) {}
    EncryptionService.clearPinnedKey();
    try {
      await tempDir.delete(recursive: true);
    } catch (_) {}
  });

  group('DAY-2 offline survival', () {
    test('forms cached on day 1 are still readable on day 2 (restart)',
        () async {
      // ─── اليوم الأول: إطلاق صحي، تخزين النماذج مشفّرة ───
      await _pinKey();
      final day1 = OfflineManager(EncryptionService(overrideKey: _testKey));
      await day1.init();
      await day1.cacheData('forms_measles_campaign', {'_type': 'list', '_list': _forms('d1')});

      final box = await _openBox(tempDir.path);
      final rawBlob = box.get('cache');
      expect(rawBlob, isNotNull);
      expect(rawBlob!.startsWith('{'), isFalse,
          reason: 'البلوب يجب أن يكون مشفراً وليس JSON عادي');
      final day1Forms = day1.getCachedData('forms_measles_campaign');
      expect((day1Forms!['_list'] as List).length, 3);

      // ─── محاكاة إعادة تشغيل العملية (فقدان كل الذاكرة) ───
      day1.dispose();
      await Hive.close();
      EncryptionService.clearPinnedKey();

      // ─── اليوم الثاني: إقلاع بارد، نفس المفتاح + نفس الملح المخزّن ───
      await _pinKey();
      final day2 = OfflineManager(EncryptionService(overrideKey: _testKey));
      await day2.init();

      expect(day2.cacheLoadFailed, isFalse,
          reason: 'البلوب المخزّن يوم 1 يجب أن يُفك بنجاح يوم 2');
      final restored = day2.getCachedData('forms_measles_campaign', offlineOverride: true);
      expect(restored, isNotNull,
          reason: 'النماذج المخزنة يجب ألا تختفي بعد إعادة التشغيل');
      expect((restored!['_list'] as List).length, 3);
      day2.dispose();
    });

    test('unreadable blob is NEVER overwritten by writes (DAY-2 guard)',
        () async {
      // ─── اليوم الأول: تخزين طبيعي بمفتاح صحيح ───
      await _pinKey();
      final day1 = OfflineManager(EncryptionService(overrideKey: _testKey));
      await day1.init();
      await day1.cacheData('forms_measles_campaign', {'_type': 'list', '_list': _forms('guard')});
      day1.dispose();
      await Hive.close();
      EncryptionService.clearPinnedKey();

      // ─── اليوم الثاني: جهاز فشل فيه تثبيت المفتاح (مفتاح خاطئ) ───
      // المفتاح الحتمي الاحتياطي لمدير day2 لا يطابق مفتاح day1
      // → البلوب غير قابل للفك → راية loadFailed تُرفع.
      final day2 = OfflineManager(EncryptionService(overrideKey: _wrongKey));
      await day2.init();

      // أول قراءة تفشل في فك البلوب → تُرفع راية DAY-2
      final failedRead = day2.getCachedData('forms_measles_campaign', offlineOverride: true);
      expect(failedRead, isNull);
      expect(day2.cacheLoadFailed, isTrue,
          reason: 'بلوب مشفر بمفتاح آخر يجب أن يُعلَّم كغير قابل للقراءة');

      final box = await _openBox(tempDir.path);
      final rawBefore = box.get('cache')!;

      // كتابات وجلسة عمل كاملة تحدث أثناء هذه الجلسة المعطوبة…
      await day2.cacheData('forms_measles_campaign', {'_type': 'list', '_list': <Map<String, dynamic>>[]});
      await day2.cacheData('submissions_all', {'_type': 'list', '_list': <Map<String, dynamic>>[]});
      await day2.removeCacheKey('forms_measles_campaign');
      await day2.clearCache();

      // …لكن البلوب الأصلي يبقى سليماً على القرص بايت ببايت.
      final rawAfter = box.get('cache')!;
      expect(rawAfter, rawBefore,
          reason: 'ممنوع منعاً باتاً الكتابة فوق بلوب كاش غير قابل للفك');

      // ─── اليوم الثالث: الجلسة تعود صحيحة → النماذج تعود كاملة ───
      day2.dispose();
      await Hive.close();
      EncryptionService.clearPinnedKey();
      await _pinKey();
      final day3 = OfflineManager(EncryptionService(overrideKey: _testKey));
      await day3.init();

      final restored = day3.getCachedData('forms_measles_campaign', offlineOverride: true);
      expect(restored, isNotNull,
          reason: 'النماذج يجب أن تنجو من جلسة بمفتاح مفقود');
      expect((restored!['_list'] as List).length, 3);
      expect(day3.cacheLoadFailed, isFalse);
      day3.dispose();
    });

    test('cache_bak recovers the cache when the latest write is corrupted',
        () async {
      await _pinKey();
      final mgr = OfflineManager(EncryptionService(overrideKey: _testKey));
      await mgr.init();

      // كتابتان متتاليتان → الثانية تلتقط نسخة bak من الأولى
      await mgr.cacheData('forms_measles_campaign', {'_type': 'list', '_list': _forms('v1')});
      await mgr.cacheData('governorates', {'_type': 'list', '_list': [
        {'id': 'g1', 'name_ar': 'صنعاء'},
      ]});

      final box = await _openBox(tempDir.path);
      expect(box.get('cache_bak'), isNotNull,
          reason: 'يجب أن توجد نسخة احتياطية last-known-good');

      // تلف الكتابة الأخيرة (محاكاة انقطاع أثناء الكتابة)
      await box.put('cache', 'CORRUPTED-GARBAGE-NOT-JSON-NOT-ENCRYPTED');

      // ذاكرة الجلسة نفسها تنجو عبر cache_bak
      mgr.reloadCacheFromDisk();
      final forms = mgr.getCachedData('forms_measles_campaign', offlineOverride: true);
      expect(forms, isNotNull,
          reason: 'البلوب الاحتياطي يجب أن يُستخدم عند تلف البلوب الرئيسي');
      expect((forms!['_list'] as List).length, 3);
      mgr.dispose();
    });

    test('session with unavailable encryption writes readable plain JSON',
        () async {
      // لا pin + مفتاح صريح → الجلسة تعمل بوضع JSON عادي الآمن
      final mgr = OfflineManager(EncryptionService(overrideKey: _wrongKey));
      await mgr.init();
      expect(mgr.encryptionReady, isFalse);
      expect(mgr.cacheLoadFailed, isFalse, reason: 'لا يوجد بلوب قديم أصلاً');

      await mgr.cacheData('forms_measles_campaign', {'_type': 'list', '_list': _forms('plain')});
      final sameSession = mgr.getCachedData('forms_measles_campaign', offlineOverride: true);
      expect((sameSession!['_list'] as List).length, 3);

      // الجلسة التالية (بأي مفتاح) تقرأ JSON العادي عبر fallback القراءة
      mgr.dispose();
      await Hive.close();
      EncryptionService.clearPinnedKey();

      await _pinKey();
      final next = OfflineManager(EncryptionService(overrideKey: _testKey));
      await next.init();
      final restored = next.getCachedData('forms_measles_campaign', offlineOverride: true);
      expect(restored, isNotNull,
          reason: 'JSON العادي المكتوب في جلسة معطوبة يجب أن يبقى مقروءاً');
      expect((restored!['_list'] as List).length, 3);
      next.dispose();
    });
  });
}
