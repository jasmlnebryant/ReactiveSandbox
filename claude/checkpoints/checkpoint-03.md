# Checkpoint 03 — Session 9: Glasswork & Customization
**Date:** 2026-04-15
**Project:** Reactive Sandbox — AI 201 Project 2
**Status:** Session 9 complete. Glassmorphism applied site-wide. Widget system, palette editor, and background blobs all functional. Monthly view overflow solved. Ready for next milestone.

---

## 1. Context Resume

Session 9 milestone: cross-panel reactivity, glassmorphism refinement, and detail panel customization. The session started by continuing from checkpoint-02 where three panels were built but several issues remained.

**What changed since Checkpoint 02:**

### Monthly View — Fixed-Dimension Cells with Overflow
- Grid restructured: day-of-week labels (`month-day-labels`) separated from date cells (`month-cells`) into two distinct grids. Cells grid uses `grid-auto-rows: 1fr` so every day cell is identical height regardless of content.
- Events capped at `MAX_VISIBLE = 2` per cell. If a day has more, a `...` button appears (light grey card background, full-width pill matching event chip styling).
- Clicking `...` calls `onSelectDay({ date, items })` which populates the detail panel with a scrollable list of all items for that day.
- New state flow: `selectedDay` in App.jsx. Clicking a card from a panel clears `selectedDay`; clicking `...` clears `selectedItem`. Deselecting an item from within day view returns to day list.

### Detail Panel — Widget System
- `+` button in the detail header opens a frosted-glass widget picker dropdown with 5 options: Digital Clock, Analog Clock, Image, GIF, To-Do List.
- Widgets are **free-form positioned** on a canvas board (when idle/no item selected). Each widget has:
  - `position: absolute` with `x, y, width, height` in state
  - **Drag handle** at top (grab cursor, `⠿` grip icon, `×` remove button)
  - **Resize handle** at bottom-right (corner triangle, `se-resize` cursor)
  - Minimum size: 130×80px, constrained within board bounds
  - Z-index management: last-touched widget floats on top
- Widget types:
  - **Digital Clock** — 12-hour with AM/PM, date string
  - **Analog Clock** — SVG with ticks, hour/minute/second hands, center dot
  - **Image / GIF** — dashed upload zone → displays uploaded image, click to replace
  - **To-Do List** — checkable items, strikethrough when done, hover `×` delete, `+` add bar at bottom
- Global `mousemove`/`mouseup` on `window` handles drag/resize without losing tracking when cursor moves fast.
- New widgets spawn on top (highest z-index).

### Detail Panel — Palette Editor
- Palette icon button at bottom-right of detail panel (idle mode only). Frosted glass circle, turns green on hover/open.
- Popup expands upward with two views:
  - **List view**: shows all saved palettes with color swatches and a `+ New Palette` button. Active palette has checkmark. Clicking active palette opens edit.
  - **Create / Edit view**: name input + scrollable color rows. Each row has a label, native color picker swatch, and hex text input. All three sync bidirectionally.
- **Live preview**: every color change immediately calls `document.documentElement.style.setProperty()` — the entire site reacts in real time before saving.
- **Revert on back**: if user navigates back without saving, all CSS variables revert to the last-saved active palette state.
- **Unsaved changes confirmation**: if user clicks `‹` with pending edits, a frosted overlay asks "Save" or "Discard" before proceeding.
- Palette variables (13 total):
  - `--bg` (App Background), `--color-1` (Card Surface), `--color-2` (Today Highlight)
  - `--color-3` (Event — Cool), `--color-4` (Event — Pale), `--color-5` (Event — Warm), `--color-6` (Primary Accent), `--color-7` (Event — Tan)
  - `--color-6-dark` (Accent Text), `--blob-color` (Background Blob)
  - `--text-primary` (Text — Primary), `--text-secondary` (Text — Secondary), `--text-tertiary` (Text — Tertiary)

### Glassmorphism — Site-Wide
- Panels: `background: rgba(255,255,255,0.22)`, `backdrop-filter: blur(16px)`, white glassy border `rgba(255,255,255,0.75)`, soft shadow `0 8px 40px rgba(180,180,160,0.18)`.
- `--border-radius` bumped from `14px` → `20px`.
- Internal dividers split into `--border` (glassy white, panel outlines) and `--border-inner` (subtle dark `rgba(0,0,0,0.06)`, calendar grids/headers/inputs).
- Widget cards use `--surface-solid: #FFFFFF` to remain opaque and legible.

### Background Blobs
- Three floating blobs behind the panels, same nested X/Y animation technique as the popup blob.
- Blob 1: top-left, 700px, 11s/7s drift
- Blob 2: bottom-right, 580px, 9s/9s counter-phase (`alternate-reverse`)
- Blob 3: center, 460px, 13s/5s
- Color driven by `--blob-color` CSS variable (defaults to `#C3C7A6`). Uses `color-mix(in srgb, var(--blob-color) X%, transparent)` for opacity stops so palette editor controls blob hue live.

