# 🔄 سيناريو العمل — الاونلاين والاوفلاين بعد الاصلاحات

## السيناريو: مشرفة المديرية ترسل استمارة ← مشرفة المحافظة يراقب الارسالات

---

## 📍 الحالة الأولى: مشرفة المديرية متصلة بالإنترنت

### الخطوة 1: ملء الاستمارة
```
مشرفة المديرية تفتح نموذج "استمارة تطعيم الحملة"
```

**ما يحدث في الخلفية:**
1. `FormFillScreen._loadForm()` يبحث في الكاش أولاً
2. `OfflineDataCache.getList('forms_polio_campaign')` يُرجع النماذج من الكاش (< 1ms)
3. إذا الكاش فارغ → يسحب من السيرفر مع `_withRetry` (3 محاولات)
4. النموذج يُحمّل في 1-3 ثوانٍ

### الخطوة 2: الحفظ التلقائي
```
كل 120 ثانية — الحفظ التلقائي يعمل
```

**ما يحدث في الخلفية:**
1. `_autoSave()` يُستدعى كل 120 ثانية
2. `_syncControllersToFormData()` يُزامن الحقول + GPS coordinates
3. `offline.saveDraft()` يُرسل البيانات إلى `compute()` (Isolate منفصل)
4. التشفير يحدث في الخلفية — **لا تجميد للـ UI**
5. إذا فشل Isolate → يُحاولة مرة ثانية مع timeout 8s (لا fallback على UI thread)

### الخطوة 3: إرسال الاستمارة
```
مشرفة المديرية تضغط "إرسال"
```

**ما يحدث في الخلفية:**
1. `_submit()` يتحقق من الحقول المطلوبة
2. يتحقق من `isRoundLocked` (إذا online)
3. يُحوّل الصور إلى base64 في Isolate منفصل
4. `offline.addToSyncQueue()` يُحفظ الإرسالية في Hive (O(1) — key منفصل)
5. **لأنها online:** يُحاول المزامنة فوراً:
   ```
   syncService.sync() → _api.callFunction('submit-form', data)
   ```
6. إذا نجح → يُحذف من الطابور + يُحذف المسودة → **يُظهر "تم الإرسال ✅"**
7. إذا فشل → يبقى في الطابور → **يُظهر "سيتم الإرسال عند عودة الإنترنت"**

### الخطوة 4: مشرفة المحافظة ترى الإرسالية
```
مشرفة المحافظة تفتح Dashboard → الإرساليات
```

**ما يحدث في الخلفية:**

#### السيناريو A: مشرفة المحافظة مفتوحة على Dashboard (Realtime)
1. `RealtimeSyncService` يُراقب جدول `form_submissions` عبر WebSocket
2. عندما تصل إرسالية جديدة → `_changeController.add('form_submissions')`
3. `DashboardScreen._realtimeSub` يسمع الحدث
4. يُلغي providers: `dashboardAnalyticsProvider` + `formStatsProvider`
5. Providers تُسحب البيانات من السيرفر (مع `_withRetry`)
6. **الإرسالية تظهر خلال 2-5 ثوانٍ من الإرسال**

#### السيناريو B: مشرفة المحافظة تفتح الإرساليات لأول مرة
1. `submissionsProvider` يبحث في الكاش أولاً
2. `OfflineDataCache.incrementalGetList()` يُرجع الكاش (< 1ms)
3. إذا الكاش فارغ → يسحب من السيرفر مع `_withRetry`
4. **الإرساليات تظهر في 2-5 ثوانٍ**

#### السيناريو C: مشرفة المحافظة تسحب للتحديث
1. `forceRefreshProvider` يتحقق من `ConnectivityUtils.isOnline`
2. إذا online → يُمسح الكاش + يُسحب من السيرفر
3. إذا offline → **يتخطى** (لا يمسح الكاش)
4. **البيانات تتحدث في 2-5 ثوانٍ**

---

## 📍 الحالة الثانية: مشرفة المديرية بدون إنترنت (اوفلاين)

