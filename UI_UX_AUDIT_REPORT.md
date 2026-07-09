# EPI Supervisor Mobile App — Comprehensive UI/UX Audit Report

**Scope:** All screens in `apps/mobile/lib/screens/` + shared design system (`epi_shared/lib/src/theme/`, `epi_shared/lib/src/widgets/`, `apps/mobile/lib/router/app_router.dart`)
**Audited files:** 18 screens + drawer + theme + 6 shared widgets
**Methodology:** Line-by-line code review with focus on Material Design 3 best practices, Arabic RTL correctness, accessibility (WCAG/Touch targets ≥48dp), loading/empty/error state coverage, and visual consistency.

---

## 0. Executive Summary

The app has a **solid design-system foundation** (`AppTheme` is well-structured with brand colors, gradients, shadows, and an M3 `ColorScheme.fromSeed`), a **premium-feeling Login + Splash**, and a **modern hero-header dashboard**. However, **inconsistency is the biggest issue**: each screen re-implements cards, badges, headers, and bottom sheets in slightly different ways. The AI chat screens (`ai_chat_screen_v3`, `epi_studio_screen`) are by far the most polished; the admin/management screens (`users`, `forms-management`, `references-management`, `submissions`) feel **dated and utilitarian** and use plain `AppBar` + `Card` instead of the shared `EpiAppBar` / `EpiCard` widgets.

| Tier | Screens |
|------|---------|
| 🟢 **Already excellent** | `splash_screen`, `login_screen`, `dashboard_screen`, `ai_chat_screen_v3` (Bot + Chat tabs), `epi_studio_screen` |
| 🟡 **Good, needs polish** | `forms_screen`, `submission_detail_screen`, `references_screen`, `profile_screen`, `forms_status_screen`, `map_screen` |
| 🔴 **Most outdated, priority redesign** | `submissions_screen`, `users_screen`, `forms_management_screen`, `references_management_screen`, `analytics_screen`, `notifications_screen`, `chat_screen` (internal) |

---

## 1. Design System Baseline (`packages/shared/lib/src/theme/app_theme.dart`)

**Current design summary:** A teal-centric palette (primary `#00897B`, dark `#00695C`, darker `#004D40`) with indigo (`#5C6BC0`) secondary, amber/coral accents, and a full semantic/severity color set. Includes 5 gradients, 3 shadow levels, glassmorphism decorations, and a Cairo/Tajawal typography pair. Light + dark themes both defined with `useMaterial3: true`, full `ColorScheme.fromSeed`, custom `InputDecorationTheme`, `ChipThemeData`, `BottomNavTheme`, and `SnackBarTheme`. Border radii standardized at 8/12/16/24/1000.

**Current issues:**
1. **Text styles defined but rarely used.** `AppTheme.headingXL/L/M`, `bodyL/M/S`, `labelM`, `caption` are defined in `AppTheme` but almost every screen hand-rolls `TextStyle(fontFamily: 'Cairo', fontSize: 17, fontWeight: FontWeight.w700)` instead. This causes drift.
2. **No dark-theme runtime usage.** Both themes exist, but no `MaterialApp` `themeMode` toggle is visible — `ProfileScreen` mentions settings but doesn't expose a switch in the audited scope.
3. **Glassmorphism is barely used** (`AppTheme.glassmorphism` only used in `LoginScreen` logo wrapper) — feels wasted.
4. **`cardTheme.elevation = 0`** in theme but individual cards (`EpiCard`) hardcode `elevation: 2`. Inconsistent.
5. **`statusColor()` helper returns only 2 cases** — `submitted`/`draft` — yet screens show `approved`, `reviewed`, `rejected`, `pending_sync` statuses. The helper is incomplete.
6. **No MotionDuration tokens** — every screen picks its own (`250ms`, `300ms`, `400ms`, `600ms`, `800ms`, `1000ms`…). No `Durations.short1/2/3/4` usage.
7. **No Spacing tokens** — paddings swing from 4 → 8 → 12 → 14 → 16 → 18 → 20 → 24 → 28. Should be a 4-step scale (4/8/16/24/32).

**Recommendations:**
- Add `AppTheme.spaces` (`xs=4, sm=8, md=16, lg=24, xl=32, xxl=48`) and `AppTheme.durations` (`fast=150ms, normal=300ms, slow=500ms`) constants.
- Add `AppTheme.textTheme` that returns a `TextTheme` wired into `ThemeData.textTheme`, so all `Text()` widgets inherit Cairo/Tajawal automatically and screens stop hardcoding `fontFamily`.
- Complete `statusColor()` to cover: `draft`, `pending_sync`, `submitted`, `reviewed`, `approved`, `rejected`.
- Make `EpiCard.elevation` default to `0` (M3 prefers tonal elevation, not shadow elevation) and use `surfaceContainerLow` instead.

---

## 2. Per-Screen Audits

---

### 2.1 `splash_screen.dart` — شاشة البداية / Splash

**Current design summary:** Full-screen teal gradient (`primaryColor → primaryDark`) top-to-bottom. Centered column with a rounded 120×120 logo image (with fallback icon), Cairo 28 bold app name, Tajawal 14 subtitle, then a plain `CircularProgressIndicator` (strokeWidth 2) and a small status text. The screen intentionally navigates within ~200 ms.

