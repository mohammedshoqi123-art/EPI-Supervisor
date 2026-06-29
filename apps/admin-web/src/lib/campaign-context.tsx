import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from 'react'
import { supabase, isConfigured } from '@/lib/supabase'

// ═══ Campaign Types ═══
export type CampaignType = string

export interface CampaignOption {
  id: CampaignType
  labelAr: string
  labelEn: string
  icon: string
  color: string
  /** Whether this is a built-in (system) campaign */
  builtIn?: boolean
  /** Whether this campaign is visible in filters */
  visible: boolean
}

// ─── Built-in campaigns (fallback if Supabase unavailable) ───
const BUILTIN_CAMPAIGNS: CampaignOption[] = [
  {
    id: 'polio_campaign',
    labelAr: 'حملة شلل الأطفال',
    labelEn: 'Polio Campaign',
    icon: '💉',
    color: 'from-blue-500 to-blue-600',
    builtIn: true,
    visible: true,
  },
  {
    id: 'integrated_activity',
    labelAr: 'النشاط الإيصالي التكاملي',
    labelEn: 'Integrated Activity',
    icon: '🏥',
    color: 'from-emerald-500 to-emerald-600',
    builtIn: true,
    visible: true,
  },
]

// ─── "All" option (always exists, always visible) ───
const ALL_OPTION: CampaignOption = {
  id: 'all',
  labelAr: 'جميع الأنشطة',
  labelEn: 'All Activities',
  icon: '📋',
  color: 'from-gray-500 to-gray-600',
  builtIn: true,
  visible: true,
}

const STORAGE_KEY = 'epi-admin-active-campaign'
const CAMPAIGNS_CACHE_KEY = 'epi-admin-campaigns-cache'
const HIDDEN_BUILTIN_KEY = 'epi-admin-hidden-builtins'
const ROUND_STORAGE_KEY = 'epi-admin-active-round'

// ═══ Campaign Round Helpers ═══
const ROUND_LABELS: Record<number, string> = {
  1: 'الجولة الأولى',
  2: 'الجولة الثانية',
  3: 'الجولة الثالثة',
  4: 'الجولة الرابعة',
  5: 'الجولة الخامسة',
}

export function getRoundLabel(round: number): string {
  return ROUND_LABELS[round] || `الجولة ${round}`
}

export const CAMPAIGN_ROUNDS = [1, 2, 3, 4, 5]

function loadActiveRound(): number {
  if (typeof window === 'undefined') return 1
  const stored = localStorage.getItem(ROUND_STORAGE_KEY)
  const parsed = parseInt(stored || '1')
  return isNaN(parsed) || parsed < 1 ? 1 : parsed
}

function saveActiveRound(round: number) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ROUND_STORAGE_KEY, String(round))
  }
}

// ═══ Context ═══
interface CampaignContextValue {
  /** Current selected campaign */
  campaign: CampaignType
  /** Set the active campaign */
  setCampaign: (campaign: CampaignType) => void
  /** Get the current campaign option details */
  currentOption: CampaignOption
  /** Whether the filter is active (not 'all') */
  isFiltered: boolean
  /** Get campaign label in Arabic */
  labelAr: string
  /** All campaigns (built-in + custom) */
  allCampaigns: CampaignOption[]
  /** Visible campaign options (for sidebar filter) */
  visibleOptions: CampaignOption[]
  /** Check if a specific campaign is visible */
  isCampaignVisible: (id: CampaignType) => boolean
  /** Toggle visibility of a campaign */
  toggleCampaignVisibility: (id: CampaignType) => void
  /** Add a new custom campaign */
  addCampaign: (campaign: Omit<CampaignOption, 'id' | 'builtIn' | 'visible'>) => CampaignOption
  /** Update an existing campaign */
  updateCampaign: (id: CampaignType, updates: Partial<Pick<CampaignOption, 'labelAr' | 'labelEn' | 'icon' | 'color' | 'visible'>>) => void
  /** Delete a custom campaign */
  deleteCampaign: (id: CampaignType) => boolean
  /** Get campaign by ID */
  getCampaign: (id: CampaignType) => CampaignOption | undefined
  /** Whether data is loading from Supabase */
  loading: boolean
  /** ═══ Campaign Round System ═══ */
  /** Current active campaign round (1-5). Only relevant for integrated_activity. */
  campaignRound: number
  /** Set the active campaign round */
  setCampaignRound: (round: number) => void
  /** Arabic label for current round */
  roundLabelAr: string
  /** Whether round filter should be visible (campaign === integrated_activity) */
  showRoundFilter: boolean
}

