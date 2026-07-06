// ═══════════════════════════════════════════════════════════
// EPI Copilot — Advanced Knowledge Search (v2)
// ═══════════════════════════════════════════════════════════
//
// Improvements over the basic search:
// 1. Arabic normalization (أ→ا, إ→ا, آ→ا, ة→ه, ى→ي)
// 2. Synonym expansion (تطعيم↔لقاح↔تحصين, حراة↔سخونة)
// 3. Fuzzy matching (Levenshtein distance for typos)
// 4. Section-aware scoring
// 5. Medical term boost (BCG, OPV, Penta, etc.)
// 6. Concept grouping (vaccine name + disease + schedule)
// 7. Multi-word phrase matching
// 8. Stop word removal
// ═══════════════════════════════════════════════════════════

// ═══ Arabic Normalization ═══
const ARABIC_NORMALIZE_MAP: Record<string, string> = {
  'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا',
  'ة': 'ه',
  'ى': 'ي',
  'ؤ': 'و',
  'ئ': 'ي',
  'ـ': '',  // tatweel
  'ُ': '', 'َ': '', 'ِ': '', 'ً': '', 'ٌ': '', 'ٍ': '', 'ْ': '', 'ّ': '',  // diacritics
}

export function normalizeArabic(text: string): string {
  let result = text.toLowerCase()
  for (const [from, to] of Object.entries(ARABIC_NORMALIZE_MAP)) {
    result = result.split(from).join(to)
  }
  return result.trim()
}

// ═══ Stop Words (common Arabic + EPI-specific) ═══
const STOP_WORDS = new Set([
  'في', 'من', 'الى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
  'الذي', 'التي', 'الذين', 'ما', 'ماذا', 'كم', 'كيف', 'متى', 'اين',
  'هل', 'لا', 'نعم', 'او', 'و', 'ف', 'ثم', 'لكن', 'ان', 'انا', 'نحن',
  'هو', 'هي', 'هم', 'كنت', 'كان', 'يكون', 'تكون', 'عند', 'لدى', 'بعد',
  'قبل', 'خلال', 'كل', 'بعض', 'اي', 'غير', 'مثل', 'حول', 'نحو', 'دون',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
])

// ═══ Synonym Map (vaccination domain) ═══
const SYNONYMS: Record<string, string[]> = {
  'تطعيم':     ['لقاح', 'تحصين', 'تمنيع', 'vaccine', 'vaccination'],
  'لقاح':      ['تطعيم', 'تحصين', 'تمنيع', 'vaccine'],
  'تحصين':     ['تطعيم', 'لقاح', 'تمنيع'],
  'طفل':       ['رضع', 'رضيع', 'حديث', 'وليد', 'baby', 'infant', 'child'],
  'اطفال':     ['اطفال', 'صغار', 'children'],
  'حرارة':     ['سخونه', 'سخونية', 'حمى', 'fever'],
  'سخونة':     ['حرارة', 'حمى', 'fever'],
  'حمى':       ['حرارة', 'سخونة', 'fever'],
  'تورم':      ['انتفاخ', 'ورم', 'swelling'],
  'الم':       ['وجع', 'ألم', 'pain'],
  'كحة':       ['سعال', 'كحه', 'cough'],
  'اسهال':     ['إسهال', 'diarrhea'],
  'قيء':       ['تقيؤ', 'مغص', 'vomit'],
  'حصبة':      ['حصبه', 'measles', 'mr'],
  'شلل':       ['polio', 'opv', 'ipv'],
  'سل':        ['tb', 'bcg', 'tuberculosis'],
  'كبدي':      ['كبد', 'التهاب كبدي', 'hepb', 'hepatitis'],
  'رئة':       ['رئوي', 'مكورات', 'pcv', 'pneumonia'],
  'كزاز':      ['تيتانوس', 'tetanus', 'td'],
  'دفتريا':    ['diphtheria', 'dpt'],
  'سعال':      ['ديكي', 'pertussis', 'whooping'],
  'جدول':      ['جدوله', 'موعد', 'مواعيد', 'schedule'],
  'جرعة':      ['جرعه', 'dose', 'doses'],
  'جرعات':     ['جرعات', 'dose', 'doses'],
  'تغطية':     ['نسبة', 'coverage', 'rate'],
  'تسرّب':     ['تسرب', 'انسحاب', 'dropout', 'drop'],
  'نقص':       ['عوز', 'حاجة', 'احتياج', 'shortage'],
  'نواقص':     ['نقص', 'shortages'],
  'محافظة':    ['محافظات', 'governorate'],
  'مديرية':    ['مديريات', 'district'],
  'جولة':      ['دورة', 'حمله', 'round', 'campaign'],
  'حملة':      ['حملات', 'campaign', 'sia'],
  'برنامج':    ['برامج', 'program', 'epi'],
  'موسع':      ['موسّع', 'expanded'],
  'حدث':       ['ضار', 'عارض', 'aefi', 'adverse'],
  'ضار':       ['حدث', 'عارض', 'aefi'],
  'عارض':      ['حدث', 'ضار', 'aefi', 'side effect'],
  'رد':        ['فعل', 'reaction'],
  'فعل':       ['رد', 'reaction'],
  'حفظ':       ['تخزين', 'تخزين', 'storage'],
  'تخزين':     ['حفظ', 'storage'],
  'تبريد':     ['ثلاجة', 'براد', 'cold chain'],
  'صفر':       ['zero', '0'],
  'ت من':      ['صفرية', 'zero dose'],
  'صفرية':     ['zero dose', 'جرعة صفر'],
  'تعزيزية':   ['تنشيطية', 'booster'],
  'تنشيطية':   ['تعزيزية', 'booster'],
  'مدرسة':     ['مدارس', 'school'],
  'مدارس':     ['مدرسة', 'school'],
  'مبتسر':     ['خديج', 'premature'],
  'خديج':      ['مبتسر', 'premature'],
  'حامل':      ['حبلى', 'pregnant'],
  'حبلى':      ['حامل', 'pregnant'],
}

