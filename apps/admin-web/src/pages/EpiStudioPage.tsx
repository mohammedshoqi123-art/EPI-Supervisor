// ═══════════════════════════════════════════════════════════════
// EPI Studio Page — NotebookLM-Inspired Content Generator
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react'
import {
  Sparkles, Loader2, FileText, BookOpen, HelpCircle, Brain, Podcast,
  ChevronRight, Clock, Zap, FileCheck, X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { cn } from '@/lib/utils'
import {
  generateStudioArtifact,
  STUDIO_TYPES,
  type StudioArtifactType,
  type StudioArtifact,
  type StudioSource,
} from '@/lib/studio-service'
import { CitationText } from '@/components/ai/AIChatWidget'

export function EpiStudioPage() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [artifact, setArtifact] = useState<StudioArtifact | null>(null)

  const handleGenerate = async (type: StudioArtifactType) => {
    if (!topic.trim()) return
    setLoading(type)
    setArtifact(null)
    const result = await generateStudioArtifact(type, topic)
    setArtifact(result)
    setLoading(null)
  }

  return (
    <>
      <Header title="استوديو المحتوى الذكي" subtitle="NotebookLM-inspired — توليد محتوى موثّق من بيانات النظام" />
      <div className="container mx-auto p-4 space-y-4">
        {/* Topic Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-primary" />
              موضوع المحتوى
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: تحليل أداء حملة شلل الأطفال في تعز"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && topic.trim() && !loading) {
                  handleGenerate('briefing_doc')
                }
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              سيتم توليد المحتوى من بيانات النظام الحقيقية + قاعدة المعرفة الطبية
            </p>
          </CardContent>
        </Card>

        {/* Type Selector */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {STUDIO_TYPES.map((t) => {
            const isLoading = loading === t.type
            const colorClasses = {
              blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
              emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
              amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
              purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100',
              pink: 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100',
            }
            return (
              <button
                key={t.type}
                onClick={() => handleGenerate(t.type)}
                disabled={!topic.trim() || loading !== null}
                className={cn(
                  'p-3 rounded-xl border-2 text-center transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
                  colorClasses[t.color as keyof typeof colorClasses],
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                ) : (
                  <div className="text-2xl mb-1">{t.icon}</div>
                )}
                <div className="text-xs font-bold mt-1">{t.title}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{t.description}</div>
              </button>
            )
          })}
        </div>

        {/* Loading state */}
        {loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-3" />
              <p className="text-sm font-medium">جاري توليد المحتوى...</p>
              <p className="text-xs text-muted-foreground mt-1">يستغرق 10-30 ثانية</p>
            </CardContent>
          </Card>
        )}

        {/* Artifact Display */}
        {artifact && !loading && <ArtifactDisplay artifact={artifact} />}

        {/* Empty State */}
        {!artifact && !loading && (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-5xl mb-4 opacity-30">✨</div>
              <h3 className="text-base font-bold mb-2">استوديو المحتوى الذكي</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                اكتب موضوعاً واختر نوع المحتوى. سيتم توليده من بيانات النظام الحقيقية
                وقاعدة المعرفة الطبية، مع توثيق كل ادعاء بـ [n] قابل للنقر.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}

function ArtifactDisplay({ artifact }: { artifact: StudioArtifact }) {
  const type = STUDIO_TYPES.find((t) => t.type === artifact.type)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{type?.icon}</span>
            <span className="text-base">{artifact.title}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            <FileCheck className="w-3 h-3 ml-1" />
            مستند إلى {artifact.metadata.groundedInSources} مصدر
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          {artifact.metadata.provider && (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {artifact.metadata.provider}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {artifact.metadata.latencyMs < 1000
              ? `${artifact.metadata.latencyMs}ms`
              : `${(artifact.metadata.latencyMs / 1000).toFixed(1)}s`}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {artifact.type === 'audio_overview' && artifact.audioScript ? (
          <AudioScriptView script={artifact.audioScript} sources={artifact.sources} />
        ) : artifact.type === 'faq' && artifact.faqItems ? (
          <FaqView items={artifact.faqItems} sources={artifact.sources} />
        ) : artifact.type === 'mind_map' && artifact.mindMapNodes ? (
          <MindMapView nodes={artifact.mindMapNodes} sources={artifact.sources} />
        ) : (
          <div className="prose prose-sm max-w-none">
            <CitationText text={artifact.content} sources={artifact.sources} />
          </div>
        )}

        {/* Sources */}
        {artifact.sources.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-bold mb-2 flex items-center gap-1">
              <FileCheck className="w-3 h-3" />
              المصادر ({artifact.sources.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {artifact.sources.map((s) => (
                <SourceChip key={s.id} source={s} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SourceChip({ source }: { source: StudioSource }) {
  const [expanded, setExpanded] = useState(false)
  const colorByType: Record<string, string> = {
    db_row: 'bg-blue-100 text-blue-700 border-blue-200',
    aggregate: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    knowledge_chunk: 'bg-purple-100 text-purple-700 border-purple-200',
  }
  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border',
          colorByType[source.type] || 'bg-gray-100 text-gray-700 border-gray-200',
        )}
      >
        <span className="w-4 h-4 inline-flex items-center justify-center bg-white/50 rounded-sm">
          {source.id}
        </span>
        <span className="max-w-[150px] truncate">{source.summary}</span>
      </button>
      {expanded && (
        <div className="absolute z-10 mt-1 right-0 w-72 p-3 rounded-lg bg-popover border shadow-lg text-xs">
          <div className="flex items-start justify-between mb-2">
            <span className="font-bold">{source.summary}</span>
            <button onClick={() => setExpanded(false)} className="text-muted-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
          {source.quote && (
            <pre className="whitespace-pre-wrap text-muted-foreground font-mono text-[10px] leading-relaxed">
              {source.quote}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

function FaqView({
  items,
  sources,
}: {
  items: Array<{ question: string; answer: string; citations: number[] }>
  sources: StudioSource[]
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="p-3 rounded-lg bg-amber-50/50 border-r-4 border-amber-300"
        >
          <div className="flex items-start gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="font-bold text-sm">{item.question}</p>
          </div>
          <div className="text-xs leading-relaxed pl-6">
            <CitationText text={item.answer} sources={sources} />
          </div>
        </div>
      ))}
    </div>
  )
}

function MindMapView({ nodes, sources }: { nodes: any[]; sources: StudioSource[] }) {
  return (
    <div className="p-4 bg-purple-50/30 rounded-lg border border-purple-200">
      {nodes.map((node, i) => (
        <MindMapNode key={i} node={node} sources={sources} depth={0} />
      ))}
    </div>
  )
}

function MindMapNode({
  node,
  sources,
  depth,
}: {
  node: any
  sources: StudioSource[]
  depth: number
}) {
  const children = node.children || []
  return (
    <div className={cn(depth > 0 && 'pr-4 border-r-2 border-purple-200 mr-2')}>
      <div className="flex items-center gap-2 py-1">
        <div
          className={cn(
            'rounded-full',
            depth === 0 ? 'w-3 h-3 bg-purple-500' : 'w-2 h-2 bg-purple-300',
          )}
        />
        <span
          className={cn(
            'text-sm',
            depth === 0 ? 'font-bold' : depth === 1 ? 'font-semibold' : 'font-normal',
          )}
        >
          {node.label}
          {node.citation && (
            <span className="inline-flex items-center justify-center w-4 h-4 mx-1 rounded text-[9px] font-bold bg-purple-100 text-purple-700 border border-purple-300">
              {node.citation}
            </span>
          )}
        </span>
      </div>
      {children.length > 0 && (
        <div className="mr-2">
          {children.map((c: any, i: number) => (
            <MindMapNode key={i} node={c} sources={sources} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function AudioScriptView({
  script,
  sources,
}: {
  script: Array<{
    speaker: 'host1' | 'host2'
    text: string
    emotion?: string
    citations?: number[]
  }>
  sources: StudioSource[]
}) {
  const emotionEmoji: Record<string, string> = {
    enthusiastic: '😊',
    serious: '😌',
    curious: '🤔',
    neutral: '💬',
  }

  return (
    <div>
      {/* Player placeholder */}
      <div className="p-4 mb-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white">
        <div className="flex items-center gap-3">
          <button className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <Podcast className="w-6 h-6" />
          </button>
          <div>
            <p className="font-bold text-sm">بودكاست تعليمي</p>
            <p className="text-xs opacity-80">
              {script.length} مقطع • مدة تقديرية {Math.floor(script.length / 2)} دقيقة
            </p>
          </div>
        </div>
      </div>

      {/* Script segments */}
      <div className="space-y-2">
        {script.map((seg, i) => {
          const isHost1 = seg.speaker === 'host1'
          return (
            <div
              key={i}
              className={cn(
                'p-3 rounded-lg border-r-4',
                isHost1
                  ? 'bg-pink-50/50 border-pink-400'
                  : 'bg-muted/50 border-muted-foreground/30',
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                    isHost1 ? 'bg-pink-500' : 'bg-purple-500',
                  )}
                >
                  {isHost1 ? 'أ' : 'ف'}
                </div>
                <span
                  className={cn(
                    'text-xs font-bold',
                    isHost1 ? 'text-pink-700' : 'text-purple-700',
                  )}
                >
                  {isHost1 ? 'أحمد' : 'فاطمة'} {emotionEmoji[seg.emotion || 'neutral']}
                </span>
              </div>
              <div className="text-xs leading-relaxed pl-8">
                <CitationText text={seg.text} sources={sources} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default EpiStudioPage
