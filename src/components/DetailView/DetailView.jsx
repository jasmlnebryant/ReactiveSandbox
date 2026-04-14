import React from 'react'
import './DetailView.css'

function Clock() {
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const rawHours = time.getHours()
  const ampm = rawHours >= 12 ? 'PM' : 'AM'
  const hours12 = rawHours % 12 || 12
  const minutes = String(time.getMinutes()).padStart(2, '0')
  const seconds = String(time.getSeconds()).padStart(2, '0')

  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="clock-widget">
      <div className="clock-time">
        <span className="clock-hm">{hours12}:{minutes}</span>
        <span className="clock-seconds">{seconds}</span>
        <span className="clock-ampm">{ampm}</span>
      </div>
      <div className="clock-date">{dateStr}</div>
    </div>
  )
}

function formatDueDate(date) {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function DetailView({ selectedItem, onComplete, onDelete }) {
  return (
    <div className="detail-view">
      <div className="detail-header">
        <span className="panel-label">Details</span>
      </div>

      {selectedItem ? (
        <div className="detail-content">
          <div className="detail-course-tag" style={{ '--tag-color': selectedItem.color }}>
            {selectedItem.courseName}
          </div>
          <p className="detail-title">{selectedItem.name}</p>
          <div className="detail-fields">
            <div className="detail-field">
              <span className="detail-field-label">Due</span>
              <span className="detail-field-value">{formatDueDate(selectedItem.dueDate)}</span>
            </div>
            <div className="detail-field">
              <span className="detail-field-label">Type</span>
              <span className="detail-field-value detail-type">{selectedItem.type}</span>
            </div>
            {selectedItem.professor && (
              <div className="detail-field">
                <span className="detail-field-label">Professor</span>
                <span className="detail-field-value">{selectedItem.professor}</span>
              </div>
            )}
          </div>
          <div className="detail-actions">
            <button className="detail-btn complete" onClick={() => onComplete?.(selectedItem)}>
              Mark Complete
            </button>
            <button className="detail-btn delete" onClick={() => onDelete?.(selectedItem)}>
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="detail-decorative">
          <Clock />
          <p className="decorative-hint">Select an assignment or task to see details</p>
        </div>
      )}
    </div>
  )
}
