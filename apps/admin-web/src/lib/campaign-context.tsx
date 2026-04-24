import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

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

// ─── Built-in campaigns (always exist) ───
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
const CAMPAIGNS_KEY = 'epi-admin-campaigns'

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
}

const CampaignContext = createContext<CampaignContextValue | null>(null)

// ─── Persistence helpers ───

function loadCustomCampaigns(): CampaignOption[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CAMPAIGNS_KEY)
    if (stored) {
      return JSON.parse(stored) as CampaignOption[]
    }
  } catch {}
  return []
}

function saveCustomCampaigns(campaigns: CampaignOption[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns))
  }
}

function loadActiveCampaign(): CampaignType {
  if (typeof window === 'undefined') return 'polio_campaign'
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored || 'polio_campaign'
}

function saveActiveCampaign(campaign: CampaignType) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, campaign)
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
  const [customCampaigns, setCustomCampaigns] = useState<CampaignOption[]>(loadCustomCampaigns)

  // Merge built-in + custom campaigns
  const allCampaigns = [...BUILTIN_CAMPAIGNS, ...customCampaigns]

  // Persist active campaign
  useEffect(() => {
    saveActiveCampaign(campaign)
  }, [campaign])

  // Persist custom campaigns
  useEffect(() => {
    saveCustomCampaigns(customCampaigns)
  }, [customCampaigns])

  // If current campaign is deleted, switch to 'all'
  useEffect(() => {
    const exists = campaign === 'all' || allCampaigns.some(c => c.id === campaign)
    if (!exists) {
      setCampaignState('all')
    }
  }, [campaign, allCampaigns])

  const setCampaign = useCallback((newCampaign: CampaignType) => {
    setCampaignState(newCampaign)
  }, [])

  const isCampaignVisible = useCallback((id: CampaignType) => {
    if (id === 'all') return true
    const found = allCampaigns.find(c => c.id === id)
    return found?.visible !== false
  }, [allCampaigns])

  const toggleCampaignVisibility = useCallback((id: CampaignType) => {
    if (id === 'all') return
    // Check if it's a built-in campaign
    const builtIn = BUILTIN_CAMPAIGNS.find(c => c.id === id)
    if (builtIn) {
      // For built-in campaigns, we just toggle visibility (stored in custom campaigns as override)
      setCustomCampaigns(prev => {
        const existing = prev.find(c => c.id === id)
        if (existing) {
          return prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c)
        } else {
          // Add an override entry
          return [...prev, { ...builtIn, visible: false }]
        }
      })
    } else {
      // Custom campaign
      setCustomCampaigns(prev =>
        prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c)
      )
    }
  }, [])

  const addCampaign = useCallback((data: Omit<CampaignOption, 'id' | 'builtIn' | 'visible'>): CampaignOption => {
    const newCampaign: CampaignOption = {
      ...data,
      id: generateCampaignId(data.labelAr),
      builtIn: false,
      visible: true,
    }
    setCustomCampaigns(prev => [...prev, newCampaign])
    return newCampaign
  }, [])

  const updateCampaign = useCallback((id: CampaignType, updates: Partial<Pick<CampaignOption, 'labelAr' | 'labelEn' | 'icon' | 'color' | 'visible'>>) => {
    // Can't update built-in campaigns' core data (only visibility)
    const isBuiltIn = BUILTIN_CAMPAIGNS.some(c => c.id === id)
    if (isBuiltIn) return

    setCustomCampaigns(prev =>
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    )
  }, [])

  const deleteCampaign = useCallback((id: CampaignType): boolean => {
    // Can't delete built-in campaigns
    const isBuiltIn = BUILTIN_CAMPAIGNS.some(c => c.id === id)
    if (isBuiltIn) return false

    setCustomCampaigns(prev => prev.filter(c => c.id !== id))
    return true
  }, [])

  const getCampaign = useCallback((id: CampaignType): CampaignOption | undefined => {
    if (id === 'all') return ALL_OPTION
    return allCampaigns.find(c => c.id === id)
  }, [allCampaigns])

  const currentOption = getCampaign(campaign) ?? ALL_OPTION
  const visibleOptions = [ALL_OPTION, ...allCampaigns.filter(c => c.visible !== false)]

  const value: CampaignContextValue = {
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
  }

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