// ═══ Build Synonym Index ═══
const SYNONYM_INDEX: Map<string, Set<string>> = new Map()
for (const [key, syns] of Object.entries(SYNONYMS)) {
  const normalizedKey = normalizeArabic(key)
  const allTerms = new Set<string>([normalizedKey])
  for (const s of syns) allTerms.add(normalizeArabic(s))
  // Also add reverse mappings
  for (const s of syns) {
    const ns = normalizeArabic(s)
    if (!SYNONYM_INDEX.has(ns)) SYNONYM_INDEX.set(ns, new Set())
    SYNONYM_INDEX.get(ns)!.add(normalizedKey)
    for (const s2 of syns) {
      if (s2 !== s) SYNONYM_INDEX.get(ns)!.add(normalizeArabic(s2))
    }
  }
  if (!SYNONYM_INDEX.has(normalizedKey)) SYNONYM_INDEX.set(normalizedKey, new Set())
  for (const s of syns) SYNONYM_INDEX.get(normalizedKey)!.add(normalizeArabic(s))
}

function expandWithSynonyms(word: string): Set<string> {
  const normalized = normalizeArabic(word)
  const result = new Set<string>([normalized])
  const syns = SYNONYM_INDEX.get(normalized)
  if (syns) {
    for (const s of syns) result.add(s)
  }
  return result
}

// ═══ Levenshtein Distance (for fuzzy matching) ═══
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,        // deletion
        matrix[i][j - 1] + 1,        // insertion
        matrix[i - 1][j - 1] + cost  // substitution
      )
    }
  }
  return matrix[b.length][a.length]
}

function isFuzzyMatch(word1: string, word2: string, maxDistance = 2): boolean {
  if (word1 === word2) return true
  if (Math.abs(word1.length - word2.length) > maxDistance) return false
  const dist = levenshtein(word1, word2)
  return dist <= maxDistance
}

// ═══ High-Value Medical Terms (boost scoring) ═══
const HIGH_VALUE_TERMS = new Set([
  // Vaccine names
  'bcg', 'opv', 'ipv', 'penta', 'pcv', 'rota', 'mr', 'hepb', 'td',
  'خماسي', 'رباعي', 'ثلاثي', 'كواد', 'ثنائي',
  // Diseases
  'حصبة', 'حصبه', 'شلل', 'سل', 'كزاز', 'دفتريا', 'سعال', 'ديكي', 'كبدي',
  'كبد', 'اسهال', 'إسهال', 'رئة', 'رئوي', 'مكورات', 'حمى', 'صفراء',
  // Schedule ages
  'ولادة', 'اسبوع', 'أسبوع', 'شهر', 'أشهر', 'سنة', 'سنتين', 'سنين',
  '9اشهر', '18شهر', '6اسابيع', '10اسابيع', '14اسبوع',
  // EPI concepts
  'تغطية', 'تسرب', 'تسرّب', 'صفرية', 'انسحاب', 'dropout',
  'aefi', 'vvpm', 'سلسلة', 'تبريد', 'حفظ',
  'حملة', 'حملات', 'جولة', 'دورة', 'sia',
  'مبتسر', 'خديج', 'حامل', 'حبلى', 'مدرسة', 'مدارس',
  // Operational
  'محافظة', 'محافظات', 'مديرية', 'مديريات', 'مشرف', 'اشراف',
  'نقص', 'نواقص', 'احتياج', 'عوز',
])

