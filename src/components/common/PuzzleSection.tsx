import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import { PUZZLE_CATEGORY, PUZZLES } from '../../config/games'
import { useSettingsStore } from '../../stores/settingsStore'

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

  const pill = (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
        variant === 'grid' ? 'mb-6' : variant === 'list' ? 'mb-4' : 'mb-3'
      }`}
      style={{
        background: category.pillBg,
        border: `1px solid ${category.pillBorder}`,
      }}
    >
      <span className="text-base">{category.emoji}</span>
      <span className="text-sm font-semibold" style={{ color: category.pillText }}>
        {t(category.i18nKey)}
      </span>
    </div>
  )

  if (variant === 'static') {
    return (
      <div className={className}>
        {pill}
        <div className="space-y-3">
          {PUZZLES.map((puzzle) => (
            <div key={puzzle.id} className="glass rounded-xl p-4 flex items-start gap-4">
              <span className="text-3xl shrink-0">{puzzle.emoji}</span>
              <div>
                <h4 className="font-semibold text-gray-900">{t(`puzzles.${puzzle.key}.name`)}</h4>
                <p className="text-sm text-gray-500">{t(`puzzles.${puzzle.key}.description`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className={className}>
      {pill}

      <div className={variant === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}>
        {PUZZLES.map((puzzle) => (
          <a
            key={puzzle.id}
            href={puzzleHref(puzzle.href)}
            target="_blank"
            rel="noopener noreferrer"
            className={
              variant === 'grid'
                ? 'card-glow rounded-2xl p-6 text-white hover:-translate-y-1.5 hover:shadow-xl transition-all duration-200 block'
                : 'block rounded-2xl p-5 text-white hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 card-glow'
            }
            style={{ background: puzzle.cardGradient }}
          >
            {variant === 'grid' ? (
              <>
                <span className="text-4xl block mb-3">{puzzle.emoji}</span>
                <span className="glass-chip mb-2">{puzzle.skillLabel}</span>
                <h3 className="font-bold text-lg mb-1 mt-2 flex items-center gap-2">
                  {t(`puzzles.${puzzle.key}.name`)}
                  <ExternalLink size={15} className="opacity-70" />
                </h3>
                <p className="text-sm text-white/80">{t(`puzzles.${puzzle.key}.description`)}</p>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{puzzle.emoji}</span>
                  <div>
                    <h2 className="font-bold text-lg">{t(`puzzles.${puzzle.key}.name`)}</h2>
                    <p className="text-sm text-white/80">
                      {t(`puzzles.${puzzle.key}.description`)}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <ExternalLink size={16} />
                </div>
              </div>
            )}
          </a>
        ))}
      </div>
    </section>
  )
}
