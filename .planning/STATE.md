---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Polish, UX & i18n
current_phase: 08
current_phase_name: Full Location Management
status: executing
stopped_at: Completed 08-03-PLAN.md
last_updated: "2026-09-18T11:02:04.754Z"
last_activity: 2026-09-18
last_activity_desc: Phase 08 execution started
state_head: fcbbf43a781e51cccc26d06a7967cbfa2458458e
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 15
  completed_plans: 13
  percent: 20
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-17)

**Core value:** At a glance, from anywhere, know whether you already have a valid medicine — so you never overbuy and never miss an expired one.
**Current focus:** Phase 08 — Full Location Management

## Current Position

Phase: 08 (Full Location Management) — EXECUTING
Plan: 4 of 5
Status: Ready to execute
Last activity: 2026-09-18 — Phase 08 execution started

## v1.0 Summary

- Timeline: 2026-06-29 → 2026-07-13 (20 days)
- 3 phases · 12 plans · 121 commits · 152 files
- Requirements: 33/35 satisfied
- Archive: .planning/milestones/v1.0-ROADMAP.md

## v1.1 Roadmap

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 4 | Database Migration & Schema v3 | MIGR-01, MIGR-02 | Complete ✓ |
| 5 | Stock & Catalog Management | CAT-01–03, STOCK-01–04, FLOW-01–03 | Complete ✓ |
| 6 | Backup & Restore | DATA-01–03 | Complete ✓ |

## v1.2 Roadmap

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 7 | i18n / Polish Language | I18N-01–05 | Complete ✓ |
| 8 | Full Location Management | LOC-01–04 | Not started |
| 9 | CSV UX + Version Display | CSV-01, CSV-02, UX-01 | Not started |
| 10 | Expiring Soon Status | STAT-01–04 | Not started |
| 11 | UX Polish — Autocomplete + Pack Count | UX-02–05 | Not started |

## Deferred Items

| Backlog | Category | Item | Status |
|---------|----------|------|--------|
| B-002 | gap | Interactive "Sync Now" triggered flow (DATA-04) | Out of scope v1.2 |
| B-003 | gap | JSON import last-write-wins merge (DATA-02) | Out of scope v1.2 |

## Key Decisions

- **Phase numbering continues from v1.1**: Phases 7–11 (not reset)
- **Coarse granularity**: 5 phases — i18n as foundation first; location management depends on it for translated predefined names
- **i18n first**: Phase 7 provides translated strings consumed by Phases 8, 9, 10, 11
- **Location management after i18n**: Phase 8 predefined location names need translation keys from Phase 7
- **CSV + version grouped**: Phase 9 combines three small independent changes by delivery area (Data tab)
- **Status logic before UX polish**: Phase 10 adds expiry.ts logic; Phase 11 is UI-only form improvements

## Session

**Last session:** 2026-09-18T11:02:03.680Z
**Stopped at:** Completed 08-03-PLAN.md
**Resume file:** None

## Performance Metrics

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 04 P02 | 40 | 2 tasks | 6 files |
| Phase 05 P07 | 8 | 3 tasks | 3 files |
| Phase 05 P08 | 18 | 2 tasks | 2 files |
| Phase 05 P09 | 52 | 2 tasks | 5 files |
| Phase 05 P10 | 15 | 2 tasks | 3 files |
| Phase 05 P11 | 12 | 2 tasks | 2 files |
| Phase 05 P13 | 13 | 1 tasks | 2 files |
| Phase 06 P01 | 8 | 1 tasks | 2 files |
| Phase 06 P02 | 16 | 2 tasks | 3 files |
| Phase 07 P01 | 13 | 2 tasks | 9 files |
| Phase 07-i18n-polish-language P03 | 9 | 2 tasks | 8 files |
| Phase 07-i18n-polish-language P04 | 45min | 2 tasks | 15 files |
| Phase 07 P05 | 5 | 2 tasks | 3 files |
| Phase 07 P06 | 15min | 2 tasks | 8 files |
| Phase 07-i18n-polish-language P07 | 12 | 3 tasks | 8 files |
| Phase 07 P08 | 12min | 1 tasks | 4 files |
| Phase 07 P09 | 20min | 4 tasks | 12 files |
| Phase 07 P10 | 15min | 2 tasks | 6 files |
| Phase 08 P01 | 33min | 2 tasks | 9 files |
| Phase 08 P02 | 17min | 3 tasks | 3 files |
| Phase 08 P03 | 13min | 3 tasks | 6 files |

## Decisions

