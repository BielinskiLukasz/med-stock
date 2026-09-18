---
phase: 08-full-location-management
reviewed: 2026-09-18T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - package.json
  - package-lock.json
  - src/components/FilterBottomSheet.tsx
  - src/components/MedicineForm.tsx
  - src/components/MoveStockSheet.tsx
  - src/components/SortableLocationList.tsx
  - src/components/StockFields.tsx
  - src/i18n/en.ts
  - src/i18n/pl.ts
  - src/i18n/types.ts
  - src/lib/dataOps.test.ts
  - src/lib/dataOps.ts
  - src/lib/db.test.ts
  - src/lib/db.ts
  - src/lib/locationOps.ts
  - src/routes/locations/index.tsx
findings:
  critical: 0
  warning: 6
  info: 3
  total: 9
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-09-18T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This phase adds full location management: hide/show, drag/keyboard reordering, rename of
predefined locations, delete-with-reassign, a `db.version(6)` migration for `hidden`/`order`,
and matching JSON-backup schema changes. The core transactional operations
(`deleteLocationWithReassign`, `reorderLocations`, the `db.version(6)` upgrade) are correctly
wrapped and well covered by `db.test.ts`. No hardcoded secrets, no `eval`/`innerHTML`, no `any`,
and no empty catch blocks were found.

The issues found are all **Warning** or **Info** tier — no crash, security, or data-loss
defect was identified. The most notable theme is that the new "hidden location" and
"quick-add location" features were wired into three near-duplicate call sites
(`MedicineForm.tsx`, `StockFields.tsx`, `MoveStockSheet.tsx`) inconsistently, and a couple of
the new `locationOps.ts` write paths are not atomic with their own validation checks.

## Warnings

### WR-01: Hidden-location filter can hide a stock entry's own current location from its Select

**File:** `src/components/MedicineForm.tsx:79-82`, `src/components/StockFields.tsx:61-64`, `src/components/MoveStockSheet.tsx:57-60`
**Issue:** All three location dropdowns now filter out hidden locations (`locs.filter((l) => !l.hidden)`, per D-06 "never assignable via this dropdown"). But the *current* value being edited/moved (`defaultValues.location` in the edit flow, or `stock.location` in `MoveStockSheet`) is not exempted from this filter. If a location is hidden after a stock entry was assigned to it, the Select's controlled `value` will point at a location name that has no matching `SelectItem` in `SelectContent`. Radix's `SelectValue` then falls back to the placeholder text ("No location") instead of showing the real value — the field silently *looks* unset even though `field.value`/`targetLocation` still holds the real (hidden) location name. A user editing that stock and saving without touching the field is fine (value unchanged), but the visual state is misleading and can lead a user to believe "location" needs setting when it doesn't, or to unknowingly leave stock parked in a hidden location because they can't see it's still assigned there.
**Fix:** Always include the currently-assigned location in the option list even if hidden (e.g. mark it visually as hidden/disabled instead of omitting it):
```tsx
const locations = useLiveQuery(
  () => db.locations.toCollection().sortBy('order').then((locs) =>
    locs.filter((l) => !l.hidden || l.name === field.value)
  ),
  [field.value],
)
```

### WR-02: `addCustomLocation`/`renameLocation` collision checks are not atomic with the write

