# Architecture Research: Local-First React PWA with IndexedDB

**Domain:** Privacy-first medicine inventory app (local-first PWA)
**Researched:** 2026-06-29
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      User Interface Layer                            │
│  ┌────────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ Dashboard  │ │Inventory  │ │  Search  │ │ Trash/Settings  │    │
│  │ Component  │ │Management │ │Component │ │ Components      │    │
│  └────┬───────┘ └─────┬─────┘ └────┬─────┘ └────┬─────────────┘    │
│       │                │            │            │                  │
├───────┴────────────────┴────────────┴────────────┴──────────────────┤
│                     State Management Layer                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Redux/Zustand Store: Sync State, UI State, Offline Queue   │  │
│  │ React Context: UI preferences, modal state, filter state   │  │
│  │ useOptimistic Hook: Immediate UI feedback on mutations    │  │
│  └──────────────────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────────────────────┤
│                   Service/Business Logic Layer                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ Database     │ │ Sync Engine  │ │ Offline Mgmt │                │
│  │ Adapter      │ │ (JSON I/O)   │ │ Queue        │                │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘                │
│         │                │                 │                        │
├─────────┴────────────────┴─────────────────┴────────────────────────┤
│                    Data Layer (IndexedDB)                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ Medicines    │ │ History/Audit│ │ Trash        │                │
│  │ (Dexie)      │ │ Log (Dexie)  │ │ (Dexie)      │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
├────────────────────────────────────────────────────────────────────┤
│              Service Worker & Offline Layer                         │
│  ┌─────────────────────────────────────────────────────┐          │
│  │ Cache-First (static assets)                         │          │
│  │ Network-First (dynamic data)                        │          │
│  │ Background Sync (offline queue replay)              │          │
│  └─────────────────────────────────────────────────────┘          │
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communication | Typical Implementation |
|-----------|----------------|-----------------|--------------------------|
| **Dashboard** | Display inventory statistics, recent additions, expiry alerts | Redux state, useOptimistic | Computed from medicines table, pre-calculated counts |
| **Inventory List** | Display searchable, filterable medicine list with status badges | Redux state + Dexie queries, optimistic add | React table/grid component with virtualization for 1K+ items |
| **Add/Edit Form** | Create/update medicine packages with validation | Direct Dexie write, optimistic update to Redux | Controlled form with batch creation, field validation |
| **Search Component** | Real-time fuzzy search across medicines | Dexie IndexedDB query with live results | Debounced FTS-like search using Dexie filter/limit |
| **Trash Bin** | Show soft-deleted items, restore, or permanently delete | Dexie soft-delete flag queries | Separate view filtering by deleted_at timestamp |
| **Settings/Sync** | Manage locations, categories, export/import JSON, manual sync | Dexie bulk operations, JSON stringification | File I/O APIs, blob export, manual restore flow |
| **History/Audit** | Timeline view of all medicine changes per package | Separate history table queries | Chronological audit log with change details |
| **Dexie Database** | Schema definition, table creation, migrations | IndexedDB API wrapper | Dexie instance with version upgrades, schema validation |
| **Sync Engine** | Export full/partial JSON, import with conflict detection | JSON.stringify/parse, timestamp comparison | Last-write-wins (LWW) strategy for OneDrive sync |
| **Offline Queue** | Track failed mutations during offline periods | In-memory or IndexedDB queue table | Prioritized queue, replay on reconnect |
| **Service Worker** | Cache assets, intercept network requests, background sync | Network interception | Workbox or manual SW with strategic caching |

