// ═══════════════════════════════════════════════════════════════
// Global Command Palette — Search across all entities
// لوحة أوامر عامة — بحث في كل البيانات
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, FileText, FileStack, Users, MapPin, Bell, PackageX, BarChart3, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase, isConfigured } from '@/lib/supabase'

interface SearchResult {
  id: string
  type: 'submission' | 'form' | 'user' | 'governorate' | 'shortage' | 'page'
  title: string
  subtitle: string
  icon: React.ElementType
  href: string
  color: string
}

const PAGE_RESULTS: SearchResult[] = [
  { id: 'p-dashboard', type: 'page', title: 'لوحة التحكم', subtitle: 'الصفحة الرئيسية', icon: BarChart3, href: '/dashboard', color: 'text-blue-600 bg-blue-50' },
  { id: 'p-submissions', type: 'page', title: 'الإرساليات', subtitle: 'عرض وإدارة الإرساليات', icon: FileStack, href: '/submissions', color: 'text-emerald-600 bg-emerald-50' },
  { id: 'p-forms', type: 'page', title: 'النماذج', subtitle: 'إدارة نماذج الإدخال', icon: FileText, href: '/forms', color: 'text-violet-600 bg-violet-50' },
  { id: 'p-users', type: 'page', title: 'المستخدمون', subtitle: 'إدارة المستخدمين والأدوار', icon: Users, href: '/users', color: 'text-amber-600 bg-amber-50' },
  { id: 'p-governorates', type: 'page', title: 'المحافظات', subtitle: 'عرض المحافظات والمديريات', icon: MapPin, href: '/governorates', color: 'text-cyan-600 bg-cyan-50' },
  { id: 'p-shortages', type: 'page', title: 'النواقص', subtitle: 'نواقص المستلزمات', icon: PackageX, href: '/shortages', color: 'text-red-600 bg-red-50' },
  { id: 'p-reports', type: 'page', title: 'التقارير', subtitle: 'إنشاء وتصدير التقارير', icon: BarChart3, href: '/reports', color: 'text-indigo-600 bg-indigo-50' },
  { id: 'p-map', type: 'page', title: 'الخريطة', subtitle: 'الخريطة التفاعلية', icon: MapPin, href: '/map', color: 'text-green-600 bg-green-50' },
  { id: 'p-notifications', type: 'page', title: 'الإشعارات', subtitle: 'عرض الإشعارات', icon: Bell, href: '/notifications', color: 'text-orange-600 bg-orange-50' },
]

