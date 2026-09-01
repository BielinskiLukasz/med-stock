# Roadmap: MedStock

## Milestones

- ✅ **v1.0 — PWA Foundation, Inventory, Search, Data Sync** — Phases 1-3 (shipped 2026-07-13)
- ✅ **v1.1 — Catalog + Stock Model** — Phases 4-6 (shipped 2026-08-31)
- 🔜 **v1.2 — Polish, UX & i18n** — Phases 7-11 (planned)

## Phases

<details>
<summary>✅ v1.0 — PWA Foundation, Inventory, Search, Data Sync (Phases 1-3) — SHIPPED 2026-07-13</summary>

- [x] Phase 1: PWA Foundation & Inventory CRUD (5/5 plans) — completed 2026-06-30
- [x] Phase 2: Search, Dashboard & Audit (4/4 plans) — completed 2026-06-30
- [x] Phase 3: Data & Household Sync (3/3 plans) — completed 2026-07-13

Details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v1.1 — Catalog + Stock Model (Phases 4-6) — SHIPPED 2026-08-31</summary>

- [x] Phase 4: Database Migration & Schema v3 (2/2 plans) — completed 2026-07-29
- [x] Phase 5: Stock & Catalog Management (13/13 plans) — completed 2026-08-31
- [x] Phase 6: Backup & Restore (2/2 plans) — completed 2026-08-31

Details: [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md)

</details>

## Active Milestone — v1.2: Polish, UX & i18n

- [ ] **Phase 7: i18n / Polish Language** - Add Polish/English language switching with full string coverage and locale-aware dates
- [ ] **Phase 8: Full Location Management** - Make all locations (including predefined) fully editable, hideable, deleteable, and reorderable
- [ ] **Phase 9: CSV UX + Version Display** - Auto-map CSV headers, clarify column labels, show app version
- [ ] **Phase 10: Expiring Soon Status** - Add configurable early-warning status between Opened and Expired
- [ ] **Phase 11: UX Polish — Autocomplete + Pack Count** - Catalog name autocomplete and smarter pack count display

## Phase Details

### Phase 7: i18n / Polish Language

**Goal**: Users can switch between English and Polish; all text displays in the chosen language with locale-aware formatting
**Depends on**: Phase 6
**Requirements**: I18N-01, I18N-02, I18N-03, I18N-04, I18N-05
**Success Criteria** (what must be TRUE):

  1. User can toggle between English and Polish using a persistent language switch control visible from any screen
  2. All labels, placeholders, toasts, error messages, status names, and screen titles switch to the selected language immediately without a full page reload
  3. On next app load, the previously selected language is automatically applied — choice persists in localStorage across sessions
  4. Built-in category names and predefined location names display in the active language; stored database values remain unchanged
  5. Dates appear as DD.MM.YYYY in Polish mode and YYYY-MM-DD in English mode throughout the app

**Plans**: 6/6 plans executed

Plans:
**Wave 1**

- [x] 07-01-PLAN.md — i18n module, LanguageProvider, useLang, formatDate, App.tsx wrapping, BottomTabBar toggle (Wave 1)
- [x] 07-05-PLAN.md — Gap closure: extend i18n dictionary (LOCATION_KEYS, form.*, catalog.*, data.sync*, csv.*, toasts) (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 07-02-PLAN.md — Remove STATUS_LABELS, translate StatusBadge, FilterChips, FilterBottomSheet, MedicineCard, MedicineCardAggregate (Wave 2)
- [x] 07-03-PLAN.md — Translate form components, sheets, ChangeHistory, HistoryEntry (Wave 2)
- [x] 07-04-PLAN.md — Translate all route screens and remaining utility components (Wave 2)
- [x] 07-06-PLAN.md — Gap closure: wire FilterChips, MedicineCard, MoveStockSheet, CatalogAutocomplete, SyncInstructions, CSVPreview, ExportSection, ImportCSVSection (Wave 2)

**UI hint**: yes

### Phase 8: Full Location Management

**Goal**: Users can fully control all locations — rename, hide, delete, and reorder including predefined ones
**Depends on**: Phase 7
**Requirements**: LOC-01, LOC-02, LOC-03, LOC-04
**Success Criteria** (what must be TRUE):

  1. User can rename any location from the Locations screen, including predefined locations such as "Bathroom"
  2. User can hide any predefined location; hidden locations no longer appear in add/edit form dropdowns
  3. User can delete any location; if medicines reference it, a warning prompts the user to reassign or clear those references before deletion proceeds
  4. User can drag locations into a new order; the order persists across sessions and is reflected in form dropdowns

**Plans**: TBD
**UI hint**: yes

### Phase 9: CSV UX + Version Display

**Goal**: CSV import is clearer to use and the app version is visible in the UI
**Depends on**: Phase 7
**Requirements**: CSV-01, CSV-02, UX-01
**Success Criteria** (what must be TRUE):

  1. When a CSV column header matches an app field name (case-insensitive), the mapping dropdown pre-selects that field automatically without user action
  2. The column mapping table shows "Your file column" and "App field" header labels that clearly distinguish source from target
  3. The app version number (from package.json) is visible on the Data tab or an About section without opening any additional screen

**Plans**: TBD
**UI hint**: yes

### Phase 10: Expiring Soon Status

**Goal**: Users see an early warning before medicines expire, with a configurable lead time
**Depends on**: Phase 7
**Requirements**: STAT-01, STAT-02, STAT-03, STAT-04
**Success Criteria** (what must be TRUE):

  1. A medicine whose expiry date falls within the warning window (default 7 days) shows "Expiring Soon" status in the list row and detail view
  2. A medicine whose PAO end date (openedDate + PAO days) falls within the warning window also shows "Expiring Soon"
  3. "Expiring Soon" ranks between "Opened" and "Expired"/"ExceededOpenPeriod" in priority-reduce logic and propagates correctly to catalog aggregate rows
  4. User can change the warning window (e.g., from 7 to 14 days) in settings; the new value persists across sessions and immediately recomputes visible statuses

**Plans**: TBD
**UI hint**: yes

### Phase 11: UX Polish — Autocomplete + Pack Count

**Goal**: Adding medicines is faster via catalog autocomplete, and quantity display is unambiguous for single vs multi-pack entries
**Depends on**: Phase 7
**Requirements**: UX-02, UX-03, UX-04, UX-05
**Success Criteria** (what must be TRUE):

  1. The medicine name field in the add/edit form suggests matching names from existing catalog entries as the user types (case-insensitive, including entries in Trash)
  2. A stock entry with pack count empty or equal to 1 shows only the quantity (e.g., "20 tablets") — no box-count prefix appears anywhere
  3. A stock entry with pack count ≥ 2 shows "N boxes × qty" in list rows, stock cards, and the form quantity label
  4. The pack count field in add/edit form displays a placeholder or helper label communicating that leaving it empty means 1 box

**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 7. i18n / Polish Language | 6/6 | In Progress|  |
| 8. Full Location Management | 0/? | Not started | - |
| 9. CSV UX + Version Display | 0/? | Not started | - |
| 10. Expiring Soon Status | 0/? | Not started | - |
| 11. UX Polish — Autocomplete + Pack Count | 0/? | Not started | - |
