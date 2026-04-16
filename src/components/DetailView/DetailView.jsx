import React from 'react'
import './DetailView.css'

// ─── Default palette ───────────────────────────────────────
const DEFAULT_PALETTE = {
  id: 'default',
  name: 'Default',
  colors: [
    { key: '--bg',           label: 'App Background',   value: '#D0D0CA' },
    { key: '--color-1',      label: 'Card Surface',     value: '#EEF1DE' },
    { key: '--color-2',      label: 'Today Highlight',  value: '#E9ECCF' },
    { key: '--color-3',      label: 'Event — Cool',     value: '#D9E4E0' },
    { key: '--color-4',      label: 'Event — Pale',     value: '#F1F0C8' },
    { key: '--color-5',      label: 'Event — Warm',     value: '#ECE9BE' },
    { key: '--color-6',      label: 'Primary Accent',   value: '#C3C7A6' },
    { key: '--color-7',      label: 'Event — Tan',      value: '#D7C59F' },
    { key: '--color-6-dark', label: 'Accent Text',      value: '#3B3C32' },
    { key: '--blob-color',   label: 'Background Blob',  value: '#C3C7A6' },
    { key: '--text-primary',   label: 'Text — Primary',   value: '#2B2B26' },
    { key: '--text-secondary', label: 'Text — Secondary', value: '#6B6B60' },
    { key: '--text-tertiary',  label: 'Text — Tertiary',  value: '#9E9E90' },
  ],
}

// ─── Palette icon ──────────────────────────────────────────
function PaletteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
      <circle cx="7.5"  cy="10.5" r="1" fill="currentColor" stroke="none"/>
      <circle cx="12"   cy="7"    r="1" fill="currentColor" stroke="none"/>
      <circle cx="16.5" cy="10.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

