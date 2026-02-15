import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'lucide-react'

interface KeyboardCheckProps {
  language: string
  onConfirm: () => void
}

const LANGUAGE_NAMES: Record<string, string> = {
  zh: 'Chinese',
  he: 'Hebrew',
}

export function KeyboardCheck({ language, onConfirm }: KeyboardCheckProps) {
  const { t } = useTranslation()
  const [testInput, setTestInput] = useState('')

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <Keyboard size={48} className="mx-auto mb-4 text-brand-600" />
      <h2 className="text-2xl font-bold mb-4">Keyboard Check</h2>
      <p className="text-gray-600 mb-6">
        Please ensure your keyboard is set to {LANGUAGE_NAMES[language] || language}.
        Type a word below to verify:
      </p>
      <input
        type="text"
        value={testInput}
        onChange={(e) => setTestInput(e.target.value)}
        className="w-full p-4 border-2 border-gray-300 rounded-xl text-2xl text-center focus:border-brand-500 focus:outline-none"
        placeholder="Type here..."
        dir={language === 'he' ? 'rtl' : 'ltr'}
      />
      <button
        onClick={onConfirm}
        disabled={testInput.length < 2}
        className="mt-6 w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('common.continue')}
      </button>
    </div>
  )
}
