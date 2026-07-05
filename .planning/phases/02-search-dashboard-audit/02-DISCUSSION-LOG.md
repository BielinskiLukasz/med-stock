# Phase 2: Search, Dashboard & Audit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 02-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-30
**Phase:** 2-Search, Dashboard & Audit
**Areas discussed:** Search access point, Trash vs. Disposed, Filter/sort controls, History log visibility

---

## Search Access Point

### Where does the search bar live?

| Option | Description | Selected |
|--------|-------------|----------|
| Top of Medicines screen | Persistent search bar at top of the Medicines tab — user sees it immediately on tapping the tab | ✓ |
| Global overlay (any tab) | Search icon opens a full-screen overlay from any screen — true "from any screen" | |
| Dedicated Search tab | A 5th bottom tab bar entry for search | |

**User's choice:** Top of Medicines screen
**Notes:** Simpler and predictable — the pharmacy use-case requires Medicines tab anyway to confirm stock.

---

### When the user types, what happens?

| Option | Description | Selected |
|--------|-------------|----------|
| Instant live filtering | List filters as you type — no submit needed | ✓ |
| Submit to search | User presses Enter or a button | |

**User's choice:** Instant live filtering

---

### What does a search result card show?

| Option | Description | Selected |
|--------|-------------|----------|
| Same as current MedicineCard | Name, location, expiry date, status badge — already built | ✓ |
| Compact result row | Tighter layout with just name + status badge | |

**User's choice:** Same as current MedicineCard

---

### Does the search bar interact with filters?

| Option | Description | Selected |
|--------|-------------|----------|
| Search and filters are independent, both apply (AND) | Both apply simultaneously | ✓ |
| Search clears filters, filters clear search | Only one active at a time | |

**User's choice:** Independent, cumulative AND logic

---

### When the search bar is empty, what does the screen show?

| Option | Description | Selected |
|--------|-------------|----------|
| Full medicine list (current behavior) | Empty search = no filter applied | ✓ |
| Empty state with prompt | Shows "Start typing" with nothing in list | |

**User's choice:** Full medicine list (current behavior)

---

## Trash vs. Disposed

### Should 'delete to Trash' differ from 'Disposed' status?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — they are different | Separate deletion mechanism needed (e.g., deletedAt field) | ✓ |
| No — Disposed IS the trash | Deleting = setting manualStatus to Disposed | |

**User's choice:** Yes — they are distinct actions
**Notes:** Disposed = user explicitly set status (medicine still in main list). Deleted = moved to Trash (removed from main list). Needs `deletedAt` field in Dexie schema v2.

---

### When does a deleted medicine get permanently removed?

| Option | Description | Selected |
|--------|-------------|----------|
| Only on explicit user action | No auto-purge | ✓ |
| Auto-purge after 30 days | Items auto-deleted after 30 days | |

**User's choice:** Only when user explicitly permanently deletes

---

### What does the Trash screen look like?

| Option | Description | Selected |
|--------|-------------|----------|
| List with Restore and Delete buttons | Each item shows Restore + permanent-delete buttons | ✓ |
| Swipe-to-restore / swipe-to-delete | Mobile swipe gestures | |

**User's choice:** List with Restore and Delete buttons per item

---

### TRSH-04: History of deleted items

| Option | Description | Selected |
|--------|-------------|----------|
| History deleted with medicine | History cleaned up on permanent delete | |
| History preserved even after permanent deletion | History entries remain orphaned after medicine is deleted | ✓ |

**User's choice:** History preserved permanently — history log entries survive permanent deletion
**Notes:** This drove the decision to denormalize `medicineName` on each history entry (D-36).

---

## Filter/Sort Controls

### Where do filter controls live?

| Option | Description | Selected |
|--------|-------------|----------|
| Filter icon in header → bottom sheet | Funnel icon with active count badge, opens a bottom sheet | ✓ |
| Sticky horizontal chip bar above list | Scrollable row of category chips always visible | |

**User's choice:** Filter icon → bottom sheet

---

### How does the user know filters are active?

| Option | Description | Selected |
|--------|-------------|----------|
| Badge count + dismissible chips above list | Icon badge count + chips below search bar with × to remove | ✓ |
| Badge count only | Just a number on the icon | |

**User's choice:** Badge count on icon + dismissible chips above list

---

### Where is filter/sort state stored?

| Option | Description | Selected |
|--------|-------------|----------|
| Zustand store (uiStore.ts) | Persists across navigation — back from detail view returns filtered list | ✓ |
| Local component state | Resets on navigation | |
| URL query params | Encoded in URL hash | |

**User's choice:** Zustand (uiStore.ts)

---

### Which statuses can be filtered?

| Option | Description | Selected |
|--------|-------------|----------|
| All 6 statuses (Active, Opened, Expired, Used Up, Disposed, Archived) | Full SRCH-05 compliance; auto-statuses need client-side post-filtering | ✓ |
| Only manual statuses (Used Up, Disposed, Archived) | Simpler — all indexable in Dexie | |

**User's choice:** All 6 statuses including calculated ones

---

## History Log Visibility

### Where does history appear?

| Option | Description | Selected |
|--------|-------------|----------|
| Section at bottom of detail view | Inline below medicine fields — no navigation needed | ✓ |
| Separate History screen via button | Dedicated /#/medicines/:id/history route | |

**User's choice:** Section at bottom of the detail view

---

### What changes get logged?

| Option | Description | Selected |
|--------|-------------|----------|
| All field changes + create/delete/restore/status events | Full HIST-01 compliance | ✓ |
| Only lifecycle events (create/delete/restore) | Incomplete — doesn't capture field-level diffs | |

**User's choice:** All field changes + lifecycle events + manual status changes

---

### How is each history entry displayed?

| Option | Description | Selected |
|--------|-------------|----------|
| Timeline list: timestamp + action summary | Human-readable: "Name changed from X to Y" | ✓ |
| Detailed diff table: Field / Old / New columns | More verbose but precise | |

**User's choice:** Timeline list with human-readable summaries

---

### Does setting Disposed/Used Up/Archived trigger a history entry?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — all manual status changes are logged | Complete audit trail of medicine lifecycle | ✓ |
| No — only field edits via form are logged | Simpler but incomplete | |

**User's choice:** Yes — all manual status changes create history entries

---

## Claude's Discretion

- Dashboard card visual priority and color scheme (Expired likely red)
- Bottom sheet component choice for filters (Radix Dialog or custom)
- Empty state for Trash Bin
- History section collapsible vs. always-expanded
- Filter bottom sheet open/close animation

## Deferred Ideas

None — discussion stayed within phase scope.
