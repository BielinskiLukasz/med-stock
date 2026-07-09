<!-- GSD:project-start source:PROJECT.md -->

## Project

**MedStock**

MedStock is a privacy-first Progressive Web App for managing a household medicine inventory. It helps a family instantly answer: do I already have this medicine, where is it, and is it still safe to use — from any device, even offline. All data lives locally on the device; family members sync via a shared OneDrive JSON file.

**Core Value:** At a glance, from anywhere, know whether you already have a valid medicine — so you never overbuy and never miss an expired one.

### Constraints

- **Tech stack**: React + TypeScript + PWA — user-specified, no backend
- **Storage**: IndexedDB only — all data local, no cloud database
- **Privacy**: Zero server-side storage; data never leaves the user's device except via explicit export
- **Offline**: Must work fully without internet access
- **Performance**: Must remain responsive with 1,000+ medicine packages
- **Sync**: Manual only for v1 — no OneDrive API integration, no automatic background sync

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Framework & Build

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 18.2+ | UI library for component-based interface | Industry standard for interactive web apps; excellent TypeScript support; massive ecosystem; React DevTools for debugging |
| TypeScript | 5.4+ | Type-safe language superset | Catches bugs at compile-time; enables refactoring with confidence; essential for medical inventory context (preventing data loss); ships with strict mode by default |
| Vite | 5.1+ | Build tool and dev server | Replaces Create React App (officially sunset as of 2025); sub-second dev server startup; instant HMR; smaller bundles via native ESM and Rollup; zero-config PWA support via plugins |
| Node.js | 18+ LTS or 20+ LTS | Runtime for build and dev tools | Stable; long-term support; required by Vite and modern tooling |

### Progressive Web App Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| vite-plugin-pwa | 0.19+ | Automates PWA setup (manifest, service worker, Workbox) | Zero-config PWA generation; Workbox 7.0.0+ integration; generates service workers without manual boilerplate; framework-agnostic (works with Vite); recommended by Vite ecosystem |
| Workbox | 7.0+ | Service worker library for caching and offline | Battle-tested Google library; advanced caching strategies (stale-while-revalidate for inventory); used by vite-plugin-pwa under the hood; excellent offline support |
| Web Manifest API | Built-in | App metadata, install behavior, icons | Standard; essential for installability on Android, iOS, Windows, macOS, Linux; enables home screen shortcut |

