# DukanOS — Backend API Reference

**Stack:** Laravel 13 · PostgreSQL · Laravel Sanctum
**Base URL:** `/api/v1`
**Auth:** `Authorization: Bearer <token>`

Every response uses a consistent envelope:

```json
{ "success": true, "message": "…", "data": { } }
```

Errors return `success: false` with `message` (and `errors` for validation).

---

## Roles & Permissions

| Role | Slug | Scope |
| --- | --- | --- |
| Super Admin | `super_admin` | Platform owner (tenants, specifications, global audit) |
| Owner | `owner` | Full store control |
| Manager | `manager` | Operational management |
| Cashier | `cashier` | Sales focused |
| Accountant | `accountant` | Financial |

Authorization is enforced via two middleware aliases:

- `role:owner,manager` — require one of the given roles
- `permission:products.create` — require a granular permission (super admin bypasses)

---

## Modules & Endpoints

### Authentication
See `docs/AUTHENTICATION_API.md` for full detail.

```
POST   /auth/login
POST   /auth/logout            (auth)
POST   /auth/logout-all        (auth)
GET    /auth/me                (auth)
PUT    /auth/profile           (auth)
PUT    /auth/password          (auth)
GET    /auth/tokens            (auth)
DELETE /auth/tokens/{id}       (auth)
```

### Catalog

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/categories` | products.view |
| POST | `/categories` | products.create |
| GET/PUT/DELETE | `/categories/{id}` | view/update/delete |
| GET | `/brands` | products.view |
| POST | `/brands` | products.create |
| GET/PUT/DELETE | `/brands/{id}` | view/update/delete |
| GET | `/products?search=&category_id=&brand_id=&status=` | products.view |
| POST | `/products` | products.create |
| GET/PUT/DELETE | `/products/{id}` | view/update/delete |
| GET | `/products/barcode?barcode=` | products.view |
| GET | `/inventory?search=&low_stock=` | products.view |
| GET | `/inventory/{productId}/transactions` | products.view |
| POST | `/inventory/{productId}/adjust` | products.update |

**Product payload** includes dynamic `specifications[]` (`specification_id`,
`value` or `specification_value_id`), plus `opening_quantity` /
`min_quantity_threshold` for initial stock.

### Specifications (Super Admin only)

```
GET/POST /specifications
GET/PUT/DELETE /specifications/{id}
```

Specifications are global (platform-level) and support `data_type`
(text/select/number/boolean) with predefined `values[]` for select types.

### Customers

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/customers?search=` | customers.view |
| POST | `/customers` | customers.manage |
| GET/PUT/DELETE | `/customers/{id}` | view/manage |
| GET | `/customers/{id}/ledger` | customers.view |
| GET | `/customers/{id}/invoices` | customers.view |

### Invoices

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/invoices?customer_id=&payment_status=&from=&to=` | invoices.view |
| POST | `/invoices` | invoices.create |
| GET | `/invoices/{id}` | invoices.view |
| POST | `/invoices/{id}/void` | invoices.create |

Creating an invoice deducts stock, records the initial payment (if any),
and posts customer-ledger entries. `items[]` accept optional `unit_price`,
`discount_type` (fixed/percentage) and `discount_value` overrides.

### Quotations

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/quotations?status=` | quotations.manage |
| POST | `/quotations` | quotations.manage |
| GET | `/quotations/{id}` | quotations.manage |
| PATCH | `/quotations/{id}/status` | quotations.manage |
| POST | `/quotations/{id}/convert` | quotations.manage |

### Payments

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/payments?customer_id=&invoice_id=` | payments.manage |
| POST | `/payments` | payments.manage |
| GET | `/payments/{id}` | payments.manage |

### Returns

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/returns?invoice_id=` | returns.manage |
| POST | `/returns` | returns.manage |
| GET | `/returns/{id}` | returns.manage |

### Daily Ledger

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/ledger-categories?type=` | ledger.view |
| POST/PUT/DELETE | `/ledger-categories` | expenses.manage |
| GET | `/daily-transactions?type=&from=&to=` | ledger.view |
| POST | `/daily-transactions` | expenses.manage |

### Payroll

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET/POST | `/employees` | payroll.manage |
| GET/PUT/DELETE | `/employees/{id}` | payroll.manage |
| GET | `/salary-records?employee_id=&status=` | payroll.manage |
| POST | `/salary-records` | payroll.manage (generate) |
| PATCH | `/salary-records/{id}/mark-paid` | payroll.manage |

### Reports

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/reports/dashboard` | reports.financial |
| GET | `/reports/sales?from=&to=&group_by=` | reports.view |
| GET | `/reports/financial?from=&to=` | reports.financial |
| GET | `/reports/inventory` | reports.view |
| GET | `/reports/customer-balances` | reports.financial |

### Admin (Super Admin)

```
GET/POST /tenants
GET/PUT/DELETE /tenants/{id}
GET/POST /specifications        (also listed above)
GET/POST /users                 (store users — owner level)
GET/PUT/DELETE /users/{id}
GET /audit-logs?module=&action=&tenant_id=   (tenant-scoped for store users)
```

---

## Architecture

```
Controllers (thin)  →  Services (business logic)  →  Repositories (data access)
        ↓                       ↓
Form Requests (validation)   Enums (status/type codes)
        ↓
Resources (API serialization)
```

- **Services** own all business logic and financial side-effects (stock
  deduction, ledger posting, payment application, return restocking).
- **Repositories** encapsulate tenant-scoped queries and composite lookups.
- **Enums** (`App\Enums`) define status/type codes used by validation.
- **Audit logging** (`AuditService`) records every mutating action.
- **Multi-tenancy** is enforced via `tenant_id` in every repository query.

## Testing

```sh
php artisan test   # 52 tests, 383 assertions
```

Coverage includes the critical workflows (invoice creation, payment recording,
return processing, ledger adjustments), authorization per role, and tenant
isolation.
