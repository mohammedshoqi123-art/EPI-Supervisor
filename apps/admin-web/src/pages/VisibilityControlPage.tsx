import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, EyeOff, Lock, RefreshCw, Info, FileText } from 'lucide-react'
import type { UserRole } from '@/types/database'

// ═══ صفحة التحكم بالظهور — مصفوفة الأنشطة والاستمارات حسب المستوى ═══
// النشاط (campaign) → عمود visible_roles في campaign_types_base
// الاستمارة (form) → عمود allowed_roles في forms
// admin فقط مقفول «يرون الكل» دائماً (يمنع القفل الذاتي) — المركز قابل للتحكم
// القرار 2026-10-28: الإخفاء يشمل التقارير والإحصاءات واللوحات (مرتبط عبر RLS على form_submissions)

interface CampaignRow {
  id: string
  key: string
  label_ar: string
  icon: string | null
  visible: boolean
  visible_roles: string[] | null
  sort_order: number | null
  built_in: boolean
}

interface FormRow {
  id: string
  title_ar: string
  campaign_type: string | null
  allowed_roles: string[] | null
  is_active: boolean
}

const CONTROL_ROLES: UserRole[] = ['data_entry', 'district', 'governorate', 'central']
const LOCKED_ROLES: UserRole[] = ['admin']

const ROLE_LABELS_AR: Record<string, string> = {
  data_entry: 'مدخل بيانات',
  district: 'مديرية',
  governorate: 'محافظة',
  admin: 'مدير النظام',
  central: 'المركز',
}

