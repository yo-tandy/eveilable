import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ResponseTimeChart } from './ResponseTimeChart'
import { DifficultyChart } from './DifficultyChart'
import { PerformanceRating } from './PerformanceRating'
import { computeSessionStats, computePerformanceRating } from '../../services/statsService'
import type { Trial } from '../../types/game'

interface SessionStatsProps {
  trials: Trial[]
  onPlayAgain: () => void
}

export function SessionStats({ trials, onPlayAgain }: SessionStatsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const stats = useMemo(() => computeSessionStats(trials), [trials])
  const rating = useMemo(() => computePerformanceRating(stats), [stats])

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-3xl font-bold text-center">{t('stats.sessionComplete')}</h2>

      <PerformanceRating rating={rating} />

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{stats.totalTrials}</div>
          <div className="text-sm text-gray-500">{t('stats.trials')}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{Math.round(stats.accuracy * 100)}%</div>
          <div className="text-sm text-gray-500">{t('stats.accuracy')}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{Math.round(stats.averageResponseTimeMs)}ms</div>
          <div className="text-sm text-gray-500">{t('stats.responseTime')}</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-bold mb-3">Response Time per Trial</h3>
        <ResponseTimeChart trials={trials} />
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-bold mb-3">Difficulty Progression</h3>
        <DifficultyChart trials={trials} />
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-bold mb-3">Speed Breakdown</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2 text-gray-500">Correct answers avg</td>
              <td className="py-2 font-medium text-right">{Math.round(stats.correctAvgTime)}ms</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-gray-500">Incorrect answers avg</td>
              <td className="py-2 font-medium text-right">{Math.round(stats.incorrectAvgTime)}ms</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-gray-500">Fastest correct</td>
              <td className="py-2 font-medium text-right">{Math.round(stats.fastestCorrectTime)}ms</td>
            </tr>
            <tr>
              <td className="py-2 text-gray-500">Slowest correct</td>
              <td className="py-2 font-medium text-right">{Math.round(stats.slowestCorrectTime)}ms</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50"
        >
          {t('common.playAgain')}
        </button>
        <button
          onClick={() => navigate('/progress')}
          className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700"
        >
          {t('common.viewProgress')}
        </button>
      </div>
    </div>
  )
}
