# Phase 8: Full Location Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-17
**Phase:** 8-full-location-management
**Areas discussed:** Delete with references, Hide scope & visibility, Reorder interaction, Rename predefined names

---

## Delete with references

| Option | Description | Selected |
|--------|-------------|----------|
| Reassign or clear inline | Dialog shows count of affected medicines + dropdown to reassign or clear, one confirm does move + delete atomically | ✓ |
| Block until resolved manually | Deletion disabled until user manually reassigns every medicine first | |
| Force-clear only | Deleting always just clears the location field, no picker | |

**User's choice:** Reassign or clear inline
**Notes:** Follow-up questions narrowed scope further:
- Count/reassignment scope: **Active stock only** (not soft-deleted Trash entries)
- Zero-reference delete: **Still shows a confirm dialog** (simpler copy, no reassign picker)
- Minimum locations floor: **None** — user can delete every location down to zero; "Other"/null is a built-in fallback independent of the table

---

## Hide scope & visibility

| Option | Description | Selected |
|--------|-------------|----------|
| All locations | Hide/show works on any location, predefined or custom | ✓ |
| Predefined only | Matches LOC-02's literal wording; custom locations only get delete | |

**User's choice:** All locations
**Notes:** Follow-up questions:
- Hidden locations **stay visible in the Filter sheet** (so existing stock in a hidden location is still findable)
- Hidden locations **are excluded from the Move/Split Stock sheet** dropdown, same as Add/Edit forms
- On the Locations management screen, hidden rows are shown **inline, grayed out, with a Show button** (not a separate section)

---

## Reorder interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Drag + up/down buttons | Drag handle plus per-row up/down arrow buttons for precision and accessibility | ✓ |
| Drag handle only | Pure drag-and-drop, matching roadmap wording literally | |

**User's choice:** Drag + up/down buttons
**Notes:** Follow-up questions:
- "Other" (null location) gets a **fixed position, always last**, in dropdowns
- Hidden locations **stay reorderable** in the management list (grayed out but still draggable)
- Existing locations' initial `order` value on schema upgrade: **alphabetical**, matching current `orderBy('name')` behavior so the upgrade is visually silent

---

## Rename predefined names

| Option | Description | Selected |
|--------|-------------|----------|
| Plain string after rename | Renaming opts a location out of the translation system, same as custom locations | ✓ |
| Keep translation, track separately | Introduce a display-name override so predefined translation persists alongside a custom label | |

**User's choice:** Plain string after rename
**Notes:** Follow-up questions:
- Rename/add is **blocked on case-insensitive name collision** with an existing location
- Location names are **stored exactly as typed** — no auto title-casing (unlike the medicine catalog's title-case convention)

---

## Claude's Discretion

- Exact drag/sortable library choice (bundle size, touch reliability) — left for researcher/planner
- Visual details of the "Hidden" badge and up/down button icons
- `order` field renumbering strategy (contiguous reassignment vs. sparse/fractional ordering)

## Deferred Ideas

None — discussion stayed within phase scope. No pending todos matched this phase (`todo.match-phase 8` → 0 matches).
