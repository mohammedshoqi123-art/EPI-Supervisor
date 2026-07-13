// ═══════════════════════════════════════════════════════════
// EPI Copilot — NotebookLM Studio Engine
// ═══════════════════════════════════════════════════════════
//
// Inspired by Google NotebookLM's Studio panel:
// - Study Guide: structured Q&A from sources
// - Briefing Doc: executive summary
// - FAQ: frequently asked questions
// - Mind Map: branching topic diagram
// - Audio Overview: TTS-ready podcast script
//
// All outputs are GROUNDED in the same grounding sources,
// so they remain traceable and citation-backed.
// ═══════════════════════════════════════════════════════════

import { groundMessage, type GroundingSource, type GroundingResult } from './grounding.ts'
import { hybridRouteChat } from './hybrid-gateway.ts'

export type StudioArtifactType =
  | 'study_guide'
  | 'briefing_doc'
  | 'faq'
  | 'mind_map'
  | 'audio_overview'

export interface StudioArtifact {
  type: StudioArtifactType
  title: string
  content: string              // markdown-formatted
  sources: GroundingSource[]   // citations backing this artifact
  metadata: {
    generatedAt: string
    groundedInSources: number
    model?: string
    provider?: string
    latencyMs: number
  }
  // Type-specific extras
  mindMapNodes?: MindMapNode[]
  faqItems?: FaqItem[]
  studyGuideSections?: StudyGuideSection[]
  audioScript?: AudioScriptSegment[]
}

export interface MindMapNode {
  id: string
  label: string
  children?: MindMapNode[]
  citation?: number  // [n] reference
  color?: string
}

export interface FaqItem {
  question: string
  answer: string
  citations: number[]
}

export interface StudyGuideSection {
  heading: string
  keyPoints: string[]
  citations: number[]
  quizQuestion?: string
}

export interface AudioScriptSegment {
  speaker: 'host1' | 'host2'
  text: string
  emotion?: 'neutral' | 'enthusiastic' | 'serious' | 'curious'
  citations?: number[]
}

// ═══════════════════════════════════════════════════════════
// PROMPT BUILDERS — each artifact type has its own
// ═══════════════════════════════════════════════════════════

function buildBaseSystemPrompt(artifactType: string): string {
  return `أنت "EPI Studio" — محرك توليد المحتوى المستند إلى المصادر (مستوحى من NotebookLM).

== مهمتك ==
توليد ${artifactType} بناءً على المصادر المقدمة فقط.

== قواعد صارمة ==
1. استخدم **فقط** المعلومات من المصادر أدناه
2. ضع [n] بعد كل ادعاء يشير إلى رقم المصدر
3. ⚠️ مهم: لا تقل "المصادر غير كافية" إلا إذا كانت فارغة تماماً. استخدم المصادر المتاحة وأكمل الأقسام الناقصة بمعرفتك العامة مع وضع علامة [عام] بدلاً من [n]
4. لا تخترع أرقاماً أو إحصاءات أو أسماء — استخدم فقط ما هو في المصادر
5. إذا كان قسم ما غير مذكور في المصادر، اكتبه بمعرفتك العامة وضع [عام] بدلاً من رقم المصدر
6. اللغة: العربية الفصحى المبسطة
7. التنسيق: Markdown مع عناوين وقوائم
8. كن مبدعاً ومنظماً — الهدف هو محتوى مفيد للمستخدم

== المصادر ==`
}

function buildStudyGuidePrompt(sources: GroundingSource[], topic?: string): any[] {
  const sys = buildBaseSystemPrompt('دليل دراسي (Study Guide)') + '\n' +
    sources.map(s => `[${s.id}] ${s.summary}\n${s.quote}`).join('\n\n')

  const user = `${topic ? `الموضوع: ${topic}\n\n` : ''}أنشئ دليلاً دراسياً منظماً يحتوي على:

## الأقسام المطلوبة:
1. **نظرة عامة** (ملخص في 3-4 جمل)
2. **المفاهيم الأساسية** (5-7 نقاط مع شرح موجز)
3. **الأرقام الرئيسية** (إحصاءات مهمة مع [n])
4. **التحليل والمقارنات** (إن وجدت في المصادر)
5. **النتائج والتوصيات** (3-5 توصيات عملية)
6. **أسئلة للمراجعة** (3-5 أسئلة مع إجاباتها موجزة)

لكل قسم، استخدم [n] للإشارة للمصدر. كن دقيقاً ومختصراً.`

  return [
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ]
}

