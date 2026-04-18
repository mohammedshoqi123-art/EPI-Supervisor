# EPI Supervisor — Issues Found & Fixes

## 🔴 Critical Issues

### 1. Duplicate Export in epi_core.dart
- `local_repository.dart` exported twice
- **Fix**: Remove duplicate line

### 2. CORS Open to All Origins
- All Edge Functions use `Access-Control-Allow-Origin: '*'`
- **Fix**: Add project-specific origin via env variable

### 3. Rate Limiting Fail-Open
- If rate limit RPC fails, request is allowed by default
- **Fix**: Changed to fail-closed for critical operations

### 4. Missing Seed Data Migration
- README mentions `002_seed_data.sql` but file doesn't exist
- **Fix**: Create seed data file with Yemen governorates

### 5. Tests Failing in CI (Root Cause Fixed)
- Model classes (`SyncQueueEntry`, `ConflictStrategy`, `DataConflictV2`, etc.) defined in files importing `hive_flutter`
- Unit tests import these classes but fail because `hive_flutter` requires Flutter engine
- **Fix**: Extracted all pure-Dart models/enums to `sync_models.dart` (no platform deps)
- Updated imports in test files to use `sync_models.dart` directly
- Restored CI to make tests fatal (was temporarily set to warning-only)

## 🟡 Medium Issues

### 6. References Table Name Mismatch
- DatabaseService queries `'references'` table but actual table is `doc_references`
- **Fix**: Correct table name in DatabaseService

### 7. getUnreadNotificationCount Returns Inaccurate Count
- Uses `limit: 1` so returns 0 or 1, not actual count
- **Fix**: Use proper count query

## 🟢 Low Issues

### 8. SENTRY_DSN Secret Missing
- CI references `SENTRY_DSN` but it's not in GitHub secrets
- **Fix**: Add SENTRY_DSN as optional secret or use NOT_SET default

### 9. CI Uses `--no-fatal-infos` But May Have Warnings
- Already handled with flag

---

# Security Audit Fixes — 2026-04-18

## 🔴 Critical

### 10. verify_jwt = false on All Edge Functions
- **Problem**: All Edge Functions had `verify_jwt = false` in `supabase/config.toml`, meaning JWT verification was skipped at the Edge proxy layer
- **Impact**: Defense-in-depth was missing — if a code bug skipped manual JWT validation, requests bypassed auth
- **Fix**: Set `verify_jwt = true` for all 15 Edge Functions + added comments explaining the security rationale

### 11. CI Deploys Functions with `--no-verify-jwt`
- **Problem**: `ci.yml` deployed all functions with `--no-verify-jwt` flag, overriding config.toml
- **Fix**: Removed `--no-verify-jwt` from deploy command; functions now respect config.toml per-function settings

### 12. Dead AI Chat Versions (v1, v2)
- **Problem**: Three AI chat versions existed: `ai-chat/`, `ai-chat-v2/`, `ai-chat-v3/`. Only v3 was active but old versions still deployed
- **Fix**: 
  - Updated `AIChatWidget.tsx` (admin web) to use `ai-chat-v3` instead of `ai-chat`
  - Updated `SupabaseConfig.fnAiChat` to point to `ai-chat-v3`
  - Removed `fnAiChatV2` constant
  - Deleted `supabase/functions/ai-chat/` and `supabase/functions/ai-chat-v2/`
  - Removed old function entries from `config.toml`

### 13. Export Data Without Rate Limiting
- **Problem**: `export-data` Edge Function had no rate limiting, unlike other functions
- **Impact**: Valid credentials could spam unlimited export requests
- **Fix**: Added `checkExportRateLimit()` with DB-backed rate limiting (5 exports per minute, fail-closed)

## 🟡 Medium

### 14. CI: build_runner with `|| true` (Error Swallowing)
- **Problem**: Two places in `ci.yml` used `|| true` to suppress build_runner failures, allowing stale generated code to ship
- **Fix**: Removed `|| true` from both locations — CI now fails if code generation fails

### 15. .gitignore Duplicates & Contradictions
- **Problem**: Bottom of `.gitignore` had duplicate entries (`.dart_tool/`, `build/`, `.env`, `*.freezed.dart`) and a contradictory `*.g.dart` entry
- **Fix**: Cleaned up duplicates; removed `*.g.dart` from ignore list (as the comment at top says these should be committed)
