/**
 * ═══════════════════════════════════════════════════════════════
 *  PDF Charts — HTML/CSS chart builders for PDF reports
 *  رسوم بيانية للـ PDF — بناء بالـ HTML/CSS
 * ═══════════════════════════════════════════════════════════════
 *  Generates chart-like visualizations using pure HTML/CSS
 *  that render correctly in PDF (no JavaScript needed).
 * ═══════════════════════════════════════════════════════════════
 */

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ─── Color Palette ───────────────────────────────────────────

const CHART_COLORS = [
  '#1565C0', '#2E7D32', '#F57F17', '#E53935', '#7B1FA2',
  '#00838F', '#E65100', '#283593', '#558B2F', '#AD1457',
]

// ─── Bar Chart (Horizontal) ─────────────────────────────────

export function buildPDFBarChart(
  data: { label: string; value: number; color?: string }[],
  options?: {
    title?: string
    maxValue?: number
    showValues?: boolean
    height?: number
  }
): string {
  if (!data.length) return ''

  const maxValue = options?.maxValue || Math.max(...data.map(d => d.value), 1)
  const showValues = options?.showValues !== false

  return `
    <div class="pdf-chart">
      ${options?.title ? `<div class="chart-title">${escapeHtml(options.title)}</div>` : ''}
      <div class="bar-chart">
        ${data.map((item, i) => {
          const pct = Math.round((item.value / maxValue) * 100)
          const color = item.color || CHART_COLORS[i % CHART_COLORS.length]
          return `
            <div class="bar-row">
              <div class="bar-label">${escapeHtml(item.label)}</div>
              <div class="bar-track">
                <div class="bar-fill" style="width: ${pct}%; background: ${color}"></div>
              </div>
              ${showValues ? `<div class="bar-value">${item.value.toLocaleString('ar-SA')}</div>` : ''}
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
}

// ─── Donut Chart (CSS-based) ────────────────────────────────

