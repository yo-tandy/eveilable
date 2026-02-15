import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, GraduationCap } from 'lucide-react'
import type { SupportedLanguage, LanguageLevel } from '../../../types/user'

interface LanguageSelectorProps {
  onSelect: (language: SupportedLanguage, level: LanguageLevel) => void
}

const LANGUAGES: { code: SupportedLanguage; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'fr', name: 'Français', flag: 'FR' },
  { code: 'zh', name: '中文', flag: 'ZH' },
  { code: 'he', name: 'עברית', flag: 'HE' },
]

const LEVELS: { code: LanguageLevel; description: string }[] = [
  { code: 'A1', description: 'Beginner' },
  { code: 'A2', description: 'Elementary' },
  { code: 'B1', description: 'Intermediate' },
  { code: 'B2', description: 'Upper Intermediate' },
  { code: 'C1', description: 'Advanced' },
  { code: 'C2', description: 'Proficient' },
]

export function LanguageSelector({ onSelect }: LanguageSelectorProps) {
  const { t } = useTranslation()
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel | null>(null)

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Globe size={24} />
        Select Reading Language
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setSelectedLang(lang.code)}
            className={`p-4 rounded-xl border-2 text-left transition-colors ${
              selectedLang === lang.code
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-lg font-bold text-brand-600">{lang.flag}</span>
            <span className="block mt-1 font-medium">{lang.name}</span>
          </button>
        ))}
      </div>

      {selectedLang && (
        <>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <GraduationCap size={24} />
            Select Your Level
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {LEVELS.map((lvl) => (
              <button
                key={lvl.code}
                onClick={() => setSelectedLevel(lvl.code)}
                className={`p-3 rounded-xl border-2 text-center transition-colors ${
                  selectedLevel === lvl.code
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="block text-lg font-bold">{lvl.code}</span>
                <span className="block text-sm text-gray-500">{lvl.description}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedLang && selectedLevel && (
        <button
          onClick={() => onSelect(selectedLang, selectedLevel)}
          className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
        >
          {t('common.continue')}
        </button>
      )}
    </div>
  )
}
