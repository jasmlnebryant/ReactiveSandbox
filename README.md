# Reactive Sandbox

AI 201 · Project 2 — Three-panel reactive UI built in React.

## Data Architecture

```mermaid
classDiagram
  class App {
    +assignments : Assignment[]
    +visibleAssignments : Assignment[]
    +selectedItem : Assignment
    +selectedDay : DayInfo
    +weekOffset : number
    +monthOffset : number
    +settings : Settings
  }

  class Assignment {
    +id : string | number
    +name : string
    +dueDate : Date | string
    +dueTime : string
    +courseName : string
    +professor : string
    +type : string
    +weight : string
    +instructions : string
    +completed : boolean
    +source : string
    +color : string
  }

  class Settings {
    +weekStartDay : 0 | 1
    +showCompleted : boolean
    +hiddenCourses : string[]
    +colorCodeBy : "course" | "type"
    +dueSoonEnabled : boolean
    +dueSoonDays : number
  }

  class WeeklyView {
    +weekOffset : number
    +selectedItem : Assignment
    reads visibleAssignments
    writes via onUpdate / onComplete / onDelete
  }

  class MonthlyView {
    +monthOffset : number
    +selectedItem : Assignment
    reads visibleAssignments
    writes via onSelectItem / onSelectDay
  }

  class DetailView {
    +selectedItem : Assignment
    +selectedDay : DayInfo
    reads visibleAssignments
    writes via onComplete / onDelete / onEdit
  }

  class Widget {
    +id : number
    +type : "digital-clock" | "analog-clock" | "image" | "gif" | "todo"
    +x : number
    +y : number
    +w : number
    +h : number
    +data : WidgetData
  }

  class WidgetData {
    +src : string
    +name : string
  }

  class Palette {
    +id : string
    +name : string
    +colors : PaletteColor[]
  }

  class PaletteColor {
    +label : string
    +value : string
  }

  App "1" *-- "0..*" Assignment : assignments[]
  App "1" *-- "1" Settings : settings
  App --> WeeklyView : visibleAssignments
  App --> MonthlyView : visibleAssignments
  App --> DetailView : visibleAssignments
  WeeklyView ..> App : onUpdate / onComplete / onDelete
  MonthlyView ..> App : onSelectItem / onSelectDay
  DetailView ..> App : onComplete / onDelete / onEdit
  DetailView "1" *-- "0..*" Widget : widgets[]
  Widget "1" *-- "1" WidgetData : data
  DetailView "1" *-- "1..*" Palette : palettes
  Palette "1" *-- "1..*" PaletteColor : colors
```
