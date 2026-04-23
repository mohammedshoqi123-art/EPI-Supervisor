import { FileText, MoreVertical, Edit, Eye, EyeOff, Trash2, Database, MapPin, Camera, Calendar, Tag, LayoutGrid, BarChart3, Send, Shield, AlertTriangle, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useUpdateForm } from '@/hooks/useApi'
import { ROLE_LABELS, type Form } from '@/types/database'
import { formatDate, formatNumber, cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { parseFormSchema, CATEGORY_LABELS, FIELD_TYPE_LABELS, RECURRING_OPTIONS, type FormCategory, type FormFieldType } from './types'

interface FormCardProps {
  form: Form
  submissionCount?: { total: number; submitted: number; draft: number }
  onEdit: () => void
  onPreview: () => void
  onDelete: () => void
  onManageData: () => void
}

export function FormCard({ form, submissionCount, onEdit, onPreview, onDelete, onManageData }: FormCardProps) {
  const updateForm = useUpdateForm()
  const { toast } = useToast()
  const schema = parseFormSchema(form.schema)
  const fieldCount = schema.fields?.length || 0
  const category = schema.category ? CATEGORY_LABELS[schema.category as FormCategory] : null

  return (
    <Card className={cn(
      'group relative overflow-hidden transition-all duration-300',
      'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
      'border-0 shadow-sm bg-gradient-to-br from-card to-card/80',
      !form.is_active && 'opacity-50 grayscale-[30%]'
    )}>
      {/* Top accent bar */}
      <div className={cn(
        'absolute top-0 inset-x-0 h-0.5',
        form.is_active
          ? 'bg-gradient-to-r from-primary via-primary/80 to-primary/60'
          : 'bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/10'
      )} />

      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors',
              form.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm leading-tight truncate">{form.title_ar}</h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5" dir="ltr">{form.title_en}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onManageData}>
                <Database className="w-4 h-4 ml-2" />إدارة البيانات
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="w-4 h-4 ml-2" />معاينة
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 ml-2" />تعديل
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                updateForm.mutate({ id: form.id, is_active: !form.is_active }, {
                  onSuccess: () => toast({ title: form.is_active ? 'تم إخفاء النموذج' : 'تم إظهار النموذج', variant: 'success' })
                })
              }}>
                {form.is_active ? <EyeOff className="w-4 h-4 ml-2" /> : <Eye className="w-4 h-4 ml-2" />}
                {form.is_active ? 'إخفاء النموذج' : 'إظهار النموذج'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4 ml-2" />حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {form.description_ar && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{form.description_ar}</p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{fieldCount} حقل</span>
          </div>
          {category && (
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', category.color)}>
              <Tag className="w-3 h-3 ml-0.5" />
              {category.ar}
            </Badge>
          )}
          {submissionCount && submissionCount.total > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-auto">
              <Send className="w-3.5 h-3.5" />
              <span>{formatNumber(submissionCount.total)}</span>
            </div>
          )}
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {form.requires_gps && (
            <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
              <MapPin className="w-3 h-3" /> GPS
            </Badge>
          )}
          {form.requires_photo && (
            <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
              <Camera className="w-3 h-3" />
              صور {form.max_photos > 0 ? `(≤${form.max_photos})` : ''}
            </Badge>
          )}
          {schema.is_recurring && (
            <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
              <Calendar className="w-3 h-3" />
              {RECURRING_OPTIONS.find(r => r.value === schema.recurring_schedule)?.label_ar || 'متكرر'}
            </Badge>
          )}
          {schema.submission_deadline && (
            <Badge variant="outline" className="text-[10px] gap-1 text-amber-600 border-amber-300 bg-amber-50 font-normal">
              <AlertTriangle className="w-3 h-3" />
              موعد نهائي
            </Badge>
          )}
          {form.campaign_type && (
            <Badge variant="outline" className={cn(
              'text-[10px] gap-1 font-normal',
              form.campaign_type === 'polio_campaign'
                ? 'text-blue-600 border-blue-200 bg-blue-50'
                : 'text-emerald-600 border-emerald-200 bg-emerald-50'
            )}>
              {form.campaign_type === 'polio_campaign' ? '💉 شلل أطفال' : '🏥 إيصالي'}
            </Badge>
          )}
        </div>

        {/* Field Types */}
        {fieldCount > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {[...new Set(schema.fields.map(f => f.type))].slice(0, 5).map((type) => {
              const ft = FIELD_TYPE_LABELS[type as FormFieldType]
              if (!ft) return null
              return (
                <span key={type} className="text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
                  {ft.ar}
                </span>
              )
            })}
            {[...new Set(schema.fields.map(f => f.type))].length > 5 && (
              <span className="text-[10px] text-muted-foreground">+{[...new Set(schema.fields.map(f => f.type))].length - 5}</span>
            )}
          </div>
        )}

        {/* Roles */}
        <div className="flex flex-wrap gap-1 mb-3">
          {form.allowed_roles.slice(0, 3).map((role) => (
            <Badge key={role} variant="outline" className="text-[10px] font-normal text-muted-foreground">
              <Shield className="w-3 h-3 ml-0.5" />
              {ROLE_LABELS[role]}
            </Badge>
          ))}
          {form.allowed_roles.length > 3 && (
            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
              +{form.allowed_roles.length - 3}
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="text-[11px] text-muted-foreground">{formatDate(form.created_at)}</span>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-[11px] font-medium',
              form.is_active ? 'text-emerald-600' : 'text-muted-foreground'
            )}>
              {form.is_active ? 'نشط' : 'معطّل'}
            </span>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => {
                updateForm.mutate({ id: form.id, is_active: checked }, {
                  onSuccess: () => toast({ title: checked ? 'تم التفعيل' : 'تم التعطيل', variant: 'success' })
                })
              }}
              className="scale-75 origin-right"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