export function buildPDFDonutChart(
  data: { label: string; value: number; color?: string }[],
  options?: {
    title?: string
    size?: number
    showLegend?: boolean
  }
): string {
  if (!data.length) return ''

  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return ''

  const size = options?.size || 160
  const showLegend = options?.showLegend !== false

  // Build conic-gradient
  let gradientParts: string[] = []
  let currentDeg = 0
  data.forEach((item, i) => {
    const pct = (item.value / total) * 100
    const deg = (pct / 100) * 360
    const color = item.color || CHART_COLORS[i % CHART_COLORS.length]
    gradientParts.push(`${color} ${currentDeg}deg ${currentDeg + deg}deg`)
    currentDeg += deg
  })

  return `
    <div class="pdf-chart">
      ${options?.title ? `<div class="chart-title">${escapeHtml(options.title)}</div>` : ''}
      <div class="donut-container" style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
        <div class="donut-wrapper" style="position: relative; width: ${size}px; height: ${size}px;">
          <div class="donut" style="
            width: ${size}px; height: ${size}px;
            border-radius: 50%;
            background: conic-gradient(${gradientParts.join(', ')});
            display: flex; align-items: center; justify-content: center;
          ">
            <div style="
              width: ${size * 0.6}px; height: ${size * 0.6}px;
              border-radius: 50%; background: white;
              display: flex; align-items: center; justify-content: center;
              flex-direction: column;
            ">
              <div style="font-size: 20px; font-weight: 900; color: #212121;">${total.toLocaleString('ar-SA')}</div>
              <div style="font-size: 10px; color: #757575;">إجمالي</div>
            </div>
          </div>
        </div>
        ${showLegend ? `
          <div class="donut-legend" style="flex: 1; min-width: 140px;">
            ${data.map((item, i) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
              const color = item.color || CHART_COLORS[i % CHART_COLORS.length]
              return `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <div style="width: 12px; height: 12px; border-radius: 3px; background: ${color}; flex-shrink: 0;"></div>
                  <div style="flex: 1; font-size: 12px; color: #616161;">${escapeHtml(item.label)}</div>
                  <div style="font-size: 12px; font-weight: 700; color: #212121;">${pct}%</div>
                </div>
              `
            }).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `
}

// ─── Sparkline (Mini trend line using CSS) ───────────────────

export function buildPDFSparkline(
  data: { date: string; value: number }[],
  options?: {
    title?: string
    color?: string
    height?: number
    showMinMax?: boolean
  }
): string {
  if (!data.length) return ''

  const color = options?.color || '#1565C0'
  const height = options?.height || 80
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const minVal = Math.min(...data.map(d => d.value), 0)
  const range = maxVal - minVal || 1

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = height - ((d.value - minVal) / range) * (height - 20)
    return `${x},${y}`
  })

  const polyline = points.join(' ')
  const areaPoints = `0,${height} ${polyline} 100,${height}`

  return `
    <div class="pdf-chart">
      ${options?.title ? `<div class="chart-title">${escapeHtml(options.title)}</div>` : ''}
      <div style="position: relative; height: ${height + 30}px; background: #F5F7FA; border-radius: 8px; padding: 8px 12px;">
        <svg viewBox="0 0 100 ${height}" preserveAspectRatio="none" style="width: 100%; height: ${height}px;">
          <!-- Area fill -->
          <polygon points="${areaPoints}" fill="${color}15" />
          <!-- Line -->
          <polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
          <!-- Dots -->
          ${points.map((p, i) => {
            if (i % Math.max(1, Math.floor(data.length / 8)) === 0 || i === data.length - 1) {
              const [x, y] = p.split(',')
              return `<circle cx="${x}" cy="${y}" r="2" fill="${color}" />`
            }
            return ''
          }).join('')}
        </svg>
        ${options?.showMinMax !== false ? `
          <div style="display: flex; justify-content: space-between; font-size: 9px; color: #9E9E9E; margin-top: 4px;">
            <span>${data[0]?.date.slice(5) || ''}</span>
            <span>أعلى: ${maxVal.toLocaleString('ar-SA')}</span>
            <span>أدنى: ${minVal.toLocaleString('ar-SA')}</span>
            <span>${data[data.length - 1]?.date.slice(5) || ''}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `
}

// ─── Comparison Bar Chart (Side by Side) ─────────────────────

export function buildPDFComparisonChart(
  data: { label: string; current: number; previous: number }[],
  options?: {
    title?: string
    currentLabel?: string
    previousLabel?: string
    currentColor?: string
    previousColor?: string
  }
): string {
  if (!data.length) return ''

  const maxVal = Math.max(...data.map(d => Math.max(d.current, d.previous)), 1)
  const currentColor = options?.currentColor || '#1565C0'
  const previousColor = options?.previousColor || '#BDBDBD'

  return `
    <div class="pdf-chart">
      ${options?.title ? `<div class="chart-title">${escapeHtml(options.title)}</div>` : ''}
      <div style="display: flex; gap: 12px; margin-bottom: 10px; font-size: 11px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 12px; height: 12px; border-radius: 3px; background: ${currentColor};"></div>
          <span>${escapeHtml(options?.currentLabel || 'الحالية')}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 12px; height: 12px; border-radius: 3px; background: ${previousColor};"></div>
          <span>${escapeHtml(options?.previousLabel || 'السابقة')}</span>
        </div>
      </div>
      <div class="comparison-chart">
        ${data.map(item => {
          const currentPct = Math.round((item.current / maxVal) * 100)
          const previousPct = Math.round((item.previous / maxVal) * 100)
          const diff = item.current - item.previous
          const diffPct = item.previous > 0 ? Math.round((diff / item.previous) * 100) : 0
          const diffColor = diff > 0 ? '#2E7D32' : diff < 0 ? '#E53935' : '#757575'
          const diffIcon = diff > 0 ? '↑' : diff < 0 ? '↓' : '→'
          return `
            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 12px; font-weight: 600;">${escapeHtml(item.label)}</span>
                <span style="font-size: 11px; color: ${diffColor}; font-weight: 700;">
                  ${diffIcon} ${diffPct > 0 ? '+' : ''}${diffPct}%
                </span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 3px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 28px; font-size: 10px; color: #757575; text-align: right;">حالي</div>
                  <div style="flex: 1; height: 18px; background: #F5F7FA; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${currentPct}%; height: 100%; background: ${currentColor}; border-radius: 4px; display: flex; align-items: center; justify-content: flex-end; padding-left: 8px;">
                      <span style="font-size: 10px; color: white; font-weight: 700;">${item.current.toLocaleString('ar-SA')}</span>
                    </div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 28px; font-size: 10px; color: #757575; text-align: right;">سابق</div>
                  <div style="flex: 1; height: 18px; background: #F5F7FA; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${previousPct}%; height: 100%; background: ${previousColor}; border-radius: 4px; display: flex; align-items: center; justify-content: flex-end; padding-left: 8px;">
                      <span style="font-size: 10px; color: white; font-weight: 700;">${item.previous.toLocaleString('ar-SA')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
}

// ─── Progress Gauge ─────────────────────────────────────────

export function buildPDFGauge(
  value: number,
  max: number,
  options?: {
    title?: string
    label?: string
    color?: string
    target?: number
    size?: number
  }
): string {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  const color = options?.color || (pct >= 90 ? '#2E7D32' : pct >= 70 ? '#F57F17' : '#E53935')
  const size = options?.size || 120
  const target = options?.target

  // SVG arc
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (pct / 100) * circumference

  return `
    <div class="pdf-chart" style="text-align: center;">
      ${options?.title ? `<div class="chart-title">${escapeHtml(options.title)}</div>` : ''}
      <div style="display: inline-block; position: relative; width: ${size}px; height: ${size}px;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <!-- Background arc -->
          <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="#E0E0E0" stroke-width="10" />
          <!-- Value arc -->
          <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="${color}" stroke-width="10"
            stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
            stroke-linecap="round" transform="rotate(-90 ${size/2} ${size/2})" />
        </svg>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
          <div style="font-size: 24px; font-weight: 900; color: ${color};">${pct}%</div>
          ${options?.label ? `<div style="font-size: 10px; color: #757575;">${escapeHtml(options.label)}</div>` : ''}
        </div>
      </div>
      ${target ? `
        <div style="font-size: 10px; color: #9E9E9E; margin-top: 8px;">
          الهدف: ${target}% | الحالي: ${pct}%
        </div>
      ` : ''}
    </div>
  `
}

// ─── CSS for PDF Charts (to be included in report HTML) ──────

export function getPDFChartStyles(): string {
  return `
    <style>
      .pdf-chart { margin-bottom: 16px; page-break-inside: avoid; }
      .chart-title {
        font-size: 13px; font-weight: 700; color: #212121;
        margin-bottom: 10px; padding-bottom: 6px;
        border-bottom: 1px solid #E0E0E0;
      }
      .bar-chart { display: flex; flex-direction: column; gap: 8px; }
      .bar-row { display: flex; align-items: center; gap: 10px; }
      .bar-label { width: 100px; font-size: 11px; color: #616161; text-align: right; flex-shrink: 0; }
      .bar-track { flex: 1; height: 20px; background: #F5F7FA; border-radius: 4px; overflow: hidden; }
      .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; min-width: 2px; }
      .bar-value { width: 50px; font-size: 11px; font-weight: 700; color: #212121; text-align: left; }
    </style>
  `
}
