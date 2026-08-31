# Requirements: MedStock v1.2

**Defined:** 2026-08-31
**Core Value:** At a glance, from anywhere, know whether you already have a valid medicine — so you never overbuy and never miss an expired one.

## v1.2 Requirements

### i18n

- [x] **I18N-01**: User can switch app language between English and Polish via a persistent toggle
- [x] **I18N-02**: All UI strings (labels, placeholders, toasts, error messages, status names, screen titles) display in the active language
- [x] **I18N-03**: Selected language persists in localStorage and applies on next load without a full reload
- [x] **I18N-04**: Built-in category names and predefined location names display in the active language (stored values unchanged)
- [x] **I18N-05**: Dates display in locale-appropriate format (PL: DD.MM.YYYY, EN: YYYY-MM-DD)

### Locations

- [ ] **LOC-01**: User can rename any location (including predefined) from the Locations screen
- [ ] **LOC-02**: User can hide or show any predefined location; hidden locations are excluded from add/edit dropdowns
- [ ] **LOC-03**: User can delete any location; warned if medicines reference it with a reassign-or-clear choice before deletion
- [ ] **LOC-04**: User can reorder all locations via drag-to-reorder; order persists and applies to form dropdowns

### CSV

- [ ] **CSV-01**: Column-mapping UI pre-selects the matching app field when a CSV column header exactly matches a field name (case-insensitive); unmatched headers default to "skip"
- [ ] **CSV-02**: Column-mapping UI shows a header row labeling the two sides: "Your file column" and "App field"

### Status

- [ ] **STAT-01**: A medicine expiring within the configurable warning window (default 7 days) shows status "Expiring Soon"
- [ ] **STAT-02**: A medicine whose PAO end date (openedDate + pao) falls within the warning window shows status "Expiring Soon"
- [ ] **STAT-03**: "Expiring Soon" sits between "Opened" and "Expired"/"ExceededOpenPeriod" in the status priority order
- [ ] **STAT-04**: User can configure the Expiring Soon warning window; setting persists across sessions

### UX

- [ ] **UX-01**: App version (from package.json) is visible in the UI (Data tab footer or About section)
- [ ] **UX-02**: Medicine name field in add/edit form suggests names from existing catalog entries (case-insensitive, deduplicated, includes trashed)
- [ ] **UX-03**: Pack count of 1 or unset displays as plain quantity (e.g., "20 tablets") — no box-count prefix shown
- [ ] **UX-04**: Pack count ≥ 2 displays as "N boxes × qty" across list rows, stock cards, and form quantity labels
- [ ] **UX-05**: Pack count field placeholder/label in add/edit form communicates that leaving it empty means 1 box

## Future Requirements

### Sync

- **B-002**: Interactive guided "Sync Now" flow — step-by-step guided sync with OS detection and deep links
- **B-003**: JSON import merge strategy with last-write-wins (currently full replace)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Barcode / QR scanning | Requires camera permission flow; deferred to v2 |
| Automatic cloud sync | Privacy-first constraint — no backend |
| Photos / images | Doesn't affect core value; deferred to v2 |
| Batch add (multiple packages) | Low-frequency action; deferred to v2 |
| Custom categories | Deferred to v2 — built-in categories sufficient for current household |
| Category propagation across same-name medicines (B-010) | Depends on B-001 (autocomplete); deferred to v1.3+ |
| iOS "Add to Home Screen" prompt (B-009) | Deferred to v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| I18N-01 | Phase 7 | Complete |
| I18N-02 | Phase 7 | Complete |
| I18N-03 | Phase 7 | Complete |
| I18N-04 | Phase 7 | Complete |
| I18N-05 | Phase 7 | Complete |
| LOC-01 | Phase 8 | Pending |
| LOC-02 | Phase 8 | Pending |
| LOC-03 | Phase 8 | Pending |
| LOC-04 | Phase 8 | Pending |
| CSV-01 | Phase 9 | Pending |
| CSV-02 | Phase 9 | Pending |
| UX-01 | Phase 9 | Pending |
| STAT-01 | Phase 10 | Pending |
| STAT-02 | Phase 10 | Pending |
| STAT-03 | Phase 10 | Pending |
| STAT-04 | Phase 10 | Pending |
| UX-02 | Phase 11 | Pending |
| UX-03 | Phase 11 | Pending |
| UX-04 | Phase 11 | Pending |
| UX-05 | Phase 11 | Pending |

**Coverage:**

- v1.2 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-31*
*Last updated: 2026-08-31 after roadmap creation*
