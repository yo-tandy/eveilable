import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ResponseTimeChart } from './ResponseTimeChart'
import { DifficultyChart } from './DifficultyChart'
import { PerformanceRating } from './PerformanceRating'
import { computeSessionStats, computePerformanceRating } from '../../services/statsService'
import type { Trial, GameType } from '../../types/game'

interface SessionStatsProps {
  trials: Trial[]
  gameType: GameType
  onPlayAgain: () => void
}

export function SessionStats({ trials, gameType, onPlayAgain }: SessionStatsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const stats = useMemo(() => computeSessionStats(trials), [trials])
  const rating = useMemo(() => computePerformanceRating(stats), [stats])

  const rows: [string, number][] = [
    [t('stats.correctAvg'), stats.correctAvgTime],
    [t('stats.incorrectAvg'), stats.incorrectAvgTime],
    [t('stats.fastestCorrect'), stats.fastestCorrectTime],
    [t('stats.slowestCorrect'), stats.slowestCorrectTime],
  ]

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-center gap-3">
        <h2 className="display text-[36px]">{t('stats.niceOne')}</h2>
        <span className="tag tag-sun">{t('stats.sessionComplete')}</span>
      </div>

      <div className="sticker p-6 grid sm:grid-cols-[200px_1fr] gap-6 items-center">
        <PerformanceRating rating={rating} />
        <div>
          <div className="grid grid-cols-3 gap-3">
            <div className="sticker-sm p-3">
              <div className="display text-3xl leading-none">{stats.totalTrials}</div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink-2 mt-1">{t('stats.trials')}</div>
            </div>
            <div className="sticker-sm p-3">
              <div className="display text-3xl leading-none">{Math.round(stats.accuracy * 100)}%</div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink-2 mt-1">{t('stats.accuracy')}</div>
            </div>
            <div className="sticker-sm p-3">
              <div className="display text-3xl leading-none">
                {Math.round(stats.averageResponseTimeMs)}<span className="text-sm"> ms</span>
              </div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink-2 mt-1">{t('stats.responseTime')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticker-flat p-4">
        <h3 className="display text-xl mb-3">{t('stats.responseTimePerTrial')}</h3>
        <ResponseTimeChart trials={trials} />
      </div>

      <div className="sticker-flat p-4">
        <h3 className="display text-xl mb-3">{t('stats.difficultyProgression')}</h3>
        <DifficultyChart trials={trials} />
      </div>

      <div className="sticker-flat p-4">
        <h3 className="display text-xl mb-3">{t('stats.speedBreakdown')}</h3>
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, ms], i) => (
              <tr key={label} className={i < rows.length - 1 ? 'border-b-2 border-ink/10' : ''}>
                <td className="py-2 text-ink-2 font-bold">{label}</td>
                <td className="py-2 display text-base text-right">{Math.round(ms)} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4">
        <button onClick={onPlayAgain} className="flex-1 btn btn-blue" type="button">
          {t('common.playAgain')}
        </button>
        <button onClick={() => navigate(`/progress?game=${gameType}`)} className="flex-1 btn btn-ghost" type="button">
          {t('common.viewProgress')}
        </button>
      </div>
    </div>
  )
}
