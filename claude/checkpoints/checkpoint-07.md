# Checkpoint 07 — Session 13: Settings Panel & UX Fixes
**Date:** 2026-04-19
**Project:** Reactive Sandbox — AI 201 Project 2
**Status:** Session 13 complete. Full settings panel built with 5 features. Night mode toggle added to palette. Day-click deselect, unmark complete, and other UX fixes landed.

---

## 1. Context Resume

Session 13 built the settings system from scratch and fixed several UX issues surfaced during testing.

**What changed since Checkpoint 06:**

### Settings Panel (5 features)
New `settings` state object in App.jsx:
```js
{
  weekStartDay:   0,        // 0 = Sun, 1 = Mon
  showCompleted:  true,
  hiddenCourses:  [],
  colorCodeBy:    'course', // 'course' | 'type'
  dueSoonEnabled: true,
  dueSoonDays:    3,
}
```

**Week start day** — Segmented Sun/Mon control. Offsets week grid in WeeklyView using `(dayOfWeek - weekStartDay + 7) % 7`. MonthlyView `buildCalendar()` now takes `weekStartDay` and offsets the first-blank-cell count accordingly. Day column headers rotate to match.

**Show completed** — Toggle. Assignments filtered in `visibleAssignments` before being passed to both calendar panels. Filtering happens in App.jsx so DetailView always receives all assignments.

**Toggle classes** — Auto-populated list of all unique course names from `assignments`. Each row has a toggle; hidden courses added to `hiddenCourses[]`. Also filtered in `visibleAssignments`.

**Color code by** — Segmented Course/Type control. WeeklyView and MonthlyView both accept `settings.colorCodeBy`. When `'type'`, color is looked up via a `TYPE_PALETTE` map keyed on `item.type.toLowerCase()` (exam, quiz, homework, project, reading, essay, lab, other). When `'course'`, original behavior.

**Due-soon highlight** — Toggle + +/− day counter (1–14, default 3). Cards/events where `dueDate` is between today and threshold get a `due-soon` class → left accent border in `--color-7`. Applied in both WeeklyView and MonthlyView.

**Settings UI** — Glass popup at 272px. Two sections (Calendar, Courses) with section labels. Toggle switches, segmented controls, +/− counter, course list with overflow ellipsis. `settings-coming-soon` placeholder removed.

### Night Mode (palette popup)
- Toggle row added to the palette list view between the palette list and "New Palette" button.
- `nightMode` state lives in DetailView; a `useEffect` toggles `night-mode` class on `<html>`.
- `index.css` `.night-mode` block overrides all relevant CSS variables: dark bg (`#1C1C1A`), dark surfaces, inverted text, muted accents.
- `PalettePopup` accepts `nightMode` + `onToggleNightMode` props.

### UX Fixes
- **Day-click deselect**: `handleSelectDay` in App.jsx now checks if the tapped date matches `selectedDay.date`. If same → clears to idle. If different → selects new day.
- **Unmark complete**: `onComplete` in App.jsx now toggles `completed` (was always `true`). DetailView button reads "Unmark Complete" when `selectedItem.completed`, "Mark Complete" otherwise. `selectedItem` is kept in sync after toggle.

---

## 2. Human Directions

Steps to reproduce from Checkpoint 06:

1. **`src/App.jsx`**: Add `settings` state + `updateSetting()` helper. Add `allCourseNames` derived value. Add `visibleAssignments` filtered by `showCompleted` and `hiddenCourses`. Pass `visibleAssignments` + `settings` to WeeklyView and MonthlyView. Replace settings popup body with full sectioned UI (segmented controls, toggles, day counter, course list). Fix `handleSelectDay` to toggle on same-day click. Fix `onComplete` to toggle.
2. **`src/App.css`**: Expand settings popup to 272px. Add `.settings-section-label`, `.settings-row`, `.settings-row-sub`, `.settings-row-label`, `.settings-course-name`, `.settings-toggle` + knob, `.settings-segment` + btn, `.settings-day-input-wrap` + btn + count, `.settings-course-list`, `.settings-empty-courses`.
3. **`src/components/WeeklyView/WeeklyView.jsx`**: Accept `settings` prop. Add `DAYS_SUN`/`DAYS_MON`, `TYPE_PALETTE`, updated `buildColorMap(assignments, colorCodeBy)` (keyed by `item.id`). Apply `weekStartDay` offset to startOfWeek. Fix `dayItems` filter to use `(weekStartDay + i) % 7`. Add `isDueSoon` check + `due-soon` class.
4. **`src/components/WeeklyView/WeeklyView.css`**: Add `.assignment-card.due-soon` left border.
5. **`src/components/MonthlyView/MonthlyView.jsx`**: Accept `settings` prop. Add `DAY_LABELS_SUN`/`MON`, `TYPE_PALETTE`, updated `buildColorMap`. Pass `weekStartDay` to `buildCalendar()`. Add `isDueSoon` + `due-soon` class.
6. **`src/components/MonthlyView/MonthlyView.css`**: Add `.month-event.due-soon` left border.
7. **`src/components/DetailView/DetailView.jsx`**: Add `nightMode` state + `useEffect` toggling `html.night-mode`. Add `nightMode`/`onToggleNightMode` to `PalettePopup` props. Add night mode toggle row in list view JSX. Update "Mark Complete" button to show "Unmark Complete" conditionally.
8. **`src/components/DetailView/DetailView.css`**: Add `.palette-night-row`, `.palette-night-label`, `.palette-night-toggle` + knob styles.
9. **`src/index.css`**: Add `html.night-mode { ... }` block overriding all color/surface/text tokens.

---

## 3. Records of Resistance

**R1 — colorMap keyed by courseName caused type-mode collision**
- When `colorCodeBy === 'type'`, different courses with the same type would need the same map entry. Switched colorMap to be keyed by `item.id` in both views.

---

## 4. Successes

**S1 — Settings fully live**
All 5 settings reactively affect the calendar views with no page reload. `visibleAssignments` filtering in App.jsx keeps the logic centralized.

**S2 — Night mode via CSS variable cascade**
Single class toggle on `<html>` flips the entire app's color scheme. No component-level theming needed.
