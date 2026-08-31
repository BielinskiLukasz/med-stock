# Pitfalls Research: Local-First React PWA with IndexedDB

**Domain:** Medicine inventory PWA with local-first storage, manual file sync, CSV/JSON import
**Researched:** 2026-06-29
**Confidence:** HIGH

---

## Critical Pitfalls

### Pitfall 1: Seven-Day Auto-Eviction of IndexedDB on iOS Safari

**What goes wrong:**
User stores medicine inventory in IndexedDB. If the user doesn't open the PWA for seven days, iOS Safari silently deletes all stored data without warning—medicines, history, settings, everything. User reopens app to find an empty inventory.

**Why it happens:**
iOS Safari (since iOS 13.4) implements Intelligent Tracking Prevention (ITP) which treats all script-writable storage (IndexedDB, LocalStorage, Cache API) as potentially tracking cookies. After seven days of no user interaction (click/tap), Safari aggressively evicts ALL data from that origin at once—not incrementally, not with warning, but complete deletion.

**How to avoid:**
1. **Persistence API**: Before v1 launch, request persistent storage via `navigator.storage.persist()`. Persistent storage is exempt from the seven-day rule. Check `navigator.storage.persisted()` at startup; if denied, warn user about seven-day limit.
2. **Recovery mechanism**: On app startup, detect if data disappeared (check expected record count vs. actual). If zero records exist when user last saw data, show recovery prompt: "Your data may have been cleared. Import a backup?"
3. **Frequent backups**: Export to OneDrive at least weekly. Show export reminder if user hasn't exported in 5 days.
4. **Document the limitation**: In help text, clearly state "On iOS Safari, unused PWAs lose data after 7 days. Export regularly for safety."

**Warning signs:**
- User reports "all my medicines disappeared" after not opening app for a week
- Test: Open app on iOS Safari, add 5 medicines, close app, wait 7+ days, reopen → data is gone
- Monitor analytics for spikes in "empty inventory" on iOS

**Phase to address:**
Phase 1 (PWA Foundation) - Implement persistence API request and startup recovery check before launch to production. This is launch-blocking on iOS.

---

### Pitfall 2: IndexedDB Storage Quota Exceeded Without Warning

**What goes wrong:**
User adds medicines over months, accumulating 500+ records with history logs. Suddenly, new add/edit operations fail silently or throw opaque quota errors. User thinks the app is broken; data mutation operations become unreliable.

**Why it happens:**
IndexedDB quota varies by browser but is tied to device free disk space. On iOS Safari, quota is ~1 GB per origin initially, but can be only ~50 MB for cache storage and ~60% of free disk on home screen (Safari 17+). On Android, it's higher but still finite. Developers often don't check `navigator.storage.estimate()` and hit the limit unexpectedly, especially with history logging.

**How to avoid:**
1. **Implement quota monitoring**: In Phase 2, add code that calls `navigator.storage.estimate()` once per session startup. If usage > 80% of quota, show warning: "Storage is {X}% full. Export backup and consider deleting old history."
2. **History pruning strategy**: For each medicine record, only keep last 10 history entries. Periodically (monthly cleanup) delete history older than 90 days.
3. **Optimize storage**: Don't store serialized DateTimes as strings; use numeric timestamps. Compress history logs (only store deltas, not full snapshots).
4. **Graceful degradation**: If quota is exceeded, allow read-only mode and show user error "Storage full. Export backup to free space." Make export from read-only mode prominent.
5. **Test under quota pressure**: In QA, simulate near-full quota using quota API to verify app behavior.

**Warning signs:**
- Add/edit operations throw QuotaExceededError or fail silently
- History logs grow unbounded with duplicate entries
- iOS users report "can't add more medicines" message on home screen PWA
- Test: Add 1000+ records with full history; estimate() shows > 90% quota usage

**Phase to address:**
Phase 2 (Core Data Management) - Implement quota monitoring, history pruning, and graceful degradation. Must be in place before supporting large inventories.

---

### Pitfall 3: Stale Service Worker Prevents App Updates