function buildBriefingDocPrompt(sources: GroundingSource[], topic?: string): any[] {
  const sys = buildBaseSystemPrompt('وثيقة موجزة (Briefing Doc)') + '\n' +
    sources.map(s => `[${s.id}] ${s.summary}\n${s.quote}`).join('\n\n')

  const user = `${topic ? `الموضوع: ${topic}\n\n` : ''}أنشئ وثيقة موجزة تنفيذية بتنسيق:

# ملخص تنفيذي
(فقرة واحدة 3-4 جمل تلخص الوضع)

## الأرقام الرئيسية
- نقطة 1 [n]
- نقطة 2 [n]
- نقطة 3 [n]

## الوضع الحالي
(تحليل موجز)

## المخاطر والتحديات
- خطر 1 [n]
- خطر 2 [n]

## التوصيات
1. توصية 1 (مع [n])
2. توصية 2 (مع [n])
3. توصية 3 (مع [n])

## الخطوات التالية المقترحة
- خطوة فورية
- خطوة قصيرة المدى
- خطوة متوسطة المدى

كن موجزاً ومباشراً. كل ادعاء يجب أن يكون له [n].`

  return [
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ]
}

function buildFaqPrompt(sources: GroundingSource[], topic?: string): any[] {
  const sys = buildBaseSystemPrompt('أسئلة شائعة (FAQ)') + '\n' +
    sources.map(s => `[${s.id}] ${s.summary}\n${s.quote}`).join('\n\n')

  const user = `${topic ? `الموضوع: ${topic}\n\n` : ''}أنشئ قائمة أسئلة شائعة تحتوي على 8-12 سؤال وجواب.

تنسيق كل سؤال:
### سؤال: [السؤال هنا]؟
**الجواب:** [الجواب المفصل مع [n]]

توزيع الأسئلة:
- 4 أسئلة أساسية (ماذا/كم/أين)
- 3 أسئلة تحليلية (لماذا/كيف)
- 3 أسئلة تطبيقية (ماذا لو/كيف نتعامل مع)
- 2 أسئلة استباقية (ماذا عن المستقبل/ما المخاطر)

كل جواب يجب أن يحتوي على [n] واحد على الأقل.`

  return [
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ]
}

function buildMindMapPrompt(sources: GroundingSource[], topic?: string): any[] {
  const sys = buildBaseSystemPrompt('خريطة ذهنية (Mind Map)') + '\n' +
    sources.map(s => `[${s.id}] ${s.summary}\n${s.quote}`).join('\n\n')

  const user = `${topic ? `الموضوع المركزي: ${topic}\n\n` : ''}أنشئ خريطة ذهنية بتنسيق JSON صارم:

\`\`\`json
{
  "root": {
    "label": "الموضوع المركزي",
    "children": [
      {
        "label": "الفرع 1",
        "citation": 1,
        "children": [
          { "label": "تفصيل 1", "citation": 1 },
          { "label": "تفصيل 2", "citation": 2 }
        ]
      },
      {
        "label": "الفرع 2",
        "citation": 2,
        "children": [...]
      }
    ]
  }
}
\`\`\`

قواعد:
- 4-6 فروع رئيسية من المركز
- كل فرع له 2-4 تفاصيل
- كل node له citation [n] إن أمكن
- الـ labels قصيرة (3-6 كلمات)
- أعد JSON صالح فقط بدون شرح`

  return [
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ]
}

function buildAudioOverviewPrompt(sources: GroundingSource[], topic?: string): any[] {
  const sys = `أنت "EPI Audio Studio" — مولّد بودكاست تعليمي مستوحى من NotebookLM Audio Overview.

== مهمتك ==
تحويل المصادر إلى سكريبت بودكاست بيراهيمين (مذيعين) يتحدثان عن الموضوع.

== القواعد ==
1. مذيعان: "أحمد" (خبير) و"فاطمة" (مهتمة تطرح أسئلة)
2. نبرة ودودة وعفوية لكن دقيقة
3. كل ادعاء له [n] يشير لمصدر
4. لا تختلق — المصادر فقط
5. اللغة: عربية يمنية مبسطة (لهجة قريبة لكن مفهومة)
6. المدة: 5-7 دقائق حوار

== البنية ==
1. افتتاحية جذابة (30 ثانية)
2. مقدمة الموضوع (دقيقة)
3. الأرقام الرئيسية (دقيقتين)
4. تحليل ومناقشة (دقيقتين)
5. توصيات وخاتمة (دقيقة)

== المصادر ==
` + sources.map(s => `[${s.id}] ${s.summary}\n${s.quote}`).join('\n\n')

  const user = `${topic ? `الموضوع: ${topic}\n\n` : ''}اكتب السكريبت بتنسيق JSON:

\`\`\`json
{
  "segments": [
    { "speaker": "host2", "text": "...", "emotion": "enthusiastic", "citations": [1] },
    { "speaker": "host1", "text": "...", "emotion": "neutral", "citations": [1, 2] }
  ]
}
\`\`\`

كل segment جملة واحدة أو جملتين. أعد JSON صالح فقط.`

  return [
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ]
}