**Current issues:**
- ❌ **Static and lifeless.** No animation on logo entry, no shimmer, no breathing pulse.
- ❌ **Logo fallback icon is generic** (`Icons.assignment_outlined` — looks like a todo app, not a health/EPI app).
- ❌ **No version number shown** (login screen shows version, splash doesn't).
- ❌ Status text is `Colors.white.alpha 0.6` — small and easy to miss during the brief display.

**Recommendations:**
- Add `TweenAnimationBuilder` scale + fade-in on the logo (0.8 → 1.0 over 600 ms with `Curves.easeOutBack`).
- Use a shimmer or pulsing ring behind the logo (`AnimationController` + `CustomPainter`).
- Replace fallback with a branded vaccination/health icon (`Icons.vaccines_rounded`).
- Display `appVersion` + a "© Ministry of Health" line at the bottom in caption style.
- Show a progress bar (linear determinate) instead of spinner — communicates "loading data" better than a spinner.

---

### 2.2 `login_screen.dart` — شاشة تسجيل الدخول / Login

**Current design summary:** Premium 3-stop teal gradient background, glassmorphism logo wrapper, animated Cairo 26 title + Tajawal 14 subtitle. White 24-radius card with shadow holds the form (EpiTextField email + password, gradient submit button with arrow, "نسيت كلمة المرور؟" link, biometric OutlinedButton). FadeTransition + SlideTransition on entry. Retry logic with backoff, haptics on every action, version footer.

**Current issues:**
- ❌ **Forget-password dialog is plain Material** — uses default `AlertDialog` with `OutlineInputBorder` (not the themed `InputDecorationTheme`). Doesn't match the polished card.
- ❌ **No "remember me" checkbox** — biometric flow is unclear ("سيتم تسجيل الدخول تلقائياً عند وجود جلسة محفوظة" is confusing for users).
- ❌ **No form autofill hints** (`AutofillHints.email`, `AutofillHints.password`) — keyboard doesn't suggest saved credentials.
- ⚠️ **Submit button uses `DecoratedBox` + `ElevatedButton` with `backgroundColor: transparent`** — clever but not standard M3. Use `ElevatedButton.styleFrom(backgroundColor: primaryColor)` and apply the gradient via an `Ink` widget or a custom `Material`.
- ⚠️ **No captcha / no "show password" hint icon** — toggling works but the eye icon position is buried in suffix.
- ⚠️ Bottom version text is `alpha 0.4` — too faint on white-on-teal contrast.

**Recommendations:**
- Convert forget-password dialog to a `showModalBottomSheet` with rounded top — matches the rest of the app's dialog style (already used in `forms_management`).
- Add a `Row` with "تذكرني" `Checkbox` + biometric hint, below the password field.
- Add `autofillHints: const [AutofillHints.email]` to email field and `[AutofillHints.password]` to password.
- Replace the eye toggle with `IconButton.filled` for clearer tap target (currently the IconButton has no background).
- Add a `Semantics(label: 'إظهار كلمة المرور')` on the toggle.
- Show a small "جاري…" overlay (`OverlayEntry`) inside the button instead of replacing the entire button content with a spinner — avoids layout shift.

---

### 2.3 `dashboard_screen.dart` — لوحة التحكم / Dashboard

**Current design summary:** Best-in-app screen. Uses `CustomScrollView` with `RefreshIndicator` (haptic feedback on pull). Hero header (`DashboardHeroHeader`) is a teal gradient card with greeting + username + campaign pill + pulsing notification bell with badge, slide+fade animation. Below: `DashboardKPIGrid` (2-col animated KPI cards with `AnimatedCounter`), quick actions row, weekly trend line chart (`DashboardTrendLine`). Section titles use a 4×20 teal vertical accent bar. Loading uses `EpiLoading.shimmer()`, errors use `EpiErrorWidget` with retry.

**Current issues:**
- ❌ **Only 2 KPIs** (`الإرساليات` and `المسودات`) — dashboard feels empty for admins. Should show: today count, week count, drafts, pending sync, governorates with low coverage, recent alerts.
- ❌ **`_selectedQuickAction = -1`** state is set but only used for press-down visual feedback — there's no ripple/ink response, the press feels flat.
- ❌ **Trend chart legend & axis labels likely overlap** in small screens (chart not audited deeply but `DashboardTrendLine` is in `dashboard_charts.dart`).
- ⚠️ **Background sync on init** runs `service.sync()` if `pendingCount > 0` — but there's no visible indicator to the user that sync is happening (the global FAB sync button handles visibility, but here it's silent).
- ⚠️ Hero greeting "صباح الخير ☀️" is shown without time-of-day awareness for the user's actual timezone (uses `DateTime.now()` which is device-local — fine, but should be clarified in tests).

**Recommendations:**
- Expand KPI grid to 4 cards (2×2): Total / Today / Drafts / Pending Sync. For admins: add a 5th card "محافظات تحتاج اهتمام" linking to alerts.
- Replace `_selectedQuickAction` press-down with `InkWell` + `Material` ripple for natural feedback.
- Add a small "آخر تحديث: 5 دقائق" timestamp below the KPI grid.
- Add a "حملات نشطة" horizontal scrollable carousel of campaign cards with coverage %.
- Add a "آخر الإرساليات" mini-list (3 latest) with form icon + supervisor name + time-ago — gives the dashboard life.
- Show a thin `LinearProgressIndicator` at the top of the hero header when background sync is running.

---

### 2.4 `forms_screen.dart` — النماذج / Forms List

**Current design summary:** Uses `EpiAppBar` with a "حالة الاستمارات" action button. `RefreshIndicator` + `EpiLoading.shimmer()` + `EpiEmptyState` + `EpiErrorWidget` state coverage. Form cards (`_FormCard`) use `EpiCard` with a gradient square icon (active) or grey square (inactive), title + 2-line description, badges for GPS/photo/inactive, version pill, arrow chip. Staggered `TweenAnimationBuilder` (400ms + 80ms per index) for entry animation.

