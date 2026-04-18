import React from 'react'
import ReactDOM from 'react-dom'
import './DateTimePicker.css'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_LABELS  = ['Su','Mo','Tu','We','Th','Fr','Sa']

function CalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

// hideTime — omits the time row (for to-do items where only date matters)
export default function DateTimePicker({ dateStr, timeStr, onDateChange, onTimeChange, hideTime = false }) {
  const [open, setOpen]         = React.useState(false)
  const triggerRef              = React.useRef(null)
  const popupRef                = React.useRef(null)
  const [popupPos, setPopupPos] = React.useState(null)

  const initDate = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
  const [viewYear,  setViewYear]  = React.useState(initDate.getFullYear())
  const [viewMonth, setViewMonth] = React.useState(initDate.getMonth())

  const today    = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  React.useEffect(() => {
    if (dateStr) {
      const d = new Date(dateStr + 'T12:00:00')
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [dateStr])

  React.useEffect(() => {
    if (!open) return
    function onOutside(e) {
      if (
        popupRef.current   && !popupRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  function handleOpen() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPopupPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 252) })
    }
    setOpen(o => !o)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const firstDow    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  function toCellStr(day) {
    return `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }

  function displayDate() {
    if (!dateStr) return 'Select date'
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="dtp-wrap">
      <button ref={triggerRef} className="dtp-trigger" onClick={handleOpen} type="button">
        <span>{displayDate()}</span>
        <span className="dtp-cal-icon"><CalIcon /></span>
      </button>

      {open && popupPos && ReactDOM.createPortal(
        <div
          ref={popupRef}
          className="dtp-popup"
          style={{ top: popupPos.top, left: popupPos.left, width: popupPos.width }}
        >
          <div className="dtp-header">
            <button className="dtp-nav" onClick={prevMonth} type="button">‹</button>
            <span className="dtp-month-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button className="dtp-nav" onClick={nextMonth} type="button">›</button>
          </div>

          <div className="dtp-days-header">
            {DAY_LABELS.map(d => <span key={d} className="dtp-day-label">{d}</span>)}
          </div>

          <div className="dtp-grid">
            {cells.map((day, i) => {
              if (day === null) return <span key={`e${i}`} className="dtp-empty" />
              const cs = toCellStr(day)
              return (
                <button
                  key={day}
                  type="button"
                  className={`dtp-day${cs === dateStr ? ' selected' : ''}${cs === todayStr ? ' today' : ''}`}
                  onClick={() => { onDateChange(cs); setOpen(false) }}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {!hideTime && (
            <div className="dtp-time-row">
              <span className="dtp-time-label">Time (optional)</span>
              <input
                className="dtp-time-input"
                type="time"
                value={timeStr || ''}
                onChange={e => onTimeChange?.(e.target.value)}
              />
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
