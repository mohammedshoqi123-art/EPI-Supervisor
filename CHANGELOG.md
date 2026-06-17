# Changelog — منصة مشرف EPI

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