async function searchDatabase(query: string): Promise<SearchResult[]> {
  if (!isConfigured || query.length < 2) return []

  const results: SearchResult[] = []
  const q = `%${query}%`

  try {
    // Search submissions
    const { data: subs } = await supabase
      .from('form_submissions')
      .select('id, status, forms(title_ar), profiles:submitted_by(full_name), governorates(name_ar)')
      .or(`notes.ilike.${q}`)
      .is('deleted_at', null)
      .limit(5)

    subs?.forEach((s: any) => {
      results.push({
        id: `s-${s.id}`,
        type: 'submission',
        title: s.forms?.title_ar || 'إرسالية',
        subtitle: `${s.profiles?.full_name || '—'} • ${s.governorates?.name_ar || '—'}`,
        icon: FileStack,
        href: '/submissions',
        color: 'text-emerald-600 bg-emerald-50',
      })
    })

    // Search forms
    const { data: forms } = await supabase
      .from('forms')
      .select('id, title_ar, title_en, campaign_type')
      .or(`title_ar.ilike.${q},title_en.ilike.${q}`)
      .is('deleted_at', null)
      .limit(5)

    forms?.forEach((f: any) => {
      results.push({
        id: `f-${f.id}`,
        type: 'form',
        title: f.title_ar || f.title_en,
        subtitle: f.campaign_type || 'نموذج',
        icon: FileText,
        href: '/forms',
        color: 'text-violet-600 bg-violet-50',
      })
    })

    // Search users
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .or(`full_name.ilike.${q},email.ilike.${q}`)
      .is('deleted_at', null)
      .limit(5)

    const roleLabels: Record<string, string> = {
      admin: 'مدير النظام', central: 'مركزي', governorate: 'محافظة',
      district: 'مديرية', data_entry: 'إدخال بيانات',
    }

    users?.forEach((u: any) => {
      results.push({
        id: `u-${u.id}`,
        type: 'user',
        title: u.full_name || u.email,
        subtitle: roleLabels[u.role] || u.role,
        icon: Users,
        href: '/users',
        color: 'text-amber-600 bg-amber-50',
      })
    })

    // Search governorates
    const { data: govs } = await supabase
      .from('governorates')
      .select('id, name_ar')
      .ilike('name_ar', q)
      .is('deleted_at', null)
      .limit(5)

    govs?.forEach((g: any) => {
      results.push({
        id: `g-${g.id}`,
        type: 'governorate',
        title: g.name_ar,
        subtitle: 'محافظة',
        icon: MapPin,
        href: '/governorates',
        color: 'text-cyan-600 bg-cyan-50',
      })
    })

    // Search shortages
    const { data: shortages } = await supabase
      .from('supply_shortages')
      .select('id, item_name, severity')
      .ilike('item_name', q)
      .is('deleted_at', null)
      .limit(3)

    const severityLabels: Record<string, string> = { critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض' }

    shortages?.forEach((s: any) => {
      results.push({
        id: `sh-${s.id}`,
        type: 'shortage',
        title: s.item_name,
        subtitle: `نقص ${severityLabels[s.severity] || s.severity}`,
        icon: PackageX,
        href: '/shortages',
        color: 'text-red-600 bg-red-50',
      })
    })
  } catch (err) {
    console.error('[GlobalSearch] Search error:', err)
  }

  return results
}

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [dbResults, setDbResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setDbResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounced database search
  useEffect(() => {
    if (query.length < 2) {
      setDbResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const results = await searchDatabase(query)
      setDbResults(results)
      setLoading(false)
      setSelectedIndex(0)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Filter page results by query
  const pageResults = useMemo(() => {
    if (!query) return PAGE_RESULTS
    const q = query.toLowerCase()
    return PAGE_RESULTS.filter(p =>
      p.title.includes(q) || p.subtitle.includes(q)
    )
  }, [query])

  // All results combined
  const allResults = useMemo(() => {
    return [...dbResults, ...pageResults]
  }, [dbResults, pageResults])

  // Navigate to result
  const selectResult = useCallback((result: SearchResult) => {
    navigate(result.href)
    onClose()
  }, [navigate, onClose])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && allResults[selectedIndex]) {
        selectResult(allResults[selectedIndex])
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, allResults, selectedIndex, onClose, selectResult])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Search Dialog */}
      <div className="relative bg-background rounded-2xl shadow-2xl border w-[560px] max-h-[60vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          {loading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث في كل شيء... (مستخدمين، إرساليات، نماذج، محافظات)"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            dir="rtl"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border rounded text-muted-foreground">Esc</kbd>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {allResults.length === 0 && query.length >= 2 && !loading && (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد نتائج لـ "{query}"</p>
            </div>
          )}

          {allResults.length === 0 && query.length < 2 && (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">اكتب للبحث...</p>
            </div>
          )}

          {/* Database Results */}
          {dbResults.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-medium text-muted-foreground px-3 py-1.5 uppercase tracking-wider">نتائج البحث</p>
              {dbResults.map((result, i) => {
                const Icon = result.icon
                const globalIndex = i
                return (
                  <button
                    key={result.id}
                    onClick={() => selectResult(result)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-right transition-colors',
                      globalIndex === selectedIndex ? 'bg-primary/10' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className={cn('p-1.5 rounded-lg shrink-0', result.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{result.subtitle}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Page Results */}
          {(query.length < 2 || pageResults.length > 0) && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground px-3 py-1.5 uppercase tracking-wider">الصفحات</p>
              {pageResults.map((result, i) => {
                const Icon = result.icon
                const globalIndex = dbResults.length + i
                return (
                  <button
                    key={result.id}
                    onClick={() => selectResult(result)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-right transition-colors',
                      globalIndex === selectedIndex ? 'bg-primary/10' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className={cn('p-1.5 rounded-lg shrink-0', result.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{result.title}</p>
                      <p className="text-[11px] text-muted-foreground">{result.subtitle}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted border rounded font-mono">↑↓</kbd> تنقل</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted border rounded font-mono">↵</kbd> اختيار</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted border rounded font-mono">Esc</kbd> إغلاق</span>
          </div>
          <span>{allResults.length} نتيجة</span>
        </div>
      </div>
    </div>
  )
}
