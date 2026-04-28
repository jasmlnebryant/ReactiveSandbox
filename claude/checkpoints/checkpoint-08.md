# Checkpoint 08 — Session 16: GitHub Pages, Color Coding, Scrolling & Polish
**Date:** 2026-04-28
**Project:** Reactive Sandbox — AI 201 Project 2
**Status:** Session 16 complete. GitHub Pages deployed. Progress panel color-coded. Scrolling enabled in both panels. Item hover expansion smoothed. Due-soon feature removed.

---

## 1. Context Resume

Session 16 focused on deployment, visual consistency, and removing complexity.

**What changed since Checkpoint 07:**

### GitHub Pages Deployment
- Created `.github/workflows/deploy.yml` — Vite build + GitHub Actions deploy pipeline.
- `vite.config.js` already had `base: '/ReactiveSandbox/'` set correctly.
- Live URL: `https://jasmlnebryant.github.io/ReactiveSandbox/`
- Every push to `main` triggers an automatic rebuild and redeploy.

### README Populated
- Full PRD content written to `README.md`: Design Intent, Three Panels description, Data Model, Interaction Rules, What I Will Not Compromise On, Mermaid `classDiagram`, AI Direction Log (5 entries), Records of Resistance (10 entries), Five Questions Reflection.

### Proximity Items Removed
- All `dueSoon`-adjacent proximity feature stripped from `WeeklyView.jsx`, `WeeklyView.css`, and `App.jsx` settings state — state, handlers, JSX, CSS, and settings field all removed.

### Single Data Source
- `WeeklyView` was receiving raw `assignments`; changed to `visibleAssignments` so all three panels read from the same filtered source.

### Color Coding in Progress Panel
- Added `buildColorMap()` to `WeeklyView.jsx` (mirrors `MonthlyView` logic exactly).
- `allAssignments` prop added to `WeeklyView` for consistent color assignment across courses.
- Each tracker item now receives `--item-color` CSS variable; applied as `background` + a darker `border-left` accent.
- Colors respond to `colorCodeBy` setting (`'course'` or `'type'`) same as MonthlyView.

### Scrolling in Both Panels
- **Weekly**: `flex-shrink: 0` on `.tracker-item` so items don't collapse; `min-height: 0` on `.tracker-day` and `.tracker-day-items`; `overflow-y: auto` with thin scrollbar styling.
- **Monthly**: Removed `MAX_VISIBLE = 2` cap and `+N more` button — all events now render. `.month-cell-events` changed from `overflow: hidden` to `overflow-y: auto` with thin scrollbar.

### Smooth Hover Expansion
- Replaced `white-space` toggle approach (which can't animate) with `max-height` transition on `.tracker-item-name`.
- Resting state: `max-height: 1.3em` (one line, text always wraps via `white-space: normal`).
- Hover state: `max-height: 8em` — smooth reveal via `cubic-bezier(0.4, 0, 0.2, 1)`.
- Item lifts `1px` with a subtle `box-shadow` on hover.

### Due-Soon Feature Removed
- Removed `dueSoonEnabled` and `dueSoonDays` from `App.jsx` settings state.
- Removed the "Due-soon highlight" toggle and "Days threshold" counter rows from the settings UI.
- Removed `isDueSoon` logic, `due-soon` class application, and `.month-event.due-soon` CSS rule from `MonthlyView`.

---

## 2. Human Directions

Steps to reproduce from Checkpoint 07:

1. **`.github/workflows/deploy.yml`** (new file at repo root): GitHub Actions workflow — checkout, setup Node 20, `npm ci`, `npm run build`, upload `dist/`, deploy to Pages.
2. **`src/App.jsx`**: Remove `dueSoonEnabled` and `dueSoonDays` from settings state. Remove settings UI rows for due-soon toggle and days counter. Change `<WeeklyView assignments={visibleAssignments}` → add `allAssignments={assignments}` prop. Change `<WeeklyView assignments={assignments}` → `assignments={visibleAssignments}`.
3. **`src/components/WeeklyView/WeeklyView.jsx`**: Add `buildColorMap()` and palette constants (mirrors MonthlyView). Accept `allAssignments` prop. Destructure `colorCodeBy` from settings. Build `colorMap` at render time. Add `--item-color` inline style to all three item kinds (overdue, completed, regular).
4. **`src/components/WeeklyView/WeeklyView.css`**: Add `background: var(--item-color, var(--color-1))` and `border-left: 3px solid color-mix(...)` to `.tracker-item`. Replace `overflow: hidden` + `white-space: nowrap` approach with `max-height: 1.3em` + `transition: max-height 0.3s cubic-bezier(...)` on `.tracker-item-name`. Hover: `max-height: 8em`. Add lift + shadow on `.tracker-item:hover`. Add `flex-shrink: 0` to items. Add `min-height: 0` + thin scrollbar to `.tracker-day-items`.
5. **`src/components/MonthlyView/MonthlyView.jsx`**: Remove `MAX_VISIBLE`, `visibleEvents`, `hasMore`. Render `events.map(...)` directly. Remove `dueSoonEnabled`/`dueSoonDays` destructuring, `dueSoonThreshold`, `isDueSoon`, and `due-soon` class. Remove `todayMidnight`.
6. **`src/components/MonthlyView/MonthlyView.css`**: Change `.month-cell-events` to `overflow-y: auto` with thin scrollbar. Remove `.month-more-btn` rule. Remove `.month-event.due-soon` rule.

---

## 3. Records of Resistance

**R1 — Workflow file placed at wrong directory level**
- `deploy.yml` was written to the parent folder of the git repo root. Git didn't track it. Fixed by moving it inside `ReactiveSandbox/.github/workflows/`.

**R2 — white-space can't be CSS-transitioned**
- First hover expansion attempt toggled `white-space: nowrap` → `normal`, which snapped instantly. Replaced with `max-height` transition so the reveal animates smoothly while `white-space: normal` stays constant.

---

## 4. Successes

**S1 — Color parity between panels**
Both the progress tracker and monthly calendar now use identical color logic. Same course or type gets the same color in both panels.

**S2 — Scrolling without layout breakage**
Adding `min-height: 0` to the flex chain was the key unlock — without it, flex children ignore overflow constraints and the scrollbar never engages.

**S3 — Live deployment**
Site is live at `https://jasmlnebryant.github.io/ReactiveSandbox/` and auto-updates on every push to main.
