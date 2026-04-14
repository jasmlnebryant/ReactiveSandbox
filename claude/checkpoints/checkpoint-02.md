# Checkpoint 02 — Session 8: Forging the Prefabs
**Date:** 2026-04-14
**Project:** Reactive Sandbox — AI 201 Project 2
**Status:** Session 8 in progress. Three components built and rendering. Core upload flow working. Several issues remain unresolved — user is not satisfied with current result. Continuing next session.

---

## 1. Context Resume

Session 8 milestone: build three isolated components with layout and structure first. The project was scaffolded from scratch (no prior code existed). A Vite + React app was created manually (Vite's interactive CLI could not run non-interactively in a non-empty directory).

The three panels are rendering in the correct layout (weekly top-left, monthly bottom-left, detail right). The default state overlay with the glassmorphism popup is complete and visually approved. Syllabus upload via PDF is functional — files are extracted client-side using `pdfjs-dist` and parsed for assignment data.

**What changed since Checkpoint 01:**

- **Project scaffolded:** Vite + React created manually. `package.json`, `vite.config.js`, `index.html`, `src/main.jsx` all written by hand. Base path set to `/ReactiveSandbox/` for GitHub Pages.
- **Three components created:** `WeeklyView`, `MonthlyView`, `DetailView` — each in `src/components/[Name]/` with `.jsx` and `.css` files.
- **App layout:** Left column (`flex: 1.4`) holds weekly (top) and monthly (bottom), each `flex: 1`. Right column (`flex: 0.55`) is the detail panel. Gap: `14px`, padding: `20px`, full viewport.
- **Color palette applied:** CSS variables `--color-1` through `--color-7` plus `--color-6-dark: #3B3C32` defined in `index.css`. Background `--bg: #D0D0CA` (15% darker than original `#F5F5EE`).
- **Default state overlay:** Glassmorphism card (`rgba(255,255,255,0.55)` + `backdrop-filter: blur(20px)`). Green tint overlay (`rgba(195,199,166,0.30)`). Floating blob animation: two nested elements with independent X (7s) and Y (5s) `ease-in-out infinite alternate` animations to create fluid continuous drift. Blob size: 280×280px.
- **Popup content:** "WELCOME" eyebrow, "Get started." (bold, 58px, `--color-6-dark`), subtitle, two pill buttons ("Upload Syllabus" in `--color-6`, "Create a Task" in semi-transparent green), "OR" divider.
- **PDF upload flow:** Hidden `<input type="file" multiple accept=".pdf,.doc,.docx">` triggered by button click. Three overlay states: `idle` → `processing` (spinner + filename label) → `success` (course list with pencil rename) → `done` (overlay dismissed).
- **PDF text extraction:** `src/utils/extractPdfText.js` using `pdfjs-dist`. Worker pointed at bundled `.mjs` file via `import.meta.url`.
- **Syllabus parser:** `src/utils/parseSyllabus.js`. Extracts course name (four fallback levels: "Course Title:" label → course code + title → course code alone → filename). Extracts assignments by matching keyword lines to nearby date patterns. Known limitation: parser is aggressive and may match non-due-date text.
- **Single source of truth:** All assignments stored in `App.jsx` state. Both WeeklyView and MonthlyView receive `assignments` prop and filter by due date. No local state for items in any child component.
- **Week/month navigation:** `weekOffset` and `monthOffset` state in App. Prev/next `‹ ›` arrows in both panel headers. "Today" / "This Month" pill appears when navigated away. "View Schedule" button after upload jumps to week/month of nearest upcoming assignment.
- **Click → detail:** `selectedItem` state in App. WeeklyView and MonthlyView call `onSelectItem(item)` on click. DetailView receives `selectedItem` and shows full details (course tag, title, due date, type, professor). Mark Complete and Delete buttons functional. Decorative state (12-hour clock + hint text) shown when nothing selected.
- **Color assignment by course:** Consistent across both panels. Same `buildColorMap` function in both components. PALETTE order: `['#ECE9BE', '#D9E4E0', '#EEF1DE', '#D7C59F', '#E9ECCF', '#F1F0C8', '#C3C7A6']`.
- **Selected card style:** 3px border at 50% darkened card color. Completed items: `opacity: 0.45` + `text-decoration: line-through`.
- **Dev server config:** `.claude/launch.json` at project root. Runs `npm run dev --prefix ReactiveSandbox -- --port 5174` to avoid conflict with port 5173 (previous project still running).

**Production pipeline stage:** Session 8 — Forging the Prefabs (in progress, not signed off)

---

## 2. Human Directions

Steps to reproduce from Checkpoint 01:

1. In `ReactiveSandbox/ReactiveSandbox/`, manually create: `package.json`, `vite.config.js` (base: `/ReactiveSandbox/`), `index.html`, `src/main.jsx`, `src/index.css`.
2. Create `src/components/WeeklyView/`, `MonthlyView/`, `DetailView/` — each with `.jsx` and `.css`.
3. Create `src/utils/extractPdfText.js` and `src/utils/parseSyllabus.js`.
4. Create `src/App.jsx` and `src/App.css`.
5. Run `npm install` to install React, pdfjs-dist, Vite.
6. Create `.claude/launch.json` at the project root (one level above `ReactiveSandbox/`) with port 5174.
7. Key values: background `#D0D0CA`, detail panel `flex: 0.55`, left column `flex: 1.4`, blob size 280×280px, X animation 7s, Y animation 5s.

---

## 3. Records of Resistance

**R1 — Hardcoded placeholder data**
- Both WeeklyView and MonthlyView were initialized with hardcoded `PLACEHOLDER_ITEMS` / `PLACEHOLDER_EVENTS` arrays that I made up.
- User flagged that the items shown were not from their uploaded syllabi.
- Fix: removed all placeholder data from both components. Panels now only show data from the `assignments` prop passed from App.

**R2 — Date misalignment between weekly and monthly views**
- Weekly and monthly each had independent hardcoded data, causing items to appear on different dates in each view.
- User flagged: "the due dates for the weekly view have been shifted ahead by one week on the monthly view."
- Fix: both views now read from the same `assignments` array in App (single source of truth). The date discrepancy was entirely caused by the separate hardcoded datasets.

**R3 — 24-hour clock**
- DetailView clock was displaying in 24-hour format.
- User flagged immediately.
- Fix: converted to 12-hour using `rawHours % 12 || 12` with AM/PM label.

---

## 4. Successes

**S1 — Glassmorphism popup approved quickly**
- The frosted glass card with green tint overlay, floating blob animation, and pill buttons matched the reference aesthetic and was approved with only minor tweaks (size, colors, text alignment). Pattern: match the structural/layout language of the reference image while substituting the project's own color palette.

**S2 — PDF extraction running entirely client-side**
- `pdfjs-dist` with the bundled worker via `import.meta.url` works cleanly in Vite without a backend. The processing → success state flow gives the user clear feedback during parsing.

**S3 — Fluid blob animation**
- Two nested elements with independent X/Y animations at different durations (7s/5s) using `ease-in-out infinite alternate` creates a naturally organic drift with no stop-and-go. This is a reusable animation pattern.
