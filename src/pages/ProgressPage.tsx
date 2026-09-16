import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { getAggregateStats, fetchSessionHistory } from '../services/firestoreService'
import { TrendChart } from '../components/progress/TrendChart'
import { GoalTracker } from '../components/progress/GoalTracker'
import { GameHistoryList } from '../components/progress/GameHistoryList'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { CATEGORIES, GAMES, getGamesByCategory } from '../config/games'
import type { GameType, GameSession } from '../types/game'
import type { AggregateStats } from '../types/user'

function getInitialTab(searchParams: URLSearchParams): GameType {
  const game = searchParams.get('game')
  if (game && GAMES.some(g => g.id === game)) {
    return game as GameType
  }
  return 'divided-attention'
}

export function ProgressPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<GameType>(() => getInitialTab(searchParams))
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [stats, setStats] = useState<AggregateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    Promise.all([
      fetchSessionHistory(user.uid, activeTab, 30),
      getAggregateStats(user.uid, activeTab),
    ]).then(([sessionData, statsData]) => {
      setSessions(sessionData)
      setStats(statsData)
      setLoading(false)
    }).catch((err) => {
      console.error('[ProgressPage] Failed to load session history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load progress data')
      setLoading(false)
    })
  }, [user, activeTab])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="display text-[36px] mb-6">{t('progress.title')}</h1>

      {/* Grouped game tabs */}
      <div className="mb-8 space-y-4">
        {CATEGORIES.map((category) => {
          const games = getGamesByCategory(category.key)
          return (
            <div key={category.key}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`tag ${category.tag} !rotate-0 text-xs`}>{t(category.i18nKey)}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
                {games.map((game) => {
                  const Icon = game.icon
                  const active = activeTab === game.id
                  return (
                    <button
                      key={game.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(game.id)}
                      className={`chip ${active ? 'bg-sun' : 'chip-muted'}`}
                      type="button"
                    >
                      <Icon size={15} aria-hidden="true" />
                      {t(`games.${game.key}.name`)}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="alert-error text-center" role="alert">
          <div className="mb-1">{t('progress.loadError')}</div>
          <div className="text-xs font-semibold">{error}</div>
        </div>
      ) : !stats || sessions.length === 0 ? (
        <div className="sticker-flat text-center py-12 px-6 text-ink-2 font-bold">
          {t('progress.noSessions')}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Current level and trend */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="sticker-sm p-4">
              <div className="display text-[40px] leading-none">{stats.currentDifficultyLevel}</div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink-2 mt-1">{t('progress.currentLevel')}</div>
            </div>
            <div className="sticker-sm p-4">
              <div className={`display text-2xl leading-none ${
                stats.recentTrend === 'improving' ? 'text-correct' :
                stats.recentTrend === 'declining' ? 'text-incorrect' : 'text-ink'
              }`}>
                {t(`progress.${stats.recentTrend}`)}
              </div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink-2 mt-1">{t('progress.trend')}</div>
            </div>
            <div className="sticker-sm p-4">
              <div className="display text-[40px] leading-none">{Math.round(stats.lifetimeAccuracy * 100)}%</div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink-2 mt-1">{t('progress.lifetimeAccuracy')}</div>
            </div>
          </div>

          {/* Goal suggestion */}
          <GoalTracker stats={stats} />

          {/* Trend chart */}
          {stats.recentSessions.length >= 2 && (
            <div className="sticker-flat p-6">
              <h3 className="display text-xl mb-4">{t('progress.performanceOverTime')}</h3>
              <TrendChart sessions={stats.recentSessions} />
            </div>
          )}

          {/* Session history */}
          <div>
            <h3 className="display text-xl mb-4">{t('progress.sessionHistory')}</h3>
            <GameHistoryList sessions={sessions} />
          </div>
        </div>
      )}
    </div>
  )
}
