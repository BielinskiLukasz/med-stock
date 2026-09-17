# MedStock

## What This Is

MedStock is a privacy-first Progressive Web App for managing a household medicine inventory. It helps a family instantly answer: do I already have this medicine, where is it, and is it still safe to use — from any device, even offline. All data lives locally on the device; family members sync via a shared OneDrive JSON file.

## Core Value

At a glance, from anywhere, know whether you already have a valid medicine — so you never overbuy and never miss an expired one.

## Current State

**v1.1 shipped** — 2026-08-31

The full household medicine inventory app with catalog + stock model is working and installable. On top of v1.0, users can: add stock entries linked to reusable catalog entries, view aggregated stock status per medicine, split/move stock between locations, edit catalog and stock fields independently, and export/import backups that include the catalog table — with backward compatibility for pre-v1.1 backups. 15/15 v1.1 requirements satisfied.

**v1.0 shipped** — 2026-07-13. 33/35 requirements satisfied.

Known gaps carried to backlog: interactive Sync Now flow (B-002), JSON import merge strategy (B-003), CSV auto-mapping (B-004).

## Current Milestone: v1.2 Polish, UX & i18n

**Goal:** Polish the app for real household use — add Polish language support, fix UX rough edges, and extend the status model with an early-warning state.

**Target features:**
- B-011 Polish / English language switcher (i18n — all strings, locale-aware dates)
- B-012 Full location management — rename, hide, delete, reorder all locations including predefined
- B-004 CSV column auto-mapping by header name
- B-005 CSV mapper column header labels (source vs target)
- B-013 App version number display
- B-014 Expiring Soon warning status (sits between Opened and Expired in priority)
- B-001 Medicine name autocomplete from catalog history
- B-015 Pack count display: empty/1 = implicit 1 box; show "N boxes × qty" only when N ≥ 2

## Milestone: v1.1 Catalog + Stock Model (Shipped 2026-08-31)

**Goal:** Replace the flat medicines table with a two-layer catalog + stock model so users never re-enter medicine details when adding new boxes and can track quantities split across multiple locations.

**Shipped features:**
- `medicine_catalog` table: name, category, form, notes (the reusable template)
- `medicines` becomes stock entries: quantity, expiryDate, location, catalogId
- Two-step add flow: autocomplete from catalog → fill stock fields
- Detail view: lists all stock entries per medicine
- Split / Move flow: move N units from one location to another
- Dexie v3→v4 migration with deduplication by name
- Backup / restore updated to include catalog table; legacy backups import via inferred catalog

## Requirements

### Validated

v1.0 requirements archived at [milestones/v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md).

v1.2 requirements — B-011 satisfied:

- ✓ I18N-01: Instant Polish/English toggle, no reload — Phase 7
- ✓ I18N-02: All UI strings (labels, placeholders, toasts, error messages, status names, screen titles) display in the active language — Phase 7
- ✓ I18N-03: Language choice persists in localStorage across reloads — Phase 7
- ✓ I18N-04: Built-in/predefined names (locations, categories, units, form types) display in the active language — Phase 7
- ✓ I18N-05: Dates render in locale-appropriate format for the active language — Phase 7

v1.1 requirements — all satisfied:

- ✓ MIGR-01: Auto-migrate v1.0 data to catalog + stock on first open — v1.1
- ✓ MIGR-02: Migration deduplicates by case-insensitive + trimmed name — v1.1
- ✓ CAT-01: Catalog autocomplete search (case-insensitive) — v1.1
- ✓ CAT-02: Create catalog inline when no autocomplete match — v1.1
- ✓ CAT-03: Edit catalog name/category/form from detail screen — v1.1
- ✓ STOCK-01: Add stock entry linked to catalog — v1.1
- ✓ STOCK-02: Edit stock entry fields — v1.1
- ✓ STOCK-03: Move/split stock entry across locations — v1.1
- ✓ STOCK-04: Soft-deleted entries in Trash with restore — v1.1
- ✓ STOCK-05: Detail view stock list respects UIStore status/location filters — v1.1
- ✓ FLOW-01: Aggregate list row per catalog with priority-reduce status + qty badge — v1.1
- ✓ FLOW-02: Detail screen stock list with qty/expiry/location/status — v1.1
- ✓ FLOW-03: Add flow catalog autocomplete → stock fields — v1.1
- ✓ DATA-01: JSON export includes medicine_catalog table with catalogId — v1.1
- ✓ DATA-02: New-format import restores catalog + stock atomically — v1.1
- ✓ DATA-03: Old-format import infers catalog from name/category — v1.1

