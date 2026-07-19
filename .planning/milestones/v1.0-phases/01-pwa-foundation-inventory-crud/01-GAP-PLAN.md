---
phase: 01-pwa-foundation-inventory-crud
plan: GAP-01
type: execute
wave: 1
depends_on: [01-04]
files_modified:
  - src/App.tsx
  - src/index.css
  - src/lib/db.ts
autonomous: true
gap_closure: true
requirements: [PWA-02, INV-03, INV-05]

must_haves:
  truths:
    - Cold-start in StrictMode prints the storage-persist warning at most once
    - All shadcn/ui surfaces (Select dropdown, AlertDialog, Popover) render with an opaque background
    - db.ts documents why deletedAt is used for soft-delete instead of manualStatus='Disposed'
  artifacts:
    - src/App.tsx — navigator.storage.persist() call at module scope, no useEffect block
    - src/index.css — @theme inline block bridging v3 CSS vars to Tailwind v4 --color-* namespace
    - src/lib/db.ts — D-25 design deviation comment explaining the deletedAt rationale
  key_links:
    - @theme inline must appear between @import "tailwindcss" and @layer base — order matters for Tailwind v4 processing
    - persist() at module scope must keep the navigator.storage?.persist guard (not all browsers expose the API)
    - db.ts comment must reference D-25 and D-13 so future readers understand the intentional separation
---

<objective>
Close three gaps identified in the Phase 01 UAT session:

Gap A (minor): navigator.storage.persist() fires twice in development because React 18
StrictMode double-invokes useEffect. Moving the call to module scope (where the router
already lives) makes it run exactly once — matching the "CRITICAL: router created OUTSIDE
React tree" pattern already established in App.tsx.

Gap B (cosmetic, major visual impact): All shadcn/ui floating surfaces — Select dropdowns,
AlertDialog, Popover — render with a transparent background. The root cause is a Tailwind v4
naming mismatch: Tailwind v4 generates bg-popover as background-color: var(--color-popover),
but index.css only defines --popover (Tailwind v3 style). Adding an @theme inline block
bridges all 19 shadcn/ui color tokens to the --color-* namespace Tailwind v4 expects.

Gap C (documentation): The UAT surfaced that soft-delete uses deletedAt (not
manualStatus='Disposed' as the original spec said). This is intentional (D-25), and db.ts
already has a partial comment. This task adds the explicit design rationale so future readers
understand why the approach deviates from the original plan and why manualStatus is NOT used.

Purpose: Restore full visual fidelity and eliminate dev-console noise without altering any
business logic. All three tasks are independent and can be executed in any order.

Output: Patched src/App.tsx, src/index.css, src/lib/db.ts — no new files, no schema changes.
</objective>

<execution_context>
@C:/Users/lukasz.bielinski/OneDrive - Accenture/my-folders/my-projects/vibe-coding/med-stock/.claude/gsd-core/workflows/execute-plan.md
@C:/Users/lukasz.bielinski/OneDrive - Accenture/my-folders/my-projects/vibe-coding/med-stock/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/01-pwa-foundation-inventory-crud/01-UAT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move persist() call to module scope (Gap A — double StrictMode warning)</name>
  <files>src/App.tsx</files>
  <action>
    Goal: navigator.storage.persist() must run exactly once per page load, not twice under
    React 18 StrictMode.

    The fix follows the existing pattern in App.tsx: the file already places createHashRouter()
    at module scope with the comment "CRITICAL: router created OUTSIDE React tree — never inside
    a component or useState (Pitfall 4)". The persist() call should live in the same area, right
    after the router constant.

    Steps:

    1. Remove the `import { useEffect }` line at the top of the file — it will no longer be needed.

    2. After the closing `})` of the router constant (currently line 28), add a module-scope block
       that calls navigator.storage.persist(). Preserve the existing guard (`navigator.storage?.persist`),
       the `.then(granted => ...)` callback that logs the warning when not granted, and the `.catch`
       handler. These are all correct — only the LOCATION moves, not the logic.

    3. Remove the entire useEffect block from inside the App() component function (currently
       lines 31–43). After removal, App() should contain only the JSX return statement:
       `return <RouterProvider router={router} />`.

    Commit message: fix(01-gap-a): move storage.persist() to module scope — eliminates StrictMode double-warning
  </action>
  <verify>
    <automated>
      # Confirm useEffect is no longer imported or used in App.tsx
      grep -c 'useEffect' src/App.tsx
      # Expected output: 0

      # Confirm persist call is still present at module scope (outside the App function)
      grep -c 'storage.persist' src/App.tsx
      # Expected output: 1

      # Confirm the app still builds without type errors
      npx tsc --noEmit
    </automated>
  </verify>
  <done>
    - useEffect does not appear anywhere in src/App.tsx
    - navigator.storage.persist() call exists at module scope (after the router constant, before the App function)
    - `npm run dev` cold-start prints the persist warning at most once in the browser console
    - `npx tsc --noEmit` exits 0
  </done>
