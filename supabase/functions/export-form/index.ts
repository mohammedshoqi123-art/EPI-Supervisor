import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js'
import { zipSync, strToU8 } from 'npm:fflate@0.8.2'

/**
 * EPI Supervisor — export-form Edge Function (self-contained)
 *
 * ═══ لماذا؟ ═══
 * تصدير الاستمارات الكبيرة كان يفشل في لوحة التحكم وفي تطبيق الموبايل:
 *  • بعض الإرساليات تحمل صوراً base64 داخل حقل data (≈ 272KB للصف الواحد!)
 *  • جلب كل الصفوف دفعة واحدة يتجاوز مهلة الشبكة/الـRPC وذاكرة الجهاز.
 *  • exceljs (v1-v3 من هذه الدالة) يستهلك ذاكرة تتجاوز حد الـEdge Worker
 *    مع الاستمارات الكبيرة (2,000+ صف × 70 عمود) ← WORKER_RESOURCE_LIMIT.
 *
 * ═══ الحل ═══
 *  • يبني الخادم ملف Excel داخلياً (قريب من قاعدة البيانات — بلا مهلات شبكة)
 *    ثم يرفعه إلى Storage ويعيد رابطاً موقّعاً لتحميله مباشرة.
 *  • كاتب XLSX خفيف مكتوب يدوياً (XML + fflate) — ذاكرة أقل بعشر مرات من
 *    exceljs مع نفس التنسيق: RTL، رأس ملوّن، تجميد الصفوف، ألوان الحالة.
 *  • نفس صلاحيات المستخدم: كل الاستعلامات بـ JWT المستخدم نفسه (RLS + RPC
 *    fetch_submissions يطبّق فلترة الدور تلقائياً — مدير/مركزي/محافظة/مديرية).
 *  • حقول photo/gps تُستبعد، وأي قيمة base64 تشبه الصورة تُنظّف، وعدد
 *    الصور يُحسب في عمود «عدد الصور».
 *
 * Request : POST { form_id, governorate_id?, campaign_round? }
 * Response: { url, file_name, row_count, column_count, format, expires_at }
 */

const MAX_ROWS = 20000
const PAGE_SIZE = 50
const URL_TTL = 3600
const BUCKET = 'form-exports'

// ── CORS (مطابق لمنطق _shared/cors.ts: fail-closed عبر ALLOWED_ORIGINS) ──
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',').map((s) => s.trim()).filter(Boolean)

function corsHeaders(origin: string | null): Record<string, string> {
  const base = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
  if (ALLOWED_ORIGINS.length === 0) {
    if (!origin) return { 'Access-Control-Allow-Origin': '*', ...base }
    return { 'Access-Control-Allow-Origin': 'null', Vary: 'Origin', ...base }
  }
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : 'null'
  return { 'Access-Control-Allow-Origin': allowed, Vary: 'Origin', ...base }
}

function jsonResponse(data: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

// ── Auth (مطابق لمنطق _shared/auth.ts: getUser يتحقق من التوقيع) ──
function createUserClient(authHeader: string): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )
}

function createAdminClient(): SupabaseClient | null {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceKey || serviceKey.length < 10) return null
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

interface AuthResult { userId: string; role?: string }

async function authenticateRequest(supabase: SupabaseClient): Promise<AuthResult | null> {
  try {
    const { data: { user }, error } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('auth timeout')), 8000)),
    ]) as any
    if (error || !user) return null
    return { userId: user.id, role: user.user_metadata?.role ?? user.app_metadata?.role }
  } catch {
    return null
  }
}

// حد بسيط للاستخدام: 8 تصديرات / 10 دقائق / مستخدم
const rateMap = new Map<string, number[]>()
function rateLimited(userId: string): boolean {
  const now = Date.now()
  const arr = (rateMap.get(userId) ?? []).filter((t) => now - t < 600_000)
  if (arr.length >= 8) return true
  arr.push(now)
  rateMap.set(userId, arr)
  return false
}

interface SchemaField {
  key: string
  label: string
  type: string
  showIf: Record<string, unknown> | null
}

