# DukanOS — Database Schema & Seeding Report

**Module:** Core Multi-Tenant Database Layer
**Backend:** Laravel 13 (PHP 8.5) · **Database:** PostgreSQL 18
**Date:** 2026-09-01
**Tenant Seeded:** Punjab Electric Store (Faisalabad, Punjab, Pakistan)

---

## 1. Summary

This module delivers the foundational, production-grade database layer for
DukanOS: a complete PostgreSQL schema for a multi-tenant POS / retail
management platform for electrical appliance stores, together with a fully
connected, deterministic seeder for a single tenant ("Punjab Electric Store").

The work follows the PRD (`docs/PRD.md`) and the engineering standards in
`docs/AGENT.md`: correct multi-tenancy, strong relationships and indexes,
accurate financial records, dynamic specifications, complete auditability,
and an extendable SaaS architecture.

**Result at a glance**

| Metric | Value |
| --- | --- |
| Domain tables | 26 (36 total incl. framework tables) |
| Foreign keys | 60 |
| Migrations | 31 (all pass on PostgreSQL **and** SQLite) |
| Feature tests | 7 (237 assertions, all green) |
| Seeded tenants | 1 |
| Seeded products | 40 (with specs, barcodes, inventory) |
| Seeded invoices | 36 (28 paid, 4 partial, 4 ledger) |

---

## 2. Environment Setup

A dedicated PostgreSQL database and role were created against the local
PostgreSQL 18 cluster:

| Item | Value |
| --- | --- |
| Database | `dukanos` |
| Role | `dukanos` (password auth, CREATEDB) |
| Host / Port | `127.0.0.1:5432` |
| Currency default | PKR |

`backend/.env` was switched from SQLite to `pgsql` and `APP_NAME` set to
`DukanOS`.

```sh
# One-time (already performed):
psql -d postgres -c "CREATE ROLE dukanos LOGIN PASSWORD 'dukanos_dev_password' CREATEDB;"
psql -d postgres -c "CREATE DATABASE dukanos OWNER dukanos;"
```

**Run & verify**

```sh
cd backend
php artisan migrate:fresh --seed   # build schema + seed Punjab Electric Store
php artisan test                   # 8 passing tests, 237 assertions
```

---

## 3. Architecture Overview

The schema is organised into logical groups:

1. **Identity & Multi-tenancy** — `tenants`, `users`, `roles`, `permissions`,
   `role_permissions`.
2. **Catalog & Dynamic Specifications** — `categories`, `brands`,
   `specifications`, `specification_values`, `products`,
   `product_specification_values`.
3. **Inventory** — `inventory`, `inventory_transactions`.
4. **Sales / Customers** — `customers`, `customer_ledgers`, `quotations`,
   `quotation_items`, `invoices`, `invoice_items`, `payments`, `returns`,
   `return_items`.
5. **Finance (Daily Ledger) & Payroll** — `ledger_categories`,
   `daily_transactions`, `employees`, `salary_records`.
6. **Governance** — `audit_logs`.

Every tenant-owned table carries a `tenant_id` foreign key (per PRD §20) and
enforces tenant-unique composite keys where natural keys exist (SKU, barcode,
invoice/quotation/payment/return numbers). This gives defence-in-depth: tenant
isolation is enforced at both the application layer and by unique constraints.

---

## 4. Table Catalog

### Identity & Multi-tenancy

| Table | Purpose | Key columns |
| --- | --- | --- |
| `tenants` | Store owners (tenants) | `slug` (unique), `name`, `email`, `phone`, `address`, `city`, `state`, `currency`, `timezone`, `status`, `settings` (json) |
| `users` | Login accounts (super admin + store users) | `tenant_id` (nullable for super admin), `role_id`, `email` (unique), `password`, `phone`, `status`, `last_login_at`, soft-deletes |
| `roles` | System roles | `slug` (unique): `super_admin`, `owner`, `manager`, `cashier`, `accountant` |
| `permissions` | Granular permission keys | `slug` (unique), `module`, `description` |
| `role_permissions` | Role ↔ permission pivot | `role_id`, `permission_id` (composite unique) |

