import {
  Server, Info, Clock, HardDrive, Wifi, Database, Users,
  ClipboardList, FileText, PackageX, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { SystemInfo } from './useSettings'

interface Props {
  systemInfo: SystemInfo
  loadSystemInfo: () => void
}

export function SystemSection({ systemInfo, loadSystemInfo }: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Server className="w-5 h-5" />
            معلومات النظام
          </CardTitle>
          <CardDescription>حالة النظام والإحصائيات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'الإصدار', value: systemInfo.version, icon: Info },
              { label: 'وقت التشغيل', value: systemInfo.uptime || '--', icon: Clock },
              { label: 'التخزين', value: systemInfo.storageUsed, icon: HardDrive },
              {
                label: 'حالة API',
                value: systemInfo.apiStatus === 'online' ? 'متصل' : systemInfo.apiStatus === 'checking' ? 'جاري الفحص...' : 'غير متصل',
                icon: Wifi,
                color: systemInfo.apiStatus === 'online' ? 'text-emerald-600' : systemInfo.apiStatus === 'checking' ? 'text-amber-600' : 'text-red-600',
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="p-4 rounded-lg border bg-card">
                  <Icon className={cn('w-5 h-5 mb-2', item.color || 'text-muted-foreground')} />
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={cn('text-lg font-semibold mt-1', item.color)}>{item.value}</p>
                </div>
              )
            })}
          </div>

          <Separator />

          {/* Database Stats */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              إحصائيات قاعدة البيانات
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'المستخدمين', count: systemInfo.dbStats.profiles, icon: Users, color: 'bg-blue-500' },
                { label: 'إرساليات النماذج', count: systemInfo.dbStats.submissions, icon: ClipboardList, color: 'bg-emerald-500' },
                { label: 'النماذج', count: systemInfo.dbStats.forms, icon: FileText, color: 'bg-purple-500' },
                { label: 'النواقص', count: systemInfo.dbStats.shortages, icon: PackageX, color: 'bg-amber-500' },
              ].map((stat, i) => {
                const Icon = stat.icon
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', stat.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{stat.count.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={loadSystemInfo}>
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث المعلومات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
