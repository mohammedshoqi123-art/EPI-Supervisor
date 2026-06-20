import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Save, AlertCircle, CheckCircle2, Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase, isConfigured } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import { useCampaign, CAMPAIGN_ROUNDS, getRoundLabel } from '@/lib/campaign-context'
import { cn } from '@/lib/utils'

/**
 * Active Round Manager — يقرأ/يحدّث app_settings.active_campaign_round
 *
 * هذه القيمة هي ما يستخدمه الـ trigger كقيمة افتراضية للإرساليات الجديدة.
 * المسؤول يمكنه تغييرها من هنا، فعلياً يتحكم بـ "الجولة الحالية للنظام".
 */
export function ActiveRoundCard() {
  const { campaignRound, setCampaignRound, showRoundFilter, campaign } = useCampaign()
  const { toast } = useToast()
  const [serverRound, setServerRound] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load current active_round from app_settings
  const loadServerRound = useCallback(async () => {
    if (!isConfigured) { setLoading(false); return }
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'active_campaign_round')
        .maybeSingle()
      if (error) throw error
      const v = data?.value ? parseInt(data.value, 10) : 1
      setServerRound(isNaN(v) || v < 1 ? 1 : v)
    } catch (e: any) {
      console.error('Failed to load active_campaign_round:', e)
      setServerRound(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadServerRound() }, [loadServerRound])

  // Save the new active round to app_settings
  const saveRound = async (round: number) => {
    if (!isConfigured) {
      toast({ title: 'غير مُهيأ', description: 'Supabase غير مُعد', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      // upsert app_settings
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'active_campaign_round',
          value: String(round),
          description_ar: 'الجولة النشطة الحالية للنشاط الإيصالي التكاملي',
          description_en: 'Active campaign round for integrated activity',
          category: 'campaign',
          is_editable: true,
        }, { onConflict: 'key' })

      if (error) throw error

      setServerRound(round)
      // Also update local context (so sidebar filter + forms reflect the new active round)
      setCampaignRound(round)

      toast({
        title: 'تم الحفظ',
        description: `الجولة النشطة الآن: ${getRoundLabel(round)}`,
        variant: 'success',
      })
    } catch (e: any) {
      toast({
        title: 'فشل الحفظ',
        description: e.message || 'خطأ غير معروف',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Determine "out of sync" state — when local context round differs from server
  const outOfSync = serverRound !== null && campaignRound !== serverRound

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="font-heading flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              الجولة النشطة للنظام
            </CardTitle>
            <CardDescription>
              تتحكم في الجولة الافتراضية للإرساليات الجديدة (يستخدمها الـ trigger تلقائياً)
            </CardDescription>
          </div>
          {serverRound !== null && (
            <Badge variant="outline" className="text-xs gap-1">
              <Database className="w-3 h-3" />
              الحالية: {getRoundLabel(serverRound)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">جارٍ التحميل…</div>
        ) : serverRound === null ? (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              تعذّر قراءة الإعداد من قاعدة البيانات. تأكد من تشغيل migration 035 و 036.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-2">
              {CAMPAIGN_ROUNDS.map((r) => (
                <button
                  key={r}
                  onClick={() => saveRound(r)}
                  disabled={saving}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    serverRound === r
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                      : 'bg-card border-border hover:border-primary/50 hover:bg-muted/30'
                  )}
                >
                  <RefreshCw className={cn('w-4 h-4', serverRound === r && 'animate-none')} />
                  <span className="text-xs font-bold">{r}</span>
                  <span className="text-[10px] opacity-80 leading-tight">
                    {getRoundLabel(r).replace('الجولة ', '')}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-xs">
                {outOfSync ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-700">
                      فلتر العرض المحلي ({getRoundLabel(campaignRound)}) يختلف عن جولة النظام ({getRoundLabel(serverRound)})
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-700">فلتر العرض المحلي متطابق مع جولة النظام</span>
                  </>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCampaignRound(serverRound)}
                disabled={!outOfSync || saving}
                className="gap-1.5 h-8 text-xs"
              >
                <Save className="w-3 h-3" />
                مزامنة العرض
              </Button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              💡 عند تغيير الجولة هنا، الإرساليات الجديدة ستحمل رقمها تلقائياً (عبر trigger في قاعدة البيانات).
              الإرساليات الحالية لا تتأثر. لتصفية العروض حسب جولة معينة استخدم فلتر الجولة في الشريط الجانبي.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
