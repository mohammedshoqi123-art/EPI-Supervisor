/**
 * ═══════════════════════════════════════════════════════════
 *  معرفات النماذج — مصدر واحد لكل معرفات النماذج في النظام
 *  Form IDs — Single source of truth for all form IDs
 * ═══════════════════════════════════════════════════════════
 *
 *  الاستخدام:
 *    import { FormIds } from '@/lib/form-ids'
 *    const supervisionFormId = FormIds.SUPERVISION
 *
 *  ⚠️ لا تكرر هذه المعرفات في أي مكان آخر — استخدم هذا الملف دائماً
 * ═══════════════════════════════════════════════════════════
 */

export const FormIds = {
  /** استمارة الإشراف للنشاط الإيصالي التكاملي */
  SUPERVISION: '97a4f2b3-c573-4812-b58c-5b0acf814e24',

  /** استمارة الجاهزية للنشاط الإيصالي التكاملي */
  READINESS: '8aa0f3d5-7ab0-430f-85fd-4488c0c129bb',
} as const

/** نوع معرف النموذج */
export type FormId = (typeof FormIds)[keyof typeof FormIds]

/** قائمة كل معرفات النماذج */
export const ALL_FORM_IDS: string[] = Object.values(FormIds)

/** التحقق إذا كان المعرف ينتمي لنموذج معروف */
export function isKnownForm(id: string): boolean {
  return ALL_FORM_IDS.includes(id)
}

/** اسم النموذج بالعربية */
export function getFormName(id: string): string | null {
  if (id === FormIds.SUPERVISION) return 'استمارة الإشراف للنشاط الإيصالي التكاملي'
  if (id === FormIds.READINESS) return 'استمارة الجاهزية للنشاط الإيصالي التكاملي'
  return null
}
