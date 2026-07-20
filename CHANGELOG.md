# Changelog — منصة مشرف EPI

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v3.14.0] — 2026-07-21

### Fixed — 27 إصلاح شامل (4 مراحل)

#### P0 — إصلاحات حرجة (8):
- Encryption decrypt: لم يعد يُرجع فارغ للـ format القديم (كان يُمسح كل البيانات المخزنة)
- _withRetry: الآن يُطبق على select, callFunction, rpc (كان معرّف لكن لا يُستخدم)
- count(): الآن يُرمي exception بدل إرجاع 0 صامت (كان Dashboard يُظهر 0)
- ConnectivityUtils: الآن ينتظر أول probe (كان يبدأ offline رغم وجود إنترنت)
- RealtimeSync: الآن يُحفظ drafts + dialog قبل force logout (كان يمسح كل شيء فوراً)
- syncPendingItems: الآن محمي بـ _withWriteLock (كان فيه race condition)
- Auto-save: الآن ي.retry Isolate بدل fallback على UI thread (كان يُجمد UI)
- Hive corruption: الآن يستخدم path_provider لتحديد المسار (كان الـ backup يفشل دائماً)

#### P1 — إصلاحات متوسطة (12):
- Dashboard: حفظ StreamSubscription + إلغاء في dispose (كان فيه listener leak)
- Sync queue: Hive keys منفصلة لكل عنصر O(1) (كان O(n) يُشفّر كامل الطابور)
- Session refresh: فحص connectivity قبل التجديد (كان يعمل حتى offline)
- Realtime reconnect: فحص connectivity قبل إعادة الاتصال (كان يعمل حتى offline)
- Pagination fallback: timeout 45s + page size 500 (كان 1000 صف بدون timeout)
- SyncService timeout: حفظ فوري في failed_submissions (كان يُحاولة 5 مرات)
- _findRelatedCache: prefix matching أكثر دقة (كان يُرجع بيانات حملة مختلفة)
- _prefetchCriticalData: انتظار supabaseInitialized (كان يُنشئ instance جديد)
- FullSync: Completer بدلاً من إرجاع empty (كان يُخفي أن sync يعمل)
- authRepositoryProvider: 3 محاولات مع exponential backoff (كان ينتظر 2s فقط)
- EncryptionService: retry Isolate بدل fallback على UI thread (كان يُجمد UI)
- Incremental sync: تقليل إلى 3 (كان 5) لكشف أسرع للمحذوفات

#### P2 — إصلاحات أمان (5):
- Encryption key: flutter_secure_storage بدلاً من binary embedding
- Payload size: تقليل إلى 2MB + صور 1024px/75% (كان 5MB + 1280px/85%)
- Avatar fallback: إزالة base64 fallback (كان يُبطئ profiles table)
- Drafts index: تشفير قبل الكتابة (كان plain JSON)
- Cairo-Variable.ttf: حذف (600KB توفير)

#### P3 — تحسينات (2):
- AdvancedCacheManager: حذف dead code
- SplashScreen: Completer بدلاً من polling

### Added:
- DEVELOPER_GUIDE.md — دليل المطور الشامل
- flutter_secure_storage — مفتاح تشفير فريد لكل جهاز
- awaitSupabaseReady() — Completer لانتظار Supabase
- onUserDeactivated stream — إشعار تعطيل الحساب

### Changed:
- Auto-save interval: 60s → 120s
- Photo compression: 1280px/85% → 1024px/75%
- Max payload: 5MB → 2MB
- Pagination page size: 1000 → 500
- Connectivity recheck: 60s → 120s
- Incremental sync full refresh: every 5 → every 3

### Removed:
- AdvancedCacheManager (dead code)
- Cairo-Variable.ttf (unused font, 600KB)
- 21 old audit reports → docs/archive/
- 2 old PDF reports → deleted

### Project Structure:
- Reorganized docs/ directory
- Moved SQL files to docs/
- Created docs/archive/ for old reports
- Created docs/fixes-2026-07/ for new reports

## [Unreleased]

### Added — Dark Mode + Settings + Coverage 25% + Theme Tests (Phase 9)

