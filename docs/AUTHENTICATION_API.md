# DukanOS — Authentication API

**Module:** Multi-role Authentication
**Stack:** Laravel 13 + Laravel Sanctum (token-based)
**Base URL:** `/api/v1`

The authentication API issues bearer tokens via Laravel Sanctum and enforces
role-based and permission-based authorization across the platform roles:

| Role | Slug | Scope |
| --- | --- | --- |
| Super Admin | `super_admin` | Platform owner, no tenant, all permissions |
| Owner | `owner` | Full store control |
| Manager | `manager` | Operational management |
| Cashier | `cashier` | Sales focused |
| Accountant | `accountant` | Financial |

All authenticated requests send the token as:

```
Authorization: Bearer <token>
```

---

## Response Envelope

Every endpoint returns a consistent envelope.

**Success**

```json
{
  "success": true,
  "message": "Human readable message.",
  "data": { }
}
```

**Error (validation)**

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "field": ["The field is required."]
  }
}
```

**Error (authentication / authorization)**

```json
{ "success": false, "message": "Unauthenticated." }
```

---

## Endpoints

### 1. Login

```
POST /api/v1/auth/login
```

Rate limited to 6 attempts/minute.

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | required, valid email |
| `password` | string | required |
| `device_name` | string | optional (token label) |

**Response (200)**

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": 2,
      "name": "Muhammad Akram Ch.",
      "email": "owner@punjabelectric.pk",
      "phone": "+92 300 4125678",
      "status": "active",
      "last_login_at": "2026-09-01T09:15:03+00:00",
      "role": { "id": 2, "name": "Owner", "slug": "owner" },
      "tenant": { "id": 1, "name": "Punjab Electric Store", "slug": "punjab-electric-store" },
      "permissions": ["products.view", "products.create"],
      "created_at": "2026-09-01T09:01:38+00:00"
    },
    "token": "1|abc...",
    "token_type": "Bearer"
  }
}
```

**Errors:** `422` invalid credentials · `422` inactive account.

---

### 2. Current User

```
GET /api/v1/auth/me   (auth:sanctum)
```

Returns the authenticated user with `role`, `tenant` and the effective
`permissions` list (super admin receives every permission).

---

### 3. Logout

```
POST /api/v1/auth/logout   (auth:sanctum)
```

Revokes the current token and writes an audit log (`action=logout`).

---

### 4. Logout from all devices

```
POST /api/v1/auth/logout-all   (auth:sanctum)
```

Revokes every token for the user.

---

### 5. Update profile

```
PUT /api/v1/auth/profile   (auth:sanctum)
```

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | required, max 255 |
| `email` | string | required, unique (ignoring current user) |
| `phone` | string | optional, max 30 |

Returns the updated `UserResource`.

---

### 6. Change password

```
PUT /api/v1/auth/password   (auth:sanctum)
```

| Field | Type | Rules |
| --- | --- | --- |
| `current_password` | string | required |
| `password` | string | required, min 8, confirmed |
| `password_confirmation` | string | required |

Verifies the current password, sets the new one, and revokes all other
sessions while keeping the current one active. Writes an audit log.

---

### 7. List active tokens

```
GET /api/v1/auth/tokens   (auth:sanctum)
```

Lists the user's access tokens (id, name, last_used_at, created_at,
`is_current`).

---

### 8. Revoke a specific token

```
DELETE /api/v1/auth/tokens/{tokenId}   (auth:sanctum)
```

Revokes a single token by id.

---

## Authorization Middleware

Two middleware aliases are registered for resource protection:

```php
// Role-based
Route::middleware('role:owner,manager')->group(...);

// Permission-based
Route::middleware('permission:products.create')->group(...);
```

| Middleware | Usage | Behavior |
| --- | --- | --- |
| `role:slug1,slug2` | Require at least one of the given roles | `403` on mismatch |
| `permission:slug` | Require the given permission (super admin bypasses) | `403` on mismatch |

---

## Audit Logging

The following auth events are written to the immutable `audit_logs` table
(module `auth`/`profile`): `login`, `logout`, `logout` (all-scope), `updated`
(profile), `password_changed`. Each entry captures the user, IP address, user
agent and inferred device class (Desktop/Mobile/Tablet).

---

## Seeded Accounts

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@dukanos.com` | `password` |
| Owner | `owner@punjabelectric.pk` | `password` |
| Manager | `manager@punjabelectric.pk` | `password` |
| Cashier | `cashier@punjabelectric.pk` | `password` |
| Accountant | `accountant@punjabelectric.pk` | `password` |
