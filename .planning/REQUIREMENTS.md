# Requirements: MedStock

**Defined:** 2026-06-29
**Core Value:** At a glance, from anywhere, know whether you already have a valid medicine — so you never overbuy and never miss an expired one.

## v1 Requirements

### Inventory (CRUD)

- [ ] **INV-01**: User can add a medicine package with: name, category (predefined), location, expiration date, opened date, period-after-opening (value + unit), quantity remaining, quantity unit, notes
- [ ] **INV-02**: User can edit any field of an existing medicine package
- [ ] **INV-03**: User can view full details of a medicine package
- [ ] **INV-04**: User can delete a medicine package (moves to Trash Bin, not permanently removed)
- [ ] **INV-05**: App automatically calculates validity status from expiration date, opened date, and period-after-opening — combining both constraints (whichever expires first)
- [ ] **INV-06**: Medicine package status is one of: Active, Opened, Expired, Used Up, Disposed, Archived — and updates automatically based on dates

### Search & Browse

- [ ] **SRCH-01**: User can search medicines by name with partial/substring matching, from any screen
- [ ] **SRCH-02**: Search results show stock + validity status in a single glance (no drill-down required for the critical question)
- [ ] **SRCH-03**: User can filter the medicine list by category
- [ ] **SRCH-04**: User can filter the medicine list by location
- [ ] **SRCH-05**: User can filter the medicine list by status (Active, Opened, Expired, etc.)
- [ ] **SRCH-06**: User can sort the medicine list by name, expiration date, or category

### Dashboard

- [ ] **DASH-01**: Dashboard shows total medicine count
- [ ] **DASH-02**: Dashboard shows expired medicines count as an alert card; tapping it opens a filtered list of expired medicines
- [ ] **DASH-03**: Dashboard shows medicines expiring within 30 days as an alert card; tapping it opens the filtered list
- [ ] **DASH-04**: Dashboard shows medicines that exceeded their period-after-opening as an alert card; tapping it opens the filtered list

### History & Audit

- [ ] **HIST-01**: Every change to a medicine record (create, edit, delete, restore) is recorded with timestamp, changed field, old value, and new value
- [ ] **HIST-02**: User can view the change history for a specific medicine package

### Trash Bin

- [ ] **TRSH-01**: Deleted medicines appear in Trash Bin and are not permanently removed
- [ ] **TRSH-02**: User can restore a medicine from the Trash Bin
- [ ] **TRSH-03**: User can permanently delete a medicine from the Trash Bin
- [ ] **TRSH-04**: Trash Bin preserves the full history of deleted items

### Locations

- [ ] **LOC-01**: Predefined locations are available when adding/editing a medicine (Kitchen Drawer, Bathroom Cabinet, Bedroom Cabinet, Medicine Box, Travel Kit, Refrigerator, Living Room Cabinet, Other)
- [ ] **LOC-02**: User can add a custom location
- [ ] **LOC-03**: User can edit a custom location name
- [ ] **LOC-04**: User can delete a custom location (medicines using it revert to "Other")
- [ ] **LOC-05**: User can manage all locations from a dedicated Locations screen

### Data (Import / Export / Sync)

- [ ] **DATA-01**: User can export the full inventory as a JSON file (medicines, locations, categories, history, settings)
- [ ] **DATA-02**: User can import a JSON backup file to restore or merge inventory
- [ ] **DATA-03**: User can import an existing inventory from a CSV file with an interactive column-mapping step
- [ ] **DATA-04**: User can trigger a "Sync Now" flow that guides them through exporting to / importing from a shared OneDrive folder — enabling two household members to share one inventory across their devices

### PWA & Offline

- [ ] **PWA-01**: App works fully offline — all core features (search, add, edit, browse) function without any internet connection
- [ ] **PWA-02**: App requests persistent storage on first launch to prevent iOS Safari 7-day automatic data eviction
- [ ] **PWA-03**: App is installable as a PWA on Android, Windows, macOS, and Linux (home screen / taskbar)
- [ ] **PWA-04**: App remains responsive with 1,000+ medicine packages

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

*Populated during roadmap creation.*

| Requirement | Phase | Status |
|-------------|-------|--------|
| INV-01 | — | Pending |
| INV-02 | — | Pending |
| INV-03 | — | Pending |
| INV-04 | — | Pending |
| INV-05 | — | Pending |
| INV-06 | — | Pending |
| SRCH-01 | — | Pending |
| SRCH-02 | — | Pending |
| SRCH-03 | — | Pending |
| SRCH-04 | — | Pending |
| SRCH-05 | — | Pending |
| SRCH-06 | — | Pending |
| DASH-01 | — | Pending |
| DASH-02 | — | Pending |
| DASH-03 | — | Pending |
| DASH-04 | — | Pending |
| HIST-01 | — | Pending |
| HIST-02 | — | Pending |
| TRSH-01 | — | Pending |
| TRSH-02 | — | Pending |
| TRSH-03 | — | Pending |
| TRSH-04 | — | Pending |
| LOC-01 | — | Pending |
| LOC-02 | — | Pending |
| LOC-03 | — | Pending |
| LOC-04 | — | Pending |
| LOC-05 | — | Pending |
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |
| DATA-03 | — | Pending |
| DATA-04 | — | Pending |
| PWA-01 | — | Pending |
| PWA-02 | — | Pending |
| PWA-03 | — | Pending |
| PWA-04 | — | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 35 ⚠️

---
*Requirements defined: 2026-06-29*
*Last updated: 2026-06-29 after initial definition*