## Recommended Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx              # Top nav, search bar, sync button
│   │   ├── Sidebar.tsx                # Navigation, settings
│   │   └── Layout.tsx                 # Main layout wrapper
│   ├── pages/
│   │   ├── Dashboard.tsx              # Home screen with stats
│   │   ├── InventoryList.tsx          # Main inventory view
│   │   ├── AddMedicine.tsx            # Add/batch add form
│   │   ├── EditMedicine.tsx           # Edit single medicine
│   │   ├── TrashBin.tsx               # Soft-deleted items
│   │   ├── History.tsx                # Audit log viewer
│   │   └── Settings.tsx               # Config, categories, locations
│   ├── inventory/
│   │   ├── MedicineCard.tsx           # Single medicine display card
│   │   ├── MedicineTable.tsx          # Virtualized table with filters
│   │   ├── StatusBadge.tsx            # Status indicator (active/expired/etc)
│   │   ├── FilterBar.tsx              # Category/location/status filters
│   │   └── SearchBar.tsx              # Fuzzy search input
│   ├── forms/
│   │   ├── MedicineForm.tsx           # Reusable add/edit form
│   │   ├── LocationManager.tsx        # Manage locations
│   │   └── CategoryManager.tsx        # Manage categories
│   ├── sync/
│   │   ├── SyncStatus.tsx             # Sync progress indicator
│   │   ├── ImportDialog.tsx           # JSON import UI
│   │   └── ExportButton.tsx           # JSON export trigger
│   └── common/
│       ├── LoadingSpinner.tsx         # Loading state
│       ├── ErrorBoundary.tsx          # Error handling
│       └── ConfirmDialog.tsx          # Delete confirmation
├── store/
│   ├── store.ts                       # Redux/Zustand store setup
│   ├── slices/
│   │   ├── medicineSlice.ts           # Medicine state (cache + optimistic)
│   │   ├── syncSlice.ts               # Sync status, queue state
│   │   ├── uiSlice.ts                 # UI modal/filter state
│   │   └── offlineSlice.ts            # Offline mode flag
│   └── hooks/
│       ├── useOptimisticMedicine.ts   # useOptimistic wrapper
│       ├── useSyncState.ts            # Sync status hook
│       └── useOfflineQueue.ts         # Queue management hook
├── db/
│   ├── db.ts                          # Dexie instance + schema
│   ├── schema.ts                      # Table definitions
│   ├── migrations.ts                  # Version upgrade functions
│   └── queries.ts                     # Reusable Dexie queries
├── services/
│   ├── medicineService.ts             # Add/edit/delete logic
│   ├── syncService.ts                 # JSON export/import
│   ├── offlineQueueService.ts         # Queue management
│   ├── historyService.ts              # Audit log operations
│   └── validationService.ts           # Field validation rules
├── workers/
│   ├── sw.ts                          # Service worker (Workbox config)
│   └── backgroundSync.ts              # Background sync logic
├── utils/
│   ├── medicine-status.ts             # Status calculation logic
│   ├── date-utils.ts                  # Expiry date helpers
│   ├── conflict-resolution.ts         # Sync conflict handling
│   └── json-utils.ts                  # JSON export/import helpers
├── hooks/
│   ├── useDatabase.ts                 # Dexie instance access
│   ├── useSync.ts                     # Sync operations
│   └── useMedicineQuery.ts            # Query wrapper hooks
├── types/
│   ├── medicine.ts                    # Medicine, History, Trash types
│   ├── sync.ts                        # Sync-related types
│   └── store.ts                       # Redux state types
├── constants/
│   ├── app-config.ts                  # App defaults, limits
│   ├── status-values.ts               # Status enum definitions
│   └── error-messages.ts              # UI error strings
├── App.tsx                            # Root component
├── index.tsx                          # React entry point
└── manifest.json                      # PWA manifest

