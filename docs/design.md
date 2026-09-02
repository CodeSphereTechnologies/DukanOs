# DukanOS Modern Minimalism Design System

## Purpose

This document defines the frontend design language for DukanOS, a
React + TypeScript SaaS POS platform.

The goal is to create a premium modern SaaS experience inspired by
Shopify Admin principles:

-   Clear hierarchy
-   Minimal visual noise
-   Strong typography
-   Calm enterprise UI
-   Fast retail workflows
-   Consistent reusable components

The interface should feel powerful without feeling complicated.

------------------------------------------------------------------------

# Design Philosophy

## Modern Minimalism

Minimalism does not mean empty screens.

It means:

-   Every element has a purpose.
-   Actions are obvious.
-   Information density is controlled.
-   Users never fight the interface.

DukanOS handles complex business operations, therefore complexity should
exist in the system logic, not in the visual experience.

------------------------------------------------------------------------

# Core Principles

## One Primary Action

Every screen must have one dominant action.

Examples:

Product page: - Primary: Add Product - Secondary: Import, Export

Invoice: - Primary: Complete Sale

------------------------------------------------------------------------

## Information Hierarchy

Priority order:

1.  Main business action
2.  Important information
3.  Supporting information
4.  Secondary controls

Never make all elements equally loud.

------------------------------------------------------------------------

# Visual Language

## Canvas System

### Light Canvas

Default application surface.

Used for:

-   Dashboard
-   POS
-   Tables
-   Forms
-   Reports

Color:

`#FFFFFF`

Secondary surface:

`#FAFAF8`

------------------------------------------------------------------------

### Dark Canvas

Used for:

-   Marketing pages
-   Brand moments
-   Authentication

Color:

`#000000`

------------------------------------------------------------------------

# Color System

## Primary

Black:

`#000000`

Usage:

-   Main buttons
-   Headings
-   Strong actions

White:

`#FFFFFF`

Usage:

-   Dark surfaces
-   Button labels

------------------------------------------------------------------------

## Accent

DukanOS Mint:

`#C1FBD4`

Usage:

-   Success states
-   Growth indicators
-   Featured areas

Do not use as decoration.

------------------------------------------------------------------------

## Neutral Scale

    Neutral 50  #FAFAFA
    Neutral 100 #F4F4F5
    Neutral 200 #E4E4E7
    Neutral 500 #71717A
    Neutral 900 #18181B

------------------------------------------------------------------------

# Typography

## Display

Preferred:

Neue Haas Grotesk Display

Fallback:

Inter Display

Usage:

-   Hero
-   Major numbers
-   Brand areas

Weight:

300-400

------------------------------------------------------------------------

## Application UI

Font:

Inter Variable

Usage:

-   Tables
-   Forms
-   Buttons
-   Navigation

Weights:

400 500 600

------------------------------------------------------------------------

## Scale

  Name         Size   Usage
  ------------ ------ ----------------
  Display XL   72px   Hero
  Display LG   56px   Page title
  Heading XL   32px   Section
  Heading LG   24px   Card
  Body LG      18px   Important text
  Body MD      16px   Default
  Small        14px   Metadata

------------------------------------------------------------------------

# Spacing

Base:

`8px`

Tokens:

    4px
    8px
    12px
    16px
    24px
    32px
    48px
    64px
    96px

Rules:

-   Components: 16-24px
-   Cards: 24-32px
-   Sections: 48-96px

------------------------------------------------------------------------

# Layout

Application shell:

    Sidebar
       |
    Top Navigation
       |
    Page Container
       |
    Feature Content

Container:

Desktop: 1440px max

Content: 1200px

Forms: 720px

------------------------------------------------------------------------

# Components

## Buttons

Only use three variants.

## Primary Button

Black pill.

Used for main actions.

Examples:

-   Create Invoice
-   Save Product

## Secondary Button

White with border.

Used for:

-   Cancel
-   Export

## Success Button

Mint accent.

Used for:

-   Receive Payment
-   Complete workflow

All buttons:

-   Pill radius
-   Minimum height 44px

------------------------------------------------------------------------

# Cards

Cards organize information.

Never create cards only for decoration.

Usage:

-   Metrics
-   Forms
-   Product details
-   Reports

Style:

    background:white
    border:1px solid #E4E4E7
    radius:16px
    padding:24px

------------------------------------------------------------------------

# Tables

Tables are core to DukanOS.

Requirements:

-   Clear header
-   Comfortable rows
-   Sticky headers when required
-   Inline actions
-   Strong filtering

Row height:

56px minimum

------------------------------------------------------------------------

# POS Screen

The POS screen is the most important workflow.

Design:

    Products/Search | Cart/Checkout

Requirements:

-   Large search
-   Barcode support
-   Fast keyboard workflow
-   Minimal clicks
-   Clear payment action

------------------------------------------------------------------------

# Dashboard

Structure:

    Page Header
    Primary Action
    Summary Metrics
    Main Data
    Insights

Avoid:

-   Too many charts
-   Excessive colors
-   Information overload

------------------------------------------------------------------------

# Product Management

Product list:

-   Search
-   Filters
-   Bulk actions
-   Status
-   Barcode

Product form:

Sections:

1.  Basic Information
2.  Pricing
3.  Inventory
4.  Dynamic Specifications
5.  Barcode

------------------------------------------------------------------------

# Financial UI

Financial meaning:

Green: Positive

Red: Negative

Gray: Neutral

Never use colors without semantic meaning.

------------------------------------------------------------------------

# Animation

Purpose:

Communicate state.

Allowed:

-   Fade
-   Slide
-   Scale

Duration:

150-250ms

Avoid decorative motion.

------------------------------------------------------------------------

# React Implementation Rules

Use:

-   TypeScript
-   Component-driven architecture
-   Design tokens
-   CSS variables
-   Reusable primitives

Structure:

    src
     ├ components
     │   └ ui
     ├ features
     ├ layouts
     ├ hooks
     ├ lib
     └ styles

------------------------------------------------------------------------

# Design Tokens

Create centralized tokens:

    colors
    spacing
    typography
    radius
    shadows

Never hardcode random values.

------------------------------------------------------------------------

# AI Coding Agent Rules

Before creating UI:

1.  Understand the workflow.
2.  Identify primary user action.
3.  Reuse existing components.
4.  Use design tokens.
5.  Maintain consistency.

Before creating a new component:

Ask:

"Can this be a variant of an existing component?"

------------------------------------------------------------------------

# Do

-   Use whitespace
-   Keep hierarchy clear
-   Reuse components
-   Prioritize workflows
-   Maintain consistency

------------------------------------------------------------------------

# Do Not

-   Use unnecessary gradients
-   Create colorful dashboards
-   Add random shadows
-   Create inconsistent buttons
-   Add decorative UI

------------------------------------------------------------------------

# Final Goal

DukanOS should feel like:

Shopify Admin + modern financial software.

A complex retail operating system presented through a calm, premium,
minimal interface.
