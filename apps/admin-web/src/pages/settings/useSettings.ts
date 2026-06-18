import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isConfigured } from '@/lib/supabase'
import type { IPEntry, SMTPConfig, ExportState, ImportState, BackupState, ClearState } from './helpers'

export interface SettingsState {
  // General
  appName: string
  language: string
  timezone: string
  syncInterval: string
  dateFormat: string
  defaultSubmissionStatus: string
  autoSaveInterval: string
  // Security
  sessionTimeout: number
  rateLimit: string
  twoFactor: boolean
  minPasswordLength: string
  requireSpecialChars: boolean
  requireNumbers: boolean
  maxLoginAttempts: string
  ipWhitelist: IPEntry[]
  // Notifications
  emailNotifs: boolean
  pushNotifs: boolean
  criticalAlerts: boolean
  lowSubmissionAlerts: boolean
  dailyReport: boolean
  weeklyReport: boolean
  notificationSound: boolean
  criticalThreshold: string
  lowSubmissionThreshold: string
  smtpConfig: SMTPConfig
  // Appearance
  primaryColor: string
  fontSize: number
  density: 'compact' | 'comfortable' | 'spacious'
  sidebarPosition: 'right' | 'left'
  logoUrl: string
}

const DEFAULTS: SettingsState = {
  appName: 'EPI Supervisor',
  language: 'ar',
  timezone: 'Asia/Aden',
  syncInterval: '5',
  dateFormat: 'dd/MM/yyyy',
  defaultSubmissionStatus: 'draft',
  autoSaveInterval: '30',
  sessionTimeout: 60,
  rateLimit: '10',
  twoFactor: false,
  minPasswordLength: '8',
  requireSpecialChars: true,
  requireNumbers: true,
  maxLoginAttempts: '5',
  ipWhitelist: [],
  emailNotifs: true,
  pushNotifs: true,
  criticalAlerts: true,
  lowSubmissionAlerts: false,
  dailyReport: false,
  weeklyReport: false,
  notificationSound: true,
  criticalThreshold: '3',
  lowSubmissionThreshold: '10',
  smtpConfig: { host: '', port: '587', user: '', pass: '', fromAddress: '', fromName: 'EPI Supervisor' },
  primaryColor: '#3b82f6',
  fontSize: 14,
  density: 'comfortable',
  sidebarPosition: 'right',
  logoUrl: '',
}

export interface SystemInfo {
  version: string
  uptime: string
  storageUsed: string
  apiStatus: 'online' | 'offline' | 'checking'
  dbStats: { profiles: number; submissions: number; forms: number; shortages: number }
}

