# Phase 2: Search, Dashboard & Audit - Context

**Gathered:** 2026-06-30
**Status:** Ready for planning

<domain>
## Phase Boundary

A user at a pharmacy can search for a medicine by name from the Medicines screen and see its stock plus validity status in under 5 seconds; the dashboard surfaces four expiry alert cards; a dedicated Trash Bin prevents accidental data loss with full restore capability; and every change to a medicine record is stored in a persistent history log that survives even permanent deletion.

This phase adds: search bar (live filtering) on the Medicines screen, filter/sort bottom sheet, Dashboard route with 4 tappable alert cards, Trash Bin route with restore/permanent-delete, per-medicine change history displayed in the detail view, and the Dexie schema v2 migration to support `deletedAt` and a new `history` table.

</domain>

<decisions>
## Implementation Decisions

### Search
- **D-20:** Search bar is **permanently visible at the top of the Medicines screen** — not a global overlay, not a dedicated tab. User taps the Medicines tab and sees the bar immediately.
- **D-21:** Search filters **instantly as the user types** — no submit button or enter key. Client-side substring match on `medicine.name` (case-insensitive). Uses Dexie's indexed `name` field for initial query, then client-side filter for partial matching.
- **D-22:** Search results use the **existing `MedicineCard` component** (name, location, expiry date, status badge). No new result component needed.
- **D-23:** Search and filters are **independent and cumulative** — both apply simultaneously with AND logic. User can search "ibu" while filtered by "Bathroom Cabinet" location.
- **D-24:** When the search bar is **empty**, the full medicine list displays with any active filters applied. No "start typing" placeholder state — current list behavior is preserved.

### Trash Bin
- **D-25:** "Delete to Trash" and "set Disposed status" are **two distinct actions**:
  - `Disposed` = a manual status the user sets explicitly (medicine remains visible in the main list with a Disposed badge).
  - Deleted = user pressed delete, medicine moves to Trash Bin and disappears from the main list.
  - Implementation: add `deletedAt: string | null` field to the `medicines` Dexie table (schema v2). Main list filters out `deletedAt IS NOT NULL`. Trash screen shows `deletedAt IS NOT NULL`.
- **D-26:** Permanent removal is **user-triggered only** — no auto-purge. Items stay in Trash until the user explicitly deletes them permanently (individually via a "Delete permanently" button on each item).
- **D-27:** Trash screen layout: **list of deleted medicines**, each with a **Restore** button (removes `deletedAt`, restores previous `manualStatus`) and a **Delete permanently** button (hard deletes the medicine record but preserves history entries per D-30).
- **D-28:** Restoring a medicine from Trash does NOT change `manualStatus` — the medicine comes back with whatever `manualStatus` it had before deletion (could be null/Active, Opened, Disposed, etc.).

### Filter/Sort Controls
- **D-29:** Filter and sort controls live behind a **filter icon in the Medicines screen header** that opens a **bottom sheet**. The icon shows a badge with the count of active filters (e.g., "2" when 2 filters are active).
- **D-30:** When filters are active, **dismissible chips appear above the medicine list** (below the search bar). Each chip shows the active filter (e.g., "Location: Bathroom ×"). User can remove a filter by tapping the × on its chip or by reopening the sheet.
- **D-31:** Filter/sort state lives in **Zustand (`uiStore.ts`)** — persists across navigation. Navigating to a detail view and pressing Back returns to the filtered list.
- **D-32:** Status filter supports **all 6 statuses: Active, Opened, Expired, Used Up, Disposed, Archived**. Auto-calculated statuses (Active, Opened, Expired) require client-side post-filtering since they are derived at render time (D-12).
- **D-33:** Filters within a dimension use **OR logic** (e.g., selecting "Bathroom" + "Kitchen" shows medicines in either location). Filters across dimensions use **AND logic** (location filter AND category filter).

### History Log
- **D-34:** A medicine's change history appears as a **section at the bottom of the detail view** — no separate route needed. Below all the medicine fields, a "Change History" section shows the timeline.
- **D-35:** Logged events: **all field changes via Edit form** (field name + old value + new value) + lifecycle events: created, moved to Trash, restored from Trash, permanently deleted. Manual status changes (setting Used Up, Disposed, Archived) are also logged as field changes (`manualStatus` field).
- **D-36:** History entries are stored in a **new `history` Dexie table** (schema v2). Each entry has: `id`, `medicineId`, `medicineName` (denormalized — preserves name after medicine is deleted), `action` ('created' | 'updated' | 'deleted' | 'restored'), `changedFields: {field, oldValue, newValue}[]` (empty array for non-edit events), `timestamp` (ISO string).
- **D-37:** History display format: **timeline list** — each entry shows `timestamp — human-readable summary`. Example: `2026-06-30 10:15 — Name changed from "Ibuprofen" to "Ibuprofen 400mg"` or `2026-06-30 09:00 — Medicine added`.
- **D-38:** History entries are **preserved permanently** — they are NOT deleted when a medicine is permanently deleted from Trash (TRSH-04). The `medicineName` denormalization ensures entries remain meaningful after the medicine record is gone.

