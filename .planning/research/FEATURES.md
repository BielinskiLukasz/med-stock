# Feature Research

**Domain:** Household Medicine Inventory PWA
**Researched:** 2026-06-29
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or abandoned.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Search medicines by name** | Core use case: "Do I have this?" must be answerable in seconds. Every inventory app has this. | LOW | Fast substring matching essential; should support partial names, alternate names |
| **Add medicine with core metadata** | Users need to log what they have: name, quantity, location, expiry date. This is inventory 101. | MEDIUM | Minimal required fields: name, expiry, quantity, location. Optional: notes, category, opened date |
| **View expiry status at a glance** | The entire value prop hinges on knowing "is this still safe?" without opening each record. | MEDIUM | Dashboard shows: total count, expired count, expiring-soon count (e.g., 30 days). Visual indicators (green/yellow/red) |
| **Edit and delete medicines** | Users make mistakes, medicines run out, data changes. No working app prevents this. | LOW | Support soft delete (trash bin) to prevent accidents; hard delete if needed |
| **Filter and sort the list** | With 100+ items, browsing is not viable. Users filter by category, location, or status. | MEDIUM | Filters: category, location, status (Active/Expired/Opened). Sorts: by name, expiry date, category |
| **Offline-first PWA installation** | Progressive Web App must work fully offline and be installable on mobile/desktop. Requirement from PROJECT.md | HIGH | Service worker, IndexedDB, manifest.json. Works without internet. Installable on Android, Windows, macOS, Linux (not iOS via Safari) |
| **Manual sync between devices** | Family members need shared inventory without a backend. OneDrive sync pattern from PROJECT.md | HIGH | Export to JSON, import from JSON. Manual "Sync Now" button. Conflict handling via last-write-wins or user choice |
| **Trash bin for soft delete** | Prevents accidental permanent data loss; standard in modern apps | LOW | Separate trash view; restore or permanently delete items. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable and aligned with core value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Batch medicine creation** | Pharmacy visits produce 5+ new items. Adding one at a time kills momentum. Batch creation closes the loop in one flow. | MEDIUM | "Add multiple packages of the same medicine" — user enters name, category, location once, then quantity and expiry for each. Saves 70% of keystrokes vs. per-item entry. |
| **Period-after-opening tracking** | Medicines like eye drops have "use within X days of opening" — critical safety info that expiry date alone doesn't capture. Few apps do this well. | MEDIUM | Field: "opened date" + "expires N days after opening". Auto-calculates validity. Example: opened 2 weeks ago, safe for 30 days → 14 days remaining. |
| **Location tagging** | Medicine is scattered: bathroom cabinet, bedroom nightstand, kitchen drawer. Search alone doesn't answer "where is it?" Spatial awareness differentiates. | LOW | Predefined + custom locations. Filter by location. Display location on each item card. |
| **Predefined + custom categories** | OTC vs prescription vs supplements vs topical — helps organize chaos. Customizable so users can define their own taxonomy. | LOW | Default: Pain Relief, Cold/Flu, Digestive, Topical, Supplements, Prescription. Allow user to add/remove/rename. |
| **CSV import for initial inventory** | Users have a chaos of medicines. Dumping them all one-by-one takes hours. CSV bulk import lets them bootstrap with data from a spreadsheet. | MEDIUM | Column mapping UI. Error handling for malformed rows. Feedback on import success/failure. |
| **Activity/history log** | "When did I add this?" and "What changed?" are valuable for auditing and understanding medicine lifecycle. Builds trust. | MEDIUM | Timestamp every change: created, edited, deleted, restored. Optional: user attribution (if multi-user added later). Display in a timeline or list. |
| **Expiry status with granularity** | Not just "expired/not expired" — show: Active (safe), Opened (counts down), Expired (gone), Used Up (consumed), Disposed (manual). | MEDIUM | Distinct statuses help users understand what happened to each item. Visual indicators (color/icon). Transitions based on rules (expiry date, opened date, opened period). |
| **Custom in-app install prompt** | Safari on iOS doesn't support "Add to Home Screen," but a custom UI prompt can guide users on Android/Chrome, after they've engaged (e.g., after first search). | LOW | Trigger after first successful search or after 2nd visit. Avoid disrupting critical flows. Position in menu or at bottom after action completion. |
| **Dashboard with at-a-glance metrics** | Users want a quick summary: "I have 3 expired medicines, 5 expiring soon, 2 opened past their safe period." Glanceable cards beat buried charts. | MEDIUM | Top 3-4 metrics: total count, expired count, expiring-soon count (configurable threshold), opened-past-safe-period count. Recently added list. |

