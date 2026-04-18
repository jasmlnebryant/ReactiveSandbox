# Checkpoint 06 — Session 12: Calendar UX, Get Started Overhaul & Palette Polish
**Date:** 2026-04-17
**Project:** Reactive Sandbox — AI 201 Project 2
**Status:** Session 12 complete. Shared DateTimePicker component, day-click detail view, get-started screen upgrades, course rename prompt, palette bug fixes.

---

## 1. Context Resume

Session 12 built on the top bar and OCR upload system from Session 11. Focus areas: extracting the DateTimePicker into a shared component, making calendar days clickable, overhauling the get-started screen flow, adding a course rename confirmation, and fixing several palette popup bugs.

**What changed since Checkpoint 05:**

### Shared DateTimePicker Component
- `src/components/DateTimePicker.jsx` — extracted from the inline definition in DetailView. Accepts `hideTime` prop to suppress the time row.
- `src/components/DateTimePicker.css` — all `.dtp-*` styles moved here. `.dtp-trigger` now carries its own visual styles (background, border, padding, etc.) so the component is fully self-contained.
- `DetailView.jsx` — replaced ~140 lines of inline `MONTH_NAMES / DAY_LABELS / CalIcon / DateTimePicker` with `import DateTimePicker from '../DateTimePicker'`.
- `App.jsx` — image-upload form item rows now use `<DateTimePicker hideTime …/>` instead of `<input type="date">`, wrapped in a sizing div.

### Calendar Always Starts on Current Week/Month
- `handleDismiss` simplified to just `setWeekOffset(0); setMonthOffset(0)` — removed the "jump to nearest upcoming assignment" logic.

### Day-Click → Detail Panel
- **WeeklyView**: `onSelectDay` prop added. Each `.day-column` has an `onClick` that fires `onSelectDay({ date, items })`. Item cards use `e.stopPropagation()`. Columns get a subtle hover highlight.
- **MonthlyView**: Each `.month-cell` now has an `onClick` calling `onSelectDay`. Events `stopPropagation`. The `...more` button replaced with a passive `+N more` span (cell click handles it).
- **DetailView**: Shows day view when `selectedDay` is set. Added empty-state message "No items due this day." for days with zero items.
- **App.jsx**: `onSelectDay={handleSelectDay}` now passed to WeeklyView as well as MonthlyView.

### Get Started Screen Overhaul
- Idle state: replaced "Create a Task" with **Upload To-Do List** (triggers image OCR flow directly). Added **Skip to Calendar** text link below — uppercase, weight 600, same style as OR label, no divider.
- Success state title: `"Done."` → `"Uh oh."` when all files failed to parse.
- Success state eyebrow: `"Upload complete"` → `"Something went wrong"` when all files failed.
- Success state actions: when all courses errored → shows same three get-started buttons (Upload Syllabus / OR / Upload To-Do List / Skip to Calendar). When at least one succeeded → keeps View Schedule / Upload More.
- Error rows now show a **trash icon** instead of the pencil. Clicking it removes that entry from `processedCourses` via `handleDeleteCourse(i)`.

### Course Rename Confirmation
- When saving an edited item where `courseName` changed, `saveEdit()` intercepts and sets `courseRenamePrompt` state instead of calling `onEdit` immediately.
- A frosted-glass overlay appears over the detail panel: *"Change [Old] to [New] for all items in this course, or just this one?"*
- **All items** → calls `onEdit(updated)` + `onRenameCourse(oldName, newName)` (bulk rename in App.jsx).
- **Just this one** → calls `onEdit(updated)` only.
- New `onRenameCourse` prop in DetailView; new `TrashIcon` SVG component in App.jsx.

### Palette Popup Fixes
- **New Palette / Edit Palette views were invisible**: `style={style}` (carrying `position: fixed` + coordinates) was only applied to the list view return. Added to create and edit views.
- **Click-outside unsaved changes**: `PalettePopup` converted to `React.forwardRef`. `useImperativeHandle` exposes `tryClose()`. Outside-click handler in DetailView now calls `paletteComponentRef.current?.tryClose()` instead of `setPaletteOpen(false)` directly. If there are unsaved changes, shows the confirm overlay with "Save your changes before closing?" message. `confirmingBack` state promoted to `confirmMode: null | 'back' | 'close'` to distinguish the two flows.
- **Palette button styling**: removed `backdrop-filter` and aligned all values to exactly match `.topbar-icon-btn` (background `rgba(255,255,255,0.5)`, shadow `0 2px 8px rgba(0,0,0,0.06)`, identical transition).