// ═══════════════════════════════════════════════════════════
// PARSERS — extract structured data from LLM response
// ═══════════════════════════════════════════════════════════

function parseMindMap(content: string): MindMapNode[] | undefined {
  try {
    // Find JSON in content
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/)
    if (!jsonMatch) {
      // ⚠️ Fallback: parse markdown headings as mind map structure
      return parseMarkdownAsMindMap(content)
    }
    const json = JSON.parse(jsonMatch[1])
    if (json.root) {
      return [transformMindMapNode(json.root, 'root')]
    }
    if (Array.isArray(json)) return json.map((n, i) => transformMindMapNode(n, `node-${i}`))
    if (json.nodes && Array.isArray(json.nodes)) return json.nodes.map((n, i) => transformMindMapNode(n, `node-${i}`))
    // ⚠️ Fallback
    return parseMarkdownAsMindMap(content)
  } catch {
    return parseMarkdownAsMindMap(content)
  }
}

/// ⚠️ Fallback: parse markdown headings (#, ##, ###) as mind map structure
function parseMarkdownAsMindMap(content: string): MindMapNode[] | undefined {
  const lines = content.split('\n').filter(l => l.trim())
  if (lines.length === 0) return undefined

  const root: MindMapNode = { id: 'root', label: 'الخريطة الذهنية', children: [] }
  const level1: MindMapNode[] = []
  let currentL1: MindMapNode | null = null

  for (const line of lines) {
    const trimmed = line.replace(/^#+\s*/, '').replace(/^[-•]\s*/, '').trim()
    if (!trimmed) continue

    if (line.startsWith('# ') || line.startsWith('## ')) {
      // Level 1 branch
      currentL1 = { id: `l1-${level1.length}`, label: trimmed, children: [] }
      level1.push(currentL1)
    } else if (line.startsWith('### ') || line.startsWith('- ') || line.startsWith('• ')) {
      // Level 2 detail
      if (currentL1) {
        currentL1.children = currentL1.children || []
        currentL1.children.push({ id: `${currentL1.id}-${currentL1.children.length}`, label: trimmed })
      } else {
        level1.push({ id: `l1-${level1.length}`, label: trimmed })
      }
    } else {
      // Plain text — add as level 1 if no current
      if (!currentL1 && level1.length < 8) {
        currentL1 = { id: `l1-${level1.length}`, label: trimmed.slice(0, 50), children: [] }
        level1.push(currentL1)
      }
    }
  }

  if (level1.length === 0) return undefined
  root.children = level1
  return [root]
}

function transformMindMapNode(node: any, id: string): MindMapNode {
  return {
    id,
    label: node.label || node.title || 'بدون عنوان',
    citation: node.citation,
    color: node.color,
    children: node.children?.map((c: any, i: number) => transformMindMapNode(c, `${id}-${i}`)),
  }
}

function parseFaq(content: string): FaqItem[] | undefined {
  const items: FaqItem[] = []
  // Pattern: ### سؤال: ... ?\n**الجواب:** ...
  const regex = /###\s*سؤال:?\s*(.+?)\n+\s*\**الجواب:?\**\s*(.+?)(?=###\s*سؤال|$)/gs
  let match
  while ((match = regex.exec(content)) !== null) {
    const question = match[1].trim()
    const answer = match[2].trim()
    // Extract citations from answer
    const citations = [...answer.matchAll(/\[(\d+)\]/g)].map(m => parseInt(m[1]))
    items.push({ question, answer, citations: [...new Set(citations)] })
  }
  return items.length > 0 ? items : undefined
}

function parseStudyGuide(content: string): StudyGuideSection[] | undefined {
  const sections: StudyGuideSection[] = []
  // Split by ## headings
  const parts = content.split(/^##\s+/m).filter(p => p.trim())
  for (const part of parts) {
    const lines = part.split('\n')
    const heading = lines[0].trim()
    const body = lines.slice(1).join('\n')
    // Extract bullet points (lines starting with - or •)
    const keyPoints = [...body.matchAll(/^[\s]*[-•]\s*(.+)$/gm)].map(m => m[1].trim())
    const citations = [...body.matchAll(/\[(\d+)\]/g)].map(m => parseInt(m[1]))
    sections.push({
      heading,
      keyPoints: keyPoints.length > 0 ? keyPoints : [body.trim()],
      citations: [...new Set(citations)],
    })
  }
  return sections.length > 0 ? sections : undefined
}

function parseAudioScript(content: string): AudioScriptSegment[] | undefined {
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/)
    if (!jsonMatch) {
      // ⚠️ Fallback: parse as dialogue (مذيع1: ... / مذيع2: ...)
      return parseDialogueAsAudioScript(content)
    }
    const json = JSON.parse(jsonMatch[1])
    if (json.segments && Array.isArray(json.segments)) {
      return json.segments.map((s: any) => ({
        speaker: s.speaker === 'host1' ? 'host1' : 'host2',
        text: s.text || '',
        emotion: s.emotion || 'neutral',
        citations: Array.isArray(s.citations) ? s.citations : [],
      }))
    }
    // ⚠️ Fallback
    return parseDialogueAsAudioScript(content)
  } catch {
    return parseDialogueAsAudioScript(content)
  }
}