public/
├── manifest.json                      # (referenced above)
├── icons/
│   ├── icon-192x192.png              # PWA icon
│   ├── icon-512x512.png              # PWA icon
│   └── maskable-icon-192x192.png     # Maskable PWA icon
├── index.html                         # HTML entry point
└── sw.js                              # Service worker registration
```

### Structure Rationale

- **`components/layout/`:** Shared layout components (header, sidebar, overall page structure) organized by visual purpose.
- **`components/pages/`:** Full-page components for each major view (Dashboard, Settings, etc.), placed flat for discoverability.
- **`components/inventory/`:** Reusable inventory-specific components (cards, tables, filters) grouped by domain.
- **`components/forms/`:** Form components for data entry; `MedicineForm` is the core reusable piece.
- **`components/sync/`:** Sync-related UI (progress, import/export dialogs) isolated from core inventory logic.
- **`store/`:** Redux/Zustand store split into slices (medicine, sync, ui, offline) with custom hooks for subscriptions.
- **`db/`:** All Dexie-related code: schema, versions, migrations, and query helpers centralized for easy maintenance.
- **`services/`:** Business logic layers—database operations, sync logic, offline queue management—decoupled from components.
- **`workers/`:** Service worker and background sync scripts; kept separate from main bundle.
- **`utils/`:** Pure functions for medicine status calculation, date handling, conflict resolution, JSON operations.
- **`hooks/`:** Custom React hooks for database access and queries, promoting reuse across components.
- **`types/`:** TypeScript definitions grouped by domain (medicine, sync, store) for maintainability.

This structure scales well to 1,000+ medicines without performance penalty due to virtualization, indexed queries, and lazy loading patterns.

## Architectural Patterns

### Pattern 1: Optimistic Updates with Rollback

**What:** Display changes immediately in the UI, queue the actual write, and rollback if it fails.

**When to use:** Any create, update, or delete operation. Essential for offline-first: user adds a medicine while offline; UI updates instantly; write queues; when online again, syncs automatically.

**Trade-offs:** 
- Pro: Perceived instant response, core to offline UX
- Con: Requires careful state management and rollback logic; must handle race conditions

**Example:**
```typescript
// React 19+ useOptimistic pattern
const [optimisticMedicines, addOptimistic] = useOptimistic(
  medicines,
  (state, newMedicine) => [...state, { ...newMedicine, id: 'temp-' + Date.now() }]
);

async function handleAddMedicine(medicine) {
  // 1. Optimistically update UI
  addOptimistic(medicine);
  
  // 2. Queue write to IndexedDB + sync
  try {
    const result = await medicineService.add(medicine);
    // 3. Confirm in store once persisted
    dispatch(medicineAdded(result));
  } catch (error) {
    // 4. Rollback on error
    dispatch(optimisticAddFailed(medicine.id));
  }
}
```

### Pattern 2: Dexie Schema Versioning with Migrations

**What:** Define database schema in Dexie with version numbers; attach upgrade functions to handle data migrations when schema changes.

**When to use:** Any change to table structure, index definitions, or data transformation. Version each schema change.

**Trade-offs:**
- Pro: Handles schema evolution gracefully; users with old versions upgrade automatically
- Con: Must keep old upgrade functions in code as long as old versions might be in use; migrations can't use Dexie.sync

**Example:**
```typescript
const db = new Dexie('MedStock');

db.version(1).stores({
  medicines: '++id, name, expiredAt',
  history: '++id, medicineId, changedAt'
});

db.version(2)
  .stores({
    medicines: '++id, name, expiredAt, category',
    history: '++id, medicineId, changedAt'
  })
  .upgrade(async (tx) => {
    // Add category field if missing
    await tx.table('medicines').toCollection().modify((med) => {
      if (!med.category) med.category = 'Uncategorized';
    });
  });
```

### Pattern 3: Service Worker Cache-First + Network-First Hybrid

**What:** Serve static assets (JS, CSS, images) from cache to maximize offline speed. Serve dynamic data (API endpoints) network-first, falling back to cache on failure.

**When to use:** All PWA apps. Static = versioned build artifacts; dynamic = JSON exports, live search results, sync endpoints.

**Trade-offs:**
- Pro: Instant offline load; fresh data when online; graceful degradation
- Con: Cache invalidation complexity; need explicit versioning strategy for static assets

**Example:**
```typescript
// Service Worker using Workbox
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

// Static assets: cache-first with 30-day expiry
registerRoute(
  ({ request }) => request.destination in ['style', 'script', 'image'],
  new CacheFirst({ cacheName: 'assets-v1' })
);

