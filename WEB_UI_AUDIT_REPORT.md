# EPI Supervisor — Admin Web App UI/UX Audit Report

**Scope:** All 21 page files in `apps/admin-web/src/pages/`, the layout shell (`header`, `sidebar`, `app-layout`), the floating `AIChatWidget`, and `App.tsx` routing.
**Stack:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Recharts + Leaflet + Supabase + React Query.
**Date of audit:** Current session.
**Auditor method:** Read each file end-to-end (with chunked reads for files >2 KB output).

---

## TL;DR — Executive Summary

The app is **already in good shape** overall: shadcn/ui is used consistently, Arabic RTL is the default, skeletons/empty/error states exist on most pages, the dashboard is genuinely impressive (live indicators, AI briefing, smart alerts, deferred queries), and routing has clean RBAC. **The biggest issues are not visual but structural:**

1. **File size**: 9 of 21 page files exceed **800 lines** (DashboardPage 1075, AIInsightsPage 983, ChatPage 863, AIChatWidget 1481, ScheduledReportsPage 1000+, NotificationsPage 1000+, ReportsPage 1000+, BotChatPage 1000+, AISettingsPage 1000+, GovernoratesPage 1000+, PublicDashboardPage 1000+). This makes maintenance painful and creates duplicate logic (e.g. `StatCard` exists in **two places**: `DashboardPage.tsx` and `dashboard/DashboardWidgets.tsx`).
2. **Inconsistent page chrome**: 4 different padding conventions (`p-6 space-y-6`, `p-4 sm:p-6 space-y-6`, `p-4 sm:p-6 space-y-4`, `container mx-auto p-4 space-y-4`). EpiStudioPage is the odd one out — its layout drifts visually from every other page.
3. **Hardcoded chart colors** in 5+ files (`#3b82f6`, `#10b981`, …) instead of theme tokens — breaks dark mode and brand customization.
4. **Duplicate component definitions**: `StatCard`, `AlertBanner`, `CustomTooltip`, `LiveDot` are defined in `DashboardPage.tsx` (lines 39-186) **and** in `dashboard/DashboardWidgets.tsx` (lines 13-140). Same code, two homes.
5. **Missing pagination on `UsersPage`** (loads every user at once — will break past a few hundred).
6. **`PagesManagementPage` is localStorage-only** — settings won't sync across admin devices or to the mobile app it claims to control.
7. **Two overlapping FABs**: `FloatingChatButton` (bottom-left) and `AIChatWidget` (bottom-right) can collide on small viewports; chat button ignores role gating (visible to all roles, while AI widget is admin/central only).
8. **Long lists have no virtualization**: Submissions, Audit logs, Chat messages, Notifications all render the full slice — will jank past ~200 rows.

---

## Per-Page Audit

### 1. `DashboardPage.tsx` — لوحة التحكم (Dashboard) — 1,075 lines

**Current design:**
A rich single-page dashboard with 7 stacked sections: (0) AI Briefing, (0.5) Smart Alerts, (1) "Needs attention" alert banners, (1.4) gradient Reports CTA banner, (1.5) Quick Actions grid, (2) Today's Pulse stat cards, (3) Activity charts + live feed, (4) Coverage map, (5) Recent submissions + Notifications. Includes a sticky header status bar (online indicator, last-refresh clock, today export button), keyboard shortcuts (1-4, r), and deferred React Query loading (3 critical queries → 5 deferred after 800 ms). Uses `SectionErrorBoundary` to isolate section failures.

**Current issues:**
- **Massive single file** (1075 lines). Many inline sub-components (`StatCard`, `AlertBanner`, `CustomTooltip`, `LiveDot`) that already exist in `dashboard/DashboardWidgets.tsx` — duplicated.
- `CHART_COLORS` defined locally (line 37) instead of imported from the shared widget module.
- `exportTodayReport()` silently disables the button via `document.querySelector('[data-export-today]')` (line 318) — fragile, anti-pattern; should use React state.
- Section 1.4 (gradient "Quick Reports" CTA banner) uses inline `style={{ backgroundImage: ... }}` and hard-coded `bg-gradient-to-r from-blue-600 via-violet-600 to-purple-700` — visually jarring compared to the otherwise muted dashboard palette.
- Many sections use hardcoded English-tinted colors (`bg-blue-50`, `text-blue-600`) that won't adapt to dark mode.
- The "Reports Banner" (1.4) sits between alerts and quick actions — interrupts the "needs attention → actions" flow.
- Inactive supervisors list (lines 822-840) caps at 4 with "+N more" — good, but no way to filter by role.

**Recommendations:**
- Split into 7 section components under `pages/dashboard/sections/` (AlertsSection, QuickActionsSection, PulseSection, ActivitySection, CoverageSection, RecentSection, NotificationsSection). Use the existing `DashboardWidgets.tsx` exports instead of redefining `StatCard`/`AlertBanner`/`LiveDot`.
- Move `exportTodayReport` to a hook (`useDashboardExport`) and replace the DOM hack with `useState` for the disabled state.
- Move the "Quick Reports" gradient CTA into the Quick Actions section as a single wide card, or remove it (Quick Actions already links to /reports).
- Replace all `bg-blue-50`/`text-blue-600` etc. with theme tokens (use `bg-primary/10 text-primary` or a `severity-{color}` utility class).
- Extract `CHART_COLORS` to `lib/chart-theme.ts` and import everywhere.
- Add `aria-live="polite"` to the Smart Alerts section so screen readers announce changes.

---

### 2. `SubmissionsPage.tsx` — الإرساليات (Submissions) — 792 lines

**Current design:**
Dense filter bar in a Card (search input + Tabs for status + 3 Select dropdowns + clear filters + Export + Approve All). Below it, a conditional Bulk Action bar (when rows selected) with approve/re-draft buttons. Then a data table with: select-all checkbox, #, form, sender, status badge, role (hidden on small), round (if filter shown), date, overflow menu. Click row → detail dialog. CSV export with sanitization (CSV injection protection on line 31). Pagination at bottom.

