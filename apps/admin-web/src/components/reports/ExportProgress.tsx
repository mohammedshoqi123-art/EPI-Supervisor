/**
 * ═══════════════════════════════════════════════════════════════
 *  Export Progress — Visual indicator for export operations
 *  مؤشر التصدير — مؤشر مرئي لعمليات التصدير
 * ═══════════════════════════════════════════════════════════════
 */

import { Loader2, CheckCircle2, XCircle, FileDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExportProgressProps {
  status: 'idle' | 'fetching' | 'generating' | 'done' | 'error'
  message?: string
  progress?: number
  total?: number
  className?: string
}

export function ExportProgress({ status, message, progress, total, className }: ExportProgressProps) {
  if (status === 'idle') return null

  const percent = total && progress ? Math.round((progress / total) * 100) : null

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border transition-all',
      status === 'error' ? 'bg-red-50 border-red-200' :
      status === 'done' ? 'bg-emerald-50 border-emerald-200' :
      'bg-blue-50 border-blue-200',
      className
    )}>
      {/* Icon */}
      <div className={cn(
        'p-2 rounded-lg shrink-0',
        status === 'error' ? 'bg-red-100' :
        status === 'done' ? 'bg-emerald-100' :
        'bg-blue-100'
      )}>
        {status === 'fetching' || status === 'generating' ? (
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        ) : status === 'done' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : status === 'error' ? (
          <XCircle className="w-4 h-4 text-red-600" />
        ) : (
          <FileDown className="w-4 h-4 text-blue-600" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">
            {status === 'fetching' ? 'جاري تحميل البيانات...' :
             status === 'generating' ? 'جاري إنشاء التقرير...' :
             status === 'done' ? 'تم التصدير بنجاح ✅' :
             status === 'error' ? 'فشل التصدير' : ''}
          </span>
          {percent !== null && (
            <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
              {percent}%
            </span>
          )}
        </div>

        {message && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{message}</p>
        )}

        {/* Progress bar */}
        {percent !== null && (
          <div className="mt-1.5 h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                status === 'error' ? 'bg-red-500' : 'bg-blue-500'
              )}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        )}

        {/* Record count */}
        {progress !== undefined && total !== undefined && (
          <p className="text-[9px] text-muted-foreground/70 mt-1">
            {progress.toLocaleString('ar-SA')} / {total.toLocaleString('ar-SA')} سجل
          </p>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Hook: useExportProgress
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react'

export function useExportProgress() {
  const [status, setStatus] = useState<'idle' | 'fetching' | 'generating' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | undefined>()
  const [progress, setProgress] = useState<number | undefined>()
  const [total, setTotal] = useState<number | undefined>()

  const startFetch = useCallback((totalCount?: number) => {
    setStatus('fetching')
    setMessage('جاري تحميل البيانات من قاعدة البيانات...')
    setProgress(0)
    setTotal(totalCount)
  }, [])

  const updateFetchProgress = useCallback((fetched: number, totalCount: number | null) => {
    setProgress(fetched)
    if (totalCount) setTotal(totalCount)
    setMessage(`تم تحميل ${fetched.toLocaleString('ar-SA')} سجل...`)
  }, [])

  const startGenerate = useCallback(() => {
    setStatus('generating')
    setMessage('جاري إنشاء الملف...')
  }, [])

  const done = useCallback((message?: string) => {
    setStatus('done')
    setMessage(message || 'تم التحميل بنجاح')
    // Auto-reset after 3 seconds
    setTimeout(() => {
      setStatus('idle')
      setMessage(undefined)
      setProgress(undefined)
      setTotal(undefined)
    }, 3000)
  }, [])

  const error = useCallback((message?: string) => {
    setStatus('error')
    setMessage(message || 'حدث خطأ أثناء التصدير')
    setTimeout(() => {
      setStatus('idle')
      setMessage(undefined)
      setProgress(undefined)
      setTotal(undefined)
    }, 5000)
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setMessage(undefined)
    setProgress(undefined)
    setTotal(undefined)
  }, [])

  return {
    status,
    message,
    progress,
    total,
    startFetch,
    updateFetchProgress,
    startGenerate,
    done,
    error,
    reset,
    isActive: status !== 'idle',
  }
}
