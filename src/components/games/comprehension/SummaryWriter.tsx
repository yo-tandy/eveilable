import { useState, useMemo, useRef } from 'react'
import { preciseNow } from '../../../utils/timing'

interface SummaryWriterProps {
  mode: 'complete' | 'race'
  language: string
  onSubmit: (summary: string, writingTimeMs: number) => void
  error: string | null
}

const MIN_WORDS = 30
const MAX_WORDS = 60

export function SummaryWriter({ language, onSubmit, error }: SummaryWriterProps) {
  const [text, setText] = useState('')
  const startRef = useRef(preciseNow())

  const wordCount = useMemo(() => {
    return text.trim().split(/\s+/).filter(Boolean).length
  }, [text])

  const wordCountColor = wordCount < MIN_WORDS
    ? 'text-red-500'
    : wordCount > MAX_WORDS
      ? 'text-red-500'
      : 'text-green-600'

  const isValid = wordCount >= MIN_WORDS && wordCount <= MAX_WORDS

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="display text-[30px] leading-tight mb-2">Write a Summary</h2>
      <p className="text-ink-2 mb-6">
        Write a {MIN_WORDS}-{MAX_WORDS} word summary of the article you just read.
      </p>

      {error && (
        <div className="mb-4 alert-error">
          {error}. Edit your summary and try again.
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        dir={language === 'he' ? 'rtl' : 'ltr'}
        className="field w-full h-48 p-4 rounded-xl resize-none text-lg leading-relaxed"
        placeholder="Write your summary here..."
      />

      <div className={`mt-2 text-right font-medium ${wordCountColor}`}>
        {wordCount} words
        <span className="text-ink-3 ml-1">
          ({MIN_WORDS}-{MAX_WORDS} required)
        </span>
      </div>

      <button
        onClick={() => onSubmit(text.trim(), preciseNow() - startRef.current)}
        disabled={!isValid}
        className="mt-6 w-full py-3 btn btn-sun disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Summary
      </button>
    </div>
  )
}
