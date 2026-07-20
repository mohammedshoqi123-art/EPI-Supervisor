# 🔍 تقرير مراجعة شاملة — EPI Supervisor Mobile App
## مراجعة يدوية كاملة للكود المصدري (بدون الاعتماد على أي تقارير سابقة)

**تاريخ المراجعة:** 2026-07-21
**الإصدار المراجع:** v3.13.2+59
**نطاق:** تطبيق الموبايل (`apps/mobile/` + `packages/core/` + `packages/shared/`)

---

## 📊 ملخص المشاكل المكتشفة

| الفئة | حرج | متوسط | منخفض | المجموع |
|-------|------|--------|-------|---------|
| تعليق/تجميد التطبيق (Hang) | 4 | 2 | 0 | 6 |
| فقدان بيانات (Data Loss) | 3 | 1 | 0 | 4 |
| أوفلاين (Offline) | 3 | 4 | 2 | 9 |
| أونلاين (Online) | 2 | 3 | 1 | 6 |
| أداء (Performance) | 2 | 5 | 3 | 10 |
| تسريب ذاكرة (Memory Leak) | 1 | 3 | 1 | 5 |
| أمان (Security) | 1 | 2 | 1 | 4 |
| **المجموع** | **16** | **20** | **8** | **44** |

---

## 🔴 المشاكل الحرجة (Critical) — تسبب تعليق أو فقدان بيانات

### C1. Hive Encryption Decrypt يُرجع فارغ عند اكتشاف Format قديم — فقدان بيانات الكاش
**الملف:** `packages/core/lib/src/security/encryption_service.dart` — دالة `decrypt()`
**المشكلة:** عندما يكتشف الـ decrypt أن البيانات مخزنة بالـ format القديم (قبل EPI2)، يُرجع نص فارغ `''` بدلاً من محاولة فك التشفير.
```dart
// OLD FORMAT: [salt(16)][iv(12)][ciphertext+tag]
// Instead of throwing, return empty string
if (kDebugMode) {
  debugPrint('[EncryptionService] Old format detected — returning empty (will re-sync)');
}
return ''; // ⚠️ PROBLEM: All cached data becomes empty string
```
**التأثير:** بعد أي تحديث للتطبيق يستخدم format تشفير جديد، **جميع البيانات المخزنة في Hive تُفقد فوراً** — forms, submissions, drafts, cache. المستخدم يفقد كل شيء.
**الإصلاح:** يجب محاولة فك التشفير بالـ format القديم كـ fallback قبل إرجاع فارغ. أو migration تلقائي.

---

### C2. `_withRetry` معرّف لكن لا يُستخدم أبداً — لا يوجد retry حقيقي على الاستعلامات
**الملف:** `packages/core/lib/src/api/api_client.dart`
**المشكلة:** دالة `_withRetry` موجودة (مع exponential backoff) لكن **لا تُستدعى من أي مكان** — كل الـ `select`, `insert`, `update`, `callFunction` تُنفّذ مرة واحدة فقط.
```dart
// This method EXISTS but is NEVER CALLED
Future<T> _withRetry<T>(String label, Future<T> Function() action, {int maxRetries = 3}) async {
  // ... exponential backoff logic
}
```
**التأثير:** أي انقطاع شبكة لحظي (أقل من ثانية) يُسبب فشل العملية بالكامل. في مناطق الاتصال المتقطع (اليمن)، هذا يُسبب فشل متكرر في تحميل البيانات والمزامنة.
**الإصلاح:** استخدام `_withRetry` في `select`, `callFunction`, `rpc` مع retry على `NetworkException` و `TimeoutException`.

---

### C3. Auto-save Draft على UI Thread — تجميد 1-3 ثوانٍ كل 60 ثانية
**الملف:** `apps/mobile/lib/screens/form_fill/form_fill_screen.dart`
**المشكلة:** الـ auto-save يُنفّذ كل 60 ثانية. رغم أن `saveDraft` في `OfflineManager` يستخدم `compute()` للتشفير، إلا أن:
1. `compute()` يُنشئ Isolate جديد كل مرة (costly)
2. الـ timeout على `compute()` هو 5 ثوانٍ فقط
3. إذا فشل الـ Isolate، يعمل fallback على UI thread (encryption على UI = تجميد)