### الخطوة 1: ملء الاستمارة (اوفلاين)
```
مشرفة المديرية تفتح نموذج "استمارة تطعيم الحملة" بدون إنترنت
```

**ما يحدث في الخلفية:**
1. `FormFillScreen._loadForm()` يبحث في الكاش أولاً
2. `OfflineDataCache.getList('forms_polio_campaign')` يُرجع النماذج من الكاش
3. **النموذج يُحمّل فوراً من الكاش (< 1 ثانية)**
4. لا محاولة شبكة — `ConnectivityUtils.isOnline = false`

### الخطوة 2: الحفظ التلقائي (اوفلاين)
```
كل 120 ثانية — نفس العملية
```

**ما يحدث:**
1. نفس الخطوات أعلاه — `compute()` في Isolate
2. البيانات تُحفظ محلياً في Hive
3. **لا فرق عن الوضع online**

### الخطوة 3: إرسال الاستمارة (اوفلاين)
```
مشرفة المديرية تضغط "إرسال" بدون إنترنت
```

**ما يحدث في الخلفية:**
1. `_submit()` يتحقق من الحقول المطلوبة
2. **يتخطى** فحص `isRoundLocked` (لأنه offline)
3. يُحوّل الصور إلى base64 في Isolate
4. `offline.addToSyncQueue()` يُحفظ الإرسالية في Hive:
   ```dart
   // O(1): يُشفر عنصر واحد فقط
   final encrypted = _encryption.encrypt(jsonEncode(submission));
   await _safeBox?.put('sync_queue/$offlineId', encrypted);
   // يُحدّث index
   index.add(offlineId);
   await _safeBox?.put(_syncQueueIndexKey, jsonEncode(index));
   ```
5. **لا محاولة مزامنة** — `offline.isOnline = false`
6. **يُظهر "تم الحفظ محلياً — سيُرسل عند عودة الإنترنت 📱"**
7. `syncPendingCountProvider` يُحدث العداد → يظهر badge "1 إرسالية معلقة"

### الخطوة 4: عودة الإنترنت
```
مشرفة المديرية تعود لمنطقة فيها إنترنت
```

**ما يحدث في الخلفية:**
1. `ConnectivityUtils._handleLinkChange(true)` يكتشف الاتصال
2. `_probeAndEmit()` يُتحقق من الإنترنت الفعلي (HTTP HEAD)
3. إذا نجح → `_emitIfChanged(true)` → يُرسل عبر stream
4. `OfflineManager.connectivityStream` يستقبل الحدث
5. `SyncService` يستقبل الحدث:
   ```dart
   _offline.connectivityStream.listen((isOnline) {
     if (isOnline && _offline.pendingCount > 0) {
       Timer(Duration(seconds: 3), () {  // انتظار 3 ثوانٍ
         _attemptSync('reconnect');       // محاولة المزامنة
       });
     }
   });
   ```
6. بعد 3 ثوانٍ → `_attemptSync('reconnect')`:
   - يتحقق من `isOnline` ✅
   - يتحقق من `pendingCount > 0` ✅
   - يتحقق من debounce (10 ثوانٍ) ✅
   - يُنفّذ `sync()`
7. `sync()` يُرسل الدفعات:
   ```dart
   // الدفعة الأولى (20 عنصر كحد أقصى)
   final items = toRetry.map((item) {
     payload['sync_metadata'] = {
       'client_timestamp': DateTime.now().toIso8601String(),
       'app_version': AppConfig.appVersion,
       'retry_count': item['retry_count'] ?? 0,
     };
     return payload;
   }).toList();
   
   final response = await _api.callFunction('sync-offline', {'items': items})
       .timeout(Duration(seconds: 45));
   ```
8. إذا نجح → يُحذف من الطابور + يُحدّث الكاش
9. **الإرسالية تصل للسيرفر خلال 3-10 ثوانٍ من عودة الإنترنت**

### الخطوة 5: مشرفة المحافظة ترى الإرسالية (بعد عودة الإنترنت)
```
مشرفة المحافظة تفتح Dashboard
```

