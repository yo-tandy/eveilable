import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { getAggregateStats, fetchSessionHistory } from '../services/firestoreService'
import { TrendChart } from '../components/progress/TrendChart'
import { GoalTracker } from '../components/progress/GoalTracker'
import { GameHistoryList } from '../components/progress/GameHistoryList'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import type { GameType, GameSession } from '../types/game'
import type { AggregateStats } from '../types/user'

const GAME_TABS: { key: GameType; labelKey: string }[] = [
  { key: 'divided-attention', labelKey: 'games.dividedAttention.name' },
  { key: 'double-decision', labelKey: 'games.doubleDecision.name' },
  { key: 'comprehension', labelKey: 'games.comprehension.name' },
]

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
    }).catch((err) => {
      console.error('Failed to load progress data:', err)
      setLoading(false)
    })
  }, [user, activeTab])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('progress.title')}</h1>

      {/* Game type tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        {GAME_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
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
          <div className="bg-gray-50 rounded-2xl p-6 grid grid-cols-3 gap-4 text-center">
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
            <div className="bg-gray-50 rounded-2xl p-6">
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