---

## 2. Human Directions

Steps to reproduce from Checkpoint 05:

1. **`src/components/DateTimePicker.jsx`** (NEW): Extract shared component with `hideTime` prop. Remove `edit-input` from trigger className — styles now self-contained in `.dtp-trigger`.
2. **`src/components/DateTimePicker.css`** (NEW): Move all `.dtp-*` styles here. Add full visual styles to `.dtp-trigger` (background, border, border-radius, padding, font, width, box-sizing).
3. **`src/components/DetailView/DetailView.css`**: Remove the entire `.dtp-*` block. Add `.detail-day-empty` italic style.
4. **`src/components/DetailView/DetailView.jsx`**: Add `import DateTimePicker from '../DateTimePicker'`. Remove inline definitions. Convert `PalettePopup` to `React.forwardRef`; change `confirmingBack: bool` → `confirmMode: null|'back'|'close'`; expose `tryClose()` via `useImperativeHandle`; add `onClose` prop. Add `paletteComponentRef`; update outside-click to call `paletteComponentRef.current?.tryClose()`. Add `courseRenamePrompt` state + `commitEdit(renameAll)`. Add `onRenameCourse` prop. Apply `style={style}` to create/edit palette view returns.
5. **`src/components/WeeklyView/WeeklyView.jsx`**: Add `onSelectDay` prop + `fullDate` in `weekDates`. Add `onClick` to `.day-column`, `e.stopPropagation()` on cards.
6. **`src/components/WeeklyView/WeeklyView.css`**: Add `cursor: pointer` + hover background to `.day-column`.
7. **`src/components/MonthlyView/MonthlyView.jsx`**: Add `onClick` to `.month-cell`. `e.stopPropagation()` on events. Change `...more` button to passive `+N more` span.
8. **`src/components/MonthlyView/MonthlyView.css`**: Add `cursor: pointer` to `.month-cell`. Remove button styles from `.month-more-btn`; make it `pointer-events: none`.
9. **`src/App.jsx`**: Import `DateTimePicker`. Replace `<input type="date">` in image form with `<DateTimePicker hideTime …/>` wrapper. Simplify `handleDismiss` to reset offsets to 0. Pass `onSelectDay` to WeeklyView. Update idle-state actions (Upload To-Do List + Skip to Calendar). Add `processedCourses.every(c => c.error)` conditionals for title/eyebrow/actions. Add `handleDeleteCourse`. Add `TrashIcon`. Add `onRenameCourse` prop to DetailView. Add `prompt-btn-skip` CSS class.
10. **`src/App.css`**: Add `.prompt-btn-skip` styles (uppercase, weight 600, tertiary color). Add `.course-delete-btn` styles (red hover).

---

## 3. Records of Resistance

**R1 — New Palette view invisible after click**
- Root cause: `style={style}` (position: fixed + coords) was only on the list-view `return`. Create and edit views returned bare `<div className="palette-popup">` without it, so they rendered at 0,0 off-screen.
- Fix: add `style={style}` to all three return statements.

**R2 — Click-outside bypassed unsaved-changes check**
- Root cause: DetailView's outside-click handler called `setPaletteOpen(false)` directly, never consulting PalettePopup's internal `hasChanges()`.
- Fix: `forwardRef` + `useImperativeHandle` to expose `tryClose()`. Outside-click calls that instead.

**R3 — Native date picker showing in image form**
- Root cause: The `type="date"` replacement with `DateTimePicker` was done in code but browser had cached an older build.
- Fix: hard reload (Cmd+Shift+R).

---

## 4. Successes

**S1 — Self-contained DateTimePicker**
- Component owns all its styles; works identically in DetailView edit form and App.jsx image upload form with no class dependencies from host components.

**S2 — Day-click UX**
- Clicking any day column (weekly) or cell (monthly) shows all items for that day in the detail panel. Item cards still work normally via stopPropagation.

**S3 — Get-started error flow**
- Full parse failure now gives the user a clear "Uh oh. / Something went wrong" screen with the same upload options as the start, rather than a misleading "Done." with "View Schedule".
