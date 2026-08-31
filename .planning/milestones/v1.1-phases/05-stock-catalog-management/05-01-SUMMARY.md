---
phase: 05
plan: 01
status: complete
completed_at: "2026-07-30"
commits:
  - 04ed54c  # feat(db): Schema v4 — remove name/category from Medicine, cascade fixes
  - 6a1b415  # feat(medicines): Detail view loads by catalogId with stock aggregation
---

# 05-01 Summary — Schema v4 + Detail View Tracer Slice

## Outcome

Both tasks complete. Build passes with 0 TypeScript errors. All 72 tests pass.

## Task 1: Schema v4

- `db.version(4).stores()` added after v3 — removes `name` and `category` from medicines index
- `Medicine` interface: `name` and `category` fields removed entirely
- `MedicineCatalog` interface: unchanged (still owns name, category, form, notes)
- Version chain: 1 → 2 → 3 → 4 (no row migration needed — Dexie ignores removed index fields)
- Cascade fixes applied to: `historyOps.ts` (TRACKED_FIELDS), `csvOps.ts` (MEDICINE_FIELDS), `dataOps.ts` (BackupSchema)

## Task 2: Detail View

- `src/routes/medicines/[id].tsx`: rewritten to catalog-first
  - `:id` param is now `catalogId` (D-11)
  - Loads `catalog` via `db.medicine_catalog.get(catalogId)`
  - Loads active stock via `db.medicines.where('catalogId').equals(catalogId).filter(m => m.deletedAt === null)`
  - Nearest-expiry computed via `useMemo` (lexicographic string comparison)
  - Status derived from `calculateStatus(nearestExpiryStock)` at render time (never stored — D-12)
- `src/routes/medicines/index.tsx`: catalog-first join, useMemo returns aggregate chain
- `src/routes/medicines/[id].edit.tsx`: loads catalog by `medicine.catalogId`; name/category from catalog, not stock entry
- `src/components/MedicineCard.tsx`, `new.tsx`, `trash/index.tsx`: updated for catalog+stock arch

## Key Decisions

- `BackupSchema.medicine_catalog` made optional (`.optional().default([])`) for backward compat with v1/v2 backup files
- `BackupSchema.medicines[].catalogId` made optional (`.default(0)`) for v1/v2 import compat
- Migration tests use `as any` cast when seeding legacy data with `name`/`category` fields

## Patterns Established

| Pattern | Location |
|---------|----------|
| Catalog-first query: `db.medicine_catalog.get(catalogId)` | `[id].tsx:14` |
| Stock filter: `.where('catalogId').equals(id).filter(m => m.deletedAt === null)` | `[id].tsx:18-23` |
| Nearest-expiry: `useMemo` lexicographic reduce over `expiryDate` strings | `[id].tsx:27-34` |
| Status at render: `calculateStatus(nearestExpiryStock)` — never in DB | `[id].tsx:58` |
| Catalog-stock join: `useMemo` map/filter/sort chain in `index.tsx` | `index.tsx:46-132` |
