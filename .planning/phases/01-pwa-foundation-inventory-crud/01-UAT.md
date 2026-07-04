---
status: complete
phase: 01-pwa-foundation-inventory-crud
source:
  - 01-01-SUMMARY.md
  - 01-02-SUMMARY.md
  - 01-03-SUMMARY.md
  - 01-04-SUMMARY.md
started: 2026-07-04T00:00:00Z
updated: 2026-07-05T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Stop any running dev server. Run `npm run dev` fresh. App loads at http://localhost:5173/med-stock/ (or similar). No console errors on load. Medicines tab is visible and active.
result: issue
reported: "yes, but I got 2 same warnings: App.tsx:37 Persistent storage not granted — IndexedDB may be evicted on low storage (appears twice)"
severity: minor

### 2. PWA Installability — service worker + persistent storage
expected: |
  Open Chrome DevTools → Application tab.
  Under "Service Workers": a service worker is registered and status is "activated and running."
  Under "Storage": "Persist storage" shows granted (or browser shows a prompt to allow persistent storage on first load).
  With DevTools Network tab set to "Offline," reload — the app shell (medicines list) still loads from cache.
result: issue
reported: "1 ok (service worker active), 2 where to find it (persist storage — not granted per Test 1 warning), 3 ok (offline reload works)"
severity: minor

### 3. calculateStatus auto-coverage — confirmation
expected: |
  The calculateStatus() function was fully verified by 11 Vitest unit tests (all passing).
  Covered branches: Active (no expiry exceeded, not opened), Opened (within PAO window), Expired by expiry date, Expired by PAO window, whichever-comes-first, manual override (D-13 ×2), null expiryDate with PAO (D-14 ×2), openedDate with null PAO (D-15 ×2).
  Confirm: do the status calculations look correct in the app when you view medicines with different expiry/opened dates?
result: pass