### Navigation (extends D-01, D-02 from Phase 1)
- **D-39:** Bottom tab bar gains two new tabs: **Dashboard** and **Trash**. Final tab order: Medicines | Dashboard | Trash | Locations (4 tabs).
- **D-40:** New routes: `/#/dashboard`, `/#/trash`. These are registered as children of `RootLayout` in `App.tsx`.

### Dexie Schema v2
- **D-41:** `db.version(2)` adds:
  - `medicines` table: new `deletedAt` field (indexed) — `'++id, name, category, location, expiryDate, manualStatus, deletedAt'`
  - New `history` table: `'++id, medicineId, timestamp'`
  - Migration: existing medicines get `deletedAt: null` (no data change needed; Dexie handles missing fields gracefully for existing records).

### Claude's Discretion
- Dashboard card visual priority and color scheme (which card is most prominent — likely Expired in red)
- Exact bottom sheet component for filters (Radix Dialog or a custom slide-up panel)
- Empty state for Trash Bin ("Trash is empty")
- History section collapsible vs always-expanded on detail view
- Transition animation when opening filter bottom sheet

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Core value, constraints (IndexedDB-only, offline-first, privacy-first), key decisions, and project context. The pharmacy use-case is the primary success scenario for Phase 2 search.
- `.planning/REQUIREMENTS.md` — Phase 2 requirements: SRCH-01–06, DASH-01–04, HIST-01–02, TRSH-01–04
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria

### Phase 1 Decisions (must carry forward)
- `.planning/phases/01-pwa-foundation-inventory-crud/01-CONTEXT.md` — D-01 through D-19: routing, Dexie schema v1, navigation, calculateStatus(), location management. All carry forward unchanged.

### Stack Decisions
- `.claude/CLAUDE.md` §Technology Stack — Full recommended stack. MUST read before selecting any library.

### No external specs
- No ADRs, design docs, or external specs were referenced during discussion. All decisions are captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/MedicineCard.tsx` — Reuse directly for search results (D-22). No modification needed.
- `src/components/StatusBadge.tsx` — Used by MedicineCard; already handles all 6 statuses.
- `src/lib/expiry.ts` `calculateStatus()` — Reuse for status-based filtering (D-32). Pure function, called client-side after Dexie query.
- `src/stores/uiStore.ts` — Extend with filter/sort state (D-31). Currently only has `locationDialogOpen`.
- `src/components/BottomTabBar.tsx` — Add Dashboard and Trash tabs (D-39). Currently has 2 tabs.

### Established Patterns
- `useLiveQuery` from `dexie-react-hooks` — Pattern for reactive Dexie queries. Dashboard metrics and trash list will use this.
- `manualStatus` field with `null` as "no manual override" — Pattern from D-13. Phase 2 adds `deletedAt` using the same nullable-field approach (D-41).
- Zustand `create<T>()()` curried form — Pattern from Phase 1 (Pitfall 7). Must use same form when extending uiStore.
- `shadcn/ui` Button, Link, NavLink patterns — Established in Phase 1 for all interactive elements.

### Integration Points
- `src/App.tsx` router — Add `/#/dashboard` and `/#/trash` routes as children of RootLayout (D-40).
- `src/components/BottomTabBar.tsx` — Add 2 new NavLink tabs (D-39).
- `src/lib/db.ts` — Add `db.version(2)` with `deletedAt` on medicines + new `history` table (D-41). Never modify version 1.
- `src/routes/medicines/index.tsx` — Add search bar at top + filter chips + filter icon. Currently renders plain list with `MedicineList`.
- Medicine delete flow (currently in detail/edit views) — Must be updated to set `deletedAt` instead of `manualStatus = 'Disposed'` (D-25).

</code_context>

<specifics>
## Specific Ideas

- The pharmacy use-case (PROJECT.md): "User is at a pharmacy, sick. They open the app, search a medicine name, and need stock + validity status in under 5 seconds." — The search bar must be the FIRST thing visible when the Medicines tab is tapped. No scroll-to-find-search; it's at the top.
- The `medicineName` denormalization on history entries (D-36/D-38) is critical: history must remain readable after the medicine is permanently deleted. Planner should note this as a constraint when designing the history table schema.
- `deletedAt` is indexed (D-41) to enable efficient Dexie queries: `medicines.where('deletedAt').equals(null)` for the main list and `medicines.where('deletedAt').notEqual(null)` for Trash.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Search, Dashboard & Audit*
*Context gathered: 2026-06-30*