// ═══ Phrase Patterns (multi-word concepts) ═══
const PHRASE_PATTERNS: Array<{ pattern: RegExp; boost: number; concept: string }> = [
  { pattern: /جدول\s*التطعيم|جدول\s*التحصين|مواعيد\s*التطعيم/i, boost: 10, concept: 'schedule' },
  { pattern: /الجرعة\s*الصفرية|جرعة\s*صفر/i, boost: 10, concept: 'zero_dose' },
  { pattern: /حدث\s*ضار|أحداث\s*ضارة|aefi/i, boost: 10, concept: 'aefi' },
  { pattern: /سلسلة\s*التبريد|براد\s*اللقاح/i, boost: 8, concept: 'cold_chain' },
  { pattern: /حملة?\s*(شلل|polio)/i, boost: 9, concept: 'polio_campaign' },
  { pattern: /حملة?\s*(حصبة|mr|measles)/i, boost: 9, concept: 'measles_campaign' },
  { pattern: /(تسرّب|تسرب|انسحاب)\s*(penta|خماسي|الخماسي)/i, boost: 9, concept: 'dropout' },
  { pattern: /(نسبة\s*)?التغطية|coverage/i, boost: 8, concept: 'coverage' },
  { pattern: /الآثار?\s*(الجانبية|الضارة)|side\s*effect/i, boost: 9, concept: 'side_effects' },
  { pattern: /(السل|tb|bcg)/i, boost: 7, concept: 'tb' },
  { pattern: /(الحصبة|measles|mr1|mr2)/i, boost: 7, concept: 'measles' },
  { pattern: /(شلل\s*الأطفال|polio|opv|ipv)/i, boost: 7, concept: 'polio' },
  { pattern: /(الأشراف\s*الداعم|supervision)/i, boost: 8, concept: 'supervision' },
]

// ═══ Tokenize (with stop word removal + synonym expansion) ═══
interface Token {
  word: string           // normalized
  original: string
  isHighValue: boolean
  synonyms: Set<string>
}

