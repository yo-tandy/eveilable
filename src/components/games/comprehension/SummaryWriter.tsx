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
      <h2 className="text-2xl font-bold mb-2">Write a Summary</h2>
      <p className="text-gray-500 mb-6">
        Write a {MIN_WORDS}-{MAX_WORDS} word summary of the article you just read.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-700 text-sm">
          {error}. Edit your summary and try again.
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        dir={language === 'he' ? 'rtl' : 'ltr'}
        className="glass-input w-full h-48 p-4 rounded-xl resize-none text-lg leading-relaxed"
        placeholder="Write your summary here..."
      />

      <div className={`mt-2 text-right font-medium ${wordCountColor}`}>
        {wordCount} words
        <span className="text-gray-400 ml-1">
          ({MIN_WORDS}-{MAX_WORDS} required)
        </span>
      </div>

      <button
        onClick={() => onSubmit(text.trim(), preciseNow() - startRef.current)}
        disabled={!isValid}
        className="mt-6 w-full py-3 bg-black/75 backdrop-blur-sm text-white rounded-xl font-semibold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Summary
      </button>
    </div>
  )
}