// HTML navigation: network-first, fallback to cache
const navigationRoute = new NavigationRoute(
  new NetworkFirst({ cacheName: 'pages' }),
  { whitelist: [/^(?!.*\.json$|.*api).*/] }
);
registerRoute(navigationRoute);
```

### Pattern 4: Soft Delete with Trash Bin and Permanent Deletion

**What:** Mark records as deleted (add `deleted_at` timestamp) rather than physically removing them. Recover from Trash Bin, or permanently delete after retention period.

**When to use:** Any user-facing data loss prevention. Mandatory for inventory apps where users need recovery after accidental deletion.

**Trade-offs:**
- Pro: Recoverable data; audit trail of deletions; satisfies privacy (data can be removed eventually)
- Con: Unique constraints and foreign keys don't work properly with soft deletes; requires application-level enforcement

**Example:**
```typescript
interface Medicine {
  id: string;
  name: string;
  deleted_at: number | null; // Timestamp of deletion, null = active
}

// Query only active medicines
const activeMedicines = await db.medicines
  .where('deleted_at').equals(null)
  .toArray();

// Soft delete: mark with timestamp
async function deleteMedicine(id) {
  await db.medicines.update(id, { deleted_at: Date.now() });
}

// Restore from trash
async function restoreMedicine(id) {
  await db.medicines.update(id, { deleted_at: null });
}

// Permanent deletion after 30 days
async function purgeOldTrash() {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  await db.medicines
    .where('deleted_at').below(thirtyDaysAgo)
    .delete();
}
```

### Pattern 5: Audit Log via Separate History Table

**What:** For every create/update/delete, append a record to a `history` table with timestamp, operation type, before/after values, and user context.

**When to use:** Required by MedStock; tracks validity of state changes over time; enables user to see what changed and when.

**Trade-offs:**
- Pro: Complete audit trail; powerful for debugging and transparency
- Con: History table grows unbounded; can consume significant storage; must manage retention

**Example:**
```typescript
interface History {
  id: string;
  medicineId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  changedAt: number; // ISO timestamp
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: { userId?: string; source?: 'manual' | 'import' };
}

async function recordMedicineChange(medicineId, operation, oldValue, newValue) {
  const changes = Object.keys(newValue || {})
    .filter(key => oldValue?.[key] !== newValue?.[key])
    .map(key => ({
      field: key,
      oldValue: oldValue?.[key],
      newValue: newValue?.[key]
    }));

  await db.history.add({
    id: crypto.randomUUID(),
    medicineId,
    operation,
    changedAt: Date.now(),
    changes,
    metadata: { source: 'manual' }
  });
}

// Query history for a medicine
const medicineHistory = await db.history
  .where('medicineId').equals(medicineId)
  .reverse()
  .toArray();
```

### Pattern 6: JSON Export/Import with Conflict Resolution (LWW)

**What:** Export full inventory as JSON for backup or sync with OneDrive. Import JSON file; detect conflicts (both sides modified the same medicine); resolve using Last-Write-Wins (LWW) timestamp strategy.

**When to use:** Every manual sync operation and full backups. MedStock uses this for household sync.

**Trade-offs:**
- Pro: Simple, deterministic; no backend required; human-readable format
- Con: LWW can lose data if both devices edit simultaneously; no true CRDT semantics; manual sync is lower friction than automatic

**Example:**
```typescript
interface ExportFormat {
  version: 1;
  exportedAt: number;
  medicines: Array<Medicine>;
  history?: Array<History>;
}