</task>

<task type="auto">
  <name>Task 2: Add @theme inline block to index.css (Gap B — transparent shadcn/ui components)</name>
  <files>src/index.css</files>
  <action>
    Goal: All shadcn/ui utilities that reference color tokens (bg-popover, bg-background,
    text-foreground, border-border, etc.) must resolve to an opaque, correctly-themed color.

    Root cause: Tailwind v4 generates color utilities as `background-color: var(--color-popover)`.
    The current index.css defines --popover (Tailwind v3 naming). --color-popover is never
    defined, so it resolves to nothing (transparent).

    The fix: Insert an @theme inline block immediately after the `@import "tailwindcss"` line
    and before the `@layer base` block. The `inline` keyword is required — it tells Tailwind v4
    to substitute the mapping at the point of use, preserving runtime CSS variable resolution
    (so dark mode continues to work by changing --popover in .dark {}).

    The block must map all 19 color tokens that shadcn/ui components reference. Each entry
    takes the form: --color-{token}: hsl(var(--{token}));

    Tokens to map (all present in the existing :root block):
    background, foreground, card, card-foreground, popover, popover-foreground,
    primary, primary-foreground, secondary, secondary-foreground, muted, muted-foreground,
    accent, accent-foreground, destructive, destructive-foreground, border, input, ring.

    The --radius token does not need a --color- mapping — shadcn/ui uses it directly as
    a raw CSS var, not through Tailwind's color pipeline.

    Placement: the @theme inline block must appear at the top of the file, directly after
    @import "tailwindcss" and before any @layer rule. Tailwind v4 processes @theme before
    @layer, so order matters.

    Do NOT alter the existing :root variable definitions or the .dark {} block — those remain
    the source of truth for the HSL values. The @theme inline block only creates aliases.

    Commit message: fix(01-gap-b): add @theme inline block — bridge v3 CSS vars to Tailwind v4 --color-* namespace
  </action>
  <verify>
    <automated>
      # Confirm @theme inline block is present
      grep -c '@theme inline' src/index.css
      # Expected output: 1

      # Confirm at least the critical popover token is mapped
      grep -c 'color-popover' src/index.css
      # Expected output: 1 (or more if foreground variant also matches)

      # Confirm the build still compiles
      npx tsc --noEmit && npm run build
    </automated>
    <human-check>
      Start `npm run dev`. Open the Add Medicine form and click the Location dropdown.
      The dropdown list must appear with a solid white background — form fields must NOT
      be visible through it. Open any medicine detail and tap Delete — the AlertDialog
      confirmation must have an opaque white panel over the dark overlay.
    </human-check>
  </verify>
  <done>
    - @theme inline block is present in src/index.css between @import and @layer base
    - All 19 shadcn/ui color tokens are mapped to --color-* equivalents using hsl(var(...)) wrappers
    - Location Select dropdown renders with an opaque background
    - AlertDialog Delete confirmation renders with an opaque content panel
    - npm run build exits 0
  </done>
</task>