**What goes wrong:**
Developer releases v1.1 with bug fixes. Users open app but keep seeing v1.0 interface and bugs. Some users manually refresh; others see an update prompt that requires closing/reopening the app. Users report inconsistency ("why did my app fix itself after I closed it?").

**Why it happens:**
Service workers are designed to cache aggressively for offline support. A typical caching strategy saves the entire app shell (HTML, JS, CSS) in the cache. When a new version deploys, old service workers keep serving stale assets. Browsers only notify the app of updates via the `oncontrollerchange` or `onupdatefound` event, but developers often don't wire UI to show this, so users don't know an update is available.

**How to avoid:**
1. **Implement update detection**: In Phase 1 (PWA Foundation), register a service worker with an update listener. When `registration.onupdatefound` fires, set a flag in state.
2. **Show update prompt**: Display a toast: "App update available. Tap Refresh to get the latest version." Do NOT auto-update.
3. **Handle user action**: On user tap, call `skipWaiting()` on the waiting service worker, then reload the page with `window.location.reload()` to activate new version.
4. **Cache busting for assets**: Use a build-time hash in filenames (e.g., `app-v1a2b3c.js`) so new versions bypass old caches.
5. **Test on multiple browsers**: Service worker behavior differs in Safari (no automatic checks) vs. Chrome (checks every 24h). Test updates on both.

**Warning signs:**
- Users report "I still see the old version after you said you fixed it"
- Refresh-sensitive bugs: bug disappears after hard refresh (ctrl+shift+r)
- Analytics show same app version across multiple app sessions hours apart
- Test: Deploy new code; open app in two tabs; one tab sees old version, other sees new

**Phase to address:**
Phase 1 (PWA Foundation) - Service worker setup and update notification must be in place before v1.0 launch.

---

### Pitfall 4: Storage Isolation Between Safari and Standalone PWA on iOS

**What goes wrong:**
User syncs medicines to OneDrive while browsing in Safari. They add the PWA to home screen and tap it, expecting to see the same data. But standalone PWA shows zero medicines—all stored data from Safari is inaccessible. User thinks data is lost.

**Why it happens:**
iOS Safari isolates storage between the browser context and the home screen "standalone" context. Data stored via IndexedDB in Safari (user.example.com in Safari) is not accessible to the same domain when opened as a standalone PWA (user.example.com as home screen app). They have separate cookie jars, separate IndexedDB databases, and separate cache storage.

**How to avoid:**
1. **Document the limitation**: In Phase 1, add help text: "Adding to home screen creates a separate app instance. Use the 'Sync with OneDrive' export/import flow to share data between Safari and home screen versions."
2. **Make sync workflow prominent**: In Phase 3 (Sync), make manual export/import as easy as one tap. Show it immediately on first launch: "First time? Import backup from OneDrive or start fresh."
3. **Detect context and inform**: On startup, detect if the PWA is running as standalone (`display-mode: standalone` via media query or `navigator.standalone` on iOS). If yes, and data is empty, show prompt: "This is a standalone app. To sync data from Safari or another device, tap 'Import from OneDrive'."
4. **No auto-sync**: Do not attempt to auto-sync between Safari and standalone. Only manual export/import via OneDrive.

**Warning signs:**
- iOS user reports "data disappeared when I added app to home screen"
- Different data shown in Safari vs. home screen PWA on same device
- User taps "Add to Home Screen" and expects seamless continuation

**Phase to address:**
Phase 1 (PWA Foundation) - Must document and communicate this limitation before iOS launch.

---

### Pitfall 5: JSON Import Silently Corrupts Data via Schema Mismatch

**What goes wrong:**
User exports backup from v1.0 (schema: `{ id, name, category, location, expiryDate, openedDate, quantity }`). App updates to v1.1 with new field `periodAfterOpening`. User imports old backup. App creates medicines with `periodAfterOpening` as `undefined`. Validity calculations break; "expired" medicines show as "open" because `undefined + 0 = NaN`.

**Why it happens:**
JSON import is a free-form operation: read file, `JSON.parse()`, iterate records, insert into IndexedDB. No validation. If imported schema is missing fields, JavaScript's permissive object handling silently fills missing keys with `undefined`, and downstream code doesn't guard against it.