- [Phase ?]: G-05-1: guarded Open box button with !stock.openedDate
- [Phase ?]: G-05-5: status filter uses match-any via calculateStatus over stockEntries
- [Phase ?]: G-05-6: ChangeHistory rendered per stock card in detail view
- [Phase ?]: G-05-7: MoveStockSheet seeded from stock.location with useEffect reset
- [Phase ?]: PRIORITY map drives worst-case reduce in computeCatalogAggregate; MANUAL_STATUSES set gates exclusion
- [Phase ?]: packCount test isolation: vi.mock React/dexie-react-hooks to prevent worker timeout from component-level Dexie initialization
- [Phase ?]: packCount=null treated as 1 in totalQty for backward compatibility (aggregation.ts)
- [Phase ?]: Open box guard: ((quantity ?? 0) > 1 || (packCount ?? 0) > 1) && !openedDate (G-05-3)
- [Phase ?]: deleteCatalogEntry re-checks active stock count server-side before deleting (T-05-11-01)
- [Phase ?]: AlertDialog branches on stockEntries.length — no extra DB query needed
- [Phase 05]: filteredStockEntries useMemo: unfiltered stockEntries retained for badge/guard; filteredStockEntries used for render loop (G-05-10)
- [Phase 06]: D-07 honored: form null on inferred catalog entries — no heuristic inference
- [Phase 06]: schemaVersion detection: undefined means old-format; two-pass Zod parse in importFromJSON
- [Phase 06]: LegacyBackupSchema kept module-internal; ImportResult exported as caller contract
- [Phase 06]: pendingRaw: unknown|null in ImportJSONSection — importFromJSON owns all validation
- [Phase 07]: D-01/D-02/D-09/D-10/D-11 applied: custom React Context i18n with TypeScript-typed EN/PL dicts, LanguageProvider outermost in App.tsx, flag-emoji toggle in BottomTabBar, localStorage persistence, formatDate string-split
- [Phase 07]: D-05/D-08 applied in form components: SelectItem value props preserved as canonical English; only display labels translated via t()
- [Phase 07]: HistoryEntry formatEntry refactored as pure function accepting (t, lang) — hooks-in-helpers antipattern avoided
- [Phase 07]: TranslationDict extended atomically (types.ts + en.ts + pl.ts) before modifying route files to keep tsc error-free throughout incremental translation
- [Phase 07]: ImportJSONSection dialog body left in English due to dynamic count interpolation — t() has no interpolation support
- [Phase 07]: SearchBar preserves optional placeholder prop with ?? fallback to t() so existing callers are unaffected
- [Phase 07]: Extended LOCATION_KEYS and locationNames to cover all 7 predefined locations
- [Phase 07]: Added catalog and csv sections to TranslationDict for gap components
- [Phase 07]: LOCATION_KEYS[v] ?? v fallback in FilterChips preserves user-created location names (D-06/D-07)
- [Phase 07]: cascade-delete runs inside the same transaction as medicine delete to prevent TOCTOU race
- [Phase 07]: LOCATION_KEYS[name] ?? name fallback preserves user-created location names verbatim
- [Phase 07]: Corrected useLang import path from nonexistent @/i18n/context to established @/i18n barrel in CSVColumnMapper (Rule 3 blocking-issue fix)
- [Phase 07]: form.savingGeneric introduced as distinct key from form.saving (Moving) to close WR-01 without meaning collision
- [Phase 07]: aria.removeFilter holds only leading verb; FilterChips concatenates with chip label at render time (07-09)
- [Phase 07]: Phase 07: aria.openFilters wired at medicines/index.tsx (WR-05); form.namePlaceholder reused (not duplicated) and wired at CatalogFields.tsx + MedicineForm.tsx (Gap 2) — closes final I18N-02 gaps
- [Phase 07]: Post-07-10 code review found 4 more gaps (a 4th, unplanned gap-closure cycle) — fixed via /gsd-code-review 07 --fix: MoveStockSheet raw unit string (WR-01), HistoryEntry raw field key + "[object Object]" stringify bug (WR-02), CSVColumnMapper/CSVPreview raw field identifiers (WR-03), and the highest-impact one — Zod validation schemas hardcoding English error messages (WR-04)
- [Phase 07]: Zod schemas converted to factories (`createCatalogSchema(t)`/`createStockSchema(t)`/`createMedicineSchema(t)`) wired via `useMemo(() => createXSchema(t), [t])` in all 6 consumers — module-scope schemas can't call the `t()` hook, so this pattern is required wherever form validation messages must be language-aware
- [Phase 07]: Phase 07 VERIFIED PASSED after 4th gap-closure cycle — I18N-01 through I18N-05 all satisfied; phase marked complete, transitioned to Phase 8
- [Phase 08]: [Phase 08]: db.version(6) upgrades hidden/order in place inside the versionchange tx (no second db.transaction() after .upgrade()); v5 stores() left byte-for-byte unchanged
- [Phase 08]: [Phase 08]: order field intentionally unindexed (matches packCount v5 precedent) — use toCollection().sortBy('order') not orderBy('order'), which requires an index and throws SchemaError
- [Phase 08]: [Phase 08]: renameLocation() drops isDefault guard (D-01); order:999 sentinel used on ad-hoc location adds until Plan 08-02 assigns real order on add
- [Phase 08]: [Phase 08] deleteLocationWithReassign replaces deleteLocation entirely (no isDefault guard, no min-location floor); LocationsScreen call site updated to deleteLocationWithReassign(id, null) as Rule 3 fix
- [Phase 08]: [Phase 08] addCustomLocation/renameLocation reject case-insensitive trimmed name collisions (D-03); order assigned as max(existing)+1 replacing the 999 sentinel
- [Phase 08]: [Phase 08] toggleLocationHidden and reorderLocations added; reorderLocations renumbers to contiguous 1..N via bulkUpdate, no-op on 0/1-element arrays (D-13, D-16)
- [Phase 08]: [Phase 08]: db.locations.toCollection().sortBy('order') used in all four remaining UI call sites (never orderBy('order'), which throws SchemaError on the intentionally-unindexed order field)
- [Phase 08]: [Phase 08]: BackupSchema/LegacyBackupSchema locations gain hidden/order as optional-with-default fields, matching the packCount backward-compat precedent

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260917-hx0 | Fix CSV import: add name/category column mapping and catalog dedup | 2026-09-17 | 30b14ca | [260917-hx0-fix-csv-import-add-name-category-column-](./quick/260917-hx0-fix-csv-import-add-name-category-column-/) |

## Operator Next Steps

- Plan Phase 8 with /gsd-plan-phase 8