function tokenize(text: string): Token[] {
  const words = normalizeArabic(text)
    .split(/[\s,،.؟!?؟!؛;:()«»"'-]+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w))

  return words.map(w => {
    const isHighValue = HIGH_VALUE_TERMS.has(w) || HIGH_VALUE_TERMS.has(w.toLowerCase())
    return {
      word: w,
      original: w,
      isHighValue,
      synonyms: expandWithSynonyms(w),
    }
  })
}

// ═══ Advanced Scoring Function ═══

interface ScoredChunk {
  chunk: {
    content: string
    section: string
    doc_id: string
    doc_title: string
    index: number
  }
  score: number
  matchedTerms: string[]
  matchedPhrases: string[]
}

export function advancedKnowledgeSearch(
  message: string,
  docs: any[],
  options: { topK?: number; minScore?: number } = {},
): ScoredChunk[] {
  const topK = options.topK || 6
  const minScore = options.minScore || 2

  // Tokenize the question
  const tokens = tokenize(message)
  if (tokens.length === 0) return []

  // Check phrase patterns
  const matchedPhrases: Array<{ concept: string; boost: number }> = []
  for (const { pattern, boost, concept } of PHRASE_PATTERNS) {
    if (pattern.test(message)) {
      matchedPhrases.push({ concept, boost })
    }
  }

  // Flatten all chunks
  const allChunks: any[] = []
  for (const doc of docs) {
    if (doc.chunks && Array.isArray(doc.chunks)) {
      for (const chunk of doc.chunks) {
        allChunks.push({
          content: chunk.content || '',
          section: chunk.section || '',
          doc_id: doc.doc_id || 'unknown',
          doc_title: doc.title || doc.doc_id || 'قاعدة معرفة EPI',
          index: chunk.index ?? 0,
        })
      }
    }
  }

  // Score each chunk
  const scored: ScoredChunk[] = allChunks.map(chunk => {
    const chunkText = normalizeArabic(chunk.content)
    const section = normalizeArabic(chunk.section)
    const chunkWords = new Set(chunkText.split(/\s+/).filter(w => w.length > 1))

    let score = 0
    const matchedTerms: string[] = []
    const matchedConcepts: string[] = []

    // ─── Word-level matching (with synonym expansion) ───
    for (const token of tokens) {
      // Direct match
      if (chunkWords.has(token.word)) {
        score += token.isHighValue ? 5 : 2
        matchedTerms.push(token.word)
        continue
      }
      // Synonym match
      let foundSynonym = false
      for (const syn of token.synonyms) {
        if (syn !== token.word && chunkWords.has(syn)) {
          score += token.isHighValue ? 4 : 1.5
          matchedTerms.push(syn)
          foundSynonym = true
          break
        }
      }
      if (foundSynonym) continue

      // Fuzzy match (typos) — only for high-value terms and words > 4 chars
      if (token.isHighValue || token.word.length > 4) {
        for (const chunkWord of chunkWords) {
          if (Math.abs(chunkWord.length - token.word.length) <= 2 && isFuzzyMatch(token.word, chunkWord, 1)) {
            score += 1
            matchedTerms.push(`${token.word}~${chunkWord}`)
            break
          }
        }
      }
    }

    // ─── Section keyword boost ───
    const sectionWords = section.split(/[_\s]+/).filter(w => w.length > 2)
    for (const sw of sectionWords) {
      for (const token of tokens) {
        if (sw === token.word) {
          score += 4
          matchedConcepts.push(`section:${sw}`)
        }
        // Check synonyms in section
        for (const syn of token.synonyms) {
          if (syn !== token.word && sw === syn) {
            score += 3
            matchedConcepts.push(`section-syn:${sw}`)
          }
        }
      }
    }

    // ─── Phrase pattern boost ───
    for (const { concept, boost } of matchedPhrases) {
      // Check if chunk content matches the same concept (rough heuristic)
      if (chunkText.includes(normalizeArabic(concept)) || section.includes(normalizeArabic(concept))) {
        score += boost
        matchedConcepts.push(`phrase:${concept}`)
      }
      // Also boost if chunk's section mentions relevant keywords
      const conceptKeywords = getConceptKeywords(concept)
      for (const kw of conceptKeywords) {
        if (chunkText.includes(normalizeArabic(kw))) {
          score += boost / 2
          matchedConcepts.push(`concept:${concept}:${kw}`)
          break
        }
      }
    }

    return {
      chunk,
      score,
      matchedTerms: [...new Set(matchedTerms)],
      matchedPhrases: matchedConcepts,
    }
  })

  // Filter + sort + take top-K
  return scored
    .filter(s => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

function getConceptKeywords(concept: string): string[] {
  switch (concept) {
    case 'schedule': return ['جدول', 'ولادة', '6 اسابيع', '10 اسابيع', '14 اسبوع', '9 اشهر', '18 شهر']
    case 'zero_dose': return ['صفرية', 'صفر', 'لم يتلق', 'بدون']
    case 'aefi': return ['ضار', 'حدث', 'اعراض', 'حرارة', 'تورم', 'aefi']
    case 'cold_chain': return ['تبريد', 'ثلاجة', 'حفظ', 'vvm', '2-8', 'مجمد']
    case 'polio_campaign': return ['شلل', 'polio', 'opv', 'الحملة']
    case 'measles_campaign': return ['حصبة', 'measles', 'mr', 'الحملة']
    case 'dropout': return ['تسرب', 'تسرّب', 'انسحاب', 'dropout', 'p1', 'p3']
    case 'coverage': return ['تغطية', 'نسبة', 'coverage']
    case 'side_effects': return ['اثار', 'آثار', 'جانبية', 'ضارة', 'حرارة', 'تورم']
    case 'tb': return ['سل', 'bcg', 'السل']
    case 'measles': return ['حصبة', 'mr', 'measles']
    case 'polio': return ['شلل', 'polio', 'opv', 'ipv']
    case 'supervision': return ['اشراف', 'داعم', 'مشرف', 'زيارة']
    default: return []
  }
}

// ═══ Search Result Adapter ─══
// Adapts the ScoredChunk[] to the GroundingSource[] format expected by grounding.ts

import type { GroundingSource } from './grounding.ts'

export function scoredChunksToSources(scored: ScoredChunk[]): GroundingSource[] {
  return scored.map((s, i) => ({
    id: i + 1,
    type: 'knowledge_chunk' as const,
    summary: `${s.chunk.doc_title} — ${s.chunk.section.replace(/_/g, ' ')}`,
    quote: s.chunk.content,
    metadata: {
      chunk_id: `${s.chunk.doc_id}-${s.chunk.index}`,
      source_doc: s.chunk.doc_title,
    },
  }))
}

// ═══ Diagnostic / Debug Info ═══
export function getSearchDiagnostics(message: string): {
  tokens: number
  highValueTokens: number
  matchedPhrases: string[]
  synonymExpansions: number
} {
  const tokens = tokenize(message)
  const highValueTokens = tokens.filter(t => t.isHighValue).length
  const matchedPhrases: string[] = []
  for (const { pattern, concept } of PHRASE_PATTERNS) {
    if (pattern.test(message)) matchedPhrases.push(concept)
  }
  let synonymExpansions = 0
  for (const t of tokens) synonymExpansions += Math.max(0, t.synonyms.size - 1)
  return {
    tokens: tokens.length,
    highValueTokens,
    matchedPhrases,
    synonymExpansions,
  }
}
