import { useState } from 'react'
import {
  Bell, Mail, AlertTriangle, ClipboardList, Clock, Volume2, VolumeX,
  SlidersHorizontal, ChevronDown, ChevronUp, Eye, EyeOff,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { SettingsState, SMTPConfig } from './helpers'

interface Props {
  state: SettingsState
  update: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
}

export function NotificationSection({ state, update }: Props) {
  const [expandedSmtp, setExpandedSmtp] = useState(false)
  const [showSmtpPass, setShowSmtpPass] = useState(false)

  const updateSmtp = (field: keyof SMTPConfig, value: string) => {
    update('smtpConfig', { ...state.smtpConfig, [field]: value })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Bell className="w-5 h-5" />
            الإشعارات
          </CardTitle>
          <CardDescription>إدارة التنبيهات والتنبيهات التلقائية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle Notifications */}
          {[
            { label: 'إشعارات البريد', desc: 'إرسال إشعارات عبر البريد الإلكتروني', icon: Mail, checked: state.emailNotifs, key: 'emailNotifs' as const },
            { label: 'الإشعارات الفورية', desc: 'تنبيهات فورية في المتصفح', icon: Bell, checked: state.pushNotifs, key: 'pushNotifs' as const },
            { label: 'تنبيهات النواقص الحرجة', desc: 'تنبيه فوري عند وجود نقص حرج', icon: AlertTriangle, checked: state.criticalAlerts, key: 'criticalAlerts' as const },
            { label: 'تنبيهات قلة الإرساليات', desc: 'تنبيه عند انخفاض عدد الإرساليات', icon: ClipboardList, checked: state.lowSubmissionAlerts, key: 'lowSubmissionAlerts' as const },
            { label: 'التقرير اليومي', desc: 'إرسال ملخص يومي تلقائي', icon: Clock, checked: state.dailyReport, key: 'dailyReport' as const },
            { label: 'التقرير الأسبوعي', desc: 'إرسال ملخص أسبوعي تلقائي', icon: Clock, checked: state.weeklyReport, key: 'weeklyReport' as const },
            { label: 'صوت الإشعار', desc: 'تشغيل صوت عند وصول إشعار', icon: state.notificationSound ? Volume2 : VolumeX, checked: state.notificationSound, key: 'notificationSound' as const },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Switch checked={item.checked} onCheckedChange={(v) => update(item.key, v)} />
              </div>
            )
          })}

          <Separator />

          {/* Alert Thresholds */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              عتبات التنبيه
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>عتبة النواقص الحرجة (عدد)</Label>
                <Input type="number" min="1" max="100" value={state.criticalThreshold} onChange={(e) => update('criticalThreshold', e.target.value)} />
                <p className="text-[10px] text-muted-foreground">تنبيه عند وصول عدد النواقص الحرجة لهذا الحد</p>
              </div>
              <div className="space-y-2">
                <Label>عتبة قلة الإرساليات (عدد/يوم)</Label>
                <Input type="number" min="1" max="500" value={state.lowSubmissionThreshold} onChange={(e) => update('lowSubmissionThreshold', e.target.value)} />
                <p className="text-[10px] text-muted-foreground">تنبيه عند انخفاض الإرساليات اليومية عن هذا الحد</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* SMTP Config */}
          <div className="space-y-4">
            <button
              onClick={() => setExpandedSmtp(!expandedSmtp)}
              className="flex items-center justify-between w-full text-sm font-medium hover:text-primary transition-colors"
            >
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                إعدادات SMTP للبريد
              </span>
              {expandedSmtp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSmtp && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 animate-fade-in">
                <div className="space-y-2">
                  <Label>خادم SMTP</Label>
                  <Input value={state.smtpConfig.host} onChange={(e) => updateSmtp('host', e.target.value)} placeholder="smtp.example.com" />
                </div>
                <div className="space-y-2">
                  <Label>المنفذ</Label>
                  <Input type="number" value={state.smtpConfig.port} onChange={(e) => updateSmtp('port', e.target.value)} placeholder="587" />
                </div>
                <div className="space-y-2">
                  <Label>اسم المستخدم</Label>
                  <Input value={state.smtpConfig.user} onChange={(e) => updateSmtp('user', e.target.value)} placeholder="user@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      type={showSmtpPass ? 'text' : 'password'}
                      value={state.smtpConfig.pass}
                      onChange={(e) => updateSmtp('pass', e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>بريد المرسل</Label>
                  <Input type="email" value={state.smtpConfig.fromAddress} onChange={(e) => updateSmtp('fromAddress', e.target.value)} placeholder="noreply@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>اسم المرسل</Label>
                  <Input value={state.smtpConfig.fromName} onChange={(e) => updateSmtp('fromName', e.target.value)} placeholder="EPI Supervisor" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
