# Changelog — منصة مشرف EPI

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `maxAgeMonths` field on `Vaccine` model with `canBeAdministeredAtAge()` and `isOverdueAtAge()` helpers — enforces medical age limits programmatically (BCG ≤ 12mo, Rota ≤ 24mo, most others ≤ 60mo, Td ≤ 84mo).
- Migration `034_submission_photos_visibility.sql` — allows supervisors (admin/central/governorate/district) to view submission photos in their region for oversight.
- `.github/dependabot.yml` — weekly dependency updates for pub (mobile/core/shared/features), npm (admin-web), and GitHub Actions.
- `.github/CODEOWNERS` — code ownership rules.
- `.github/PULL_REQUEST_TEMPLATE.md` — structured PR template.
- `.github/ISSUE_TEMPLATE/bug_report.md` and `feature_request.md`.
- `CHANGELOG.md` (this file).

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
