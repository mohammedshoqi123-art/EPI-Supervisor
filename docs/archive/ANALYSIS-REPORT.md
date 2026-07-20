# 🔍 تقرير تحليل شامل — مشاكل تعليق النظام EPI Supervisor

**تاريخ التحليل:** 2026-07-19  
**المنصات:** Admin Web (React/Vite) + Mobile (Flutter/Dart)  
**البنية:** Supabase (Auth + DB + Edge Functions + Realtime) + React Query + Hive (Offline)

---

## 📋 ملخص المشاكل المكتشفة

تم اكتشاف **23 مشكلة حرجة** مقسمة إلى 4 فئات رئيسية:

| الفئة | عدد المشاكل | مستوى الخطورة |
|-------|-------------|---------------|
| تعليق التنقل بين الصفحات (Web) | 7 | 🔴 حرج |
| تعليق النظام اونلاين | 6 | 🔴 حرج |
| تعليق النظام اوفلاين | 5 | 🟡 متوسط-حرج |
| مشاكل عامة في البنية | 5 | 🟡 متوسط |

---

## 🔴 الفئة الأولى: تعليق التنقل بين الصفحات (Admin Web)

### المشكلة 1: عدم وجود Loading Fallback كافي للصفحات الكسولة (Lazy Loading)

**الملف:** `apps/admin-web/src/App.tsx`  
**المشكلة:** جميع الصفحات تُحمّل بشكل كسول (lazy) مع `Suspense` fallback بسيط، لكن لا يوجد:
- Timeout لتحميل الصفحة — إذا فشل التحميل (شبكة بطيئة)، الصفحة تبقى في حالة "جاري التحليل" إلى الأبد
- Error boundary مخصص لكل صفحة — خطأ في صفحة واحدة يُسقط كل التطبيق
- Preloading للصفحات الشائعة

**التأثير:** التنقل بين الصفحات قد يعلق إذا كان chunk التحميل كبير أو الشبكة بطيئة.

### المشكلة 2: Dashboard يُحمّل 9 استعلامات متوازية عند كل زيارة

**الملف:** `apps/admin-web/src/hooks/api/dashboard.ts` → `useDashboardStats()`  
**المشكلة:** الدالة `useDashboardStats` تُرسل 9 استعلامات Supabase متوازية عبر `Promise.allSettled`:
1. عدد المستخدمين الكلي
2. المستخدمين النشطين
3. عدد الإرساليات الكلي
4. إرساليات اليوم
5. إرساليات هذا الأسبوع
6. إرساليات الأسبوع الماضي
7. الإرساليات المقدمة
8. المسودات
9. النماذج

**التأثير:** كل مرة يزور المستخدم الـ Dashboard، تُرسل 9 طلبات HTTP. مع `refetchInterval: 120000` (دقيقتين)، هذا يعني 9 طلبات كل دقيقتين. في حالة الشبكة البطيئة، قد يستغرق كل طلب 5-10 ثوانٍ → يبدو النظام معلقاً.

### المشكلة 3: Realtime Channel قد يُسبب تجمد واجهة المستخدم

**الملف:** `apps/admin-web/src/hooks/api/dashboard.ts` → `useDashboardRealtime()`  
**المشكلة:** 
- القناة Realtime تستمع لتغييرات 3 جداول (`form_submissions`, `supply_shortages`, `profiles`)
- عند وصول 50+ حدث realtime متزامن (مثلاً: مزامنة 50 إرسالية)، كل حدث يُطلق `debouncedInvalidate`
-虽然 يوجد debounce بـ 2000ms، لكن `_dashChannel` و `_dashSubscribed` متغيرات عالمية (module-level) قد تبقى قديمة عند إعادة تحميل الصفحة

**التأثير:** في حالات الحمل العالي (مزامنة جماعية)، قد تتجمد الواجهة مؤقتاً.

### المشكلة 4: الصفحة الرئيسية تُحمّل بيانات ثقيلة غير مُحسّنة

