import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SupportedLanguage } from '../types/user'

interface SettingsState {
  uiLanguage: SupportedLanguage
  reducedMotion: boolean
  setUiLanguage: (lang: SupportedLanguage) => void
  setReducedMotion: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      uiLanguage: 'en',
      reducedMotion: false,
      setUiLanguage: (uiLanguage) => set({ uiLanguage }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    }),
    { name: 'eveilable-settings' }
  )
)