**ما يحدث:**
1. `RealtimeSyncService` يُراقب `form_submissions` عبر WebSocket
2. عندما تصل الإرسالية من المديرية → حدث `INSERT` في Supabase
3. `RealtimeSync` يُرسل `form_submissions` event
4. `DashboardScreen._realtimeSub` يسمع الحدث
5. يُلغي `dashboardAnalyticsProvider` + `formStatsProvider`
6. Providers تُسحب البيانات من السيرفر
7. **الإرسالية تظهر خلال 2-5 ثوانٍ**

---

## 📍 الحالة الثالثة: مشرفة المديرية بدون إنترنت + مشرفة المحافظة بدون إنترنت

### السيناريو:
1. مشرفة المديرية ترسل إرسالية offline → تُحفظ في Hive
2. مشرفة المحافظة تفتح Dashboard offline → تُرجع من الكاش
3. **الإرسالية لا تظهر لمشرفة المحافظة** (لأنها لم تصل للسيرفر بعد)

### عندما تعود مشرفة المديرية online:
1. المزامنة تتم تلقائياً (بعد 3 ثوانٍ من عودة الإنترنت)
2. الإرسالية تصل للسيرفر

### عندما تعود مشرفة المحافظة online:
1. `RealtimeSync` يُكتشف الإرسالية الجديدة
2. أو تسحب للتحديث → يُسحب من السيرفر
3. **الإرسالية تظهر**

---

## 📊 ملخص أوقات الاستجابة

| الحالة | وقت الظهور | التفسير |
|--------|-----------|---------|
| **مشرفة المديرية online + مشرفة المحافظة online (Realtime)** | 2-5 ثوانٍ | RealtimeSync WebSocket |
| **مشرفة المديرية online + مشرفة المحافظة تفتح لأول مرة** | 2-5 ثوانٍ | سحب من السيرفر |
| **مشرفة المديرية offline → عودة الإنترنت** | 3-10 ثوانٍ | انتظار 3s + sync + RealtimeSync |
| **مشرفة المديرية offline + مشرفة المحافظة offline** | عند عودة كلاهما online | لا يمكن الوصول بدون إنترنت |

---

## 🔧 الإصلاحات المؤثرة على هذا السيناريو

| # | الإصلاح | التأثير على السيناريو |
|---|---------|----------------------|
| 1 | **Encryption decrypt** | لا مزيد من فقدان الإرساليات عند تحديث التطبيق |
| 2 | **_withRetry** | إذا فشل الاتصال → يُحاولة 3 مرات تلقائياً |
| 3 | **ConnectivityUtils** | لا مزيد من الانتظار offline — يكتشف الاتصال فوراً |
| 4 | **syncPendingItems lock** | لا race condition بين إرساليات متعددة |
| 5 | **Auto-save Isolate** | لا تجميد أثناء ملء النموذج |
| 6 | **Sync queue O(1)** | إضافة إرسالية فورية (مش تشفير كامل الطابور) |
| 7 | **SyncService timeout** | إذا فشل المزامنة → يُحفظ في failed_submissions فوراً |
| 8 | **RealtimeSync offline** | لا محاولات reconnect بدون إنترنت |
| 9 | **Session refresh offline** | لا محاولات تجديد بدون إنترنت |

---

## 🎯 الخلاصة

**الوضع قبل الإصلاحات:**
- إرسالية offline → قد تُفقد (encryption format change)
- عودة الإنترنت → قد لا تُزامن (no retry)
- مشرفة المحافظة → قد ترى 0 إرساليات (count silent zero)
- تجميد UI كل 60 ثانية أثناء ملء النموذج

**الوضع بعد الإصلاحات:**
- إرسالية offline → تُحفظ في Hive بشكل موثوق (O(1) + encrypted)
- عودة الإنترنت → تُزامن تلقائياً (retry 3 مرات + backoff)
- مشرفة المحافظة → ترى الإرساليات عبر RealtimeSync (2-5 ثوانٍ)
- لا تجميد UI (120 ثانية + Isolate)

---

*تم إعداد هذا السيناريو بناءً على تتبع الكود الفعلي لكل خطوة.*