/// ⚠️ Fallback: parse text as dialogue (أحمد: ... / فاطمة: ... / Host1: ...)
function parseDialogueAsAudioScript(content: string): AudioScriptSegment[] | undefined {
  const segments: AudioScriptSegment[] = []
  const lines = content.split('\n').filter(l => l.trim())
  
  let currentSpeaker: 'host1' | 'host2' = 'host1'
  let currentText = ''

  for (const line of lines) {
    const trimmed = line.trim()
    
    // Detect speaker patterns
    const ahmedMatch = trimmed.match(/^(أحمد|مذيع1|Host1|host1)[:：]\s*(.*)/)
    const fatimaMatch = trimmed.match(/^(فاطمة|مذيع2|Host2|host2)[:：]\s*(.*)/)
    
    if (ahmedMatch) {
      // Save previous segment
      if (currentText.trim()) {
        segments.push({ speaker: currentSpeaker, text: currentText.trim(), emotion: 'neutral' })
      }
      currentSpeaker = 'host1'
      currentText = ahmedMatch[2]
    } else if (fatimaMatch) {
      if (currentText.trim()) {
        segments.push({ speaker: currentSpeaker, text: currentText.trim(), emotion: 'neutral' })
      }
      currentSpeaker = 'host2'
      currentText = fatimaMatch[2]
    } else {
      // Continuation of current speaker
      currentText += ' ' + trimmed
    }
  }
  
  // Don't forget the last segment
  if (currentText.trim()) {
    segments.push({ speaker: currentSpeaker, text: currentText.trim(), emotion: 'neutral' })
  }

  return segments.length > 0 ? segments : undefined
}

// ═══════════════════════════════════════════════════════════
// MAIN: Generate Studio Artifact
// ═══════════════════════════════════════════════════════════

