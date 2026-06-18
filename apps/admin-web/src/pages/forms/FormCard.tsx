import { FileText, Edit, Trash2, Database, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCampaign } from '@/lib/campaign-context'
import { cn } from '@/lib/utils'
import { parseFormSchema } from './types'
import type { Form } from '@/types/database'

export function FormCard({ form, submissionCount, onEdit, onDelete, onData }: {
  form: Form
  submissionCount?: number
  onEdit?: () => void
  onDelete?: () => void
  onData: () => void
}) {
  const { getCampaign } = useCampaign()
  const campaignOption = getCampaign(form.campaign_type)
  const schema = parseFormSchema(form.schema)
  const fieldCount = schema.sections.reduce((sum, s) => sum + s.fields.length, 0)
  const sectionCount = schema.sections.length

  return (
    <Card className={cn(
      'group hover:shadow-lg transition-all duration-200 border-0 shadow-md relative overflow-hidden',
      !form.is_active && 'opacity-60'
    )}>
      <div className={cn('absolute top-0 left-0 right-0 h-1', form.is_active ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gray-300')} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {campaignOption && <span className="text-lg">{campaignOption.icon}</span>}
              <CardTitle className="text-base font-heading truncate">{form.title_ar}</CardTitle>
            </div>
            {form.title_en && (
              <p className="text-xs text-muted-foreground truncate">{form.title_en}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <Button variant="ghost" size="icon-sm" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onEdit}>
                <Edit className="w-3.5 h-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={onDelete}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {form.description_ar && (
          <p className="text-xs text-muted-foreground line-clamp-2">{form.description_ar}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px] gap-1">
            <FileText className="w-3 h-3" /> {fieldCount} حقل
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1">
            <Settings className="w-3 h-3" /> {sectionCount} قسم
          </Badge>
          {submissionCount !== undefined && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Database className="w-3 h-3" /> {submissionCount} إرسالية
            </Badge>
          )}
          {!form.is_active && (
            <Badge variant="secondary" className="text-[10px]">غير نشط</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={onData}>
            <Database className="w-3.5 h-3.5" /> عرض البيانات
          </Button>
          {campaignOption && (
            <Badge variant="secondary" className="text-[10px] px-2">
              {campaignOption.icon} {campaignOption.labelAr}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
