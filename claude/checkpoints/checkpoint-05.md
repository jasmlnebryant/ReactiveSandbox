# Checkpoint 05 — Session 11: Top Bar, Popups & Smart To-Do Upload
**Date:** 2026-04-17
**Project:** Reactive Sandbox — AI 201 Project 2
**Status:** Session 11 complete. Top bar added with upload, palette, and settings icons. All popups layer correctly above panels. OCR-powered image-to-to-do upload working.

---

## 1. Context Resume

Session 11 milestone: surface-level UI polish and two new feature systems — a persistent top bar with globally-accessible icons, and an image upload flow that uses Tesseract.js OCR to pre-fill to-do items from a photo.

**What changed since Checkpoint 04:**

### Detail View — Item Display & Editing Fixes
- **Title cutoff fixed**: Added `flex-shrink: 0` and `white-space: normal` to `.detail-title` — was being compressed in the flex column layout.
- **Text overflow**: Added `overflow-wrap: break-word` to `.detail-title` and `.detail-field-value`.
- **Professor "information" bug**: `extractProfessor()` now blocks placeholder words ("information", "name", "contact", "tbd", etc.) via `NOT_A_NAME` regex.
- **Pencil/edit icon in item mode**: When an item is selected, the `+` widget button swaps for a pencil. Clicking it opens an inline edit form with all six schema fields. Saving calls `onEdit` in App.jsx, which updates assignments in state and keeps the item selected.
- **Edit form CSS**: `.edit-input`, `.edit-textarea`, `.edit-field`, `.edit-field-label` classes added.

### Custom Date/Time Picker
- Native `<input type="date">` replaced with `DateTimePicker` component in the edit form.
- Uses `ReactDOM.createPortal` to `document.body` to escape `backdrop-filter` containing block (same root cause as the palette popup fix).
- Month navigation, 7-column day grid, today highlighted, selected day filled with `--color-6`.
- Time picker inside the popup at the bottom under a divider ("Time (optional)").
- `dueTime` stored as separate `'HH:MM'` string on assignments; `formatDueDate(date, time)` shows it as "Mon, April 20, 2026 at 2:30 PM" when set.

### Top Bar
- `app-layout` changed from `flex-row` to `flex-column`.
- `.top-bar` glass panel (same `backdrop-filter: blur(16px)`, white glass border, shadow) at the top, 46px tall.
- `.main-row` wraps the left column + detail panel below it.
- Top bar uses `justify-content: space-between` — icons on left and right.

### Upload Icon (top-left)
- `UploadIcon` button in `.topbar-left`.
- Clicking opens a small glass dropdown (portaled to `document.body`, `position: fixed`) with two options:
  - **Syllabus** + faded "PDF" tag → triggers existing PDF syllabus parse flow.
  - **To-Do List** → opens image file picker → OCR flow.
- Upload menu styled as `.upload-menu-popup` with `.upload-menu-item` rows.

### Palette Icon (moved to top bar)
- Palette button is now portaled from DetailView into `#topbar-palette-slot` div in the top bar.
- Always visible regardless of detail panel mode (was previously only shown in 'idle' mode).
- Palette popup converted to `position: fixed` + portaled to `document.body` — fixes it rendering under the detail panel (`backdrop-filter` stacking context issue).
- Outside-click handler updated to check both button ref and popup ref.

### Settings Icon (top-right)
- `SettingsIcon` (gear SVG) button in `.topbar-right`.
- Clicking opens a glass popup (portaled to `document.body`, `position: fixed`) with "Settings" header and "More options coming soon." placeholder.
- Icon gets `.active` fill while popup is open.

### Backdrop-Filter Portal Pattern (established)
- Root cause identified: any `position: fixed` or `position: absolute` popup inside an ancestor with `backdrop-filter` is trapped in that stacking context and renders behind other panels.
- Fix pattern: calculate button position with `getBoundingClientRect()`, portal popup to `document.body` with `position: fixed` using those coordinates.
- Applied consistently to: DateTimePicker, PalettePopup, upload menu, settings popup.

### OCR-Powered To-Do List Upload
- `tesseract.js` installed as dependency.
- Flow: user selects image → modal opens immediately with preview + "Reading your list…" spinner → Tesseract OCR runs client-side → extracted lines pre-fill item rows → user edits before saving.
- `parseOcrLines()` strips common to-do markers (`- `, `• `, `□ `, `1.`, etc.), deduplicates, filters single-char noise.
- Each item row: name input (pre-filled) + optional date input + × remove.
- Submit routes each item individually:
  - Row has date → creates assignment (appears in weekly/monthly views), color `var(--color-4)`, courseName `'Personal'`.
  - Row has no date → goes to `pendingTodoItems` → consumed by DetailView useEffect → added to todo widget (creates one if none exists).
