# Phase 1: PWA Foundation & Inventory CRUD - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 01-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-30
**Phase:** 1-PWA Foundation & Inventory CRUD
**Areas discussed:** Navigation structure, Hosting, Medicine form flow, Expiry status logic, Location management UX

---

## Navigation Structure

### Routing level

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-route with React Router | Distinct routes per screen; browser back/forward works naturally; Phase 2 adds routes without refactoring | ✓ |
| Single-page + modals/drawers | One page, overlays for add/edit/view; simpler initially but hard to link to filter state in Phase 2 | |

**User's choice:** Multi-route

---

### Navigation pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom tab bar | Fixed tabs at bottom; instant switch between sections; standard mobile feel | ✓ |
| Hamburger / sidebar menu | Slide-out panel; common in desktop apps; extra tap per section | |
| Top navigation bar | Links in header; cramped on mobile; less native on PWA install | |

**User's choice:** Bottom tab bar

---

### Landing screen

| Option | Description | Selected |
|--------|-------------|----------|
| Medicine list | / redirects to /medicines; list is the product; dashboard is Phase 2 | ✓ |
| Stub dashboard | Minimal dashboard shell; establishes Phase 2 layout early; risk of premature decisions | |

**User's choice:** Medicine list

---

## Hosting (GitHub Pages)

### Router approach

| Option | Description | Selected |
|--------|-------------|----------|
| HashRouter | URLs like /#/medicines; works on GitHub Pages with zero config; # in URL | ✓ |
| BrowserRouter + 404.html trick | Clean URLs; requires custom 404.html redirect; fragile | |

**User's choice:** HashRouter

---

### Repository name (for Vite base path)

| Option | Description | Selected |
|--------|-------------|----------|
| med-stock | base: '/med-stock/' | ✓ |
| medstock | base: '/medstock/' | |
| Different name | User-specified | |

**User's choice:** med-stock

---

## Medicine Form Flow

### Form presentation

| Option | Description | Selected |
|--------|-------------|----------|
| One-step full form | All ~9 fields visible in scrollable page; fewest taps | ✓ |
| Two-step wizard | Step 1: Identity; Step 2: Dates & quantity; extra Next tap | |

**User's choice:** One-step full form

---

### Period-after-opening units

| Option | Description | Selected |
|--------|-------------|----------|
| Days / Weeks / Months | Real-world packaging units; stored as { value, unit } | ✓ |
| Days only (normalized) | User calculates months to days manually; bad UX | |
| Days / Weeks / Months / Years | Adds Years for long-shelf-life; can be added later | |

**User's choice:** Days / Weeks / Months — `{ value: number, unit: 'days' | 'weeks' | 'months' }`

---

### Quantity unit approach

| Option | Description | Selected |
|--------|-------------|----------|
| Predefined list + free text | tablets, capsules, ml, g, pcs, patches, drops, doses + Other | ✓ |
| Free text only | Maximum flexibility; risks inconsistent values | |
| Predefined list only | Clean data; blocks unusual medicines | |

**User's choice:** Predefined list + free text "Other"

---

### Required vs optional fields

| Option | Description | Selected |
|--------|-------------|----------|
| Name + Expiry Date required | Minimum viable record; fewest taps at pharmacy | ✓ |
| Name + Category + Location + Expiry required | Forces completeness; adds friction | |
| Name only required | Maximum flexibility; defeats core value without expiry | |

**User's choice:** Required: Name, Expiry Date. Everything else optional.

---

### Predefined categories

| Option | Description | Selected |
|--------|-------------|----------|
| Standard medicine categories | 10 categories covering household use | ✓ |
| Minimal starter set | 4 categories; users hit "Other" a lot | |
| Let me define the list | User-specified set | |

**User's choice:** Pain & Fever, Antibiotics, Allergy, Digestive, Vitamins & Supplements, Skin & Topical, Eye & Ear, Cold & Flu, Heart & Circulation, Other

---

## Expiry Status Logic