Dark Mode:
- Dark mode toggle in profile screen with PopupMenuButton (System/Light/Dark)
- Uses existing themeModeProvider (was declared but had no UI)
- Dark theme already defined in AppTheme — now accessible to users
- Visual feedback: shows current mode label and icon

Settings Section:
- New "الإعدادات" section in profile screen with settings_outlined icon
- Dark mode toggle with Semantics (toggle, label, hint)
- Shows current state: مفعّل / معطّل / تلقائي (حسب النظام)

i18n:
- Added 10 new settings keys: dark_mode, dark_mode_enabled/disabled/system/auto/light/dark, account_info, app_info
- Total i18n keys: 125+

CI:
- Coverage threshold raised from 20% to 25% (hard fail)

Tests:
- New theme_and_settings_test.dart: 20+ tests covering AppTheme (colors, gradients, shadows, severity), ThemeMode enum, i18n settings keys, EpiButton with Semantics (label, disabled, loading), EpiStatCard with Semantics (label, trend, no-tap), EpiTextField with Semantics (label, obscured)

### Added — FCM + Forget Password + Splash + i18n Expansion (Phase 8)

FCM Push Notifications:
- New `FcmNotificationService` class in core package — local notification scheduling + display
- `flutter_local_notifications` dependency added to pubspec.yaml
- Initialized in `main.dart` with permission request on app launch
- Pre-built notification helpers: `notifySyncComplete()`, `notifySubmissionConfirmed()`, `notifyShortageAlert()`
- Android notification channel management
- iOS + Android 13+ permission handling

Login:
- "نسيت كلمة المرور؟" link added below login button
- Forget password dialog sends `resetPasswordForEmail()` via Supabase Auth
- Email validation before send
- Success/failure SnackBar feedback

Splash Screen:
- Reduced artificial delays: 500ms → 200ms for logo display
- Removed 500ms delay on Supabase-not-configured path
- Removed 300ms delay on no-session path
- Total perceived latency reduced from 800ms+ to 200ms

i18n:
- Added 14 new Arabic keys: splash (4), login (6), notifications (6)
- Total i18n keys: 110+

### Added — Realtime + Sentry + Isolate + iOS + i18n (Phase 7)

Realtime:
- Replaced 4-second polling in `chat_screen.dart` with Supabase Realtime channel subscription — instant message updates with 90% less network traffic
- Added fallback to 10-second polling if realtime fails
- Added message length validation (max 1000 chars) to prevent oversized payloads
- Removed client-side `created_at` timestamp (server sets it to avoid time drift)

Sentry:
- Initialized `SentryConfig.init()` in `main()` — production crashes now reported
- Sentry wraps the entire app runner (connectivity, Supabase, runApp) for full error capture
- If SENTRY_DSN is not configured, app runs normally without Sentry

Performance:
- Moved base64 photo encoding to background isolate via `compute()` in `form_fill_screen.dart` — prevents UI jank when encoding multiple large photos
- Added fallback to main-thread encoding if isolate fails
- Top-level `_encodePhotosToBase64` function reads files synchronously in isolate

iOS:
- Added `build-ios` job to CI workflow — runs on macOS runner
- Uses `flutter build ios --no-codesign` for compilation verification
- Only runs on `main` branch (not PRs) to save macOS runner minutes

i18n:
- Added 15 new Arabic keys: chat (5), profile (9), onboarding (3)
- Total i18n keys: 95+

### Fixed — Mobile App Comprehensive Improvements (Phase 6)

Critical fixes:
- RBAC guards added to admin routes (/users, /forms-management, /references-management, /analytics) — prevents data_entry users from accessing admin screens
- Cache key mismatch in form_fill_screen.dart fixed — now tries campaign-specific key first, then 'forms_all' fallback
- Onboarding timeout defaults to false (show onboarding) instead of true (skip) on slow devices
- Dashboard now reactive to campaign changes (ref.watch instead of ref.read)
- Forms screen pull-to-refresh uses correct campaign-specific cache key