### Anti-Features (Deliberately NOT Building)

Features that sound good but are problematic, wasteful, or misaligned with core value.

| Feature | Why Requested | Why Problematic | Alternative (What to Do Instead) |
|---------|---------------|-----------------|----------------------------------|
| **Medication reminders/adherence tracking** | "The app should remind me to take this medicine." Sounds natural. | Wrong product category. MedStock is *inventory*, not *scheduling*. Adherence tracking is a separate concern with different UX, regulatory, and liability implications. Feature creep. | Explicitly defer to v2 or a separate product. Core value is "do I have this" and "is it safe," not "did I take it today." |
| **Drug interaction checking** | "Tell me if these medicines interact." Tempting for safety. | Requires maintaining a medical database (costly, liability-heavy). Risks harm if data is stale or incorrect. Apple's Health Kit tried this; it's a minefield. | Out of scope. Users consult their pharmacist or vet for interactions. We're not a medical reference. |
| **Barcode scanning** | "Scan the package to add it instantly." Very fast in theory. | Barcode on the package doesn't encode expiry date (it's printed, not encoded, for most OTC medicines). OCR for expiry is complex, error-prone, and deferred per PROJECT.md. Adds camera permission friction. | Defer to v2. For v1, manual entry is acceptable and avoids complexity. Quick-add (batch entry + custom shortcuts) addresses the speed need. |
| **Photo capture and storage** | "Snap a photo of each medicine for visual reference." Sounds helpful. | Adds camera permission friction, storage complexity, and sync burden (photos are heavy). Doesn't change core value: you still need to read the label to know what it is and when it expires. | Defer to v2 per PROJECT.md. Core value doesn't require photos. |
| **Automatic background sync** | "Sync should just happen when online." Feels modern. | Adds complexity (background workers, conflict resolution, sync queues). Manual sync ("Sync Now" button) is sufficient for household use and gives users control and transparency. | Keep manual sync for v1. If users forget, they notice quickly. Add a visual indicator (e.g., "Last synced 3 hours ago") to encourage periodic sync. |
| **Multiple user profiles** | "Mom and Dad should have their own logins." Sounds collaborative. | Adds auth complexity, per-user data partitioning, and permission logic. Current model (shared inventory on a device) is simpler and aligns with "one shared medicine cabinet per household." | Defer. For v1, each device has one shared inventory. If multi-user is added in v2, it's via device sharing or account-based sync, not per-device profiles. |
| **Medicine recommendations / "You might need"** | "The app should suggest what to buy." Tempting for engagement. | Scope creep. Requires medical knowledge or third-party data. Risks harm if suggestion is inappropriate. Moves us toward "health advisor" territory. | Out of scope. MedStock tracks what you have, not what you should buy. Users decide their own needs. |
| **Real-time multi-device sync** | "Changes on one phone should appear on another instantly." Sounds modern. | Requires a backend or complex peer-to-peer sync with conflict resolution. Manual OneDrive sync is simpler, transparent, and sufficient. | Keep manual sync. It's explicit and predictable. If real-time sync is added in a future version, it's a major architecture change (consider a backend then). |
| **Unlimited reminders before expiry** | "Alert me at 90, 60, 30, 7, 1 day before expiry." Feels comprehensive. | Alert fatigue. Users will mute or ignore notifications if they come too often. Research shows poorly timed notifications reduce engagement by 43%. | For v1, show expiring medicines on the dashboard (glanceable, user-initiated view). If notifications added later, limit to 1-2 strategic reminders (e.g., "Expiring this week" alert). Make frequency configurable. |
| **Complex stock level tracking** | "Track low-stock thresholds, reorder points, suppliers." | MedStock is a *medicine* app, not a *pharmacy inventory* system. Low-stock thresholds add mental overhead. Most users just repurchase when they realize they're out. | For v1, show "quantity remaining" as context (helps avoid accidental overbuy). No reorder logic. |

## Feature Dependencies

