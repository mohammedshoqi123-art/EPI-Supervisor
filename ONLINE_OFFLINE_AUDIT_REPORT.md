# 📋 تقرير فحص شامل — EPI Supervisor Mobile App
## مشاكل الأونلاين والأوفلاين + خطة العمل المقترحة

**التاريخ:** 2026-07-20  
**الإصدار المفحوص:** v3.13.2+59  
**الحالة:** فحص أولي — يحتاج تأكيد من بيئة التشغيل

---

## 🔴 المشاكل الحرجة (Critical) — تسبب تعليق أو crash

### 1. ENCRYPTION_KEY غير مُعرّف في البناء (CRASH مضمون)
**المشكلة:** ملف `.env.example` يحتوي على `ENCRYPTION_KEY=<REPLACE_WITH_32_CHAR_MINIMUM_KEY>` كقيمة placeholder. إذا لم يتم تغييرها عند البناء:
- `EnvValidator.validate()` يتحقق فقط في Release mode (`!kDebugMode`)
- في Debug mode يطبع تحذير فقط ولا يوقف التطبيق
- لكن `EncryptionService.initialize()` سيفشل عند محاولة تشفير Hive
- النتيجة: **crash فوري** عند أول محاولة لحفظ بيانات offline

**الخطورة:** 🔴🔴🔴 — التطبيق لا يعمل بدونه في Production

**الموقع:**
- `packages/core/lib/src/config/env_validator.dart` (سطر 54-70)
- `packages/core/lib/src/security/encryption_service.dart`

**الحل المقترح:**
```bash
# توليد مفتاح آمن
openssl rand -base64 32
# ثم تمريره عند البناء
flutter build apk --dart-define=ENCRYPTION_KEY=<المفتاح>
```

---

### 2. Hive Corruption Recovery قد يفقد بيانات المستخدم
**المشكلة:** في `OfflineManager.init()`، عند فشل فتح Hive box:
1. ينسخ الملف التالف (backup)
2. يحذف Box من القرص
3. يفتح Box جديد فارغ

**المخاطر:** جميع البيانات المحفوظة محلياً ( drafts، sync queue، cache) تُحذف نهائياً. المستخدم يفقد أي إرساليات لم تتم مزامنتها.

**الموقع:** `packages/core/lib/src/offline/offline_manager.dart` (سطر 82-115)

**الحل المقترح:**
- إضافة آلية لاستخراج البيانات من الملف التالف قبل الحذف
- إظهار تنبيه للمستخدم قبل حذف البيانات
- إضافة "تصدير البيانات التالفة" للتشخيص

---

### 3. Race Condition في `_initRealtimeSync()`
**المشكلة:** في `main.dart`، `_initRealtimeSync()` يتأخر 3 ثوانٍ ثم يحاول:
```dart
Future.delayed(const Duration(seconds: 3), () {
  if (mounted) {
    ref.read(realtimeSyncProvider);
  }
});
```
لكن Supabase قد لا يكون جاهزاً بعد (خاصة في الأوفلاين). المحاولة ستsłuch Supabase.instance.client قبل أن يكون متاحاً.

**الموقع:** `apps/mobile/lib/main.dart` (سطر 128-138)

**الحل المقترح:**
```dart
void _initRealtimeSync() {
  // انتظر حتى Supabase جاهز فعلاً
  _waitForSupabase().then((_) {
    if (mounted) {
      try {
        ref.read(realtimeSyncProvider);
      } catch (e) {
        debugPrint('[App] Realtime sync failed: $e');
      }
    }
  });
}

Future<void> _waitForSupabase() async {
  for (int i = 0; i < 30; i++) {
    if (supabaseInitialized) return;
    await Future.delayed(const Duration(seconds: 1));
  }
}
```

---

## 🟠 المشاكل المهمة (Major) — تأثير سلبي على تجربة المستخدم

### 4. ConnectivityUtils Probe يحظر الاتصال في شبكات بطيئة
**المشكلة:** `_probeInternet()` يحاول HTTP HEAD على `google.com` و `cloudflare.com` مع timeout 3 ثوانٍ لكل probe. في العراق، هذه المواقع قد تكون بطيئة أو محجوبة جزئياً:
- إذا كان WiFi متصل بدون إنترنت حقيقي → التطبيق يعتقد أنه "أونلاين" لمدة 120 ثانية ( فترة إعادة الفحص)
- كل استدعاء API سيفشل بعد 30 ثانية timeout

**الموقع:** `packages/core/lib/src/utils/connectivity_utils.dart`

**الحل المقترح:**
- إضافة probe URL محلي (مثل Supabase health endpoint)
- تقليل `_onlineRecheckInterval` من 120s إلى 60s
- إضافة فحص سريع عند فشل أي API call

---

