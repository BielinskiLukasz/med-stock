# MedStock Backlog

Ideas and scope items captured outside the active roadmap. Anything here is *not* in v1 — it has either been deferred by explicit decision, surfaced during UAT, or earmarked for a later milestone. Items graduate to a `ROADMAP.md` phase when picked up (`/gsd-review-backlog` to promote, `/gsd-phase add` to materialize).

Last updated: 2026-07-15 (B-004, B-005 added after Phase 3 UAT — CSV column auto-mapping + mapper column headers)
Last assigned ID: **B-005** — next new item must be **B-006**

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

---

### B-002 · Interactive Guided Sync Flow (DATA-04 Enhancement)

**Source:** Phase 3 verification — DATA-04 requirement left open; D-44 locked delivery as static text-only instructions
**Status:** captured · not scheduled
**Earliest sensible slot:** v2.0 milestone or a later Phase 4 iteration

**What:** Upgrade the "Sync with household" section from static instructional text to an interactive guided flow. Users tap through steps with context-aware prompts (e.g., detect if a backup was recently exported, surface a direct "Go to Files" deep link, guide the receiving device through importing).

**Why:** Static instructions satisfy the minimum goal (user knows what to do) but friction remains high for non-technical users — they must context-switch between the app and their file manager. A guided flow would reduce errors and make household sync feel first-class.

**Open questions when this gets planned:**

- Should the flow detect the OS (Android vs iOS) and show different instructions?
- Can we deep-link to OneDrive/Google Drive/Files app from a PWA on iOS?
- Should the exporting device set a "last exported" timestamp visible to the receiving device?
- Is a guided stepper (sequential steps with back/next) or a checklist (user ticks each step) the right UX?

**Implementation notes:**

- SyncInstructions.tsx is the entry point — replace static paragraphs with a step machine component
- No backend required — device detection via `navigator.userAgent`; deep links via `window.open` with platform-specific URL schemes
- REQUIREMENTS.md DATA-04 checkbox should be ticked when this is delivered

---

### B-003 · Merge-Based Sync (Replace Full-Replace with Last-Write-Wins)

**Source:** Phase 3 verification — ROADMAP SC-2 described "merged with last-write-wins conflict resolution" but implementation uses full replace (D-47, intentionally locked for v1 simplicity)
**Status:** captured · not scheduled
**Earliest sensible slot:** v2.0 milestone

**What:** Replace the current full-replace import strategy (D-47) with a proper merge: when importing a backup, compare incoming records with existing DB records by ID and timestamp, keep the most-recently-updated version of each record (last-write-wins), and append any records not present locally. History entries merge by union rather than replace.

**Why:** Full replace is safe for the single-device case but breaks down with two active household members — if both add medicines between syncs, the later importer silently loses all records added by the first. Merge-based sync preserves all additions while still resolving conflicts deterministically.

**Open questions when this gets planned:**

- Should conflict resolution be automatic (last-write-wins by `updatedAt`) or user-facing (show a diff and let the user pick)?
- How are deletions handled — does a `deletedAt` on one side propagate to the other?
- Should history entries be deduplicated by ID, or always unioned (duplicate actions are visible but harmless)?
- What is the migration path for existing backups created with the full-replace schema?

**Implementation notes:**

- `importFromJSON` in `dataOps.ts` needs a new `merge` mode alongside the existing `replace` mode
- BackupSchema already captures `deletedAt` and `updatedAt` — no schema changes needed
- UI: ImportJSONSection AlertDialog needs to differentiate between "Replace all" and "Merge" modes
- ROADMAP.md SC-2 wording should be updated when this is delivered

---

### B-004 · CSV Column Auto-Mapping by Name

**Source:** Phase 3 UAT — Test 8 (G-01), reported 2026-07-15
**Status:** captured · not scheduled
**Earliest sensible slot:** next available patch or Phase 4

**What:** When a CSV file is parsed, pre-select each dropdown in the column-mapping UI to the matching medicine field when the CSV column header exactly matches a field name (case-insensitive). Columns with no match default to `(skip)` as today.

**Why:** Users uploading a well-formed CSV (e.g., exported from MedStock itself or from a spreadsheet that follows the field names) must manually map every column even when the names are identical. Auto-mapping eliminates this friction entirely.

**Open questions when this gets planned:**

- Case-insensitive match only, or also fuzzy (e.g., "Expiry Date" → `expiryDate`)?
- Should a pre-mapped column be visually distinguished (e.g., light background) so the user can spot and override auto-matches?

**Implementation notes:**

- `ImportCSVSection.tsx` line 41: change `initialMapping[h] = SKIP_VALUE` to check `if (MEDICINE_FIELDS.includes(h.toLowerCase())) initialMapping[h] = h.toLowerCase(); else initialMapping[h] = SKIP_VALUE`
- No changes needed to `csvOps.ts`, `CSVColumnMapper.tsx`, or `CSVPreview.tsx`

---

### B-005 · CSV Mapper Column Header Labels

**Source:** Phase 3 UAT — Test 8 (G-02), reported 2026-07-15
**Status:** captured · not scheduled
**Earliest sensible slot:** next available patch or alongside B-004

**What:** Add a header row above the column-mapping list in `CSVColumnMapper.tsx` that labels the two sides: "Your file column" on the left and "App field" on the right. This makes the mapping direction immediately obvious without needing to read surrounding text.

**Why:** During UAT the user found the two-column layout confusing — it was unclear which side was the CSV source and which was the medicine field target. A simple header row resolves this without changing any logic.

**Implementation notes:**

- Add a `<div className="flex items-center gap-3 ...">` header row before the `headers.map(...)` block in `CSVColumnMapper.tsx`
- Left cell: `<span className="text-xs font-semibold text-muted-foreground w-1/2 shrink-0">Your file column</span>`
- Right cell: `<span className="text-xs font-semibold text-muted-foreground w-full">App field</span>`
- No logic changes; purely presentational
