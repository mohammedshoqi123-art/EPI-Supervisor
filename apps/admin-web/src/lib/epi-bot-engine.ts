// ═══════════════════════════════════════════════════════════════
// EPI-Bot Engine — Core NLP/AI Engine for EPI Supervisor
// ═══════════════════════════════════════════════════════════════

// ─── Types ───────────────────────────────────────────────────

export interface ConversationContext {
  userId: string
  sessionId: string
  history: ConversationTurn[]
  metadata: Record<string, unknown>
  lastIntent?: string
  lastEntities?: Record<string, string>
  createdAt: number
  updatedAt: number
}

export interface ConversationTurn {
  role: 'user' | 'bot'
  text: string
  intent?: string
  sentiment?: SentimentType
  timestamp: number
  entities?: Record<string, string>
}

export type SentimentType = 'positive' | 'negative' | 'neutral' | 'urgent'

export interface IntentResult {
  intent: string
  confidence: number
  entities: Record<string, string>
  originalText: string
  normalizedText: string
}

export interface SentimentResult {
  sentiment: SentimentType
  score: number
  keywords: string[]
  urgencyLevel: number // 0-10
}

export interface BotResponse {
  text: string
  intent: string
  sentiment: SentimentType
  suggestions: string[]
  actions: BotAction[]
  data?: Record<string, unknown>
  source: 'local' | 'ai' | 'hybrid'
}

export interface BotAction {
  id: string
  label: string
  type: 'navigate' | 'query' | 'command'
  payload: string
  color?: string
}

// Alias for widget compatibility
export type CopilotAction = BotAction

// ─── Anomaly Detection Types ─────────────────────────────────

export interface Anomaly {
  id: string
  type: 'drop' | 'spike' | 'zero' | 'stale' | 'pattern' | 'gap'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  metric: string
  currentValue: number
  expectedValue: number
  deviation: number
  suggestion: string
  timestamp: number
}

export interface TrendPoint {
  date: string
  value: number
}

export interface SmartReport {
  id: string
  title: string
  summary: string
  score: number // 0-100
  anomalies: Anomaly[]
  insights: string[]
  recommendations: string[]
  trend: 'improving' | 'declining' | 'stable'
  generatedAt: number
}

// ─── Anomaly Detection Engine ────────────────────────────────

export class AnomalyDetector {
  /**
   * Detect anomalies in time series data
   */
  static detectTimeSeriesAnomalies(
    data: TrendPoint[],
    metricName: string,
    options?: { threshold?: number; minDataPoints?: number }
  ): Anomaly[] {
    const anomalies: Anomaly[] = []
    const threshold = options?.threshold ?? 2 // standard deviations
    const minPoints = options?.minDataPoints ?? 5

    if (data.length < minPoints) return anomalies

    const values = data.map(d => d.value)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length)

    // Check last 3 points for anomalies
    const recent = data.slice(-3)
    for (const point of recent) {
      const deviation = stdDev > 0 ? Math.abs(point.value - mean) / stdDev : 0

      if (deviation > threshold && point.value < mean) {
        anomalies.push({
          id: `drop-${metricName}-${point.date}`,
          type: 'drop',
          severity: deviation > 3 ? 'critical' : 'warning',
          title: `انخفاض مفاجئ في ${metricName}`,
          description: `القيمة ${point.value} أقل من المتوسط (${mean.toFixed(0)}) بـ ${deviation.toFixed(1)} انحراف معياري`,
          metric: metricName,
          currentValue: point.value,
          expectedValue: mean,
          deviation,
          suggestion: 'تحقق من أسباب الانخفاض — هل هناك عطل تقني أم مشكلة ميدانية؟',
          timestamp: Date.now(),
        })
      }

      if (deviation > threshold && point.value > mean * 1.5) {
        anomalies.push({
          id: `spike-${metricName}-${point.date}`,
          type: 'spike',
          severity: 'info',
          title: `ارتفاع مفاجئ في ${metricName}`,
          description: `القيمة ${point.value} أعلى من المتوسط (${mean.toFixed(0)}) بشكل ملحوظ`,
          metric: metricName,
          currentValue: point.value,
          expectedValue: mean,
          deviation,
          suggestion: 'تحقق من سبب الارتفاع — هل هناك حملة أو حدث خاص؟',
          timestamp: Date.now(),
        })
      }
    }

    // Check for zero values in recent data
    const lastPoint = data[data.length - 1]
    if (lastPoint && lastPoint.value === 0 && mean > 0) {
      anomalies.push({
        id: `zero-${metricName}-${lastPoint.date}`,
        type: 'zero',
        severity: 'critical',
        title: `صفر ${metricName}!`,
        description: `لا توجد إرساليات اليوم رغم أن المتوسط ${mean.toFixed(0)}`,
        metric: metricName,
        currentValue: 0,
        expectedValue: mean,
        deviation: Infinity,
        suggestion: 'تحقق فوراً — هل النظام يعمل؟ هل المستخدمين نشطين؟',
        timestamp: Date.now(),
      })
    }

    // Check for stale data (same value for 3+ days)
    if (data.length >= 3) {
      const last3 = data.slice(-3).map(d => d.value)
      if (last3.every(v => v === last3[0]) && last3[0] > 0) {
        anomalies.push({
          id: `stale-${metricName}`,
          type: 'stale',
          severity: 'warning',
          title: `بيانات متكررة — ${metricName}`,
          description: `نفس القيمة (${last3[0]}) منذ 3 أيام. قد تكون بيانات معلقة.`,
          metric: metricName,
          currentValue: last3[0],
          expectedValue: mean,
          deviation: 0,
          suggestion: 'تحقق من عملية المزامنة — هل البيانات تتحدث فعلياً؟',
          timestamp: Date.now(),
        })
      }
    }

    return anomalies
  }

  /**
   * Detect coverage gaps — governorates with zero submissions
   */
  static detectCoverageGaps(
    govStats: { name: string; submissions: number }[]
  ): Anomaly[] {
    const anomalies: Anomaly[] = []
    const zeroGovs = govStats.filter(g => g.submissions === 0)

    if (zeroGovs.length > 0) {
      anomalies.push({
        id: `coverage-gap-${zeroGovs.length}`,
        type: 'gap',
        severity: zeroGovs.length > 3 ? 'critical' : 'warning',
        title: `${zeroGovs.length} محافظة بدون تغطية`,
        description: zeroGovs.map(g => g.name).join('، '),
        metric: 'coverage',
        currentValue: govStats.length - zeroGovs.length,
        expectedValue: govStats.length,
        deviation: zeroGovs.length,
        suggestion: 'أرسل فرق متنقلة أو تواصل مع مشرفي هذه المحافظات',
        timestamp: Date.now(),
      })
    }

    return anomalies
  }

  /**
   * Detect user activity anomalies
   */
  static detectUserAnomalies(
    totalUsers: number,
    activeUsers: number,
    submissionsToday: number
  ): Anomaly[] {
    const anomalies: Anomaly[] = []

    if (totalUsers > 0) {
      const inactiveRatio = (totalUsers - activeUsers) / totalUsers
      if (inactiveRatio > 0.5) {
        anomalies.push({
          id: 'inactive-users-high',
          type: 'pattern',
          severity: 'warning',
          title: 'نسبة مستخدمين غير نشطين مرتفعة',
          description: `${(inactiveRatio * 100).toFixed(0)}% من المستخدمين غير نشطين (${totalUsers - activeUsers} من ${totalUsers})`,
          metric: 'users',
          currentValue: activeUsers,
          expectedValue: totalUsers * 0.7,
          deviation: inactiveRatio,
          suggestion: 'راجع حسابات المستخدمين وأرسل تذكيرات',
          timestamp: Date.now(),
        })
      }

      if (activeUsers > 0 && submissionsToday === 0) {
        anomalies.push({
          id: 'no-submissions-active-users',
          type: 'zero',
          severity: 'critical',
          title: 'لا إرساليات مع وجود مستخدمين نشطين',
          description: `${activeUsers} مستخدم نشط لكن لا توجد إرساليات اليوم`,
          metric: 'submissions',
          currentValue: 0,
          expectedValue: activeUsers * 2,
          deviation: Infinity,
          suggestion: 'تواصل مع المستخدمين — هل يواجهون مشكلة تقنية؟',
          timestamp: Date.now(),
        })
      }
    }

    return anomalies
  }
}

// ─── Smart Report Generator ──────────────────────────────────

export class SmartReportGenerator {
  static generate(
    stats: {
      total_submissions: number
      submissions_today: number
      submissions_this_week: number
      approval_rate: number
      total_users: number
      active_users: number
      total_forms: number
      active_forms: number
    },
    govStats?: { name: string; submissions: number }[],
    chartData?: { date: string; submitted: number; draft: number }[]
  ): SmartReport {
    const anomalies: Anomaly[] = []
    const insights: string[] = []
    const recommendations: string[] = []

    // 1. Anomaly Detection
    if (govStats) {
      anomalies.push(...AnomalyDetector.detectCoverageGaps(govStats))
    }

    anomalies.push(...AnomalyDetector.detectUserAnomalies(
      stats.total_users, stats.active_users, stats.submissions_today
    ))

    if (chartData && chartData.length >= 7) {
      const submittedTrend = chartData.map(d => ({ date: d.date, value: d.submitted }))
      anomalies.push(...AnomalyDetector.detectTimeSeriesAnomalies(submittedTrend, 'إرساليات'))
    }

    // 2. Score Calculation (0-100)
    let score = 100
    for (const a of anomalies) {
      if (a.severity === 'critical') score -= 20
      else if (a.severity === 'warning') score -= 10
      else score -= 3
    }
    if (stats.approval_rate < 70) score -= 15
    if (stats.submissions_today === 0) score -= 10
    score = Math.max(0, Math.min(100, score))

    // 3. Trend Analysis
    let trend: 'improving' | 'declining' | 'stable' = 'stable'
    if (chartData && chartData.length >= 14) {
      const firstWeek = chartData.slice(0, 7).reduce((s, d) => s + d.submitted, 0)
      const secondWeek = chartData.slice(7, 14).reduce((s, d) => s + d.submitted, 0)
      if (secondWeek > firstWeek * 1.1) trend = 'improving'
      else if (secondWeek < firstWeek * 0.9) trend = 'declining'
    }

    // 4. Insights
    if (stats.approval_rate >= 85) {
      insights.push(`✅ معدل الاعتماد ممتاز (${stats.approval_rate.toFixed(0)}%) — جودة عالية في الإدخال`)
    } else if (stats.approval_rate < 70) {
      insights.push(`⚠️ معدل الاعتماد منخفض (${stats.approval_rate.toFixed(0)}%) — يحتاج تحسين`)
    }

    const activeRatio = stats.total_users > 0
      ? ((stats.active_users / stats.total_users) * 100).toFixed(0)
      : '0'
    insights.push(`👥 ${stats.active_users} من ${stats.total_users} مستخدم نشط (${activeRatio}%)`)

    if (stats.submissions_today > 0) {
      insights.push(`📋 ${stats.submissions_today} إرسالية اليوم من أصل ${stats.submissions_this_week} هذا الأسبوع`)
    }

    if (govStats && govStats.length > 0) {
      const topGov = govStats[0]
      insights.push(`🏆 ${topGov.name} الأكثر نشاطاً بـ ${topGov.submissions} إرسالية`)
    }

    if (trend === 'improving') {
      insights.push('📈 الاتجاه العام متحسن مقارنة بالأسبوع الماضي')
    } else if (trend === 'declining') {
      insights.push('📉 الاتجاه العام في تراجع مقارنة بالأسبوع الماضي')
    }

    // 5. Recommendations
    if (stats.submissions_today < 5 && stats.active_users > 5) {
      recommendations.push('أرسل تذكير للمستخدمين النشطين لزيادة الإدخال')
    }
    if (stats.approval_rate < 70) {
      recommendations.push('راجع أسباب الرفض وعقد جلسة تدريب للمدخلين')
    }
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical')
    if (criticalAnomalies.length > 0) {
      recommendations.push(`عالج ${criticalAnomalies.length} مشكلة حرجة فوراً`)
    }
    if (govStats) {
      const zeroGovs = govStats.filter(g => g.submissions === 0)
      if (zeroGovs.length > 0) {
        recommendations.push(`تواصل مع مشرفي ${zeroGovs.length} محافظة بدون إرساليات`)
      }
    }
    if (recommendations.length === 0) {
      recommendations.push('حافظ على المستوى الحالي — الأداء جيد 👍')
    }

    // 6. Summary
    const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴'
    const status = score >= 80 ? 'ممتاز' : score >= 60 ? 'متوسط' : 'يحتاج تحسين'
    const summary = `${emoji} تقييم النظام: ${score}/100 — ${status}\n${trend === 'improving' ? '📈 تحسن' : trend === 'declining' ? '📉 تراجع' : '➡️ مستقر'}`

    return {
      id: `report-${Date.now()}`,
      title: 'تقرير ذكي — ملخص النظام',
      summary,
      score,
      anomalies,
      insights,
      recommendations,
      trend,
      generatedAt: Date.now(),
    }
  }
}

// ─── Feedback Tracker ────────────────────────────────────────

export class FeedbackTracker {
  private static STORAGE_KEY = 'epi-copilot-feedback'

