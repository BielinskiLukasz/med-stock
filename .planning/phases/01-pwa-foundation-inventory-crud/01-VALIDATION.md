---
phase: 01
slug: pwa-foundation-inventory-crud
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-30
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 + @testing-library/react |
| **Config file** | `vite.config.ts` under `test:` key — Wave 0 installs |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/expiry.test.ts`
- **After every plan wave:** Run `npm run test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green + Lighthouse PWA score ≥ 90
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-expiry-active | 01 | 1 | INV-05, INV-06 | — | `calculateStatus()` returns 'Active' for unexpired, unopened | unit | `npx vitest run src/lib/expiry.test.ts` | ❌ W0 | ⬜ pending |
| 01-expiry-opened | 01 | 1 | INV-05 | — | 'Opened' when openedDate set and within PAO window | unit | `npx vitest run src/lib/expiry.test.ts` | ❌ W0 | ⬜ pending |
| 01-expiry-expired | 01 | 1 | INV-05 | — | 'Expired' when past expiryDate | unit | `npx vitest run src/lib/expiry.test.ts` | ❌ W0 | ⬜ pending |
| 01-expiry-manual | 01 | 1 | INV-06 | — | manualStatus takes precedence over auto | unit | `npx vitest run src/lib/expiry.test.ts` | ❌ W0 | ⬜ pending |
| 01-expiry-d14 | 01 | 1 | INV-05 | — | null expiry + PAO set: uses PAO only (D-14) | unit | `npx vitest run src/lib/expiry.test.ts` | ❌ W0 | ⬜ pending |
| 01-expiry-d15 | 01 | 1 | INV-05 | — | openedDate + no PAO: based on expiryDate only (D-15) | unit | `npx vitest run src/lib/expiry.test.ts` | ❌ W0 | ⬜ pending |
| 01-loc-delete-cascade | 01 | 2 | LOC-04 | — | Delete location sets affected medicines.location to null | unit | `npx vitest run src/lib/db.test.ts` | ❌ W0 | ⬜ pending |
| 01-pwa-offline | 01 | 3 | PWA-01 | — | App shell loads on second visit offline | manual | Lighthouse PWA audit in Chrome DevTools | N/A | ⬜ pending |
| 01-pwa-persist | 01 | 3 | PWA-02 | — | `navigator.storage.persist()` called on first launch | manual | Chrome DevTools Application > Storage | N/A | ⬜ pending |
| 01-pwa-install | 01 | 3 | PWA-03 | — | Installable on Android/Windows/macOS | manual | Install from Chrome, verify launch | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/expiry.test.ts` — unit tests for calculateStatus (INV-05, INV-06, D-14, D-15)
- [ ] `src/lib/db.test.ts` — unit test for LOC-04 location delete cascade
- [ ] Vitest config block in `vite.config.ts`: `test: { environment: 'jsdom', setupFiles: ['./src/setupTests.ts'] }`
- [ ] `src/setupTests.ts` — imports `@testing-library/jest-dom/vitest`
- [ ] `package.json` scripts: `"test": "vitest"`, `"test:run": "vitest run"`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PWA installs to home screen | PWA-03 | Requires real device or DevTools Application panel | Open Chrome DevTools > Application > Manifest; verify all fields green; click "Add to Home screen" |
| App loads offline after install | PWA-01 | Requires service worker activation | Install PWA, clear network, reload; verify app shell appears without network |
| `navigator.storage.persist()` granted | PWA-02 | Browser prompts may vary | Check Chrome DevTools Application > Storage > Persistence; should show "Persistent" |
| App remains responsive with 1,000+ items | PWA-04 | Load testing requires real data volume | Seed 1,000 medicines via devtools, confirm list scrolls without jank |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
