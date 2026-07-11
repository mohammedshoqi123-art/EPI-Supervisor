import { useState } from 'react'
import {
  Brain, Plus, Search, Edit, Trash2, Loader2, X,
  BookOpen, Tag, Star, Save,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { Header } from '@/components/layout/header'
import {
  useBotKnowledge, useCreateBotKnowledge, useUpdateBotKnowledge,
  useDeleteBotKnowledge, CATEGORY_LABELS, type BotKnowledgeCategory,
} from '@/hooks/api/bot-knowledge'
import { cn } from '@/lib/utils'
import type { BotKnowledgeEntry } from '@/hooks/api/bot-knowledge'

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [BotKnowledgeCategory, string][]

export default function BotKnowledgePage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showEditor, setShowEditor] = useState(false)
  const [editingEntry, setEditingEntry] = useState<BotKnowledgeEntry | null>(null)

  const knowledgeQuery = useBotKnowledge()
  const deleteMutation = useDeleteBotKnowledge()
  const allEntries = knowledgeQuery.data || []

  // Filter
  const filtered = allEntries.filter((e) => {
    const matchesSearch = !search ||
      e.topic.includes(search) ||
      e.title.includes(search) ||
      e.content.includes(search)
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter
    return matchesSearch && matchesCategory && e.is_active
  })

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Header title="معرفة مستشار التحصين" subtitle="إدارة قاعدة معرفة البوت الذكي" />

      {/* ═══ Stats ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="إجمالي المواضيع" value={allEntries.filter(e => e.is_active).length} icon={BookOpen} color="text-blue-600" />
        <StatCard label="الفئات" value={new Set(allEntries.map(e => e.category)).size} icon={Tag} color="text-purple-600" />
        <StatCard label="أولوية عالية" value={allEntries.filter(e => e.priority >= 85 && e.is_active).length} icon={Star} color="text-amber-600" />
        <StatCard label="من الكود" value={allEntries.filter(e => e.source === 'imported').length} icon={Brain} color="text-emerald-600" />
      </div>

      {/* ═══ Toolbar ═══ */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في المواضيع..."
            className="pr-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفئات</SelectItem>
            {CATEGORIES.map(([cat, label]) => (
              <SelectItem key={cat} value={cat}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditingEntry(null); setShowEditor(true) }}>
          <Plus className="h-4 w-4" />
          موضوع جديد
        </Button>
      </div>

      {/* ═══ List ═══ */}
      {knowledgeQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Brain className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 font-semibold">لا توجد مواضيع</p>
            <p className="text-sm text-muted-foreground">أضف موضوعاً جديداً لقاعدة معرفة البوت</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((entry) => (
            <KnowledgeCard
              key={entry.id}
              entry={entry}
              onEdit={() => { setEditingEntry(entry); setShowEditor(true) }}
              onDelete={() => deleteMutation.mutate(entry.id)}
            />
          ))}
        </div>
      )}

      {/* ═══ Editor ═══ */}
      {showEditor && (
        <KnowledgeEditor
          entry={editingEntry}
          open={showEditor}
          onOpenChange={setShowEditor}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════
// Stat Card
// ═══════════════════════════════════════

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-muted', color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════
// Knowledge Card
// ═══════════════════════════════════════

function KnowledgeCard({ entry, onEdit, onDelete }: { entry: BotKnowledgeEntry; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {CATEGORY_LABELS[entry.category as BotKnowledgeCategory] || entry.category}
              </Badge>
              {entry.priority >= 85 && (
                <Badge className="bg-amber-500 text-white text-xs">
                  <Star className="h-3 w-3 ml-1" />
                  عالي
                </Badge>
              )}
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {entry.source === 'imported' ? 'من الكود' : 'يدوي'}
              </Badge>
            </div>
            <h3 className="font-bold text-sm mb-1">{entry.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{entry.content}</p>
            {entry.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {entry.keywords.slice(0, 5).map((kw, i) => (
                  <span key={i} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {kw}
                  </span>
                ))}
                {entry.keywords.length > 5 && (
                  <span className="text-xs text-muted-foreground">+{entry.keywords.length - 5}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════
// Knowledge Editor
// ═══════════════════════════════════════

function KnowledgeEditor({
  entry,
  open,
  onOpenChange,
}: {
  entry: BotKnowledgeEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [topic, setTopic] = useState(entry?.topic ?? '')
  const [title, setTitle] = useState(entry?.title ?? '')
  const [content, setContent] = useState(entry?.content ?? '')
  const [category, setCategory] = useState<BotKnowledgeCategory>(entry?.category ?? 'general')
  const [keywordsStr, setKeywordsStr] = useState((entry?.keywords ?? []).join(', '))
  const [priority, setPriority] = useState(entry?.priority ?? 50)

  const createMutation = useCreateBotKnowledge()
  const updateMutation = useUpdateBotKnowledge()

  const handleSave = async () => {
    if (!topic.trim() || !title.trim() || !content.trim()) return

    const keywords = keywordsStr.split(',').map(k => k.trim()).filter(Boolean)

    if (entry) {
      await updateMutation.mutateAsync({
        id: entry.id,
        topic, title, content, category, keywords, priority,
      })
    } else {
      await createMutation.mutateAsync({
        topic, title, content, category, keywords, priority,
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? 'تعديل موضوع' : 'موضوع جديد'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>الموضوع (مفتاح فريد)</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="مثال: تعريف التطعيم" />
          </div>

          <div className="space-y-2">
            <Label>العنوان</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: ما هو التطعيم؟" />
          </div>

          <div className="space-y-2">
            <Label>المحتوى</Label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب محتوى الموضوع هنا..."
              rows={8}
              className="w-full p-3 rounded-lg border bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الفئة</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as BotKnowledgeCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(([cat, label]) => (
                    <SelectItem key={cat} value={cat}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الأولوية (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الكلمات المفتاحية (مفصولة بفواصل)</Label>
            <Input
              value={keywordsStr}
              onChange={(e) => setKeywordsStr(e.target.value)}
              placeholder="تطعيم, لقاح, تحصين"
            />
            <p className="text-xs text-muted-foreground">تُستخدم للبحث — اكتب الكلمات مفصولة بفواصل</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending || !topic.trim() || !title.trim() || !content.trim()}
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
