# Walking Skeleton — MedStock

**Phase:** 1
**Generated:** 2026-06-30

## Capability Proven End-to-End

A household member can open the installed PWA offline, add a medicine package (name + expiry date) to IndexedDB, and see it appear immediately in the medicine list — with the service worker ensuring the app shell loads without any network connection.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 19.2.7 + TypeScript 5.8 + Vite 8.1 | CRA is sunset; Vite is sub-second HMR, ESM-native; React 19 is current stable compatible with all Phase 1 libraries |
| Build base path | `/med-stock/` | GitHub Pages serves from subdirectory matching repo name (D-05) |
| Routing | React Router v7 `createHashRouter` + `RouterProvider` | Hash URLs (`/#/medicines`) work on GitHub Pages with zero server config; no 404.html trick needed (D-04) |
| Data layer | Dexie.js 4.4 + `dexie-react-hooks` (`useLiveQuery`) | IndexedDB ORM with TypeScript-first design; schema versioning prevents data corruption; live queries eliminate manual subscriptions |
| Global UI state | Zustand 5.0 (`create<T>()()` curried form) | < 3 KB; no Redux boilerplate; works seamlessly with React 19 hooks |
| Styling | Tailwind CSS v4 + `@tailwindcss/vite` plugin | CSS-only config (`@import "tailwindcss"` — no `tailwind.config.js`); ships with shadcn/ui |
| Component library | shadcn/ui (copy-paste, Radix UI primitives) | Components live in repo; full Tailwind customization; ARIA/keyboard handled by Radix; clean clinical aesthetic |
| Form handling | React Hook Form 7.80 + Zod 4.4 + `@hookform/resolvers` | Minimal re-renders; Zod generates TypeScript types from schema; zodResolver bridges RHF ↔ Zod |
| PWA infrastructure | vite-plugin-pwa 1.3 + Workbox 7.x | Zero-config PWA generation; auto-generates manifest + service worker; `registerType: 'autoUpdate'` |
| Offline caching | Workbox `GenerateSW` with `globPatterns` precache | Cache-first for all static assets; IndexedDB is the runtime data layer — no server needed |
| Persistent storage | `navigator.storage.persist()` in `App.tsx useEffect` (empty deps) | iOS Safari evicts IndexedDB after 7 days without this grant; call once on first launch (D-02, PWA-02) |
| Auth | None | Single-device personal inventory; no multi-user; no auth in v1 |
| Deployment target | GitHub Pages (static, CDN) | Free; zero backend; matches privacy-first constraint; base path `/med-stock/` |
| Directory layout | `src/components/ui/` (shadcn), `src/lib/` (db, expiry), `src/routes/` (by feature), `src/stores/`, `src/types/` | Feature-adjacent files; Phase 2 adds new routes without restructuring |
| Date storage | `YYYY-MM-DD` strings in all date fields | Timezone-safe for expiry comparisons; no Date object serialization bugs in IndexedDB |
| Status computation | Pure function `calculateStatus(medicine, now)` in `src/lib/expiry.ts` | Never stored in DB; computed at render time; easy to unit-test; used by Phase 2 filter queries (D-11, D-12) |

## Stack Touched in Phase 1

- [x] Project scaffold (Vite + React + TypeScript; ESLint; Vitest + jsdom; Prettier)
- [x] Routing — `/#/medicines`, `/#/medicines/new`, `/#/medicines/:id`, `/#/medicines/:id/edit`, `/#/locations` (D-01)
- [x] Database — Dexie `db.medicines.add()` (write) + `useLiveQuery` (live read); `db.locations` with seed data
- [x] UI — `MedicineForm` (React Hook Form + Zod) wired to `db.medicines.add()`; `MedicineList` driven by `useLiveQuery`; bottom tab bar navigation (D-02)
- [x] Deployment — `npm run build` + `npm run preview` for local full-stack verification; GitHub Pages deploy via `gh-pages` or Actions in Phase 1 CI task

## Out of Scope (Deferred to Later Slices)

- Password reset, email verification, multi-tenancy — no auth at all in v1
- Photo capture / OCR / barcode scanning — manual entry only
- CSV import / JSON export — Phase 3
- OneDrive sync — Phase 3
- Search, filter, sort — Phase 2
- Expiry dashboard alert cards — Phase 2
- Trash Bin UI with restore — Phase 2 (Phase 1 implements soft-delete via `manualStatus: 'Disposed'`)
- Per-medicine change history / audit log — Phase 2
- Batch medicine creation — v2 backlog
- Custom categories — v2 backlog
- In-app iOS "Add to Home Screen" guidance prompt — v2 backlog

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Search (partial name match from any screen), filter/sort, expiry dashboard with alert cards, Trash Bin with restore, per-medicine change history
- Phase 3: JSON export/import backup, CSV bulk import with column mapping, manual OneDrive sync flow
