import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

// ═══ Campaign Types ═══
export type CampaignType = 'polio_campaign' | 'integrated_activity' | 'all'

export interface CampaignOption {
  id: CampaignType
  labelAr: string
  labelEn: string
  icon: string
  color: string
}

export const CAMPAIGN_OPTIONS: CampaignOption[] = [
  {
    id: 'polio_campaign',
    labelAr: 'حملة شلل الأطفال',
    labelEn: 'Polio Campaign',
    icon: '💉',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'integrated_activity',
    labelAr: 'النشاط الإيصالي التكاملي',
    labelEn: 'Integrated Activity',
    icon: '🏥',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'all',
    labelAr: 'جميع الأنشطة',
    labelEn: 'All Activities',
    icon: '📋',
    color: 'from-gray-500 to-gray-600',
  },
]

const STORAGE_KEY = 'epi-admin-active-campaign'
const VISIBILITY_KEY = 'epi-admin-campaign-visibility'

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
  /** Visible campaign options (filtered by visibility settings) */
  visibleOptions: CampaignOption[]
  /** All campaign options (unfiltered) */
  allOptions: CampaignOption[]
  /** Check if a specific campaign is visible */
  isCampaignVisible: (id: CampaignType) => boolean
  /** Toggle visibility of a campaign */
  toggleCampaignVisibility: (id: CampaignType) => void
  /** Set visibility for a specific campaign */
  setCampaignVisibility: (id: CampaignType, visible: boolean) => void
}

const CampaignContext = createContext<CampaignContextValue | null>(null)

function loadVisibility(): Record<CampaignType, boolean> {
  if (typeof window === 'undefined') return { polio_campaign: true, integrated_activity: true, all: true }
  try {
    const stored = localStorage.getItem(VISIBILITY_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        polio_campaign: parsed.polio_campaign !== false,
        integrated_activity: parsed.integrated_activity !== false,
        all: true, // "all" is always visible
      }
    }
  } catch {}
  return { polio_campaign: true, integrated_activity: true, all: true }
}

function saveVisibility(visibility: Record<CampaignType, boolean>) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(VISIBILITY_KEY, JSON.stringify(visibility))
  }
}

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaign, setCampaignState] = useState<CampaignType>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && ['polio_campaign', 'integrated_activity', 'all'].includes(stored)) {
        return stored as CampaignType
      }
    }
    return 'polio_campaign'
  })

  const [visibility, setVisibility] = useState<Record<CampaignType, boolean>>(loadVisibility)

  const setCampaign = useCallback((newCampaign: CampaignType) => {
    setCampaignState(newCampaign)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newCampaign)
    }
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, campaign)
  }, [campaign])

  useEffect(() => {
    saveVisibility(visibility)
  }, [visibility])

  // If current campaign becomes hidden, switch to 'all'
  useEffect(() => {
    if (campaign !== 'all' && !visibility[campaign]) {
      setCampaign('all')
    }
  }, [campaign, visibility, setCampaign])

  const isCampaignVisible = useCallback((id: CampaignType) => {
    return visibility[id] !== false
  }, [visibility])

  const toggleCampaignVisibility = useCallback((id: CampaignType) => {
    if (id === 'all') return // Can't hide "all"
    setVisibility(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const setCampaignVisibility = useCallback((id: CampaignType, visible: boolean) => {
    if (id === 'all') return // Can't hide "all"
    setVisibility(prev => ({ ...prev, [id]: visible }))
  }, [])

  const currentOption = CAMPAIGN_OPTIONS.find(o => o.id === campaign) ?? CAMPAIGN_OPTIONS[0]

  // Filter options based on visibility
  const visibleOptions = CAMPAIGN_OPTIONS.filter(o => visibility[o.id] !== false)
  const allOptions = CAMPAIGN_OPTIONS

  const value: CampaignContextValue = {
    campaign,
    setCampaign,
    currentOption,
    isFiltered: campaign !== 'all',
    labelAr: currentOption.labelAr,
    visibleOptions,
    allOptions,
    isCampaignVisible,
    toggleCampaignVisibility,
    setCampaignVisibility,
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