### Event Colors — CSS Variable Driven
- PALETTE arrays in both WeeklyView and MonthlyView switched from hardcoded hex values to `var(--color-X)` references. CSS resolves these at paint time, so palette editor changes update event chips instantly without React re-render.
- WeeklyView selected card: switched from JS `darken()` + border to CSS `outline: 2px solid rgba(59,60,50,0.4)` (matches MonthlyView).

### Navigation Arrows
- "Today" / "This Month" pills now show a directional arrow pointing AWAY from the text toward where the current date is:
  - Viewing the past: `Today →` / `This Month →`
  - Viewing the future: `← Today` / `← This Month`

### Weekly View Today Column
- Today column header background changed from `--color-1` to `--color-2`, matching the monthly view's today highlighting. Both now controlled by the same "Today Highlight" palette slot.

---

## 2. Human Directions

Steps to reproduce from Checkpoint 02:

1. **MonthlyView**: Split `.monthly-grid` into `.month-day-labels` + `.month-cells` grids. Add `MAX_VISIBLE = 2`, `...` overflow button, `onSelectDay` prop.
2. **App.jsx**: Add `selectedDay` state. Create `handleSelectItemFromPanel`, `handleSelectDay`, `handleSelectItemFromDay` handlers. Pass `onSelectDay` to MonthlyView, `selectedDay` to DetailView.
3. **DetailView**: Add widget system (`widgets` state with `x, y, width, height, z`). Add drag/resize handlers on `window`. Add widget picker dropdown. Add palette editor (`palettes`, `activePaletteId` state) with create/edit/confirm flows. Add `PaletteIcon`, `PalettePopup`, `ColorRows` components.
4. **App.css**: Add `.bg-blobs` with three blob elements using `bg-blob-x`/`bg-blob-y` keyframes. Add `z-index: 1` to `.left-column` and `.panel-detail`.
5. **index.css**: Update `--surface` to `rgba(255,255,255,0.22)`, add `--surface-solid`, split `--border` / `--border-inner`, add `--blob-color`, update `--border-radius` to `20px`.
6. **All component CSS**: Replace `var(--border)` → `var(--border-inner)` for internal dividers.
7. **Both PALETTE arrays**: Replace hardcoded hex values with `var(--color-X)` references.

---

## 3. Records of Resistance

**R1 — Monthly "..." button too subtle**
- Initially the more button was bare text with no background.
- User flagged: "make the '...' more noticeable."
- Fix: added light grey card background (`rgba(180,180,175,0.28)`) matching event chip styling.

**R2 — Todo widget overlap**
- The circular `+` add button overlapped with the `×` delete buttons on todo items.
- User flagged immediately.
- Fix: replaced circular button with a full-width bar footer (`todo-input-row`) with a `+` icon prefix and text input. Press Enter to add.

**R3 — Palette colors not affecting event chips**
- `--color-4`, `--color-5`, `--color-7` had no visible effect when changed in the palette editor.
- Root cause: PALETTE arrays in WeeklyView and MonthlyView used hardcoded hex values, never referencing CSS variables.
- Fix: replaced all hex values with `var(--color-X)`. Also replaced WeeklyView's JS `darken()` border calculation with CSS outline.

**R4 — Background blobs invisible**
- User reported "i dont see the blob in the background."
- Root cause: blob gradient colors (`rgba(195,199,166,...)`) were nearly identical to the `--bg` background (`#D0D0CA`), blending in completely.
- Fix: boosted blob gradient opacity to 90%/80%/65% at center, used the accent green (`#C3C7A6`) which has visible contrast against the neutral background.

**R5 — Directional arrows pointing toward text**
- Navigation arrows on "Today" / "This Month" pointed inward toward the label text.
- User flagged: "switch what side the arrow sits so that is not pointing towards the text."
- Fix: swapped arrow positions so they point outward, away from the text, toward where the actual date is.

---

## 4. Successes

**S1 — Widget drag/resize without a library**
- Implemented free-form drag and resize using raw mouse events on `window`, refs for drag/resize state (avoiding stale closures), and functional `setWidgets(prev => ...)` updates. Z-index management via `bringToFront()`. No external drag library needed. Approved without issue.

**S2 — Live palette preview**
- `document.documentElement.style.setProperty()` called on every color picker tick gives instant full-site feedback. `color-mix(in srgb, ...)` for the blob gradients means even the background animation responds live. Revert-on-back via snapshot comparison. Pattern: treat CSS custom properties as a live API surface.

**S3 — Glassmorphism language unified**
- Same `backdrop-filter: blur()` + `rgba(255,255,255,...)` + white border pattern used in the popup, panels, widget picker, and palette popup. Consistent visual language across the entire interface.

**S4 — Event colors driven by CSS variables**
- Switching PALETTE from hardcoded hex to `var(--color-X)` means the browser's CSS engine resolves colors at paint time. No React re-render needed when palette changes — pure CSS reactivity.
