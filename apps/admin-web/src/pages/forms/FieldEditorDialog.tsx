import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { FIELD_TYPE_LABELS, type FormField, type FormFieldType } from './types'

export function FieldEditorDialog({ open, onOpenChange, field, existingKeys, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  field: FormField | null
  existingKeys: string[]
  onSave: (field: FormField) => void
}) {
  const isEditing = !!(field as any)?._fieldIdx
  const originalKey = field?.key || ''

  const [key, setKey] = useState(field?.key || '')
  const [labelAr, setLabelAr] = useState(field?.label_ar || '')
  const [type, setType] = useState<FormFieldType>(field?.type || 'text')
  const [required, setRequired] = useState(field?.required || false)
  const [options, setOptions] = useState(field?.options?.join('\n') || '')
  const [defaultValue, setDefaultValue] = useState(field?.default || '')
  const { toast } = useToast()

  // Reset state when field changes (dialog reopens for different field)
  useEffect(() => {
    if (open) {
      setKey(field?.key || '')
      setLabelAr(field?.label_ar || '')
      setType(field?.type || 'text')
      setRequired(field?.required || false)
      setOptions(field?.options?.join('\n') || '')
      setDefaultValue(field?.default || '')
    }
  }, [open, field])

  const handleSave = () => {
    if (!key.trim()) {
      toast({ title: 'خطأ', description: 'مفتاح الحقل مطلوب', variant: 'destructive' })
      return
    }
    if (!labelAr.trim()) {
      toast({ title: 'خطأ', description: 'عنوان الحقل مطلوب', variant: 'destructive' })
      return
    }
    const isDuplicate = existingKeys.includes(key) && key !== originalKey
    if (isDuplicate) {
      toast({ title: 'خطأ', description: 'مفتاح الحقل مكرر', variant: 'destructive' })
      return
    }

    const newField: FormField = {
      key: key.trim(), type, label_ar: labelAr.trim(), required,
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
