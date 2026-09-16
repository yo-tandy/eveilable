import { useTranslation } from 'react-i18next'
import { PUZZLE_CATEGORY, PUZZLES } from '../../config/games'
import { useSettingsStore } from '../../stores/settingsStore'
import { GameCard } from './GameCard'
import { SectionHeader } from './SectionHeader'

/** Languages the puzzles themselves ship; anything else opens in English. */
const PUZZLE_LANGUAGES = ['en', 'fr', 'he']

interface PuzzleSectionProps {
  /**
   * grid   — card grid, matches the home page game categories
   * list   — full-width rows, matches the game select page
   * static — non-interactive descriptions, matches the about page
   */
  variant: 'grid' | 'list' | 'static'
  className?: string
}

export function PuzzleSection({ variant, className = '' }: PuzzleSectionProps) {
  const { t } = useTranslation()
  const { uiLanguage } = useSettingsStore()
  const category = PUZZLE_CATEGORY

  const puzzleHref = (href: string) =>
    PUZZLE_LANGUAGES.includes(uiLanguage) ? `${href}?lang=${uiLanguage}` : href

  if (variant === 'static') {
    return (
      <div className={className}>
        <SectionHeader category={category} as="h3" size="md" />
        <div className="flex flex-col gap-3">
          {PUZZLES.map((puzzle) => {
            const Icon = puzzle.icon
            return (
              <div key={puzzle.id} className="sticker-flat p-4 flex items-center gap-4">
                <div className={`art ${category.art} w-14 h-14 shrink-0`}>
                  <Icon size={26} strokeWidth={2.4} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="display text-lg">{t(`puzzles.${puzzle.key}.name`)}</h4>
                  <p className="text-sm text-ink-2">{t(`puzzles.${puzzle.key}.description`)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <section className={className}>
      <SectionHeader category={category} size={variant === 'grid' ? 'lg' : 'md'} />
      <div className={variant === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'flex flex-col gap-4'}>
        {PUZZLES.map((puzzle, i) => (
          <GameCard
            key={puzzle.id}
            variant={variant === 'grid' ? 'tile' : 'row'}
            category={category}
            icon={puzzle.icon}
            title={t(`puzzles.${puzzle.key}.name`)}
            description={t(`puzzles.${puzzle.key}.description`)}
            to={puzzleHref(puzzle.href)}
            external
            index={i}
          />
        ))}
      </div>
    </section>
  )
}