export default function VisibilityControlPage() {
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [forms, setForms] = useState<FormRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ctRes, fRes] = await Promise.all([
        supabase
          .from('campaign_types')
          .select('id, key, label_ar, icon, visible, visible_roles, sort_order, built_in')
          .order('sort_order', { ascending: true }),
        supabase
          .from('forms')
          .select('id, title_ar, campaign_type, allowed_roles, is_active')
          .is('deleted_at', null)
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
      ])
      if (ctRes.error) throw ctRes.error
      if (fRes.error) throw fRes.error
      setCampaigns((ctRes.data || []) as CampaignRow[])
      setForms((fRes.data || []) as FormRow[])
    } catch (e: any) {
      setError(e?.message || 'خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // ─── التبديل على مستوى النشاط ───
  const toggleCampaignRole = async (c: CampaignRow, role: UserRole, next: boolean) => {
    const current = c.visible_roles || []
    const nextRoles = next ? Array.from(new Set([...current, role])) : current.filter((r) => r !== role)
    const key = `c-${c.id}-${role}`
    setBusyKey(key)
    const prev = campaigns
    setCampaigns((list) => list.map((x) => (x.id === c.id ? { ...x, visible_roles: nextRoles } : x)))
    const { error } = await supabase
      .from('campaign_types_base')
      .update({ visible_roles: nextRoles })
      .eq('id', c.id)
    setBusyKey(null)
    if (error) {
      setCampaigns(prev)
      toast({ title: 'فشل الحفظ', description: error.message, variant: 'destructive' })
      return
    }
    toast({
      title: next ? 'تم الإظهار' : 'تم الإخفاء',
      description: `النشاط «${c.label_ar}» ${next ? 'ظاهر الآن' : 'مخفي الآن'} لمستوى «${ROLE_LABELS_AR[role]}»`,
    })
  }

  // ─── التبديل على مستوى الاستمارة ───
  const toggleFormRole = async (f: FormRow, role: UserRole, next: boolean) => {
    const current = f.allowed_roles || []
    const nextRoles = next ? Array.from(new Set([...current, role])) : current.filter((r) => r !== role)
    const key = `f-${f.id}-${role}`
    setBusyKey(key)
    const prev = forms
    setForms((list) => list.map((x) => (x.id === f.id ? { ...x, allowed_roles: nextRoles } : x)))
    const { error } = await supabase.from('forms').update({ allowed_roles: nextRoles }).eq('id', f.id)
    setBusyKey(null)
    if (error) {
      setForms(prev)
      toast({ title: 'فشل الحفظ', description: error.message, variant: 'destructive' })
      return
    }
    toast({
      title: next ? 'تم الإظهار' : 'تم الإخفاء',
      description: `الاستمارة «${f.title_ar}» ${next ? 'ظاهرة الآن' : 'مخفية الآن'} لمستوى «${ROLE_LABELS_AR[role]}»`,
    })
  }

  const roleOn = (roles: string[] | null, role: string) => (roles || []).includes(role)

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-72" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <EyeOff className="h-10 w-10 text-red-400" />
            <p className="font-bold text-red-700">تعذر تحميل بيانات التحكم بالظهور</p>
            <p className="text-sm text-red-600">{error}</p>
            <Button onClick={load} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" /> إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 md:p-6" dir="rtl">
      {/* ─── العنوان ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
            <Eye className="h-6 w-6 text-primary" />
            التحكم بالظهور حسب المستوى
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            اختر الأنشطة والاستمارات التي يراها كل مستوى في تطبيق الهاتف — الحفظ فوري
          </p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className="h-4 w-4" /> تحديث
        </Button>
      </div>

      {/* ─── ملاحظات ─── */}
      <Card className="border-blue-200 bg-blue-50/60">
        <CardContent className="flex gap-3 py-4">
          <Info className="h-5 w-5 shrink-0 text-blue-500" />
          <div className="space-y-1 text-sm text-blue-900">
            <p>• التحكم يخص <b>الظهور والتعبئة والتقارير والإحصاءات واللوحات</b> — إخفاء نشاط يخفي بياناته وبياناته التحليلية عن هذا المستوى فوراً.</p>
            <p>• <b>مدير النظام فقط يرى كل شيء دائماً</b> ولا يمكن إخفاء أي شيء عنه (حماية من انقطاع الوصول) — المركز قابل للتحكم كباقي المستويات.</p>
            <p>• إخفاء النشاط يخفي استماراته تلقائياً، ويمكن إخفاء استمارة بعينها داخل نشاط ظاهر.</p>
            <p>• البيانات المحفوظة لا تُحذف — إعادة الإظهار تعيد كل شيء، والتغييرات تصل لهواتف المستخدمين عند أول مزامنة (حتى 24 ساعة للأجهزة غير المتصلة).</p>
          </div>
        </CardContent>
      </Card>

      {/* ─── رأس الأعمدة ─── */}
      <div className="flex items-center gap-2 px-2 text-xs font-semibold text-muted-foreground">
        <span className="flex-1">النشاط / الاستمارة</span>
        {CONTROL_ROLES.map((r) => (
          <span key={r} className="w-20 text-center">{ROLE_LABELS_AR[r]}</span>
        ))}
        <span className="w-28 text-center flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" /> مدير النظام
        </span>
      </div>

      {/* ─── البطاقات ─── */}
      <div className="space-y-4">
        {campaigns.map((c) => {
          const campaignForms = forms.filter((f) => f.campaign_type === c.key)
          return (
            <Card key={c.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  <span className="text-lg">{c.icon || '📋'}</span>
                  <span>{c.label_ar}</span>
                  {c.visible ? (
                    <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700">
                      <Eye className="h-3 w-3" /> نشط
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 border-gray-300 bg-gray-100 text-gray-500">
                      <EyeOff className="h-3 w-3" /> مخفي عن الجميع
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-0">
                {/* صف النشاط */}
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
                  <span className="flex-1 text-sm font-semibold">النشاط كاملاً</span>
                  {CONTROL_ROLES.map((role) => (
                    <div key={role} className="flex w-20 justify-center">
                      <Switch
                        checked={roleOn(c.visible_roles, role)}
                        disabled={busyKey === `c-${c.id}-${role}`}
                        onCheckedChange={(v) => toggleCampaignRole(c, role, v)}
                      />
                    </div>
                  ))}
                  <div className="flex w-28 items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" /> دائماً
                  </div>
                </div>

                {/* صفوف الاستمارات */}
                {campaignForms.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-muted-foreground">لا توجد استمارات نشطة لهذا النشاط</p>
                ) : (
                  campaignForms.map((f) => (
                    <div
                      key={f.id}
                      className="flex flex-wrap items-center gap-2 border-t px-3 py-2.5"
                    >
                      <span className="flex flex-1 items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {f.title_ar}
                      </span>
                      {CONTROL_ROLES.map((role) => {
                        // إن كان النشاط مخفياً للمستوى، خفّف المفتاح (الإخفاء فعّال عبر النشاط)
                        const dimmed = !roleOn(c.visible_roles, role)
                        return (
                          <div key={role} className={`flex w-20 justify-center ${dimmed ? 'opacity-40' : ''}`}>
                            <Switch
                              checked={roleOn(f.allowed_roles, role)}
                              disabled={busyKey === `f-${f.id}-${role}`}
                              onCheckedChange={(v) => toggleFormRole(f, role, v)}
                            />
                          </div>
                        )
                      })}
                      <div className="flex w-28 items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" /> دائماً
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
