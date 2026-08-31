---
phase: 04
slug: database-migration-schema-v3
status: verified
threats_open: 0
asvs_level: 1
created: 2026-07-29
---

# Phase 04 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Local → IndexedDB | User's medicine data stored in browser IndexedDB (encrypted at rest per browser security model) | Medicine names, expiry dates, categories — all local, no network |
| Migration logic → Stock entry integrity | v2→v3 upgrade callback must not corrupt existing data | All v2 medicine records + new catalog entries |
| Phase 5 code → historyOps | Callers must supply medicineName from their own context; historyOps trusts the parameter value | Medicine name string passed explicitly by caller |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-04-01 | Integrity | Migration deduplication logic | high | mitigate | Automated test suite with 3 cases: dedup by case-insensitive+trimmed name, most-common category resolution, tiebreak by lowest id. All pass (72 total tests pass). | closed |
| T-04-02 | Integrity | Null key in IndexedDB query | medium | mitigate | Code review confirmed: no `where('deletedAt').equals(null)` queries exist. Correct pattern (`.toCollection().filter(m => m.deletedAt === null)`) documented in db.ts:92 and enforced via comment in medicines/index.tsx:26. | closed |
| T-04-03 | Data Loss | Migration failure during upgrade | high | mitigate | Transaction atomicity: catalog `bulkAdd` + stock `bulkUpdate` execute within a single Dexie upgrade transaction. Both succeed or both roll back — no partial migration states possible. | closed |
| T-04-04 | Confidentiality | Form enum values visible in source | low | accept | MedicineForm values are public metadata (Tablet, Capsule, etc.) — not sensitive data. Users see form names in UI regardless. Accepted. | closed |
| T-04-05 | Integrity | medicineName parameter tampered by caller | low | accept | History entries are read-only display (trash/detail views), never used for logic or access control. Caller responsibility to supply correct name; TypeScript enforces the parameter type. | closed |
| T-04-06 | Completeness | Missing medicineName in Phase 5 call | medium | mitigate | TypeScript strict mode enforces parameter presence at compile time. Build fails immediately if any Phase 5 caller omits the parameter. All current callers updated and verified (build passes). | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `high` count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-04-01 | T-04-04 | MedicineForm enum values are medicine form names (public UI metadata), not sensitive data | gsd-secure-phase | 2026-07-29 |
| AR-04-02 | T-04-05 | History entries are display-only (never used for access control or logic); name accuracy is a caller convention, not a security boundary | gsd-secure-phase | 2026-07-29 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-29 | 6 | 6 | 0 | gsd-secure-phase (L1 grep-depth, asvs_level: 1) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-29