  static record(messageId: string, feedback: 'up' | 'down', intent?: string): void {
    try {
      const stored = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]')
      stored.push({
        messageId,
        feedback,
        intent,
        timestamp: Date.now(),
      })
      // Keep last 500 entries
      if (stored.length > 500) stored.splice(0, stored.length - 500)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored))
    } catch { /* ignore */ }
  }

  static getStats(): { total: number; positive: number; negative: number; byIntent: Record<string, { up: number; down: number }> } {
    try {
      const stored = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]')
      const byIntent: Record<string, { up: number; down: number }> = {}
      let positive = 0
      let negative = 0

      for (const entry of stored) {
        if (entry.feedback === 'up') positive++
        else negative++

        if (entry.intent) {
          if (!byIntent[entry.intent]) byIntent[entry.intent] = { up: 0, down: 0 }
          const key = entry.feedback as 'up' | 'down'
          byIntent[entry.intent][key]++
        }
      }

      return { total: stored.length, positive, negative, byIntent }
    } catch {
      return { total: 0, positive: 0, negative: 0, byIntent: {} }
    }
  }

  static getWeakIntents(): string[] {
    const stats = this.getStats()
    return Object.entries(stats.byIntent)
      .filter(([_, s]) => s.down > s.up && s.down >= 3)
      .map(([intent]) => intent)
  }
}

// ─── Predictive Analytics Engine ─────────────────────────────

export class PredictiveEngine {
  /**
   * Simple Linear Regression forecast
   * Predicts next N values based on historical trend
   */
  static linearForecast(data: number[], periods: number = 7): {
    predictions: number[]
    slope: number
    intercept: number
    r2: number
    trend: 'rising' | 'falling' | 'flat'
  } {
    const n = data.length
    if (n < 3) return { predictions: [], slope: 0, intercept: 0, r2: 0, trend: 'flat' }

    // Calculate means
    const xMean = (n - 1) / 2
    const yMean = data.reduce((a, b) => a + b, 0) / n

    // Calculate slope and intercept
    let num = 0, den = 0
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (data[i] - yMean)
      den += (i - xMean) ** 2
    }
    const slope = den !== 0 ? num / den : 0
    const intercept = yMean - slope * xMean

    // R-squared
    const ssRes = data.reduce((sum, y, i) => sum + (y - (slope * i + intercept)) ** 2, 0)
    const ssTot = data.reduce((sum, y) => sum + (y - yMean) ** 2, 0)
    const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 0

    // Predictions
    const predictions: number[] = []
    for (let i = n; i < n + periods; i++) {
      predictions.push(Math.max(0, Math.round(slope * i + intercept)))
    }

    // Trend determination
    const trend = slope > 0.5 ? 'rising' : slope < -0.5 ? 'falling' : 'flat'

    return { predictions, slope, intercept, r2: Math.max(0, r2), trend }
  }

  /**
   * Moving Average forecast
   */
  static movingAverage(data: number[], windowSize: number = 7, periods: number = 7): number[] {
    if (data.length < windowSize) return []

    const predictions: number[] = []
    let window = data.slice(-windowSize)

    for (let i = 0; i < periods; i++) {
      const avg = window.reduce((a, b) => a + b, 0) / window.length
      predictions.push(Math.max(0, Math.round(avg)))
      window = [...window.slice(1), avg]
    }

    return predictions
  }

  /**
   * Seasonal decomposition (weekly pattern)
   */
  static detectSeasonality(data: number[]): {
    hasSeasonality: boolean
    period: number
    strength: number
    pattern: number[]
  } {
    if (data.length < 14) return { hasSeasonality: false, period: 0, strength: 0, pattern: [] }

    // Check for weekly pattern (7-day)
    const period = 7
    const numCycles = Math.floor(data.length / period)
    if (numCycles < 2) return { hasSeasonality: false, period: 0, strength: 0, pattern: [] }

    // Calculate average for each day of the week
    const pattern: number[] = Array(period).fill(0)
    const counts: number[] = Array(period).fill(0)

    for (let i = 0; i < data.length; i++) {
      const dayIndex = i % period
      pattern[dayIndex] += data[i]
      counts[dayIndex]++
    }

    for (let i = 0; i < period; i++) {
      pattern[i] = counts[i] > 0 ? pattern[i] / counts[i] : 0
    }

    // Calculate seasonality strength
    const patternMean = pattern.reduce((a, b) => a + b, 0) / period
    const patternVariance = pattern.reduce((sum, v) => sum + (v - patternMean) ** 2, 0) / period
    const totalVariance = data.reduce((sum, v) => sum + (v - (data.reduce((a, b) => a + b, 0) / data.length)) ** 2, 0) / data.length
    const strength = totalVariance > 0 ? Math.min(1, patternVariance / totalVariance) : 0

    return {
      hasSeasonality: strength > 0.3,
      period,
      strength,
      pattern: pattern.map(v => Math.round(v)),
    }
  }

  /**
   * Generate comprehensive forecast report
   */
  static generateForecast(
    dailyData: { date: string; count: number }[],
    metricName: string = 'إرساليات'
  ): {
    forecast: number[]
    confidence: 'high' | 'medium' | 'low'
    trend: string
    seasonality: string
    summary: string
  } {
    const values = dailyData.map(d => d.count)

    const lr = this.linearForecast(values, 7)
    const ma = this.movingAverage(values, 7, 7)
    const seasonal = this.detectSeasonality(values)

    // Blend forecasts (weighted average)
    const forecast = lr.predictions.map((v, i) => {
      const lrWeight = lr.r2 > 0.5 ? 0.6 : 0.3
      const maWeight = 1 - lrWeight
      return Math.round(v * lrWeight + (ma[i] || v) * maWeight)
    })

    // Confidence based on R² and data quality
    const confidence = lr.r2 > 0.7 ? 'high' : lr.r2 > 0.4 ? 'medium' : 'low'

    // Trend description
    const trendDesc = lr.trend === 'rising'
      ? `📈 اتجاه صاعد — زيادة بـ ${Math.abs(lr.slope).toFixed(1)} ${metricName}/يوم`
      : lr.trend === 'falling'
        ? `📉 اتجاه هابط — انخفاض بـ ${Math.abs(lr.slope).toFixed(1)} ${metricName}/يوم`
        : `➡️ اتجاه مستقر`

    // Seasonality description
    const seasonDesc = seasonal.hasSeasonality
      ? `🔄 نمط أسبوعي مكتشف (قوة ${(seasonal.strength * 100).toFixed(0)}%)`
      : ''

    // Summary
    const nextWeekTotal = forecast.reduce((a, b) => a + b, 0)
    const thisWeekTotal = values.slice(-7).reduce((a, b) => a + b, 0)
    const changePercent = thisWeekTotal > 0 ? ((nextWeekTotal - thisWeekTotal) / thisWeekTotal * 100).toFixed(0) : '0'

    const summary = [
      `🔮 توقعات ${metricName} — الأسبوع القادم:`,
      `📊 المتوقع: ${nextWeekTotal} إرسالية (${changePercent > '0' ? '+' : ''}${changePercent}% مقارنة بهذا الأسبوع)`,
      trendDesc,
      seasonDesc,
      `🎯 الثقة: ${confidence === 'high' ? 'عالية' : confidence === 'medium' ? 'متوسطة' : 'منخفضة'}`,
    ].filter(Boolean).join('\n')

    return { forecast, confidence, trend: trendDesc, seasonality: seasonDesc, summary }
  }
}

// ─── NL-to-SQL Engine ────────────────────────────────────────

export class NLToSQLEngine {
  /**
   * Convert natural language question to Supabase query params
   * Returns structured query info (not raw SQL for security)
   */
  static parseQuestion(question: string): {
    table: string
    filters: Record<string, unknown>
    select: string
    orderBy?: string
    limit?: number
    description: string
  } | null {
    const normalized = normalizeArabic(question)
    const tokens = tokenizeArabic(normalized)

    // Detect table
    let table = 'form_submissions'
    let select = '*'
    let orderBy = 'created_at'
    let limit = 100
    const filters: Record<string, unknown> = {}
    let description = ''

    // Submissions queries
    if (tokens.some(t => ['ارسالي', 'ارسال', 'تقديم', 'استمار'].some(k => normalizeArabic(k).includes(t)))) {
      table = 'form_submissions'
      select = 'id, status, created_at, governorate_id, form_id, submitted_by'
      description = 'الإرساليات'
    }
    // Governorate queries
    else if (tokens.some(t => ['محافظ', 'منطق', 'جغراف'].some(k => normalizeArabic(k).includes(t)))) {
      table = 'governorates'
      select = 'id, name_ar, is_active'
      description = 'المحافظات'
    }
    // User queries
    else if (tokens.some(t => ['مستخدم', 'فريق', 'موظف', 'حساب'].some(k => normalizeArabic(k).includes(t)))) {
      table = 'profiles'
      select = 'id, full_name, role, is_active, governorate_id'
      description = 'المستخدمين'
    }
    // Shortage queries
    else if (tokens.some(t => ['نقص', 'نواقص', 'مستلزم', 'تجهز'].some(k => normalizeArabic(k).includes(t)))) {
      table = 'supply_shortages'
      select = 'id, item_name, severity, is_resolved, governorate_id'
      description = 'النواقص'
    }
    // Form queries
    else if (tokens.some(t => ['استمار', 'نموذج', 'قالب'].some(k => normalizeArabic(k).includes(t)))) {
      table = 'forms'
      select = 'id, title_ar, is_active, campaign_type'
      description = 'النماذج'
    }

    // Time filters
    if (normalized.includes('اليوم')) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      filters.created_at = `gte:${today.toISOString()}`
      description += ' — اليوم'
    } else if (normalized.includes('امس') || normalized.includes('أمس')) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      filters.created_at = `gte:${yesterday.toISOString()}:lt:${today.toISOString()}`
      description += ' — أمس'
    } else if (normalized.includes('اسبوع') || normalized.includes('أسبوع')) {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      filters.created_at = `gte:${weekAgo.toISOString()}`
      description += ' — هذا الأسبوع'
    } else if (normalized.includes('شهر')) {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      filters.created_at = `gte:${monthAgo.toISOString()}`
      description += ' — هذا الشهر'
    }

    // Status filters
    if (normalized.includes('مسود')) {
      filters.status = 'draft'
      description += ' — مسودات'
    } else if (normalized.includes('مرسل') || normalized.includes('مقدم')) {
      filters.status = 'submitted'
      description += ' — مرسلة'
    }

    // Active/inactive filters
    if (normalized.includes('نشط')) {
      filters.is_active = true
      description += ' — نشطين'
    } else if (normalized.includes('غير نشط') || normalized.includes('خامل')) {
      filters.is_active = false
      description += ' — غير نشطين'
    }

    // Severity filters
    if (normalized.includes('حرج')) {
      filters.severity = 'critical'
      description += ' — حرج'
    }

    // Count query
    if (tokens.some(t => ['كم', 'عدد', 'اجمالي'].some(k => normalizeArabic(k).includes(t)))) {
      select = 'id'
      description = `عدد ${description}`
    }

    // Sort
    if (normalized.includes('احدث') || normalized.includes('جديد')) {
      orderBy = 'created_at'
    } else if (normalized.includes('اقدم') || normalized.includes('قديم')) {
      orderBy = 'created_at:asc'
    }

    return { table, filters, select, orderBy, limit, description }
  }

  /**
   * Execute parsed query against Supabase
   */
  static async executeQuery(parsed: ReturnType<typeof NLToSQLEngine.parseQuestion>): Promise<{
    data: unknown[]
    count: number
    description: string
  }> {
    if (!parsed) return { data: [], count: 0, description: '' }

    // Import supabase dynamically to avoid circular deps
    const { supabase } = await import('@/lib/supabase')

    let query = supabase.from(parsed.table).select(parsed.select, { count: 'exact' })

    // Apply filters
    for (const [key, value] of Object.entries(parsed.filters)) {
      if (typeof value === 'string' && value.startsWith('gte:')) {
        const parts = value.split(':')
        query = query.gte(key, parts[1])
        if (parts[2]?.startsWith('lt:')) {
          query = query.lt(key, parts[2].replace('lt:', ''))
        }
      } else {
        query = query.eq(key, value)
      }
    }

    // Soft delete
    if (parsed.table !== 'governorates' && parsed.table !== 'forms') {
      query = query.is('deleted_at', null)
    }

    // Order
    const [orderCol, orderDir] = (parsed.orderBy || 'created_at').split(':')
    query = query.order(orderCol, { ascending: orderDir === 'asc' })

    // Limit
    query = query.limit(parsed.limit || 100)

    const { data, count, error } = await query

    if (error) {
      console.error('[NL-to-SQL] Query error:', error)
      return { data: [], count: 0, description: parsed.description }
    }

    return { data: data || [], count: count || 0, description: parsed.description }
  }
}

// ─── Smart Notification Generator ─────────────────────────────

