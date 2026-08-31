# Requirements: MedStock v1.1 — Catalog + Stock Model

**Defined:** 2026-07-28
**Core Value:** At a pharmacy, search a medicine name and instantly know: do I have it and is it still valid?

## v1.1 Requirements

### Migration

- [x] **MIGR-01**: On first open after upgrade, existing medicines are automatically migrated — each unique medicine name becomes one catalog entry; each existing medicine row becomes one stock entry linked by catalogId
- [x] **MIGR-02**: Migration deduplicates by exact name match — multiple rows with the same name produce a single catalog entry

### Catalog

- [x] **CAT-01**: User can search for an existing catalog entry by name via autocomplete when starting the add flow
- [x] **CAT-02**: User can create a new catalog entry (name, category, form) inline during the add flow when no autocomplete match exists
- [x] **CAT-03**: User can edit a catalog entry's name, category, and form from the medicine detail screen

### Stock

- [x] **STOCK-01**: User can add a stock entry (quantity, expiry date, location) linked to a catalog entry
- [x] **STOCK-02**: User can edit a stock entry's quantity, expiry date, location, PAO, and notes
- [x] **STOCK-03**: User can move N units from one stock entry to a different location, splitting into two stock entries
- [x] **STOCK-04**: Soft-deleted stock entries appear in Trash and can be restored
- [x] **STOCK-05**: Detail view stock entry list respects active status and location filters from UIStore (G-05-10)

### Add / Edit Flows

- [x] **FLOW-01**: Medicine list shows one aggregate row per catalog entry, with status derived from the worst-case active stock entry (priority-reduce: Expired > ExceededOpenPeriod > Opened > Active)
- [x] **FLOW-02**: Detail screen lists all stock entries for a catalog entry, each showing quantity, expiry, location, and status
- [x] **FLOW-03**: Add flow: catalog autocomplete first → if match selected, jump straight to stock fields; if no match, show catalog fields then stock fields

### Backup

- [x] **DATA-01**: JSON export includes the medicine_catalog table alongside stock entries with catalogId
- [x] **DATA-02**: JSON import of new-format backup restores both catalog entries and stock entries correctly
- [x] **DATA-03**: JSON import of old-format backup (pre-v1.1, no catalog table) migrates gracefully by inferring catalog entries from name and category fields

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

| Requirement | Phase | Status |
|-------------|-------|--------|
| MIGR-01 | 4 | Complete |
| MIGR-02 | 4 | Complete |
| CAT-01 | 5 | Complete |
| CAT-02 | 5 | Complete |
| CAT-03 | 5 | Complete |
| STOCK-01 | 5 | Complete |
| STOCK-02 | 5 | Complete |
| STOCK-03 | 5 | Complete |
| STOCK-04 | 5 | Complete |
| STOCK-05 | 5 | Complete |
| FLOW-01 | 5 | Complete |
| FLOW-02 | 5 | Complete |
| FLOW-03 | 5 | Complete |
| DATA-01 | 6 | Complete |
| DATA-02 | 6 | Complete |
| DATA-03 | 6 | Complete |

**Coverage:**

- v1.1 requirements: 15 total
- Mapped to phases: 15 ✓
- Unmapped: 0

---
*Requirements defined: 2026-07-28*
*Last updated: 2026-07-28 after roadmap creation*
