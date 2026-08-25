# Roadmap: MedStock

## Milestones

- **[v1.0 — PWA Foundation, Inventory, Search, Data Sync](milestones/v1.0-ROADMAP.md)** — Shipped 2026-07-13 · 33/35 requirements · 3 phases · 12 plans · 121 commits

---

# Roadmap: MedStock v1.1 — Catalog + Stock Model

**Version**: v1.1  
**Milestone**: Catalog + Stock Model  
**Status**: Planning  
**Started**: 2026-07-28

## Overview

MedStock v1.1 replaces the flat medicines table with a two-layer model: `medicine_catalog` (reusable templates) and `medicines` (stock entries). Users stop re-entering medicine details when adding new boxes and can track quantities split across multiple locations.

**Phases**: 3 (continuing from v1.0 Phase 3)  
**Granularity**: Coarse  
**Total Requirements**: 15

---

## Phases

- [x] **Phase 4: Database Migration & Schema v3** - Dexie schema redesign with catalog + stock tables, automatic data migration, updated mutation layer (completed 2026-07-29)
- [ ] **Phase 5: Stock & Catalog Management** - CRUD for stock entries and catalog entries, aggregated list view, detail view, two-step add flow
- [ ] **Phase 6: Backup & Restore** - JSON export/import for new schema, backward compatibility with pre-v1.1 backups

---

## Phase Details

### Phase 4: Database Migration & Schema v3

**Goal**: Establish the new two-layer data model — `medicine_catalog` (reusable templates) and `medicines` (stock entries) — and automatically migrate existing v1.0 data without data loss.

**Depends on**: Nothing (first phase of v1.1)

**Requirements**: MIGR-01, MIGR-02

**Success Criteria** (what must be TRUE when phase completes):

1. Dexie schema v3 is defined with `medicine_catalog` table (id, name, category, form, notes, createdAt, updatedAt) and updated `medicines` table (id, catalogId FK, quantity, quantityUnit, expiryDate, openedDate, pao, location, manualStatus, notes, createdAt, updatedAt, deletedAt)
2. On first open after upgrade, all existing v1.0 medicines are migrated — each unique medicine name becomes one catalog entry; each existing medicine row becomes one stock entry linked by catalogId
3. Migration deduplicates by case-insensitive + trimmed name match — multiple v1.0 rows with the same normalized name produce a single catalog entry, with all stock instances preserved
4. HistoryOps.ts updated to accept explicit medicineName parameter (Phase 5 callers provide name from catalog context)
5. TypeScript interfaces (MedicineCatalog, Medicine) updated to match new schema; no `any` types in schema-related code

**Plans**: 2/2 plans complete

Plans:

- [x] 04-01-PLAN.md — End-to-end v2→v3 migration tracer with deduplication + MedicineCatalog interface
- [x] 04-02-PLAN.md — Update historyOps mutation signatures for Phase 5 callers

**UI hint**: no

---

### Phase 5: Stock & Catalog Management

**Goal**: Users can add stock entries linked to existing or newly-created catalog entries, view and edit both catalog and stock fields, split stock across locations, and see medicines aggregated by catalog in the main list and detail views.

**Depends on**: Phase 4

**Requirements**: CAT-01, CAT-02, CAT-03, STOCK-01, STOCK-02, STOCK-03, STOCK-04, FLOW-01, FLOW-02, FLOW-03

**Success Criteria** (what must be TRUE when phase completes):

1. User can search for an existing catalog entry by name via autocomplete when starting the add flow; matching is case-insensitive
2. User can create a new catalog entry (name, category, form) inline during the add flow when no autocomplete match exists
3. User can edit a catalog entry's name, category, and form from the medicine detail screen (affects all stock entries linked to that catalog)
4. Medicines list shows one aggregate row per catalog entry, with status derived from the nearest-expiry active stock entry; count badge shows total quantity
5. Detail screen lists all stock entries for one catalog entry, each showing quantity, expiryDate, location, and calculated status
6. User can add a stock entry (quantity, expiry date, location, optional PAO/notes) linked to a catalog entry via the two-step add flow (catalog autocomplete → stock fields)
7. User can edit a stock entry's quantity, expiryDate, location, PAO, and notes without affecting the catalog
8. User can move N units from one stock entry to a different location, splitting into two stock entries (original decremented, new entry created)
9. Soft-deleted stock entries appear in Trash and can be restored with full history preserved
10. Adding, editing, moving, and deleting stock entries record history with catalogId context so changes are auditable

