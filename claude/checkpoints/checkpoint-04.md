# Checkpoint 04 — Session 10: Schema Enforcement & Date Fix
**Date:** 2026-04-15
**Project:** Reactive Sandbox — AI 201 Project 2
**Status:** Session 10 complete. Six-field assignment schema enforced in parser. Date parsing bug resolved. Detail view updated to display all schema fields. Ready for next milestone.

---

## 1. Context Resume

Session 10 milestone: enforce the mandatory six-field schema for syllabus-parsed assignments and fix the longstanding date parsing bug. The session started by continuing from checkpoint-03 where glassmorphism, widgets, palette editor, and background blobs were all functional.

**What changed since Checkpoint 03:**

### Syllabus Parser — Six-Field Schema Enforcement
- `src/utils/parseSyllabus.js` fully rewritten to guarantee every parsed assignment includes all six required fields:
  1. **Name** — cleaned assignment name with date fragments stripped
  2. **Due Date** — extracted via multi-pattern date matching with plausibility checks
  3. **Class / Professor** — `extractProfessor(lines)` scans the first 50 lines for "Instructor:", "Professor:", "Dr./Prof." patterns; `extractCourseName(lines, filename)` uses a 5-tier fallback (label → code+title → code → first clean line → filename)
  4. **Instructions / Deliverables** — `extractInstructions(lines, startIndex)` reads up to 4 lines after the assignment for descriptive content
  5. **Type** — `guessAssignmentType()` returns capitalized strings ("Exam", "Quiz", "Essay", "Project", "Reading", "Lab", "Assignment", "Discussion") or "N/A"
  6. **Weight** — `extractWeight(line, surroundingLines)` matches `X%` or `X points/pts` patterns
- All fields default to `'N/A'` when not found, never `undefined` or empty.

### Detail View — All Schema Fields Displayed
- Professor field is now always shown (no longer conditional on truthy value), falls back to `'N/A'`.
- New **Weight** field added to the detail fields section.
- New **Instructions** field added — only rendered when present and not `'N/A'`, styled with secondary text color and `pre-wrap` for multi-line readability.
- New CSS class `.detail-instructions` for instruction text styling.

### Date Parsing Bug — Root Cause Fixed
- **Root cause:** `extractPdfText.js` line 17 joined all text items on a PDF page into a single string with spaces (`content.items.map(item => item.str).join(' ')`). This destroyed the line structure of the PDF, producing one enormous "line" per page.
- The parser expected line-by-line input. When it found an assignment keyword anywhere in the page blob, `extractDatesFromLine` grabbed every date on the entire page and `allDates[0]` always picked the first one — typically a section/week header date (e.g., "Week of April 14") rather than the assignment's actual due date.
- **Fix:** `extractPdfText.js` now reconstructs actual text lines using each PDF text item's y-position (`transform[5]`). Items within 2px vertically are grouped as the same row; a y-shift greater than 2px starts a new line. Items are sorted top-to-bottom then left-to-right. The parser now receives proper line-by-line text that preserves the original document structure.

---

## 2. Human Directions

Steps to reproduce from Checkpoint 03:

1. **`src/utils/parseSyllabus.js`**: Full rewrite — add `extractProfessor()`, `extractInstructions()`, `extractWeight()`, `extractCourseName()` with multi-tier fallbacks, `guessAssignmentType()` with capitalized returns. Every assignment object must include `id`, `name`, `dueDate`, `courseName`, `professor`, `instructions`, `type`, `weight`, `completed`, `source`.
2. **`src/utils/extractPdfText.js`**: Replace `content.items.map(item => item.str).join(' ')` with y-position-based line reconstruction. Sort items by descending y then ascending x. Group items within 2px y-tolerance as same line. Insert `\n` on y-position shifts.
3. **`src/components/DetailView/DetailView.jsx`**: In the item detail section, make Professor field unconditional (with `|| 'N/A'` fallback). Add Weight field. Add Instructions field (conditional on presence and not `'N/A'`).
4. **`src/components/DetailView/DetailView.css`**: Add `.detail-instructions` class with `font-size: 12px`, `line-height: 1.5`, `color: var(--text-secondary)`, `white-space: pre-wrap`.

---

## 3. Records of Resistance

**R1 — Date parsing bug (longstanding)**
- All/most assignments were landing on April 14, 2026 regardless of actual syllabus dates.
- Root cause identified in `extractPdfText.js`: `join(' ')` destroyed PDF line structure, causing the parser to always grab the first date on the page (a section header) instead of per-assignment dates.
- Fix: y-position-based line reconstruction using `transform[5]` from PDF.js text items.

---

## 4. Successes

**S1 — Y-position line reconstruction**
- Using `transform[5]` (y-coordinate) and `transform[4]` (x-coordinate) from PDF.js text content items to reconstruct the original line structure of the document. 2px tolerance handles minor vertical alignment differences. Sort by descending-y then ascending-x preserves natural reading order. No external library needed.

**S2 — Six-field schema with graceful fallbacks**
- Every field has a multi-strategy extraction function with `'N/A'` default. `extractCourseName` uses 5 tiers (label → code+title → code → first clean line → filename). `extractProfessor` checks both labeled patterns and standalone title patterns. No field is ever undefined.
