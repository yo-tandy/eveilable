import { useTranslation } from 'react-i18next'
import { CollapsibleSection } from './CollapsibleSection'
import { StoryByline } from './StoryByline'
import { formatTargetLevel } from '../../utils/levelLabel'
import type { StoryMeta } from '../../types/comprehension'

interface StoryReviewProps {
  story: StoryMeta & { language: string; title: string; wordCount: number }
  /** Story body, one entry per paragraph. */
  paragraphs: string[]
  summaryText: string
  summaryWordCount: number
}

/**
 * The story and the learner's summary, each collapsed by default, so the
 * results page can be reviewed against what was actually read and written.
 */
export function StoryReview({ story, paragraphs, summaryText, summaryWordCount }: StoryReviewProps) {
  const { t } = useTranslation()
  const dir = story.language === 'he' ? 'rtl' : 'ltr'

  return (
    <div className="space-y-3">
      <CollapsibleSection
        title={t('games.story.article')}
        hint={t('games.story.wordCount', { count: story.wordCount })}
      >
        <article dir={dir}>
          <h4 className="font-bold text-lg mb-1">{story.title}</h4>
          <StoryByline story={story} compact />
          <div className="mt-3 space-y-3">
            {paragraphs.map((para, i) => (
              <p key={i} className="leading-relaxed">{para}</p>
            ))}
          </div>
        </article>
      </CollapsibleSection>

      <CollapsibleSection
        title={t('games.story.yourSummary')}
        hint={t('games.story.wordCount', { count: summaryWordCount })}
      >
        <p dir={dir} className="leading-relaxed whitespace-pre-wrap">{summaryText}</p>
      </CollapsibleSection>
    </div>
  )
}

interface LevelComparisonProps {
  story: StoryMeta
  assessedLevel?: string
}

/** Target level of the text beside the level the summary was assessed at. */
export function LevelComparison({ story, assessedLevel }: LevelComparisonProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-4 text-center mt-4 pt-4 border-t border-white/30">
      <div>
        <div className="text-2xl font-bold">{formatTargetLevel(story.level, story.subLevel)}</div>
        <div className="text-sm text-gray-500">{t('games.story.textLevel')}</div>
      </div>
      <div>
        <div className="text-2xl font-bold">
          {assessedLevel ?? <span className="text-gray-400">&mdash;</span>}
        </div>
        <div className="text-sm text-gray-500">
          {assessedLevel ? t('games.story.summaryLevel') : t('games.story.summaryLevelUnavailable')}
        </div>
      </div>
    </div>
  )
}
