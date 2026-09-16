import { useSettingsStore } from '../stores/settingsStore'
import type { GameType } from '../types/game'
import type { SupportedLanguage } from '../types/user'

/**
 * Remember the game (and, for language games, the language) the user finished
 * most recently so the home page can offer a one-tap "play again".
 */
export function recordLastPlayed(gameId: GameType, language?: SupportedLanguage): void {
  useSettingsStore.getState().setLastPlayed({
    gameId,
    language,
    at: new Date().toISOString(),
  })
}
