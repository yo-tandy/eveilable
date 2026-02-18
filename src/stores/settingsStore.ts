import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SupportedLanguage, LanguageLevelConfig } from '../types/user'

interface SettingsState {
  uiLanguage: SupportedLanguage
  reducedMotion: boolean
  languageLevels: Partial<Record<SupportedLanguage, LanguageLevelConfig>>
  setUiLanguage: (lang: SupportedLanguage) => void
  setReducedMotion: (value: boolean) => void
  setLanguageLevel: (lang: SupportedLanguage, config: LanguageLevelConfig) => void
  getLanguageLevel: (lang: SupportedLanguage) => LanguageLevelConfig | undefined
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      uiLanguage: 'en',
      reducedMotion: false,
      languageLevels: {},
      setUiLanguage: (uiLanguage) => set({ uiLanguage }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setLanguageLevel: (lang, config) =>
        set((state) => ({
          languageLevels: { ...state.languageLevels, [lang]: config },
        })),
      getLanguageLevel: (lang) => get().languageLevels[lang],
    }),
    { name: 'eveilable-settings' }
  )
)