// ── نفس منطق ExcelExportService في التطبيق (رؤية الأقسام/الحقول حسب الدور) ──
function visibleForRole(item: Record<string, unknown>, role: string | null): boolean {
  const hidden = (item['hidden_roles'] as string[] | undefined) ?? []
  const visible = (item['visible_roles'] as string[] | undefined) ?? []
  if (hidden.length > 0 && role && hidden.includes(role)) return false
  if (visible.length > 0 && (!role || !visible.includes(role))) return false
  return true
}

function extractFields(schema: Record<string, unknown>, role: string | null): SchemaField[] {
  const out: SchemaField[] = []
  const sections = (schema['sections'] as Record<string, unknown>[] | undefined) ?? []
  const flat = (schema['fields'] as Record<string, unknown>[] | undefined) ?? []
  const push = (f: Record<string, unknown>) => {
    const key = (f['key'] as string) ?? ''
    const type = (f['type'] as string) ?? 'text'
    if (!key || type === 'photo' || type === 'gps') return // لا صور/إحداثيات في الخلايا
    if (!visibleForRole(f, role)) return
    const showIfRaw = f['showIf'] ?? f['show_if']
    out.push({
      key,
      label: ((f['label_ar'] as string) ?? key),
      type,
      showIf: showIfRaw && typeof showIfRaw === 'object' ? showIfRaw as Record<string, unknown> : null,
    })
  }
  if (sections.length > 0) {
    const sorted = [...sections].sort((a, b) =>
      ((a['order'] as number) ?? 0) - ((b['order'] as number) ?? 0))
    for (const sec of sorted) {
      if (!visibleForRole(sec, role)) continue
      for (const f of (sec['fields'] as Record<string, unknown>[] | undefined) ?? []) push(f)
    }
  } else {
    for (const f of flat) push(f)
  }
  return out
}

/** مفاتيح الحقول من نوع photo في المخطط (لحساب عدد الصور) */
function photoFieldKeys(schema: Record<string, unknown>): string[] {
  const keys: string[] = []
  const sections = (schema['sections'] as Record<string, unknown>[] | undefined) ?? []
  const flat = (schema['fields'] as Record<string, unknown>[] | undefined) ?? []
  const scan = (f: Record<string, unknown>) => {
    if ((f['type'] as string) === 'photo' && f['key']) keys.push(String(f['key']))
  }
  for (const sec of sections) {
    for (const f of (sec['fields'] as Record<string, unknown>[] | undefined) ?? []) scan(f)
  }
  for (const f of flat) scan(f)
  return keys
}

// ── نفس شرط إظهار الحقل (isFieldConditionMet) ──
function conditionMet(showIf: Record<string, unknown> | null, rowData: Record<string, unknown>): boolean {
  if (!showIf) return true
  const condField = showIf['field'] as string | undefined
  if (!condField) return true
  const condValue = showIf['value']
  const current = rowData[condField]
  const eq = (a: unknown, b: unknown): boolean => {
    if (a === b) return true
    if (typeof a === 'boolean' && typeof b === 'string') return (a && b === 'yes') || (!a && b === 'no')
    if (typeof a === 'string' && typeof b === 'boolean') return (a === 'yes' && b) || (a === 'no' && !b)
    return false
  }
  if (Array.isArray(condValue)) return condValue.some((v) => eq(current, v))
  return eq(current, condValue)
}