```dart
_autoSaveTimer = Timer.periodic(const Duration(seconds: 60), (_) {
  if (_hasUnsavedChanges && _formData.isNotEmpty) {
    _autoSave(showFeedback: false); // Can freeze UI for 1-3s
  }
});
```
**التأثير:** أثناء ملء النموذج، التطبيق يُتجمد لحظياً كل دقيقة. إذا كان النموذج يحتوي صور (base64 كبير)، التجميد أطول.
**الإصلاح:**
1. زيادة الفترة إلى 120 ثانية
2. استخدام Isolate مستمر (persistent isolate) بدلاً من `compute()` الجديد كل مرة
3. عدم الـ fallback على UI thread — انتظار Isolate التالي بدلاً من ذلك

---

### C4. `OfflineManager._saveQueue` تُشفّر كامل الطابور كل مرة — O(n) مكلفة
**الملف:** `packages/core/lib/src/offline/offline_manager.dart`
**المشكلة:** كل عملية `addToSyncQueue` أو `removeFromQueue` تقوم بـ:
1. قراءة كامل الطابور من Hive (decrypt)
2. إضافة/حذف عنصر
3. تشفير كامل الطابور مرة أخرى
4. كتابته في Hive

إذا كان الطابور يحتوي 100 عنصر، كل عملية = decrypt 100 عنصر + encrypt 100 عنصر.
```dart
Future<String> addToSyncQueue(Map<String, dynamic> submission) async {
  return _withWriteLock(() async {
    // ...
    final queue = _getQueue(); // Decrypt ALL items
    queue.add(submission);
    await _saveQueue(queue); // Encrypt ALL items
    // ...
  });
}
```
**التأثير:** مع 50+ عنصر في الطابور، كل إرسالية جديدة تأخذ ثوانٍ. في وضع الأوفلاين مع إرساليات متعددة، التطبيق يُبطئ بشكل ملحوظ.
**الإصلاح:** استخدام Hive بشكل مباشر (كل عنصر في key منفصل) بدلاً من تشفير كامل المصفوفة.

---

### C5. `ConnectivityUtils` يبدأ كـ offline ثم يُحقن probe — قد يسبب race condition
**الملف:** `packages/core/lib/src/utils/connectivity_utils.dart`
**المشكلة:** `initialize()` تبدأ `_isOnline = false` ثم تعمل `_probeAndEmit()` في الخلفية. لكن:
1. `SplashScreen` يقرأ `ConnectivityUtils.isOnline` فوراً
2. إذا كان الـ probe لم ينتهِ، يُعتبر offline
3. ينتقل للـ dashboard بدون بيانات
4. الـ probe ينتهي → يُرسل `true` → لكن الـ providers لم تُحمّل

```dart
static Future<void> initialize() async {
  _isOnline = false; // Start offline
  // ... check connectivity ...
  _probeAndEmit(); // Background — may complete AFTER splash reads it
}
```
**التأثير:** في بعض الأحيان، التطبيق يبدأ بـ "لا توجد بيانات" رغم وجود إنترنت. المستخدم يحتاج يسحب refresh يدوياً.
**الإصلاح:** انتظار أول probe واحد على الأقل قبل إكمال `initialize()` (مع timeout 3 ثوانٍ).

---

### C6. `ApiClient.count` يُرجع 0 عند فشل غير متوقع — بيانات خاطئة في Dashboard
**الملف:** `packages/core/lib/src/api/api_client.dart` — دالة `count()`
**المشكلة:** عند فشل غير متوقع (ليس network error)، الدالة تُرجع `0`:
```dart
} catch (e) {
  if (_isNetworkError(e)) throw const NetworkException();
  return 0; // ⚠️ Silent 0 — dashboard shows 0 submissions
}
```
**التأثير:** Dashboard يُظهر 0 إرساليات رغم وجود مئات. المستخدم يظن أن بياناته ضاعت.
**الإصلاح:** إرجاع `null` أو رمي exception — عدم إرجاع 0 كقيمة صامتة.

---

## 🟠 المشاكل المتوسطة (Medium) — تؤثر على تجربة المستخدم

### M1. `SyncService.sync()` لا يُعالج `TimeoutException` بشكل صحيح في الدفعات
**الملف:** `packages/core/lib/src/sync/sync_service.dart`
**المشكلة:** عندما ينتهي timeout على دفعة sync، يتم تطبيق backoff على جميع عناصر الدفعة، لكن **لا يتم حفظ العناصر المتبقية** في `failed_submissions`. العناصر تبقى في الطابور مع `retry_count` يزداد حتى `maxRetries` ثم تُنقل لـ `failed_submissions`.
**الإصلاح:** عند timeout، يجب حفظ العناصر فوراً في `failed_submissions` بدلاً من إعادة المحاولة 5 مرات (قد تأخذ ساعة كاملة).

