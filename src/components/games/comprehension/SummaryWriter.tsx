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
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}. Edit your summary and try again.
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        dir={language === 'he' ? 'rtl' : 'ltr'}
        className="w-full h-48 p-4 border-2 border-gray-300 rounded-xl resize-none focus:border-brand-500 focus:outline-none text-lg leading-relaxed"
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
        className="mt-6 w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Summary
      </button>
    </div>
  )
}
