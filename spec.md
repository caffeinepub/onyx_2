# ONYX

## Current State
ONYX is a full-featured chat and media app with four pages: Chat (0), Video Feed (1), VS Studio (2), and Race/Forza (3). The Race page is a browser-based Forza Horizon 5 clone. Navigation is via bottom PageNav bar and arrow keys.

## Requested Changes (Diff)

### Add
- `DailyNewsPage` component: a dedicated "Daily News" page that shows curated daily news headlines, categories, and article previews. Fetches from a public RSS/news feed or renders sample static news cards if no live data is available. Each card shows headline, source, timestamp, category badge, and a brief excerpt. Includes a category filter bar (All, Tech, World, Sports, Business, Entertainment). Cards are clickable and open the article link in a new tab.

### Modify
- `PageNav.tsx`: Replace the Race tab (page 3, Car icon) with a News tab (page 3, Newspaper icon).
- `App.tsx`: Remove `ForzaRacingPage` import and render; add `DailyNewsPage` import and render for page 3. Remove the Race entry from PAGE_X/PAGE_Y maps (keep same indices). Update keyboard/swipe navigation comments.

### Remove
- `ForzaRacingPage.tsx` is no longer rendered (file can stay but is unused).

## Implementation Plan
1. Create `src/frontend/src/components/DailyNewsPage.tsx` with a polished news feed UI — category filter, news cards, loading skeleton, and external link handling.
2. Update `PageNav.tsx` — swap Car icon for Newspaper, change label from "Race" to "News".
3. Update `App.tsx` — swap ForzaRacingPage import/render for DailyNewsPage.
