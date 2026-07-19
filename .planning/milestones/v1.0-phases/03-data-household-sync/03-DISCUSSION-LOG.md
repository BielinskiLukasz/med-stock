# Phase 3: Data & Household Sync - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-13
**Phase:** 3-Data & Household Sync
**Areas discussed:** Data screen entry point, JSON import: merge vs replace, OneDrive sync flow design

---

## Data screen entry point

| Option | Description | Selected |
|--------|-------------|----------|
| 5th 'Data' tab | Add a Data tab to the bottom bar; 5 tabs total | ✓ |
| Settings screen via gear icon | Gear icon in app bar; Data operations in a Settings route | |
| Inline on Dashboard | Export/Sync Now buttons directly on Dashboard | |

**User's choice:** 5th 'Data' tab

---

| Option | Description | Selected |
|--------|-------------|----------|
| Three sections on one screen | Single Data screen: Export backup / Import backup / Sync with household | ✓ |
| Tabbed sub-navigation | Mini-tabs or segmented control: Export / Import / Sync | |
| Cards list with navigation | Three card items navigating to sub-screens | |

**User's choice:** Three sections on one screen

---

| Option | Description | Selected |
|--------|-------------|----------|
| Keep Trash as 5th tab — 5 tabs total | Medicines / Dashboard / Trash / Locations / Data | ✓ |
| Move Trash out — keep 4 tabs | Replace Trash tab with Data; Trash accessible from Data or overflow | |
| Keep 4 tabs, drop Locations to submenu | Replace Locations tab with Data; Locations moves to form picker | |

**User's choice:** Keep Trash — 5 tabs total (Medicines | Dashboard | Trash | Locations | Data)
**Notes:** User accepted the slightly tighter 5-tab layout; no tabs are removed.

---

## JSON import: merge vs replace

| Option | Description | Selected |
|--------|-------------|----------|
| Full replace | Wipe local DB and replace entirely with imported file | ✓ |
| Merge: last-write-wins on updatedAt | Per-record comparison; keep whichever is newer | |
| Merge: imported always wins | Imported records overwrite local; local-only records kept | |

**User's choice:** Full replace
**Notes:** Chosen for simplicity. User accepted the tradeoff (risk of losing recent changes if import order is wrong).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — confirmation dialog with consequences | "This will replace all {N} medicines…" before replacing | ✓ |
| Yes — but offer 'make a backup first' step | Two-step safety net: export first, then import | |
| No confirmation — just import | Replace immediately on file selection | |

**User's choice:** Confirmation dialog with consequences

---

| Option | Description | Selected |
|--------|-------------|----------|
| Success toast + stay on Data screen | Toast: "Imported: {N} medicines, {M} locations" | ✓ |
| Redirect to Medicines list with success banner | Navigate to Medicines tab after import | |
| Summary screen before committing | Preview counts before the replace proceeds | |

**User's choice:** Success toast + stay on Data screen

---

| Option | Description | Selected |
|--------|-------------|----------|
| Medicines + locations + history | Export only what exists in the DB schema | ✓ |
| Medicines + locations + history + app settings | Include empty settings section for future-compat | |

**User's choice:** Medicines + locations + history
**Notes:** Categories are hardcoded (D-10); no settings table exists. Export matches actual DB tables.

---

## OneDrive sync flow design

| Option | Description | Selected |
|--------|-------------|----------|
| Two-button design with instructions | Same Export + Import buttons; Sync section is instructions only | ✓ |
| Step-by-step wizard | Multi-step modal: Export → instructions → Import | |
| Single 'Sync Now' button with mode | One button that asks export or import | |

**User's choice:** Two-button design with instructions

---

| Option | Description | Selected |
|--------|-------------|----------|
| Unified: one Export + one Import — no duplication | Sync section is instructions-only; no extra buttons | ✓ |
| Separate sections with separate buttons | 4 buttons total (backup export, backup import, sync export, sync import) | |
| Combine into single 'Data Management' section | No separate Sync section; just a hint | |

**User's choice:** Unified — no button duplication
**Notes:** Sync with household section explains: use Export/Import above to sync via shared OneDrive folder.

---

| Option | Description | Selected |
|--------|-------------|----------|
| medstock-backup-YYYY-MM-DD.json | Date-stamped filename; multiple backups coexist | ✓ |
| medstock-backup.json (fixed name) | Fixed filename; convenient for always-overwrite OneDrive sync | |

**User's choice:** medstock-backup-YYYY-MM-DD.json

---

## Claude's Discretion

- Exact visual design of Data screen sections (dividers, card style, icons)
- CSV import error handling for individual malformed rows (skip + count of skipped rows)
- Whether Export button shows a spinner during Blob generation
- Exact wording of the Sync with household instructions
- CSV preview row count (decided as 5 rows in CONTEXT.md)
- CSV import UX within the Data screen layout (dropzone vs file button)

## Deferred Ideas

None — discussion stayed within phase scope.

iOS Safari spike (area presented but not selected for discussion): User opted to proceed to planning without a dedicated iOS Safari File Picker spike. Noted in CONTEXT.md code_context as a fallback requirement: always use `<input type="file">`, never `window.showOpenFilePicker()` without fallback.
