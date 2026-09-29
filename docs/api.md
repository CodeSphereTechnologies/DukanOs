# DukanOS API Documentation

Complete REST API reference for the DukanOS backend.

- **Base URL:** `/api/v1`
- **Stack:** Laravel 13 · PostgreSQL · Laravel Sanctum (bearer tokens)
- **Auth header:** `Authorization: Bearer <token>`
- **Content-Type:** `application/json`

---

## Table of Contents

1. [Response Format](#1-response-format)
2. [Authentication](#2-authentication)
3. [Roles & Permissions](#3-roles--permissions)
4. [Enums Reference](#4-enums-reference)
5. [Pagination](#5-pagination)
6. [Super Admin — Tenants](#6-super-admin--tenants)
7. [Super Admin — Specifications](#7-super-admin--specifications)
8. [Catalog — Categories](#8-catalog--categories)
9. [Catalog — Brands](#9-catalog--brands)
10. [Catalog — Products](#10-catalog--products)
11. [Inventory](#11-inventory)
12. [Customers](#12-customers)
13. [Invoices](#13-invoices)
14. [Quotations](#14-quotations)
15. [Payments](#15-payments)
16. [Returns](#16-returns)
17. [Daily Ledger](#17-daily-ledger)
18. [Payroll](#18-payroll)
19. [Reports](#19-reports)
20. [Users (store users)](#20-users-store-users)
21. [Audit Logs](#21-audit-logs)
22. [Seeded Accounts](#22-seeded-accounts)

---

## 1. Response Format

Every endpoint returns a consistent JSON envelope.

**Success**

```json
{
  "success": true,
  "message": "Human readable message.",
  "data": { }
}
```

**Validation error (422)**

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "field": ["The field is required."]
  }
}
```

**Authentication / authorization errors**

```json
{ "success": false, "message": "Unauthenticated." }      // 401
{ "success": false, "message": "You do not have the required permission to perform this action." } // 403
```

**HTTP status codes used**

| Code | Meaning |
| --- | --- |
| 200 | Success (read/update/delete) |
| 201 | Resource created |
| 401 | Unauthenticated (missing/invalid token) |
| 403 | Forbidden (insufficient role/permission, or missing tenant context) |
| 404 | Resource not found |
| 422 | Validation failed / business-rule violation |
| 429 | Too many requests (login rate limit: 6/min) |

---

## 2. Authentication

| Method | Endpoint | Auth |
| --- | --- | --- |
| POST | `/auth/login` | public (throttled 6/min) |
| POST | `/auth/logout` | bearer |
| POST | `/auth/logout-all` | bearer |
| GET | `/auth/me` | bearer |
| PUT | `/auth/profile` | bearer |
| PUT | `/auth/password` | bearer |
| GET | `/auth/tokens` | bearer |
| DELETE | `/auth/tokens/{tokenId}` | bearer |

### POST `/auth/login`

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | required, valid email |
| `password` | string | required |
| `device_name` | string | optional, token label |

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
      "role": { "id": 2, "name": "Owner", "slug": "owner" },
      "tenant": { "id": 1, "name": "Punjab Electric Store", "slug": "punjab-electric-store" },
      "permissions": ["products.view", "products.create"]
    },
    "token": "1|abc...",
    "token_type": "Bearer"
  }
}
```

**Errors:** `422` wrong credentials / inactive account.

### GET `/auth/me`

Returns the authenticated user (same `user` shape as login).

### PUT `/auth/profile`

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | required |
| `email` | string | required, unique (ignoring self) |
| `phone` | string | optional |

### PUT `/auth/password`

| Field | Type | Rules |
| --- | --- | --- |
| `current_password` | string | required |
| `password` | string | required, min 8 |
| `password_confirmation` | string | required, must match |

### GET `/auth/tokens`

Lists the user's access tokens (`id`, `name`, `last_used_at`, `created_at`, `is_current`).

### DELETE `/auth/tokens/{tokenId}`

Revokes a single token. `422` if not found.

---

## 3. Roles & Permissions

| Role | Slug | Description |
| --- | --- | --- |
| Super Admin | `super_admin` | Platform owner (no tenant) |
| Owner | `owner` | Full store control |
| Manager | `manager` | Operational management |
| Cashier | `cashier` | Sales focused |
| Accountant | `accountant` | Financial |

**Permission slugs** (used by the `permission:` middleware):

| Module | Permissions |
| --- | --- |
| products | `products.view`, `products.create`, `products.update`, `products.delete` |
| customers | `customers.view`, `customers.manage` |
| invoices | `invoices.view`, `invoices.create` |
| quotations | `quotations.manage` |
| payments | `payments.manage` |
| returns | `returns.manage` |
| ledger | `ledger.view` |
| expenses | `expenses.manage` |
| payroll | `payroll.manage` |
| reports | `reports.view`, `reports.financial` |
| users | `users.manage` |
| settings | `settings.manage` |
| tenants | `tenants.manage` (super admin only) |
| specifications | `specifications.manage` (super admin only) |
| audit | `audit.view` |

Two middleware aliases guard routes:

- `role:owner,manager` — require one of the given roles
- `permission:products.create` — require a specific permission (super admin bypasses all)

---

## 4. Enums Reference

| Enum | Values |
| --- | --- |
| `ActiveStatus` | `active`, `inactive` |
| `ProductStatus` | `active`, `paused`, `deleted` |
| `TenantStatus` | `active`, `suspended` |
| `PaymentMethod` | `cash`, `bank_transfer`, `card`, `online`, `other` |
| `PaymentStatus` | `paid`, `partial`, `ledger` |
| `DiscountType` | `fixed`, `percentage` |
| `InvoiceStatus` | `issued`, `voided` |
| `QuotationStatus` | `draft`, `sent`, `accepted`, `rejected`, `converted`, `expired` |
| `RefundType` | `cash`, `credit`, `ledger` |
| `LedgerType` | `income`, `expense` |
| `InventoryTransactionType` | `in`, `out`, `adjustment` |
| `SalaryStatus` | `pending`, `paid` |
| `SpecificationDataType` | `text`, `select`, `number`, `boolean` |
| `ReturnStatus` | `completed`, `voided` |

---

## 5. Pagination

List endpoints accept `per_page` (default 25) and return Laravel's paginator:

```json
{
  "success": true,
  "message": "…",
  "data": {
    "data": [ /* items */ ],
    "links": { "first": "…", "last": "…", "prev": null, "next": "…" },
    "meta": { "current_page": 1, "last_page": 2, "per_page": 25, "total": 40 }
  }
}
```

---

## 6. Super Admin — Tenants

All routes require `role:super_admin`.

| Method | Endpoint |
| --- | --- |
| GET | `/tenants?search=&status=&per_page=` |
| POST | `/tenants` |
| GET | `/tenants/{tenant}` |
| PUT | `/tenants/{tenant}` |
| DELETE | `/tenants/{tenant}` |

**Tenant body** (`POST`/`PUT`)

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | required |
| `slug` | string | required, `alpha_dash`, unique |
| `email` | string | optional |
| `phone` | string | optional |
| `address` | string | optional |
| `city` / `state` | string | optional |
| `postal_code` | string | optional |
| `currency` | string | optional, 3 chars (default `PKR`) |
| `timezone` | string | optional (default `Asia/Karachi`) |
| `status` | `active`/`suspended` | required |
| `settings` | array | optional |

---

## 7. Super Admin — Specifications

Global (platform-level) product specifications. All routes require `role:super_admin`.

| Method | Endpoint |
| --- | --- |
| GET | `/specifications` |
| POST | `/specifications` |
| GET | `/specifications/{specification}` |
| PUT | `/specifications/{specification}` |
| DELETE | `/specifications/{specification}` |

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | required |
| `slug` | string | required, `alpha_dash`, unique |
| `data_type` | `text`/`select`/`number`/`boolean` | required |
| `unit` | string | optional (e.g. `W`, `V`) |
| `is_required` | boolean | optional |
| `is_filterable` | boolean | optional |
| `sort_order` | integer | optional |
| `status` | `active`/`inactive` | required |
| `values` | array of strings | optional (predefined choices for `select`) |

---

## 8. Catalog — Categories

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/categories` | `products.view` |
| POST | `/categories` | `products.create` |
| GET | `/categories/{category}` | `products.view` |
| PUT | `/categories/{category}` | `products.update` |
| DELETE | `/categories/{category}` | `products.delete` |

**Body** (`POST`/`PUT`)

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | required |
| `slug` | string | required, `alpha_dash`, unique per tenant |
| `description` | string | optional |
| `parent_id` | integer | optional (must be a category in the same tenant) |
| `sort_order` | integer | optional |
| `status` | `active`/`inactive` | required |

---

## 9. Catalog — Brands

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/brands` | `products.view` |
| POST | `/brands` | `products.create` |
| GET | `/brands/{brand}` | `products.view` |
| PUT | `/brands/{brand}` | `products.update` |
| DELETE | `/brands/{brand}` | `products.delete` |

**Body** (`POST`/`PUT`)

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | required |
| `slug` | string | required, `alpha_dash`, unique per tenant |
| `description` | string | optional |
| `status` | `active`/`inactive` | required |

---

## 10. Catalog — Products

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/products?search=&category_id=&brand_id=&status=&per_page=` | `products.view` |
| GET | `/products/barcode?barcode=` | `products.view` |
| POST | `/products` | `products.create` |
| GET | `/products/{product}` | `products.view` |
| PUT | `/products/{product}` | `products.update` |
| DELETE | `/products/{product}` | `products.delete` |

**Product body** (`POST`/`PUT`)

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | required |
| `sku` | string | required, unique per tenant |
| `barcode` | string | optional, unique per tenant |
| `category_id` | integer | optional (same tenant) |
| `brand_id` | integer | optional (same tenant) |
| `model_number` | string | optional |
| `description` | string | optional |
| `unit` | string | optional (default `pc`) |
| `purchase_cost` | number | optional, ≥ 0 |
| `selling_price` | number | required, ≥ 0 |
| `min_selling_price` | number | optional, ≥ 0 |
| `status` | `active`/`paused`/`deleted` | required |
| `opening_quantity` | number | optional (initial stock, POST only) |
| `min_quantity_threshold` | number | optional |
| `specifications` | array | optional |

**`specifications[]` item**

| Field | Type |
| --- | --- |
| `specification_id` | integer (required) |
| `value` | string (free text) |
| `specification_value_id` | integer (predefined choice, for select-type specs) |

**Barcode lookup response** — `data` is the product object or `null` if not found (still `200`).

---

## 11. Inventory

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/inventory?search=&low_stock=&per_page=` | `products.view` |
| GET | `/inventory/{product}/transactions` | `products.view` |
| POST | `/inventory/{product}/adjust` | `products.update` |

**Adjust body**

| Field | Type | Rules |
| --- | --- | --- |
| `delta` | number | required, non-zero (positive = stock in, negative = stock out) |
| `note` | string | optional |

---

## 12. Customers

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/customers?search=&per_page=` | `customers.view` |
| POST | `/customers` | `customers.manage` |
| GET | `/customers/{customer}` | `customers.view` |
| PUT | `/customers/{customer}` | `customers.manage` |
| DELETE | `/customers/{customer}` | `customers.manage` |
| GET | `/customers/{customer}/ledger` | `customers.view` |
| GET | `/customers/{customer}/invoices` | `customers.view` |

**Customer body** (`POST`/`PUT`)

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | required |
| `phone` | string | optional |
| `email` | string | optional |
| `address` | string | optional |
| `notes` | string | optional |
| `opening_balance` | number | optional, ≥ 0 (`POST` only — sets the customer's first ledger entry) |
| `current_balance` | number | optional, ≥ 0 (`PUT` only — the outstanding balance to leave the ledger at; recorded as a correcting entry) |
| `status` | `active`/`inactive` | required |

The outstanding balance is always derived from the customer's ledger
(`SUM(debit) - SUM(credit)`) and returned as `balance` on every customer
response, including `POST` and `PUT`. `opening_balance` records the figure the
account started with and is never rewritten by later edits.

**Customer ledger** returns paginated ledger entries (`debit`, `credit`, `balance`) plus a `balance` summary field.

---

## 13. Invoices

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/invoices?search=&customer_id=&payment_status=&from=&to=&per_page=` | `invoices.view` |
| POST | `/invoices` | `invoices.create` |
| GET | `/invoices/{invoice}` | `invoices.view` |
| POST | `/invoices/{invoice}/void` | `invoices.create` |

**Invoice body** (`POST`)

| Field | Type | Rules |
| --- | --- | --- |
| `customer_id` | integer | optional (same tenant) |
| `invoice_date` | date | optional |
| `due_date` | date | optional |
| `notes` | string | optional |
| `discount_type` | `fixed`/`percentage` | optional |
| `discount_value` | number | optional, ≥ 0 |
| `amount_paid` | number | optional, ≥ 0 (amount paid now) |
| `payment_method` | enum | optional (required if `amount_paid > 0`) |
| `payment_reference` | string | optional |
| `items` | array | required, min 1 |

**`items[]` item**

| Field | Type | Rules |
| --- | --- | --- |
| `product_id` | integer | required |
| `quantity` | number | required, > 0 |
| `unit_price` | number | optional (overrides default price) |
| `discount_type` | `fixed`/`percentage` | optional |
| `discount_value` | number | optional, ≥ 0 |

Creating an invoice: deducts stock, records the initial payment (if any),
and posts customer-ledger entries. `payment_status` is derived
(`paid` / `partial` / `ledger`).

---

## 14. Quotations

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/quotations?search=&status=&per_page=` | `quotations.manage` |
| POST | `/quotations` | `quotations.manage` |
| GET | `/quotations/{quotation}` | `quotations.manage` |
| PATCH | `/quotations/{quotation}/status` | `quotations.manage` |
| POST | `/quotations/{quotation}/convert` | `quotations.manage` |

**Quotation body** (`POST`) — same as invoice, plus:

| Field | Type | Rules |
| --- | --- | --- |
| `quotation_date` | date | optional |
| `valid_until` | date | optional |
| `status` | enum | optional (default `draft`) |

**Status update** (`PATCH /status`): `{ "status": "accepted" }`

**Convert** (`POST /convert`): optional `{ "amount_paid", "payment_method", "payment_reference" }` — creates an invoice from the quotation (no stock was deducted at quotation time).

---

## 15. Payments

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/payments?customer_id=&invoice_id=&per_page=` | `payments.manage` |
| POST | `/payments` | `payments.manage` |
| GET | `/payments/{payment}` | `payments.manage` |

**Payment body** (`POST`)

| Field | Type | Rules |
| --- | --- | --- |
| `invoice_id` | integer | optional (omit for on-account payment) |
| `customer_id` | integer | optional |
| `amount` | number | required, > 0 (cannot exceed invoice balance) |
| `method` | enum | required |
| `payment_date` | date | optional |
| `reference` | string | optional |
| `notes` | string | optional |

---

## 16. Returns

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/returns?invoice_id=&per_page=` | `returns.manage` |
| POST | `/returns` | `returns.manage` |
| GET | `/returns/{return}` | `returns.manage` |

**Return body** (`POST`)

| Field | Type | Rules |
| --- | --- | --- |
| `invoice_id` | integer | required |
| `return_date` | date | optional |
| `reason` | string | optional |
| `refund_type` | `cash`/`credit`/`ledger` | required |
| `notes` | string | optional |
| `items` | array | required, min 1 |

**`items[]` item**

| Field | Type | Rules |
| --- | --- | --- |
| `invoice_item_id` | integer | required (must belong to the invoice) |
| `quantity` | number | required, > 0 (cannot exceed remaining quantity) |
| `reason` | string | optional |

Returns restore stock and update the customer's ledger balance.

---

## 17. Daily Ledger

### Ledger Categories

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/ledger-categories?type=` | `ledger.view` |
| POST | `/ledger-categories` | `expenses.manage` |
| PUT | `/ledger-categories/{category}` | `expenses.manage` |
| DELETE | `/ledger-categories/{category}` | `expenses.manage` |

**Body** — `type` (`income`/`expense`), `name`, `description`, `status`.

### Daily Transactions

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/daily-transactions?type=&category_id=&from=&to=&per_page=` | `ledger.view` |
| POST | `/daily-transactions` | `expenses.manage` |

**Body** (`POST`)

| Field | Type | Rules |
| --- | --- | --- |
| `category_id` | integer | optional |
| `type` | `income`/`expense` | required if `category_id` absent |
| `amount` | number | required, > 0 |
| `transaction_date` | date | optional |
| `description` | string | optional |

---

## 18. Payroll

### Employees

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/employees?search=&per_page=` | `payroll.manage` |
| POST | `/employees` | `payroll.manage` |
| GET | `/employees/{employee}` | `payroll.manage` |
| PUT | `/employees/{employee}` | `payroll.manage` |
| DELETE | `/employees/{employee}` | `payroll.manage` |

**Employee body** — `name`, `phone`, `email`, `designation`, `salary`, `joining_date`, `address`, `status`, `user_id`.

### Salary Records

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/salary-records?employee_id=&status=&per_page=` | `payroll.manage` |
| POST | `/salary-records` | `payroll.manage` (generate) |
| PATCH | `/salary-records/{salary}/mark-paid` | `payroll.manage` |

**Generate body** — `employee_id`, `period` (`YYYY-MM`), `bonus`, `deductions`, `notes`.

**Mark paid body** — `payment_method`, `paid_at` (optional). Marks the record paid and posts a "Salaries" expense.

---

## 19. Reports

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/reports/dashboard` | `reports.financial` |
| GET | `/reports/sales?from=&to=&group_by=` | `reports.view` |
| GET | `/reports/financial?from=&to=` | `reports.financial` |
| GET | `/reports/inventory` | `reports.view` |
| GET | `/reports/customer-balances` | `reports.financial` |

- `group_by` is `daily` (default) or `monthly`.
- Dashboard returns `total_sales`, `total_invoices`, `outstanding`, `today_sales`, `today_invoices`, `total_customers`, `total_products`, `low_stock_count`, `month_income`, `month_expense`.
- Financial returns `income`, `expense`, `net`, `payments`, `outstanding`.
- Inventory returns `total_products`, `total_stock_units`, `low_stock_count`, `low_stock[]`.

---

## 20. Users (store users)

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/users?search=&per_page=` | `users.manage` |
| POST | `/users` | `users.manage` |
| GET | `/users/{user}` | `users.manage` |
| PUT | `/users/{user}` | `users.manage` |
| DELETE | `/users/{user}` | `users.manage` |

**Create body**

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | required |
| `email` | string | required, unique |
| `password` | string | required, min 8 |
| `phone` | string | optional |
| `role` | `owner`/`manager`/`cashier`/`accountant` | required |
| `status` | `active`/`inactive` | required |

**Update body** — same, but `password` optional (only set when provided) and `role` optional.

---

## 21. Audit Logs

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/audit-logs?module=&action=&tenant_id=&per_page=` | `audit.view` |

Store users see only their own tenant's logs; super admin sees all (optionally
filtered by `tenant_id`). Each entry contains `action`, `module`, `entity_type`,
`entity_id`, `old_values`, `new_values`, `ip_address`, `device`, `user`,
`created_at`.

---

## 22. Seeded Accounts

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@dukanos.com` | `password` |
| Owner | `owner@punjabelectric.pk` | `password` |
| Manager | `manager@punjabelectric.pk` | `password` |
| Cashier | `cashier@punjabelectric.pk` | `password` |
| Accountant | `accountant@punjabelectric.pk` | `password` |
