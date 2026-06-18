import { useRef } from 'react'
import { Palette, Sun, Moon, Monitor, Image, Upload, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/components/layout/theme-provider'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { PRIMARY_COLORS } from './helpers'
import type { SettingsState } from './helpers'

interface Props {
  state: SettingsState
  update: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
}

export function AppearanceSection({ state, update }: Props) {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'يرفق صورة فقط', variant: 'destructive' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'حجم الصورة يجب أن يكون أقل من 2 ميجا', variant: 'destructive' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => update('logoUrl', reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Palette className="w-5 h-5" />
            المظهر
          </CardTitle>
          <CardDescription>تخصيص شكل واجهة النظام</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="space-y-3">
            <Label>السمة</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light' as const, label: 'فاتح', icon: Sun },
                { value: 'dark' as const, label: 'داكن', icon: Moon },
                { value: 'system' as const, label: 'النظام', icon: Monitor },
              ].map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      'p-4 rounded-xl border-2 text-center transition-all',
                      theme === t.value
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Primary Color */}
          <div className="space-y-3">
            <Label>اللون الأساسي</Label>
            <div className="flex flex-wrap gap-3">
              {PRIMARY_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => update('primaryColor', c.value)}
                  className={cn(
                    'w-10 h-10 rounded-full border-2 transition-all hover:scale-110',
                    state.primaryColor === c.value ? 'border-foreground ring-2 ring-ring ring-offset-2' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
              <div className="relative w-10 h-10">
                <input
                  type="color"
                  value={state.primaryColor}
                  onChange={(e) => update('primaryColor', e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
                  style={{ backgroundColor: state.primaryColor }}
                >
                  <Palette className="w-4 h-4 text-white drop-shadow" />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Font Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>حجم الخط</Label>
              <span className="text-sm font-mono text-primary">{state.fontSize}px</span>
            </div>
            <input
              type="range"
              min={10}
              max={22}
              step={1}
              value={state.fontSize}
              onChange={(e) => update('fontSize', Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>صغير</span><span>متوسط</span><span>كبير</span>
            </div>
          </div>

          <Separator />

          {/* Density */}
          <div className="space-y-3">
            <Label>كثافة العرض</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'compact' as const, label: 'مضغوط', desc: 'عناصر أصغر' },
                { value: 'comfortable' as const, label: 'مريح', desc: 'متوازن' },
                { value: 'spacious' as const, label: 'واسع', desc: 'مساحات أكبر' },
              ].map(d => (
                <button
                  key={d.value}
                  onClick={() => update('density', d.value)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-center transition-all',
                    state.density === d.value
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  <span className="text-sm font-medium block">{d.label}</span>
                  <span className="text-[10px] text-muted-foreground">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Sidebar Position */}
          <div className="space-y-3">
            <Label>موضع الشريط الجانبي</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'right' as const, label: 'يمين (الافتراضي)' },
                { value: 'left' as const, label: 'يسار' },
              ].map(pos => (
                <button
                  key={pos.value}
                  onClick={() => update('sidebarPosition', pos.value)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-center transition-all text-sm',
                    state.sidebarPosition === pos.value
                      ? 'border-primary bg-primary/5 shadow-md font-medium'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Logo Upload */}
          <div className="space-y-3">
            <Label>شعار النظام</Label>
            <div className="flex items-center gap-4">
              {state.logoUrl ? (
                <div className="relative w-16 h-16 rounded-xl border overflow-hidden">
                  <img src={state.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  <button
                    onClick={() => update('logoUrl', '')}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                  <Image className="w-6 h-6 text-muted-foreground/40" />
                </div>
              )}
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  رفع شعار
                </Button>
                <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG — حد أقصى 2MB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
