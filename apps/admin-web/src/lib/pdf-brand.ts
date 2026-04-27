/**
 * ═══════════════════════════════════════════════════════════════
 *  Shared PDF/Report Brand Constants
 *  ثوابت العلامة التجارية المشتركة للتقارير
 * ═══════════════════════════════════════════════════════════════
 *  Single source of truth for report colors.
 *  Import from here instead of defining locally.
 *
 *  BRAND is dynamically updatable — call setBrandTheme() to change
 *  colors globally. All reports that import BRAND will use the new
 *  colors automatically.
 * ═══════════════════════════════════════════════════════════════
 */

export interface BrandColors {
  primary: string
  primaryDark: string
  accent: string
  success: string
  warning: string
  info: string
  bgLight: string
  bgWhite: string
  textDark: string
  textMuted: string
  border: string
}

/** Default brand theme (blue) — used by enhanced-pdf and professional-reports.
 *  This object is mutable — call setBrandTheme() to update globally. */
export let BRAND: BrandColors = {
  primary: '#1565C0',
  primaryDark: '#0D47A1',
  accent: '#E53935',
  success: '#2E7D32',
  warning: '#F57F17',
  info: '#0277BD',
  bgLight: '#F5F7FA',
  bgWhite: '#FFFFFF',
  textDark: '#212121',
  textMuted: '#616161',
  border: '#E0E0E0',
}

/**
 * Update BRAND colors globally. All reports will pick up the new colors.
 * Call this before generating reports when a custom theme is active.
 */
export function setBrandTheme(theme: Partial<BrandColors>): void {
  Object.assign(BRAND, theme)
}

/**
 * Reset BRAND to default blue theme.
 */
export function resetBrandTheme(): void {
  Object.assign(BRAND, {
    primary: '#1565C0',
    primaryDark: '#0D47A1',
    accent: '#E53935',
    success: '#2E7D32',
    warning: '#F57F17',
    info: '#0277BD',
    bgLight: '#F5F7FA',
    bgWhite: '#FFFFFF',
    textDark: '#212121',
    textMuted: '#616161',
    border: '#E0E0E0',
  })
}

/** Legacy teal theme — used by pdf-export templates.
 *  Consider migrating to BRAND for consistency. */
export const BRAND_TEAL = {
  primary: '#00897B',
  primaryDark: '#00695C',
  deepDark: '#004D40',
  accent: '#E53935',
  success: '#43A047',
  warning: '#FF8F00',
  info: '#1976D2',
  bgLight: '#F5F7FA',
  textDark: '#212121',
  textMuted: '#757575',
  white: '#FFFFFF',
} as const