export class SmartNotificationEngine {
  /**
   * Generate smart notifications based on system state
   */
  static generate(
    stats: {
      total_submissions: number
      submissions_today: number
      active_users: number
      total_users: number
      approval_rate: number
    },
    govStats?: { name: string; submissions: number }[]
  ): Array<{
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    body: string
    category: string
    priority: number
    action?: string
    actionUrl?: string
  }> {
    const notifications: Array<{
      type: 'info' | 'warning' | 'error' | 'success'
      title: string
      body: string
      category: string
      priority: number
      action?: string
      actionUrl?: string
    }> = []

    // Zero submissions today with active users
    if (stats.submissions_today === 0 && stats.active_users > 0) {
      notifications.push({
        type: 'warning',
        title: 'لا إرساليات اليوم',
        body: `${stats.active_users} مستخدم نشط لكن لا توجد إرساليات اليوم. قد تكون هناك مشكلة تقنية.`,
        category: 'submission',
        priority: 1,
        action: 'إرسال تذكير',
        actionUrl: '/notifications',
      })
    }

    // Low approval rate
    if (stats.approval_rate < 60 && stats.total_submissions > 20) {
      notifications.push({
        type: 'error',
        title: 'معدل اعتماد منخفض',
        body: `معدل الاعتماد ${stats.approval_rate.toFixed(0)}% فقط — أقل من 60%. يحتاج مراجعة.`,
        category: 'submission',
        priority: 1,
        action: 'مراجعة الإرساليات',
        actionUrl: '/submissions',
      })
    }

    // High inactive ratio
    if (stats.total_users > 0) {
      const inactiveRatio = (stats.total_users - stats.active_users) / stats.total_users
      if (inactiveRatio > 0.5) {
        notifications.push({
          type: 'warning',
          title: 'نسبة غير نشطين مرتفعة',
          body: `${(inactiveRatio * 100).toFixed(0)}% من المستخدمين غير نشطين. راجع الحسابات.`,
          category: 'user',
          priority: 2,
          action: 'إدارة المستخدمين',
          actionUrl: '/users',
        })
      }
    }

    // Governorates with zero coverage
    if (govStats) {
      const zeroGovs = govStats.filter(g => g.submissions === 0)
      if (zeroGovs.length > 0) {
        notifications.push({
          type: 'error',
          title: `${zeroGovs.length} محافظة بدون تغطية`,
          body: zeroGovs.slice(0, 3).map(g => g.name).join('، ') + (zeroGovs.length > 3 ? '...' : ''),
          category: 'location',
          priority: 1,
          action: 'عرض المحافظات',
          actionUrl: '/governorates',
        })
      }
    }

    // Good performance notification
    if (stats.approval_rate >= 90 && stats.submissions_today > 10) {
      notifications.push({
        type: 'success',
        title: 'أداء ممتاز اليوم! 🎉',
        body: `${stats.submissions_today} إرسالية بمعدل اعتماد ${stats.approval_rate.toFixed(0)}%. استمر!`,
        category: 'submission',
        priority: 3,
      })
    }

    return notifications.sort((a, b) => a.priority - b.priority)
  }
}

// ─── Role-Based Insights ─────────────────────────────────────

// ─── AI Form Helper ──────────────────────────────────────────

export class AIFormHelper {
  /**
   * Suggest field values based on user's submission history
   */
  static async getSuggestions(
    formId: string,
    userId: string
  ): Promise<Record<string, unknown>> {
    try {
      const { supabase } = await import('@/lib/supabase')

      // Get user's last 10 submissions for this form
      const { data } = await supabase
        .from('form_submissions')
        .select('data, governorate_id, district_id, gps_lat, gps_lng')
        .eq('form_id', formId)
        .eq('submitted_by', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!data || data.length === 0) return {}

      const suggestions: Record<string, unknown> = {}

      // For each field, find most common value
      const allKeys = new Set<string>()
      data.forEach(d => {
        if (d.data && typeof d.data === 'object') {
          Object.keys(d.data).forEach(k => allKeys.add(k))
        }
      })

      for (const key of allKeys) {
        const values = data
          .map(d => (d.data as Record<string, unknown>)?.[key])
          .filter(v => v !== undefined && v !== null && v !== '')

        if (values.length === 0) continue

        // Most common value
        const freq: Record<string, number> = {}
        values.forEach(v => {
          const k = String(v)
          freq[k] = (freq[k] || 0) + 1
        })
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
        if (sorted.length > 0 && sorted[0][1] >= 2) {
          suggestions[key] = sorted[0][0]
        }
      }

      // Suggest governorate/district from last submission
      const lastSubmission = data[0]
      if (lastSubmission.governorate_id) {
        suggestions._governorate_id = lastSubmission.governorate_id
      }
      if (lastSubmission.district_id) {
        suggestions._district_id = lastSubmission.district_id
      }
      if (lastSubmission.gps_lat && lastSubmission.gps_lng) {
        suggestions._gps = { lat: lastSubmission.gps_lat, lng: lastSubmission.gps_lng }
      }

      return suggestions
    } catch {
      return {}
    }
  }

  /**
   * Validate form data and suggest corrections
   */
  static validateField(key: string, value: unknown, fieldType: string): {
    valid: boolean
    suggestion?: string
    warning?: string
  } {
    if (value === null || value === undefined || value === '') {
      return { valid: true } // Empty is valid (required check is separate)
    }

    switch (fieldType) {
      case 'phone':
        const phoneStr = String(value)
        if (!/^\+?[\d\s-]{7,15}$/.test(phoneStr)) {
          return { valid: false, suggestion: 'صيغة الجوال: +967XXXXXXXX' }
        }
        break

      case 'number':
        if (isNaN(Number(value))) {
          return { valid: false, suggestion: 'يجب أن يكون رقماً' }
        }
        if (Number(value) < 0) {
          return { valid: false, warning: 'القيمة سالبة — تأكد من الصحة' }
        }
        break

      case 'email':
        if (!String(value).includes('@')) {
          return { valid: false, suggestion: 'صيغة البريد: example@domain.com' }
        }
        break

      case 'gps':
        if (typeof value === 'object' && value !== null) {
          const gps = value as { lat?: number; lng?: number }
          if (gps.lat && (gps.lat < -90 || gps.lat > 90)) {
            return { valid: false, suggestion: 'خط العرض يجب أن يكون بين -90 و 90' }
          }
          if (gps.lng && (gps.lng < -180 || gps.lng > 180)) {
            return { valid: false, suggestion: 'خط الطول يجب أن يكون بين -180 و 180' }
          }
        }
        break
    }

    return { valid: true }
  }
}

export class RoleInsights {
  /**
   * Generate insights tailored to user role
   */
  static generateForRole(
    role: string,
    stats: {
      total_submissions: number
      submissions_today: number
      total_users: number
      active_users: number
      approval_rate: number
    }
  ): string[] {
    const insights: string[] = []

    switch (role) {
      case 'admin':
        insights.push(
          `👑 نظرة إدارية: النظام يخدم ${stats.total_users} مستخدم (${stats.active_users} نشط)`,
          `📊 معدل الاعتماد العام: ${stats.approval_rate.toFixed(0)}%`,
          stats.approval_rate < 70
            ? `⚠️ معدل الاعتماد منخفض — مراجعة عمليات الموافقة مطلوبة`
            : `✅ جودة الإدخال مقبولة`,
        )
        break

      case 'central':
        insights.push(
          `🏛️ نظرة مركزية: ${stats.submissions_today} إرسالية اليوم من أصل ${stats.total_submissions}`,
          `📈 الإنتاجية: ${(stats.submissions_today / Math.max(1, stats.active_users)).toFixed(1)} إرسالية/مستخدم نشط`,
        )
        break

      case 'governorate':
        insights.push(
          `🗺️ نظرة المحافظة: ${stats.submissions_today} إرسالية اليوم`,
          stats.submissions_today === 0
            ? `⚠️ لا توجد إرساليات اليوم — تحقق من الفريق الميداني`
            : `✅ الفريق يعمل`,
        )
        break

      case 'district':
        insights.push(
          `📋 نظرة المديرية: ${stats.submissions_today} إرسالية اليوم`,
        )
        break

      case 'data_entry':
        insights.push(
          `✏️ أنت أرسلت ${stats.submissions_today} إرسالية اليوم`,
          stats.submissions_today === 0
            ? `💡 ابدأ بإدخال البيانات من صفحة النماذج`
            : `👍 أحسنت! استمر في الإدخال`,
        )
        break
    }

    return insights
  }
}

export interface ModelChoice {
  provider: 'groq' | 'huggingface' | 'gemini' | 'zai' | 'openrouter'
  model: string
  reason: string
  estimatedLatency: 'fast' | 'medium' | 'slow'
  cost: 'free' | 'low' | 'medium' | 'high'
}

export interface KnowledgeRule {
  id: string
  domain: string
  keywords: string[]
  response: string
  relatedIntents: string[]
  priority: number
}

// ─── Arabic NLP Engine ───────────────────────────────────────

const ARABIC_STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
  'التي', 'الذي', 'الذين', 'اللواتي', 'هو', 'هي', 'هم', 'هن',
  'أنا', 'نحن', 'أنت', 'أنتم', 'أنتن', 'كان', 'كانت', 'يكون',
  'تكون', 'ليس', 'ليست', 'قد', 'لقد', 'سوف', 'لم', 'لن', 'ما',
  'لا', 'إن', 'أن', 'إذا', 'إذ', 'حتى', 'كل', 'بعض', 'أي',
  'بين', 'عند', 'فوق', 'تحت', 'أمام', 'خلف', 'يمين', 'يسار',
  'كيف', 'أين', 'متى', 'لماذا', 'كم', 'هل', 'أم', 'ثم', 'أو',
  'و', 'ف', 'ب', 'ل', 'ال', 'لل', 'بال', 'كال', 'وال',
  'هذا', 'هذه', 'تلك', 'ذاك', 'هنا', 'هناك', 'حيث', 'كي',
  'لكن', 'بعد', 'قبل', 'خلال', 'منذ', 'حول', 'دون', 'ضد',
  'عبر', 'نحو', 'وفق', 'حسب', 'دون', 'غير', 'سوى',
])

const ARABIC_PREFIXES = ['ال', 'و ال', 'ب ال', 'ك ال', 'ل ل', 'و', 'ب', 'ك', 'ل', 'ف', 'س']
const ARABIC_SUFFIXES = ['ة', 'ات', 'ين', 'ون', 'ان', 'يت', 'يا', 'ية', 'هن', 'هم', 'نا', 'كم', 'كن', 'ها', 'ه']

function normalizeArabic(text: string): string {
  return text
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '') // Remove tashkeel
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeArabic(text: string): string[] {
  const normalized = normalizeArabic(text)
  return normalized
    .split(/[\s،؛:.!؟\-\(\)\[\]{}]+/)
    .filter(token => token.length > 1)
}

function removeStopWords(tokens: string[]): string[] {
  return tokens.filter(token => !ARABIC_STOP_WORDS.has(token))
}

function stemArabic(word: string): string {
  let stemmed = word
  // Remove prefixes
  for (const prefix of ARABIC_PREFIXES) {
    if (stemmed.startsWith(prefix) && stemmed.length > prefix.length + 2) {
      stemmed = stemmed.slice(prefix.length)
      break
    }
  }
  // Remove suffixes
  for (const suffix of ARABIC_SUFFIXES) {
    if (stemmed.endsWith(suffix) && stemmed.length > suffix.length + 2) {
      stemmed = stemmed.slice(0, -suffix.length)
      break
    }
  }
  return stemmed
}

// ─── Child Age Parser & Vaccination Schedule ─────────────────

/**
 * يفهم عمر الطفل من النص العربي
 * أمثلة: "عمره شهر", "3 شهور", "سنة", "سنة ونص", "سنتين", "9 شهور"
 */
function parseChildAge(text: string): { months: number; weeks: number; display: string } | null {
  const normalized = normalizeArabic(text)

  // Patterns for age expressions
  const patterns: { regex: RegExp; toMonths: (m: RegExpMatchArray) => number }[] = [
    // "عمره سنتين" or "سنتين"
    { regex: /سنتين/, toMonths: () => 24 },
    // "عمره سنة ونص" or "سنة ونصف" or "سنة ونص"
    { regex: /سنة\s*ونص[ف]?/, toMonths: () => 18 },
    // "عمره سنة وست شهور" or "سنة وستة اشهر"
    { regex: /سنة\s*و(ست|6)\s*شهر/, toMonths: () => 18 },
    // "عمره سنة وثلاث شهور"
    { regex: /سنة\s*و(ثلاث|3)\s*شهر/, toMonths: () => 15 },
    // "عمره سنتين ونص"
    { regex: /سنتين\s*ونص[ف]?/, toMonths: () => 30 },
    // "عمره سنة" or "عمره سنه"
    { regex: /سنت?[هی]/, toMonths: () => 12 },
    // "عمره X شهر" or "X شهر" or "عمره X شهور"
    { regex: /(\d+)\s*شهو?ر/, toMonths: (m) => parseInt(m[1]) },
    // "عمره شهرين"
    { regex: /شهرين/, toMonths: () => 2 },
    // "عمره شهر" (single month)
    { regex: /(?<!\d)شهر(?!\d|ين)/, toMonths: () => 1 },
    // "عمره X اسبوع" or "X اسبوع"
    { regex: /(\d+)\s*اسبوو?ع/, toMonths: (m) => Math.floor(parseInt(m[1]) / 4), },
    // "عمره اسبوع" or "اسبوع واحد"
    { regex: /اسبوو?ع(?!\d|ين)/, toMonths: () => 0 },
    // "عمره X يوم"
    { regex: /(\d+)\s*يوم/, toMonths: (m) => 0 },
    // Just a number (assume months if context suggests)
    { regex: /^(\d+)\s*$/, toMonths: (m) => parseInt(m[1]) },
  ]

  for (const p of patterns) {
    const match = normalized.match(p.regex)
    if (match) {
      const months = p.toMonths(match)
      const weeks = months * 4
      let display = ''
      if (months === 0) display = 'أقل من شهر'
      else if (months === 1) display = 'شهر واحد'
      else if (months === 2) display = 'شهرين'
      else if (months < 12) display = `${months} شهور`
      else if (months === 12) display = 'سنة واحدة'
      else if (months === 18) display = 'سنة ونصف'
      else if (months === 24) display = 'سنتين'
      else display = `${months} شهر`
      return { months, weeks, display }
    }
  }
  return null
}

