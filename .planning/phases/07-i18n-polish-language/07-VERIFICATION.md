---
phase: 07-i18n-polish-language
verified: 2026-09-17T12:00:00Z
status: gaps_found
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_verified_at: 2026-09-16T21:35:00Z
  previous_gaps:
    - WR-05 (aria-label="Open filters" on Medicines list filter button)
    - namePlaceholder gap (CatalogFields.tsx:54, MedicineForm.tsx:119)
  gap_closure_plan: 07-10-PLAN.md
  closure_status: "Complete — WR-05 and placeholder gap both closed"
  new_gaps_identified:
    - WR-01 (Zod form validation messages hardcoded English, never localized)
    - WR-02 (HistoryEntry field names untranslated)
    - WR-03 (CSV column mapper shows raw field identifiers untranslated)

gaps:
  - truth: "All UI error messages display in the active language (I18N-02 requirement: 'All UI strings...error messages...display in active language')"
    status: failed
    reason: "WR-01 (NEW GAP): Zod form-validation messages are hardcoded English literals in schemas (CatalogFields.tsx:26, StockFields.tsx:30, MedicineForm.tsx:35-36) and rendered verbatim by FormMessage (ui/form.tsx:148) without any localization. When Polish-language users submit an add/edit form with missing required fields, validation errors appear in English ('Name is required', 'Expiry date is required') regardless of app language setting. This directly violates I18N-02 ('error messages display in active language') and affects the most common user workflows (add medicine, edit medicine, add stock, edit stock). A form.nameRequired key exists in en.ts and pl.ts but is never referenced; form.expiryDateRequired does not exist at all."
    artifacts:
      - path: "src/components/CatalogFields.tsx"
        issue: "Line 26: catalogSchema validation message 'Name is required' is hardcoded English literal"
      - path: "src/components/StockFields.tsx"
        issue: "Line 30: stockSchema validation message 'Expiry date is required' is hardcoded English literal"
      - path: "src/components/MedicineForm.tsx"
        issue: "Lines 35-36: medicineSchema validation messages 'Name is required' and 'Expiry date is required' are hardcoded English literals"
      - path: "src/components/ui/form.tsx"
        issue: "Line 148: FormMessage renders error.message verbatim (String(error?.message)) without calling t() to translate it"
    missing:
      - "Add form.expiryDateRequired key to src/i18n/types.ts TranslationDict.form namespace"
      - "Add form.expiryDateRequired to src/i18n/en.ts (value: 'Expiry date is required') and src/i18n/pl.ts (value: 'Data ważności jest wymagana' or equivalent)"
      - "Update src/components/CatalogFields.tsx:26 catalogSchema from z.string().min(1, 'Name is required') to z.string().min(1, 'form.nameRequired')"
      - "Update src/components/StockFields.tsx:30 stockSchema from z.string().min(1, 'Expiry date is required') to z.string().min(1, 'form.expiryDateRequired')"
      - "Update src/components/MedicineForm.tsx:35-36 medicineSchema to use 'form.nameRequired' and 'form.expiryDateRequired' instead of hardcoded English"
      - "Update src/components/ui/form.tsx:148 FormMessage to import useLang and translate error messages: const { t } = useLang(); const body = error ? t(String(error?.message)) : children"

  - truth: "All UI field labels and screen text display in the active language, including internal field names in secondary features like change history (I18N-02)"
    status: failed
    reason: "WR-02 (NEW GAP): HistoryEntry.tsx:26 interpolates raw internal database field names (expiryDate, openedDate, location, etc.) directly into history entry text without translation. A Polish-language user viewing a stock entry's change history will see e.g. '12.09.2026 — expiryDate zmieniono: \"2026-01-01\" → \"2026-06-01\"' where 'expiryDate' is untranslated English/camelCase embedded in a Polish sentence. This violates the goal of 'all text displays in chosen language' even though history is a secondary feature."
    artifacts:
      - path: "src/components/HistoryEntry.tsx"
        issue: "Line 26: field variable (raw camelCase name from TRACKED_FIELDS) is interpolated into the formatted entry string without translation: `${field} ${t('history.fieldChanged')}`"
    missing:
      - "Add a FIELD_LABEL_KEYS mapping in HistoryEntry.tsx or historyOps.ts that maps each tracked field name to a translation key (e.g., 'expiryDate' → 'form.expiryDate')"
      - "Translate field labels at format time: const fieldLabel = t(FIELD_LABEL_KEYS[field] ?? field); return `${ts} — ${fieldLabel} ${t('history.fieldChanged')}: ...`"

  - truth: "All UI field names and dropdown options display in the active language, including CSV import field selectors and preview headers (I18N-02)"
    status: failed
    reason: "WR-03 (NEW GAP): CSVColumnMapper.tsx:53-57 and CSVPreview.tsx:42-49 render internal MEDICINE_FIELDS identifiers (expiryDate, quantityUnit, packCount, etc.) verbatim in the dropdown options and table header row. Polish-language users performing a CSV import see untranslated field names in both the column-mapping dropdown and the preview table. This is an edge-case feature (power-user action) but still violates 'all text displays in chosen language' within the scope of what that user-facing screen shows."
    artifacts:
      - path: "src/components/CSVColumnMapper.tsx"
        issue: "Lines 53-57: MEDICINE_FIELDS.map() renders field values directly without translation: {field}"
      - path: "src/components/CSVPreview.tsx"
        issue: "Lines 42-49: mappedFields.map() renders fieldName directly without translation: {fieldName}"
    missing:
      - "Add a FIELD_LABEL_KEYS mapping in a shared location (csvOps.ts or a new i18n/csv.ts file)"
      - "Translate field names at render time in both CSVColumnMapper and CSVPreview: const fieldLabel = t(FIELD_LABEL_KEYS[field] ?? field); then render {fieldLabel}"
      - "Alternatively, add csv.fields.* keys to TranslationDict for each MEDICINE_FIELDS value"