### 5. Session Refresh قد ي hang indefinitely
**المشكلة:** في `AuthRepository._proactiveRefresh()`:
```dart
await _client?.auth.refreshSession();
```
لا يوجد timeout. إذا كان السيرفر بطيئاً، هذه الدالة تعلق indefinitely.

**الموقع:** `packages/core/lib/src/auth/auth_repository.dart` (سطر 150-175)

**الحل المقترح:**
```dart
await _client?.auth.refreshSession().timeout(
  const Duration(seconds: 10),
  onTimeout: () {
    debugPrint('[Auth] Refresh timed out');
    throw TimeoutException('Session refresh timed out');
  },
);
```

---

### 6. `callFunction` Timeout غير كافٍ للدوال الثقيلة
**المشكلة:** `ApiClient.callFunction()` يستخدم timeout ثابت 30 ثانية. بعض الدوال مثل `ai-chat-v3` قد تحتاج وقتاً أطول (LLM inference). النتيجة: timeout زائف والمستخدم يرى خطأ رغم أن الدالة تعمل.

**الموقع:** `packages/core/lib/src/api/api_client.dart` (سطر 223)

**الحل المقترح:**
- جعل timeout قابل للتعديل: `callFunction(name, body, {timeout: Duration})`
- زيادة timeout الافتراضي للدوان AI: 60s
- إضافة streaming response للـ AI chat

---

### 7. `getSubmissions()` fallback إلى selectIn مع limit 1000
**المشكلة:** عند فشل RPC `fetch_submissions`، يرجع الكود إلى `selectIn()` مع limit افتراضي. لكن `selectIn` يطبق limit على الاستعلام كله، مما يعني:
- إذا كان هناك 5000 إرسالية، سيُرجع فقط 1000
- لا يوجد تنبيه للمستخدم أن البيانات ناقصة

**الموقع:** `packages/core/lib/src/database/database_service.dart` (سطر 120-180)

**الحل المقترح:**
- إضافة pagination في fallback path
- تنبيه المستخدم أن البيانات قد تكون ناقصة
- تسجيل الخطأ في Sentry

---

### 8. Realtime Sync لا يُحدّث Dashboard تلقائياً
**المشكلة:** `RealtimeSyncService` يستمع للتغييرات لكنه فقط يُصدر events عبر `_changeController`. لا يوجد listener في Dashboard يستمع لهذه الـ events لتحديث البيانات. المستخدم يرى بيانات قديمة رغم وجود تغييرات جديدة.

**الموقع:** `apps/mobile/lib/providers/realtime_sync_provider.dart`

**الحل المقترح:**
```dart
// في DashboardScreen.initState()
_final realtimeSync = ref.read(realtimeSyncProvider);
realtimeSync.onChange.listen((table) {
  if (table == 'form_submissions') {
    ref.invalidate(dashboardAnalyticsProvider);
    ref.invalidate(formStatsProvider);
  }
});
```

---

### 9. Offline Draft Save قد يفشل بصمت
**المشكلة:** في `form_fill_screen.dart`، حفظ المسودة:
```dart
await offline.saveDraft(draftId, formId, _formData);
```
إذا فشل ( Hive غير مهيأ، مساحة غير كافية)، الخطأ يُ catch ولا يُبلغ المستخدم. المستخدم يعتقد أن المسودة محفوظة لكنها ضائعة.

**الموقع:** `apps/mobile/lib/screens/form_fill/form_fill_screen.dart`

**الحل المقترح:**
- إظهار رسالة خطأ واضحة عند فشل الحفظ
- إضافة auto-save indicator (✅/❌)
- تسجيل الخطأ في Sentry

---

### 10. GPS Timeout قد يعلق Form Fill Screen
**المشكلة:** محاولة الحصول على الموقع:
```dart
final position = await Geolocator.getCurrentPosition(
  desiredAccuracy: LocationAccuracy.high,
);
```
لا يوجد timeout واضح. في الأماكن المغلقة أو بدون GPS، قد تعلق الشاشة indefinitely.

**الموقع:** `apps/mobile/lib/screens/form_fill/form_fill_screen.dart`

**الحل المقترح:**
```dart
final position = await Geolocator.getCurrentPosition(
  desiredAccuracy: LocationAccuracy.medium,  // أسرع
  timeLimit: const Duration(seconds: 10),
).timeout(const Duration(seconds: 15), onTimeout: () {
  // fallback to last known position
  return Geolocator.getLastKnownPosition();
});
```

---

## 🟡 المشاكل المتوسطة (Medium) — تأثير محدود

