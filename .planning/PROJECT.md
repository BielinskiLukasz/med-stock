# MedStock

## What This Is

MedStock is a privacy-first Progressive Web App for managing a household medicine inventory. It helps a family instantly answer: do I already have this medicine, where is it, and is it still safe to use — from any device, even offline. All data lives locally on the device; family members sync via a shared OneDrive JSON file.

## Core Value

At a glance, from anywhere, know whether you already have a valid medicine — so you never overbuy and never miss an expired one.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can search medicines by name and instantly see stock + validity status
- [ ] User can add a medicine package with name, category, location, expiration date, opened date, quantity, and notes
- [ ] User can edit and delete medicine packages (soft delete to Trash Bin)
- [ ] User can restore or permanently delete items from Trash Bin
- [ ] User can add multiple packages of the same medicine in one flow (batch creation)
- [ ] App automatically calculates validity based on expiration date, opened date, and period-after-opening
- [ ] App displays medicines with status: Active, Opened, Expired, Used Up, Disposed, Archived
- [ ] User can filter and sort the medicine list by category, location, and status
- [ ] Dashboard shows total count, expired count, expiring-soon count, exceeded-open-period count, and recently added
- [ ] Every change to a medicine record is stored in a history log
- [ ] User can manage predefined and custom locations and categories
- [ ] User can export full inventory as JSON backup
- [ ] User can import inventory from JSON backup (restore)
- [ ] User can import initial inventory from CSV file with column mapping
- [ ] User can manually sync inventory with a shared OneDrive folder (export + import flow)
- [ ] App works fully offline as an installable PWA on Android, iOS, Windows, macOS, Linux

### Out of Scope

- Photo capture and storage — deferred to v2; adds complexity without changing core value
- OCR (expiration date, medicine name, barcode) — strictly deferred; v1 is manual data entry
- Automatic background sync — manual "Sync Now" is sufficient for MVP
- Medication reminders and adherence tracking — different product category; MedStock is inventory, not scheduling
- Household user profiles — future; current model is a shared inventory per device
- Drug interaction information — out of scope; requires maintained medical database
- Multiple photos per package — deferred with photo feature

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
| Local-first with IndexedDB | Privacy, offline support, no server costs | — Pending |
| OneDrive sync via manual JSON export/import | Simplest cross-device family sharing without a backend | — Pending |
| Each physical package is a separate record | Enables per-package expiry and location tracking; batch creation handles the UX | — Pending |
| No photos in v1 | Reduces scope; doesn't affect core value of knowing what you have and whether it's valid | — Pending |
| PWA over native app | Cross-platform coverage (Android, iOS, Windows, macOS, Linux) with one codebase | — Pending |
| Soft delete (Trash Bin) | Preserves history; prevents accidental permanent data loss | — Pending |

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
*Last updated: 2026-06-29 after initialization*