### Local Data Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Dexie.js | 4.0+ | IndexedDB ORM with schema versioning | Best default for app-like IndexedDB data; rich query API; typed tables; automatic schema migrations; dexie-react-hooks for live React rendering; prevents common IndexedDB migration bugs that corrupt data |
| (Alternative: idb) | 8.0+ | Lightweight promise-based IndexedDB wrapper | Use only if you want full control over IndexedDB without abstraction; requires manual version migration logic; best for simple use cases (not recommended for this project's complexity) |

### State Management

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zustand | 4.4+ | Lightweight state container | Minimal boilerplate (< 3KB); no Redux actions/reducers/dispatch overhead; perfect for medium-complexity apps like MedStock; easy to debug; great TypeScript support; works seamlessly with React hooks |
| (Alternative: Jotai) | 2.8+ | Primitive atom-based state | Use if you need fine-grained reactivity or complex state interdependencies; overkill for inventory CRUD operations |

### Form Handling & Validation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React Hook Form | 7.51+ | Lightweight form state management | Minimal re-renders; small bundle; excellent TypeScript integration; works with uncontrolled components; perfect for the add/edit medicine flows |
| Zod | 3.22+ | Runtime schema validation with TypeScript inference | Type-safe validation; generates TypeScript types from schemas; catches form errors at submission; prevents invalid medicine data (e.g., expiration date in past); integrates seamlessly with React Hook Form via @hookform/resolvers |
| @hookform/resolvers | 3.3+ | Bridge between React Hook Form and validation libraries | Connects React Hook Form to Zod; handles async validation if needed |

### UI Component Library

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| shadcn/ui | Latest | Copy-paste component system built on Radix UI primitives | Clean, minimal aesthetic matches medical/clinical design brief; components live in your repo (full control over styling); ships unstyled, you add Tailwind CSS; Radix primitives ensure A11y and keyboard navigation; no black-box dependencies; enables customization for medical context |
| Radix UI (via shadcn/ui) | 1.0+ | Unstyled accessible component primitives | Handles all ARIA attributes and keyboard interactions; low-level building blocks that shadcn/ui wraps with Tailwind |
| Tailwind CSS | 3.4+ | Utility-first CSS framework | Ships with shadcn/ui; fast iteration on minimal design; small final bundle; perfect for clinical white/light aesthetic |

### Import/Export (CSV & JSON)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Papa Parse | 5.4+ | Robust CSV parsing and generation | Handles CSV format edge cases (encoding, quoting, escaping); streaming support for large files; Web Worker support for non-blocking parsing; used by industry for CSV handling |
| File API / Blob API | Built-in | Client-side file creation and download | Standard; no library needed for JSON export (convert object to JSON string, create Blob, trigger download); handles both export and import flows |

### Styling

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tailwind CSS | 3.4+ | Utility-first CSS framework | Comes with shadcn/ui; minimal, clinical aesthetic achievable with utility classes; white/light backgrounds, simple cards; fast iteration; small final bundle |
| PostCSS | 8.4+ | CSS transformation tooling | Required by Tailwind; ships with Vite |

### Development Tools

| Tool | Purpose | Configuration Notes |
|------|---------|---------------------|
| TypeScript Compiler (tsc) | Type checking in build pipeline | Run `tsc --noEmit` in CI to catch type errors before deploy; enable all strict flags in tsconfig.json |
| Vitest | Fast unit testing framework | Vite-native test runner; excellent TypeScript support; faster than Jest for small-to-medium test suites |
| ESLint | Linting for code quality | Catch unused variables, unreachable code, type issues early; use @typescript-eslint/eslint-plugin |
| Prettier | Code formatting | Enforce consistent style automatically; reduces style debates |
| React DevTools | Browser extension for React debugging | Essential for inspecting component state, props, Dexie records |

## Installation

# Core dependencies

# Build & type checking

# PWA setup

# Form handling

# Component library (shadcn/ui comes via copy-paste, but Radix and Tailwind required)

# CSV parsing

# TypeScript utilities

# Development tools

## Alternatives Considered

| Recommended | Alternative | When Alternative Makes Sense |
|-------------|-------------|------------------------------|
| Vite | Create React App | CRA is officially sunset (Feb 2025); only maintain if you have legacy projects |
| Vite | Remix / Next.js | Use if you need server-side rendering or API routes; not needed for client-only PWA |
| Dexie.js | localForage | localForage is in maintenance mode; Dexie is actively maintained and better for complex queries and schema versioning |
| Dexie.js | idb | idb is lighter but requires manual migration logic; error-prone for managing schema changes over app lifetime |
| Zustand | Redux Toolkit | Redux is heavier; worth it only for enterprise apps with 10+ developers and strict state patterns; overkill for MedStock |
| Zustand | Context API | Built-in React Context works but causes re-render issues at scale; Zustand solves this with selective subscriptions |
| shadcn/ui | Material UI | Material UI is heavier (100-200KB gzipped) and opinionated on Material Design; harder to achieve minimal clinical aesthetic |
| shadcn/ui | Chakra UI | Chakra is pre-styled (less control); shadcn/ui gives you the code and full customization |
| Papa Parse | Custom CSV parsing | Don't build CSV parsing manually; Papa Parse handles encoding, escaping, and edge cases |
| Tailwind CSS | Styled Components / CSS Modules | Tailwind is utility-first and ships with shadcn/ui; no need for CSS-in-JS overhead for this project |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App (CRA) | Officially sunset Feb 2025; webpack-based; slow dev server (20-30 seconds); doesn't support modern ES modules natively; no clear upgrade path | Vite 5.1+ |
| Redux (vanilla) | Excessive boilerplate for inventory CRUD; 1,000+ medicine packages don't require time-travel debugging or DevTools at this stage | Zustand (simple) or Jotai (if atoms needed) |
| Material UI | 100-200KB gzipped; opinionated Material Design doesn't match brief of clean, minimal, clinical aesthetic | shadcn/ui (Radix + Tailwind) |
| Formik | Older form library; more verbose than React Hook Form; not as good TypeScript support | React Hook Form + Zod |
| Custom IndexedDB code | Error-prone schema migrations; no type safety; manual transaction handling bloats code | Dexie.js |
| localStorage for inventory | 5-10MB limit per domain; insufficient for medicine packages + images (future); IndexedDB supports 50MB+ | IndexedDB via Dexie.js |
| REST API backend | Violates privacy-first constraint; adds server cost; introduces latency; defeats offline capability | Local-first IndexedDB |

## Architecture Patterns by Phase

### Phase 1: Core Data Structure & Search

- Use Dexie.js schema to define medicine table (name, category, location, expiration date, opened date, quantity, notes, status)
- Zustand store to manage current search filter, selected medicine, UI state
- Zod schema to validate medicine creation/edit forms
- shadcn/ui Form component for medicine input

### Phase 2: Dashboard & Filtering

- Dexie.js queries for calculating dashboard metrics (total count, expired, expiring soon)
- React Hook Form for multi-select filters (category, location, status)
- shadcn/ui Table component for medicine list display

### Phase 3: Import/Export

- Papa Parse for CSV parsing with column mapping UI
- Blob API for JSON export
- React Hook Form for file upload and column mapping form

### Phase 4: PWA & Offline

- vite-plugin-pwa to generate service worker and manifest
- Workbox caching strategy: network-first for app shell, cache-first for static assets
- IndexedDB (Dexie.js) is the single source of truth; no cloud sync in MVP

### Phase 5: Manual OneDrive Sync (Future)

- JSON export via Blob API
- JSON import via File API + Papa Parse equivalent for JSON
- User controls sync timing (no background sync in MVP)

## Version Compatibility

| Package Combination | Compatible | Notes |
|---------------------|-----------|-------|
| React 18.2+ + TypeScript 5.4+ | YES | Excellent support for React 18 types; use React.FC<Props> pattern |
| Vite 5.1+ + @vitejs/plugin-react | YES | Vite's official React plugin; handles fast refresh and JSX |
| Dexie.js 4.0+ + TypeScript 5.4+ | YES | Dexie has TypeScript-first design; strong typing for tables and queries |
| React Hook Form 7.51+ + Zod 3.22+ | YES | @hookform/resolvers handles integration seamlessly |
| Tailwind CSS 3.4+ + shadcn/ui | YES | shadcn/ui is built on Tailwind; components import Tailwind class names |
| vite-plugin-pwa 0.19+ + Workbox 7.0+ | YES | vite-plugin-pwa uses Workbox 7.0 internally |
| Papa Parse 5.4+ + TypeScript 5.4+ | YES | Has type definitions via @types/papaparse |

## Known Pitfalls & How to Avoid Them

### IndexedDB Schema Migrations

### Over-Engineering State Management

### React Hook Form & Uncontrolled Inputs

### CSV Import Without Validation

### Service Worker Caching Too Aggressively

## Sources

- [Vite and Progressive Web Apps — CodeMag](https://www.codemag.com/Article/2309071/Vite-and-Progressive-Web-Apps)
- [Build a Blazing-Fast, Offline-First PWA with Vue 3 and Vite in 2025 — Medium](https://medium.com/@Christopher_Tseng/build-a-blazing-fast-offline-first-pwa-with-vue-3-and-vite-in-2025-the-definitive-guide-5b4969bc7f96)
- [Vite Plugin PWA Official Guide](https://vite-pwa-org.netlify.app/guide/)
- [vite-plugin-pwa on GitHub](https://github.com/vite-pwa/vite-plugin-pwa)
- [Dexie.js vs idb vs localForage — PkgPulse Guides](https://www.pkgpulse.com/guides/dexie-vs-localforage-vs-idb-indexeddb-browser-storage-2026)
- [State Management in 2025: When to Use Context, Redux, Zustand, or Jotai — DEV Community](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- [React UI libraries in 2025: Comparing shadcn/ui, Radix, Mantine, MUI, Chakra & more — Makers' Den](https://makersden.io/blog/react-ui-libs-2025-comparing-shadcn-radix-mantine-mui-chakra)
- [Using Zod with React Hook Form using TypeScript — DEV Community](https://dev.to/majiedo/using-zod-with-react-hook-form-using-typescript-1mgk)
- [CSV File Processing: Import and Export Logic in React — Medium](https://medium.com/@adwait.purao/csv-file-processing-import-and-export-logic-in-react-85e80ac0fbb9)
- [Vite vs Create-React-App: A Complete Comparison — Hyperlink InfoSystem](https://www.hyperlinkinfosystem.com/blog/vite-vs-create-react-app-a-complete-comparison)
- [Why Vite Replaced CRA: The 2025 React Migration Guide — Nandann Creative Agency](https://www.nandann.com/blog/vite-replaces-cra-react-migration-guide-2025)
- [How to Set Up Strict TypeScript Configuration for React Projects](https://oneuptime.com/blog/post/2026-01-15-strict-typescript-configuration-react/view)

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