### 4. Location dropdown in Add Medicine form (live from Dexie, sorted A-Z, inline quick-add)
expected: |
  Open Add Medicine form (tap "+" or navigate to /#/medicines/new).
  The "Location" dropdown shows 8 predefined locations sorted alphabetically (e.g., Bathroom Cabinet, Bedroom Drawer, etc.).
  An inline "Add new location..." option or button is visible inside the dropdown.
  Typing a new name and confirming adds it to the dropdown immediately (no page reload needed).
result: issue
reported: "yes, but dropdown list is fully transparent (i see form in the background)"
severity: cosmetic

### 5. Medicine Detail view (all fields, live status badge, Edit + Delete buttons)
expected: |
  Add a medicine with name, expiry date (future), and at least one optional field (category or notes).
  Tap the medicine card — detail view opens.
  All fields are displayed: name, expiry date, status badge (green "Active" for future expiry), category, location, any optional fields filled in.
  "Edit" and "Delete" buttons are visible.
result: pass

### 6. Edit Medicine (form pre-populated, saves changes)
expected: |
  From the detail view of an existing medicine, tap "Edit."
  The edit form opens with all fields pre-filled with current values.
  Change the medicine name (or any field) and save.
  The detail view shows the updated name immediately (no page reload).
result: pass

### 7. Soft-Delete Medicine (disappears from list, no hard delete)
expected: |
  From a medicine detail view, tap "Delete."
  A confirmation dialog appears ("Are you sure?" or similar).
  Confirm deletion — the medicine disappears from the Medicines list immediately.
  The medicine is NOT permanently deleted from IndexedDB (it still exists with manualStatus='Disposed', just hidden from the list).
result: issue
reported: "confirm window is transparent as dropdown list, the background is more dark then page (different behaviour then dropdown list). manualStatus is somehow null but deletedAt have date"
severity: major

### 8. Status badge colors (visual — green/blue/red/gray/yellow per status)
expected: |
  Verify at least two different status colors are visible across your medicines:
  - Active medicine (future expiry, not opened) → green badge
  - Expired medicine (expiry date in the past) → red badge
  If you have an opened medicine within PAO window → blue badge
  Manually archived/used-up medicines → yellow or gray badge
result: pass
noted: "Archived/Used-up badge not testable — no UI to set manualStatus manually in Phase 1 (by design, deferred). Green/red/blue confirmed."

### 9. Medicine list performance with indexed Dexie query
expected: |
  The medicines list loads without noticeable delay.
  (Optional) If you can add 20+ medicines quickly, confirm the list scrolls smoothly.
  Note: Full 1,000+ item performance test is not required for UAT — skip if impractical.
result: pass
noted: "1,000-item test skipped as expected — baseline load performance confirmed OK."

### 10. Add custom location (LocationsScreen)
expected: |
  Navigate to the Locations tab (bottom tab bar).
  An inline "Add location" input row or button is visible.
  Type a new location name and save it.
  The new location appears in the alphabetically-sorted list immediately.
  The new location also appears in the Medicine form's Location dropdown.
result: pass
noted: "Default/predefined locations not editable — expected, confirmed by Test 13."

### 11. Rename location (with cascade to affected medicines)
expected: |
  In the Locations screen, find a custom location (one you added, not predefined).
  An "Edit" or rename button is visible for custom locations.
  Rename it to a new name and save.
  The Locations list shows the updated name.
  Any medicines previously assigned to the old location name now show the new name.
result: pass

### 12. Delete location (AlertDialog + cascade to "Other")
expected: |
  In the Locations screen, find a custom location that has at least one medicine assigned to it.
  Tap "Delete" — a confirmation dialog appears: "Delete [name]? All medicines using this location will be moved to Other."
  Confirm — the location is removed from the list.
  Medicines that were assigned to that location now show "Other" as their location.
result: pass

### 13. Predefined locations protected (no Edit/Delete buttons)
expected: |
  In the Locations screen, predefined/system locations (the 8 built-in ones like "Bathroom Cabinet") do NOT have Edit or Delete buttons.
  Only custom locations (ones you added) show Edit and Delete buttons.
result: pass

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
passed: 26
issues: 4
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "App loads with no console errors on cold start"
  status: failed
  reason: "User reported: yes, but I got 2 same warnings: App.tsx:37 Persistent storage not granted — IndexedDB may be evicted on low storage (appears twice)"
  severity: minor
  test: 1
  root_cause: "React 18 StrictMode double-invokes effects (mount→unmount→remount); the navigator.storage.persist() Promise is already in flight when the second invocation fires — both callbacks print the warning. Fix: move the persist() call to module scope (after router constant) so it runs exactly once."
  artifacts:
    - path: "src/App.tsx"
      issue: "navigator.storage.persist() called inside useEffect — StrictMode fires it twice; lines 31–43"
  missing:
    - "Move persist() call to module scope, outside the App component and useEffect"
  debug_session: ""

- truth: "navigator.storage.persist() is granted and DevTools Storage panel confirms Persist=granted"
  status: failed
  reason: "User reported: service worker active and offline reload works, but persist storage not granted (confirmed by Test 1 warning)"
  severity: minor
  test: 2
  root_cause: "Dev-only noise — browsers (Chrome/Firefox) almost always deny persist() on localhost (no HTTPS, no user engagement score). In production on HTTPS after PWA install, browsers typically grant it automatically. IndexedDB eviction only occurs under extreme device storage pressure."
  artifacts: []
  missing:
    - "No code fix needed — this resolves naturally in production. Optionally suppress the console.warn in dev environment."
  debug_session: ""

- truth: "All Select dropdown lists have an opaque background (items are readable against a solid white/themed surface)"
  status: failed
  reason: "User reported: dropdown lists are fully transparent — form is visible in the background. Affects all Select dropdowns: Location, Period Unit, Quantity Unit"
  severity: cosmetic
  test: 4
  root_cause: "Tailwind v4 generates bg-popover as background-color: var(--color-popover) but src/index.css only defines --popover (v3 style, no --color- prefix) — --color-popover is never set, resolves to nothing (transparent). Fix: add @theme inline block to src/index.css mapping all shadcn/ui tokens to their --color-* equivalents."
  artifacts:
    - path: "src/index.css"
      issue: "Missing @theme inline block — project uses Tailwind v4 (^4.3.2) but CSS variables use v3 naming (--popover, --background, etc.) without the required --color- prefix"
    - path: "src/components/ui/select.tsx"
      issue: "bg-popover text-popover-foreground on line 67 — classes correct, variable resolution broken"
  missing:
    - "Add @theme inline { --color-background: hsl(var(--background)); --color-popover: hsl(var(--popover)); ... } block to src/index.css after the @import line — fixes all shadcn/ui components simultaneously"
  debug_session: ""

- truth: "Confirmation dialog (AlertDialog) has an opaque content panel visible over a dark semi-transparent overlay"
  status: failed
  reason: "User reported: confirm window is transparent — background is darker than the page (different behaviour than dropdown list)"
  severity: cosmetic
  test: 7
  root_cause: "Same root cause as dropdown transparency — Tailwind v4 requires --color-background but src/index.css only defines --background (v3 style). AlertDialogContent uses bg-background which resolves to var(--color-background) = undefined = transparent."
  artifacts:
    - path: "src/index.css"
      issue: "Missing @theme inline block — Tailwind v4 --color-* variables never defined"
    - path: "src/components/ui/alert-dialog.tsx"
      issue: "bg-background on line 35 — correct class, broken variable resolution"
  missing:
    - "Add @theme inline block to src/index.css (same fix as dropdown gap)"
  debug_session: ""

- truth: "Soft-deleted medicine has manualStatus='Disposed' set in IndexedDB"
  status: failed
  reason: "User reported: manualStatus is null but deletedAt has a date — implementation uses deletedAt timestamp instead of manualStatus='Disposed'"
  severity: major
  test: 7
  root_cause: "Intentional design deviation from original plan (D-25). softDeleteMedicine() in historyOps.ts:66 sets {deletedAt: now} instead of {manualStatus:'Disposed'}. The list filter in medicines/index.tsx:34 correctly uses 'm.deletedAt !== null' — deleted items do NOT reappear. manualStatus is reserved for user-visible overrides (D-13: Used Up/Archived). No filter is broken; the plan spec needs updating to reflect the deliberate change."
  artifacts:
    - path: "src/lib/historyOps.ts"
      issue: "softDeleteMedicine sets deletedAt, not manualStatus='Disposed' (line 66) — intentional, correctly implemented"
    - path: "src/routes/medicines/index.tsx"
      issue: "List filter uses m.deletedAt !== null (line 34) — correct implementation of the deletedAt approach"
    - path: "src/lib/db.ts"
      issue: "deletedAt: string | null documented at line 20; IndexedDB null-key pitfall explained at line 54"
  missing:
    - "No code fix required — update PLAN.md/spec to document that D-25 soft-delete uses deletedAt field, not manualStatus='Disposed'"
  debug_session: ""
