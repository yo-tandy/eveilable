import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, GraduationCap, Layers } from 'lucide-react'
import { useSettingsStore } from '../../../stores/settingsStore'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../../../types/user'

interface LanguageSelectorProps {
  onSelect: (language: SupportedLanguage, level: LanguageLevel, subLevel: LanguageSubLevel) => void
}

const LANGUAGES: { code: SupportedLanguage; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'fr', name: 'Français', flag: 'FR' },
  { code: 'zh', name: '中文', flag: 'ZH' },
  { code: 'he', name: 'עברית', flag: 'HE' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'it', name: 'Italiano', flag: 'IT' },
]

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
            className={`p-4 rounded-xl text-left transition-all ${
              selectedLang === lang.code
                ? 'glass-strong shadow-sm'
                : 'glass hover:bg-white/50'
            }`}
            style={selectedLang === lang.code ? { borderColor: 'rgba(0,0,0,0.2)' } : undefined}
          >
            <span className="text-lg font-bold">{lang.flag}</span>
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
                onClick={() => {
                  setSelectedLevel(lvl.code)
                  // Reset sub-level when changing CEFR level
                  if (lvl.code !== selectedLevel) {
                    setSelectedSubLevel(null)
                  }
                }}
                className={`p-3 rounded-xl text-center transition-all ${
                  selectedLevel === lvl.code
                    ? 'glass-strong shadow-sm'
                    : 'glass hover:bg-white/50'
                }`}
                style={selectedLevel === lvl.code ? { borderColor: 'rgba(0,0,0,0.2)' } : undefined}
              >
                <span className="block text-lg font-bold">{lvl.code}</span>
                <span className="block text-sm text-gray-500">{lvl.description}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedLang && selectedLevel && (
        <>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Layers size={24} />
            Where within {selectedLevel}?
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {SUB_LEVELS.map((sub) => (
              <button
                key={sub.code}
                onClick={() => setSelectedSubLevel(sub.code)}
                className={`p-3 rounded-xl text-center transition-all ${
                  selectedSubLevel === sub.code
                    ? 'glass-strong shadow-sm'
                    : 'glass hover:bg-white/50'
                }`}
                style={selectedSubLevel === sub.code ? { borderColor: 'rgba(0,0,0,0.2)' } : undefined}
              >
                <span className="block text-sm font-bold">{sub.label}</span>
                <span className="block text-xs text-gray-500">{sub.description}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedLang && selectedLevel && selectedSubLevel && (
        <button
          onClick={() => onSelect(selectedLang, selectedLevel, selectedSubLevel)}
          className="w-full py-3 bg-black/75 backdrop-blur-sm text-white rounded-xl font-semibold hover:scale-[1.02] transition-transform"
        >
          {t('common.continue')}
        </button>
      )}
    </div>
  )
}
