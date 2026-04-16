# EPI Supervisor — Edge Functions API Reference

## Overview

All Edge Functions are deployed to Supabase and require authentication via JWT Bearer token.

**Base URL:** `https://<project-ref>.functions.supabase.co`

**Authentication:** All requests must include:
```
Authorization: Bearer <jwt-token>
apikey: <anon-key>
```

**CORS:** Browser requests must come from allowed origins (configured in `ALLOWED_ORIGINS` secret).

---

## Common Responses

| Status | Meaning |
|--------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `413` | Payload Too Large |
| `429` | Rate Limited (with `Retry-After` header) |
| `500` | Internal Server Error |

---

## Functions

### `submit-form`

Submit a field form (offline or online).

**Endpoint:** `POST /submit-form`

**Rate Limit:** 10 requests/minute per user

**Request Body:**
```json
{
  "form_id": "uuid",                    // Required: Form definition ID
  "data": { "field1": "value1" },       // Required: Form data (JSONB)
  "status": "submitted",                // Optional: draft|submitted (default: submitted)
  "governorate_id": "uuid",             // Optional: Auto-filled from profile if omitted
  "district_id": "uuid",                // Optional: Auto-filled from profile if omitted
  "gps_lat": 15.3694,                   // Optional: Latitude (-90 to 90)
  "gps_lng": 44.191,                    // Optional: Longitude (-180 to 180)
  "gps_accuracy": 10.5,                 // Optional: GPS accuracy in meters
  "photos": ["url1", "url2"],           // Optional: Photo URLs (max per form schema)
  "notes": "Field notes",               // Optional: Additional notes
  "offline_id": "device-uuid-001",      // Optional: Client-generated ID for dedup
  "device_id": "android-abc123",        // Optional: Device identifier
  "app_version": "1.0.0",               // Optional: App version
  "is_offline": false                    // Optional: Was this created offline?
}
```

**Response (201):**
```json
{
  "success": true,
  "submission_id": "uuid",
  "status": "submitted",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Response (200 - Duplicate):**
```json
{
  "success": true,
  "message": "Duplicate submission detected",
  "duplicate": true
}
```

**Permission Rules:**
- `admin` / `central`: Can submit for any governorate/district
- `governorate`: Can submit only for own governorate
- `district`: Can submit only for own district
- `data_entry`: Can submit only for own assigned area

---

### `sync-offline`

Batch-sync offline data (form submissions + shortage reports).

**Endpoint:** `POST /sync-offline`

**Request Body:**
```json
{
  "submissions": [
    {
      "offline_id": "device-uuid-001",
      "form_id": "uuid",
      "data": { "field1": "value1" },
      "governorate_id": "uuid",
      "district_id": "uuid",
      "gps_lat": 15.3694,
      "gps_lng": 44.191,
      "photos": ["url1"],
      "notes": "Synced from offline",
      "device_id": "android-abc123",
      "created_at": "2024-01-15T08:00:00Z"
    }
  ],
  "shortages": [
    {
      "item_name": "Vaccine syringes",
      "item_category": "supplies",
      "quantity_needed": 500,
      "quantity_available": 50,
      "severity": "high",
      "governorate_id": "uuid",
      "district_id": "uuid",
      "notes": "Critical shortage in district X"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "synced_submissions": 5,
  "synced_shortages": 2,
  "duplicates": 1,
  "errors": []
}
```

---

### `ai-chat`

AI-powered chat assistant (MiMo/Gemini).

**Endpoint:** `POST /ai-chat`

**Request Body:**
```json
{
  "message": "ما هي نسب التطعيم في محافظة صنعاء؟",
  "conversation_history": [
    {"role": "user", "content": "previous message"},
    {"role": "assistant", "content": "previous response"}
  ],
  "context_type": "analytics"
}
```

**Response (200):**
```json
{
  "success": true,
  "response": "AI-generated response text",
  "model": "gemini-pro",
  "usage": { "prompt_tokens": 150, "completion_tokens": 200 }
}
```

---

### `get-analytics`

Fetch analytics data with optional filtering.

**Endpoint:** `POST /get-analytics`

**Request Body:**
```json
{
  "governorate_id": "uuid",     // Optional: Filter by governorate
  "district_id": "uuid",        // Optional: Filter by district
  "form_id": "uuid",            // Optional: Filter by form
  "date_from": "2024-01-01",    // Optional: Start date
  "date_to": "2024-01-31",      // Optional: End date
  "group_by": "governorate"     // Optional: governorate|district|form|day
}
```

**Response (200):**
```json
{
  "success": true,
  "summary": {
    "total_submissions": 1250,
    "approved": 1100,
    "rejected": 50,
    "pending": 100
  },
  "breakdown": [
    {
      "group": "صنعاء",
      "submissions": 350,
      "approval_rate": 0.92
    }
  ]
}
```

**Permission Rules:**
- `admin` / `central`: See all data
- `governorate`: See own governorate data only
- `district`: See own district data only
- `data_entry`: See own submissions only

---

### `get-dashboard-stats`

Fetch dashboard summary statistics.

**Endpoint:** `POST /get-dashboard-stats`

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "total_users": 45,
    "total_submissions": 1250,
    "total_governorates": 19,
    "total_districts": 333,
    "recent_submissions": 28,
    "pending_review": 15,
    "active_shortages": 8
  }
}
```

---

### `admin-actions`

Admin user management operations.

**Endpoint:** `POST /admin-actions`

**Request Body:**
```json
{
  "action": "create_user",    // create_user|update_user|delete_user|list_users|reset_password
  "email": "user@example.com",
  "full_name": "User Name",
  "role": "data_entry",
  "governorate_id": "uuid",
  "district_id": "uuid",
  "user_id": "uuid"           // For update/delete/reset operations
}
```

**Permission:** `admin` and `central` roles only.

---

### `create-admin`

Create the initial admin user (bootstrap function).

**Endpoint:** `POST /create-admin`

**Request Body:**
```json
{
  "email": "admin@epi.local",
  "password": "secure-password-min-8-chars",
  "full_name": "System Admin",
  "secret": "your-CREATE_ADMIN_SECRET"
}
```

---

### `manage-notifications`

Manage user notifications.

**Endpoint:** `POST /manage-notifications`

**Request Body:**
```json
{
  "action": "mark_read",        // mark_read|mark_all_read|delete|get_unread
  "notification_id": "uuid",    // For mark_read/delete
  "limit": 50                   // For get_unread
}
```

---

### `get-governorate-report`

Generate governorate-level reports.

**Endpoint:** `POST /get-governorate-report`

**Request Body:**
```json
{
  "governorate_id": "uuid",     // Optional: specific governorate (admin/central only)
  "date_from": "2024-01-01",
  "date_to": "2024-01-31"
}
```

---

### `system-monitor`

System health and metrics (admin only).

**Endpoint:** `POST /system-monitor`

**Response (200):**
```json
{
  "success": true,
  "metrics": {
    "active_users_24h": 32,
    "submissions_today": 156,
    "avg_response_time_ms": 45,
    "error_rate_24h": 0.02,
    "queue_depth": 5
  }
}
```

---

## Error Response Format

All errors follow this format:
```json
{
  "error": "Human-readable error message"
}
```

For rate limiting (429), the response includes:
```json
{
  "error": "Rate limit exceeded. Max 10 submissions per minute."
}
```
With header: `Retry-After: 60`

---

## Notes

- All timestamps are ISO 8601 in UTC
- UUIDs are v4 format
- All database operations respect Row Level Security (RLS)
- Edge Functions use JWT validation — no unsigned tokens are accepted
- Rate limiting is enforced at the database level (fail-closed)
