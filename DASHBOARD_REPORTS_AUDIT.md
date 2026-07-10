# Dashboard & Reports System — Comprehensive Audit

**Audit Date:** 2025-01-XX  
**Scope:** Mobile (Flutter) Dashboard + Admin Web (React) Reports + Supabase Edge Functions  
**Auditor:** General-purpose sub-agent  
**Files reviewed:** 60+ files, ~17,500 lines of code

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Mobile Dashboard — Current State](#2-mobile-dashboard--current-state)
3. [Mobile Dashboard — Improvement Recommendations](#3-mobile-dashboard--improvement-recommendations)
4. [Reports System — Current State](#4-reports-system--current-state)
5. [Reports System — New Report Proposals](#5-reports-system--new-report-proposals)
6. [Reports System — Improvement Recommendations](#6-reports-system--improvement-recommendations)
7. [UI/UX Suggestions Per Section](#7-uiux-suggestions-per-section)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [Filter Integration Recommendations](#9-filter-integration-recommendations)
10. [File Inventory](#10-file-inventory)

---

## 1. Executive Summary

The EPI Supervisor platform has a **mature, feature-rich reporting system** but a **minimalist mobile dashboard** that is missing several high-value widgets. Key observations:

| Area | Mobile (Flutter) | Admin Web (React) | Edge Functions |
|---|---|---|---|
| Dashboard widgets | 4 (hero, KPIs, actions, trend) | 6+ KPIs + 3 charts + activity feed | N/A |
| Report types | 4 (daily, weekly, gov, full) | **40+** PDF/Excel/PPTX | 4 types server-side |
| Filters | Campaign + Round (drawer only) | Campaign + Round + Gov + Date | All filters |
| Export formats | PDF only | PDF + Excel + CSV + PPTX | CSV + HTML |
| Scheduled reports | ❌ None | ✅ Full system (5 delivery methods) | ✅ Cron-driven |
| Real-time updates | ❌ Polling only | ✅ Supabase Realtime | N/A |
| Templates | 5 defined, **0 used** | Built-in + custom system | N/A |

**Top priority gaps:**
1. Mobile dashboard has only **2 KPI cards** (web has 6+)
2. Mobile has **no governorate ranking / coverage map / activity feed**
3. Mobile dashboard has **no visible campaign/round filter chips** (only in drawer)
4. **5 ReportTemplate classes** in `report_templates.dart` are defined but never wired up to UI
5. Scheduled reports edge function generates **only CSV/HTML** (no real PDF/Excel) — quality gap
6. Mobile PDF export is **single-file** — no PPTX, no Excel, no CSV path

---

## 2. Mobile Dashboard — Current State

### 2.1 Files Involved

| File | Lines | Purpose |
|---|---|---|
| `apps/mobile/lib/screens/dashboard_screen.dart` | 507 | Main dashboard screen |
| `apps/mobile/lib/screens/dashboard_charts.dart` | 558 | KPI grid, quick actions, trend line chart |
| `apps/mobile/lib/screens/dashboard_header.dart` | 297 | Hero header + sync banner (unused) |
| `apps/mobile/lib/screens/dashboard_report.dart` | 259 | PDF export bottom sheet |
| `apps/mobile/lib/router/app_router.dart` | 626 | MainShell (FABs + drawer + bottom nav) |
| `apps/mobile/lib/providers/app_providers.dart` | 792 | Dashboard analytics provider |

### 2.2 Layout Structure

```
Scaffold (no AppBar)
└── RefreshIndicator (onRefresh → invalidate dashboardAnalyticsProvider)
    └── CustomScrollView (AlwaysScrollableScrollPhysics)
        ├── SliverToBoxAdapter: DashboardHeroHeader
        │   └── Container (gradient green, 24px padding, 24px radius)
        │       ├── Greeting + emoji (صباح/مساء/تصبح) 
        │       ├── User name (Cairo 26px bold)
        │       ├── Campaign label chip
        │       └── Notification bell (animated pulse, badge count)
        ├── SliverPadding (16px horizontal)
        │   └── analytics.when(loading/error/data)
        │       └── _buildDashboardContent (SliverList)
        │           ├── DashboardKPIGrid (2 cards in 2-col grid)
        │           ├── Section title "إجراءات سريعة"
        │           ├── DashboardQuickActions (horizontal list, 5 actions)
        │           ├── Section title "النشاط الأسبوعي"
        │           └── DashboardTrendLine (line chart 200px)
        └── SliverToBoxAdapter: SizedBox(100) — bottom padding
```

The screen is wrapped in `MainShell` (via router) which provides:
- Drawer FAB (top-right)
- Sync FAB (extended, always visible)
- Pending uploads badge (when count > 0)
- AI Assistant FAB (orange gradient)
- `EpiBottomNav` (5 tabs: Dashboard, Forms, Status, Analytics, Map)
- `ConnectivityBanner` (when offline or pending > 0)

### 2.3 Widgets / Sections Currently Displayed

#### 2.3.1 DashboardHeroHeader
- **Data shown:** Time-based greeting (صباح الخير ☀️ / مساء الخير 🌤️ / تصبح على خير 🌙), user's full name (from `authStateProvider`), campaign label (from `campaignProvider.displayLabel`), Arabic date string (weekday + day + month + year), unread notification count badge.
- **Interactions:** Tap notification bell → navigates to `/notifications`.
- **Animation:** Slide + fade (800ms), pulse on bell (1500ms, stops after 2s for perf).

#### 2.3.2 DashboardKPIGrid (2 cards only)
| Card | Metric | Sub-value | Icon | Color | Source |
|---|---|---|---|---|---|
| **إرساليات** (Submissions) | `submissions.total` | `submissions.today` ("اليوم") | `upload_file_rounded` | primaryColor (green) | `dashboardAnalyticsProvider` |
| **مسودات** (Drafts) | `localDrafts` (Hive count) | "قيد التحرير" or "لا يوجد" | `edit_note_rounded` | warningColor (orange) | `localDraftCountProvider` |

- **Interaction:** Tap "Submissions" card → navigates to `/forms/status`. Drafts card has no tap handler.
- **Animation:** Staggered fade + translate (1000ms, 150ms delay per card).
- **Grid:** 2 columns, childAspectRatio 1.5, 12px spacing.
- **Missing KPIs** (compared to web): Today's submissions count, this-week count, approval rate, active forms, active users, unread notifications, pending sync count, shortages count, coverage %, trend %.

#### 2.3.3 DashboardQuickActions (5 horizontal actions)
| # | Label | Icon | Color | Route |
|---|---|---|---|---|
| 0 | إرسال جديد (New submission) | `add_circle_outline_rounded` | Teal `#00897B` | `/forms` |
| 1 | النماذج (Forms) | `description_rounded` | Indigo `#5C6BC0` | `/forms` |
| 2 | تصدير PDF (Export PDF) | `picture_as_pdf_rounded` | Red `#E53935` | `__export_pdf__` (triggers bottom sheet) |
| 3 | الخريطة (Map) | `map_outlined` | Blue `#1E88E5` | `/map` |
| 4 | المساعد الذكي (AI Assistant) | `smart_toy_outlined` | Orange `#FF8F00` | `/ai` |

- **Layout:** Horizontal `ListView.separated`, 82px wide cards, 100px tall.
- **Interaction:** Tap-down visual feedback (selected state with color tint), haptic feedback.

#### 2.3.4 DashboardTrendLine (Weekly activity chart)
- **Chart type:** Line chart (fl_chart `LineChart`).
- **Data source:** `submissions.byDay` from `dashboardAnalyticsProvider` (Map<String, dynamic> — day label → count).
- **Styling:** Curved line (smoothness 0.3), 2.5px width, primaryColor, gradient fill (15% → 2% alpha), 3px dots, custom tooltip with day + count.
- **Axes:** Left (numeric, Cairo 9px), bottom (day labels, Tajawal 9px, every other label when > 7 days).
- **Empty state:** Gray box with "لا توجد بيانات".
- **Height:** 200px, 20px radius, white background, soft shadow.
- **RepaintBoundary** for performance.

### 2.4 Providers / Data Sources

```dart
// Dashboard reads these providers:
ref.watch(dashboardAnalyticsProvider(
  AnalyticsFilter(
    campaignType: ref.watch(campaignProvider).value,
    campaignRound: ref.watch(campaignRoundProvider),
  ),
))
// → analyticsServiceProvider.getAnalytics(campaignType, campaignRound, ...)
// → cached 7 days in Hive, refreshed by sync button or pull-to-refresh

ref.watch(authStateProvider)                    // user name, role
ref.watch(syncPendingCountProvider)             // pending uploads (read by MainShell)
ref.watch(notificationCountProvider)            // unread notifications (polls every 300s)
ref.watch(localDraftCountProvider)              // Hive drafts count (polls every 300s)
ref.watch(campaignProvider)                     // active campaign (persisted)
ref.watch(campaignRoundProvider)                // active round (persisted)
ref.read(forceRefreshProvider)('dashboard_analytics')  // pull-to-refresh trigger
```

**Caching:** `dashboardAnalyticsProvider` uses `offlineDataCacheProvider` with `maxAge: 7 days`. The "sync" FAB in MainShell triggers `fullSyncProvider` which refreshes all caches.

### 2.5 Campaign Round Filter Integration (Mobile)

- **State:** `campaignProvider` (CampaignType) + `campaignRoundProvider` (int 1-5), both persisted in Hive + Supabase app_settings.
- **UI surface:** Only inside the AppDrawer (hamburger menu). The dashboard screen itself does **NOT** show filter chips. Users must open the drawer to switch campaign/round.
- **Auto-invalidation:** When campaign or round changes, `dashboardAnalyticsProvider`, `formsProvider`, `formStatsProvider` are all invalidated (auto-refresh).
- **Round range:** 1-5 (web allows 1-10). Round is shown only when campaign = `integrated_activity` per `CampaignRoundNotifier.selectRound` guard.
- **Inconsistency:** The web `showRoundFilter` returns true for ALL campaigns except `'all'` (after a recent fix), but the mobile drawer only shows round selector for `integrated_activity`. This is a UX divergence.

### 2.6 Activity Type Filter Integration (Mobile)

- "Activity type" is functionally equivalent to "campaign type" (polio_campaign, integrated_activity). There is no separate activity-type filter on the mobile dashboard.
- The mobile dashboard uses **one filter** (campaign) which doubles as the activity type filter.

### 2.7 Charts Used (Mobile Dashboard)

| Chart | Type | Library | Data | Styling |
|---|---|---|---|---|
| Weekly trend | LineChart | `fl_chart` | `submissions.byDay` | Curved, gradient area, dots, tooltip |

**No other chart types** on the mobile dashboard (no bar, no pie, no donut, no gauge, no map).

### 2.8 PDF Export (Mobile)

`DashboardReportExporter.showExportSheet` opens a bottom sheet with 4 options:

| Type | Title | Period |
|---|---|---|
| `daily` | تقرير الإرساليات اليومي | today's date |
| `weekly` | تقرير الإرساليات الأسبوعي | last 7 days |
| `governorates` | تقرير أداء المحافظات | last 30 days |
| `full` | التقرير الشامل | last 30 days |

**Generation flow:**
1. User taps "تصدير PDF" quick action → bottom sheet appears.
2. `_exportPdfReport()` fetches readiness + supervision submissions (up to 5000 each) via `databaseServiceProvider.getSubmissions()`.
3. Processes 4 data structures: `readinessData`, `complianceData`, `serviceNumbersData`, `challengesData`.
4. Calls `DashboardReportExporter.generateAndShare()` which:
   - Shows 30s snackbar with spinner.
   - Fetches governorate ranking via `analyticsServiceProvider.getGovernorateRanking()`.
   - Calls `ReportGenerator.generatePDFReport()` (in `packages/core/lib/src/reports/report_generator.dart`, 1144 lines).
   - Uses `pdf` package + `path_provider` to write file.
   - Shares via `share_plus` (`SharePlus.instance.share(ShareParams(files: [XFile]))`).
5. Success/failure snackbar.

**Limitations:**
- **PDF only** — no Excel, no CSV, no PPTX on mobile.
- Hardcoded form IDs: `_readinessFormId = '8aa0f3d5-...'`, `_supervisionFormId = '97a4f2b3-...'` (brittle).
- Fixed field definitions for `_readinessCriteriaKeys`, `_yesNoSections`, `_serviceNumberFields` (data shape tightly coupled to form schema).
- No preview — file is generated and immediately shared.
- No campaign/round filter UI on the export sheet (uses whatever is currently active).

### 2.9 Background Behavior

- **Init:** On screen mount, `_pulseAnim` runs for 2s then stops (perf fix). `_headerAnim` + `_cardsAnim` run once.
- **Auto-sync:** If `syncService.currentState.pendingCount > 0`, triggers background sync via `Future.microtask` (non-blocking).
- **No auto-refresh** on connectivity restore (deliberate — user presses sync button).
- **Pull-to-refresh:** Calls `forceRefreshProvider('dashboard_analytics')` + invalidates the analytics provider. Skipped when offline.

---

## 3. Mobile Dashboard — Improvement Recommendations

### 3.1 Add Missing KPI Cards (HIGH PRIORITY)

**Current:** 2 cards (Submissions, Drafts).  
**Recommended:** Expand to 6 cards (3×2 grid) to match web dashboard:

| Card | Metric | Source | Tap action |
|---|---|---|---|
| إرساليات اليوم | `submissions.today` | analytics | `/forms/status` |
| إرساليات الأسبوع | `submissions.thisWeek` | analytics | `/forms/status?filter=week` |
| نسبة الإنجاز | `submitted / total × 100` | analytics | `/analytics` |
| النواقص الحرجة | `shortages.critical` | shortagesProvider | `/shortages` (new screen) |
| المستخدمين النشطين | `users.active / users.total` | (new provider) | `/users` |
| التغطية | `activeGovs / totalGovs × 100` | analytics | `/map` |

**Code change:** Modify `DashboardKPIGrid` in `dashboard_charts.dart` to accept a list of KPI items instead of just (total, today, drafts). Change grid to 3 columns, childAspectRatio 1.3.

### 3.2 Add Visible Campaign + Round Filter Chips (HIGH PRIORITY)

**Problem:** Filters are hidden in the drawer. Users don't realize the dashboard is campaign-scoped.  
**Recommendation:** Add a horizontal chip row directly below the hero header:

```dart
SliverToBoxAdapter(
  child: DashboardFilterChips(
    campaign: ref.watch(campaignProvider),
    round: ref.watch(campaignRoundProvider),
    onCampaignTap: () => _showCampaignPicker(context),
    onRoundTap: () => _showRoundPicker(context),
  ),
)
```

Visual design: pill-shaped chips with icon + label, primary color tint when active, dropdown chevron. Round chip hidden when campaign = `polio_campaign` (or per the new logic, always visible except `all`).

### 3.3 Add Governorate Ranking Section (HIGH PRIORITY)

**Current:** Only available on `/analytics` screen (deep navigation).  
**Recommendation:** Add a "Top 5 Governorates" card on the dashboard:

```
┌─────────────────────────────────────┐
│ 🏛️ أعلى المحافظات                  ▸ │
├─────────────────────────────────────┤
│ 1. صنعاء         ████████  124      │
│ 2. عدن           ██████    98       │
│ 3. تعز           █████     76       │
│ 4. الحديدة       ████      54       │
│ 5. إب            ███       42       │
└─────────────────────────────────────┘
```

Use `governorateRankingProvider` (already exists, takes campaignRound). Tap → `/analytics` with auto-focus on governorate chart.

### 3.4 Add Coverage Donut Chart (MEDIUM PRIORITY)

A small donut chart showing % of governorates with submissions vs. zero-coverage:

```
      ╭──╮
     ╱    ╲    التغطية
    │ 78%  │   12 من 15 محافظة
     ╲    ╱    نشطة
      ╰──╯
```

Use `fl_chart` `PieChart` with inner radius. Tap → `/map`.

### 3.5 Add Recent Activity Feed (MEDIUM PRIORITY)

A vertical list of last 5 submissions (form name, submitter, governorate, time-ago). Tap → `/forms/status/submission/:id`. Data already in `submissions.recent` if analytics returns it; otherwise fetch via `databaseServiceProvider.getSubmissions(limit: 5)`.

### 3.6 Wire Up `ReportTemplates` Class (HIGH PRIORITY)

**Problem:** `packages/core/lib/src/reports/report_templates.dart` defines 5 templates (`vaccinationCoverage`, `dropoutAnalysis`, `supplyShortages`, `dailyActivity`, `kpiDashboard`) but **none are used** by `report_generator.dart` or the dashboard export sheet.

**Recommendation:** Refactor `DashboardReportExporter.showExportSheet` to read from `ReportTemplates.all` dynamically. Add a "More Reports" option that opens a full template picker. This unlocks future template additions without UI changes.

### 3.7 Add Excel + CSV Export (MEDIUM PRIORITY)

Mobile only supports PDF. Add:
- **Excel:** Use `syncfusion_flutter_xlsx` or `excel` package to write .xlsx files with branded styling (mirror web's `styled-excel.ts`).
- **CSV:** Trivial — `String` → `share_plus`. Useful for offline data sharing.

Update bottom sheet to show 3 format options per report type (PDF/Excel/CSV icons).

### 3.8 Add Real-Time Updates (LOW PRIORITY)

**Current:** Polling every 300s for drafts/notifications, no realtime on submissions.  
**Recommendation:** Subscribe to Supabase Realtime channel for `form_submissions` changes (like the web does). Debounce 2s, invalidate `dashboardAnalyticsProvider`. Shows instant updates when other supervisors submit.

### 3.9 Fix Unused Code

- `DashboardSyncBanner` widget in `dashboard_header.dart` is defined but never used (the sync FAB replaced it). Either delete or repurpose.
- `KPIItem.subValue` and `subLabel` are awkward when subValue = 0 (shows label only). Refactor to always show "اليوم: 0" for clarity.

### 3.10 Performance

- **Good:** Already uses `.select()` to minimize rebuilds, `RepaintBoundary` on charts, pulse animation stops after 2s.
- **Improvement:** The `_exportPdfReport` method fetches up to 10,000 submissions on the UI thread (5000 readiness + 5000 supervision). Move to an isolate via `compute()` to prevent jank on low-end devices.

---

## 4. Reports System — Current State

### 4.1 Report Types Available

The admin web exposes **40+ report types** organized into 4 tabs. Below is the full inventory.

#### 4.1.1 Excel / CSV Reports (8 types)

| Report | Handler | Permission | Data Source |
|---|---|---|---|
| ملخص المؤشرات (KPIs) | `handleExportDashboard` | governorate+ | `useDashboardStats` → styled Excel |
| الإرساليات — خط زمني | `handleExportTimeline` | all | `useSubmissionsChart` → styled Excel |
| أداء المحافظات | `handleExportGovernorates` | admin/central | `useGovernorateStats` → styled Excel |
| توزيع الحالات | `handleExportSubmissions` | all | `bulkFetchSubmissions` → styled Excel |
| توزيع المستخدمين | `handleExportRoles` | admin/central | `useRoleDistribution` → styled Excel |
| تقرير الإرساليات الشامل | `handleExportSubmissions` | all | same as above |
| تقرير المستخدمين | `handleExportUsers` | admin/central | `bulkFetchUsers` → styled Excel |
| تقرير النواقص | `handleExportShortages` | governorate+ | `bulkFetchShortages` → styled Excel |
| سجل التدقيق | `handleExportAudit` | admin/central | `useAuditLogs` → basic Excel |

#### 4.1.2 PDF Reports (4 basic types)

| Report | Handler | Permission | Generator |
|---|---|---|---|
| PDF — تقرير الإرساليات | `handleExportPDF` | all | `generateReportHTML` → preview |
| PDF — أداء المحافظات | `handleExportGovPDF` | admin/central | `generateReportHTML` → preview |
| PDF — المستخدمين | `handleExportUsersPDF` | admin/central | `generateReportHTML` → preview |
| PDF — النواقص | `handleExportShortagesPDF` | governorate+ | `generateReportHTML` → preview |
| PDF — التقرير الشامل | `handleExportFullPDF` | admin/central | `generateReportHTML` → preview |

#### 4.1.3 Professional PDF Reports (16 types — from `lib/reports/`)

Each generated by a dedicated function in `apps/admin-web/src/lib/reports/`:

| Report | File | Lines | Purpose |
|---|---|---|---|
| التقرير المركزي الشامل | `central-report.ts` | 203 | All governorates + users + forms + shortages |
| تقرير محافظة (per-gov) | `governorate-report.ts` | 149 | Detail per governorate |
| تحليل نموذج | `form-analysis.ts` | 237 | Per-form field analysis |
| تقرير مديرية | `district-report.ts` | 112 | Per-district breakdown |
| تقرير أداء المشرفين | `supervisor-report.ts` | 272 | Per-supervisor evaluation |
| تقرير الفجوة التغطية | `coverage-gap.ts` | 216 | Where data is missing |
| تقرير مقارنة الحملات | `campaign-comparison.ts` | 189 | Polio vs integrated |
| تقرير النشاط اليومي | `daily-activity.ts` | 123 | Today vs yesterday |
| تقرير جودة البيانات | `data-quality.ts` | 177 | GPS, photos, empty fields |
| تقرير النواقص التفصيلي | `shortages-report.ts` | 165 | Severity breakdown |
| التقرير الأسبوعي | `weekly-report.ts` | 113 | Week summary + comparison |
| تقرير نشاط المستخدمين | `user-activity.ts` | 103 | Logins, activity, dormant |
| تقرير التحديات والصعوبات | `challenges-report.ts` | 559 | Coverage gaps + shortages + dormant + data quality |
| تقرير استمارة الإشراف | `supervision-form-report.ts` | 594 | 8 sections × 33 indicators |
| تقرير تحديات الإشراف الميداني | `supervision-challenges-report.ts` | 377 | Last 3 fields: challenges, actions, recommendations |
| تقرير تقييم المشرفين اليومي | `daily-supervisor-evaluation.ts` | 571 | Daily: central + gov + district |
| تقرير تقييم المشرفين الشامل | `comprehensive-supervisor-evaluation.ts` | 544 | All forms, no date filter |
| التقرير الشامل المدمج للمشرفين | `master-supervisor-report.ts` | 708 | Merges evaluation + yes/no + challenges |
| تقييم إشراف عام | `general-supervisors-evaluation.ts` | 480 | General supervisors only |
| تقييم إشراف محافظات | `governate-supervisors-evaluation.ts` | 189 | Governorate-level supervisors |
| تقييم إشراف مديريات | `district-supervisors-evaluation.ts` | 288 | District-level supervisors |
| تقييم إشراف مركزي | `central-supervisors-evaluation.ts` | 230 | Central-level supervisors |
| تحليل حقول نعم/لا | `yesno-analysis-report.ts` | 548 | Yes/no field analysis per section/gov |
| تقرير الخريطة | `map-report.ts` | 409 | Yemen map + per-gov maps with GPS |

#### 4.1.4 PPTX Reports (4 types)

| Report | File | Slides | Purpose |
|---|---|---|---|
| التقرير الشهري | `pptx-reports.ts` (`generateMonthlyPerformancePPTX`) | 6 | Monthly KPIs + campaign comparison + gov performance + shortages + recommendations |
| النشرة الأسبوعية | `pptx-reports-2.ts` (`generateWeeklyBulletinPPTX`) | 5 | Weekly summary + daily activity + gov ranking + alerts |
| أداء الحملات | `pptx-reports-2.ts` (`generateCampaignPerformancePPTX`) | 7 | Polio vs EPI + dropout analysis + coverage + supply impact + findings |
| التقرير الشامل المدمج | `pptx-master-report.ts` (`generateMasterSupervisorPPTX`) | 8 | Evaluation + yes/no + challenges combined |

#### 4.1.5 Smart Report Builder (5 types — `smart-report-builder.ts`)

Defined but appears underutilized in UI. The `buildSmartReport()` function supports:
- `daily_summary`, `weekly_analysis`, `governorate_comparison`, `shortage_report`, `user_activity`
- Format: PDF or Excel
- Used by scheduled reports edge function conceptually but not directly imported.

#### 4.1.6 Period Comparison Report

`ComparisonReport.tsx` component + `period-comparison.ts` lib:
- Presets: this week vs last, this month vs last, this quarter vs last, custom range
- Metrics: submissions, submitted, draft, users, shortages
- Top improved / declined governorates
- Export to PDF (chart embedded) or Excel

#### 4.1.7 Report Templates System (built-in, `report-templates.ts`)

11 built-in templates with full config (PDF sections + Excel sheets + filters):
`daily_summary`, `weekly_analysis`, `governorate_comparison`, `coverage_report`, `shortage_report`, `user_activity`, `form_performance`, `trend_analysis`, and more.

### 4.2 Report Generation Methods

| Method | Used by | Pros | Cons |
|---|---|---|---|
| **Client-side HTML → jsPDF** | All admin-web PDFs | Fast, branded, previewable | Requires jsPDF runtime, RTL quirks |
| **Client-side HTML → print dialog** | `printReport()` in `shared.ts` | No deps, reliable | User sees print dialog, not direct download |
| **Client-side Excel via `xlsx`** | `styled-excel.ts`, `excel-export.ts` | True .xlsx, conditional formatting | Limited chart support |
| **Client-side CSV (string concat)** | `handleExportForm(format='csv')` | Trivial, universal | No formatting |
| **Client-side PPTX via `pptxgenjs`** | All 4 PPTX reports | True .pptx, charts, tables | Heavy library, no Arabic font embedding |
| **Server-side CSV (Edge Function)** | `export-data` | Auth + rate limit + RLS | Limited to 5000 rows |
| **Server-side CSV/HTML (Edge Function)** | `generate-scheduled-report` | Cron-driven, delivery | Only basic CSV/HTML, no real PDF |
| **Mobile PDF via `pdf` package** | `report_generator.dart` | True PDF, Arabic fonts | Single format, no preview |

### 4.3 Export Formats Summary

| Format | Mobile | Admin Web | Edge Function |
|---|---|---|---|
| PDF | ✅ (`pdf` package) | ✅ (jsPDF + HTML) | ❌ (HTML only, mislabeled) |
| Excel (.xlsx) | ❌ | ✅ (`xlsx` + `styled-excel`) | ❌ (CSV only, mislabeled) |
| CSV | ❌ | ✅ (string concat) | ✅ (`export-data`) |
| PPTX | ❌ | ✅ (`pptxgenjs`) | ❌ |
| HTML | ❌ | ✅ (preview + fallback) | ✅ (scheduled reports) |

### 4.4 Filter Options Across Reports

| Filter | Mobile Dashboard | Admin Reports Page | Scheduled Reports | Edge Functions |
|---|---|---|---|---|
| Campaign type | ✅ (drawer) | ✅ (global context) | ✅ (per-report) | ✅ (campaign_type param) |
| Campaign round | ✅ (drawer, 1-5) | ✅ (global context, 1-10) | ✅ (per-report, 1-5) | ✅ (campaign_round param) |
| Governorate | ❌ (none on dashboard) | ✅ (top filter + per-analytics) | ✅ (multi-select) | ✅ (governorate_id) |
| District | ❌ | ❌ (not exposed) | ❌ | ✅ (district_id in get-advanced-reports) |
| Date range | ❌ (fixed periods) | ✅ (dateFrom/dateTo) | ❌ (uses "today") | ✅ (from_date/to_date) |
| Form ID | ❌ | ✅ (form-exports tab) | ❌ | ✅ (form_id in get-advanced-reports) |
| Status | ❌ | ❌ | ❌ | ✅ (status param) |

### 4.5 Scheduled Reports Functionality

**Architecture:**
- **DB tables:** `scheduled_reports` (config) + `scheduled_report_runs` (history) — migration `028_scheduled_reports.sql`
- **Cron trigger:** pg_cron (migration `030_scheduled_reports_cron.sql`) calls edge function
- **Edge function:** `generate-scheduled-report` (624 lines)
- **Frontend:** `ScheduledReportsPage.tsx` (1068 lines) + `useScheduledReports.ts` (293 lines)

**Features:**
- 8 schedule presets (daily 8am/2pm/6pm, weekly Sun/Thu, monthly 1st/15th, Mon+Wed)
- Custom cron expression input
- 5 delivery methods: download (Storage), email (Resend), WhatsApp (Business API), Telegram (Bot API), webhook
- 8 report types: `daily_summary`, `weekly_analysis`, `governorate_comparison`, `coverage_report`, `shortage_report`, `user_activity`, `form_performance`, `trend_analysis`
- 3 formats: PDF, Excel, both
- Campaign + round + multi-governorate filters per report
- Run history dialog (date, status, records, size, duration, download)
- Active/inactive toggle
- Run now (manual trigger with retry logic — 2 retries, exponential backoff)
- Type distribution pie chart
- Status badges (success/error/running/never-run)
- Error message display

**Critical limitation:** The edge function generates **CSV (mislabeled as Excel)** and **HTML (mislabeled as PDF)** — not real PDF or .xlsx files. This is a major quality gap for email/WhatsApp/Telegram delivery where users expect proper attachments.

### 4.6 Report Templates

**Two separate template systems exist (potential confusion):**

1. **Mobile (`packages/core/lib/src/reports/report_templates.dart`):**
   - 5 templates: `vaccinationCoverage`, `dropoutAnalysis`, `supplyShortages`, `dailyActivity`, `kpiDashboard`
   - Section types: summary, table, chart, barChart, lineChart, pieChart, map, critical, kpiCards, comparison
   - **Status:** Defined but UNUSED (no UI calls `ReportTemplates.all`)

2. **Web (`apps/admin-web/src/lib/report-templates.ts`):**
   - 11+ built-in templates with full PDF + Excel config
   - Template categories: operational, analytical, compliance, custom
   - **Status:** Defined but appears underutilized (ReportsPage builds cards inline, not from templates)

### 4.7 How Reports Connect to the Dashboard

**Mobile:** Dashboard's "تصدير PDF" quick action → `DashboardReportExporter` → `ReportGenerator.generatePDFReport()`. The dashboard passes its current `analyticsData` (campaign/round-filtered) to the report generator. Connection is **tight coupling** — the dashboard screen manually processes readiness/compliance/service/challenges data and passes 4 separate data structures.

**Web:** Reports page is a **separate route** (`/reports`). It uses its own data hooks (`useDashboardStats`, `useGovernorateStats`, `useSubmissionsChart`, etc.) which respect the global campaign context. The dashboard does NOT directly feed reports — they re-fetch with the same filters. Connection is **loose coupling via shared global state** (`useCampaign`).

**Gap:** There's no "generate report from current dashboard view" button on the web dashboard. Users must navigate to `/reports` and re-apply filters. A "Quick Export" button on the dashboard header would streamline this.

---

## 5. Reports System — New Report Proposals

### 5.1 Cold Chain & Vaccine Management Report (NEW)

**Rationale:** The supervision form has `cold_chain_proper`, `vvm_understood`, `vvm_valid`, `vaccine_sufficient` fields. No report currently aggregates cold chain compliance.

**Contents:**
- KPIs: % teams with proper cold chain, % VVM understood, % VVM valid, % vaccine sufficient
- Per-governorate cold chain compliance heatmap
- List of teams with cold chain failures (with photos if attached)
- Recommendations based on failure patterns

**Format:** PDF + Excel  
**Permission:** governorate+

### 5.2 AEFI (Adverse Events) Surveillance Report (NEW)

**Rationale:** Supervision form has `aefi_knowledge`, `aefi_mothers_info` fields. Critical for vaccine safety monitoring.

**Contents:**
- KPIs: % teams with AEFI knowledge, % mothers informed about AEFI
- AEFI cases reported per governorate (if `aefi_cases` field exists)
- Time series of AEFI reports
- Comparison: this round vs previous round

**Format:** PDF + PPTX (for ministry briefings)  
**Permission:** admin/central

### 5.3 Supervisor Performance Leaderboard (NEW)

**Rationale:** Existing `comprehensive-supervisor-evaluation.ts` is detailed but not gamified. A leaderboard would drive engagement.

**Contents:**
- Top 10 supervisors by submission count
- Top 10 by data quality score (GPS + photos + field completion)
- Top 10 by supervision frequency
- Bottom 10 (for follow-up)
- Per-supervisor: avatar, name, governorate, score, trend arrow

**Format:** PDF + Web component (interactive)  
**Permission:** admin/central

### 5.4 Round-over-Round Comparison Report (NEW)

**Rationale:** Current `campaign-comparison.ts` compares polio vs EPI. No report compares Round 1 vs Round 2 vs Round 3 of the same campaign.

**Contents:**
- KPIs: submissions R1 vs R2, coverage %, dropout rate, avg forms per supervisor
- Per-governorate: R1 → R2 delta, improvement/decline
- Visual: side-by-side bar chart per governorate
- Anomaly detection: governorates with > 30% drop

**Format:** PDF + Excel  
**Permission:** admin/central

### 5.5 Mobile Field Activity Heatmap (NEW)

**Rationale:** Map screen exists but no static report captures geographic activity density.

**Contents:**
- Yemen map with governorate color intensity = submission count
- Per-governorate popup: total, submitted, draft, critical shortages
- Zero-coverage governorates highlighted in red
- Time slider (last 7/14/30 days)

**Format:** PDF (embedded map image) + interactive web component  
**Permission:** all

### 5.6 Form Completion Time Analysis (NEW)

**Rationale:** No report analyzes how long supervisors take to fill forms (from `created_at` to `submitted_at`).

**Contents:**
- Avg completion time per form type
- Distribution histogram (0-5min, 5-15min, 15-30min, 30min+)
- Outliers: forms taking > 1 hour (potential data quality issue)
- Per-supervisor avg completion time

**Format:** Excel + PDF  
**Permission:** admin/central

### 5.7 Predictive Coverage Forecast (NEW)

**Rationale:** AI/predictive analytics is a stated platform goal. Use historical data to forecast next round coverage.

**Contents:**
- Forecast: expected submissions for next 7 days (linear regression on last 30 days)
- Forecast: expected coverage % for next round (based on R1→R2 trend)
- Confidence interval
- Risk flag: governorates predicted to drop below 80%

**Format:** PDF + dashboard widget  
**Permission:** admin/central  
**Note:** Could leverage existing `predictive_analytics_engine.dart` in epi_core.

### 5.8 Data Export API Report (NEW — for integrations)

**Rationale:** External systems (DHIS2, WHO) may need structured data export.

**Contents:**
- JSON/XML export of submissions with full schema
- Configurable: which fields, which date range, which governorates
- API key authentication
- Webhook delivery on completion

**Format:** JSON / XML / Parquet  
**Permission:** admin only  
**Note:** This would be a new edge function, not a UI report.

---

## 6. Reports System — Improvement Recommendations

### 6.1 Fix Scheduled Report Output Formats (CRITICAL)

**Problem:** `generate-scheduled-report` edge function generates **HTML for PDF** and **CSV for Excel**. Users receiving email/WhatsApp reports get wrong file types.

**Fix:** 
- For PDF: Use a headless browser (Playwright/Puppeteer) in the edge function to render HTML → PDF. Or use `deno-pdf` library. Or call an external API (Browserless, Rendertron).
- For Excel: Use a Deno-compatible xlsx library (`xlsx` package works in Deno) to generate real .xlsx files.
- Fallback: If PDF generation fails, attach HTML with a note "Open in browser to print as PDF".

### 6.2 Unify Template Systems (HIGH PRIORITY)

**Problem:** Two separate template systems (mobile Dart + web TypeScript) with overlapping definitions and neither fully utilized.

**Recommendation:**
1. Make the web `report-templates.ts` the single source of truth (TypeScript).
2. Expose templates via a Supabase view or Edge Function.
3. Mobile fetches templates from Supabase and dynamically generates reports based on template config.
4. Refactor `ReportsPage.tsx` to render report cards FROM templates instead of inline definitions.
5. Allow admins to create custom templates (already supported in `report-templates.ts` schema but no UI).

### 6.3 Add Report Preview to Mobile (MEDIUM PRIORITY)

**Current:** Mobile generates PDF → immediately shares. No preview.  
**Recommendation:** Add a preview screen (like web's `ReportPreview.tsx`) that shows the PDF in a `PdfViewer` widget before sharing. Users can verify content and choose to share or regenerate.

### 6.4 Add Date Range Filter to Mobile (MEDIUM PRIORITY)

**Current:** Mobile export sheet uses fixed periods (today, last 7 days, last 30 days).  
**Recommendation:** Add a date range picker to the export bottom sheet. Default to last 30 days. Persist last-used range.

### 6.5 Consolidate Excel Export Libraries (LOW PRIORITY)

**Problem:** Two Excel libraries in web: `excel-export.ts` (803 lines, basic) and `styled-excel.ts` (548 lines, themed). Some functions overlap.  
**Recommendation:** Deprecate `excel-export.ts` in favor of `styled-excel.ts`. Migrate `exportToExcel`, `exportFormSubmissionsToExcel`, `exportDashboardReport`, `exportGovernorateReport`, `exportUsersReport` to styled versions (already done for some).

### 6.6 Add Report Scheduling from Reports Page (MEDIUM PRIORITY)

**Current:** User must navigate to `/scheduled-reports` to create a schedule.  
**Recommendation:** Add a "Schedule this report" button on each report card in `/reports`. Opens a dialog prefilled with the report type + current filters. Reduces friction for scheduling.

### 6.7 Add Report Versioning & History (LOW PRIORITY)

**Problem:** Re-running the same report overwrites mental context. No way to compare two runs.  
**Recommendation:** Save last 10 report generations per user in `localStorage` (web) or Hive (mobile). Show "Recently generated" section with one-click re-download.

### 6.8 Internationalize Report Labels (LOW PRIORITY)

**Current:** All report labels are hardcoded Arabic strings.  
**Recommendation:** Move to i18n keys. Support English reports for WHO/UNICEF reporting. The `ReportTemplates` class already has `titleAr` + `titleEn` fields — extend this pattern to all reports.

### 6.9 Add Report Password Protection (LOW PRIORITY)

**Rationale:** Reports contain sensitive supervisor performance data. Email/WhatsApp delivery is unencrypted.  
**Recommendation:** Add optional password protection (user-set password per scheduled report). PDF gets encrypted, Excel gets sheet protection, PPTX gets read-only.

### 6.10 Performance: Pagination for Large Reports (MEDIUM PRIORITY)

**Problem:** `central-report.ts` fetches up to 100,000 submissions in a loop. `bulkFetch` caps at 50,000. This can freeze the browser tab.  
**Recommendation:**
- Show a progress bar during fetch (already done via `ExportProgress`).
- Move heavy computation to a Web Worker.
- Consider server-side generation via edge function for reports > 10,000 rows.

---

## 7. UI/UX Suggestions Per Section

### 7.1 Mobile Dashboard Hero Header

- **Add:** Mini sparkline next to campaign label showing 7-day trend (visual at-a-glance).
- **Add:** Weather/conditions chip (if available — affects field work).
- **Improve:** Notification bell badge caps at "99+" — use "999+" for triple digits or shrink font.
- **Improve:** Greeting emoji could be customizable per user preference.

### 7.2 Mobile KPI Grid

- **Add:** Delta indicator on each KPI (↑ 12% vs yesterday) — already a field in `AnalyticsFilter` response, just not displayed.
- **Add:** Long-press → context menu (export this KPI, view details, set alert).
- **Improve:** Drafts card should be tappable → navigate to drafts list.
- **Improve:** Use color-coded KPIs (green = good, amber = warning, red = critical) based on thresholds.

### 7.3 Mobile Quick Actions

- **Add:** "المسودات" (Drafts) quick action — currently missing despite drafts being a KPI.
- **Add:** "الإشعارات" (Notifications) quick action — currently only accessible via bell icon.
- **Improve:** 5 actions in horizontal scroll — on small screens, the 5th is cut off. Either reduce to 4 visible + "more" or use a 2-row grid.
- **Improve:** Long-press action → show description tooltip.

### 7.4 Mobile Trend Chart

- **Add:** Legend (the chart has no legend — users don't know what the line represents).
- **Add:** Period toggle (7d / 30d / 90d) above the chart.
- **Add:** Tap a data point → navigate to that day's submissions.
- **Improve:** Y-axis labels overlap on small screens — use fewer ticks.
- **Improve:** Empty state is too sparse — add illustration + "ابدأ بإرسال استمارة" CTA.

### 7.5 Admin Reports Page

- **Add:** "Recent reports" sidebar showing last 5 generated reports with one-click re-download.
- **Add:** Bulk export — select multiple report types, generate all in sequence.
- **Improve:** 40+ report cards in one grid is overwhelming. Add categories (Operational / Analytical / Compliance / Supervisor / Map) as a primary filter.
- **Improve:** Favorites feature exists but no "pinned to top" behavior — favorites should sort first.
- **Improve:** Color theme picker is small — make it a dropdown with preview.

### 7.6 Admin Scheduled Reports Page

- **Add:** Calendar view showing upcoming scheduled runs (week view).
- **Add:** Bulk actions (activate/deactivate multiple, delete multiple).
- **Improve:** "Quick Generate" section at top is good but only 4 types — add all 8 types.
- **Improve:** Run history dialog is small — make it full-screen on desktop.
- **Improve:** No way to clone a scheduled report — add "Duplicate" action.

### 7.7 Report Preview Modal

- **Add:** Page navigation (jump to page X of Y) for multi-page reports.
- **Add:** Search within report content.
- **Improve:** Zoom controls only go 50-150% — extend to 25-200%.
- **Improve:** Iframe sandbox is restrictive — some reports may need `allow-popups-with-user-activation`.

### 7.8 Export Progress Indicator

- **Add:** Cancel button for long-running exports.
- **Improve:** Position is `fixed bottom-4` — overlaps with content on mobile. Use toast-style positioning.
- **Improve:** No estimated time remaining — calculate from fetch rate.

---

## 8. Data Flow Diagrams

### 8.1 Mobile Dashboard Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Mobile Dashboard Screen                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ ref.watch()
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              dashboardAnalyticsProvider                          │
│         (FutureProvider.family.autoDispose)                      │
│         Key: AnalyticsFilter(campaignType, campaignRound)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ cache.getMap(key, fetcher, 7 days)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              offlineDataCacheProvider (Hive)                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Cache key: dashboard_analytics_camp_X_round_Y           │   │
│   │  Max age: 7 days                                         │   │
│   │  Invalidated by: forceRefreshProvider('dashboard_...')   │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ cache miss → fetch
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              analyticsServiceProvider.getAnalytics()             │
│              (packages/core/lib/src/analytics/)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP GET
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         Supabase Edge Function: get-analytics                    │
│         (or get-dashboard-stats RPC)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ RPC: get_dashboard_stats(
                              │   p_user_id, p_campaign_type,
                              │   p_campaign_round)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PostgreSQL (Supabase)                          │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│   │ form_submissions│  │ profiles       │  │ forms          │    │
│   │  (RLS-filtered) │  │ (RLS-filtered) │  │ (RLS-filtered) │    │
│   └────────────────┘  └────────────────┘  └────────────────┘    │
│   Filter: campaign_round = N, form_id IN (campaign forms)        │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Mobile PDF Export Data Flow

```
User taps "تصدير PDF"
        │
        ▼
┌─────────────────────────────────────┐
│ DashboardReportExporter             │
│ .showExportSheet()                  │
│ → Bottom sheet with 4 report types  │
└─────────────────────────────────────┘
        │ User picks type
        ▼
┌─────────────────────────────────────────────────────┐
│ DashboardScreen._exportPdfReport()                   │
│                                                      │
│ 1. db.getSubmissions(formId: readiness, limit: 5000) │
│ 2. db.getSubmissions(formId: supervision, limit:5000)│
│ 3. _processReadinessData(subs) → List<ReadinessGov>  │
│ 4. _processComplianceData(subs) → List<Compliance>   │
│ 5. _processServiceNumbersData(subs) → List<Service>  │
│ 6. _processChallengesData(subs) → List<Challenge>    │
└─────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ DashboardReportExporter.generateAndShare()            │
│                                                      │
│ 1. Fetch governorate ranking (analyticsService)      │
│ 2. ReportGenerator.generatePDFReport(                │
│      title, subtitle, period, analyticsData,         │
│      governorateData, readinessData, complianceData, │
│      serviceNumbersData, challengesData)             │
│ 3. Show 30s snackbar with spinner                    │
└─────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ ReportGenerator (packages/core/lib/src/reports/)     │
│                                                      │
│ - Loads Cairo Arabic fonts (regular, bold, light)    │
│ - Builds PDF document with branded header/footer     │
│ - Sections: KPI grid, tables, charts, alerts         │
│ - Uses pdf package (pw.Document)                     │
│ - Saves to temp dir via path_provider                │
│ - Returns File object                                │
└─────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ SharePlus.instance.share(ShareParams(files:[XFile])) │
│ → OS share sheet (WhatsApp, Email, Drive, etc.)      │
└─────────────────────────────────────────────────────┘
```

### 8.3 Admin Web Reports Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ReportsPage (/reports)                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Analytics    │  │ Quick Reports│  │ Form Exports │  ...   │
│  │ Tab          │  │ Tab (40+     │  │ Tab          │       │
│  │              │  │ cards)       │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
        │                                           │
        │ useReportHandlers()                       │ useCampaign()
        ▼                                           ▼
┌──────────────────────────────┐    ┌──────────────────────────┐
│ useDashboardStats(campaign,  │    │ CampaignContext          │
│   effectiveRound)            │    │ - campaign (string)      │
│ useGovernorateStats(campaign,│    │ - campaignRound (number) │
│   effectiveRound)            │    │ - showRoundFilter        │
│ useSubmissionsChart(campaign,│    │ - persisted in localStorage│
│   effectiveRound)            │    └──────────────────────────┘
│ useRoleDistribution()        │
│ useAuditLogs({page:1})       │              │
│ useForms({campaignType})     │              │
│ useFormSubmissionCounts(     │              │
│   campaign, effectiveRound)  │              │
└──────────────────────────────┘              │
        │                                     │
        │ supabase-js queries                 │
        │ with .in('form_id', campaignFormIds)│
        │ and .eq('campaign_round', round)    │
        ▼                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (PostgREST)                      │
│                                                              │
│  All queries respect:                                        │
│  - RLS policies (role-based)                                 │
│  - campaign_type filter (via form_id IN)                     │
│  - campaign_round filter (via .eq)                           │
│  - date filters (via .gte/.lte)                              │
│  - governorate filter (via .eq)                              │
└─────────────────────────────────────────────────────────────┘

User clicks a report card:
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ exportReport(id, fn) — wrapper with toast + loading  │
└─────────────────────────────────────────────────────┘
        │
        ├─── Excel: exportXxxStyledExcel(rows) → xlsx.writeFile()
        │
        ├─── PDF (basic): generateReportHTML(sections) → ReportPreview modal
        │                   → user clicks "Download" → jsPDF.html() → blob → download
        │
        ├─── PDF (professional): enableCaptureMode()
        │                          → generateXxxReport({filters})
        │                          → disableCaptureMode() returns HTML
        │                          → openPreview(title, html, subtitle)
        │
        └─── PPTX: generateXxxPPTX() → pptxgenjs.writeFile()
```

### 8.4 Scheduled Reports Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                pg_cron (Supabase)                            │
│                                                                │
│  Every minute, checks scheduled_reports where:                │
│  - is_active = true                                            │
│  - next_run_at <= now()                                        │
│  - deleted_at IS NULL                                          │
│                                                                │
│  For each due report:                                          │
│  1. Insert scheduled_report_runs (status='running')            │
│  2. Invoke generate-scheduled-report edge function              │
│  3. Update next_run_at based on cron expression                │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP POST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         Edge Function: generate-scheduled-report              │
│                                                                │
│  1. Fetch scheduled_reports config (campaign, round, gov_ids) │
│  2. fetchReportData(supa, report):                             │
│     - 9 parallel queries (subs, users, govs, shortages, etc.) │
│     - Apply campaign_round filter via applyRound() helper      │
│     - Build chart data (30-day grouped)                        │
│  3. Generate content:                                           │
│     - format='excel' → generateCSV() (4 report types supported)│
│     - format='pdf' → generateHTML() (basic template)           │
│  4. Upload to Supabase Storage:                                 │
│     - Bucket: 'reports'                                          │
│     - Path: scheduled-reports/{id}/{filename}                   │
│     - Get public URL                                             │
│  5. Deliver based on delivery_method:                            │
│     - 'download': just save to Storage (no notification)        │
│     - 'email': sendEmail() via Resend API                       │
│     - 'whatsapp': sendWhatsApp() via WhatsApp Business API      │
│     - 'telegram': sendTelegram() via Bot API                    │
│     - 'webhook': sendWebhook() (POST JSON payload)              │
│  6. Update scheduled_report_runs:                               │
│     - status='success' or 'error'                                │
│     - file_url, file_size_bytes, record_count                    │
│  7. Update scheduled_reports:                                    │
│     - last_run_at, last_run_status, run_count                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              scheduled_report_runs table                       │
│                                                                │
│  User can view history in RunHistoryDialog:                    │
│  - Date, status, records, size, duration, download link        │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Filter Integration Recommendations

### 9.1 Current State Summary

| Platform | Campaign Filter | Round Filter | Governorate Filter | Date Filter |
|---|---|---|---|---|
| Mobile Dashboard | Drawer only | Drawer only (1-5) | ❌ | ❌ (fixed periods) |
| Mobile Analytics | Drawer only | Drawer only (1-5) | ❌ | ❌ |
| Admin Dashboard | Global context (sidebar) | Global context (1-10) | Per-widget | ❌ |
| Admin Reports | Global context | Global context | Top bar + per-analytics | Top bar |
| Admin Scheduled | Per-report config | Per-report config | Per-report multi-select | ❌ (uses "today") |
| Edge export-data | Body param | Body param | Body param | Body param |
| Edge get-dashboard | Body param | Body param | ❌ | ❌ |

### 9.2 Recommendations

#### 9.2.1 Surface Campaign + Round on Mobile Dashboard (HIGH)

Add a filter chip row directly on the dashboard (not just drawer):

```
┌─────────────────────────────────────────────────┐
│  [💉 شلل الأطفال ▾]  [🔄 الجولة 2 ▾]  [مسح ✕]  │
└─────────────────────────────────────────────────┘
```

When tapped, opens a bottom sheet picker (same options as drawer). This makes the filter visible and discoverable. The drawer remains for power users.

#### 9.2.2 Allow Round 1-10 on Mobile (MEDIUM)

**Current:** Mobile `CampaignRoundNotifier.selectRound` rejects rounds > 5.  
**Web:** Allows 1-10.  
**Fix:** Align mobile to allow 1-10 (or whatever max the migration supports). Update `_load()` to read from Supabase app_settings without the 1-5 guard.

#### 9.2.3 Add Governorate Filter to Mobile (MEDIUM)

For governorate-level supervisors, the dashboard shows ALL governorates' data (filtered by RLS but still). Add a governorate filter chip (next to campaign/round) that, when set, filters the analytics + trend chart + KPIs.

This requires extending `AnalyticsFilter` (already has `governorateId` field) and passing it in the dashboard's `dashboardAnalyticsProvider` call.

#### 9.2.4 Add Date Range to Mobile Export (MEDIUM)

The export bottom sheet uses fixed periods. Add a "نطاق مخصص" (Custom range) option that opens a date range picker. Pass `startDate` / `endDate` to `ReportGenerator.generatePDFReport()`.

#### 9.2.5 Show Round Filter for All Campaigns on Mobile (LOW)

**Current:** Mobile drawer shows round selector only for `integrated_activity`.  
**Web:** Shows for all campaigns except `all` (per recent fix in `campaign-context.tsx` line 487).  
**Fix:** Align mobile `EpiDrawer` behavior with web — show round selector for `polio_campaign` too (since `campaign_round` column has DEFAULT 1 on all submissions).

#### 9.2.6 Persist Report Filters per User (LOW)

When a user applies filters on `/reports`, save them to `localStorage` (web) / Hive (mobile). Restore on next visit. The web already does this for campaign/round via `CampaignContext` — extend to date range + governorate.

#### 9.2.7 Add Filter to Scheduled Reports "Quick Generate" (MEDIUM)

The "Quick Generate" section on `/scheduled-reports` generates a basic CSV. It doesn't use the global campaign/round context. Pass `useCampaign()` to `handleGenerateClientReport()` so quick-generated reports respect the current filter.

#### 9.2.8 Add District Filter to Admin Reports (LOW)

The edge function `get-advanced-reports` supports `district_id` but the admin UI doesn't expose it. Add a district dropdown (cascading from governorate) in the reports filter bar for granular filtering.

---

## 10. File Inventory

### 10.1 Mobile Dashboard Files

| File | Lines | Role |
|---|---|---|
| `apps/mobile/lib/screens/dashboard_screen.dart` | 507 | Main screen |
| `apps/mobile/lib/screens/dashboard_charts.dart` | 558 | KPI grid, quick actions, trend chart |
| `apps/mobile/lib/screens/dashboard_header.dart` | 297 | Hero header + unused sync banner |
| `apps/mobile/lib/screens/dashboard_report.dart` | 259 | PDF export bottom sheet |
| `apps/mobile/lib/router/app_router.dart` | 626 | MainShell with FABs + drawer |
| `apps/mobile/lib/providers/app_providers.dart` | 792 | All dashboard providers |
| `apps/mobile/lib/screens/analytics_screen.dart` | ~1800 | Deeper analytics screen |

### 10.2 Mobile Report Files (epi_core package)

| File | Lines | Role |
|---|---|---|
| `packages/core/lib/src/reports/report_generator.dart` | 1144 | PDF generation |
| `packages/core/lib/src/reports/report_templates.dart` | 269 | 5 templates (UNUSED) |
| `packages/core/lib/src/reports/form_report_generator.dart` | 710 | Form-specific reports |
| `packages/core/lib/src/reports/word_report_generator.dart` | 97 | Word export (basic) |

### 10.3 Admin Web Report Libraries

| File | Lines | Role |
|---|---|---|
| `apps/admin-web/src/pages/ReportsPage.tsx` | 653 | Main reports hub |
| `apps/admin-web/src/pages/ScheduledReportsPage.tsx` | 1068 | Scheduled reports CRUD |
| `apps/admin-web/src/pages/reports/useReportHandlers.ts` | 488 | Export handlers |
| `apps/admin-web/src/pages/reports/helpers.ts` | 15 | Permission helpers |
| `apps/admin-web/src/pages/reports/index.ts` | 2 | Barrel export |
| `apps/admin-web/src/lib/reports/*.ts` | ~8500 (25 files) | 25 report generators |
| `apps/admin-web/src/lib/reports/shared.ts` | 472 | Shared HTML builders + capture mode |
| `apps/admin-web/src/lib/enhanced-pdf.ts` | 845 | PDF via jsPDF + HTML |
| `apps/admin-web/src/lib/pdf-export.ts` | 382 | Basic PDF export |
| `apps/admin-web/src/lib/pdf-brand.ts` | 86 | Brand colors (mutable) |
| `apps/admin-web/src/lib/pdf-charts.ts` | 333 | SVG chart builders for PDF |
| `apps/admin-web/src/lib/excel-export.ts` | 803 | Basic Excel export |
| `apps/admin-web/src/lib/styled-excel.ts` | 548 | Themed Excel export |
| `apps/admin-web/src/lib/smart-report-builder.ts` | 525 | Smart report builder |
| `apps/admin-web/src/lib/report-templates.ts` | 433 | Template system |
| `apps/admin-web/src/lib/report-colors.ts` | 203 | Color themes |
| `apps/admin-web/src/lib/pptx-reports.ts` | 364 | Monthly PPTX |
| `apps/admin-web/src/lib/pptx-reports-2.ts` | 347 | Weekly + campaign PPTX |
| `apps/admin-web/src/lib/pptx-master-report.ts` | 563 | Master supervisor PPTX |
| `apps/admin-web/src/lib/pptx-index.ts` | 7 | PPTX barrel export |
| `apps/admin-web/src/lib/professional-reports.ts` | 10 | Barrel re-export |
| `apps/admin-web/src/lib/period-comparison.ts` | 260 | Period comparison logic |
| `apps/admin-web/src/lib/bulk-fetch.ts` | 265 | Paginated fetcher |
| `apps/admin-web/src/lib/campaign-context.tsx` | 501 | Campaign + round context |

### 10.4 Admin Web Report Components

| File | Lines | Role |
|---|---|---|
| `apps/admin-web/src/components/reports/ReportCards.tsx` | 223 | Report card + form export card |
| `apps/admin-web/src/components/reports/ReportPreview.tsx` | 294 | Preview modal + hook |
| `apps/admin-web/src/components/reports/ExportProgress.tsx` | 167 | Progress indicator + hook |
| `apps/admin-web/src/components/reports/InteractiveAnalytics.tsx` | 437 | Filter bar + drill-down + fullscreen |
| `apps/admin-web/src/components/reports/ComparisonReport.tsx` | 387 | Period comparison widget |
| `apps/admin-web/src/components/reports/index.ts` | (small) | Barrel export |

### 10.5 Supabase Edge Functions

| File | Lines | Role |
|---|---|---|
| `supabase/functions/generate-scheduled-report/index.ts` | 624 | Scheduled report generation + delivery |
| `supabase/functions/export-data/index.ts` | 254 | CSV export with filters |
| `supabase/functions/get-governorate-report/index.ts` | 70 | Governorate aggregation |
| `supabase/functions/get-advanced-reports/index.ts` | 297 | Submissions + gov performance |
| `supabase/functions/get-dashboard-stats/index.ts` | 74 | Dashboard RPC wrapper |
| `supabase/migrations/028_scheduled_reports.sql` | 167 | Scheduled reports schema |
| `supabase/migrations/030_scheduled_reports_cron.sql` | (separate) | pg_cron setup |

---

## Appendix A: Quick Action Items (Priority-Ordered)

### Critical (do first)
1. **Fix scheduled report output formats** — generate real PDF + .xlsx in edge function (§6.1)
2. **Surface campaign + round filters on mobile dashboard** (§9.2.1)
3. **Expand mobile KPI grid to 6 cards** (§3.1)

### High Priority
4. Wire up `ReportTemplates` class on mobile (§3.6)
5. Unify template systems between mobile and web (§6.2)
6. Add governorate ranking widget to mobile dashboard (§3.3)
7. Add Excel + CSV export to mobile (§3.7)
8. Add "Schedule this report" button on each report card (§6.6)

### Medium Priority
9. Add coverage donut chart to mobile dashboard (§3.4)
10. Add recent activity feed to mobile dashboard (§3.5)
11. Add report preview to mobile (§6.3)
12. Add date range filter to mobile export (§6.4)
13. Add round-over-round comparison report (§5.4)
14. Add supervisor leaderboard report (§5.3)
15. Performance: use isolate for mobile PDF generation (§3.10)

### Low Priority
16. Internationalize report labels (§6.8)
17. Add report password protection (§6.9)
18. Add report versioning & history (§6.7)
19. Consolidate Excel export libraries (§6.5)
20. Add district filter to admin reports (§9.2.8)

---

**End of Audit Report**  
Total files reviewed: 60+  
Total lines analyzed: ~17,500  
Report generated: 2025-01-XX
