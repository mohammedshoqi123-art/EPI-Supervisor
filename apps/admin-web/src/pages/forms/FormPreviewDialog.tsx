import { useState } from 'react'
import {
  Smartphone, FileText, MapPin, Camera, PenTool, QrCode, Send, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import type { Form } from '@/types/database'
import { parseFormSchema } from './types'

interface FormPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: Form
}

export function FormPreviewDialog({ open, onOpenChange, form }: FormPreviewDialogProps) {
  const schema = parseFormSchema(form.schema)
  const [values, setValues] = useState<Record<string, unknown>>({})

  const setValue = (fieldId: string, value: unknown) => {
    setValues(prev => ({ ...prev, [fieldId]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">معاينة النموذج</DialogTitle>
              <DialogDescription className="text-xs">كما سيظهر على الهاتف المحمول</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="bg-background border rounded-2xl overflow-hidden shadow-lg">
            {/* Mobile Header */}
            <div className="bg-gradient-to-l from-primary to-primary/80 p-5 text-center">
              <h3 className="font-bold text-lg text-primary-foreground">{form.title_ar}</h3>
              <p className="text-xs text-primary-foreground/70 mt-1" dir="ltr">{form.title_en}</p>
            </div>

            <div className="p-5 space-y-5">
              {/* Meta Badges */}
              <div className="flex flex-wrap gap-1.5">
                {form.requires_gps && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <MapPin className="w-3 h-3" /> سيتم تحديد الموقع
                  </Badge>
                )}
                {form.requires_photo && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Camera className="w-3 h-3" />
                    مرفق صور {form.max_photos > 0 && `(حتى ${form.max_photos})`}
                  </Badge>
                )}
              </div>

              {form.description_ar && (
                <p className="text-xs text-muted-foreground leading-relaxed">{form.description_ar}</p>
              )}

              <Separator />

              {/* Fields */}
              {schema.fields.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">لا توجد حقول في هذا النموذج</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {schema.fields.map((field) => {
                    const value = values[field.id]
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label className="text-sm flex items-center gap-1 font-medium">
                          {field.label_ar}
                          {field.required && <span className="text-destructive text-xs">*</span>}
                        </Label>

                        {field.type === 'text' && (
                          <Input
                            placeholder={field.placeholder_ar || 'أدخل النص...'}
                            value={(value as string) || ''}
                            onChange={(e) => setValue(field.id, e.target.value)}
                            className="h-10 text-sm"
                          />
                        )}

                        {field.type === 'number' && (
                          <Input
                            type="number"
                            placeholder={field.placeholder_ar || 'أدخل الرقم...'}
                            value={(value as string) || ''}
                            onChange={(e) => setValue(field.id, e.target.value)}
                            className="h-10 text-sm"
                            min={field.validation?.min}
                            max={field.validation?.max}
                          />
                        )}

                        {field.type === 'select' && (
                          <Select value={(value as string) || ''} onValueChange={(v) => setValue(field.id, v)}>
                            <SelectTrigger className="h-10 text-sm">
                              <SelectValue placeholder="اختر..." />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((opt, i) => (
                                <SelectItem key={i} value={opt.value}>{opt.label_ar}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {field.type === 'multi_select' && (
                          <div className="flex flex-wrap gap-2">
                            {field.options?.map((opt, i) => {
                              const selected = Array.isArray(value) && (value as string[]).includes(opt.value)
                              return (
                                <Badge
                                  key={i}
                                  variant={selected ? 'default' : 'outline'}
                                  className="cursor-pointer text-xs transition-all hover:scale-105"
                                  onClick={() => {
                                    const arr = Array.isArray(value) ? [...value as string[]] : []
                                    setValue(field.id, selected ? arr.filter(v => v !== opt.value) : [...arr, opt.value])
                                  }}
                                >
                                  {opt.label_ar}
                                </Badge>
                              )
                            })}
                          </div>
                        )}

                        {field.type === 'date' && (
                          <Input type="date" value={(value as string) || ''} onChange={(e) => setValue(field.id, e.target.value)} className="h-10 text-sm" />
                        )}

                        {field.type === 'time' && (
                          <Input type="time" value={(value as string) || ''} onChange={(e) => setValue(field.id, e.target.value)} className="h-10 text-sm" />
                        )}

                        {field.type === 'gps' && (
                          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <MapPin className="w-5 h-5 text-primary" />
                            <span className="text-xs text-muted-foreground">سيتم تحديد الموقع تلقائياً</span>
                          </div>
                        )}

                        {field.type === 'photo' && (
                          <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/30 transition-colors cursor-pointer">
                            <Camera className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                            <p className="text-xs text-muted-foreground">اضغط لالتقاط صورة</p>
                          </div>
                        )}

                        {field.type === 'signature' && (
                          <div className="border-2 border-dashed rounded-xl p-6 text-center bg-muted/20 hover:border-primary/30 transition-colors cursor-pointer">
                            <PenTool className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                            <p className="text-xs text-muted-foreground">اضغط للتوقيع</p>
                          </div>
                        )}

                        {field.type === 'barcode' && (
                          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border cursor-pointer hover:border-primary/30 transition-colors">
                            <QrCode className="w-5 h-5 text-primary" />
                            <span className="text-xs text-muted-foreground">اضغط لمسح الباركود</span>
                          </div>
                        )}

                        {field.placeholder_en && (
                          <p className="text-[10px] text-muted-foreground/70" dir="ltr">{field.placeholder_en}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Submit Button */}
              {schema.fields.length > 0 && (
                <>
                  <Separator />
                  <Button className="w-full h-11 gap-2 text-sm font-medium rounded-xl" disabled>
                    <Send className="w-4 h-4" />
                    إرسال النموذج
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full h-10">
            <X className="w-4 h-4 ml-2" />
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