// ─── Shared color form rows ────────────────────────────────
function ColorRows({ colors, onChange }) {
  function handleChange(i, value) {
    onChange(i, value)
    // Live preview — apply immediately to the document
    document.documentElement.style.setProperty(colors[i].key, value)
  }

  function handleHex(i, raw) {
    // Only apply once we have a valid 6-digit hex
    const v = raw.startsWith('#') ? raw : '#' + raw
    onChange(i, v)
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      document.documentElement.style.setProperty(colors[i].key, v)
    }
  }

  return (
    <div className="palette-color-rows">
      {colors.map((c, i) => (
        <div key={c.key} className="palette-color-row">
          <span className="palette-color-label">{c.label}</span>
          <div className="palette-color-inputs">
            <label className="palette-swatch-btn" style={{ background: c.value }}>
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(c.value) ? c.value : '#000000'}
                onChange={e => handleChange(i, e.target.value)}
                className="palette-native-picker"
              />
            </label>
            <input
              className="palette-hex-input"
              value={c.value}
              onChange={e => handleHex(i, e.target.value)}
              maxLength={7}
              spellCheck={false}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Palette popup ─────────────────────────────────────────
function PalettePopup({ palettes, activePaletteId, onSelect, onAdd, onUpdate }) {
  const [view, setView]             = React.useState('list')
  const [newName, setNewName]       = React.useState('My Palette')
  const [newColors, setNewColors]   = React.useState(DEFAULT_PALETTE.colors.map(c => ({ ...c })))
  const [editName, setEditName]     = React.useState('')
  const [editColors, setEditColors] = React.useState([])
  const [editId, setEditId]         = React.useState(null)
  const [confirmingBack, setConfirmingBack] = React.useState(false)

  // Snapshot of state when the form was first opened — used to detect changes
  const snapshot = React.useRef(null)

  // Revert CSS vars to the currently saved active palette
  function revertToSaved() {
    const active = palettes.find(p => p.id === activePaletteId) || palettes[0]
    if (active) active.colors.forEach(({ key, value }) => {
      document.documentElement.style.setProperty(key, value)
    })
  }

  function openEdit(p) {
    setEditId(p.id)
    setEditName(p.name)
    setEditColors(p.colors.map(c => ({ ...c })))
    snapshot.current = { name: p.name, colors: p.colors.map(c => ({ ...c })) }
    setView('edit')
  }

  function handleListClick(p) {
    if (p.id === activePaletteId) {
      openEdit(p)
    } else {
      onSelect(p.id)
    }
  }

  function hasChanges() {
    if (view === 'create') {
      if (newName !== 'My Palette') return true
      return newColors.some((c, i) => c.value !== DEFAULT_PALETTE.colors[i]?.value)
    }
    if (view === 'edit' && snapshot.current) {
      if (editName !== snapshot.current.name) return true
      return editColors.some((c, i) => c.value !== snapshot.current.colors[i]?.value)
    }
    return false
  }

  function handleBackClick() {
    if (hasChanges()) {
      setConfirmingBack(true)
    } else {
      revertToSaved()
      setView('list')
    }
  }

  function handleDiscardAndBack() {
    setConfirmingBack(false)
    revertToSaved()
    setView('list')
    // Reset create state if discarding a new palette
    if (view === 'create') {
      setNewName('My Palette')
      setNewColors(DEFAULT_PALETTE.colors.map(c => ({ ...c })))
    }
  }

  function handleSaveAndBack() {
    setConfirmingBack(false)
    if (view === 'create') handleCreate()
    if (view === 'edit')   handleSaveEdit()
  }

  function handleCreate() {
    onAdd({ id: Date.now().toString(), name: newName.trim() || 'My Palette', colors: newColors })
    setView('list')
    setNewName('My Palette')
    setNewColors(DEFAULT_PALETTE.colors.map(c => ({ ...c })))
  }

  function handleSaveEdit() {
    onUpdate({ id: editId, name: editName.trim() || 'My Palette', colors: editColors })
    setView('list')
  }

  // Shared "unsaved changes" confirmation overlay
  const confirmOverlay = confirmingBack && (
    <div className="palette-confirm-overlay">
      <div className="palette-confirm-box">
        <p className="palette-confirm-title">Unsaved changes</p>
        <p className="palette-confirm-sub">Do you want to save before going back?</p>
        <div className="palette-confirm-actions">
          <button className="palette-confirm-save" onClick={handleSaveAndBack}>Save</button>
          <button className="palette-confirm-discard" onClick={handleDiscardAndBack}>Discard</button>
        </div>
      </div>
    </div>
  )

  if (view === 'create') {
    return (
      <div className="palette-popup">
        {confirmOverlay}
        <div className="palette-popup-header">
          <button className="palette-back-btn" onClick={handleBackClick}>‹</button>
          <span className="palette-popup-title">New Palette</span>
        </div>
        <input
          className="palette-name-input"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Palette name"
        />
        <ColorRows
          colors={newColors}
          onChange={(i, v) => setNewColors(prev => prev.map((c, idx) => idx === i ? { ...c, value: v } : c))}
        />
        <button className="palette-save-btn" onClick={handleCreate}>Save Palette</button>
      </div>
    )
  }

  if (view === 'edit') {
    return (
      <div className="palette-popup">
        {confirmOverlay}
        <div className="palette-popup-header">
          <button className="palette-back-btn" onClick={handleBackClick}>‹</button>
          <span className="palette-popup-title">Edit Palette</span>
        </div>
        <input
          className="palette-name-input"
          value={editName}
          onChange={e => setEditName(e.target.value)}
          placeholder="Palette name"
        />
        <ColorRows
          colors={editColors}
          onChange={(i, v) => setEditColors(prev => prev.map((c, idx) => idx === i ? { ...c, value: v } : c))}
        />
        <button className="palette-save-btn" onClick={handleSaveEdit}>Save Changes</button>
      </div>
    )
  }

  return (
    <div className="palette-popup">
      <div className="palette-popup-header">
        <span className="palette-popup-title">Palettes</span>
      </div>
      <div className="palette-list">
        {palettes.map(p => (
          <div
            key={p.id}
            className={`palette-list-item ${p.id === activePaletteId ? 'active' : ''}`}
            onClick={() => handleListClick(p)}
          >
            <div className="palette-item-left">
              <span className="palette-item-check">{p.id === activePaletteId ? '✓' : ''}</span>
              <span className="palette-item-name">{p.name}</span>
            </div>
            <div className="palette-item-right">
              <div className="palette-item-swatches">
                {p.colors.filter(c => c.key !== '--color-6-dark').slice(0, 6).map(c => (
                  <span key={c.key} className="palette-item-swatch" style={{ background: c.value }} />
                ))}
              </div>
              {p.id === activePaletteId && (
                <span className="palette-edit-hint">tap to edit</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <button className="palette-new-btn" onClick={() => setView('create')}>+ New Palette</button>
    </div>
  )
}

// ─── Default sizes per widget type ────────────────────────
const WIDGET_DEFAULTS = {
  'digital-clock': { width: 182, height: 100 },
  'analog-clock':  { width: 160, height: 176 },
  'image':         { width: 186, height: 170 },
  'gif':           { width: 186, height: 170 },
  'todo':          { width: 194, height: 214 },
}

// ─── Widget: Digital Clock ─────────────────────────────────
function DigitalClock() {
  const [time, setTime] = React.useState(new Date())
  React.useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const raw = time.getHours()
  const ampm = raw >= 12 ? 'PM' : 'AM'
  const h = raw % 12 || 12
  const m = String(time.getMinutes()).padStart(2, '0')
  const s = String(time.getSeconds()).padStart(2, '0')
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="clock-widget">
      <div className="clock-time">
        <span className="clock-hm">{h}:{m}</span>
        <span className="clock-seconds">{s}</span>
        <span className="clock-ampm">{ampm}</span>
      </div>
      <div className="clock-date">{dateStr}</div>
    </div>
  )
}

// ─── Widget: Analog Clock ──────────────────────────────────
function AnalogClock() {
  const [time, setTime] = React.useState(new Date())
  React.useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const s = time.getSeconds()
  const m = time.getMinutes()
  const h = time.getHours() % 12
  const cx = 50, cy = 50
  function pt(deg, r) {
    const rad = (deg - 90) * (Math.PI / 180)
    return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r }
  }
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const deg = (i / 12) * 360
    const o = pt(deg, 44), inner = pt(deg, i % 3 === 0 ? 37 : 41)
    return { x1: inner.x, y1: inner.y, x2: o.x, y2: o.y, major: i % 3 === 0 }
  })
  const hr  = pt((h / 12) * 360 + (m / 60) * 30, 26)
  const min = pt((m / 60) * 360 + (s / 60) * 6,  34)
  const sec = pt((s / 60) * 360, 38)
  return (
    <div className="analog-clock-wrap">
      <svg viewBox="0 0 100 100" className="analog-clock-svg">
        <circle cx={cx} cy={cy} r={44} fill="none" stroke="var(--border)" strokeWidth="1.5" />
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="var(--text-tertiary)" strokeWidth={t.major ? 1.5 : 0.75} />
        ))}
        <line x1={cx} y1={cy} x2={hr.x}  y2={hr.y}  stroke="var(--text-primary)" strokeWidth="3" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={min.x} y2={min.y} stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={sec.x} y2={sec.y} stroke="var(--color-6)"      strokeWidth="1" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="2.5" fill="var(--text-primary)" />
      </svg>
    </div>
  )
}

// ─── Widget: Media (Image / GIF) ───────────────────────────
function MediaWidget({ data, onUpdate, accept, label }) {
  const inputRef = React.useRef(null)
  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onUpdate({ src: reader.result, name: file.name })
    reader.readAsDataURL(file)
    e.target.value = ''
  }
  return (
    <div className="media-widget">
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={handleFile} />
      {data.src ? (
        <img src={data.src} alt={data.name} className="media-widget-img"
          title="Click to replace" onClick={() => inputRef.current.click()} />
      ) : (
        <button className="media-upload-btn" onClick={() => inputRef.current.click()}>
          <span className="media-upload-icon">↑</span>
          <span>{label}</span>
        </button>
      )}
    </div>
  )
}

