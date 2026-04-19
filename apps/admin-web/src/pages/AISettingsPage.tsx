import { useState, useEffect, useCallback } from 'react'
import {
  Sparkles, Brain, Key, Settings, Shield, Zap, Activity,
  Save, Eye, EyeOff, TestTube, CheckCircle2, XCircle,
  FileText, RefreshCw, AlertTriangle,
  MessageSquare, BarChart3, Clock, DollarSign,
  Sliders, BookOpen, Gauge, Thermometer, Cpu,
  Database, Wifi, WifiOff, Loader2, TrendingUp,
  Server, Cog, Layers
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { supabase, isConfigured } from '@/lib/supabase'

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

interface AIModel {
  id: string
  name: string
  name_ar: string
  provider: string
  model_id: string
  description: string
  description_ar: string
  is_active: boolean
  is_default: boolean
  priority: number
  max_tokens: number
  temperature: number
  capabilities: string[]
  usage_count: number
  last_used_at: string | null
}

interface AppSetting {
  key: string
  value: any
  label_ar: string
  type: string
  category: string
}

interface KnowledgeDoc {
  id: string
  title: string
  title_ar: string
  doc_type: string
  total_chunks: number
  is_indexed: boolean
  created_at: string
}

interface UsageStats {
  totalCalls: number
  callsToday: number
  callsWeek: number
  avgLatencyMs: number
  successRate: number
  totalTokens: number
}

interface ConnectionStatus {
  groq: 'checking' | 'connected' | 'error' | 'not_configured'
  mimo: 'checking' | 'connected' | 'error' | 'not_configured'
  huggingface: 'checking' | 'connected' | 'error' | 'not_configured'
  edgeFunction: 'checking' | 'connected' | 'error'
}

// ═══════════════════════════════════════
// Main Component
// ═══════════════════════════════════════

export default function AISettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('models')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Data state
  const [models, setModels] = useState<AIModel[]>([])
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([])
  const [knowledgeStats, setKnowledgeStats] = useState({ totalChunks: 0, embeddedChunks: 0 })
  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalCalls: 0, callsToday: 0, callsWeek: 0,
    avgLatencyMs: 0, successRate: 0, totalTokens: 0
  })
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    groq: 'checking', mimo: 'checking', huggingface: 'checking', edgeFunction: 'checking'
  })

  // Edit state
  const [editingModel, setEditingModel] = useState<string | null>(null)
  const [testMessage, setTestMessage] = useState('ما حالة الإرساليات اليوم؟')
  const [testResult, setTestResult] = useState<{ success: boolean; reply: string; latencyMs: number; source: string } | null>(null)
  const [testing, setTesting] = useState(false)

  // ═══ LOAD ALL DATA ═══
  const loadData = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Load all data in parallel
      const [modelsRes, settingsRes, docsRes, chunksRes, embeddedRes, usageRes] = await Promise.allSettled([
        supabase.from('ai_models').select('*').order('priority'),
        supabase.from('app_settings').select('*').like('key', 'ai%'),
        supabase.from('ai_documents').select('id, title, title_ar, doc_type, total_chunks, is_indexed, created_at').order('created_at', { ascending: false }),
        supabase.from('ai_chunks').select('id', { count: 'exact', head: true }),
        supabase.from('ai_chunks').select('id', { count: 'exact', head: true }).not('embedding', 'is', null),
        loadUsageStats(),
      ])

      // Models
      if (modelsRes.status === 'fulfilled' && modelsRes.value.data) {
        setModels(modelsRes.value.data.map((m: any) => ({
          ...m,
          capabilities: Array.isArray(m.capabilities) ? m.capabilities : []
        })))
      }

      // Settings
      if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
        const settingsMap: Record<string, any> = {}
        settingsRes.value.data.forEach((s: AppSetting) => {
          settingsMap[s.key] = typeof s.value === 'string' ? JSON.parse(s.value) : s.value
        })
        setSettings(settingsMap)
      }

      // Knowledge docs
      if (docsRes.status === 'fulfilled' && docsRes.value.data) {
        setKnowledgeDocs(docsRes.value.data)
      }

      // Knowledge stats
      const totalChunks = chunksRes.status === 'fulfilled' ? (chunksRes.value.count || 0) : 0
      const embeddedChunks = embeddedRes.status === 'fulfilled' ? (embeddedRes.value.count || 0) : 0
      setKnowledgeStats({ totalChunks, embeddedChunks })

      // Usage stats
      if (usageRes.status === 'fulfilled') {
        setUsageStats(usageRes.value)
      }

    } catch (err) {
      console.error('Failed to load AI settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  async function loadUsageStats(): Promise<UsageStats> {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const [allRes, todayRes, weekRes] = await Promise.all([
      supabase.from('ai_model_usage').select('id, tokens_used, latency_ms, success, created_at', { count: 'exact' }),
      supabase.from('ai_model_usage').select('id', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00Z`),
      supabase.from('ai_model_usage').select('tokens_used, latency_ms, success').gte('created_at', weekAgo),
    ])

    const allData = allRes.data || []
    const weekData = weekRes.data || []
    const totalTokens = weekData.reduce((s: number, r: any) => s + (r.tokens_used || 0), 0)
    const avgLatency = weekData.length > 0
      ? weekData.reduce((s: number, r: any) => s + (r.latency_ms || 0), 0) / weekData.length
      : 0
    const successCount = weekData.filter((r: any) => r.success).length
    const successRate = weekData.length > 0 ? (successCount / weekData.length) * 100 : 100

    return {
      totalCalls: allRes.count || 0,
      callsToday: todayRes.count || 0,
      callsWeek: weekData.length,
      avgLatencyMs: Math.round(avgLatency),
      successRate: Math.round(successRate * 10) / 10,
      totalTokens,
    }
  }

  // ═══ CHECK CONNECTIONS ═══
  const checkConnections = useCallback(async () => {
    setConnectionStatus(prev => ({ ...prev, edgeFunction: 'checking' }))

    try {
      // Test Edge Function with a minimal request
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setConnectionStatus({ groq: 'not_configured', mimo: 'not_configured', huggingface: 'not_configured', edgeFunction: 'error' })
        return
      }

      // Call model_status mode to check what's available
      const { data, error } = await supabase.functions.invoke('ai-chat-v3', {
        body: { mode: 'model_status' },
      })

      if (error) {
        setConnectionStatus(prev => ({ ...prev, edgeFunction: 'error' }))
        return
      }

      setConnectionStatus(prev => ({
        ...prev,
        edgeFunction: 'connected',
        groq: data?.availableKeys?.groq ? 'connected' : 'not_configured',
        mimo: data?.availableKeys?.mimo ? 'connected' : 'not_configured',
        huggingface: data?.availableKeys?.huggingface ? 'connected' : 'not_configured',
      }))

      // Also update models from the response if available
      if (data?.models?.length) {
        setModels(data.models.map((m: any) => ({
          ...m,
          capabilities: Array.isArray(m.capabilities) ? m.capabilities : []
        })))
      }
    } catch {
      setConnectionStatus(prev => ({ ...prev, edgeFunction: 'error' }))
    }
  }, [])

  // ═══ TEST AI CHAT ═══
  const handleTestChat = async () => {
    if (!testMessage.trim()) return
    setTesting(true)
    setTestResult(null)

    try {
      const startMs = Date.now()
      const { data, error } = await supabase.functions.invoke('ai-chat-v3', {
        body: { message: testMessage, stream: false },
      })
      const latencyMs = Date.now() - startMs

      if (error) {
        setTestResult({ success: false, reply: `خطأ: ${error.message}`, latencyMs, source: 'error' })
      } else {
        setTestResult({
          success: true,
          reply: data?.reply || 'لا يوجد رد',
          latencyMs,
          source: data?.source || 'unknown',
        })
      }
    } catch (err: any) {
      setTestResult({ success: false, reply: `خطأ في الاتصال: ${err.message}`, latencyMs: 0, source: 'error' })
    } finally {
      setTesting(false)
    }
  }

  // ═══ SAVE SETTINGS ═══
  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // Save all AI settings to app_settings table
      const entries = Object.entries(settings).filter(([key]) => key.startsWith('ai_'))

      for (const [key, value] of entries) {
        await supabase.from('app_settings').upsert({
          key,
          value: JSON.stringify(value),
          category: 'ai',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })
      }

      setSaved(true)
      toast({ title: '✅ تم حفظ إعدادات AI في قاعدة البيانات', variant: 'success' })
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      toast({ title: `فشل الحفظ: ${err.message}`, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ═══ TOGGLE MODEL ═══
  const toggleModel = async (modelId: string, field: 'is_active' | 'is_default') => {
    try {
      if (field === 'is_default') {
        // Unset all defaults first, then set the new one
        await supabase.from('ai_models').update({ is_default: false }).neq('id', '')
      }
      const currentValue = models.find(m => m.id === modelId)?.[field]
      await supabase.from('ai_models').update({ [field]: !currentValue }).eq('id', modelId)
      await loadData()
      toast({ title: 'تم تحديث النموذج', variant: 'success' })
    } catch (err: any) {
      toast({ title: `فشل التحديث: ${err.message}`, variant: 'destructive' })
    }
  }

  // ═══ UPDATE SETTING ═══
  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // ═══ INIT ═══
  useEffect(() => {
    loadData()
    checkConnections()
  }, [loadData, checkConnections])

  // ═══ PROVIDER LABELS ═══
  const providerLabels: Record<string, { name: string; icon: string; color: string }> = {
    groq: { name: 'Groq', icon: '⚡', color: 'text-orange-600' },
    mimo: { name: 'MiMo (Xiaomi)', icon: '🤖', color: 'text-blue-600' },
    gemini: { name: 'Google Gemini', icon: '🔮', color: 'text-purple-600' },
    huggingface: { name: 'HuggingFace', icon: '🤗', color: 'text-yellow-600' },
    local: { name: 'Local AI', icon: '🏠', color: 'text-gray-600' },
  }

  return (
    <div className="page-enter">
      <Header
        title="إعدادات الذكاء الاصطناعي"
        subtitle="تكوين نظام AI — البيانات الحية من Supabase"
        onRefresh={() => { loadData(); checkConnections() }}
      />

      <div className="p-6">
        {!isConfigured && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-800">Supabase غير مُكوّن. تحقق من متغيرات البيئة.</p>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 flex-wrap">
            <TabsTrigger value="models" className="gap-2">
              <Cpu className="w-4 h-4" />
              النماذج
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2">
              <Database className="w-4 h-4" />
              قاعدة المعرفة
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Sliders className="w-4 h-4" />
              الإعدادات
            </TabsTrigger>
            <TabsTrigger value="test" className="gap-2">
              <TestTube className="w-4 h-4" />
              اختبار مباشر
            </TabsTrigger>
            <TabsTrigger value="usage" className="gap-2">
              <Activity className="w-4 h-4" />
              الاستهلاك
            </TabsTrigger>
          </TabsList>

          {/* ═══ TAB: Models ═══ */}
          <TabsContent value="models" className="space-y-6 animate-fade-in">
            {/* Connection Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  حالة الاتصال بمزودي AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(connectionStatus).map(([key, status]) => (
                    <div key={key} className={cn(
                      'p-3 rounded-xl border text-center',
                      status === 'connected' ? 'border-emerald-200 bg-emerald-50' :
                      status === 'error' ? 'border-red-200 bg-red-50' :
                      status === 'not_configured' ? 'border-gray-200 bg-gray-50' :
                      'border-blue-200 bg-blue-50'
                    )}>
                      <div className="flex items-center justify-center mb-1">
                        {status === 'connected' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> :
                         status === 'error' ? <XCircle className="w-5 h-5 text-red-600" /> :
                         status === 'not_configured' ? <WifiOff className="w-5 h-5 text-gray-400" /> :
                         <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
                      </div>
                      <p className="text-xs font-medium">
                        {key === 'edgeFunction' ? 'Edge Function' :
                         key === 'groq' ? 'Groq API' :
                         key === 'mimo' ? 'MiMo API' :
                         'HuggingFace'}
                      </p>
                      <p className={cn('text-[10px] mt-0.5',
                        status === 'connected' ? 'text-emerald-700' :
                        status === 'error' ? 'text-red-700' :
                        status === 'not_configured' ? 'text-gray-500' :
                        'text-blue-700'
                      )}>
                        {status === 'connected' ? 'متصل ✅' :
                         status === 'error' ? 'خطأ ❌' :
                         status === 'not_configured' ? 'غير مُهيّأ' :
                         'جاري الفحص...'}
                      </p>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={checkConnections}>
                  <RefreshCw className="w-3 h-3" /> إعادة فحص الاتصالات
                </Button>
              </CardContent>
            </Card>

            {/* Models List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  نماذج AI ({models.length})
                </CardTitle>
                <CardDescription>النماذج المُعرّفة في قاعدة البيانات — مرتبة حسب الأولوية</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                  </div>
                ) : models.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">لا توجد نماذج في قاعدة البيانات</p>
                    <p className="text-xs mt-1">تأكد من تطبيق migration 008_ai_model_management.sql</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {models.map((model) => {
                      const p = providerLabels[model.provider] || { name: model.provider, icon: '❓', color: 'text-gray-600' }
                      return (
                        <div
                          key={model.id}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all',
                            model.is_default ? 'border-primary bg-primary/5 shadow-sm' : 'border-border',
                            !model.is_active && 'opacity-50'
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{p.icon}</span>
                                <h4 className="font-bold text-sm truncate">{model.name_ar}</h4>
                                {model.is_default && <Badge variant="default" className="text-[9px]">افتراضي</Badge>}
                                {!model.is_active && <Badge variant="secondary" className="text-[9px]">معطّل</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground font-mono" dir="ltr">{model.model_id}</p>
                              <p className="text-xs text-muted-foreground mt-1">{model.description_ar}</p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                                <span>الاستخدام: {model.usage_count}</span>
                                <span>الأولوية: {model.priority}</span>
                                <span>الحد الأقصى: {model.max_tokens} رمز</span>
                                <span>الحرارة: {model.temperature}</span>
                              </div>
                              {model.capabilities.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {model.capabilities.map((cap) => (
                                    <Badge key={cap} variant="outline" className="text-[9px] px-1.5 py-0">
                                      {cap === 'chat' ? '💬 محادثة' :
                                       cap === 'streaming' ? '📡 تدفق' :
                                       cap === 'function_calling' ? '🔧 أدوات' :
                                       cap === 'arabic' ? '🇸🇦 عربي' :
                                       cap === 'embeddings' ? '🧬 تمثيلات' :
                                       cap === 'fast' ? '⚡ سريع' :
                                       cap === 'offline' ? '📴 أوفلاين' :
                                       cap}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant={model.is_default ? 'default' : 'outline'}
                                className="text-[10px] h-7"
                                onClick={() => toggleModel(model.id, 'is_default')}
                                disabled={!model.is_active}
                              >
                                {model.is_default ? '✓ افتراضي' : 'تعيين افتراضي'}
                              </Button>
                              <Button
                                size="sm"
                                variant={model.is_active ? 'ghost' : 'outline'}
                                className="text-[10px] h-7"
                                onClick={() => toggleModel(model.id, 'is_active')}
                              >
                                {model.is_active ? 'تعطيل' : 'تفعيل'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ TAB: Knowledge Base ═══ */}
          <TabsContent value="knowledge" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-3xl font-heading font-bold">{knowledgeDocs.length}</p>
                  <p className="text-xs text-muted-foreground">مستندات معرفية</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Database className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-3xl font-heading font-bold">{knowledgeStats.totalChunks}</p>
                  <p className="text-xs text-muted-foreground">قطع نصية (Chunks)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Brain className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-3xl font-heading font-bold">{knowledgeStats.embeddedChunks}</p>
                  <p className="text-xs text-muted-foreground">بـ Embeddings (Vector Search)</p>
                </CardContent>
              </Card>
            </div>

            {knowledgeStats.embeddedChunks < knowledgeStats.totalChunks && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">⚠️ بعض النصوص بدون Embeddings</p>
                    <p className="text-xs text-amber-700 mt-1">
                      {knowledgeStats.totalChunks - knowledgeStats.embeddedChunks} نص بدون embeddings.
                      RAG سيعمل بالبحث النصي (keyword) بدلاً من البحث الدلالي.
                      شغّل migration 012 أو أضف HF_API_TOKEN.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                  المستندات المعرفية
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-32 rounded-xl" />
                ) : knowledgeDocs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">قاعدة المعرفة فارغة</p>
                    <p className="text-xs mt-1">طبّق migrations 009, 010, 017, 018, 019</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {knowledgeDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-2 h-2 rounded-full',
                            doc.is_indexed ? 'bg-emerald-500' : 'bg-amber-500'
                          )} />
                          <div>
                            <p className="text-sm font-medium">{doc.title_ar || doc.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {doc.doc_type} · {doc.total_chunks} chunks · {doc.is_indexed ? 'مفهرس' : 'غير مفهرس'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px]">{doc.doc_type}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ TAB: Settings ═══ */}
          <TabsContent value="settings" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Cog className="w-5 h-5 text-purple-500" />
                  إعدادات AI العامة
                </CardTitle>
                <CardDescription>هذه الإعدادات تُحفظ في جدول app_settings وتُقرأ من Edge Function</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* AI Enabled */}
                <div className="flex items-center justify-between p-4 rounded-xl border">
                  <div>
                    <p className="font-medium text-sm">تفعيل المساعد الذكي</p>
                    <p className="text-xs text-muted-foreground">عند التعطيل، كل طلبات AI سترجع 503</p>
                  </div>
                  <Switch
                    checked={settings.ai_enabled !== false}
                    onCheckedChange={(v) => updateSetting('ai_enabled', v)}
                  />
                </div>

                {/* Fallback Enabled */}
                <div className="flex items-center justify-between p-4 rounded-xl border">
                  <div>
                    <p className="font-medium text-sm">تفعيل التراجع التلقائي</p>
                    <p className="text-xs text-muted-foreground">إذا فشل النموذج الافتراضي، جرّب البديل</p>
                  </div>
                  <Switch
                    checked={settings.ai_fallback_enabled !== false}
                    onCheckedChange={(v) => updateSetting('ai_fallback_enabled', v)}
                  />
                </div>

                {/* Streaming */}
                <div className="flex items-center justify-between p-4 rounded-xl border">
                  <div>
                    <p className="font-medium text-sm">تفعيل الكتابة التدريجية (Streaming)</p>
                    <p className="text-xs text-muted-foreground">يعرض الرد كلمة بكلمة بدلاً من الانتظار</p>
                  </div>
                  <Switch
                    checked={settings.ai_stream_enabled !== false}
                    onCheckedChange={(v) => updateSetting('ai_stream_enabled', v)}
                  />
                </div>

                <Separator />

                {/* Max History */}
                <div className="space-y-2">
                  <Label>أقصى عدد رسائل في سجل المحادثة</Label>
                  <Input
                    type="number"
                    value={settings.ai_max_history ?? 6}
                    onChange={(e) => updateSetting('ai_max_history', parseInt(e.target.value) || 6)}
                    min={1}
                    max={20}
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground">كلما زاد = سياق أكثر لكن tokens أكثر</p>
                </div>

                {/* Rate Limit */}
                <div className="space-y-2">
                  <Label>أقصى عدد طلبات في الدقيقة لكل مستخدم</Label>
                  <Input
                    type="number"
                    value={settings.ai_rate_limit ?? 25}
                    onChange={(e) => updateSetting('ai_rate_limit', parseInt(e.target.value) || 25)}
                    min={1}
                    max={100}
                    className="w-32"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    حفظ في قاعدة البيانات
                  </Button>
                  {saved && (
                    <span className="text-sm text-emerald-600 flex items-center gap-1 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4" /> تم الحفظ
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ TAB: Test ═══ */}
          <TabsContent value="test" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-emerald-500" />
                  اختبار مباشر لـ AI Chat
                </CardTitle>
                <CardDescription>
                  أرسل رسالة حقيقية إلى Edge Function وشوف الرد فوراً
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="اكتب سؤالك هنا..."
                    dir="rtl"
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleTestChat()}
                  />
                  <Button onClick={handleTestChat} disabled={testing || !testMessage.trim()} className="gap-2">
                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    اختبار
                  </Button>
                </div>

                {/* Quick test messages */}
                <div className="flex flex-wrap gap-2">
                  {['ما حالة الإرساليات اليوم؟', 'أين النواقص الحرجة؟', 'أي المحافظات الأكثر إرسالاً؟', 'أنشئ تقريراً يومياً'].map(msg => (
                    <button
                      key={msg}
                      onClick={() => setTestMessage(msg)}
                      className="text-xs px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors"
                    >
                      {msg}
                    </button>
                  ))}
                </div>

                {testResult && (
                  <div className={cn(
                    'p-4 rounded-xl border animate-fade-in',
                    testResult.success ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                        <span className="text-xs font-medium">{testResult.success ? 'نجح الاختبار' : 'فشل الاختبار'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>⏱️ {testResult.latencyMs}ms</span>
                        <Badge variant="outline" className="text-[9px]">{testResult.source}</Badge>
                      </div>
                    </div>
                    <div className="text-sm whitespace-pre-wrap" dir="rtl">
                      {testResult.reply}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ TAB: Usage ═══ */}
          <TabsContent value="usage" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-heading font-bold">{usageStats.totalCalls}</p>
                  <p className="text-xs text-muted-foreground">إجمالي الاستدعاءات</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                  <p className="text-2xl font-heading font-bold">{usageStats.callsToday}</p>
                  <p className="text-xs text-muted-foreground">استدعاءات اليوم</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-heading font-bold">{usageStats.callsWeek}</p>
                  <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-2xl font-heading font-bold">{usageStats.avgLatencyMs}ms</p>
                  <p className="text-xs text-muted-foreground">متوسط الاستجابة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                  <p className="text-2xl font-heading font-bold">{usageStats.successRate}%</p>
                  <p className="text-xs text-muted-foreground">نسبة النجاح</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-heading font-bold">{usageStats.totalTokens.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Tokens هذا الأسبوع</p>
                </CardContent>
              </Card>
            </div>

            {/* Per-model usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading">الاستهلاك حسب النموذج</CardTitle>
              </CardHeader>
              <CardContent>
                {models.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
                ) : (
                  <div className="space-y-3">
                    {models.filter(m => m.usage_count > 0).map((model) => {
                      const maxUsage = Math.max(...models.map(m => m.usage_count), 1)
                      return (
                        <div key={model.id} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{model.name_ar}</span>
                            <span className="font-mono">{model.usage_count}×</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${(model.usage_count / maxUsage) * 100}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