// تنظيف القيم: إزالة base64 للصور واقتطاع النصوص الطويلة جداً
function cleanText(s: string): string {
  if (/^data:image\//i.test(s) || /^\/9j\//.test(s) || /^iVBORw0KGgo/.test(s)) return ''
  if (s.length > 8000) return s.slice(0, 8000) + '…'
  return s
}

function coerce(
  f: SchemaField,
  v: unknown,
  rowData: Record<string, unknown>,
  refs: { gov: Map<string, string>; dist: Map<string, string>; fac: Map<string, string> },
): string | number {
  if (v === null || v === undefined || v === '') return ''
  if (f.showIf && !conditionMet(f.showIf, rowData)) return '' // نفس سلوك التطبيق
  switch (f.type) {
    case 'yesno': {
      if (typeof v === 'boolean') return v ? 'نعم' : 'لا'
      const s = String(v).trim().toLowerCase()
      if (['yes', 'true', '1', 'نعم'].includes(s)) return 'نعم'
      if (['no', 'false', '0', 'لا'].includes(s)) return 'لا'
      return cleanText(String(v))
    }
    case 'number': {
      const n = Number(v)
      return Number.isNaN(n) ? cleanText(String(v)) : n
    }
    case 'multiselect':
      return cleanText(Array.isArray(v) ? v.join('، ') : String(v))
    case 'governorate':
      return refs.gov.get(String(v)) ?? cleanText(String(v))
    case 'district':
      return refs.dist.get(String(v)) ?? cleanText(String(v))
    case 'health_facility':
      return refs.fac.get(String(v)) ?? cleanText(String(v))
    case 'date':
      return cleanText(String(v).slice(0, 10))
    case 'datetime':
    case 'time': {
      const d = new Date(String(v))
      if (Number.isNaN(d.getTime())) return cleanText(String(v))
      const p = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
    }
    default: {
      if (typeof v === 'object') return cleanText(JSON.stringify(v))
      return cleanText(String(v))
    }
  }
}

const STATUS_AR: Record<string, string> = {
  submitted: 'مرسلة', draft: 'مسودة', approved: 'معتمدة', rejected: 'مرفوضة',
}

function fmtDate(iso: unknown): string {
  const d = new Date(String(iso ?? ''))
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function safeFileName(title: string): string {
  return (title || 'تصدير')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, '_')
    .slice(0, 60)
}

/** مفتاح ASCII آمن للتخزين (الخادم لا يقبل مفاتيح غير لاتينية) */
function safeObjectKey(formId: string): string {
  const ascii = (formId || 'form').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)
  return `export_${ascii}`
}

async function loadReferenceMaps(supabase: SupabaseClient) {
  const load = async (table: string) => {
    const { data } = await supabase.from(table).select('id, name_ar').limit(5000)
    return new Map<string, string>(((data ?? []) as Record<string, unknown>[]).map(
      (r) => [String(r['id']), String(r['name_ar'] ?? '')],
    ))
  }
  const [gov, dist, fac] = await Promise.all([
    load('governorates'), load('districts'), load('health_facilities'),
  ])
  return { gov, dist, fac }
}

async function ensureBucket(admin: SupabaseClient): Promise<void> {
  const { data: buckets, error: lbErr } = await admin.storage.listBuckets()
  if (lbErr) throw new Error(`listBuckets: ${lbErr.message}`)
  const exists = (buckets ?? []).some((b) => b.name === BUCKET)
  if (!exists) {
    const { error: cbErr } = await admin.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 104857600,
    })
    if (cbErr) throw new Error(`createBucket: ${cbErr.message}`)
  }
}

// ═══════════════════════════════════════════════════════════════════
//  كاتب XLSX خفيف (XML + fflate) — بديل exceljs بعد overrun الذاكرة.
//  يدعم: RTL، تجميد الصفوف، عرض الأعمدة، تنسيق الرأس، ألوان الحالة،
//  صفوف متناوبة، فلتر تلقائي. ذاكرة ≈ حجم النص + حجم الملف فقط.
// ═══════════════════════════════════════════════════════════════════

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // تحكم غير شرعي (حروف غير صالحة في XML)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
}