**File:** `src/lib/locationOps.ts:3-19` (`addCustomLocation`), `src/lib/locationOps.ts:22-38` (`renameLocation`)
**Issue:** The D-03 case-insensitive uniqueness check (`db.locations.toCollection().filter(...).first()`) and, for `addCustomLocation`, the `order` max-lookup, run in separate implicit transactions from the subsequent `db.locations.add(...)` / `db.locations.update(...)`. Two near-simultaneous calls (e.g. a user pressing Enter and then clicking "Add" before the first request resolves — neither `MedicineForm.tsx`, `StockFields.tsx`, nor `routes/locations/index.tsx` disables the input/button while the add is in flight, cf. `handleAddLocation` in `StockFields.tsx:66-82` and `handleAdd` in `routes/locations/index.tsx:63-77`) can both pass the collision check before either commits, producing two `Location` rows whose names differ only by case — violating the documented D-03 invariant — and/or two rows with the same `order` value.
**Fix:** Wrap the check-then-write in a single `db.transaction('rw', db.locations, async () => {...})` so the collision check and the insert/update are atomic, and disable the Add button while the request is pending:
```ts
export async function addCustomLocation(name: string): Promise<number> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Location name cannot be empty')
  return db.transaction('rw', db.locations, async () => {
    const collision = await db.locations
      .toCollection()
      .filter(loc => loc.name.toLowerCase() === trimmed.toLowerCase())
      .first()
    if (collision) throw new Error('Location name already exists')
    const sorted = await db.locations.toCollection().sortBy('order')
    const nextOrder = (sorted.at(-1)?.order ?? 0) + 1
    return db.locations.add({ name: trimmed, isDefault: false, hidden: false, order: nextOrder })
  })
}
```

### WR-03: Ad-hoc `'Other'` name filter is inconsistent across the three location dropdowns and unenforced elsewhere