/**
 * جدول التطعيم حسب عمر الطفل (بالأشهر)
 * يرجع: اللقاحات المطلوبة + اللقاحات المتأخرة + اللقاحات القادمة
 */
function getVaccinesByAge(months: number): {
  due: string[]
  overdue: string[]
  upcoming: string[]
  schedule: string
} {
  const due: string[] = []
  const overdue: string[] = []
  const upcoming: string[] = []

  // Define vaccination schedule
  const schedule = [
    { id: 'bcg', name: '🔴 BCG (ضد السل)', dueAt: 0, maxAt: 12, route: 'داخل الجلد' },
    { id: 'hepb0', name: '💉 HepB0 (كبد ب - ولادة)', dueAt: 0, maxAt: 60, route: 'عضلي' },
    { id: 'opv0', name: '💧 OPV0 (شلل فموي - ولادة)', dueAt: 0, maxAt: 60, route: 'فموي' },
    { id: 'opv1', name: '💧 OPV1 (شلل فموي 1)', dueAt: 1.5, maxAt: 60, route: 'فموي' },
    { id: 'penta1', name: '5️⃣ Penta1 (خماسي 1)', dueAt: 1.5, maxAt: 60, route: 'عضلي' },
    { id: 'pcv1', name: '🫁 PCV1 (مكورات 1)', dueAt: 1.5, maxAt: 60, route: 'عضلي' },
    { id: 'rota1', name: '🦠 Rota1 (روتا 1)', dueAt: 1.5, maxAt: 24, route: 'فموي' },
    { id: 'opv2', name: '💧 OPV2 (شلل فموي 2)', dueAt: 2.5, maxAt: 60, route: 'فموي' },
    { id: 'penta2', name: '5️⃣ Penta2 (خماسي 2)', dueAt: 2.5, maxAt: 60, route: 'عضلي' },
    { id: 'pcv2', name: '🫁 PCV2 (مكورات 2)', dueAt: 2.5, maxAt: 60, route: 'عضلي' },
    { id: 'rota2', name: '🦠 Rota2 (روتا 2)', dueAt: 2.5, maxAt: 24, route: 'فموي' },
    { id: 'opv3', name: '💧 OPV3 (شلل فموي 3)', dueAt: 3.5, maxAt: 60, route: 'فموي' },
    { id: 'penta3', name: '5️⃣ Penta3 (خماسي 3)', dueAt: 3.5, maxAt: 60, route: 'عضلي' },
    { id: 'pcv3', name: '🫁 PCV3 (مكورات 3)', dueAt: 3.5, maxAt: 60, route: 'عضلي' },
    { id: 'ipv1', name: '💉 IPV1 (شلل حقن 1)', dueAt: 3.5, maxAt: 60, route: 'عضلي' },
    { id: 'mr1', name: '🔴 MR1 (حصبة 1)', dueAt: 9, maxAt: 60, route: 'تحت الجلد' },
    { id: 'opv4', name: '💧 OPV4 (شلل فموي 4)', dueAt: 9, maxAt: 60, route: 'فموي' },
    { id: 'ipv2', name: '💉 IPV2 (شلل حقن 2)', dueAt: 9, maxAt: 60, route: 'عضلي' },
    { id: 'vitA1', name: '🌟 فيتامين أ (100,000 و.د)', dueAt: 9, maxAt: 60, route: 'فموي' },
    { id: 'mr2', name: '🔴 MR2 (حصبة 2)', dueAt: 18, maxAt: 60, route: 'تحت الجلد' },
    { id: 'opv5', name: '💧 OPV5 (شلل فموي 5)', dueAt: 18, maxAt: 60, route: 'فموي' },
    { id: 'penta4', name: '💪 Penta4 (خماسي تعزيزية)', dueAt: 18, maxAt: 60, route: 'عضلي' },
    { id: 'vitA2', name: '🌟 فيتامين أ (200,000 و.د)', dueAt: 18, maxAt: 60, route: 'فموي' },
    { id: 'td_school', name: '🏫 Td (مدرسي)', dueAt: 60, maxAt: 84, route: 'عضلي' },
    { id: 'mr_school', name: '🔴 MR تعزيزية (مدرسي)', dueAt: 60, maxAt: 60, route: 'تحت الجلد' },
    { id: 'vitA_school', name: '🌟 فيتامين أ (مدرسي)', dueAt: 60, maxAt: 60, route: 'فموي' },
  ]

  for (const v of schedule) {
    if (months >= v.dueAt && months < v.maxAt) {
      due.push(v.name)
    } else if (months >= v.maxAt) {
      // Only add if not already in due (avoid duplicates for same vaccine at different ages)
      if (!due.some(d => d.includes(v.id.replace(/\d+$/, '')))) {
        overdue.push(`${v.name} (تجاوز العمر)`)
      }
    } else {
      upcoming.push(`${v.name} (عند ${v.dueAt < 1 ? 'الولادة' : v.dueAt + ' شهر'})`)
    }
  }

  // Build schedule text
  let scheduleText = ''
  if (months < 1.5) {
    scheduleText = '📅 **التطعيمات عند الولادة:**\n• BCG (ضد السل) — داخل الجلد\n• OPV0 (شلل فموي) — فموي\n• HepB0 (كبد ب) — عضلي خلال 24 ساعة'
  } else if (months < 2.5) {
    scheduleText = '📅 **تطعيمات 6 أسابيع:**\n• OPV1 + Penta1 + PCV1 + Rota1\nالجرعة التالية عند 10 أسابيع'
  } else if (months < 3.5) {
    scheduleText = '📅 **تطعيمات 10 أسابيع:**\n• OPV2 + Penta2 + PCV2 + Rota2\nالجرعة التالية عند 14 أسبوع'
  } else if (months < 9) {
    scheduleText = '📅 **تطعيمات 14 أسبوع:**\n• OPV3 + Penta3 + PCV3 + IPV1\nالجرعة التالية عند 9 أشهر (MR1 + OPV4 + IPV2 + فيتامين أ)'
  } else if (months < 18) {
    scheduleText = '📅 **تطعيمات 9 أشهر:**\n• MR1 + OPV4 + IPV2 + فيتامين أ (100,000 و.د)\nالجرعة التالية عند 18 شهر'
  } else if (months < 60) {
    scheduleText = '📅 **تطعيمات 18 شهر:**\n• MR2 + OPV5 + Penta4 (تعزيزية) + فيتامين أ (200,000 و.د)\nالجرعة التالية عند دخول المدارس (5-7 سنوات)'
  } else {
    scheduleText = '📅 **تطعيمات دخول المدارس (5-7 سنوات):**\n• Td + MR تعزيزية + فيتامين أ (200,000 و.د)'
  }

  return { due, overdue, upcoming, schedule: scheduleText }
}

// ─── Intent Definitions ──────────────────────────────────────

interface IntentDef {
  id: string
  label: string
  keywords: string[]
  category: 'query' | 'action' | 'navigation' | 'help' | 'analysis' | 'alert' | 'context'
  responseTemplate: string
  priority: number
}

