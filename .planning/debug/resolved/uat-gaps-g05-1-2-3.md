---
status: resolved
trigger: "UAT diagnosis — G-05-1 opened-date no effect, G-05-2 no box count field, G-05-3 open-box decrements 1 unit"
created: 2026-08-25T00:00:00Z
updated: 2026-08-26T00:00:00Z
---

## Current Focus

hypothesis: Three distinct gaps: (1) Open box button appears even when openedDate already set, (2) schema has no box/pack count field, (3) handleOpenBoxClick hardcodes quantity=1 decrement
test: Static code trace across db.ts / StockFields.tsx / new.tsx / [id].tsx / expiry.ts
expecting: Confirmed — all three gaps confirmed by direct code inspection
next_action: Return ROOT CAUSE FOUND structured diagnosis to orchestrator

## Symptoms

expected: (G-05-1) Setting openedDate in Add form marks entry as Opened. (G-05-2) Form has field for number of boxes. (G-05-3) Open box prompts for units per box.
actual: (G-05-1) openedDate is saved and calculateStatus returns Opened, but Open box button still appears. (G-05-2) No packCount/numberOfBoxes field in schema or form. (G-05-3) Open box always creates quantity=1 and decrements by 1.
errors: No runtime errors — all gaps are logic/UX/schema gaps
reproduction: (G-05-1) Add stock with Date Opened filled; observe Open box button still visible in detail. (G-05-2) Open Add Stock form; no box count input exists. (G-05-3) Stock with quantity=20; click Open box; original becomes 19, new entry has 1.
started: Initial implementation — never worked as expected for these use cases

## Eliminated

- hypothesis: openedDate not saved by addStockEntry
  evidence: new.tsx handleStockSubmit line 83 passes openedDate: data.openedDate ?? null; stockOps.ts addStockEntry spreads all data fields including openedDate
  timestamp: 2026-08-25T00:00:00Z

- hypothesis: calculateStatus ignores openedDate
  evidence: expiry.ts lines 64-82 — opened = med.openedDate ? new Date(med.openedDate) : null; D-15 path returns Opened when expiry+opened+!pao; standard path returns Opened when opened is truthy
  timestamp: 2026-08-25T00:00:00Z

- hypothesis: Medicine schema has a packCount field that form is missing
  evidence: db.ts Medicine interface lines 24-45 — only quantity: number|null and quantityUnit: string|null; no pack/box count field exists anywhere in schema
  timestamp: 2026-08-25T00:00:00Z

## Evidence

- timestamp: 2026-08-25T00:00:00Z
  checked: src/lib/db.ts Medicine interface
  found: Fields quantity: number|null and quantityUnit: string|null only. No numberOfBoxes, packCount, boxCount, or similar field.
  implication: G-05-2 is a schema-level gap — the concept of box count does not exist in the data model.

- timestamp: 2026-08-25T00:00:00Z
  checked: src/components/StockFields.tsx stockSchema and JSX
  found: stockSchema has quantity + quantityUnit only; UI has one "Quantity" section with number input + unit select; no box count field.
  implication: Confirms G-05-2 — the form mirrors the schema exactly; neither has a box count concept.

- timestamp: 2026-08-25T00:00:00Z
  checked: src/routes/medicines/new.tsx handleStockSubmit
  found: openedDate: data.openedDate ?? null is passed to addStockEntry on line 83; manualStatus: null hardcoded.
  implication: G-05-1 data pathway is correct — openedDate IS saved to DB when provided in form.

- timestamp: 2026-08-25T00:00:00Z
  checked: src/lib/expiry.ts calculateStatus
  found: Standard path line 81: if (opened) return 'Opened'. D-15 path line 74-76: if (expiry && opened && !med.pao) return 'Opened'. Both paths return Opened when openedDate is set.
  implication: Status IS Opened when openedDate is set — the form works, the status is correct.

- timestamp: 2026-08-25T00:00:00Z
  checked: src/routes/medicines/[id].tsx Open box button visibility condition (line 241)
  found: {(stock.quantity ?? 0) > 1 && (<Button>Open box</Button>)}. Condition only checks quantity > 1; does NOT check stock.openedDate === null.
  implication: G-05-1 root cause confirmed. Button appears even when stock is already opened, misleading user into thinking openedDate had no effect.

- timestamp: 2026-08-25T00:00:00Z
  checked: src/routes/medicines/[id].tsx handleOpenBoxClick (lines 106-140)
  found: Creates new stock entry with quantity: 1 (hardcoded, line 115). Decrements original with (stock.quantity ?? 0) - 1 (hardcoded, line 130). No user prompt, no units-per-box calculation.
  implication: G-05-3 root cause confirmed. Open box always treats 1 unit as one box regardless of actual box size.

## Resolution

root_cause: |
  G-05-1: Open box button visibility in [id].tsx uses condition (stock.quantity ?? 0) > 1 with no guard for stock.openedDate !== null. The openedDate field in StockFields IS saved correctly and calculateStatus DOES return Opened when set. The user confusion arises because the button still appears on already-opened stock.
  G-05-2: Medicine schema (db.ts) has no box/pack count field. StockFields.tsx has a single quantity input (units-per-pack like tablets) with no separate input for number of boxes/packs. The concept of box count is absent from the data model.
  G-05-3: handleOpenBoxClick in [id].tsx hardcodes quantity: 1 for the new opened entry and (stock.quantity ?? 0) - 1 for the decrement. No prompt or stored value exists to derive units-per-box; this is compounded by G-05-2's missing packCount field.
fix: not applied — diagnose-only mode
verification: static code trace
files_changed: []
