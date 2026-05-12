import { useState, useRef, useCallback, useEffect } from 'react'

const LANG_MAP: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  zh: 'zh-CN',
  he: 'he-IL',
}

const CHARS_PER_SECOND = 14
const SENTENCE_PAUSE_MS = 1800

// Paced mode: stop reading when this many words ahead of user
const PACED_LEAD_LIMIT = 5
// Paced mode: resume from this many words before the user's position
const PACED_RESUME_OVERLAP = 4
// Paced mode: resume when user is within this many words of where we stopped
const PACED_RESUME_GAP = 2

/** Split text into sentences, keeping punctuation attached */
function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]+[\s]*/g)
  if (!parts) return [text]
  return parts.map(s => s.trimEnd())
}

/** Split text into word tokens with their character offsets */
function tokenizeWords(text: string): { word: string; charStart: number }[] {
  const tokens: { word: string; charStart: number }[] = []
  const regex = /\S+/g
  let match
  while ((match = regex.exec(text)) !== null) {
    tokens.push({ word: match[0], charStart: match.index })
  }
  return tokens
}

interface UseSpeechSynthesisOptions {
  language: string
  repeatSentences?: boolean
  pacedMode?: boolean
  userWordCount?: number
}

export function useSpeechSynthesis({
  language,
  repeatSentences = false,
  pacedMode = false,
  userWordCount = 0,
}: UseSpeechSynthesisOptions) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [rate, setRateState] = useState(1.0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const textRef = useRef('')
  const wordsRef = useRef<{ word: string; charStart: number }[]>([])
  const sentencesRef = useRef<string[]>([])
  const sentenceIndexRef = useRef(0)
  const repeatPassRef = useRef(0)
  const charOffsetRef = useRef(0)
  const rateRef = useRef(1.0)
  const repeatRef = useRef(false)
  const pacedRef = useRef(false)
  const userWordCountRef = useRef(0)
  const spokenWordIndexRef = useRef(0) // last word index spoken in paced mode
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const stoppedRef = useRef(false)
  const waitingRef = useRef(false)

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Keep refs in sync with props
  useEffect(() => { repeatRef.current = repeatSentences }, [repeatSentences])
  useEffect(() => { pacedRef.current = pacedMode }, [pacedMode])
  useEffect(() => {
    userWordCountRef.current = userWordCount
    // If waiting for user to catch up, check if we can resume
    if (waitingRef.current && pacedRef.current) {
      const gap = spokenWordIndexRef.current - userWordCount
      if (gap <= PACED_RESUME_GAP) {
        resumeFromPacedWait()
      }
    }
  }, [userWordCount]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel()
      if (timerRef.current) clearInterval(timerRef.current)
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
    }
  }, [supported])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const charPos = charOffsetRef.current + elapsed * CHARS_PER_SECOND * rateRef.current
      setCurrentTime(charPos / CHARS_PER_SECOND)
    }, 200)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const clearPauseTimeout = useCallback(() => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }
  }, [])

  /** Resume reading after paced-mode wait, starting from overlap position */
  const resumeFromPacedWait = useCallback(() => {
    if (!textRef.current || stoppedRef.current) return
    waitingRef.current = false
    setIsWaiting(false)

    const words = wordsRef.current
    // Start from (userWordCount - PACED_RESUME_OVERLAP), but not before 0
    const resumeWordIdx = Math.max(0, userWordCountRef.current - PACED_RESUME_OVERLAP)
    spokenWordIndexRef.current = resumeWordIdx

    // Find which sentence contains this word, and speak from that char position
    const charPos = resumeWordIdx < words.length ? words[resumeWordIdx].charStart : textRef.current.length
    speakFromChar(charPos, resumeWordIdx)
  }, []) // speakFromChar added below via ref pattern

  /** Core: speak text starting from a character position, tracking words for paced mode */
  const speakFromChar = useCallback((fromChar: number, fromWordIdx: number) => {
    if (!supported || stoppedRef.current) return

    const text = textRef.current
    const substring = text.slice(fromChar)
    if (!substring) {
      setIsPlaying(false)
      setIsPaused(false)
      stopTimer()
      setCurrentTime(text.length / CHARS_PER_SECOND)
      return
    }

    window.speechSynthesis.cancel()
    clearPauseTimeout()

    const utterance = new SpeechSynthesisUtterance(substring)
    utterance.lang = LANG_MAP[language] || language
    utterance.rate = rateRef.current

    charOffsetRef.current = fromChar
    let localWordCount = fromWordIdx

    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        charOffsetRef.current = fromChar + e.charIndex
        localWordCount++
        spokenWordIndexRef.current = localWordCount

        // Paced mode: check if too far ahead
        if (pacedRef.current) {
          const lead = localWordCount - userWordCountRef.current
          if (lead > PACED_LEAD_LIMIT) {
            // Stop and wait for user
            window.speechSynthesis.cancel()
            clearPauseTimeout()
            stopTimer()
            waitingRef.current = true
            setIsWaiting(true)
            // Don't set isPlaying=false — we're still "active", just waiting
            return
          }
        }
      }
    }

    utterance.onend = () => {
      if (stoppedRef.current || waitingRef.current) return
      // Finished all text
      setIsPlaying(false)
      setIsPaused(false)
      stopTimer()
      setCurrentTime(text.length / CHARS_PER_SECOND)
    }

    utterance.onerror = (e) => {
      if (e.error === 'canceled') return
      console.error('[useSpeechSynthesis] error:', e.error)
      setIsPlaying(false)
      setIsPaused(false)
      setIsWaiting(false)
      waitingRef.current = false
      stopTimer()
    }

    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
    setIsPaused(false)
    startTimer()
  }, [supported, language, startTimer, stopTimer, clearPauseTimeout])

  // Wire up resumeFromPacedWait to use speakFromChar via a ref
  const speakFromCharRef = useRef(speakFromChar)
  useEffect(() => { speakFromCharRef.current = speakFromChar }, [speakFromChar])

  // Override resumeFromPacedWait to use current speakFromChar
  const resumeFromPacedWaitFn = useCallback(() => {
    if (!textRef.current || stoppedRef.current) return
    waitingRef.current = false
    setIsWaiting(false)

    const words = wordsRef.current
    const resumeWordIdx = Math.max(0, userWordCountRef.current - PACED_RESUME_OVERLAP)
    spokenWordIndexRef.current = resumeWordIdx

    const charPos = resumeWordIdx < words.length ? words[resumeWordIdx].charStart : textRef.current.length
    speakFromCharRef.current(charPos, resumeWordIdx)
  }, [])

  // Re-check paced wait on userWordCount change
  useEffect(() => {
    userWordCountRef.current = userWordCount
    if (waitingRef.current && pacedRef.current) {
      const gap = spokenWordIndexRef.current - userWordCount
      if (gap <= PACED_RESUME_GAP) {
        resumeFromPacedWaitFn()
      }
    }
  }, [userWordCount, resumeFromPacedWaitFn])

  // --- Sentence-by-sentence mode (non-paced) ---
  const speakSentence = useCallback((sentenceIdx: number, repeatPass: number) => {
    if (!supported) return

    const sentences = sentencesRef.current
    if (sentenceIdx >= sentences.length) {
      setIsPlaying(false)
      setIsPaused(false)
      stopTimer()
      setCurrentTime(textRef.current.length / CHARS_PER_SECOND)
      return
    }

    const sentence = sentences[sentenceIdx]
    const utterance = new SpeechSynthesisUtterance(sentence)
    utterance.lang = LANG_MAP[language] || language
    utterance.rate = rateRef.current

    let offset = 0
    for (let i = 0; i < sentenceIdx; i++) {
      offset += sentences[i].length + 1
    }
    charOffsetRef.current = offset

    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        charOffsetRef.current = offset + e.charIndex
      }
    }

    utterance.onend = () => {
      if (stoppedRef.current) return

      if (repeatRef.current && repeatPass === 0) {
        const pauseMs = SENTENCE_PAUSE_MS / rateRef.current
        stopTimer()
        pauseTimeoutRef.current = setTimeout(() => {
          if (!stoppedRef.current) {
            sentenceIndexRef.current = sentenceIdx
            repeatPassRef.current = 1
            speakSentence(sentenceIdx, 1)
          }
        }, pauseMs)
        return
      }

      const nextIdx = sentenceIdx + 1
      if (nextIdx < sentences.length) {
        const pauseMs = SENTENCE_PAUSE_MS / rateRef.current
        stopTimer()
        pauseTimeoutRef.current = setTimeout(() => {
          if (!stoppedRef.current) {
            sentenceIndexRef.current = nextIdx
            repeatPassRef.current = 0
            speakSentence(nextIdx, 0)
          }
        }, pauseMs)
      } else {
        setIsPlaying(false)
        setIsPaused(false)
        stopTimer()
        setCurrentTime(textRef.current.length / CHARS_PER_SECOND)
      }
    }

    utterance.onerror = (e) => {
      if (e.error === 'canceled') return
      console.error('[useSpeechSynthesis] error:', e.error)
      setIsPlaying(false)
      setIsPaused(false)
      stopTimer()
    }

    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
    setIsPaused(false)
    startTimer()
  }, [supported, language, startTimer, stopTimer])

  // --- Public API ---

  const speakText = useCallback((text: string) => {
    window.speechSynthesis.cancel()
    clearPauseTimeout()
    stoppedRef.current = false
    waitingRef.current = false
    setIsWaiting(false)
    textRef.current = text
    wordsRef.current = tokenizeWords(text)
    sentencesRef.current = splitSentences(text)
    sentenceIndexRef.current = 0
    repeatPassRef.current = 0
    charOffsetRef.current = 0
    spokenWordIndexRef.current = 0
    setDuration(text.length / CHARS_PER_SECOND)
    setCurrentTime(0)

    if (pacedRef.current) {
      speakFromChar(0, 0)
    } else {
      speakSentence(0, 0)
    }
  }, [speakSentence, speakFromChar, clearPauseTimeout])

  const pause = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.pause()
    clearPauseTimeout()
    setIsPaused(true)
    stopTimer()
    const elapsed = (Date.now() - startTimeRef.current) / 1000
    charOffsetRef.current += Math.round(elapsed * CHARS_PER_SECOND * rateRef.current)
  }, [supported, stopTimer, clearPauseTimeout])

  const resume = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.resume()
    setIsPaused(false)
    startTimer()
  }, [supported, startTimer])

  const stop = useCallback(() => {
    if (!supported) return
    stoppedRef.current = true
    waitingRef.current = false
    setIsWaiting(false)
    window.speechSynthesis.cancel()
    clearPauseTimeout()
    setIsPlaying(false)
    setIsPaused(false)
    stopTimer()
  }, [supported, stopTimer, clearPauseTimeout])

  const restart = useCallback(() => {
    if (!textRef.current) return
    stop()
    stoppedRef.current = false
    sentenceIndexRef.current = 0
    repeatPassRef.current = 0
    charOffsetRef.current = 0
    spokenWordIndexRef.current = 0
    setCurrentTime(0)

    if (pacedRef.current) {
      speakFromChar(0, 0)
    } else {
      speakSentence(0, 0)
    }
  }, [stop, speakSentence, speakFromChar])

  const jumpBack = useCallback(() => {
    if (!textRef.current) return

    if (pacedRef.current) {
      // In paced mode, jump back ~4 words from current spoken position
      const words = wordsRef.current
      const targetWordIdx = Math.max(0, spokenWordIndexRef.current - 4)
      stop()
      stoppedRef.current = false
      spokenWordIndexRef.current = targetWordIdx
      const charPos = targetWordIdx < words.length ? words[targetWordIdx].charStart : 0
      charOffsetRef.current = charPos
      setCurrentTime(charPos / CHARS_PER_SECOND)
      speakFromChar(charPos, targetWordIdx)
    } else {
      // Sentence mode: jump to previous sentence
      const sentences = sentencesRef.current
      const targetIdx = Math.max(0, sentenceIndexRef.current - 1)
      stop()
      stoppedRef.current = false
      sentenceIndexRef.current = targetIdx
      repeatPassRef.current = 0
      let offset = 0
      for (let i = 0; i < targetIdx; i++) {
        offset += sentences[i].length + 1
      }
      charOffsetRef.current = offset
      setCurrentTime(offset / CHARS_PER_SECOND)
      speakSentence(targetIdx, 0)
    }
  }, [stop, speakSentence, speakFromChar])

  const setRate = useCallback((newRate: number) => {
    rateRef.current = newRate
    setRateState(newRate)
    if (isPlaying && !isPaused && !isWaiting) {
      window.speechSynthesis.cancel()
      clearPauseTimeout()
      if (pacedRef.current) {
        speakFromChar(charOffsetRef.current, spokenWordIndexRef.current)
      } else {
        speakSentence(sentenceIndexRef.current, repeatPassRef.current)
      }
    }
  }, [isPlaying, isPaused, isWaiting, speakSentence, speakFromChar, clearPauseTimeout])

  return {
    speak: speakText,
    pause,
    resume,
    stop,
    restart,
    jumpBack,
    setRate,
    isPlaying,
    isPaused,
    isWaiting,
    currentTime,
    duration,
    rate,
    supported,
  }
}