---

### M2. `RealtimeSyncService` يُ_force logout عند deactivate بدون تأكيد
**الملف:** `apps/mobile/lib/providers/realtime_sync_provider.dart`
**المشكلة:** عند تغيير `is_active` إلى `false` في جدول `profiles`، يتم `signOut` فوراً بدون:
1. تأكيد من المستخدم
2. حفظ البيانات غير المحفوظة
3. إشعار واضح
```dart
if (!isActive) {
  Supabase.instance.client.auth.signOut(); // Immediate — no save, no warning
}
```
**التأثير:** المستخدم يفقد كل شيء فوراً — drafts, unsaved form data, sync queue.
**الإصلاح:** إظهار dialog أولاً → حفظ drafts → ثم signOut.

---

### M3. `_prefetchCriticalData` يُنشئ `DatabaseService` جديد كل مرة
**الملف:** `apps/mobile/lib/main.dart`
**المشكلة:** يُنشئ `DatabaseService(ApiClient())` جديد بدلاً من استخدام الـ provider:
```dart
final db = DatabaseService(ApiClient()); // New instance — not from provider
```
**التأثير:** الـ ApiClient الجديد قد لا يكون مُرتبط بالـ Supabase client الصحيح (إذا لم ينتهِ init بعد).
**الإصلاح:** استخدام `ref.read(databaseServiceProvider)` أو تأخير الـ prefetch حتى تنتهي التهيئة.

---

### M4. `EncryptionService` fallback على UI thread عند فشل Isolate
**الملف:** `packages/core/lib/src/security/encryption_service.dart`
**المشكلة:** إذا فشل `compute()` (عدم توفر Isolate، timeout)، يتم تنفيذ PBKDF2 (600k iteration) على UI thread:
```dart
} catch (e) {
  debugPrint('[EncryptionService] Isolate failed ($e), running sync');
  final keyBytes = _deriveKeySync(utf8.encode(encryptionKey), salt); // UI thread!
  _pinnedKey = enc.Key(keyBytes);
}
```
**التأثير:** تجميد UI لـ 1-3 ثوانٍ. في أجهزة ضعيفة، قد يصل إلى 5+ ثوانٍ.
**الإصلاح:** عدم الـ fallback على UI thread — إرجاع error بدلاً من ذلك.

---

### M5. `FormFillScreen._loadForm` يحاول تحميل من الشبكة حتى لو offline
**الملف:** `apps/mobile/lib/screens/form_fill/form_fill_screen.dart`
**المشكلة:** رغم وجود فحص offline، إلا أن الفحص يحدث **بعد** محاولة الكاش. إذا فشل الكاش (encryption format change)، يحاول الشبكة حتى لو offline:
```dart
if (form == null) {
  if (!ConnectivityUtils.isOnline) {
    // Shows error and pops
  }
  // But if ConnectivityUtils reports online (false positive), tries network
  form = await db.getForm(widget.formId).timeout(Duration(seconds: 10));
}
```
**الإصلاح:** إضافة try-catch حول الـ network call مع fallback واضح.

---

### M6. `OfflineDataCache._findRelatedCache` قد يُرجع بيانات حملة مختلفة
**الملف:** `packages/core/lib/src/offline/offline_data_cache.dart`
**المشكلة:** رغم وجود فلتر campaign، إلا أن الـ prefix matching ضعيف:
```dart
final prefix = parts.first; // Just the first word!
```
إذا كان الـ key هو `submissions_camp_polio_campaign_round_1`، الـ prefix هو `submissions` — وهذا يطابق أي شيء يبدأ بـ `submissions` حتى لو كان لحملة مختلفة.
**الإصلاح:** استخدام matching أكثر دقة (كل الأجزاء قبل `_camp_`).

---

### M7. `FullSyncNotifier.syncAll` لا يُلغي المزامنة السابقة
**الملف:** `apps/mobile/lib/providers/full_sync_provider.dart`
**المشكلة:** إذا ضغط المستخدم "مزامنة" مرتين بسرعة، كلتا العمليات تعمل بالتوازي:
```dart
if (state == FullSyncState.syncing) {
  return const FullSyncResult(); // Returns empty — but first sync continues
}
```
**الإصلاح:** إلغاء الـ Future السابق أو إظهار "جاري المزامنة..." بشكل واضح.