**How to avoid:**
1. **Add version metadata to exports**: In Phase 3 (Sync), every exported JSON file includes `{ version: "1.1", exportedAt: "2026-06-29T...", medicines: [...] }`.
2. **Validate on import**: Before inserting any record, validate against current schema using a simple function:
   ```javascript
   const validateMedicine = (record, schema) => {
     const required = ['id', 'name', 'expiryDate'];
     for (let field of required) {
       if (!(field in record)) throw new Error(`Missing required field: ${field}`);
     }
     // Provide defaults for new fields if not present
     if (!('periodAfterOpening' in record)) record.periodAfterOpening = null;
     return record;
   };
   ```
3. **Show import preview**: Before committing import, display a sample of 3-5 records to the user. Show any warnings: "3 records missing 'periodAfterOpening'. Default to no limit."
4. **Abort on critical errors**: If > 10% of records fail validation, stop import and show detailed error report instead of partial import.
5. **Schema versioning**: In Phase 3, add migration logic for known schema versions:
   ```javascript
   if (importedFile.version === "1.0") {
     medicines = migrateFrom_v1_0(medicines); // add defaults for v1.1 fields
   }
   ```

**Warning signs:**
- Post-import, some medicines show NaN or undefined in calculated fields
- Validity status displays "Unknown" or crashes with "Cannot read property 'getTime' of undefined"
- User imports old backup, then report "medicines lost their expiry dates"
- Test: Export from v1.0, import into v1.1; verify all calculated fields remain accurate

**Phase to address:**
Phase 3 (Sync with OneDrive) - Schema validation and migration logic must be in place before users can exchange backups between versions.

---

### Pitfall 6: Expiry Date Calculations Break Across Timezones