async function exportInventory(includeHistory = true) {
  const medicines = await db.medicines.toArray();
  const history = includeHistory ? await db.history.toArray() : [];
  
  const data: ExportFormat = {
    version: 1,
    exportedAt: Date.now(),
    medicines,
    history
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  return blob;
}

async function importInventory(file: File) {
  const text = await file.text();
  const { medicines, history } = JSON.parse(text) as ExportFormat;
  
  // LWW conflict resolution
  for (const incomingMed of medicines) {
    const existing = await db.medicines.get(incomingMed.id);
    
    if (!existing) {
      // New medicine: insert
      await db.medicines.add(incomingMed);
    } else if (incomingMed.updatedAt > existing.updatedAt) {
      // Incoming is newer: overwrite
      await db.medicines.update(incomingMed.id, incomingMed);
    }
    // Else: existing is newer; skip incoming
  }
  
  // Optionally import history
  if (history?.length) {
    await db.history.bulkAdd(history);
  }
}
```

### Pattern 7: State Management: Redux for Offline Queue, Context for UI State

**What:** Use Redux Toolkit to manage complex offline state (sync queue, pending writes, conflict count). Use React Context for simpler UI state (modals, filters, current page).

**When to use:** Avoid premature optimization—start with Context for everything. Migrate to Redux only when you have true offline queue logic or multi-device sync concerns.

**Trade-offs:**
- Pro: Redux provides dev tools, time-travel debugging, predictable state updates
- Con: Boilerplate; Context is sufficient for simple UI state; mixing both requires discipline

**Example:**
```typescript
// Redux slice for offline queue
import { createSlice } from '@reduxjs/toolkit';

const offlineQueueSlice = createSlice({
  name: 'offlineQueue',
  initialState: {
    pending: [] as Array<{ id: string; medicine: Medicine; retries: number }>,
    lastSyncAt: null as number | null,
    isSyncing: false
  },
  reducers: {
    queueWrite(state, action) {
      state.pending.push({
        id: crypto.randomUUID(),
        medicine: action.payload,
        retries: 0
      });
    },
    markSyncing(state) {
      state.isSyncing = true;
    },
    clearQueue(state) {
      state.pending = [];
      state.lastSyncAt = Date.now();
      state.isSyncing = false;
    },
    retryFailed(state) {
      state.pending.forEach(item => item.retries++);
    }
  }
});

// Context for UI state
interface UIContextType {
  isAddModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
  selectedFilters: Filters;
  setFilters: (filters: Filters) => void;
}

const UIContext = createContext<UIContextType | null>(null);
```

### Pattern 8: Live Dexie Queries with React Subscriptions

**What:** Dexie supports `.observe()` to subscribe to query changes; whenever matching rows change, the subscription fires, allowing components to re-render reactively without polling.

**When to use:** Display medicine list that updates when a new medicine is added (even from another tab); dashboard stats that auto-refresh.

**Trade-offs:**
- Pro: Reactive; minimal polling; Dexie handles subscription cleanup
- Con: Requires custom hooks; component must know about subscription setup

**Example:**
```typescript
function useLiveMedicines(filters?: Filters) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Create query
    let query = db.medicines.where('deleted_at').equals(null);
    
    if (filters?.category) {
      query = query.filter(m => m.category === filters.category);
    }

    // Subscribe to changes
    const unsubscribe = query.observe((change) => {
      // Change event fires when medicines matching the query change
      // Re-fetch the full result set
      query.toArray().then(setMedicines);
    });

    // Initial load
    query.toArray().then(setMedicines).finally(() => setIsLoading(false));

    return unsubscribe;
  }, [filters?.category]);

  return { medicines, isLoading };
}
```

## Data Flow

### Request Flow: Add Medicine

```
User fills form (optimistic state via useOptimistic)
    ↓
handleAddMedicine() called
    ↓
UI updates immediately (optimistic)
    ↓
medicineService.add() → Dexie.medicines.add() → IndexedDB
    ↓
recordMedicineChange() → Dexie.history.add() → IndexedDB
    ↓
Dispatch Redux medicineAdded(result) → store state updates
    ↓
Components subscribe to store re-render with new medicine
```

### Request Flow: Sync (Manual JSON Import)

```
User clicks "Sync from OneDrive"
    ↓
User selects JSON file (export from another device)
    ↓
importInventory(file)
    ↓
Parse JSON → Extract medicines array
    ↓
For each medicine:
  Fetch existing from IndexedDB
    ↓
  Compare updatedAt timestamps (LWW)
    ↓
  If incoming is newer: db.medicines.update()
    ↓
Record history entries
    ↓