### Where calculation lives

| Option | Description | Selected |
|--------|-------------|----------|
| Pure utility function | calculateStatus(medicine, now) in src/lib/expiry.ts; easy to test; no coupling | ✓ |
| Dexie computed / virtual field | Couples business logic to DB layer; harder to test | |
| Zustand derived selector | Only exists in state store; can't reuse in Dexie query context | |

**User's choice:** Pure utility function

---

### Storage of status

| Option | Description | Selected |
|--------|-------------|----------|
| Always derived at read time | Never stored in DB; no stale-status bugs | ✓ |
| Persisted in DB, recalculated on update | Needs background job; complex to keep correct | |

**User's choice:** Derived at read time — no status field in Dexie

---

### Auto vs manual statuses

| Option | Description | Selected |
|--------|-------------|----------|
| Auto: Active/Opened/Expired — Manual: Used Up/Disposed/Archived | Clean split between date-driven and lifecycle statuses | ✓ |
| All 6 auto-calculated | No manual lifecycle states; user deletes instead | |

**User's choice:** AUTO: Active, Opened, Expired. MANUAL: Used Up, Disposed, Archived.

---

### Edge case: no expiry date, PAO set

| Option | Description | Selected |
|--------|-------------|----------|
| Use PAO only | Opened if within PAO window, Expired if past; common for topicals | ✓ |
| Require expiry date (block save) | Consistent but blocks import data without expiry | |
| Active with a warning | Flexible but less safe | |

**User's choice:** Use PAO only (expiry date check skipped)

---

### Edge case: opened date set, no PAO

| Option | Description | Selected |
|--------|-------------|----------|
| Show Opened, use expiry date only | PAO check skipped; expiry date still governs | ✓ |
| Same as Active (ignore opened date) | Inconsistency: why allow setting opened date then? | |
| Warn: incomplete data | Forces completeness; many OTC medicines have no PAO | |

**User's choice:** Show Opened — PAO check skipped entirely

---

## Location Management UX

### Where users can add custom locations

| Option | Description | Selected |
|--------|-------------|----------|
| Both — inline from form + Locations screen | "Add new location..." in dropdown + full Locations tab | ✓ |
| Locations screen only | Extra context-switch during add-medicine flow | |
| Inline only | Conflicts with LOC-05 requirement | |

**User's choice:** Both paths — inline quick-add AND Locations screen

---

### 'Other' definition

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded sentinel (location = null) | medicine.location ?? 'Other'; never deletable; no DB record | ✓ |
| Predefined DB record (id=1, protected) | Referential integrity; adds delete-protection complexity | |

**User's choice:** Hardcoded sentinel — `location: string | null`, display `medicine.location ?? 'Other'`

---

### Predefined locations storage

| Option | Description | Selected |
|--------|-------------|----------|
| Predefined + stored in DB | All 8 in Locations table with isDefault=true | ✓ |
| Hardcoded (not in DB) | Not editable; simpler but harder to query uniformly | |

**User's choice:** Predefined in DB with `isDefault: true`

---

### Rename/delete of predefined locations

| Option | Description | Selected |
|--------|-------------|----------|
| No rename/delete for predefined | isDefault=true → hide edit/delete buttons | ✓ |
| Rename allowed, delete blocked | More flexible; adds complexity | |

**User's choice:** Predefined locations are read-only

---

### Location display order

| Option | Description | Selected |
|--------|-------------|----------|
| All alphabetical | Predefined and custom mixed A-Z | ✓ |
| Predefined first, then custom A-Z | Stable anchor + custom below | |
| Most recently used first | Reduces taps; adds LRU tracking | |

**User's choice:** All alphabetical

---

## Claude's Discretion

- Transition animations between routes (slide, fade, or none)
- Visual treatment of inline "Add new location" dialog (sheet vs inline input vs modal)
- Empty state illustrations vs text-only
- PWA icon set and splash screen design

## Deferred Ideas

None — discussion stayed within phase scope.
