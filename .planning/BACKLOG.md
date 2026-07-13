# MedStock Backlog

Captured ideas and future enhancements not yet planned into a phase.

Last updated: 2026-07-12 (cleanup: removed B-09, B-16, B-23, B-24 — shipped or stale; fixed B-28/B-29/B-30 formatting; B-21 fully specified as TIF algorithm; B-26 expanded with ratio metrics) <-- TODO it's example from night-watch, replace it with real change next time
Last assigned ID: **B-30** — next new item must be **B-31**

---

## How to use this file

- **Adding an item:** increment the "Last assigned ID" counter at the top, then drop a new `### B-NN` block with Source / Status / Earliest slot / What / Why / Open questions / Implementation notes. IDs are monotonic and never reused — even if the previous entry was promoted or removed.
- **Promoting an item:** `/gsd-review-backlog` (interactive) — moves a chosen item into the active milestone roadmap. Or manually run `/gsd-phase add` and reference the backlog ID in the phase description.
- **Removing an item:** delete the block or move it under a `## Rejected` heading with a one-line rationale (decisions cost; keep the rationale).
- **Memory ↔ backlog:** memory captures "this idea exists and here's the context"; this file is the project-level decision queue. Memory is the source for cross-session continuity; this file is the source for milestone planning. Update both when an item lands.

## Related

- `ROADMAP.md` — active milestone phases
- `milestones/v1.0-REQUIREMENTS.md` — v1.0 archived requirements (all 51 complete)
- `PROJECT.md` — core constraints (single subject v1, no build step, no frameworks)
- `CLAUDE.md` — v1/v2 split rules

---

## Ideas

### B-01 · Medicine Name Autocomplete (Dropdown from History)

**Summary:** When adding a new medicine, suggest names from medicines already in the inventory — including items in Trash — via a dropdown/autocomplete.

**Motivation:** Users tend to buy the same medicines repeatedly. Showing known names speeds up entry, reduces typos, and keeps naming consistent across packages of the same product.

**Scope notes:**
- Source pool: all medicines in the DB regardless of status (active, expired, used up, trashed)
- Deduplicate by name (case-insensitive)
- Trigger on the name field in the Add / Edit form — type to filter, or click to open full list
- Selecting a suggestion should only pre-fill the name; other fields stay blank so the user enters fresh data for the new package

**Open questions:**
- Should selecting a name also pre-fill category (since the same medicine usually belongs to the same category)?
- UX: native `<datalist>`, shadcn/ui Combobox (Radix Popover + Command), or a simple filtered dropdown?
- Minimum character count before suggestions appear (0 = show all on focus, 1 = after first keystroke)?
