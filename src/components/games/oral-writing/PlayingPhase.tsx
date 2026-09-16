import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, RotateCcw, Rewind, Send, Repeat, TextCursorInput } from 'lucide-react'
import { useSpeechSynthesis } from '../../../hooks/useSpeechSynthesis'

interface PlayingPhaseProps {
  text: string
  language: string
  onComplete: (userInput: string, elapsedMs: number) => void
}

const SPEED_OPTIONS = [
  { label: '0.3x', value: 0.3 },
  { label: '0.5x', value: 0.5 },
  { label: '0.7x', value: 0.7 },
  { label: '1x', value: 1.0 },
  { label: '1.3x', value: 1.3 },
]

export function PlayingPhase({ text, language, onComplete }: PlayingPhaseProps) {
  const { t } = useTranslation()
  const [userInput, setUserInput] = useState('')
  const [repeatMode, setRepeatMode] = useState(false)
  const [pacedMode, setPacedMode] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const startTimeRef = useRef(Date.now())
  const isRTL = language === 'he'

  const userWordCount = useMemo(
    () => userInput.trim().split(/\s+/).filter(Boolean).length,
    [userInput],
  )

  const tts = useSpeechSynthesis({
    language,
    repeatSentences: repeatMode && !pacedMode,
    pacedMode,
    userWordCount,
  })

  // Auto-play on mount
  useEffect(() => {
    if (tts.supported) {
      const timer = setTimeout(() => tts.speak(text), 400)
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handlePlayPause = useCallback(() => {
    if (!tts.isPlaying) {
      tts.speak(text)
    } else if (tts.isPaused) {
      tts.resume()
    } else {
      tts.pause()
    }
  }, [tts, text])

  const handleSubmit = useCallback(() => {
    tts.stop()
    const elapsed = Date.now() - startTimeRef.current
    onComplete(userInput, elapsed)
  }, [tts, userInput, onComplete])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && userInput.trim()) {
      handleSubmit()
    }
  }, [userInput, handleSubmit])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Paced and repeat are mutually exclusive
  const toggleRepeat = useCallback(() => {
    setRepeatMode(r => !r)
    setPacedMode(false)
  }, [])

  const togglePaced = useCallback(() => {
    setPacedMode(p => !p)
    setRepeatMode(false)
  }, [])

  if (!tts.supported) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="sticker-sm p-6 text-center text-red-600">
          {t('games.oralWriting.notSupported')}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      {/* Audio controls */}
      <div className="sticker-sm p-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          {/* Restart */}
          <button
            onClick={tts.restart}
            className="p-2.5 rounded-xl sticker-flat hover:scale-105 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
            title={t('games.oralWriting.restart')}
            aria-label={t('games.oralWriting.restart')}
          >
            <RotateCcw size={18} className="text-gray-600" />
          </button>

          {/* Jump back */}
          <button
            onClick={() => tts.jumpBack()}
            className="p-2.5 rounded-xl sticker-flat hover:scale-105 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
            title={t('games.oralWriting.jumpBack')}
            aria-label={t('games.oralWriting.jumpBack')}
          >
            <Rewind size={18} className="text-gray-600" />
          </button>

          {/* Play/Pause (large) */}
          <button
            onClick={handlePlayPause}
            className="p-4 rounded-full bg-sky-500 text-white hover:bg-sky-600 hover:scale-105 transition-all shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
            aria-label={tts.isPlaying && !tts.isPaused ? t('games.oralWriting.pause') : t('games.oralWriting.play')}
            aria-pressed={tts.isPlaying && !tts.isPaused}
          >
            {tts.isPlaying && !tts.isPaused
              ? <Pause size={24} />
              : <Play size={24} className="ml-0.5" />
            }
          </button>

          {/* Repeat toggle */}
          <button
            onClick={toggleRepeat}
            className={`p-2.5 rounded-xl transition-all hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 ${
              repeatMode
                ? 'bg-sky-500 text-white shadow-md'
                : 'sticker-flat text-gray-600'
            }`}
            title={t('games.oralWriting.repeatMode')}
            aria-label={t('games.oralWriting.repeatMode')}
            aria-pressed={repeatMode}
          >
            <Repeat size={18} />
          </button>

          {/* Paced mode toggle */}
          <button
            onClick={togglePaced}
            className={`p-2.5 rounded-xl transition-all hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 ${
              pacedMode
                ? 'bg-sky-500 text-white shadow-md'
                : 'sticker-flat text-gray-600'
            }`}
            title={t('games.oralWriting.pacedMode')}
            aria-label={t('games.oralWriting.pacedMode')}
            aria-pressed={pacedMode}
          >
            <TextCursorInput size={18} />
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex justify-center mb-3">
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => tts.setRate(opt.value)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-700 ${
                  tts.rate === opt.value
                    ? 'bg-sky-500 text-white'
                    : 'bg-white/50 text-gray-600 hover:bg-gray-100'
                }`}
                aria-label={`${t('games.oralWriting.speed')} ${opt.label}`}
                aria-pressed={tts.rate === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 text-xs text-ink-2">
          <span>{formatTime(tts.currentTime)}</span>
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-400 rounded-full transition-all duration-200"
              style={{ width: `${tts.duration > 0 ? Math.min(100, (tts.currentTime / tts.duration) * 100) : 0}%` }}
            />
          </div>
          <span>{formatTime(tts.duration)}</span>
        </div>

        {/* Waiting indicator */}
        {tts.isWaiting && (
          <div className="mt-2 text-center text-xs text-sky-600 font-medium animate-pulse">
            {t('games.oralWriting.waitingForYou')}
          </div>
        )}
      </div>

      {/* Text input */}
      <div className="sticker-sm p-4">
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          dir={isRTL ? 'rtl' : 'ltr'}
          placeholder={t('games.oralWriting.typeWhatYouHear')}
          className="w-full h-48 bg-transparent resize-none outline-none text-ink placeholder:text-ink-3 text-lg leading-relaxed"
        />
        <div className="flex justify-between items-center text-xs text-ink-3 mt-2">
          <span>{userWordCount} {t('games.oralWriting.words')}</span>
          <span className="text-gray-300">Ctrl+Enter {t('games.oralWriting.toSubmit')}</span>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!userInput.trim()}
        className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 btn btn-sun transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Send size={18} />
        {t('games.oralWriting.submit')}
      </button>
    </div>
  )
}
