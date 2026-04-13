# Checkpoint 01 — Project Setup & Design Intent
**Date:** 2026-04-13
**Project:** Reactive Sandbox — AI 201 Project 2
**Status:** Session 7 complete. PRD fully written. No code written yet. Next: Session 8 (Wed 4/15) — build three isolated components, layout and structure first.

---

## 1. Context Resume

This is the first session of Project 2: The Reactive Sandbox. No prior code exists. The session was entirely setup and design intent documentation.

The project is a productivity/academic calendar website with three connected panels sharing centralized state. Users upload a class syllabus and it auto-populates the calendar. There are two item types: Assignments (pulled from syllabus) and Tasks (user-created).

**What changed since Checkpoint 00 (project start):**

- **Checkpoint system created:** `claude/checkpoints/` folder created at `ReactiveSandbox/ReactiveSandbox/claude/checkpoints/`.
- **PRD created and fully populated:** `claude/docs/Assignment_PRD.md` written from scratch using the Edumon PRD outline as a reference. All sections filled in by the user.
- **Three panels defined:**
  - **Weekly View (Browser)** — to-do list style. Items display: assignment/task name (highest hierarchy), due date (mid), class/type name (low). Color-coded by class/type. Clicking an item highlights it (3px border, same color as item at 50% darker, curved to match card) and loads the Detail View. Functions as a checkable/clearable to-do list.
  - **Detail View** — shows full item info (class/type name, professor, due date, description, point/% value, submission type) plus options menu (complete, edit, delete). When nothing is selected, shows a decorative widget state (real-time clock, image, or gif — TBD). Slides in from right to left on selection.
  - **Monthly View (Controller)** — styled similarly to Google Calendar (reference: `claude/references/monthly view.png`). Due dates shown at higher hierarchy; daily tasks at lower hierarchy. Clicking a day/week does NOT change the weekly view. State changes only when user edits an item in the Detail View. A "jump to?" button appears on the weekly view so the user can navigate to the week of a selected item.
- **Data model defined:**
  - Assignment fields: class name, professor, assignment title, due date, due time, description, point/percentage value, assignment type, completion status.
  - Task fields: task name, due date, due time, description, importance value (low/medium/high), task type (user-defined), completion status.
  - State architecture: single source of truth in parent app component. All three panels read from parent via props.
- **Interaction rules defined:**
  - Selection: 3px border at item color darkened 50%, curved to match card. Detail View slides in right to left.
  - Default/empty state: all three panels visible but blurred at 30%. First-layer prompt box asks user to upload syllabus or create a task.
  - "Jump back" button appears on weekly/monthly when user has navigated away from the current week/month.
- **Non-negotiables locked:** layout matches sketch, palette locked unless user changes it, due date always visible at a glance, Detail View always visible (detail or decorative state), current week/month default with jump-back button.
- **Color palette set:** soft neutrals from `claude/references/color pallete.png` — `#EEF1DE`, `#E9ECCF`, `#D9E4E0`, `#F1F0C8`, `#ECE9BE`, `#C3C7A6`, `#D7C59F`. User-selectable themes planned for later.
- **Layout reference set:** `claude/references/panel layout.pdf` — weekly top-left, monthly bottom-left, detail panel full-height on the right.
- **System name:** TBD.

**Production pipeline stage:** Pre-Stage — Design Intent ✓

---

## 2. Human Directions

Steps to reproduce from project start:

1. Create folder `claude/checkpoints/` at `ReactiveSandbox/ReactiveSandbox/claude/checkpoints/`.
2. Copy `checkpoint-instructions.md` into `claude/docs/` (already present from project scaffold).
3. Open `claude/docs/Assignment_PRD.md` — this file was empty at session start.
4. Using the Edumon PRD (`/Users/jas/Desktop/SCAD AI/CharacterSelectScreen - [NEW]/CharacterSelectScreen/claude/docs/Edumon PRD - CharacterSelectScreen.md`) as the outline reference, populate `Assignment_PRD.md` with all sections as written. Refer to the final file for exact content.
5. Reference files used this session:
   - `claude/references/color pallete.png` — starting color palette
   - `claude/references/panel layout.pdf` — three-panel layout sketch (weekly top-left, monthly bottom-left, detail right)
   - `claude/references/monthly view.png` — Google Calendar-style monthly view reference

---

## 3. Records of Resistance

None this session.

---

## 4. Successes

**S1 — PRD fully completed in one session**
- The Edumon PRD outline translated cleanly to this domain. Adapting the prompts to the academic calendar domain before the user answered them helped produce specific, useful answers rather than generic ones. Pattern worth reusing: tailor prompt language to the domain before asking the user to fill in a section.
