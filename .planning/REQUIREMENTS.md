# Requirements: MedStock

**Defined:** 2026-06-29
**Core Value:** At a glance, from anywhere, know whether you already have a valid medicine — so you never overbuy and never miss an expired one.

## v1 Requirements

### Inventory (CRUD)

- [x] **INV-01**: User can add a medicine package with: name, category (predefined), location, expiration date, opened date, period-after-opening (value + unit), quantity remaining, quantity unit, notes
- [x] **INV-02**: User can edit any field of an existing medicine package
- [x] **INV-03**: User can view full details of a medicine package
- [x] **INV-04**: User can delete a medicine package (moves to Trash Bin, not permanently removed)
- [x] **INV-05**: App automatically calculates validity status from expiration date, opened date, and period-after-opening — combining both constraints (whichever expires first)
- [x] **INV-06**: Medicine package status is one of: Active, Opened, Expired, Used Up, Disposed, Archived — and updates automatically based on dates

### Search & Browse

- [x] **SRCH-01**: User can search medicines by name with partial/substring matching, from any screen
- [x] **SRCH-02**: Search results show stock + validity status in a single glance (no drill-down required for the critical question)
- [x] **SRCH-03**: User can filter the medicine list by category
- [x] **SRCH-04**: User can filter the medicine list by location
- [x] **SRCH-05**: User can filter the medicine list by status (Active, Opened, Expired, etc.)
- [x] **SRCH-06**: User can sort the medicine list by name, expiration date, or category

### Dashboard

- [x] **DASH-01**: Dashboard shows total medicine count
- [x] **DASH-02**: Dashboard shows expired medicines count as an alert card; tapping it opens a filtered list of expired medicines
- [x] **DASH-03**: Dashboard shows medicines expiring within 30 days as an alert card; tapping it opens the filtered list
- [x] **DASH-04**: Dashboard shows medicines that exceeded their period-after-opening as an alert card; tapping it opens the filtered list

### History & Audit

- [x] **HIST-01**: Every change to a medicine record (create, edit, delete, restore) is recorded with timestamp, changed field, old value, and new value
- [x] **HIST-02**: User can view the change history for a specific medicine package

### Trash Bin

- [x] **TRSH-01**: Deleted medicines appear in Trash Bin and are not permanently removed
- [x] **TRSH-02**: User can restore a medicine from the Trash Bin
- [x] **TRSH-03**: User can permanently delete a medicine from the Trash Bin
- [x] **TRSH-04**: Trash Bin preserves the full history of deleted items

### Locations

- [x] **LOC-01**: Predefined locations are available when adding/editing a medicine (Kitchen Drawer, Bathroom Cabinet, Bedroom Cabinet, Medicine Box, Travel Kit, Refrigerator, Living Room Cabinet, Other)
- [x] **LOC-02**: User can add a custom location
- [x] **LOC-03**: User can edit a custom location name
- [x] **LOC-04**: User can delete a custom location (medicines using it revert to "Other")
- [x] **LOC-05**: User can manage all locations from a dedicated Locations screen

### Data (Import / Export / Sync)

- [ ] **DATA-01**: User can export the full inventory as a JSON file (medicines, locations, categories, history, settings)
- [ ] **DATA-02**: User can import a JSON backup file to restore or merge inventory
- [ ] **DATA-03**: User can import an existing inventory from a CSV file with an interactive column-mapping step
- [ ] **DATA-04**: User can trigger a "Sync Now" flow that guides them through exporting to / importing from a shared OneDrive folder — enabling two household members to share one inventory across their devices

### PWA & Offline

- [x] **PWA-01**: App works fully offline — all core features (search, add, edit, browse) function without any internet connection
- [x] **PWA-02**: App requests persistent storage on first launch to prevent iOS Safari 7-day automatic data eviction
- [x] **PWA-03**: App is installable as a PWA on Android, Windows, macOS, and Linux (home screen / taskbar)
- [x] **PWA-04**: App remains responsive with 1,000+ medicine packages

---

## v2 Requirements

### Inventory (Batch)

- **INV-B01**: User can add multiple packages of the same medicine in one flow (batch creation) — enter name/category/location once, then expiry/quantity per package

### Organization (Categories)

- **CAT-01**: User can add a custom category
- **CAT-02**: User can edit a custom category name
- **CAT-03**: User can delete a custom category
- **CAT-04**: User can manage all categories from a dedicated Categories screen

### Dashboard

- **DASH-V2-01**: Dashboard shows recently added medicines list

### PWA

- **PWA-V2-01**: In-app guidance for iOS Safari users to add the app to their home screen (manual step-by-step prompt)

### Import

- **DATA-V2-01**: User can export the history/audit log as a file

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Medication reminders / adherence tracking | Different product category (scheduling vs inventory); regulatory and UX complexity; users consult their doctor |
| Drug interaction checking | Requires maintained medical database; liability risk if data is stale |
| Photo capture and storage | Doesn't change core value (you still read the label); storage/sync burden; deferred to v2+ |
| OCR — expiry date, medicine name, barcode | Complex, error-prone, requires camera permissions; v1 is manual entry only |
| Automatic background sync | Manual "Sync Now" is sufficient for household use; background sync needs a backend or complex peer-to-peer |
| Multi-user profiles / household accounts | Auth complexity; current model is one shared inventory per device |
| Real-time multi-device sync | Requires backend or peer-to-peer; major architecture shift |
| Backend / cloud storage | Privacy requirement: all data stays on device |
| Medicine purchase tracking | Out of scope; MedStock is inventory, not purchasing history |
| Medicine consumption statistics | Out of scope for v1; may add in v2 based on user feedback |
| QR labels for storage locations | Out of scope; nice-to-have future idea |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INV-01 | Phase 1 | Complete |
| INV-02 | Phase 1 | Complete |
| INV-03 | Phase 1 | Complete |
| INV-04 | Phase 1 | Complete |
| INV-05 | Phase 1 | Complete |
| INV-06 | Phase 1 | Complete |
| SRCH-01 | Phase 2 | Complete |
| SRCH-02 | Phase 2 | Complete |
| SRCH-03 | Phase 2 | Complete |
| SRCH-04 | Phase 2 | Complete |
| SRCH-05 | Phase 2 | Complete |
| SRCH-06 | Phase 2 | Complete |
| DASH-01 | Phase 2 | Complete |
| DASH-02 | Phase 2 | Complete |
| DASH-03 | Phase 2 | Complete |
| DASH-04 | Phase 2 | Complete |
| HIST-01 | Phase 2 | Complete |
| HIST-02 | Phase 2 | Complete |
| TRSH-01 | Phase 2 | Complete |
| TRSH-02 | Phase 2 | Complete |
| TRSH-03 | Phase 2 | Complete |
| TRSH-04 | Phase 2 | Complete |
| LOC-01 | Phase 1 | Complete |
| LOC-02 | Phase 1 | Complete |
| LOC-03 | Phase 1 | Complete |
| LOC-04 | Phase 1 | Complete |
| LOC-05 | Phase 1 | Complete |
| DATA-01 | Phase 3 | Pending |
| DATA-02 | Phase 3 | Pending |
| DATA-03 | Phase 3 | Pending |
| DATA-04 | Phase 3 | Pending |
| PWA-01 | Phase 1 | Complete |
| PWA-02 | Phase 1 | Complete |
| PWA-03 | Phase 1 | Complete |
| PWA-04 | Phase 1 | Complete |

**Coverage:**

- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-29*
*Last updated: 2026-06-29 after roadmap creation*