### 11. Cache Invalidation بعد Sync غير شاملة
**المشكلة:** بعد نجاح المزامنة، يتم مسح cache بـ prefix معينة فقط:
```dart
const prefixes = ['submissions', 'dashboard_analytics', 'shortages', ...];
```
لكن لا يتم مسح cache الخاص بـ `forms`، `governorates`، `districts`. إذا تمت إضافة محافظة جديدة من الـ Admin Dashboard، تطبيق الموبايل لن يراها حتى يتم مسح الكاش يدوياً.

**الموقع:** `packages/core/lib/src/sync/sync_service.dart` (سطر 290-310)

---

### 12. `_findRelatedCache` يُرجع أول cache يجده بنفس الـ prefix
**المشكلة:** عند عدم وجود cache مطابق، يبحث عن أي cache يبدأ بنفس الـ prefix. لكن قد يُرجع بيانات لنموذج مختلف أو حملة مختلفة. مثال: البحث عن `submissions_camp_polio_round_2` قد يُرجع بيانات `submissions_camp_integrated_activity`.

**الموقع:** `packages/core/lib/src/offline/offline_data_cache.dart` (سطر 280-310)

---

### 13. Notification Count يُعيد 0 عند فشل التحميل
**المشكلة:** `notificationCountProvider` يبدأ دائماً بـ `yield 0`، ثم يحاول تحميل الإشعارات. إذا فشل (أوفلاين مثلاً)، يبقى على 0. المستخدم لا يعرف أن هناك إشعارات غير مقروءة.

**الموقع:** `apps/mobile/lib/providers/app_providers.dart` (سطر 310-330)

---

### 14. `_probeInternet` Cache Duration طويل جداً
**المشكلة:** `_probeCacheDuration = 60 seconds`. إذا فقد الإنترنت خلال هذه الدقيقة، التطبيق لا يكتشف ذلك حتى تنتهي الدقيقة. المستخدم يحاول إرسال بيانات ويفشل.

**الموقع:** `packages/core/lib/src/utils/connectivity_utils.dart` (سطر 45)

---

### 15. `SyncService` Debounce قد يمنع المزامنة الضرورية
**المشكلة:** `_debounceWindow = 10 seconds`. إذا عاد الإنترنت بعد انقطاع، وحاول المستخدم مزامنة يدوياً خلال 10 ثوانٍ من محاولة تلقائية، ستُحتجب المحاولة اليدوية.

**الموقع:** `packages/core/lib/src/sync/sync_service.dart` (سطر 35)

---

## 🔵 المشاكل البسيطة (Minor) — تحسينات مطلوبة

### 16. `localDraftCountProvider` يستخدم polling كل 300 ثانية
**المشكلة:** رغم وجود `pendingCountStream` reactive في `OfflineManager`، عدد المسودات المحلية يُفحص فقط كل 5 دقائق. إذا حفظ المستخدم مسودة جديدة، العداد لا يتحدث فوراً.

### 17. `full_sync_provider` لا يُزامن `health_facilities` بشكل كامل
**المشكلة:** Facilities يتم جلبها فقط إذا لم تكن في الكاش (`hasCachedData`). لا يوجد آلية لمعرفة ما إذا كانت facilities تغيرت على السيرفر.

### 18. `SplashScreen` ينتظر 15 ثانية كحد أقصى لتهيئة Supabase
**المشكلة:** في شبكات بطيئة جداً (2G)، 15 ثانية قد لا تكفي. التطبيق ينتقل للـ Dashboard لكن Supabase غير جاهز، فتفشل جميع الاستعلامات.

### 19. `EnvValidator._isPlaceholder()` لا يتحقق من كل الـ placeholders
**المشكلة:** يتحقق فقط من `change_me`، `your-`، `placeholder`، `xxx`، `default`. لكن `.env.example` يستخدم `<REPLACE_WITH_32_CHAR_MINIMUM_KEY>` الذي يبدأ بـ `<` ولا يتم كشفه.

### 20. `callFunctionStream` لا يوجد timeout
**المشكلة:** SSE streaming للـ AI chat لا يوجد له timeout. إذا توقف السيرفر عن الإرسال، الاتصال يبقى مفتوحاً indefinitely.

---

## 📊 ملخص المشاكل حسب الخطورة

| الخطورة | العدد | المشاكل |
|---------|-------|---------|
| 🔴 حرج (Crash) | 3 | #1, #2, #3 |
| 🟠 مهم (UX) | 7 | #4, #5, #6, #7, #8, #9, #10 |
| 🟡 متوسط | 5 | #11, #12, #13, #14, #15 |
| 🔵 بسيط | 5 | #16, #17, #18, #19, #20 |

---

## 🛠️ خطة العمل المقترحة — مرحلة بمرحلة

### المرحلة 1: إصلاحات حرجة (أسبوع 1)
**الهدف:** إزالة مخاطر الـ Crash

