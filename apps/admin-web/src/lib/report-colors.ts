/**
 * ═══════════════════════════════════════════════════════════════
 *  Report Color Themes — سمات ألوان التقارير
 * ═══════════════════════════════════════════════════════════════
 *  Allows users to pick a color theme for their reports.
 *  Each theme defines primary, accent, and supporting colors.
 * ═══════════════════════════════════════════════════════════════
 */

export interface ReportTheme {
  id: string
  name: string
  nameAr: string
  primary: string        // Main header/accent color (hex without #)
  primaryDark: string    // Darker variant for titles
  headerBg: string       // Table header background
  headerText: string     // Table header text color
  rowEven: string        // Zebra stripe — even rows
  rowOdd: string         // Zebra stripe — odd rows
  borderColor: string    // Table borders
  titleColor: string     // Report title color
  kpiBg: string          // KPI card background tint
}

export const REPORT_THEMES: ReportTheme[] = [
  {
    id: 'blue',
    name: 'Blue',
    nameAr: 'أزرق',
    primary: '1565C0',
    primaryDark: '0D47A1',
    headerBg: '1565C0',
    headerText: 'FFFFFF',
    rowEven: 'FFFFFF',
    rowOdd: 'F5F7FA',
    borderColor: 'E0E0E0',
    titleColor: '0D47A1',
    kpiBg: 'E3F2FD',
  },
  {
    id: 'green',
    name: 'Green',
    nameAr: 'أخضر',
    primary: '2E7D32',
    primaryDark: '1B5E20',
    headerBg: '2E7D32',
    headerText: 'FFFFFF',
    rowEven: 'FFFFFF',
    rowOdd: 'F1F8E9',
    borderColor: 'C8E6C9',
    titleColor: '1B5E20',
    kpiBg: 'E8F5E9',
  },
  {
    id: 'teal',
    name: 'Teal',
    nameAr: 'أزرق مخضر',
    primary: '00897B',
    primaryDark: '00695C',
    headerBg: '00897B',
    headerText: 'FFFFFF',
    rowEven: 'FFFFFF',
    rowOdd: 'E0F2F1',
    borderColor: 'B2DFDB',
    titleColor: '00695C',
    kpiBg: 'E0F2F1',
  },
  {
    id: 'purple',
    name: 'Purple',
    nameAr: 'بنفسجي',
    primary: '7B1FA2',
    primaryDark: '4A148C',
    headerBg: '7B1FA2',
    headerText: 'FFFFFF',
    rowEven: 'FFFFFF',
    rowOdd: 'F3E5F5',
    borderColor: 'CE93D8',
    titleColor: '4A148C',
    kpiBg: 'F3E5F5',
  },
  {
    id: 'red',
    name: 'Red',
    nameAr: 'أحمر',
    primary: 'C62828',
    primaryDark: 'B71C1C',
    headerBg: 'C62828',
    headerText: 'FFFFFF',
    rowEven: 'FFFFFF',
    rowOdd: 'FFEBEE',
    borderColor: 'EF9A9A',
    titleColor: 'B71C1C',
    kpiBg: 'FFEBEE',
  },
  {
    id: 'orange',
    name: 'Orange',
    nameAr: 'برتقالي',
    primary: 'EF6C00',
    primaryDark: 'E65100',
    headerBg: 'EF6C00',
    headerText: 'FFFFFF',
    rowEven: 'FFFFFF',
    rowOdd: 'FFF3E0',
    borderColor: 'FFCC80',
    titleColor: 'E65100',
    kpiBg: 'FFF3E0',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    nameAr: 'نيلي',
    primary: '283593',
    primaryDark: '1A237E',
    headerBg: '283593',
    headerText: 'FFFFFF',
    rowEven: 'FFFFFF',
    rowOdd: 'E8EAF6',
    borderColor: '9FA8DA',
    titleColor: '1A237E',
    kpiBg: 'E8EAF6',
  },
  {
    id: 'dark',
    name: 'Dark',
    nameAr: 'داكن',
    primary: '37474F',
    primaryDark: '263238',
    headerBg: '37474F',
    headerText: 'FFFFFF',
    rowEven: 'FFFFFF',
    rowOdd: 'ECEFF1',
    borderColor: 'B0BEC5',
    titleColor: '263238',
    kpiBg: 'ECEFF1',
  },
]

/** Get theme by ID, falls back to blue */
export function getTheme(id: string): ReportTheme {
  return REPORT_THEMES.find(t => t.id === id) || REPORT_THEMES[0]
}

/** Get theme from localStorage or default */
export function getSavedTheme(): ReportTheme {
  try {
    const saved = localStorage.getItem('epi-report-theme')
    if (saved) return getTheme(saved)
  } catch { /* ignore */ }
  return REPORT_THEMES[0]
}

/** Save theme to localStorage */
export function saveTheme(id: string): void {
  try {
    localStorage.setItem('epi-report-theme', id)
  } catch { /* ignore */ }
}
