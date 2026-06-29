# Project Research Summary

## Executive Summary

MedStock is a local-first medicine inventory PWA with zero server-side storage, designed for household family sharing via manual OneDrive JSON sync. The recommended stack is React 18.2+ + TypeScript 5.4+ with Vite 5.1+, Dexie.js 4.0+ for IndexedDB, Zustand 4.4+ for state, React Hook Form + Zod for forms, and shadcn/ui + Tailwind for UI. This architecture delivers full offline functionality on all platforms (Android, iOS, Windows, macOS, Linux) with complete privacy—data never leaves the device except by explicit export.

Core value is immediate answerability: at a pharmacy while sick, user searches for a medicine, sees current stock location and validity status, and decides whether to buy—all in under 5 seconds, offline if needed. The critical challenges are iOS Safari's aggressive 7-day data auto-eviction (requires persistent storage request + recovery flow) and IndexedDB quota limits (requires quota monitoring + history pruning). Research confirms both are preventable with careful design from Phase 1.

## Key Findings

### Stack

- **Build Tool:** Vite 5.1+ (CRA officially sunset Feb 2025; React docs recommend Vite)
- **PWA:** vite-plugin-pwa 0.19+ with Workbox 7.0+ — zero-config service worker generation
- **Database:** Dexie.js 4.0+ — best IndexedDB wrapper for automatic schema versioning and TypeScript support
- **State Management:** Zustand 4.4+ — minimal boilerplate, no Redux overhead, perfect for inventory CRUD
- **Forms/Validation:** React Hook Form 7.51+ + Zod 3.22+ — industry standard, strong TypeScript integration
- **UI Components:** shadcn/ui on Radix + Tailwind — clean/minimal/clinical aesthetic; gives you the code
- **CSV/JSON:** Papa Parse 5.4+ for CSV; native Blob API for JSON export

### Features

**Table Stakes (must have):** Search + validity display in one view, add/edit/delete packages, expiry dashboard, filter/sort by category/location/status, offline PWA, manual JSON sync, trash bin with restore.

**Differentiators (MedStock edge):** Batch creation (pharmacy trip flow), period-after-opening tracking (few apps do this), location tagging, custom categories/locations, CSV bulk import, full activity history, granular status model (Active/Opened/Expired/Used Up).

**Anti-features (deliberately not building):** Medication reminders, drug interactions, barcode scanning, photo storage, automatic background sync, multi-user profiles, health recommendations, real-time multi-device sync.

**Market position:** Pure inventory + offline-first + shared household model + period-after-opening logic. Different from adherence apps (Medisafe) and simpler trackers (MyCabinet).

### Architecture

- **Layered:** UI → State (Zustand) → Service Layer → Dexie.js → IndexedDB
- **Optimistic updates** with rollback via React 19's `useOptimistic` hook
- **Soft delete** via `deleted_at` timestamp; Trash Bin auto-purges after 30 days
- **Audit log** as separate Dexie history table (CREATE/UPDATE/DELETE with old/new values)
- **Conflict resolution:** Last-Write-Wins on `updatedAt` timestamp for JSON import
- **Service worker:** Cache-first for static assets, network-first for dynamic data
- **Live queries:** Dexie `.observe()` for reactive subscriptions; no polling

### Critical Pitfalls

| Pitfall | Severity | Prevention |
|---------|----------|------------|
| iOS 7-day storage eviction (Safari auto-deletes all data) | CRITICAL | Request persistent storage on first launch; export reminder; startup recovery |
| Storage quota exceeded (no graceful degradation) | HIGH | Monitor via `navigator.storage.estimate()`; prune history; read-only mode at 80% |
| Stale service worker (users see old version) | HIGH | Update detection + user prompt + `skipWaiting()` |
| iOS Safari storage isolation (browser ≠ home screen) | HIGH | Document in onboarding; use OneDrive sync as bridge |
| JSON import schema drift (missing fields, silent undefined) | HIGH | Version metadata in exports; Zod validation on import; migration logic |
| Date timezone bugs (timestamps shift across timezones) | HIGH | Store all dates as `YYYY-MM-DD` strings; compare against local calendar |
| CSV encoding/type coercion (special chars, leading zeros lost) | MEDIUM | Encoding detection; preview before commit; Papa Parse with explicit config |
| Full-text search performance at 1000+ records | MEDIUM | Index on name field; `IDBKeyRange` for range queries; paginate results |
| OneDrive File Picker failing in PWA standalone context | MEDIUM | Fallback to device file picker; 5-second timeout |

## Implications for Roadmap

**Suggested phases: 5**

### Phase 1: PWA Foundation & Core Data Layer
Set up Vite + React + TypeScript + Dexie schema (v1) + PWA manifest + service worker. Must address iOS pitfalls (persistent storage request, 7-day recovery), date storage format (YYYY-MM-DD strings), and basic CRUD. All downstream phases depend on this.

### Phase 2: Core Inventory Management
Add indexed search, filter/sort, soft delete/trash bin, history/audit log, quota monitoring, virtualized list rendering. Validate query performance before scaling to 1000+ records.

### Phase 3: Batch Creation, Categories & Locations
Batch add flow (pharmacy use case), custom category management, custom location management, dashboard with expiry/status widgets. Improves add/edit UX.

### Phase 4: Manual Sync (JSON Export/Import)
Household sync via JSON file exchange (OneDrive or device files). Implements schema validation, LWW conflict resolution, version metadata. Requires Phase 1 (dates) and Phase 2 (history). Includes OneDrive File Picker with device file picker fallback.

### Phase 5: CSV Import & Polish
Bootstrap large inventories from spreadsheets. Encoding detection, delimiter detection, column mapping UI, data preview before commit. Can be gated post-launch if time is tight.

## Research Flags

**Phases needing deeper research at planning time:**
- **Phase 4:** OneDrive File Picker API behavior in standalone PWA context on iOS Safari — plan a 1-2 day testing spike before committing to the integration approach.

**Phases with standard patterns (no extra research needed):**
- Phase 1: Vite + React + Dexie are well-documented
- Phase 2: IndexedDB indexing and virtualization (react-window) are standard
- Phase 3: React form patterns are standard
- Phase 5: Papa Parse is mature; edge-case testing as implementation spike

## Gaps to Address

1. **OneDrive File Picker on iOS Safari standalone** — Test on actual device before Phase 4 planning. Have device file picker fallback ready.
2. **Search performance at 5000+ records** — Build Phase 2 prototype with 5000+ records; measure latency and memory.
3. **iOS home screen vs Safari data bridging** — Test storage isolation mechanics before Phase 1 launch.
4. **CSV edge cases** — Build test suite with 10+ real-world problematic CSVs before Phase 5 launch.

## Sources

- Vite official docs (vitejs.dev), vite-plugin-pwa docs
- Dexie.js official docs (dexie.org)
- web.dev PWA guides, MDN Web Docs
- shadcn/ui docs, Radix UI, Tailwind CSS
- React Hook Form + Zod docs
- WebKit blog (iOS storage eviction policy)
- Competitor analysis: Medisafe, MyCabinet, ExpiresBy, DrugInventory
- GitHub community reports on IndexedDB and PWA edge cases
