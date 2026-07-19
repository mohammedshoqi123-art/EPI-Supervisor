# 📋 تقرير فحص شامل — المشاكل بعد التحديث
## ثقل النظام + اختفاء بيانات المسودة (خاصة الموقع الجغرافي)

**التاريخ:** 2026-07-20  
**الإصدار:** v3.13.2+59 (commit ef109b5f)

---

## 🔴 المشكلة الأولى: بيانات الموقع الجغرافي (GPS) تختفي من المسودات

### السبب الجذري: تعارض في صيغة تخزين GPS

يوجد **دالتان** تخزنان GPS بـ **صيغتين مختلفتين**:

#### الدالة 1: `_getCurrentLocationForField()` — تخزن كـ Map
```dart
// السطر 383-390 في form_fill_screen.dart
_formData[fieldKey] = {
  'lat': lat,        // ← Map object
  'lng': lng,
  'accuracy': acc,
};
```

#### الدالة 2: `_getLocation()` — تخزن كـ String
```dart
// السطر 510-512 في form_fill_screen.dart
_formData[key] =
    '${posLat.toStringAsFixed(6)}, ${posLng.toStringAsFixed(6)}';  // ← String
```

#### عند تحميل المسودة — يتوقع String فقط:
```dart
// السطر 207-215 في form_fill_screen.dart
final gpsStr = _formData[key] as String?;  // ← يحاول تحويل إلى String
if (gpsStr != null && gpsStr.contains(',')) {
  final parts = gpsStr.split(',').map((s) => s.trim()).toList();
  // ...
}
```

### النتيجة:
- إذا استخدم المستخدم `_getCurrentLocationForField()` (النقر على حقل GPS مباشرة)
- البيانات تُخزن كـ **Map** في `_formData`
- عند حفظ المسودة → Map يُحول إلى JSON → `{"lat": 33.3, "lng": 44.3, "accuracy": 10}`
- عند تحميل المسودة → يحاول تحويله إلى String → **يفشل بصمت** → GPS يختفي!

### المشكلة الإضافية: `_syncControllersToFormData()` لا يزامن GPS

```dart
// السطر 523-540 في form_fill_screen.dart
void _syncControllersToFormData() {
  final textFieldTypes = {'text', 'textarea', 'phone', 'email', 'number', 'date', 'time'};
  for (final entry in _textControllers.entries) {
    // ... يزامن النصوص فقط
  }
  // ❌ لا يزامن: GPS، dropdown، yesno، photos
}
```

**المشكلة:** `_gpsLat` و `_gpsLng` متغيرات منفصلة عن `_formData`. عندما يتم استدعاء `_autoSave()` → `_syncControllersToFormData()` → لا يتم تحديث `_formData` بقيم GPS!

---

## 🟠 المشكلة الثانية: ثقل النظام وتعليق الواجهة

### 2.1 ConnectivityUtils Probe يسبب UI Jank

```dart
// connectivity_utils.dart
static const Duration _onlineRecheckInterval = Duration(seconds: 120);
```

كل 120 ثانية:
1. يرسل HTTP HEAD إلى `google.com` و `cloudflare.com`
2. timeout 3 ثوانٍ لكل probe
4. إذا كان الإنترنت بطيئاً → ينتظر حتى 4 ثوانٍ
5. هذا يحدث على **الـ UI thread** أحياناً بسبب `Future.wait`

### 2.2 Provider Cascade Rebuilds

الـ Dashboard يراقب **7 providers** في نفس الوقت:
```dart
final analytics = ref.watch(dashboardAnalyticsProvider(...));
final authState = ref.watch(authStateProvider);
final pendingCount = ref.watch(syncPendingCountProvider);
final unreadNotifs = ref.watch(notificationCountProvider);
final localDrafts = ref.watch(localDraftCountProvider);
final campaign = ref.watch(campaignProvider);
final campaignRound = ref.watch(campaignRoundProvider);
```

كل تغيير في أي provider → إعادة بناء كاملة للـ Dashboard!

### 2.3 Hive Encryption على UI Thread (عند Auto-Save)

كل 60 ثانية، `_autoSave()` يستدعي:
```dart
await offline.saveDraft(_draftId, widget.formId, Map<String, dynamic>.from(_formData));
```

هذا يستدعي `_encryption.encrypt()` الذي يستخدم AES-GCM.虽然 PBKDF2 تم نقله إلى Isolate، إلا أن:
- `saveDraft()` يُنفذ على **UI thread**
- إذا كان `_formData` كبير (مع صور base64) → التشفير يأخذ وقت
- هذا يسبب **تجميد مؤقت** للواجهة كل 60 ثانية

### 2.4 Splash Screen ينتظر 30 ثانية

