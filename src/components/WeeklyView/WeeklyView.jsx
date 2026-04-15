import './WeeklyView.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PALETTE = [
  'var(--color-5)',
  'var(--color-3)',
  'var(--color-1)',
  'var(--color-7)',
  'var(--color-2)',
  'var(--color-4)',
  'var(--color-6)',
]

function buildColorMap(assignments) {
  const map = {}
  assignments.forEach(a => {
    if (!map[a.courseName]) {
      map[a.courseName] = PALETTE[Object.keys(map).length % PALETTE.length]
    }
  })
  return map
}

function darken(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * 0.5)}, ${Math.round(g * 0.5)}, ${Math.round(b * 0.5)})`
}

function formatRange(start, end) {
  const opts = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

export default function WeeklyView({ assignments = [], selectedItem, onSelectItem, weekOffset = 0, onWeekChange }) {
  const today = new Date()

  // Week start based on offset from current week
  const startOfWeek = new Date(today)
  startOfWeek.setHours(0, 0, 0, 0)
  startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const isCurrentWeek = weekOffset === 0

  const weekDates = DAYS.map((day, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return {
      label: day,
      date: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
    }
  })

  const colorMap = buildColorMap(assignments)

  const weekAssignments = assignments.filter(a => {
    const d = new Date(a.dueDate)
    return d >= startOfWeek && d <= endOfWeek
  })

  return (
    <div className="weekly-view">
      <div className="weekly-header">
        <span className="panel-label">Weekly</span>
        <div className="header-nav">
          {!isCurrentWeek && (
            <button className="nav-back-btn" onClick={() => onWeekChange?.(0)} title="Back to current week">
              {weekOffset > 0 && <span className="nav-back-arrow">←</span>}
              Today
              {weekOffset < 0 && <span className="nav-back-arrow">→</span>}
            </button>
          )}
          <span className="weekly-range">{formatRange(startOfWeek, endOfWeek)}</span>
          <button className="nav-arrow" onClick={() => onWeekChange?.(weekOffset - 1)}>‹</button>
          <button className="nav-arrow" onClick={() => onWeekChange?.(weekOffset + 1)}>›</button>
        </div>
      </div>

      <div className="weekly-grid">
        {weekDates.map((day, i) => {
          const dayItems = weekAssignments.filter(a => new Date(a.dueDate).getDay() === i)
          return (
            <div key={i} className={`day-column ${day.isToday ? 'today' : ''}`}>
              <div className="day-header">
                <span className="day-label">{day.label}</span>
                <span className={`day-number ${day.isToday ? 'today-dot' : ''}`}>{day.date}</span>
              </div>
              <div className="day-items">
                {dayItems.map(item => {
                  const color = colorMap[item.courseName] || PALETTE[0]
                  const isSelected = selectedItem?.id === item.id
                  return (
                    <div
                      key={item.id}
                      className={`assignment-card ${isSelected ? 'selected' : ''} ${item.completed ? 'completed' : ''}`}
                      style={{ '--card-color': color }}
                      onClick={() => onSelectItem?.(isSelected ? null : item)}
                    >
                      <span className="card-name">{item.name}</span>
                      <span className="card-due">
                        {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="card-class">{item.courseName}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