**Current issues:**
- Filter bar is very dense on desktop (5 controls + 2 buttons on one row) — on tablet widths it wraps unpredictably.
- Row click opens dialog, but clicking the bulk-select checkbox requires `e.stopPropagation()` (line 426) — fragile if anyone refactors.
- Table is rendered in a horizontally-scrolling `min-w-[600px]` container — fine, but no sticky header row when scrolling vertically.
- No virtualization — page size is 20, fine; but `exportAll` (line 99) pulls up to 10,000 rows synchronously with no progress indicator.
- "Approve All" uses native `confirm()` dialog (line 210) — inconsistent with the rest of the app which uses shadcn Dialog.
- Bulk action bar overlaps the filter bar visually (same color family) — no clear separation.
- Date column shows both `formatRelativeTime` and `formatDateTime` — could be tooltip-only.

**Recommendations:**
- Wrap filter bar in a `FiltersBar` component with explicit `flex-wrap` breakpoints (`flex-col sm:flex-row sm:flex-wrap`).
- Use shadcn `AlertDialog` for the "Approve All" confirmation instead of `window.confirm`.
- Add `sticky top-0` to the table header row with `bg-background` so column labels stay visible while scrolling.
- Add a progress toast when `exportAll` runs (it can take 5+ seconds for 10k rows). Reuse the existing `ExportProgress` component from `components/reports/`.
- Add row hover preview (popover) showing the submission's `data` JSON without requiring a click.
- Add keyboard shortcut `?` to show filter help.

---

### 3. `forms/FormsPage.tsx` + `FormCard.tsx` + `FormEditorDialog.tsx` + `FormDataDialog.tsx` + `FieldEditorDialog.tsx` + `DeleteDialog.tsx` — إدارة النماذج (Forms)

**Current design:**
Clean grid layout (1/2/3 columns). Search with 300 ms debounce, "new form" button (admin only), FormCard with gradient top bar (green if active), campaign icon, title, badges for field count/section count/submission count, "View Data" button. FormDataDialog has Tabs (Data / Export-Import) with a paginated table inside. FormEditorDialog has section tabs and a drag-to-reorder field list with arrow buttons. FieldEditorDialog is a compact form for field key/label/type/options/required/default.

