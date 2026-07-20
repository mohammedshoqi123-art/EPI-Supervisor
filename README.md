<div align="center">

<img src="assets/logo-epi-256.png" alt="EPI Supervisor Logo" width="120">

# 🏥 منصة مشرف EPI

### نظام إشراف ميداني متكامل لحملات التطعيم
*Field Supervision System for Immunization Campaigns*

![Flutter](https://img.shields.io/badge/Flutter-3.27-02569B?style=for-the-badge&logo=flutter&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Version](https://img.shields.io/badge/Version-3.14.0-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)

[📖 دليل المطور](DEVELOPER_GUIDE.md) · [📱 تحميل APK](https://github.com/mohammedshoqi123-art/EPI-Supervisor/releases) · [🐛 الإبلاغ عن مشكلة](https://github.com/mohammedshoqi123-art/EPI-Supervisor/issues)

</div>

---

## 📋 نظرة عامة

**منصة مشرف EPI** هو نظام إشراف ميداني متكامل لحملات التطعيم في اليمن. يُستخدم من قبل مشرفي المديريات والمحافظات والمستوى المركزي لمتابعة حملات التطعيم.

### المميزات الرئيسية:
- ✅ **نماذج إلكترونية ذكية** — تعبئة سريعة مع تحقق تلقائي
- ✅ **عمل بدون إنترنت** — مزامنة تلقائية عند عودة الاتصال
- ✅ **لوحات تحليلات فورية** — إحصائيات وخرائط تفاعلية
- ✅ **GPS + صور** — توثيق ميداني دقيق
- ✅ **RBAC** — أدوار وصلاحيات (admin/central/governorate/district)
- ✅ **AI Chat** — محادثة ذكية للاستشارات
- ✅ **Realtime Sync** — تحديث فوري عبر WebSocket

---

## 🏗️ التقنيات

| التقنية | الاستخدام |
|---------|----------|
| **Flutter 3.27+** | تطبيق الموبايل (Android/iOS) |
| **Supabase** | Backend (Auth, DB, Storage, Edge Functions, Realtime) |
| **Hive** | التخزين المحلي (اوفلاين) |
| **Riverpod** | إدارة الحالة |
| **GoRouter** | التنقل |
| **AES-256-GCM** | تشفير البيانات المحلية |

---

## 📁 بنية المشروع

```
EPI-Supervisor/
├── apps/mobile/           ← تطبيق الموبايل
├── packages/core/         ← المنطق الأساسي (API, Auth, Cache, Sync)
├── packages/shared/       ← مشترك (Models, Theme, Widgets)
├── docs/                  ← التوثيق
│   ├── DEVELOPER_GUIDE.md ← 📖 دليل المطور الشامل
│   ├── fixes-2026-07/     ← تقرير الإصلاحات الأخير
│   ├── user-guide/        ← دليل المستخدم
│   └── archive/           ← تقارير مراجعة قديمة
├── supabase/              ← Edge Functions + Migrations
└── scripts/               ← أدوات مساعدة
```

---

## 🚀 البدء السريع

### المتطلبات:
- Flutter SDK >= 3.27.0
- Dart SDK >= 3.6.0
- Supabase project

### التثبيت:
```bash
# 1. استنساخ
git clone https://github.com/mohammedshoqi123-art/EPI-Supervisor.git
cd EPI-Supervisor

# 2. Dependencies
cd apps/mobile && flutter pub get

# 3. إعداد .env
cp .env.example .env
# عدّل SUPABASE_URL و SUPABASE_ANON_KEY

# 4. تشغيل
flutter run
```

### البناء:
```bash
# Debug
flutter build apk --debug

# Release (مع Encryption Key)
flutter build apk --release \
  --dart-define=ENCRYPTION_KEY=your-secret-key-min-32-chars-long
```

---

## 📊 الأدوار (RBAC)

| الدور | الصلاحيات |
|-------|----------|
| **admin** | كل شيء — إدارة المستخدمين + النماذج + الإرساليات |
| **central** | عرض جميع المحافظات + التقارير |
| **governorate** | عرض محافظته فقط + تقارير المحافظة |
| **district** | عرض مديريته فقط + إدخال البيانات |
| **data_entry** | إدخال البيانات فقط |

---

## 🔄 آلية الاونلاين/الاوفلاين

```
الطلب → الكاش أولاً → إذا حديث: أرجع فوراً
                      → إذا قديم: أرجع + حدّث في الخلفية
                      → إذا offline: أرجع أي بيانات مخزنة

الإرسال → addToSyncQueue (O(1)) → إذا online: sync فوراً
                                 → إذا offline: يبقى في الطابور
                                 → عند عودة الإنترنت: sync تلقائي
```

---

## 📚 التوثيق

| الملف | المحتوى |
|-------|---------|
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | 📖 دليل المطور الشامل |
| [CHANGELOG.md](CHANGELOG.md) | سجل التغييرات |
| [CONTRIBUTING.md](CONTRIBUTING.md) | إرشادات المساهمة |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | دليل التثبيت التفصيلي |
| [docs/user-guide/](docs/user-guide/) | دليل المستخدم |
| [docs/fixes-2026-07/](docs/fixes-2026-07/) | تقرير الإصلاحات الأخير |

---

## 🛠️ الأوامر المفيدة

```bash
flutter analyze          # تحليل الكود
flutter test             # اختبارات
flutter build apk        # بناء APK
flutter build ios        # بناء iOS
melos bootstrap          # تثبيت dependencies (monorepo)
```

---

## 📝 سجل التغييرات

### v3.14.0 (2026-07-21)
- ✅ 27 إصلاح (P0 حرجة + P1 متوسطة + P2 أمان + P3 تحسينات)
- ✅ Encryption migration — لا مزيد من فقدان البيانات
- ✅ _withRetry — كل استعلام شبكة يُحاولة 3 مرات
- ✅ Offline-first محسّن — sync queue O(1) + auto-save Isolate
- ✅ RealtimeSync محسّن — لا reconnect offline + listener leak مُصلح
- ✅ أمان محسّن — flutter_secure_storage + drafts encryption

### v3.13.2
- إصدار مستقر مع offline-first architecture

---

## 📄 الرخصة

MIT License — انظر [LICENSE](LICENSE)

---

<div align="center">

**صُنع بـ ❤️ لصحة اليمن**

</div>