Dispatch syncCompleted() → UI shows success
```

### Request Flow: Offline Write + Sync on Reconnect

```
User adds medicine while offline
    ↓
Optimistic update → component state + UI refresh
    ↓
medicineService.add() attempts Dexie write → succeeds (local)
    ↓
Dispatch offlineQueueSlice.queueWrite(medicine)
    ↓
Service worker detects offline mode
    ↓
[User goes online]
    ↓
backgroundSync triggered (Workbox or manual online event listener)
    ↓
Replay all pending writes from Redux queue
    ↓
Call JSON export on local device
    ↓
Call JSON import on remote (user manually uploads)
    ↓
Clear queue → Dispatch syncCompleted()
```

### State Management Flow

```
Component → useOptimistic (immediate UI update)
    ↓
User action → medicineService.add()
    ↓
Dexie operation (IndexedDB write succeeds locally)
    ↓
Dispatch Redux action (medicineAdded) → store state
    ↓
If offline: add to offlineQueue
    ↓
On reconnect: backgroundSync replays queue
    ↓
Dispatch syncCompleted() → clear queue, update UI
```

### Key Data Flows

1. **Add Medicine:** Form → optimistic update → Dexie.medicines.add() → history record → Redux dispatch → component re-render
2. **Search:** User types → debounce → Dexie.medicines.filter() + live query → useLiveMedicines hook fires → results render
3. **Filter/Sort:** User selects filter → Redux uiSlice.setFilters() → trigger useLiveMedicines() re-query → live results
4. **Soft Delete:** User clicks delete → optimistic update → Dexie.update({ deleted_at: now }) → history record → Redux dispatch
5. **Restore from Trash:** User clicks restore → Dexie.update({ deleted_at: null }) → history record → Redux dispatch → component re-render
6. **Manual Sync:** User exports JSON → file downloads; imports JSON on another device → LWW conflict resolution → history merged

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-100 medicines** | Basic setup: Dexie + Redux Context hybrid. No optimization needed. Service worker handles offline. |
| **100-500 medicines** | Introduce React virtualization (`react-window`) for list performance. Dexie indexes on search fields (name, category, location). Lazy load history. |
| **500-1000+ medicines** | Fully virtualized table. Partition history by medicineId for query speed. Consider background worker for long-running imports. Increase IndexedDB quota awareness (most browsers allow 50MB+). Monitor storage usage. |

### Scaling Priorities

1. **First bottleneck:** List rendering with 1,000 items. Fix with virtualization (`react-window`, `react-virtualized`). Dexie queries are fast; rendering is the constraint.
2. **Second bottleneck:** Full-text search across 1,000 items. Implement Dexie compound indexes on (name, category). Consider manual FTS library if needed (e.g., `fuse.js` for fuzzy search client-side).
3. **Third bottleneck:** History table size (grows with every change). Implement soft retention (keep only last 12 months in active history; archive older logs). Consider compressing or auto-deleting old history entries.

## Anti-Patterns

### Anti-Pattern 1: Storing Sync State in Component State

**What people do:** Store `isSyncing`, `syncError`, `lastSyncAt` in multiple components.

**Why it's wrong:** State gets out of sync; tab A thinks sync succeeded, tab B doesn't know. No single source of truth. Can't access sync state from other components easily.

**Do this instead:** Store sync state in Redux (or Zustand) so all components subscribe to the same source. Single dispatch call syncs UI everywhere.

### Anti-Pattern 2: No Rollback on Optimistic Failures

**What people do:** Update UI optimistically but don't revert if the database write fails.

**Why it's wrong:** User sees data that isn't persisted. If they close the app or refresh, the optimistic change is lost. Offline queue becomes inconsistent with UI.

**Do this instead:** Always pair optimistic update with a rollback handler. Catch errors from medicineService.add(), dispatch a revert action, show error toast.

### Anti-Pattern 3: Not Versioning Dexie Schema

**What people do:** Add fields to the Medicine type without incrementing db.version() or attaching upgrade functions.

**Why it's wrong:** Existing users' databases don't get the new table/index. Queries fail silently or return incomplete data.

**Do this instead:** Bump db.version() every time schema changes. Include an upgrade function if data migration is needed. Test with old databases to verify the upgrade path works.

### Anti-Pattern 4: Syncing with Dexie.sync() on Mutable Tables

**What people do:** Use Dexie Cloud or a custom sync layer that calls upgrade() functions.

**Why it's wrong:** Upgrade functions are not idempotent. If sync replay happens twice, data corrupts or multiplies.

**Do this instead:** Keep upgrade functions for non-synced schema only. For synced data (like medicines), handle migrations in application code outside of db.version().upgrade().

### Anti-Pattern 5: No Conflict Resolution Strategy

**What people do:** Import JSON from another device; last imported data unconditionally overwrites.

**Why it's wrong:** If both devices edit the same medicine (e.g., quantity), the slower device's change is lost silently.

**Do this instead:** Compare timestamps (LWW) or manual merge. Log conflicts. Alert user if data may have been lost. For critical apps, require explicit user decision.

### Anti-Pattern 6: Hard Delete Instead of Soft Delete

**What people do:** Permanently delete from Dexie immediately on user delete action.

**Why it's wrong:** Accidental deletions can't be recovered. Privacy regulation (GDPR) requires eventual deletion, but soft delete lets you delay without risking data loss. History loses context.

**Do this instead:** Soft delete with 30-day trash retention. Preserve history forever. Let user restore within the retention window; auto-purge after 30 days.

### Anti-Pattern 7: Not Handling Concurrent Writes

**What people do:** Assume only one write happens at a time.

**Why it's wrong:** Two tabs adding medicines simultaneously → both call Dexie.add() → rare race conditions. Offline queue replays simultaneously with online writes.

**Do this instead:** Dexie handles concurrency internally (it queues writes). But your optimistic update must account for it: use unique IDs, merge state carefully, don't assume linear order.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **OneDrive (manual sync)** | File I/O APIs (download/upload JSON) + user-initiated import | User manually exports JSON from MedStock app, uploads to OneDrive folder, downloads on other device, imports via app. No OAuth/API integration required. |
| **Browser IndexedDB** | Dexie wrapper abstracts IndexedDB API | Quota management: check `navigator.storage.estimate()`. Most browsers allow 50MB; some allow more. Warn user if approaching limit. |
| **Service Worker API** | Workbox for caching; manual registration for background sync | Service worker lifecycle management; cache versioning; message passing for offline status. |
| **Web App Manifest** | `public/manifest.json` with icons, display mode, orientation | Browsers use manifest for install prompt, home screen icon, splash screen. Must include 192x192 and 512x512 icons. |
| **Clipboard API** | Copy medicine details or share as JSON snippet | Modern secure alternative to reading/writing clipboard. Requires user permission. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Components ↔ Redux Store** | Dispatch actions, subscribe via hooks | useSelector for reading state; useDispatch for actions. Keep selectors memoized to prevent unnecessary re-renders. |
| **Components ↔ Dexie** | useDatabase hook or custom useLiveMedicines() | Never call Dexie directly from components; always go through custom hooks. Decouples component logic from database implementation. |
| **Service Layer ↔ Dexie** | Direct Dexie API calls; promise-based | medicineService.add(), medicineService.search(), etc. Each service method handles its own transaction/error handling. |
| **Service Worker ↔ Main Thread** | postMessage() for offline status, background sync events | SW can't access Redux store; main thread listens to SW events and dispatches actions to update Redux. |
| **UI Components ↔ Forms** | Props + callback functions | Form component is dumb (controlled via props). Parent handles submission, validation, and dispatch to store. |

## Migration and Upgrade Strategy

### Dexie Version Bumping Process

1. **Identify change:** New field, new table, index change, or data transformation required.
2. **Increment version:** `db.version(oldNum + 1).stores({ ... })`
3. **If data changes needed:** Attach `.upgrade()` function to transform data.
4. **Test with old database:** Start with v1 database, run app, verify upgrade succeeds.
5. **Keep old upgrade functions:** Don't remove v1, v2, etc. upgrade code. Users may jump multiple versions.

Example progression:
```typescript
// v1: Initial schema
db.version(1).stores({ medicines: '++id, name' });