**Current issues:**
- ❌ **Inactive forms are shown at `Opacity 0.5`** — this is bad UX because users may still try to tap them (the `EpiCard.onTap` is `null` but there's no visual cue other than opacity, and no "غير نشط" label visible until you scroll to the bottom of the card).
- ❌ **No category grouping** — flat list of all forms. Long lists will be hard to scan.
- ❌ **No search/filter bar** — users with 10+ forms have to scroll.
- ❌ **No "filled by me" count** on each form card — would help users see their own progress.
- ⚠️ Badge `_buildBadge` uses `margin: left: 8` — this is RTL-incorrect; in RTL the visual gap should be on the right side. Since `Row` already reverses in RTL context this likely works, but using `Directionality`-aware spacing (`SizedBox(width: 8)` between children) is safer.
- ⚠️ Entry animation duration grows with index (`400 + i*80`) — for 20 forms the last item waits 2 seconds. Cap at index 5.

**Recommendations:**
- Replace opacity-dim with a "غير متاح" banner across the top of inactive cards (`Stack` + `Positioned` ribbon) — clearer.
- Group forms by `campaign_type` (حملة شلل الأطفال / النشاط الإيصالي التكاملي) with `_SectionLabel` headers (the drawer already uses these).
- Add an `EpiSearchBar` at the top (the references screen already does this — pattern should be consistent).
- Show "آخر إرسالية: منذ 3 ساعات" timestamp on each card.
- Cap stagger animation at 5 items.

---

### 2.5 `map_screen.dart` — الخريطة / Map

**Current design summary:** Full-screen `flutter_map` with `Stack` overlays: top bar (transparent containers with white text/icons, filter button with badge, color-mode toggle, info button), stats overlay (toggleable), bottom action FABs (`MapControls.buildFABs` for fit-all / my-location / zoom in-out), selected submission panel, cluster panel. Uses `HapticFeedback` on actions. Filter bar expands below the top bar with search + form/supervisor/status filters.

**Current issues:**
- ❌ **Top bar text is white on map** — when the map is light-colored (e.g., OSM standard tiles), white text becomes unreadable. Need a scrim or shadow.
- ❌ **No legend** for the color modes (status vs. role) — users can't tell what each pin color means.
- ❌ **Filter UI is cramped** — all filter chips + search are crammed in one card; on small screens this overlaps the map excessively.
- ❌ **Selected submission panel lacks "directions"** — no "open in Google Maps" button even though GPS coords are present.
- ❌ **No clustering** at low zoom — performance and visual clutter with 1000+ pins.
- ⚠️ `_colorMode` toggle button text is white on translucent white — borderline contrast.
- ⚠️ "إحداثيات كاملة" GPS badge is shown only to roles with full coords — good, but no explanation to users who don't see it.
- ⚠️ `_canViewAllGovernorates` and `_canViewFullCoords` RBAC helpers are good but their effect on the UI is invisible (no message like "أنت ترى فقط محافظتك").

**Recommendations:**
- Wrap top bar containers in a `Container` with a subtle linear gradient scrim (`Colors.black.alpha 0.2 → transparent`) for legibility.
- Add a legend bottom sheet triggered by an `?` icon — explains pin colors + cluster sizes.
- Move filters into a `showModalBottomSheet` (full-width, scrollable) instead of inline expansion.
- Add a `flutter_map_marker_cluster` plugin for clustering at low zoom.
- Add "التنقل عبر Google Maps" / "Apple Maps" buttons in the selected-submission panel using `url_launcher` with `geo:` URI.
- Add a `SnackBar` or info chip showing "عرض بيانات محافظتك فقط" for restricted users.
- Add empty state: "لا توجد إرساليات تطابق الفلاتر المحددة" instead of just showing an empty map.

---

### 2.6 `ai_chat_screen_v3.dart` — المساعد الذكي / AI Assistant (4 tabs)

**Current design summary:** Most polished screen in the app. `DefaultTabController(length: 4)` with gradient AppBar (primary→tertiary), AI avatar with green "online" dot, 4 tabs: مستشار التحصين (Bot), مساعد النظام (Chat), استوديو ✨, تنبيهات ذكية. Chat tab has horizontal `ChoiceChip` model selector (auto/groq/zai/openrouter/gemini/local), gateway status indicator, welcome screen with quick-prompt cards (color-coded by category), message bubbles with avatars + gradient backgrounds, markdown parsing (`**bold**`, `_italic_`, `` `code` ``), streaming cursor, typing dots animation, citation chips (`RichTextWithCitations`), grounding banner, suggested follow-ups, low-confidence warning, AI provider badge. Offline banner at top when no internet.

**Current issues:**
- ❌ **TabBar has 4 tabs with text + icon** — on small phones the labels "مستشار التحصين" + "تنبيهات ذكية" may truncate. Should test on 360dp width.
- ❌ **`_typingAnimCtrl.repeat()` is started** but only `.stop()`-ed on completion — if the user navigates away mid-response, the animation continues. Need `.stop()` in `dispose()` (it's not).
- ❌ **Welcome screen scrolls** with `BouncingScrollPhysics` but no `ScrollController` — long content on small screens may feel unanchored.
- ❌ **"تنبيهات ذكية" tab content** was not visible in audited range — need to verify it has loading/empty states.
- ⚠️ ChoiceChip list uses `ListView.separated` horizontal but on landscape phones the chips may not fit — consider wrapping.
- ⚠️ `_buildInputBar` send button is `IconButton` inside a gradient `Container` — works but lacks disabled state styling (when `_loading` it's `null` but the gradient stays bright).
- ⚠️ Long-press to copy is non-discoverable — no hint, no context menu.

**Recommendations:**
- Test tab labels on 360dp — if truncated, use icon-only `TabBar` with tooltip or shorter labels ("مستشار", "مساعد", "استوديو", "تنبيهات").
- Add `_typingAnimCtrl.stop()` in `dispose()`.
- Add a "نسخ" action via `IconButton` row below each assistant message (copy, regenerate, share).
- Add disabled styling for send button when `_loading` (lower opacity, no gradient).
- Add a "محادثاتي السابقة" history drawer accessible from AppBar.
- Add a "اقتراحات" floating chip row above the input bar showing context-aware suggestions.

---

### 2.7 `epi_studio_screen.dart` — استوديو المحتوى / EPI Studio

**Current design summary:** NotebookLM-inspired artifact generator. 5 artifact types (briefing doc / study guide / FAQ / mind map / audio podcast), each with its own color and icon. Topic input at top, grid of artifact-type buttons, generated artifact display with citations + audio player for podcast, library of saved artifacts (badge count on AppBar folder icon), save/bookmark actions. Embedded mode (when shown as tab inside AI chat) hides AppBar and shows inline action bar.

**Current issues:**
- ❌ **No loading skeleton** during `_loading` — the screen likely shows nothing or a spinner; should show a shimmer of the expected output shape.
- ❌ **No empty state** when `_artifact == null && !_loading && _savedArtifacts.isEmpty` — first-time users see a blank canvas.
- ❌ **No preview/preview-diff** when regenerating — the previous artifact is replaced; no history.
- ❌ **Audio player UI was not visible in audited range** — verify it has play/pause/seek/speed controls and a waveform.
- ⚠️ Embedded mode action bar uses `IconButton` without labels — users may not know what bookmark/folder icons mean.
- ⚠️ Topic input has no validation feedback (just a SnackBar "اكتب موضوعاً أولاً").

**Recommendations:**
- Add `EpiLoading.shimmer()` shaped like the artifact output (title bar + 5 paragraph lines + citation chips row).
- Add a hero empty-state: "اكتب موضوعاً مثل 'تغطية شلل الأطفال في الجولة الثانية' ثم اختر نوع المحتوى".
- Add "السابق" / "التالي" buttons to navigate generated artifacts history (keep last 5 in memory).
- Add tooltips on every `IconButton` (some have `tooltip`, some don't — be consistent).
- Show a "نسخ" + "مشاركة" + "تحميل PDF" action row at the bottom of every generated artifact.
- Add estimated time ("~30 ثانية") next to each artifact type button.

---

### 2.8 `submissions_screen.dart` — الإرساليات / Submissions List

**Current design summary:** `EpiAppBar` with sort + filter icon buttons. Search bar (`EpiSearchBar`) at top, active filter chip row, sort indicator row. Custom pagination logic (`_currentPage`, `_pageSize = 20`). Loading uses `EpiLoading.shimmer()`. List tiles (`_SubmissionTile`) with title + status + date + user name + PDF quick-action. Pagination controls at bottom (prev/next + page indicator). `RefreshIndicator` for pull-to-refresh.

**Current issues:**
- ❌ **Page-based pagination, not infinite scroll** — outdated pattern. Modern apps use `ScrollController` + load-more on near-end.
- ❌ **`_SubmissionTile` not visible in audited range** but based on context likely uses basic `ListTile` — verify it matches Forms cards' visual quality.
- ❌ **Two "page count" calculations** (`totalPages` computed twice in same `build` method — line 191 and line 331 — dead code).
- ❌ **Filter sheet (`_showFilterSheet`)** not audited but is critical — verify it's a `showModalBottomSheet` with rounded top.
- ❌ **Status filter is a single chip** — no multi-select (e.g., "submitted + reviewed" together).
- ⚠️ Sort indicator row uses `GestureDetector` on "إعادة" text — should be a `TextButton` with ripple.
- ⚠️ The screen re-implements filtering/sorting/pagination logic that `forms_status_screen` also implements — should be a shared mixin/provider.

**Recommendations:**
- Replace page-based pagination with infinite scroll + `ScrollController` listener that loads next page when user is 200px from bottom. Show a small "جارٍ تحميل المزيد…" spinner at the bottom.
- Show total count prominently: "247 إرسالية" in a sticky header.
- Multi-select status filter chips in the filter sheet (`FilterChip` widgets).
- Extract submission-tile into a shared widget used by both `submissions_screen` and `forms_status_screen`.
- Add quick-action buttons in each tile: عرض (View), PDF, مشاركة — as `IconButton` row on the trailing side, not just PDF.

---

### 2.9 `submission_detail_screen.dart` — تفاصيل الإرسالية / Submission Detail

**Current design summary:** `EpiAppBar` with popup menu (share/copy). `SingleChildScrollView` with: gradient header card (status-dependent color: teal for submitted, grey for draft), status section with `EpiStatusChip` + date, campaign round badge, submitter info section, location section, form-data section (key-value rows), prominent PDF download button (red gradient with shadow, loading state).

**Current issues:**
- ❌ **Form data is dumped as raw key-value pairs** (`_buildFormData` iterates `data.entries`) — users see cryptic keys like `budget_received` instead of Arabic labels.
- ❌ **No photos displayed** — even though submissions can `requires_photo`, the detail screen doesn't show attached photos.
- ❌ **No GPS map preview** — shows lat/lng as text only; should be a small static map or "افتح في الخريطة" button.
- ❌ **"ID: ${widget.id.substring(0, 8)}..." in header** is developer-facing — users don't care about UUIDs.
- ❌ **No edit/delete actions** for draft submissions.
- ⚠️ PDF button is bright red (`#E53935 → #C62828`) — visually heavy, suggests "danger" rather than "download". Use primary teal or a neutral "primary" style.
- ⚠️ `_buildSection` uses plain `Colors.white` background — should use `surfaceContainerLow` for M3 tonal elevation.

**Recommendations:**
- Map form-data keys to Arabic labels using a shared field-labels map (similar to `analytics_screen`'s `_yesNoLabels` map). For unknown keys, fall back to prettifying the key.
- Add a photo gallery section (`GridView` of thumbnails with full-screen viewer on tap) when `submission_photos` exist.
- Replace lat/lng text with a 200×120 static map preview (`StaticMapProvider`) + "افتح في الخريطة" button.
- Remove UUID from header; show supervisor name + governorate instead.
- Add edit (pencil) and delete (trash) FABs for draft submissions.
- Change PDF button to a softer primary-colored `FilledButton.icon` (M3 `FilledButton` style) — reserve red for destructive actions only.

---

### 2.10 `forms_status_screen.dart` — حالة الاستمارات / Forms Status

**Current design summary:** 3-tab dashboard (Drafts / Pending Sync / Submitted) using `TabController`. Per-tab page-based pagination. Search + filter (form/governorate/district/role/supervisor name) + sort. Listens to sync service to refresh on sync completion (but only if screen is currently visible — good). Uses `forms_status_widgets.dart` for tile components.

**Current issues:**
- ❌ **3 tabs all using page-based pagination** — same outdated pattern as submissions screen.
- ❌ **Tab labels not visible in audited range** but likely Arabic text + counts ("المسودات (5)") — verify they fit.
- ❌ **Filter UI complexity is hidden** — `_showFilters` toggle exposes 5+ filter fields; this should be a modal bottom sheet.
- ❌ **No bulk actions** — can't select multiple drafts to delete or sync.
- ❌ **Search has debounce** (`_searchDebounce`) — good — but the indicator that search is debounced isn't visible.
- ⚠️ `_refreshKey` state variable is incremented but its purpose isn't clear from the audited code — likely for forcing widget rebuild.
- ⚠️ Tab change loads new page only if list is empty — but doesn't unload other tabs, so memory may grow.

**Recommendations:**
- Same as submissions screen: switch to infinite scroll.
- Add bulk-select mode: long-press a tile to enter selection mode, then "تحديد الكل", "حذف المحدد", "مزامنة المحدد".
- Move filters to a `showModalBottomSheet` with "تطبيق" / "إعادة تعيين" buttons.
- Add a "تحديث" pull-to-refresh per tab.
- Show count badges on each tab label ("المسودات (5)").
- Add a small "آخر تحديث: 5 دقائق" timestamp per tab.

---

### 2.11 `notifications_screen.dart` — الإشعارات / Notifications

**Current design summary:** Plain `AppBar` (not `EpiAppBar`) with "تعليم الكل كمقروء" `TextButton.icon`. `RefreshIndicator` + `ListView.separated` (divider with indent 72). Each tile is `Dismissible` (swipe to delete) with leading colored icon container, title (bold if unread), subtitle with body + category chip + time-ago, trailing unread dot. Empty state with icon + text + refresh button. Load-more button at end of list.

**Current issues:**
- ❌ **No notification grouping by day** — flat list; users with 50+ notifications can't find today's.
- ❌ **No filter by type** (success/warning/error/sync/info) — useful for finding critical alerts.
- ❌ **`Dismissible` only dismisses** — doesn't actually delete (the `onDismissed` calls `markAsRead` but the notification stays in the list since `setState` is called but the list isn't filtered). Bug.
- ❌ **No deep-linking** — tapping a notification just marks it as read; doesn't navigate to the related submission/form/chat.
- ❌ **No push notification preview / rich text** — body is `maxLines: 2` with ellipsis.
- ⚠️ Plain `AppBar` with default styling — title is white on teal (from theme), but lacks the visual richness of `EpiAppBar`.
- ⚠️ "تعليم الكل كمقروء" button shows just the count number as label, not "تعليم 5 كمقروء" — unclear.

**Recommendations:**
- Group notifications by day with `Today` / `Yesterday` / date headers (like `chat_screen` does).
- Add filter chips at the top: `All` / `Errors` / `Warnings` / `Sync` (using `FilterChip`).
- Fix the `Dismissible` bug — actually remove the notification from the list, or show a SnackBar with "تراجع".
- Add `onTap` navigation: if notification has `submission_id`, go to submission detail; if `chat_id`, go to chat; etc.
- Switch to `EpiAppBar` for consistency.
- Change "تعليم الكل" button label to "تعليم الكل كمقروء (5)".
- Add a "حذف الكل" action in the overflow menu.

---

### 2.12 `references_screen.dart` — المراجع والكتب / References

**Current design summary:** Plain `AppBar` + `EpiSearchBar` + `RefreshIndicator` + `ListView.builder`. Reference cards (`_ReferenceCard`) use `EpiCard` with primary-tinted square icon, title (Cairo 15 bold), description (2-line), category chip, download icon on trailing. Category icon mapping (guide/manual/form/training/folder). Loading uses `EpiLoading` (not `shimmer`).

**Current issues:**
- ❌ **No category filter chips** at the top — users can't browse by category.
- ❌ **No file type indicator** (PDF/DOCX/image) or file size.
- ❌ **No download progress** — tapping just launches URL externally, no feedback.
- ❌ **No "favorites" / "bookmarked"** feature.
- ❌ **Loading uses `EpiLoading` (spinner)** — should be `EpiLoading.shimmer()` to match other list screens.
- ⚠️ `_openFile` uses `launchUrl` with `externalApplication` mode — fine, but no error handling if URL is invalid.
- ⚠️ Category chip uses `AppTheme.primaryColor.alpha 0.08` background — too faint, looks like part of the card.

**Recommendations:**
- Add horizontal `FilterChip` row at the top: `الكل` / `أدلة` / `كتيبات` / `استمارات` / `تدريب`.
- Show file type icon (PDF/DOC) + size on each card.
- Add download progress overlay (use `dio` or `http` with progress listener) instead of just launching URL.
- Add a bookmark icon button on each card → saves to local "المفضلة" list.
- Switch loading state to `EpiLoading.shimmer()` for consistency.
- Make category chip more prominent: stronger background color (alpha 0.15) + icon prefix.

---

### 2.13 `chat_screen.dart` — الشات الداخلي / Internal Chat

**Current design summary:** Custom header (not `AppBar`) with teal gradient, chat icon container, title + "متصل — تحديث تلقائي" with pulsing green dot, refresh action. Messages list with date separators ("اليوم", "أمس", formatted date), avatar grouping logic (consecutive messages from same sender share avatar/name). Input bar at bottom. Uses Supabase Realtime for live updates.

**Current issues:**
- ❌ **No `EpiAppBar`** — custom header diverges from rest of app.
- ❌ **No message status indicators** (sent / delivered / read) — even though it's realtime.
- ❌ **No message reactions** (👍 / ❤️ / etc.) — common in chat apps.
- ❌ **No reply/quote** feature — can't reply to a specific message.
- ❌ **No typing indicator** when another user is typing.
- ❌ **No offline state** — if Supabase realtime disconnects, the "متصل" status doesn't change.
- ❌ **No empty state** visible in audited range — verify it shows a friendly "ابدأ المحادثة" message.
- ⚠️ `_PulseDot` widget is referenced but not visible in audited range — verify it animates smoothly.
- ⚠️ Date separator uses `Color(0xFFF3F4F6)` — hardcoded, should use theme `surfaceContainerHigh`.

**Recommendations:**
- Switch to `EpiAppBar` with custom `flexibleSpace` for the gradient — keeps consistency.
- Add ✓ / ✓✓ read receipts next to own messages (like WhatsApp).
- Add long-press message → reaction picker (emoji row).
- Add swipe-right on a message to quote-reply.
- Add typing indicator (Supabase Realtime `presence` channel) — "يكتب الآن..." below header.
- Add a connection status banner ("انقطع الاتصال — إعادة المحاولة") when realtime disconnects.
- Use `Theme.of(context).colorScheme.surfaceContainerHigh` for date separator background.

---

### 2.14 `profile_screen.dart` — البروفايل / Profile

**Current design summary:** `CustomScrollView` with sliver hero header (avatar with edit pencil overlay, name, role badge, governorate). Below: form sections with `_sectionLabel` + `_buildEditableField` (Cairo font, validation) and `_buildReadOnlyTile` (icon + label + value + trailing). Editing toggle, save button with loading state. Avatar upload via `image_picker`. Role badge styling.

**Current issues:**
- ❌ **No settings section** — no theme toggle (dark mode), no language toggle (Arabic/English), no notification preferences, no about page.
- ❌ **No "تسجيل الخروج" button visible** in audited range — should be a prominent red button at the bottom.
- ❌ **No "تغيير كلمة المرور"** option.
- ❌ **No avatar remove option** — only replace.
- ⚠️ Hero header decoration not visible in audited range — verify it's a gradient matching dashboard's hero.
- ⚠️ `_buildReadOnlyTile` likely uses plain `Container` — should be `EpiCard` for consistency.

**Recommendations:**
- Add a "الإعدادات" section with: الوضع الليلي (Switch), اللغة (Arabic/English toggle), الإشعارات (Switch per category), عن التطبيق (version + license + privacy policy).
- Add a prominent "تسجيل الخروج" `OutlinedButton` (red outline) at the bottom of the screen, with a confirm dialog.
- Add "تغيير كلمة المرور" tile that opens a bottom sheet with current password + new password + confirm.
- Allow avatar removal (long-press → "حذف الصورة").
- Make all tiles use `EpiCard` for consistent shadows and borders.
- Add a "مشاركة ملفي" button that exports a vCard or shares profile info.

---

### 2.15 `users_screen.dart` — إدارة المستخدمين / User Management

**Current design summary:** Plain `AppBar` with filter icon. `FloatingActionButton.extended` for adding users. Likely a `ListView` of user cards (not visible in audited range, but based on `_loadAll` method). Add/edit user via `UserFormSheet` modal bottom sheet. Soft-delete + toggle active. Filter sheet (`_showFilterSheet`) for role/active status.

**Current issues:**
- ❌ **Plain `AppBar`** — not `EpiAppBar`.
- ❌ **No search bar visible** in audited range — users with 100+ accounts can't find anyone.
- ❌ **No pagination** — `_loadAll` fetches everything; will be slow with 500+ users.
- ❌ **No stats summary** (total / active / admins / by-role) at top — unlike `forms_management_screen` which has stats.
- ❌ **No bulk actions** — can't activate/deactivate multiple users.
- ❌ **`_deleteUser` uses soft-delete** (`deleted_at`) but UI says "حذف" — misleading; should be "أرشفة" or show "تعطيل" instead.
- ⚠️ Filter sheet not audited but likely similar pattern to other screens.

**Recommendations:**
- Switch to `EpiAppBar` with title "إدارة المستخدمين" + filter + refresh actions.
- Add `EpiSearchBar` at the top.
- Add stats row at the top: "الكل: 247" / "نشط: 230" / "معطل: 17" (like `forms_management_screen._summaryStat`).
- Add pagination (page-based or infinite scroll).
- Rename "حذف" to "تعطيل" since it's a soft-delete; add a separate "حذف نهائي" option in admin overflow menu.
- Add bulk-select mode for activate/deactivate.
- Show last-login timestamp on each user card.
- Show user's submission count ("120 إرسالية") on the card.

---

### 2.16 `analytics_screen.dart` — تحليلات النشاط / Analytics

**Current design summary:** Plain `AppBar` with `TabBar` (4 tabs, scrollable). Uses `TabController`. Amber accent indicator (`Colors.amberAccent`) — diverges from app's teal. Tabs filter by campaign type + round. Two `FutureProvider.family.autoDispose` providers for readiness + supervision submissions. Listens to sync service with debounce for refresh.

**Current issues:**
- ❌ **`Colors.amberAccent` indicator** — inconsistent with the rest of the app's teal `indicatorColor`. Looks like a different app.
- ❌ **AppBar title "تحليلات النشاط الإيصال التكاملي"** is too long — truncates on small screens. Use "التحليلات" with a subtitle.
- ❌ **Tab labels not visible in audited range** but with 4 scrollable tabs, text will be tiny.
- ❌ **No export/share** option for analytics — admins will want to download PDF/Excel.
- ❌ **No date range picker** — analytics are bound to campaign/round only, no custom date filter.
- ❌ **No comparison mode** — can't compare round 1 vs round 2.
- ⚠️ `tabAlignment: TabAlignment.start` + `isScrollable: true` — fine, but the tabs look scrollable even when they fit — confusing.

**Recommendations:**
- Switch indicator color to `AppTheme.primaryColor` (or `ColorScheme.primary`).
- Shorten AppBar title to "التحليلات" + add a subtitle line in `SliverAppBar`.
- Add an "تصدير PDF" + "تصدير Excel" action in AppBar overflow menu.
- Add a date-range picker chip below the AppBar ("آخر 30 يومًا" / "هذا الشهر" / "مخصص").
- Add a "مقارنة" toggle that shows two rounds side-by-side.
- Make tab labels icon + text (compact) or use a `DropDown` for tab selection.

---

### 2.17 `forms_management_screen.dart` — إدارة النماذج / Forms Management

**Current design summary:** Plain `AppBar` with refresh action. `FloatingActionButton.extended` for new form. Stats row at top (`_summaryStat` x3: الكل / مفعل / معطل). Form cards (`_buildFormCard`) using `Card` with `InkWell`, square icon container, title + description, switch for active toggle, stat chips row (إرساليات / معلق / معتمد), tag chips (GPS / صورة), version. Tap card → bottom sheet with actions (تعديل / تفعيل / حذف).

**Current issues:**
- ❌ **Plain `AppBar`** — not `EpiAppBar`.
- ❌ **Plain `Card`** — not `EpiCard`. Skips the shared widget.
- ❌ **No search bar** — admins with 20+ forms can't find one quickly.
- ❌ **No filter by campaign type** — polio vs integrated are mixed.
- ❌ **Switch toggle is on the card** — accidental toggles when scrolling. Should be in the action sheet only.
- ❌ **Stats fetched per-form in a sequential `for` loop** — N+1 query problem; with 20 forms this is 20 round-trips. Should batch with a single RPC.
- ⚠️ Bottom sheet actions list lacks icons next to text (icon is in `leading` container, but text + action description would be clearer).
- ⚠️ `Navigator.push` for `FormEditorScreen` instead of GoRouter — inconsistent with the rest of the app.

**Recommendations:**
- Switch to `EpiAppBar` + `EpiCard`.
- Add `EpiSearchBar` + campaign-type filter chips at the top.
- Move the active toggle switch from the card to the action sheet only — show status as a colored chip on the card instead.
- Optimize stats fetching with a single Supabase RPC (`get_form_stats`) returning all counts in one call.
- Replace `Navigator.push` with `context.go('/forms-management/edit/${form['id']}')` (add route to GoRouter).
- Add "نسخ" (duplicate) action in the bottom sheet.
- Add "معاينة" (preview) action that shows the form schema as a read-only preview.

---

### 2.18 `references_management_screen.dart` — إدارة المراجع / References Management

**Current design summary:** Plain `AppBar` with refresh. `FloatingActionButton.extended` for new reference. Plain `TextField` for search (not `EpiSearchBar`). Count text ("X مرجع"). Reference cards (not visible in audited range but likely similar to `forms_management`). Add/edit via `_ReferenceFormSheet` modal. Soft-delete + toggle visibility.

**Current issues:**
- ❌ **Plain `TextField`** instead of `EpiSearchBar` — visual inconsistency.
- ❌ **Plain `AppBar`** — not `EpiAppBar`.
- ❌ **No stats summary** (unlike `forms_management_screen`).
- ❌ **No category filter chips**.
- ❌ **Count text uses hardcoded `Colors.grey.shade600`** — not theme-aware.
- ⚠️ Same N+1 pattern likely (each reference's downloads count fetched separately).
- ⚠️ `_toggleVisibility` shows 👁️ emoji in SnackBar — emoji in toasts feels unprofessional.

**Recommendations:**
- Switch to `EpiAppBar` + `EpiSearchBar` + `EpiCard`.
- Add stats row: "الكل" / "ظاهر" / "مخفي".
- Add category filter chips.
- Replace hardcoded grey with `AppTheme.textSecondary`.
- Remove emojis from SnackBar messages — use icons instead.
- Add "تحميل" (upload file) action that uses Supabase Storage instead of just URL input.
- Add "نسخ الرابط" action on each card.

---

## 3. Cross-Cutting Patterns & Shared Components

### 3.1 `epi_drawer.dart` — قائمة التنقل / Navigation Drawer

**Current design summary:** RTL `Directionality` wrapper. Header with teal gradient (primary→primaryDark), avatar with edit pencil overlay, name + role badge + campaign selector dropdown + (conditional) campaign round selector. Body: section labels (`_SectionLabel`) grouping menu items (الرئيسية / الموارد / الذكاء الاصطناعي / الإدارة). Each item (`_buildItem`) is a `ListTile` with leading icon container (tinted when selected), title (Cairo 14, bold when selected), `selectedTileColor`. Footer: "مزامنة تكوين" tile (info blue) + "تسجيل الخروج" tile (error red), both with icon containers.

**Current issues:**
- ❌ **Hardcoded top padding `fromLTRB(20, 50, 20, 20)`** — should use `SafeArea` (notches cut into the avatar on modern phones).
- ❌ **No badge counts** on menu items — e.g., notifications should show unread count next to "الإشعارات".
- ❌ **Two items point to `/ai`** ("المساعد الذكي" and "مستشار التحصين") — confusing, same destination with different labels.
- ❌ **Campaign dropdown uses `DropdownButton`** — outdated; should use `DropdownButtonFormField` styled to match the theme, or a custom bottom-sheet picker.
- ❌ **"استوديو المحتوى ✨"** label has emoji — inconsistent with other labels (no emojis elsewhere).
- ❌ **No user email shown** — only name + role; email helps disambiguate users with same name.
- ⚠️ `_SectionLabel` uses `letterSpacing: 0.5` — fine, but the rest of the app doesn't use letter spacing on labels; inconsistent.
- ⚠️ Sync-config tile shows spinner during sync — good — but no progress percentage.

**Recommendations:**
- Wrap header in `SafeArea` to handle notches.
- Add badge counts: "الإشعارات (5)" with red circle indicator next to icon.
- Merge "المساعد الذكي" and "مستشار التحصين" into one item — "المساعد الذكي".
- Replace `DropdownButton` with a custom bottom-sheet campaign picker (shows full labels, icons, and "active" check).
- Remove emoji from "استوديو المحتوى".
- Add user email below name in small grey text.
- Add a sync progress indicator (small `LinearProgressIndicator`) in the sync-config tile when syncing.

### 3.2 `app_router.dart` — Main Shell + FABs

**Current design summary:** `MainShell` wraps every authenticated route. Body: `Column` with optional `ConnectivityBanner` + child. Floating buttons (vertical stack): menu FAB (small, dark teal), sync FAB (extended, primary, with progress spinner when syncing), pending-count badge (orange), AI FAB (custom gradient orange with scale animation on tap). `EpiBottomNav` at bottom (5 items: الرئيسية / النماذج / الحالة / التحليلات / الخريطة) with gradient background. Drawer is `AppDrawer` (wraps `EpiDrawer`).

**Current issues:**
- ❌ **4 overlapping FABs** in the bottom-right corner — visually cluttered and overlapping with `EpiBottomNav` labels.
- ❌ **"مزامنة" extended FAB always visible** — takes up significant screen real estate; should only appear when there's pending data or be hidden in the AppBar.
- ❌ **AI FAB hidden on `/ai`** but not on `/studio`, `/chat`, etc. — inconsistent.
- ❌ **`ConnectivityBanner` only shown when offline OR pending > 0** — good, but no transition animation.
- ❌ **`EpiBottomNav` is custom (not M3 `NavigationBar`)** — uses gradient background (non-standard). M3 spec recommends `surface` color with `secondaryContainer` indicator.
- ⚠️ `_AiFab` uses `GestureDetector` + `AnimatedScale` — no ink/ripple response; feels foreign.
- ⚠️ Menu FAB is `primaryDark` while sync FAB is `primaryColor` — two very similar teals; confusing which is which.

**Recommendations:**
- Move "sync" action into the AppBar of each list screen (refresh icon → sync) — removes one FAB.
- Move "menu" into a standard M3 `NavigationBar` (replaces `EpiBottomNav`) — drawer can be opened via a hamburger icon in each screen's AppBar.
- Hide AI FAB on `/ai`, `/studio`, `/chat` (any AI-related route).
- Make AI FAB a standard `FloatingActionButton` with M3 secondary container color, not a custom gradient.
- Add `AnimatedSwitcher` for `ConnectivityBanner` show/hide.

### 3.3 Shared Widgets — `EpiCard`, `EpiAppBar`, `EpiBottomNav`, `EpiEmptyState`

**`EpiCard`:** Defaults work but `elevation: 2` is non-M3 (should be 0 + tonal). `isGlass` flag exists but is barely used. No `border` parameter — many screens add their own `Border.all`.

**`EpiAppBar`:** Minimal — just wraps `AppBar` with back button. No gradient support, no title + subtitle support, no `flexibleSpace`. Most screens bypass it for custom `AppBar`s.

**`EpiBottomNav`:** Custom-painted; not M3 `NavigationBar`. Gradient background makes it hard to read white-on-teal text.

**`EpiEmptyState`:** Good — icon + title + subtitle + optional action button. But icon is `AppTheme.textHint` color (grey) — should be `primaryColor.alpha 0.3` for brand consistency. Also no illustration support (SVG).

**Recommendations:**
- `EpiCard`: Default `elevation: 0`, use `color: surfaceContainerLow`. Add `border` parameter. Add `variant: EpiCardVariant.elevated | filled | outlined`.
- `EpiAppBar`: Add `subtitle`, `gradient` (bool), `flexibleSpace` parameters. Make it the default for all screens.
- `EpiBottomNav`: Replace with M3 `NavigationBar` — `selectedIndex` + `destinations` + standard `indicatorColor: secondaryContainer`. Keep custom only if brand requires gradient (debatable).
- `EpiEmptyState`: Add optional `illustration` (SVG asset) parameter; tint icon with `primaryColor.alpha 0.3`.

---

## 4. Priority Redesign Recommendations

### 🔴 Tier 1 — Most Outdated (Redesign First)

1. **`submissions_screen`** + **`forms_status_screen`** — both use outdated page-based pagination, custom filtering logic, and inconsistent tile components. Redesign as a unified "Submissions Explorer" with infinite scroll, shared filter sheet, and bulk actions.

2. **`users_screen`** + **`forms_management_screen`** + **`references_management_screen`** — admin screens feel like a different app. They bypass `EpiAppBar`/`EpiCard`, lack search bars, and have N+1 query patterns. Redesign with: `EpiAppBar` + `EpiSearchBar` + stats row + `EpiCard` list + infinite scroll.

3. **`analytics_screen`** — amber accent breaks brand. Redesign with teal indicator, shorter title, date-range picker, and export actions.

4. **`notifications_screen`** — fix the Dismissible bug, add day grouping, add filter chips, add deep-linking.

5. **`chat_screen`** — switch to `EpiAppBar`, add read receipts, reactions, typing indicator.

### 🟡 Tier 2 — Polish Needed

6. **`profile_screen`** — add settings section (dark mode, language, notifications), logout button, change password.
7. **`submission_detail_screen`** — map form keys to Arabic labels, show photos, map preview, softer PDF button.
8. **`map_screen`** — add legend, scrim for top bar, filter sheet, clustering, "directions" button.
9. **`forms_screen`** — group by campaign, add search, clearer inactive state.
10. **`references_screen`** — add category filters, file type/size, download progress, favorites.

### 🟢 Tier 3 — Keep, Minor Tweaks

11. **`splash_screen`** — add logo animation, branded fallback icon, version text.
12. **`login_screen`** — convert forget-password to bottom sheet, add autofill hints, "remember me".
13. **`dashboard_screen`** — expand to 4 KPIs, add recent submissions list, sync progress indicator.
14. **`ai_chat_screen_v3`** — stop typing animation in `dispose`, add copy/regenerate actions, test tab labels on small screens.
15. **`epi_studio_screen`** — add loading skeleton, empty state, history navigation.

---

## 5. Shared Design Language — Apply Everywhere

To eliminate the inconsistency, every screen should adopt these patterns:

### 5.1 App Bar
- Use `EpiAppBar` (enhanced with `subtitle` + `gradient` params).
- Title: Cairo 18 bold. Subtitle: Tajawal 12 regular `onSurfaceVariant`.
- Leading: back button (auto) OR menu icon (when drawer exists).
- Actions: max 3 icons; more → overflow menu.

### 5.2 List Layout
- `RefreshIndicator` wrapping `ListView.builder` or `CustomScrollView`.
- Loading: `EpiLoading.shimmer()` (skeleton of expected layout).
- Empty: `EpiEmptyState` with branded illustration + action button.
- Error: `EpiErrorWidget` with retry button.
- Pagination: `ScrollController` + load-more on near-end (infinite scroll), not page-based.
- Stagger entry animation capped at 5 items.

### 5.3 Search & Filter
- `EpiSearchBar` at top of every list screen.
- Filter as `showModalBottomSheet` (rounded top 20), with `FilterChip` rows + "تطبيق" / "إعادة تعيين" buttons.
- Active filter count shown as a badge on the filter icon.

### 5.4 Cards
- `EpiCard` everywhere — no plain `Card` or `Container` with shadow.
- Active states: full opacity + primary-tinted icon background.
- Inactive states: "غير متاح" ribbon (not opacity dim).
- Tap target: full card with `InkWell` ripple.

### 5.5 Status Chips
- Use `EpiStatusChip` everywhere — extend it to cover all statuses (draft / pending_sync / submitted / reviewed / approved / rejected).
- Color-coded per `AppTheme.statusColor()` (extend the helper).

### 5.6 Buttons
- Primary: `FilledButton` (M3) with `primaryColor` background.
- Secondary: `OutlinedButton` with `primaryColor` foreground.
- Destructive: `FilledButton` with `errorColor` background (only for delete/destroy actions).
- Text-only: `TextButton` with `primaryColor` foreground.
- Icon buttons: `IconButton.filled` for primary actions, plain `IconButton` for toolbar actions.
- Min height 48dp, min width 48dp.

### 5.7 Spacing
- Use `AppTheme.spaces.xs/sm/md/lg/xl/xxl` (4/8/16/24/32/48).
- Screen horizontal padding: 16 (`md`).
- Section vertical gap: 24 (`lg`).
- Card internal padding: 16 (`md`).
- Button padding: 16h × 12v.

### 5.8 Typography
- Use `Theme.of(context).textTheme` (extended with Cairo/Tajawal).
- Display: Cairo 28 bold.
- Headline: Cairo 22 bold.
- Title: Cairo 18 semibold.
- Body: Tajawal 14 regular.
- Label: Tajawal 13 medium.
- Caption: Tajawal 11 regular `onSurfaceVariant`.

### 5.9 Animations
- Use `Durations.short1/2/3/4` (M3 standard: 100/200/300/400 ms).
- Entry: fade + slide (Offset(0, 0.15)) over 300 ms with `Curves.easeOutCubic`.
- Stagger: cap at 5 items, 50 ms per index.
- State changes: `AnimatedSwitcher` 200 ms.
- Loading: shimmer (not spinner) for list screens; spinner for buttons.

### 5.10 Accessibility
- All `IconButton`s have `tooltip`.
- All `TextField`s have `labelText` (not just `hintText`).
- Touch targets ≥ 48 dp (verify with `MediaQuery.textScaleFactor` of 1.3).
- Contrast ratio ≥ 4.5:1 for body text (verify white-on-teal areas).
- `Semantics` labels on icon-only buttons.
- `ExcludeSemantics` on decorative elements.

### 5.11 Arabic RTL
- All `Row`/`Column` children are RTL-aware (Flutter handles this automatically with `Directionality`).
- All `EdgeInsets` are symmetric or use `start`/`end` (not `left`/`right`) — **this is currently violated** in many screens (e.g., `margin: EdgeInsets.only(left: 8)` in badges).
- All `Align` use `Alignment.centerStart` / `centerEnd` (not `centerLeft`/`centerRight`).
- Text inputs with LTR content (email, phone, URL) use `textDirection: TextDirection.ltr` (login screen does this — pattern to follow).

### 5.12 Loading / Empty / Error States
- Every async screen implements all three states.
- Loading: shimmer skeleton (not spinner) for lists; spinner for buttons.
- Empty: branded illustration + title + subtitle + primary CTA.
- Error: friendly message + retry button + "تواصل مع الدعم" link.

---

## 6. Quick-Win Code Changes (Do These First)

| # | File | Change | Effort |
|---|------|--------|--------|
| 1 | `analytics_screen.dart:291` | Change `indicatorColor: Colors.amberAccent` → `indicatorColor: AppTheme.primaryColor` | 1 min |
| 2 | `analytics_screen.dart:284` | Shorten title to "التحليلات" | 1 min |
| 3 | `ai_chat_screen_v3.dart:dispose()` | Add `_typingAnimCtrl.stop()` | 1 min |
| 4 | `notifications_screen.dart:158` | Fix `Dismissible` bug — actually remove the notification from the list | 5 min |
| 5 | `forms_screen.dart:60` | Cap stagger animation at index 5: `duration: Duration(milliseconds: 400 + (index.clamp(0, 5) * 80))` | 2 min |
| 6 | `epi_drawer.dart:65` | Replace `fromLTRB(20, 50, 20, 20)` with `SafeArea` wrapper + `EdgeInsets.all(20)` | 5 min |
| 7 | `epi_drawer.dart:316` | Remove ✨ emoji from "استوديو المحتوى ✨" | 1 min |
| 8 | `app_router.dart:374` | Hide AI FAB on `/studio` and `/chat` too: `if (!location.startsWith('/ai') && !location.startsWith('/studio') && !location.startsWith('/chat'))` | 2 min |
| 9 | `app_theme.dart:466` | Extend `statusColor()` to cover all 6 statuses | 5 min |
| 10 | `references_management_screen.dart:330` | Replace plain `TextField` with `EpiSearchBar` | 5 min |

**Total quick-win effort: ~30 minutes for visible consistency improvements.**

---

## 7. Next Actions

1. **Apply the 10 quick-wins above** (30 min) — instant consistency boost.
2. **Extend `AppTheme`** with spacing tokens, duration tokens, and a complete `TextTheme` (1 hour) — unblocks all other redesigns.
3. **Enhance shared widgets** (`EpiAppBar`, `EpiCard`, `EpiBottomNav`, `EpiEmptyState`) to support the new patterns (2 hours).
4. **Redesign Tier 1 screens** (submissions, forms_status, users, forms_management, references_management, analytics, notifications, chat) — 1–2 days of work.
5. **Polish Tier 2 screens** (profile, submission_detail, map, forms, references) — 1 day.
6. **Minor tweaks on Tier 3** (splash, login, dashboard, ai_chat, epi_studio) — half a day.
7. **Add dark mode toggle** in profile + theme persistence (2 hours).
8. **Write a "Screen Template" doc** so future screens follow the shared design language (1 hour).

**Estimated total: 3–4 days for a comprehensive UI/UX refresh.**
