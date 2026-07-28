# Requirements: MedStock v1.1 — Catalog + Stock Model

**Defined:** 2026-07-28
**Core Value:** At a pharmacy, search a medicine name and instantly know: do I have it and is it still valid?

## v1.1 Requirements

### Migration

- [ ] **MIGR-01**: On first open after upgrade, existing medicines are automatically migrated — each unique medicine name becomes one catalog entry; each existing medicine row becomes one stock entry linked by catalogId
- [ ] **MIGR-02**: Migration deduplicates by exact name match — multiple rows with the same name produce a single catalog entry

### Catalog

- [ ] **CAT-01**: User can search for an existing catalog entry by name via autocomplete when starting the add flow
- [ ] **CAT-02**: User can create a new catalog entry (name, category, form) inline during the add flow when no autocomplete match exists
- [ ] **CAT-03**: User can edit a catalog entry's name, category, and form from the medicine detail screen

### Stock

- [ ] **STOCK-01**: User can add a stock entry (quantity, expiry date, location) linked to a catalog entry
- [ ] **STOCK-02**: User can edit a stock entry's quantity, expiry date, location, PAO, and notes
- [ ] **STOCK-03**: User can move N units from one stock entry to a different location, splitting into two stock entries
- [ ] **STOCK-04**: Soft-deleted stock entries appear in Trash and can be restored

### Add / Edit Flows

- [ ] **FLOW-01**: Medicine list shows one aggregate row per catalog entry, with status derived from the nearest-expiry active stock entry
- [ ] **FLOW-02**: Detail screen lists all stock entries for a catalog entry, each showing quantity, expiry, location, and status
- [ ] **FLOW-03**: Add flow: catalog autocomplete first → if match selected, jump straight to stock fields; if no match, show catalog fields then stock fields

### Backup

- [ ] **DATA-01**: JSON export includes the medicine_catalog table alongside stock entries with catalogId
- [ ] **DATA-02**: JSON import of new-format backup restores both catalog entries and stock entries correctly
- [ ] **DATA-03**: JSON import of old-format backup (pre-v1.1, no catalog table) migrates gracefully by inferring catalog entries from name and category fields

## Out of Scope

| Feature | Reason |
|---------|--------|
| Manual catalog deduplication UI | Migration auto-deduplicates by exact name; merge tool adds UI complexity beyond v1.1 scope |
| Barcode / QR scanning | Reduces add-form friction but requires camera permission flow; deferred to v2 |
| Automatic cloud catalog sync | Privacy-first constraint — no backend. Manual OneDrive sync carries over unchanged |
| Interactive OneDrive Sync Now flow | Deferred from v1.0 (B-002); not included in this milestone |
| JSON import merge strategy | Deferred from v1.0 (B-003); not included in this milestone |
| CSV auto-column mapping | Deferred from v1.0 (B-004); not included in this milestone |

## Traceability

Phases TBD — populated by gsd-roadmapper in next step.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MIGR-01 | TBD | Pending |
| MIGR-02 | TBD | Pending |
| CAT-01 | TBD | Pending |
| CAT-02 | TBD | Pending |
| CAT-03 | TBD | Pending |
| STOCK-01 | TBD | Pending |
| STOCK-02 | TBD | Pending |
| STOCK-03 | TBD | Pending |
| STOCK-04 | TBD | Pending |
| FLOW-01 | TBD | Pending |
| FLOW-02 | TBD | Pending |
| FLOW-03 | TBD | Pending |
| DATA-01 | TBD | Pending |
| DATA-02 | TBD | Pending |
| DATA-03 | TBD | Pending |

**Coverage:**
- v1.1 requirements: 15 total
- Mapped to phases: 0 (roadmap pending)
- Unmapped: 15 ⚠️

---
*Requirements defined: 2026-07-28*
*Last updated: 2026-07-28 after initial definition*