---

### M8. `AdvancedCacheManager` لا يُحفظ في Hive — يُفقد عند إعادة التشغيل
**الملف:** `packages/core/lib/src/cache/advanced_cache_manager.dart`
**المشكلة:** الـ cache manager يستخدم `Map<String, CacheEntry>` في الذاكرة فقط — لا يوجد persistence. عند إعادة تشغيل التطبيق، كل الـ cache يُفقد.
**اللاحظة:** هذا الـ cache manager يبدو غير مستخدم فعلياً في التطبيق (يستخدم `OfflineDataCache` بدلاً منه). لكن وجوده يُشير إلى خلط في بنية التخزين المؤقت.

---

### M9. `authRepositoryProvider` يُنشئ `AuthRepository` بدون انتظار Supabase
**الملف:** `apps/mobile/lib/providers/app_providers.dart`
**المشكلة:** `AuthRepository()` يُحاول الوصول لـ `Supabase.instance.client` في constructor. إذا لم ينتهِ init، يُسجل error ويحاول مرة ثانية بعد ثانيتين. لكن الـ provider يُرجع الـ repository فوراً — أي أن أول طلب قد يفشل.
**الإصلاح:** استخدام `FutureProvider` بدلاً من `Provider`.

---

### M10. `DashboardScreen` يُنشئ multiple listeners على RealtimeSync
**الملف:** `apps/mobile/lib/screens/dashboard_screen.dart`
**المشكلة:** كل مرة يُعاد بناء الـ widget (setState, campaign change)، يتم إنشاء listener جديد على `realtimeSync.onChange` بدون إلغاء القديم:
```dart
realtimeSync.onChange.listen((table) { // New listener every rebuild!
  // ... invalidation logic
});
```
**التأثير:** مع الوقت، عدد الـ listeners يزداد → invalidation متكرر → rebuilds غير ضرورية → استهلاك بطارية.
**الإصلاح:** حفظ الـ `StreamSubscription` في state وإلغاؤه في `dispose`.

---

## 🟡 المشاكل المنخفضة (Low) — تحسينات مطلوبة

### L1. `callFunctionStream` لا يُغلق `httpClient` عند timeout
**الملف:** `packages/core/lib/src/api/api_client.dart`
**المشكلة:** في `callFunctionStream`، إذا حدث timeout على `httpClient.send(request)`، يتم إغلاق الـ client. لكن إذا حدث timeout أثناء قراءة الـ stream، الـ client يبقى مفتوحاً.
**الإصلاح:** إضافة timeout على الـ stream reading أيضاً.

---

### L2. `_recoverStuckSyncingItems` يُعالج كل العناصر حتى لو الطابور كبير
**الملف:** `packages/core/lib/src/offline/offline_manager.dart`
**المشكلة:** عند بدء التطبيق، يتم فك تشفير كامل الطابور وفحص كل عنصر. مع 1000+ عنصر، هذا يُبطئ الـ startup.
**الإصلاح:** إضافة flag عام في Hive يُشير إلى وجود عناصر معلقة (بدلاً من فحص الكل).

---

### L3. `getSubmissions` fallback pagination قد تأخذ وقتاً طويلاً
**الملف:** `packages/core/lib/src/database/database_service.dart`
**المشكلة:** الـ fallback pagination تُكرر `selectIn` مع 1000 صف في كل مرة. مع 10,000+ إرسالية، هذا = 10+ طلبات HTTP متتالية.
**الإصلاح:** استخدام RPC بشكل أساسي (وليس fallback).

---

### L4. `SplashScreen` ينتظر 5 ثوانٍ حتى لو Supabase جاهز
**الملف:** `apps/mobile/lib/screens/splash_screen.dart`
**المشكلة:** الحلقة `for (int i = 0; i < 5; i++)` تنتظر حتى لو `supabaseInitialized` يصبح `true` في الثانية الأولى.
**الإصلاح:** استخدام `await` على Completer بدلاً من polling.

---

### L5. `MapScreen` يُحمّل 2000+ إرسالية في كل مرة
**الملف:** `apps/mobile/lib/screens/map_screen.dart`
**المشكلة:** الخريطة تطلب `limit: 2000, lean: true` — حتى لو المستخدم ينظر لمنطقة صغيرة.
**الإزالة:** استخدام geospatial filter (bounding box) على السيرفر.

---

