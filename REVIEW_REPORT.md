# EPI-Supervisor Mobile App — Comprehensive Code Audit Report

**Version:** 3.13.2+59  
**Date:** 2026-07-19  
**Auditor:** Senior Flutter Developer (AI-Assisted)  
**Scope:** Full codebase audit — 66 Dart files, 3 packages  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Online/Offline Analysis](#3-onlineoffline-analysis)
4. [Page-by-Page Audit](#4-page-by-page-audit)
5. [Services Analysis](#5-services-analysis)
6. [Providers Analysis](#6-providers-analysis)
7. [Router Analysis](#7-router-analysis)
8. [Shared Packages Analysis](#8-shared-packages-analysis)
9. [Critical Issues Summary](#9-critical-issues-summary)
10. [Recommendations & Roadmap](#10-recommendations--roadmap)

---

## 1. Executive Summary

### Overall Assessment: **B+ (Good — Production-Ready with Notable Issues)**

The EPI-Supervisor mobile app is a well-architected Flutter application for health immunization supervision in Yemen. It demonstrates strong engineering practices including offline-first design, RBAC, Arabic/RTL support, and comprehensive error handling. However, several critical issues need attention before wide-scale deployment to governorates and directorates.

### Key Strengths
- ✅ Robust offline-first architecture with Hive + sync queue
- ✅ Real connectivity verification (HTTP probes, not just link status)
- ✅ Non-blocking Supabase initialization (app starts immediately)
- ✅ Comprehensive RBAC with route-level guards
- ✅ Arabic-first UI with Tajawal/Cairo fonts and RTL layout
- ✅ Well-structured Riverpod providers with proper caching
- ✅ Realtime sync via Supabase channels
- ✅ Auto-save drafts with encryption

### Key Concerns
- ⚠️ Several files are excessively large (3000+ lines) — maintainability risk
- ⚠️ Duplicate Supabase realtime subscription in `realtime_sync_provider.dart`
- ⚠️ Some screens bypass the offline cache and hit Supabase directly
- ⚠️ Firebase push notifications are stubbed (not functional)
- ⚠️ No integration tests; limited unit test coverage
- ⚠️ Some security concerns with direct Supabase client usage in screens

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────┐
│                  Mobile App                  │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Screens │ │ Providers│ │   Router     │  │
│  │ (43)    │ │ (3)      │ │ (GoRouter)   │  │
│  └────┬────┘ └────┬─────┘ └──────┬───────┘  │
│       │           │              │           │
│  ┌────▼───────────▼──────────────▼───────┐  │
│  │           Services (7)                │  │
│  └────────────────┬──────────────────────┘  │
│                   │                          │
│  ┌────────────────▼──────────────────────┐  │
│  │        epi_core (packages/core)        │  │
│  │  Auth • DB • Offline • Sync • AI • RBAC│  │
│  └────────────────┬──────────────────────┘  │
│                   │                          │
│  ┌────────────────▼──────────────────────┐  │
│  │       epi_shared (packages/shared)     │  │
│  │  Theme • Widgets • Models • Extensions │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
         │                    │
    ┌────▼────┐         ┌────▼────┐
    │ Supabase│         │  Hive   │
    │ (Cloud) │         │(Offline)│
    └─────────┘         └─────────┘
```

**State Management:** Riverpod 2.x with `FutureProvider`, `StreamProvider`, `StateNotifierProvider`  
**Navigation:** GoRouter 14.x with shell route for bottom nav + drawer  
**Offline:** Hive 2.x with encrypted storage + sync queue  
**Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)

---

## 3. Online/Offline Analysis

### 3.1 Connectivity Plus Integration

**File:** `packages/core/lib/src/utils/connectivity_utils.dart`

**Rating: Excellent ✅**

The connectivity implementation is one of the best parts of the codebase. Key strengths:

- **HTTP probe verification** — Doesn't rely solely on `connectivity_plus` which reports "wifi connected" even with no internet (captive portal, DNS failure). Does actual HTTP HEAD requests to `google.com/generate_204` and `cloudflare.com/cdn-cgi/trace`.
- **Parallel probes** — All probe URLs fire simultaneously (4s worst case regardless of URL count).
- **Throttled emissions** — 2-second minimum interval prevents event storms.
- **Periodic recheck** — Every 120s when "online" to catch captive portals.
- **Optimistic start** — App assumes online initially, corrected by first probe.
- **Manual recheck** — `recheckNow()` available for user-initiated retry.

**Issues Found:**

| # | Severity | Issue | Details |
|---|----------|-------|---------|
| C1 | Low | Probe URLs may be blocked | Google and Cloudflare may be blocked in some Yemeni networks. Consider adding `https://supabase.com` or a regional endpoint. |
| C2 | Low | No DNS-only check | Could add a quick DNS resolution check before HTTP probe for faster offline detection. |
| C3 | Info | `_isOnline` starts as `true` | Optimistic assumption is correct but could briefly show "online" banner when actually offline on first launch. |

### 3.2 Hive Offline Storage

**File:** `packages/core/lib/src/offline/offline_manager.dart`

**Rating: Good ✅**

- **Encrypted storage** — PBKDF2 key derivation in background isolate (600k iterations).
- **Key pinning** — Key derived once, reused for all operations (<1ms per encrypt/decrypt).
- **Salt persistence** — Stored in Hive, survives app restarts.
- **New format detection** — Magic bytes `EPI2` distinguish new vs old encryption format.
- **5MB payload limit** — Increased from 1MB (was rejecting submissions with 2+ photos).

**Issues Found:**

| # | Severity | Issue | Details |
|---|----------|-------|---------|
| O1 | Medium | No data migration strategy | If encryption key changes, all cached data becomes unreadable. No re-encryption migration path. |
| O2 | Medium | Hive box corruption recovery | If Hive box corrupts (power loss during write), the app may crash. Should add try-catch around box operations with box deletion fallback. |
| O3 | Low | No cache size limit | Cache grows unbounded. Should implement LRU eviction or max cache size (e.g., 50MB). |

### 3.3 Supabase Realtime Sync

**File:** `providers/realtime_sync_provider.dart`

**Rating: Good with Issues ⚠️**

- **Single channel** — Uses one `RealtimeChannel` for all tables (performance win over 5 separate channels).
- **Profile deactivation detection** — Forces logout if current user is deactivated.
- **Form submissions tracking** — Listens for insert/update on `form_submissions`.

**Issues Found:**

| # | Severity | Issue | Details |
|---|----------|-------|---------|
| R1 | **High** | **Duplicate subscription** | `form_submissions` INSERT is registered **twice** (lines ~68 and ~80). This causes duplicate event processing and unnecessary provider invalidations. |
| R2 | Medium | No connection state handling | If the realtime channel disconnects (network blip), there's no automatic reconnection logic beyond Supabase's built-in retry. Should add a connection state listener. |
| R3 | Medium | Missing tables | `feedback_tickets`, `official_memos`, `feedback_responses` are not subscribed. Changes by other users won't appear until manual refresh. |
| R4 | Low | No batching of invalidations | Multiple rapid changes trigger multiple `ref.invalidate()` calls. Should debounce invalidations (e.g., 500ms). |

### 3.4 Offline/Online State Management

**Rating: Good ✅**

- **ConnectivityBanner** in `MainShell` shows offline/pending status.
- **Force-refresh provider** preserves cache when offline (prevents data loss).
- **Forms provider** returns ALL cached forms when offline (doesn't filter inactive).
- **Sync service** debounces sync attempts (10s window) and checks connectivity before syncing.
- **Auto-save** in FormFillScreen every 60s (was 30s — reduced for PBKDF2 cost).

**Issues Found:**

| # | Severity | Issue | Details |
|---|----------|-------|---------|
| S1 | Medium | No offline indicator on individual screens | Users may not realize they're viewing stale data. Should add a subtle "offline data" indicator on data-heavy screens. |
| S2 | Low | Pending count polling at 300s | `syncPendingCountProvider` polls every 300s. If a submission is saved, the badge won't update for up to 5 minutes. Should use a reactive stream instead. |

---

## 4. Page-by-Page Audit

### 4.1 Login Screen (`login_screen.dart` — 26KB)

**Rating: Excellent ✅**

| Category | Assessment |
|----------|------------|
| **Issues** | None critical. Biometric login correctly checks for stored session. |
| **Code Quality** | Clean, well-structured. Proper animation controllers with dispose. |
| **Security** | ✅ Email validation, password length check. ✅ No credentials stored in plaintext. ✅ Password reset via Supabase Auth (not custom). |
| **UX/UI** | ✅ Loading state, error messages in Arabic, forget password dialog. ✅ Animated entrance. |
| **Offline** | ✅ Detects offline and skips retries. Shows appropriate error message. |
| **RTL** | ✅ Proper RTL layout via parent `Directionality`. |
| **Suggestions** | Add "Remember me" checkbox (currently remembers by default via Supabase session). |
| **New Features** | Add SSO/SAML support for government SSO integration. |

### 4.2 Splash Screen (`splash_screen.dart` — 7.4KB)

**Rating: Good ✅**

| Category | Assessment |
|----------|------------|
| **Issues** | N1: Navigates to `/dashboard` when Supabase isn't ready after 15s — GoRouter redirect handles it, but could show a brief flash of the dashboard before redirecting to login. |
| **Code Quality** | Clean. Proper timer management with cancel in dispose. |
| **Security** | ✅ No sensitive data exposure. |
| **UX/UI** | ✅ Progressive status messages ("جاري التحميل" → "الاتصال بطيء" → "تحقق من الإنترنت"). |
| **Offline** | ✅ Handles offline gracefully — waits for Supabase, falls back to stored session check. |
| **RTL** | ✅ Arabic text throughout. |

### 4.3 Onboarding Screen (`onboarding_screen.dart` — 15.8KB)

**Rating: Excellent ✅**

| Category | Assessment |
|----------|------------|
| **Issues** | None. |
| **Code Quality** | Clean animation code. Proper use of `SharedPreferences` for completion state. |
| **UX/UI** | ✅ 3 animated pages with particle background. ✅ Skip button. ✅ Feature chips. |
| **RTL** | ✅ Arabic-first content. |
| **Suggestions** | Add video/GIF demos for each feature instead of static icons. |

### 4.4 Dashboard Screen (`dashboard_screen.dart` + widgets — ~100KB total)

**Rating: Good with Issues ⚠️**

| Category | Assessment |
|----------|------------|
| **Issues** | D1: `_computeUnreadCommunication()` watches full `memosProvider` and `feedbackTicketsProvider` lists — triggers rebuilds on ANY memo/ticket change, not just count changes. Should use `.select()` for count-only watching. D2: `_getGovernorateRanking()` creates a new future on every build — fixed with `_govRankingFuture` cache, but the pattern is fragile. D3: `SubmissionsByLevelChart` fetches 10,000 submissions directly from Supabase (bypassing offline cache) on every widget build. |
| **Code Quality** | D4: File is spread across 5 files (dashboard_screen, dashboard_charts, dashboard_header, dashboard_widgets, dashboard_report) — good separation, but `dashboard_widgets.dart` at 31KB is still large. |
| **Performance** | ✅ Pulse animation stops after 2 seconds (was infinite). ✅ Uses `RepaintBoundary` on charts. ✅ `FutureBuilder` cached to prevent re-fetching. |
| **Offline** | ⚠️ D3: `SubmissionsByLevelChart` has no offline fallback — shows error when offline. Should read from cache. |
| **RTL** | ✅ Proper RTL layout. |
| **Suggestions** | D5: Move `SubmissionsByLevelChart` data fetching to a Riverpod provider for proper caching. D6: Add pull-to-refresh feedback (haptic + loading indicator). |

### 4.5 Forms Screen (`forms_screen.dart` — 8.5KB)

**Rating: Good ✅**

| Category | Assessment |
|----------|------------|
| **Issues** | F1: No pagination — loads all forms at once. Acceptable for <100 forms but should add pagination for future growth. |
| **Code Quality** | Clean, concise. Good use of `TweenAnimationBuilder` for staggered animations. |
| **Offline** | ✅ Reads from cache via `formsProvider`. ✅ Pull-to-refresh preserves cache when offline. |
| **RTL** | ✅ Arabic titles and descriptions. |
| **Suggestions** | Add form search/filter. Show form completion percentage. |

### 4.6 Forms Management Screen (`forms_management_screen.dart` — 23.6KB)

**Rating: Good with Issues ⚠️**

| Category | Assessment |
|----------|------------|
| **Issues** | FM1: Loads submission stats per form in a loop (`for (final f in _forms) { ... select('id, status') ... }`) — N+1 query problem. For 20 forms, this makes 21 Supabase calls. Should use a single RPC or aggregate query. FM2: Direct Supabase client usage (`Supabase.instance.client.from('forms')`) bypasses the `DatabaseService` abstraction and offline cache. FM3: No RBAC check on the client side — relies entirely on Supabase RLS. Should add client-side role check for better UX. |
| **Code Quality** | Good structure. Proper error handling with user-facing messages. |
| **Security** | ⚠️ FM2: Direct client access means no request logging/interception via `ApiClient`. |
| **Offline** | ❌ FM2: No offline support — all operations require internet. |
| **RTL** | ✅ Full Arabic support. |

### 4.7 Form Fill Screen (`form_fill/` — 13 files, ~200KB total)

**Rating: Good with Critical Issues ⚠️**

| Category | Assessment |
|----------|------------|
| **Issues** | FF1: **Auto-save timer at 60s** — if the app is killed between saves, up to 60s of data is lost. Consider saving on every field change (debounced to 5s). FF2: `_loadForm()` tries cache first then network — good, but the cache lookup iterates all forms to find the target (`for (final f in cachedForms) { if (f['id'] == widget.formId) ... }`). Should use a map lookup. FF3: GPS location uses `Geolocator` which may fail on devices without Google Play Services (common in Yemen). Should add fallback. FF4: Photo compression uses `flutter_image_compress` which also depends on platform-specific code. Should add a pure-Dart fallback. FF5: Section page grouping logic (`_sectionPages`) is complex and could produce unexpected groupings with edge cases (empty sections, single-field sections). |
| **Code Quality** | FF6: `form_fill_screen.dart` at ~1450 lines is too long. Should extract submission logic, GPS logic, and photo handling into separate classes. |
| **Security** | ✅ GPS coordinates are only stored, not exposed. ✅ Photos compressed before upload. |
| **Offline** | ✅ Saves drafts to Hive with encryption. ✅ Sync queue for pending submissions. |
| **RTL** | ✅ All field labels in Arabic. |
| **Suggestions** | Add field-level validation feedback (not just form-level). Add undo for field changes. |

### 4.8 Forms Status Screen (`forms_status_screen.dart` — 64KB, 1831 lines)

**Rating: Needs Improvement ⚠️**

| Category | Assessment |
|----------|------------|
| **Issues** | FS1: **Extremely large file** — 1831 lines with 4 tabs, pagination, filtering, sorting, and sync listening all in one widget. Should be split into separate tab widgets. FS2: Complex pagination state with separate lists per tab (`_draftItems`, `_pendingItems`, `_submittedItems`) — error-prone and hard to maintain. FS3: `_listenForSyncCompletion()` subscribes to sync service stream but the subscription management could leak if the widget is disposed during a sync cycle. |
| **Code Quality** | FS4: High cyclomatic complexity. Multiple nested conditionals and state variables. |
| **Offline** | ✅ Drafts tab reads from local Hive storage. ✅ Pending tab shows items in sync queue. |
| **RTL** | ✅ Full Arabic support. |

### 4.9 Submissions Screen (`submissions_screen.dart` — 30KB)

**Rating: Good ✅**

| Category | Assessment |
|----------|------------|
| **Issues** | SS1: Loads up to 2000 submissions into memory. On low-end devices, this could cause memory pressure. Should implement cursor-based pagination. SS2: Search is client-side on the full list — acceptable for 2000 items but should consider server-side search for larger datasets. |
| **Code Quality** | Good separation of concerns. Proper use of `SubmissionsFilter` with equality. |
| **Offline** | ✅ Reads from cache via `submissionsProvider`. |
| **RTL** | ✅ Arabic labels and search. |

### 4.10 Submission Detail Screen (`submission_detail_screen.dart` — 18KB)

**Rating: Good ✅**

| Category | Assessment |
|----------|------------|
| **Issues** | SD1: Direct `DatabaseService.getSubmission()` call — should also check local cache for offline viewing of pending submissions. |
| **Code Quality** | Clean. Good use of share functionality. |
| **Offline** | ⚠️ SD1: Only works online — pending/draft submissions stored locally can't be viewed from this screen. |

### 4.11 Chat Screen (`chat_screen.dart` — 6.7KB)

**Rating: Excellent ✅**

| Category | Assessment |
|----------|------------|
| **Issues** | None critical. |
| **Code Quality** | Clean tab-based architecture. Delegates to `communication_tabs.dart` for tab content. |
| **Offline** | ✅ Shows "not configured" state when Supabase unavailable. |
| **RTL** | ✅ Arabic tab labels and content. |

### 4.12 Channel Screen (`channel_screen.dart` — 36KB)

**Rating: Good with Issues ⚠️**

| Category | Assessment |
|----------|------------|
| **Issues** | CS1: **Realtime subscription** — subscribes to `channel_messages` table changes. If the channel has many messages, this could be chatty. Should filter by `channel_id` in the subscription. CS2: `_fallbackTimer` for message refresh — should be replaced with a more efficient realtime-only approach. CS3: No message editing or deletion support. CS4: Attachment upload happens synchronously — should show progress indicator. |
| **Code Quality** | Large file. Could extract message list, input bar, and attachment handling. |
| **Offline** | ❌ No offline support — all messages require internet. Should cache recent messages. |
| **RTL** | ✅ Arabic message bubbles and timestamps. |

### 4.13 AI Chat Screen V3 (`ai_chat_screen_v3.dart` — **3199 lines, 122KB**)

**Rating: Needs Major Refactoring ⚠️⚠️**

| Category | Assessment |
|----------|------------|
| **Issues** | AI1: **CRITICALLY LARGE FILE** — 3199 lines is unsustainable. Contains: chat UI, bot engine integration, thread management, TTS, file picking, chart rendering, and 3 different tab implementations. AI2: `_mounted` flag pattern instead of using `mounted` from State — this is a code smell. AI3: TTS initialization creates a new `FlutterTts` instance even though `EpiAudioService` already has one (singleton). Duplication. AI4: `_restore()` loads saved messages from `ChatStore` but there's no size limit — could grow unbounded. AI5: `_lastSend` rate limiting is based on `DateTime` comparison but the threshold isn't clear from the code. |
| **Code Quality** | AI6: Should be split into at least 5 files: `ai_chat_screen.dart`, `ai_chat_message_list.dart`, `ai_chat_input.dart`, `ai_chat_thread_panel.dart`, `ai_chat_bot_tab.dart`. |
| **Security** | AI7: API keys for ZAI/OpenRouter are passed via `--dart-define` — good. But the `AIModelSelection` state is not persisted — user selection resets on app restart. |
| **Offline** | ✅ Local bot engine works offline. ✅ Thread messages cached in Supabase (online only). |
| **RTL** | ✅ Arabic chat bubbles and suggestions. |

### 4.14 AI Consultation Screen (`ai_consultation_screen.dart` — 36KB)

**Rating: Good ✅**

| Category | Assessment |
|----------|------------|
| **Issues** | AC1: Overlaps significantly with the bot tab in `ai_chat_screen_v3.dart`. Should be consolidated or clearly differentiated. |
| **Code Quality** | Good use of `QuickReplyData` model. Clean message rendering. |
| **Offline** | ✅ Uses local NLP engine for intent detection. Falls back to `BotEngine`. |

### 4.15 Analytics Screen (`analytics_screen.dart` — **103KB, 2612 lines**)

**Rating: Needs Major Refactoring ⚠️⚠️**

| Category | Assessment |
|----------|------------|
| **Issues** | AN1: **EXTREMELY LARGE FILE** — 2612 lines. Contains: readiness analysis, supervision analysis, coverage charts, shortage analysis, reports tab, and multiple chart widgets. AN2: Hardcoded form IDs (`FormIds.readiness`, `FormIds.supervision`) — should be configurable. AN3: `_yesNoSections` map with 50+ field names — brittle if form schema changes. Should read from form schema dynamically. AN4: Multiple `FutureBuilder` instances that each make separate Supabase calls — should consolidate into a single data loading strategy. |
| **Code Quality** | AN5: Should be split into `analytics_screen.dart` (shell), `readiness_tab.dart`, `supervision_tab.dart`, `coverage_tab.dart`, `shortage_tab.dart`, `reports_tab.dart`. |
| **Offline** | ⚠️ Most analytics require fresh server data. Should cache analytics results with TTL. |
| **RTL** | ✅ Arabic labels throughout. |

### 4.16 Map Screen (`map_screen.dart` — 68KB, 1650 lines)

**Rating: Good with Issues ⚠️**

| Category | Assessment |
|----------|------------|
| **Issues** | MS1: Large file — should extract filter panel, stats overlay, and submission detail sheet. MS2: `flutter_map` with `MarkerCluster` — performance could degrade with 5000+ markers. Should implement viewport-based loading. MS3: GPS coordinate precision — some submissions may have inaccurate GPS. Should add outlier detection. |
| **Code Quality** | Good use of `MapController` and animation controllers. |
| **Security** | MS4: RBAC for coordinate visibility (`canViewFullCoords`) — good. But coordinate fuzzing for lower roles should be done server-side, not client-side. |
| **Offline** | ⚠️ Map tiles require internet. Should cache viewed tiles for offline use. |
| **RTL** | ✅ Arabic labels and filter options. |

### 4.17 Profile Screen (`profile_screen.dart` — 49KB)

**Rating: Good ✅**

| Category | Assessment |
|----------|------------|
| **Issues** | PR1: Profile image upload goes directly to Supabase Storage — no compression or size validation on the client. PR2: Large file — profile editing, stats display, and settings are all in one screen. |
| **Code Quality** | Good form validation. Proper `TextEditingController` lifecycle. |
| **Security** | ✅ Uses Supabase Auth for profile updates. ✅ No sensitive data exposure. |
| **Offline** | ⚠️ Profile editing requires online connection. Should queue changes for sync. |

### 4.18 Users Screen (`users_screen.dart` — 28KB)

**Rating: Good with Issues ⚠️**

| Category | Assessment |
|----------|------------|
| **Issues** | US1: Loads all users (up to 10,000) in a single query. Should implement pagination. US2: Direct Supabase client usage bypasses `DatabaseService`. US3: User creation calls `Supabase.instance.client.auth.admin.createUser()` — this requires a service role key which should NEVER be in the mobile app. **This is a security concern** — user creation should go through an Edge Function. |
| **Security** | ⚠️ **US3 is critical** — admin API keys should not be in the mobile app. |
| **Offline** | ❌ No offline support. |

### 4.19 Memos Screen (`memos_screen.dart` — 41KB)

**Rating: Good ✅**

| Category | Assessment |
|----------|------------|
| **Issues** | MM1: Standalone `MemosScreen` is deprecated in favor of `MemosTab` in `communication_tabs.dart` — but the file still contains 1000+ lines of code that's actively used. Should rename or restructure. |
| **Code Quality** | Good model classes (`OfficialMemo`, `FeedbackTicket`). Clean service layer. |
| **Offline** | ⚠️ Memos are fetched via RPC — no local caching. Should cache in Hive. |

### 4.20 Feedback Screen (`feedback_screen.dart` — 44KB)

**Rating: Good ✅**

| Category | Assessment |
|----------|------------|
| **Issues** | FB1: Similar to memos — standalone screen deprecated but code is reused. FB2: SLA deadline calculation should be done server-side for consistency. |
| **Code Quality** | Good ticket status model with Arabic labels. Clean response threading. |
| **Offline** | ⚠️ No offline support for viewing tickets. |

### 4.21 References Screen (`references_screen.dart` — 8KB)

**Rating: Good ✅**

| Category | Assessment |
|----------|------------|
| **Issues** | REF1: `canLaunchUrl` + `launchUrl` pattern is deprecated in newer `url_launcher`. Should use `launchUrl` directly with error handling. |
| **Code Quality** | Clean and concise. Good search implementation. |
| **Offline** | ⚠️ References loaded from server only. Should cache reference list in Hive. |

### 4.22 References Management Screen (`references_management_screen.dart` — 28KB)

**Rating: Good with Issues ⚠️**

| Category | Assessment |
|----------|------------|
| **Issues** | RM1: Direct Supabase client usage. RM2: File upload to storage has no progress indicator. RM3: No RBAC client-side check (relies on RLS). |

### 4.23 Notifications Screen (`notifications_screen.dart` — 14KB)

**Rating: Good ✅**

| Category | Assessment |
|----------|------------|
| **Issues** | NT1: `NotificationService` uses static methods — not testable and doesn't integrate well with Riverpod. Should be a proper service with provider. NT2: Dismissible delete is permanent — should add undo snackbar. |
| **Code Quality** | Clean filter chip implementation. Good empty state. |
| **Offline** | ✅ Notifications cached locally by `NotificationService`. |

### 4.24 EPI Studio Screen (`epi_studio_screen.dart` — 53KB, 1472 lines)

**Rating: Good with Issues ⚠️**

| Category | Assessment |
|----------|------------|
| **Issues** | ES1: Large file — should extract artifact renderers (briefing, study guide, FAQ, mind map, audio). ES2: Audio playback uses `EpiAudioService` singleton — good, but TTS quality depends on device Arabic voices. ES3: `StudioArtifact.fromJson` handles both camelCase and snake_case — fragile. Should standardize on one format. |
| **Code Quality** | Good model class. Clean artifact type system. |
| **Offline** | ❌ Requires internet for AI generation. Should queue requests for when online. |

### 4.25 Form Editor Screen (`form_editor_screen.dart` — 43KB)

**Rating: Good ✅**

| Category | Assessment |
|----------|------------|
| **Issues** | FE1: Schema editing is complex — drag-and-drop reordering would be better than current up/down buttons. FE2: No form preview before saving. |
| **Code Quality** | Good field type definitions. Clean section management. |
| **Security** | ✅ Only accessible to admin/central roles (route guard). |

---

## 5. Services Analysis

### 5.1 AI Chat Thread Service (`ai_chat_thread_service.dart` — 7.9KB)

**Rating: Good ✅**

| Issue | Severity | Details |
|-------|----------|---------|
| T1 | Medium | Thread polling every 30s via `Timer.periodic` — should use Supabase realtime subscription instead. |
| T2 | Low | `getMessages` limit of 100 — should implement pagination for long conversations. |
| T3 | Low | No message editing or deletion. |

### 5.2 Attachment Service (`attachment_service.dart` — 13.5KB)

**Rating: Good with Issues ⚠️**

| Issue | Severity | Details |
|-------|----------|---------|
| A1 | Medium | 10MB file size limit is hardcoded — should be configurable. |
| A2 | Medium | No upload progress callback — UI can't show progress bar. |
| A3 | Low | `_getTempDir()` returns `/tmp` on web — should use browser-specific temp storage. |
| A4 | Low | `downloadFile` saves to temp directory which may be cleaned by OS. |

### 5.3 Chat Channel Service (`chat_channel_service.dart` — 6.2KB)

**Rating: Good ✅**

| Issue | Severity | Details |
|-------|----------|---------|
| CC1 | Low | Fallback query doesn't filter by user role — relies entirely on RLS. |

### 5.4 Dynamic Bot Knowledge Service (`dynamic_bot_knowledge_service.dart` — 9.7KB)

**Rating: Good ✅**

| Issue | Severity | Details |
|-------|----------|---------|
| DK1 | Low | `_searchStaticKB` always returns null — dead code. Should either implement or remove. |
| DK2 | Low | Conversation memory uses RPC — should also cache locally for offline continuity. |

### 5.5 EPI Audio Service (`epi_audio_service.dart` — 7KB)

**Rating: Good ✅**

| Issue | Severity | Details |
|-------|----------|---------|
| AU1 | Medium | Voice detection heuristic (`name.toLowerCase().contains('female')`) is unreliable across devices. |
| AU2 | Low | No audio session management — playing audio while music is playing could cause conflicts. |

### 5.6 Firebase Mobile Service (`firebase_mobile_service.dart` — 1.7KB)

**Rating: Stub ⚠️**

| Issue | Severity | Details |
|-------|----------|---------|
| FB1 | **High** | **Push notifications are not functional.** This is a stub file. For a production system deployed to governorates, push notifications are critical for urgent communications (disease outbreaks, policy changes). |
| FB2 | Medium | No alternative notification mechanism (e.g., polling-based) when Firebase is not configured. |

### 5.7 Memos & Feedback Service (`memos_feedback_service.dart` — 21.8KB)

**Rating: Good ✅**

| Issue | Severity | Details |
|-------|----------|---------|
| MF1 | Medium | `getUserTickets` fallback query doesn't apply role-based filtering — returns all tickets. |
| MF2 | Low | `createMemo` and `createTicket` fetch user profile inline — should use cached profile from `authStateProvider`. |

---

## 6. Providers Analysis

### 6.1 App Providers (`app_providers.dart` — 30KB)

**Rating: Excellent ✅**

This is the backbone of the app's state management. Key strengths:

- **Offline-first pattern**: All data providers use `OfflineDataCache.getList()` which returns cached data immediately, then fetches from server in background.
- **Proper equality**: `SubmissionsFilter` and `AnalyticsFilter` implement `==` and `hashCode` correctly — prevents unnecessary provider rebuilds.
- **AutoDispose families**: Submission and analytics providers auto-dispose when no widgets are watching — prevents memory buildup.
- **Campaign-aware caching**: Cache keys include campaign type and round — prevents stale data when switching campaigns.

**Issues Found:**

| Issue | Severity | Details |
|-------|----------|---------|
| AP1 | Medium | `notificationCountProvider` polls every 300s — too slow for urgent notifications. Should use Supabase realtime. |
| AP2 | Medium | `localDraftCountProvider` polls every 300s — draft count won't update in the UI until next poll. Should use a reactive stream from Hive. |
| AP3 | Low | `huggingFaceServiceProvider` reads API key from `--dart-define` — good, but the key is also available in the compiled binary. |
| AP4 | Low | `formStatsProvider` makes separate calls for drafts (local) and submitted (server) — could be consolidated. |

### 6.2 Full Sync Provider (`full_sync_provider.dart` — 11KB)

**Rating: Good ✅**

| Issue | Severity | Details |
|-------|----------|---------|
| FS1 | Medium | Submissions pagination fetches up to 50,000 records in 2,000-record batches. On slow connections, this could take 10+ minutes. Should show progress to user. |
| FS2 | Low | `Future.delayed(Duration.zero)` between steps yields to UI thread — good, but `Duration.zero` may not actually yield on all platforms. Consider `Duration(milliseconds: 1)`. |

### 6.3 Realtime Sync Provider (`realtime_sync_provider.dart` — 6.4KB)

Already covered in Section 3.3.

---

## 7. Router Analysis

**File:** `router/app_router.dart`

**Rating: Excellent ✅**

| Category | Assessment |
|----------|------------|
| **RBAC** | ✅ Route-level role guards with `routeMinRole` map. ✅ Unauthorized users redirected to `/dashboard`. |
| **Deep Linking** | ✅ Supports `?tab=memos\|channels\|feedback\|brief` for ChatScreen. ✅ Supports `?tab=reports` for AnalyticsScreen. ✅ Supports `?topic=...` for EpiStudioScreen. |
| **Auth Redirect** | ✅ Handles 3 states: authenticated, has stored session, not authenticated. ✅ Never auto-signs out. |
| **Shell Route** | ✅ `MainShell` wraps all authenticated routes with bottom nav + drawer + connectivity banner. |
| **Performance** | ✅ `GoRouterRefreshStream` only notifies on actual auth status changes (not every metadata update). |

**Issues Found:**

| Issue | Severity | Details |
|-------|----------|---------|
| RT1 | Medium | No route-level error handling. If a screen throws during build, the entire app crashes. Should add error boundaries per route. |
| RT2 | Low | `routeMinRole` map is hardcoded — should be configurable or derived from server-side permissions. |
| RT3 | Low | No analytics/screen tracking on route changes. |

---

## 8. Shared Packages Analysis

### 8.1 epi_core (packages/core)

**Rating: Excellent ✅**

This package contains the app's business logic layer. Key modules:

| Module | Files | Assessment |
|--------|-------|------------|
| **Auth** | `auth_repository.dart`, `auth_state.dart` | ✅ Robust session management. Never auto-signs out. Retry with backoff. |
| **Database** | `database_service.dart` | ✅ Clean abstraction over Supabase. Proper safety limits on queries. |
| **Offline** | `offline_manager.dart`, `offline_data_cache.dart`, `local_repository.dart` | ✅ Encrypted Hive storage. Background key derivation. |
| **Sync** | `sync_service.dart` | ✅ Debounced sync. Batch processing. Retry with exponential backoff. |
| **Security** | `encryption_service.dart`, `rbac_service.dart` | ✅ PBKDF2 key derivation in isolate. Key pinning. Role hierarchy. |
| **AI** | 15+ files | ✅ Comprehensive AI stack: local NLP, knowledge base, bot engine, RAG pipeline. |
| **Connectivity** | `connectivity_utils.dart` | ✅ HTTP-verified connectivity (not just link status). |
| **Notifications** | `notification_service.dart`, `fcm_notification_service.dart` | ⚠️ FCM is stubbed. |

**Issues Found:**

| Issue | Severity | Details |
|-------|----------|---------|
| EC1 | Medium | `ApiClient` wraps Supabase client but some screens bypass it and use `Supabase.instance.client` directly. Should enforce single point of access. |
| EC2 | Low | `DatabaseService` has no request caching beyond `OfflineDataCache`. Repeated calls to `getGovernorates()` within the same session hit the cache, but the cache key strategy could be more explicit. |

### 8.2 epi_shared (packages/shared)

**Rating: Good ✅**

| Module | Assessment |
|--------|------------|
| **Theme** | ✅ Consistent color palette. ✅ Arabic font families (Tajawal, Cairo). ✅ Light/dark theme support. |
| **Widgets** | ✅ Reusable components: `EpiCard`, `EpiAppBar`, `EpiBottomNav`, `EpiDrawer`, `EpiLoading`, `EpiErrorWidget`, `EpiEmptyState`, `ConnectivityBanner`. |
| **Models** | ✅ Freezed models with JSON serialization: `FormModel`, `SubmissionModel`, `GovernorateModel`, `DistrictModel`, `UserProfileModel`, `ShortageModel`. |
| **Extensions** | ✅ `StringExtensions` (email validation, etc.), `ContextExtensions` (showSuccess, showError). |

**Issues Found:**

| Issue | Severity | Details |
|-------|----------|---------|
| SH1 | Low | `ConnectivityBanner` shows "جاري مزامنة X عنصر" when online with pending items — but the sync may not actually be in progress. Should check sync state. |
| SH2 | Low | Generated files (`.g.dart`) should be in `.gitignore` and regenerated via `build_runner`. |

---

## 9. Critical Issues Summary

### 🔴 Critical (Must Fix Before Production)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| CR1 | **User creation uses admin API** | `users_screen.dart` | Admin API keys in mobile app = security breach risk. Move to Edge Function. |
| CR2 | **Push notifications not functional** | `firebase_mobile_service.dart` | No way to notify field workers of urgent outbreaks or policy changes. |
| CR3 | **Duplicate realtime subscription** | `realtime_sync_provider.dart` | Double event processing, wasted bandwidth, potential UI flicker. |

### 🟠 High (Should Fix Soon)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| HI1 | N+1 query in Forms Management | `forms_management_screen.dart` | 21 Supabase calls for 20 forms. Slow load, wasted bandwidth. |
| HI2 | `SubmissionsByLevelChart` bypasses cache | `dashboard_widgets.dart` | Loads 10K submissions from server on every build. No offline support. |
| HI3 | AI Chat Screen is 3199 lines | `ai_chat_screen_v3.dart` | Unmaintainable. Bug-prone. |
| HI4 | Analytics Screen is 2612 lines | `analytics_screen.dart` | Unmaintainable. Hard to test. |
| HI5 | No offline memo/ticket viewing | `memos_screen.dart`, `feedback_screen.dart` | Users can't view important communications offline. |
| HI6 | Map coordinate fuzzing is client-side | `map_screen.dart` | Lower roles could bypass client-side coordinate hiding. |

### 🟡 Medium (Plan to Fix)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| ME1 | Forms Status Screen is 1831 lines | `forms_status_screen.dart` | Maintainability concern. |
| ME2 | No cache size limits | `offline_manager.dart` | Cache grows unbounded on device. |
| ME3 | No Hive corruption recovery | `offline_manager.dart` | Power loss during write could corrupt data. |
| ME4 | Pending count polling at 300s | `app_providers.dart` | Stale sync badge for up to 5 minutes. |
| ME5 | Channel messages not cached | `channel_screen.dart` | Can't view recent messages offline. |
| ME6 | No analytics caching | `analytics_screen.dart` | Slow load on every visit. |
| ME7 | Profile editing requires online | `profile_screen.dart` | Can't update profile offline. |
| ME8 | GPS fallback for non-GMS devices | `form_fill_screen.dart` | Some Yemeni devices lack Google Play Services. |

---

## 10. Recommendations & Roadmap

### Immediate (Week 1-2)

1. **Fix CR1**: Move user creation to a Supabase Edge Function. Remove admin API usage from mobile app.
2. **Fix CR2**: Implement real Firebase push notifications OR add a polling-based notification system with 60s interval.
3. **Fix CR3**: Remove the duplicate `form_submissions` INSERT subscription.
4. **Fix HI1**: Replace N+1 queries with a single RPC call for form stats.
5. **Fix HI2**: Move `SubmissionsByLevelChart` data to a Riverpod provider.

### Short-term (Month 1)

6. **Refactor large files**: Split `ai_chat_screen_v3.dart`, `analytics_screen.dart`, `forms_status_screen.dart`, and `map_screen.dart` into smaller, testable widgets.
7. **Add offline memo/ticket caching**: Cache recent memos and tickets in Hive.
8. **Add cache size limits**: Implement LRU eviction at 50MB.
9. **Add Hive corruption recovery**: Try-catch with box deletion fallback.
10. **Standardize data access**: Enforce `DatabaseService`/`ApiClient` usage — no direct `Supabase.instance.client` in screens.

### Medium-term (Month 2-3)

11. **Implement real push notifications**: Firebase FCM or OneSignal.
12. **Add integration tests**: Critical flows (login, form fill, submission, sync).
13. **Add tile caching for offline maps**: Use `flutter_map_tile_caching`.
14. **Add server-side coordinate fuzzing**: Move RBAC coordinate filtering to Supabase RLS/Edge Functions.
15. **Add analytics caching**: Cache dashboard analytics with 1-hour TTL.
16. **Add form preview**: Preview form before submitting in `FormEditorScreen`.

### Long-term (Month 3-6)

17. **Add SSO/SAML support**: Government SSO integration for Yemeni agencies.
18. **Add multi-language support**: English alongside Arabic for international observers.
19. **Add data export**: Bulk export submissions as Excel/CSV from the app.
20. **Add offline-first chat**: Cache channel messages with sync-on-reconnect.
21. **Add widget-level error boundaries**: Prevent single widget crashes from taking down the app.
22. **Performance profiling**: Run Flutter DevTools on low-end devices (common in field use).

---

## Appendix A: File Size Audit

| File | Lines | Size | Status |
|------|-------|------|--------|
| `ai_chat_screen_v3.dart` | 3,199 | 122KB | ⚠️ Split required |
| `analytics_screen.dart` | 2,612 | 104KB | ⚠️ Split required |
| `forms_status_screen.dart` | 1,831 | 64KB | ⚠️ Consider splitting |
| `map_screen.dart` | 1,650 | 68KB | ⚠️ Consider splitting |
| `epi_studio_screen.dart` | 1,472 | 53KB | ⚠️ Consider splitting |
| `form_fill_screen.dart` | ~1,450 | ~60KB | ⚠️ Consider splitting |
| `form_editor_screen.dart` | ~1,170 | 43KB | OK |
| `profile_screen.dart` | ~1,230 | 49KB | OK |
| `communication_tabs.dart` | ~1,200 | 48KB | OK |
| `memos_screen.dart` | ~1,140 | 41KB | OK |
| `feedback_screen.dart` | ~1,240 | 44KB | OK |
| `app_providers.dart` | ~800 | 30KB | ✅ Reasonable |

**Rule of thumb**: Files > 500 lines should be considered for splitting. Files > 1000 lines should be split.

---

## Appendix B: Dependency Audit

| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| `flutter_riverpod` | 2.5.1 | ✅ Current | Stable |
| `go_router` | 14.1.4 | ✅ Current | Stable |
| `supabase_flutter` | 2.5.6 | ✅ Current | Stable |
| `hive` | 2.2.3 | ✅ Current | Stable |
| `connectivity_plus` | 6.0.3 | ✅ Current | Stable |
| `flutter_map` | 6.1.0 | ✅ Current | Stable |
| `fl_chart` | 0.68.0 | ✅ Current | Stable |
| `flutter_tts` | 4.2.0 | ✅ Current | Stable |
| `sentry_flutter` | 8.3.0 | ✅ Current | Stable |
| `local_auth` | 2.3.0 | ✅ Current | Stable |

All dependencies are current and well-maintained. No known security vulnerabilities.

---

## Appendix C: Arabic/RTL Support Audit

**Overall: Excellent ✅**

| Area | Status | Notes |
|------|--------|-------|
| Font families | ✅ | Tajawal (body) + Cairo (headings) — both Arabic-optimized |
| Text direction | ✅ | `Directionality(textDirection: TextDirection.rtl)` in `MaterialApp.builder` |
| Locale | ✅ | `Locale('ar', 'IQ')` with Arabic/Iraq locale |
| Localization delegates | ✅ | Material + Widgets + Cupertino delegates |
| Navigation | ✅ | Drawer opens from right. Back button works correctly. |
| Form fields | ✅ | Arabic labels and validation messages |
| Charts | ✅ | Arabic labels on axes and tooltips |
| Numbers | ⚠️ | Uses Western numerals (1, 2, 3) — should support Eastern Arabic (١، ٢، ٣) as option |
| Text alignment | ✅ | Proper `TextAlign.start` for RTL flow |
| Input fields | ✅ | Email field explicitly uses `TextDirection.ltr` (correct for email addresses) |

---

*End of Report*
