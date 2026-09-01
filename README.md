# DukanOS

![DukanOS](https://img.shields.io/badge/DukanOS-SaaS%20POS-blue)

DukanOS is a multi-tenant SaaS retail operating system built for
electrical appliance stores.

It is designed as a scalable platform that combines:

-   Point of Sale (POS)
-   Product Management
-   Dynamic Product Specifications
-   Customer Ledger
-   Payments
-   Returns
-   Minimal Inventory Management
-   Financial Reporting
-   Payroll
-   Complete Audit Tracking

The architecture is designed to support additional business verticals in
the future.

------------------------------------------------------------------------

# Repository Structure

    dukanOS/

    ├── backend/
    │   └── Laravel 13 API Application

    ├── frontend/
    │   └── React + TypeScript + React Compiler Application

    ├── mobile/
    │   └── Flutter Mobile Application

    ├── coolify/
    │   └── Deployment configuration
    │
    ├── docs/
    │   └── Product documentation
    │
    └── README.md

------------------------------------------------------------------------

# Technology Stack

## Backend

-   Laravel 13
-   Laravel Sanctum Authentication
-   PostgreSQL
-   REST API Architecture

## Frontend

-   React
-   TypeScript
-   React Compiler
-   Modern component architecture

## Mobile

-   Flutter
-   API driven architecture

## Infrastructure

-   Docker Compose
-   Coolify deployment

------------------------------------------------------------------------

# Product Architecture

DukanOS follows a multi-tenant SaaS architecture.

    Super Admin
         |
         |
    Tenants (Store Owners)
         |
         |
    Users
    (Admin / Manager / Cashier / Accountant)

Every tenant has isolated:

-   Products
-   Customers
-   Sales
-   Payments
-   Ledger
-   Employees
-   Reports
-   Audit history

------------------------------------------------------------------------

# Development Principles

This project follows strict engineering standards.

## Quality First

Every feature must:

-   Follow clean architecture principles
-   Have proper validation
-   Include error handling
-   Include automated tests
-   Maintain backwards compatibility

## Security First

Sensitive operations require:

-   Authorization checks
-   Audit logging
-   Tenant validation

## Scalability First

Avoid shortcuts that create future limitations.

The system must be designed for:

-   Thousands of tenants
-   Large product catalogs
-   Multiple users
-   Mobile clients

------------------------------------------------------------------------

# Local Development

## Backend

    cd backend

    composer install

    php artisan migrate

    php artisan serve

------------------------------------------------------------------------

## Frontend

    cd frontend

    npm install

    npm run dev

------------------------------------------------------------------------

## Mobile

    cd mobile

    flutter pub get

    flutter run

------------------------------------------------------------------------

# Documentation

Important documents:

    docs/

    ├── PRD.md
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    └── API.md

------------------------------------------------------------------------

# Testing Requirements

Before considering any feature complete:

Backend:

    php artisan test

Frontend:

    npm test

Mobile:

    flutter test

No feature should be merged without validation.

------------------------------------------------------------------------

# Contribution Rules

Every change should include:

-   Clear commit message
-   Updated documentation
-   Tests where applicable
-   Migration safety review

------------------------------------------------------------------------

# AI Development Agent

All AI coding agents working on this repository must read:

    AGENT.md

before making changes.