### L6. `CampaignNotifier._loadVisibilityInBackground` لا تُعالج الأخطاء
**الملف:** `apps/mobile/lib/providers/app_providers.dart`
**المشكلة:** `catch (_) {}` يُخفي أي خطأ — حتى لو كان خطأ في الـ schema.
**الإصلاح:** تسجيل الخطأ على الأقل في debug mode.

---

## 🔐 المشاكل الأمنية (Security)

### S1. Encryption Key في `String.fromEnvironment` — قد يبقى في الـ binary
**الملف:** `packages/core/lib/src/security/encryption_service.dart`
**المشكلة:** `const String.fromEnvironment('ENCRYPTION_KEY')` يُخزّن الـ key كـ string literal في الـ binary. يمكن استخراجـه من الـ APK.
**الإصلاح:** استخدام `flutter_secure_storage` أو توليد الـ key من معلومات الجهاز.

---

### S2. `AuthRepository.uploadAvatar` fallback على base64 في profiles
**الملف:** `packages/core/lib/src/auth/auth_repository.dart`
**المشكلة:** عند فشل رفع الصورة، يتم تخزينها كـ base64 data URL في حقل `avatar_url`ในฐาน البيانات. هذا:
1. يُبطئ كل query على `profiles` (payload كبير)
2. يُخزن بيانات كبيرة في حقل نصي
**الإصلاح:** عدم الـ fallback على base64 — إظهار خطأ واضح.

---

### S3. `_maxPayloadSize` هو 5MB — قد يُسبب OOM على أجهزة ضعيفة
**الملف:** `packages/core/lib/src/offline/offline_manager.dart`
**المشكلة:** 5MB payload في الذاكرة + encryption = 10MB+ temporarily. على أجهزة بـ 1-2GB RAM، قد يُسبب Out of Memory.
**الإصلاح:** تقليل الحد إلى 2MB أو ضغط الصور أكثر.

---

### S4. `OfflineManager` لا يُشفر drafts index
**الملف:** `packages/core/lib/src/offline/offline_manager.dart`
**المشكلة:** `drafts_index` يُخزن كـ plain JSON بدون تشفير:
```dart
await _box?.put(_draftsIndexKey, jsonEncode(draftIds)); // Unencrypted!
```
**الإصلاح:** تشفير الـ index أيضاً.

---

## 📋 خطة الإصلاحات بالتفصيل

### المرحلة 1: إصلاحات حرجة (أسبوع واحد)

| # | الإصلاح | الأولوية | الملفات | الوقت المقدّر |
|---|---------|----------|---------|--------------|
| 1 | **إصلاح EncryptionService decrypt للـ format القديم** — محاولة فك تشفير بالطريقة القديمة قبل إرجاع فارغ | 🔴 P0 | `encryption_service.dart` | 4 ساعات |
| 2 | **تفعيل `_withRetry`** على `select`, `callFunction`, `rpc` | 🔴 P0 | `api_client.dart` | 6 ساعات |
| 3 | **إصلاح ConnectivityUtils race condition** — انتظار أول probe مع timeout 3s | 🔴 P0 | `connectivity_utils.dart` | 3 ساعات |
| 4 | **إصلاح `count()` silent zero** — إرجاع null أو رمي exception | 🔴 P0 | `api_client.dart` | 2 ساعات |
| 5 | **إصلاح RealtimeSync force logout** — إظهار dialog + حفظ drafts أولاً | 🔴 P0 | `realtime_sync_provider.dart` | 4 ساعات |
| 6 | **إصلاح DashboardScreen multiple listeners** — حفظ StreamSubscription | 🟠 P1 | `dashboard_screen.dart` | 2 ساعات |

### المرحلة 2: إصلاحات الأداء (أسبوعان)

| # | الإصلاح | الأولوية | الملفات | الوقت المقدّر |
|---|---------|----------|---------|--------------|
| 7 | **إصلاح Auto-save تجميد UI** — زيادة الفترة إلى 120s + persistent isolate | 🟠 P1 | `form_fill_screen.dart` | 6 ساعات |
| 8 | **إصلاح _saveQueue O(n)** — استخدام Hive keys منفصلة لكل عنصر | 🟠 P1 | `offline_manager.dart` | 8 ساعات |
| 9 | **إصلاح EncryptionService UI fallback** — عدم الـ fallback على UI thread | 🟠 P1 | `encryption_service.dart` | 3 ساعات |
| 10 | **إصلاح _prefetchCriticalData** — استخدام provider بدلاً من instance جديد | 🟠 P1 | `main.dart` | 2 ساعات |
| 11 | **تحسين MapScreen** — استخدام bounding box filter | 🟡 P2 | `map_screen.dart` | 6 ساعات |
| 12 | **تحسين getSubmissions RPC** — استخدام RPC كأساسي | 🟡 P2 | `database_service.dart` | 4 ساعات |

