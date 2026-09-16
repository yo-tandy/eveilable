import { useState, useCallback, useRef } from 'react'
import { preciseNow } from '../../../utils/timing'
import type { ComprehensionQuestion } from '../../../types/comprehension'

interface QuestionPanelProps {
  questions: ComprehensionQuestion[]
  mode: 'complete' | 'race'
  onComplete: (answers: number[], timesMs: number[]) => void
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export function QuestionPanel({ questions, onComplete }: QuestionPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [timesMs, setTimesMs] = useState<number[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const questionStartRef = useRef(preciseNow())

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  const handleNext = useCallback(() => {
    if (selectedOption === null) return

    const elapsed = preciseNow() - questionStartRef.current
    const newAnswers = [...answers, selectedOption]
    const newTimes = [...timesMs, elapsed]

    setAnswers(newAnswers)
    setTimesMs(newTimes)
    setSelectedOption(null)

    if (isLastQuestion) {
      onComplete(newAnswers, newTimes)
    } else {
      setCurrentIndex((prev) => prev + 1)
      questionStartRef.current = preciseNow()
    }
  }, [selectedOption, answers, timesMs, isLastQuestion, onComplete])

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-ink-2">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${
                i < currentIndex ? 'bg-black/60' :
                i === currentIndex ? 'bg-black/30' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      <h3 className="text-xl font-medium mb-6">{currentQuestion.question}</h3>

      {/* Selected state matches LanguageSelector: white fill + indigo ring, plus a filled letter badge. */}
      <div className="space-y-3 mb-8" role="group" aria-label={currentQuestion.question}>
        {currentQuestion.options.map((option, i) => {
          const isSelected = selectedOption === i
          return (
            <button
              key={i}
              onClick={() => setSelectedOption(i)}
              aria-pressed={isSelected}
              className={`w-full p-4 text-left rounded-xl transition-all flex items-start gap-3 ${
                isSelected
                  ? 'bg-white/70 ring-2 ring-blue shadow-md'
                  : 'sticker-flat hover:bg-butter'
              }`}
            >
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isSelected ? 'bg-indigo-500 text-white' : 'bg-black/10 text-gray-700'
                }`}
                aria-hidden="true"
              >
                {OPTION_LABELS[i]}
              </span>
              <span className={`pt-0.5 ${isSelected ? 'font-medium' : ''}`}>{option}</span>
            </button>
          )
        })}
      </div>

      <button
        onClick={handleNext}
        disabled={selectedOption === null}
        className="w-full py-3 btn btn-sun disabled:opacity-50"
      >
        {isLastQuestion ? 'Finish Questions' : 'Next Question'}
      </button>
    </div>
  )
}
