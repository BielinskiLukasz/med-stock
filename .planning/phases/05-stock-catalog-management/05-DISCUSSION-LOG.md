# Phase 5: Stock & Catalog Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-30
**Phase:** 5-Stock & Catalog Management
**Areas discussed:** List view data shape, Add flow screen structure, Detail view route/URL, Medicine.name field

---

## List view data shape

| Option | Description | Selected |
|--------|-------------|----------|
| Catalog-first join | Two useLiveQuery hooks (catalog + stock), useMemo joins and computes aggregate | ✓ |
| Stock-first, group by catalogId | One query, group stock by catalogId in useMemo, look up catalog names | |
| Single Dexie join query | Custom useLiveQuery reading both tables | |

**User's choice:** Catalog-first join

---

| Option | Description | Selected |
|--------|-------------|----------|
| Name + status + quantity | Catalog name, StatusBadge from nearest expiry, total quantity with unit | ✓ |
| Name + status only | Minimal, same as today's card | |
| Name + status + quantity + each location | Per-location breakdown chips on card | |

**User's choice:** Name + status + quantity

---

| Option | Description | Selected |
|--------|-------------|----------|
| Keep category, drop location filter | Category is catalog-level; location is per-stock, drop it | |
| Keep all filters, adapt semantics | Location = "has at least one stock entry there"; category unchanged | ✓ |
| Drop both location and category filters | List shows everything; users drill into detail | |

**User's choice:** Keep all filters, adapt semantics

---

| Option | Description | Selected |
|--------|-------------|----------|
| Keep name + status sort only | Remove expiry sort (ambiguous at catalog level) | |
| Keep all existing sort options | Name, expiry (nearest-expiry date), category, status | ✓ |
| You decide | Claude picks simplest sort | |

**User's choice:** Keep all existing sort options

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, 'No category' is a filter option | Consistent with today; migrated entries may have null | ✓ |
| No, hide null-category entries from filter | Cleaner filter UI | |

**User's choice:** Yes

---

## Add flow screen structure

| Option | Description | Selected |
|--------|-------------|----------|
| One route, multi-step state machine | /medicines/new with internal step states | ✓ |
| Two routes: /medicines/new then /medicines/new/stock | Separate routes, pass catalogId via router state | |

**User's choice:** One route, state machine

---

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-show creation form in dropdown | "Create '[name]'" appears when 0 matches | ✓ |
| Explicit 'Add new medicine' button | Always-visible button below search | |
| Separate 'New catalog entry' link | Small link under search box | |

**User's choice:** Auto-show in dropdown

---

| Option | Description | Selected |
|--------|-------------|----------|
| Name required; category + form optional | Minimal friction | |
| Name + category required; form optional | Better data quality | ✓ |
| Name required; all other fields skipped | Maximum speed | |

**User's choice:** Name + category required; form optional

---

| Option | Description | Selected |
|--------|-------------|----------|
| Back to catalog search | Back arrow returns to step 1; stock data lost | ✓ |
| Cancel only | No back; only exit to list | |
| You decide | Claude picks simpler approach | |

**User's choice:** Back to catalog search

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show all entries on focus | Full list visible before typing | ✓ |
| Show only after 1+ character typed | Empty search = no suggestions | |

**User's choice:** Show all on focus

---

## Detail view route/URL

| Option | Description | Selected |
|--------|-------------|----------|
| Use catalogId in /medicines/:id | Detail uses catalogId; old stock ID links become stale | ✓ |
| New /catalog/:id route; /medicines/:id stays for stock | Two detail screens | |
| Auto-detect by ID | Try catalog first, fallback to stock | |

**User's choice:** catalogId in /medicines/:id

---

| Option | Description | Selected |
|--------|-------------|----------|
| Navigate to catalog via /medicines/:catalogId | Trash links use stock entry's catalogId field | ✓ |
| Stock-entry-only links | Requires auto-detect routing | |
| No navigation from Trash — just restore button | Simplest, removes the View link | |

**User's choice:** Navigate to catalog via catalogId

---

| Option | Description | Selected |
|--------|-------------|----------|
| Inline edit on detail screen | Edit icon on catalog header; no new route | ✓ |
| Separate /medicines/:id/edit route for catalog | Consistent with existing edit route pattern | |

**User's choice:** Inline on detail screen

---

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom sheet with stock fields | Sheet from stock row; uses existing Sheet component | ✓ |
| Separate /medicines/:stockId/edit route | Full-screen form; leaves detail screen | |

**User's choice:** Bottom sheet

---

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom sheet (STOCK-03) | Single Move/Split action via sheet | |
| Dedicated route | Separate page for split | |

**User's choice (free text):** Bottom sheet approach + auto-split for "Open box" scenario

**Notes:** User clarified the primary use case: 20 identical sealed boxes as 1 stock entry with quantity=20. Tapping "Open" creates 1 new entry (qty=1, openedDate=today, same location) and decrements original to 19. Two separate actions decided: "Open box" (quick, always 1 unit, sets openedDate) and "Move/Split" (general N-unit location split, via bottom sheet).

---

## Medicine.name field — keep or clean up

| Option | Description | Selected |
|--------|-------------|----------|
| Keep name on Medicine (denormalized sync) | Set from catalog on add; sync on catalog edit; no migration | |
| Remove name from Medicine — add schema v4 migration | Clean data model; catalog edit simple; list search needs join | ✓ |
| Keep as read-only legacy field | Two sources of truth; confusing | |

**User's choice:** Remove with schema v4 migration

---

| Option | Description | Selected |
|--------|-------------|----------|
| Remove category from Medicine too (same v4 migration) | Full cleanup; stock entries are purely stock-specific | ✓ |
| Keep category on Medicine for now | Partial cleanup | |

**User's choice:** Remove both name and category in v4

---

| Option | Description | Selected |
|--------|-------------|----------|
| Callers look up catalog name, pass explicitly (D-06) | Existing historyOps pattern from Phase 4 | ✓ |
| historyOps reads catalog internally | Contradicts D-06 | |

**User's choice:** Callers supply name explicitly — consistent with Phase 4 D-06

---

## Claude's Discretion

None — user made explicit choices on all areas.

## Deferred Ideas

None — discussion stayed within phase scope.
