import './MonthlyView.css'

const DAY_LABELS_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_LABELS_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const PALETTE = [
  'var(--color-5)',
  'var(--color-3)',
  'var(--color-1)',
  'var(--color-7)',
  'var(--color-2)',
  'var(--color-4)',
  'var(--color-6)',
]

const TYPE_PALETTE = {
  exam:     'var(--color-7)',
  quiz:     'var(--color-3)',
  homework: 'var(--color-5)',
  project:  'var(--color-4)',
  reading:  'var(--color-1)',
  essay:    'var(--color-2)',
  lab:      'var(--color-6)',
  other:    'var(--color-5)',
}

const MAX_VISIBLE = 2

function buildColorMap(assignments, colorCodeBy) {
  const map = {}
  if (colorCodeBy === 'type') {
    assignments.forEach(a => {
      const key = (a.type || 'other').toLowerCase()
      map[a.id] = TYPE_PALETTE[key] || PALETTE[0]
    })
  } else {
    const courseColors = {}
    assignments.forEach(a => {
      if (!courseColors[a.courseName]) {
        courseColors[a.courseName] = PALETTE[Object.keys(courseColors).length % PALETTE.length]
      }
      map[a.id] = courseColors[a.courseName]
    })
  }
  return map
}

function buildCalendar(year, month, weekStartDay) {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // How many blank cells before day 1
  const offset = (firstDow - weekStartDay + 7) % 7
  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function MonthlyView({ assignments = [], allAssignments = assignments, selectedItem, onSelectItem, monthOffset = 0, onMonthChange, onSelectDay, settings = {} }) {
  const {
    weekStartDay   = 0,
    colorCodeBy    = 'course',
    dueSoonEnabled = true,
    dueSoonDays    = 3,
  } = settings

  const today = new Date()
  const todayMidnight = new Date(today); todayMidnight.setHours(0,0,0,0)
  const dueSoonThreshold = new Date(todayMidnight)
  dueSoonThreshold.setDate(dueSoonThreshold.getDate() + dueSoonDays)

  const isCurrentMonth = monthOffset === 0

  const baseDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()
  const cells = buildCalendar(year, month, weekStartDay)

  const DAY_LABELS = weekStartDay === 1 ? DAY_LABELS_MON : DAY_LABELS_SUN

  const monthLabel = baseDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()

  const colorMap = buildColorMap(allAssignments, colorCodeBy)

  const byDay = {}
  assignments.forEach(a => {
    const d = new Date(a.dueDate)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(a)
    }
  })

  return (
    <div className="monthly-view">
      <div className="monthly-header">
        <span className="panel-label">Monthly</span>
        <div className="header-nav">
          {!isCurrentMonth && (
            <button className="nav-back-btn" onClick={() => onMonthChange?.(0)} title="Back to current month">
              {monthOffset > 0 && <span className="nav-back-arrow">←</span>}
              This Month
              {monthOffset < 0 && <span className="nav-back-arrow">→</span>}
            </button>
          )}
          <span className="monthly-title">{monthLabel}</span>
          <button className="nav-arrow" onClick={() => onMonthChange?.(monthOffset - 1)}>‹</button>
          <button className="nav-arrow" onClick={() => onMonthChange?.(monthOffset + 1)}>›</button>
        </div>
      </div>

      <div className="monthly-grid">
        <div className="month-day-labels">
          {DAY_LABELS.map(d => (
            <div key={d} className="month-day-label">{d}</div>
          ))}
        </div>

        <div className="month-cells">
          {cells.map((day, i) => {
            const isToday = day === today.getDate() && isCurrentMonth
            const events = day ? (byDay[day] || []) : []
            const visibleEvents = events.slice(0, MAX_VISIBLE)
            const hasMore = events.length > MAX_VISIBLE

            return (
              <div
                key={i}
                className={`month-cell ${day ? '' : 'empty'} ${isToday ? 'today' : ''}`}
                onClick={day ? () => onSelectDay?.({ date: new Date(year, month, day), items: events }) : undefined}
              >
                {day && (
                  <>
                    <span className={`month-date-num ${isToday ? 'today-circle' : ''}`}>{day}</span>
                    <div className="month-cell-events">
                      {visibleEvents.map(ev => {
                        const color = colorMap[ev.id] || PALETTE[0]
                        const isSelected = selectedItem?.id === ev.id
                        const dueDate = new Date(ev.dueDate)
                        const isDueSoon = dueSoonEnabled && dueDate >= todayMidnight && dueDate <= dueSoonThreshold
                        return (
                          <div
                            key={ev.id}
                            className={`month-event ${isSelected ? 'selected' : ''} ${ev.completed ? 'completed' : ''} ${isDueSoon ? 'due-soon' : ''}`}
                            style={{ '--ev-color': color }}
                            onClick={e => { e.stopPropagation(); onSelectItem?.(isSelected ? null : ev) }}
                          >
                            <span className="month-event-name">{ev.name}</span>
                          </div>
                        )
                      })}
                      {hasMore && (
                        <span className="month-more-btn">+{events.length - MAX_VISIBLE} more</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
