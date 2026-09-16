import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import { formatStoryDate, formatTargetLevel } from '../../utils/levelLabel'
import type { StoryMeta } from '../../types/comprehension'

interface StoryBylineProps {
  story: StoryMeta & { language: string }
  /** Compact variant for the results page, where the story is secondary. */
  compact?: boolean
}

/**
 * Publisher, date, and target level for a generated story.
 * Shown under the title wherever a story is presented so learners know the
 * news it was based on and the level it was written for.
 */
export function StoryByline({ story, compact = false }: StoryBylineProps) {
  const { t } = useTranslation()
  const date = formatStoryDate(story.publishedAt, story.language)
  const level = formatTargetLevel(story.level, story.subLevel)
  // Only ever link to what the feed parser accepted (https).
  const href = story.sourceUrl?.startsWith('https://') ? story.sourceUrl : undefined

  const sourceNode = story.source
    ? href
      ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline decoration-gray-400/60 underline-offset-2 hover:decoration-gray-700"
        >
          {story.source}
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      )
      : <span>{story.source}</span>
    : null

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-500 ${compact ? 'text-xs' : 'text-sm mb-6'}`}>
      {sourceNode && (
        <span>
          <span className="sr-only">{t('games.story.source')}: </span>
          {sourceNode}
        </span>
      )}
      {sourceNode && date && <span aria-hidden="true">&middot;</span>}
      {date && <time dateTime={story.publishedAt}>{date}</time>}
      {(sourceNode || date) && <span aria-hidden="true">&middot;</span>}
      <span>{t('games.story.writtenFor', { level })}</span>
    </div>
  )
}
