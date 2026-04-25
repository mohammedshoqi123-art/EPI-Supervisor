import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Search, X, FileText, Edit, Trash2, Database, Download, Upload,
  Eye, MoreVertical, ChevronDown, ChevronUp, GripVertical, Check, Loader2,
  Type, Hash, ListChecks, Calendar, Clock, MapPin, Camera, Phone,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, RefreshCw,
  Settings, Copy, ArrowUp, ArrowDown, ToggleLeft, ToggleRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Header } from '@/components/layout/header'
import { useForms, useFormSubmissionCounts, useCreateForm, useUpdateForm, useDeleteForm, useSubmissions, useAuth, useGovernorates } from '@/hooks/useApi'
import { useCampaign } from '@/lib/campaign-context'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { isConfigured } from '@/lib/supabase'
import { STATUS_LABELS, STATUS_COLORS, type SubmissionStatus, type FormSubmission } from '@/types/database'
import type { Form } from '@/types/database'
import {
  FIELD_TYPE_LABELS, generateId, parseFormSchema,
  type FormField, type FormFieldType, type FormSection, type FormSchema
} from './types'

const FIELD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  text: Type, textarea: Type, number: Hash, phone: Phone, email: Type,
  select: ListChecks, multiselect: ListChecks, yesno: ToggleLeft,
  date: Calendar, time: Clock, gps: MapPin, photo: Camera,
  governorate: MapPin, district: MapPin, health_facility: MapPin,
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function FormsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [editForm, setEditForm] = useState<Form | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteForm, setDeleteForm] = useState<Form | null>(null)
  const [dataForm, setDataForm] = useState<Form | null>(null)
  const { campaign, labelAr, isFiltered } = useCampaign()
  const { data: authData } = useAuth()
  const userRole = authData?.profile?.role
  const canManageForms = userRole === 'admin'
  const canDeleteData = userRole === 'admin'

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data: formsResult, isLoading, refetch } = useForms({ search: debouncedSearch || undefined, campaignType: campaign })
  const { data: submissionCounts } = useFormSubmissionCounts(campaign)

  const forms = formsResult?.data || []
  const totalCount = formsResult?.count || 0

  return (
    <div className="page-enter">
      <Header
        title="إدارة النماذج"
        subtitle={isFiltered ? `${totalCount} نموذج — ${labelAr}` : `${totalCount} نموذج`}
        onRefresh={() => refetch()}
      />

      <div className="p-6 space-y-5">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث في النماذج..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10 h-10"
            />
            {search && (
              <Button variant="ghost" size="icon-sm" className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearch('')}>
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          {canManageForms && (
            <Button className="gap-2 h-10 px-5 font-medium" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />
              نموذج جديد
            </Button>
          )}
        </div>

        {/* Forms Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="w-full h-40 rounded-xl" /></CardContent></Card>
            ))}
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-muted/50 flex items-center justify-center">
              <FileText className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold mb-1">{debouncedSearch ? 'لا توجد نتائج' : 'لا توجد نماذج بعد'}</h3>
            <p className="text-sm text-muted-foreground mb-2 max-w-sm mx-auto">
              {debouncedSearch
                ? 'جرّب البحث بكلمات مختلفة'
                : isFiltered
                  ? `لا توجد نماذج مربوطة بحملة "${labelAr}". جرّب تغيير الفلتر أو إنشاء نموذج جديد.`
                  : 'ابدأ بإنشاء نموذج جديد لجمع البيانات من الميدان'
              }
            </p>
            {!isConfigured && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg max-w-sm mx-auto">
                <p className="text-xs text-amber-700">⚠️ Supabase غير مُعدّ — تحقق من متغيرات البيئة</p>
              </div>
            )}
            {isFiltered && !debouncedSearch && (
              <Button variant="outline" className="gap-2 mt-3" onClick={() => {
                /* Reset campaign to all */
              }}>
                عرض جميع النماذج
              </Button>
            )}
            {!debouncedSearch && canManageForms && (
              <Button className="gap-2 h-10 px-6 mt-3" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> إنشاء نموذج
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {forms.map(form => (
              <FormCard
                key={form.id}
                form={form}
                submissionCount={submissionCounts?.[form.id]}
                onEdit={() => setEditForm(form)}
                onDelete={() => setDeleteForm(form)}
                onData={() => setDataForm(form)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showCreate && (
        <FormEditorDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onSuccess={() => { setShowCreate(false); refetch() }}
        />
      )}
      {editForm && (
        <FormEditorDialog
          open={!!editForm}
          onOpenChange={open => { if (!open) setEditForm(null) }}
          form={editForm}
          onSuccess={() => { setEditForm(null); refetch() }}
        />
      )}
      {deleteForm && (
        <DeleteDialog
          open={!!deleteForm}
          onOpenChange={open => { if (!open) setDeleteForm(null) }}
          form={deleteForm}
          onSuccess={() => { setDeleteForm(null); refetch() }}
        />
      )}
      {dataForm && (
        <FormDataDialog
          open={!!dataForm}
          onOpenChange={open => { if (!open) setDataForm(null) }}
          form={dataForm}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FORM CARD
// ═══════════════════════════════════════════════════════════════

function FormCard({ form, submissionCount, onEdit, onDelete, onData }: {
  form: Form
  submissionCount?: { total: number; submitted: number; draft: number }
  onEdit: () => void
  onDelete: () => void
  onData: () => void
}) {
  const { getCampaign } = useCampaign()
  const campaignOption = getCampaign(form.campaign_type)
  const schema = parseFormSchema(form.schema)
  const fieldCount = schema.sections.reduce((sum, s) => sum + s.fields.length, 0)
  const sectionCount = schema.sections.length

  return (
    <Card className="hover:shadow-lg transition-all border shadow-sm group">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
              form.is_active ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
            )}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{form.title_ar}</h3>
              {form.title_en && (
                <p className="text-xs text-muted-foreground truncate mt-0.5" dir="ltr">{form.title_en}</p>
              )}
            </div>
            <div className={cn(
              'w-2.5 h-2.5 rounded-full shrink-0 mt-1',
              form.is_active ? 'bg-emerald-500' : 'bg-gray-300'
            )} />
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              {sectionCount} أقسام
            </span>
            <span className="flex items-center gap-1">
              <ListChecks className="w-3 h-3" />
              {fieldCount} حقل
            </span>
            {submissionCount && submissionCount.total > 0 && (
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                {submissionCount.total} تقديم
              </span>
            )}
          </div>
        </div>

        {/* Campaign badge */}
        <div className="px-5 pb-3">
          <Badge variant="secondary" className="text-[10px]">
            {campaignOption ? `${campaignOption.icon} ${campaignOption.labelAr}` : form.campaign_type}
          </Badge>
        </div>

        <Separator />

        {/* Actions */}
        <div className="px-3 py-2.5 flex items-center gap-1">
          <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs h-8" onClick={onEdit}>
            <Edit className="w-3.5 h-3.5" /> تعديل
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs h-8" onClick={onData}>
            <Database className="w-3.5 h-3.5" /> البيانات
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════
// FORM EDITOR DIALOG
// ═══════════════════════════════════════════════════════════════

function FormEditorDialog({ open, onOpenChange, form, onSuccess }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form?: Form
  onSuccess: () => void
}) {
  const isEdit = !!form
  const { toast } = useToast()
  const createForm = useCreateForm()
  const updateForm = useUpdateForm()
  const { allCampaigns } = useCampaign()

  const initialSchema = form ? parseFormSchema(form.schema) : { sections: [] }

  const [titleAr, setTitleAr] = useState(form?.title_ar || '')
  const [titleEn, setTitleEn] = useState(form?.title_en || '')
  const [descriptionAr, setDescriptionAr] = useState(form?.description_ar || '')
  const [isActive, setIsActive] = useState(form?.is_active ?? true)
  const [campaignType, setCampaignType] = useState(form?.campaign_type || 'polio_campaign')
  const [requiresGps, setRequiresGps] = useState(form?.requires_gps || false)
  const [requiresPhoto, setRequiresPhoto] = useState(form?.requires_photo || false)
  const [sections, setSections] = useState<FormSection[]>(
    initialSchema.sections.length > 0 ? initialSchema.sections : [
      { id: generateId(), title_ar: 'المعلومات العامة', order: 1, fields: [] }
    ]
  )
  const [activeSection, setActiveSection] = useState(0)
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [showFieldDialog, setShowFieldDialog] = useState(false)

  const saving = createForm.isPending || updateForm.isPending

  const handleSave = async () => {
    if (!titleAr.trim()) {
      toast({ title: 'خطأ', description: 'عنوان النموذج مطلوب', variant: 'destructive' })
      return
    }
    if (sections.length === 0) {
      toast({ title: 'خطأ', description: 'يجب إضافة قسم واحد على الأقل', variant: 'destructive' })
      return
    }

    const schema: FormSchema = {
      sections: sections.map((s, i) => ({ ...s, order: i + 1 })),
      version: form?.version || 1,
    }

    try {
      if (isEdit) {
        await updateForm.mutateAsync({
          id: form!.id,
          title_ar: titleAr,
          title_en: titleEn || undefined,
          description_ar: descriptionAr || undefined,
          is_active: isActive,
          campaign_type: campaignType,
          requires_gps: requiresGps,
          requires_photo: requiresPhoto,
          schema: schema as unknown as Record<string, unknown>,
        })
        toast({ title: 'تم التحديث', description: 'تم تحديث النموذج بنجاح' })
      } else {
        await createForm.mutateAsync({
          title_ar: titleAr,
          title_en: titleEn || '',
          description_ar: descriptionAr || undefined,
          is_active: isActive,
          campaign_type: campaignType,
          requires_gps: requiresGps,
          requires_photo: requiresPhoto,
          schema: schema as unknown as Record<string, unknown>,
          allowed_roles: ['data_entry', 'district', 'governorate', 'central', 'admin'],
        })
        toast({ title: 'تم الإنشاء', description: 'تم إنشاء النموذج بنجاح' })
      }
      onSuccess()
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message || 'فشل حفظ النموذج', variant: 'destructive' })
    }
  }

  const addSection = () => {
    const newSection: FormSection = {
      id: generateId(),
      title_ar: `قسم جديد ${sections.length + 1}`,
      order: sections.length + 1,
      fields: [],
    }
    setSections([...sections, newSection])
    setActiveSection(sections.length)
  }

  const removeSection = (idx: number) => {
    if (sections.length <= 1) {
      toast({ title: 'تنبيه', description: 'يجب إبقاء قسم واحد على الأقل', variant: 'destructive' })
      return
    }
    const newSections = sections.filter((_, i) => i !== idx)
    setSections(newSections)
    setActiveSection(Math.min(activeSection, newSections.length - 1))
  }

  const updateSectionTitle = (idx: number, title: string) => {
    const newSections = [...sections]
    newSections[idx] = { ...newSections[idx], title_ar: title }
    setSections(newSections)
  }

  const addField = (sectionIdx: number, field: FormField) => {
    const newSections = [...sections]
    newSections[sectionIdx] = {
      ...newSections[sectionIdx],
      fields: [...newSections[sectionIdx].fields, field],
    }
    setSections(newSections)
  }

  const updateField = (sectionIdx: number, fieldIdx: number, field: FormField) => {
    const newSections = [...sections]
    const fields = [...newSections[sectionIdx].fields]
    fields[fieldIdx] = field
    newSections[sectionIdx] = { ...newSections[sectionIdx], fields }
    setSections(newSections)
  }

  const removeField = (sectionIdx: number, fieldIdx: number) => {
    const newSections = [...sections]
    const fields = newSections[sectionIdx].fields.filter((_, i) => i !== fieldIdx)
    newSections[sectionIdx] = { ...newSections[sectionIdx], fields }
    setSections(newSections)
  }

  const moveField = (sectionIdx: number, fieldIdx: number, direction: -1 | 1) => {
    const newSections = [...sections]
    const fields = [...newSections[sectionIdx].fields]
    const newIdx = fieldIdx + direction
    if (newIdx < 0 || newIdx >= fields.length) return
    ;[fields[fieldIdx], fields[newIdx]] = [fields[newIdx], fields[fieldIdx]]
    newSections[sectionIdx] = { ...newSections[sectionIdx], fields }
    setSections(newSections)
  }

  const currentSection = sections[activeSection]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col w-[calc(100vw-2rem)] sm:w-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'تعديل النموذج' : 'إنشاء نموذج جديد'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'عدّل معلومات النموذج وأقسامه وحقوله' : 'أنشئ نموذج جديد لجمع البيانات من الميدان'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عنوان النموذج (عربي) *</Label>
                  <Input value={titleAr} onChange={e => setTitleAr(e.target.value)} placeholder="مثال: استمارة الإشراف" />
                </div>
                <div className="space-y-2">
                  <Label>عنوان النموذج (إنجليزي)</Label>
                  <Input value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="e.g. Supervision Form" dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} placeholder="وصف مختصر للنموذج" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>الحملة</Label>
                  <Select value={campaignType} onValueChange={setCampaignType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allCampaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.icon} {c.labelAr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label>نشط</Label>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={requiresGps} onCheckedChange={setRequiresGps} />
                    <Label className="text-xs">GPS</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={requiresPhoto} onCheckedChange={setRequiresPhoto} />
                    <Label className="text-xs">صور</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sections & Fields */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">أقسام النموذج ({sections.length})</CardTitle>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={addSection}>
                  <Plus className="w-3.5 h-3.5" /> إضافة قسم
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Section Tabs */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                {sections.map((section, idx) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(idx)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                      activeSection === idx
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    )}
                  >
                    <span>{section.title_ar}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {section.fields.length}
                    </Badge>
                  </button>
                ))}
              </div>

              {/* Section Editor */}
              {currentSection && (
                <div className="space-y-4">
                  {/* Section Title */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={currentSection.title_ar}
                      onChange={e => updateSectionTitle(activeSection, e.target.value)}
                      placeholder="عنوان القسم"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() => removeSection(activeSection)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Fields List */}
                  <div className="space-y-2">
                    {currentSection.fields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        لا توجد حقول في هذا القسم. أضف حقولاً جديدة.
                      </div>
                    ) : (
                      currentSection.fields.map((field, fieldIdx) => {
                        const Icon = FIELD_ICONS[field.type] || Type
                        return (
                          <div
                            key={field.key}
                            className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                          >
                            <div className="flex flex-col gap-0.5">
                              <button onClick={() => moveField(activeSection, fieldIdx, -1)} disabled={fieldIdx === 0}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button onClick={() => moveField(activeSection, fieldIdx, 1)}
                                disabled={fieldIdx === currentSection.fields.length - 1}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium truncate block">{field.label_ar}</span>
                              <span className="text-[10px] text-muted-foreground">{FIELD_TYPE_LABELS[field.type]}</span>
                            </div>
                            {field.required && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">مطلوب</Badge>
                            )}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon-sm" className="h-7 w-7"
                                onClick={() => {
                                  setEditingField({ ...field, _fieldIdx: fieldIdx } as any)
                                  setShowFieldDialog(true)
                                }}>
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive"
                                onClick={() => removeField(activeSection, fieldIdx)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Add Field Button */}
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => { setEditingField(null); setShowFieldDialog(true) }}
                  >
                    <Plus className="w-4 h-4" /> إضافة حقل
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'حفظ التعديلات' : 'إنشاء النموذج'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Field Editor Dialog */}
      {showFieldDialog && currentSection && (
        <FieldEditorDialog
          open={showFieldDialog}
          onOpenChange={setShowFieldDialog}
          field={editingField}
          existingKeys={sections.flatMap(s => s.fields.map(f => f.key))}
          onSave={(field) => {
            if (editingField && (editingField as any)._fieldIdx !== undefined) {
              updateField(activeSection, (editingField as any)._fieldIdx, field)
            } else {
              addField(activeSection, field)
            }
            setShowFieldDialog(false)
          }}
        />
      )}
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════
// FIELD EDITOR DIALOG
// ═══════════════════════════════════════════════════════════════

function FieldEditorDialog({ open, onOpenChange, field, existingKeys, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  field: FormField | null
  existingKeys: string[]
  onSave: (field: FormField) => void
}) {
  const [key, setKey] = useState(field?.key || '')
  const [labelAr, setLabelAr] = useState(field?.label_ar || '')
  const [type, setType] = useState<FormFieldType>(field?.type || 'text')
  const [required, setRequired] = useState(field?.required || false)
  const [options, setOptions] = useState(field?.options?.join('\n') || '')
  const [defaultValue, setDefaultValue] = useState(field?.default || '')
  const { toast } = useToast()

  const handleSave = () => {
    if (!key.trim()) {
      toast({ title: 'خطأ', description: 'مفتاح الحقل مطلوب', variant: 'destructive' })
      return
    }
    if (!labelAr.trim()) {
      toast({ title: 'خطأ', description: 'عنوان الحقل مطلوب', variant: 'destructive' })
      return
    }
    // Check duplicate key (exclude current field if editing)
    const isDuplicate = existingKeys.includes(key) && key !== field?.key
    if (isDuplicate) {
      toast({ title: 'خطأ', description: 'مفتاح الحقل مكرر', variant: 'destructive' })
      return
    }

    const newField: FormField = {
      key: key.trim(),
      type,
      label_ar: labelAr.trim(),
      required,
      ...(options.trim() && ['select', 'multiselect'].includes(type)
        ? { options: options.split('\n').map(o => o.trim()).filter(Boolean) }
        : {}),
      ...(defaultValue.trim() ? { default: defaultValue.trim() } : {}),
    }
    onSave(newField)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{field ? 'تعديل الحقل' : 'إضافة حقل جديد'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>عنوان الحقل (عربي) *</Label>
              <Input value={labelAr} onChange={e => setLabelAr(e.target.value)} placeholder="مثال: اسم المشرف" />
            </div>
            <div className="space-y-2">
              <Label>المفتاح (Key) *</Label>
              <Input value={key} onChange={e => setKey(e.target.value)} placeholder="supervisor_name" dir="ltr" className="font-mono text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع الحقل</Label>
              <Select value={type} onValueChange={v => setType(v as FormFieldType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={required} onCheckedChange={setRequired} />
              <Label>مطلوب</Label>
            </div>
          </div>

          {['select', 'multiselect'].includes(type) && (
            <div className="space-y-2">
              <Label>الخيارات (سطر لكل خيار)</Label>
              <textarea
                value={options}
                onChange={e => setOptions(e.target.value)}
                placeholder={'خيار 1\nخيار 2\nخيار 3'}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                dir="rtl"
              />
            </div>
          )}

          {['text', 'number'].includes(type) && (
            <div className="space-y-2">
              <Label>القيمة الافتراضية</Label>
              <Input value={defaultValue} onChange={e => setDefaultValue(e.target.value)} placeholder="اختياري" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSave} className="gap-2">
            <Check className="w-4 h-4" />
            {field ? 'تحديث' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════
// DELETE DIALOG
// ═══════════════════════════════════════════════════════════════

function DeleteDialog({ open, onOpenChange, form, onSuccess }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: Form
  onSuccess: () => void
}) {
  const deleteForm = useDeleteForm()
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      await deleteForm.mutateAsync(form.id)
      toast({ title: 'تم الحذف', description: 'تم حذف النموذج بنجاح' })
      onSuccess()
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message || 'فشل حذف النموذج', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">حذف النموذج</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من حذف <strong>{form.title_ar}</strong>؟
            <br />
            هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteForm.isPending} className="gap-2">
            {deleteForm.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            حذف نهائي
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════
// FORM DATA DIALOG — View, Export, Import submissions
// ═══════════════════════════════════════════════════════════════

function FormDataDialog({ open, onOpenChange, form }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: Form
}) {
  const [activeTab, setActiveTab] = useState('data')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [editSubmission, setEditSubmission] = useState<FormSubmission | null>(null)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
  const [deleteSubTarget, setDeleteSubTarget] = useState<string | null>(null)
  const [govFilter, setGovFilter] = useState('all')
  const { toast } = useToast()
  const { data: authData } = useAuth()
  const canEdit = authData?.profile?.role === 'admin' || authData?.profile?.role === 'central'
  const canDelete = authData?.profile?.role === 'admin'
  const { data: governorates } = useGovernorates()

  const { data, isLoading, refetch } = useSubmissions({
    formId: form.id,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    governorateId: govFilter !== 'all' ? govFilter : undefined,
    page, pageSize: 20,
  })

  const submissions = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / 20)

  const handleExport = async () => {
    setExporting(true)
    try {
      const { data: allData } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_id', form.id)
        .order('created_at', { ascending: false })

      if (!allData || allData.length === 0) {
        toast({ title: 'تنبيه', description: 'لا توجد بيانات للتصدير' })
        return
      }

      // Convert to CSV with enriched data
      const headers = ['id', 'status', 'governorate_id', 'district_id', 'created_at', 'submitted_at', 'gps_lat', 'gps_lng', 'notes', 'data']
      const rows = allData.map(row =>
        headers.map(h => {
          let val = row[h]
          if (h === 'data') val = JSON.stringify(val || {})
          else if (val === null || val === undefined) val = ''
          return `"${String(val).replace(/"/g, '""')}"`
        }).join(',')
      )
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.title_ar}_export_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast({ title: 'تم التصدير', description: `تم تصدير ${allData.length} سجل` })
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.csv'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setImporting(true)
      try {
        const text = await file.text()
        let records: any[] = []

        if (file.name.endsWith('.json')) {
          records = JSON.parse(text)
        } else {
          // Simple CSV parse
          const lines = text.split('\n').filter(l => l.trim())
          if (lines.length < 2) throw new Error('الملف فارغ')
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
          records = lines.slice(1).map(line => {
            const values = line.match(/(".*?"|[^,]+)/g) || []
            const obj: Record<string, any> = {}
            headers.forEach((h, i) => {
              let val: any = (values[i] || '').replace(/^"|"$/g, '').replace(/""/g, '"')
              if (h === 'data') {
                try { val = JSON.parse(val) } catch { val = {} }
              }
              obj[h] = val
            })
            return obj
          })
        }

        if (records.length === 0) throw new Error('لا توجد سجلات في الملف')

        // Insert records
        const toInsert = records.map(r => ({
          form_id: form.id,
          data: r.data || r,
          status: r.status || 'submitted',
          submitted_at: r.submitted_at || new Date().toISOString(),
        }))

        const { error } = await supabase.from('form_submissions').insert(toInsert)
        if (error) throw error

        toast({ title: 'تم الاستيراد', description: `تم استيراد ${records.length} سجل بنجاح` })
        refetch()
      } catch (e: any) {
        toast({ title: 'خطأ في الاستيراد', description: e.message, variant: 'destructive' })
      } finally {
        setImporting(false)
      }
    }
    input.click()
  }

  const handleDeleteSubmission = async (id: string) => {
    setDeleteSubTarget(id)
  }

  const confirmDeleteSubmission = async () => {
    if (!deleteSubTarget) return
    try {
      const { error } = await supabase.from('form_submissions').update({ deleted_at: new Date().toISOString() }).eq('id', deleteSubTarget)
      if (error) throw error
      toast({ title: 'تم الحذف', description: 'تم حذف الإرسالية' })
      refetch()
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' })
    } finally {
      setDeleteSubTarget(null)
    }
  }

  const handleDeleteAll = async () => {
    setDeleteAllConfirm(true)
  }

  const confirmDeleteAll = async () => {
    try {
      const { error } = await supabase.from('form_submissions').update({ deleted_at: new Date().toISOString() }).eq('form_id', form.id).is('deleted_at', null)
      if (error) throw error
      toast({ title: 'تم الحذف', description: 'تم حذف جميع البيانات' })
      refetch()
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' })
    } finally {
      setDeleteAllConfirm(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: SubmissionStatus) => {
    try {
      const { error } = await supabase
        .from('form_submissions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      toast({ title: newStatus === 'submitted' ? 'تم الإرسال' : 'تم إرجاعها لمسودة', variant: 'success' })
      refetch()
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col w-[calc(100vw-2rem)] sm:w-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            بيانات: {form.title_ar}
          </DialogTitle>
          <DialogDescription>
            {totalCount} إرسالية — عرض وإدارة وتصدير البيانات
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="data" className="gap-1.5">
              <FileText className="w-4 h-4" /> البيانات
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-1.5">
              <Download className="w-4 h-4" /> تصدير / استيراد
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="flex-1 overflow-hidden flex flex-col mt-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="الحالة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="submitted">مُرسل</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                </SelectContent>
              </Select>
              <Select value={govFilter} onValueChange={v => { setGovFilter(v); setPage(1) }}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="المحافظة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المحافظات</SelectItem>
                  {governorates?.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 gap-1.5 text-xs">
                <RefreshCw className="w-3 h-3" /> تحديث
              </Button>
              <div className="flex-1" />
              {canDelete && totalCount > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDeleteAll} className="h-8 gap-1.5 text-xs">
                  <Trash2 className="w-3 h-3" /> حذف الكل
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">جاري التحميل...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد بيانات</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المُرسل</TableHead>
                      <TableHead>المحافظة</TableHead>
                      {(canEdit || canDelete) && <TableHead className="w-28">إجراءات</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub, i) => (
                      <TableRow key={sub.id} className="hover:bg-muted/30">
                        <TableCell className="text-muted-foreground text-xs">
                          {(page - 1) * 20 + i + 1}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-xs', STATUS_COLORS[sub.status as SubmissionStatus] || 'bg-gray-100 text-gray-700')}>
                            {STATUS_LABELS[sub.status as SubmissionStatus] || sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs" dir="ltr">
                          {new Date(sub.created_at).toLocaleString('ar-SA')}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>
                            <p className="font-medium">{sub.profiles?.full_name || 'غير معروف'}</p>
                            <p className="text-[10px] text-muted-foreground">{sub.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {sub.governorates?.name_ar || '—'}
                        </TableCell>
                        {(canEdit || canDelete) && (
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {canEdit && sub.status === 'draft' && (
                                <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-emerald-600"
                                  onClick={() => handleStatusChange(sub.id, 'submitted')} title="إرسال">
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {canEdit && sub.status === 'submitted' && (
                                <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-amber-600"
                                  onClick={() => handleStatusChange(sub.id, 'draft')} title="إرجاع لمسودة">
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button variant="ghost" size="icon-sm" className="text-destructive h-7 w-7"
                                  onClick={() => handleDeleteSubmission(sub.id)} title="حذف">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">
                  صفحة {page} من {totalPages} ({totalCount} سجل)
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon-sm" disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon-sm" disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="w-4 h-4" /> تصدير البيانات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  تصدير جميع بيانات هذا النموذج بصيغة CSV
                </p>
                <Button onClick={handleExport} disabled={exporting} className="gap-2">
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  تصدير CSV ({totalCount} سجل)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4" /> استيراد البيانات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  استيراد بيانات من ملف JSON أو CSV
                </p>
                <Button onClick={handleImport} disabled={importing} variant="outline" className="gap-2">
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  استيراد من ملف
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Delete Submission Confirmation */}
      <Dialog open={!!deleteSubTarget} onOpenChange={() => setDeleteSubTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> تأكيد الحذف
            </DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف هذه الإرسالية؟ لا يمكن التراجع.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteSubTarget(null)}>إلغاء</Button>
            <Button variant="destructive" size="sm" onClick={confirmDeleteSubmission} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation */}
      <Dialog open={deleteAllConfirm} onOpenChange={setDeleteAllConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> تأكيد حذف الكل
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف جميع بيانات هذا النموذج ({totalCount} إرسالية)؟ لا يمكن التراجع.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteAllConfirm(false)}>إلغاء</Button>
            <Button variant="destructive" size="sm" onClick={confirmDeleteAll} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> حذف {totalCount} إرسالية
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
