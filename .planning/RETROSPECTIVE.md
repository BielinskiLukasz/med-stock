# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 — Catalog + Stock Model

**Shipped:** 2026-08-31  
**Phases:** 3 (04-06) | **Plans:** 17 | **Timeline:** 34 days (2026-07-28 → 2026-08-31)  
**Commits:** 118 | **Files changed:** 106 | **LOC:** 7,857 TypeScript

### What Was Built

- Two-layer catalog + stock model replacing flat medicines table — `medicine_catalog` for reusable identity, `medicines` for per-package stock entries
- Dexie v3→v4 migration with case-insensitive name deduplication (zero data loss)
- Three-step add flow: catalog autocomplete → optional catalog create → stock fields
- Catalog-aggregate list view with priority-reduce status (Expired > ExceededOpenPeriod > Opened > Active) and pack-aware quantity (packCount × quantity)
- Split/Move stock, pack-level Open box, catalog delete with active-stock guard, per-stock change history display
- Backup/restore updated: new-format (catalog + stock) and legacy-format (inferred catalog via name deduplication) import pipelines

### What Worked

- **Migration-first sequencing**: Establishing schema + historyOps signatures in Phase 4 before any UI work meant Phase 5 had a clean, stable foundation with no rework
- **TDD for pure functions**: `computeCatalogAggregate`, `inferCatalogEntriesFromLegacyMedicines`, and all stock mutations were spec'd with tests first — all bugs were caught before integration
- **UAT driving real gaps**: 10 gaps found in Phase 5 UAT were all genuine product issues (not edge cases). Catching them pre-ship rather than post-ship was the right call
- **Coarse granularity (3 phases)**: Combined Catalog + Stock into one phase (Phase 5) because both CRUD systems were needed for any user-facing feature — correct call, no wasted intermediate delivery
- **Gap closure plan batching**: Parallel gap-closure waves (07/08/09 → 10 → 11 → 12/13) kept the gap closure systematic without losing track of dependencies

### What Was Inefficient

- **Phase 05 UAT status drift**: UAT file stayed at `diagnosed` after all 10 gaps were closed. The final G-05-10 close (plan 05-13) should have flipped UAT to `complete` — required a manual fix at milestone close
- **ROADMAP documentation drift**: `05-06-PLAN.md` checkbox stayed unchecked despite SUMMARY existing; CAT-02/FLOW-02/FLOW-03 REQUIREMENTS.md checkboxes not updated during Phase 5. These are small but add friction at audit time
- **Phase 03 (v1.0) human verification carry-over**: The two human decisions (DATA-04 disposition, D-47 confirmation) could have been recorded at v1.0 milestone close. Carrying `human_needed` forward into v1.1 created an unnecessary audit item

### Patterns Established

- **Two-pass Zod detection**: `undefined` on an optional field = old format; explicit value = new format. More robust than separate schemas per format
- **`computeCatalogAggregate` priority-reduce**: PRIORITY map (Expired=4, ExceededOpenPeriod=3, Opened=2, Active=1) + MANUAL_STATUSES exclusion set. Generalized enough for any future status additions
- **filteredStockEntries vs stockEntries split**: Keep unfiltered `stockEntries` for header badge, empty-state guard, and catalog-delete protection; use `filteredStockEntries` only for the render loop. This pattern prevents filters from hiding safety guards

### Key Lessons

1. Always update UAT/VERIFICATION status fields when gap-closure plans complete — the gap plan executor should own the status flip, not leave it for milestone close
2. Human verification decisions should be recorded immediately when made (at phase transition or UAT sign-off), not deferred to milestone close
3. Priority-reduce over all stock entries is strictly superior to nearest-expiry-proxy for catalog status — the proxy silently drops PAO-only entries and ignores Opened status

### Cost Observations

- Sonnet 4.6 throughout (no model switching)
- Sessions: ~8-10 across 34 days (estimate)
- Notable: Gap closure wave (05-07 through 05-13) was the heaviest work — 7 plans, 118 total commits — but the systematic wave structure kept context manageable

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 3 (1-3) | 12 | Established GSD workflow baseline |
| v1.1 | 3 (4-6) | 17 | UAT-driven gap closure loop; TDD for pure functions |

### Cumulative Quality

| Milestone | Tests | Notes |
|-----------|-------|-------|
| v1.0 | 69 | Baseline test suite |
| v1.1 | ~91 | Added aggregation + inferCatalog + stock mutation tests |

### Top Lessons (Verified Across Milestones)

1. UAT-driven gap closure is essential — Phase 05 UAT found 10 real gaps that would have shipped as bugs
2. TDD for pure, stateful functions (aggregation, dedup, migration) pays off immediately in confidence during integration
3. Migration-first phase ordering prevents rework in downstream phases