export function useSettings() {
  const [state, setState] = useState<SettingsState>(DEFAULTS)
  const [saved, setSaved] = useState(false)

  // System info
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    version: '1.0.0',
    uptime: '',
    storageUsed: '0 KB',
    apiStatus: 'checking',
    dbStats: { profiles: 0, submissions: 0, forms: 0, shortages: 0 },
  })

  // Data management state
  const [exportState, setExportState] = useState<ExportState>({ loading: false, progress: 0, table: '', format: 'json' })
  const [importState, setImportState] = useState<ImportState>({ loading: false, progress: 0, table: '', preview: [], conflictStrategy: 'skip' })
  const [backupState, setBackupState] = useState<BackupState>({ loading: false, progress: 0, phase: '' })
  const [clearState, setClearState] = useState<ClearState>({ loading: false, table: '', progress: 0 })
  const importFullDataRef = useRef<Record<string, unknown>[]>([])

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('epi-settings')
      if (!raw) return
      const s = JSON.parse(raw)
      setState(prev => {
        const next = { ...prev }
        if (s.general) {
          if (s.general.appName) next.appName = s.general.appName
          if (s.general.language) next.language = s.general.language
          if (s.general.timezone) next.timezone = s.general.timezone
          if (s.general.syncInterval) next.syncInterval = s.general.syncInterval
          if (s.general.dateFormat) next.dateFormat = s.general.dateFormat
          if (s.general.defaultSubmissionStatus) next.defaultSubmissionStatus = s.general.defaultSubmissionStatus
          if (s.general.autoSaveInterval) next.autoSaveInterval = s.general.autoSaveInterval
        }
        if (s.security) {
          if (s.security.sessionTimeout != null) next.sessionTimeout = s.security.sessionTimeout
          if (s.security.rateLimit) next.rateLimit = s.security.rateLimit
          if (s.security.twoFactor != null) next.twoFactor = s.security.twoFactor
          if (s.security.minPasswordLength) next.minPasswordLength = s.security.minPasswordLength
          if (s.security.requireSpecialChars != null) next.requireSpecialChars = s.security.requireSpecialChars
          if (s.security.requireNumbers != null) next.requireNumbers = s.security.requireNumbers
          if (s.security.maxLoginAttempts) next.maxLoginAttempts = s.security.maxLoginAttempts
          if (s.security.ipWhitelist) next.ipWhitelist = s.security.ipWhitelist
        }
        if (s.notifications) {
          if (s.notifications.emailNotifs != null) next.emailNotifs = s.notifications.emailNotifs
          if (s.notifications.pushNotifs != null) next.pushNotifs = s.notifications.pushNotifs
          if (s.notifications.criticalAlerts != null) next.criticalAlerts = s.notifications.criticalAlerts
          if (s.notifications.lowSubmissionAlerts != null) next.lowSubmissionAlerts = s.notifications.lowSubmissionAlerts
          if (s.notifications.dailyReport != null) next.dailyReport = s.notifications.dailyReport
          if (s.notifications.weeklyReport != null) next.weeklyReport = s.notifications.weeklyReport
          if (s.notifications.notificationSound != null) next.notificationSound = s.notifications.notificationSound
          if (s.notifications.criticalThreshold) next.criticalThreshold = s.notifications.criticalThreshold
          if (s.notifications.lowSubmissionThreshold) next.lowSubmissionThreshold = s.notifications.lowSubmissionThreshold
          if (s.notifications.smtpConfig) next.smtpConfig = s.notifications.smtpConfig
        }
        if (s.appearance) {
          if (s.appearance.primaryColor) next.primaryColor = s.appearance.primaryColor
          if (s.appearance.fontSize) next.fontSize = s.appearance.fontSize
          if (s.appearance.density) next.density = s.appearance.density
          if (s.appearance.sidebarPosition) next.sidebarPosition = s.appearance.sidebarPosition
          if (s.appearance.logoUrl) next.logoUrl = s.appearance.logoUrl
        }
        return next
      })
    } catch {
      // ignore malformed settings
    }
  }, [])

  // Load system info
  const loadSystemInfo = useCallback(async () => {
    if (!isConfigured) {
      setSystemInfo(prev => ({ ...prev, apiStatus: 'offline' }))
      return
    }
    try {
      setSystemInfo(prev => ({ ...prev, apiStatus: 'checking' }))
      const startTime = performance.now()
      const [usersRes, subsRes, formsRes, shortagesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('form_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('forms').select('id', { count: 'exact', head: true }),
        supabase.from('supply_shortages').select('id', { count: 'exact', head: true }),
      ])
      const elapsed = Math.round(performance.now() - startTime)
      const uptimeSeconds = Math.floor(performance.now() / 1000)
      const hours = Math.floor(uptimeSeconds / 3600)
      const minutes = Math.floor((uptimeSeconds % 3600) / 60)
      setSystemInfo({
        version: '1.0.0',
        uptime: `${hours}س ${minutes}د`,
        storageUsed: '~-- MB',
        apiStatus: elapsed < 5000 ? 'online' : 'offline',
        dbStats: {
          profiles: usersRes.count || 0,
          submissions: subsRes.count || 0,
          forms: formsRes.count || 0,
          shortages: shortagesRes.count || 0,
        },
      })
    } catch {
      setSystemInfo(prev => ({ ...prev, apiStatus: 'offline' }))
    }
  }, [])

  useEffect(() => { loadSystemInfo() }, [loadSystemInfo])

  // Update a single field
  const update = useCallback(<K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setState(prev => ({ ...prev, [key]: value }))
  }, [])

  // Save to localStorage
  const handleSave = useCallback(() => {
    const allSettings = {
      general: {
        appName: state.appName, language: state.language, timezone: state.timezone,
        syncInterval: state.syncInterval, dateFormat: state.dateFormat,
        defaultSubmissionStatus: state.defaultSubmissionStatus, autoSaveInterval: state.autoSaveInterval,
      },
      security: {
        sessionTimeout: state.sessionTimeout, rateLimit: state.rateLimit, twoFactor: state.twoFactor,
        minPasswordLength: state.minPasswordLength, requireSpecialChars: state.requireSpecialChars,
        requireNumbers: state.requireNumbers, maxLoginAttempts: state.maxLoginAttempts,
        ipWhitelist: state.ipWhitelist,
      },
      notifications: {
        emailNotifs: state.emailNotifs, pushNotifs: state.pushNotifs, criticalAlerts: state.criticalAlerts,
        lowSubmissionAlerts: state.lowSubmissionAlerts, dailyReport: state.dailyReport,
        weeklyReport: state.weeklyReport, notificationSound: state.notificationSound,
        criticalThreshold: state.criticalThreshold, lowSubmissionThreshold: state.lowSubmissionThreshold,
        smtpConfig: state.smtpConfig,
      },
      appearance: {
        primaryColor: state.primaryColor, fontSize: state.fontSize, density: state.density,
        sidebarPosition: state.sidebarPosition, logoUrl: state.logoUrl,
      },
    }
    localStorage.setItem('epi-settings', JSON.stringify(allSettings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }, [state])

  return {
    state, update, saved, handleSave,
    systemInfo, loadSystemInfo,
    exportState, setExportState,
    importState, setImportState,
    backupState, setBackupState,
    clearState, setClearState,
    importFullDataRef,
  }
}
