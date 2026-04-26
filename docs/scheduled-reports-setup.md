# 📧 إعداد التقارير المجدولة + البريد الإلكتروني

## المشاكل اللي كانت موجودة

| # | المشكلة | الحالة |
|---|---------|--------|
| 1 | Edge Function `generate-scheduled-report` غير موجودة | ✅ أُنشئت |
| 2 | لا يوجد scheduler يشغّل التقارير تلقائياً | ✅ أُضيف pg_cron |
| 3 | لا يوجد خدمة إيميل | ✅ أُضيف Resend |

---

## 1️⃣ تفعيل pg_cron في Supabase

1. ادخل **Supabase Dashboard** → **Database** → **Extensions**
2. ابحث عن `pg_cron` → **Enable**
3. ابحث عن `pg_net` → **Enable**

### إعداد Supabase Vault (لـ pg_cron)

pg_cron يحتاج credentials مخزنة في Vault. في **Supabase SQL Editor**:

```sql
-- أضف الـ secrets في Vault
INSERT INTO vault.decrypted_secrets (name, secret)
VALUES ('supabase_url', 'https://xxxxx.supabase.co')
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

INSERT INTO vault.decrypted_secrets (name, secret)
VALUES ('service_role_key', 'eyJxxxxx')
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;
```

### إعداد Supabase Secrets (لـ Edge Function)

في **Supabase Dashboard** → **Edge Functions** → **Secrets**:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

---

## 2️⃣ إعداد Resend (لإرسال الإيميلات)

### أ. إنشاء حساب Resend

1. ادخل [resend.com](https://resend.com) → أنشئ حساب مجاني
2. مجاني حتى **3,000 إيميل/شهر** — يكفي للاستخدام

### ب. الحصول على API Key

1. في Resend Dashboard → **API Keys** → **Create API Key**
2. انسخ المفتاح (يبدأ بـ `re_`)

### ج. إضافة المفتاح في Supabase

في **Supabase Dashboard** → **Edge Functions** → **Secrets** → **New Secret**:

| الاسم | القيمة |
|-------|--------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxx` |
| `REPORT_FROM_EMAIL` | `reports@your-domain.com` |

### د. توثيق Domain (اختياري — للإنتاج)

بدون توثيق domain، تقدر ترسل بس لعنوانك (الإيميل اللي سجلت به في Resend).

لإرسال لأي عنوان:
1. في Resend → **Domains** → **Add Domain**
2. أضف DNS records المطلوبة (MX + TXT + CNAME)
3. بعد التحقق، تقدر ترسل لأي عنوان

---

## 3️⃣ نشر Edge Function

```bash
cd EPI-Supervisor

# نشر Edge Function الجديدة
supabase functions deploy generate-scheduled-report

# تطبيق migration pg_cron
supabase db push
```

---

## 4️⃣ إعداد Storage Bucket

أنشئ bucket اسمه `reports` في Supabase Storage:

1. **Supabase Dashboard** → **Storage** → **New Bucket**
2. الاسم: `reports`
3. Public: ✅ (أو خلها private واستخدم signed URLs)

---

## 5️⃣ الاختبار

### اختبار Edge Function مباشرة:

```bash
curl -X POST 'https://xxxxx.supabase.co/functions/v1/generate-scheduled-report' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "run_id": "test-run-id",
    "scheduled_report_id": "test-report-id"
  }'
```

### اختبار من لوحة الويب:

1. ادخل **التقارير المجدولة** → أنشئ تقرير جديد
2. اختر **طريقة التوصيل**: بريد إلكتروني
3. أضف عنوان إيميلك
4. اضغط **تشغيل الآن**

---

## 🔧 استكشاف الأخطاء

| الخطأ | السبب | الحل |
|-------|-------|------|
| `RESEND_API_KEY not configured` | المفتاح غير مُعرّف | أضفه في Supabase Secrets |
| `No email addresses configured` | لم تُدخل عنوان إيميل | عدّل التقرير وأضف emails |
| `Resend 403` | Domain غير موثّق | أرسل لنفس إيميل حساب Resend |
| `reports bucket not found` | الـ bucket غير موجود | أنشئه في Storage |
| `pg_cron not working` | الامتداد غير مُفعّل | فعّله في Database Extensions |

---

## 📝 ملاحظات

- **pg_cron** يרוץ كل دقيقة → يفحص `next_run_at <= now()`
- **الحد الأقصى**: 10 تقارير لكل cycle (كل دقيقة)
- **السجلات**: تُحذف تلقائياً بعد 90 يوم
- **التقارير**: تُحفظ في Storage + تُرسل بالبريد (إذا مُفعّل)
