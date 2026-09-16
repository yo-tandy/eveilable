import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'lucide-react'

interface KeyboardCheckProps {
  language: string
  onConfirm: () => void
}

export function KeyboardCheck({ language, onConfirm }: KeyboardCheckProps) {
  const { t } = useTranslation()
  const [testInput, setTestInput] = useState('')

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <div className="art art-language w-20 h-20 mx-auto mb-4 -rotate-3">
        <Keyboard size={40} strokeWidth={2.4} aria-hidden="true" />
      </div>
      <h2 className="display text-[30px] mb-3">{t('common.keyboardCheck')}</h2>
      <p className="text-ink-2 font-bold mb-6">
        {t('common.keyboardCheckHint', { language: t(`languages.${language}`) })}
      </p>
      <input
        type="text"
        value={testInput}
        onChange={(e) => setTestInput(e.target.value)}
        className="field w-full p-4 text-2xl text-center"
        placeholder={t('common.typeHere')}
        dir={language === 'he' ? 'rtl' : 'ltr'}
        aria-label={t('common.keyboardCheck')}
      />
      <button
        type="button"
        onClick={onConfirm}
        disabled={testInput.length < 2}
        className="mt-6 w-full btn btn-sun"
      >
        {t('common.continue')}
      </button>
    </div>
  )
}
