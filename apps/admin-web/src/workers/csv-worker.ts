/**
 * ═══════════════════════════════════════════════════════════════
 * CSV Export Worker — يُنفذ JSON.stringify + CSV conversion في خيط خلفي
 * ═══════════════════════════════════════════════════════════════
 *
 * PROBLEM: تصدير 10000 صف على main thread = تجميد 2-5 ثوانٍ
 * SOLUTION: نقل العملية لـ Web Worker = UI يبقى متجاوب
 *
 * Usage:
 *   const worker = new Worker(new URL('./csv-worker.ts', import.meta.url))
 *   worker.postMessage({ rows, headers })
 *   worker.onmessage = (e) => { const csv = e.data; ... }
 */

self.onmessage = function (e) {
  const { rows, headers } = e.data

  try {
    const BOM = '\uFEFF'

    // Sanitize CSV values
    const sanitize = (str) => {
      if (str == null) return ''
      const s = String(str)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }

    // Build CSV
    const headerRow = headers.map(sanitize).join(',')
    const dataRows = rows.map(row =>
      headers.map(h => sanitize(row[h])).join(',')
    )

    const csv = BOM + [headerRow, ...dataRows].join('\n')

    self.postMessage({ success: true, csv })
  } catch (error: any) {
    self.postMessage({ success: false, error: error?.message || String(error) })
  }
}