const INTENTS: IntentDef[] = [
  // Query intents
  { id: 'query_submissions', label: 'استعلام الإرساليات', keywords: ['ارسالي', 'ارسال', 'بيانات', 'استماره', 'نموذج', 'تقديم', 'مسوده', 'مرسل'], category: 'query', responseTemplate: 'إحصائيات الإرساليات', priority: 10 },
  { id: 'query_governorates', label: 'استعلام المحافظات', keywords: ['محافظ', 'محافظه', 'منطق', 'قضاء', 'مديري', 'حي', 'جغرافي', 'خريط'], category: 'query', responseTemplate: 'بيانات المحافظات', priority: 9 },
  { id: 'query_users', label: 'استعلام المستخدمين', keywords: ['مستخدم', 'فريق', 'موظف', 'عامل', 'مشغل', 'نشط', 'حساب', 'صلاحي'], category: 'query', responseTemplate: 'إحصائيات المستخدمين', priority: 9 },
  { id: 'query_coverage', label: 'استعلام التغطية', keywords: ['تغطي', 'نسب', 'معدل', 'تحصين', 'تلقيح', 'تطعيم', 'وصول', 'انتشار'], category: 'query', responseTemplate: 'نسب التغطية', priority: 10 },
  { id: 'query_vaccination', label: 'استعلام التطعيم', keywords: ['لقاح', 'تطعيم', 'تحصين', 'تلقيح', 'جرع', 'حصب', 'شلل', 'سحايا', 'كبد', 'دفتري', 'كزاز', 'سعال'], category: 'query', responseTemplate: 'بيانات التطعيم', priority: 10 },
  { id: 'query_forms', label: 'استعلام الاستمارات', keywords: ['استماره', 'نموذج', 'قالب', 'حقل', 'بيان', 'خان', 'ملء', 'تعب'], category: 'query', responseTemplate: 'الاستمارات المتاحة', priority: 8 },
  { id: 'query_analytics', label: 'استعلام التحليلات', keywords: ['تحليل', 'احصائ', 'مؤشر', 'رسم', 'بيان', 'رسم بيان', 'مقارن', 'اتجاه', 'تقدم'], category: 'query', responseTemplate: 'التحليلات', priority: 9 },

  // Action intents
  { id: 'create_report', label: 'إنشاء تقرير', keywords: ['تقرير', 'انشاء', 'اصدار', 'اعداد', 'ملخص', 'شامل', 'تقرير يوم', 'تقرير اسبوع'], category: 'action', responseTemplate: 'إنشاء تقرير', priority: 8 },
  { id: 'export_data', label: 'تصدير البيانات', keywords: ['تصدير', 'تنزيل', 'حفظ', 'اكسل', 'بي دي اف', 'PDF', 'Excel', 'CSV', 'طباع'], category: 'action', responseTemplate: 'تصدير البيانات', priority: 7 },
  { id: 'send_notification', label: 'إرسال إشعار', keywords: ['اشعار', 'تنبيه', 'رسال', 'ارسال', 'ابلاغ', 'اعلام', 'تنويه'], category: 'action', responseTemplate: 'إرسال إشعار', priority: 8 },
  { id: 'resolve_shortage', label: 'معالجة النقص', keywords: ['معالج', 'حل', 'معالج نقص', 'توفير', 'تزويد', 'تعب', 'ترميم'], category: 'action', responseTemplate: 'معالجة النقص', priority: 9 },
  { id: 'fill_form', label: 'ملء استمارة', keywords: ['ملء', 'تعب', 'ادخال', 'بيانات', 'استماره جديده', 'نموذج جديد'], category: 'action', responseTemplate: 'ملء استمارة', priority: 7 },

  // Navigation intents
  { id: 'go_to_dashboard', label: 'لوحة التحكم', keywords: ['لوح', 'تحكم', 'رئيس', 'صفحه رئيس', 'بداي'], category: 'navigation', responseTemplate: 'الانتقال للوحة التحكم', priority: 5 },
  { id: 'go_to_map', label: 'الخريطة', keywords: ['خريط', 'موقع', 'جغراف', 'مساح', 'اماكن', 'مواقع'], category: 'navigation', responseTemplate: 'الانتقال للخريطة', priority: 5 },
  { id: 'go_to_settings', label: 'الإعدادات', keywords: ['اعداد', 'ضبط', 'تخصيص', 'تفضيل', 'مظهر', 'ثيم', 'لغ'], category: 'navigation', responseTemplate: 'الانتقال للإعدادات', priority: 4 },
  { id: 'go_to_users', label: 'المستخدمين', keywords: ['اداره مستخدم', 'فريق', 'صلاحي', 'ادوار'], category: 'navigation', responseTemplate: 'الانتقال لإدارة المستخدمين', priority: 5 },
  { id: 'go_to_submissions', label: 'الإرساليات', keywords: ['عرض ارسالي', 'جدول ارسالي', 'قائم ارسالي'], category: 'navigation', responseTemplate: 'الانتقال للإرساليات', priority: 5 },

  // Help intents
  { id: 'how_to', label: 'كيف أفعل', keywords: ['كيف', 'طريق', 'خطوات', 'شرح', 'دليل', 'ارشاد'], category: 'help', responseTemplate: 'دليل الاستخدام', priority: 6 },
  { id: 'guide', label: 'دليل', keywords: ['دليل', 'تعليم', 'مساعد', 'شرح', 'استخدام', 'بداي', 'مبتد'], category: 'help', responseTemplate: 'دليل الاستخدام', priority: 6 },
  { id: 'troubleshooting', label: 'حل المشاكل', keywords: ['مشكل', 'خطا', 'عطل', 'لا يعمل', 'لا يظهر', 'عالق', 'متوقف', 'فشل'], category: 'help', responseTemplate: 'حل المشاكل', priority: 7 },
  { id: 'greeting', label: 'تحية', keywords: ['مرحب', 'اهلا', 'سلام', 'صباح', 'مساء', 'هاي', 'هلو'], category: 'help', responseTemplate: 'مرحباً! كيف أساعدك؟', priority: 3 },
  { id: 'thanks', label: 'شكر', keywords: ['شكر', 'شكرا', 'ممتاز', 'رائع', 'تمام', 'جيد', 'حلوه'], category: 'help', responseTemplate: 'العفو! سعيد بالمساعدة.', priority: 2 },

  // Analysis intents
  { id: 'trend_analysis', label: 'تحليل الاتجاهات', keywords: ['اتجاه', 'تطور', 'تغير', 'نمو', 'انخفاض', 'ارتفاع', 'مقارن زمان', 'فتر'], category: 'analysis', responseTemplate: 'تحليل الاتجاهات', priority: 9 },
  { id: 'comparison', label: 'مقارنة', keywords: ['مقارن', 'فرق', 'تمييز', 'افضل', 'اسوا', 'اعلى', 'ادنى', 'بين', 'ضد'], category: 'analysis', responseTemplate: 'المقارنة', priority: 9 },
  { id: 'forecasting', label: 'تنبؤ', keywords: ['توقع', 'تنبؤ', 'مستقبل', 'قادم', 'اسبوع قادم', 'شهر قادم', 'هدف', 'خط'], category: 'analysis', responseTemplate: 'التنبؤات', priority: 8 },
  { id: 'anomaly_detection', label: 'كشف الشذوذ', keywords: ['شذوذ', 'غير طبيع', 'غريب', 'مفاج', 'غير متوقع', 'انحراف', 'خارج المعتاد'], category: 'analysis', responseTemplate: 'كشف الشذوذ', priority: 9 },
  { id: 'performance_analysis', label: 'تحليل الأداء', keywords: ['اداء', 'كفاء', 'انتاج', 'فاعلي', 'جود', 'دق', 'سرع'], category: 'analysis', responseTemplate: 'تحليل الأداء', priority: 8 },

  // Alert intents
  { id: 'critical_shortage', label: 'نقص حرج', keywords: ['حرج', 'خطر', 'طوار', 'مستعجل', 'فوري', 'عاجل', 'صفر', 'نفد'], category: 'alert', responseTemplate: 'تنبيه: نقص حرج', priority: 10 },
  { id: 'low_coverage', label: 'تغطية منخفضة', keywords: ['منخفض', 'ضعيف', 'تحت المطلوب', 'اقل من الهدف', 'حصل', 'عجز'], category: 'alert', responseTemplate: 'تنبيه: تغطية منخفضة', priority: 10 },
  { id: 'inactive_users', label: 'مستخدمين غير نشطين', keywords: ['غير نشط', 'خامل', 'لم يسجل', 'لم يدخل', 'متغيب', 'غائب'], category: 'alert', responseTemplate: 'تنبيه: مستخدمين غير نشطين', priority: 8 },
  { id: 'data_quality', label: 'جودة البيانات', keywords: ['جود', 'دق', 'خطا بيان', 'بيانات خاطئ', 'تناقض', 'مكرر', 'ناقص', 'غير مكتمل'], category: 'alert', responseTemplate: 'تنبيه: مشكلة جودة البيانات', priority: 9 },
  { id: 'system_health', label: 'صحة النظام', keywords: ['نظام', 'خادم', 'اتصال', 'شبك', 'بط', 'استجاب', 'متاح'], category: 'alert', responseTemplate: 'حالة النظام', priority: 7 },

  // Additional intents to reach 45+
  { id: 'query_campaigns', label: 'استعلام الحملات', keywords: ['حمل', 'موسم', 'تطعيم دور', 'حمل وطن', 'استئصال'], category: 'query', responseTemplate: 'بيانات الحملات', priority: 8 },
  { id: 'query_supplies', label: 'استعلام المستلزمات', keywords: ['مستلزم', 'معد', 'حقن', 'ثلاج', 'مبرد', 'سرنج', 'قطن', 'كحول'], category: 'query', responseTemplate: 'المستلزمات', priority: 8 },
  { id: 'query_cold_chain', label: 'سلسلة التبريد', keywords: ['تبريد', 'ثلاج', 'مبرد', 'حرار', 'تخزين لقاح', 'سلسل بارد', 'فريزر'], category: 'query', responseTemplate: 'سلسلة التبريد', priority: 9 },
  { id: 'query_adverse_events', label: 'الأحداث الضائرة', keywords: ['ضائر', 'عرض جانب', 'تاثير', 'مضاعف', 'تحسس', 'رد فعل'], category: 'query', responseTemplate: 'الأحداث الضائرة', priority: 9 },
  { id: 'query_demographics', label: 'الديموغرافيا', keywords: ['سكان', 'تعداد', 'ولاد', 'وفيات', 'فئ عمر', 'اطفال', 'حوامل'], category: 'query', responseTemplate: 'بيانات سكانية', priority: 7 },
  { id: 'query_child_vaccines', label: 'تطعيمات طفلي', keywords: ['طفلي', 'طفلك', 'طفﻻ', 'رضيع', 'مولود', 'تطعيمات طفل', 'جدول طفلي', 'وش ياخذ', 'وش اللقاحات', 'تعليمات طفلي'], category: 'query', responseTemplate: 'تطعيمات حسب العمر', priority: 10 },
  { id: 'child_age_response', label: 'عمر الطفل', keywords: ['عمره', 'عمرها', 'شهرين', 'سنتين', 'سنه', 'سنة'], category: 'context', responseTemplate: 'رد حسب العمر', priority: 9 },
  { id: 'query_schedule', label: 'جدول التطعيم', keywords: ['جدول', 'مواعيد', 'وقت', 'تاريخ', 'موعد', 'خطة', 'زمن'], category: 'query', responseTemplate: 'جدول التطعيم', priority: 8 },
  { id: 'bulk_action', label: 'إجراء جماعي', keywords: ['جماع', 'كل', 'مجموع', 'دفع', 'متعدد', 'تحديد الكل'], category: 'action', responseTemplate: 'إجراء جماعي', priority: 6 },
  { id: 'go_to_reports', label: 'التقارير', keywords: ['تقارير', 'ارقام', 'احصائي'], category: 'navigation', responseTemplate: 'الانتقال للتقارير', priority: 5 },
  { id: 'feedback', label: 'ملاحظات', keywords: ['ملاحظ', 'راي', 'اقتراح', 'تحسين', 'تقييم'], category: 'help', responseTemplate: 'شكراً لملاحظاتك', priority: 4 },
  { id: 'correlation_analysis', label: 'تحليل الارتباط', keywords: ['ارتباط', 'علاق', 'سببي', 'تاثير متبادل', 'رابط'], category: 'analysis', responseTemplate: 'تحليل الارتباط', priority: 8 },
  { id: 'root_cause', label: 'السبب الجذري', keywords: ['سبب', 'جذر', 'لماذا', 'عامل', 'محرك', 'مصدر مشكل'], category: 'analysis', responseTemplate: 'تحليل السبب الجذري', priority: 9 },
]

// ─── Sentiment Lexicon ───────────────────────────────────────

const SENTIMENT_LEXICON: Record<SentimentType, string[]> = {
  positive: [
    'ممتاز', 'رائع', 'جيد', 'جدا', 'مبدع', 'متميز', 'نجاح', 'تحسن', 'تقدم',
    'انجاز', 'تفوق', 'تمام', 'الحمد', 'شكر', 'سعيد', 'فرح', 'افضل',
  ],
  negative: [
    'سيء', 'سيئ', 'رديء', 'فاشل', 'مشكل', 'مشاكل', 'خطا', 'خطر', 'صعب',
    'عاجز', 'فشل', 'ضعف', 'نقص', 'تاخير', 'متاخر', 'بطيء', 'اسوا',
  ],
  urgent: [
    'عاجل', 'حرج', 'طوارئ', 'فوري', 'الان', 'مستعجل', 'خطر', 'تنبيه',
    'انذار', 'صفر', 'نفد', 'توقف', 'انقطاع', 'كارث', 'ازم',
  ],
  neutral: [
    'عادي', 'طبيعي', 'معتاد', 'كالمعتاد', 'مستقر', 'ثابت', 'رتيب',
  ],
}

// ─── Knowledge Base ──────────────────────────────────────────

const KNOWLEDGE_BASE: KnowledgeRule[] = [
  {
    id: 'kb_vaccine_types',
    domain: 'vaccination',
    keywords: ['لقاح', 'تحصين', 'تلقيح', 'تطعيم', 'جرع'],
    response: 'برنامج التطعيم يشمل: BCG (السل)، HepB (الكبد B)، OPV/IPV (شلل الأطفال)، Pentavalent (الخماسي)، Measles (الحصبة)، MR (الحصبة والحصبة الألمانية)، DTaP (الدفتريا والكزاز والسعال الديكي). يتم إعطاء الجرعات حسب جدول التطعيم الوطني.',
    relatedIntents: ['query_vaccination', 'query_coverage', 'query_schedule'],
    priority: 10,
  },
  {
    id: 'kb_coverage_targets',
    domain: 'coverage',
    keywords: ['تغطي', 'هدف', 'نسب', 'معدل'],
    response: 'الهدف الوطني للتغطية هو 95% لجميع اللقاحات. النسب الأقل من 80% تعتبر حرجة وتتطلب تدخل فوري. النسب بين 80-90% تتطلب متابعة مكثفة.',
    relatedIntents: ['query_coverage', 'low_coverage', 'comparison'],
    priority: 10,
  },
  {
    id: 'kb_cold_chain',
    domain: 'cold_chain',
    keywords: ['تبريد', 'ثلاج', 'مبرد', 'حرار', 'سلسل'],
    response: 'سلسلة التبريد يجب أن تحافظ على درجة حرارة +2 إلى +8 درجات مئوية لمعظم اللقاحات. أي انقطاع يتجاوز 30 دقيقة يجب تسجيله. اللقاحات المتأثرة يجب عزلها ومراجعة المسؤول.',
    relatedIntents: ['query_cold_chain', 'anomaly_detection'],
    priority: 10,
  },
  {
    id: 'kb_epi_program',
    domain: 'epi',
    keywords: ['برنامج', 'توسع', 'مناع', 'وقاي'],
    response: 'برنامج التوسع في التطعيم (EPI) يهدف لتوفير التطعيمات الأساسية لجميع الأطفال. يشمل المراقبة الوبائية، إدارة المخزون، التدريب، والتوعية المجتمعية.',
    relatedIntents: ['query_vaccination', 'query_campaigns', 'guide'],
    priority: 8,
  },
  {
    id: 'kb_governorate_roles',
    domain: 'roles',
    keywords: ['صلاحي', 'دور', 'محافظ', 'قضاء', 'مركز', 'اداره'],
    response: 'الأدوار: مدير النظام (كامل الصلاحيات)، مركزي (إشراف عام)، محافظة (إشراف على المحافظة)، قضاء (إشراف على القضاء)، إدخال بيانات (إدخال الاستمارات فقط).',
    relatedIntents: ['query_users', 'go_to_users', 'how_to'],
    priority: 7,
  },
  {
    id: 'kb_data_entry',
    domain: 'data_entry',
    keywords: ['ادخال', 'بيانات', 'استماره', 'نموذج', 'ملء'],
    response: 'لإدخال بيانات: 1) اختر الاستمارة المناسبة 2) املأ جميع الحقول المطلوبة 3) تأكد من صحة البيانات 4) أضف الإحداثيات GPS إذا طُلب 5) التقط الصور إذا لزم 6) اضغط إرسال.',
    relatedIntents: ['fill_form', 'query_forms', 'how_to'],
    priority: 8,
  },
  {
    id: 'kb_reporting',
    domain: 'reporting',
    keywords: ['تقرير', 'احصائ', 'مؤشر', 'تحليل'],
    response: 'التقارير المتاحة: يومي (ملخص النشاط)، أسبوعي (اتجاهات ومقارنات)، شهري (تحليل شامل)، المحافظات (مقارنة جغرافية)، التغطية (نسب التحصين)، النواقص (حالة المستلزمات).',
    relatedIntents: ['create_report', 'query_analytics', 'trend_analysis'],
    priority: 8,
  },
  {
    id: 'kb_autism_myth',
    domain: 'myths',
    keywords: ['اوتيزم', 'توحد', 'يسبب', 'ضرر', 'ضار', 'خطور', 'خطر'],
    response: '🚫 لا، التطعيمات لا تسبب الأوتيزم! هذه أسطورة نشرتها دراسة مزيفة عام 1998 تم سحبها وفقد صاحبها رخصته الطبية. أظهرت عشرات الدراسات على ملايين الأطفال أن لا علاقة بين التطعيمات والأوتيزم. التطعيمات آمنة وفعالة وتنقذ حياة الأطفال.',
    relatedIntents: ['query_vaccination', 'guide'],
    priority: 10,
  },
  {
    id: 'kb_free_vaccine',
    domain: 'cost',
    keywords: ['مجاني', 'مجان', 'سعر', 'تكلفة', 'فلوس', 'ثمن', 'يكلف'],
    response: '💰 نعم! جميع تطعيمات برنامج التحصين الموسع (EPI) مجانية تماماً في جميع المرافق الصحية الحكومية. لا تدفع أي رسوم. إذا طلب منك أحد دفع مبلغ، أبلغ فوراً.',
    relatedIntents: ['query_vaccination', 'guide'],
    priority: 10,
  },
  {
    id: 'kb_where_vaccinate',
    domain: 'location',
    keywords: ['وين', 'أين', 'مكان', 'مركز', 'مستشفى', 'عياد', 'صحي'],
    response: '📍 يمكنك تطعيم طفلك في: 1) المراكز الصحية الحكومية (مجاني) 2) المستوصفات 3) المستشفيات الحكومية 4) خلال حملات التطعيم التكميلية (فرق متنقلة تأتي للبيوت). ابحث عن أقرب مركز صحي في منطقتك.',
    relatedIntents: ['query_vaccination', 'guide'],
    priority: 9,
  },
  {
    id: 'kb_sick_vaccine',
    domain: 'clinical',
    keywords: ['مريض', 'حمى', 'سخون', 'مصاب', 'مريض', 'здоров'],
    response: '🤒 إذا كان الطفل مريضاً بحمى خفيفة (أقل من 38.5°C) أو سحاب خفيف، يمكن إعطاء التطعيم. أما إذا الحمى شديدة (فوق 38.5°C) أو المرض خطير، يؤجل التطعيم حتى الشفاء. استشر الطبيب في حالة الشك.',
    relatedIntents: ['query_vaccination', 'how_to'],
    priority: 9,
  },
  {
    id: 'kb_bcg_scar',
    domain: 'clinical',
    keywords: ['تندب', 'ندب', 'علامة', 'اثر', 'بقع'],
    response: '🔴 التندب بعد تطعيم BCG طبيعي ومطلوب! يظهر بعد 2-4 أسابيع كاحمرار صغير، ثم يتحول إلى ندبة صغيرة (حوالي 5-10 مم). هذا يدل على أن التطعيم نجح. لا تحاول علاج الندبة أو إزالتها.',
    relatedIntents: ['query_vaccination', 'how_to'],
    priority: 8,
  },
]

