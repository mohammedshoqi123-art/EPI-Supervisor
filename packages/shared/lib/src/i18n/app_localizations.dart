import 'package:flutter/widgets.dart';

/// ═══════════════════════════════════════════════════════════════
///  i18n Foundation — Centralized String Management
///
///  This is a lightweight i18n foundation that replaces hardcoded
///  Arabic strings throughout the app. Currently supports Arabic
///  (default) with structure to add English and other languages.
///
///  Usage:
///    final l10n = AppLocalizations.of(context);
///    Text(l10n.t('login.title'))
///
///  Future: migrate to flutter_localizations + .arb files once
///  the full string inventory is extracted.
/// ═══════════════════════════════════════════════════════════════

class AppLocalizations {
  static const Locale defaultLocale = Locale('ar', 'YE');

  final Locale locale;
  final Map<String, String> _strings;

  const AppLocalizations(this.locale, this._strings);

  /// Get the localizations instance from context.
  static AppLocalizations of(BuildContext context) {
    final widget = Localizations.of<AppLocalizations>(
      context,
      AppLocalizations,
    );
    return widget ?? AppLocalizations(defaultLocale, _arStrings);
  }

  /// Translate a key. Returns the key itself if not found.
  String t(String key, {Map<String, String>? params}) {
    var value = _strings[key] ?? key;
    if (params != null) {
      params.forEach((k, v) {
        value = value.replaceAll('{$k}', v);
      });
    }
    return value;
  }

  /// Whether this locale is RTL
  bool get isRTL => locale.languageCode == 'ar';

  /// All supported locales
  static const supportedLocales = [
    Locale('ar', 'YE'),
    Locale('en', 'US'),
  ];