- Toast confirms routing: e.g. "2 items added to your schedule · 3 items added to your to-do list."
- OCR failure gracefully falls back to one blank editable row.

### Bridge: App → DetailView Todo Items
- `pendingTodoItems` state in App.jsx (array of `{ text }` objects).
- Passed to DetailView as prop alongside `onTodoConsumed` callback.
- DetailView useEffect watches `pendingTodoItems`: finds existing todo widget or creates one at position (8, 8) with dimensions 194×214, then calls `onTodoConsumed()` to clear the queue.

---

## 2. Human Directions

Steps to reproduce from Checkpoint 04:

1. **`src/App.jsx`**: Add `Tesseract` import. Add refs: `uploadBtnRef`, `imageInputRef`, `settingsBtnRef`. Add states: `uploadMenuOpen/Pos`, `imageForm`, `pendingTodoItems`, `toast`, `settingsOpen/Pos`. Add handlers: `handleUploadMenuToggle`, `handleImageFileSelected`, `parseOcrLines`, `addImageItem`, `removeImageItem`, `updateImageItem`, `handleImageTaskSubmit`, `handleSettingsToggle`. Add useEffects: toast auto-dismiss (3.5s), upload menu outside-click, settings outside-click. Update JSX: top bar with `topbar-left` (upload btn) and `topbar-right` (palette slot + settings btn); wrap panels in `main-row`; add portals for upload menu, settings popup; add image form overlay; add toast. Pass `pendingTodoItems` + `onTodoConsumed` to DetailView. Add icons: `UploadIcon`, `DocIcon`, `ImageIcon`, `SettingsIcon`.

2. **`src/App.css`**: Change `.app-layout` to `flex-column`. Add `.top-bar` (glass, 46px, `space-between`). Add `.topbar-left/right`. Add `.main-row` (flex-row, `flex: 1`, `min-height: 0`). Add `.topbar-icon-btn` + `.active` state. Add `.upload-menu-popup` + `.upload-menu-item`. Add `.img-form-*` styles (overlay, card, preview, fields, item-row, loading spinner, actions, buttons). Add `.settings-popup` styles. Add `.toast-notification` + `@keyframes toast-in`. Add `@keyframes spin` for the OCR spinner.

3. **`src/components/DetailView/DetailView.jsx`**: Add `pendingTodoItems`, `onTodoConsumed` to props. Add `palettePopupPos` state and `palettePopupRef`. Add `paletteSlot` state + useEffect to grab `#topbar-palette-slot`. Add `handlePaletteToggle` (captures button rect). Split palette portal: button → slot, popup → `document.body` with `position: fixed`. Update outside-click to check both refs. Add `DateTimePicker` component (with `ReactDOM.createPortal` popup). Update `formatDueDate` to accept `time` param. Update `startEditing`/`saveEdit` to handle `dueTimeStr`. Add useEffect to consume `pendingTodoItems` (find/create todo widget). Add `PencilIcon` component. Swap `+` for pencil in item mode header.

4. **`src/components/DetailView/DetailView.css`**: Add `.detail-edit-form`, `.edit-field`, `.edit-field-label`, `.edit-input`, `.edit-textarea`. Add `.dtp-*` calendar popup styles. Fix `.palette-btn-wrap` to `position: relative`. Remove position/offset from `.palette-popup` (now injected via `style` prop).

5. **`src/utils/parseSyllabus.js`**: Add `NOT_A_NAME` blocklist to `extractProfessor()` to reject placeholder words.

---

## 3. Records of Resistance

**R1 — Popups rendering under panels**
- Root cause: `backdrop-filter` on `.panel` creates a new CSS stacking context. Any `position: fixed` or `position: absolute` popup inside a panel is positioned relative to that panel, not the viewport — so it renders behind sibling panels.
- Fix: portal all popups to `document.body` with `position: fixed` and coordinates from `getBoundingClientRect()`.
- Affected: PalettePopup, DateTimePicker, upload menu, settings popup.

**R2 — Title still cut after first fix**
- `overflow-wrap: break-word` wasn't enough. The `<p>` was being compressed in the flex column because of default `flex-shrink: 1`.
- Fix: `flex-shrink: 0` + `white-space: normal` on `.detail-title`.

---

## 4. Successes

**S1 — Tesseract.js OCR pipeline**
- Client-side OCR (no API key) extracts text from uploaded images, parses lines into to-do items, strips common list markers, deduplicates, pre-fills the form. Falls back to blank row on failure.

**S2 — Dual-routing item submit**
- Single submit handler routes each item to either the calendar (if date set) or the todo widget (if no date), with a smart combined toast message.

**S3 — `#topbar-palette-slot` portal pattern**
- DetailView owns all palette state/logic but renders the button into a DOM node in App.jsx's top bar via `ReactDOM.createPortal`. Clean separation without lifting state.
