# MedStock Backlog

Ideas and scope items captured outside the active roadmap. Anything here is *not* in v1 — it has either been deferred by explicit decision, surfaced during UAT, or earmarked for a later milestone. Items graduate to a `ROADMAP.md` phase when picked up (`/gsd-review-backlog` to promote, `/gsd-phase add` to materialize).

Last updated: 2026-07-13 (B-001 reformatted to standard backlog template — added Source/Status/Earliest slot; split Summary+Scope into What/Why/Implementation notes)
Last assigned ID: **B-001** — next new item must be **B-002**

---

## How to use this file

- **Adding an item:** increment the "Last assigned ID" counter at the top, then drop a new `### B-NNN` block with Source / Status / Earliest slot / What / Why / Open questions / Implementation notes. IDs are monotonic and never reused — even if the previous entry was promoted or removed.
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

### B-001 · Medicine Name Autocomplete (Dropdown from History)

**Source:** product idea — recurring data-entry friction observed during Phase 1 implementation
**Status:** captured · not scheduled
**Earliest sensible slot:** post-Phase 2 (medicine list + dashboard lands first) — or as a Phase 2 suB-0plan if entry speed is prioritised early

**What:** When the Add / Edit medicine form opens, the name field suggests names from medicines already in the inventory — including trashed items — via a dropdown/autocomplete. Selecting a suggestion pre-fills the name only; all other fields stay blank so the user enters fresh data for the new package.

**Why:** Users buy the same medicines repeatedly. Today they retype the exact name every time, which causes typos and inconsistent naming across packages of the same product (e.g., "Ibuprofen 400" vs "ibuprofen400"). Autocomplete from history eliminates retyping and keeps names consistent for free, which in turn makes search and deduplication work better.

**Open questions when this gets planned:**

- Should selecting a name also pre-fill **category** (same medicine usually belongs to the same category)?
- UX widget: native `<datalist>`, shadcn/ui Combobox (Radix Popover + Command), or a custom filtered dropdown?
- Minimum character count before suggestions appear — 0 (show all on focus) vs 1 (after first keystroke)?
- Should results be ranked by recency or frequency of use, or simple alphabetical?

**Implementation notes:**

- Source pool: query all medicines from Dexie regardless of `status` (active, expired, used-up, trashed); deduplicate by name case-insensitively before rendering.
- The name field in `AddMedicineForm` / `EditMedicineForm` gains a controlled Combobox; no schema or Zustand store changes needed — read-only query on open.
- If category pre-fill is approved: carry the most-recently-used category for that name as the prefill value; user can override.
