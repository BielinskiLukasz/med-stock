# MedStock Backlog

Ideas and scope items captured outside the active roadmap. Anything here is *not* in v1 — it has either been deferred by explicit decision, surfaced during UAT, or earmarked for a later milestone. Items graduate to a `ROADMAP.md` phase when picked up (`/gsd-review-backlog` to promote, `/gsd-phase add` to materialize).

Last updated: 2026-07-29 (B-010 added — medicine name memory with category sync)
Last assigned ID: **B-010** — next new item must be **B-011**

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
**Status:** captured · deferred to v1.1 — v1.0 shipped with static instructions only (Option B decision, 2026-07-19)
**Earliest sensible slot:** v1.1 milestone

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
**Status:** captured · deferred to v1.1 — v1.0 shipped with full-replace gap (Option B decision, 2026-07-19)
**Earliest sensible slot:** v1.1 milestone

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

---

### B-006 · Per-Medicine Change History / Audit Log

**Source:** product planning — Phase 2 scope candidate
**Status:** captured · not scheduled
**Earliest sensible slot:** Phase 2 (Search, Dashboard & Audit)

**What:** Each medicine record carries a timestamped log of every change made to it — creation, edits (with before/after values), status transitions (active → expired, active → used-up), and deletions. A user can tap into a medicine and see its full history.

**Why:** Without a history, it is impossible to know when a medicine was opened, when it was marked used-up, or what value was changed and by whom. This is especially useful in a household where two people manage the same inventory and need to understand each other's actions without coordinating in real time.

**Open questions when this gets planned:**

- How many history entries to retain per medicine — all, or capped (e.g., last 50)?
- Should history entries survive a full-replace sync import (B-003 merge question)?
- UI surface: inline collapsible panel on the medicine detail view, or a separate history drawer?
- Should system-generated events (e.g., status auto-expired at expiry date) be logged alongside user-initiated events?

**Implementation notes:**

- Dexie schema: add a `history` table keyed by `medicineId` + `timestamp`; each row stores `field`, `oldValue`, `newValue`, `action` (`created | edited | status_changed | deleted`), `timestamp`
- All write operations in `db.ts` (add, update, delete) must write a corresponding history row in the same transaction
- MedicineDetailView gains a "History" tab or expandable section rendering the log newest-first
- Export/import schema must include history entries to survive sync

---

### B-007 · Batch Medicine Creation

**Source:** product planning — v2 scope candidate
**Status:** captured · not scheduled
**Earliest sensible slot:** v2.0 milestone

**What:** Allow the user to add multiple packages of the same medicine in one operation — for example, adding 3 identical boxes of Ibuprofen 400mg all at once by specifying a count rather than repeating the add-medicine form three times.

**Why:** Users restocking from a shopping trip often buy 2–3 packages of the same item. Today they must submit the form once per package, which is repetitive and error-prone (easy to miss one or introduce small typos across duplicates).

**Open questions when this gets planned:**

- Should all copies be identical (same expiry date) or should the user be prompted for different expiry dates per copy?
- Maximum batch size to prevent accidental data explosion?
- Should batch copies get distinct IDs immediately, or be grouped under a parent record?

**Implementation notes:**

- Add a "Quantity to add" spinner (default 1) to the bottom of `AddMedicineForm`
- On submit, loop `quantity` times and call `db.medicines.add(...)` in a Dexie transaction
- No changes to the medicine data model; each copy is an independent record

---

### B-008 · Custom Categories

**Source:** product planning — v2 scope candidate
**Status:** captured · not scheduled
**Earliest sensible slot:** v2.0 milestone

**What:** Let users define their own medicine categories in addition to (or replacing) the built-in list. A settings screen lists existing categories and allows adding, renaming, and deleting them.

**Why:** The built-in category list reflects a generic household medicine cabinet. Families with specific needs (e.g., veterinary medicines, sports supplements, baby products) cannot organise their inventory accurately with fixed categories, which reduces the value of filtering and dashboard grouping.

**Open questions when this gets planned:**

- Are built-in categories locked (protected from deletion) or can the user fully replace them?
- What happens to existing medicines whose category is deleted — reset to "Other", or keep the orphaned string?
- Should custom categories be included in JSON export/import so they survive a device switch?
- Is a drag-to-reorder list needed for category display order in filters and forms?

**Implementation notes:**

- New Dexie table `categories` with `id`, `name`, `isBuiltIn`, `sortOrder`
- Seed the table on first run with the current hardcoded list marked `isBuiltIn: true`
- Category dropdowns in `AddMedicineForm` / `EditMedicineForm` / filter UI read from Dexie instead of a static array
- Settings screen: `CategoriesSettings.tsx` — list with add/rename/delete actions; block delete if `isBuiltIn` or if medicines reference the category
- BackupSchema must include the `categories` table

