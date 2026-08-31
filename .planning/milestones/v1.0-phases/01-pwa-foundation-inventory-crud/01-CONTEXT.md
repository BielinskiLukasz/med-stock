# Phase 1: PWA Foundation & Inventory CRUD - Context

**Gathered:** 2026-06-30
**Status:** Ready for planning

<domain>
## Phase Boundary

A household member can install MedStock on their device and manage their medicine inventory fully offline — adding, viewing, editing, and deleting packages with automatic expiry calculation across any location. This phase builds the entire foundation: Vite/React/TypeScript project scaffold, Dexie.js schema, full CRUD UI with React Hook Form + Zod, expiry status calculation, location management, PWA manifest + service worker, and iOS persistent-storage request.

</domain>

<decisions>
## Implementation Decisions

### Navigation & Routing
- **D-01:** Multi-route app with React Router. Distinct routes per screen: `/#/medicines`, `/#/medicines/new`, `/#/medicines/:id`, `/#/medicines/:id/edit`, `/#/locations`. Browser back/forward works naturally. Phase 2 adds `/dashboard`, `/trash` as new routes — no refactoring needed.
- **D-02:** Bottom tab bar as persistent navigation. Phase 1 ships with two tabs: Medicines + Locations. Phase 2 adds Dashboard and Trash tabs.
- **D-03:** Landing screen is the Medicine list (`/` redirects to `/#/medicines`). Empty state: "No medicines yet. Add your first one." + Add Medicine button.

### Hosting (GitHub Pages)
- **D-04:** HashRouter — URLs use `#` fragment (e.g., `https://[user].github.io/med-stock/#/medicines`). Works on GitHub Pages with zero server-side config. No 404.html redirect trick needed.
- **D-05:** Vite `base` config: `/med-stock/` (matches the GitHub repository name `med-stock`).

### Medicine Form
- **D-06:** One-step full form. All ~9 fields visible in a scrollable page. No wizard. Fewest taps — matches the "minimize taps" goal from PROJECT.md.
- **D-07:** Required fields: **Name** and **Expiry Date** only. All other fields (category, location, opened date, PAO, quantity, quantity unit, notes) are optional.
- **D-08:** Period-after-opening (PAO) stored as `{ value: number, unit: 'days' | 'weeks' | 'months' }`. Unit selector: Days / Weeks / Months.
- **D-09:** Quantity unit: predefined list (tablets, capsules, ml, g, pcs, patches, drops, doses) plus free-text "Other". Prevents inconsistent data while covering edge cases.
- **D-10:** Predefined categories (hardcoded, not user-editable in v1): Pain & Fever, Antibiotics, Allergy, Digestive, Vitamins & Supplements, Skin & Topical, Eye & Ear, Cold & Flu, Heart & Circulation, Other.

### Expiry Status Calculation
- **D-11:** Status is a **pure utility function** in `src/lib/expiry.ts`: `calculateStatus(medicine: Medicine, now: Date): MedicineStatus`. Called at render time. Easy to unit test. Same function used by Phase 2 for filter queries.
- **D-12:** Status is **never stored in the database** — always derived at read time. No stale-status bugs. No migration when logic changes. Dexie schema has no `status` field.
- **D-13:** Status split — **AUTO** (derived from dates): `Active` (not opened, expiry in future), `Opened` (opened date set, within PAO window), `Expired` (past expiry date OR past openedDate+PAO). **MANUAL** (user action overrides): `Used Up`, `Disposed`, `Archived`. Manual statuses stored in DB as a `manualStatus` field; they take precedence over auto-calculation in `calculateStatus`.
- **D-14:** Edge case — expiry date is null but PAO is set (can happen via import): use PAO only. `Opened` if within PAO window, `Expired` if past it. Expiry date check skipped.
- **D-15:** Edge case — opened date is set but PAO is null: status is `Opened` (if expiry date not past) or `Expired` (if past expiry date). PAO check skipped entirely.

### Location Management
- **D-16:** Users can add a new location **inline from the medicine form** (a `+ Add new location...` option at the bottom of the Location dropdown opens a quick-add dialog) AND from the dedicated **Locations screen** (LOC-05). Both paths are supported.
- **D-17:** `'Other'` is a **hardcoded sentinel** — not a database record. `location` field in Dexie is `string | null`. Display logic: `medicine.location ?? 'Other'`. LOC-04 behavior: delete custom location → set affected medicines' `location` to `null`.
- **D-18:** Predefined locations are **stored in the Dexie Locations table** with `isDefault: true`. They cannot be renamed or deleted — the Locations screen hides edit/delete buttons for them. User-created locations have `isDefault: false` and support rename + delete.
- **D-19:** Location display order in dropdown and Locations screen: **all alphabetical** (predefined and custom mixed together, sorted A-Z).

### Claude's Discretion
- Transition animations between routes (slide, fade, or none) — choose what feels native on mobile
- Exact visual treatment of the "Add new location" inline mini-dialog (sheet vs inline input vs modal)
- Empty state illustrations vs text-only empty states
- PWA icon set and splash screen design

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Core value, constraints (IndexedDB-only, offline-first, privacy-first), key decisions, and project context
- `.planning/REQUIREMENTS.md` — All v1 requirements; Phase 1 scope: INV-01–INV-06, LOC-01–LOC-05, PWA-01–PWA-04
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and requirement mapping

### Stack Decisions
- `.claude/CLAUDE.md` §Technology Stack — Full recommended stack with versions, rationale, and pitfalls to avoid. MUST read before selecting any library or writing any config.

### No external specs
- No ADRs, design docs, or external specs were referenced during discussion. All decisions are captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — blank slate project. All components, hooks, and utilities will be created from scratch.

### Established Patterns
- None yet — this phase establishes the foundational patterns for all subsequent phases.

### Integration Points
- Phase 1 is the foundation. All subsequent phases integrate INTO Phase 1's routing, Dexie schema, and component library setup.
- Routing architecture must be extensible: React Router routes + bottom tab bar must accommodate Phase 2's Dashboard, Trash, and Search additions without restructuring.
- `calculateStatus` in `src/lib/expiry.ts` will be consumed by Phase 2's filter/sort logic — design its interface with that in mind.

</code_context>

<specifics>
## Specific Ideas

- The pharmacy quick-lookup use-case (PROJECT.md context) is the primary success scenario: "User is at a pharmacy, sick. They open the app, search a medicine name, and need stock + validity status in under 5 seconds." Phase 1 builds the foundation this depends on — the add flow and the data model.
- Visual style: clean and minimal — white/light backgrounds, simple cards, clinical feel. Matches shadcn/ui + Tailwind defaults.
- The bottom tab bar + HashRouter combination must work correctly in standalone PWA mode on iOS (where the browser chrome is hidden). Test PWA install + tab navigation on iOS before closing Phase 1.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-PWA Foundation & Inventory CRUD*
*Context gathered: 2026-06-30*