// v2: Add category field; set defaults
db.version(2).stores({ medicines: '++id, name, category' }).upgrade(async tx => {
  await tx.table('medicines').toCollection().modify(med => {
    med.category = 'Uncategorized';
  });
});

// v3: Add history table
db.version(3).stores({
  medicines: '++id, name, category',
  history: '++id, medicineId'
});

// v4: Add location index
db.version(4).stores({
  medicines: '++id, name, category, location',
  history: '++id, medicineId'
});
```

## Sources

- [Offline React Apps with IndexedDB](https://www.sparkleweb.in/blog/how_to_build_offline-first_react_apps_using_indexeddb_and_service_workers)
- [Building a PWA for tailors with React and IndexedDB](https://medium.com/@ukchukx/building-a-pwa-for-tailors-with-react-and-indexeddb-bd0f3ef404e1)
- [Build Offline-First PWA with Next.js & IndexedDB](https://www.wellally.tech/blog/build-offline-first-pwa-nextjs-indexeddb)
- [IndexedDB Database in React Apps - The Power of RxDB](https://rxdb.info/articles/react-indexeddb.html)
- [Offline-First PWA Patterns](https://rohitraj.tech/en/notes/pwa-offline-sync)
- [Understanding the basics - Dexie.js Documentation](https://dexie.org/docs/Tutorial/Understanding-the-basics)
- [Dexie Cloud Best Practices](https://dexie.org/cloud/docs/best-practices)
- [Offline-First PWAs: Service Worker Caching Strategies](https://www.magicbell.com/blog/offline-first-pwas-service-worker-caching-strategies)
- [Caching - Progressive web apps | MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching)
- [Strategies for service worker caching | Workbox](https://developer.chrome.com/docs/workbox/caching-strategies-overview)
- [Mastering Local-First Apps](https://medium.com/@Mahdi_ramadhan/mastering-local-first-apps-the-ultimate-guide-to-offline-first-development-with-seamless-cloud-be656167f43f)
- [Customizable conflict resolution for offline-first apps](https://objectbox.io/customizable-conflict-resolution-for-offline-first-apps/)
- [Installation prompt | web.dev](https://web.dev/learn/pwa/installation-prompt)
- [Making PWAs installable - Progressive web apps | MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [Patterns for promoting PWA installation | web.dev](https://web.dev/articles/promote-install)
- [Database Design for Audit Logging](https://www.red-gate.com/blog/database-design-for-audit-logging/)
- [Audit Log - Martin Fowler](https://martinfowler.com/eaaDev/AuditLog.html)
- [How to Design a Schema for Soft Deletes in MySQL](https://oneuptime.com/blog/post/2026-03-31-mysql-design-schema-for-soft-deletes/view)
- [Soft Delete in Database: Strategies, Problems, and Solutions](https://medium.com/@pujanjani30/soft-delete-in-database-strategies-problems-and-solutions-6a91dec9cd0d)
- [How to Implement Optimistic Updates in React](https://www.freecodecamp.org/news/how-to-use-the-optimistic-ui-pattern-with-the-useoptimistic-hook-in-react/)
- [useOptimistic – React](https://react.dev/reference/react/useOptimistic)
- [React Context vs Redux in 2026: practical comparison](https://asoasis.tech/articles/2026-03-25-1456-react-context-vs-redux-comparison-2026/)
- [State Management in 2026: Redux vs Context vs TanStack Query](https://dev.to/iamsaadmehmood/state-management-in-2026-redux-vs-context-vs-tanstack-query-1b0b)

---
*Architecture research for: MedStock (local-first React PWA with IndexedDB)*
*Researched: 2026-06-29*
*Confidence: HIGH — based on web.dev, MDN, official Dexie docs, and battle-tested PWA patterns*