// ─── Widget: To-Do List ────────────────────────────────────
function TodoWidget({ data, onUpdate }) {
  const [inputVal, setInputVal] = React.useState('')
  const items = data.items || []
  function addItem() {
    const text = inputVal.trim()
    if (!text) return
    onUpdate({ items: [...items, { id: Date.now(), text, done: false }] })
    setInputVal('')
  }
  function toggleItem(id) {
    onUpdate({ items: items.map(it => it.id === id ? { ...it, done: !it.done } : it) })
  }
  function deleteItem(id) {
    onUpdate({ items: items.filter(it => it.id !== id) })
  }
  return (
    <div className="todo-widget">
      {items.length > 0 && (
        <div className="todo-items">
          {items.map(item => (
            <div key={item.id} className={`todo-item ${item.done ? 'done' : ''}`}>
              <button className="todo-check" onClick={() => toggleItem(item.id)}>
                {item.done ? '✓' : ''}
              </button>
              <span className="todo-text">{item.text}</span>
              <button className="todo-delete" onClick={() => deleteItem(item.id)}>×</button>
            </div>
          ))}
        </div>
      )}
      <div className="todo-input-row">
        <span className="todo-add-icon">+</span>
        <input
          className="todo-input"
          placeholder="Add item…"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
      </div>
    </div>
  )
}