// ─── Conversation Memory Store ───────────────────────────────

class ConversationMemory {
  private conversations: Map<string, ConversationContext> = new Map()
  private maxHistory = 50
  private maxSessions = 100

  getContext(userId: string, sessionId: string): ConversationContext {
    const key = `${userId}:${sessionId}`
    let ctx = this.conversations.get(key)
    if (!ctx) {
      ctx = {
        userId,
        sessionId,
        history: [],
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      this.conversations.set(key, ctx)
    }
    // Evict old sessions if over limit
    if (this.conversations.size > this.maxSessions) {
      const oldest = Array.from(this.conversations.entries())
        .sort((a, b) => a[1].updatedAt - b[1].updatedAt)[0]
      if (oldest) this.conversations.delete(oldest[0])
    }
    return ctx
  }

  addTurn(userId: string, sessionId: string, turn: ConversationTurn): void {
    const key = `${userId}:${sessionId}`
    const ctx = this.getContext(userId, sessionId)
    ctx.history.push(turn)
    if (ctx.history.length > this.maxHistory) {
      ctx.history = ctx.history.slice(-this.maxHistory)
    }
    if (turn.intent) ctx.lastIntent = turn.intent
    if (turn.entities) ctx.lastEntities = turn.entities
    ctx.updatedAt = Date.now()
    this.conversations.set(key, ctx)
  }

  getRecentIntents(userId: string, sessionId: string, count: number = 5): string[] {
    const ctx = this.getContext(userId, sessionId)
    return ctx.history
      .filter(t => t.role === 'user' && t.intent)
      .slice(-count)
      .map(t => t.intent!)
  }

  clearSession(userId: string, sessionId: string): void {
    this.conversations.delete(`${userId}:${sessionId}`)
  }
}

// ─── Local Knowledge Base (16 chunks from knowledge_chunks.json) ──

import { LOCAL_KNOWLEDGE, type KnowledgeChunk } from './local-knowledge'

// ─── Main EPI-Bot Engine ─────────────────────────────────────

export class EPIBotEngine {
  private memory: ConversationMemory
  private defaultSessionId = 'default'

  constructor() {
    this.memory = new ConversationMemory()
  }

  // ── Multi-turn: Resolve follow-up questions ──
  resolveFollowUp(text: string, userId: string, sessionId: string): string | null {
    const normalized = normalizeArabic(text)
    const tokens = tokenizeArabic(normalized)
    const ctx = this.memory.getContext(userId, sessionId)
    const history = ctx.history.filter(t => t.role === 'user').slice(-5)

    // 1. Pronoun/reference patterns
    const followUpPatterns = [
      // "والأمس؟" / "واليوم؟" / "والأسبوع؟"
      { regex: /^و\s*(ال|هذا\s*)?(امس|اليوم|اسبوع|شهر|عام)/i, resolve: (match: RegExpMatchArray) => {
        const lastTopic = history[history.length - 1]?.intent || 'query_submissions'
        const timeMap: Record<string, string> = { 'امس': 'أمس', 'اليوم': 'اليوم', 'اسبوع': 'هذا الأسبوع', 'شهر': 'هذا الشهر', 'عام': 'هذا العام' }
        const timeWord = Object.entries(timeMap).find(([k]) => normalizeArabic(match[0]).includes(k))
        const time = timeWord ? timeWord[1] : ''
        if (lastTopic.includes('submission') || lastTopic.includes('إرسالي')) return `كم إرسالية ${time}؟`
        if (lastTopic.includes('governorate') || lastTopic.includes('محافظ')) return `أداء المحافظات ${time}`
        if (lastTopic.includes('user') || lastTopic.includes('مستخدم')) return `نشاط المستخدمين ${time}`
        return `إحصائيات ${time}`
      }},
      // "وكم عددهم؟" / "كم باقي؟"
      { regex: /^و?\s*كم\s*(عددهم|باقي|البقي|المتبقي|الاجمالي)?/i, resolve: () => {
        const lastEntity = ctx.lastEntities
        if (lastEntity?.governorate) return `كم عدد الإرساليات في ${lastEntity.governorate}؟`
        return 'كم العدد الإجمالي؟'
      }},
      // "أيهم أفضل؟" / "والأضعف؟"
      { regex: /^(ايهم|و\s*ال|ما\s*ال)?(افضل|اسوأ|اقوى|اضعف|اعلى|ادنى)/i, resolve: () => {
        const lastTopic = history[history.length - 1]?.intent || 'query_governorates'
        if (lastTopic.includes('governorate')) return 'أي المحافظات الأفضل أداءً؟'
        if (lastTopic.includes('user')) return 'أي المستخدمين الأكثر نشاطاً؟'
        return 'أيهم الأفضل؟'
      }},
      // "اعطني تفاصيل" / "تفاصيل أكثر"
      { regex: /^(اعطني|اكثر|مزيد|تفاصيل|شرح|توضيح)/i, resolve: () => {
        const lastBotText = ctx.history.filter(t => t.role === 'bot').slice(-1)[0]?.text || ''
        if (lastBotText.includes('إرسالي')) return 'أعطني تفاصيل الإرساليات'
        if (lastBotText.includes('محافظ')) return 'أعطني تفاصيل المحافظات'
        if (lastBotText.includes('مستخدم')) return 'أعطني تفاصيل المستخدمين'
        return 'أعطني تفاصيل أكثر'
      }},
      // "هل فيه مشاكل؟" / "وش المشاكل؟"
      { regex: /^(هل\s*فيه|وش|ما\s*هي|اين)\s*(مشاكل|مشكل|نواقص|نقص|تأخر|شذوذ)/i, resolve: () => 'أي مشاكل تحتاج انتباهي؟' },
      // Very short follow-ups like "تمام", "طيب", "ok" after a query
      { regex: /^(تمام|طيب|اوك|ok|حلو|ممتاز|شكر)/i, resolve: () => null },
    ]

    for (const pattern of followUpPatterns) {
      const match = normalized.match(pattern.regex)
      if (match) {
        const resolved = pattern.resolve(match)
        if (resolved) return resolved
      }
    }

    // 2. Short questions without clear intent — inherit last topic
    if (tokens.length <= 3 && history.length > 0) {
      const lastIntent = history[history.length - 1]?.intent
      if (lastIntent && lastIntent !== 'unknown') {
        // Check if current text is a question word
        const questionWords = ['كم', 'متى', 'اين', 'وين', 'كيف', 'لماذا', 'ليش', 'هل', 'ما']
        const hasQuestion = tokens.some(t => questionWords.some(qw => normalizeArabic(qw).includes(t)))
        if (hasQuestion) {
          // Extend with last topic context
          const topicMap: Record<string, string> = {
            'query_submissions': 'إرساليات',
            'query_governorates': 'محافظات',
            'query_users': 'مستخدمين',
            'query_coverage': 'تغطية',
            'query_vaccination': 'تطعيمات',
          }
          const topic = topicMap[lastIntent] || ''
          if (topic) return `${tokens.join(' ')} ${topic}`
        }
      }
    }

    return null
  }

  // ── Track topic entities in memory ──
  private trackTopicEntities(context: ConversationContext, intent: IntentResult): void {
    if (intent.entities.governorate) {
      context.metadata.lastGovernorate = intent.entities.governorate
    }
    if (intent.intent.includes('submission')) {
      context.metadata.lastTopic = 'submissions'
    } else if (intent.intent.includes('governorate')) {
      context.metadata.lastTopic = 'governorates'
    } else if (intent.intent.includes('user')) {
      context.metadata.lastTopic = 'users'
    }
  }

  // ── Get contextual quick actions based on intent + history ──
  getContextualActions(intent: string, entities: Record<string, string>, context?: ConversationContext): CopilotAction[] {
    const actions: CopilotAction[] = []
    const history = context?.history?.filter(t => t.role === 'user').slice(-3) || []
    const lastIntents = history.map(t => t.intent).filter(Boolean)

    switch (intent) {
      case 'query_submissions':
      case 'query_coverage':
        actions.push(
          { id: 'nav-subs', label: '📋 عرض الإرساليات', type: 'navigate', payload: '/submissions' },
          { id: 'nav-map', label: '🗺️ الخريطة', type: 'navigate', payload: '/map' },
        )
        if (lastIntents.includes('query_governorates')) {
          actions.push({ id: 'compare-gov', label: '📊 مقارنة المحافظات', type: 'query', payload: 'قارن أداء المحافظات هذا الأسبوع' })
        }
        break
      case 'query_governorates':
        actions.push(
          { id: 'nav-govs', label: '🏛️ المحافظات', type: 'navigate', payload: '/governorates' },
          { id: 'nav-map', label: '🗺️ الخريطة', type: 'navigate', payload: '/map' },
        )
        if (entities.governorate) {
          actions.push({ id: 'gov-detail', label: `📄 تفاصيل ${entities.governorate}`, type: 'query', payload: `أعطني تفاصيل ${entities.governorate}` })
        }
        break
      case 'query_users':
        actions.push(
          { id: 'nav-users', label: '👥 إدارة المستخدمين', type: 'navigate', payload: '/users' },
          { id: 'inactive', label: '😴 غير النشطين', type: 'query', payload: 'المستخدمين غير النشطين' },
        )
        break
      case 'query_child_vaccines':
      case 'child_age_response':
        actions.push(
          { id: 'nav-bot', label: '💉 مستشار التحصين', type: 'navigate', payload: '/bot' },
        )
        break
      case 'create_report':
        actions.push(
          { id: 'nav-reports', label: '📊 صفحة التقارير', type: 'navigate', payload: '/reports' },
          { id: 'daily', label: '📅 تقرير يومي', type: 'query', payload: 'لخص لي وضع اليوم' },
          { id: 'weekly', label: '📈 مقارنة أسبوعية', type: 'query', payload: 'قارن هذا الأسبوع بالسابق' },
        )
        break
      case 'trend_analysis':
      case 'comparison':
      case 'forecasting':
        actions.push(
          { id: 'nav-insights', label: '🧠 التحليلات', type: 'navigate', payload: '/insights' },
          { id: 'nav-reports', label: '📊 التقارير', type: 'navigate', payload: '/reports' },
        )
        break
      case 'how_to':
      case 'guide':
        actions.push(
          { id: 'nav-settings', label: '⚙️ الإعدادات', type: 'navigate', payload: '/settings' },
          { id: 'nav-forms', label: '📝 النماذج', type: 'navigate', payload: '/forms' },
        )
        break
      default:
        actions.push(
          { id: 'nav-dashboard', label: '📊 لوحة التحكم', type: 'navigate', payload: '/dashboard' },
        )
    }

    return actions
  }

