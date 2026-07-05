---
status: complete
phase: 02-search-dashboard-audit
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md]
started: 2026-07-05T00:00:00Z
updated: 2026-07-05T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 10
name: Change History in Medicine Detail
expected: |
  Open any medicine that has been created or edited. Below the fields, there is a collapsible "Change History" section. Expanding it reveals a timeline of entries formatted as "{timestamp} — {action summary}".
result: pass
status: UAT complete — all 10 human checkpoints passed

## Tests

### 1. Search by Medicine Name
expected: Open the Medicines screen. Type 2–3 characters of a medicine name in the search bar. The list filters instantly — only name-matching medicines are visible (case-insensitive). Clearing the field restores the full list.
result: pass

### 2. Filter Bottom Sheet
expected: Tap the filter/sliders icon on the Medicines screen. A bottom sheet slides up showing options for Status (6 options), Category (10 options), and Locations (from your data), plus Sort controls. Selecting options and tapping Apply (or dismissing) should update the list.
result: pass
note: No explicit Apply/dismiss button — filters apply reactively as options are tapped. User confirmed this behavior is acceptable.

### 3. Filter Chips Display and Dismissal
expected: After applying at least one filter (e.g. a Status), a chip appears below the search bar labelling the active filter. Tapping the X on the chip removes that filter and the list updates immediately.
result: pass

### 4. 4-Tab Navigation
expected: The bottom navigation bar shows 4 tabs: Medicines, Dashboard, Trash, and Locations. Tapping Dashboard navigates to the Dashboard screen; tapping Trash navigates to the Trash screen; tapping back returns to Medicines.
result: pass

### 5. Dashboard — 4 Metric Cards Layout
expected: Open the Dashboard tab. You see 4 cards arranged in a 2×2 grid: "Total Medicines" (white/neutral, non-tappable), "Expired" (red), "Expiring Soon" (amber), and "Exceeded Open Period" (orange). Each card shows a number. Color coding and layout are visually clear.
result: pass

### 6. Dashboard — Tap Expired Card Navigation
expected: Tap the "Expired" card on the Dashboard. The app navigates to the Medicines screen with an "Expired" filter chip already active — only expired medicines are shown in the list.
result: pass

### 7. Dashboard — Tap Exceeded Open Period Card Navigation
expected: Tap the "Exceeded Open Period" card on the Dashboard. The app navigates to the Medicines screen with an "ExceededOpenPeriod" filter chip active — only PAO-exceeded medicines (not date-expired) are shown.
result: fail → fixed
gap: calculateStatus() returned 'Expired' for both date-expired and PAO-exceeded medicines. Added 'ExceededOpenPeriod' as a distinct AutoStatus. Fixed expiry.ts, StatusBadge, FilterBottomSheet, dashboard handler and metric. All 56 tests pass.

### 8. Dashboard — Metric Counts Are Correct
expected: Add a medicine with a past expiry date and one with a future expiry date. The Dashboard "Expired" count should reflect the count of expired medicines, and "Total" should count all active (non-deleted) medicines. Counts update when you add or delete medicines.
result: pass

### 9. Trash Bin — Soft Delete and Restore
expected: On a medicine's detail screen, tap Delete (or the delete action). The medicine disappears from the main list. Navigate to the Trash tab — the medicine appears there. Tapping Restore returns it to the main list. Tapping "Delete Permanently" shows a confirmation dialog; confirming removes it from Trash.
result: pass

### 10. Change History in Medicine Detail
expected: Open any medicine that has been created or edited. Below the fields, there is a collapsible "Change History" section (possibly showing an entry count). Expanding it reveals a timeline of entries formatted as "{timestamp} — {action summary}" (e.g. "2026-07-01 — Created" or "2026-07-01 — Updated: name changed from X to Y").
result: pass

### 11. DashboardCard component (automated)
expected: DashboardCard renders as button or div with correct label, count, and colorClass (TypeScript compilation verified)
result: pass
source: automated
coverage_id: 02-03-D1

### 12. Soft-delete mechanism (automated)
expected: [id].tsx handleDelete calls softDeleteMedicine() — not manualStatus='Disposed' (grep verified)
result: pass
source: automated
coverage_id: 02-04-D1

### 13. Edit form history recording (automated)
expected: [id].edit.tsx handleSubmit calls updateMedicineWithHistory() — direct db.medicines.update removed (grep verified)
result: pass
source: automated
coverage_id: 02-04-D2

### 14. Create form history recording (automated)
expected: new.tsx calls addMedicineHistory(newMedicine, 'created') after db.medicines.add() (grep verified)
result: pass
source: automated
coverage_id: 02-04-D3

### 15. HistoryEntry format (automated)
expected: HistoryEntry.tsx exports HistoryEntry and contains formatEntry — entry format verified by grep
result: pass
source: automated
coverage_id: 02-04-D6

## Summary

total: 15
passed: 15
issues: 1
pending: 0
skipped: 0
note: G-01 (ExceededOpenPeriod distinct status) discovered and fixed during UAT

## Gaps

### G-01 — ExceededOpenPeriod is a distinct status (fixed)
- **Discovered:** Test 7 — Dashboard Exceeded Open Period tap showed all Expired medicines
- **Root cause:** `calculateStatus()` returned `'Expired'` for both date-expired and PAO-exceeded cases; no way to filter them separately
- **Fix:** Added `'ExceededOpenPeriod'` to `AutoStatus`; updated `calculateStatus()`, `StatusBadge`, `FilterBottomSheet`, Dashboard metric query and tap handler
- **Verified:** 56/56 tests pass
