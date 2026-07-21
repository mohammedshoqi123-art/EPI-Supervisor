import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Lock,
  Unlock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'

interface CampaignRound {
  id: string
  campaign_type: string
  round_number: number
  name_ar: string
  start_date: string | null
  end_date: string | null
  is_locked: boolean
  is_visible: boolean
  locked_at: string | null
  locked_by: string | null
  lock_reason: string | null
  created_at: string
  updated_at: string
}

const CAMPAIGN_LABELS: Record<string, string> = {
  polio_campaign: 'حملة شلل الأطفال',
  integrated_activity: 'النشاط الإيصال التكاملي',
  measles_campaign: 'حملة الحصبة',
  routine_immunization: 'التحصين الروتيني',
}

export default function CampaignRoundsPage() {
  const { data: authData } = useAuth()
  const user = authData?.profile
  const [rounds, setRounds] = useState<CampaignRound[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState('integrated_activity')
  const [lockDialog, setLockDialog] = useState<{
    open: boolean
    round: CampaignRound | null
    locking: boolean
  }>({ open: false, round: null, locking: true })
  const [lockReason, setLockReason] = useState('')
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    fetchRounds()
  }, [selectedCampaign])

  async function fetchRounds() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('campaign_rounds')
        .select('*')
        .eq('campaign_type', selectedCampaign)
        .is('deleted_at', null)
        .order('round_number')

      if (error) throw error
      setRounds(data || [])
    } catch (error: any) {
      alert(error.message || 'فشل تحميل الجولات')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleLock() {
    if (!lockDialog.round) return
    setToggling(true)

    try {
      const { error } = await supabase.rpc('toggle_round_lock', {
        p_campaign_type: selectedCampaign,
        p_round_number: lockDialog.round.round_number,
        p_locked: lockDialog.locking,
        p_reason: lockDialog.locking ? lockReason : null,
      })

      if (error) throw error

      alert(
        lockDialog.locking
          ? `تم قفل الجولة ${lockDialog.round.round_number} — لا يمكن إدخال بيانات`
          : `تم فتح الجولة ${lockDialog.round.round_number} — يمكن إدخال البيانات`
      )

      setLockDialog({ open: false, round: null, locking: true })
      setLockReason('')
      fetchRounds()
    } catch (error: any) {
      alert(error.message || 'فشل تغيير حالة الجولة')
    } finally {
      setToggling(false)
    }
  }

  function openLockDialog(round: CampaignRound, locking: boolean) {
    setLockDialog({ open: true, round, locking })
    setLockReason('')
  }

  async function handleToggleVisibility(round: CampaignRound) {
    try {
      const { error } = await supabase
        .from('campaign_rounds')
        .update({ is_visible: !round.is_visible })
        .eq('id', round.id)

      if (error) throw error

      alert(
        round.is_visible
          ? `تم إخفاء الجولة ${round.round_number} من الفلاتر`
          : `تم إظهار الجولة ${round.round_number} في الفلاتر`
      )

      fetchRounds()
    } catch (error: any) {
      alert(error.message || 'فشل تغيير حالة الظهور')
    }
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'central'

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">إدارة جولات النشاط</h1>
          <p className="text-muted-foreground">
            قفل وفتح الجولات — يمنع إدخال البيانات في الجولات المنتهية
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRounds}>
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* Campaign selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(CAMPAIGN_LABELS).map(([key, label]) => (
          <Button
            key={key}
            variant={selectedCampaign === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCampaign(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rounds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              لا توجد جولات لهذا النشاط
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              ستُنشأ الجولات تلقائياً عند أول استخدام
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rounds.map((round) => (
            <Card
              key={round.id}
              className={round.is_locked ? 'border-orange-200 bg-orange-50/50' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {round.is_locked ? (
                      <Lock className="h-5 w-5 text-orange-500" />
                    ) : (
                      <Unlock className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {round.name_ar}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        الجولة {round.round_number} — {CAMPAIGN_LABELS[round.campaign_type] || round.campaign_type}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={round.is_locked ? 'destructive' : 'default'}
                    className={round.is_locked ? '' : 'bg-green-500'}
                  >
                    {round.is_locked ? (
                      <>
                        <Lock className="h-3 w-3 ml-1" />
                        مقفلة
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 ml-1" />
                        نشطة
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground space-y-1">
                    {round.is_locked && round.locked_at && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          أُغلقت: {new Date(round.locked_at).toLocaleDateString('ar-YE')}
                        </span>
                      </div>
                    )}
                    {round.is_locked && round.lock_reason && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3" />
                        <span>السبب: {round.lock_reason}</span>
                      </div>
                    )}
                    {!round.is_locked && (
                      <span className="text-green-600">
                        مفتوحة — يمكن إدخال البيانات
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-3">
                      {/* Visibility toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {round.is_visible ? 'ظاهر في الفلاتر' : 'مختفي من الفلاتر'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleVisibility(round)}
                          title={round.is_visible ? 'إخفاء من الفلاتر' : 'إظهار في الفلاتر'}
                        >
                          {round.is_visible ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>

                      {/* Lock toggle */}
                      <span className="text-sm text-muted-foreground">
                        {round.is_locked ? 'فتح الجولة' : 'قفل الجولة'}
                      </span>
                      <Switch
                        checked={round.is_locked}
                        onCheckedChange={() =>
                          openLockDialog(round, !round.is_locked)
                        }
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lock/Unlock Confirmation Dialog */}
      <Dialog
        open={lockDialog.open}
        onOpenChange={(open) => setLockDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {lockDialog.locking ? 'قفل الجولة' : 'فتح الجولة'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              {lockDialog.locking ? (
                <>
                  هل أنت متأكد من قفل{' '}
                  <strong>{lockDialog.round?.name_ar}</strong>؟
                  <br />
                  <span className="text-orange-600">
                    لن يتمكن المستخدمون من إدخال بيانات في هذه الجولة.
                  </span>
                </>
              ) : (
                <>
                  هل أنت متأكد من فتح{' '}
                  <strong>{lockDialog.round?.name_ar}</strong>؟
                  <br />
                  <span className="text-green-600">
                    سيتمكن المستخدمون من إدخال البيانات في هذه الجولة.
                  </span>
                </>
              )}
            </p>

            {lockDialog.locking && (
              <div>
                <label className="text-sm font-medium">
                  سبب القفل (اختياري)
                </label>
                <textarea
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="مثال: انتهت الجولة، تم الانتقال للجولة التالية"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setLockDialog({ open: false, round: null, locking: true })
              }
            >
              إلغاء
            </Button>
            <Button
              variant={lockDialog.locking ? 'destructive' : 'default'}
              onClick={handleToggleLock}
              disabled={toggling}
            >
              {toggling ? (
                <RefreshCw className="h-4 w-4 animate-spin ml-2" />
              ) : lockDialog.locking ? (
                <Lock className="h-4 w-4 ml-2" />
              ) : (
                <Unlock className="h-4 w-4 ml-2" />
              )}
              {lockDialog.locking ? 'قفل الجولة' : 'فتح الجولة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