**الملف:** `apps/admin-web/src/pages/DashboardPage.tsx`  
**المشكلة:** Dashboard يستخدم:
- `useDashboardStats` — 9 استعلامات
- `useSubmissionsChart` — جلب آخر 30 يوم (limit 5000)
- `useGovernorateStats` — جلب 20,000 إرسالية للعد في الذاكرة
- `useNotifications` — إشعارات
- `useSubmissions` — إرساليات حديثة
- `useForms` — نماذج
- `useUsers` — مستخدمين
- `useShortages` — نواقص
- `useSmartAlerts` — تنبيهات ذكية
- `useDashboardRealtime` — اتصال realtime

**التأثير:** الصفحة الرئيسية قد تُحمّل 50,000+ سجل عند أول زيارة → تعليق ملحوظ.

### المشكلة 5: `useGovernorateStats` يُحمّل 20,000 سجل للعد في الذاكرة

**الملف:** `apps/admin-web/src/hooks/api/dashboard.ts`  
**المشكلة:** 
```typescript
.limit(20000) // Reduced from 50000
```
يُجلب 20,000 إرسالية ثم يعدها في الذاكرة JavaScript. هذا غير فعال — يجب استخدام `GROUP BY` على السيرفر.

### المشكلة 6: `useRoleDistribution` يُحمّل 10,000 ملف شخصي عبر RPC

**الملف:** `apps/admin-web/src/hooks/api/dashboard.ts`  
**المشكلة:** يستدعي `fetch_all_profiles` بحد 10,000 ثم يعد في الذاكرة.

### المشكلة 7: Floating Chat Button يُحمّل رسائل الشات على كل صفحة

**الملف:** `apps/admin-web/src/components/layout/app-layout.tsx`  
**المشكلة:** `FloatingChatButton` يستخدم `useChatMessages('general')` — هذا يُحمّل رسائل الشات حتى على الصفحات التي لا تحتاجها.

---

## 🔴 الفئة الثانية: تعليق النظام اونلاين

### المشكلة 8: Supabase Client يستخدم fetch مع retry عالمي قد يُسبب تأخير

**الملف:** `apps/admin-web/src/lib/supabase.ts`  
**المشكلة:** `fetchWithRetry` يُعيد المحاولة 3 مرات مع exponential backoff (500ms → 1000ms → 2000ms → 3000ms). في حالة فشل الشبكة:
- المحاولة 1: فشل فوري
- انتظار 500ms
- المحاولة 2: فشل فوري  
- انتظار 1000ms
- المحاولة 3: فشل فوري
- انتظار 2000ms
- المحاولة 4: فشل نهائي

**التأثير:** كل طلب فاشل يستغرق ~3.5 ثوانٍ قبل أن يفشل. مع 9 استعلامات Dashboard = **31.5 ثانية** من الانتظار.

### المشكلة 9: ProtectedRoute يُعلق التطبيق عند فشل Auth

**الملف:** `apps/admin-web/src/components/layout/protected-route.tsx`  
**المشكلة:** 
- `useAuth()` مع `retry: 1, retryDelay: 2000` — إذا فشل الاتصال بـ Supabase، ينتظر 4 ثوانٍ (محاولة + إعادة)
- لا يوجد timeout مطلق — إذا بقي Supabase غير متاح، الشاشة تبقى في حالة loading إلى الأبد
- `isError` تعرض رسالة مع زر "إعادة المحاولة" لكن لا يوجد timeout لتجاوزها

### المشكلة 10: Sidebar يُحمّل Dashboard Stats على كل صفحة

**الملف:** `apps/admin-web/src/components/layout/sidebar.tsx`  
**المشكلة:** `Sidebar` يستخدم `useDashboardStats()` لعرض badge الأعداد. هذا يعني أن **كل صفحة** في التطبيق تُحمّل 9 استعلامات Dashboard حتى لو لم تكن الصفحة الرئيسية.

### المشكلة 11: Realtime subscriptions قد تتراكم

**الملف:** `apps/admin-web/src/hooks/api/dashboard.ts`  
**المشكلة:** `_dashChannel` و `_dashSubscribed` متغيرات عالمية. إذا فشل cleanup (عدم إلغاء الاشتراك)، قد تتراكم اتصالات Realtime.

### المشكلة 12: لا يوجد handling لحالة "Session Expired" أثناء الاستخدام

