import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Play, ArrowRight, Flame } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { CATEGORIES, getGamesByCategory, getGame, getCategory } from '../config/games'
import { GameCard } from '../components/common/GameCard'
import { SectionHeader } from '../components/common/SectionHeader'
import { PuzzleSection } from '../components/common/PuzzleSection'
import { Mascot } from '../components/common/Mascot'
import { getCurrentStreak } from '../utils/streak'

function daysSince(iso: string): number {
  const then = new Date(iso)
  const now = new Date()
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((startOf(now) - startOf(then)) / 86_400_000)
}

export function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { lastPlayed, languageLevels } = useSettingsStore()
  const streak = user ? getCurrentStreak() : 0

  const lastGame = lastPlayed ? getGame(lastPlayed.gameId) : undefined
  const lastLevel = lastPlayed?.language ? languageLevels[lastPlayed.language] : undefined
  const lastDays = lastPlayed ? daysSince(lastPlayed.at) : 0
  const lastWhen =
    lastDays <= 0
      ? t('home.lastPlayedToday')
      : lastDays === 1
        ? t('home.lastPlayedYesterday')
        : t('home.lastPlayedDaysAgo', { count: lastDays })

  /** CEFR badge for a language game, from the level the user last played at. */
  const languageBadge = (gameId: string) => {
    const game = getGame(gameId)
    if (game?.category !== 'language') return undefined
    const lang = lastPlayed?.language
    return lang ? languageLevels[lang]?.cefr : undefined
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      {/* Hero */}
      <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-6 mb-12">
        <div className="sticker relative overflow-hidden p-8 sm:p-10">
          <h1 className="display text-[44px] sm:text-[60px] leading-[0.98] mb-4">
            {t('home.heroTitle')}{' '}
            <span className="inline-block bg-sun px-3 rounded-xl border-3 border-ink shadow-[4px_4px_0_#1b1a2e] -rotate-2">
              {t('home.heroHighlight')}
            </span>
          </h1>
          <p className="text-ink-2 font-bold text-[17px] sm:pr-40 mb-6 max-w-md">
            {t('home.heroSubtitle')}
          </p>
          {user ? (
            <Link to="/games" className="btn btn-sun">
              <Play size={18} aria-hidden="true" />
              {t('home.playToday')}
            </Link>
          ) : (
            <div className="flex flex-wrap items-center gap-3 sm:pr-40">
              <Link to="/register" className="btn btn-sun">
                {t('home.getStarted')}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <span className="text-ink-2 font-bold">
                {t('home.loginPrompt')}{' '}
                <Link to="/login" className="text-ink underline decoration-2 decoration-coral underline-offset-4">
                  {t('nav.login')}
                </Link>
              </span>
            </div>
          )}
          <Mascot className="hidden sm:block absolute right-2 -bottom-3 w-40" />
        </div>

        <div className="sticker !bg-blue text-white p-6 flex flex-col gap-3">
          {user && lastGame ? (
            <>
              <div className="display text-sm tracking-[.12em] uppercase opacity-90">{t('home.continueLabel')}</div>
              <h2 className="display text-[30px] leading-tight">{t(`games.${lastGame.key}.name`)}</h2>
              <p className="font-bold opacity-95">
                {lastPlayed?.language && <>{t(`languages.${lastPlayed.language}`)} &middot; </>}
                {lastLevel && <>{lastLevel.cefr} &middot; </>}
                {lastWhen}
              </p>
              {streak > 0 && (
                <p className="font-bold flex items-center gap-1.5 opacity-95">
                  <Flame size={16} aria-hidden="true" /> {t('nav.streakTooltip', { count: streak })}
                </p>
              )}
              <Link to={`/games/${lastGame.id}`} className="btn btn-sun self-start mt-auto">
                {lastPlayed?.language
                  ? t('home.playAgainIn', { language: t(`languages.${lastPlayed.language}`) })
                  : t('home.playAgain')}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </>
          ) : user ? (
            <>
              <div className="display text-sm tracking-[.12em] uppercase opacity-90">{t('home.chooseGame')}</div>
              <p className="font-bold text-lg opacity-95">{t('home.firstTime')}</p>
              <Link to="/games" className="btn btn-sun self-start mt-auto">
                {t('home.browse')}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </>
          ) : (
            <>
              <div className="display text-sm tracking-[.12em] uppercase opacity-90">{t('categories.attention')} + {t('categories.language')}</div>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[
                  ['10', t('home.statGames')],
                  ['6', t('home.statLanguages')],
                  ['20', t('home.statLevels')],
                ].map(([n, label]) => (
                  <div key={label} className="bg-white/15 rounded-2xl p-3">
                    <div className="display text-[28px] leading-none">{n}</div>
                    <div className="text-xs font-extrabold uppercase tracking-wider opacity-90 mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <p className="font-bold opacity-95 mt-1">{t('home.statsBlurb')}</p>
              <Link to="/register" className="btn btn-sun self-start mt-auto">
                {t('home.getStarted')}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Game categories */}
      {CATEGORIES.map((category) => {
        const games = getGamesByCategory(category.key)
        return (
          <section key={category.key} className="mb-12">
            <SectionHeader category={category} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {games.map((game, i) => (
                <GameCard
                  key={game.id}
                  category={getCategory(game.category)}
                  icon={game.icon}
                  title={t(`games.${game.key}.name`)}
                  description={t(`games.${game.key}.description`)}
                  badge={languageBadge(game.id)}
                  to={user ? `/games/${game.id}` : '/login'}
                  index={i}
                />
              ))}
            </div>
          </section>
        )
      })}

      <PuzzleSection variant="grid" className="mb-12" />
    </div>
  )
}
