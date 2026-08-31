# Milestones

## v1.1 Catalog + Stock Model (Shipped: 2026-08-31)

**Phases completed:** 3 phases, 17 plans, 7 tasks

**Key accomplishments:**

- v2→v3 migration schema with medicine_catalog table, deduplication, and category conflict resolution
- Explicit medicineName parameter added to all 5 mutation functions; historyOps decoupled from medicine object for Phase 5 callers
- Closed four UAT gaps — open box guard, change history render, status match-any filter, and move sheet location pre-fill.
- Rewrote `computeCatalogAggregate` with PRIORITY map (Expired=4, ExceededOpenPeriod=3, Opened=2, Active=1) and MANUAL_STATUSES exclusion set, replacing the nearest-expiry proxy.
- packCount field (boxes/packs count) added to Medicine interface via db.version(5) migration, Zod schema, and all stock add/edit form touchpoints.
- Pack-level "Open box" split via packCount branch in handleOpenBoxClick, and aggregate totalQty now reflects (packCount ?? 1) × quantity per stock entry
- filteredStockEntries useMemo added to MedicineDetail — detail view stock list now respects active status and location filters from Zustand UIStore
- Pure dedup utility for legacy medicine-to-catalog inference using title-case, most-common-category, and lowest-id tie-break.
- End-to-end backup/restore pipeline with schemaVersion stamping, two-pass Zod detection for old/new formats, and branched toast messages for legacy imports.

---
