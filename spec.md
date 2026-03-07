# ONYX

## Current State
ONYX is a full-stack multi-page app with Chat, Video Feed, VS Studio, News, AI Search, and Web Search pages. Bottom nav has 6 page tabs + Status. Navigation uses PageIndex 0-5.

## Requested Changes (Diff)

### Add
- A new **Workout** page (PageIndex 6) accessible from the bottom nav
- Workout page features:
  - Categorized workout library (Chest, Back, Legs, Arms, Core, Full Body)
  - Exercise cards with name, sets/reps, muscle group, difficulty level
  - Ability to start a workout session with a timer
  - Track completed sets per exercise (tap to mark sets done)
  - Rest timer between sets (countdown)
  - Personal workout log / history (stored in localStorage)
  - Daily workout streak counter
  - Motivational UI — dark, intense, minimal

### Modify
- `PageNav.tsx` — add Workout tab (Dumbbell icon, page 6)
- `App.tsx` — add `currentPage === 6 && <WorkoutPage />` render, extend PAGE_X/PAGE_Y maps and PageIndex type
- `PageNav.tsx` — update PageIndex to include 6

### Remove
- Nothing removed

## Implementation Plan
1. Create `WorkoutPage.tsx` with full workout tracker UI
2. Update `PageNav.tsx` to add Workout tab with Dumbbell icon (PageIndex 6)
3. Update `App.tsx` to render WorkoutPage at page 6 and add to PAGE_X/PAGE_Y maps
