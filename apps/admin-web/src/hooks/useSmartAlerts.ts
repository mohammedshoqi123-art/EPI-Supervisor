// ═══════════════════════════════════════════════════════════════
// Smart Alerts Hook — Proactive Anomaly Detection
// تنبيهات ذكية تلقائية — كشف الشذوذ في البيانات
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import { AnomalyDetector, type Anomaly, type TrendPoint } from '@/lib/epi-bot-engine'
import { useDashboardStats, useSubmissionsChart, useGovernorateStats, useShortages, useUsers } from '@/hooks/useApi'

export interface SmartAlert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  suggestion: string
  action?: string
  source: 'anomaly' | 'coverage' | 'shortage' | 'inactivity' | 'stale'
  timestamp: number
}

/**
 * Generate smart alerts from all available data sources
 */
export function useSmartAlerts() {
  const { data: stats } = useDashboardStats()
  const { data: chartData } = useSubmissionsChart()
  const { data: govStats } = useGovernorateStats()
  const { data: shortages } = useShortages()
  const { data: users } = useUsers()

  const alerts = useMemo<SmartAlert[]>(() => {
    const result: SmartAlert[] = []

    // ── 1. Time-series anomaly detection (submissions trend) ──
    if (chartData && chartData.length >= 5) {
      const trendPoints: TrendPoint[] = chartData.map(d => ({
        date: d.date,
        value: (d.submitted || 0) + (d.draft || 0),
      }))

      const anomalies = AnomalyDetector.detectTimeSeriesAnomalies(trendPoints, 'إرساليات')
      for (const a of anomalies) {
        result.push({
          id: a.id,
          severity: a.severity,
          title: a.title,
          description: a.description,
          suggestion: a.suggestion,
          source: 'anomaly',
          timestamp: a.timestamp,
        })
      }
    }

    // ── 2. Zero-coverage governorates ──
    if (govStats && govStats.length > 0) {
      const zeroGovs = govStats.filter(g => g.submissions === 0)
      if (zeroGovs.length > 0) {
        const names = zeroGovs.slice(0, 3).map(g => g.name).join('، ')
        result.push({
          id: 'zero-coverage-govs',
          severity: zeroGovs.length > 3 ? 'critical' : 'warning',
          title: `${zeroGovs.length} محافظة بدون تغطية`,
          description: `المحافظات بدون إرساليات: ${names}${zeroGovs.length > 3 ? ` و${zeroGovs.length - 3} أخرى` : ''}`,
          suggestion: 'تواصل مع مشرفي هذه المحافظات للتأكد من عملهم',
          source: 'coverage',
          timestamp: Date.now(),
        })
      }
    }

    // ── 3. Unresolved shortages ──
    if (shortages && shortages.length > 0) {
      const unresolved = shortages.filter(s => !s.is_resolved)
      const critical = unresolved.filter(s => s.severity === 'critical')

      if (critical.length > 0) {
        result.push({
          id: 'critical-shortages',
          severity: 'critical',
          title: `${critical.length} نقص حرج`,
          description: critical.slice(0, 3).map(s => `${s.item_name} (${s.governorates?.name_ar || 'غير معروف'})`).join('، '),
          suggestion: 'هذه نواقص حرجة تحتاج تدخل فوري لتوفير المستلزمات',
          source: 'shortage',
          timestamp: Date.now(),
        })
      }

      if (unresolved.length > critical.length) {
        result.push({
          id: 'unresolved-shortages',
          severity: 'warning',
          title: `${unresolved.length} نقص غير محلول`,
          description: `من أصل ${shortages.length} نقص مسجل، ${unresolved.length} لم يُحل بعد`,
          suggestion: 'راجع صفحة النواقص وتابع حلولها',
          source: 'shortage',
          timestamp: Date.now(),
        })
      }
    }

    // ── 4. Inactive users today ──
    if (users && chartData) {
      const fieldRoles = ['data_entry', 'district', 'governorate']
      const fieldUsers = users.filter(u => fieldRoles.includes(u.role) && u.is_active)
      const todayStr = new Date().toDateString()

      // Check if there's any submission today
      const todaySubmissions = chartData.filter(d => {
        const dDate = new Date(d.date)
        return dDate.toDateString() === todayStr
      })
      const todayTotal = todaySubmissions.reduce((sum, d) => sum + (d.submitted || 0) + (d.draft || 0), 0)

      if (fieldUsers.length > 0 && todayTotal === 0) {
        const now = new Date()
        const hour = now.getHours()
        // Only alert if it's past 10 AM and no submissions
        if (hour >= 10) {
          result.push({
            id: 'no-submissions-today',
            severity: 'critical',
            title: 'لا إرساليات اليوم!',
            description: `${fieldUsers.length} مشرف ميداني نشط لكن لا توجد إرساليات اليوم حتى الآن`,
            suggestion: 'تحقق هل هناك مشكلة تقنية أو إنذار ميداني',
            source: 'inactivity',
            timestamp: Date.now(),
          })
        }
      }
    }

    // ── 5. Stale data detection ──
    if (stats) {
      // If total submissions hasn't changed in a while (heuristic)
      if (stats.total_submissions > 0 && stats.submissions_today === 0 && stats.submissions_this_week === 0) {
        result.push({
          id: 'stale-data',
          severity: 'warning',
          title: 'بيانات متوقفة',
          description: 'لا توجد إرساليات هذا الأسبوع رغم وجود بيانات سابقة',
          suggestion: 'تأكد من أن المستخدمين يرسلون البيانات وأن النظام يعمل بشكل طبيعي',
          source: 'stale',
          timestamp: Date.now(),
        })
      }
    }

    // Sort: critical first, then warning, then info
    return result.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 }
      return order[a.severity] - order[b.severity]
    })
  }, [stats, chartData, govStats, shortages, users])

  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const warningCount = alerts.filter(a => a.severity === 'warning').length

  return {
    alerts,
    criticalCount,
    warningCount,
    hasAlerts: alerts.length > 0,
  }
}