**What goes wrong:**
Medicine expires on "2026-07-15" (user's local date). User stores it as `expiryDate: new Date("2026-07-15").getTime()` (midnight UTC, which is 8 hours earlier in PST). Next day, user is in a different timezone. The calculated expiry is wrong; "expires July 15" becomes "already expired July 14" because the UTC timestamp is interpreted in a different offset.

**Why it happens:**
Timestamps (milliseconds since epoch) are absolute moments in time and are timezone-agnostic. But **expiry dates are calendar dates**, not moments. "Expires July 15" means "at the end of July 15 local time", which is a different moment depending on the user's timezone. Storing expiry as `new Date("2026-07-15").getTime()` loses the "local midnight" context; it becomes an absolute UTC moment that drifts when timezone changes.

**How to avoid:**
1. **Store dates without time**: In Phase 1 (PWA Foundation), store expiry dates as `YYYY-MM-DD` strings, not timestamps. Example: `expiryDate: "2026-07-15"`.
2. **Compare locally**: When calculating "is expired today?", compare stored date string to `new Date().toISOString().split('T')[0]`, not timestamps.
3. **Opened date handling**: Store `openedDate` the same way: string `YYYY-MM-DD`, not timestamp.
4. **Export with ISO strings**: In Phase 3 (Sync), export dates as ISO strings (`2026-07-15`), not Unix timestamps, so reimport works in any timezone.
5. **Validation**: Unit test expiry calculation by simulating a date-crossing at midnight and timezone changes:
   ```javascript
   // Test: At 23:50 PST on July 14, medicine expires "July 15" → NOT expired
   // At 00:10 UTC on July 15, same medicine in UTC timezone → still NOT expired
   ```

**Warning signs:**
- Off-by-one errors in expiry calculations depending on timezone
- Medicine shows as "Expired" in one timezone but "Valid" in another (same device, different time)
- User reports "medicine expires tomorrow but app says it expired yesterday"
- Test: Create medicine with `expiryDate: "2026-07-15"`, then change system timezone; recalculate expiry

**Phase to address:**
Phase 1 (PWA Foundation) - Date storage and comparison logic must be established early and tested thoroughly.

---

### Pitfall 7: CSV Import Loses Leading Zeros and Special Characters

**What goes wrong:**
User imports CSV with medicine codes: `001, 002, 00102 (special batch)`. After import, codes become `1, 2, 102`. Later, user searches for "00102" but the app finds nothing because it's stored as "102". Or: CSV contains medicine name with special chars "Ibuprofen-C (500mg)"; import truncates or mangles it.

**Why it happens:**
CSV import often applies silent type coercion. A column that looks numeric gets parsed as a number, losing leading zeros. Special characters in quotes get mishandled if delimiter/quoting is detected wrong. Encoding issues (UTF-8 BOM, Windows-1252) produce mojibake (garbled characters).

**How to avoid:**
1. **Detect encoding before parsing**: In Phase 2 (CSV Import), before parsing CSV, detect file encoding (UTF-8, Windows-1252, ISO-8859-1). Strip UTF-8 BOM if present. Example: `iconv-lite` library or built-in `TextDecoder`.
2. **Detect delimiter**: Show user a preview of detected delimiter (comma, semicolon, tab). Let them correct it. Example: "Detected comma as delimiter. Correct?" with preview of first 3 rows.
3. **Preserve types as strings**: During CSV parsing, don't auto-coerce. Keep all values as strings unless explicitly mapped to numbers/dates. Show detected column types: "Column 1: Text (001, 002, 00102)" vs. "Column 2: Number (123, 456)".
4. **Show import preview**: Display 5 sample records before commit. User sees: "Code column will be stored as text: 001, 002, 00102. Correct?" If user sees codes as numbers (1, 2, 102), abort and ask for delimiter fix.
5. **Handle quoted fields correctly**: Use an RFC 4180-compliant CSV parser (e.g., `papaparse` library). Test with embedded commas: `"Ibuprofen, 500mg"` should import as single value, not split.
6. **Required field validation**: For medicine name, category, location: reject rows where these are blank. Show row-level errors: "Row 5: missing medicine name. Skipping."

**Warning signs:**
- Post-import, medicine codes show as different numbers than CSV
- Medicine names are truncated or contain garbage characters
- Search for "00102" finds nothing (stored as "102")
- Test: Import CSV with `001, 002` codes; verify stored as strings; search for "001" works

**Phase to address:**
Phase 2 (CSV Import) - Encoding detection, delimiter detection, and preview must be implemented before CSV import is available to users.

---

### Pitfall 8: Full-Text Search on 1000+ Records Becomes Unusable

**What goes wrong:**
User has 1500 medicine records. They type "ibu" in the search box expecting instant results. Instead, app freezes for 1-2 seconds because the search is iterating all 1500 records in JavaScript, comparing each medicine name character-by-character.

**Why it happens:**
IndexedDB doesn't natively support full-text search. The naive approach is: on each keystroke, `db.medicines.getAll()`, then filter in JavaScript with `.filter(m => m.name.includes(query))`. At 1000+ records, this becomes a bottleneck; each keystroke triggers a full table scan in JavaScript.

**How to avoid:**
1. **Index on name prefix**: In Phase 2 (Core Data), add an IndexedDB index on the `name` field. Use case-insensitive search by normalizing: store search tokens as lowercase. Then use `.openCursor(IDBKeyRange.bound("ibu", "ibv"))` for prefix matching (lexicographic range).
2. **Multi-entry indexes for category**: For filtering by category, add a compound index on `[category, status]` so filtering is O(log n) instead of O(n).
3. **Debounce search input**: Don't query on every keystroke. Debounce by 300ms. Show spinner while searching.
4. **Lazy load results**: Return first 50 results immediately. If user wants more, show "Load more" button.
5. **Tokenized search optional**: For advanced search (e.g., "ibuprofen pain relief"), tokenize the query, store index of tokens with each medicine, and search the token index instead of full names. This is complex and optional for MVP but recommended for Phase 3.
6. **Test performance**: In QA, load 1000+ records and test search performance. Verify search completes < 200ms for 50 results.

**Warning signs:**
- App freezes for 1+ second when user types in search box
- Search is noticeable slow on Android devices with lower RAM
- First character typed is instant, but by 4th character, noticeable lag
- Test: Add 1000 medicines, type "ibu", verify search latency < 200ms

**Phase to address:**
Phase 2 (Core Data) - Implement indexed search before supporting large inventories. Can defer tokenized search to Phase 3.

---

### Pitfall 9: OneDrive File Picker Doesn't Open in PWA Context

**What goes wrong:**
User taps "Sync with OneDrive" button in PWA. OneDrive picker is supposed to appear. Instead, nothing happens, or a loading spinner appears indefinitely and never resolves.

**Why it happens:**
OneDrive's JavaScript File Picker (v7.2+) has reported issues loading in PWA context, particularly in standalone mode. The picker may fail to initialize, timeout, or not detect the PWA's origin correctly for the OAuth redirect. Additionally, the file picker requires a `redirect_uri` parameter, which must match exactly with the PWA's URL. If the PWA is accessed via different URLs (with/without www, with/without trailing slash), the redirect fails.

**How to avoid:**
1. **Fallback to manual export/import**: In Phase 3 (Sync), don't rely solely on OneDrive File Picker. Implement the simpler flow: User taps "Export", saves JSON to device Downloads. User taps "Import", picks JSON from device. This works in all contexts (Safari, standalone, Chrome).
2. **If using File Picker, test extensively**: If using OneDrive picker, test in all contexts: PWA in Chrome, PWA on Android, standalone PWA on iOS. Have a fallback button: "Use file instead" → shows device file picker.
3. **Validate redirect_uri**: Ensure the PWA's canonical URL is registered with OneDrive app. Handle both `https://example.com` and `https://example.com/` (with/without trailing slash).
4. **Error handling**: If File Picker fails to load after 5 seconds, show error: "OneDrive picker failed. Use 'Export/Import file' instead." Provide direct link to manual flow.
5. **OAuth scopes**: Request minimal scope: `Files.Read` only (not write). Show the user what permissions are being requested.

**Warning signs:**
- User taps OneDrive sync button, nothing happens
- OneDrive picker shows loading spinner indefinitely
- PWA works on desktop but sync fails on mobile
- iOS user has to use Safari instead of home screen app to sync
- Test: Tap OneDrive picker button on PWA in Safari, Chrome, Android, iOS; verify picker loads and authentication works

**Phase to address:**
Phase 3 (Sync with OneDrive) - Implement robust fallback (device file picker) before OneDrive-only sync. Test picker on all platforms before launch.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| **Store all history entries without pruning** | Fast implementation; every change is recorded | Quota exceeded after months; export/import becomes slow | Only in early MVP before shipping to users |
| **Parse dates as JavaScript Date objects** | Easy to work with initially | Timezone bugs; expiry calculations wrong in different timezones | Never—use ISO string format from day 1 |
| **Skip CSV validation; assume well-formed files** | Faster import for "normal" CSVs | Silent data corruption; lost leading zeros; garbled special chars | Never—validation is critical for user trust |
| **Use naive substring search on all records** | Simple implementation | App freezes at 1000+ records | Only in very early prototype; phase out before MVP |
| **No service worker update prompt; silent auto-update** | Users always have latest version | Users don't know when breaking changes happen; confusion | Never—user agency on updates is critical for PWA |
| **Ignore iOS 7-day storage eviction** | Fewer edge cases to handle | User data silently disappears; support burden | Never—iOS is a major platform; must handle this |
| **Import JSON without schema validation** | Quick import implementation | Schema mismatch silently corrupts data; calculations break | Never—validation is essential for data integrity |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **OneDrive File Picker** | Assume picker works in all PWA contexts (Safari, standalone) | Test picker on Safari, Chrome, Android, iOS standalone. Have fallback to device file picker if it fails. |
| **IndexedDB quota** | Don't check quota; assume it's unlimited | Call `navigator.storage.estimate()` at startup. Show warning if > 80% full. Implement graceful degradation to read-only. |
| **Service Worker cache** | Cache entire app shell aggressively; don't notify users of updates | Implement update detection and show prompt. Use cache-busting file hashes. Test on Safari and Chrome separately. |
| **iOS storage isolation** | Try to auto-sync data between Safari and standalone PWA | Accept isolation limitation. Use manual export/import via OneDrive as the sync mechanism. Document clearly. |
| **CSV import** | Assume UTF-8 encoding and comma delimiter | Detect encoding (strip BOM), detect delimiter, show preview to user before import. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Unindexed full-text search** | App freezes when typing in search box; latency increases with record count | Index on name field; use range queries (`IDBKeyRange.bound()`) instead of full scans | At 500+ records; noticeable at 1000+ |
| **Unbounded history logging** | Export/import slow; quota warnings after months of use | Keep only last 10 history entries per medicine; prune entries older than 90 days | At ~10k history entries; impacts quota at 500+ medicines |
| **Rendering all results at once** | List view slow; scroll janky on low-end devices | Paginate results; show first 50, provide "Load more" button | At 200+ records on screen; critical at 1000+ |
| **Synchronous CSV parsing** | App freezes while parsing large CSV (1000+ rows) | Parse CSV in chunks or Web Worker; show progress bar | At 1000+ rows; consider splitting into smaller imports |
| **JSON.stringify() on large exports** | Export button hangs for seconds on slow devices | Export in chunks; show progress; consider compression | At 5000+ medicines with full history; noticeable at 2000+ |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **No input validation on CSV import** | Malicious CSV with very long strings or malformed dates could cause parsing errors or buffer issues | Validate every field: max length, format, type. Reject rows with invalid data. Test with adversarial CSVs. |
| **Storing sensitive data unencrypted in IndexedDB** | If device is compromised, attacker sees full medicine inventory | IndexedDB data is not encrypted; don't store information beyond medicine names, quantities, dates. If privacy is critical, encrypt before storage (adds complexity; not recommended for MVP). |
| **Trusting JSON import without signature** | Malicious actor could create fake backup with wrong medicines/expiry dates, user imports it | For MVP, no signatures needed (local device, trusted OneDrive). If multi-user sync is added, implement JSON signing (e.g., HMAC). |
| **No rate limiting on sync frequency** | If OneDrive sync is automated, excessive requests could trigger rate limiting or quota exhaustion | Manual sync only for MVP. If auto-sync added, rate limit to once per hour. Test rate limit scenarios. |
| **Exposing PII in error messages** | Error messages during import could leak medicine names or user patterns to console logs | Sanitize error messages; don't include full record data in logs. Log only field name + error type. |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **Silent data loss on iOS after 7 days** | User loses all medicines without warning; data appears "gone" | Show persistent storage prompt on first launch. Provide export reminder. If data is empty on startup, offer recovery: "Import from backup?" |
| **Service worker update without user notice** | Users don't know app has been updated; confusion if they refresh and see different UI | Show update prompt: "App update available. Refresh?" Let user choose when to update. |
| **CSV import with silent type coercion** | User thinks codes imported correctly, but "001" became "1"; search later fails | Show preview of first 5 rows before import. Display detected column types (text vs. number). Let user confirm. |
| **Expiry calculations that shift with timezone** | User sees medicine as "expired" in one timezone but "valid" in another | Use calendar dates (YYYY-MM-DD strings), not timestamps. Test timezone changes. |
| **Search freezes at 1000+ records** | User perceives app as broken/slow when searching large inventory | Index search; debounce input; show spinner with latency < 200ms. Load first 50 results, provide "Load more". |
| **OneDrive picker fails silently** | User taps sync button, nothing happens; no error, just silence | Show error if picker fails after 5 seconds. Provide fallback: "Use device file instead". |
| **No explanation of storage limits** | User hits quota limit and doesn't understand why adds/edits fail | Show quota warning at 80%. Explain "Storage full. Export backup to free space." Make export one tap away. |

---

## "Looks Done But Isn't" Checklist

- [ ] **IndexedDB Quota Handling:** User can see storage usage percentage; app shows warning at 80%; graceful read-only fallback if full. Verify: `navigator.storage.estimate()` works, UI updates, quota-full scenario tested.

- [ ] **iOS 7-Day Eviction:** App requests persistent storage; startup checks if data mysteriously disappeared; recovery prompt offers import from backup. Verify: Wait 7 days without opening on iOS Safari; data persists (or user sees recovery prompt, not blank app).

- [ ] **Service Worker Updates:** Update detection implemented; prompt shown when new version available; skipWaiting() + reload called on user action. Verify: Deploy new code; existing users see update prompt within 1 hour; prompt works without breaking app state.

- [ ] **CSV Import Validation:** All required fields validated; encoding detected; delimiter previewed; sample rows shown before import; errors listed with row numbers. Verify: Import CSV with UTF-8 BOM, semicolon delimiter, missing columns, special characters; preview is accurate; import is correct or rejected.

- [ ] **JSON Import Schema Check:** Exported JSON includes version; import validates against current schema; defaults provided for new fields; migration logic for known old versions. Verify: Export from v1.0, import into v1.1; all calculated fields (validity, etc.) are correct.

- [ ] **Date/Time Storage:** All dates stored as YYYY-MM-DD strings (not timestamps); expiry comparison uses local date (not UTC); export uses ISO strings. Verify: Create medicine on July 14 at 23:50 PST with expiry "July 15"; at July 15 UTC (which is July 14 PST), medicine shows "not expired"; export/import preserves dates across timezone change.

- [ ] **Full-Text Search Performance:** Search indexed on medicine name; latency < 200ms for 50 results at 1000+ records; results paginated. Verify: Create 1000+ medicines; type in search box; measure latency; no freezing observed.

- [ ] **OneDrive Sync Fallback:** File Picker tested on all platforms (Safari, Chrome, Android, iOS); fallback to device file picker if picker fails; error messages clear. Verify: Test sync button on PWA in 4 contexts; picker loads in all; fallback works if picker disabled.

- [ ] **Local Storage Isolation on iOS:** User can't auto-sync between Safari and standalone PWA; doc clearly explains limitation; sync workflow via OneDrive export/import is easy. Verify: Open PWA in Safari, add medicine, close; open standalone PWA from home screen, medicine not there; sync button works (imports from OneDrive).

- [ ] **History Pruning:** Medicines keep last 10 history entries; old history pruned monthly; quota not exceeded. Verify: Add medicine, edit 50 times; history count stays ≤ 10; after 3 months, old entries gone; quota estimate stable.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Data silently lost to iOS 7-day eviction** | MEDIUM | User must reimport from OneDrive backup. If no backup exists, data is irrecoverable. Recommend implementing OneDrive automated export (Phase 3+). |
| **Quota exceeded; can't add medicines** | LOW | User exports to backup, then clears app data and reimports. Add feature to delete old history entries (one-tap cleanup). |
| **Schema mismatch after import; calculated fields are wrong** | MEDIUM | If detected early (validation), abort import and show error; user fixes CSV or downgrades app. If not detected, user must reimport from previous backup. |
| **Timezone-related expiry miscalculation** | MEDIUM | Requires code fix; user must close and reopen app after timezone change (or they verify expiry visually). Recommend testing timezone changes in Phase 2. |
| **Search performance degrades; app freezes** | MEDIUM | Add indexes retroactively (indexed search can be added without data migration). User perceives improvement on next launch. |
| **Service worker doesn't update; users on old version** | HIGH | Manually instruct users to hard-refresh (Ctrl+Shift+R) or clear browser cache. Prevent by implementing prompt + skipWaiting in Phase 1. |
| **CSV import loses leading zeros; codes wrong** | HIGH | User must export, manually fix CSV codes in spreadsheet, reimport. Prevent by adding preview validation in Phase 2. |
| **OneDrive picker broken on PWA; can't sync** | MEDIUM | User falls back to manual export/import (device file picker). Fix requires debugging OneDrive API or waiting for new picker version. Recommend fallback in Phase 3. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Seven-Day Auto-Eviction (iOS) | Phase 1 (PWA Foundation) | Request persistent storage; test 7+ days without opening on iOS Safari; data persists or recovery prompt works. |
| IndexedDB Quota Exceeded | Phase 2 (Core Data Management) | Call `navigator.storage.estimate()` at startup; show warning at 80%; read-only fallback if exceeded. Test by filling quota. |
| Stale Service Worker | Phase 1 (PWA Foundation) | Deploy new code; existing users see update prompt; skipWaiting() + reload works without breaking state. |
| Storage Isolation (iOS Safari) | Phase 1 (PWA Foundation) | Document limitation; add help text; provide OneDrive sync as workaround. |
| JSON Import Schema Mismatch | Phase 3 (Sync with OneDrive) | Export v1.0 JSON, import into v1.1; all calculated fields are correct; migration logic handles missing fields. |
| Expiry Date Timezone Bugs | Phase 1 (PWA Foundation) | Store dates as YYYY-MM-DD strings; test timezone changes; verify expiry calculations consistent. |
| CSV Import Loses Leading Zeros | Phase 2 (CSV Import) | Import CSV with special characters, leading zeros, and encoding issues; verify data stored correctly; preview accurate. |
| Full-Text Search Performance | Phase 2 (Core Data Management) | Create 1000+ medicines; verify search latency < 200ms; no freezing observed. |
| OneDrive Picker Fails in PWA | Phase 3 (Sync with OneDrive) | Test picker on all platforms; implement fallback to device file picker; error messages clear. |
| History Unbounded Growth | Phase 2 (Core Data Management) | Keep last 10 entries per medicine; prune monthly; verify quota stable at 1000+ medicines. |

---

## Sources

- [Storage quotas and eviction criteria - MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [IndexedDB Max Storage Size Limit - RxDB](https://rxdb.info/articles/indexeddb-max-storage-limit.html)
- [Updates to Storage Policy - WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [When 'Just Refresh' Doesn't Work: Taming PWA Cache Behavior - Infinity Interactive](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior)
- [Update - web.dev](https://web.dev/learn/pwa/update)
- [PWA iOS Limitations and Safari Support 2026 - MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Current Progressive Web App Limitations To iOS Users - Tigren](https://www.tigren.com/blog/progressive-web-app-limitations/)
- [How do you handle schema migrations in IndexedDB - MindStick](https://www.mindstick.com/interview/34320/how-do-you-handle-schema-migrations-in-indexeddb-e-g-adding-a-new-field-or-object-store)
- [Handling IndexedDB Upgrade Version Conflict - DEV Community](https://dev.to/ivandotv/handling-indexeddb-upgrade-version-conflict-368a)
- [Implementing full-text search in IndexedDB](https://colinchjs.github.io/2023-10-01/18-36-40-981329-implementing-full-text-search-in-indexeddb/)
- [CSV Import Errors and How to Fix Them 2026 - FileFeed](https://www.filefeed.io/blog/common-csv-import-errors)
- [The Ultimate Guide to CSV File Validation - Disbug Blog](https://disbug.io/en/blog/ultimate-guide-csv-file-validation-data-quality-systems/)
- [JSON Schema: Integrity Checking for NoSQL Data - Towards Data Science](https://towardsdatascience.com/json-schema-integrity-checking-for-nosql-data-b1255f5ea17d)
- [How to Handle Date and Time Correctly to Avoid Timezone Bugs - DEV Community](https://dev.to/kcsujeet/how-to-handle-date-and-time-correctly-to-avoid-timezone-bugs-4o03)
- [Timezone Handling in Web Applications - Medium](https://medium.com/@ashour521/timezone-handling-in-web-applications-the-problem-most-systems-eventually-face-a4eec11f7043)
- [React patterns to avoid common pitfalls in local state management - LogRocket Blog](https://blog.logrocket.com/react-patterns-common-pitfalls-local-state-management/)
- [How to avoid tricky async state manager pitfalls in React - Evil Martians](https://evilmartians.com/chronicles/how-to-avoid-tricky-async-state-manager-pitfalls-react)
- [OneDrive File Picker - Microsoft Learn](https://learn.microsoft.com/en-us/onedrive/developer/controls/file-pickers/?view=odsp-graph-online)
- [OneDrive File Picker v7.2 doesn't finish to load in PWA - GitHub Issue](https://github.com/OneDrive/onedrive-api-docs/issues/896)

---

*Pitfalls research for: Local-first React PWA medicine inventory with IndexedDB, CSV/JSON import, OneDrive sync*
*Researched: 2026-06-29*
*Confidence: HIGH across all findings; based on official browser API docs, user reports, and community best practices*
