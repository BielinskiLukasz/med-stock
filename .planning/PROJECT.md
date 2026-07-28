# MedStock

## What This Is

MedStock is a privacy-first Progressive Web App for managing a household medicine inventory. It helps a family instantly answer: do I already have this medicine, where is it, and is it still safe to use — from any device, even offline. All data lives locally on the device; family members sync via a shared OneDrive JSON file.

## Core Value

At a glance, from anywhere, know whether you already have a valid medicine — so you never overbuy and never miss an expired one.

## Current State

**v1.0 shipped** — 2026-07-13

The full household medicine inventory app is working and installable. A user can install it on any device, add medicines with automatic expiry tracking, search by name from a pharmacy, filter/sort by status or location, see a dashboard of expiry alerts, restore from Trash, export/import JSON backups, and bulk-import from CSV. 33 of 35 requirements satisfied.

Known gaps carried to v1.1: interactive Sync Now flow (B-002), JSON import merge strategy (B-003), CSV auto-mapping (B-004).

## Current Milestone: v1.1 Catalog + Stock Model

**Goal:** Replace the flat medicines table with a two-layer catalog + stock model so users never re-enter medicine details when adding new boxes and can track quantities split across multiple locations.

**Target features:**
- `medicine_catalog` table: name, category, form, notes (the reusable template)
- `medicines` becomes stock entries: quantity, expiryDate, location, catalogId
- Two-step add flow: autocomplete from catalog → fill stock fields
- Detail view: lists all stock entries per medicine
- Split / Move flow: move N units from one location to another
- Dexie v3 migration with deduplication by name
- Backup / restore updated to include catalog table

## Requirements

v1.0 requirements archived at [milestones/v1.0-REQUIREMENTS.md](.planning/milestones/v1.0-REQUIREMENTS.md).  
v1.1 requirements defined at [REQUIREMENTS.md](.planning/REQUIREMENTS.md).

## Context

- **Origin**: Personal need — the user and their spouse both buy medicines independently, leading to duplicate purchases and untracked expired stock. Medicine is stored in multiple locations with no current system.
- **Family use**: Two adults + children. Both adults need full read/write access on their own phones. Sync is not optional — it's what makes the app useful as a household tool.
- **Critical UX moment**: User is at a pharmacy, sick. They open the app, search a medicine name, and need stock + validity status in under 5 seconds. This is the primary success scenario.
- **Second most common action**: Logging newly purchased medicines quickly. The add flow must minimize taps.
- **Visual style**: Clean and minimal — white/light backgrounds, simple cards, clinical feel. Optimized for quick task completion, not visual richness.
- **Storage reality**: Current state is total chaos — medicines scattered across many locations. The location field has high practical value.

## Constraints

- **Tech stack**: React + TypeScript + PWA — user-specified, no backend
- **Storage**: IndexedDB only — all data local, no cloud database
- **Privacy**: Zero server-side storage; data never leaves the user's device except via explicit export
- **Offline**: Must work fully without internet access
- **Performance**: Must remain responsive with 1,000+ medicine packages
- **Sync**: Manual only for v1 — no OneDrive API integration, no automatic background sync

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local-first with IndexedDB | Privacy, offline support, no server costs | Validated — Dexie.js v4, all data local, 69 tests pass |
| OneDrive sync via manual JSON export/import | Simplest cross-device family sharing without a backend | Partially validated — export/import works; interactive flow deferred to v1.1 |
| Each physical package is a separate record | Enables per-package expiry and location tracking; batch creation handles the UX | Validated — MedicineForm handles single add; batch deferred to v2 |
| No photos in v1 | Reduces scope; doesn't affect core value of knowing what you have and whether it's valid | Validated — out of scope confirmed |
| PWA over native app | Cross-platform coverage (Android, iOS, Windows, macOS, Linux) with one codebase | Validated — installable on all platforms |
| Soft delete (Trash Bin) | Preserves history; prevents accidental permanent data loss | Validated — TrashBin + historyOps fully operational |
| JSON import as full replace (D-47) | Simpler implementation for MVP | Gap identified in UAT — merge was the intent; deferred to v1.1 B-003 |
| Two-step query+memo pattern | Dexie reactivity + Zustand filter state changes are separate concerns | Validated — prevents unnecessary DB re-reads on filter click |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-28 — v1.1 milestone started (Catalog + Stock Model)*