```
[Search medicines by name]
    └──requires──> [Core metadata storage: name, expiry, location, quantity]

[Offline PWA]
    └──requires──> [IndexedDB storage]
    └──requires──> [Service worker + manifest.json]

[Dashboard with metrics]
    └──enhances──> [Search medicines by name]
    └──requires──> [Expiry status logic]
    └──requires──> [Edit/delete to keep data fresh]

[Manual OneDrive sync]
    └──requires──> [Export to JSON]
    └──requires──> [Import from JSON]

[Batch creation]
    └──enhances──> [Add medicine with core metadata]
    └──avoids conflict with──> [Single-item add form]

[Period-after-opening tracking]
    └──enhances──> [Expiry status logic]
    └──requires──> [Opened date field]

[CSV import]
    └──enhances──> [Add medicine] (bootstrapping initial inventory)
    └──requires──> [Column mapping logic]

[Activity history]
    └──enhances──> [All other features] (adds audit trail)
    └──requires──> [Timestamp + change recording on every mutation]

[Location filtering]
    └──enhances──> [Search medicines] (adds second-level discovery)
    └──requires──> [Location field on each medicine]

[Custom in-app install prompt]
    └──enhances──> [PWA installation] (better UX than browser default)
    └──requires──> [beforeinstallprompt event handling]

[Trash bin / soft delete]
    └──conflicts with──> [Lightweight data model] (adds complexity, but prevents accidental loss)
```

### Dependency Notes

- **Search requires metadata storage:** Can't search without data. Metadata (name, location, expiry) is the minimum.
- **Offline PWA requires IndexedDB + Service Worker:** PWA is in PROJECT.md requirements. IndexedDB is the right storage for structured offline-first data.
- **Batch creation enhances add flow:** Doesn't replace single-item add. Users will use both. Batch is faster for pharmacy trips; single-item for incidental purchases.
- **Period-after-opening requires opened date:** Without the opened date field, we can't calculate "safe period remaining." This is a differentiator; don't skip it.
- **CSV import needs column mapping:** Raw CSV is useless without a way to map columns to fields. Users have different spreadsheet formats.
- **Trash bin complicates deletion:** Adds UI (restore view), state (soft delete flag), and logic (query filtering). Worth it for safety, but not free.
- **Manual sync requires export + import:** Two separate pieces. Export to JSON is the source; import reads it back. Conflict handling is implicit (user chooses which version to keep).

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **Search medicines by name** — Core use case: "Do I have this?" must work and be fast.
- [x] **Add medicine with core metadata** — Name, quantity, location, expiry date, opened date, period-after-opening.
- [x] **Edit and delete medicines** — Soft delete to trash bin to prevent accidents.
- [x] **View expiry status on dashboard** — Total, expired, expiring-soon, opened-past-safe-period counts at a glance.
- [x] **Filter and sort by category, location, status** — Browsing for the organized users.
- [x] **Offline-first PWA on IndexedDB** — Works fully offline on any device. Installable on Android, Windows, macOS, Linux.
- [x] **Manual sync via JSON export/import** — OneDrive sync pattern. User-initiated "Sync Now" flow.
- [x] **Trash bin and restore** — Soft delete with recovery option.
- [x] **Batch medicine creation** — Add multiple packages of same medicine in one flow.
- [x] **Predefined + custom categories and locations** — Help users organize. Customizable.
- [x] **Period-after-opening tracking** — Calculate validity based on opened date + safe period, not just expiry date.
- [x] **History/activity log** — Timestamp every change for audit and understanding.

### Add After Validation (v1.x)

Features to add once core is working and user feedback is collected.

