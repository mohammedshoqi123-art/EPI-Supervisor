# Changes Summary — EPI-Supervisor Mobile App

**Date:** 2026-07-19  
**Scope:** Critical + High + Medium priority fixes from code audit

---

## 🔴 Critical Fixes

### CR3: Duplicate Realtime Subscription ✅
**File:** `apps/mobile/lib/providers/realtime_sync_provider.dart`
- Removed duplicate `form_submissions` INSERT subscription
- Added debouncing (500ms) for provider invalidations to batch rapid changes
- Added missing subscriptions for `feedback_tickets` and `official_memos` tables

### CR2: Notification Polling ✅
**File:** `apps/mobile/lib/providers/app_providers.dart`
- Reduced notification polling interval from 300s to 60s for urgent notification delivery

---

## 🟠 High Priority Fixes

### HI1: N+1 Query in Forms Management ✅
**File:** `apps/mobile/lib/screens/forms_management_screen.dart`
- **Before:** 1 query for forms + N queries for each form's submissions (21 queries for 20 forms)
- **After:** 2 parallel queries (forms + all submissions) with stats computed in Dart
- Reduced from N+1 to 2 queries

### HI2: SubmissionsByLevelChart Cache Bypass ✅
**File:** `apps/mobile/lib/screens/dashboard_widgets.dart`
- **Before:** Direct `db.getSubmissions()` call that bypassed offline cache, loaded 10K records on every build
- **After:** Uses `submissionsProvider` with `SubmissionsFilter` for proper offline caching
- Converted from `ConsumerStatefulWidget` to `ConsumerWidget` for cleaner Riverpod integration

### HI5: Offline Memo/Ticket Caching ✅
**File:** `apps/mobile/lib/services/memos_feedback_service.dart`
- Added offline caching for memos (`memos_offline` cache key, 7-day TTL)
- Added offline caching for tickets (`tickets_offline` cache key, 7-day TTL)
- On network failure, falls back to cached data for offline viewing

### HI6: Server-Side Coordinate Fuzzing ✅
**File:** `supabase/migrations/058_server_side_coordinate_fuzzing.sql`
- **Before:** Coordinate hiding was client-side only (bypassable)
- **After:** `fetch_submissions` RPC fuzzes coordinates for lower roles (district, data_entry) with ±500m offset
- Client-side check remains as defense-in-depth

---

## 🟡 Medium Priority Fixes

### ME2: Cache Size Limit ✅
**File:** `packages/core/lib/src/offline/offline_manager.dart`
- Added 50MB cache size limit with LRU eviction
- When cache exceeds 50MB, evicts oldest entries until 80% (40MB)

### ME3: Hive Corruption Recovery ✅
**File:** `packages/core/lib/src/offline/offline_manager.dart`
- If Hive box fails to open (corrupted file from power loss), automatically deletes corrupted box and retries
- Logs recovery action for debugging

### ME4: Reactive Pending Count ✅
**Files:** `packages/core/lib/src/offline/offline_manager.dart`, `apps/mobile/lib/providers/app_providers.dart`
- **Before:** `syncPendingCountProvider` polled every 300s (badge stale for up to 5 minutes)
- **After:** Reactive stream (`pendingCountStream`) updates immediately on queue changes

---

## Additional Fixes

### References Screen URL Launch ✅
**File:** `apps/mobile/lib/screens/references_screen.dart`
- Replaced deprecated `canLaunchUrl` + `launchUrl` pattern with try-catch `launchUrl`

### Map Helpers Documentation ✅
**File:** `apps/mobile/lib/screens/map/map_helpers.dart`
- Added documentation noting server-side coordinate fuzzing as primary protection

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/mobile/lib/providers/realtime_sync_provider.dart` | Removed duplicate subscription, added debouncing, added missing table subscriptions |
| `apps/mobile/lib/providers/app_providers.dart` | Reduced notification polling, reactive pending count |
| `apps/mobile/lib/screens/forms_management_screen.dart` | Fixed N+1 queries |
| `apps/mobile/lib/screens/dashboard_widgets.dart` | Used submissionsProvider for offline cache |
| `apps/mobile/lib/screens/references_screen.dart` | Fixed deprecated URL launch |
| `apps/mobile/lib/screens/map/map_helpers.dart` | Added documentation |
| `apps/mobile/lib/services/memos_feedback_service.dart` | Added offline caching for memos and tickets |
| `packages/core/lib/src/offline/offline_manager.dart` | Cache size limits, corruption recovery, reactive pending count stream |
| `supabase/migrations/058_server_side_coordinate_fuzzing.sql` | New migration for server-side coordinate fuzzing |

---

## Not Modified (Deferred)

| Issue | Reason |
|-------|--------|
| AI Chat Screen refactoring (3199 lines) | User requested separate detailed work later |
| Analytics Screen refactoring (2612 lines) | Large refactoring, deferred |
| Forms Status Screen refactoring (1831 lines) | Large refactoring, deferred |
| Channel messages offline caching | Requires significant refactoring |
| GPS fallback for non-GMS devices | Requires platform-specific code |
| Firebase push notifications | Requires Firebase project configuration |

---

## Next Steps

1. **Test all changes** — Run the app and verify each fix works correctly
2. **Apply migration 058** — Run `supabase db push` to apply coordinate fuzzing
3. **Commit and push** — After user approval
