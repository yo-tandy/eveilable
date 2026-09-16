import { useTranslation } from 'react-i18next'
import type { CategoryConfig } from '../../config/games'

interface SectionHeaderProps {
  category: CategoryConfig
  /** Heading level; the home page uses h2, nested pages may use h3. */
  as?: 'h2' | 'h3'
  size?: 'lg' | 'md'
}

/** Category title with its tilted tag, shared by every page that lists games. */
export function SectionHeader({ category, as: Tag = 'h2', size = 'lg' }: SectionHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className={`flex items-center gap-3 flex-wrap ${size === 'lg' ? 'mb-5' : 'mb-3'}`}>
      <Tag className={`display ${size === 'lg' ? 'text-[32px]' : 'text-2xl'} leading-none`}>
        {t(category.i18nKey)}
      </Tag>
      <span className={`tag ${category.tag}`}>{t(category.tagKey)}</span>
    </div>
  )
}
