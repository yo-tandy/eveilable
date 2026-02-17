import type { LucideIcon } from 'lucide-react'
import { Eye, Car, BookOpen, Zap, Shuffle, Focus, Languages } from 'lucide-react'
import type { GameType } from '../types/game'

export type GameCategory = 'attention' | 'language'

export interface GameConfig {
  id: GameType
  key: string
  icon: LucideIcon
  color: string
  category: GameCategory
}

export interface CategoryConfig {
  key: GameCategory
  i18nKey: string
  descriptionKey: string
  icon: LucideIcon
  gradientFrom: string
  gradientTo: string
  labelBg: string
  labelText: string
  iconColor: string
  iconColorLight: string
}

export const CATEGORIES: CategoryConfig[] = [
  {
    key: 'attention',
    i18nKey: 'categories.attention',
    descriptionKey: 'categories.attentionDescription',
    icon: Focus,
    gradientFrom: 'from-amber-50',
    gradientTo: 'to-orange-50',
    labelBg: 'bg-amber-200',
    labelText: 'text-amber-700',
    iconColor: 'text-amber-600',
    iconColorLight: 'text-amber-500',
  },
  {
    key: 'language',
    i18nKey: 'categories.language',
    descriptionKey: 'categories.languageDescription',
    icon: Languages,
    gradientFrom: 'from-indigo-50',
    gradientTo: 'to-purple-50',
    labelBg: 'bg-indigo-200',
    labelText: 'text-indigo-700',
    iconColor: 'text-indigo-600',
    iconColorLight: 'text-indigo-500',
  },
]

export const GAMES: GameConfig[] = [
  { id: 'divided-attention', key: 'dividedAttention', icon: Eye,      color: 'blue',    category: 'attention' },
  { id: 'double-decision',   key: 'doubleDecision',   icon: Car,      color: 'orange',  category: 'attention' },
  { id: 'icon-swap',         key: 'iconSwap',         icon: Shuffle,  color: 'teal',    category: 'attention' },
  { id: 'comprehension',     key: 'comprehension',    icon: BookOpen, color: 'emerald', category: 'language'  },
  { id: 'speed-summary',     key: 'speedSummary',     icon: Zap,      color: 'purple',  category: 'language'  },
]

export interface GameClassSet {
  iconBg: string
  iconText: string
  border: string
  hoverBorder: string
  gradientFrom: string
}

const GAME_CLASS_MAP: Record<string, GameClassSet> = {
  blue:    { iconBg: 'bg-blue-100',    iconText: 'text-blue-600',    border: 'border-blue-200',    hoverBorder: 'hover:border-blue-400',    gradientFrom: 'from-blue-50' },
  orange:  { iconBg: 'bg-orange-100',  iconText: 'text-orange-600',  border: 'border-orange-200',  hoverBorder: 'hover:border-orange-400',  gradientFrom: 'from-orange-50' },
  teal:    { iconBg: 'bg-teal-100',    iconText: 'text-teal-600',    border: 'border-teal-200',    hoverBorder: 'hover:border-teal-400',    gradientFrom: 'from-teal-50' },
  emerald: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', border: 'border-emerald-200', hoverBorder: 'hover:border-emerald-400', gradientFrom: 'from-emerald-50' },
  purple:  { iconBg: 'bg-purple-100',  iconText: 'text-purple-600',  border: 'border-purple-200',  hoverBorder: 'hover:border-purple-400',  gradientFrom: 'from-purple-50' },
}

export function getGamesByCategory(category: GameCategory): GameConfig[] {
  return GAMES.filter(g => g.category === category)
}

export function getGameClasses(game: GameConfig): GameClassSet {
  return GAME_CLASS_MAP[game.color]
}