---

### B-009 · In-App iOS "Add to Home Screen" Guidance Prompt

**Source:** product planning — v2 scope candidate
**Status:** captured · not scheduled
**Earliest sensible slot:** v2.0 milestone

**What:** On iOS Safari, display a contextual banner or bottom-sheet the first time the user opens the app in a browser (not already installed as a PWA), guiding them to tap the Share icon → "Add to Home Screen". Dismiss state is persisted so the prompt never re-appears after the user acts or dismisses.

**Why:** iOS Safari does not support the `beforeinstallprompt` Web API, so the standard PWA install button cannot be shown. Without a prompt, iOS users are unlikely to discover the install path on their own, which means they miss offline capability and the full-screen experience. A one-time nudge closes this gap.

**Open questions when this gets planned:**

- Detection: use `navigator.standalone === false && /iPhone|iPad|iPod/.test(navigator.userAgent)` — is this reliable enough?
- How long to wait before showing the prompt — immediately on first load, or after the first meaningful interaction (e.g., first medicine added)?
- Design: bottom sheet with screenshot of the Share icon, or a slim dismissible banner?
- Should the prompt also appear on Android when the native install prompt is unavailable (e.g., already dismissed by the OS)?

**Implementation notes:**

- New component `InstallPromptBanner.tsx` rendered in `App.tsx` above the main layout
- Use `localStorage` key `installPromptDismissed` to suppress after user dismisses or after 7 days
- iOS detection guard: only render on iOS Safari in non-standalone mode
- No service-worker or manifest changes needed — this is purely a UI nudge

---

### B-010 · Medicine Name Memory with Shared-Name Category Sync

**Source:** product idea — reported 2026-07-29; extends B-001 (autocomplete) with category synchronisation semantics
**Status:** captured · not scheduled
**Earliest sensible slot:** same milestone as or after B-001 lands (autocomplete is a prerequisite)

**What:** Three linked behaviours:

1. **Name memory** — the name field on Add/Edit form suggests names from all existing medicines (same as B-001, deduplicated).
2. **Auto-fill category on name pick** — selecting a name from the dropdown auto-selects the category used by medicines with that name (see conflict rule below). The user can override before saving.
3. **Propagate category change across same-name medicines** — when the user edits a medicine's category, all medicines sharing the exact same name (case-insensitive) in the DB are updated to the new category in one atomic Dexie transaction. A toast confirms how many records were updated (e.g., "Category updated for 3 Ibum entries").

**Migration rule (merging conflicting categories):** On first run after this feature ships, if medicines that share a name currently have *different* categories (legacy inconsistency), the feature detects this and merges them: the set of all distinct categories held by that name is stored on a new `medicineNameCatalog` table (one row per canonical name, `categories: string[]`). The auto-fill value shown on pick is the *first* category in that merged set. The user's next manual category save on any same-name medicine collapses the set back to one value and propagates to all siblings.

**Why:** Users buy the same medicine repeatedly under the same brand name (e.g., "Ibum"). Without synchronised categories, each package may end up in a different category depending on when it was added or who added it, breaking filter reliability. Name memory with auto-fill prevents the problem going forward; the propagation rule fixes drift retroactively; the merge strategy avoids data loss during migration.

**Open questions when this gets planned:**

- Should propagation be opt-in (a confirmation dialog: "Update category for all 3 Ibum entries?") or automatic?
- What is the canonical name key — exact string, or case-insensitive normalised form?
- How should the `medicineNameCatalog` table interact with B-008 (Custom Categories)? If a category is deleted, remove it from the merged set.
- Should propagation touch trashed/soft-deleted medicines or only active ones?
- If a medicine has `manualStatus` set, should propagation skip it or still update just the category field?

**Implementation notes:**

- New Dexie table `medicineNameCatalog`: `{ name: string (pk, lowercase), categories: string[] }`. Seed on first run by scanning all `medicines` rows, grouping by `name.toLowerCase()`, collecting unique `category` values per group.
- `AddMedicineForm` / `EditMedicineForm`: after user selects a name suggestion, query `medicineNameCatalog` by name and pre-fill category with `categories[0]`.
- `historyOps.ts` `updateMedicine`: after saving the edited medicine, if the category field changed, run a secondary `db.transaction('rw', db.medicines, db.history, db.medicineNameCatalog, ...)` to update all sibling rows and collapse `medicineNameCatalog.categories` to the new single value.
- Toast via `sonner`: `toast.success(`Category updated across ${count} "${name}" entries`)` when count > 1.
- No changes to `BackupSchema` needed for the propagation behaviour; `medicineNameCatalog` is a derived/cache table and can be rebuilt from `medicines` on import.
- Relates to: B-001 (autocomplete, prerequisite), B-008 (custom categories, interaction risk)