High severity fixes:
- GPS type cast crash fixed — uses (as num?)?.toDouble() instead of as double
- _getInitials crash on whitespace-only names fixed — filters empty parts
- Search debouncing (300ms) added to forms_status_screen — prevents jank on every keystroke
- Dismissible.onDismissed in notifications_screen now removes item from local list
- Login retry skipped when offline — saves 6 seconds of pointless retries
- Typing animation in ai_chat_screen_v3 only runs during loading (not infinitely)
- Full sync tracks success count — reports error state if all steps return 0 items
- Silent catch blocks in main.dart now log errors via debugPrint
- Dashboard background sync error now logged

UX improvements:
- Profile screen cancel button added — exit edit mode without saving
- Profile edit/save buttons now have tooltips for accessibility

Security/Config:
- AndroidManifest: removed deprecated READ/WRITE_EXTERNAL_STORAGE and requestLegacyExternalStorage
- AndroidManifest: added POST_NOTIFICATIONS permission for Android 13+
- AndroidManifest: added android:allowBackup="false" (sensitive health data)
- .env.example: documented all AI API keys (HF_API_TOKEN, ZAI_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY, MIMO_API_KEY)
- .env.example: ENCRYPTION_KEY placeholder changed to obvious <REPLACE_WITH_32_CHAR_MINIMUM_KEY>
- debugLogDiagnostics set to kDebugMode only (was always true)

### Added — AI Development (Phase 3)
- **`SmartRecommendationsEngine`** — new AI engine that analyzes system data and generates intelligent recommendations for administrative decisions:
  - `analyzeSubmissionTrends()` — detects low performance, declining trends, sudden drops, and high performers
  - `predictShortage()` — predicts vaccine shortages based on consumption patterns and safety stock levels
  - `analyzeCoverageGaps()` — identifies critical gaps (<50%), below-target areas (50-90%), and top performers
  - `prioritizeRecommendations()` — sorts by priority (critical > high > medium > low > informational), then impact, then confidence
  - `generateExecutiveSummary()` — produces Arabic executive summary with counts by priority
  - `Recommendation` model with confidence scoring, action items, metadata, and JSON serialization
- **`PredictiveAnalyticsEngine`** — new AI engine using statistical models for forecasting:
  - `predictLinear()` — linear regression for trending data
  - `predictMovingAverage()` — moving average for stable data
  - `predictExponentialSmoothing()` — exponential smoothing for noisy trending data
  - `predictBestFit()` — auto-selects the best model based on confidence
  - `detectSeasonality()` — detects seasonal patterns (e.g., weekly cycles)
  - `evaluateAccuracy()` — hold-out validation with MAE, RMSE, MAPE, R²
  - `generateForecastReport()` — Arabic forecast report with confidence warnings
  - `PredictionResult` and `PredictionAccuracy` models with JSON serialization

### Added — Tests (Phase 3)
- **`smart_recommendations_test.dart`** — 50+ tests covering all SmartRecommendationsEngine methods: analyzeSubmissionTrends (empty, low perf, declining, sudden drop, high perf), predictShortage (empty, zero stock, predicted, critical, ample, vaccine name), analyzeCoverageGaps (empty, critical, below target, top performers, mixed), prioritizeRecommendations ordering, generateExecutiveSummary, Recommendation confidence calculation
- **`predictive_analytics_test.dart`** — 50+ tests covering all PredictiveAnalyticsEngine methods: predictLinear (empty, single, perfect linear, constant, negative clamping, metadata), predictMovingAverage (empty, stable, window, confidence), predictExponentialSmoothing (empty, constant, alpha sensitivity, metadata), predictBestFit (trending, stable, <2 points, model selection), detectSeasonality (insufficient data, weekly pattern, cycle 0, all-equal), evaluateAccuracy (insufficient, linear, MAPE, quality score, quality label), generateForecastReport (empty, metric name, confidence, warnings, model label), PredictionResult/PredictionAccuracy serialization

### Changed — CI (Phase 3)
- Raised coverage threshold from 5% to 10% (hard fail) after adding 190+ new tests in Phase 2.

