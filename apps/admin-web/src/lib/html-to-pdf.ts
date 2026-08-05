/**
 * ═══════════════════════════════════════════════════════════════
 *  HTML → PDF Converter — Reliable conversion using jsPDF + html2canvas
 *  محوّل HTML إلى PDF — تحويل موثوق باستخدام jsPDF + html2canvas
 * ═══════════════════════════════════════════════════════════════
 *  This module takes a complete HTML document string (the kind that
 *  professional-reports / enhanced-pdf produce) and turns it into a
 *  real PDF Blob that can be downloaded directly by the browser.
 *
 *  Why this exists:
 *    - The old `printReport()` used an offscreen iframe + window.print()
 *      which was unreliable: hidden iframes produced blank PDFs in
 *      Chrome's "Save as PDF", and web fonts (Cairo, Tajawal) often
 *      didn't load before print was triggered.
 *    - This module renders HTML in a VISIBLE off-screen container,
 *      waits for fonts, then uses html2canvas + jsPDF to produce a PDF.
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Wait for web fonts (Cairo, Tajawal) to be ready.
 * Falls back to a fixed delay if document.fonts API is unavailable.
 */
async function waitForFonts(timeoutMs = 3000): Promise<void> {
  try {
    if ('fonts' in document) {
      await Promise.race([
        (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready,
        new Promise<void>(resolve => setTimeout(resolve, timeoutMs)),
      ])
    } else {
      await new Promise<void>(resolve => setTimeout(resolve, 800))
    }
  } catch {
    await new Promise<void>(resolve => setTimeout(resolve, 800))
  }
}

/**
 * Convert an HTML document string into a PDF Blob.
 *
 * @param htmlString Complete HTML document (with <html>, <head>, <style>, <body>)
 * @param _title Unused — kept for API compatibility (used as filename hint by callers)
 * @returns PDF Blob, or null if generation fails
 */
export async function htmlToPdfBlob(htmlString: string, _title?: string): Promise<Blob | null> {
  // Dynamic imports keep initial bundle small
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])

  // ═══ 1. Create a VISIBLE off-screen container ═══
  // position:fixed + left:-99999px keeps it in the render tree (so fonts
  // and layout compute) but off-screen (so users don't see it).
  // display:none or visibility:hidden would BREAK html2canvas.
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-99999px'
  container.style.top = '0'
  container.style.width = '794px'  // A4 width at 96 DPI (210mm × 96/25.4)
  container.style.background = '#ffffff'
  container.style.zIndex = '-1'
  container.style.pointerEvents = 'none'

  // Parse the HTML string and extract <style> + <body> contents
  // We can't use innerHTML = full document because browsers strip <html>, <head>, <body>
  // when set via innerHTML on a div. So we extract style + body manually.
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')

  // Copy all <style> tags from <head>
  const styles = doc.querySelectorAll('head style')
  styles.forEach(style => {
    container.appendChild(style.cloneNode(true))
  })

  // Copy <body> children (the actual report content)
  const body = doc.querySelector('body')
  if (body) {
    while (body.firstChild) {
      container.appendChild(body.firstChild)
    }
  }

  document.body.appendChild(container)

  try {
    // ═══ 2. Wait for fonts ═══
    await waitForFonts(3000)
    // Extra paint tick so layout settles
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    // One more tick for safety
    await new Promise<void>(resolve => setTimeout(resolve, 100))

    // ═══ 3. Rasterize with html2canvas ═══
    const canvas = await html2canvas(container, {
      scale: 2,                    // 2x for crisp text
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
      windowHeight: container.scrollHeight,
    })

    // ═══ 4. Slice into A4 pages with jsPDF ═══
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    const pageWidthMm = 210
    const pageHeightMm = 297
    const marginMm = 8
    const contentWidthMm = pageWidthMm - marginMm * 2

    // Image dimensions when scaled to contentWidthMm
    const imgHeightMmTotal = (canvas.height * contentWidthMm) / canvas.width
    const usablePageHeightMm = pageHeightMm - marginMm * 2
    let remainingHeightMm = imgHeightMmTotal
    let srcYpx = 0

    while (remainingHeightMm > 0) {
      const sliceHeightMm = Math.min(usablePageHeightMm, remainingHeightMm)
      // Convert slice height back to canvas pixels
      const sliceHeightPx = Math.floor((sliceHeightMm * canvas.width) / contentWidthMm)

      // Create a temp canvas for this slice
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = Math.max(1, sliceHeightPx)
      const ctx = sliceCanvas.getContext('2d')
      if (!ctx) break
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
      ctx.drawImage(
        canvas,
        0, srcYpx, canvas.width, sliceHeightPx,
        0, 0, canvas.width, sliceHeightPx,
      )

      const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.92)
      const sliceHeightMmActual = (sliceHeightPx * contentWidthMm) / canvas.width

      pdf.addImage(
        sliceImgData,
        'JPEG',
        marginMm,
        marginMm,
        contentWidthMm,
        sliceHeightMmActual,
        undefined,
        'FAST',
      )

      remainingHeightMm -= sliceHeightMm
      srcYpx += sliceHeightPx

      if (remainingHeightMm > 0) {
        pdf.addPage()
      }
    }

    return pdf.output('blob')
  } catch (err) {
    console.error('[html-to-pdf] Generation failed:', err)
    return null
  } finally {
    // Always remove the container, even on failure
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }
}

/**
 * Convert HTML to a PDF Blob and trigger a browser download.
 * Returns true if download started, false if user must use print fallback.
 */
export async function downloadHtmlAsPdf(
  htmlString: string,
  fileName: string,
): Promise<boolean> {
  try {
    const blob = await htmlToPdfBlob(htmlString, fileName)
    if (blob && blob.size > 0) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
      return true
    }
  } catch (err) {
    console.error('[html-to-pdf] Download failed:', err)
  }
  return false
}