| # | المهمة | الأولوية | الوقت المقدر |
|---|--------|---------|-------------|
| 1.1 | توليد ENCRYPTION_KEY وتمريره في البناء | P0 | ساعة واحدة |
| 1.2 | إصلاح Hive corruption recovery — استخراج البيانات قبل الحذف | P0 | 3 ساعات |
| 1.3 | إصلاح `_initRealtimeSync()` — انتظار Supabase فعلي | P0 | ساعة واحدة |
| 1.4 | إصلاح `EnvValidator._isPlaceholder()` — كشف `<REPLACE...>` | P1 | 30 دقيقة |

### المرحلة 2: إصلاحات مهمة (أسبوع 2)
**الهدف:** تحسين تجربة المستخدم الأساسية

| # | المهمة | الأولوية | الوقت المقدر |
|---|--------|---------|-------------|
| 2.1 | إضافة timeout على `refreshSession()` | P1 | ساعة واحدة |
| 2.2 | جعل `callFunction` timeout قابل للتعديل | P1 | ساعتان |
| 2.3 | إضافة fallback pagination لـ `getSubmissions` | P1 | 3 ساعات |
| 2.4 | ربط RealtimeSync بتحديث Dashboard | P1 | ساعتان |
| 2.5 | إضافة timeout على GPS في Form Fill | P1 | ساعة واحدة |
| 2.6 | إظهار خطأ واضح عند فشل حفظ Draft | P1 | ساعة واحدة |

### المرحلة 3: تحسينات متوسطة (أسبوع 3)
**الهدف:** استقرار الأوفلاين وتحسين الأداء

| # | المهمة | الأولوية | الوقت المقدر |
|---|--------|---------|-------------|
| 3.1 | تحسين Connectivity probe — إضافة Supabase endpoint | P2 | ساعتان |
| 3.2 | تحسين cache invalidation بعد Sync | P2 | 3 ساعات |
| 3.3 | إصلاح `_findRelatedCache` — فلترة حسب campaign | P2 | ساعتان |
| 3.4 | جعل notification count reactive | P2 | ساعة واحدة |
| 3.5 | تقليل probe cache duration إلى 30s | P2 | 30 دقيقة |

### المرحلة 4: تحسينات وتحسينات (أسبوع 4)
**الهدف:** تحسين الأداء وتجربة المستخدم

| # | المهمة | الأولوية | الوقت المقدر |
|---|--------|---------|-------------|
| 4.1 | جعل local draft count reactive | P3 | ساعة واحدة |
| 4.2 | إضافة timeout لـ `callFunctionStream` | P3 | ساعتان |
| 4.3 | تحسين full sync — facilities change detection | P3 | ساعتان |
| 4.4 | إضافة Sentry error reporting شامل | P3 | 3 ساعات |
| 4.5 | Splash screen — انتظار أطول في شبكات بطيئة | P3 | ساعة واحدة |

---

## ✅ نقاط القوة الموجودة

الكود الموجود يحتوي على العديد من التحسينات الجيدة:

1. **Offline-First Architecture** — بنية سليمة مع Hive + Encryption
2. **Connectivity Probe** — فحص فعلي للإنترنت (وليس فقط WiFi)
3. **Auto-Reconnect** — إعادة محاولة تلقائية عند عودة الإنترنت
4. **Conflict Resolution** — آلية لحل التعارضات
5. **Batch Sync** — مزامنة دفعات مع backoff أسي
6. **RBAC** — نظام صلاحيات هرمي
7. **Rate Limiting** — حماية من الإساءة
8. **Graceful Degradation** — التطبيق يعمل (بشكل محدود) بدون إنترنت

---

## 📝 ملاحظات ختامية

1. **البرودكشن vs الاستيج:** المشروع يستخدم Supabase واحد للإنتاج وآخر للتطوير. تأكد من أن `.env` يحتوي على URL الصحيح عند البناء لكل بيئة.

2. **التوكنات:** تم تسجيل توكنات GitHub و Supabase في هذا المحادثة. **يجب تدويرها (rotate) فوراً** بعد الانتهاء من الفحص.

3. **البناء:** تأكد من تمرير `--dart-define` لكل من:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `ENCRYPTION_KEY` (32+ chars)
   - `SENTRY_DSN` (اختياري)

4. **الاختبار:** أوصي باختبار السيناريوهات التالية:
   - تشغيل التطبيق بدون إنترنت (airplane mode)
   - فقدان الإنترنت أثناء ملء النموذج
   - عودة الإنترنت بعد انقطاع طويل
   - تسجيل الدخول بدون إنترنت أولاً ثم توصيله
   - ملء النموذج مع 2+ صور (اختبار حجم الـ payload)

---

*تم الإعداد بواسطة: AI Assistant*  
*المشروع: EPI-Supervisor v3.13.2+59*
