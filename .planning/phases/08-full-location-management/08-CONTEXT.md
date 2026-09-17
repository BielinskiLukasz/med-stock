# Phase 8: Full Location Management - Context

**Gathered:** 2026-09-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Users get full control over all locations in the `locations` table — predefined and custom alike: rename any of them, hide any of them from the Add/Edit dropdowns, delete any of them (with a reassign-or-clear safety flow when medicines still reference it), and drag/reorder the full list, with the order persisting and driving dropdown display order everywhere. Covers LOC-01 through LOC-04.

</domain>

<decisions>
## Implementation Decisions

### Rename (LOC-01)
- **D-01:** `isDefault` no longer blocks rename — `renameLocation()` in `src/lib/locationOps.ts` drops the `if (loc.isDefault) throw ...` guard. Predefined locations become renamable exactly like custom ones.
- **D-02:** Once a predefined location is renamed, it stops resolving through `LOCATION_KEYS` (the rename no longer matches the original English key string) and displays as a plain stored string in both languages from then on — same behavior custom locations already have. No new i18n override mechanism is introduced. — **Reversibility:** one-way — once renamed, the original predefined name string is gone from that record; there's no "revert to predefined translation" path without the user retyping the exact original name.
- **D-03:** Rename and add are blocked on a case-insensitive, trimmed name collision with any other existing location — prevents two rows both displaying e.g. "Pantry".
- **D-04:** Location names are stored exactly as typed (trimmed only) — no title-casing transformation on save, unlike the medicine catalog's D-02 title-case convention.

### Hide (LOC-02)
- **D-05:** Hide/show is a `hidden: boolean` field on `Location`, available on ALL locations (predefined and custom) — not gated by `isDefault`. One consistent toggle, no branching by location type.
- **D-06:** Hidden locations are excluded from: the Add/Edit form dropdowns (`MedicineForm.tsx`, `StockFields.tsx`) AND the Move/Split Stock sheet dropdown (`MoveStockSheet.tsx`) — anywhere the user is assigning a location to stock.
- **D-07:** Hidden locations remain visible in the Filter sheet (`FilterBottomSheet.tsx`) — existing stock already sitting in a hidden location must stay findable/filterable.
- **D-08:** On the Locations management screen itself, hidden rows stay inline in the same list (not a separate section), shown visually muted/grayed with a "Hidden" indicator and a button to show them again.

### Delete (LOC-03)
- **D-09:** Deleting a location that has referencing **active** (non-soft-deleted) stock entries opens a dialog showing the affected count plus a picker: reassign all of them to another location, or clear them (set `location: null`, displayed as "Other"). One confirm applies the bulk update and the delete atomically, inside a single `db.transaction()` (same pattern as the existing `renameLocation`/`deleteLocation` transactions in `locationOps.ts`).
- **D-10:** The reference count/reassignment only considers active stock (`deletedAt === null`). Soft-deleted (Trash) entries keep their old location string untouched — they're out of the active workflow already.
- **D-11:** A location with zero active references still gets a confirm dialog before deleting (simpler copy, no reassign picker needed) — deletion is never silent/instant.
- **D-12:** No minimum-location floor. A user can delete every location down to zero; "No location" (Other/`null`) is a built-in form option independent of the `locations` table, so an empty table doesn't break any dropdown.

### Reorder (LOC-04)
- **D-13:** Add an `order: number` field to `Location` (new `db.version(6)` — never modify version 5). On upgrade, existing locations get `order` assigned to match their current alphabetical (`orderBy('name')`) display order, so the upgrade is visually silent until the user actually reorders something.
- **D-14:** Reorder UI provides both a drag handle (drag-and-drop) AND small up/down move buttons per row — the buttons give a reliable, precise, and naturally keyboard/screen-reader-accessible fallback to touch dragging. No drag/sortable library exists in the repo yet (checked `package.json`) — the planner/researcher should pick one appropriate for a mobile-first PWA list.
- **D-15:** Hidden locations stay reorderable in the management list (grayed out but still draggable/movable) so their relative order is preserved for whenever they're shown again.
- **D-16:** "Other" (`null` location) is not a real `Location` record and has no row in the management list — it gets a fixed position, always last, in every dropdown that shows it, below all real (reorderable) locations.
- **D-17:** All six current `db.locations.orderBy('name')` call sites (`LocationsScreen`, `FilterBottomSheet`, `MedicineForm`, `StockFields`, `MoveStockSheet`, and the `Location` type export site if applicable) must switch to ordering by the new `order` field.

