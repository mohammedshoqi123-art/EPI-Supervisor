import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, RefreshCw, Clock, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNotifications } from '@/hooks/useApi'
import { useCampaign } from '@/lib/campaign-context'

interface HeaderProps {
  title: string
  subtitle?: string
  onRefresh?: () => void
  onSearch?: (query: string) => void
}

export function Header({ title, subtitle, onRefresh, onSearch }: HeaderProps) {
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const { campaign, isFiltered, labelAr, currentOption } = useCampaign()
  const { data: notifications } = useNotifications()

  const unreadCount = (notifications || []).filter(n => !n.is_read).length

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const timeStr = time.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true })

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }, [onSearch])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchOpen(false)
    onSearch?.('')
  }, [onSearch])

  // Keyboard shortcut: Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape' && searchOpen) {
        clearSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [searchOpen, clearSearch])

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-4 bg-background/80 backdrop-blur-xl border-b">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-heading font-bold truncate">{title}</h1>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-700">مباشر</span>
          </div>
          {/* Campaign Badge */}
          {isFiltered && currentOption && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/60">
              <Filter className="w-3 h-3 text-blue-600" />
              <span className="text-[10px] font-medium text-blue-700">{currentOption.icon} {labelAr}</span>
            </div>
          )}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono tabular-nums">{timeStr}</span>
        </div>

        {/* Search (desktop only) */}
        {searchOpen ? (
          <div className="hidden md:flex items-center relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث... (Esc للإغلاق)"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="w-64 pr-10 pl-8 h-9 bg-muted/50 border-0 focus:bg-muted/80 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex hover:bg-primary/10 hover:text-primary transition-colors"
            title="بحث (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </Button>
        )}

        {/* Refresh */}
        <Button variant="ghost" size="icon-sm" onClick={onRefresh} className="hover:bg-primary/10 hover:text-primary transition-colors">
          <RefreshCw className="w-4 h-4" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  )
}
