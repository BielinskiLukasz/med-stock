---
status: testing
phase: 01-pwa-foundation-inventory-crud
source:
  - 01-01-SUMMARY.md
  - 01-02-SUMMARY.md
  - 01-03-SUMMARY.md
  - 01-04-SUMMARY.md
started: 2026-07-04T00:00:00Z
updated: 2026-07-04T00:00:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
  Stop any running dev server. Run `npm run dev` fresh.
  App loads at http://localhost:5173/med-stock/ (or similar).
  No console errors on load. Medicines tab is visible and active.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Stop any running dev server. Run `npm run dev` fresh. App loads at http://localhost:5173/med-stock/ (or similar). No console errors on load. Medicines tab is visible and active.
result: [pending]

### 2. PWA Installability — service worker + persistent storage
expected: |
  Open Chrome DevTools → Application tab.
  Under "Service Workers": a service worker is registered and status is "activated and running."
  Under "Storage": "Persist storage" shows granted (or browser shows a prompt to allow persistent storage on first load).
  With DevTools Network tab set to "Offline," reload — the app shell (medicines list) still loads from cache.
result: [pending]

### 3. calculateStatus auto-coverage — confirmation
expected: |
  The calculateStatus() function was fully verified by 11 Vitest unit tests (all passing).
  Covered branches: Active (no expiry exceeded, not opened), Opened (within PAO window), Expired by expiry date, Expired by PAO window, whichever-comes-first, manual override (D-13 ×2), null expiryDate with PAO (D-14 ×2), openedDate with null PAO (D-15 ×2).
  Confirm: do the status calculations look correct in the app when you view medicines with different expiry/opened dates?
result: [pending]

