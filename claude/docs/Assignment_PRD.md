# Reactive Sandbox — Three-Panel System
**AI 201 — Project 2 | SCAD Spring 2026**

---

## Design Intent

**Concept**
System: Productivity / academic calendar.
Domain: Website
Problem: Certain productivity / calendar websites and iOS apps do not have simple systems to upload class syllabi that can be directly imported to the website / app. For example, with Notion, I have to manually create a calendar and put in all of the individual professors, classes, details, etc. 
Solution: Creating something similar to Notion / Google Calendar where the user can directly upload a class syllabus to the website, and the information will automatically be downloaded and updated. 

**Screen Title / System Name**
> *What do you want to call this thing? Does it have a name beyond "Reactive Sandbox"?*
TBD

**Mood**
Calming while encouraging productivity; clean.

**Color**
Color schemes within the website can be changed to better compliment the user's mood. To start, the color pallete will be the one in '/Users/jas/Desktop/SCAD AI/ReactiveSandbox/ReactiveSandbox/claude/references/color pallete.png'

**Typography**
Clean and legible. Details like class name, assignment name, and due date will have a higher hierarchy compared to other details like assignment details and professor name.

**Layout**
The three panels will be a weekly calendar view, monthly calendar view, and detailed view (for example, if the user selects a specific assignment / to-do on the calendar, specific details will show in the panel). As of right now, panels will be arranged with weekly at the top, monthly underneath, and detail on the right side. Refer to '/Users/jas/Desktop/SCAD AI/ReactiveSandbox/ReactiveSandbox/claude/references/panel layout.pdf'. headers / subheaders are not included in the sketch.

---

## The Three Panels

**The Browser — Weekly View**
The weekly view will help the user plan their productivity for the week (ie. what assignments and tasks they will work on a certain day). It functions as a clean to-do list that the user can check/clear off the view. At a glance, an item will have the assignment/task name (highest hierarchy), due date (mid hierarchy), and class/type name (low hierarhcy); will be color coded based on class/type. When the user clicks on an item, the item will be highlighted and the details panel will show additional information for the assignment/task as well as the options menu for it (clearing/completeing the task, changing details, deleting it, etc).

**The Detail View**
When the user clicks an assignment/task in the weekly or monthly view, the details panel will show additional information for the assignment/task (class/type name, professor, due date, assignment/task description, point value, submission type) as well as the options menu for it (clearing/completeing the task, changing details, deleting it, etc). before the panel shows, it will be a decorative widget panel -- could include a real-time clock, image, or gif.

**The Controller — Monthly View**
The monthly view will be a calendar that looks similar to '/Users/jas/Desktop/SCAD AI/ReactiveSandbox/ReactiveSandbox/claude/references/monthly view.png'. higher hierarchy like due date will be more visible. to-do / daily tasks will be lower hierarchy. when the user clicks a day or week in the monthly calendar, nothing changes in the weekly -- unless the user edits information for an item within the detail panel.

---

## Data Model

**The Assignment (primary item)**
Information will be taken from the uploaded syllabus/syllabi from the user:
Class name, professor, assignment title, due date, due time, description, point/percentage value, assignment type (quiz, essay, reading, etc), & completion status.

**The Task (secondary item)**
Information will be taken from the user that fills out the information on their own:
Task name, due date, due time, description, importance value (out of 3 -- low, medium, high), task type (user will create these), & completion status.

**State Fields**
The parent component is the app itself. for every piece of data, exactly one component (weekly, monthly, detail) "owns" it. every other component that needs/displays it gets a copy via props (this prevents contradictions and makes the system more predictable/efficient). an item that gets changed in the detail panel, is changing the parent component and thus changing the other components with it.

---

## Interaction Rules

**Selection Behavior**
When selected, the item will have a border around it that matches its color, but 50% darker. the border will be 3px. the item's card will have curved edges, the border will match that. the detail view slides in from right to left. If the user does not have an item selected, the detail view will not show details, instead it will be its decorative state.

**Controller Behavior**
When the user clicks a day or week in the monthly calendar, nothing changes in the weekly -- unless the user edits information for an item within the detail panel. there will be a button that pop's up on the weekly's view that says "jump to?". if the user selects this, then the weekly view will shift (ie. swiping to the week that that assignment/task is on, if the weekly view is not already on that week).

**Empty / Default State**
Each panel is visible, but blurred at 30%. On the first layer, there will be a box prompting the user to either upload a syllabus/syllabi, or beginning to create tasks.

---

## What I Will Not Compromise On
Layout must match sketch exactly (for now), color pallete cannot change unless the user selects a different pallete, assignment items must always show the due date at a glance, the detail view must always be visible -- either in its detail state, or decorative state, the monthly and weekly view must always reflect the current week/month, unless moved to a different one by the user (the user can "jump back" to the current week/month by clicking a button that shows up after the user has left the current week/month).

---

## Production Pipeline
1. **Session 8 (Wed 4/15)** — Forging the Prefabs. Three isolated components, layout and structure first.
2. **Session 9 (Mon 4/20)** — First Playable. State centralized, cross-panel reactivity working.
3. **Session 10 (Wed 4/22)** — Faking the Lore. JSON data generated to populate the system.
4. **Session 11 (Mon 4/27)** — The Juice. Micro-interactions, transitions, polish.
5. **Session 12 (Wed 4/29)** — Studio Crit + Final Submission.

---

## Mermaid Diagram
classDiagram
    class Assignment {
        +String id
        +String name
        +String courseName
        +String type
        +String dueDate
        +String dueTime
        +String professor
        +String weight
        +Boolean completed
        +String notes
    }

    class Palette {
        +String id
        +String name
        +PaletteColor[] colors
    }

    class PaletteColor {
        +String key
        +String value
    }

    class Widget {
        +String id
        +String type
        +Number x
        +Number y
        +Number width
        +Number height
    }

    class TodoItem {
        +String id
        +String text
        +Boolean completed
    }

    class Settings {
        +Number weekStartDay
        +String colorCodeBy
        +Boolean dueSoonEnabled
        +Number dueSoonDays
    }

    class DaySelection {
        +Date date
        +Assignment[] items
    }

    class AddDraft {
        +String name
        +String courseName
        +String type
        +String professor
        +String weight
        +String dueDate
        +String dueTime
        +Boolean courseIsNew
        +Boolean typeIsNew
        +Boolean professorIsNew
    }

    Palette "1" --> "1..*" PaletteColor : contains
    DaySelection "1" --> "0..*" Assignment : references
    AddDraft ..> Assignment : becomes

---

## AI Direction Log
*(3–5 entries — updated throughout the project)*

---

## Records of Resistance
*(3 moments — updated throughout the project)*

---

## Five Questions Reflection
*(Completed before final submission)*
