const STORAGE_KEY = 'eveilable-streak'
const MS_PER_DAY = 24 * 60 * 60 * 1000

interface StreakState {
  currentStreak: number
  longestStreak: number
  lastPlayedISODate: string // YYYY-MM-DD in local time
}

/** Returns YYYY-MM-DD for a Date in the local timezone */
function toLocalDateISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function readState(): StreakState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { currentStreak: 0, longestStreak: 0, lastPlayedISODate: '' }
    const parsed = JSON.parse(raw)
    return {
      currentStreak: Number(parsed.currentStreak) || 0,
      longestStreak: Number(parsed.longestStreak) || 0,
      lastPlayedISODate: String(parsed.lastPlayedISODate ?? ''),
    }
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastPlayedISODate: '' }
  }
}

function writeState(state: StreakState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* localStorage unavailable — ignore */
  }
}

/**
 * Record that a session was completed today. Updates the streak accordingly
 * and returns the current streak. Idempotent — calling multiple times per day
 * doesn't increment the streak.
 */
export function recordSessionPlayed(): number {
  const today = toLocalDateISO(new Date())
  const state = readState()

  if (state.lastPlayedISODate === today) {
    return state.currentStreak
  }

  let newStreak: number
  if (state.lastPlayedISODate === '') {
    newStreak = 1
  } else {
    const lastDate = new Date(state.lastPlayedISODate + 'T00:00:00')
    const todayDate = new Date(today + 'T00:00:00')
    const daysDiff = Math.round((todayDate.getTime() - lastDate.getTime()) / MS_PER_DAY)

    if (daysDiff === 1) {
      newStreak = state.currentStreak + 1
    } else if (daysDiff <= 0) {
      // clock went backwards, ignore
      return state.currentStreak
    } else {
      newStreak = 1
    }
  }

  const newState: StreakState = {
    currentStreak: newStreak,
    longestStreak: Math.max(state.longestStreak, newStreak),
    lastPlayedISODate: today,
  }
  writeState(newState)
  return newStreak
}

/** Read current streak without recording a play. May return a stale streak
 * if the user missed a day — the display should treat streaks as "at risk"
 * if lastPlayedISODate is yesterday and "broken" (0) if older. */
export function getCurrentStreak(): number {
  const state = readState()
  if (!state.lastPlayedISODate) return 0

  const today = toLocalDateISO(new Date())
  if (state.lastPlayedISODate === today) return state.currentStreak

  const lastDate = new Date(state.lastPlayedISODate + 'T00:00:00')
  const todayDate = new Date(today + 'T00:00:00')
  const daysDiff = Math.round((todayDate.getTime() - lastDate.getTime()) / MS_PER_DAY)
  if (daysDiff === 1) return state.currentStreak // at risk today, still counts
  return 0
}
