import './MonthlyView.css'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PALETTE = [
  'var(--color-5)',
  'var(--color-3)',
  'var(--color-1)',
  'var(--color-7)',
  'var(--color-2)',
  'var(--color-4)',
  'var(--color-6)',
]

const MAX_VISIBLE = 2

function buildColorMap(assignments) {
  const map = {}
  assignments.forEach(a => {
    if (!map[a.courseName]) {
      map[a.courseName] = PALETTE[Object.keys(map).length % PALETTE.length]
    }
  })
  return map
}

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function MonthlyView({ assignments = [], selectedItem, onSelectItem, monthOffset = 0, onMonthChange, onSelectDay }) {
  const today = new Date()
  const isCurrentMonth = monthOffset === 0

  // Derive year/month from offset
  const baseDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()
  const cells = buildCalendar(year, month)

  const monthLabel = baseDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()

  const colorMap = buildColorMap(assignments)

  // Group assignments by day-of-month for the displayed month/year
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
                        const color = colorMap[ev.courseName] || PALETTE[0]
                        const isSelected = selectedItem?.id === ev.id
                        return (
                          <div
                            key={ev.id}
                            className={`month-event ${isSelected ? 'selected' : ''} ${ev.completed ? 'completed' : ''}`}
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
