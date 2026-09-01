# DukanOS Product Requirements Document (PRD)

## 1. Document Information

**Product Name:** DukanOS\
**Product Type:** Multi-tenant SaaS POS / Retail Management System\
**Primary Industry:** Electrical Appliance Retail Stores\
**Backend:** Laravel API\
**Frontend:** React\
**Mobile Future Application:** Flutter\
**Database:** PostgreSQL\
**Authentication:** Laravel Sanctum\
**Deployment:** Docker Compose

------------------------------------------------------------------------

# 2. Product Overview

DukanOS is a SaaS-based product management and POS platform designed
specifically for electrical appliance stores.

The platform helps electrical retailers manage:

-   Products
-   Dynamic electrical specifications
-   Sales invoices
-   Quotations
-   Customer accounts
-   Customer ledger
-   Payments
-   Returns
-   Minimal inventory tracking
-   Daily income and expense ledger
-   Employee payroll
-   Reports
-   Printing
-   Complete audit history

The system is designed as a reusable SaaS platform where the same
architecture can later support other retail industries.

------------------------------------------------------------------------

# 3. SaaS Architecture

DukanOS follows a multi-tenant architecture.

Hierarchy:

    Super Admin
        |
        |
    Tenants (Store Owners)
        |
        |
    Store Users
    (Admin, Manager, Cashier, Accountant)

Every tenant must have isolated:

-   Products
-   Customers
-   Invoices
-   Payments
-   Ledger records
-   Employees
-   Reports
-   Audit logs

No tenant can access another tenant's data.

------------------------------------------------------------------------

# 4. User Roles

## Super Admin

Platform owner.

Responsibilities:

-   Manage tenants
-   Configure global settings
-   Create global product specifications
-   Monitor system activities
-   Manage SaaS level controls

------------------------------------------------------------------------

# Tenant Owner / Store Owner

Full store control.

Permissions:

-   Manage products
-   Manage customers
-   Create invoices
-   Manage quotations
-   Manage returns
-   Manage employees
-   Create sub users
-   View permitted reports
-   Configure store settings

------------------------------------------------------------------------

# Admin / Manager

Operational management access.

Can:

-   Manage products
-   Manage customers
-   Create invoices
-   Manage sales operations
-   Handle returns
-   Manage inventory alerts

Cannot:

-   View restricted financial reports
-   Add team members
-   Access sensitive financial controls

------------------------------------------------------------------------

# Cashier

Sales focused role.

Can:

-   Search products
-   Scan barcode
-   Create invoices
-   Receive payments
-   Print invoices
-   Search customers

Cannot:

-   View profit reports
-   View financial dashboards
-   Manage users
-   Change sensitive settings

------------------------------------------------------------------------

# Accountant

Financial role.

Can:

-   View financial dashboard
-   Manage payments
-   View customer ledger
-   Manage expenses
-   View reports

Cannot:

-   Delete products
-   Manage users

------------------------------------------------------------------------

# 5. Product Management

Products must support electrical appliances but remain generic enough
for future industries.

## Product Information

Required fields:

-   Product name
-   SKU
-   Barcode
-   Category
-   Brand
-   Model number
-   Description
-   Purchase cost
-   Selling price
-   Minimum selling price
-   Product image
-   Status

Status:

-   Active
-   Paused
-   Deleted

------------------------------------------------------------------------

# 6. Dynamic Product Specification Engine

Specifications must not be hardcoded.

Super Admin creates specifications.

Examples:

-   Wattage
-   Voltage
-   Length
-   Capacity
-   Warranty
-   Color
-   Size

Example:

Product:

LED Bulb

Specifications:

-   Wattage: 12W
-   Voltage: 220V
-   Color: White

This allows future expansion into other business categories.

Database concept:

    products

    specifications

    specification_values

    product_specification_values

------------------------------------------------------------------------

# 7. Inventory Management

DukanOS does not implement full warehouse management.

Inventory purpose:

-   Track available quantity
-   Reduce stock after invoice
-   Increase stock after return
-   Generate low stock alerts

Required:

-   Current quantity
-   Minimum quantity threshold
-   Stock movement history

------------------------------------------------------------------------

# 8. Barcode Management

Required features:

-   Generate internal barcodes
-   Support manufacturer barcodes
-   Barcode search
-   Barcode scanner support
-   Barcode printing

Barcode should work during invoice creation.

------------------------------------------------------------------------

# 9. Invoice Management

Invoice creation supports:

-   Customer selection
-   New customer creation
-   Product selection
-   Quantity
-   Price modification
-   Discount
-   Payment selection
-   Printing

Discount types:

-   Fixed amount
-   Percentage

Default product price can be overridden during invoice creation.

------------------------------------------------------------------------

# 10. Invoice Types

## Invoice

Financial document.

Effects:

-   Deduct inventory
-   Create payment record
-   Affect customer ledger
-   Calculate financial reporting

## Quotation

Non-financial document.

Effects:

-   No stock deduction
-   No profit/loss impact
-   No payment record

Quotation can later be converted into invoice.

------------------------------------------------------------------------

# 11. Payment System

Supported payment methods:

-   Cash
-   Bank transfer
-   Card
-   Online payment
-   Other methods

Payment statuses:

-   Paid
-   Partial payment
-   Ledger

Customers can have outstanding balances.

------------------------------------------------------------------------

# 12. Customer Management

Customer profile:

-   Name
-   Phone
-   Address
-   Notes

Customer features:

-   Search by phone
-   Search existing customers
-   Create new customers
-   View purchase history
-   View ledger

------------------------------------------------------------------------

# 13. Customer Ledger

Ledger tracks:

-   Invoices
-   Payments
-   Outstanding amounts
-   Adjustments
-   Returns

Required:

-   Multiple payments
-   Payment history
-   Ledger adjustment
-   Printable ledger report

------------------------------------------------------------------------

# 14. Returns Management

Return process:

1.  Select original invoice.
2.  System displays only products from that invoice.
3.  Select returned quantity.
4.  Create return document.

Return effects:

-   Update invoice history
-   Restore stock
-   Update customer balance

Refund options:

-   Cash refund
-   Customer credit
-   Ledger adjustment

------------------------------------------------------------------------

# 15. Daily Ledger

Tracks business money flow.

Categories are tenant configurable.

Income examples:

-   Customer payments
-   Other income

Expense examples:

-   Rent
-   Electricity
-   Maintenance
-   Salary

Features:

-   Create categories
-   Record transactions
-   View summaries
-   Print reports

------------------------------------------------------------------------

# 16. Payroll

Minimal payroll module.

Employee fields:

-   Name
-   Phone
-   Role
-   Salary
-   Joining date

Salary management:

-   Generate salary record
-   Mark paid
-   Track pending salary

Salary payments affect financial reports.

------------------------------------------------------------------------

# 17. Reporting Dashboard

Reports:

## Sales

-   Total invoices
-   Sales amount
-   Daily sales
-   Monthly sales

## Financial

-   Income
-   Expenses
-   Payments
-   Outstanding customer balances

## Inventory

-   Low stock products
-   Product movement

## Customer

-   Ledger reports
-   Payment history

------------------------------------------------------------------------

# 18. Printing

Supported printers:

## Thermal Receipt Printer

Used for:

-   Customer invoices
-   Receipts

## A4 Printing

Used for:

-   Reports
-   Product lists
-   Customer ledger

------------------------------------------------------------------------

# 19. Audit Logging

Audit logs are a core feature.

Every important action must be recorded.

Examples:

-   Login
-   Logout
-   Create product
-   Update product
-   Delete product
-   Price changes
-   Discount changes
-   Invoice edits
-   Payment changes
-   Return creation
-   Permission changes

Audit record:

    User
    Action
    Module
    Old value
    New value
    Timestamp
    IP Address
    Device Information

Audit logs should be immutable.

------------------------------------------------------------------------

# 20. Database Requirements

Main entities:

    tenants

    users

    roles

    permissions

    products

    categories

    brands

    specifications

    specification_values

    product_specification_values

    inventory

    inventory_transactions

    customers

    customer_ledgers

    invoices

    invoice_items

    quotations

    quotation_items

    payments

    returns

    return_items

    income_categories

    expense_categories

    daily_transactions

    employees

    salary_records

    audit_logs

All tenant-owned tables must contain:

    tenant_id

------------------------------------------------------------------------

# 21. API Requirements

Backend must expose REST APIs.

Requirements:

-   Authentication APIs
-   Product APIs
-   Customer APIs
-   Invoice APIs
-   Payment APIs
-   Ledger APIs
-   Reporting APIs
-   Audit APIs

API must be mobile-app ready.

------------------------------------------------------------------------

# 22. Authentication

Use Laravel Sanctum.

Requirements:

-   Token authentication
-   Secure sessions
-   Role-based authorization
-   Permission middleware

------------------------------------------------------------------------

# 23. Frontend Requirements

React application.

Requirements:

-   Responsive dashboard
-   Role-based UI
-   POS optimized interface
-   Barcode workflow
-   Printing support

------------------------------------------------------------------------

# 24. Mobile Application Readiness

Future Flutter app must consume same APIs.

Avoid architecture decisions that prevent mobile expansion.

------------------------------------------------------------------------

# 25. Non Functional Requirements

## Security

-   Tenant data isolation
-   Permission validation
-   Audit tracking
-   Secure authentication

## Performance

-   Fast product search
-   Optimized invoice creation
-   Efficient reporting queries

## Scalability

Architecture must support:

-   More tenants
-   More users
-   More products

------------------------------------------------------------------------

# 26. Future Roadmap

Possible future modules:

-   SaaS subscriptions
-   Multiple branches
-   Supplier management
-   Purchase management
-   Advanced inventory
-   WhatsApp notifications
-   Mobile applications
-   Online store integration

------------------------------------------------------------------------

# Final Development Principle

DukanOS should be built as a scalable SaaS platform, not a single-store
POS.

The first priority is:

1.  Correct multi-tenancy
2.  Strong permissions
3.  Flexible product architecture
4.  Accurate financial records
5.  Complete auditability

The system should remain extendable for additional retail industries.