### Active

<!-- v1.2 targeted -->
- [ ] B-001: Medicine name autocomplete from catalog history (name field suggests existing entries)
- [ ] B-004: CSV column auto-mapping by header name
- [ ] B-005: CSV mapper column header labels ("Your file column" / "App field")
- [ ] B-012: Full location management — rename, hide, delete, reorder all locations including predefined
- [ ] B-013: App version number display (Data tab footer or About section)
- [ ] B-014: Expiring Soon warning status — fires within configurable window (default 7 days) of expiry or PAO end
- [ ] B-015: Pack count display — empty/1 treated as 1 box (not shown); "N boxes × qty" only when N ≥ 2

<!-- deferred — not in v1.2 -->
- [ ] B-002: Interactive "Sync Now" triggered flow (DATA-04) — guides both-device sync step-by-step
- [ ] B-003: JSON import merge strategy with last-write-wins (currently full replace)

### Out of Scope

| Feature | Reason |
|---------|--------|
| Manual catalog deduplication UI | Migration auto-deduplicates; merge tool adds UI complexity beyond current scope |
| Barcode / QR scanning | Requires camera permission flow; deferred to v2 |
| Automatic cloud catalog sync | Privacy-first constraint — no backend |
| Photos / images | Doesn't affect core value of validity check; deferred to v2 |
| Batch add (multiple packages at once) | Deferred from v1.0; low-frequency action |

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
| Case-insensitive + trimmed deduplication (D-01) | Prevents duplicate catalog entries from data-entry variations | Applied in v2→v3 migration — Phase 4 |
| MedicineForm as `as const` type, not enum (D-10) | `enum` keyword incompatible with `erasableSyntaxOnly` compiler flag | Applied — equivalent type safety, zero behavioral change — Phase 4 |
| No heuristic form inference during migration (D-11) | Avoids wrong guesses — form is optional and user-supplied in Phase 5 | Applied — all migrated catalog entries have `form: null` — Phase 4 |
| historyOps accepts explicit `medicineName` parameter (D-06) | Decouples mutation layer from catalog/stock lookup; Phase 5 callers supply name from their context | Applied — all 5 mutation functions updated — Phase 4 |
| schemaVersion detection: undefined = old-format (D-48) | Two-pass Zod parse avoids strict per-format schemas; BackupSchema accepts both formats via optional field | Applied — importFromJSON branches on `schemaVersion === undefined` — Phase 6 |
| LegacyBackupSchema module-internal; ImportResult exported | Callers need the result contract, not the legacy schema types; prevents leaking internal format details | Applied — ImportResult is the public API; LegacyBackupSchema unexported — Phase 6 |
| pendingRaw: unknown\|null in ImportJSONSection | importFromJSON owns all validation; UI doesn't need to parse the backup format | Applied — removed BackupData state type; importFromJSON validates on confirm — Phase 6 |
| Custom React Context i18n, no library (D-01) | TypeScript-typed EN/PL dicts + `useLang()`/`t()` give compile-time-checked coverage without a runtime dependency; app is two-language, doesn't need pluralization/ICU | Validated — `LanguageProvider` outermost in App.tsx, `TranslationDict` structural typing catches missing keys at build time — Phase 7 |
| Zod validation schemas must be factories taking `t()`, not module-level constants | Schemas built at module scope can't read the active-language dictionary; discovered as a real, shipped gap (WR-04) where every add/edit form's validation errors stayed English regardless of language toggle | Applied — `createCatalogSchema(t)`/`createStockSchema(t)`/`createMedicineSchema(t)` wired via `useMemo(() => createXSchema(t), [t])` in all 6 consumers — Phase 7 |
| Repo-wide grep, not enumerated lists, closes hardcoded-string gap-closure plans | Three consecutive gap-closure cycles each found "the last" hardcoded aria-label/placeholder/title by manual enumeration, and each missed one instance the next review caught — a fixed list undercounts, a grep can't | Applied — 07-10's final acceptance check is `grep -rnE 'aria-label="[A-Za-z]\|placeholder="[A-Za-z]\|title="[A-Za-z]' src` returning zero matches, not a checklist — Phase 7 |

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
*Last updated: 2026-09-17 after Phase 7 (i18n / Polish Language)*
