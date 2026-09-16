import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../stores/settingsStore'
import { CATEGORIES, getGamesByCategory, getCategory } from '../config/games'
import { GameCard } from '../components/common/GameCard'
import { SectionHeader } from '../components/common/SectionHeader'
import { PuzzleSection } from '../components/common/PuzzleSection'

export function GameSelectPage() {
  const { t } = useTranslation()
  const { lastPlayed, languageLevels } = useSettingsStore()
  const lastLang = lastPlayed?.language
  const cefr = lastLang ? languageLevels[lastLang]?.cefr : undefined

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="display text-[36px] mb-8">{t('games.selectGame')}</h1>

      {CATEGORIES.map((category) => {
        const games = getGamesByCategory(category.key)
        return (
          <section key={category.key} className="mb-10">
            <SectionHeader category={category} size="md" />
            <div className="flex flex-col gap-4">
              {games.map((game, i) => (
                <GameCard
                  key={game.id}
                  variant="row"
                  category={getCategory(game.category)}
                  icon={game.icon}
                  title={t(`games.${game.key}.name`)}
                  description={t(`games.${game.key}.description`)}
                  badge={game.category === 'language' ? cefr : undefined}
                  to={`/games/${game.id}`}
                  index={i}
                />
              ))}
            </div>
          </section>
        )
      })}

      <PuzzleSection variant="list" className="mb-8" />
    </div>
  )
}
