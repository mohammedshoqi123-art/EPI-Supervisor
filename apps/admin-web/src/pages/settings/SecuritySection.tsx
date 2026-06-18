import { useState } from 'react'
import { Shield, Clock, Lock, Key, Wifi, AlertTriangle, Eye, EyeOff, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PASSWORD_MIN_LENGTHS, generateId } from './helpers'
import { cn } from '@/lib/utils'
import type { SettingsState, IPEntry } from './helpers'

interface Props {
  state: SettingsState
  update: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
}

export function SecuritySection({ state, update }: Props) {
  const [newIP, setNewIP] = useState('')
  const [newIPLabel, setNewIPLabel] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleAddIP = () => {
    if (!newIP.trim()) return
    update('ipWhitelist', [...state.ipWhitelist, { id: generateId(), address: newIP.trim(), label: newIPLabel.trim() || newIP.trim() }])
    setNewIP('')
    setNewIPLabel('')
  }

  const handleRemoveIP = (id: string) => {
    update('ipWhitelist', state.ipWhitelist.filter((ip: IPEntry) => ip.id !== id))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Shield className="w-5 h-5" />
            الأمان والحماية
          </CardTitle>
          <CardDescription>إعدادات الحماية والصلاحيات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session & Rate Limiting */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              الجلسة والتحكم بالطلبات
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>مهلة الجلسة</Label>
                  <span className="text-sm font-mono text-primary">{state.sessionTimeout} دقيقة</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={480}
                  step={5}
                  value={state.sessionTimeout}
                  onChange={(e) => update('sessionTimeout', Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>5 د</span><span>4 ساعات</span><span>8 ساعات</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>حد الطلبات (لكل دقيقة)</Label>
                <Input type="number" min="1" max="1000" value={state.rateLimit} onChange={(e) => update('rateLimit', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>الحد الأقصى لمحاولات تسجيل الدخول</Label>
                <Input type="number" min="3" max="20" value={state.maxLoginAttempts} onChange={(e) => update('maxLoginAttempts', e.target.value)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* 2FA */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">المصادقة الثنائية (2FA)</p>
                <p className="text-xs text-muted-foreground">تطلب رمز إضافي عند تسجيل الدخول</p>
              </div>
            </div>
            <Switch checked={state.twoFactor} onCheckedChange={(v) => update('twoFactor', v)} />
          </div>

          <Separator />

          {/* Password Policy */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Key className="w-4 h-4" />
              سياسة كلمة المرور
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>الحد الأدنى لطول كلمة المرور</Label>
                <Select value={state.minPasswordLength} onValueChange={(v) => update('minPasswordLength', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PASSWORD_MIN_LENGTHS.map(l => (
                      <SelectItem key={l} value={l}>{l} حرف</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">تطلب رموز خاصة</p>
                  <p className="text-xs text-muted-foreground">!@#$%^&amp;*</p>
                </div>
                <Switch checked={state.requireSpecialChars} onCheckedChange={(v) => update('requireSpecialChars', v)} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">تطلب أرقام</p>
                  <p className="text-xs text-muted-foreground">0-9</p>
                </div>
                <Switch checked={state.requireNumbers} onCheckedChange={(v) => update('requireNumbers', v)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* IP Whitelist */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              قائمة IPs المسموحة
            </h4>
            <div className="flex gap-2">
              <Input placeholder="عنوان IP" value={newIP} onChange={(e) => setNewIP(e.target.value)} className="flex-1" />
              <Input placeholder="الوصف (اختياري)" value={newIPLabel} onChange={(e) => setNewIPLabel(e.target.value)} className="flex-1" />
              <Button variant="outline" onClick={handleAddIP} disabled={!newIP.trim()}>إضافة</Button>
            </div>
            {state.ipWhitelist.length > 0 && (
              <div className="space-y-2">
                {state.ipWhitelist.map((ip: IPEntry) => (
                  <div key={ip.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px]">{ip.address}</Badge>
                      <span className="text-xs text-muted-foreground">{ip.label}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveIP(ip.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {state.ipWhitelist.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                لا توجد عناوين IP مقيدة — الجميع مسموح بالوصول
              </p>
            )}
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">إعدادات متقدمة</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  تغيير إعدادات الأمان قد يؤثر على جميع المستخدمين. تأكد من إخطار الفريق قبل التعديل.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
