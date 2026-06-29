# Roadmap: MedStock

## Overview

MedStock ships in three phases. Phase 1 builds the installable PWA foundation with the full inventory CRUD loop, location management, expiry calculation, and the iOS persistent-storage safeguard — everything needed to start tracking medicines on a single device. Phase 2 completes the core product value: search (the pharmacy use-case), filter/sort, the expiry dashboard, trash bin, and change history. Phase 3 adds the household sync story: JSON backup/restore, CSV bulk import, and the manual OneDrive sync flow. Each phase delivers a working, shippable slice.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: PWA Foundation & Inventory CRUD** - Installable offline PWA, Dexie schema, iOS persistent-storage request, full add/edit/delete/view loop, expiry calculation, location management
- [ ] **Phase 2: Search, Dashboard & Audit** - Name search, filter/sort, expiry dashboard with alert cards, trash bin with restore, per-medicine change history
- [ ] **Phase 3: Data & Household Sync** - JSON export/import backup, CSV bulk import with column mapping, manual OneDrive sync flow

## Phase Details

### Phase 1: PWA Foundation & Inventory CRUD
**Goal**: A household member can install the app on their device and manage their medicine inventory fully offline — adding, viewing, editing, and deleting packages with automatic expiry calculation across any location.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: INV-01, INV-02, INV-03, INV-04, INV-05, INV-06, LOC-01, LOC-02, LOC-03, LOC-04, LOC-05, PWA-01, PWA-02, PWA-03, PWA-04
**Success Criteria** (what must be TRUE):
  1. User can install the app to their home screen / taskbar and open it with no internet connection
  2. On first launch, the app requests persistent storage so iOS Safari cannot silently evict data after 7 days
  3. User can add a medicine package (name, category, location, expiry date, opened date, period-after-opening, quantity, notes) and see it appear in the list immediately
  4. App automatically computes and displays the correct validity status (Active / Opened / Expired / Used Up) for each package, combining expiry date and period-after-opening constraints
  5. User can add, rename, and delete custom locations; deleted locations revert existing medicines to "Other"
**Plans**: TBD
**UI hint**: yes

### Phase 2: Search, Dashboard & Audit
**Goal**: A user at a pharmacy can search for a medicine by name and see its stock plus validity status in under 5 seconds; the dashboard surfaces expiry alerts; a trash bin prevents accidental data loss; every change is auditable.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04, SRCH-05, SRCH-06, DASH-01, DASH-02, DASH-03, DASH-04, HIST-01, HIST-02, TRSH-01, TRSH-02, TRSH-03, TRSH-04
**Success Criteria** (what must be TRUE):
  1. User can type a partial medicine name from any screen and instantly see matching medicines with their stock count and validity status — no drill-down required
  2. User can filter the list by category, location, or status and sort by name, expiry date, or category
  3. Dashboard shows total count, expired count, expiring-within-30-days count, and exceeded-open-period count as tappable alert cards that open the corresponding filtered list
  4. Deleted medicine moves to Trash Bin; user can restore it or permanently delete it from there
  5. User can open any medicine and view its full change history with timestamps, changed fields, and old/new values
**Plans**: TBD
**UI hint**: yes

### Phase 3: Data & Household Sync
**Goal**: Two household members on separate devices can share one inventory — one exports a JSON file to a shared OneDrive folder, the other imports it; existing spreadsheet inventories can be bulk-imported via CSV.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. User can export the full inventory (medicines, locations, categories, history, settings) as a single JSON file and save it to their device or OneDrive folder
  2. User can import a JSON backup file; existing records are merged with last-write-wins conflict resolution and schema validation rejects malformed files with a clear error
  3. User can import a CSV file by mapping its columns to medicine fields, preview the mapped data, and commit the import — all within the app
  4. "Sync Now" flow guides the user step-by-step through exporting to and importing from a shared folder, enabling two-device household sharing without any backend
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. PWA Foundation & Inventory CRUD | 0/TBD | Not started | - |
| 2. Search, Dashboard & Audit | 0/TBD | Not started | - |
| 3. Data & Household Sync | 0/TBD | Not started | - |