**المشكلة:** إذا انتهت صلاحية الجلسة أثناء الاستخدام، الطلبات تستمر في الفشل بصمت. لا يوجد آلية لتجديد التوكن تلقائياً أو إشعار المستخدم.

### المشكلة 13: `refetchOnWindowFocus: false` يُخفي البيانات المحدثة

**الملف:** `apps/admin-web/src/main.tsx`  
**المشكلة:** `refetchOnWindowFocus: false` يعني أن العودة من تبويب آخر لن تُحدّث البيانات. المستخدم قد يرى بيانات قديمة.

---

## 🟡 الفئة الثالثة: تعليق النظام اوفلاين (Mobile)

### المشكلة 14: Supabase.initialize قد يحظر التطبيق 10 ثوانٍ

**الملف:** `apps/mobile/lib/main.dart`  
**المشكلة:** رغم أن التهيئة تتم في الخلفية، إلا أن `_tryInitSupabase` قد تستغرق 10 ثوانٍ timeout. إذا كان المستخدم اوفلاين:
- المحاولة الأولى: 10 ثوانٍ
- عند عودة الإنترنت: محاولة أخرى 10 ثوانٍ

**التأثير:** قد يرى المستخدم شاشة تحميل طويلة.

### المشكلة 15: ConnectivityUtils تُجري HTTP probes كل 120 ثانية

**الملف:** `packages/core/lib/src/utils/connectivity_utils.dart`  
**المشكلة:** رغم أن الفترة زيدت إلى 120 ثانية، إلا أن:
- الـ probes تُجرى في الخلفية (غير مانعة)
- إذا كان المستخدم على بيانات متنقلة، هذا يستهلك bandwidth
- في حالة الشبكة البطيئة، الـ probe قد يستغرق 3-4 ثوانٍ

### المشكلة 16: FullSync قد يستغرق وقتاً طويلاً

**الملف:** `apps/mobile/lib/providers/full_sync_provider.dart`  
**المشكلة:** المزامنة الشاملة تُنفذ 7 خطوات متتالية:
1. Governorates
2. Districts
3. Forms
4. Submissions (pagination حتى 5000)
5. References
6. Health Facilities
7. Pending uploads

**التأثير:** في حالة الشبكة البطيئة، قد تستغرق المزامنة 30-60 ثانية.

### المشكلة 17: Hive corruption recovery قد يُفقد البيانات

**الملف:** `packages/core/lib/src/offline/offline_manager.dart`  
**المشكلة:** إذا فتح Hive Box فشل (تلف)، يتم حذف Box وإعادة إنشائه. هذا يُفقد جميع البيانات المحفوظة محلياً (مسودات، طابور مزامنة).

### المشكلة 18: EncryptionService.initialize قد تأخذ وقتاً طويلاً

**الملف:** `packages/core/lib/src/offline/offline_manager.dart`  
**المشكلة:** PBKDF2 بـ 600,000 iteration قد يستغرق 2-5 ثوانٍ على الأجهزة الضعيفة. رغم أنها تعمل في background isolate، إلا أن الانتظار قد يُسبب تأخراً في بدء التطبيق.

---

## 🟡 الفئة الرابعة: مشاكل عامة في البنية

### المشكلة 19: لا يوجد Offline Indicator في Admin Web

**المشكلة:** Admin Web لا يُظهر حالة الاتصال. المستخدم لا يعرف إذا كان النظام اوفلاين.

### المشكلة 20: Error Boundary يُسقط كل التطبيق

**الملف:** `apps/admin-web/src/components/ErrorBoundary.tsx`  
**المشكلة:** يوجد Error Boundary واحد على مستوى التطبيق بأكمله. خطأ في أي مكون يُسقط كل التطبيق بدلاً من الصفحة المتأثرة فقط.

### المشكلة 21: Bulk Fetch قد يستنزف الذاكرة

**الملف:** `apps/admin-web/src/lib/bulk-fetch.ts`  
**المشكلة:** `bulkFetch` يُحمّل حتى 50,000 سجل في الذاكرة. هذا قد يُسبب:
- استنزاف ذاكرة المتصفح
- تجمد واجهة المستخدم
- Chrome kill tab

