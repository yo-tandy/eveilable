import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SupportedLanguage, LanguageLevelConfig } from '../types/user'
import type { GameType } from '../types/game'

export interface LastPlayed {
  gameId: GameType
  language?: SupportedLanguage
  /** ISO timestamp of when the session ended. */
  at: string
}

interface SettingsState {
  uiLanguage: SupportedLanguage
  reducedMotion: boolean
  languageLevels: Partial<Record<SupportedLanguage, LanguageLevelConfig>>
  lastPlayed: LastPlayed | null
  setUiLanguage: (lang: SupportedLanguage) => void
  setReducedMotion: (value: boolean) => void
  setLanguageLevel: (lang: SupportedLanguage, config: LanguageLevelConfig) => void
  getLanguageLevel: (lang: SupportedLanguage) => LanguageLevelConfig | undefined
  setLastPlayed: (value: LastPlayed) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      uiLanguage: 'en',
      reducedMotion: false,
      languageLevels: {},
      lastPlayed: null,
      setUiLanguage: (uiLanguage) => set({ uiLanguage }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setLanguageLevel: (lang, config) =>
        set((state) => ({
          languageLevels: { ...state.languageLevels, [lang]: config },
        })),
      getLanguageLevel: (lang) => get().languageLevels[lang],
      setLastPlayed: (lastPlayed) => set({ lastPlayed }),
    }),
    { name: 'eveilable-settings' }
  )
)