const CampaignContext = createContext<CampaignContextValue | null>(null)

// ─── LocalStorage helpers (cache + fallback) ───

function loadCachedCampaigns(): CampaignOption[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CAMPAIGNS_CACHE_KEY)
    if (stored) return JSON.parse(stored) as CampaignOption[]
  } catch {}
  return []
}

function saveCachedCampaigns(campaigns: CampaignOption[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CAMPAIGNS_CACHE_KEY, JSON.stringify(campaigns))
  }
}

function loadActiveCampaign(): CampaignType {
  if (typeof window === 'undefined') return 'polio_campaign'
  return localStorage.getItem(STORAGE_KEY) || 'polio_campaign'
}

function saveActiveCampaign(campaign: CampaignType) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, campaign)
  }
}

function loadHiddenBuiltins(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(HIDDEN_BUILTIN_KEY)
    if (stored) return new Set(JSON.parse(stored))
  } catch {}
  return new Set()
}

function saveHiddenBuiltins(hidden: Set<string>) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(HIDDEN_BUILTIN_KEY, JSON.stringify(Array.from(hidden)))
  }
}

// ─── Supabase helpers ───

/** Load campaign types from Supabase campaign_types table */
async function loadFromSupabase(): Promise<CampaignOption[] | null> {
  if (!isConfigured) return null
  try {
    const { data, error } = await supabase
      .from('campaign_types')
      .select('key, label_ar, label_en, icon, color, built_in, visible, sort_order')
      .order('sort_order', { ascending: true })

    if (error || !data) return null

    return data.map((row: any) => ({
      id: row.key,
      labelAr: row.label_ar,
      labelEn: row.label_en,
      icon: row.icon,
      color: row.color,
      builtIn: row.built_in,
      visible: row.visible,
    }))
  } catch {
    return null
  }
}

/** Insert a new campaign type into Supabase */
async function insertToSupabase(campaign: CampaignOption): Promise<boolean> {
  if (!isConfigured) return false
  try {
    const { error } = await supabase.from('campaign_types').insert({
      key: campaign.id,
      label_ar: campaign.labelAr,
      label_en: campaign.labelEn,
      icon: campaign.icon,
      color: campaign.color,
      built_in: campaign.builtIn || false,
      visible: campaign.visible,
      sort_order: 100,
    })
    return !error
  } catch {
    return false
  }
}

/** Update a campaign type in Supabase */
async function updateInSupabase(id: string, updates: Partial<CampaignOption>): Promise<boolean> {
  if (!isConfigured) return false
  try {
    const dbUpdates: Record<string, any> = {}
    if (updates.labelAr !== undefined) dbUpdates.label_ar = updates.labelAr
    if (updates.labelEn !== undefined) dbUpdates.label_en = updates.labelEn
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon
    if (updates.color !== undefined) dbUpdates.color = updates.color
    if (updates.visible !== undefined) dbUpdates.visible = updates.visible

    const { error } = await supabase
      .from('campaign_types')
      .update(dbUpdates)
      .eq('key', id)
      .eq('built_in', false) // Can't update built-in types

    return !error
  } catch {
    return false
  }
}

/** Delete a campaign type from Supabase */
async function deleteFromSupabase(id: string): Promise<boolean> {
  if (!isConfigured) return false
  try {
    const { error } = await supabase
      .from('campaign_types')
      .delete()
      .eq('key', id)
      .eq('built_in', false) // Can't delete built-in types

    return !error
  } catch {
    return false
  }
}

/** Toggle visibility in Supabase */
async function toggleVisibilityInSupabase(id: string, visible: boolean): Promise<boolean> {
  if (!isConfigured) return false
  try {
    const { error } = await supabase
      .from('campaign_types')
      .update({ visible })
      .eq('key', id)

    return !error
  } catch {
    return false
  }
}