**File:** `src/components/MoveStockSheet.tsx:152-158`, `src/components/StockFields.tsx:129-135`
**Issue:** `MoveStockSheet` and `StockFields` both filter `locations?.filter(loc => loc.name !== 'Other')` before rendering `SelectItem`s, but `MedicineForm.tsx:215-219` renders the exact same list without that filter, and `addCustomLocation`/`renameLocation` in `locationOps.ts` have no reserved-name guard preventing a user from naming a custom location literally `"Other"` (the project's own invariant only reserves the *sentinel* `null`, not the string). If a user creates a location named "Other", it becomes selectable when adding/editing via `MedicineForm`, but permanently unreachable as a move target in `MoveStockSheet` and unreachable when editing stock via `StockFields` — an inconsistent, confusing dead end for that one location.
**Fix:** Either reserve the literal name `"Other"` in `addCustomLocation`/`renameLocation` (reject it like any other collision), or drop the now-unnecessary string filter in `MoveStockSheet`/`StockFields` since `location: null` is the actual "Other" sentinel and no `Location` row is ever named `'Other'` by the seed data.

### WR-04: Several async handlers in `LocationsScreen` have no error handling, unlike their siblings

**File:** `src/routes/locations/index.tsx:111-120` (`handleDeleteDialogOpenChange`), `:145-158` (`handleReorder`, `handleMove`)
**Issue:** `handleAdd`, `handleRename`, `handleToggleHidden`, `handleDelete`, and `handleReassignDelete` all wrap their DB calls in `try/catch` and surface `setError(...)` on failure. `handleDeleteDialogOpenChange`, `handleReorder`, and `handleMove` do not. Since these are invoked from `onOpenChange`, `onDragEnd`, and `onClick` without the caller awaiting/catching the returned promise, a thrown error (e.g. from `countActiveLocationReferences` or `reorderLocations`) becomes an unhandled promise rejection: the delete dialog silently never opens, or a drag/keyboard reorder silently fails, with no feedback to the user and no `error` state set.
**Fix:** Add the same try/catch + `setError(t('locations.errorDelete'))` pattern used by the other handlers, e.g.:
```ts
async function handleReorder(oldIndex: number, newIndex: number) {
  if (!locations) return
  try {
    const reordered = [...locations]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    await reorderLocations(reordered.map((l) => l.id))
    setError(null)
  } catch (err) {
    console.error('Failed to reorder locations:', err)
    setError(t('locations.errorDelete'))
  }
}
```

### WR-05: `KeyboardSensor` is missing the `sortableKeyboardCoordinates` coordinate getter

**File:** `src/components/SortableLocationList.tsx:32-35`
**Issue:** `useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))` configures the keyboard sensor with dnd-kit's default coordinate getter, not `sortableKeyboardCoordinates` from `@dnd-kit/sortable`. Without it, arrow-key input moves the dragged item by raw pixel deltas rather than stepping between the actual sortable items in the list, which is the documented required setup for keyboard-accessible sortable lists in `@dnd-kit`. The drag handle exposes `aria-label={t('aria.dragHandle')}` implying keyboard support, but keyboard-driven reordering will behave unreliably (it may not land on adjacent items, especially once items vary in height) — degrading the a11y story this component is meant to provide (the up/down buttons are the only reliably keyboard-accessible reorder path today).
**Fix:**
```tsx
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
...
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
)
```

### WR-06: Legacy JSON import assigns non-unique `order: 0` to every location missing the field, unlike the `db.version(6)` migration

**File:** `src/lib/dataOps.ts:48-56` (`BackupSchema.locations`), `:113-121` (`LegacyBackupSchema.locations`) — contrast `src/lib/db.ts:213-227`
**Issue:** Both Zod schemas default a missing `order` to `0` per-item independently (`z.number().optional().default(0)`). Importing an old (pre-Phase-8) backup with several locations — none of which have a `hidden`/`order` field — results in *every* imported location getting `order: 0`, i.e. non-unique, non-deterministic sort order. The in-place `db.version(6)` upgrade path handles the same legacy shape correctly by assigning unique, sequential `order` values `1..N` based on alphabetical name (`src/lib/db.ts:222-226`). The two upgrade paths for the same input data now produce different, inconsistent results — a user who imports an old backup gets a materially different (undifferentiated) ordering than a user whose existing DB is upgraded in place.
**Fix:** Run imported locations through the same "assign sequential order by name" logic used in the `db.version(6)` upgrade rather than relying on the Zod per-field default, e.g. post-process `newFormatData.locations` (and `legacyData.locations`) before `bulkAdd` when `order` was absent from the raw payload.

## Info

### IN-01: New `locations.hide` / `locations.show` translation keys are unused

**File:** `src/i18n/en.ts:122-123`, `src/i18n/pl.ts:122-123`, `src/i18n/types.ts:124-125`
**Issue:** Added in this phase alongside `locations.hidden`, but no component references `t('locations.hide')` or `t('locations.show')` — the icon-only hide/show button in `routes/locations/index.tsx:263-270` only uses `aria.hideLocation`/`aria.showLocation` for its `aria-label`.
**Fix:** Remove the two unused keys, or use them as visible button text if that was the intent.

### IN-02: `filter.byStatus` / `filter.byCreated` remain unused

**File:** `src/i18n/en.ts:228-229`, `src/i18n/pl.ts:228-229`, `src/i18n/types.ts:230-231`
**Issue:** Pre-existing (not added in this phase), but still dead — no call site in `FilterBottomSheet.tsx` or elsewhere in `src/`.
**Fix:** Remove if genuinely unused, or wire up a "sort by status"/"sort by date added" option if intended.

### IN-03: Quick-add-location logic and layout duplicated verbatim between `MedicineForm.tsx` and `StockFields.tsx`

**File:** `src/components/MedicineForm.tsx:101-119, 187-264`, `src/components/StockFields.tsx:66-82, 101-179`
**Issue:** `handleAddLocation`, the location `Select`/quick-add markup, and the PAO/quantity blocks are near-identical between the two files. `MedicineForm.tsx:30-32` already carries a `TODO` acknowledging it should eventually be replaced by a `CatalogFields + StockFields` composition. Until then, fixes like WR-01/WR-02/WR-03 above must be applied twice, and as WR-03 shows, they've already drifted (MedicineForm lacks the `'Other'` filter that StockFields has).
**Fix:** No action required for this phase, but worth prioritizing the composition work referenced in the existing TODO before adding more location-dropdown logic to either file.

---

_Reviewed: 2026-09-18T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
