import { useState, useRef } from 'react'
import {
  Database, Download, Upload, Archive, Trash2, FileDown, FileUp,
  FileText, Loader2, CheckCircle2, AlertTriangle, RotateCcw, ListChecks,
  X, Check,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { supabase, isConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { EXPORTABLE_TABLES, dataToCSV, downloadFile } from './helpers'
import type { ExportState, ImportState, BackupState, ClearState } from './helpers'
import type { SystemInfo } from './useSettings'

interface Props {
  exportState: ExportState
  setExportState: React.Dispatch<React.SetStateAction<ExportState>>
  importState: ImportState
  setImportState: React.Dispatch<React.SetStateAction<ImportState>>
  backupState: BackupState
  setBackupState: React.Dispatch<React.SetStateAction<BackupState>>
  clearState: ClearState
  setClearState: React.Dispatch<React.SetStateAction<ClearState>>
  importFullDataRef: React.MutableRefObject<Record<string, unknown>[]>
  systemInfo: SystemInfo
  appName: string
  loadSystemInfo: () => void
}

export function DataSection({
  exportState, setExportState,
  importState, setImportState,
  backupState, setBackupState,
  clearState, setClearState,
  importFullDataRef,
  systemInfo, appName, loadSystemInfo,
}: Props) {
  const { toast } = useToast()
  const [activeDataTab, setActiveDataTab] = useState<'export' | 'import' | 'backup' | 'clear'>('export')
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [clearTableTarget, setClearTableTarget] = useState('')
  const [clearConfirmText, setClearConfirmText] = useState('')
  const restoreInputRef = useRef<HTMLInputElement>(null)

  // ── Export ──────────────────────────────────────────────────────────────
  const handleExport = async (table: string, format: 'csv' | 'json') => {
    if (!isConfigured) return
    setExportState({ loading: true, progress: 10, table, format })
    try {
      setExportState(s => ({ ...s, progress: 30 }))
      const { data, error } = await supabase.from(table as 'profiles').select('*').limit(10000)
      if (error) throw error
      if (!data || data.length === 0) throw new Error('لا توجد بيانات للتصدير')
      setExportState(s => ({ ...s, progress: 70 }))
      const ts = new Date().toISOString().split('T')[0]
      const cleanTable = table.replace(/[^a-zA-Z_]/g, '')
      if (format === 'json') {
        downloadFile(JSON.stringify(data, null, 2), `${cleanTable}-${ts}.json`, 'application/json')
      } else {
        downloadFile(dataToCSV(data), `${cleanTable}-${ts}.csv`, 'text/csv')
      }
      setExportState(s => ({ ...s, progress: 100 }))
      setTimeout(() => setExportState({ loading: false, progress: 0, table: '', format: 'json' }), 1500)
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'فشل التصدير', variant: 'destructive' })
      setExportState({ loading: false, progress: 0, table: '', format: 'json' })
    }
  }

  const handleExportAll = async (format: 'csv' | 'json') => {
    if (!isConfigured) return
    setExportState({ loading: true, progress: 5, table: 'all', format })
    try {
      const allData: Record<string, unknown[]> = {}
      const tables = EXPORTABLE_TABLES.map(t => t.key)
      for (let i = 0; i < tables.length; i++) {
        setExportState(s => ({ ...s, progress: 5 + Math.round((i / tables.length) * 80), table: tables[i] }))
        const { data } = await supabase.from(tables[i] as 'profiles').select('*').limit(10000)
        allData[tables[i]] = data || []
      }
      setExportState(s => ({ ...s, progress: 90 }))
      const ts = new Date().toISOString().split('T')[0]
      downloadFile(JSON.stringify(allData, null, 2), `epi-export-all-${ts}.json`, 'application/json')
      setExportState(s => ({ ...s, progress: 100 }))
      setTimeout(() => setExportState({ loading: false, progress: 0, table: '', format: 'json' }), 1500)
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'فشل التصدير الشامل', variant: 'destructive' })
      setExportState({ loading: false, progress: 0, table: '', format: 'json' })
    }
  }

  // ── Import ──────────────────────────────────────────────────────────────
  const handleImportFile = async (table: string, file: File) => {
    setImportState(s => ({ ...s, loading: true, progress: 10, table, preview: [] }))
    try {
      const text = await file.text()
      let parsed: Record<string, unknown>[] = []
      if (file.name.endsWith('.json')) {
        const raw = JSON.parse(text)
        parsed = Array.isArray(raw) ? raw : [raw]
      } else if (file.name.endsWith('.csv')) {
        const lines = text.trim().split('\n')
        if (lines.length < 2) throw new Error('ملف CSV فارغ أو غير صالح')
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        parsed = lines.slice(1).map(line => {
          const values = line.match(/("([^"]|"")*"|[^,]*)/g) || []
          const obj: Record<string, unknown> = {}
          headers.forEach((h, i) => {
            let val = (values[i] || '').trim()
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1).replace(/""/g, '"')
            obj[h] = val === '' ? null : val
          })
          return obj
        })
      } else {
        throw new Error('صيغة الملف غير مدعومة. استخدم JSON أو CSV')
      }
      if (!parsed.length) throw new Error('لا توجد بيانات في الملف')
      importFullDataRef.current = parsed
      setImportState(s => ({ ...s, progress: 50, preview: parsed.slice(0, 5), loading: false }))
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'فشل قراءة الملف', variant: 'destructive' })
      setImportState({ loading: false, progress: 0, table: '', preview: [], conflictStrategy: 'skip' })
      importFullDataRef.current = []
    }
  }

  const handleImportConfirm = async () => {
    const { table, conflictStrategy } = importState
    if (!table || !importFullDataRef.current.length || !isConfigured) return
    setImportState(s => ({ ...s, loading: true, progress: 60 }))
    try {
      const fullData = importFullDataRef.current
      setImportState(s => ({ ...s, progress: 70 }))
      if (conflictStrategy === 'overwrite') {
        const batchSize = 100
        for (let i = 0; i < fullData.length; i += batchSize) {
          const batch = fullData.slice(i, i + batchSize)
          const { error } = await supabase.from(table as 'profiles').upsert(batch, { onConflict: 'id' })
          if (error) throw error
          setImportState(s => ({ ...s, progress: 70 + Math.round(((i + batch.length) / fullData.length) * 25) }))
        }
      } else {
        let imported = 0
        for (const row of fullData) {
          try { await supabase.from(table as 'profiles').insert(row); imported++ } catch { /* skip duplicates */ }
          setImportState(s => ({ ...s, progress: 70 + Math.round((imported / fullData.length) * 25) }))
        }
      }
      setImportState(s => ({ ...s, progress: 100, loading: false }))
      toast({ title: 'تم استيراد البيانات بنجاح ✅', variant: 'success' })
      setTimeout(() => {
        setImportState({ loading: false, progress: 0, table: '', preview: [], conflictStrategy: 'skip' })
        importFullDataRef.current = []
      }, 2000)
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'فشل الاستيراد', variant: 'destructive' })
      setImportState(s => ({ ...s, loading: false, progress: 0 }))
    }
  }

  // ── Backup ──────────────────────────────────────────────────────────────
  const handleCreateBackup = async () => {
    if (!isConfigured) return
    setBackupState({ loading: true, progress: 5, phase: 'جاري تجهيز النسخة الاحتياطية...' })
    try {
      const tables = ['profiles', 'forms', 'form_submissions', 'supply_shortages', 'governorates', 'districts', 'notifications', 'audit_logs']
      const snapshot: Record<string, unknown[]> = {}
      for (let i = 0; i < tables.length; i++) {
        setBackupState({ loading: true, progress: 5 + Math.round((i / tables.length) * 85), phase: `جاري تصدير: ${tables[i]}` })
        const { data } = await supabase.from(tables[i] as 'profiles').select('*').limit(50000)
        snapshot[tables[i]] = data || []
      }
      setBackupState({ loading: true, progress: 95, phase: 'جاري حفظ الملف...' })
      const backup = {
        meta: { version: systemInfo.version, created_at: new Date().toISOString(), tables, app_name: appName },
        data: snapshot,
      }
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      downloadFile(JSON.stringify(backup, null, 2), `epi-backup-${ts}.json`, 'application/json')
      setBackupState({ loading: false, progress: 100, phase: 'تم إنشاء النسخة الاحتياطية بنجاح' })
      setTimeout(() => setBackupState({ loading: false, progress: 0, phase: '' }), 3000)
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'فشل إنشاء النسخة الاحتياطية', variant: 'destructive' })
      setBackupState({ loading: false, progress: 0, phase: '' })
    }
  }

  const handleRestoreBackup = async (file: File) => {
    if (!isConfigured) return
    try {
      const text = await file.text()
      const backup = JSON.parse(text)
      if (!backup.data || typeof backup.data !== 'object') throw new Error('ملف النسخة الاحتياطية غير صالح')
      const confirmMsg = `هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟\n\nتاريخ الإنشاء: ${backup.meta?.created_at || 'غير معروف'}\nالجداول: ${Object.keys(backup.data).join(', ')}\n\nسيتم استبدال البيانات الحالية.`
      if (!window.confirm(confirmMsg)) return
      setBackupState({ loading: true, progress: 5, phase: 'جاري استعادة النسخة الاحتياطية...' })
      const tables = Object.keys(backup.data)
      for (let i = 0; i < tables.length; i++) {
        const rows = backup.data[tables[i]]
        if (!Array.isArray(rows) || rows.length === 0) continue
        setBackupState({ loading: true, progress: 5 + Math.round((i / tables.length) * 90), phase: `جاري استعادة: ${tables[i]} (${rows.length} سجل)` })
        const batchSize = 100
        for (let j = 0; j < rows.length; j += batchSize) {
          const batch = rows.slice(j, j + batchSize)
          const { error } = await supabase.from(tables[i] as 'profiles').upsert(batch, { onConflict: 'id' })
          if (error) console.warn(`Restore warning for ${tables[i]}:`, error.message)
        }
      }
      setBackupState({ loading: false, progress: 100, phase: 'تمت الاستعادة بنجاح' })
      loadSystemInfo()
      setTimeout(() => setBackupState({ loading: false, progress: 0, phase: '' }), 3000)
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'فشل استعادة النسخة الاحتياطية', variant: 'destructive' })
      setBackupState({ loading: false, progress: 0, phase: '' })
    }
  }

  // ── Clear ───────────────────────────────────────────────────────────────
  const handleClearData = async () => {
    if (!isConfigured || clearConfirmText !== 'تأكيد') return
    const table = clearTableTarget
    setClearState({ loading: true, table, progress: 10 })
    setShowClearDialog(false)
    setClearConfirmText('')
    try {
      setClearState(s => ({ ...s, progress: 30 }))
      const { error } = await supabase.from(table as 'profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
      setClearState({ loading: false, table: '', progress: 100 })
      loadSystemInfo()
      setTimeout(() => setClearState({ loading: false, table: '', progress: 0 }), 2000)
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'فشل مسح البيانات', variant: 'destructive' })
      setClearState({ loading: false, table: '', progress: 0 })
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Database className="w-5 h-5" />
              إدارة البيانات
            </CardTitle>
            <CardDescription>النسخ الاحتياطي والتصدير والاستيراد</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data sub-tabs */}
            <div className="flex gap-2 flex-wrap">
              {([
                { key: 'export', label: 'تصدير', icon: Download },
                { key: 'import', label: 'استيراد', icon: Upload },
                { key: 'backup', label: 'نسخ احتياطي', icon: Archive },
                { key: 'clear', label: 'مسح', icon: Trash2 },
              ] as const).map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveDataTab(tab.key)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      activeDataTab === tab.key
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <Separator />

            {/* ── Export Tab ── */}
            {activeDataTab === 'export' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">تصدير الجداول كملفات JSON أو CSV</p>
                  <Button variant="outline" size="sm" onClick={() => handleExportAll('json')} disabled={exportState.loading || !isConfigured}>
                    <FileDown className="w-4 h-4 mr-2" />
                    تصدير الكل (JSON)
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {EXPORTABLE_TABLES.map(table => {
                    const Icon = table.icon
                    const isExporting = exportState.loading && exportState.table === table.key
                    return (
                      <div key={table.key} className="p-4 rounded-lg border hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium">{table.label}</span>
                        </div>
                        {isExporting && (
                          <div className="mb-3">
                            <Progress value={exportState.progress} className="h-1.5" />
                            <p className="text-[10px] text-muted-foreground mt-1 text-center">{exportState.progress}%</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExport(table.key, 'json')} disabled={exportState.loading || !isConfigured}>
                            {isExporting && exportState.format === 'json' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3 mr-1" />}
                            JSON
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExport(table.key, 'csv')} disabled={exportState.loading || !isConfigured}>
                            {isExporting && exportState.format === 'csv' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3 mr-1" />}
                            CSV
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {exportState.loading && exportState.table === 'all' && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm font-medium">جاري التصدير الشامل...</span>
                    </div>
                    <Progress value={exportState.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{exportState.progress}%</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Import Tab ── */}
            {activeDataTab === 'import' && (
              <div className="space-y-4 animate-fade-in">
                {!isConfigured ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">يرجى إعداد Supabase أولاً</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">استيراد البيانات من ملفات JSON أو CSV</p>
                      <Select value={importState.conflictStrategy} onValueChange={(v) => setImportState(s => ({ ...s, conflictStrategy: v as 'skip' | 'overwrite' }))}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">تخطي المكررات</SelectItem>
                          <SelectItem value="overwrite">استبدال المكررات</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {EXPORTABLE_TABLES.map(table => {
                        const Icon = table.icon
                        return (
                          <div key={table.key} className="p-4 rounded-lg border hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                              <Icon className="w-5 h-5 text-emerald-600" />
                              <span className="text-sm font-medium">{table.label}</span>
                            </div>
                            <input
                              type="file"
                              accept=".json,.csv"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImportFile(table.key, file)
                                e.target.value = ''
                              }}
                              id={`import-${table.key}`}
                            />
                            <label htmlFor={`import-${table.key}`}>
                              <Button variant="outline" size="sm" className="w-full cursor-pointer" asChild>
                                <span><Upload className="w-3 h-3 mr-1" /> اختيار ملف</span>
                              </Button>
                            </label>
                          </div>
                        )
                      })}
                    </div>
                    {importState.preview.length > 0 && (
                      <div className="space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <ListChecks className="w-4 h-4 text-emerald-600" />
                            معاينة ({importState.preview.length} من {importFullDataRef.current.length} سجل)
                          </h4>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setImportState(s => ({ ...s, preview: [], table: '' }))}>
                              <X className="w-3 h-3 mr-1" /> إلغاء
                            </Button>
                            <Button size="sm" onClick={handleImportConfirm} disabled={importState.loading} className="bg-emerald-600 hover:bg-emerald-700">
                              {importState.loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                              استيراد ({importFullDataRef.current.length} سجل)
                            </Button>
                          </div>
                        </div>
                        {importState.loading && importState.progress > 0 && <Progress value={importState.progress} className="h-2" />}
                        <div className="overflow-x-auto rounded-lg border">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-muted/50">
                                {Object.keys(importState.preview[0]).slice(0, 6).map(key => (
                                  <th key={key} className="px-3 py-2 text-right font-medium">{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {importState.preview.map((row, i) => (
                                <tr key={i} className="border-t">
                                  {Object.values(row).slice(0, 6).map((val, j) => (
                                    <td key={j} className="px-3 py-2 max-w-[200px] truncate">
                                      {val === null ? <span className="text-muted-foreground">null</span> : String(val)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Backup Tab ── */}
            {activeDataTab === 'backup' && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-lg border text-center space-y-3">
                    <Archive className="w-10 h-10 mx-auto text-amber-600" />
                    <h4 className="font-medium">إنشاء نسخة احتياطية</h4>
                    <p className="text-xs text-muted-foreground">إنشاء نسخة JSON شاملة من جميع البيانات</p>
                    <Button onClick={handleCreateBackup} disabled={backupState.loading || !isConfigured} className="w-full">
                      {backupState.loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                      إنشاء نسخة احتياطية
                    </Button>
                  </div>
                  <div className="p-6 rounded-lg border text-center space-y-3">
                    <RotateCcw className="w-10 h-10 mx-auto text-blue-600" />
                    <h4 className="font-medium">استعادة نسخة احتياطية</h4>
                    <p className="text-xs text-muted-foreground">رفع ملف نسخة احتياطية واستعادة البيانات</p>
                    <input
                      ref={restoreInputRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) handleRestoreBackup(file); e.target.value = '' }}
                      id="restore-file"
                    />
                    <label htmlFor="restore-file" className="block">
                      <Button variant="outline" className="w-full cursor-pointer" disabled={backupState.loading || !isConfigured} asChild>
                        <span><FileUp className="w-4 h-4 mr-2" /> اختيار ملف النسخة الاحتياطية</span>
                      </Button>
                    </label>
                  </div>
                </div>
                {backupState.loading && (
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3 mb-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">{backupState.phase}</span>
                    </div>
                    <Progress value={backupState.progress} className="h-2" indicatorClassName="bg-amber-500" />
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{backupState.progress}%</p>
                  </div>
                )}
                {backupState.phase && !backupState.loading && backupState.progress === 100 && (
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-800 dark:text-emerald-300">{backupState.phase}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Clear Tab ── */}
            {activeDataTab === 'clear' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">منطقة الخطر</p>
                      <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                        مسح البيانات عملية لا يمكن التراجع عنها. تأكد من أخذ نسخة احتياطية قبل المتابعة.
                      </p>
                    </div>
                  </div>
                </div>
                {clearState.progress === 100 && (
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-800 dark:text-emerald-300">تم مسح البيانات بنجاح</span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {EXPORTABLE_TABLES.map(table => {
                    const Icon = table.icon
                    const isClearing = clearState.loading && clearState.table === table.key
                    return (
                      <div key={table.key} className="p-4 rounded-lg border border-red-200/50 dark:border-red-800/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="w-5 h-5 text-red-500" />
                          <span className="text-sm font-medium">{table.label}</span>
                        </div>
                        <Button variant="destructive" size="sm" className="w-full" disabled={clearState.loading || !isConfigured}
                          onClick={() => { setClearTableTarget(table.key); setShowClearDialog(true) }}>
                          {isClearing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
                          مسح {table.label}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              تأكيد مسح البيانات
            </DialogTitle>
            <DialogDescription>
              أنت على وشك مسح جميع سجلات جدول <strong>{EXPORTABLE_TABLES.find(t => t.key === clearTableTarget)?.label}</strong>.
              هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              اكتب <strong className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded">تأكيد</strong> في الحقل أدناه للمتابعة:
            </p>
            <Input value={clearConfirmText} onChange={(e) => setClearConfirmText(e.target.value)} placeholder="تأكيد" className="text-center" dir="rtl" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowClearDialog(false); setClearConfirmText('') }}>إلغاء</Button>
            <Button variant="destructive" onClick={handleClearData} disabled={clearConfirmText !== 'تأكيد'}>
              <Trash2 className="w-4 h-4 mr-2" />
              مسح البيانات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
