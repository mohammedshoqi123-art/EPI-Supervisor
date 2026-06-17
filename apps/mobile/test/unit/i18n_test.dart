import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:epi_shared/src/i18n/app_localizations.dart';

/// ═══════════════════════════════════════════════════════════════
///  اختبارات AppLocalizations — i18n Foundation
/// ═══════════════════════════════════════════════════════════════

void main() {
  group('AppLocalizations — Arabic (default)', () {
    // Use the delegate to get a properly initialized instance
    final l10n = AppLocalizations(const Locale('ar', 'YE'), {
      'app.name': 'منصة مشرف EPI',
      'auth.login': 'تسجيل الدخول',
      'common.save': 'حفظ',
      'common.page': 'صفحة',
      'nav.dashboard': 'لوحة التحكم',
      'nav.forms': 'النماذج',
      'nav.forms_status': 'حالة النماذج',
      'nav.submissions': 'الإرساليات',
      'nav.map': 'الخريطة',
      'nav.ai_chat': 'المساعد الذكي',
      'nav.notifications': 'الإشعارات',
      'nav.references': 'المراجع',
      'nav.chat': 'المحادثة',
      'nav.profile': 'الملف الشخصي',
      'nav.users': 'المستخدمون',
      'nav.analytics': 'التحليلات',
      'nav.reports': 'التقارير',
      'nav.settings': 'الإعدادات',
      'role.admin': 'مدير النظام',
      'role.central': 'مركزي',
      'role.governorate': 'محافظة',
      'role.district': 'مديرية',
      'role.data_entry': 'مدخل بيانات',
      'vaccine.bcg': 'بي سي جي (BCG)',
      'vaccine.opv': 'شلل الأطفال الفموي (OPV)',
      'vaccine.hepb': 'التهاب الكبد B',
      'vaccine.penta': 'التطعيم الخماسي',
      'vaccine.pcv': 'التطعيم الرئوي (PCV)',
      'vaccine.rota': 'تطعيم الروتا فيروس',
      'vaccine.ipv': 'شلل الأطفال الحقني (IPV)',
      'vaccine.mr': 'الحصبة والحصبة الألمانية (MR)',
      'vaccine.vit_a': 'فيتامين أ',
      'vaccine.td': 'الكزاز والخناق (Td)',
      'common.loading': 'جاري التحميل...',
      'common.error': 'خطأ',
      'common.retry': 'إعادة المحاولة',
      'common.cancel': 'إلغاء',
      'common.delete': 'حذف',
      'common.edit': 'تعديل',
      'common.close': 'إغلاق',
      'common.search': 'بحث',
      'common.filter': 'تصفية',
      'common.clear': 'مسح',
      'common.confirm': 'تأكيد',
      'common.yes': 'نعم',
      'common.no': 'لا',
      'common.next': 'التالي',
      'common.previous': 'السابق',
      'sync.online': 'متصل',
      'sync.offline': 'غير متصل',
      'sync.syncing': 'جاري المزامنة...',
      'sync.sync_complete': 'اكتملت المزامنة',
      'sync.sync_failed': 'فشلت المزامنة',
      'error.network': 'لا يوجد اتصال بالإنترنت',
      'error.server': 'خطأ في الخادم',
      'error.not_found': 'غير موجود',
      'error.unauthorized': 'غير مصرح',
      'error.forbidden': 'ممنوع',
    });

    test('translates known keys', () {
      expect(l10n.t('app.name'), equals('منصة مشرف EPI'));
      expect(l10n.t('auth.login'), equals('تسجيل الدخول'));
      expect(l10n.t('common.save'), equals('حفظ'));
    });

    test('returns key itself for unknown keys', () {
      expect(l10n.t('nonexistent.key'), equals('nonexistent.key'));
    });

    test('translates keys with parameters', () {
      final result = l10n.t('common.page', params: {'n': '5'});
      // 'common.page' is just 'صفحة' — no params. Test with a param-aware key.
      expect(result, equals('صفحة'));
    });

    test('isRTL returns true for Arabic', () {
      expect(l10n.isRTL, isTrue);
    });

    test('all navigation keys are present', () {
      final navKeys = [
        'nav.dashboard', 'nav.forms', 'nav.forms_status', 'nav.submissions',
        'nav.map', 'nav.ai_chat', 'nav.notifications', 'nav.references',
        'nav.chat', 'nav.profile', 'nav.users', 'nav.analytics',
        'nav.reports', 'nav.settings',
      ];
      for (final key in navKeys) {
        final translated = l10n.t(key);
        expect(translated, isNot(equals(key)),
            reason: 'Navigation key $key should have a translation');
      }
    });

    test('all role keys are present', () {
      final roleKeys = ['role.admin', 'role.central', 'role.governorate', 'role.district', 'role.data_entry'];
      for (final key in roleKeys) {
        expect(l10n.t(key), isNot(equals(key)));
      }
    });

    test('all vaccine keys are present', () {
      final vaccineKeys = [
        'vaccine.bcg', 'vaccine.opv', 'vaccine.hepb', 'vaccine.penta',
        'vaccine.pcv', 'vaccine.rota', 'vaccine.ipv', 'vaccine.mr',
        'vaccine.vit_a', 'vaccine.td',
      ];
      for (final key in vaccineKeys) {
        expect(l10n.t(key), isNot(equals(key)));
      }
    });

    test('all common keys are present', () {
      final commonKeys = [
        'common.loading', 'common.error', 'common.retry', 'common.cancel',
        'common.save', 'common.delete', 'common.edit', 'common.close',
        'common.search', 'common.filter', 'common.clear', 'common.confirm',
        'common.yes', 'common.no', 'common.next', 'common.previous',
      ];
      for (final key in commonKeys) {
        expect(l10n.t(key), isNot(equals(key)));
      }
    });

    test('all sync keys are present', () {
      final syncKeys = ['sync.online', 'sync.offline', 'sync.syncing', 'sync.sync_complete', 'sync.sync_failed'];
      for (final key in syncKeys) {
        expect(l10n.t(key), isNot(equals(key)));
      }
    });

    test('all error keys are present', () {
      final errorKeys = ['error.network', 'error.server', 'error.not_found', 'error.unauthorized', 'error.forbidden'];
      for (final key in errorKeys) {
        expect(l10n.t(key), isNot(equals(key)));
      }
    });
  });

  group('AppLocalizations — English', () {
    final l10n = AppLocalizations(const Locale('en', 'US'), {
      'app.name': 'EPI Supervisor',
      'auth.login': 'Login',
      'common.save': 'Save',
    });

    test('translates known keys to English', () {
      expect(l10n.t('app.name'), equals('EPI Supervisor'));
      expect(l10n.t('auth.login'), equals('Login'));
      expect(l10n.t('common.save'), equals('Save'));
    });

    test('isRTL returns false for English', () {
      expect(l10n.isRTL, isFalse);
    });

    test('returns key itself for keys not in English dictionary', () {
      // Arabic-only keys return the key itself in English locale
      expect(l10n.t('vaccine.bcg'), equals('vaccine.bcg'));
    });
  });

  group('AppLocalizations — supported locales', () {
    test('supports Arabic and English', () {
      expect(AppLocalizations.supportedLocales.length, equals(2));
      expect(AppLocalizations.supportedLocales, contains(const Locale('ar', 'YE')));
      expect(AppLocalizations.supportedLocales, contains(const Locale('en', 'US')));
    });

    test('default locale is Arabic (Yemen)', () {
      expect(AppLocalizations.defaultLocale, equals(const Locale('ar', 'YE')));
    });
  });

  group('AppLocalizations — delegate', () {
    test('delegate supports Arabic and English', () {
      expect(AppLocalizations.delegate.isSupported(const Locale('ar')), isTrue);
      expect(AppLocalizations.delegate.isSupported(const Locale('en')), isTrue);
      expect(AppLocalizations.delegate.isSupported(const Locale('fr')), isFalse);
    });

    test('delegate loads Arabic', () async {
      final l10n = await AppLocalizations.delegate.load(const Locale('ar', 'YE'));
      expect(l10n.t('common.save'), equals('حفظ'));
    });

    test('delegate loads English', () async {
      final l10n = await AppLocalizations.delegate.load(const Locale('en', 'US'));
      expect(l10n.t('common.save'), equals('Save'));
    });

    test('delegate falls back to Arabic for unsupported locale', () async {
      final l10n = await AppLocalizations.delegate.load(const Locale('fr', 'FR'));
      // Should fall back to Arabic strings
      expect(l10n.t('common.save'), equals('حفظ'));
    });
  });

  group('AppLocalizations — parameter substitution', () {
    test('substitutes single parameter', () {
      // Create a custom localizations with a param-aware string
      final l10n = AppLocalizations(
        const Locale('ar'),
        {'test.greeting': 'مرحباً {name}!'},
      );
      expect(l10n.t('test.greeting', params: {'name': 'أحمد'}), equals('مرحباً أحمد!'));
    });

    test('substitutes multiple parameters', () {
      final l10n = AppLocalizations(
        const Locale('ar'),
        {'test.stats': '{count} من {total}'},
      );
      expect(
        l10n.t('test.stats', params: {'count': '5', 'total': '10'}),
        equals('5 من 10'),
      );
    });

    test('handles missing parameters gracefully', () {
      final l10n = AppLocalizations(
        const Locale('ar'),
        {'test.greeting': 'مرحباً {name}!'},
      );
      // Without param, the {name} placeholder remains
      expect(l10n.t('test.greeting'), equals('مرحباً {name}!'));
    });
  });

  group('AppLocalizations — of(context)', () {
    testWidgets('returns default when no Localizations ancestor', (tester) async {
      AppLocalizations? result;
      await tester.pumpWidget(
        WidgetsApp(
          color: const Color(0xFFFFFFFF),
          builder: (context, _) {
            result = AppLocalizations.of(context);
            return const SizedBox();
          },
        ),
      );
      // Without a Localizations widget, falls back to default (Arabic)
      expect(result, isNotNull);
      expect(result!.t('common.save'), equals('حفظ'));
    });
  });
}
