# ADR-001: Offline-First Architecture

## Status: Accepted

## Context
اليمن يعاني من انقطاع متكرر في الإنترنت. نظام التحصين يحتاج عمل مستمر حتى بدون اتصال.

## Decision
تبني بنية Offline-First:
- Hive للتخزين المحلي مع AES-256-GCM تشفير
- Sync Queue مع أولويات (Critical → High → Normal → Low)
- Exponential Backoff (10s → 30s → 90s → 5min → 15min)
- Dead-letter queue للعناصر الفاشلة بعد 5 محاولات
- Conflict Resolution بـ 4 استراتيجيات

## Consequences
- ✅ التطبيق يعمل بدون إنترنت
- ✅ البيانات لا تُفقد أبداً
- ✅ المزامنة تلقائية عند عودة الاتصال
- ⚠️ تعقيد أكبر في منطق المزامنة
- ⚠️ צורך في إدارة التعارضات

## References
- `packages/core/lib/src/sync/sync_service.dart`
- `packages/core/lib/src/security/encryption_service.dart`