// ─── Picker options ────────────────────────────────────────
const WIDGET_OPTIONS = [
  { type: 'digital-clock', label: 'Digital Clock', icon: '◷' },
  { type: 'analog-clock',  label: 'Analog Clock',  icon: '◔' },
  { type: 'image',         label: 'Image',          icon: '▣' },
  { type: 'gif',           label: 'GIF',            icon: '▶' },
  { type: 'todo',          label: 'To-Do List',     icon: '☑' },
]

// ─── Helpers ───────────────────────────────────────────────
function formatDueDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function DefaultClock() {
  const [time, setTime] = React.useState(new Date())
  React.useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const raw = time.getHours()
  const ampm = raw >= 12 ? 'PM' : 'AM'
  const h = raw % 12 || 12
  const m = String(time.getMinutes()).padStart(2, '0')
  const s = String(time.getSeconds()).padStart(2, '0')
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="clock-widget">
      <div className="clock-time">
        <span className="clock-hm">{h}:{m}</span>
        <span className="clock-seconds">{s}</span>
        <span className="clock-ampm">{ampm}</span>
      </div>
      <div className="clock-date">{dateStr}</div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────
export default function DetailView({ selectedItem, selectedDay, onSelectItem, onComplete, onDelete }) {
  const [widgets, setWidgets]         = React.useState([])
  const [pickerOpen, setPickerOpen]   = React.useState(false)
  const [palettes, setPalettes]       = React.useState([DEFAULT_PALETTE])
  const [activePaletteId, setActivePaletteId] = React.useState('default')
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const pickerRef    = React.useRef(null)
  const boardRef     = React.useRef(null)
  const dragRef      = React.useRef(null)
  const resizeRef    = React.useRef(null)
  const paletteRef   = React.useRef(null)

  // ── Close widget picker on outside click ──
  React.useEffect(() => {
    if (!pickerOpen) return
    function onOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [pickerOpen])

  // ── Close palette popup on outside click ──
  React.useEffect(() => {
    if (!paletteOpen) return
    function onOutside(e) {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) setPaletteOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [paletteOpen])

  // ── Apply active palette to CSS variables ──
  React.useEffect(() => {
    const palette = palettes.find(p => p.id === activePaletteId)
    if (!palette) return
    palette.colors.forEach(({ key, value }) => {
      document.documentElement.style.setProperty(key, value)
    })
  }, [activePaletteId, palettes])

  // ── Global drag + resize ──
  React.useEffect(() => {
    function onMouseMove(e) {
      if (dragRef.current) {
        const { id, offsetX, offsetY } = dragRef.current
        const board = boardRef.current
        if (!board) return
        const rect = board.getBoundingClientRect()
        setWidgets(prev => prev.map(w => {
          if (w.id !== id) return w
          const x = Math.max(0, Math.min(e.clientX - rect.left - offsetX, rect.width  - w.width))
          const y = Math.max(0, Math.min(e.clientY - rect.top  - offsetY, rect.height - w.height))
          return { ...w, x, y }
        }))
      }
      if (resizeRef.current) {
        const { id, startX, startY, startW, startH } = resizeRef.current
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        setWidgets(prev => prev.map(w => {
          if (w.id !== id) return w
          const board = boardRef.current
          const rect  = board?.getBoundingClientRect()
          const maxW  = rect ? rect.width  - w.x : 9999
          const maxH  = rect ? rect.height - w.y : 9999
          return {
            ...w,
            width:  Math.max(130, Math.min(maxW, startW + dx)),
            height: Math.max(80,  Math.min(maxH, startH + dy)),
          }
        }))
      }
    }
    function onMouseUp() {
      dragRef.current   = null
      resizeRef.current = null
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [])

  function bringToFront(id) {
    setWidgets(prev => {
      const maxZ = Math.max(1, ...prev.map(w => w.z ?? 1))
      return prev.map(w => w.id === id ? { ...w, z: maxZ + 1 } : w)
    })
  }

  function handleDragStart(e, id) {
    e.preventDefault()
    const board = boardRef.current
    if (!board) return
    const rect = board.getBoundingClientRect()
    const w = widgets.find(w => w.id === id)
    if (!w) return
    dragRef.current = {
      id,
      offsetX: e.clientX - rect.left - w.x,
      offsetY: e.clientY - rect.top  - w.y,
    }
    bringToFront(id)
  }

  function handleResizeStart(e, id) {
    e.preventDefault()
    e.stopPropagation()
    const w = widgets.find(w => w.id === id)
    if (!w) return
    resizeRef.current = { id, startX: e.clientX, startY: e.clientY, startW: w.width, startH: w.height }
    bringToFront(id)
  }

  function addWidget(type) {
    const defaults = WIDGET_DEFAULTS[type] || { width: 180, height: 150 }
    const offset   = (widgets.length % 6) * 18
    const data     = type === 'todo' ? { items: [] } : {}
    setWidgets(prev => [...prev, {
      id: Date.now(), type, data,
      x: 8 + offset, y: 8 + offset,
      width: defaults.width, height: defaults.height,
      z: Math.max(1, ...prev.map(w => w.z ?? 1)) + 1,
    }])
    setPickerOpen(false)
  }

  function removeWidget(id)         { setWidgets(prev => prev.filter(w => w.id !== id)) }
  function updateWidgetData(id, d)  { setWidgets(prev => prev.map(w => w.id === id ? { ...w, data: d } : w)) }

  const mode = selectedItem ? 'item' : selectedDay ? 'day' : 'idle'

  return (
    <div className="detail-view">

      {/* ── Header ── */}
      <div className="detail-header">
        <span className="panel-label">Details</span>
        <div className="widget-add-wrap" ref={pickerRef}>
          <button
            className={`widget-add-btn ${pickerOpen ? 'open' : ''}`}
            onClick={() => setPickerOpen(p => !p)}
            title="Add widget"
          >+</button>
          {pickerOpen && (
            <div className="widget-picker">
              {WIDGET_OPTIONS.map(opt => (
                <button key={opt.type} className="widget-picker-item" onClick={() => addWidget(opt.type)}>
                  <span className="picker-icon">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Item detail ── */}
      {mode === 'item' && (
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
            <div className="detail-field">
              <span className="detail-field-label">Professor</span>
              <span className="detail-field-value">{selectedItem.professor || 'N/A'}</span>
            </div>
            <div className="detail-field">
              <span className="detail-field-label">Weight</span>
              <span className="detail-field-value">{selectedItem.weight || 'N/A'}</span>
            </div>
            {selectedItem.instructions && selectedItem.instructions !== 'N/A' && (
              <div className="detail-field detail-field-full">
                <span className="detail-field-label">Instructions</span>
                <span className="detail-field-value detail-instructions">{selectedItem.instructions}</span>
              </div>
            )}
          </div>
          <div className="detail-actions">
            <button className="detail-btn complete" onClick={() => onComplete?.(selectedItem)}>Mark Complete</button>
            <button className="detail-btn delete"   onClick={() => onDelete?.(selectedItem)}>Delete</button>
          </div>
        </div>
      )}

      {/* ── Day overview ── */}
      {mode === 'day' && (
        <div className="detail-day">
          <p className="detail-day-title">
            {selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <div className="detail-day-items">
            {selectedDay.items.map(item => (
              <div
                key={item.id}
                className={`detail-day-item ${item.completed ? 'completed' : ''}`}
                onClick={() => onSelectItem?.(item)}
              >
                <span className="detail-day-item-name">{item.name}</span>
                <span className="detail-day-item-course">{item.courseName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Palette button (idle mode only) ── */}
      {mode === 'idle' && (
        <div className="palette-btn-wrap" ref={paletteRef}>
          <button
            className={`palette-btn ${paletteOpen ? 'open' : ''}`}
            onClick={() => setPaletteOpen(p => !p)}
            title="Change palette"
          >
            <PaletteIcon />
          </button>
          {paletteOpen && (
            <PalettePopup
              palettes={palettes}
              activePaletteId={activePaletteId}
              onSelect={id => { setActivePaletteId(id); setPaletteOpen(false) }}
              onAdd={p => { setPalettes(prev => [...prev, p]); setActivePaletteId(p.id); setPaletteOpen(false) }}
              onUpdate={p => setPalettes(prev => prev.map(existing => existing.id === p.id ? p : existing))}
            />
          )}
        </div>
      )}

      {/* ── Widget board ── */}
      {mode === 'idle' && widgets.length > 0 && (
        <div className="widget-board" ref={boardRef}>
          {widgets.map(w => (
            <div
              key={w.id}
              className="widget-card"
              style={{ left: w.x, top: w.y, width: w.width, height: w.height, zIndex: w.z ?? 1 }}
            >
              {/* Drag handle */}
              <div className="widget-drag-handle" onMouseDown={e => handleDragStart(e, w.id)}>
                <span className="drag-grip">⠿</span>
                <button
                  className="widget-remove-btn"
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => removeWidget(w.id)}
                  title="Remove"
                >×</button>
              </div>
              {/* Widget content */}
              <div className="widget-content">
                {w.type === 'digital-clock' && <DigitalClock />}
                {w.type === 'analog-clock'  && <AnalogClock />}
                {w.type === 'image' && (
                  <MediaWidget data={w.data} onUpdate={d => updateWidgetData(w.id, d)} accept="image/*" label="Upload Image" />
                )}
                {w.type === 'gif' && (
                  <MediaWidget data={w.data} onUpdate={d => updateWidgetData(w.id, d)} accept="image/gif" label="Upload GIF" />
                )}
                {w.type === 'todo' && (
                  <TodoWidget data={w.data} onUpdate={d => updateWidgetData(w.id, d)} />
                )}
              </div>
              {/* Resize handle */}
              <div className="widget-resize-handle" onMouseDown={e => handleResizeStart(e, w.id)} />
            </div>
          ))}
        </div>
      )}

      {/* ── Idle decorative (no widgets) ── */}
      {mode === 'idle' && widgets.length === 0 && (
        <div className="detail-decorative">
          <DefaultClock />
          <p className="decorative-hint">Select an assignment or task to see details</p>
        </div>
      )}

    </div>
  )
}
