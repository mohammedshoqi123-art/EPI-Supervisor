import { useState } from 'react'
import { Filter, Plus, Edit, Trash2, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { useCampaign, type CampaignOption, CAMPAIGN_ICONS, CAMPAIGN_COLORS } from '@/lib/campaign-context'

export function CampaignManagerCard() {
  const {
    allCampaigns, isCampaignVisible, toggleCampaignVisibility,
    addCampaign, updateCampaign, deleteCampaign,
  } = useCampaign()
  const { toast } = useToast()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editCampaign, setEditCampaign] = useState<CampaignOption | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CampaignOption | null>(null)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading flex items-center gap-2">
                <Filter className="w-5 h-5" />
                إدارة الأنشطة
              </CardTitle>
              <CardDescription>إضافة وتعديل وحذف الأنشطة، والتحكم بظهورها</CardDescription>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-3.5 h-3.5" /> نشاط جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {allCampaigns.map((option) => {
            const visible = isCampaignVisible(option.id)
            return (
              <div
                key={option.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 group',
                  visible
                    ? 'bg-card border-border shadow-sm'
                    : 'bg-muted/30 border-dashed opacity-60'
                )}
              >
                <span className="text-2xl shrink-0">{option.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{option.labelAr}</p>
                    {option.builtIn && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">system</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{option.labelEn}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={visible ? 'default' : 'secondary'} className="text-[10px]">
                    {visible ? 'ظاهر' : 'مخفي'}
                  </Badge>
                  <Switch checked={visible} onCheckedChange={() => toggleCampaignVisibility(option.id)} />
                  {!option.builtIn && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => setEditCampaign(option)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(option)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <p className="text-xs text-muted-foreground mt-2">
            💡 النشاط المخفي لن يظهر في فلتر الشريط الجانبي.
            النشاط المخصص يمكن حذفه، النظامي (system) يمكن إخفاؤه فقط.
          </p>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      {(showAddDialog || editCampaign) && (
        <CampaignFormDialog
          open={showAddDialog || !!editCampaign}
          onOpenChange={(open) => {
            if (!open) { setShowAddDialog(false); setEditCampaign(null) }
          }}
          campaign={editCampaign}
          onSave={(data) => {
            if (editCampaign) {
              updateCampaign(editCampaign.id, data)
              toast({ title: 'تم التحديث', description: `تم تحديث "${data.labelAr}"` })
            } else {
              addCampaign(data)
              toast({ title: 'تمت الإضافة', description: `تم إضافة "${data.labelAr}"` })
            }
            setShowAddDialog(false)
            setEditCampaign(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-destructive">حذف النشاط</DialogTitle>
              <DialogDescription>
                هل أنت متأكد من حذف <strong>{deleteTarget.icon} {deleteTarget.labelAr}</strong>؟
                <br />
                النماذج المرتبطة به ستبقى موجودة لكن ستفقد تصنيف النشاط.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
              <Button variant="destructive" onClick={() => {
                deleteCampaign(deleteTarget.id)
                toast({ title: 'تم الحذف', description: `تم حذف "${deleteTarget.labelAr}"` })
                setDeleteTarget(null)
              }}>
                حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// ═══ Campaign Form Dialog ═══
function CampaignFormDialog({ open, onOpenChange, campaign, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: CampaignOption | null
  onSave: (data: Pick<CampaignOption, 'labelAr' | 'labelEn' | 'icon' | 'color'>) => void
}) {
  const [labelAr, setLabelAr] = useState(campaign?.labelAr || '')
  const [labelEn, setLabelEn] = useState(campaign?.labelEn || '')
  const [icon, setIcon] = useState(campaign?.icon || '💉')
  const [color, setColor] = useState(campaign?.color || 'from-blue-500 to-blue-600')
  const { toast } = useToast()

  const isEdit = !!campaign

  const handleSave = () => {
    if (!labelAr.trim()) {
      toast({ title: 'خطأ', description: 'الاسم العربي مطلوب', variant: 'destructive' })
      return
    }
    onSave({ labelAr: labelAr.trim(), labelEn: labelEn.trim(), icon, color })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'تعديل النشاط' : 'إضافة نشاط جديد'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'عدّل معلومات النشاط' : 'أنشئ نشاط جديد يمكن ربط النماذج به'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="flex items-center justify-center p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="font-bold">{labelAr || 'اسم النشاط'}</p>
                <p className="text-xs text-muted-foreground">{labelEn || 'Activity Name'}</p>
              </div>
            </div>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الاسم (عربي) *</Label>
              <Input value={labelAr} onChange={e => setLabelAr(e.target.value)} placeholder="حملة جديدة" />
            </div>
            <div className="space-y-2">
              <Label>الاسم (إنجليزي)</Label>
              <Input value={labelEn} onChange={e => setLabelEn(e.target.value)} placeholder="New Campaign" dir="ltr" />
            </div>
          </div>

          {/* Icon picker */}
          <div className="space-y-2">
            <Label>الأيقونة</Label>
            <div className="flex flex-wrap gap-1.5 p-3 bg-muted/30 rounded-lg max-h-24 overflow-y-auto">
              {CAMPAIGN_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all',
                    icon === ic
                      ? 'bg-primary text-primary-foreground shadow-sm scale-110'
                      : 'hover:bg-muted'
                  )}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label>اللون</Label>
            <div className="flex flex-wrap gap-2">
              {CAMPAIGN_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'w-10 h-10 rounded-xl transition-all',
                    `bg-gradient-to-br ${c.value}`,
                    color === c.value
                      ? 'ring-2 ring-primary ring-offset-2 scale-110'
                      : 'hover:scale-105'
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSave} className="gap-2">
            <Check className="w-4 h-4" />
            {isEdit ? 'حفظ التعديلات' : 'إضافة النشاط'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
