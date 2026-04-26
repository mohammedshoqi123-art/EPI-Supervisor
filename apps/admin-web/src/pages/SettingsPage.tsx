import { useState } from 'react'
import {
  Settings, Shield, Database, Bell, Palette, Server, Save,
  CheckCircle2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { cn } from '@/lib/utils'
import { isConfigured } from '@/lib/supabase'
import {
  GeneralSection,
  SecuritySection,
  NotificationSection,
  AppearanceSection,
  DataSection,
  SystemSection,
  useSettings,
} from './settings'

const sections = [
  { id: 'general', icon: Settings, title: 'عام', description: 'الإعدادات الأساسية للنظام' },
  { id: 'security', icon: Shield, title: 'الأمان', description: 'إعدادات الحماية والصلاحيات' },
  { id: 'notifications', icon: Bell, title: 'الإشعارات', description: 'إدارة التنبيهات والتنبيهات' },
  { id: 'appearance', icon: Palette, title: 'المظهر', description: 'تخصيص واجهة النظام' },
  { id: 'data', icon: Database, title: 'البيانات', description: 'إدارة النسخ الاحتياطي والتصدير' },
  { id: 'system', icon: Server, title: 'النظام', description: 'معلومات النظام والحالة' },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general')
  const {
    state, update, saved, handleSave,
    systemInfo, loadSystemInfo,
    exportState, setExportState,
    importState, setImportState,
    backupState, setBackupState,
    clearState, setClearState,
    importFullDataRef,
  } = useSettings()

  return (
    <div className="page-enter">
      <Header title="الإعدادات" subtitle="تكوين النظام والخصوصية" />

      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ═══ Sidebar Navigation ═══ */}
          <div className="lg:w-64 shrink-0">
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {sections.map((s) => {
                    const Icon = s.icon
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-right',
                          activeSection === s.id
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium block">{s.title}</span>
                          <span className={cn(
                            'text-[11px] block truncate',
                            activeSection === s.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          )}>{s.description}</span>
                        </div>
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* System Status Card */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-heading">حالة النظام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Supabase</span>
                  <Badge variant={isConfigured ? 'default' : 'destructive'} className="text-[10px]">
                    {isConfigured ? 'متصل' : 'غير مُعدّ'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">الإصدار</span>
                  <span className="font-mono text-xs">{systemInfo.version}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">الحالة</span>
                  <Badge
                    variant="outline"
                    className={cn('text-[10px]', {
                      'border-emerald-500 text-emerald-600': systemInfo.apiStatus === 'online',
                      'border-red-500 text-red-600': systemInfo.apiStatus === 'offline',
                      'border-amber-500 text-amber-600': systemInfo.apiStatus === 'checking',
                    })}
                  >
                    {systemInfo.apiStatus === 'online' ? 'يعمل' : systemInfo.apiStatus === 'checking' ? '...' : 'متوقف'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ Main Content ═══ */}
          <div className="flex-1 space-y-6 min-w-0">
            {activeSection === 'general' && <GeneralSection state={state} update={update} />}
            {activeSection === 'security' && <SecuritySection state={state} update={update} />}
            {activeSection === 'notifications' && <NotificationSection state={state} update={update} />}
            {activeSection === 'appearance' && <AppearanceSection state={state} update={update} />}
            {activeSection === 'data' && (
              <DataSection
                exportState={exportState} setExportState={setExportState}
                importState={importState} setImportState={setImportState}
                backupState={backupState} setBackupState={setBackupState}
                clearState={clearState} setClearState={setClearState}
                importFullDataRef={importFullDataRef}
                systemInfo={systemInfo} appName={state.appName} loadSystemInfo={loadSystemInfo}
              />
            )}
            {activeSection === 'system' && <SystemSection systemInfo={systemInfo} loadSystemInfo={loadSystemInfo} />}

            {/* ═══ Save Button ═══ */}
            <div className="flex items-center justify-end gap-3 sticky bottom-4">
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg bg-background border shadow-lg transition-all',
                saved ? 'opacity-100' : 'opacity-0'
              )}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-emerald-600 font-medium">تم الحفظ بنجاح</span>
              </div>
              <Button onClick={handleSave} className="gap-2 shadow-lg">
                <Save className="w-4 h-4" />
                حفظ الإعدادات
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
