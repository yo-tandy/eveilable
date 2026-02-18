import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { getAggregateStats, fetchSessionHistory } from '../services/firestoreService'
import { TrendChart } from '../components/progress/TrendChart'
import { GoalTracker } from '../components/progress/GoalTracker'
import { GameHistoryList } from '../components/progress/GameHistoryList'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { CATEGORIES, getGamesByCategory, getGameClasses } from '../config/games'
import type { GameType, GameSession } from '../types/game'
import type { AggregateStats } from '../types/user'

export function ProgressPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<GameType>('divided-attention')
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [stats, setStats] = useState<AggregateStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      fetchSessionHistory(user.uid, activeTab, 30),
      getAggregateStats(user.uid, activeTab),
    ]).then(([sessionData, statsData]) => {
      setSessions(sessionData)
      setStats(statsData)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [user, activeTab])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('progress.title')}</h1>

      {/* Grouped game tabs */}
      <div className="mb-6 space-y-3">
        {CATEGORIES.map((category) => {
          const games = getGamesByCategory(category.key)
          return (
            <div key={category.key}>
              {/* Category label */}
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <span className="text-sm">{category.emoji}</span>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {t(category.i18nKey)}
                </span>
              </div>
              {/* Tab buttons */}
              <div className="flex gap-2 overflow-x-auto">
                {games.map((game) => {
                  const cls = getGameClasses(game)
                  return (
                    <button
                      key={game.id}
                      onClick={() => setActiveTab(game.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                        activeTab === game.id
                          ? `${cls.iconBg} ${cls.iconText} shadow-sm`
                          : 'bg-white/30 text-gray-500 hover:bg-white/50'
                      }`}
                    >
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
      ) : !stats || sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {t('progress.noSessions')}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Current level and trend */}
          <div className="glass rounded-2xl p-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-500">{t('progress.currentLevel')}</div>
              <div className="text-4xl font-bold">{stats.currentDifficultyLevel}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">{t('progress.trend')}</div>
              <div className={`text-lg font-bold ${
                stats.recentTrend === 'improving' ? 'text-green-600' :
                stats.recentTrend === 'declining' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {t(`progress.${stats.recentTrend}`)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">{t('progress.lifetimeAccuracy')}</div>
              <div className="text-2xl font-bold">
                {Math.round(stats.lifetimeAccuracy * 100)}%
              </div>
            </div>
          </div>

          {/* Goal suggestion */}
          <GoalTracker stats={stats} />

          {/* Trend chart */}
          {stats.recentSessions.length >= 2 && (
            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">Performance Over Time</h3>
              <TrendChart sessions={stats.recentSessions} />
            </div>
          )}

          {/* Session history */}
          <div>
            <h3 className="font-bold text-lg mb-4">Session History</h3>
            <GameHistoryList sessions={sessions} />
          </div>
        </div>
      )}
    </div>
  )
}
