import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, GraduationCap, Layers } from 'lucide-react'
import { useSettingsStore } from '../../../stores/settingsStore'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../../../types/user'

interface LanguageSelectorProps {
  onSelect: (language: SupportedLanguage, level: LanguageLevel, subLevel: LanguageSubLevel) => void
}

const LANGUAGES: SupportedLanguage[] = ['en', 'fr', 'zh', 'he', 'de', 'it']

const LEVELS: { code: LanguageLevel; description: string }[] = [
  { code: 'A1', description: 'Beginner' },
  { code: 'A2', description: 'Elementary' },
  { code: 'B1', description: 'Intermediate' },
  { code: 'B2', description: 'Upper Intermediate' },
  { code: 'C1', description: 'Advanced' },
  { code: 'C2', description: 'Proficient' },
]

const SUB_LEVELS: { code: LanguageSubLevel; label: string; description: string }[] = [
  { code: 'novice', label: 'Novice', description: 'Lower range' },
  { code: 'well-placed', label: 'Well-placed', description: 'Mid range' },
  { code: 'advanced', label: 'Advanced', description: 'Upper range' },
]

const optionClass = (selected: boolean) =>
  `option text-left ${selected ? 'option-selected' : ''}`

export function LanguageSelector({ onSelect }: LanguageSelectorProps) {
  const { t } = useTranslation()
  const { getLanguageLevel } = useSettingsStore()
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel | null>(null)
  const [selectedSubLevel, setSelectedSubLevel] = useState<LanguageSubLevel | null>(null)

  // Pre-populate from saved settings when a language is selected
  useEffect(() => {
    if (!selectedLang) return
    const saved = getLanguageLevel(selectedLang)
    if (saved) {
      setSelectedLevel(saved.cefr)
      setSelectedSubLevel(saved.sub)
    } else {
      setSelectedLevel(null)
      setSelectedSubLevel(null)
    }
  }, [selectedLang, getLanguageLevel])

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="display text-[26px] mb-4 flex items-center gap-2">
        <Globe size={24} aria-hidden="true" />
        {t('common.selectLanguage')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8" role="group" aria-label={t('common.selectLanguage')}>
        {LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            aria-pressed={selectedLang === code}
            onClick={() => setSelectedLang(code)}
            className={`p-4 ${optionClass(selectedLang === code)}`}
          >
            <span className="display text-lg">{code.toUpperCase()}</span>
            <span className="block mt-0.5 font-bold text-sm">{t(`languages.${code}`)}</span>
          </button>
        ))}
      </div>

      {selectedLang && (
        <>
          <h2 className="display text-[26px] mb-4 flex items-center gap-2">
            <GraduationCap size={24} aria-hidden="true" />
            {t('common.selectLevel')}
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-8" role="group" aria-label={t('common.selectLevel')}>
            {LEVELS.map((lvl) => (
              <button
                key={lvl.code}
                type="button"
                aria-pressed={selectedLevel === lvl.code}
                onClick={() => {
                  setSelectedLevel(lvl.code)
                  // Reset sub-level when changing CEFR level
                  if (lvl.code !== selectedLevel) {
                    setSelectedSubLevel(null)
                  }
                }}
                className={`p-3 text-center ${optionClass(selectedLevel === lvl.code)}`}
              >
                <span className="block display text-xl">{lvl.code}</span>
                <span className="block text-xs font-bold text-ink-2">{lvl.description}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedLang && selectedLevel && (
        <>
          <h2 className="display text-[26px] mb-4 flex items-center gap-2">
            <Layers size={24} aria-hidden="true" />
            {t('common.whereWithin', { level: selectedLevel })}
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-8" role="group">
            {SUB_LEVELS.map((sub) => (
              <button
                key={sub.code}
                type="button"
                aria-pressed={selectedSubLevel === sub.code}
                onClick={() => setSelectedSubLevel(sub.code)}
                className={`p-3 text-center ${optionClass(selectedSubLevel === sub.code)}`}
              >
                <span className="block font-extrabold text-sm">{sub.label}</span>
                <span className="block text-xs font-bold text-ink-2">{sub.description}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedLang && selectedLevel && selectedSubLevel && (
        <button
          type="button"
          onClick={() => onSelect(selectedLang, selectedLevel, selectedSubLevel)}
          className="w-full btn btn-sun pop-in"
        >
          {t('common.continue')}
        </button>
      )}
    </div>
  )
}
