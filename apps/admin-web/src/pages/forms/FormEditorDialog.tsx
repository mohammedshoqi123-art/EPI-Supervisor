import { useState } from 'react'
import {
  Plus, Edit, Trash2, Loader2, Type, Hash, ListChecks, Calendar, Clock,
  MapPin, Camera, Phone, ArrowUp, ArrowDown, ToggleLeft, Check,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useCreateForm, useUpdateForm } from '@/hooks/useApi'
import { useCampaign } from '@/lib/campaign-context'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import {
  FIELD_TYPE_LABELS, generateId, parseFormSchema,
  type FormField, type FormFieldType, type FormSection, type FormSchema
} from './types'
import { FieldEditorDialog } from './FieldEditorDialog'
import type { Form } from '@/types/database'

const FIELD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  text: Type, textarea: Type, number: Hash, phone: Phone, email: Type,
  select: ListChecks, multiselect: ListChecks, yesno: ToggleLeft,
  date: Calendar, time: Clock, gps: MapPin, photo: Camera,
  governorate: MapPin, district: MapPin, health_facility: MapPin,
}

export function FormEditorDialog({ open, onOpenChange, form, onSuccess }: {
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
          title_ar: titleAr, title_en: titleEn || undefined,
          description_ar: descriptionAr || undefined,
          is_active: isActive, campaign_type: campaignType,
          requires_gps: requiresGps, requires_photo: requiresPhoto,
          schema: schema as unknown as Record<string, unknown>,
        })
        toast({ title: 'تم التحديث', description: 'تم تحديث النموذج بنجاح' })
      } else {
        await createForm.mutateAsync({
          title_ar: titleAr, title_en: titleEn || '',
          description_ar: descriptionAr || undefined,
          is_active: isActive, campaign_type: campaignType,
          requires_gps: requiresGps, requires_photo: requiresPhoto,
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
    setSections([...sections, { id: generateId(), title_ar: `قسم جديد ${sections.length + 1}`, order: sections.length + 1, fields: [] }])
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
    newSections[sectionIdx] = { ...newSections[sectionIdx], fields: [...newSections[sectionIdx].fields, field] }
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
    newSections[sectionIdx] = { ...newSections[sectionIdx], fields: newSections[sectionIdx].fields.filter((_, i) => i !== fieldIdx) }
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
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{section.fields.length}</Badge>
                  </button>
                ))}
              </div>

              {/* Section Editor */}
              {currentSection && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input value={currentSection.title_ar} onChange={e => updateSectionTitle(activeSection, e.target.value)} placeholder="عنوان القسم" className="flex-1" />
                    <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => removeSection(activeSection)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {currentSection.fields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">لا توجد حقول في هذا القسم. أضف حقولاً جديدة.</div>
                    ) : (
                      currentSection.fields.map((field, fieldIdx) => {
                        const Icon = FIELD_ICONS[field.type] || Type
                        return (
                          <div key={field.key} className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
                            <div className="flex flex-col gap-0.5">
                              <button onClick={() => moveField(activeSection, fieldIdx, -1)} disabled={fieldIdx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button onClick={() => moveField(activeSection, fieldIdx, 1)} disabled={fieldIdx === currentSection.fields.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium truncate block">{field.label_ar}</span>
                              <span className="text-[10px] text-muted-foreground">{FIELD_TYPE_LABELS[field.type]}</span>
                            </div>
                            {field.required && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">مطلوب</Badge>}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => { setEditingField({ ...field, _fieldIdx: fieldIdx } as any); setShowFieldDialog(true) }}>
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive" onClick={() => removeField(activeSection, fieldIdx)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <Button variant="outline" className="w-full gap-2" onClick={() => { setEditingField(null); setShowFieldDialog(true) }}>
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