**Plans**: 7/11 plans executed

Wave execution order (each wave parallelizable within):

- **Wave 1** (start here):
  - [x] 05-01-PLAN.md — Tracer: Schema v4 migration + catalog detail view (catalogId-based load, stock list with nearest-expiry status) `[reversibility checkpoint: D-16 one-way, D-11 costly]`
  - [x] 05-02-PLAN.md — TDD: Catalog-first aggregation (nearest-expiry selection + quantity summation) `[depends: 05-01]`
- **Wave 2** (after Wave 1):
  - [x] 05-03-PLAN.md — List view catalog-first join with aggregate card, component decomposition (CatalogFields, StockFields) `[depends: 05-01, 05-02]`
  - [x] 05-04-PLAN.md — TDD: Stock mutations (add, edit, soft-delete, move/split with atomic history recording) `[depends: 05-01]`
- **Wave 3** (after Wave 2):
  - [x] 05-05-PLAN.md — Add flow 3-step state machine (CatalogAutocomplete → create catalog → stock form) `[depends: 05-01, 05-03, 05-04]`
  - [ ] 05-06-PLAN.md — Detail view completion: edit sheets (CatalogEditSheet, StockEditSheet, MoveStockSheet), stock actions (Open box, Move/Split, soft-delete), Trash "View" link fix (D-12) `[depends: 05-01, 05-03, 05-04, 05-05]`

Gap closure plans (after UAT — 8 gaps found):

- **GAP Wave 1** (parallel, no shared files):
  - [x] 05-07-PLAN.md — Simple UI fixes: Open box guard (G-05-1), status filter match-any (G-05-5), ChangeHistory render (G-05-6), MoveStockSheet prefill (G-05-7)
  - [x] 05-08-PLAN.md — TDD: Aggregation priority-reduce rewrite (G-05-4)
  - [ ] 05-09-PLAN.md — packCount schema migration + form fields (G-05-2 schema half)
- **GAP Wave 2** (after GAP Wave 1):
  - [ ] 05-10-PLAN.md — Open box pack-level split + aggregate display (G-05-3, G-05-2 display) `[depends: 05-07, 05-08, 05-09]`
- **GAP Wave 3** (after GAP Wave 2):
  - [ ] 05-11-PLAN.md — Catalog delete: deleteCatalogEntry + UI AlertDialog (G-05-8) `[depends: 05-10]`

**UI hint**: yes

---

### Phase 6: Backup & Restore

**Goal**: Users can export and import household inventories in the new catalog + stock format; existing pre-v1.1 backups import gracefully without data loss.

**Depends on**: Phase 5

**Requirements**: DATA-01, DATA-02, DATA-03

**Success Criteria** (what must be TRUE when phase completes):

1. JSON export includes medicine_catalog table alongside stock entries with catalogId references
2. JSON import of new-format backup (v1.1+) restores both catalog entries and stock entries correctly in a single transaction
3. JSON import of old-format backup (pre-v1.1, no catalog table) migrates gracefully by inferring catalog entries from stock name/category fields using the same deduplication logic as the v4 migration
4. After import, all stock entries link to inferred/restored catalog entries with no orphaned records

**Plans**: TBD

**UI hint**: no

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 4. Database Migration & Schema v3 | 2/2 | Complete    | 2026-07-29 |
| 5. Stock & Catalog Management | 7/11 | In Progress|  |
| 6. Backup & Restore | 0/TBD | Pending | - |

---

## Coverage

✓ **15/15 v1.1 requirements mapped**

| Requirement | Phase | Category |
|-------------|-------|----------|
| MIGR-01 | 4 | Migration |
| MIGR-02 | 4 | Migration |
| CAT-01 | 5 | Catalog |
| CAT-02 | 5 | Catalog |
| CAT-03 | 5 | Catalog |
| STOCK-01 | 5 | Stock |
| STOCK-02 | 5 | Stock |
| STOCK-03 | 5 | Stock |
| STOCK-04 | 5 | Stock |
| FLOW-01 | 5 | UI Flows |
| FLOW-02 | 5 | UI Flows |
| FLOW-03 | 5 | UI Flows |
| DATA-01 | 6 | Backup |
| DATA-02 | 6 | Backup |
| DATA-03 | 6 | Backup |

---

*Roadmap created: 2026-07-28 by gsd-roadmapper*
