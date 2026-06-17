import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  ar: {
    translation: {
      // Navigation
      'nav.dashboard': 'لوحة المعلومات',
      'nav.forms': 'النماذج',
      'nav.submissions': 'الإرساليات',
      'nav.users': 'المستخدمين',
      'nav.map': 'الخريطة',
      'nav.reports': 'التقارير',
      'nav.settings': 'الإعدادات',
      'nav.chat': 'المحادثة',
      'nav.ai': 'المساعد الذكي',
      'nav.audit': 'سجل المراجعة',
      'nav.notifications': 'الإشعارات',

      // Common
      'common.save': 'حفظ',
      'common.cancel': 'إلغاء',
      'common.delete': 'حذف',
      'common.edit': 'تعديل',
      'common.add': 'إضافة',
      'common.search': 'بحث',
      'common.loading': 'جاري التحميل...',
      'common.error': 'حدث خطأ',
      'common.success': 'تم بنجاح',
      'common.confirm': 'تأكيد',
      'common.back': 'رجوع',
      'common.next': 'التالي',
      'common.previous': 'السابق',

      // Auth
      'auth.login': 'تسجيل الدخول',
      'auth.logout': 'تسجيل الخروج',
      'auth.email': 'البريد الإلكتروني',
      'auth.password': 'كلمة المرور',
      'auth.forgot': 'نسيت كلمة المرور؟',

      // Dashboard
      'dashboard.title': 'لوحة المعلومات',
      'dashboard.totalSubmissions': 'إجمالي الإرساليات',
      'dashboard.pending': 'قيد المراجعة',
      'dashboard.approved': 'مقبول',
      'dashboard.rejected': 'مرفوض',

      // Roles
      'role.admin': 'مدير النظام',
      'role.central': 'مركزي',
      'role.governorate': 'محافظة',
      'role.district': 'مديرية',
      'role.data_entry': 'مدخل بيانات',

      // Errors
      'error.unauthorized': 'غير مصرح',
      'error.forbidden': 'ممنوع',
      'error.notFound': 'غير موجود',
      'error.serverError': 'خطأ في الخادم',
      'error.networkError': 'خطأ في الاتصال',
    },
  },
  en: {
    translation: {
      'nav.dashboard': 'Dashboard',
      'nav.forms': 'Forms',
      'nav.submissions': 'Submissions',
      'nav.users': 'Users',
      'nav.map': 'Map',
      'nav.reports': 'Reports',
      'nav.settings': 'Settings',
      'nav.chat': 'Chat',
      'nav.ai': 'AI Assistant',
      'nav.audit': 'Audit Log',
      'nav.notifications': 'Notifications',

      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.add': 'Add',
      'common.search': 'Search',
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.success': 'Success',
      'common.confirm': 'Confirm',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.previous': 'Previous',

      'auth.login': 'Login',
      'auth.logout': 'Logout',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.forgot': 'Forgot password?',

      'dashboard.title': 'Dashboard',
      'dashboard.totalSubmissions': 'Total Submissions',
      'dashboard.pending': 'Pending',
      'dashboard.approved': 'Approved',
      'dashboard.rejected': 'Rejected',

      'role.admin': 'Admin',
      'role.central': 'Central',
      'role.governorate': 'Governorate',
      'role.district': 'District',
      'role.data_entry': 'Data Entry',

      'error.unauthorized': 'Unauthorized',
      'error.forbidden': 'Forbidden',
      'error.notFound': 'Not Found',
      'error.serverError': 'Server Error',
      'error.networkError': 'Network Error',
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'ar',
  fallbackLng: 'ar',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
