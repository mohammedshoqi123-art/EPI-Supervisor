# المساهمة في منصة مشرف EPI

## البيئة المطلوبة

- Flutter 3.27+
- Dart 3.6+
- Node.js 22+ (لـ admin-web)
- Supabase CLI

## التشغيل المحلي

```bash
# Mobile
cd apps/mobile
flutter pub get
flutter run

# Admin Web
cd apps/admin-web
npm install
npm run dev

# Edge Functions
cd supabase
supabase start
supabase functions serve
```

## معايير الكود

- **Dart:** اتبع `dart format` + `flutter analyze`
- **TypeScript:** اتبع ESLint rules
- **اختبارات:** كل ميزة جديدة تحتاج اختبار واحد على الأقل
- **التوثيق:** كل دالة عامة تحتاج doc comment

## Pull Request Template

```markdown
## الوصف
[وصف مختصر للتغيير]

## نوع التغيير
- [ ] Bug fix
- [ ] Feature
- [ ] Refactor
- [ ] Tests
- [ ] Documentation

## الاختبارات
- [ ] تم إضافة اختبارات جديدة
- [ ] الاختبارات الحالية تمر

## المراجعة
- [ ] تم مراجعة الكود ذاتياً
- [ ] لا يوجد secrets مكشوفة
```

## فروع العمل

- `main` — الإنتاج المستقر
- `develop` — التطوير
- `feature/*` — ميزات جديدة
- `fix/*` — إصلاحات
