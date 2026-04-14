// ─── Syllabus Parser ──────────────────────────────────────
// Extracts assignment/exam data from raw PDF text.

const ASSIGNMENT_KEYWORDS = /\b(assignment|homework|hw|quiz|exam|midterm|final|paper|essay|project|presentation|reading|lab|report|discussion|response|reflection|draft|submission|due)\b/i

const DATE_PATTERNS = [
  // "April 20", "Apr 20", "Apr. 20"
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.\s]+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?\b/gi,
  // "4/20", "04/20", "4/20/2026"
  /\b(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])(?:\/\d{2,4})?\b/g,
  // "Mon, Apr 20" or "Monday April 20"
  /\b(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?),?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.\s]+(\d{1,2})\b/gi,
]

const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
}

function normalizeDate(raw) {
  // Try "Month Day" format
  const wordMatch = raw.match(/^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.\s]+(\d{1,2})(?:,?\s*(\d{4}))?/i)
  if (wordMatch) {
    const month = MONTH_MAP[wordMatch[1].toLowerCase().slice(0, 3)]
    const day = parseInt(wordMatch[2], 10)
    const year = wordMatch[3] ? parseInt(wordMatch[3], 10) : new Date().getFullYear()
    return new Date(year, month, day)
  }

  // Try numeric "M/D" or "M/D/YYYY"
  const numMatch = raw.match(/^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])(?:\/(\d{2,4}))?$/)
  if (numMatch) {
    const month = parseInt(numMatch[1], 10) - 1
    const day = parseInt(numMatch[2], 10)
    let year = numMatch[3] ? parseInt(numMatch[3], 10) : new Date().getFullYear()
    if (year < 100) year += 2000
    return new Date(year, month, day)
  }

  return null
}

function extractDatesFromLine(line) {
  const dates = []
  for (const pattern of DATE_PATTERNS) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(line)) !== null) {
      const d = normalizeDate(match[0].trim())
      if (d && !isNaN(d.getTime())) dates.push(d)
    }
  }
  return dates
}

function guessAssignmentType(line) {
  const l = line.toLowerCase()
  if (/\b(midterm|mid-term)\b/.test(l)) return 'exam'
  if (/\b(final exam|final)\b/.test(l)) return 'exam'
  if (/\b(quiz)\b/.test(l)) return 'quiz'
  if (/\b(exam|test)\b/.test(l)) return 'exam'
  if (/\b(paper|essay|report|reflection|response|draft)\b/.test(l)) return 'essay'
  if (/\b(project|presentation)\b/.test(l)) return 'project'
  if (/\b(reading|chapter)\b/.test(l)) return 'reading'
  if (/\b(lab)\b/.test(l)) return 'lab'
  if (/\b(homework|hw|assignment)\b/.test(l)) return 'assignment'
  if (/\b(discussion)\b/.test(l)) return 'discussion'
  return 'assignment'
}

// Lines that look like admin metadata, not course names
const JUNK_LINE = /^(crn|section|a\d{2}|instructor|office|email|phone|prerequisite|credit|units?|hours?|term|semester|spring|fall|winter|summer|catalog|course number|course code)\b/i
const JUNK_ONLY = /^[A-Z0-9\s\-:/]{1,20}$/ // all-caps short codes like "A01 CRN 12345"

function isJunkLine(line) {
  if (JUNK_LINE.test(line)) return true
  // Reject lines that are just uppercase codes/numbers with no real words
  if (JUNK_ONLY.test(line) && !/[a-z]/.test(line)) return true
  return false
}

function extractCourseName(lines, filename) {
  // 1. Look for "Course Title:" or "Course:" label patterns first
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const line = lines[i].trim()
    if (/^(course title|course name|course)\s*:/i.test(line)) {
      const afterColon = line.split(':').slice(1).join(':').trim()
      if (afterColon.length > 3) return afterColon
      const next = lines[i + 1]?.trim()
      if (next && next.length > 3 && next.length < 80 && !isJunkLine(next)) return next
    }
  }

  // 2. Prefer lines with a real course code + title (e.g. "AI 201: Creative Computing")
  for (const line of lines.slice(0, 40)) {
    const trimmed = line.trim()
    if (trimmed.length < 6 || trimmed.length > 100) continue
    if (/https?:|@/.test(trimmed)) continue
    if (isJunkLine(trimmed)) continue
    // Course code followed by a real title word
    if (/[A-Z]{2,5}\s*\d{3,4}[\s:–—-]+[A-Za-z]/.test(trimmed)) return trimmed
  }

  // 3. Any line with a course code (but not a junk-only line)
  for (const line of lines.slice(0, 40)) {
    const trimmed = line.trim()
    if (trimmed.length < 6 || trimmed.length > 100) continue
    if (/https?:|@/.test(trimmed)) continue
    if (isJunkLine(trimmed)) continue
    if (/[A-Z]{2,5}\s*\d{3,4}/.test(trimmed)) return trimmed
  }

  // 4. First clean line that has mixed case (real words, not all-caps junk)
  for (const line of lines.slice(0, 20)) {
    const trimmed = line.trim()
    if (trimmed.length < 5 || trimmed.length > 70) continue
    if (/https?:|@|©/.test(trimmed)) continue
    if (isJunkLine(trimmed)) continue
    if (!/^\d+$/.test(trimmed) && /[A-Za-z]{3,}/.test(trimmed)) return trimmed
  }

  // 5. Fall back to the filename (strip extension, clean up separators)
  return filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim()
}

export function parseSyllabus(text, filename) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const courseName = extractCourseName(lines, filename)
  const assignments = []
  let idCounter = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!ASSIGNMENT_KEYWORDS.test(line)) continue

    const dates = extractDatesFromLine(line)

    // Also check the next 2 lines for a date if this line has keyword but no date
    const nearbyLines = [line, lines[i + 1] || '', lines[i + 2] || '']
    let allDates = [...dates]
    if (allDates.length === 0) {
      for (const nearby of nearbyLines.slice(1)) {
        allDates = [...allDates, ...extractDatesFromLine(nearby)]
      }
    }

    if (allDates.length === 0) continue

    // Clean up the line to get a usable name
    let name = line
      .replace(DATE_PATTERNS[0], '')
      .replace(DATE_PATTERNS[1], '')
      .replace(DATE_PATTERNS[2], '')
      .replace(/due:?\s*/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim()

    if (name.length < 3 || name.length > 120) name = line.slice(0, 80).trim()

    assignments.push({
      id: `${filename}-${idCounter++}`,
      name,
      courseName,
      dueDate: allDates[0],
      type: guessAssignmentType(line),
      completed: false,
      source: filename,
    })
  }

  return { courseName, assignments }
}
