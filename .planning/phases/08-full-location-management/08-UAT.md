---
status: testing
phase: 08-full-location-management
source: [08-VERIFICATION.md]
started: 2026-09-18T16:20:00Z
updated: 2026-09-18T16:20:00Z
---

## Current Test

number: 1
name: Drag-active visual state at 360px mobile viewport
expected: |
  At a 360px-wide viewport, dragging a location row shows a 50% opacity (opacity: 0.5)
  drag-active state; the rest of the list reflows smoothly without layout jump; releasing
  completes the reorder and persists to the database.
awaiting: user response

## Tests

### 1. Drag-active visual state at 360px mobile viewport
expected: The dragged row shows 50% opacity; the rest of the list reflows without jumping; releasing completes the reorder and persists to db.
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