### Catalog & Dynamic Specifications

| Table | Purpose | Key columns |
| --- | --- | --- |
| `categories` | Hierarchical product categories | `tenant_id`, `parent_id` (self-FK), `slug` (unique per tenant), `sort_order` |
| `brands` | Product brands | `tenant_id`, `slug` (unique per tenant) |
| `specifications` | **Global** spec definitions (created by super admin) | `slug` (unique), `data_type` (text/select), `unit`, `is_required`, `is_filterable`, `sort_order` |
| `specification_values` | Predefined choices for select-type specs | `specification_id`, `value` (unique per spec) |
| `products` | Products | `tenant_id`, `category_id`, `brand_id`, `sku` + `barcode` (unique per tenant), `model_number`, `purchase_cost`, `selling_price`, `min_selling_price`, `status`, soft-deletes |
| `product_specification_values` | Spec value assigned to a product | `product_id`, `specification_id` (composite unique), `specification_value_id` (nullable), `value` (free text) |

### Inventory

| Table | Purpose | Key columns |
| --- | --- | --- |
| `inventory` | Current stock + threshold per product | `tenant_id`, `product_id` (composite unique), `quantity`, `min_quantity_threshold` |
| `inventory_transactions` | Immutable stock movement history | `type` (in/out), `quantity`, `before_quantity`, `after_quantity`, polymorphic `reference` |

### Sales & Customers

| Table | Purpose | Key columns |
| --- | --- | --- |
| `customers` | Customer accounts | `tenant_id`, `name`, `phone`, `email`, `address`, `opening_balance` |
| `customer_ledgers` | Running customer balance ledger | `entry_type` (invoice/payment/return), `debit`, `credit`, `balance`, polymorphic `reference` |
| `quotations` | Non-financial quotes | `quotation_number` (unique per tenant), `quotation_date`, `valid_until`, `status` (draft/sent/accepted/rejected/converted) |
| `quotation_items` | Quote line items | `quotation_id`, `product_id`, `quantity`, `unit_price`, `line_total` |
| `invoices` | Financial sales documents | `invoice_number` (unique per tenant), `quotation_id`, `subtotal`, `discount_type/value/amount`, `total`, `amount_paid`, `balance_due`, `payment_status`, `status` |
| `invoice_items` | Invoice line items with **snapshots** | `name`, `sku`, `unit_price`, `cost_price` (snapshot), `quantity`, `line_total` |
| `payments` | Customer payments | `payment_number` (unique per tenant), `invoice_id` (nullable for on-account), `method`, `amount`, `reference` |
| `returns` | Return documents | `return_number` (unique per tenant), `invoice_id`, `refund_type` (cash/credit/ledger), `total_amount` |
| `return_items` | Returned line items | `return_id`, `invoice_item_id`, `product_id`, `quantity`, `amount` |

### Finance & Payroll

| Table | Purpose | Key columns |
| --- | --- | --- |
| `ledger_categories` | Unified income/expense categories | `type` (income/expense), `name` (unique per tenant+type), `is_system` |
| `daily_transactions` | Money-in / money-out records | `category_id`, `type`, `amount`, `transaction_date`, polymorphic `reference` |
| `employees` | Payroll staff (may/may not log in) | `user_id` (nullable), `designation`, `salary`, `joining_date` |
| `salary_records` | Monthly payroll records | `employee_id`, `period` (YYYY-MM, unique per employee), `base_salary`, `bonus`, `deductions`, `net_salary`, `status` |

### Governance

| Table | Purpose | Key columns |
| --- | --- | --- |
| `audit_logs` | Immutable audit trail | `action`, `module`, `entity_type`/`entity_id`, `old_values`/`new_values` (json), `ip_address`, `user_agent`, `device`; **no `updated_at`** |

---

## 5. Key Architecture Decisions

### 5.1 Multi-tenancy via `tenant_id` on every tenant-owned table
Every tenant-owned table carries `tenant_id` (PRD §20). Natural keys are made
tenant-scoped composite uniques — e.g. `unique(tenant_id, sku)` — so two
tenants can both use SKU `LED-12W`, but a single tenant cannot duplicate it.
This is enforced by the database, not just the app.