export async function generateStudioArtifact(
  supa: any,
  type: StudioArtifactType,
  options: {
    topic?: string
    message?: string          // user question to ground on
    campaignRound?: number | null
  },
  env: Record<string, string | undefined>,
): Promise<StudioArtifact> {
  const startTime = Date.now()

  // ─── Step 1: Ground on the topic/question ───
  const grounding = await groundMessage(supa, options.message || options.topic || '', options.campaignRound || null)

  // Build grounding sources — even if grounding returns 0, we still proceed
  // with a default "no specific data" message so the LLM can generate generic content
  let sources = grounding.sources
  let groundingContext = grounding.contextText || ''

  // If no data found, add a fallback context so the LLM has something to work with
  if (sources.length === 0) {
    console.log('[STUDIO] No grounding data found, using knowledge base fallback')
    // Try knowledge base directly with the topic
    try {
      const { advancedKnowledgeSearch, scoredChunksToSources } = await import('./advanced-search.ts')
      const knowledgeModule: any = await import('../knowledge_chunks.ts')
      const docs = knowledgeModule.default || []
      let extendedDocs: any[] = []
      let operationalDocs: any[] = []
      try {
        const ext: any = await import('./extended-knowledge.ts')
        extendedDocs = ext.EXTENDED_KNOWLEDGE || []
      } catch {}
      try {
        const ops: any = await import('./operational-knowledge.ts')
        operationalDocs = ops.OPERATIONAL_KNOWLEDGE || []
      } catch {}
      const allDocs = [...docs, ...extendedDocs, ...operationalDocs]
      const scored = advancedKnowledgeSearch(options.message || options.topic || '', allDocs, { topK: 5, minScore: 1 })
      if (scored.length > 0) {
        sources = scoredChunksToSources(scored)
        groundingContext = '\n\n== مصادر المعرفة (استند إليها) ==\n' +
          sources.map(s => `[${s.id}] ${s.summary}\n${s.quote}`).join('\n\n')
        console.log(`[STUDIO] Knowledge fallback found ${sources.length} sources`)
      }
    } catch (e) {
      console.warn('[STUDIO] Knowledge fallback failed:', e)
    }
  }

  // If STILL no sources, return early with helpful message
  if (sources.length === 0) {
    return {
      type,
      title: getArtifactTitle(type, options.topic),
      content: `⚠️ لا توجد مصادر كافية لتوليد هذا المحتوى حول "${options.topic}".

💡 جرّب مواضيع أكثر تحديداً مثل:
• "تحليل أداء حملة شلل الأطفال في تعز"
• "كيف أصون ثلاجة اللقاحات"
• "ما هي إجراءات الترصد الوبائي"
• "دليل تطعيمات الطفل عمر 6 شهور"
• "ما هي مؤشرات جودة برنامج التحصين"
• "كيف نتعامل مع الرفض المجتمعي للتطعيم"`,
      sources: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        groundedInSources: 0,
        latencyMs: Date.now() - startTime,
      },
    }
  }

  // ─── Step 2: Build prompt for artifact type ───
  let messages: any[]
  switch (type) {
    case 'study_guide':    messages = buildStudyGuidePrompt(sources, options.topic); break
    case 'briefing_doc':   messages = buildBriefingDocPrompt(sources, options.topic); break
    case 'faq':            messages = buildFaqPrompt(sources, options.topic); break
    case 'mind_map':       messages = buildMindMapPrompt(sources, options.topic); break
    case 'audio_overview': messages = buildAudioOverviewPrompt(sources, options.topic); break
  }

  // ─── Step 3: Call LLM via Hybrid Gateway ───
  // Use higher tokens + longer timeout for Studio (longer generation)
  // ⚠️ Studio needs longer timeout because:
  // - Pollinations multi-model fallback can take up to 4×30s = 120s
  // - Large generation (4000 tokens) needs time
  // - mind_map and audio_overview need structured JSON output
  const maxTokens = type === 'audio_overview' ? 2500 : 4000
  const result = await hybridRouteChat(messages, env, {
    maxTokens,
    temperature: 0.6,
    raceTimeoutMs: 45_000,   // ⚠️ Increased from 30s to 45s for Studio
    fallbackTimeoutMs: 90_000,  // ⚠️ Increased from 60s to 90s
  })

  const latencyMs = Date.now() - startTime
  console.log(`[STUDIO] LLM result: provider=${result.provider}, contentLength=${result.content?.length || 0}, latency=${latencyMs}ms`)

  // ⚠️ If first attempt failed, retry with Pollinations multi-model directly
  if (!result.content || result.content.trim().length < 50) {
    console.log('[STUDIO] First attempt failed, trying Pollinations multi-model directly...')
    try {
      const { pollinationsMultiModel } = await import('./pollinations-fallback.ts')
      const retry = await pollinationsMultiModel(messages, {
        maxTokens,
        temperature: 0.6,
        timeoutMs: 25_000,
      })
      if (retry.content && retry.content.trim().length > 50) {
        console.log(`[STUDIO] ✓ Pollinations multi-model succeeded: ${retry.modelUsed} (${retry.totalLatencyMs}ms)`)
        // Use this content instead
        return buildArtifact(type, options.topic, retry.content, sources, 'pollinations', Date.now() - startTime)
      }
    } catch (e) {
      console.warn('[STUDIO] Pollinations multi-model retry failed:', e)
    }
  }

  // If LLM failed entirely, return a graceful error with sources visible
  if (!result.content || result.content.trim().length < 50) {
    return {
      type,
      title: getArtifactTitle(type, options.topic),
      content: `⚠️ تعذّر توليد المحتوى من النموذج الذكي (${result.provider || 'unknown'}).

        found ${sources.length} مصدر بيانات. حاول مرة أخرى بعد قليل.

💡 إذا تكرر الفشل:
• جرّب موضوعاً مختلفاً
• تحقق من اتصال الإنترنت
• قد يكون هناك ضغط على الخدمة`,
      sources,
      metadata: {
        generatedAt: new Date().toISOString(),
        groundedInSources: sources.length,
        provider: result.provider,
        latencyMs,
      },
    }
  }

  const content = result.content

  // ─── Step 4: Parse type-specific structure ───
  const artifact: StudioArtifact = {
    type,
    title: getArtifactTitle(type, options.topic),
    content,
    sources,
    metadata: {
      generatedAt: new Date().toISOString(),
      groundedInSources: sources.length,
      model: 'hybrid',
      provider: result.provider,
      latencyMs,
    },
  }

  if (type === 'mind_map') {
    artifact.mindMapNodes = parseMindMap(content)
  } else if (type === 'faq') {
    artifact.faqItems = parseFaq(content)
  } else if (type === 'study_guide') {
    artifact.studyGuideSections = parseStudyGuide(content)
  } else if (type === 'audio_overview') {
    artifact.audioScript = parseAudioScript(content)
  }

  return artifact
}

