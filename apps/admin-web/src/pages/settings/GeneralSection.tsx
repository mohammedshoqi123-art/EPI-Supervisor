import { Settings, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { TIMEZONES, DATE_FORMATS } from './helpers'
import { CampaignManagerCard } from './CampaignManagerCard'
import type { SettingsState } from './useSettings'

interface Props {
  state: SettingsState
  update: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
}

export function GeneralSection({ state, update }: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Settings className="w-5 h-5" />
            الإعدادات العامة
          </CardTitle>
          <CardDescription>الإعدادات الأساسية للتطبيق</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم التطبيق</Label>
              <Input value={state.appName} onChange={(e) => update('appName', e.target.value)} placeholder="اسم التطبيق" />
            </div>
            <div className="space-y-2">
              <Label>اللغة</Label>
              <Select value={state.language} onValueChange={(v) => update('language', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المنطقة الزمنية</Label>
              <Select value={state.timezone} onValueChange={(v) => update('timezone', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>تنسيق التاريخ</Label>
              <Select value={state.dateFormat} onValueChange={(v) => update('dateFormat', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>فترة المزامنة (دقائق)</Label>
              <Input type="number" min="1" max="120" value={state.syncInterval} onChange={(e) => update('syncInterval', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>فترة الحفظ التلقائي (ثانية)</Label>
              <Input type="number" min="5" max="300" value={state.autoSaveInterval} onChange={(e) => update('autoSaveInterval', e.target.value)} />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              إعدادات النماذج
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحالة الافتراضية للإرساليات</Label>
                <Select value={state.defaultSubmissionStatus} onValueChange={(v) => update('defaultSubmissionStatus', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="submitted">مرسلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CampaignManagerCard />
    </div>
  )
}