deferred: []
behavior_unverified_items: []
coincidental_reliance_items: []

human_verification: []

---

# Phase 07: i18n Polish Language - Final Verification Report

**Phase Goal:** Users can switch between English and Polish; all text displays in the chosen language with locale-aware formatting

**Verified:** 2026-09-17T12:00:00Z (Re-verification after 07-10-PLAN.md gap closure + 07-REVIEW.md fresh code review)

**Status:** GAPS_FOUND — Phase goal NOT fully achieved

---

## Executive Summary

Phase 07-10 successfully closed the two documented gaps from the prior verification (WR-05: aria-label="Open filters" and the medicine-name placeholder gap). A fresh code review (07-REVIEW.md, dated 2026-09-17) then ran across all modified phase files and identified **three new, previously-undocumented violations of I18N-02** ("all UI strings display in active language"):

1. **WR-01 (CRITICAL):** Zod form-validation messages are hardcoded English. When Polish users submit forms with missing required fields, validation errors appear in English ("Name is required", "Expiry date is required") regardless of language setting. This affects the most-used workflows (add/edit medicine, add/edit stock). **Direct blocker on I18N-02.**

2. **WR-02 (MEDIUM):** Change-history entries show raw untranslated internal field names (expiryDate, openedDate, etc.) in history text. Secondary feature, but still violates "all text displays in chosen language."

3. **WR-03 (MEDIUM-LOW):** CSV import column-mapper and preview show raw untranslated MEDICINE_FIELDS identifiers (internal field names) in dropdown and table headers. Power-user edge case, but still a violation within its scope.

**Result:** Phase goal is NOT achieved. I18N-02 requirement ("All UI strings...error messages...display in active language") is BLOCKED by WR-01. The phase cannot pass without closing this and the other two violations.

---

## Detailed Verification