- [ ] **CSV import for initial inventory** — Bulk bootstrap from spreadsheet. Implement when early users ask for data migration paths.
- [ ] **Custom in-app install prompt** — Guide users to install on home screen. Implement after initial deployment; see how many users install via browser default.
- [ ] **Dashboard chart visualizations** — Expand metrics with trend charts (e.g., "medicines expired this month"). Low priority; counts are sufficient for v1.
- [ ] **Activity history export** — Let users export the change log for records. Low priority; useful for compliance-conscious users.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Medication reminders/adherence tracking** — Different product category. Requires scheduling logic, notification strategy, regulatory thinking. Build as separate product if validated.
- [ ] **Barcode scanning + OCR for expiry** — Tempting but complex. Defer until manual entry is a pain point and we've validated the core.
- [ ] **Photo capture per medicine** — Storage and sync burden. Defer until users ask and offline-first sync is rock-solid.
- [ ] **Automatic background sync** — Adds complexity without massive value. Manual sync is sufficient for household use.
- [ ] **Multiple user profiles / household accounts** — Auth complexity. If needed, move to account-based sync (backend) rather than device-based.
- [ ] **Drug interaction checking** — Out of scope. Liability and maintenance burden. Users consult their pharmacist.
- [ ] **Real-time multi-device sync** — Requires backend or peer-to-peer; major architecture shift. Consider if product scales to justify.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Search medicines by name | HIGH | LOW | P1 |
| Add medicine with metadata | HIGH | MEDIUM | P1 |
| Edit and delete (soft) | HIGH | LOW | P1 |
| Dashboard metrics | HIGH | MEDIUM | P1 |
| Filter/sort by category, location, status | HIGH | MEDIUM | P1 |
| Offline PWA on IndexedDB | HIGH | HIGH | P1 |
| Manual JSON sync | HIGH | MEDIUM | P1 |
| Period-after-opening tracking | HIGH | MEDIUM | P1 |
| Batch creation | MEDIUM | MEDIUM | P1 |
| Trash bin + restore | MEDIUM | LOW | P1 |
| Predefined + custom categories/locations | MEDIUM | LOW | P1 |
| History/activity log | MEDIUM | MEDIUM | P1 |
| CSV import | MEDIUM | MEDIUM | P2 |
| Custom install prompt | LOW | LOW | P2 |
| Dashboard charts | LOW | LOW | P2 |
| Activity history export | LOW | LOW | P3 |
| Medication reminders | LOW | HIGH | P3 |
| Barcode scanning | LOW | HIGH | P3 |
| Photo storage | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch (core value realization)
- P2: Should have, add when possible (nice-to-have post-launch)
- P3: Nice to have, future consideration (defer to v2 or beyond)

## Competitor Feature Analysis

| Feature | Medisafe (Reminder App) | MyCabinet (Medicine Manager) | Our Approach (MedStock) | Notes |
|---------|------------------------|------------------------------|-------------------------|-------|
| **Search medicines** | Yes (for reminders) | Yes | Yes | Core feature across all. MedStock focuses on search + instant validity status. |
| **Add medicines** | Yes (schedule-focused) | Yes (inventory-focused) | Yes (inventory-focused) | MedStock: name, location, expiry, opened date, quantity, notes. Medisafe: dosage, schedule, refill dates. Different purposes. |
| **Expiry date tracking** | Refill reminders only | Yes (dashboard shows expired count) | Yes (with period-after-opening) | MedStock adds opened date + safe period logic. Few competitors do this. |
| **Edit/delete** | Yes | Yes | Yes | Standard. |
| **Filter/sort** | No (reminders model) | Yes (by category, status) | Yes (by category, location, status) | MedStock location field is differentiator for household "Where is it?" use case. |
| **Offline-first PWA** | Cloud-based | Web app (cloud-based) | Yes (IndexedDB, service worker, fully offline) | MedStock is unique here: zero server, full offline. |
| **Family/multi-user** | "Medfriend" feature (caregiver notifications) | Separate "medicine cabinets" per person | Manual JSON sync (shared inventory per device) | MedStock: shared household inventory. Medisafe: adherence tracking. MyCabinet: per-person cabinets. Different models. |
| **Batch creation** | No | No | Yes | MedStock differentiator: pharmacy trips produce 5+ items. |
| **Period-after-opening** | No | No (basic opening date only) | Yes (opened date + safe period in days) | MedStock differentiator: captures "use within X days of opening" safety rules. |
| **CSV import** | No | No | Yes (planned for v1.x) | MedStock bootstrap differentiator. Few household inventory apps do this. |
| **Activity history** | No | No | Yes | MedStock audit trail: timestamps on every change. |
| **Medication reminders** | Yes (core feature) | No | No (deliberately out of scope) | Medisafe is adherence. MedStock is inventory. Different products. |
| **Drug interaction checker** | Yes | No | No (out of scope) | Medisafe has it. MedStock avoids liability/maintenance burden. Users consult pharmacist. |

## Sources

