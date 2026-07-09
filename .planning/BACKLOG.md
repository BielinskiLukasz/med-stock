# MedStock Backlog

Captured ideas and future enhancements not yet planned into a phase.

---

## Ideas

### Medicine Name Autocomplete (Dropdown from History)

**Summary:** When adding a new medicine, suggest names from medicines already in the inventory — including items in Trash — via a dropdown/autocomplete.

**Motivation:** Users tend to buy the same medicines repeatedly. Showing known names speeds up entry, reduces typos, and keeps naming consistent across packages of the same product.

**Scope notes:**
- Source pool: all medicines in the DB regardless of status (active, expired, used up, trashed)
- Deduplicate by name (case-insensitive)
- Trigger on the name field in the Add / Edit form — type to filter, or click to open full list
- Selecting a suggestion should only pre-fill the name; other fields stay blank so the user enters fresh data for the new package

**Open questions:**
- Should selecting a name also pre-fill category (since the same medicine usually belongs to the same category)?
- UX: native `<datalist>`, shadcn/ui Combobox (Radix Popover + Command), or a simple filtered dropdown?
- Minimum character count before suggestions appear (0 = show all on focus, 1 = after first keystroke)?
