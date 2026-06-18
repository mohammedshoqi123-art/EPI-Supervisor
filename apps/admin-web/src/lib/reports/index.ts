/**
 * ═══════════════════════════════════════════════════════════════
 *  Professional Reports — Barrel Export
 *  التقارير الاحترافية — تصدير مجمّع
 * ═══════════════════════════════════════════════════════════════
 */

// Shared utilities
export {
  formatDateArabic,
  formatTimeArabic,
  escapeHtml,
  buildHeader,
  buildFooter,
  buildKPI,
  buildSectionTitle,
  buildTable,
  buildProgress,
  getStyles,
  printReport,
  enableCaptureMode,
  disableCaptureMode,
} from './shared'

// Report generators
export { generateCentralReport } from './central-report'
export { generateGovernorateDetailReport } from './governorate-report'
export { generateFormAnalysisReport } from './form-analysis'
export { generateDistrictReport } from './district-report'
export { generateSupervisorReport } from './supervisor-report'
export { generateCoverageGapReport } from './coverage-gap'
export { generateCampaignComparisonReport } from './campaign-comparison'
export { generateDailyActivityReport } from './daily-activity'
export { generateDataQualityReport } from './data-quality'
export { generateShortagesDetailedReport } from './shortages-report'
export { generateWeeklyReport } from './weekly-report'
export { generateUserActivityReport } from './user-activity'
export { generateChallengesReport } from './challenges-report'
export { generateSupervisionFormReport } from './supervision-form-report'
export { generateSupervisionChallengesReport } from './supervision-challenges-report'
export { generateDailySupervisorEvaluation } from './daily-supervisor-evaluation'
export { generateComprehensiveSupervisorEvaluation } from './comprehensive-supervisor-evaluation'
export { generateMasterSupervisorReport } from './master-supervisor-report'
export { generateGovernorateSupervisorsEvaluation } from './governate-supervisors-evaluation'
export { generateDistrictSupervisorsEvaluation } from './district-supervisors-evaluation'
export { generateCentralSupervisorsEvaluation } from './central-supervisors-evaluation'
export { generateGeneralSupervisorsEvaluation } from './general-supervisors-evaluation'
export { generateYesNoAnalysisReport } from './yesno-analysis-report'
export { generateMapReport } from './map-report'
