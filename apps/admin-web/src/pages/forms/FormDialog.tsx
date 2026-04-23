import { useState, useCallback } from 'react'
import {
  Plus, Edit, Trash2, Copy, ChevronUp, ChevronDown, Check, X,
  MapPin, Camera, Globe, LayoutGrid, Shield, Settings, Loader2,
  Type, Hash, ListChecks, Columns3, Calendar, Clock, PenTool, QrCode,
  GripVertical, Eye, EyeOff, AlertCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useCreateForm, useUpdateForm } from '@/hooks/useApi'
import { ROLE_LABELS, ROLE_HIERARCHY, type Form, type UserRole } from '@/types/database'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import {
  generateId, parseFormSchema, FIELD_TYPE_LABELS, CATEGORY_LABELS,
  GPS_ACCURACY_LABELS, RECURRING_OPTIONS,
  type FormField, type FormFieldType, type FormCategory, type FormSchema
} from './types'

// ==================== Icon Map ====================
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Type, Hash, ListChecks, Columns3, Calendar, Clock, MapPin, Camera, PenTool, QrCode
}

function getFieldIcon(iconName: string) {
  return ICON_MAP[iconName] || Type
}

// ==================== Main Dialog ====================

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form?: Form
  onSuccess: () => void
}

export function FormDialog({ open, onOpenChange, form, onSuccess }: FormDialogProps) {
  const isEdit = !!form
  const { toast } = useToast()
  const createForm = useCreateForm()
  const updateForm = useUpdateForm()

  const initialSchema = form ? parseFormSchema(form.schema) : { fields: [] }

  // Basic info
  const [titleAr, setTitleAr] = useState(form?.title_ar || '')
  const [titleEn, setTitleEn] = useState(form?.title_en || '')
  const [descriptionAr, setDescriptionAr] = useState(form?.description_ar || '')
  const [descriptionEn, setDescriptionEn] = useState(form?.description_en || '')
  const [category, setCategory] = useState<FormCategory>((initialSchema.category as FormCategory) || 'other')
  const [isActive, setIsActive] = useState(form?.is_active ?? true)
  const [campaignType, setCampaignType] = useState(form?.campaign_type || 'polio_campaign')

  // GPS & Photo
  const [requiresGps, setRequiresGps] = useState(form?.requires_gps || false)
  const [gpsAccuracy, setGpsAccuracy] = useState<string>(initialSchema.gps_accuracy || 'medium')
  const [requiresPhoto, setRequiresPhoto] = useState(form?.requires_photo || false)
  const [maxPhotos, setMaxPhotos] = useState(form?.max_photos || 5)

  // Roles
  const [allowedRoles, setAllowedRoles] = useState<UserRole[]>(form?.allowed_roles || ['data_entry'])

  // Fields
  const [fields, setFields] = useState<FormField[]>(initialSchema.fields || [])

  // Settings
  const [submissionDeadline, setSubmissionDeadline] = useState(initialSchema.submission_deadline || '')
  const [isRecurring, setIsRecurring] = useState(initialSchema.is_recurring || false)
  const [recurringSchedule, setRecurringSchedule] = useState(initialSchema.recurring_schedule || 'monthly')
  const [notifyOnSubmit, setNotifyOnSubmit] = useState(initialSchema.notify_on_submit !== false)
  const [notifyOnReview, setNotifyOnReview] = useState(initialSchema.notify_on_review !== false)

  const [activeTab, setActiveTab] = useState('basic')
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)

  const allRoles: UserRole[] = ['admin', 'central', 'governorate', 'district', 'data_entry']

  const toggleRole = (role: UserRole) => {
    setAllowedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])
  }

  // Field management
  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: generateId(), type,
      label_ar: FIELD_TYPE_LABELS[type].ar,
      label_en: FIELD_TYPE_LABELS[type].en,
      required: false, order: fields.length,
      options: (type === 'select' || type === 'multi_select')
        ? [{ value: 'option_1', label_ar: 'خيار 1', label_en: 'Option 1' }]
        : undefined,
    }
    setFields(prev => [...prev, newField])
    setEditingFieldId(newField.id)
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const removeField = (id: string) => {
    setFields(prev => {
      const filtered = prev.filter(f => f.id !== id)
      return filtered.map((f, i) => ({ ...f, order: i }))
    })
    if (editingFieldId === id) setEditingFieldId(null)
  }

  const moveField = (id: string, direction: 'up' | 'down') => {
    setFields(prev => {
      const idx = prev.findIndex(f => f.id === id)
      if (idx === -1) return prev
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.splice(targetIdx, 0, item)
      return next.map((f, i) => ({ ...f, order: i }))
    })
  }

  const duplicateField = (id: string) => {
    setFields(prev => {
      const src = prev.find(f => f.id === id)
      if (!src) return prev
      const idx = prev.findIndex(f => f.id === id)
      const dup: FormField = {
        ...src, id: generateId(),
        label_ar: `${src.label_ar} (نسخة)`,
        label_en: `${src.label_en} (Copy)`,
        order: idx + 1,
        options: src.options ? [...src.options] : undefined,
      }
      const next = [...prev]
      next.splice(idx + 1, 0, dup)
      return next.map((f, i) => ({ ...f, order: i }))
    })
  }

  const addFieldOption = (fieldId: string) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f
      const opts = f.options || []
      const num = opts.length + 1
      return { ...f, options: [...opts, { value: `option_${num}`, label_ar: `خيار ${num}`, label_en: `Option ${num}` }] }
    }))
  }

  const updateFieldOption = (fieldId: string, optIdx: number, updates: Partial<{ label_ar: string; label_en: string; value: string }>) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId || !f.options) return f
      const opts = [...f.options]
      opts[optIdx] = { ...opts[optIdx], ...updates }
      return { ...f, options: opts }
    }))
  }

  const removeFieldOption = (fieldId: string, optIdx: number) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId || !f.options) return f
      return { ...f, options: f.options.filter((_, i) => i !== optIdx) }
    }))
  }

  const handleSubmit = () => {
    if (!titleAr.trim() || !titleEn.trim()) {
      toast({ title: 'الرجاء إدخال العنوان بالعربية والإنجليزية', variant: 'destructive' })
      setActiveTab('basic')
      return
    }

    const schema: FormSchema = {
      fields, category,
      submission_deadline: submissionDeadline || undefined,
      is_recurring: isRecurring,
      recurring_schedule: isRecurring ? recurringSchedule : undefined,
      notify_on_submit: notifyOnSubmit,
      notify_on_review: notifyOnReview,
      gps_accuracy: requiresGps ? (gpsAccuracy as 'low' | 'medium' | 'high') : undefined,
    }

    const payload = {
      title_ar: titleAr, title_en: titleEn,
      description_ar: descriptionAr || undefined,
      description_en: descriptionEn || undefined,
      schema: schema as unknown as Record<string, unknown>,
      requires_gps: requiresGps, requires_photo: requiresPhoto,
      max_photos: requiresPhoto ? maxPhotos : 0,
      allowed_roles: allowedRoles, is_active: isActive, campaign_type: campaignType,
    }

    if (isEdit) {
      updateForm.mutate({ id: form.id, ...payload }, {
        onSuccess: () => { toast({ title: 'تم تحديث النموذج بنجاح', variant: 'success' }); onSuccess() },
      })
    } else {
      createForm.mutate(payload, {
        onSuccess: () => { toast({ title: 'تم إنشاء النموذج بنجاح', variant: 'success' }); onSuccess() },
      })
    }
  }

  const isPending = createForm.isPending || updateForm.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              isEdit ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'
            )}>
              {isEdit ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg">{isEdit ? 'تعديل النموذج' : 'إنشاء نموذج جديد'}</DialogTitle>
              <DialogDescription className="text-xs">
                {isEdit ? 'قم بتعديل بيانات النموذج وحقوله' : 'أدخل بيانات النموذج وأضف الحقول المطلوبة'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4 pb-2 border-b bg-muted/20">
            <TabsList className="w-full justify-start gap-1 bg-transparent p-0 h-auto">
              {[
                { value: 'basic', icon: Globe, label: 'البيانات الأساسية' },
                { value: 'fields', icon: LayoutGrid, label: `الحقول (${fields.length})` },
                { value: 'roles', icon: Shield, label: 'الصلاحيات' },
                { value: 'settings', icon: Settings, label: 'الإعدادات' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-xs font-medium transition-all gap-1.5"
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 max-h-[58vh]">
            {/* ===== BASIC TAB ===== */}
            <TabsContent value="basic" className="mt-0 p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title_ar" className="text-xs font-medium">العنوان بالعربية *</Label>
                  <Input id="title_ar" value={titleAr} onChange={e => setTitleAr(e.target.value)} placeholder="مثال: تقرير التطعيم الشهري" className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title_en" className="text-xs font-medium">العنوان بالإنجليزية *</Label>
                  <Input id="title_en" value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="e.g. Monthly Vaccination Report" dir="ltr" className="h-10" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="desc_ar" className="text-xs font-medium">الوصف بالعربية</Label>
                  <Input id="desc_ar" value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} placeholder="وصف مختصر للنموذج..." className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc_en" className="text-xs font-medium">الوصف بالإنجليزية</Label>
                  <Input id="desc_en" value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} placeholder="Brief form description..." dir="ltr" className="h-10" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">التصنيف</Label>
                  <Select value={category} onValueChange={v => setCategory(v as FormCategory)}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.ar}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">النشاط / الحملة</Label>
                  <Select value={campaignType} onValueChange={setCampaignType}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="اختر النشاط" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="polio_campaign">💉 حملة شلل الأطفال</SelectItem>
                      <SelectItem value="integrated_activity">🏥 النشاط الإيصالي التكاملي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GPS */}
                <Card className="border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-xs font-medium">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        يتطلب GPS
                      </Label>
                      <Switch checked={requiresGps} onCheckedChange={setRequiresGps} />
                    </div>
                    {requiresGps && (
                      <Select value={gpsAccuracy} onValueChange={setGpsAccuracy}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(GPS_ACCURACY_LABELS).map(([key, val]) => (
                            <SelectItem key={key} value={key}>{val.ar}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </CardContent>
                </Card>

                {/* Photo */}
                <Card className="border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-xs font-medium">
                        <Camera className="w-4 h-4 text-muted-foreground" />
                        يتطلب صور
                      </Label>
                      <Switch checked={requiresPhoto} onCheckedChange={setRequiresPhoto} />
                    </div>
                    {requiresPhoto && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">الحد الأقصى</Label>
                        <Input type="number" min={1} max={20} value={maxPhotos} onChange={e => setMaxPhotos(parseInt(e.target.value) || 1)} className="w-20 h-9 text-xs" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Active Toggle */}
              <Card className="border shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-xs font-medium">
                    {isActive ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    النموذج نشط
                  </Label>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== FIELDS TAB ===== */}
            <TabsContent value="fields" className="mt-0 p-6 space-y-5">
              {/* Add Field Buttons */}
              <div>
                <Label className="text-xs font-medium mb-3 block">إضافة حقل جديد</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {(Object.entries(FIELD_TYPE_LABELS) as [FormFieldType, typeof FIELD_TYPE_LABELS['text']][]).map(([type, info]) => {
                    const Icon = getFieldIcon(info.icon)
                    return (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-9 hover:bg-primary/5 hover:border-primary/30 transition-all"
                        onClick={() => addField(type)}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {info.ar}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Fields List */}
              {fields.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <LayoutGrid className="w-14 h-14 mx-auto mb-4 opacity-15" />
                  <p className="text-sm font-medium">لا توجد حقول بعد</p>
                  <p className="text-xs mt-1 text-muted-foreground/70">اضغط على أحد الأزرار أعلاه لإضافة حقل</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, idx) => {
                    const ft = FIELD_TYPE_LABELS[field.type]
                    const Icon = getFieldIcon(ft.icon)
                    const isEditing = editingFieldId === field.id

                    return (
                      <Card key={field.id} className={cn(
                        'transition-all duration-200 overflow-hidden border shadow-sm',
                        isEditing ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'hover:border-primary/20'
                      )}>
                        <CardContent className="p-0">
                          {/* Field Header */}
                          <div className={cn(
                            'flex items-center gap-2 p-3 transition-colors cursor-pointer',
                            isEditing ? 'bg-primary/5' : 'hover:bg-muted/30'
                          )} onClick={() => setEditingFieldId(isEditing ? null : field.id)}>
                            <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                            <div className="flex flex-col gap-0.5">
                              <Button variant="ghost" size="icon-sm" className="h-4 w-4 p-0" onClick={e => { e.stopPropagation(); moveField(field.id, 'up') }} disabled={idx === 0}>
                                <ChevronUp className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" className="h-4 w-4 p-0" onClick={e => { e.stopPropagation(); moveField(field.id, 'down') }} disabled={idx === fields.length - 1}>
                                <ChevronDown className="w-3 h-3" />
                              </Button>
                            </div>
                            <Badge variant="secondary" className="gap-1 text-[10px] shrink-0">
                              <Icon className="w-3 h-3" />
                              {ft.ar}
                            </Badge>
                            <span className="text-sm font-medium truncate flex-1">{field.label_ar}</span>
                            {field.required && <Badge variant="destructive" className="text-[10px] shrink-0">مطلوب</Badge>}
                            <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => duplicateField(field.id)} title="نسخ">
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeField(field.id)} title="حذف">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Edit */}
                          {isEditing && (
                            <div className="px-4 pb-4 pt-3 border-t space-y-4 animate-in slide-in-from-top-1 duration-200">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-[11px]">التسمية (عربي)</Label>
                                  <Input value={field.label_ar} onChange={e => updateField(field.id, { label_ar: e.target.value })} className="h-8 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[11px]">Label (English)</Label>
                                  <Input value={field.label_en} onChange={e => updateField(field.id, { label_en: e.target.value })} className="h-8 text-sm" dir="ltr" />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-[11px]">Placeholder (عربي)</Label>
                                  <Input value={field.placeholder_ar || ''} onChange={e => updateField(field.id, { placeholder_ar: e.target.value })} className="h-8 text-sm" placeholder="نص توضيحي..." />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[11px]">Placeholder (EN)</Label>
                                  <Input value={field.placeholder_en || ''} onChange={e => updateField(field.id, { placeholder_en: e.target.value })} className="h-8 text-sm" placeholder="Helper text..." dir="ltr" />
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <Label className="text-[11px]">حقل مطلوب</Label>
                                <Switch checked={field.required} onCheckedChange={checked => updateField(field.id, { required: checked })} />
                              </div>

                              {/* Validation */}
                              {(field.type === 'number' || field.type === 'text') && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <Label className="text-[11px]">{field.type === 'number' ? 'الحد الأدنى' : 'الحد الأدنى للحروف'}</Label>
                                    <Input type="number" value={field.validation?.min ?? ''} onChange={e => updateField(field.id, { validation: { ...field.validation, min: e.target.value ? Number(e.target.value) : undefined } })} className="h-8 text-sm" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-[11px]">{field.type === 'number' ? 'الحد الأقصى' : 'الحد الأقصى للحروف'}</Label>
                                    <Input type="number" value={field.validation?.max ?? ''} onChange={e => updateField(field.id, { validation: { ...field.validation, max: e.target.value ? Number(e.target.value) : undefined } })} className="h-8 text-sm" />
                                  </div>
                                </div>
                              )}

                              {/* Options */}
                              {(field.type === 'select' || field.type === 'multi_select') && (
                                <div className="space-y-2">
                                  <Label className="text-[11px]">الخيارات</Label>
                                  {field.options?.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <Input value={opt.label_ar} onChange={e => updateFieldOption(field.id, optIdx, { label_ar: e.target.value })} className="h-7 text-xs flex-1" placeholder="عربي" />
                                      <Input value={opt.label_en} onChange={e => updateFieldOption(field.id, optIdx, { label_en: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })} className="h-7 text-xs flex-1" placeholder="English" dir="ltr" />
                                      <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeFieldOption(field.id, optIdx)} disabled={(field.options?.length || 0) <= 1}>
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => addFieldOption(field.id)}>
                                    <Plus className="w-3 h-3" /> إضافة خيار
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* ===== ROLES TAB ===== */}
            <TabsContent value="roles" className="mt-0 p-6 space-y-5">
              <div>
                <Label className="text-sm font-medium mb-3 block">الأدوار المسموحة بتعبئة النموذج</Label>
                <div className="space-y-2">
                  {allRoles.map((role) => {
                    const isSelected = allowedRoles.includes(role)
                    return (
                      <div
                        key={role}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all',
                          isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30 hover:bg-muted/30'
                        )}
                        onClick={() => toggleRole(role)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <div>
                            <span className="text-sm font-medium">{ROLE_LABELS[role]}</span>
                            <span className="text-xs text-muted-foreground mr-2">(مستوى {ROLE_HIERARCHY[role]})</span>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn('text-[10px]', isSelected && 'border-primary text-primary')}>
                          {role}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">الأدوار المختارة</Label>
                <div className="flex flex-wrap gap-2">
                  {allowedRoles.length === 0 ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> لم يتم اختيار أي دور
                    </span>
                  ) : (
                    allowedRoles.map((role) => (
                      <Badge key={role} variant="default" className="gap-1 cursor-pointer hover:bg-primary/80" onClick={() => toggleRole(role)}>
                        {ROLE_LABELS[role]}
                        <X className="w-3 h-3" />
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ===== SETTINGS TAB ===== */}
            <TabsContent value="settings" className="mt-0 p-6 space-y-5">
              <Card className="border shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <Label htmlFor="deadline" className="flex items-center gap-2 text-xs font-medium">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    موعد انتهاء التقديم
                  </Label>
                  <Input id="deadline" type="datetime-local" value={submissionDeadline} onChange={e => setSubmissionDeadline(e.target.value)} className="h-10" />
                  <p className="text-[10px] text-muted-foreground">اتركه فارغاً إذا لم يكن هناك موعد نهائي</p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-xs font-medium">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      نموذج متكرر
                    </Label>
                    <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                  </div>
                  {isRecurring && (
                    <Select value={recurringSchedule} onValueChange={setRecurringSchedule}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RECURRING_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label_ar}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    إعدادات الإشعارات
                  </Label>
                  <div className="space-y-3 mr-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notif_submit" className="text-xs text-muted-foreground">إشعار عند التقديم</Label>
                      <Switch id="notif_submit" checked={notifyOnSubmit} onCheckedChange={setNotifyOnSubmit} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notif_review" className="text-xs text-muted-foreground">إشعار عند المراجعة</Label>
                      <Switch id="notif_review" checked={notifyOnReview} onCheckedChange={setNotifyOnReview} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isEdit && (
                <Card className="border bg-muted/30">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-muted-foreground">الإصدار:</span> <span className="font-medium">v{form.version}</span></div>
                      <div><span className="text-muted-foreground">آخر تحديث:</span> <span className="font-medium">{form.updated_at?.split('T')[0]}</span></div>
                      <div><span className="text-muted-foreground">تاريخ الإنشاء:</span> <span className="font-medium">{form.created_at?.split('T')[0]}</span></div>
                      <div><span className="text-muted-foreground">المعرف:</span> <span className="font-mono text-[10px]">{form.id.slice(0, 12)}…</span></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t bg-muted/10 flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10">
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} className="flex-1 h-10 gap-2 font-medium">
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إنشاء النموذج'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