### Claude's Discretion
- Exact drag/sortable library choice for D-14 (e.g. `@dnd-kit`, native HTML5 DnD, or a simpler custom pointer-based implementation) — left to the researcher/planner to evaluate for bundle size and touch reliability.
- Exact UI treatment of the "Hidden" badge/indicator and up/down button icons — visual details, not a decision the user needs to lock.
- Renumbering strategy for the `order` field on reorder (contiguous integers reassigned on every move, vs. sparse/fractional ordering) — implementation detail.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements
- `.planning/ROADMAP.md` (Phase 8 section, "Full Location Management") — goal, success criteria, LOC-01–04 requirement IDs
- `.planning/REQUIREMENTS.md` (LOC-01 through LOC-04 entries) — exact requirement wording

### Data layer
- `src/lib/db.ts` — `Location` interface, `db.version(5)` (current schema), `db.on('populate')` seed list of 7 predefined locations. New schema must add `db.version(6)` with `hidden` and `order` fields plus an `.upgrade()` migration — never edit version 5 in place.
- `src/lib/locationOps.ts` — `addCustomLocation`, `renameLocation`, `deleteLocation`. Current `isDefault` guards in rename/delete must be removed; delete needs a new reassign-or-clear parameter/flow; add needs the case-insensitive collision check (D-03).

### UI call sites needing the `order` field + hidden-filtering updates
- `src/routes/locations/index.tsx` — the Locations management screen (rename/delete UI already lives here; needs hide toggle + reorder UI added)
- `src/components/FilterBottomSheet.tsx` — location filter list (keeps hidden locations, D-07)
- `src/components/MedicineForm.tsx`, `src/components/StockFields.tsx` — Add/Edit location dropdowns (exclude hidden, D-06)
- `src/components/MoveStockSheet.tsx` — Move/Split location dropdown (exclude hidden, D-06)

### i18n
- `src/i18n/types.ts` — `LOCATION_KEYS` map (predefined name → translation key). Renamed locations naturally fall out of this map (D-02) — no changes needed to the map itself, just confirm the `LOCATION_KEYS[name] ?? name` fallback pattern (already used everywhere) continues to cover renamed/custom locations correctly.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `db.transaction('rw', db.locations, db.medicines, async () => {...})` pattern from `renameLocation`/`deleteLocation` — the delete-with-reassign flow (D-09) should follow this same atomic transaction shape, just with an added bulk `.modify()` for reassignment before the `.delete()`.
- `AlertDialog` (shadcn/ui, `src/components/ui/alert-dialog.tsx`) already used for delete confirmation in `LocationsScreen` — extend its body to add the reassign/clear picker rather than introducing a new dialog primitive.
- `LOCATION_KEYS[loc.name] ?? loc.name` fallback pattern — already used consistently across `LocationsScreen`, `FilterBottomSheet`, `FilterChips`, `MedicineCard`, `MedicineForm`, `MoveStockSheet`, `StockFields`, `medicines/[id].tsx`, `trash/index.tsx`. No new pattern needed for display; D-02's rename tradeoff is already handled by this existing fallback.

### Established Patterns
- `db.version(N).stores({...}).upgrade(tx => ...)` — every schema change so far (v2 through v5) follows additive-only migration with an explicit `.upgrade()` callback; v6 must follow the same shape (see D-13).
- Six separate `useLiveQuery(() => db.locations.orderBy('name').toArray(), [])` call sites currently duplicate the same query — switching all six to `order` (D-17) is mechanical but must not be missed at any site (same "repo-wide grep, not enumerated list" lesson learned in Phase 7 — grep for `orderBy('name')` scoped to `db.locations` as an acceptance check).

### Integration Points
- `Medicine.location: string | null` is a raw string, not a foreign key — deleting/renaming a `Location` row never cascades automatically to `Medicine` records. Both `renameLocation` (bulk-updates the string) and the new delete-with-reassign flow (D-09) must do this bulk update explicitly, matching the existing rename pattern.
- CSV import / JSON export (`src/lib/dataOps.ts`, `src/lib/csvOps.ts`) touch `db.locations` for backup/restore — the new `hidden`/`order` fields will need to round-trip through `BackupSchema` (Zod) export/import without breaking existing backups (backward-compat, same pattern as prior schema additions like `packCount` in v5).

</code_context>

<specifics>
## Specific Ideas

No specific visual/UX references beyond what's captured in Decisions above — the discussion focused entirely on behavior and data-flow tradeoffs (delete safety, hide scope, reorder UI, rename/i18n interaction).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

### Reviewed Todos (not folded)
None — `todo.match-phase 8` returned zero matches.

</deferred>

---

*Phase: 8-full-location-management*
*Context gathered: 2026-09-17*