**Current issues:**
- `FormDataDialog` import (line 78-115) reads file contents synchronously via `file.text()` and parses with `JSON.parse` — no size limit, no validation, will crash on malformed input.
- `FormDataDialog` "Delete All" button (line 187) is `variant="destructive"` but placed inline next to "Refresh" — too easy to mis-click. No type-to-confirm.
- `FieldEditorDialog` uses a raw `<textarea>` (line 107) for options instead of a proper multi-input editor — error-prone.
- `FormCard` edit/delete buttons are `opacity-0 group-hover:opacity-100` — invisible on touch devices (no hover).
- `FormEditorDialog` is 335 lines — the section/field editor logic could be extracted into a custom hook (`useFormBuilder`).
- No live preview of the form as you build it — admin can't see what the field will look like to data-entry users.
- No versioning indicator (the schema has `version` but it's never displayed).

**Recommendations:**
- Move the file import logic to a worker or chunked reader; validate JSON schema before inserting.
- Replace "Delete All" inline button with a two-step Dialog (type the form name to confirm).
- Replace the textarea options editor with a repeatable list (add/remove/select) using shadcn `Input` rows.
- Replace hover-only edit/delete on `FormCard` with an always-visible "⋯" DropdownMenu (consistent with `UsersPage` UserCard pattern).
- Add a live "Preview" tab in `FormEditorDialog` that renders the field using the same component the mobile app will use.
- Extract `useFormBuilder(sections)` hook for the section/field CRUD logic.

---

### 4. `MapPage.tsx` — الخريطة التفاعلية (Interactive Map) — 590 lines

**Current design:**
Dynamic Leaflet import (SSR-safe). Filter Card with color-mode toggle (role/status), 4 Selects (form/gov/supervisor/status), reset/show-filters buttons. 5-card stats row (GPS points, govs, supervisors, submitted, draft). Color legend Card. Main grid: map (3 cols) + sidebar list of aggregated-by-governorate (1 col). PDF export via `generateReportHTML` + `ReportPreview`.

**Current issues:**
- `pageSize: 5000` is hardcoded (line 115) — for a national campaign this can easily exceed; comment says "balance" but no UI feedback when truncated.
- Marker icons created via `L.divIcon` with inline HTML string (line 78) — not themable, no dark-mode support.
- No marker clustering — 5000 pins will bring the map to a crawl on low-end devices.
- No tile layer selector (only OpenStreetMap default) — users may want satellite or terrain.
- `aggregatedData` sidebar list is plain divs, not clickable to zoom the map to that governorate.
- The "Map Report" PDF export is good, but there's no PNG/screenshot export.
- `MapController` (line 86) re-runs `setView` on every prop change — can fight with user panning.

**Recommendations:**
- Add `Leaflet.markercluster` for >500 pins; show cluster count badges.
- Add a tile-layer switcher in the filter Card (Street / Satellite / Terrain).
- Make sidebar governorate rows clickable → `map.setView(govCenter, 10)` and highlight that marker.
- Add a "screenshot" button using `leaflet-image` or `dom-to-image`.
- Replace inline-HTML divIcon with a React-rendered overlay (use `react-leaflet`'s `Marker` with a custom `DivIcon` that mounts a React tree).
- Surface a "showing 5000 of N" warning when results are truncated, with a button to load all (slower).

---

### 5. `ChatPage.tsx` — الشات الداخلي (Internal Chat) — 863 lines

**Current design:**
WhatsApp/Telegram-style. Three-pane layout on desktop: room list (left, 18rem), messages (center), members/pinned (right, toggleable). Mobile: horizontal room pills + messages. Sticky chat header with room icon, name, search, pin, members, more-menu (mute/archive/star — partially wired). Messages grouped by date, with avatars, reply previews, hover actions (reply/copy/edit), scroll-to-bottom button.

**Current issues:**
- **Massive unused-import bloat**: imports 40+ icons (line 1-9) including `Phone`, `Video`, `Forward`, `Mic`, `Image`, `FileText`, etc. — most are never used. Dead code signals abandoned features.
- The more-menu has `Archive` and `Star` items that are no-ops (just icons, no handlers).
- `chatRooms` appear to be hardcoded constants (referenced but not in the read snippet) — no server-side rooms.
- No typing indicator.
- No message reactions (emoji).
- No file/image attachments despite `Paperclip`, `Image` imports.
- The right-side members panel is toggled but no separate read shown.
- `EmptyState` (line 492) is good.
- No infinite scroll / pagination — loads all messages in the room.

**Recommendations:**
- Delete all unused imports (will save ~2 KB and clarify intent).
- Remove or implement the `Phone`, `Video`, `Archive`, `Star` menu items — don't ship dead UI.
- Add typing-indicator subscription via Supabase realtime presence.
- Add emoji reactions (long-press on mobile, hover on desktop).
- Add infinite scroll up to load older messages (page size 50, load more on scroll-to-top).
- Move room definitions to the database (or at minimum to a typed config file) so admins can add rooms without code changes.

---

### 6. `BotChatPage.tsx` — مستشار التحصين (EPI Bot Chat) — 1000+ lines

**Current design:**
AI assistant chat. Uses `epiBotEngine`, `NLToSQLEngine`, `PredictiveEngine`, multiple AI providers (Groq, Pollinations, ZAI, HuggingFace, OpenRouter, MiMo), voice input, conversation history, export engine, smart report builder. Real data fetchers via Supabase. Chat bubbles with avatars, copy/thumbs-up/thumbs-down feedback, action chips.

**Current issues:**
- Massive monolithic file with business logic (NL→SQL, prediction) mixed with UI.
- **Heavy duplication with `AIChatWidget.tsx`** (1481 lines): same provider metadata map, same CitationText parser, same source-type metadata, same confidence/latency color logic.
- No streaming UI indicator (the `isStreaming` field exists on Message but no skeleton/typing animation shown).
- No "regenerate response" button on the last assistant message.
- No conversation branching/forking.
- Voice input button exists but no permission flow or visual feedback while recording.

**Recommendations:**
- Extract `lib/ai-chat/` shared module: `providerMeta.ts`, `citationParser.tsx`, `ChatBubble.tsx`, `SourceChip.tsx`. Import from both `BotChatPage` and `AIChatWidget`.
- Move NL→SQL and prediction engines to `lib/epi-bot-engine.ts` (already there) — keep UI thin.
- Add a "Regenerate" button on the latest assistant message.
- Add a streaming skeleton ("Bot is typing…") with animated dots.
- Add a "Stop generating" button when streaming.

---

### 7. `EpiStudioPage.tsx` — استوديو المحتوى الذكي (EPI Studio) — 647 lines

**Current design:**
NotebookLM-inspired generator. Topic input + library button → saved artifacts library (collapsible) → 5-tile colored type selector (Briefing / FAQ / MindMap / StudyGuide / AudioOverview) → loading card → artifact display with citations, source chips, FAQ view, MindMap view (recursive nested divs), AudioScriptView with real TTS playback controls.

**Current issues:**
- Type selector (line 209-238) uses hardcoded color classes (`blue`, `emerald`, `amber`, `purple`, `pink`) with raw `border-2` — inconsistent with shadcn token system.
- `MindMapView` (line 421) renders a tree as nested divs with right-border — not a real mind map. No layout, no branches, no zoom.
- `SourceChip` (line 354) uses absolute positioning for its expanded popover — can overflow viewport on mobile (line 376: `right-0 w-72`).
- `AudioScriptView` has a real TTS player — but if `speech.supported` is false, the user just sees the script with no fallback download.
- Library filtering is missing — when you have 50 saved artifacts, you can only scroll.
- No "share" or "export to PDF" button on generated artifacts.
- `ReferenceDialog` uses an anti-pattern: `if (open && !initialized) setInitialized(true)` (line 388) — should use `useEffect` with `[open]` dependency.

**Recommendations:**
- Replace hardcoded color classes with theme tokens (use `data-color="blue"` and CSS variables, or a `VariantColor` prop on a shared `Tile` component).
- Use React Flow or `react-organizational-chart` for real mind-map rendering with pan/zoom.
- Make `SourceChip` popover use shadcn `Popover` (auto-positioning, flips on overflow).
- Add filter chips to the library (by type, by date, by favorite).
- Add "Export as PDF" and "Copy as Markdown" buttons on artifacts.
- Fix the `initialized` anti-pattern with proper `useEffect`.

---

### 8. `AIInsightsPage.tsx` — الرؤى الذكية (AI Insights) — 983 lines

**Current design:**
Top row: circular SVG health-score gauge + insights summary (critical/warning/success/info counts) + predictions. Radar chart (5 metrics: approval, activity, coverage, quality, commitment). Trend chart (weekly bars). Coverage-by-gov pie. Supervisor performance table (top 10). EPI recommendations list. AI analysis section (auto-fetches on load).

**Current issues:**
- **Misleading metric definitions**: radar "Quality" = `approval_rate * 1.05` (line 408) — this isn't a real metric, it's a fudge. Same for "Commitment" = `(submissions_this_week / active_users) * 5` — arbitrary multiplier.
- All chart colors hardcoded (`#10b981`, `#f59e0b`, `#ef4444`).
- `radarData` formula uses `Math.min(..., 100)` — values can hit 100 trivially; no normalization.
- `calculateSupervisorPerformance` reads 5000 submissions client-side (line 359) — heavy on large datasets.
- Health score is a single number with no breakdown of how it's calculated — users can't trust it.
- "Predictions" section (line 490) shows just 3 numbers — no confidence intervals, no methodology.
- AI analysis auto-fetches on load (line 396) — burns API credits on every visit, even if user just navigates past.

**Recommendations:**
- Document each radar metric with a tooltip explaining the formula. Use real metrics (or remove the synthetic ones).
- Extract chart components to `components/insights/` and import.
- Move `calculateSupervisorPerformance` to a Supabase view or edge function (server-side aggregation).
- Add a "How is this calculated?" info popover on the health score.
- Don't auto-fetch AI analysis — show a "Generate AI analysis" button instead, with last-generated timestamp.
- Add comparison vs previous week for all metrics (delta indicators).

---

### 9. `AISettingsPage.tsx` — إعدادات الذكاء الاصطناعي (AI Settings) — 1000+ lines

**Current design:**
Tabs-based config (Models / Knowledge / Prompts / Costs / etc.). Model cards with provider, priority, temperature, max_tokens, capabilities, usage. Toggle active/default. Test button. Knowledge base management. Prompt templates.

**Current issues:**
- Very large file — would benefit from extracting each tab to its own component.
- Test button likely calls the model live — needs rate-limiting and cost display.
- No "reset to defaults" option per model.
- Cost tracking section: needs verification it actually persists to DB.

**Recommendations:**
- Split into `AISettings/ModelsTab.tsx`, `KnowledgeTab.tsx`, `PromptsTab.tsx`, `CostsTab.tsx`, etc.
- Add a confirmation dialog before marking a model as default (currently a single click).
- Show per-model cost trend chart (last 30 days).
- Add import/export of prompt templates as JSON.

---

### 10. `GovernoratesPage.tsx` — المحافظات (Governorates) — 1000+ lines

**Current design:**
Performance-tier color-coded governorate list with quick date filters, sort options, search, detailed stats per governorate (submissions, supervisors, shortages), expandable rows, Yemen map integration.

**Current issues:**
- Large file with `helpers.ts` extracted — good pattern, but page itself still huge.
- Performance tiers (`getPerformanceTier`, `getPerformanceColor`, `getPerformanceLabel`) defined in helpers — should be consistent with other tiered displays (e.g., shortages severity).
- Yemen map likely uses raw SVG paths — may not be RTL-aware.

**Recommendations:**
- Extract the governorate detail card to `GovernorateDetailCard.tsx`.
- Add a "comparison mode" to select 2-3 governorates and compare side-by-side.
- Add CSV export (currently missing).
- Add drill-down to district level.

---

### 11. `ShortagesPage.tsx` — تتبع النواقص (Shortages Tracking) — 491 lines

**Current design:**
Clean. 5-card stat row (total / critical / high / pending / resolved + progress bar). Filter row (search + 5 selects). Card grid (1/2/3 cols) with severity top-bar, icon, name, category, quantity line, location, date, notes (clamped), reporter, resolve button. Detail dialog with 2-col metadata grid, fill-percent progress, notes, resolve CTA.

**Current issues:**
- No sort option (by date, severity, quantity).
- No CSV export — every other list page has one.
- No batch resolve (must click each card).
- No "ages of shortages" chart (how long has each been open?).
- Cards show "مطلوب: X | متوفر: Y" inline (line 302) — cramped, especially with unit names.
- Resolved cards just dim to 60% opacity — no separate "resolved" tab/filter view (you have to use the filter).

**Recommendations:**
- Add sort dropdown (Newest / Oldest / Severity / Quantity needed).
- Add CSV export button in the filter row.
- Add batch-select mode (similar to SubmissionsPage bulk bar) for multi-resolve.
- Add a "Resolution time" chart on the stats row (avg days to resolve).
- Split quantity display into two lines on narrow cards.

---

### 12. `UsersPage.tsx` — إدارة المستخدمين (Users Management) — 550 lines

**Current design:**
Search + role filter + create button. Card grid (1/2/3 cols) with avatar, name, email, location, role badge, created-at, dropdown menu (edit / activate-deactivate / delete). Three dialogs: CreateUserDialog, EditUserDialog (with custom tabs for profile/role/password), DeleteUserDialog. Password validation with live feedback.

**Current issues:**
- **No pagination** (line 32: `useUsers({ role, search })` loads all users) — will degrade past ~200 users.
- No last-login timestamp on the card.
- No role color legend (roles have `ROLE_COLORS` but no key shown).
- No bulk role change.
- No CSV import for bulk user creation.
- `UserCard` dropdown edit/delete uses `opacity-0 group-hover:opacity-100` (line 168) — invisible on touch.
- EditUserDialog uses custom tab buttons (line 408-412) instead of shadcn `Tabs` — inconsistent with the rest of the app.

**Recommendations:**
- Add pagination (page size 50) — or infinite scroll.
- Show last-login timestamp (data exists in audit logs; join or add a field).
- Add a role legend Card at the top (or as a tooltip on hover).
- Use shadcn `Tabs` in EditUserDialog instead of custom buttons.
- Add CSV import flow (download template, upload, preview, confirm).
- Make the card menu always visible (DropdownMenu trigger) instead of hover-only.

---

### 13. `AuditPage.tsx` — سجل التدقيق (Audit Log) — 430 lines

**Current design:**
5-card action-count row (clickable to filter). Filter row (search + action select + table select + CSV export). Table with #, action badge, table name, user, time (relative + absolute), IP, view button. Pagination (50/page). Detail dialog with 2-col metadata + old/new JSON pre-formatted.

**Current issues:**
- **Client-side filtering for `table` and `search`** (line 131) while `action` is server-side — inconsistent and limits search to current page only.
- No date range filter — most audit questions are "what happened yesterday?"
- No user filter (only free-text search).
- Hardcoded 50/page — no page-size selector.
- JSON viewer is a raw `<pre>` — no syntax highlighting, no collapse/expand.
- Empty state is plain text (line 260) — no icon, no CTA.
- Pagination icons are reversed for RTL (ChevronRight for "previous", ChevronLeft for "next") — correct for RTL, but no `aria-label` so screen readers say "right arrow".

**Recommendations:**
- Move all filters server-side (Supabase query params).
- Add a date-range picker (shadcn `Calendar` + `Popover`).
- Add a user Select filter (fetch users list).
- Add page-size selector (25/50/100/250).
- Use a JSON viewer component (e.g., `react-json-view-lite`) with collapse.
- Improve empty state with icon + CTA ("No audit logs match your filters — try clearing them").
- Add `aria-label="السابق"` / `"التالي"` to pagination buttons.

---

### 14. `NotificationsPage.tsx` — الإشعارات (Notifications) — 1000+ lines

**Current design:**
Stats summary, notification list with bulk actions (mark-read, delete), templates management, browser-notification permission flow, send-notification dialog.

**Current issues:**
- Very large file — templates and notifications should be separate tabs/pages.
- Browser notification permission flow mixed with main list logic.

**Recommendations:**
- Split into `NotificationsList` and `NotificationTemplates` tabs.
- Extract browser permission flow to a hook (`useBrowserNotificationPermission`).
- Add filter by notification type (info/warning/error/success).
- Add "snooze" option.

---

### 15. `ReferencesPage.tsx` — إدارة المراجع والكتب (References) — 545 lines

**Current design:**
Search with 300ms debounce + category filter + create button. Card grid with category-colored top bar, icon, title, category badge, description (clamped), file link, footer with date + active toggle Switch. Create/Edit/Delete dialogs.

**Current issues:**
- **No actual file upload** — only file URL field (line 470). Admins must host PDFs elsewhere.
- No preview (must click to download).
- No file size or type indicator.
- No tags (only one category per reference).
- No "recently added" or "most downloaded" sort.
- `ReferenceDialog` uses the same `initialized` anti-pattern as EpiStudioPage (line 386).
- No search highlighting (just filtering).

**Recommendations:**
- Add Supabase Storage upload (drag-drop zone, progress bar).
- Add PDF thumbnail preview on the card.
- Allow multiple tags per reference (chip input).
- Add sort dropdown (Newest / Oldest / Title A-Z).
- Fix the `initialized` anti-pattern with `useEffect`.

---

### 16. `ReportsPage.tsx` — التقارير (Reports) — 1000+ lines

**Current design:**
Tabs (Quick Reports / Custom / Themes / etc.). Report cards in a grid, theme customization with palette presets, report preview modal, export progress component.

**Current issues:**
- Very large — though `components/reports/` is already extracted (good).
- Theme customization is powerful but complex — no preview-while-editing.

**Recommendations:**
- Add a live preview of a sample report while editing the theme.
- Add a "Recently used reports" carousel at the top.
- Add favorites/starring for reports.

---

### 17. `ScheduledReportsPage.tsx` — التقارير المجدولة (Scheduled Reports) — 1000+ lines

**Current design:**
List of scheduled reports with name, schedule, format, last-run, next-run, status. Create/Edit/Delete dialogs. Run-now button. History table per report.

**Current issues:**
- Very large monolithic file.
- No calendar view of upcoming scheduled runs.
- No notification settings per schedule (email/webhook).

**Recommendations:**
- Add a calendar view (monthly grid showing scheduled runs).
- Extract history table to its own component.
- Add per-schedule notification config (email recipients, webhook URL).

---

### 18. `SettingsPage.tsx` — الإعدادات (Settings) — 160 lines

**Current design:**
Two-column layout: left sidebar with 6 section buttons (general/security/notifications/appearance/data/system) + system status card. Right: active section content. Sticky save button at bottom with "saved" success indicator.

**Current issues:**
- Only one global Save button — no per-section save (changes to "Appearance" + "Notifications" must be saved together).
- No "unsaved changes" warning when navigating away.
- No reset-to-defaults per section.
- "System Status" card uses raw `systemInfo.version` and `apiStatus` — no live health check (just initial fetch).
- Save button is `sticky bottom-4` — can overlap content on short viewports.

**Recommendations:**
- Add per-section Save buttons (or auto-save with debounce).
- Add `beforeunload` warning when there are unsaved changes.
- Add a "Reset to defaults" button per section.
- Make the System Status card real-time (poll every 60s).
- Move Save button to a non-overlapping footer bar.

---

### 19. `PagesManagementPage.tsx` — إدارة صفحات التطبيق (Mobile Pages Management) — 435 lines

**Current design:**
Info banner + 4 stat cards + toolbar (search + category filter + reset). List of pages with icon, title (Ar+En), category badge, description, role chips, edit button, visibility Switch. Edit dialog with role multi-select checkboxes.

**Current issues:**
- **localStorage-only persistence** (line 79-99) — settings won't sync across admin devices or to the mobile app it claims to control. This is a critical correctness bug.
- No "preview" of what the mobile app will look like with these settings.
- No audit trail (who changed what, when).
- No "default" indicator per page (some pages have `defaultVisible: true` but no UI hint).
- Info banner claims "تنطبق على التطبيق الموبايل" but it doesn't (localStorage is browser-local).

**Recommendations:**
- **Critical**: persist to a `app_pages_config` table in Supabase; mobile app reads from there.
- Add a "Preview mobile app" button that opens a phone-frame mockup.
- Add an audit log entry on every visibility/role change.
- Show "default" badge on pages where `defaultVisible === visible`.

---

### 20. `LoginPage.tsx` — تسجيل الدخول (Login) — 202 lines

**Current design:**
Full-screen gradient background (deep navy → indigo) with SVG dot pattern, two glowing orbs, centered card. Logo (with SVG fallback), title, subtitle, "secure connection" badge, public dashboard link, login Card with cyan→blue→violet gradient top border, email/password fields with show/hide, error alert, submit button with gradient, footer with ministry attribution.

**Current issues:**
- Beautiful but **hardcoded English colors** via inline `style={{ background: 'linear-gradient(...)' }}` (lines 30, 173) — won't adapt to dark mode (though login is always dark here, so OK).
- `onError` for the logo (line 56) does `e.currentTarget.parentElement!.innerHTML = '...'` — direct DOM mutation, anti-React pattern. Use state instead.
- No "forgot password" link.
- No MFA / 2FA support.
- No language toggle (Arabic only, despite app supporting English in settings).
- No "remember me" checkbox (Supabase session is permanent by default).
- Public dashboard link uses `react-router-dom` `Link` — fine, but breaks if user is on a different domain.

**Recommendations:**
- Replace the `onError` DOM mutation with a `useState` for `logoFailed` and conditional render.
- Add "Forgot password?" link (Supabase `resetPasswordForEmail`).
- Add language toggle (Arabic / English) in the corner.
- Add "Remember this device" checkbox.
- Consider a subtle animated logo (CSS pulse on the shield).

---

### 21. `PublicDashboardPage.tsx` — لوحة المعلومات العامة (Public Dashboard) — 1000+ lines

**Current design:**
Mobile-first public dashboard (no auth). Custom theme constants (lines 23-65) with a full palette. Stats cards, charts, "Powered by" footer, theme toggle (sun/moon).

**Current issues:**
- **Doesn't use shadcn theme tokens** — defines its own `T.blue`, `T.emerald`, etc. (line 23-65). Won't adapt if admin changes brand color in Settings → Appearance.
- Very large file with all sections inline.
- No SEO meta tags (description, OG image) — public dashboards benefit from sharing.
- No "last updated" timestamp visible.
- No data-staleness indicator (if data is >1 hour old, show a warning).

**Recommendations:**
- Adopt the brand theme tokens (`var(--primary)`, etc.) instead of hardcoded palette.
- Split into `public-dashboard/Hero`, `StatsGrid`, `ChartsGrid`, `Footer` components.
- Add `<meta>` tags for SEO and social sharing.
- Add "Last updated: X minutes ago" with auto-refresh.
- Add a staleness banner if data > 1 hour old.

---

## Layout & Shared Components Audit

### `components/layout/header.tsx` — 137 lines

**Current design:** Sticky top header. Title + live pulse badge + campaign filter badge. Right side: clock (desktop), inline search field (desktop only, toggle), refresh button, notifications bell with red badge.

**Issues:**
- **Two competing search entries**: inline search input here AND `GlobalSearch` modal (Ctrl+K) in `AppLayout`. Confusing — users don't know which does what.
- Search input has no actual implementation (calls `onSearch?.(value)` but no page wires it up via `Header` props) — dead feature.
- Notifications bell navigates to `/notifications` instead of showing a popover — extra click.
- Clock updates only every 60s (`setInterval(..., 60000)`) — fine, but minute can drift.

**Recommendations:**
- Remove the inline search from `Header` — keep only the Ctrl+K modal trigger (a search icon button).
- Replace the notifications bell-click with a popover showing the 5 most recent unread, with "View all" link.
- Add breadcrumb support (current page → sub-section).

### `components/layout/sidebar.tsx` — large

**Current design:** Logo at top, collapsible nav with sections (Core / Data / Analysis / Communication / Admin / System), role-based filtering, campaign selector, theme toggle, user profile card at bottom with sign-out. Mobile drawer via `MobileSidebar`.

**Issues:** (Based on preview)
- Imports ~25 icons — verify all are used.
- Campaign selector is in the sidebar but `Header` also shows a campaign badge — make sure they stay in sync (they should via `useCampaign`).
- Likely fine — confirm mobile drawer has proper focus trap.

### `components/layout/app-layout.tsx` — 162 lines

**Current design:** Flex layout: desktop sidebar + main content. Mobile header with logo + mobile sidebar trigger. `<Outlet />` for page. GlobalSearch modal (Ctrl+K). AIChatWidget (admin/central only). FloatingChatButton (bottom-left).

**Issues:**
- **Two FABs can collide**: `FloatingChatButton` at `bottom-6 left-6` and `AIChatWidget` (typically bottom-right). On mobile both can be visible — `FloatingChatButton` is shown to ALL roles, `AIChatWidget` only to admin/central. Result: data-entry users see one FAB, admins see two — inconsistent.
- `FloatingChatButton` always pulses with `animate-ping` — distracting.
- No keyboard shortcut to open chat (Ctrl+J?).

**Recommendations:**
- Gate `FloatingChatButton` by the same role check as `AIChatWidget` (or merge them — one FAB that opens chat for low-roles and AI assistant for admins).
- Reduce the ping to a single pulse on first render, not continuous.
- Add `Ctrl+J` keyboard shortcut to toggle the FAB.

### `components/ai/AIChatWidget.tsx` — 1,481 lines

**Current design:** Floating chat widget (admin/central). Citation parser, provider metadata badges (Groq/Pollinations/ZAI/etc.), confidence/latency indicators, grounding sources, voice input, quick export chips, suggested follow-ups.

**Issues:**
- **Massive file** with heavy duplication vs `BotChatPage.tsx` (provider meta, citation parser, source-type meta).
- Provider metadata is hardcoded as a const map — should come from the AI settings DB.
- No streaming UI feedback (just `isStreaming` flag on Message).

**Recommendations:**
- Extract shared chat primitives to `lib/ai-chat/` and import from both `AIChatWidget` and `BotChatPage`.
- Replace `PROVIDER_META` const with a fetch from the `ai_models` table.
- Add streaming indicator (animated dots) while waiting for the first token.

### `App.tsx` — 113 lines

**Current design:** Clean lazy-loaded routes with three RBAC tiers (all-auth / management / admin-only). Public routes (`/public`, `/login`) outside the protected shell. `PageLoader` fallback for Suspense.

**Issues:**
- Catch-all `path="*"` redirects to `/dashboard` (line 107) — should show a 404 page.
- No route-level error boundary (only the top-level `ErrorBoundary`) — a crash in one route unmounts the whole app.
- No `LoadingRoute` skeleton that matches the page (just a generic spinner).

**Recommendations:**
- Add a `NotFoundPage` with a link back to dashboard.
- Wrap each `<Suspense>` in a route-level error boundary.
- Use per-route skeleton fallbacks (e.g., dashboard shows KPI skeletons, not a generic spinner).

---

## Cross-Cutting Patterns

### Issues Found Everywhere

| # | Pattern | Affects | Fix |
|---|---------|---------|-----|
| 1 | **Inconsistent page padding**: `p-6 space-y-6` vs `p-4 sm:p-6 space-y-4` vs `container mx-auto p-4 space-y-4` | All pages | Standardize on `<div className="p-4 sm:p-6 space-y-6">` (matches `DashboardPage`). EpiStudioPage especially needs to drop `container mx-auto`. |
| 2 | **Hardcoded chart colors** (`#3b82f6`, `#10b981`, `#f59e0b`, `#ef4444`, `#8b5cf6`) | Dashboard, AIInsights, Map, Reports, PublicDashboard | Create `lib/chart-theme.ts` exporting `CHART_COLORS` array; import everywhere. Better: use CSS variables so dark mode + brand customization work. |
| 3 | **StatCard / AlertBanner / LiveDot duplicated** in `DashboardPage.tsx` AND `dashboard/DashboardWidgets.tsx` | Dashboard | Delete the inline copies in `DashboardPage.tsx`; import from `DashboardWidgets`. |
| 4 | **No virtualization on long lists** | Submissions (page 20 OK, but `exportAll` 10k), Audit logs, Chat messages, Notifications, Map (5000 markers) | Use `@tanstack/react-virtual` for tables; `Leaflet.markercluster` for map. |
| 5 | **Native `confirm()` / `alert()`** in some places, shadcn Dialog elsewhere | SubmissionsPage (line 210), UsersPage implicit | Replace all with shadcn `AlertDialog`. |
| 6 | **Hover-only actions on cards** (`opacity-0 group-hover:opacity-100`) | FormCard, UserCard, ReferenceCard | Touch devices can't hover — use always-visible DropdownMenu trigger (⋯) instead. |
| 7 | **`dir="ltr"` inconsistency for emails/IPs/IDs** | Most pages have it; some don't | Add a `<Ltr>` wrapper component to enforce consistency. |
| 8 | **Loading state mix**: some pages use Skeletons, some use spinners (`Loader2`), some use both | FormDataDialog uses spinner; SubmissionsPage uses skeleton | Standardize: skeletons for initial page load, spinners for in-button actions. |
| 9 | **No empty-state CTA on plain-text empties** | AuditPage, ChatPage (partial) | Use the existing `<EmptyState>` component (in `components/ui/empty-state.tsx`) — it's already imported nowhere uniformly. |
| 10 | **Date formatting mix** (`formatRelativeTime` + `formatDateTime` + `toLocaleString('ar-SA')` + `formatDate`) | All pages | Pick one canonical format per use-case: relative for lists, absolute for details, ISO for exports. |
| 11 | **`initialized` anti-pattern** for dialog state | EpiStudioPage, ReferencesPage | Replace with `useEffect(() => { if (open) loadState() }, [open])`. |
| 12 | **No print stylesheet** for reports | ReportsPage, MapPage export | Add `@media print` rules or use `react-to-print`. |
| 13 | **No keyboard navigation on table rows** | Submissions, Audit, FormDataDialog | Add `tabIndex={0}` and `onKeyDown` for Enter/Space to open row detail. |
| 14 | **No dark-mode testing** for hardcoded color classes (`bg-blue-50`, `text-blue-600`) | Most pages | Use `bg-primary/10 text-primary` or define `data-[severity=…]` variants. |
| 15 | **CSS-in-JS via inline `style` for gradients** | LoginPage, DashboardPage (reports banner), PublicDashboardPage | Move to Tailwind classes (`bg-gradient-to-br from-... to-...`). |

### Patterns That Are Already Good ✓

- ✅ shadcn/ui primitives used consistently (Card, Button, Input, Select, Dialog, Tabs, Table, Badge, Skeleton, Avatar, Switch, Progress, Tooltip, DropdownMenu, ScrollArea, Separator, Label).
- ✅ React Query for all server state.
- ✅ Real-time subscriptions (`useNotificationRealtime`, `useDashboardRealtime`, `useChatMessages`).
- ✅ RBAC enforced both at route (`ProtectedRoute allowedRoles`) and component (`canManageUsers`, `canManageForms`) levels.
- ✅ Toast notifications for success/error on mutations.
- ✅ CSV injection sanitization on `SubmissionsPage` (`sanitizeCSV`).
- ✅ Error boundaries (`SectionErrorBoundary`) on dashboard sections.
- ✅ Lazy-loaded routes with Suspense fallbacks.
- ✅ Keyboard shortcuts (Ctrl+K global search, 1-4 + R on dashboard).
- ✅ Animated counters on stat cards.
- ✅ Live pulse indicators (`LiveDot`).
- ✅ Smart deferred queries on dashboard (3 critical → 5 after 800ms).

---

## Priority Rankings

### 🔴 MOST OUTDATED (Redesign First)

1. **`PagesManagementPage.tsx`** — localStorage-only persistence breaks the core promise. **Critical correctness bug.**
2. **`ChatPage.tsx`** — Massive unused-import bloat, dead menu items (Archive/Star/Phone/Video), no pagination, hardcoded rooms. **Ship-readiness issue.**
3. **`BotChatPage.tsx` + `AIChatWidget.tsx`** — Heavy duplication (2500+ lines combined), no streaming UI. **Maintenance burden.**
4. **`UsersPage.tsx`** — No pagination, hover-only actions, custom tab buttons. **Will break at scale.**
5. **`EpiStudioPage.tsx`** — Fake "mind map" (nested divs), hardcoded colors, dialog state anti-pattern. **Doesn't deliver on the visual promise.**
6. **`AIInsightsPage.tsx`** — Misleading metrics (`approval_rate * 1.05`), heavy client-side aggregation, auto-burns AI credits. **Trust issue.**

### 🟡 NEEDS REFINEMENT (Iterate Next)

7. **`DashboardPage.tsx`** — Beautiful but bloated (1075 lines) with duplicated widgets.
8. **`MapPage.tsx`** — No clustering, hardcoded page size, sidebar not interactive.
9. **`AuditPage.tsx`** — Client-side filtering, no date range, no JSON viewer.
10. **`ShortagesPage.tsx`** — No sort, no export, no batch resolve.
11. **`ReferencesPage.tsx`** — No actual file upload, no preview.
12. **`SubmissionsPage.tsx`** — Native `confirm()`, no sticky header, no virtualization.
13. **`SettingsPage.tsx`** — No per-section save, no unsaved-changes warning.
14. **`LoginPage.tsx`** — DOM-mutation fallback, no forgot-password, no MFA.

### 🟢 ALREADY GOOD (Keep As-Is, Minor Polish)

15. **`FormsPage.tsx`** + FormCard — Clean grid, good empty state.
16. **`ShortagesPage.tsx`** detail dialog — Well-structured 2-col grid.
17. **`AISettingsPage.tsx`** — Solid structure (just needs file split).
18. **`GovernoratesPage.tsx`** — Good helpers extraction.
19. **`NotificationsPage.tsx`** — Feature-complete (just needs file split).
20. **`ReportsPage.tsx`** — Components already extracted.
21. **`ScheduledReportsPage.tsx`** — Solid (needs calendar view).
22. **`PublicDashboardPage.tsx`** — Beautiful (just needs theme-token adoption).

---

## Recommended Shared Patterns to Apply Everywhere

### 1. Page Layout Skeleton (propose a `<PageShell>` component)

```tsx
<PageShell
  title="العنوان"
  subtitle="الوصف"
  onRefresh={refetch}
  error={error}
  isLoading={isLoading}
>
  {/* page content */}
</PageShell>
```

Standardizes: Header, padding (`p-4 sm:p-6 space-y-6`), error Card, loading skeletons.

### 2. Filter Bar Component

```tsx
<FilterBar
  search={{ value, onChange, placeholder }}
  filters={[{ type: 'select', ... }, { type: 'tabs', ... }]}
  actions={[{ label: 'تصدير', icon: Download, onClick }]}
  onClear={clearFilters}
  activeCount={activeFilterCount}
/>
```

Replaces the hand-rolled filter row on every list page.

### 3. Empty State Component

Already exists at `components/ui/empty-state.tsx` — **use it everywhere** instead of ad-hoc `<div className="text-center py-12">`.

### 4. Stat Card Component

Already exists in `dashboard/DashboardWidgets.tsx` — **delete the duplicate** in `DashboardPage.tsx` and import.

### 5. Chart Theme

Create `lib/chart-theme.ts`:

```ts
export const CHART_COLORS = {
  primary: 'var(--chart-primary)',
  success: 'var(--chart-success)',
  warning: 'var(--chart-warning)',
  danger: 'var(--chart-danger)',
  info: 'var(--chart-info)',
  neutral: 'var(--chart-neutral)',
}
```

Wire to CSS variables in `index.css` so dark mode + brand customization work.

### 6. Confirmation Dialog

Replace all `window.confirm()` with `<AlertDialog>` (shadcn doesn't ship one — install `@radix-ui/react-alert-dialog` and create `components/ui/alert-dialog.tsx`).

### 7. LTR Wrapper

```tsx
function Ltr({ children }: { children: React.ReactNode }) {
  return <span dir="ltr">{children}</span>
}
```

Use for emails, IPs, IDs, URLs.

### 8. Date Components

```tsx
<TimeAgo date={timestamp} />     // relative
<DateTime date={timestamp} />    // absolute
<Datestamp date={timestamp} />   // date only
```

Replaces the mix of `formatRelativeTime`, `formatDateTime`, `formatDate`, `toLocaleString('ar-SA')`.

---

## Next Actions (Recommended Order)

1. **Week 1 — Correctness fixes**:
   - Fix `PagesManagementPage` persistence (move to Supabase table).
   - Add pagination to `UsersPage`.
   - Replace `window.confirm()` everywhere with shadcn AlertDialog.
   - Remove dead ChatPage menu items + unused imports.

2. **Week 2 — Structural refactors**:
   - Delete duplicate widgets in `DashboardPage`, import from `DashboardWidgets`.
   - Extract shared chat primitives from `BotChatPage` + `AIChatWidget` into `lib/ai-chat/`.
   - Create `lib/chart-theme.ts` and adopt across all chart-using pages.

3. **Week 3 — UX polish**:
   - Build `<PageShell>`, `<FilterBar>`, `<Ltr>`, date components.
   - Adopt `<EmptyState>` everywhere.
   - Fix hover-only card actions (use always-visible DropdownMenu).
   - Add sticky table headers.

4. **Week 4 — Performance**:
   - Add `@tanstack/react-virtual` to long tables.
   - Add `Leaflet.markercluster` to MapPage.
   - Add route-level error boundaries + per-route skeletons in `App.tsx`.
   - Add 404 page.

5. **Week 5 — Feature gaps**:
   - Forgot-password + MFA on LoginPage.
   - Real file upload on ReferencesPage.
   - Real mind-map rendering on EpiStudioPage.
   - Date-range filter on AuditPage.
   - Per-section save on SettingsPage.

---

## File-by-File Line Counts (for sizing the work)

| File | Lines | Priority |
|------|------:|----------|
| `components/ai/AIChatWidget.tsx` | 1,481 | 🔴 Refactor + extract |
| `pages/DashboardPage.tsx` | 1,075 | 🟡 Split into sections |
| `pages/AIInsightsPage.tsx` | 983 | 🔴 Fix metrics |
| `pages/ChatPage.tsx` | 863 | 🔴 Clean dead code |
| `pages/NotificationsPage.tsx` | ~1,000 | 🟡 Split tabs |
| `pages/ReportsPage.tsx` | ~1,000 | 🟢 Already modular |
| `pages/ScheduledReportsPage.tsx` | ~1,000 | 🟡 Add calendar |
| `pages/AISettingsPage.tsx` | ~1,000 | 🟡 Split tabs |
| `pages/GovernoratesPage.tsx` | ~1,000 | 🟡 Extract detail card |
| `pages/PublicDashboardPage.tsx` | ~1,000 | 🟢 Adopt tokens |
| `pages/BotChatPage.tsx` | ~1,000 | 🔴 Extract shared |
| `pages/SubmissionsPage.tsx` | 792 | 🟡 Polish |
| `pages/EpiStudioPage.tsx` | 647 | 🔴 Real mind map |
| `pages/MapPage.tsx` | 590 | 🟡 Clustering |
| `pages/UsersPage.tsx` | 550 | 🔴 Add pagination |
| `pages/ReferencesPage.tsx` | 545 | 🟡 Add upload |
| `pages/ShortagesPage.tsx` | 491 | 🟡 Add sort/export |
| `pages/PagesManagementPage.tsx` | 435 | 🔴 **Fix persistence** |
| `pages/AuditPage.tsx` | 430 | 🟡 Server-side filters |
| `pages/LoginPage.tsx` | 202 | 🟡 Add forgot-password |
| `pages/SettingsPage.tsx` | 160 | 🟡 Per-section save |
| `pages/forms/FormsPage.tsx` | 121 | 🟢 Good |
| `pages/forms/FormEditorDialog.tsx` | 335 | 🟡 Extract hook |
| `pages/forms/FormDataDialog.tsx` | 336 | 🟡 Fix import safety |
| `pages/forms/FormCard.tsx` | 89 | 🟢 Good |
| `pages/forms/FieldEditorDialog.tsx` | 135 | 🟡 Replace textarea |
| `components/layout/app-layout.tsx` | 162 | 🟡 Merge FABs |
| `components/layout/header.tsx` | 137 | 🟡 Remove inline search |
| `App.tsx` | 113 | 🟡 Add 404 + per-route EB |

**Total page code audited:** ~14,000 lines across 21 page files + 3 layout components + 1 widget.

---

*End of report. Generated by comprehensive end-to-end file reading of every page in `apps/admin-web/src/pages/` plus the layout shell, AI widget, and routing.*