// ─── ID generator ───
function generateCampaignId(labelAr: string): string {
  const base = labelAr
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\u0600-\u06FF]/g, '')
    .toLowerCase() || 'campaign'
  const rand = Math.random().toString(36).substring(2, 6)
  return `${base}_${rand}`
}

// ─── Available icons for campaigns ───
export const CAMPAIGN_ICONS = [
  '💉', '🏥', '🧬', '🩺', '💊', '🩹', '🫁', '🧠', '👁️', '🦷',
  '🦴', '🫀', '🔬', '🧪', '🌡️', '🚑', '🏥', '⚕️', '🩻', '🧴',
  '👶', '🧒', '👧', '👦', '👩‍⚕️', '👨‍⚕️', '🏘️', '🌍', '📊', '📋',
]

// ─── Available colors for campaigns ───
export const CAMPAIGN_COLORS = [
  { value: 'from-blue-500 to-blue-600', label: 'أزرق', bg: 'bg-blue-50', text: 'text-blue-600' },
  { value: 'from-emerald-500 to-emerald-600', label: 'أخضر', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { value: 'from-purple-500 to-purple-600', label: 'بنفسجي', bg: 'bg-purple-50', text: 'text-purple-600' },
  { value: 'from-amber-500 to-amber-600', label: 'ذهبي', bg: 'bg-amber-50', text: 'text-amber-600' },
  { value: 'from-rose-500 to-rose-600', label: 'وردي', bg: 'bg-rose-50', text: 'text-rose-600' },
  { value: 'from-cyan-500 to-cyan-600', label: 'سماوي', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  { value: 'from-orange-500 to-orange-600', label: 'برتقالي', bg: 'bg-orange-50', text: 'text-orange-600' },
  { value: 'from-teal-500 to-teal-600', label: 'أخضر فاتح', bg: 'bg-teal-50', text: 'text-teal-600' },
]

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaign, setCampaignState] = useState<CampaignType>(loadActiveCampaign)
  const [campaignRound, setCampaignRoundState] = useState<number>(loadActiveRound)
  const [campaigns, setCampaigns] = useState<CampaignOption[]>(loadCachedCampaigns)
  const [hiddenBuiltins, setHiddenBuiltins] = useState<Set<string>>(loadHiddenBuiltins)
  const [loading, setLoading] = useState(true)

  // ── Load from Supabase on mount ──
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const supabaseData = await loadFromSupabase()

      if (!cancelled && supabaseData && supabaseData.length > 0) {
        setCampaigns(supabaseData)
        saveCachedCampaigns(supabaseData)
      }
      // If Supabase fails, we keep using cached data (or built-in defaults)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  // ── Merge: campaigns list (Supabase data or built-in fallback) ──
  const allCampaigns = useMemo(() => {
    if (campaigns.length > 0) return campaigns
    return BUILTIN_CAMPAIGNS
  }, [campaigns])

  // ── Refs for stable callback access (avoids re-creating callbacks) ──
  const allCampaignsRef = useRef(allCampaigns)
  const hiddenBuiltinsRef = useRef(hiddenBuiltins)
  allCampaignsRef.current = allCampaigns
  hiddenBuiltinsRef.current = hiddenBuiltins

  // ── Persist active campaign ──
  useEffect(() => { saveActiveCampaign(campaign) }, [campaign])

  // ── Persist active round ──
  useEffect(() => { saveActiveRound(campaignRound) }, [campaignRound])

  // ═══ FIX: Removed auto-reset effect that was overriding ActiveRoundCard changes ═══
  // Previously: switching to polio_campaign would reset campaignRound to 1,
  // which prevented the ActiveRoundCard in Settings from updating the round.
  // Now: the round persists across campaign switches. The round filter is only
  // applied when showRoundFilter is true (campaign === 'integrated_activity'),
  // so other campaigns simply ignore the round value.

  // ── Persist hidden builtins ──
  useEffect(() => { saveHiddenBuiltins(hiddenBuiltins) }, [hiddenBuiltins])

  // ── If current campaign is deleted or hidden, switch to 'all' ──
  useEffect(() => {
    const visibleIds = allCampaigns
      .filter(c => !hiddenBuiltinsRef.current.has(c.id))
      .map(c => c.id)
    if (campaign !== 'all' && !visibleIds.includes(campaign)) {
      setCampaignState('all')
    }
  }, [campaign, allCampaigns])

  const setCampaign = useCallback((newCampaign: CampaignType) => {
    setCampaignState(newCampaign)
  }, [])

  const setCampaignRound = useCallback((round: number) => {
    if (round >= 1 && round <= 10) {
      setCampaignRoundState(round)
    }
  }, [])

  const isCampaignVisible = useCallback((id: CampaignType) => {
    if (id === 'all') return true
    const found = allCampaignsRef.current.find(c => c.id === id)
    if (!found) return false
    if (found.builtIn) return !hiddenBuiltinsRef.current.has(id)
    return found.visible !== false
  }, [])

  const toggleCampaignVisibility = useCallback((id: CampaignType) => {
    if (id === 'all') return

    const found = allCampaignsRef.current.find(c => c.id === id)
    if (!found) return

    if (found.builtIn) {
      setHiddenBuiltins(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
      return
    }

    const newVisible = !(found.visible !== false)
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, visible: newVisible } : c))
    toggleVisibilityInSupabase(id, newVisible)
  }, [])

  const addCampaign = useCallback((data: Omit<CampaignOption, 'id' | 'builtIn' | 'visible'>): CampaignOption => {
    const newCampaign: CampaignOption = {
      ...data,
      id: generateCampaignId(data.labelAr),
      builtIn: false,
      visible: true,
    }

    // Update local state immediately
    setCampaigns(prev => {
      const updated = [...prev, newCampaign]
      saveCachedCampaigns(updated)
      return updated
    })

    // Persist to Supabase
    insertToSupabase(newCampaign)

    return newCampaign
  }, [])

  const updateCampaign = useCallback((id: CampaignType, updates: Partial<Pick<CampaignOption, 'labelAr' | 'labelEn' | 'icon' | 'color' | 'visible'>>) => {
    const found = allCampaignsRef.current.find(c => c.id === id)
    if (found?.builtIn) return

    setCampaigns(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c)
      saveCachedCampaigns(updated)
      return updated
    })

    updateInSupabase(id, updates)
  }, [])

  const deleteCampaign = useCallback((id: CampaignType): boolean => {
    const found = allCampaignsRef.current.find(c => c.id === id)
    if (found?.builtIn) return false

    setCampaigns(prev => {
      const updated = prev.filter(c => c.id !== id)
      saveCachedCampaigns(updated)
      return updated
    })

    deleteFromSupabase(id)

    return true
  }, [])

  const getCampaign = useCallback((id: CampaignType): CampaignOption | undefined => {
    if (id === 'all') return ALL_OPTION
    return allCampaignsRef.current.find(c => c.id === id)
  }, [])

  const currentOption = useMemo(() => getCampaign(campaign) ?? ALL_OPTION, [getCampaign, campaign])
  const visibleOptions = useMemo(() => [
    ALL_OPTION,
    ...allCampaigns.filter(c => !hiddenBuiltins.has(c.id) && c.visible !== false),
  ], [allCampaigns, hiddenBuiltins])

  const value: CampaignContextValue = useMemo(() => ({
    campaign,
    setCampaign,
    currentOption,
    isFiltered: campaign !== 'all',
    labelAr: currentOption.labelAr,
    allCampaigns,
    visibleOptions,
    isCampaignVisible,
    toggleCampaignVisibility,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    getCampaign,
    loading,
    campaignRound,
    setCampaignRound,
    roundLabelAr: getRoundLabel(campaignRound),
    // ═══ FIX: showRoundFilter is now true for ALL campaigns, not just integrated_activity ═══
    // The campaign_round column exists on all submissions (DEFAULT 1), so filtering by round
    // is valid for any campaign. Users can now filter polio_campaign by round too.
    showRoundFilter: campaign !== 'all',
  }), [campaign, currentOption, allCampaigns, visibleOptions, loading, campaignRound])

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  )
}

export function useCampaign(): CampaignContextValue {
  const ctx = useContext(CampaignContext)
  if (!ctx) throw new Error('useCampaign must be used within CampaignProvider')
  return ctx
}