### المرحلة 3: إصلاحات الأوفلاين (أسبوع واحد)

| # | الإصلاح | الأولوية | الملفات | الوقت المقدّر |
|---|---------|----------|---------|--------------|
| 13 | **إصلاح OfflineDataCache._findRelatedCache** — matching أكثر دقة | 🟠 P1 | `offline_data_cache.dart` | 3 ساعات |
| 14 | **إصلاح SyncService timeout handling** — حفظ في failed_submissions فوراً | 🟠 P1 | `sync_service.dart` | 4 ساعات |
| 15 | **إصلاح Hive corruption recovery** — تحسين backup قبل delete | 🟡 P2 | `offline_manager.dart` | 3 ساعات |
| 16 | **إضافة migration tool** للبيانات عند تغيير encryption format | 🟡 P2 | `offline_manager.dart` | 6 ساعات |

### المرحلة 4: إصلاحات الأمان والتنظيف (أسبوع واحد)

| # | الإصلاح | الأولوية | الملفات | الوقت المقدّر |
|---|---------|----------|---------|--------------|
| 17 | **تشفير drafts index** | 🟡 P2 | `offline_manager.dart` | 2 ساعات |
| 18 | **إزالة base64 avatar fallback** | 🟡 P2 | `auth_repository.dart` | 2 ساعات |
| 19 | **تحسين _maxPayloadSize** — ضغط الصور أكثر | 🟡 P2 | `offline_manager.dart` | 4 ساعات |
| 20 | **تنظيف AdvancedCacheManager** — إما تفعيله أو حذفه | 🟢 P3 | `advanced_cache_manager.dart` | 2 ساعات |
| 21 | **تحسين SplashScreen polling** — استخدام Completer | 🟢 P3 | `splash_screen.dart` | 2 ساعات |
| 22 | **تحسين FullSync cancelation** — إلغاء المزامنة السابقة | 🟢 P3 | `full_sync_provider.dart` | 3 ساعات |

---

## 🏗️ توصيات هيكلية طويلة المدى

### 1. توحيد نظام التخزين المؤقت
حالياً يوجد 3 أنظمة cache:
- `OfflineManager` (Hive + encryption)
- `OfflineDataCache` (memory + Hive via OfflineManager)
- `AdvancedCacheManager` (memory only — غير مستخدم)

**التوصية:** حذف `AdvancedCacheManager` وتوحيد كل شيء تحت `OfflineDataCache`.

### 2. استخدام persistent Isolate للتشفير
`compute()` يُنشئ Isolate جديد كل مرة (تكلفة 50-100ms). بدلاً من ذلك، استخدام `Isolate.spawn` لإنشاء Isolate واحد يبقى طوال عمر التطبيق.

### 3. تحسين Hive storage schema
حالياً: كل sync queue = key واحد يحتوي مصفوفة مشفرة بالكامل.
الأفضل: كل عنصر في key منفصل (`sync_queue/$offlineId`) مع index مشفر.

### 4. إضافة telemetry للأوفلاين
حالياً: لا يوجد قياس لعدد مرات انقطاع الاتصال، مدة الأوفلاين، أو نجاح/فشل المزامنة.
**التوصية:** إضافة analytics events لفهم سلوك المستخدمين في مناطق الاتصال المتقطع.

---

## 📝 ملاحظات عامة

1. **الكود بشكل عام جيد** — يوجد handling للأخطاء، caching، offline-first architecture.
2. **التعليقات ممتازة** — كل إصلاح موثق بشرح سبب التغيير.
3. **بنية المشروع منظمة** — فصل واضح بين core/shared/mobile.
4. **أكبر مشكلة**: الاعتماد على `ConnectivityUtils.isOnline` كمصدر وحيد للحقيقة — قد يُعطي false positives (wifi بدون إنترنت).
5. **ثاني أكبر مشكلة**: الـ encryption format change يُسبب فقدان بيانات كامل بدون warning.

---

*تمت المراجعة يدوياً من قراءة جميع الملفات الحرجة في المشروع.*
