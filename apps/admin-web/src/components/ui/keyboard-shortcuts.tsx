import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Keyboard, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Shortcut {
  keys: string[]
  label: string
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['Ctrl', 'K'], label: 'فتح البحث' },
  { keys: ['R'], label: 'تحديث الصفحة' },
  { keys: ['?'], label: 'عرض الاختصارات' },
  { keys: ['Esc'], label: 'إغلاق النافذة' },
  { keys: ['1'], label: 'لوحة التحكم' },
  { keys: ['2'], label: 'الإرساليات' },
  { keys: ['3'], label: 'النماذج' },
  { keys: ['4'], label: 'النواقص' },
]

export function KeyboardShortcutsHelper() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return

      if (e.key === '?') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl border p-6 w-[360px] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Keyboard className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-heading font-bold">اختصارات لوحة المفاتيح</h3>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(false)}
            className="h-7 w-7"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {SHORTCUTS.map((shortcut, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm text-muted-foreground">{shortcut.label}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, j) => (
                  <span key={j}>
                    <kbd className="px-2 py-0.5 text-[11px] font-mono font-medium bg-muted border rounded-md shadow-sm">
                      {key}
                    </kbd>
                    {j < shortcut.keys.length - 1 && (
                      <span className="text-muted-foreground mx-0.5 text-xs">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground mt-4 text-center">
          اضغط <kbd className="px-1 py-0.5 text-[9px] font-mono bg-muted border rounded">?</kbd> في أي وقت لعرض هذا
        </p>
      </div>
    </div>,
    document.body
  )
}