**Medicine Inventory & Expiry Tracking:**
- [MedBay: Smart Medicine Cabinet - MWM](https://mwm.ai/apps/medbay-smart-medicine-cabinet/6758745768)
- [Medicines and Medical Supplies Inventory App](https://www.collectioninventory.app/medicines-medical-supplies-app/)
- [Drug Inventory - App Store](https://apps.apple.com/us/app/drug-inventory/id1562569425)
- [The 7 Best Medical Inventory Software of 2026 | SafetyCulture](https://safetyculture.com/apps/medical-inventory-software)
- [ExpiresBy - Expiry Date Tracker](https://apps.apple.com/us/app/expiry-date-tracker-expiresby/id6752549549)
- [Exp Reminder - Set Your Expiry](https://apps.google.com/store/apps/details?id=com.exp_reminder)

**Medication Reminder & Family Sharing:**
- [Medisafe Pill & Med Reminder - App Features](https://medisafeapp.com/features/)
- [Medisafe on Google Play](https://play.google.com/store/apps/details?id=com.medisafe.android.client)
- [MyDigiRecords - Family Medicine Management](https://mydigirecords.ai/managing-medicines-for-the-whole-family-heres-how-to-do-it-with-one-app/)
- [Five Simple Medication Tracking Apps for Caretakers](https://www.seniorhelpers.com/nc/gastonia/resources/blogs/five-simple-medication-tracking-apps-for-caretakers-and-family-members/)
- [Family Medication Tracking Apps | Useful Vitamins](https://usefulvitamins.com/family-shared-medication-supplement-profile-app/)
- [MyCabinet: Medicine Management - App Store](https://apps.apple.com/us/app/mycabinet-medicine-management/id6450606680)

**PWA Offline & Sync Patterns:**
- [PWA Add to Home Screen: The Magic Behind It](https://www.gomage.com/blog/pwa-add-to-home-screen/)
- [Making PWAs Installable - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [How to Provide Your Own In-App Install Experience - web.dev](https://web.dev/articles/customize-install)
- [Installation Prompt - web.dev](https://web.dev/learn/pwa/installation-prompt)
- [Offline-First Frontend Apps in 2025: IndexedDB and SQLite](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [Building Offline-First Web Applications: Service Workers & IndexedDB](https://letsbuildsolutions.com/blog/web-engineering/building-offline-first-web-applications-service-workers-indexeddb-and-sync-strategies-for-production/)
- [Offline-first without a backend: Local-first PWA architecture](https://dev.to/crisiscoresystems/offline-first-without-a-backend-a-local-first-pwa-architecture-you-can-trust-3j15)
- [Build Offline-First PWA with Next.js & IndexedDB](https://www.wellally.tech/blog/build-offline-first-pwa-nextjs-indexeddb)

**Quick-Add & Entry UX Patterns:**
- [Case Study: Inventory Management for Medical Stores | Medium](https://medium.com/design-bootcamp/case-study-inventory-management-for-medical-stores-690ad67b9bf7)
- [Healthcare UI Design 2026: Best Practices + Examples](https://www.eleken.co/blog-posts/user-interface-design-for-healthcare-applications)
- [Adding an Item to Shopping Cart: Provide Clear, Persistent Feedback - NN/G](https://www.nngroup.com/articles/cart-feedback/)

**CSV Import & Data Migration:**
- [Importing Inventory Data via CSV | Cin7 Core](https://help.core.cin7.com/hc/en-us/articles/9034481792399-Importing-inventory-data-via-CSV-files)
- [Add a CSV Import Feature in Your SaaS - CSVBox Blog](https://blog.csvbox.io/add-csv-import-feature-saas/)
- [CSV Import & Export - Zoho Inventory](https://skyvia.com/data-integration/zoho-inventory-csv-file-import-and-export)

**Barcode Scanning & OCR:**
- [Lot Code and Expiration Date Inspection with OCR - Cognex](https://www.cognex.com/en/applications/optical-character-recognition/date-and-lot-code-inspection)
- [Expiry Date Barcode Scanner - Expirel](https://expirel.com/barcode-scanner)
- [Smart Mobile OCR Scanning Solutions - Cipherlab](https://www.cipherlab.com/en/page-2139/Cipherlab-Mobile-OCR-Scanning.html)

**Pitfalls & Usability Issues:**
- [Medication Management Apps: Usable by Older Adults? - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5694345/)
- [Good Start, Bad Finish: Apple's Medication Reminder App Review](https://medium.com/design-bootcamp/good-start-bad-finish-a-review-of-apples-medication-reminder-app-76b7581c8e88)
- [Medication Reminder and Pill Tracker - MyTherapy](https://www.mytherapyapp.com/)

---

*Feature research for: MedStock (Household Medicine Inventory PWA)*
*Researched: 2026-06-29*
*Research confidence: HIGH (multiple competitor products analyzed, ecosystem patterns verified across 12+ sources)*
