# 📖 دليل المطور الشامل — EPI Supervisor
## الواجهة الرئيسية للمطور والمبرمج

**الإصدار:** v3.15.0 (بعد إصلاحات جولة 22 يوليو)
**آخر تحديث:** 2026-07-22
**المنصة:** Flutter 3.27+ | Supabase Backend

---

## 📋 فهرس المحتويات

1. [نظرة عامة](#1-نظرة-عامة)
2. [بنية المشروع](#2-بنية-المشروع)
3. [كيفية البناء والتشغيل](#3-كيفية-البناء-والتشغيل)
4. [بنية البيانات](#4-بنية-البيانات)
5. [آلية الاونلاين/الاوفلاين](#5-آلية-الاونلاينالاوفلاين)
6. [نظام الأمان](#6-نظام-الأمان)
7. [قائمة الشاشات](#7-قائمة-الشاشات)
8. [الإصلاحات الأخيرة](#8-الإصلاحات-الأخيرة)
9. [كيفية الإضافة/التعديل](#9-كيفية-الإضافةالتعديل)
10. [استكشاف الأخطاء](#10-استكشاف-الأخطاء)

---

## 1. نظرة عامة

### ما هو التطبيق؟
نظام إشراف ميداني متكامل لحملات التطعيم (EPI — Expanded Programme on Immunization).
يُستخدم من قبل مشرفي المديريات والمحافظات والمستوى المركزي لمتابعة حملات التطعيم.

### التقنيات المستخدمة:
| التقنية | الاستخدام |
|---------|----------|
| **Flutter 3.27+** | تطبيق الموبايل (Android/iOS) |
| **Supabase** | Backend (Auth, Database, Storage, Edge Functions, Realtime) |
| **Hive** | التخزين المحلي (اوفلاين) |
| **Riverpod** | إدارة الحالة (State Management) |
| **GoRouter** | التنقل بين الشاشات |
| **flutter_secure_storage** | تخزين مفتاح التشفير بأمان |

### الأدوار (RBAC):
| الدور | الصلاحيات |
|-------|----------|
| **admin** | كل شيء — إدارة المستخدمين + النماذج + الإرساليات |
| **central** | عرض جميع المحافظات + التقارير |
| **governorate** | عرض محافظته فقط + تقارير المحافظة |
| **district** | عرض مديريته فقط + إدخال البيانات |
| **data_entry** | إدخال البيانات فقط |

---

## 2. بنية المشروع

```
EPI-Supervisor/
├── apps/
│   └── mobile/                    ← تطبيق الموبايل
│       ├── lib/
│       │   ├── main.dart          ← نقطة البداية
│       │   ├── router/            ← التنقل (GoRouter)
│       │   ├── screens/           ← الشاشات
│       │   ├── providers/         ← Riverpod providers
│       │   └── services/          ← خدمات الموبايل
│       ├── assets/                ← صور + خطوط
│       └── test/                  ← اختبارات
│
├── packages/
│   ├── core/                      ← المنطق الأساسي
│   │   └── lib/src/
│   │       ├── api/               ← ApiClient (Supabase calls)
│   │       ├── auth/              ← AuthRepository
│   │       ├── cache/             ← AdvancedCacheManager (غير مستخدم)
│   │       ├── config/            ← AppConfig + SupabaseConfig + EnvLoader
│   │       ├── database/          ← DatabaseService
│   │       ├── errors/            ← AppExceptions
│   │       ├── models/            ← CampaignType
│   │       ├── notifications/     ← FCM + NotificationService
│   │       ├── offline/           ← OfflineManager + OfflineDataCache + SyncModels
│   │       ├── reports/           ← ReportGenerator
│   │       ├── security/          ← EncryptionService + RBAC
│   │       ├── sync/              ← SyncService
│   │       └── utils/             ← ConnectivityUtils + DateUtils + GeoUtils
│   │
│   └── shared/                    ← مشترك بين المنصات
│       └── lib/src/
│           ├── constants/         ← AppStrings
│           ├── extensions/        ← Context + String extensions
│           ├── i18n/              ← الترجمة
│           ├── models/            ← Data models (Form, Submission, Profile, etc.)
│           ├── theme/             ← AppTheme
│           └── widgets/           ← مشتركات UI
│
├── docs/                          ← التوثيق
│   ├── archive/                   ← تقارير قديمة (مرجعية)
│   ├── fixes-2026-07/             ← تقرير الإصلاحات الأخير
│   ├── screenshots/               ← لقطات الشاشة
│   ├── user-guide/                ← دليل المستخدم
│   └── *.sql                      ← SQL scripts
│
├── supabase/                      ← Edge Functions + Migrations
├── scripts/                       ← أدوات مساعدة
└── skills/                        ← مهارات AI
```

### الـ Providers الرئيسية (Riverpod):
| Provider | الوظيفة |
|----------|---------|
| `offlineManagerProvider` | إدارة Hive + sync queue |
| `offlineDataCacheProvider` | الكاش المحلي |
| `syncServiceProvider` | مزامنة البيانات |
| `authRepositoryProvider` | المصادقة |
| `authStateProvider` | حالة المستخدم |
| `formsProvider` | النماذج (مفلترة بالحملة) |
| `submissionsProvider` | الإرساليات (مفلترة) |
| `dashboardAnalyticsProvider` | تحليلات Dashboard |
| `campaignProvider` | الحملة النشطة |
| `campaignRoundProvider` | الجولة النشطة |
| `formStatsProvider` | إحصائيات النماذج |
| `notificationCountProvider` | عدد الإشعارات |
| `realtimeSyncProvider` | مزامنة Realtime |

---

## 3. كيفية البناء والتشغيل

### المتطلبات:
- Flutter SDK >= 3.27.0
- Dart SDK >= 3.6.0
- Android Studio / Xcode
- Supabase project

### التثبيت:
```bash
# 1. استنساخ المشروع
git clone https://github.com/mohammedshoqi123-art/EPI-Supervisor.git
cd EPI-Supervisor

# 2. تثبيت Dependencies
melos bootstrap
# أو
cd apps/mobile && flutter pub get

# 3. إعداد .env
cp .env.example .env
# عدّل SUPABASE_URL و SUPABASE_ANON_KEY

# 4. البناء
flutter build apk --debug
# أو
flutter run
```

### البناء مع Encryption Key:
```bash
flutter build apk --release \
  --dart-define=ENCRYPTION_KEY=your-secret-key-min-32-chars-long
```

### الأوامر المفيدة:
```bash
# تحليل الكود
flutter analyze

# اختبار
flutter test

# بناء release
flutter build apk --release

# بناء iOS
flutter build ios --release
```

---

## 4. بنية البيانات

### جداول Supabase الأساسية:

#### `profiles` — المستخدمون
```sql
- id (UUID) — مفتاح أساسي
- email (TEXT)
- full_name (TEXT)
- role (TEXT) — admin/central/governorate/district/data_entry
- governorate_id (UUID) — مرجع لمحافظة
- district_id (UUID) — مرجع لمديرية
- phone (TEXT)
- avatar_url (TEXT)
- national_id (TEXT)
- position (TEXT)
- is_active (BOOLEAN)
- active_campaign (TEXT) — الحملة النشطة
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `forms` — النماذج
```sql
- id (UUID)
- title_ar (TEXT)
- title_en (TEXT)
- schema (JSONB) — بنية النموذج (sections + fields)
- campaign_type (TEXT) — polio_campaign / integrated_activity
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

#### `form_submissions` — الإرساليات
```sql
- id (UUID)
- form_id (UUID) — مرجع لنموذج
- data (JSONB) — بيانات الإرسالية
- status (TEXT) — submitted/reviewed/approved/rejected
- governorate_id (UUID)
- district_id (UUID)
- submitted_by (UUID) — مرجع لمستخدم
- campaign_round (INTEGER)
- gps_lat (DOUBLE)
- gps_lng (DOUBLE)
- photos (TEXT[])
- is_offline (BOOLEAN)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `governorates` — المحافظات
```sql
- id (UUID)
- name_ar (TEXT)
- name_en (TEXT)
- is_active (BOOLEAN)
```

#### `districts` — المديريات
```sql
- id (UUID)
- name_ar (TEXT)
- name_en (TEXT)
- governorate_id (UUID) — مرجع لمحافظة
- is_active (BOOLEAN)
```

#### `health_facilities` — المرافق الصحية
```sql
- id (UUID)
- name_ar (TEXT)
- district_id (UUID) — مرجع لمديرية
- is_active (BOOLEAN)
```

#### `supply_shortages` — نقص الإمدادات
```sql
- id (UUID)
- submission_id (UUID) — مرجع لإرسالية
- severity (TEXT)
- is_resolved (BOOLEAN)
- governorate_id (UUID)
- district_id (UUID)
```

#### `campaign_rounds` — جولات الحملة
```sql
- id (UUID)
- campaign_type (TEXT)
- round_number (INTEGER)
- is_locked (BOOLEAN)
- lock_reason (TEXT)
```

#### `notifications` — الإشعارات
```sql
- id (UUID)
- user_id (UUID)
- type (TEXT)
- title (TEXT)
- body (TEXT)
- is_read (BOOLEAN)
- created_at (TIMESTAMP)
```

#### `feedback_tickets` — تذاكر الملاحظات
```sql
- id (UUID)
- user_id (UUID)
- category (TEXT)
- message (TEXT)
- status (TEXT)
- created_at (TIMESTAMP)
```

#### `official_memos` — المذكرات الرسمية
```sql
- id (UUID)
- title (TEXT)
- content (TEXT)
- priority (TEXT)
- requires_acknowledgment (BOOLEAN)
- created_at (TIMESTAMP)
```

### Edge Functions:
| Function | الوظيفة |
|----------|---------|
| `submit-form` | إرسال نموذج |
| `sync-offline` | مزامنة بيانات اوفلاين |
| `get-forms` | جلب النماذج |
| `get-analytics` | جلب التحليلات (server-side aggregation — لا يُحمّل raw data) |
| `ai-chat-v3` | المحادثة الذكية |
| `get-dashboard-stats` | إحصائيات Dashboard |
| `get-governorate-report` | تقرير المحافظات |

---

## 5. آلية الاونلاين/الاوفلاين

### المبدأ الأساسي: Offline-First
```
الطلب → الكاش أولاً → إذا حديث: أرجع فوراً
                      → إذا قديم: أرجع + حدّث في الخلفية
                      → إذا offline: أرجع أي بيانات مخزنة
```

### طبقات التخزين:
```
┌─────────────────────────────────────────┐
│           UI (Widgets)                  │
├─────────────────────────────────────────┤
│      Riverpod Providers                 │
├─────────────────────────────────────────┤
│   OfflineDataCache (Memory + Hive)      │
│   - Memory cache: 200 entries, LRU      │
│   - Persistent: Hive (encrypted)        │
├─────────────────────────────────────────┤
│      OfflineManager (Hive)              │
│   - Sync queue: sharded keys            │
│   - Drafts: sharded keys                │
│   - Cache: single encrypted blob        │
├─────────────────────────────────────────┤
│      EncryptionService (AES-256-GCM)    │
│   - Key: flutter_secure_storage         │
│   - PBKDF2 600k iterations (Isolate)    │
├─────────────────────────────────────────┤
│      Hive (Local Storage)               │
└─────────────────────────────────────────┘
```

### مسار الإرسالية:
```
1. المستخدم يضغط "إرسال"
2. addToSyncQueue() → يُشفر عنصر واحد → يُحفظ في Hive
3. إذا online → sync() فوراً → callFunction('submit-form')
4. إذا offline → يبقى في الطابور
5. عند عودة الإنترنت → SyncService يُكتشف → يُزامن تلقائياً
6. إذا فشل → retry 3 مرات مع backoff (10s → 20s → 40s)
7. إذا فشل 3 مرات → يُحفظ في failed_submissions
```

### مسار الكاش:
```
1. Provider يطلب بيانات
2. OfflineDataCache.getList() يبحث في:
   a. Memory cache (LRU, 200 entries) → إذا حديث: أرجع
   b. Persistent cache (Hive) → إذا موجود: أرجع + حدّث في الخلفية
   c. Network → إذا نجح: خزّن + أرجع
                → إذا فشل: أرجع أي بيانات مخزنة
3. Incremental sync: يُجلب فقط الجديد (بعد آخر created_at)
4. Periodic full refresh: كل 3 incremental syncs → يُجلب الكل
```

### ConnectivityUtils:
```
1. connectivity_plus يُراقب حالة الشبكة
2. إذا link up → HTTP HEAD إلى 3 URLs (Google, Cloudflare, Supabase)
3. النتيجة تُخزن في cache (30 ثانية)
4. يُراقب كل 120 ثانية (عند online)
5. يُرسل عبر stream لجميع المستمعين
```

---

## 6. نظام الأمان

### Encryption:
- **الخوارزمية:** AES-256-GCM
- **توليد المفتاح:** PBKDF2 مع 600,000 iteration
- **التخزين:** flutter_secure_storage (Android Keystore / iOS Keychain)
- **ال Isolate:** PBKDF2 يُنفّذ في Isolate منفصل (لا يُجمد UI)
- **ال Format:** [magic "EPI2"][iv(12)][ciphertext+tag]

### RBAC (Role-Based Access Control):
```dart
enum UserRole { admin, central, governorate, district, data_entry }
```
- يُطبق على مستوى Supabase RLS (Row Level Security)
- كل query يُفلتر تلقائياً حسب دور المستخدم

### Auth:
- **Supabase Auth** مع PKCE flow
- **Session refresh** كل 3 دقائق (proactive)
- **Auto-refresh token** قبل انتهاء الصلاحية بـ 5 دقائق
- **لا signOut تلقائي** — فقط يدوياً من المستخدم

---

## 7. قائمة الشاشات

| # | الشاشة | المسار | الوظيفة |
|---|--------|--------|---------|
| 1 | Splash | `/` | تحميل أولي + فحص الجلسة |
| 2 | Login | `/login` | تسجيل الدخول |
| 3 | Onboarding | `/onboarding` | شاشة الترحيب (أول تشغيل) |
| 4 | Dashboard | `/dashboard` | لوحة التحكم الرئيسية |
| 5 | Forms | `/forms` | قائمة النماذج |
| 6 | Form Fill | `/forms/fill/:id` | ملء النموذج |
| 7 | Form Editor | `/forms/editor/:id` | تحرير النموذج |
| 8 | Forms Status | `/forms/status` | حالة النماذج |
| 9 | Submissions | `/submissions` | قائمة الإرساليات |
| 10 | Submission Detail | `/submissions/:id` | تفاصيل إرسالية |
| 11 | Map | `/map` | الخريطة |
| 12 | Analytics | `/analytics` | التحليلات |
| 13 | Reports | `/analytics/reports` | التقارير |
| 14 | Users | `/users` | إدارة المستخدمين |
| 15 | Profile | `/profile` | الملف الشخصي |
| 16 | Notifications | `/notifications` | الإشعارات |
| 17 | References | `/references` | المراجع |
| 18 | AI Chat | `/chat` | المحادثة الذكية |
| 9 | Communication | `/communication` | التواصل + المذكرات |

### شاشة ملء النموذج (Form Fill) — الأكثر تعقيداً:
```
- تحميل النموذج من الكاش أو السيرفر
- تعبئة تلقائية من الملف الشخصي
- حفظ تلقائي كل 120 ثانية (Isolate)
- تحديد الموقع (GPS)
- التقاط صور + ضغط (Isolate)
- مراجعة قبل الإرسال
- إرسال (اونلاين أو اوفلاين)
```

---

## 8. الإصلاحات الأخيرة

### 8.1 إصلاحات v3.15.0 (2026-07-22) — 20 إصلاح + إصلاح Storage

تم تنفيذ مراجعة شاملة + مقارنة مع تقرير خبير مستقل + تنفيذ 20 إصلاح في 3 مراحل.

#### المرحلة الأولى: إصلاحات حرجة (8 إصلاحات)

| # | الإصلاح | الملف | التأثير |
|---|---------|-------|--------|
| 29 | المسودات: إعادة بناء drafts_index عند corruption | `offline_manager.dart` | المسودات تظهر فوراً |
| 30 | التحليلات: loading shimmer + error state مع retry | `analytics_screen.dart` | لا شاشة فارغة |
| 1 | إزالة UI thread fallback في EncryptionService + saveDraft | `encryption_service.dart` + `offline_manager.dart` | لا تجميد 1-3s |
| 2 | Auto-save من 60s إلى 240s | `form_fill_screen.dart` | 4× أقل تجميد |
| 3 | إزالة محاكاة streaming في AIChatWidget | `AIChatWidget.tsx` | 1 re-render بدل 500 |
| 5 | LIMIT 5000 على Edge Functions | `get-admin-dashboard/` + `get-governorate-report/` | لا timeout |
| 6 | إصلاح await مفقود في generate-scheduled-report | `generate-scheduled-report/index.ts` | التقارير تعمل |
| 7 | Promise.any حقيقي بدل sequential fallback | `hybrid-gateway.ts` | 30s بدل 150s |

#### المرحلة الثانية: إصلاحات الأداء (5 إصلاحات)

| # | الإصلاح | الملف | التأثير |
|---|---------|-------|--------|
| 14 | _defaultLimit من 10000 إلى 1000 | `api_client.dart` | لا بيانات ضخمة |
| 16 | ConnectivityUtils Completer — انتظار أول probe | `connectivity_utils.dart` | لا race condition |
| 17 | تأجيل _reinitializeOnResume + debounce 10s | `main.dart` | لا تجميد عند العودة |
| 19 | Timeout 8s على auth.getUser() | `_shared/auth.ts` | لا hang |
| 20 | Submissions limit من 2000 إلى 500 | `submissions_screen.dart` | sort أسرع 4× |

#### المرحلة الثالثة: تحسينات هيكلية (7 إصلاحات)

| # | الإصلاح | الملف | التأثير |
|---|---------|-------|--------|
| 21 | Persistent Isolate worker للتشفير | `encryption_service.dart` | Isolate واحد يبقى |
| 22 | Indexes — موجودة بالفعل (verified) | migrations | ✅ |
| 23 | db_max_rows من 100000 إلى 10000 | `055_*.sql` | لا OOM |
| 24 | RPC موحد admin dashboard (1 query بدل 16) | `056_*.sql` + Edge Function | 200ms بدل 3.2s |
| 25 | CSV export limit من 10000 إلى 2000 | `SubmissionsPage.tsx` | لا تجميد |
| 26 | localStorage debouncing (2s) + context save (30s) | `AIChatWidget.tsx` | أقل I/O |
| 27 | AdvancedCacheManager — محذوف بالفعل (verified) | `epi_core.dart` | ✅ |

#### إصلاح Storage (المساحة التخزينية)

| الإصلاح | قبل | بعد |
|---------|-----|-----|
| حد entry واحد | بلا حد | 500KB |
| حد الكاش الكلي | 5MB | 2MB |
| عدد entries | 50 | 20 |
| مدة احتفاظ | 30 يوم | 7 أيام |
| Hive compaction | لا يوجد | بعد كل تنظيف |

#### الملفات الجديدة:
1. `supabase/migrations/055_reduce_postgrest_max_rows.sql` — تقليل db_max_rows
2. `supabase/migrations/056_unified_admin_dashboard_rpc.sql` — RPC موحد
3. `apps/admin-web/src/workers/csv-worker.ts` — Web Worker للتصدير

#### الإحصائيات:
- **15 ملف** مُعدّل + **3 ملفات** جديدة
- **~612 سطر** مُضاف + **~178 سطر** محذوف
- **طبقات التطبيق:** Mobile (Flutter) + Web (React) + Edge Functions + Database

---

### 8.2 إصلاحات v3.14.0 (2026-07-21) — 27 إصلاح

| المرحلة | الإصلاحات | الملفات |
|---------|----------|--------|
| **P0 حرجة** | 8 | encryption, retry, count, connectivity, logout, lock, auto-save, hive |
| **P1 متوسطة** | 12 | listeners, queue, session, reconnect, pagination, timeout, cache, sync |
| **P2 أمان** | 5 | secure storage, payload, avatar, drafts, fonts |
| **P3 تحسينات** | 2 | dead code, splash |

### أبرز إصلاحات v3.14.0:
1. **Encryption migration** — لا مزيد من فقدان البيانات عند التحديث
2. **_withRetry** — كل استعلام شبكة يُحاولة 3 مرات
3. **ConnectivityUtils** — اكتشاف فوري للاتصال
4. **Auto-save Isolate** — لا تجميد UI
5. **count() silent zero** — لا مزيد من "0 إرساليات" الخاطئ

### التقارير التفصيلية:
- `docs/fixes-2026-07/EXECUTIVE_SUMMARY.md` — ملخص تنفيذي
- `docs/fixes-2026-07/DEEP_CODE_REVIEW_REPORT.md` — مراجعة شاملة
- `docs/fixes-2026-07/FINAL_CONSOLIDATED_PLAN.md` — خطة الإصلاحات
- `docs/fixes-2026-07/PAGE_BY_PAGE_COMPARISON.md` — مقارنة كل صفحة
- `docs/fixes-2026-07/ONLINE_OFFLINE_SCENARIO.md` — سيناريو العمل

---

## 9. كيفية الإضافة/التعديل

### إضافة شاشة جديدة:
1. أنشئ الملف في `apps/mobile/lib/screens/`
2. أضف المسار في `apps/mobile/lib/router/app_router.dart`
3. أضف Provider في `apps/mobile/lib/providers/` إذا يحتاج بيانات
4. استخدم `OfflineDataCache` للتخزين المحلي

### إضافة API endpoint:
1. أنشئ Edge Function في `supabase/functions/`
2. أضف اسم الدالة في `packages/core/lib/src/config/supabase_config.dart`
3. استخدم `ApiClient.callFunction()` للاستدعاء
4. أضف `_withRetry` تلقائياً (مُطبق على callFunction)

### إضافة Provider:
```dart
// FutureProvider — لجلب بيانات
final myProvider = FutureProvider.autoDispose<MyType>((ref) async {
  final cache = await ref.watch(offlineDataCacheProvider.future);
  return cache.getList(
    'my_cache_key',
    () => ref.read(databaseServiceProvider).getMyData(),
    maxAge: const Duration(hours: 24),
  );
});

// StateNotifierProvider — لإدارة حالة معقدة
final myNotifierProvider = StateNotifierProvider<MyNotifier, MyState>((ref) {
  return MyNotifier(ref);
});
```

### إضافة حقل في النموذج:
1. أضف نوع الحقل في `form_field_builders.dart`
2. أضف الـ widget في `form_fill_widgets.dart`
3. أضف التحقق في `_submit()` في `form_fill_screen.dart`

---

## 10. استكشاف الأخطاء

### مشكلة: التطبيق يبدأ بـ "لا توجد بيانات"
**السبب:** ConnectivityUtils يبدأ offline ثم يُحقق
**الحل:** تحقق من الإنترنت → اسحب للتحديث

### مشكلة: "0 إرساليات" في Dashboard
**السبب:** count() يُرجع 0 عند فشل غير متوقع
**الحل:** تم إصلاحه في v3.14.0 — يُظهر "خطأ في التحميل"

### مشكلة: تجميد UI أثناء ملء النموذج
**السبب:** Auto-save يعمل encryption على UI thread
**الحل:** تم إصلاحه في v3.14.0 — Isolate مع retry

### مشكلة: فقدان البيانات عند تحديث التطبيق
**السبب:** Encryption format change يُمسح الكاش
**الحل:** تم إصلاحه في v3.14.0 — FormatException واضح + migration

### مشكلة: المزامنة لا تعمل بعد عودة الإنترنت
**السبب:** لا يوجد retry على الاستعلامات
**الحل:** تم إصلاحه في v3.14.0 — _withRetry على select/callFunction/rpc

### مشكلة: التطبيق يستهلك بطارية كثيراً
**السبب:** Connectivity probes كل 60 ثانية + Session refresh offline
**الحل:** تم إصلاحه في v3.14.0 — فحص connectivity قبل كل عملية

---

## 📚 مراجع إضافية

| الملف | المحتوى |
|-------|---------|
| `CONTRIBUTING.md` | إرشادات المساهمة |
| `SETUP_GUIDE.md` | دليل التثبيت التفصيلي |
| `CHANGELOG.md` | سجل التغييرات |
| `docs/user-guide/` | دليل المستخدم |
| `docs/screenshots/` | لقطات الشاشة |
| `docs/archive/` | تقارير المراجعة القديمة |

---

*آخر تحديث: 2026-07-21 — بعد تطبيق 27 إصلاح*
