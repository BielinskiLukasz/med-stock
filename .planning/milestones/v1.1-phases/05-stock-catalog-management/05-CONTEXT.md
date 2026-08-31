# Phase 5: Stock & Catalog Management - Context

**Gathered:** 2026-07-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the flat medicines list/add/detail/edit with a two-layer catalog+stock model. Deliver: aggregate list view (one row per catalog entry with nearest-expiry status and total quantity), two-step add flow (catalog autocomplete → stock fields, with inline catalog creation), catalog detail screen (catalog header + all stock entries), bottom-sheet stock edit, inline catalog edit, and two stock actions — "Open box" (split 1 unit with openedDate) and "Move/Split" (general N-unit location split). Also includes db.version(4) schema migration to remove denormalized `name`/`category` from stock entries.

No backend. No new routes added — `/medicines/:id` uses catalogId, `/medicines/new` stays as the add route.

</domain>

<decisions>
## Implementation Decisions

### List View Query & Card

- **D-01:** List view uses **catalog-first join**: two separate `useLiveQuery` hooks — one for `medicine_catalog`, one for `medicines` (active stock entries). `useMemo` joins them to compute per-catalog aggregates: nearest-expiry status (from the stock entry with the soonest `expiryDate` among non-deleted stock for that catalog), and total quantity (sum of `quantity` across active stock).
- **D-02:** Aggregate `MedicineCard` shows: catalog name, `StatusBadge` (derived from nearest-expiry active stock), total quantity with unit (e.g. "20 tablets across 2 locations"). — **Reversibility:** reversible — card layout changes don't touch the data layer.
- **D-03:** All existing filter chips (category, location, status) are kept with adapted semantics: category filter applies to `medicine_catalog.category`; location filter means "catalog has at least one active stock entry in that location" (match-any semantics); status filter applies to the aggregate nearest-expiry status. `FilterBottomSheet` and `FilterChips` components are updated to reflect adapted logic.
- **D-04:** All existing sort options retained: name (sorts by `catalog.name`), expiry (sorts by nearest-expiry stock entry's `expiryDate`), category (sorts by `catalog.category`), status (sorts by aggregate status). No sort options removed.
- **D-05:** "No category" appears as a selectable option in the category filter chips (for catalog entries where `category` is null). Consistent with v1.0 behavior; migrated entries may have null category.

### Add Flow

- **D-06:** Add flow lives entirely within the single `/medicines/new` route as an **internal state machine** with three steps:
  1. `search` — catalog autocomplete (shows all entries on focus, filters as user types)
  2. `create-catalog` — inline catalog creation form (only shown when user selects "Create [name]" from dropdown)
  3. `stock-form` — stock entry fields (quantity, expiry, location, PAO, notes)
  
  The add route is NOT split into multiple routes. — **Reversibility:** reversible — state machine lives inside the route component.

- **D-07:** Catalog autocomplete **shows all catalog entries on focus** (before any typing). Filters by case-insensitive substring match as the user types. No "show after 1 char" delay.

- **D-08:** When the search input has a value but 0 matches, **"Create '[typed name]'"** appears automatically in the dropdown (no separate button). Selecting it advances to the `create-catalog` step with the typed name pre-filled.

- **D-09:** Inline catalog creation (step 2) requires **name + category** (both required); `form` field is optional. Users who skip `form` can set it later via CAT-03 edit on the detail screen.

- **D-10:** In the stock form step (step 3), a **back arrow** returns to the catalog search step (step 1). Any stock data already entered is discarded. A Cancel button exits to `/medicines`.

### Detail View & Editing

- **D-11:** `/medicines/:id` uses **catalogId** as `:id`. The detail screen loads a catalog entry by ID and lists all its active stock entries. Old links using stock entry IDs become stale after the schema v4 migration. — **Reversibility:** costly — all navigation links (list cards, Trash, ChangeHistory) must be updated to use catalogId.

- **D-12:** Trash item "View" link navigates to `/medicines/:catalogId` — the catalogId is read from the soft-deleted stock entry's `catalogId` field. The detail screen shows the catalog with its remaining active stock entries.

- **D-13:** Catalog edit (CAT-03) is **inline on the detail screen** — an edit icon on the catalog header opens an in-place edit or small bottom sheet with catalog fields (name, category, form, notes). No separate `/edit` route for catalog. — **Reversibility:** reversible.

- **D-14:** Stock entry edit (STOCK-02) is a **bottom sheet** triggered from the stock entry row's edit action. The sheet pre-fills quantity, expiryDate, location, PAO, and notes for that entry. Uses the existing `Sheet` component (`src/components/ui/sheet.tsx`). — **Reversibility:** reversible.

- **D-15:** Two distinct stock actions per stock entry row:
  - **"Open box"** — quick action: creates 1 new stock entry (quantity=1, openedDate=today, same catalogId and location as original) and decrements the original entry's quantity by 1. Primary use case: user has 20 sealed identical boxes; tapping "Open" produces one opened box and 19 remaining sealed boxes.
  - **"Move/Split"** — general action via bottom sheet: user picks N units (≤ original quantity) and a destination location; creates a new stock entry with that quantity at the target location; decrements original. — **Reversibility:** reversible.

### Schema Cleanup (db.version 4)

- **D-16:** Phase 5 adds **`db.version(4)`** in `src/lib/db.ts` that removes `name` and `category` from the `medicines` (stock entries) table schema. The upgrade pass does not need to modify existing row data — these fields are simply dropped from the index string and TypeScript interface. — **Reversibility:** one-way — needs a new db.version(5) migration to restore; all Phase 5 list/search code assumes name comes from `medicine_catalog`, never from stock entry.

- **D-17:** After schema v4, the `Medicine` interface contains only stock-specific fields: `id`, `catalogId`, `quantity`, `quantityUnit`, `expiryDate`, `openedDate`, `pao`, `location`, `manualStatus`, `notes`, `createdAt`, `updatedAt`, `deletedAt`. Fields `name` and `category` are removed from the interface.

- **D-18:** All `historyOps` callers in Phase 5 look up `catalog.name` from their local context and pass it as the explicit `medicineName` string parameter — consistent with D-06 from Phase 4. `historyOps.ts` never reads from `medicine_catalog` internally.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Success Criteria
- `.planning/REQUIREMENTS.md` — CAT-01–03, STOCK-01–04, FLOW-01–03 (10 requirements for this phase)
- `.planning/ROADMAP.md` — Phase 5 success criteria (10 items); Phase 5 "UI hint: yes"

### Data Layer (Phase 4 context)
- `src/lib/db.ts` — Current Dexie schema (v3), `MedicineCatalog` + `Medicine` interfaces, `MedicineForm` as-const type. Phase 5 adds `db.version(4)` here to remove `name`/`category` from `medicines`.
- `src/lib/historyOps.ts` — All 5 mutation functions with explicit `medicineName` parameter (D-06 from Phase 4). Phase 5 callers supply name from catalog context.
- `.planning/phases/04-database-migration-schema-v3/04-CONTEXT.md` — All Phase 4 decisions, especially D-06 (historyOps signatures), D-10 (MedicineForm as-const), D-11 (form: null for migrated entries).

### Existing UI Code (to be updated)
- `src/routes/medicines/index.tsx` — Current flat list view; replace with catalog-first join query and updated MedicineCard
- `src/routes/medicines/[id].tsx` — Current stock-entry detail; replace with catalog detail + stock list
- `src/routes/medicines/new.tsx` — Current single-step add form; replace with 3-step state machine
- `src/components/MedicineCard.tsx` — Update to show catalog name + aggregate quantity + nearest-expiry status
- `src/components/MedicineForm.tsx` — Decompose into CatalogFields + StockFields subcomponents (or replace with step-specific forms)
- `src/components/FilterBottomSheet.tsx` — Update location filter semantics (match-any across stock entries)
- `src/components/FilterChips.tsx` — Update to reflect adapted filter semantics

### Reusable UI Primitives
- `src/components/ui/sheet.tsx` — Sheet component for stock edit and move/split bottom sheets
- `src/components/StatusBadge.tsx` — Unchanged; called per catalog entry using nearest-expiry stock status
- `src/stores/uiStore.ts` — Zustand filter/sort state; filter semantics update required for location

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Sheet` (`src/components/ui/sheet.tsx`) — stock entry edit + Move/Split bottom sheets; already in use for FilterBottomSheet pattern
- `StatusBadge` (`src/components/StatusBadge.tsx`) — unchanged; caller computes nearest-expiry status across stock entries before passing to badge
- `calculateStatus()` (`src/lib/expiry.ts`) — operates on a single stock entry; caller must find the active stock entry with the soonest `expiryDate` and call `calculateStatus()` on it
- `locationOps.ts` — location CRUD helpers; used in stock add/edit forms for the location picker
- `AlertDialog` (`src/components/ui/alert-dialog.tsx`) — already used in detail view for soft-delete confirmation; can be reused for "Open box" confirmation if needed
- `sonner` toast — `toast.success()` / `toast.error()` for stock mutation feedback

### Established Patterns
- **Two-step query+memo**: `useLiveQuery` → reactive DB data → `useMemo` for filter/sort/aggregate. Do NOT call `calculateStatus()` inside `useLiveQuery` (CLAUDE.md invariant).
- **`null` is not a valid IndexedDB key** — never query `where('deletedAt').equals(null)`; use `.toCollection().filter(m => m.deletedAt === null)`.
- **`location: null` means "Other"** — never store the string 'Other' in `Medicine.location`.
- **`useShallow` for array selectors** from Zustand (Zustand v5 curried syntax).
- **All dates as `YYYY-MM-DD` strings** — `expiryDate`, `openedDate`, `createdAt`, `updatedAt` on new stock entries.
- **Named exports** — no default exports from components or lib modules.

### Integration Points
- `App.tsx` / `createHashRouter` — no new routes needed; `/medicines/:id` and `/medicines/new` are reused. The existing route config handles both.
- `src/lib/db.ts` — `db.version(4)` added here; `Medicine` interface updated (remove `name`, `category`)
- `src/routes/medicines/[id].edit.tsx` — currently edits a stock entry by its ID; after Phase 5, the edit route should redirect or be replaced (stock editing moves to bottom sheet). Evaluate whether to keep this route.

</code_context>

<specifics>
## Specific Ideas

- **"Open box" primary use case**: user stores 20 identical sealed boxes as one stock entry (quantity=20). Tapping "Open" produces: new entry (qty=1, openedDate=today, same catalog+location) + original decremented to qty=19. This is the dominant real-world split scenario.
- **Catalog autocomplete on focus**: show all entries immediately, no "type first" gate — important for browsability when the user can't recall the exact name.
- **Aggregate quantity display**: "20 tablets" when all stock is one unit type; "across 2 locations" suffix when stock entries span multiple locations. Shows the total at a glance.
- **db.version(4) minimal migration**: no row data modification needed — just drop `name`/`category` from the schema string and TypeScript interface. Dexie ignores unknown fields on existing rows; they simply become inaccessible.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 5-Stock & Catalog Management*
*Context gathered: 2026-07-30*
