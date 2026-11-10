import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { itemCredit } from '../../../utils/verbDrillCheck'
import type { FinalStatus, ScoredItem } from '../../../types/verbDrill'

interface VerbDrillResultProps {
  items: ScoredItem[]
  overallScore: number
  feedback: string | null
  language: string
  levelNotification?: { direction: 'up' | 'down'; newLabel: string } | null
  onPlayAgain: () => void
}

const STATUS_STYLE: Record<FinalStatus, string> = {
  correct: 'bg-green-500/15 text-green-700',
  accepted: 'bg-green-500/15 text-green-700',
  accent: 'bg-amber-500/15 text-amber-700',
  wrong: 'bg-red-500/15 text-red-600 line-through',
}

export function VerbDrillResult({
  items,
  overallScore,
  feedback,
  language,
  levelNotification,
  onPlayAgain,
}: VerbDrillResultProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const isRTL = language === 'he'
  const correctCount = items.filter(i => i.status === 'correct' || i.status === 'accepted').length
  const totalMs = items.reduce((sum, i) => sum + i.answer.timeMs, 0)
  const avgTimeSec = items.length > 0 ? Math.round(totalMs / 1000 / items.length) : 0

  // Accuracy per tense, in the order tenses first appeared
  const byTense = new Map<string, { label: string; credit: number; total: number }>()
  for (const item of items) {
    const entry = byTense.get(item.sentence.tenseId) ?? { label: item.sentence.tenseLabel, credit: 0, total: 0 }
    entry.credit += itemCredit(item.status)
    entry.total += 1
    byTense.set(item.sentence.tenseId, entry)
  }

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-8">
      <h2 className="display text-[36px] text-center">
        {t('games.verbDrill.results')}
      </h2>

      {levelNotification && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${
          levelNotification.direction === 'up'
            ? 'bg-green-500/10 border border-green-500/20 text-green-800'
            : 'bg-amber-500/10 border border-amber-500/20 text-amber-800'
        }`}>
          {levelNotification.direction === 'up'
            ? <TrendingUp size={20} />
            : <TrendingDown size={20} />
          }
          <span className="font-medium">
            {levelNotification.direction === 'up'
              ? `Level up! You've advanced to ${levelNotification.newLabel}`
              : `Level adjusted to ${levelNotification.newLabel}`
            }
          </span>
        </div>
      )}

      {/* Summary stats */}
      <div className="sticker-sm p-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-3xl font-bold">{overallScore}/10</div>
          <div className="text-sm text-ink-2">{t('games.verbDrill.overallScore')}</div>
        </div>
        <div>
          <div className="text-3xl font-bold">{correctCount}/{items.length}</div>
          <div className="text-sm text-ink-2">{t('games.verbDrill.correct')}</div>
        </div>
        <div>
          <div className="text-3xl font-bold">{avgTimeSec}s</div>
          <div className="text-sm text-ink-2">{t('games.verbDrill.avgTime')}</div>
        </div>
      </div>

      {feedback && (
        <div className="sticker-sm p-4">
          <p className="text-sm leading-relaxed">{feedback}</p>
        </div>
      )}

      {/* Per-tense accuracy */}
      <section>
        <h3 className="display text-[22px] mb-3">{t('games.verbDrill.byTense')}</h3>
        <ul className="sticker-sm p-4 space-y-3">
          {[...byTense.entries()].map(([id, { label, credit, total }]) => {
            const pct = Math.round((credit / total) * 100)
            return (
              <li key={id} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm font-bold">
                <span className="truncate" dir="auto">{label}</span>
                <div className="h-3 rounded-full bg-ink/10 overflow-hidden" aria-hidden="true">
                  <div
                    className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="tabular-nums text-ink-2">{Number.isInteger(credit) ? credit : credit.toFixed(1)}/{total}</span>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Every sentence with the learner's answer */}
      <section>
        <h3 className="display text-[22px] mb-3">{t('games.verbDrill.review')}</h3>
        <ol className="space-y-3">
          {items.map((item, i) => {
            const { sentence, answer, status, review } = item
            return (
              <li key={i} className="sticker-sm p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="chip" dir="auto">{sentence.infinitive}</span>
                  <span className="chip chip-muted" dir="auto">{sentence.tenseLabel}</span>
                  {status === 'accepted' && (
                    <span className="chip bg-green-100">{t('games.verbDrill.accepted')}</span>
                  )}
                </div>
                <p className="text-lg leading-relaxed" dir={isRTL ? 'rtl' : 'ltr'}>
                  {sentence.before}
                  {status === 'correct' ? (
                    <span className={`px-1 rounded font-bold ${STATUS_STYLE.correct}`}>{answer.userAnswer}</span>
                  ) : (
                    <>
                      {answer.userAnswer && (
                        <span className={`px-1 rounded font-bold ${STATUS_STYLE[status]}`}>{answer.userAnswer}</span>
                      )}
                      {status !== 'accepted' && (
                        <span className={`px-1 mx-0.5 rounded font-bold ${STATUS_STYLE.correct}`}>{sentence.correctForm}</span>
                      )}
                    </>
                  )}
                  {sentence.after}
                </p>
                {review?.note && <p className="text-ink-2 text-sm">{review.note}</p>}
              </li>
            )
          })}
        </ol>
      </section>

      <div className="flex gap-4">
        <button onClick={onPlayAgain} className="flex-1 btn btn-ghost">
          {t('common.playAgain')}
        </button>
        <button
          onClick={() => navigate('/progress?game=verb-drill')}
          className="flex-1 btn btn-sun"
        >
          {t('common.viewProgress')}
        </button>
      </div>
    </div>
  )
}
