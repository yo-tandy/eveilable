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
        <span className="text-sm text-gray-500">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${
                i < currentIndex ? 'bg-brand-500' :
                i === currentIndex ? 'bg-brand-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <h3 className="text-xl font-medium mb-6">{currentQuestion.question}</h3>

      <div className="space-y-3 mb-8">
        {currentQuestion.options.map((option, i) => (
          <button
            key={i}
            onClick={() => setSelectedOption(i)}
            className={`w-full p-4 text-left rounded-xl border-2 transition-colors ${
              selectedOption === i
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="font-bold text-brand-600 mr-3">{OPTION_LABELS[i]}</span>
            {option}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={selectedOption === null}
        className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
      >
        {isLastQuestion ? 'Finish Questions' : 'Next Question'}
      </button>
    </div>
  )
}
