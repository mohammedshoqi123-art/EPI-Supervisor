# EPI Supervisor — API Documentation

## Edge Functions

جميع Edge Functions تتطلب JWT token في header:
```
Authorization: Bearer <supabase-jwt-token>
```

### POST /submit-form
إرسال نموذج ميداني

**الصلاحيات:** جميع الأدوار المصادقة
**ال멱ية:** `verify_jwt = true`

```json
{
  "form_id": "uuid",
  "answers": { "field1": "value1", "field2": "value2" },
  "gps_lat": 15.3694,
  "gps_lng": 44.191,
  "photos": ["base64..."]
}
```

**الاستجابة:**
```json
{
  "success": true,
  "submission_id": "uuid",
  "status": "pending"
}
```

---

### POST /sync-offline
مزامنة البيانات المحفوظة محلياً

**الصلاحيات:** جميع الأدوار المصادقة

```json
{
  "items": [
    {
      "id": "local-uuid",
      "type": "submission",
      "data": { ... },
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /ai-chat-v3
المساعد الذكي — محادثة مع AI

**الصلاحيات:** جميع الأدوار المصادقة
**الحد:** 25 طلب/دقيقة

```json
{
  "message": "ما نسبة التغطية في تعز؟",
  "conversation_id": "uuid-optional"
}
```

**الاستجابة:**
```json
{
  "reply": "نسبة التغطية في تعز...",
  "intent": "coverage_query",
  "tools_used": ["query_database"],
  "conversation_id": "uuid"
}
```

---

### POST /create-admin
إنشاء مستخدم جديد

**الصلاحيات:** admin فقط
**ال멱ية:** `verify_jwt = true`

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "اسم المستخدم",
  "role": "governorate",
  "governorate_id": "uuid"
}
```

**التحقق:**
- كلمة المرور: 8 أحرف على الأقل + حرف كبير + حرف صغير + رقم
- الدور: يجب أن يكون أقل من دور المُنشئ

---

### POST /admin-actions
عمليات الإدارة العامة

**الصلاحيات:** admin, central

---

### POST /get-admin-dashboard
بيانات لوحة المعلومات

**الصلاحيات:** admin, central, governorate, district

---

### POST /get-analytics
تحليلات متقدمة

**الصلاحيات:** admin, central, governorate

---

### POST /export-data
تصدير البيانات (PDF/Excel)

**الصلاحيات:** admin, central, governorate, district

---

### POST /get-governorate-report
تقرير محافظة محددة

**الصلاحيات:** admin, central, governorate

---

### POST /get-advanced-reports
تقارير متقدمة

**الصلاحيات:** admin, central

---

### POST /manage-notifications
إدارة الإشعارات

**الصلاحيات:** admin, central

---

### POST /system-monitor
مراقبة النظام

**الصلاحيات:** admin فقط

---

## Rate Limiting

| Endpoint | الحد | النافذة |
|----------|------|---------|
| ai-chat-v3 | 25 | دقيقة |
| create-admin | 10 | 5 دقائق |
| submit-form | 100 | دقيقة |
| default | 60 | دقيقة |

## Error Codes

| الكود | المعنى |
|-------|--------|
| 400 | طلب غير صالح |
| 401 | غير مصادق |
| 403 | غير مصرح |
| 404 | غير موجود |
| 429 | تجاوز الحد المسموح |
| 500 | خطأ داخلي |

## CORS

الدوال تسمح فقط بال origins المُعرّفة في `ALLOWED_ORIGINS` secret.
بدون origin header (mobile apps): مسموح دائماً.