### Added
- `maxAgeMonths` field on `Vaccine` model with `canBeAdministeredAtAge()` and `isOverdueAtAge()` helpers — enforces medical age limits programmatically (BCG ≤ 12mo, Rota ≤ 24mo, most others ≤ 60mo, Td ≤ 84mo).
- Migration `034_submission_photos_visibility.sql` — allows supervisors (admin/central/governorate/district) to view submission photos in their region for oversight.
- `.github/dependabot.yml` — weekly dependency updates for pub (mobile/core/shared/features), npm (admin-web), and GitHub Actions.
- `.github/CODEOWNERS` — code ownership rules.
- `.github/PULL_REQUEST_TEMPLATE.md` — structured PR template.
- `.github/ISSUE_TEMPLATE/bug_report.md` and `feature_request.md`.
- `CHANGELOG.md` (this file).

### Added (Tests & Accessibility — Phase 2)
- **`api_client_test.dart`** — 30+ tests covering ApiClient sentinels, instantiation, PostgrestException code mapping (PGRST116, 23505, 23503, 42501, 22P02, 5xx), FunctionException HTTP status mapping (401/403/429/5xx), AppException hierarchy coverage.
- **`auth_repository_test.dart`** — 40+ tests covering instantiation, signIn/signOut/updateProfile/uploadAvatar without configuration, AuthState JSON round-trip serialization, UserRole hierarchy & permissions (canManage, canAccessAdminDashboard, etc.), legacy `teamLead` role backward compat.
- **`database_service_test.dart`** — 40+ contract tests verifying every method signature (getUsers, getForms, getSubmissions, submitForm, updateSubmissionStatus, getShortages, getAuditLogs, etc.), parameter validation, soft-delete contract (no public hard-delete methods).
- **`analytics_service_test.dart`** — 30+ tests covering AnalyticsService contract + LocalAnalyticsEngine pure functions: mean, standardDeviation, median, detectAnomalies, linearRegression, predictNext, topCategories, healthScore, generateInsights, detectSuddenChanges.
- **`submit_form_validation_test.ts`** — 25+ Deno tests for Edge Function validation: ROLE_HIERARCHY, validateSubmissionPermissions (admin/central/governorate/district/data_entry), GPS coordinates (Yemen boundaries), status, payload size, form_id, photos, edge cases.
- **`sync_offline_test.ts`** — 25+ Deno tests for batch sync: MAX_BATCH_SIZE boundary, validateBatchSize, validateItem, buildExistingMap, processItem (duplicate/new/error), buildSummary, full batch flow, edge cases.
- **Semantics widgets** for accessibility — added to 6 shared widgets:
  - `EpiButton` — exposes label, disabled state, loading state
  - `EpiTextField` — exposes label, hint, obscured text indicator
  - `EpiDropdown` — exposes label and current value
  - `EpiStatCard` — announces stat value + title + trend as single unit
  - `EpiStatusChip` — announces "الحالة: <status>"
  - `EpiSearchBar` — exposes "حقل البحث" label + clear button tooltip
- **Staging environment**: migration `034_submission_photos_visibility.sql` applied to staging (gbgwokizfrjxdfgpdhsr.supabase.co) — verified policies are live.

### Changed
- `env_validator.dart`: ENCRYPTION_KEY warning now correctly reports it as `🚨 CRITICAL` (was misleadingly marked "Optional: using default" — there is no default, the app crashes on first encryption).
- `vaccination_service.dart`: `getVaccinesDueAtAge`, `getOverdueVaccines`, and `getOverdueVaccinesDetailed` now respect `maxAgeMonths` — vaccines past their max age are excluded (no longer suggested as overdue).
- `knowledge_chunks.ts` (Edge Function): synchronized chunks 40, 45, 50 with the corrected `local-knowledge.ts`:
  - Chunk 40: vitamin A dose corrected from 200,000 → 100,000 IU; interval corrected from "3 months" → "6 months" after second visit; added BCG max-age note.
  - Chunk 45: added BCG/Rota max-age warnings; fixed typo "2000" → "100,000".
  - Chunk 50: added missing "Example 5 — 3-year-old child" case.
- Replaced 35 bare `print()` calls with `debugPrint()` in production code (offline, sync, api, cache, config, rag).

