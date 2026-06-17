# ADR-003: Encryption Strategy

## Status: Accepted

## Context
البيانات المحلية على أجهزة المشرفين قد تحتوي بيانات حساسة:
- نماذج التطعيم
- بيانات الأطفال
- صور ميدانية

## Decision
تشفير AES-256-GCM مع PBKDF2:
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2-HMAC-SHA256
- **Iterations**: 600,000 (OWASP recommendation)
- **Salt**: 16 bytes random per encryption
- **IV**: 12 bytes random per encryption
- **Format**: [salt(16)][iv(12)][ciphertext+tag]

### Key Management:
- Key من `ENCRYPTION_KEY` environment variable
- Minimum 32 characters
- Fail-fast if not set (no default)
- Key cache per session (PBKDF2 is expensive)

## Consequences
- ✅ Military-grade encryption
- ✅ Authenticated encryption (tamper detection)
- ✅ Unique salt/IV per encryption
- ✅ No key reuse
- ⚠️ PBKDF2 600k iterations = ~200ms per key derivation
- ⚠️ Key must be securely managed

## References
- `packages/core/lib/src/security/encryption_service.dart`
- OWASP Password Storage Cheat Sheet