  // ── Search local knowledge chunks (vector-like keyword matching) ──
  searchLocalKnowledge(query: string): KnowledgeChunk[] {
    const normalized = normalizeArabic(query)
    const tokens = tokenizeArabic(normalized)
    const filtered = removeStopWords(tokens)

    const scored: { chunk: KnowledgeChunk; score: number }[] = []

    for (const chunk of LOCAL_KNOWLEDGE) {
      let score = 0
      const chunkNorm = normalizeArabic(chunk.content)
      const sectionNorm = normalizeArabic(chunk.section)
      const titleNorm = normalizeArabic(chunk.title)

      // Check each token against chunk content
      for (const token of filtered) {
        if (token.length < 2) continue
        // Exact match in content
        if (chunkNorm.includes(token)) score += 2
        // Match in section name
        if (sectionNorm.includes(token)) score += 3
        // Match in title
        if (titleNorm.includes(token)) score += 2
        // Partial match
        for (const word of chunkNorm.split(/\s+/)) {
          if (word.includes(token) || token.includes(word)) {
            score += 0.5
          }
        }
      }

      // Boost by doc type relevance
      if (chunk.docType === 'clinical' && filtered.some(t => ['لقاح', 'تطعيم', 'جرع', 'تحصين', 'تبريد'].some(k => normalizeArabic(k).includes(t)))) score *= 1.3
      if (chunk.docType === 'data' && filtered.some(t => ['تغطي', 'نسب', 'إحصائي', 'بيانات', 'معدل'].some(k => normalizeArabic(k).includes(t)))) score *= 1.3
      if (chunk.docType === 'operational' && filtered.some(t => ['كيف', 'استخدام', 'دليل', 'ارشاد', 'طريق'].some(k => normalizeArabic(k).includes(t)))) score *= 1.3

      if (score > 0) {
        scored.push({ chunk, score })
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.chunk)
  }

  // ── Core: Process Message ──

  processMessage(text: string, context?: ConversationContext): BotResponse {
    const userId = context?.userId || 'anonymous'
    const sessionId = context?.sessionId || this.defaultSessionId

    // ── Multi-turn: Resolve follow-up questions ──
    let resolvedText = text
    const followUp = this.resolveFollowUp(text, userId, sessionId)
    if (followUp) {
      resolvedText = followUp
    }

    let intent = this.classifyIntent(resolvedText)
    const sentiment = this.analyzeSentiment(text) // analyze original text for sentiment
    const suggestions = this.getSmartSuggestions(context || this.getDefaultContext())

    // ── Context-aware: if last intent asked about child age, and current message has age ──
    const recentIntents = this.memory.getRecentIntents(userId, sessionId, 3)
    const lastBotIntent = recentIntents[recentIntents.length - 1]

    // If bot just asked about child age and user responds with age
    if ((lastBotIntent === 'query_child_vaccines' || lastBotIntent === 'child_age_response')
        && intent.entities.child_age_months) {
      intent = {
        ...intent,
        intent: 'child_age_response',
        confidence: 0.95,
      }
    }

    // Also detect age-only messages (like "شهر", "3 شهور") when context suggests vaccination query
    if (intent.entities.child_age_months && intent.intent === 'unknown') {
      intent = {
        ...intent,
        intent: 'child_age_response',
        confidence: 0.9,
      }
    }

    // Track topic entities for future context
    this.trackTopicEntities(context || this.getDefaultContext(), intent)

    // Build contextual actions (richer than static buildActions)
    const actions = this.getContextualActions(intent.intent, intent.entities, context)

    // ── Search local knowledge chunks first ──
    const localChunks = this.searchLocalKnowledge(text)

    // Build response text
    let responseText = ''
    let useLocal = false

    if (localChunks.length > 0) {
      // We have relevant knowledge chunks — build a rich local response
      const topChunk = localChunks[0]
      responseText = `📖 ${topChunk.title}\n\n${topChunk.content}`

      // Append additional related chunks briefly
      if (localChunks.length > 1) {
        responseText += '\n\n━━━ مراجع إضافية ━━━'
        for (const extra of localChunks.slice(1)) {
          responseText += `\n\n📌 ${extra.section}: ${extra.content.slice(0, 200)}...`
        }
      }
      useLocal = true
    }

    // If no knowledge match, use template-based response
    if (!responseText) {
      responseText = this.generateResponse(intent, sentiment, context)
    }

    // Check hardcoded knowledge base for supplementary info
    const kbMatch = this.searchKnowledgeBase(text)
    if (kbMatch) {
      responseText += '\n\n💡 ' + kbMatch.response
      useLocal = true
    }

    // Store in conversation memory (reuse userId/sessionId from above)
    this.memory.addTurn(userId, sessionId, {
      role: 'user',
      text,
      intent: intent.intent,
      sentiment: sentiment.sentiment,
      timestamp: Date.now(),
      entities: intent.entities,
    })
    this.memory.addTurn(userId, sessionId, {
      role: 'bot',
      text: responseText,
      intent: intent.intent,
      timestamp: Date.now(),
    })

    // Determine source: use 'local' if we have knowledge match or high-confidence intent
    const source = useLocal || intent.confidence > 0.5 ? 'local' : 'hybrid'

    return {
      text: responseText,
      intent: intent.intent,
      sentiment: sentiment.sentiment,
      suggestions,
      actions,
      source,
      data: { knowledgeChunks: localChunks.length },
    }
  }

  // ── Intent Classification ──

  classifyIntent(text: string): IntentResult {
    const normalized = normalizeArabic(text)
    const tokens = tokenizeArabic(text)
    const filteredTokens = removeStopWords(tokens)
    const stems = filteredTokens.map(stemArabic)

    let bestIntent = 'unknown'
    let bestScore = 0
    let bestEntities: Record<string, string> = {}

    // Score each intent
    for (const intent of INTENTS) {
      let score = 0

      // Check keyword matches (stem-level)
      for (const kw of intent.keywords) {
        const kwNorm = normalizeArabic(kw)
        const kwStem = stemArabic(kwNorm)

        // Exact keyword match in normalized text
        if (normalized.includes(kwNorm)) {
          score += 3
        }
        // Stem match
        if (stems.some(s => s === kwStem || s.includes(kwStem) || kwStem.includes(s))) {
          score += 2
        }
        // Token-level partial match
        if (filteredTokens.some(t => t.includes(kwNorm) || kwNorm.includes(t))) {
          score += 1.5
        }
      }

      // Apply category priority
      if (intent.category === 'alert') score *= 1.3
      if (intent.category === 'action') score *= 1.1

      // Apply intent priority weight
      score *= (intent.priority / 10)

      if (score > bestScore) {
        bestScore = score
        bestIntent = intent.id
      }
    }

    // Extract entities
    bestEntities = this.extractEntities(normalized, tokens)

    // Normalize confidence to 0-1 range
    const confidence = Math.min(bestScore / 10, 1.0)

    // If no good match found, try context-based fallback
    if (confidence < 0.2) {
      bestIntent = this.fallbackIntent(normalized)
    }

    return {
      intent: bestIntent,
      confidence,
      entities: bestEntities,
      originalText: text,
      normalizedText: normalized,
    }
  }

  // ── Sentiment Analysis ──

  analyzeSentiment(text: string): SentimentResult {
    const normalized = normalizeArabic(text)
    const tokens = tokenizeArabic(text)

    const scores: Record<SentimentType, number> = {
      positive: 0,
      negative: 0,
      neutral: 0,
      urgent: 0,
    }

    const matchedKeywords: string[] = []

    for (const [sentiment, keywords] of Object.entries(SENTIMENT_LEXICON)) {
      for (const kw of keywords) {
        const kwNorm = normalizeArabic(kw)
        if (normalized.includes(kwNorm)) {
          scores[sentiment as SentimentType] += sentiment === 'urgent' ? 3 : 1
          matchedKeywords.push(kw)
        }
      }
    }

    // Exclamation marks add urgency
    if ((text.match(/!/g) || []).length > 1) {
      scores.urgent += 1
    }
    // ALL CAPS (Latin) adds urgency
    if (text !== text.toLowerCase() && /[A-Z]{3,}/.test(text)) {
      scores.urgent += 0.5
    }

    // Determine dominant sentiment
    let dominantSentiment: SentimentType = 'neutral'
    let maxScore = 0
    for (const [sentiment, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score
        dominantSentiment = sentiment as SentimentType
      }
    }

    // If nothing matched, neutral
    if (maxScore === 0) {
      dominantSentiment = 'neutral'
    }

    // Calculate urgency level (0-10)
    let urgencyLevel = 0
    if (dominantSentiment === 'urgent') urgencyLevel = Math.min(10, 5 + maxScore)
    else if (dominantSentiment === 'negative') urgencyLevel = Math.min(7, 2 + maxScore)

    // Normalize score
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1
    const normalizedScore = maxScore / totalScore

    return {
      sentiment: dominantSentiment,
      score: normalizedScore,
      keywords: matchedKeywords,
      urgencyLevel,
    }
  }

  // ── Smart Suggestions ──

  getSmartSuggestions(context: ConversationContext): string[] {
    const recentIntents = this.memory.getRecentIntents(
      context.userId,
      context.sessionId,
      3
    )

    const suggestions: string[] = []

    // Based on last intent, suggest follow-up
    const lastIntent = recentIntents[recentIntents.length - 1] || context.lastIntent

    const followUpMap: Record<string, string[]> = {
      query_submissions: ['حلل أسباب الرفض', 'قارن بالأسبوع الماضي', 'أي المحافظات لها أعلى رفض؟'],
      query_governorates: ['حلل السبب في الأضعف', 'قارن بآخر شهر', 'اعرض تفاصيل كل محافظة'],
      query_users: ['المستخدمين غير النشطين', 'توزيع الصلاحيات', 'آخر تسجيل دخول'],
      query_coverage: ['أي المناطق أقل تغطية؟', 'قارن بالهدف الوطني', 'توقع التغطية الشهر القادم'],
      query_child_vaccines: ['كم عمر طفلك؟', 'متى الموعد القادم؟', 'هل فيه لقاحات متأخرة؟'],
      child_age_response: ['وش اللقاحات القادمة؟', 'هل فيه تأخر؟', 'متى الموعد التالي؟'],
      query_schedule: ['جدول الحملة القادمة', 'أي اللقاحات ناقصة؟', 'مقارنة بالجدول الرسمي'],
      query_vaccination: ['ما أكثر اللقاحات نقصاً؟', 'حالة سلسلة التبريد', 'تغطية الحصب', 'وش تطعيمات طفلي؟'],
      query_cold_chain: ['حرارة الثلاجة', 'ما هو VVM؟', 'كيف أتعامل مع انقطاع التبريد؟'],
      query_adverse_events: ['كيف أبلّغ؟', 'ما هي الأعراض الخطيرة؟', 'متى أراجع الطبيب؟'],
      how_to: ['كيف أملأ استمارة؟', 'كيف أصدر تقرير؟', 'كيف أضيف مستخدم؟'],
      guide: ['دليل التطعيم', 'جدول التحصين', 'الآثار الجانبية'],
      create_report: ['أرسل التقرير بالبريد', 'صدر كـ PDF', 'أضف رسوم بيانية'],
      low_coverage: ['حدد الأسباب المحتملة', 'اقترح خطة تحسين', 'أي المناطق متأثرة؟'],
      greeting: ['📊 حالة الإرساليات', '📈 تقرير يومي'],
      unknown: ['📊 حالة الإرساليات', '👥 فريق العمل', '📈 تقرير يومي'],
    }

    if (lastIntent && followUpMap[lastIntent]) {
      suggestions.push(...followUpMap[lastIntent].slice(0, 3))
    } else {
      suggestions.push(...(followUpMap.unknown || []).slice(0, 3))
    }

    // Add context-aware suggestion
    if (context.metadata?.hasCriticalShortages) {
      suggestions.unshift('🚨 عالج النواقص الحرجة فوراً')
    }
    if (context.metadata?.lowCoverageAreas) {
      suggestions.unshift('📉 مناطق ذات تغطية منخفضة')
    }

    return suggestions.slice(0, 5)
  }

  // ── Daily Summary Generator ──

  generateDailySummary(stats: any): string {
    const lines: string[] = []

    lines.push('📋 **ملخص يومي — EPI Supervisor**')
    lines.push(`📅 ${new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`)
    lines.push('')

    // Submissions
    if (stats.total_submissions !== undefined) {
      lines.push('📊 **الإرساليات:**')
      lines.push(`   • الإجمالي: ${stats.total_submissions}`)
      lines.push(`   • اليوم: ${stats.submissions_today ?? 0}`)
      lines.push(`   • هذا الأسبوع: ${stats.submissions_this_week ?? 0}`)
      lines.push('')
    }

    // Users
    if (stats.total_users !== undefined) {
      lines.push('👥 **المستخدمين:**')
      lines.push(`   • الإجمالي: ${stats.total_users}`)
      lines.push(`   • النشطين: ${stats.active_users ?? 0}`)
      lines.push('')
    }

    // Forms
    if (stats.total_forms !== undefined) {
      lines.push('📝 **الاستمارات:**')
      lines.push(`   • الإجمالي: ${stats.total_forms}`)
      lines.push(`   • النشطة: ${stats.active_forms ?? 0}`)
      lines.push('')
    }

    // Alerts
    if (stats.submissions_today === 0 && stats.active_users > 0) {
      lines.push('📭 لا توجد إرساليات اليوم رغم وجود مستخدمين نشطين')
    }

    return lines.join('\n')
  }

  // ── Model Selection ──

  selectBestModel(query: string): ModelChoice {
    const intent = this.classifyIntent(query)
    const sentiment = this.analyzeSentiment(query)

    // Urgent queries → fast model
    if (sentiment.sentiment === 'urgent' || sentiment.urgencyLevel >= 7) {
      return {
        provider: 'groq',
        model: 'llama3-8b-8192',
        reason: 'استعلام عاجل - نختار أسرع نموذج',
        estimatedLatency: 'fast',
        cost: 'free',
      }
    }

    // Simple queries → fast model
    const simpleIntents = ['greeting', 'thanks', 'go_to_dashboard', 'go_to_map', 'go_to_settings', 'feedback']
    if (simpleIntents.includes(intent.intent) || intent.confidence > 0.9) {
      return {
        provider: 'groq',
        model: 'llama3-8b-8192',
        reason: 'استعلام بسيط - نموذج سريع كافٍ',
        estimatedLatency: 'fast',
        cost: 'free',
      }
    }

    // Analysis/forecasting → powerful model
    const analysisIntents = ['trend_analysis', 'comparison', 'forecasting', 'anomaly_detection', 'correlation_analysis', 'root_cause', 'performance_analysis']
    if (analysisIntents.includes(intent.intent)) {
      return {
        provider: 'openrouter',
        model: 'gpt-4o',
        reason: 'تحليل معقد - نحتاج نموذج قوي',
        estimatedLatency: 'slow',
        cost: 'high',
      }
    }

    // Knowledge queries → RAG-enabled model
    const knowledgeIntents = ['query_vaccination', 'query_coverage', 'query_cold_chain', 'query_adverse_events', 'how_to', 'guide']
    if (knowledgeIntents.includes(intent.intent)) {
      return {
        provider: 'zai',
        model: 'default',
        reason: 'استعلام معرفي - نموذج مع قاعدة معرفة',
        estimatedLatency: 'medium',
        cost: 'medium',
      }
    }

    // Default: medium model
    return {
      provider: 'groq',
      model: 'llama3-70b-8192',
      reason: 'استعلام متوسط - توازن بين السرعة والجودة',
      estimatedLatency: 'medium',
      cost: 'low',
    }
  }

  // ── Smart Form Filler ──

  suggestFormValues(formSchema: any, historicalData: any[]): Record<string, any> {
    const suggestions: Record<string, any> = {}

    if (!formSchema?.fields || !historicalData.length) return suggestions

    for (const field of formSchema.fields) {
      const fieldName = field.name || field.key
      if (!fieldName) continue

      // Get historical values for this field
      const values = historicalData
        .map(d => d[fieldName])
        .filter(v => v !== undefined && v !== null && v !== '')

      if (values.length === 0) continue

      // For categorical fields, suggest most common value
      if (field.type === 'select' || field.type === 'radio') {
        const freq: Record<string, number> = {}
        for (const v of values) {
          const key = String(v)
          freq[key] = (freq[key] || 0) + 1
        }
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
        if (sorted.length > 0) {
          suggestions[fieldName] = sorted[0][0]
        }
      }

      // For numeric fields, suggest average
      if (field.type === 'number') {
        const nums = values.map(Number).filter(n => !isNaN(n))
        if (nums.length > 0) {
          const avg = nums.reduce((a, b) => a + b, 0) / nums.length
          suggestions[fieldName] = Math.round(avg * 100) / 100
        }
      }

      // For date fields, suggest today
      if (field.type === 'date') {
        suggestions[fieldName] = new Date().toISOString().split('T')[0]
      }

      // For text fields, suggest most recent value
      if (field.type === 'text' || field.type === 'textarea') {
        suggestions[fieldName] = values[values.length - 1]
      }
    }

    return suggestions
  }

  // ── Private Helpers ──

  private extractEntities(normalizedText: string, tokens: string[]): Record<string, string> {
    const entities: Record<string, string> = {}

    // Child age entities (highest priority)
    const ageInfo = parseChildAge(normalizedText)
    if (ageInfo) {
      entities.child_age_months = String(ageInfo.months)
      entities.child_age_weeks = String(ageInfo.weeks)
      entities.child_age_display = ageInfo.display
    }

    // Time entities (only if no child age detected)
    if (!entities.child_age_months) {
      if (normalizedText.includes('اليوم')) entities.time_period = 'today'
      else if (normalizedText.includes('اسبوع') || normalizedText.includes('هذا الاسبوع')) entities.time_period = 'this_week'
      else if (normalizedText.includes('شهر') || normalizedText.includes('هذا الشهر')) entities.time_period = 'this_month'
      else if (normalizedText.includes('امس')) entities.time_period = 'yesterday'
    }

    // Severity entities
    if (normalizedText.includes('حرج')) entities.severity = 'critical'
    else if (normalizedText.includes('عالي')) entities.severity = 'high'
    else if (normalizedText.includes('متوسط')) entities.severity = 'medium'
    else if (normalizedText.includes('منخفض')) entities.severity = 'low'

    // Status entities
    if (normalizedText.includes('مرسل') || normalizedText.includes('مقدم')) entities.status = 'submitted'
    else if (normalizedText.includes('مسوده') || normalizedText.includes('مسود')) entities.status = 'draft'

    // Number entities (simple extraction)
    const numberMatch = normalizedText.match(/\d+/)
    if (numberMatch) entities.number = numberMatch[0]

    return entities
  }

  private searchKnowledgeBase(text: string): KnowledgeRule | null {
    const normalized = normalizeArabic(text)
    let bestRule: KnowledgeRule | null = null
    let bestScore = 0

    for (const rule of KNOWLEDGE_BASE) {
      let score = 0
      for (const kw of rule.keywords) {
        if (normalized.includes(normalizeArabic(kw))) {
          score += 1
        }
      }
      score *= (rule.priority / 10)
      if (score > bestScore) {
        bestScore = score
        bestRule = rule
      }
    }

    return bestScore > 0.5 ? bestRule : null
  }

  private generateResponse(intent: IntentResult, sentiment: SentimentResult, context?: ConversationContext): string {
    const intentDef = INTENTS.find(i => i.id === intent.intent)

    // Handle sentiment prefix
    let prefix = ''
    if (sentiment.sentiment === 'urgent') {
      prefix = '🚨 '
    } else if (sentiment.sentiment === 'negative') {
      prefix = '⚠️ '
    }

    // Context-aware responses based on intent
    switch (intent.intent) {
      case 'greeting':
        return 'أهلاً! 👋 أنا مساعدك الذكي EPI-Bot. كيف أساعدك اليوم؟'

      case 'thanks':
        return 'العفو! 😊 سعيد بمساعدتك. هل تحتاج شيئاً آخر؟'

      case 'query_submissions':
        return `${prefix}📊 جاري جلب إحصائيات الإرساليات...`

      case 'query_shortages':
        return `${prefix}تقرير النواقص:\n\nيمكنك الاطلاع على النواقص المسجلة مع تصنيفها حسب الخطورة. هل تريد التركيز على النواقص الحرجة فقط؟`

      case 'query_governorates':
        return `${prefix}🗺️ جاري جلب بيانات المحافظات...`

      case 'query_users':
        return `${prefix}👥 جاري جلب إحصائيات المستخدمين...`

      case 'query_coverage':
        return `${prefix}نسب التغطية:\n\nالهدف الوطني 95%. يمكنني عرض نسب التغطية حسب المحافظة أو اللقاح. أي تفاصيل تهمك؟`

      case 'query_vaccination':
        return `${prefix}بيانات التطعيم:\n\nيشمل برنامج التطعيم BCG, HepB, OPV/IPV, الخماسي, الحصبة, MR, DTaP. أي لقاح تريد تفاصيله؟`

      case 'query_child_vaccines': {
        // If we have a child age from entities, use it
        const childAge = intent.entities.child_age_months
        if (childAge) {
          const ageMonths = parseInt(childAge)
          const ageDisplay = intent.entities.child_age_display || childAge + ' شهر'
          const vaccInfo = getVaccinesByAge(ageMonths)
          let resp = `👶 **تطعيمات طفلك (${ageDisplay}):**\n\n`
          resp += vaccInfo.schedule + '\n\n'
          if (vaccInfo.due.length > 0) {
            resp += '✅ **اللقاحات المطلوبة الآن:**\n'
            vaccInfo.due.forEach(v => resp += `• ${v}\n`)
            resp += '\n'
          }
          if (vaccInfo.overdue.length > 0) {
            resp += '⚠️ **لقاحات متأخرة:**\n'
            vaccInfo.overdue.forEach(v => resp += `• ${v}\n`)
            resp += '\n'
          }
          if (vaccInfo.upcoming.length > 0 && vaccInfo.upcoming.length <= 5) {
            resp += '📅 **اللقاحات القادمة:**\n'
            vaccInfo.upcoming.slice(0, 3).forEach(v => resp += `• ${v}\n`)
          }
          resp += '\n💡 تذكّر: الفاصل الأدنى بين الجرعات 4 أسابيع (28 يوم). تابع مع أقرب مركز صحي.'
          return resp
        }
        // No age detected — ask for it
        return '👶 لكي أخبرك بتطعيمات طفلك بالضبط، كم عمره؟\n\nمثال: "شهر"، "3 شهور"، "9 شهور"، "سنة"، "سنة ونص"'
      }

      case 'child_age_response': {
        const ageMonths2 = intent.entities.child_age_months
        if (ageMonths2) {
          const ageM = parseInt(ageMonths2)
          const ageD = intent.entities.child_age_display || ageMonths2 + ' شهر'
          const vInfo = getVaccinesByAge(ageM)
          let resp2 = `👶 **تطعيمات طفلك (${ageD}):**\n\n`
          resp2 += vInfo.schedule + '\n\n'
          if (vInfo.due.length > 0) {
            resp2 += '✅ **اللقاحات المطلوبة:**\n'
            vInfo.due.forEach(v => resp2 += `• ${v}\n`)
          }
          if (vInfo.overdue.length > 0) {
            resp2 += '\n⚠️ **متأخرة:**\n'
            vInfo.overdue.forEach(v => resp2 += `• ${v}\n`)
          }
          resp2 += '\n💡 تابع مع أقرب مركز صحي لاستكمال التطعيمات.'
          return resp2
        }
        return '🤔 ما فهمت العمر بالضبط. ممكن تقولي كم عمر طفلك؟ (مثال: "شهر"، "3 شهور"، "سنة")'
      }

      case 'low_coverage':
        return `${prefix}تنبيه: التغطية أقل من المستهدف! يجب تحديد الأسباب ووضع خطة تحسين. هل تريد تحليل المناطق المتأثرة؟`

      case 'how_to':
      case 'guide':
        return '📖 دليل الاستخدام:\n\n• الإرساليات: عرض وتتبع البيانات المُرسلة\n• التقارير: إنشاء تقارير وتحليلات\n• الإشعارات: إرسال تنبيهات للفريق\n\nما الذي تريد تعلمه بالتفصيل؟'

      case 'troubleshooting':
        return '🔧 حل المشاكل:\n\n1) مشكلة في الاتصال: تحقق من الشبكة وأعد المحاولة\n2) بيانات لا تظهر: انتظر قليلاً ثم أعد تحميل الصفحة\n3) خطأ في الإرسال: تأكد من ملء جميع الحقول المطلوبة\n\nما المشكلة التي تواجهها؟'

      case 'create_report':
        return `${prefix}إنشاء تقرير:\n\nيمكنني إنشاء تقارير متنوعة:\n• تقرير يومي شامل\n• تقرير أسبوعي بالاتجاهات\n• مقارنة المحافظات\n• تحليل التغطية\n\nأي تقرير تريد؟`

      case 'trend_analysis':
        return `${prefix}تحليل الاتجاهات:\n\nيمكنني تحليل اتجاهات الإرساليات والتغطية عبر الزمن. أي فترة زمنية تريد تحليلها؟`

      case 'comparison':
        return `${prefix}مقارنة:\n\nيمكنني المقارنة بين:\n• المحافظات\n• الفترات الزمنية\n• أنواع اللقاحات\n• الحملات\n\nماذا تريد مقارنته؟`

      case 'forecasting':
        return `${prefix}التنبؤ:\n\nبناءً على البيانات المتاحة، يمكنني تقدير الاتجاهات المستقبلية للتغطية والإرساليات. أي مؤشر تريد التنبؤ به؟`

      default:
        if (intentDef) {
          return `${prefix}${intentDef.responseTemplate}. كيف أساعدك بشكل أكبر؟`
        }
        return `🤔 ما فهمت بالضبط. جرّب تسأل:\n\n📊 إحصائيات:\n• "كم إرسالية اليوم؟"\n• "أي المحافظات الأعلى؟"\n• "المستخدمين غير النشطين"\n\n💉 تطعيمات:\n• "وش تطعيمات طفلي؟"\n\n📥 تصدير:\n• "صدر الإرساليات كإكسل"\n• "PDF للمستخدمين"\n\n🔮 تحليلات:\n• "تنبؤ الأسبوع القادم"\n• "قارن هذا الأسبوع بالسابق"`
    }
  }

  private buildActions(intentId: string, entities: Record<string, string>): BotAction[] {
    const actions: BotAction[] = []

    switch (intentId) {
      case 'query_submissions':
        actions.push(
          { id: 'nav-subs', label: 'عرض الإرساليات', type: 'navigate', payload: '/submissions', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        )
        break
      case 'query_governorates':
        actions.push(
          { id: 'nav-govs', label: 'خريطة المحافظات', type: 'navigate', payload: '/governorates', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        )
        break
      case 'query_users':
        actions.push(
          { id: 'nav-users', label: 'إدارة المستخدمين', type: 'navigate', payload: '/users', color: 'bg-purple-50 text-purple-700 border-purple-200' },
        )
        break
      case 'create_report':
        actions.push(
          { id: 'gen-daily', label: 'تقرير يومي', type: 'query', payload: 'أنشئ تقريراً يومياً شاملاً', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
          { id: 'gen-weekly', label: 'تقرير أسبوعي', type: 'query', payload: 'حلل اتجاه الأسبوع', color: 'bg-rose-50 text-rose-700 border-rose-200' },
        )
        break
      case 'go_to_dashboard':
        actions.push(
          { id: 'nav-dash', label: 'لوحة التحكم', type: 'navigate', payload: '/dashboard', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        )
        break
    }

    return actions
  }

  private fallbackIntent(normalizedText: string): string {
    // Simple heuristic fallback
    if (normalizedText.includes('ارقام') || normalizedText.includes('عدد')) return 'query_analytics'
    if (normalizedText.includes('اين') || normalizedText.includes('فين')) return 'query_governorates'
    if (normalizedText.includes('كم')) return 'query_submissions'
    if (normalizedText.includes('متى')) return 'query_schedule'
    if (normalizedText.includes('لماذا') || normalizedText.includes('ليش')) return 'root_cause'
    return 'unknown'
  }

  private getDefaultContext(): ConversationContext {
    return {
      userId: 'anonymous',
      sessionId: this.defaultSessionId,
      history: [],
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }
}

// ─── Singleton Export ────────────────────────────────────────

export const epiBotEngine = new EPIBotEngine()