function colLetter(n: number): string {
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

// أنماط الخلايا (cellXfs): 0 افتراضي | 1 عنوان | 2 سطر تعريف | 3 رأس الجدول
// 4 نص يمين | 5 نص وسط | 6 نص يمين متناوب | 7 نص وسط متناوب
// 8-11 حالات: مرسلة/مسودة/مرفوضة/معتمدة
const XF_BODY_RIGHT = 4
const XF_BODY_CENTER = 5
const XF_ALT_RIGHT = 6
const XF_ALT_CENTER = 7
const XF_STATUS: Record<string, number> = {
  'مرسلة': 8, 'مسودة': 9, 'مرفوضة': 10, 'معتمدة': 11,
}

function stylesXml(): string {
  return XML_HEADER + `<styleSheet xmlns="${NS_MAIN}">` +
  `<fonts count="8">` +
  `<font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>` +
  `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>` +
  `<font><b/><sz val="14"/><color rgb="FF1F4E79"/><name val="Calibri"/></font>` +
  `<font><sz val="10"/><color rgb="FF666666"/><name val="Calibri"/></font>` +
  `<font><b/><sz val="11"/><color rgb="FF27AE60"/><name val="Calibri"/></font>` +
  `<font><b/><sz val="11"/><color rgb="FFB9770E"/><name val="Calibri"/></font>` +
  `<font><b/><sz val="11"/><color rgb="FFC0392B"/><name val="Calibri"/></font>` +
  `<font><b/><sz val="11"/><color rgb="FF21618C"/><name val="Calibri"/></font>` +
  `</fonts>` +
  `<fills count="8">` +
  `<fill><patternFill patternType="none"/></fill>` +
  `<fill><patternFill patternType="gray125"/></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FF1F4E79"/><bgColor indexed="64"/></patternFill></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FFF4F8FB"/><bgColor indexed="64"/></patternFill></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FFD5F5E3"/><bgColor indexed="64"/></patternFill></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FFFEF9E7"/><bgColor indexed="64"/></patternFill></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FFFADBD8"/><bgColor indexed="64"/></patternFill></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FFD6EAF8"/><bgColor indexed="64"/></patternFill></fill>` +
  `</fills>` +
  `<borders count="3">` +
  `<border><left/><right/><top/><bottom/><diagonal/></border>` +
  `<border><left style="thin"><color rgb="FFC9C9C9"/></left><right style="thin"><color rgb="FFC9C9C9"/></right><top style="thin"><color rgb="FFC9C9C9"/></top><bottom style="thin"><color rgb="FFC9C9C9"/></bottom><diagonal/></border>` +
  `<border><left style="thin"><color rgb="FFE3E3E3"/></left><right style="thin"><color rgb="FFE3E3E3"/></right><top style="thin"><color rgb="FFE3E3E3"/></top><bottom style="thin"><color rgb="FFE3E3E3"/></bottom><diagonal/></border>` +
  `</borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="12">` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment horizontal="right" vertical="center"/></xf>` +
  `<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment horizontal="right" vertical="center"/></xf>` +
  `<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="2" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1" readingOrder="2"/></xf>` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="2" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1" readingOrder="2"/></xf>` +
  `<xf numFmtId="0" fontId="0" fillId="3" borderId="2" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1" readingOrder="2"/></xf>` +
  `<xf numFmtId="0" fontId="0" fillId="3" borderId="2" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1" readingOrder="2"/></xf>` +
  `<xf numFmtId="0" fontId="4" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1" readingOrder="2"/></xf>` +
  `<xf numFmtId="0" fontId="5" fillId="5" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1" readingOrder="2"/></xf>` +
  `<xf numFmtId="0" fontId="6" fillId="6" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1" readingOrder="2"/></xf>` +
  `<xf numFmtId="0" fontId="7" fillId="7" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1" readingOrder="2"/></xf>` +
  `</cellXfs>` +
  `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
  `</styleSheet>`
}

function cellXml(
  col: number, row: number, xf: number, v: string | number | undefined,
): string {
  const ref = `${colLetter(col)}${row}`
  if (v === undefined || v === null || v === '') return `<c r="${ref}" s="${xf}"/>`
  if (typeof v === 'number' && Number.isFinite(v)) {
    return `<c r="${ref}" s="${xf}"><v>${v}</v></c>`
  }
  return `<c r="${ref}" s="${xf}" t="inlineStr"><is><t xml:space="preserve">${escXml(String(v))}</t></is></c>`
}

/**
 * يبني ملف xlsx كاملاً: RTL + تجميد عند الصف 4 + عرض أعمدة + فلتر.
 * rows: صفوف البيانات (بدون الرأس)؛ statusCol: فهرس عمود الحالة (0-based).
 */
function buildXlsx(
  sheetName: string, title: string, subtitle: string,
  headers: string[], rows: (string | number)[][],
  widths: number[], statusCol: number,
): Uint8Array {
  const nCols = headers.length
  const lastCol = colLetter(nCols)
  const lastRow = 4 + rows.length

  const parts: string[] = []
  parts.push(XML_HEADER + `<worksheet xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">`)
  parts.push(
    `<sheetViews><sheetView rightToLeft="1" tabSelected="1" workbookViewId="0">` +
    `<pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/>` +
    `<selection pane="bottomLeft" activeCell="A5" sqref="A5"/></sheetView></sheetViews>`,
  )
  parts.push('<cols>')
  for (let i = 0; i < nCols; i++) {
    parts.push(`<col min="${i + 1}" max="${i + 1}" width="${widths[i] ?? 18}" customWidth="1"/>`)
  }
  parts.push('</cols>')
  parts.push('<sheetData>')

  // صف العنوان (1) + التعريف (2) + فراغ (3)
  parts.push(`<row r="1" ht="24" customHeight="1">`)
  parts.push(cellXml(1, 1, 1, title))
  parts.push('</row>')
  parts.push(`<row r="2" ht="16" customHeight="1">`)
  parts.push(cellXml(1, 2, 2, subtitle))
  parts.push('</row>')
  parts.push('<row r="3"/>')

  // رأس الجدول (صف 4)
  parts.push(`<row r="4" ht="28" customHeight="1">`)
  for (let c = 0; c < nCols; c++) parts.push(cellXml(c + 1, 4, 3, headers[c]))
  parts.push('</row>')

  // البيانات (من صف 5) — صفوف متناوبة + تلوين عمود الحالة
  const metaCenter = new Set([0, 1, 2, 7, 8, 9])
  for (let ri = 0; ri < rows.length; ri++) {
    const rowNum = 5 + ri
    const r = rows[ri]
    const alt = ri % 2 === 1
    const statusXf = statusCol >= 0 ? XF_STATUS[String(r[statusCol] ?? '')] : undefined
    parts.push(`<row r="${rowNum}">`)
    for (let c = 0; c < nCols; c++) {
      let xf: number
      if (c === statusCol && statusXf !== undefined) xf = statusXf
      else xf = (metaCenter.has(c) ? (alt ? XF_ALT_CENTER : XF_BODY_CENTER)
                                  : (alt ? XF_ALT_RIGHT : XF_BODY_RIGHT))
      parts.push(cellXml(c + 1, rowNum, xf, r[c]))
    }
    parts.push('</row>')
  }

  parts.push('</sheetData>')
  if (rows.length > 0) {
    parts.push(`<autoFilter ref="A4:${lastCol}${lastRow}"/>`)
  }
  parts.push('</worksheet>')
  const sheetXml = parts.join('')

  const contentTypes = XML_HEADER +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `</Types>`

  const rootRels = XML_HEADER +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`

  const workbook = XML_HEADER +
    `<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">` +
    `<workbookPr/>` +
    `<bookViews><workbookView/></bookViews>` +
    `<sheets><sheet name="${escXml(sheetName.slice(0, 28))}" sheetId="1" r:id="rId1"/></sheets>` +
    `</workbook>`

  const workbookRels = XML_HEADER +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`

  const zipped = zipSync({
    '[Content_Types].xml': strToU8(contentTypes),
    '_rels/.rels': strToU8(rootRels),
    'xl/workbook.xml': strToU8(workbook),
    'xl/_rels/workbook.xml.rels': strToU8(workbookRels),
    'xl/styles.xml': strToU8(stylesXml()),
    'xl/worksheets/sheet1.xml': strToU8(sheetXml),
  }, { level: 6 })
  return zipped
}

function buildCsv(headers: string[], rows: (string | number)[][]): Uint8Array {
  const esc = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '\uFEFF' + [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
  return new TextEncoder().encode(csv)
}

serve(async (req: Request) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })

  try {
    if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, origin)

    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401, origin)
    const userClient = createUserClient(authHeader)
    const auth = await authenticateRequest(userClient)
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin)
    if (rateLimited(auth.userId)) {
      return jsonResponse({ error: 'محاولات تصدير كثيرة — انتظر قليلاً ثم أعد المحاولة' }, 429, origin)
    }

    let body: Record<string, unknown> = {}
    try { body = await req.json() } catch { /* empty body */ }
    const formId = body['form_id'] as string | undefined
    if (!formId) return jsonResponse({ error: 'form_id مطلوب' }, 400, origin)
    const governorateId = (body['governorate_id'] as string | undefined) || null
    const campaignRound = body['campaign_round'] != null && body['campaign_round'] !== ''
      ? Number(body['campaign_round']) : null

    // دور المستخدم من الملف الشخصي
    let role: string | null = auth.role ?? null
    try {
      const { data: prof } = await userClient
        .from('profiles').select('role').eq('id', auth.userId).single()
      if (prof?.role) role = String(prof.role)
    } catch { /* استخدم دور الـJWT كاحتياط */ }

    // الاستمارة (بصلاحيات المستخدم — نفس الرؤية في بقية التطبيق)
    const { data: form, error: formErr } = await userClient
      .from('forms').select('id, title_ar, schema').eq('id', formId).maybeSingle()
    if (formErr || !form) return jsonResponse({ error: 'الاستمارة غير موجودة أو غير مصرّح لك بها' }, 404, origin)

    const schema = (form.schema ?? {}) as Record<string, unknown>
    const fields = extractFields(schema, role)
    const title = String((form as Record<string, unknown>)['title_ar'] ?? 'تصدير')
    const photoKeys = photoFieldKeys(schema)

    const refs = await loadReferenceMaps(userClient)

    // ═══ جلب الإرساليات على دفعات عبر fetch_submissions (فلترة الدور من الخادم) ═══
    const headerMeta = ['#', 'الحالة', 'الجولة', 'المُرسِل', 'المحافظة', 'المديرية',
      'تاريخ الإرسال', 'خط العرض', 'خط الطول', 'عدد الصور', 'ملاحظات']
    const headers = [...headerMeta, ...fields.map((f) => f.label)]
    const widths = [6, 12, 8, 20, 15, 16, 17, 10, 10, 9, 24, ...fields.map(() => 18)]
    const rows: (string | number)[][] = []
    const seen = new Set<string>()

    for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
      const { data: page, error: rpcErr } = await userClient.rpc('fetch_submissions', {
        p_form_id: formId,
        p_governorate_id: governorateId,
        p_campaign_round: campaignRound,
        p_limit: PAGE_SIZE,
        p_offset: offset,
      })
      if (rpcErr) return jsonResponse({ error: `تعذّر جلب البيانات: ${rpcErr.message}` }, 400, origin)
      const arr = (page ?? []) as Record<string, unknown>[]
      for (const sub of arr) {
        const id = String(sub['id'] ?? '')
        if (!id || seen.has(id)) continue
        seen.add(id)
        const data = (sub['data'] ?? {}) as Record<string, unknown>

        let photoCount = 0
        if (Array.isArray(sub['photos'])) photoCount += sub['photos'].length
        for (const pk of photoKeys) {
          const pv = data[pk]
          if (Array.isArray(pv)) photoCount += pv.length
        }

        const row: (string | number)[] = [
          rows.length + 1,
          STATUS_AR[String(sub['status'] ?? '')] ?? String(sub['status'] ?? ''),
          sub['campaign_round'] ?? '',
          String(sub['submitter_name'] ?? '—'),
          String(sub['governorate_name'] ?? ''),
          String(sub['district_name'] ?? ''),
          fmtDate(sub['created_at']),
          sub['gps_lat'] ?? '',
          sub['gps_lng'] ?? '',
          photoCount,
          cleanText(String(sub['notes'] ?? '')),
        ]
        for (const f of fields) row.push(coerce(f, data[f.key], data, refs))
        rows.push(row)
      }
      if (arr.length < PAGE_SIZE) break
    }

    if (rows.length === 0) {
      return jsonResponse({ url: null, row_count: 0, message: 'لا توجد بيانات للتصدير في نطاق صلاحياتك' }, 200, origin)
    }

    // ═══ توليد الملف — xlsx خفيف، وإن فشل: CSV بترميز عربي سليم ═══
    const admin = createAdminClient()
    if (!admin) return jsonResponse({ error: 'الخدمة غير مهيأة (service role)' }, 500, origin)
    try {
      await ensureBucket(admin)
    } catch (bErr) {
      console.error('ensureBucket failed:', bErr)
      return jsonResponse({ error: `تعذّر تجهيز حاوية التصدير: ${(bErr as Error).message}` }, 500, origin)
    }

    const stamp = new Date()
    const p2 = (n: number) => String(n).padStart(2, '0')
    const dateTag = `${stamp.getFullYear()}-${p2(stamp.getMonth() + 1)}-${p2(stamp.getDate())}`
    const keyBase = `${safeObjectKey(formId)}_${dateTag}` // مفتاح ASCII للتخزين
    const baseName = `${safeFileName(title)}_${dateTag}` // اسم الملف الظاهر للمستخدم
    let finalPath = `exports/${auth.userId}/${keyBase}.xlsx`

    let uploadBody: Uint8Array
    let contentType: string
    let format: 'xlsx' | 'csv'

    try {
      const subtitle = `${rows.length} إرسالية — تم التصدير ${dateTag} ${p2(stamp.getHours())}:${p2(stamp.getMinutes())}`
      uploadBody = buildXlsx('البيانات', `بيانات: ${title}`, subtitle, headers, rows, widths, 1)
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      format = 'xlsx'
    } catch (xlErr) {
      console.error('xlsx build failed, falling back to CSV:', xlErr)
      uploadBody = buildCsv(headers, rows)
      contentType = 'text/csv; charset=utf-8'
      format = 'csv'
      finalPath = `exports/${auth.userId}/${keyBase}.csv`
    }

    const { error: upErr } = await admin.storage.from(BUCKET).upload(finalPath, uploadBody, {
      contentType,
      upsert: true,
    })
    if (upErr) return jsonResponse({ error: `تعذّر رفع الملف: ${upErr.message}` }, 500, origin)

    const { data: signed, error: signErr } = await admin.storage.from(BUCKET)
      .createSignedUrl(finalPath, URL_TTL)
    if (signErr || !signed) {
      return jsonResponse({ error: `تعذّر إنشاء رابط التحميل: ${signErr?.message ?? ''}` }, 500, origin)
    }

    // تنظيف قديم (أفضل جهد): ملفات هذا المستخدم الأقدم من 24 ساعة
    try {
      const folder = `exports/${auth.userId}`
      const { data: objs } = await admin.storage.from(BUCKET).list(folder, { limit: 100 })
      const cutoff = Date.now() - 24 * 3600 * 1000
      const stale = (objs ?? []).filter((o) => {
        const created = o.created_at ? new Date(o.created_at).getTime() : 0
        return created > 0 && created < cutoff
      }).slice(0, 20).map((o) => `${folder}/${o.name}`)
      if (stale.length > 0) await admin.storage.from(BUCKET).remove(stale)
    } catch { /* تجاهل */ }

    return jsonResponse({
      url: (signed as Record<string, unknown>)['signedUrl'] ?? signed,
      file_name: `${baseName}.${format}`,
      row_count: rows.length,
      column_count: headers.length,
      format,
      expires_at: new Date(Date.now() + URL_TTL * 1000).toISOString(),
    }, 200, origin)
  } catch (e) {
    console.error('export-form unexpected error:', e)
    return jsonResponse({ error: 'خطأ داخلي في توليد التصدير' }, 500, origin)
  }
})
