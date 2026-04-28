import React from 'react'
import './WeeklyView.css'

// ─── Helpers ───────────────────────────────────────────────
function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatRange(start, end) {
  const opts = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

function buildWeekDates(weekStartDay, weekOffset) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dow = today.getDay()
  const daysFromStart = (dow - weekStartDay + 7) % 7
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - daysFromStart + weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getDueDate(item) {
  if (!item.dueDate) return null
  const d = item.dueDate instanceof Date ? item.dueDate : new Date(item.dueDate)
  return isNaN(d.getTime()) ? null : d
}

function stripMeta(item) {
  const clean = { ...item }
  delete clean._kind
  delete clean._dateStr
  delete clean._isDayDone
  return clean
}

// ─── Confetti colours ──────────────────────────────────────
const CONFETTI_COLORS = [
  '#C3C7A6','#D7C59F','#D9E4E0','#F1F0C8','#ECE9BE','#EEF1DE','#E9ECCF',
  '#A8C47A','#F4B860','#E07B54','#8EC6C5','#C9A0DC',
]

// ─── Confetti burst ────────────────────────────────────────
function ConfettiBurst({ active }) {
  const pieces = React.useMemo(() =>
    Array.from({ length: 55 }, (_, i) => {
      // Each piece bursts upward then arcs down
      const spreadAngle = ((Math.random() - 0.5) * 160) * (Math.PI / 180)
      const peakDist  = 24 + Math.random() * 52
      const peakX     = Math.sin(spreadAngle) * peakDist
      const peakY     = -(Math.cos(spreadAngle) * peakDist)
      const landX     = peakX + (Math.random() - 0.5) * 40
      const landY     = peakY + 70 + Math.random() * 90
      return {
        id: i,
        color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left:     `${2 + Math.random() * 96}%`,
        size:     4 + Math.random() * 5,
        delay:    Math.random() * 0.35,
        dur:      0.75 + Math.random() * 0.7,
        peakX, peakY, landX, landY,
        midRot:   Math.random() * 360,
        finalRot: Math.random() * 720,
        shape:    i % 4 === 0 ? '50%' : i % 4 === 1 ? '0%' : '2px',
      }
    }), [])

  if (!active) return null

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left:            p.left,
            width:           p.size,
            height:          p.size,
            background:      p.color,
            borderRadius:    p.shape,
            animationDelay:       `${p.delay}s`,
            animationDuration:    `${p.dur}s`,
            '--peak-x':  `${p.peakX}px`,
            '--peak-y':  `${p.peakY}px`,
            '--land-x':  `${p.landX}px`,
            '--land-y':  `${p.landY}px`,
            '--mid-rot': `${p.midRot}deg`,
            '--fin-rot': `${p.finalRot}deg`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────
export default function WeeklyProgressTracker({
  assignments = [],
  selectedItem,
  onSelectItem,
  weekOffset = 0,
  onWeekChange,
  settings = {},
  onUpdate,
  onComplete,
  onDelete,
}) {
  const { weekStartDay = 0, dueSoonDays = 3 } = settings

  const [strikingKeys,    setStrikingKeys]   = React.useState(new Set())
  const [poppingKeys,     setPoppingKeys]    = React.useState(new Set())
  const [celebratingBar,  setCelebratingBar] = React.useState(false)
  const [showAllDone,     setShowAllDone]    = React.useState(false)
  const [proximityPopup,  setProximityPopup] = React.useState(null)
  const [overduePopup,    setOverduePopup]   = React.useState(null)
  const prevPct         = React.useRef(0)
  const celebratedWeeks = React.useRef(new Set())

  // Reset overlay when the user navigates to a different week
  React.useEffect(() => {
    setShowAllDone(celebratedWeeks.current.has(weekOffset) && overallPct === 100)
    prevPct.current = overallPct
  }, [weekOffset])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekDates  = buildWeekDates(weekStartDay, weekOffset)
  const weekStart  = weekDates[0]
  const weekEnd    = new Date(weekDates[6])
  weekEnd.setHours(23, 59, 59, 999)
  const isCurrentWeek = weekOffset === 0

  const proximityEnd = new Date(weekEnd)
  proximityEnd.setDate(proximityEnd.getDate() + dueSoonDays)

  // ── Per-day item lists ──
  const dayItems = weekDates.map(date => {
    const dateStr = toDateStr(date)
    const items = []

    assignments.forEach(item => {
      if (item.proximityDismissed) return
      const due = getDueDate(item)

      // No due date → show in today's column (current week only)
      if (!due) {
        if (isCurrentWeek && isSameDay(date, today)) {
          items.push({ ...item, _kind: item.completed ? 'completed' : 'regular', _dateStr: dateStr })
        }
        return
      }

      const dueMid = new Date(due); dueMid.setHours(0, 0, 0, 0)

      // Overdue: before today, not completed, due date falls within this week's past days
      if (dueMid < today && !item.completed && dueMid >= weekStart) {
        if (isSameDay(dueMid, date)) {
          items.push({ ...item, _kind: 'overdue', _dateStr: dateStr })
        }
        return
      }

      // Completed items due this week
      if (item.completed && dueMid >= weekStart && dueMid <= weekEnd) {
        if (isSameDay(dueMid, date)) {
          items.push({ ...item, _kind: 'completed', _dateStr: dateStr })
        }
        return
      }

      // Accepted proximity items: repeat each day from earlyStartDate through week end
      if (item.proximityAccepted && item.earlyStartDate && !item.completed) {
        const earlyStart = new Date(item.earlyStartDate); earlyStart.setHours(0, 0, 0, 0)
        const spanStart = earlyStart >= weekStart ? earlyStart : weekStart
        if (date >= spanStart && date <= weekEnd) {
          items.push({
            ...item,
            _kind: 'accepted',
            _dateStr: dateStr,
            _isDayDone: !!(item.dailyCompletions?.[dateStr]),
          })
        }
        return
      }

      // Regular items due this week
      if (!item.completed && dueMid >= weekStart && dueMid <= weekEnd) {
        if (isSameDay(dueMid, date)) {
          items.push({ ...item, _kind: 'regular', _dateStr: dateStr })
        }
      }
    })

    return { date, dateStr, items }
  })

  // Proximity items: due after week ends, within dueSoonDays, not yet accepted/dismissed
  const proximityItems = assignments.filter(item => {
    if (item.proximityAccepted || item.proximityDismissed || item.completed) return false
    const due = getDueDate(item)
    if (!due) return false
    const dueMid = new Date(due); dueMid.setHours(0, 0, 0, 0)
    return dueMid > weekEnd && dueMid <= proximityEnd
  })

  // ── Progress totals ──
  let totalSlots = 0, completedSlots = 0
  dayItems.forEach(({ items }) => {
    items.forEach(item => {
      if      (item._kind === 'overdue')    { totalSlots++ }
      else if (item._kind === 'completed')  { totalSlots++; completedSlots++ }
      else if (item._kind === 'regular')    { totalSlots++; if (item.completed) completedSlots++ }
      else if (item._kind === 'accepted')   { totalSlots++; if (item._isDayDone) completedSlots++ }
    })
  })

  const overallPct = totalSlots === 0 ? 0 : Math.round((completedSlots / totalSlots) * 100)

  const dayProgress = dayItems.map(({ items }) => {
    let t = 0, c = 0
    items.forEach(item => {
      if      (item._kind === 'overdue')   { t++ }
      else if (item._kind === 'completed') { t++; c++ }
      else if (item._kind === 'regular')   { t++; if (item.completed) c++ }
      else if (item._kind === 'accepted')  { t++; if (item._isDayDone) c++ }
    })
    return { t, c, pct: t === 0 ? 0 : Math.round((c / t) * 100) }
  })

  // ── Celebration when bar hits 100% ──
  React.useEffect(() => {
    const alreadyCelebrated = celebratedWeeks.current.has(weekOffset)
    if (overallPct === 100 && totalSlots > 0) {
      setShowAllDone(true)
      if (!alreadyCelebrated) {
        // First time this week hits 100% — play the full animation
        celebratedWeeks.current.add(weekOffset)
        setCelebratingBar(true)
        setTimeout(() => setCelebratingBar(false), 2200)
      }
    }
    if (overallPct < 100) {
      setShowAllDone(false)
      // If items are un-completed, allow re-celebrating when they finish again
      celebratedWeeks.current.delete(weekOffset)
    }
    prevPct.current = overallPct
  }, [overallPct, totalSlots])

  // ── Animation triggers ──
  function triggerStrike(key, callback) {
    setStrikingKeys(prev => new Set(prev).add(key))
    setTimeout(() => {
      setStrikingKeys(prev => { const n = new Set(prev); n.delete(key); return n })
      callback()
    }, 1100)
  }

  function triggerPop(key, callback) {
    setPoppingKeys(prev => new Set(prev).add(key))
    setTimeout(() => {
      setPoppingKeys(prev => { const n = new Set(prev); n.delete(key); return n })
      callback()
    }, 520)
  }

  // ── Item interaction handlers ──
  function handleSelectItem(item) {
    const clean = stripMeta(item)
    onSelectItem?.(selectedItem?.id === clean.id ? null : clean)
  }

  function handleCheckDayInstance(e, item) {
    e.stopPropagation()
    const key = `${item.id}-${item._dateStr}`
    triggerStrike(key, () => {
      const updated = {
        ...stripMeta(item),
        dailyCompletions: { ...(item.dailyCompletions || {}), [item._dateStr]: true },
      }
      onUpdate?.(updated)
    })
  }

  function handleProximityAccept(item) {
    setProximityPopup(null)
    onUpdate?.({ ...item, proximityAccepted: true, earlyStartDate: toDateStr(today) })
  }

  function handleProximityDecline(item) {
    setProximityPopup(null)
    triggerPop(String(item.id), () => onUpdate?.({ ...item, proximityDismissed: true }))
  }

  function handleOverdueYes(item) {
    setOverduePopup(null)
    triggerStrike(`${item.id}-${item._dateStr}`, () => onComplete?.(stripMeta(item)))
  }

  function handleOverdueNo(item) {
    setOverduePopup(null)
    triggerPop(String(item.id), () => onDelete?.(stripMeta(item)))
  }

  const emptyWeek = totalSlots === 0 && proximityItems.length === 0

  return (
    <div className="weekly-view">

      {/* ── Header ── */}
      <div className="weekly-header">
        <span className="panel-label">Progress</span>
        <div className="header-nav">
          {!isCurrentWeek && (
            <button className="nav-back-btn" onClick={() => onWeekChange?.(0)}>
              {weekOffset > 0 && <span className="nav-back-arrow">←</span>}
              Today
              {weekOffset < 0 && <span className="nav-back-arrow">→</span>}
            </button>
          )}
          <span className="weekly-range">{formatRange(weekStart, weekDates[6])}</span>
          <button className="nav-arrow" onClick={() => onWeekChange?.(weekOffset - 1)}>‹</button>
          <button className="nav-arrow" onClick={() => onWeekChange?.(weekOffset + 1)}>›</button>
        </div>
      </div>

      {/* ── Overall progress bar ── */}
      <div className="progress-section">
        <div className="progress-label-row">
          <span className="progress-label">Overall</span>
          <span className="progress-count">
            {totalSlots === 0 ? '—' : `${completedSlots} / ${totalSlots}`}
          </span>
        </div>
        <div className={`progress-bar-wrap`}>
          <div className={`progress-bar-track ${celebratingBar ? 'celebrate' : ''}`}>
            <div
              className="progress-bar-fill"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <ConfettiBurst active={celebratingBar} />
        </div>
        {totalSlots > 0 && (
          <span className="progress-pct">{overallPct}%</span>
        )}
      </div>

      {/* ── Scrollable body: grid + proximity ── */}
      <div className="tracker-body">

      {/* ── Day columns ── */}
      <div className={`tracker-grid${showAllDone ? ' all-done' : ''}`} style={{ position: 'relative' }}>
        {dayItems.map(({ date, dateStr, items }, i) => {
          const dp      = dayProgress[i]
          const isToday = isSameDay(date, today)
          const isPast  = date < today && !isToday

          return (
            <div
              key={dateStr}
              className={`tracker-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}`}
            >
              <div className="tracker-day-header">
                <span className="tracker-day-label">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className={`tracker-day-num ${isToday ? 'today-dot' : ''}`}>
                  {date.getDate()}
                </span>
                <div className="tracker-day-bar-track">
                  <div
                    className="tracker-day-bar-fill"
                    style={{ width: dp.t === 0 ? '0%' : `${dp.pct}%` }}
                  />
                </div>
              </div>

              <div className="tracker-day-items">
                {items.map(item => {
                  const animKey    = `${item.id}-${dateStr}`
                  const isStriking = strikingKeys.has(animKey)
                  const isPopping  = poppingKeys.has(String(item.id))
                  const isSelected = selectedItem?.id === item.id

                  if (item._kind === 'overdue') {
                    return (
                      <div
                        key={animKey}
                        className={`tracker-item overdue${isSelected ? ' selected' : ''}${isStriking ? ' striking' : ''}${isPopping ? ' popping' : ''}`}
                        onClick={() => !isStriking && !isPopping && setOverduePopup(item)}
                      >
                        <span className="tracker-item-name">{item.name}</span>
                        <span className="tracker-item-sub">{item.courseName}</span>
                      </div>
                    )
                  }

                  if (item._kind === 'completed') {
                    return (
                      <div
                        key={animKey}
                        className={`tracker-item completed${isSelected ? ' selected' : ''}`}
                        onClick={() => handleSelectItem(item)}
                      >
                        <span className="tracker-item-name struck">{item.name}</span>
                        <span className="tracker-item-sub">{item.courseName}</span>
                      </div>
                    )
                  }

                  if (item._kind === 'accepted') {
                    const isDone = item._isDayDone
                    return (
                      <div
                        key={animKey}
                        className={`tracker-item accepted${isDone ? ' day-done' : ''}${isStriking ? ' striking' : ''}${isSelected ? ' selected' : ''}`}
                        onClick={() => handleSelectItem(item)}
                      >
                        <span className="tracker-item-name">{item.name}</span>
                        <span className="tracker-item-sub">{item.courseName}</span>
                        {!isDone && !isStriking && (
                          <button
                            className="tracker-day-check-btn"
                            onClick={e => handleCheckDayInstance(e, item)}
                            title="Mark today complete"
                          >✓</button>
                        )}
                        {isDone && <span className="tracker-check">✓</span>}
                      </div>
                    )
                  }

                  // Regular
                  return (
                    <div
                      key={animKey}
                      className={`tracker-item${item.completed ? ' completed' : ''}${isStriking ? ' striking' : ''}${isSelected ? ' selected' : ''}`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <span className={`tracker-item-name${item.completed ? ' struck' : ''}`}>
                        {item.name}
                      </span>
                      <span className="tracker-item-sub">{item.courseName}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {/* ── All done overlay — inside grid so bar stays unblurred ── */}
        {showAllDone && (
          <div className="all-done-overlay">
            <p className="all-done-text">All done for the week!</p>
          </div>
        )}
      </div>

      {/* ── Proximity section — always visible ── */}
      <div className="proximity-section">
        <span className="proximity-section-label">
          Coming Up <span className="proximity-window-hint">({dueSoonDays}d after this week)</span>
        </span>
        {proximityItems.length === 0 ? (
          <p className="proximity-empty">Nothing due within {dueSoonDays} days of this week.</p>
        ) : (
          <div className="proximity-items">
            {proximityItems.map(item => {
              const isPopping = poppingKeys.has(String(item.id))
              const due = getDueDate(item)
              return (
                <div
                  key={item.id}
                  className={`tracker-item proximity${isPopping ? ' popping' : ''}`}
                  onClick={() => !isPopping && setProximityPopup(item)}
                >
                  <span className="tracker-item-name">{item.name}</span>
                  <span className="tracker-item-sub">
                    {item.courseName}
                    {due && ` · due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {emptyWeek && (
        <div className="tracker-empty">
          <p className="tracker-empty-text">Nothing due this week.</p>
        </div>
      )}

      </div>{/* end tracker-body */}

      {/* ── Proximity popup ── */}
      {proximityPopup && (
        <div className="tracker-popup-overlay" onClick={() => setProximityPopup(null)}>
          <div className="tracker-popup" onClick={e => e.stopPropagation()}>
            <p className="tracker-popup-title">Start working on this early?</p>
            <p className="tracker-popup-name">"{proximityPopup.name}"</p>
            <p className="tracker-popup-sub">
              Due {getDueDate(proximityPopup)?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
            <div className="tracker-popup-actions">
              <button className="tracker-popup-btn yes" onClick={() => handleProximityAccept(proximityPopup)}>Yes, let's go</button>
              <button className="tracker-popup-btn no"  onClick={() => handleProximityDecline(proximityPopup)}>Not yet</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Overdue popup ── */}
      {overduePopup && (
        <div className="tracker-popup-overlay" onClick={() => setOverduePopup(null)}>
          <div className="tracker-popup" onClick={e => e.stopPropagation()}>
            <p className="tracker-popup-title">Was this completed?</p>
            <p className="tracker-popup-name">"{overduePopup.name}"</p>
            <p className="tracker-popup-sub overdue-sub">
              Was due {getDueDate(overduePopup)?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
            <div className="tracker-popup-actions">
              <button className="tracker-popup-btn yes" onClick={() => handleOverdueYes(overduePopup)}>Yes, completed</button>
              <button className="tracker-popup-btn no"  onClick={() => handleOverdueNo(overduePopup)}>No, remove it</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