  /// Arabic strings (default)
  static const Map<String, String> _arStrings = {
    // ═══ App ═══
    'app.name': 'منصة مشرف EPI',
    'app.tagline': 'نظام إشراف ميداني متكامل لحملات التطعيم',

    // ═══ Auth ═══
    'auth.login': 'تسجيل الدخول',
    'auth.logout': 'تسجيل الخروج',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.signin_button': 'دخول',
    'auth.biometric': 'تسجيل الدخول بالبصمة',
    'auth.invalid_credentials': 'بيانات الدخول غير صحيحة',
    'auth.session_expired': 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً',

    // ═══ Roles ═══
    'role.admin': 'مدير النظام',
    'role.central': 'مركزي',
    'role.governorate': 'محافظة',
    'role.district': 'مديرية',
    'role.data_entry': 'مدخل بيانات',

    // ═══ Navigation ═══
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

    // ═══ Dashboard ═══
    'dashboard.welcome': 'مرحباً',
    'dashboard.total_submissions': 'إجمالي الإرساليات',
    'dashboard.today_submissions': 'إرساليات اليوم',
    'dashboard.pending_sync': 'بانتظار المزامنة',
    'dashboard.critical_shortages': 'نواقص حرجة',
    'dashboard.synced': 'متزامن',
    'dashboard.drafts': 'مسودات',
    'dashboard.submitted': 'مرسلة',
    'dashboard.last_sync': 'آخر مزامنة',
    'dashboard.sync_now': 'مزامنة الآن',

    // ═══ Forms ═══
    'forms.title': 'النماذج',
    'forms.draft': 'مسودة',
    'forms.submitted': 'مرسلة',
    'forms.pending': 'قيد المزامنة',
    'forms.synced': 'متزامنة',
    'forms.save_draft': 'حفظ كمسودة',
    'forms.submit': 'إرسال',
    'forms.required': 'مطلوب',
    'forms.optional': 'اختياري',
    'forms.gps_required': 'هذا النموذج يتطلب إحداثيات GPS',
    'forms.photo_required': 'هذا النموذج يتطلب صورة واحدة على الأقل',

    // ═══ Common ═══
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.retry': 'إعادة المحاولة',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
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
    'common.page': 'صفحة',
    'common.of': 'من',
    'common.items': 'عنصر',

    // ═══ Sync ═══
    'sync.online': 'متصل',
    'sync.offline': 'غير متصل',
    'sync.syncing': 'جاري المزامنة...',
    'sync.sync_complete': 'اكتملت المزامنة',
    'sync.sync_failed': 'فشلت المزامنة',
    'sync.pending': 'بانتظار المزامنة',
    'sync.conflict': 'تعارض في البيانات',

    // ═══ Vaccines ═══
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

    // ═══ AI ═══
    'ai.welcome': 'مرحباً! كيف يمكنني مساعدتك؟',
    'ai.typing': 'يكتب...',
    'ai.send': 'إرسال',
    'ai.clear_chat': 'مسح المحادثة',
    'ai.no_response': 'لم أتمكن من معالجة طلبك',
    'ai.offline_mode': 'الوضع دون اتصال — الردود من المحرك المحلي',

    // ═══ Errors ═══
    'error.network': 'لا يوجد اتصال بالإنترنت',
    'error.server': 'خطأ في الخادم',
    'error.not_found': 'غير موجود',
    'error.unauthorized': 'غير مصرح',
    'error.forbidden': 'ممنوع',
    'error.validation': 'بيانات غير صحيحة',
    'error.timeout': 'انتهت مهلة الطلب',

    // ═══ Chat ═══
    'chat.title': 'المحادثة الداخلية',
    'chat.placeholder': 'اكتب رسالتك...',
    'chat.send': 'إرسال',
    'chat.empty': 'لا توجد رسائل بعد',
    'chat.too_long': 'الرسالة طويلة جداً (الحد الأقصى 1000 حرف)',

    // ═══ Profile ═══
    'profile.edit': 'تعديل',
    'profile.save': 'حفظ',
    'profile.cancel': 'إلغاء',
    'profile.full_name': 'الاسم الكامل',
    'profile.phone': 'رقم الجوال',
    'profile.national_id': 'رقم الهوية',
    'profile.role': 'الدور',
    'profile.governorate': 'المحافظة',
    'profile.district': 'المديرية',

    // ═══ Onboarding ═══
    'onboarding.welcome': 'مرحباً بك في منصة مشرف EPI',
    'onboarding.start': 'ابدأ الاستخدام',
    'onboarding.skip': 'تخطي',

    // ═══ Splash ═══
    'splash.loading': 'جاري التحميل...',
    'splash.session_found': 'تم العثور على جلسة — جاري التحميل...',
    'splash.going_to_login': 'الانتقال لتسجيل الدخول...',
    'splash.supabase_not_configured': 'Supabase غير مُعدّ — الانتقال لتسجيل الدخول',

    // ═══ Login ═══
    'login.forget_password': 'نسيت كلمة المرور؟',
    'login.reset_password_title': 'استعادة كلمة المرور',
    'login.reset_password_body': 'أدخل بريدك الإلكتروني وسيتم إرسال رابط استعادة كلمة المرور',
    'login.reset_sent': 'تم إرسال رابط الاستعادة إلى {email}',
    'login.reset_failed': 'فشل الإرسال',
    'login.invalid_email': 'الرجاء إدخال بريد صحيح',

    // ═══ Notifications ═══
    'notif.sync_complete': '✅ اكتملت المزامنة',
    'notif.sync_complete_with_errors': '⚠️ اكتملت المزامنة (مع أخطاء)',
    'notif.sync_body': 'تمت مزامنة {count} عنصر بنجاح',
    'notif.sync_body_with_errors': 'تمت مزامنة {synced} عنصر، فشل {failed} عنصر',
    'notif.submission_confirmed': '✅ تم تأكيد الإرسالية',
    'notif.shortage_alert': '🔴 تنبيه: نقص في {vaccine}',
  };

  /// English strings (for future use)
  static const Map<String, String> _enStrings = {
    'app.name': 'EPI Supervisor',
    'app.tagline': 'Field Supervision System for Immunization Campaigns',
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signin_button': 'Sign In',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'sync.online': 'Online',
    'sync.offline': 'Offline',
    'sync.syncing': 'Syncing...',
  };

  /// Get strings for a locale
  static Map<String, String> _getStrings(Locale locale) {
    switch (locale.languageCode) {
      case 'en':
        return _enStrings;
      case 'ar':
      default:
        return _arStrings;
    }
  }

  /// Localizations delegate for integration with flutter_localizations
  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['ar', 'en'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale, AppLocalizations._getStrings(locale));
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