// ⚠️ Helper: Build final artifact object with parsing
function buildArtifact(
  type: StudioArtifactType,
  topic: string | undefined,
  content: string,
  sources: GroundingSource[],
  provider: string,
  latencyMs: number,
): StudioArtifact {
  const artifact: StudioArtifact = {
    type,
    title: getArtifactTitle(type, topic),
    content,
    sources,
    metadata: {
      generatedAt: new Date().toISOString(),
      groundedInSources: sources.length,
      model: 'hybrid',
      provider,
      latencyMs,
    },
  }

  if (type === 'mind_map') {
    artifact.mindMapNodes = parseMindMap(content)
  } else if (type === 'faq') {
    artifact.faqItems = parseFaq(content)
  } else if (type === 'study_guide') {
    artifact.studyGuideSections = parseStudyGuide(content)
  } else if (type === 'audio_overview') {
    artifact.audioScript = parseAudioScript(content)
  }

  return artifact
}

function getArtifactTitle(type: StudioArtifactType, topic?: string): string {
  const topicSuffix = topic ? ` — ${topic}` : ''
  switch (type) {
    case 'study_guide':    return `📚 دليل دراسي${topicSuffix}`
    case 'briefing_doc':   return `📋 وثيقة موجزة${topicSuffix}`
    case 'faq':            return `❓ أسئلة شائعة${topicSuffix}`
    case 'mind_map':       return `🧠 خريطة ذهنية${topicSuffix}`
    case 'audio_overview': return `🎧 بودكاست صوتي${topicSuffix}`
  }
}

// ═══════════════════════════════════════════════════════════
// HELPERS for UI
// ═══════════════════════════════════════════════════════════

export function getArtifactIcon(type: StudioArtifactType): string {
  switch (type) {
    case 'study_guide':    return '📚'
    case 'briefing_doc':   return '📋'
    case 'faq':            return '❓'
    case 'mind_map':       return '🧠'
    case 'audio_overview': return '🎧'
  }
}

export function getArtifactDescription(type: StudioArtifactType): string {
  switch (type) {
    case 'study_guide':    return 'دليل منظم بالمفاهيم والأرقام والأسئلة'
    case 'briefing_doc':   return 'ملخص تنفيذي للمديرين'
    case 'faq':            return 'أسئلة شائعة مع إجابات موثقة'
    case 'mind_map':       return 'خريطة ذهنية بفروع وتفاصيل'
    case 'audio_overview': return 'بودكاست تعليمي بصوتين'
  }
}

export const ALL_ARTIFACT_TYPES: StudioArtifactType[] = [
  'briefing_doc',
  'study_guide',
  'faq',
  'mind_map',
  'audio_overview',
]