### المشكلة 22: Campaign Context يُعيد render للـ Sidebar بالكامل

**المشكلة:** تغيير campaign يُعيد render لكل المكونات التي تستخدم `useCampaign()`، بما في ذلك `Sidebar`.

### المشكلة 23: لا يوجد مزامنة تلقائية في Admin Web

**المشكلة:** Admin Web يعتمد فقط على Realtime + polling. لا يوجد offline queue أو مزامنة تلقائية عند عودة الاتصال.

---

## 📋 خطة الإصلاحات

### المرحلة الأولى: إصلاحات فورية (أسبوع 1) — حل مشاكل التعليق

#### الإصلاح 1: إضافة Timeout و Error Boundary لكل صفحة

```typescript
// App.tsx — إضافة timeout لـ Suspense
function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <ErrorBoundary fallback={<PageError />}>
        {children}
      </ErrorBoundary>
    </Suspense>
  )
}
```

#### الإصلاح 2: تقليل عدد استعلامات Dashboard

**الحل:** استخدام RPC واحد بدل 9 استعلامات منفصلة.

```sql
-- إنشاء دالة RPC واحدة تُرجع كل الإحصائيات
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_campaign_type TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles WHERE deleted_at IS NULL),
    'active_users', (SELECT COUNT(*) FROM profiles WHERE deleted_at IS NULL AND is_active = true),
    'total_submissions', (SELECT COUNT(*) FROM form_submissions WHERE deleted_at IS NULL),
    'submissions_today', (SELECT COUNT(*) FROM form_submissions WHERE deleted_at IS NULL AND created_at >= CURRENT_DATE),
    'submissions_this_week', (SELECT COUNT(*) FROM form_submissions WHERE deleted_at IS NULL AND created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'submitted_count', (SELECT COUNT(*) FROM form_submissions WHERE deleted_at IS NULL AND status = 'submitted'),
    'draft_count', (SELECT COUNT(*) FROM form_submissions WHERE deleted_at IS NULL AND status = 'draft'),
    'total_forms', (SELECT COUNT(*) FROM forms WHERE deleted_at IS NULL),
    'active_forms', (SELECT COUNT(*) FROM forms WHERE deleted_at IS NULL AND is_active = true)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### الإصلاح 3: إزالة useDashboardStats من Sidebar

```typescript
// sidebar.tsx — إزالة useDashboardStats من Sidebar
// استبدالها بعداد بسيط يُجلب من context أو prop
export function Sidebar({ user, collapsed = false, onToggle }: SidebarProps) {
  // ❌ إزالة: const { data: stats } = useDashboardStats()
  // ✅ استبدال: استقبال الإحصائيات كـ prop من AppLayout
}
```

#### الإصلاح 4: تحسين ProtectedRoute مع Timeout

```typescript
// protected-route.tsx
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { data: authData, isLoading, isError, refetch } = useAuth()
  
  // ✅ إضافة timeout مطلق
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setTimedOut(true), 15000) // 15 ثانية
      return () => clearTimeout(timer)
    }
  }, [isLoading])
  
  if (timedOut) {
    return <TimeoutError onRetry={() => { setTimedOut(false); refetch() }} />
  }
  // ... باقي الكود
}
```

#### الإصلاح 5: تحسين fetchWithRetry مع Timeout مطلق

```typescript
// supabase.ts
const fetchWithRetry = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000) // 10 ثوانٍ max
  
  try {
    const response = await fetch(input, { ...init, signal: controller.signal })
    return response
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new TypeError('Request timed out')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
```

#### الإصلاح 6: إضافة Offline Indicator في Admin Web

```typescript
// components/layout/connectivity-banner.tsx
export function ConnectivityBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  if (isOnline) return null
  
  return (
    <div className="bg-amber-500 text-white text-center py-2 text-sm">
      ⚠️ أنت حالياً بدون اتصال بالإنترنت — بعض الميزات قد لا تعمل
    </div>
  )
}
```

---

### المرحلة الثانية: تحسينات الأداء (أسبوع 2-3)

#### الإصلاح 7: تحسين useGovernorateStats باستخدام GROUP BY

```typescript
// بدلاً من جلب 20,000 سجل وعدّها في الذاكرة
export function useGovernorateStats() {
  return useQuery({
    queryKey: ['governorate-stats'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_governorate_stats')
      return data
    },
  })
}
```

```sql
-- دالة RPC للإحصائيات حسب المحافظة
CREATE OR REPLACE FUNCTION get_governorate_stats()
RETURNS TABLE(name_ar TEXT, submission_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT g.name_ar, COUNT(fs.id) as submission_count
  FROM governorates g
  LEFT JOIN form_submissions fs ON fs.governorate_id = g.id 
    AND fs.deleted_at IS NULL 
    AND fs.created_at >= NOW() - INTERVAL '30 days'
  WHERE g.deleted_at IS NULL AND g.is_active = true
  GROUP BY g.id, g.name_ar
  ORDER BY submission_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### الإصلاح 8: تحسين Realtime مع Debounce أفضل

```typescript
// dashboard.ts — تحسين debounce
let _invalidateTimer: ReturnType<typeof setTimeout> | null = null
const _pendingKeys = new Set<string>()

function debouncedInvalidate(queryClient: QueryClient, keys: string[]) {
  for (const k of keys) _pendingKeys.add(k)
  if (_invalidateTimer) clearTimeout(_invalidateTimer)
  _invalidateTimer = setTimeout(() => {
    // ✅ تجميع invalidations في عملية واحدة
    queryClient.invalidateQueries({
      predicate: (query) => {
        return Array.from(_pendingKeys).some(key => 
          query.queryKey[0] === key
        )
      }
    })
    _pendingKeys.clear()
    _invalidateTimer = null
  }, 3000) // ✅ زيادة إلى 3 ثوانٍ
}
```

#### الإصلاح 9: إضافة Preloading للصفحات الشائعة

```typescript
// App.tsx — preload الصفحات الشائعة بعد تحميل Dashboard
useEffect(() => {
  // بعد تحميل الصفحة الرئيسية، نحمّل الصفحات الأكثر استخداماً
  const preloadTimer = setTimeout(() => {
    import('@/pages/SubmissionsPage')
    import('@/pages/FormsPage')
    import('@/pages/MapPage')
  }, 3000) // بعد 3 ثوانٍ من تحميل الصفحة
  
  return () => clearTimeout(preloadTimer)
}, [])
```

#### الإصلاح 10: تحسين bulkFetch مع Streaming

```typescript
// bulk-fetch.ts — إضافة streaming بدل تحميل الكل في الذاكرة
export async function* bulkFetchStream<T>(options: BulkFetchOptions): AsyncGenerator<T[]> {
  // ... نفس الكود لكن يُعيد دفعات بدل تجميعها
  while (true) {
    const { data } = await query.range(offset, offset + pageSize - 1)
    if (!data || data.length === 0) break
    yield data as T[] // ✅ يُعيد الدفعة فوراً بدلاً من تجميعها
    offset += pageSize
  }
}
```

---

### المرحلة الثالثة: تحسينات البناء (أسبوع 3-4)

#### الإصلاح 11: فصل Error Boundaries لكل قسم

```typescript
// App.tsx
<Route element={<ProtectedRoute />}>
  <Route element={<AppLayout />}>
    <Route path="dashboard" element={
      <SectionErrorBoundary name="لوحة التحكم">
        <DashboardPage />
      </SectionErrorBoundary>
    } />
    <Route path="submissions" element={
      <SectionErrorBoundary name="الإرساليات">
        <SubmissionsPage />
      </SectionErrorBoundary>
    } />
    // ... باقي الصفحات
  </Route>
</Route>
```

#### الإصلاح 12: إضافة Service Worker للـ Admin Web (PWA)

```typescript
// public/sw.js — cache الملفات الثابتة
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network-first للـ API
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
  } else {
    // Cache-first للملفات الثابتة
    event.respondWith(
      caches.match(event.request).then(response => 
        response || fetch(event.request)
      )
    )
  }
})
```

#### الإصلاح 13: تحسين chunk splitting

```typescript
// vite.config.ts — تحسين manualChunks
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'ui-vendor': [/* ... */],
  'chart-vendor': ['recharts'],
  'data-vendor': ['@supabase/supabase-js', '@tanstack/react-query'],
  // ✅ فصل heavy pages
  'dashboard-page': ['./src/pages/DashboardPage.tsx'],
  'map-page': ['./src/pages/MapPage.tsx'],
  'reports-page': ['./src/pages/ReportsPage.tsx'],
}
```

---

### المرحلة الرابعة: تحسينات Mobile (أسبوع 4-5)

#### الإصلاح 14: تحسين FullSync مع Parallel Fetching

```dart
// full_sync_provider.dart — جلب البيانات بالتوازي
Future<FullSyncResult> syncAll() async {
  // ✅ جلب governorates + districts + forms بالتوازي
  final results = await Future.wait([
    db.getGovernorates(),
    db.getDistricts(),
    db.getForms(campaignType: campaign.value),
  ], eagerError: false);
  
  // معالجة النتائج...
}
```

#### الإصلاح 15: تحسين ConnectivityUtils مع Caching

```dart
// connectivity_utils.dart — تخزين نتيجة الـ probe
static DateTime? _lastSuccessfulProbe;
static const _probeCacheDuration = Duration(seconds: 60);

static Future<bool> _probeInternet() async {
  // ✅ إذا نجح probe قبل 60 ثانية، نعتبر أننا اونلاين
  if (_lastSuccessfulProbe != null && 
      DateTime.now().difference(_lastSuccessfulProbe!) < _probeCacheDuration) {
    return true;
  }
  // ... باقي الكود
}
```

#### الإصلاح 16: تحسين Hive Corruption Recovery

```dart
// offline_manager.dart — نسخ احتياطي قبل الحذف
Future<void> _recoverFromCorruption() async {
  try {
    // ✅ محاولة نسخ احتياطي للبيانات التالفة
    final corruptedData = _box?.toMap();
    if (corruptedData != null) {
      // حفظ في ملف مؤقت للمراجعة
      final tempFile = File('${_box!.path}.corrupted');
      await tempFile.writeAsString(jsonEncode(corruptedData));
    }
  } catch (_) {}
  
  // حذف وإعادة إنشاء
  await Hive.deleteBoxFromDisk(_boxName);
  _box = await Hive.openBox<String>(_boxName);
}
```

---

## 📊 ملخص الإصلاحات

| المرحلة | الإصلاحات | التأثير المتوقع |
|---------|-----------|-----------------|
| الأسبوع 1 | #1-6 | حل 80% من مشاكل التعليق |
| الأسبوع 2-3 | #7-10 | تحسين الأداء 50-70% |
| الأسبوع 3-4 | #11-13 | استقرار النظام |
| الأسبوع 4-5 | #14-16 | تحسين تجربة الموبايل |

---

## 🎯 أولويات التنفيذ

### 🔴 فوري (اليوم):
1. **إصلاح #5:** تحسين `fetchWithRetry` مع timeout مطلق
2. **إصلاح #4:** إضافة timeout لـ ProtectedRoute
3. **إصلاح #3:** إزالة `useDashboardStats` من Sidebar

### 🟡 هذا الأسبوع:
4. **إصلاح #2:** تقليل استعلامات Dashboard (RPC واحد)
5. **إصلاح #1:** إضافة Error Boundaries per page
6. **ȹصلاح #6:** إضافة Offline Indicator

### 🟢 الأسبوع القادم:
7. **إصلاح #7-10:** تحسينات الأداء
8. **إصلاح #11-13:** تحسينات البناء

---

## ⚠️ ملاحظات مهمة

1. **لا تُغيّر بنية Supabase الحالية** — التغييرات يجب أن تكون متوافقة مع البيانات الموجودة
2. **اختبر على الاستيج أولاً** — استخدم `https://gbgwokizfrjxdfgpdhsr.supabase.co` للاختبار
3. **راقب الأداء** — استخدم Chrome DevTools Performance tab لقياس التحسينات
4. **نسخ احتياطي** — قبل أي تغيير في قاعدة البيانات، خذ نسخة احتياطية

---

*تم إعداد هذا التقرير بواسطة تحليل شامل للكود المصدري للمشروع.*