<task type="auto">
  <name>Task 3: Document D-25 soft-delete deviation in db.ts (Gap C — spec alignment)</name>
  <files>src/lib/db.ts</files>
  <action>
    Goal: Make the intentional D-25 design deviation explicit in the source so future readers
    understand why soft-delete uses deletedAt and NOT manualStatus='Disposed'.

    Context: The original Phase 1 spec described soft-delete as setting manualStatus='Disposed'.
    The implementation (historyOps.ts softDeleteMedicine) instead sets deletedAt to an ISO
    timestamp. This was intentional for two reasons:
      1. manualStatus is a USER-VISIBLE override field (D-13: values are 'Used Up' and 'Archived'
         for display in the UI). Overloading it with 'Disposed' would corrupt the restore flow —
         a restored medicine would appear as "Disposed" to the user.
      2. deletedAt provides a precise audit timestamp (when was it deleted), which is
         directly useful for the Trash Bin feature and history log.

    The existing comment on line 54 of db.ts already explains the IndexedDB null-key pitfall.
    What is missing is the explicit connection to D-25 and the rationale for NOT using
    manualStatus='Disposed'.

    Steps:

    1. Expand the inline comment on the deletedAt field in the Medicine interface (currently
       line 20: `// null = active; ISO string = soft-deleted (D-25)`) to also note the design
       deviation and the D-13 separation of concerns.

    2. Expand the version 2 .stores() comment block (currently lines 54–55) to reference D-25
       explicitly and explain the relationship between deletedAt and manualStatus.

    The comment should be factual and concise. Do not alter any TypeScript types, schema
    definitions, or runtime behavior — this task is documentation only.

    Commit message: docs(01-gap-c): document D-25 deletedAt design deviation — why not manualStatus='Disposed'
  </action>
  <verify>
    <automated>
      # Confirm D-25 is mentioned in the deletedAt field comment
      grep -c 'D-25' src/lib/db.ts
      # Expected: 2 or more (field comment + schema comment)

      # Confirm D-13 rationale is referenced
      grep -c 'D-13' src/lib/db.ts
      # Expected: 1 or more

      # Confirm no TypeScript changes (file still compiles)
      npx tsc --noEmit
    </automated>
  </verify>
  <done>
    - deletedAt field comment in the Medicine interface explicitly references D-25 and notes
      that manualStatus is NOT used for soft-delete (with a pointer to D-13)
    - The db.version(2) comment block references D-25 and explains why deletedAt was chosen
    - npx tsc --noEmit exits 0 (no type changes introduced)
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| CSS @theme → Tailwind compiler | @theme inline tokens are processed at build time; no runtime security boundary |
| Module scope → browser API | navigator.storage.persist() is a browser API call; no user input involved |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-GAP-01 | Information Disclosure | navigator.storage.persist() | low | accept | Call is already guarded with optional chaining (navigator.storage?.persist); warning is dev-only noise, not a data leak |
| T-GAP-02 | Tampering | src/index.css @theme inline | low | accept | CSS-only change; no script execution surface; Tailwind v4 processes at build time |
</threat_model>

<verification>
Run all three verifications in sequence after executing the tasks:

1. `grep -c 'useEffect' src/App.tsx` → must return 0
2. `grep -c '@theme inline' src/index.css` → must return 1
3. `grep -c 'D-25' src/lib/db.ts` → must return 2 or more
4. `npx tsc --noEmit` → must exit 0
5. `npm run build` → must exit 0
6. Manual smoke: open Add Medicine → Location dropdown has opaque background
7. Manual smoke: delete any medicine → AlertDialog has opaque content panel
8. Manual smoke: cold-start dev server → persist warning appears at most once in console
</verification>

<success_criteria>
- src/App.tsx: useEffect removed; navigator.storage.persist() runs at module scope after the router constant
- src/index.css: @theme inline block with 19 --color-* token mappings sits between @import and @layer base
- src/lib/db.ts: D-25 design deviation documented with explicit rationale (deletedAt vs manualStatus, D-13 separation)
- npm run build exits 0 with no TypeScript errors
- All shadcn/ui floating surfaces (Select, AlertDialog, Popover) render with opaque backgrounds in the browser
- Navigator persist warning fires at most once on cold start under React 18 StrictMode
</success_criteria>

<output>
Create `.planning/phases/01-pwa-foundation-inventory-crud/01-GAP-SUMMARY.md` when done.
Include: which gaps were closed, which files were changed, and a note confirming the
manualStatus='Disposed' plan deviation is now documented in db.ts.
</output>
