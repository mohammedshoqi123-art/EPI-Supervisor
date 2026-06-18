// ═══════════════════════════════════════════════════════════
// i18n Setup Example for admin-web
// ═══════════════════════════════════════════════════════════
//
// To activate i18n:
// 1. Run: cd apps/admin-web && npm install i18next react-i18next --save
// 2. Copy this file to: apps/admin-web/src/i18n/index.ts
// 3. Add to main.tsx: import './i18n'
// 4. Use in components: const { t } = useTranslation()
//
// Example:
//   import { useTranslation } from 'react-i18next'
//   function MyComponent() {
//     const { t, i18n } = useTranslation()
//     return <h1>{t('nav.dashboard')}</h1>
//   }
//
// Switch language:
//   i18n.changeLanguage('en') // English
//   i18n.changeLanguage('ar') // Arabic (default)
// ═══════════════════════════════════════════════════════════

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  ar: {
    translation: {
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
      'common.save': 'حفظ',
      'common.cancel': 'إلغاء',
      'common.delete': 'حذف',
      'common.edit': 'تعديل',
      'common.add': 'إضافة',
      'common.search': 'بحث',
      'common.loading': 'جاري التحميل...',
      'common.error': 'حدث خطأ',
      'common.success': 'تم بنجاح',
      'auth.login': 'تسجيل الدخول',
      'auth.logout': 'تسجيل الخروج',
      'auth.email': 'البريد الإلكتروني',
      'auth.password': 'كلمة المرور',
      'dashboard.title': 'لوحة المعلومات',
      'dashboard.totalSubmissions': 'إجمالي الإرساليات',
      'dashboard.pending': 'قيد المراجعة',
      'dashboard.approved': 'مقبول',
      'dashboard.rejected': 'مرفوض',
      'role.admin': 'مدير النظام',
      'role.central': 'ركزي',
      'role.governorate': 'محافظة',
      'role.district': 'مديرية',
      'role.data_entry': 'مدخل بيانات',
      'error.unauthorized': 'غير مصرح',
      'error.forbidden': 'ممنوع',
      'error.notFound': 'غير موجود',
      'error.serverError': 'خطأ في الخادم',
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
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      'auth.email': 'Email',
      'auth.password': 'Password',
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