```dart
// splash_screen.dart
for (int i = 0; i < 30; i++) {
  if (supabaseInitialized) break;
  await Future.delayed(const Duration(seconds: 1));
}
```

في حالة عدم وجود إنترنت → ينتظر 30 ثانية كاملة!

### 2.5 RealtimeSync يُنشئ اتصال WebSocket غير ضروري

```dart
// realtime_sync_provider.dart
_channel = client.channel('mobile-sync');
_channel!.onPostgresChanges(...); // 7 listeners!
_channel!.subscribe();
```

7 listeners على قناة واحدة → ضغط على الاتصال.

---

## 🟡 المشكلة الثالثة: مشاكل الأوفلاين

### 3.1 الاتصال المتفائل (Optimistic) عند البداية

```dart
// connectivity_utils.dart
_isOnline = true; // Optimistic — will be corrected by probe
```

التطبيق يبدأ بالاعتقد أنه متصلاً → يحاول طلبات réseau → تفشل بعد 30 ثانية timeout!

### 3.2 لا يوجد Offline Indicator فوري

المستخدم لا يعرف أنه أوفلاين حتى:
1. تفشل طلب réseau (30 ثانية)
2. أو يمر 120 ثانية حتى الـ probe التالي

### 3.3 Draft Auto-Save يفشل بصمت عند الأوفلاين

إذا كان Hive غير مهيأ (أول تشغيل بدون إنترنت):
```dart
final offline = await ref.read(offlineManagerProvider.future).timeout(
  const Duration(seconds: 10),
);
```
→ timeout → المسودة لا تُحفظ → المستخدم يفقد عمله!

---

## 📊 ملخص المشاكل

| # | المشكلة | الخطورة | التأثير |
|---|---------|---------|---------|
| 1 | GPS يُخزن بصيغتين مختلفتين | 🔴 حرج | بيانات الموقع تختفي من المسودات |
| 2 | `_syncControllersToFormData` لا يزامن GPS | 🔴 حرج | GPS لا يُحفظ في Auto-Save |
| 3 | Connectivity probe على UI thread | 🟠 مهم | تجميد مؤقت كل 120 ثانية |
| 4 | Provider cascade rebuilds | 🟠 مهم | Dashboard بطيء |
| 5 | Hive encryption على UI thread | 🟠 مهم | تجميد كل 60 ثانية (auto-save) |
| 6 | Splash ينتظر 30 ثانية | 🟡 متوسط | بدء بطيء بدون إنترنت |
| 7 | اتصال متفائل عند البداية | 🟡 متوسط | طلبات réseau تفشل |
| 8 | RealtimeSync 7 listeners | 🟡 متوسط | ضغط على WebSocket |

---

## 🛠️ خطة العمل المقترحة

### المرحلة 1: إصلاح GPS في المسودات (أولوية قصوى)

| # | المهمة | الوصف | الوقت |
|---|--------|-------|-------|
| 1.1 | توحيد صيغة تخزين GPS | جعل `_getCurrentLocationForField()` تخزن كـ String مثل `_getLocation()` | 30 دقيقة |
| 1.2 | إصلاح تحميل المسودة | دعم كلتا الصيغتين (String و Map) عند التحميل | 30 دقيقة |
| 1.3 | إضافة GPS إلى `_syncControllersToFormData` | مزامنة `_gpsLat`/`_gpsLng` مع `_formData` | 15 دقيقة |
| 1.4 | إضافة GPS إلى Auto-Save | التأكد من أن GPS يُحفظ مع كل مسودة تلقائية | 15 دقيقة |

### المرحلة 2: تحسين الأداء (أولوية عالية)

| # | المهمة | الوصف | الوقت |
|---|--------|-------|-------|
| 2.1 | نقل Connectivity probe إلى Isolate | منع UI jank | ساعة |
| 2.2 | تقليل Provider rebuilds | استخدام `.select()` بشكل أوسع | ساعة |
| 2.3 | نقل Hive encryption إلى Isolate | منع تجميد auto-save | ساعة |
| 2.4 | تحسين Splash screen | انتظار أقصر + offline indicator | 30 دقيقة |

### المرحلة 3: تحسين تجربة الأوفلاين (أولوية متوسطة)

| # | المهمة | الوصف | الوقت |
|---|--------|-------|-------|
| 3.1 | إزالة الاتصال المتفائل | بدء بأوفلاين + فحص فوري | 30 دقيقة |
| 3.2 | إضافة offline indicator فوري | شريط حالة في أعلى الشاشة | 30 دقيقة |
| 3.3 | تحسين Auto-Save reliability | محاولة إعادة عند الفشل | 30 دقيقة |

---

## ⏱️ الوقت الإجمالي المقدر: ~7 ساعات

---

*تم الإعداد بواسطة: AI Assistant*
