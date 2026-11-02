// ═══════════════════════════════════════════════════════════════════════════
//  OFFLINE FALLBACK CACHE TESTS — اختبارات البحث بالبادئة في الكاش
// ═══════════════════════════════════════════════════════════════════════════
//
//  يغطي findCachedMapByPrefix و getCachedAt المضافين في 2026-11:
//  الصفحات (الرئيسية/التحليلات/الخريطة) لم تكن تعمل أوفلاين عندما يختلف
//  مفتاح الكاش الدقيق (تغير النشاط/الجولة) — البحث بالبادئة يعيد آخر
//  بيانات مخزنة بدل شاشة خطأ.
// ═══════════════════════════════════════════════════════════════════════════

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
    tempDir = await Directory.systemTemp.createTemp('epi_fallback_test');
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

  group('findCachedMapByPrefix', () {
    test('يجيد خريطة مخزنة بالبادئة', () async {
      await cache.putMap('dashboard_analytics_camp_measles_campaign', {
        'submissions': {'total': 42},
      });
      final found = cache.findCachedMapByPrefix('dashboard_analytics');
      expect(found, isNotNull);
      expect(found!['submissions']['total'], 42);
    });

    test('يُعيد الأحدث عند وجود عدة مفاتيح بنفس البادئة', () async {
      await cache.putMap('dashboard_analytics_camp_a', {'v': 1});
      // تأخير بسيط لضمان اختلاف timestamp
      await Future.delayed(const Duration(milliseconds: 10));
      await cache.putMap('dashboard_analytics_camp_b', {'v': 2});

      final found = cache.findCachedMapByPrefix('dashboard_analytics');
      expect(found, isNotNull);
      expect(found!['v'], 2, reason: 'يجب أن يعيد آخر خريطة خُزنت');
    });

    test('بلا تطابق → null', () {
      expect(cache.findCachedMapByPrefix('nonexistent_'), isNull);
    });

    test('لا يخلط بين القوائم والخرائط — يتجاهل مفاتيح القوائم', () async {
      await cache.putList('dashboard_analytics_lists_key', [
        {'x': 1},
      ]);
      final found = cache.findCachedMapByPrefix('dashboard_analytics');
      expect(found, isNull, reason: 'قائمة مخزنة بنفس البادئة ليست خريطة');
    });

    test('يتجاهل الخرائط الفارغة', () async {
      await cache.putMap('dashboard_analytics_empty', <String, dynamic>{});
      expect(cache.findCachedMapByPrefix('dashboard_analytics'), isNull);
    });
  });

  group('getCachedAt', () {
    test('يعيد timestamp بعد التخزين', () async {
      await cache.putMap('some_key', {'a': 1});
      expect(offline.getCachedAt('some_key'), isNotNull);
    });

    test('مفتاح غير موجود → null', () {
      expect(offline.getCachedAt('missing_key'), isNull);
    });
  });

  group('findCachedListByPrefix — ضمان التوافق الحالي', () {
    test('يعيد قائمة مخزنة بالبادئة (سلوك قائم)', () async {
      await cache.putList('submissions_lean_camp_measles_campaign', [
        {'id': 's1'},
      ]);
      final found = cache.findCachedListByPrefix('submissions_lean_camp_measles');
      expect(found, isNotNull);
      expect(found!.length, 1);
    });
  });
}