### Observable Truths (Phase Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can toggle between English and Polish using a visible persistent control (SC #1 / I18N-01) | ✓ VERIFIED | BottomTabBar.tsx: language toggle button functional, t('aria.switchToPolish')/t('aria.switchToEnglish') implemented; useLang() hook provides state management |
| 2 | All labels, placeholders, toasts, error messages, status names, screen titles switch to active language immediately without full page reload (SC #2 / I18N-02 — PRIMARY BLOCKER) | ✗ FAILED | WR-01: Form validation messages hardcoded English ('Name is required', 'Expiry date is required') in Zod schemas, rendered verbatim by FormMessage without translation. WR-02: History entry field names untranslated. WR-03: CSV column mapper field identifiers untranslated. Not all text switches language. |
| 3 | Previously selected language persists in localStorage on app load (SC #3 / I18N-03) | ✓ VERIFIED | LanguageProvider.tsx:20-28 reads/writes 'medstock-lang' key; language restored on mount without full reload |
| 4 | Built-in category and predefined location names display in active language (SC #4 / I18N-04) | ✓ VERIFIED | CATEGORY_KEYS (10 entries), LOCATION_KEYS (7 entries) in types.ts; all wired through t() in FilterChips, FilterBottomSheet, CatalogAutocomplete, etc. |
| 5 | Dates display in locale-appropriate format: PL = DD.MM.YYYY, EN = YYYY-MM-DD (SC #5 / I18N-05) | ✓ VERIFIED | formatDate() in utils.ts correctly splits and reorders dates; MedicineCard and detail views call formatDate(date, lang) to render localized dates |

**Score:** 4/5 truths verified. Truth #2 (I18N-02) FAILED — critical blocker on the phase goal.

---

## Gap-Closure Progress (07-10 Plan)

**Plan Target:** Close WR-05 (aria-label) and the medicine-name placeholder gap (final two documented gaps from 07-VERIFICATION.md re-verification).

**Execution Result:**

| Gap ID | Target | Status | Evidence | Notes |
|--------|--------|--------|----------|-------|
| WR-05 | Medicines list filter button aria-label not translated | ✓ FIXED | commit 5b2b386: aria.openFilters added to types.ts/en.ts/pl.ts; medicines/index.tsx:160 now calls t('aria.openFilters'); grep confirms call site wired | Critical user-visible screen (app's primary landing screen) now has translated button label |
| namePlaceholder | Medicine-name input placeholder hardcoded in two locations | ✓ FIXED | commit ad0d903: form.namePlaceholder EN/PL values corrected; both CatalogFields.tsx:54 and MedicineForm.tsx:119 now call t('form.namePlaceholder'); grep confirms zero remaining hardcoded aria-label/placeholder/title literals in src/**/*.tsx | Orphaned form.namePlaceholder key reused rather than minting duplicate |

**Execution Quality:**
- `npm run build` — ✓ Exits 0 (TypeScript structural type enforcement passes; no compilation errors)
- `npx vitest run` — ✓ 143 tests pass, no regressions
- `npm run lint` — ✓ Exits 0 (no new issues; pre-existing warnings only)
- Final repo-wide grep probe (`grep -rnE 'aria-label="[A-Za-z]|placeholder="[A-Za-z]|title="[A-Za-z]' src --include='*.tsx'`) — ✓ Zero matches confirmed by 07-10-SUMMARY.md line 72

---

## New Gaps Identified (Post-07-10 Code Review)

Fresh code review (07-REVIEW.md, dated 2026-09-17) ran after 07-10 completion and identified three previously-undocumented violations:

### WR-01: Form Validation Messages Hardcoded English (CRITICAL BLOCKER)

**Files Affected:**
- `src/components/CatalogFields.tsx:26` — `catalogSchema` validation: `z.string().min(1, 'Name is required')`
- `src/components/StockFields.tsx:30` — `stockSchema` validation: `z.string().min(1, 'Expiry date is required')`
- `src/components/MedicineForm.tsx:35-36` — `medicineSchema` validation: both fields with hardcoded English messages
- `src/components/ui/form.tsx:148` — `FormMessage` component renders `error.message` verbatim: `const body = error ? String(error?.message) : children`

**Impact:**
- Validation errors appear in English to Polish users on every form submission
- Affects the four most-common workflows: add medicine, edit medicine (2 forms), add stock, edit stock
- Violation of I18N-02 requirement: "error messages display in active language"
- User experience: Polish user fills out form, tries to submit with missing name → sees English error "Name is required" in red text

**Evidence:**
- `form.nameRequired` key exists in en.ts (line 159: `'Name is required'`) and pl.ts, but is **never referenced** in any `t()` call — it is dead code
- `form.expiryDateRequired` key **does not exist** at all in TranslationDict
- Zod schemas are built at module scope and cannot call `t()` directly; translation must happen at display time in FormMessage
- Root cause: FormMessage renders error.message without translation support

**Severity:** HIGH — affects core user workflows (form submission) on every use of the app's core feature (add/edit medicine).

### WR-02: Change-History Field Names Untranslated (MEDIUM)

**File:** `src/components/HistoryEntry.tsx:26`

**Issue:**
```typescript
return `${ts} — ${field} ${t('history.fieldChanged')}: "${String(oldValue)}" → "${String(newValue)}"`
```

The `field` variable contains raw internal database field names (expiryDate, openedDate, location, pao, quantity, quantityUnit, notes, manualStatus — from TRACKED_FIELDS in historyOps.ts). These are rendered as-is, embedded in the history sentence. A Polish user sees: `12.09.2026 — expiryDate zmieniono: "2026-01-01" → "2026-06-01"` where the field name is untranslated English/camelCase.

**Severity:** MEDIUM-LOW — history is a secondary feature (viewed when inspecting individual medicines), not a core workflow. However, it still violates "all text displays in chosen language" within the scope of its screen.

### WR-03: CSV Import Field Identifiers Untranslated (MEDIUM-LOW)

**Files Affected:**
- `src/components/CSVColumnMapper.tsx:53-57` — dropdown options render field names directly: `{field}`
- `src/components/CSVPreview.tsx:42-49` — preview table headers render field names directly: `{fieldName}`

**Issue:** MEDICINE_FIELDS internal identifiers (expiryDate, quantityUnit, packCount, etc.) are shown to users in both the column-mapping dropdown ("select which column is the app field for this CSV column") and the preview table header row. Polish users see untranslated field names.

**Severity:** MEDIUM-LOW — CSV import is a power-user, edge-case feature (infrequent action). However, it still violates "all text displays in chosen language" within the scope of what that screen shows.

---

## Requirements Traceability

| Requirement | Definition | Phase Goal Component | Status | Evidence | Blocker |
|-------------|-----------|---------------------|--------|----------|---------|
| I18N-01 | User can switch app language between English and Polish via a persistent toggle | Language switching | ✓ SATISFIED | BottomTabBar toggle functional; state management via useLang() hook | — |
| I18N-02 | **All UI strings (labels, placeholders, toasts, error messages, status messages, screen titles) display in the active language** | Full string coverage | ✗ BLOCKED | WR-01 (form validation hardcoded English), WR-02 (history field names untranslated), WR-03 (CSV field names untranslated) | **YES** |
| I18N-03 | Selected language persists in localStorage and applies on next load without full reload | Persistence | ✓ SATISFIED | LanguageProvider reads/writes 'medstock-lang' on mount and language change | — |
| I18N-04 | Built-in category names and predefined location names display in the active language | Built-in name translation | ✓ SATISFIED | CATEGORY_KEYS and LOCATION_KEYS all wired through t(); verified in FilterChips, FilterBottomSheet, CatalogAutocomplete | — |
| I18N-05 | Dates display in locale-appropriate format (PL: DD.MM.YYYY, EN: YYYY-MM-DD) | Date formatting | ✓ SATISFIED | formatDate() correctly returns formatted dates per language; verified in MedicineCard, detail views, history timestamps | — |

**Phase Goal Achievement:** ✗ NOT ACHIEVED — I18N-02 ("all UI strings...error messages...display in active language") blocked by WR-01 (critical), WR-02 (secondary), WR-03 (edge case).

---

## Known Out-of-Scope Gaps (Not Flagged as Phase-07 Blockers)

These findings were explicitly identified in prior reviews but marked as out-of-scope for earlier cycles. They remain unfixed but are NOT counted as phase-blocking per the review brief:

- **CR-02:** Dexie `.get()` returns `undefined` instead of `null` in some paths — unrelated to i18n, noted for future fix
- **WR-07:** `formatDate()` hardcodes "No expiry" strings instead of using `t('dates.noExpiry')` — explicitly deferred by 07-09; requires refactoring formatDate to accept translation parameter

These are tracked separately and do not affect this verification's status determination.

---

## Gaps Summary

### Critical Gaps (Must Close Before Phase 07 Passes)

**WR-01 — Form Validation Messages Hardcoded English:** The app's most-used workflows (add medicine, edit medicine, add stock, edit stock) show form validation errors in English to Polish users. This is a direct violation of I18N-02 requirement ("error messages display in active language") and makes the app non-functional in Polish for basic form submission.

**WR-02 — History Field Names Untranslated:** Secondary feature (change history) shows raw untranslated database field names in history text. Less critical than WR-01 but still a violation of "all text displays in chosen language."

**WR-03 — CSV Field Names Untranslated:** Power-user feature (CSV import) shows raw untranslated internal field identifiers in UI. Least critical but still a violation within scope of its feature.

---

## Conclusion

**Phase Goal:** "Add Polish/English language switching with **full string coverage** and locale-aware dates"

**Achievement Status:**

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Language switching ✓ | ✓ ACHIEVED | Toggle works; state management complete |
| Locale-aware dates ✓ | ✓ ACHIEVED | formatDate() returns correct format per language |
| Full string coverage ✗ | ✗ NOT ACHIEVED | Three gaps remain: WR-01 (form validation hardcoded English — CRITICAL), WR-02 (history field names untranslated — SECONDARY), WR-03 (CSV field names untranslated — EDGE CASE). Of these, WR-01 alone blocks I18N-02 requirement compliance. |

**Recommendation:** Mark as **GAPS_FOUND**. The 07-10 plan made progress (closing WR-05 and the placeholder gap), but the phase goal's promise of "full string coverage" is not met. **WR-01 is a critical blocker:** form validation messages are shown in English to every Polish user on the most-common workflows. Closing WR-02 and WR-03 would also be required for true "full coverage."

Do not proceed to Phase 8 without closing all three gaps. WR-01 should be prioritized as it affects core app functionality; WR-02 and WR-03 can be batched into a follow-up cycle.

---

## Next Steps

To achieve "PASSED" status, the following work is required:

### Priority 1: Close WR-01 (Form Validation Messages)
1. Add `expiryDateRequired: string` to `TranslationDict.form` in src/i18n/types.ts
2. Add English and Polish values to src/i18n/en.ts and src/i18n/pl.ts
3. Update all three schemas (CatalogFields.tsx, StockFields.tsx, MedicineForm.tsx) to use translation keys instead of hardcoded messages
4. Modify FormMessage (ui/form.tsx) to call `t()` on error messages before rendering
5. Verify `npm run build` exits 0 and `npx vitest run` passes all tests

### Priority 2: Close WR-02 (History Field Names)
1. Add a FIELD_LABEL_KEYS mapping in HistoryEntry.tsx or historyOps.ts
2. Translate field labels at format time using t() and the mapping
3. Verify `npm run build` exits 0

### Priority 3: Close WR-03 (CSV Field Names)
1. Add a FIELD_LABEL_KEYS mapping for MEDICINE_FIELDS
2. Translate field identifiers at render time in CSVColumnMapper and CSVPreview
3. Verify `npm run build` exits 0

---

_Verified: 2026-09-17T12:00:00Z_  
_Verifier: Claude (gsd-verifier) — re-verification after 07-10-PLAN.md gap closure + fresh code review 07-REVIEW.md_  
_Previous Verification: 07-VERIFICATION.md (2026-09-16T21:35:00Z, status: gaps_found)_