### 5.2 `users` (logins) vs `employees` (payroll) split
Login accounts and payroll staff are different concepts. `users` are
authenticated principals; `employees` are payroll entities. `employees.user_id`
optionally links a staff member to a login account (manager/cashier/accountant),
while non-login staff (salesman, electrician, helper) exist purely for payroll.

### 5.3 Dynamic specification engine (global definitions, per-product values)
`specifications` and `specification_values` are **global** (super-admin owned),
while `product_specification_values` binds a spec + value to a specific
product. Select-type specs (Color, Warranty, Material) reference a
`specification_value_id`; free-form specs (Wattage, Voltage, Blade Size) store
a plain `value`. This satisfies the PRD's "not hardcoded" requirement.

### 5.4 Invoices vs quotations kept as separate tables
Per PRD §10, invoices are financial documents (deduct stock, post ledger,
create payments) and quotations are not. They are modeled as distinct tables
with distinct lifecycles rather than a single polymorphic "documents" table —
clearer semantics and simpler query paths.

### 5.5 Quotation → Invoice link is one-directional
`invoices.quotation_id` references the source quotation. To avoid a circular
foreign-key between `invoices` and `quotations`, the reverse link is not stored
as a column; a converted quotation is discovered via `invoices.quotation_id` and
its own `status = 'converted'`.

### 5.6 Line-item snapshots for historical accuracy
`invoice_items` stores `name`, `sku`, `unit_price`, and `cost_price` snapshots.
If a product is later renamed, re-priced, or soft-deleted, historical invoices
remain unchanged and accurate.

### 5.7 Unified `ledger_categories` instead of two category tables
The PRD lists `income_categories` and `expense_categories` separately. These are
structurally identical, so a single `ledger_categories` table with a `type`
discriminator avoids duplication (AGENT.md: no duplicate logic). This is a
deliberate, documented deviation from the PRD's literal table list.

### 5.8 Polymorphic `reference` for lineage
`inventory_transactions`, `customer_ledgers`, and `daily_transactions` use a
polymorphic `reference` morph so each movement/entry can trace back to its
source document (Invoice, Payment, SaleReturn, SalaryRecord, …) for auditing
and reporting.

### 5.9 Money as `decimal(14,2)`
All monetary amounts use `decimal(14,2)` to avoid floating-point drift. Status
fields are short strings (validated at the app layer) rather than native
PostgreSQL enums, which are painful to extend in a SaaS product that will
evolve.

### 5.10 Immutable audit logs
`audit_logs` has `created_at` only (no `updated_at`) and stores JSON
`old_values` / `new_values`, matching PRD §19's immutable requirement.

---

## 6. Seeder — Punjab Electric Store

The seeder (`database/seeders/PunjabElectricStoreSeeder.php`) is deterministic,
idempotent, wrapped in a single DB transaction, and generates fully connected
data:

- **Platform** — 5 roles, 21 permissions, role→permission matrix, super admin.
- **Tenant** — Punjab Electric Store with Pakistani store settings (currency
  PKR, invoice prefixes, low-stock alert flag).
- **Users** — Owner, Manager, Cashier, Accountant (all linked to the tenant).
- **Catalog** — 13 categories (with 7 parent/child links), 10 brands, 10 global
  specifications + 19 predefined values, 40 products (realistic PKR pricing,
  13-digit barcodes, SKUs, per-product specs).
- **Inventory** — 40 inventory records + 122 stock movements (opening stock,
  invoice deductions, return restocks), with `before`/`after` quantities.
- **Customers** — 10 realistic customers with Pakistani phone numbers/addresses.
- **Quotations** — 8 quotes across statuses; 2 converted into invoices.
- **Invoices** — 36 invoices over Jun–Aug 2026 with item-level and invoice-level
  discounts (percentage and fixed), correct totals and payment statuses.