### Removed — Dead Code Cleanup (~6,450 lines)
- `supabase/functions/ai-chat-v3/index_v3_backup.ts` (966 lines) — unused backup file.
- `apps/mobile/lib/screens/ai_chat_screen_v2.dart` (1382 lines) — replaced by v3, no router reference.
- `packages/core/lib/src/ai/epi_knowledge_base_v2.dart` (545 lines) — duplicate class name with v1, never imported.
- `packages/core/lib/src/ai/hybrid_ai_service.dart` (44 lines) — never instantiated.
- `packages/core/lib/src/ai/local_ai_service.dart` (468 lines) — never instantiated.
- `packages/core/lib/src/ai/unified_ai_provider.dart` (408 lines) — never instantiated.
- `packages/core/lib/src/ai/smart_analytics.dart` (348 lines) — never used outside its own file.
- `packages/core/lib/src/ai/bot/supervision_module.dart` (507 lines) — never imported.
- `packages/core/lib/src/ai/ai_router.dart` (334 lines, v1) — replaced by `ai_router_v2.dart`.
- `packages/core/lib/src/ai/local_ai_engine.dart` (71 lines) — only used by deleted `hybrid_ai_service.dart`.
- `packages/core/lib/src/ai/gemini_service.dart` (225 lines) — only used by deleted `hybrid_ai_service.dart` and a dead provider.
- `packages/core/lib/src/ai/groq_service.dart` (368 lines) — only used by deleted `unified_ai_provider.dart`.
- `apps/mobile/lib/providers/sync_providers.dart` (132 lines) — v2 sync providers, never used by UI.
- `packages/core/lib/src/offline/intelligent_offline_manager.dart` (364 lines) — v2 sync, never instantiated.
- `packages/core/lib/src/offline/sync_queue_v2.dart` (403 lines) — v2 sync, only used by deleted `intelligent_offline_manager.dart`.
- `packages/core/lib/src/offline/enhanced_sync_service.dart` (717 lines) — never used outside its own file.
- `packages/shared/lib/src/widgets/sync_status_widgets.dart` (466 lines) — never exported, never imported.
- `geminiServiceProvider` from `app_providers.dart` — referenced deleted `GeminiService` class.
- Cleaned up exports in `epi_core.dart` and `ai_export.dart` to match.

### Security
- Storage policy `034_submission_photos_visibility.sql` fixes broken supervision workflow — supervisors can now view submission photos in their region (previously only photo owners could view).

### Medical Accuracy
- All Yemen EPI vaccine data now programmatically enforces `maxAgeMonths` — prevents the system from suggesting vaccines past their medical age limit (e.g., BCG for a 3-year-old).
- Edge Function knowledge base synchronized with the corrected web knowledge base — eliminates contradictions between AI bot responses on different platforms.

## [2.2.0] — 2026-04-18

### Added
- CodeQL Security Scanning workflow (weekly + on push/PR).
- Staging deployment workflow (`deploy-staging.yml`).
- PBKDF2 iterations raised to 600,000 (OWASP 2023 recommendation).
- 5-tier RBAC enforced across Router Guards + Edge Functions + RLS.
- Offline-First architecture with Priority Queue, Exponential Backoff, Dead-Letter Queue, 4 Conflict Resolution strategies.
- 17 Edge Functions with JWT verification, rate limiting (fail-closed), input sanitization, prompt injection detection.
- Yemen EPI vaccination schedule (26 vaccines) with Arabic/English metadata.
- AI Copilot v3 with Groq primary + 4 fallback providers + RAG + tool calling + streaming.
- 27 report types (PDF + Excel + PPTX) with Arabic RTL.
- Scheduled reports with pg_cron + Resend email delivery.

### Security
- AES-256-GCM encryption at rest for all local Hive data.
- CORS fail-closed on all Edge Functions.
- Rate limiting: 10/min for submit-form, 20/min for sync-offline, 10/5min for create-admin.
- Hierarchical permission checks on form submissions.
- `exec_sql()` function restricted to SELECT-only with deny list + 5s timeout + 500 row cap.

[Unreleased]: https://github.com/mohammedshoqi123-art/EPI-Supervisor/compare/main...develop
[2.2.0]: https://github.com/mohammedshoqi123-art/EPI-Supervisor/releases/tag/v2.2.0
