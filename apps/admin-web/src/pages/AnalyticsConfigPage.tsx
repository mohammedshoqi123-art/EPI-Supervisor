import { useState, useEffect } from 'react'
import {
  BarChart3, Plus, Trash2, Save, Loader2, Eye, EyeOff,
  GripVertical, Check, X, ArrowUpDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import { useForms, useAuth } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import { supabase, isConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── Analytics types ─────────────────────────────────────────
const ANALYTICS_TYPES = [
  { value: 'yesno', label: 'نعم/لا', icon: '✅', description: 'مخطط دائري للقيم الثنائية' },
  { value: 'bar', label: 'توزيع', icon: '📊', description: 'مخطط أشرطة للقيم المتعددة' },
  { value: 'avg', label: 'متوسط', icon: '📈', description: 'متوسط القيم الرقمية' },
  { value: 'sum', label: 'مجموع', icon: '➕', description: 'مجموع القيم الرقمية' },
  { value: 'count', label: 'عداد', icon: '🔢', description: 'عدد القيم' },
  { value: 'progress', label: 'نسبة مئوية', icon: '📊', description: 'شريط تقدم للنسبة' },
  { value: 'ranking', label: 'ترتيب', icon: '🏆', description: 'ترتيب القيم' },
  { value: 'map', label: 'خريطة', icon: '🗺️', description: 'توزيع جغرافي' },
]

// ─── Types ───────────────────────────────────────────────────
interface AnalyticsConfig {
  id?: string
  form_id: string
  field_key: string
  field_label_ar: string
  analytics_type: string
  aggregation: string
  is_visible: boolean
  sort_order: number
  config: Record<string, unknown>
}

interface FormField {
  key: string
  label: string
  type: string
}

// ─── Page Component ──────────────────────────────────────────
export default function AnalyticsConfigPage() {
  const { toast } = useToast()
  const { data: authData } = useAuth()
  const userRole = authData?.profile?.role
  const canManage = ['admin', 'central'].includes(userRole || '')

  const [selectedFormId, setSelectedFormId] = useState<string>('')
  const [configs, setConfigs] = useState<AnalyticsConfig[]>([])
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingConfig, setEditingConfig] = useState<AnalyticsConfig | null>(null)

  // New config form
  const [newFieldKey, setNewFieldKey] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newAnalyticsType, setNewAnalyticsType] = useState('yesno')

  const { data: formsResult } = useForms()
  const forms = formsResult?.data || []

  // ─── Load form fields from schema ─────────────────────────
  useEffect(() => {
    if (!selectedFormId) {
      setFormFields([])
      setConfigs([])
      return
    }

    const form = forms.find((f: any) => f.id === selectedFormId)
    if (form?.schema) {
      const fields: FormField[] = []
      const schema = form.schema as any
      const sections = schema.sections || []
      for (const section of sections) {
        for (const field of (section.fields || [])) {
          fields.push({
            key: field.key || field.id || '',
            label: field.label_ar || field.label || field.key || '',
            type: field.type || 'text',
          })
        }
      }
      setFormFields(fields)
    }

    loadConfigs(selectedFormId)
  }, [selectedFormId])

  // ─── Load existing configs ────────────────────────────────
  async function loadConfigs(formId: string) {
    if (!isConfigured) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('form_analytics_config')
        .select('*')
        .eq('form_id', formId)
        .order('sort_order')

      if (error) throw error
      setConfigs(data || [])
    } catch (e: any) {
      console.error('Failed to load analytics configs:', e)
      toast({ title: 'خطأ', description: 'فشل تحميل إعدادات التحليلات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ─── Save config ──────────────────────────────────────────
  async function handleSave(config: AnalyticsConfig) {
    setSaving(true)
    try {
      if (config.id) {
        // Update
        const { error } = await supabase
          .from('form_analytics_config')
          .update({
            field_label_ar: config.field_label_ar,
            analytics_type: config.analytics_type,
            aggregation: config.aggregation,
            is_visible: config.is_visible,
            sort_order: config.sort_order,
          })
          .eq('id', config.id)

        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from('form_analytics_config')
          .insert({
            form_id: config.form_id,
            field_key: config.field_key,
            field_label_ar: config.field_label_ar,
            analytics_type: config.analytics_type,
            aggregation: config.aggregation,
            is_visible: config.is_visible,
            sort_order: config.sort_order,
          })

        if (error) throw error
      }

      toast({ title: 'تم الحفظ', variant: 'success' })
      loadConfigs(selectedFormId)
      setShowAddDialog(false)
      setEditingConfig(null)
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete config ────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('هل تريد حذف هذا الإعداد؟')) return
    try {
      const { error } = await supabase
        .from('form_analytics_config')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast({ title: 'تم الحذف', variant: 'success' })
      loadConfigs(selectedFormId)
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' })
    }
  }

  // ─── Toggle visibility ────────────────────────────────────
  async function handleToggleVisibility(id: string, current: boolean) {
    try {
      const { error } = await supabase
        .from('form_analytics_config')
        .update({ is_visible: !current })
        .eq('id', id)

      if (error) throw error
      loadConfigs(selectedFormId)
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' })
    }
  }

  // ─── Add from field ───────────────────────────────────────
  function handleAddFromField(field: FormField) {
    setNewFieldKey(field.key)
    setNewFieldLabel(field.label)
    // Auto-detect type
    if (field.type === 'yesno') setNewAnalyticsType('yesno')
    else if (field.type === 'number') setNewAnalyticsType('avg')
    else if (field.type === 'select') setNewAnalyticsType('bar')
    else setNewAnalyticsType('count')
    setShowAddDialog(true)
  }

  if (!canManage) {
    return (
      <div className="page-enter">
        <Header title="إعدادات التحليلات" />
        <Card className="m-6">
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="text-lg font-medium mb-1">غير مصرح</h3>
            <p className="text-sm text-muted-foreground">يجب أن تكون مديراً أو مشرفاً مركزياً</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <Header
        title="إعدادات التحليلات"
        subtitle={selectedFormId ? `${configs.length} حقل مُعرّف` : 'اختر نموذجاً'}
      />

      <div className="p-4 sm:p-6 space-y-4">
        {/* ─── Form selector ──────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">النموذج:</Label>
              <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="اختر نموذجاً..." />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((form: any) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.title_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedFormId && (
          <>
            {/* ─── Existing configs ──────────────────────── */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">حقول التحليل المُعرّفة</CardTitle>
                    <CardDescription>هذه الحقول ستظهر في صفحة التحليلات</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1.5" onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-3.5 h-3.5" /> إضافة حقل
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : configs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>لا توجد حقول تحليل مُعرّفة</p>
                    <p className="text-xs mt-1">أضف حقولاً من الحقول المتاحة في النموذج</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {configs.map((config) => (
                      <div
                        key={config.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border',
                          config.is_visible ? 'bg-card' : 'bg-muted/30 opacity-60'
                        )}
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{config.field_label_ar}</p>
                            <Badge variant="secondary" className="text-[10px]">
                              {ANALYTICS_TYPES.find(t => t.value === config.analytics_type)?.icon}{' '}
                              {ANALYTICS_TYPES.find(t => t.value === config.analytics_type)?.label}
                            </Badge>
                            <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {config.field_key}
                            </code>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7"
                            onClick={() => handleToggleVisibility(config.id!, config.is_visible)}
                          >
                            {config.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7"
                            onClick={() => setEditingConfig(config)}
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(config.id!)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── Available fields (not yet configured) ── */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">الحقول المتاحة في النموذج</CardTitle>
                <CardDescription>اضغط على حقل لإضافته للتحليلات</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {formFields
                    .filter(f => !configs.find(c => c.field_key === f.key))
                    .map(field => (
                      <Button
                        key={field.key}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-8 text-xs"
                        onClick={() => handleAddFromField(field)}
                      >
                        <Plus className="w-3 h-3" /> {field.label}
                        <Badge variant="secondary" className="text-[9px] px-1">{field.type}</Badge>
                      </Button>
                    ))}
                  {formFields.filter(f => !configs.find(c => c.field_key === f.key)).length === 0 && (
                    <p className="text-sm text-muted-foreground">جميع الحقول مُعرّفة بالفعل</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ─── Add/Edit Dialog ────────────────────────────── */}
      <Dialog open={showAddDialog || !!editingConfig} onOpenChange={(open) => {
        if (!open) { setShowAddDialog(false); setEditingConfig(null) }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingConfig ? 'تعديل الحقل' : 'إضافة حقل تحليل'}</DialogTitle>
            <DialogDescription>
              {editingConfig ? 'عدّل إعدادات هذا الحقل' : 'اختر نوع التحليل لهذا الحقل'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>مفتاح الحقل</Label>
              <Input
                value={editingConfig?.field_key || newFieldKey}
                disabled
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label>الاسم بالعربي</Label>
              <Input
                value={editingConfig?.field_label_ar || newFieldLabel}
                onChange={(e) => editingConfig
                  ? setEditingConfig({ ...editingConfig, field_label_ar: e.target.value })
                  : setNewFieldLabel(e.target.value)
                }
              />
            </div>
            <div>
              <Label>نوع التحليل</Label>
              <Select
                value={editingConfig?.analytics_type || newAnalyticsType}
                onValueChange={(v) => editingConfig
                  ? setEditingConfig({ ...editingConfig, analytics_type: v })
                  : setNewAnalyticsType(v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANALYTICS_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label} — {type.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingConfig(null) }}>
              إلغاء
            </Button>
            <Button
              className="gap-2"
              disabled={saving}
              onClick={() => {
                if (editingConfig) {
                  handleSave(editingConfig)
                } else {
                  handleSave({
                    form_id: selectedFormId,
                    field_key: newFieldKey,
                    field_label_ar: newFieldLabel,
                    analytics_type: newAnalyticsType,
                    aggregation: 'count',
                    is_visible: true,
                    sort_order: configs.length,
                    config: {},
                  })
                }
              }}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" /> حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