### 4. Location dropdown in Add Medicine form (live from Dexie, sorted A-Z, inline quick-add)
expected: |
  Open Add Medicine form (tap "+" or navigate to /#/medicines/new).
  The "Location" dropdown shows 8 predefined locations sorted alphabetically (e.g., Bathroom Cabinet, Bedroom Drawer, etc.).
  An inline "Add new location..." option or button is visible inside the dropdown.
  Typing a new name and confirming adds it to the dropdown immediately (no page reload needed).
result: [pending]

### 5. Medicine Detail view (all fields, live status badge, Edit + Delete buttons)
expected: |
  Add a medicine with name, expiry date (future), and at least one optional field (category or notes).
  Tap the medicine card — detail view opens.
  All fields are displayed: name, expiry date, status badge (green "Active" for future expiry), category, location, any optional fields filled in.
  "Edit" and "Delete" buttons are visible.
result: [pending]

### 6. Edit Medicine (form pre-populated, saves changes)
expected: |
  From the detail view of an existing medicine, tap "Edit."
  The edit form opens with all fields pre-filled with current values.
  Change the medicine name (or any field) and save.
  The detail view shows the updated name immediately (no page reload).
result: [pending]

### 7. Soft-Delete Medicine (disappears from list, no hard delete)
expected: |
  From a medicine detail view, tap "Delete."
  A confirmation dialog appears ("Are you sure?" or similar).
  Confirm deletion — the medicine disappears from the Medicines list immediately.
  The medicine is NOT permanently deleted from IndexedDB (it still exists with manualStatus='Disposed', just hidden from the list).
result: [pending]

### 8. Status badge colors (visual — green/blue/red/gray/yellow per status)
expected: |
  Verify at least two different status colors are visible across your medicines:
  - Active medicine (future expiry, not opened) → green badge
  - Expired medicine (expiry date in the past) → red badge
  If you have an opened medicine within PAO window → blue badge
  Manually archived/used-up medicines → yellow or gray badge
result: [pending]

### 9. Medicine list performance with indexed Dexie query
expected: |
  The medicines list loads without noticeable delay.
  (Optional) If you can add 20+ medicines quickly, confirm the list scrolls smoothly.
  Note: Full 1,000+ item performance test is not required for UAT — skip if impractical.
result: [pending]

### 10. Add custom location (LocationsScreen)
expected: |
  Navigate to the Locations tab (bottom tab bar).
  An inline "Add location" input row or button is visible.
  Type a new location name and save it.
  The new location appears in the alphabetically-sorted list immediately.
  The new location also appears in the Medicine form's Location dropdown.
result: [pending]

### 11. Rename location (with cascade to affected medicines)
expected: |
  In the Locations screen, find a custom location (one you added, not predefined).
  An "Edit" or rename button is visible for custom locations.
  Rename it to a new name and save.
  The Locations list shows the updated name.
  Any medicines previously assigned to the old location name now show the new name.
result: [pending]

### 12. Delete location (AlertDialog + cascade to "Other")
expected: |
  In the Locations screen, find a custom location that has at least one medicine assigned to it.
  Tap "Delete" — a confirmation dialog appears: "Delete [name]? All medicines using this location will be moved to Other."
  Confirm — the location is removed from the list.
  Medicines that were assigned to that location now show "Other" as their location.
result: [pending]

### 13. Predefined locations protected (no Edit/Delete buttons)
expected: |
  In the Locations screen, predefined/system locations (the 8 built-in ones like "Bathroom Cabinet") do NOT have Edit or Delete buttons.
  Only custom locations (ones you added) show Edit and Delete buttons.
result: [pending]

---

<!-- Auto-verified entries (from unit tests and build verification — not presented to user) -->

### A1. [Auto] Dexie schema v1 — medicines + locations tables with 8 predefined location seeds
expected: Dexie MedStockDB schema v1 with medicines + locations tables, Medicine and Location interfaces, 8 predefined location seeds
result: pass
source: automated
coverage_id: 01-01/D1

### A2. [Auto] createHashRouter at module scope — all 6 routes wired
expected: createHashRouter defined at module scope in App.tsx; all 6 routes wired
result: pass
source: automated
coverage_id: 01-01/D2

### A3. [Auto] MedicineList with useLiveQuery + Disposed filter + empty state
expected: MedicineList via useLiveQuery filtering Disposed items; empty state renders correctly
result: pass
source: automated
coverage_id: 01-01/D3

### A4. [Auto] Minimal add form writes to Dexie
expected: Add-medicine form (name + expiryDate) writes to Dexie IndexedDB on submit
result: pass
source: automated
coverage_id: 01-01/D4

### A5. [Auto] BottomTabBar — two NavLink tabs
expected: BottomTabBar with NavLink to /medicines and NavLink to /locations in RootLayout
result: pass
source: automated
coverage_id: 01-01/D6

### A6. [Auto] calculateStatus returns Active (future expiry, not opened)
expected: calculateStatus returns 'Active' when expiry is in future and medicine not opened
result: pass
source: automated
coverage_id: 01-02/D1

### A7. [Auto] calculateStatus returns Opened (within PAO window)
expected: calculateStatus returns 'Opened' when opened and PAO window has not elapsed
result: pass
source: automated
coverage_id: 01-02/D2

### A8. [Auto] calculateStatus returns Expired (past expiryDate)
expected: calculateStatus returns 'Expired' when now is past expiryDate
result: pass
source: automated
coverage_id: 01-02/D3

### A9. [Auto] calculateStatus returns Expired (past PAO window)
expected: calculateStatus returns 'Expired' when now is past openedDate + PAO window
result: pass
source: automated
coverage_id: 01-02/D4

### A10. [Auto] calculateStatus — whichever-first (expiry vs PAO)
expected: calculateStatus returns 'Expired' when expiry fires before PAO end
result: pass
source: automated
coverage_id: 01-02/D5

### A11. [Auto] D-13 manual override — Archived when dates valid
expected: manualStatus='Archived' takes precedence over auto-calculation when dates are valid
result: pass
source: automated
coverage_id: 01-02/D6

### A12. [Auto] D-13 manual override — Used Up when dates expired
expected: manualStatus='Used Up' takes precedence over auto-calculation when dates are expired
result: pass
source: automated
coverage_id: 01-02/D7

### A13. [Auto] D-14 null expiryDate + PAO — Opened within window
expected: calculateStatus returns 'Opened' when expiryDate is null, PAO is set, and within PAO window
result: pass
source: automated
coverage_id: 01-02/D8

### A14. [Auto] D-14 null expiryDate + PAO — Expired past window
expected: calculateStatus returns 'Expired' when expiryDate is null, PAO is set, and past PAO window
result: pass
source: automated
coverage_id: 01-02/D9

### A15. [Auto] D-15 openedDate + null PAO — Opened (expiry future)
expected: calculateStatus returns 'Opened' when openedDate is set, pao is null, and expiry is in the future
result: pass
source: automated
coverage_id: 01-02/D10

### A16. [Auto] D-15 openedDate + null PAO — Expired (expiry past)
expected: calculateStatus returns 'Expired' when openedDate is set, pao is null, and expiry is past
result: pass
source: automated
coverage_id: 01-02/D11

### A17. [Auto] MedicineForm Zod schema — required fields and nullable optionals
expected: MedicineForm with all 9 fields, Zod validation (required name+expiryDate, nullable optionals)
result: pass
source: automated
coverage_id: 01-03/D1

## Summary

total: 30
passed: 17
issues: 0
pending: 13
skipped: 0
blocked: 0

## Gaps

[none yet]
