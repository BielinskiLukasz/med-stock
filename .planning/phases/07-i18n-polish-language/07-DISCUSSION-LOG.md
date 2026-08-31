# Phase 7: i18n / Polish Language - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-31
**Phase:** 7-i18n-polish-language
**Areas discussed:** Translation approach, Language toggle placement, Untranslated user content, Date formatting scope

---

## Translation approach

| Option | Description | Selected |
|--------|-------------|----------|
| Custom hook + TS-typed dicts | Zero new dependencies, fully TypeScript-typed keys, ~100 lines to set up. Works well for 2 languages with ~200 strings. | ✓ |
| react-i18next | Industry-standard library, ~50KB, JSON files, ICU plural support. Overkill for 2 languages. | |
| You decide | Leave library choice to researcher/planner. | |

**Language state location:**

| Option | Selected |
|--------|----------|
| React Context (LanguageProvider at root, useLang() hook) | ✓ |
| Zustand store (extend uiStore.ts) | |
| You decide | |

**Key structure:**

| Option | Selected |
|--------|----------|
| Flat by screen/component namespace | ✓ |
| Flat global namespace | |
| You decide | |

**STATUS_LABELS:**

| Option | Selected |
|--------|----------|
| Move to translation dicts (calculateStatus() returns canonical key; display translates) | ✓ |
| Keep STATUS_LABELS, add Polish parallel | |

**CATEGORIES and MedicineForm display names:**

| Option | Selected |
|--------|----------|
| Move to translation dicts (DB/code values stay as English canonical keys) | ✓ |
| Separate lookup tables | |
| You decide | |

**User's choices:** Custom hook + TypeScript dicts; React Context; flat by screen/component; STATUS_LABELS and CATEGORIES/MedicineForm to translation dicts.

---

## Language toggle placement

| Option | Description | Selected |
|--------|-------------|----------|
| In the bottom tab bar | Added to BottomTabBar.tsx alongside 5 nav links. Always visible. | ✓ |
| Floating above the tab bar | Fixed-position chip above nav. | |
| Only on the Data screen | Less visible, conflicts with "visible from any screen" requirement. | |
| You decide | | |

**Visual style:**

| Option | Selected |
|--------|----------|
| EN \| PL text pill | |
| Flag emoji (🇬🇧 / 🇵🇱) | ✓ |
| Toggle switch | |

**Component ownership:**

| Option | Selected |
|--------|----------|
| Inside BottomTabBar component itself | ✓ |
| Sibling in RootLayout | |

**Display mode:**

| Option | Selected |
|--------|----------|
| Show active language flag (tap to switch) | ✓ |
| Show inactive language (action-oriented) | |
| Show both side by side | |

---

## Untranslated user content

| Option | Description | Selected |
|--------|-------------|----------|
| Show as-is | User-typed content (medicine names, custom categories, custom locations) shown as stored. | ✓ |
| Only predefined values translated; custom as-is | Same outcome, more explicit framing. | |
| Restrict to predefined categories only | Removes free-text input flexibility. | |

**Predefined location names:**

| Option | Selected |
|--------|----------|
| Translate at display time via lookup table (DB stays English) | ✓ |
| Leave location names as stored | |

**QUANTITY_UNITS:**

| Option | Selected |
|--------|----------|
| Add to translation dicts | ✓ |
| Keep English units | |

**PAO units (days/weeks/months):**

| Option | Selected |
|--------|----------|
| Add to translation dicts | ✓ |
| Keep English | |

---

## Date formatting scope

| Option | Description | Selected |
|--------|-------------|----------|
| Shared utility function formatDate(dateString, lang) | One change point, consistent with utils.ts pattern. | ✓ |
| Inline per component | Duplicates logic. | |
| You decide | | |

**Input vs display:**

| Option | Selected |
|--------|----------|
| Display only — HTML date inputs stay native (browser handles locale) | ✓ |
| Override inputs too | |

**Coverage:**

| Option | Selected |
|--------|----------|
| All visible dates (cards, detail, history, filter chips) | ✓ |
| Only medicine cards and detail views | |

**Implementation:**

| Option | Selected |
|--------|----------|
| Manual string split (YYYY-MM-DD → split → reorder for PL) | ✓ |
| Intl.DateTimeFormat | |

---

## Claude's Discretion

None — all gray areas had explicit user decisions.

## Deferred Ideas

None — discussion stayed within phase scope.
