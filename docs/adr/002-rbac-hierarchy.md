# ADR-002: RBAC Hierarchical Permission System

## Status: Accepted

## Context
نظام التحصين يحتاج صلاحيات هيرarchية:
- مدير النظام يرى كل شيء
- المركزي يرى كل المحافظات
- المحافظة يرى محافظته فقط
- المديرية ترى مديريتها فقط
- إدخال البيانات يرى مديريته فقط

## Decision
نظام RBAC بـ 5 مستويات:
1. admin (5) — وصول كامل
2. central (4) — رؤية كل البيانات
3. governorate (3) — نطاق محافظة
4. district (2) — نطاق مديرية
5. data_entry (1) — نطاق مديرية محدود

### Enforcement Points:
- **Database**: RLS policies على كل جدول
- **Edge Functions**: role hierarchy check
- **Frontend**: ProtectedRoute component
- **Mobile**: role-based UI rendering

## Consequences
- ✅ أمان متعدد الطبقات
- ✅ لا يمكن تجاوز الصلاحيات
- ✅ واضح وسهل الفهم
- ⚠️ تعقيد أكبر في RLS policies
- ⚠️ performance impact على queries

## References
- `supabase/migrations/023_permission_overhaul.sql`
- `apps/admin-web/src/components/layout/protected-route.tsx`
- `supabase/functions/_shared/auth.ts`
