---
phase: "06"
slug: backup-restore
status: verified
threats_open: 0
asvs_level: 1
created: 2026-08-31
---

# Phase 06 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| User filesystem → browser | User-selected JSON file is untrusted input; content is unknown until parsed | Arbitrary JSON bytes |
| Parsed JSON → Zod gate | Raw parsed object crosses into validated data only after safeParse succeeds | Structured backup object |
| Validated data → Dexie transaction | All DB writes inside a single atomic transaction; rollback on failure | Medicine, catalog, location, history records |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-06-01-SC | Tampering | npm install | high | mitigate | No new packages installed in Plan 06-01; supply chain surface unchanged | closed |
| T-06-01 | Tampering | importFromJSON / raw JSON input | medium | mitigate | `BackupSchema.safeParse(raw)` at `dataOps.ts:251` — throws before any DB write on schema failure | closed |
| T-06-02 | Tampering | importFromJSON / old-format path | medium | mitigate | `LegacyBackupSchema.safeParse(raw)` at `dataOps.ts:280` — second gate before catalog inference | closed |
| T-06-03 | Tampering | ImportJSONSection / AlertDialog | low | mitigate | `<AlertDialog>` at `ImportJSONSection.tsx:116` requires explicit user confirmation before import proceeds | closed |
| T-06-04 | Denial of Service | importFromJSON / large file | low | accept | Browser sandbox limits memory; local-only app with no network vector — see Accepted Risks Log | closed |
| T-06-SC | Tampering | npm packages (Plan 06-02) | high | mitigate | No new packages installed in Plan 06-02 (`fake-indexeddb/auto` is a dev-only test import, not a production dependency) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-06-01 | T-06-04 | Browser memory sandbox provides adequate DoS protection for a local household PWA with no network attack surface. Large file rejection is a usability improvement, not a security requirement at this threat level. | gsd-secure-phase (orchestrator) | 2026-08-31 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-31 | 6 | 6 | 0 | gsd-secure-phase (L1 grep, short-circuit: threats_open=0 + register_authored_at_plan_time=true + asvs_level=1) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-31
