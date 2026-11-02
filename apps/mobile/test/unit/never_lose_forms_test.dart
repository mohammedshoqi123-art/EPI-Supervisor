// ═══════════════════════════════════════════════════════════════════════
// Never-lose-forms guard tests — «ما تختفي النماذج نهائياً أونلاين أو أوفلاين»
//
// OfflineDataCache._saveToCache يرفض الآن الكتابة بقائمة فارغة فوق كاش
// نماذج غير فارغ (مفاتيح forms_*) — نتيجة شبكة فارغة (RLS مؤقت، انقطاع
// أثناء الطلب) كانت تمسح النماذج من الكاش فتختفي من الشاشات.
// ═══════════════════════════════════════════════════════════════════════
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:epi_core/src/offline/offline_data_cache.dart';
import 'package:epi_core/src/offline/offline_manager.dart';
import 'package:epi_core/src/security/encryption_service.dart';

void main() {
  late Directory tempDir;
  late OfflineManager offline;
  late OfflineDataCache cache;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('epi_cache_test');
    Hive.init(tempDir.path);
    final encryption = EncryptionService(
      overrideKey: 'EPI_SUPERVISOR_TEST_KEY_32_CHARS_MINIMUM',
    );
    offline = OfflineManager(encryption);
    await offline.init();
    cache = OfflineDataCache(offline, encryption);
  });

  tearDown(() async {
    await Hive.deleteFromDisk();
    await tempDir.delete(recursive: true);
  });

  group('never-lose-forms guard', () {
    test('empty online result does NOT wipe non-empty cached forms', () async {
      final forms = [
        {'id': 'f1', 'title_ar': 'نموذج 1'},
        {'id': 'f2', 'title_ar': 'نموذج 2'},
      ];
      await cache.putList('forms_measles_campaign', forms);

      // Server hiccup returns an empty list for the same key
      await cache.putList('forms_measles_campaign', <Map<String, dynamic>>[]);

      final cached = cache.getCachedDataList('forms_measles_campaign');
      expect(cached, isNotNull);
      expect(cached!.length, 2, reason: 'النماذج المخزنة يجب ألا تُمسح بنتيجة فارغة');
    });

    test('guard applies to forms_all and any forms_* key', () async {
      await cache.putList('forms_all', [
        {'id': 'a1'},
      ]);
      await cache.putList('forms_all', <Map<String, dynamic>>[]);
      expect(cache.getCachedDataList('forms_all')!.length, 1);

      await cache.putList('forms_polio_campaign', [
        {'id': 'p1'},
      ]);
      await cache.putList('forms_polio_campaign', <Map<String, dynamic>>[]);
      expect(cache.getCachedDataList('forms_polio_campaign')!.length, 1);
    });

    test('real (non-empty) refresh still overwrites the cache', () async {
      await cache.putList('forms_measles_campaign', [
        {'id': 'old'},
      ]);
      await cache.putList('forms_measles_campaign', [
        {'id': 'new-1'},
        {'id': 'new-2'},
      ]);
      final cached = cache.getCachedDataList('forms_measles_campaign');
      expect(cached!.length, 2);
      expect(cached.first['id'], 'new-1');
    });

    test('first-ever empty write is allowed (nothing cached yet)', () async {
      await cache.putList('forms_integrated_activity', <Map<String, dynamic>>[]);
      expect(cache.getCachedDataList('forms_integrated_activity'), isEmpty);
    });

    test('non-form keys are not affected by the guard', () async {
      await cache.putList('references', [
        {'id': 'r1'},
      ]);
      // Non-form keys keep normal overwrite semantics (e.g. cleared lists)
      await cache.putList('references', <Map<String, dynamic>>[]);
      expect(cache.getCachedDataList('references'), isEmpty);
    });
  });
}
