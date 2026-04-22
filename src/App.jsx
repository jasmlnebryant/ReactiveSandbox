import { useRef, useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import Tesseract from 'tesseract.js'
import WeeklyView from './components/WeeklyView/WeeklyView'
import MonthlyView from './components/MonthlyView/MonthlyView'
import DetailView from './components/DetailView/DetailView'
import { extractPdfText } from './utils/extractPdfText'
import { parseSyllabus } from './utils/parseSyllabus'
import DateTimePicker from './components/DateTimePicker'
import './App.css'

function getWeekStart(offsetWeeks = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay() + offsetWeeks * 7)
  return d
}

export default function App() {
  const fileInputRef    = useRef(null)
  const settingsBtnRef  = useRef(null)
  const uploadBtnRef   = useRef(null)
  const imageInputRef  = useRef(null)
  const [overlayState, setOverlayState]       = useState('idle')
  const [settingsOpen, setSettingsOpen]       = useState(false)
  const [uploadMenuOpen, setUploadMenuOpen]   = useState(false)
  const [uploadMenuPos, setUploadMenuPos]     = useState(null)
  const [imageForm, setImageForm]             = useState(null)   // null = closed; object = open
  const [pendingTodoItems, setPendingTodoItems] = useState([])
  const [toast, setToast]                     = useState(null)
  const [settingsPopupPos, setSettingsPopupPos] = useState(null)
  const [processedCourses, setProcessedCourses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [processingLabel, setProcessingLabel] = useState('')
  const [editingCourseIndex, setEditingCourseIndex] = useState(null)
  const [editingCourseName, setEditingCourseName] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [settings, setSettings] = useState({
    weekStartDay:   0,        // 0 = Sun, 1 = Mon
    showCompleted:  true,
    hiddenCourses:  [],
    colorCodeBy:    'course', // 'course' | 'type'
    dueSoonEnabled: true,
    dueSoonDays:    3,
  })

  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // All unique course names across current assignments
  const allCourseNames = [...new Set(assignments.map(a => a.courseName).filter(Boolean))].sort()

  // All unique professor names (excluding placeholder N/A)
  const allProfessorNames = [...new Set(
    assignments.map(a => a.professor).filter(p => p && p !== 'N/A')
  )].sort()

  // Filtered view passed to calendar panels
  const visibleAssignments = assignments.filter(a => {
    if (!settings.showCompleted && a.completed) return false
    if (settings.hiddenCourses.includes(a.courseName)) return false
    return true
  })

  // Selecting a card from a panel clears the day view
  function handleSelectItemFromPanel(item) {
    setSelectedItem(item)
    if (item !== null) setSelectedDay(null)
  }

  // Selecting a day toggles it; clicking the same day again deselects
  function handleSelectDay(dayInfo) {
    if (selectedDay && selectedDay.date.toDateString() === dayInfo.date.toDateString()) {
      setSelectedDay(null)
    } else {
      setSelectedDay(dayInfo)
      setSelectedItem(null)
    }
  }

  // Selecting an item from within the day view keeps selectedDay intact
  function handleSelectItemFromDay(item) {
    setSelectedItem(item)
  }

  function handleSettingsToggle() {
    if (!settingsOpen && settingsBtnRef.current) {
      const rect = settingsBtnRef.current.getBoundingClientRect()
      setSettingsPopupPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    setSettingsOpen(p => !p)
  }

  useEffect(() => {
    if (!settingsOpen) return
    function onOutside(e) {
      if (settingsBtnRef.current && !settingsBtnRef.current.contains(e.target)) {
        const popup = document.getElementById('settings-popup')
        if (!popup || !popup.contains(e.target)) setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [settingsOpen])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(id)
  }, [toast])

  useEffect(() => {
    if (!uploadMenuOpen) return
    function onOutside(e) {
      if (uploadBtnRef.current && !uploadBtnRef.current.contains(e.target)) {
        const menu = document.getElementById('upload-menu-popup')
        if (!menu || !menu.contains(e.target)) setUploadMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [uploadMenuOpen])

  function handleUploadClick() {
    fileInputRef.current.click()
  }

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setOverlayState('processing')

    const allAssignments = []
    const courses = []

    for (const file of files) {
      setProcessingLabel(`Reading ${file.name}…`)
      try {
        const text = await extractPdfText(file)
        const { courseName, assignments } = parseSyllabus(text, file.name)
        allAssignments.push(...assignments)
        courses.push({ name: courseName, count: assignments.length })
      } catch (err) {
        console.error(`Failed to parse ${file.name}:`, err)
        courses.push({ name: file.name, count: 0, error: true })
      }
    }

    setAssignments(prev => [...prev, ...allAssignments])
    setProcessedCourses(courses)
    setOverlayState('success')
    e.target.value = ''
  }

  function handleEditCourse(index, currentName) {
    setEditingCourseIndex(index)
    setEditingCourseName(currentName)
  }

  function handleCourseNameSave(index) {
    if (editingCourseName.trim()) {
      setProcessedCourses(prev =>
        prev.map((c, i) => i === index ? { ...c, name: editingCourseName.trim() } : c)
      )
    }
    setEditingCourseIndex(null)
  }

  function handleCourseNameKeyDown(e, index) {
    if (e.key === 'Enter') handleCourseNameSave(index)
    if (e.key === 'Escape') setEditingCourseIndex(null)
  }

  function handleDeleteCourse(index) {
    setProcessedCourses(prev => prev.filter((_, i) => i !== index))
  }

  function handleDismiss() {
    setOverlayState('done')
    setWeekOffset(0)
    setMonthOffset(0)
  }

  function handleUploadMenuToggle() {
    if (!uploadMenuOpen && uploadBtnRef.current) {
      const rect = uploadBtnRef.current.getBoundingClientRect()
      setUploadMenuPos({ top: rect.bottom + 8, left: rect.left })
    }
    setUploadMenuOpen(p => !p)
  }

  function handleImageFileSelected(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async evt => {
      const imageUrl = evt.target.result
      // Show modal immediately with loading state
      setImageForm({ imageUrl, items: null })

      try {
        const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng')
        const items = parseOcrLines(text)
        setImageForm(f => f ? { ...f, items } : f)
      } catch {
        // OCR failed — fall back to one blank row
        setImageForm(f => f ? { ...f, items: [{ id: Date.now(), text: '', dateStr: '' }] } : f)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function parseOcrLines(text) {
    const lines = text
      .split('\n')
      .map(l => l
        .trim()
        // Strip common to-do list markers: bullets, checkboxes, dashes, numbers
        .replace(/^[\-\•\*\–\—\○\□\☐\☑\✓\✗✔►▶]+\s*/, '')
        .replace(/^\d+[\.\)]\s+/, '')
        .trim()
      )
      .filter(l => l.length > 1)  // drop single chars / noise
    const seen = new Set()
    return lines
      .filter(l => { if (seen.has(l)) return false; seen.add(l); return true })
      .map((text, i) => ({ id: Date.now() + i, text, dateStr: '' }))
  }

  function addImageItem() {
    setImageForm(f => ({ ...f, items: [...f.items, { id: Date.now(), text: '', dateStr: '' }] }))
  }

  function removeImageItem(id) {
    setImageForm(f => ({ ...f, items: f.items.filter(item => item.id !== id) }))
  }

  function updateImageItem(id, field, value) {
    setImageForm(f => ({ ...f, items: f.items.map(item => item.id === id ? { ...item, [field]: value } : item) }))
  }

  function handleImageTaskSubmit() {
    if (!imageForm) return
    const valid     = imageForm.items.filter(item => item.text.trim())
    if (!valid.length) return
    const toCal     = valid.filter(item => item.dateStr)
    const toTodo    = valid.filter(item => !item.dateStr)

    if (toCal.length) {
      setAssignments(prev => [...prev, ...toCal.map(item => ({
        id: Date.now() + Math.random(),
        name: item.text.trim(),
        dueDate: new Date(`${item.dateStr}T12:00:00`),
        dueTime: '',
        courseName: 'Personal',
        professor: 'N/A',
        instructions: 'N/A',
        type: 'Task',
        weight: 'N/A',
        completed: false,
        source: 'image',
        color: 'var(--color-4)',
      }))])
    }

    if (toTodo.length) {
      setPendingTodoItems(toTodo.map(item => ({ text: item.text.trim() })))
    }

    const calMsg  = toCal.length  ? `${toCal.length} item${toCal.length  !== 1 ? 's' : ''} added to your schedule` : ''
    const todoMsg = toTodo.length ? `${toTodo.length} item${toTodo.length !== 1 ? 's' : ''} added to your to-do list` : ''
    setToast([calMsg, todoMsg].filter(Boolean).join(' · ') + '.')

    setImageForm(null)
  }

  const showOverlay = overlayState !== 'done'

  return (
    <div className="app-layout">

      {/* ── Background blobs ── */}
      <div className="bg-blobs" aria-hidden="true">
        <div className="bg-blob-x bg-blob-1"><div className="bg-blob-y" /></div>
        <div className="bg-blob-x bg-blob-2"><div className="bg-blob-y bg-blob-2y" /></div>
        <div className="bg-blob-x bg-blob-3"><div className="bg-blob-y bg-blob-3y" /></div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        multiple
        style={{ display: 'none' }}
        onChange={handleFilesSelected}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFileSelected}
      />

      {/* ── Top bar ── */}
      <div className="top-bar">
        <div className="topbar-left">
          <button
            ref={uploadBtnRef}
            className={`topbar-icon-btn ${uploadMenuOpen ? 'active' : ''}`}
            title="Upload"
            onClick={handleUploadMenuToggle}
          >
            <UploadIcon />
          </button>
        </div>
        <div className="topbar-right">
          {/* Palette button is portaled here from DetailView */}
          <div id="topbar-palette-slot" />
          <button
            ref={settingsBtnRef}
            className={`topbar-icon-btn ${settingsOpen ? 'active' : ''}`}
            title="Settings"
            onClick={handleSettingsToggle}
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      {/* ── Main row: panels ── */}
      <div className="main-row">

        {/* Left column: Weekly + Monthly */}
        <div className="left-column">
          <div className="panel panel-weekly">
            <WeeklyView
              assignments={visibleAssignments}
              allAssignments={assignments}
              selectedItem={selectedItem}
              onSelectItem={handleSelectItemFromPanel}
              onSelectDay={handleSelectDay}
              weekOffset={weekOffset}
              onWeekChange={setWeekOffset}
              settings={settings}
            />
          </div>
          <div className="panel panel-monthly">
            <MonthlyView
              assignments={visibleAssignments}
              allAssignments={assignments}
              selectedItem={selectedItem}
              onSelectItem={handleSelectItemFromPanel}
              monthOffset={monthOffset}
              onMonthChange={setMonthOffset}
              onSelectDay={handleSelectDay}
              settings={settings}
            />
          </div>
        </div>

        {/* Right column: Detail */}
        <div className="panel panel-detail">
          <DetailView
            selectedItem={selectedItem}
            selectedDay={selectedDay}
            onSelectItem={handleSelectItemFromDay}
            onComplete={item => {
              const toggled = !item.completed
              setAssignments(prev => prev.map(a => a.id === item.id ? { ...a, completed: toggled } : a))
              setSelectedItem(prev => prev ? { ...prev, completed: toggled } : null)
            }}
            onDelete={item => {
              setAssignments(prev => prev.filter(a => a.id !== item.id))
              setSelectedItem(null)
            }}
            onEdit={updated => {
              setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a))
              setSelectedItem(updated)
            }}
            onRenameCourse={(oldName, newName) => {
              setAssignments(prev => prev.map(a =>
                a.courseName === oldName ? { ...a, courseName: newName } : a
              ))
            }}
            courseNames={allCourseNames}
            professorNames={allProfessorNames}
            onAddItem={item => setAssignments(prev => [...prev, item])}
            pendingTodoItems={pendingTodoItems}
            onTodoConsumed={() => setPendingTodoItems([])}
          />
        </div>

      </div>{/* ── end main-row ── */}

      {/* ── Settings popup ── */}
      {settingsOpen && settingsPopupPos && ReactDOM.createPortal(
        <div
          id="settings-popup"
          className="settings-popup"
          style={{ top: settingsPopupPos.top, right: settingsPopupPos.right }}
        >
          <div className="settings-popup-header">
            <span className="settings-popup-title">Settings</span>
          </div>
          <div className="settings-popup-body">

            {/* ── Calendar section ── */}
            <p className="settings-section-label">Calendar</p>

            <div className="settings-row">
              <span className="settings-row-label">Week starts on</span>
              <div className="settings-segment">
                <button
                  className={`settings-segment-btn ${settings.weekStartDay === 0 ? 'active' : ''}`}
                  onClick={() => updateSetting('weekStartDay', 0)}
                >Sun</button>
                <button
                  className={`settings-segment-btn ${settings.weekStartDay === 1 ? 'active' : ''}`}
                  onClick={() => updateSetting('weekStartDay', 1)}
                >Mon</button>
              </div>
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Show completed</span>
              <button
                className={`settings-toggle ${settings.showCompleted ? 'on' : ''}`}
                onClick={() => updateSetting('showCompleted', !settings.showCompleted)}
              ><span className="settings-toggle-knob" /></button>
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Due-soon highlight</span>
              <button
                className={`settings-toggle ${settings.dueSoonEnabled ? 'on' : ''}`}
                onClick={() => updateSetting('dueSoonEnabled', !settings.dueSoonEnabled)}
              ><span className="settings-toggle-knob" /></button>
            </div>
            {settings.dueSoonEnabled && (
              <div className="settings-row settings-row-sub">
                <span className="settings-row-label">Days threshold</span>
                <div className="settings-day-input-wrap">
                  <button className="settings-day-btn" onClick={() => updateSetting('dueSoonDays', Math.max(1, settings.dueSoonDays - 1))}>−</button>
                  <span className="settings-day-count">{settings.dueSoonDays}</span>
                  <button className="settings-day-btn" onClick={() => updateSetting('dueSoonDays', Math.min(14, settings.dueSoonDays + 1))}>+</button>
                </div>
              </div>
            )}

            {/* ── Courses section ── */}
            <p className="settings-section-label" style={{ marginTop: 14 }}>Courses</p>

            <div className="settings-row">
              <span className="settings-row-label">Color code by</span>
              <div className="settings-segment">
                <button
                  className={`settings-segment-btn ${settings.colorCodeBy === 'course' ? 'active' : ''}`}
                  onClick={() => updateSetting('colorCodeBy', 'course')}
                >Course</button>
                <button
                  className={`settings-segment-btn ${settings.colorCodeBy === 'type' ? 'active' : ''}`}
                  onClick={() => updateSetting('colorCodeBy', 'type')}
                >Type</button>
              </div>
            </div>

            {allCourseNames.length > 0 && (
              <div className="settings-course-list">
                {allCourseNames.map(name => {
                  const hidden = settings.hiddenCourses.includes(name)
                  return (
                    <div key={name} className="settings-row">
                      <span className="settings-row-label settings-course-name">{name}</span>
                      <button
                        className={`settings-toggle ${hidden ? '' : 'on'}`}
                        onClick={() => updateSetting('hiddenCourses',
                          hidden
                            ? settings.hiddenCourses.filter(c => c !== name)
                            : [...settings.hiddenCourses, name]
                        )}
                      ><span className="settings-toggle-knob" /></button>
                    </div>
                  )
                })}
              </div>
            )}
            {allCourseNames.length === 0 && (
              <p className="settings-empty-courses">Upload a syllabus to see courses here.</p>
            )}

          </div>
        </div>,
        document.body
      )}

      {/* ── Upload menu popup ── */}
      {uploadMenuOpen && uploadMenuPos && ReactDOM.createPortal(
        <div
          id="upload-menu-popup"
          className="upload-menu-popup"
          style={{ top: uploadMenuPos.top, left: uploadMenuPos.left }}
        >
          <button className="upload-menu-item" onClick={() => { setUploadMenuOpen(false); fileInputRef.current.click() }}>
            <DocIcon /> Syllabus <span style={{ opacity: 0.5, marginLeft: 4 }}>PDF</span>
          </button>
          <button className="upload-menu-item" onClick={() => { setUploadMenuOpen(false); imageInputRef.current.click() }}>
            <ImageIcon /> To-Do List
          </button>
        </div>,
        document.body
      )}

      {/* ── Image task form ── */}
      {imageForm && (
        <div className="img-form-overlay">
          <div className="img-form-card">

            {/* Image preview */}
            <div className="img-form-preview-wrap">
              <img className="img-form-preview" src={imageForm.imageUrl} alt="Upload preview" />
            </div>

            {/* Item list */}
            <div className="img-form-fields">
              {imageForm.items === null ? (
                <div className="img-form-loading">
                  <div className="img-form-spinner" />
                  <span>Reading your list…</span>
                </div>
              ) : (
                <>
                  <div className="img-form-items-header">
                    <span className="img-form-label">Items</span>
                    <span className="img-form-label" style={{ opacity: 0.5 }}>Due date (optional)</span>
                  </div>

                  {imageForm.items.map((item, i) => (
                    <div key={item.id} className="img-form-item-row">
                      <input
                        className="img-form-input img-form-item-name"
                        placeholder={`Item ${i + 1}`}
                        value={item.text}
                        onChange={e => updateImageItem(item.id, 'text', e.target.value)}
                      />
                      <div className="img-form-item-date">
                        <DateTimePicker
                          hideTime
                          dateStr={item.dateStr}
                          onDateChange={v => updateImageItem(item.id, 'dateStr', v)}
                        />
                      </div>
                      {imageForm.items.length > 1 && (
                        <button className="img-item-remove" onClick={() => removeImageItem(item.id)} title="Remove">×</button>
                      )}
                    </div>
                  ))}

                  <button className="img-item-add" onClick={addImageItem}>+ Add item</button>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="img-form-actions">
              <button
                className="img-form-btn primary"
                onClick={handleImageTaskSubmit}
                disabled={!imageForm.items || !imageForm.items.some(item => item.text.trim())}
              >
                Save to List
              </button>
              <button className="img-form-btn secondary" onClick={() => setImageForm(null)}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Toast notification ── */}
      {toast && (
        <div className="toast-notification">
          {toast}
        </div>
      )}

      {/* ── Overlay ── */}
      {showOverlay && (
        <div className="default-overlay">
          <div className="default-prompt">
            <div className="prompt-blob-x">
              <div className="prompt-blob" />
            </div>

            {overlayState === 'idle' && (
              <>
                <div className="prompt-body">
                  <p className="prompt-eyebrow">Welcome</p>
                  <p className="prompt-title">Get<br />started.</p>
                  <p className="prompt-sub">Upload a syllabus or to-do list to begin.</p>
                </div>
                <div className="prompt-actions">
                  <button className="prompt-btn primary" onClick={handleUploadClick}>Upload Syllabus</button>
                  <span className="prompt-or">OR</span>
                  <button className="prompt-btn secondary" onClick={() => imageInputRef.current.click()}>Upload To-Do List</button>
                  <button className="prompt-btn-skip" onClick={handleDismiss}>Skip to Calendar</button>
                </div>
              </>
            )}

            {overlayState === 'processing' && (
              <div className="prompt-body prompt-status">
                <div className="spinner" />
                <p className="prompt-title processing-title">Processing…</p>
                <p className="prompt-sub">{processingLabel}</p>
              </div>
            )}

            {overlayState === 'success' && (
              <>
                <div className="prompt-body">
                  <p className="prompt-eyebrow">{processedCourses.every(c => c.error) ? 'Something went wrong' : 'Upload complete'}</p>
                  <p className="prompt-title success-title">
                    {processedCourses.every(c => c.error) ? 'Uh oh.' : 'Done.'}
                  </p>
                  <div className="success-courses">
                    {processedCourses.map((c, i) => (
                      <div key={i} className={`success-course-row ${c.error ? 'error' : ''}`}>
                        {editingCourseIndex === i ? (
                          <input
                            className="course-name-input"
                            value={editingCourseName}
                            autoFocus
                            onChange={e => setEditingCourseName(e.target.value)}
                            onBlur={() => handleCourseNameSave(i)}
                            onKeyDown={e => handleCourseNameKeyDown(e, i)}
                          />
                        ) : (
                          <div className="course-name-row">
                            <span className="success-course-name">{c.name}</span>
                            {c.error ? (
                              <button
                                className="course-delete-btn"
                                onClick={() => handleDeleteCourse(i)}
                                title="Remove"
                              >
                                <TrashIcon />
                              </button>
                            ) : (
                              <button
                                className="course-edit-btn"
                                onClick={() => handleEditCourse(i, c.name)}
                                title="Rename course"
                              >
                                <PencilIcon />
                              </button>
                            )}
                          </div>
                        )}
                        <span className="success-course-count">{c.error ? 'Could not parse' : `${c.count} item${c.count !== 1 ? 's' : ''}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {processedCourses.every(c => c.error) ? (
                  <div className="prompt-actions">
                    <button className="prompt-btn primary" onClick={handleUploadClick}>Upload Syllabus</button>
                    <span className="prompt-or">OR</span>
                    <button className="prompt-btn secondary" onClick={() => imageInputRef.current.click()}>Upload To-Do List</button>
                    <button className="prompt-btn-skip" onClick={handleDismiss}>Skip to Calendar</button>
                  </div>
                ) : (
                  <div className="prompt-actions">
                    <button className="prompt-btn primary" onClick={handleDismiss}>View Schedule</button>
                    <span className="prompt-or">OR</span>
                    <button className="prompt-btn secondary" onClick={handleUploadClick}>Upload More</button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      )}

    </div>
  )
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}

function DocIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}
