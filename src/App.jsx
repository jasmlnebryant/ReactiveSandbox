import { useRef, useState } from 'react'
import WeeklyView from './components/WeeklyView/WeeklyView'
import MonthlyView from './components/MonthlyView/MonthlyView'
import DetailView from './components/DetailView/DetailView'
import { extractPdfText } from './utils/extractPdfText'
import { parseSyllabus } from './utils/parseSyllabus'
import './App.css'

function getWeekStart(offsetWeeks = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay() + offsetWeeks * 7)
  return d
}

export default function App() {
  const fileInputRef = useRef(null)
  const [overlayState, setOverlayState] = useState('idle')
  const [processedCourses, setProcessedCourses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [processingLabel, setProcessingLabel] = useState('')
  const [editingCourseIndex, setEditingCourseIndex] = useState(null)
  const [editingCourseName, setEditingCourseName] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)

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

  function handleDismiss() {
    setOverlayState('done')
    // Jump to the week/month of the nearest upcoming assignment
    const now = new Date()
    const upcoming = assignments
      .map(a => new Date(a.dueDate))
      .filter(d => d >= now)
      .sort((a, b) => a - b)

    if (upcoming.length > 0) {
      const nearest = upcoming[0]
      // Week offset: how many weeks from the current week start to nearest's week start
      const currentWeekStart = getWeekStart(0)
      const nearestWeekStart = new Date(nearest)
      nearestWeekStart.setDate(nearest.getDate() - nearest.getDay())
      nearestWeekStart.setHours(0, 0, 0, 0)
      const diffMs = nearestWeekStart - currentWeekStart
      const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))
      setWeekOffset(diffWeeks)

      // Month offset
      const todayYear = now.getFullYear()
      const todayMonth = now.getMonth()
      const nearestYear = nearest.getFullYear()
      const nearestMonth = nearest.getMonth()
      setMonthOffset((nearestYear - todayYear) * 12 + (nearestMonth - todayMonth))
    }
  }

  const showOverlay = overlayState !== 'done'

  return (
    <div className="app-layout">

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        multiple
        style={{ display: 'none' }}
        onChange={handleFilesSelected}
      />

      {/* ── Left column: Weekly + Monthly ── */}
      <div className="left-column">
        <div className="panel panel-weekly">
          <WeeklyView
            assignments={assignments}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            weekOffset={weekOffset}
            onWeekChange={setWeekOffset}
          />
        </div>
        <div className="panel panel-monthly">
          <MonthlyView
            assignments={assignments}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            monthOffset={monthOffset}
            onMonthChange={setMonthOffset}
          />
        </div>
      </div>

      {/* ── Right column: Detail ── */}
      <div className="panel panel-detail">
        <DetailView
          selectedItem={selectedItem}
          onComplete={item => {
            setAssignments(prev => prev.map(a => a.id === item.id ? { ...a, completed: true } : a))
            setSelectedItem(null)
          }}
          onDelete={item => {
            setAssignments(prev => prev.filter(a => a.id !== item.id))
            setSelectedItem(null)
          }}
        />
      </div>

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
                  <p className="prompt-sub">Upload a syllabus or create your first task to begin.</p>
                </div>
                <div className="prompt-actions">
                  <button className="prompt-btn primary" onClick={handleUploadClick}>Upload Syllabus</button>
                  <span className="prompt-or">OR</span>
                  <button className="prompt-btn secondary">Create a Task</button>
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
                  <p className="prompt-eyebrow">Upload complete</p>
                  <p className="prompt-title success-title">Done.</p>
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
                            <button
                              className="course-edit-btn"
                              onClick={() => handleEditCourse(i, c.name)}
                              title="Rename course"
                            >
                              <PencilIcon />
                            </button>
                          </div>
                        )}
                        <span className="success-course-count">{c.error ? 'Could not parse' : `${c.count} item${c.count !== 1 ? 's' : ''}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="prompt-actions">
                  <button className="prompt-btn primary" onClick={handleDismiss}>View Schedule</button>
                  <span className="prompt-or">OR</span>
                  <button className="prompt-btn secondary" onClick={handleUploadClick}>Upload More</button>
                </div>
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