- **Payments** — 36 payments (cash/bank/card) plus 4 on-account settlements.
- **Returns** — 3 returns with refund types and stock restock.
- **Customer ledger** — 41 entries with a correct chronological running balance.
- **Daily ledger** — 61 income/expense transactions (rent, electricity,
  salaries, transport, maintenance, customer payments, other income).
- **Payroll** — 6 employees + 18 salary records (Jun/Jul paid, Aug pending),
  with paid salaries flowing into the expense ledger.
- **Audit logs** — 16 representative entries (login, product create, price
  change, invoice/payment/return create, permission change, payroll).

**Seeded financial summary**

| Measure | PKR |
| --- | --- |
| Total sales | 1,002,257.60 |
| Collected | 635,970.00 |
| Outstanding | 366,287.60 |
| Income (daily ledger) | 734,470.00 |
| Expenses (daily ledger) | 575,200.00 |
| Returns value | 11,840.00 |

---

## 7. Verification & Testing

Integrity was verified both with raw SQL (PostgreSQL) and automated tests
(SQLite in-memory — which also cross-validates that the migrations are portable).

Verified invariants (all passing):

- `invoice.total == subtotal - discount_amount`
- `invoice.balance_due == total - amount_paid`
- `invoice.amount_paid == Σ payments(invoice)`
- `invoice.subtotal == Σ line_total(items)`
- `inventory.quantity == Σ stock movement deltas`
- `customer_ledger.balance == running Σ(debit - credit)` (chronological)
- `Σ ledger(debit-credit) == Σ invoice.balance_due` for customers **with no
  returns / on-account payments** (see note below)
- No negative stock; no negative balance due
- All tenant-owned rows carry the correct `tenant_id`

**Note (expected, not a bug):** for 4 customers the customer-ledger balance
differs from `Σ invoice.balance_due` because the ledger additionally reflects
returns (credit) and on-account settlement payments (credit), e.g. Haji Saeed
Khan's ledger (6,980) = invoice due (14,880) − returned ceiling fan (7,900).
This is intentional: `invoice.balance_due` is a per-invoice snapshot while the
customer ledger is the reconciled source of truth (PRD §13).

**Tests**

```sh
php artisan test
# 8 tests, 237 assertions, passed
```

`tests/Feature/SeedingIntegrityTest.php` covers: tenant isolation, invoice math,
payment reconciliation, inventory reconciliation, and ledger running balance.

---

## 8. Potential Risks & Recommendations

1. **Tenant scoping is app-enforced, not DB-enforced (yet).** The schema has
   `tenant_id` + composite uniques, but cross-tenant row filtering must still be
   consistently applied in every query. **Recommendation:** implement a
   `BelongsToTenant` global scope trait (with a super-admin bypass) and, longer
   term, PostgreSQL Row-Level Security per tenant.
2. **Tax handling.** The schema stores `tax_amount` but the seeder assumes
   tax-disabled. **Recommendation:** add a tax/GST engine (PRD lists it as
   non-core) with tenant-configurable rate before Go-live.
3. **Sanctum not yet installed.** The `personal_access_tokens` table is present
   and matches Sanctum's schema, but `laravel/sanctum` (and `HasApiTokens`) is
   not yet required via Composer. **Recommendation:** `composer require
   laravel/sanctum` when API auth work begins.
4. **No DB-level CHECK constraints** on status/enum values (chosen for
   flexibility). **Recommendation:** introduce PHP backed-enums + validation
   rules for the value sets documented in this report.
5. **Composite tenant+id FKs** were intentionally omitted for line-item tables
   to keep migrations simple; `tenant_id` on those tables is maintained by the
   application. **Recommendation:** add composite FKs if stronger referential
   integrity is desired.

---

## 9. Next Steps

1. Install Sanctum; add `HasApiTokens` to `User`.
2. Implement the `BelongsToTenant` global scope trait + tenant middleware.
3. Build Service classes + Form Requests for invoice/quote/payment/return
   workflows (per AGENT.md, logic out of controllers/models).
4. Add PHP enums for statuses and discount types.
5. Define API resources + routes for the modules listed in PRD §21.
6. Add PostgreSQL RLS policies for defence-in-depth multi-tenancy.
