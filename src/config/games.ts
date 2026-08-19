import type { LucideIcon } from 'lucide-react'
import { Eye, Car, BookOpen, Zap, Shuffle, RefreshCw, PenLine, Focus, Languages, Layers, Type, Headphones, Puzzle } from 'lucide-react'
import type { GameType } from '../types/game'

export type GameCategory = 'attention' | 'language' | 'puzzles'

export interface GameConfig {
  id: GameType
  key: string
  icon: LucideIcon
  color: string
  category: GameCategory
  emoji: string
  skillLabel: string
  cardGradient: string
}

export interface CategoryConfig {
  key: GameCategory
  i18nKey: string
  descriptionKey: string
  icon: LucideIcon
  emoji: string
  pillBg: string
  pillBorder: string
  pillText: string
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
    emoji: '🎯',
    pillBg: 'rgba(251, 191, 36, 0.12)',
    pillBorder: 'rgba(251, 191, 36, 0.3)',
    pillText: '#b45309',
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
    emoji: '📚',
    pillBg: 'rgba(99, 102, 241, 0.12)',
    pillBorder: 'rgba(99, 102, 241, 0.3)',
    pillText: '#4338ca',
    gradientFrom: 'from-indigo-50',
    gradientTo: 'to-purple-50',
    labelBg: 'bg-indigo-200',
    labelText: 'text-indigo-700',
    iconColor: 'text-indigo-600',
    iconColorLight: 'text-indigo-500',
  },
]

/**
 * Puzzles are self-contained static games served from /public/puzzles. They have no
 * adaptive difficulty or session tracking, so they live outside GAMES/CATEGORIES —
 * pages that map over CATEGORIES would otherwise render an empty stats section.
 */
export interface PuzzleConfig {
  id: string
  key: string
  href: string
  emoji: string
  skillLabel: string
  cardGradient: string
}

export const PUZZLE_CATEGORY: CategoryConfig = {
  key: 'puzzles',
  i18nKey: 'categories.puzzles',
  descriptionKey: 'categories.puzzlesDescription',
  icon: Puzzle,
  emoji: '🧩',
  pillBg: 'rgba(16, 185, 129, 0.12)',
  pillBorder: 'rgba(16, 185, 129, 0.3)',
  pillText: '#047857',
  gradientFrom: 'from-emerald-50',
  gradientTo: 'to-teal-50',
  labelBg: 'bg-emerald-200',
  labelText: 'text-emerald-700',
  iconColor: 'text-emerald-600',
  iconColorLight: 'text-emerald-500',
}

export const PUZZLES: PuzzleConfig[] = [
  {
    id: 'wolves-and-wool',
    key: 'wolvesAndWool',
    // Explicit index.html: a bare directory URL falls through to the SPA rewrite in dev.
    href: '/puzzles/wolves-and-wool/index.html',
    emoji: '🐺',
    skillLabel: 'Planning',
    cardGradient: 'linear-gradient(135deg, #0f766e, #22c55e)',
  },
]

export const GAMES: GameConfig[] = [
  { id: 'divided-attention', key: 'dividedAttention', icon: Eye,      color: 'blue',    category: 'attention', emoji: '👁️', skillLabel: 'Focus',   cardGradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
  { id: 'double-decision',   key: 'doubleDecision',   icon: Car,      color: 'orange',  category: 'attention', emoji: '🚗', skillLabel: 'Speed',   cardGradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
  { id: 'icon-swap',         key: 'iconSwap',         icon: Shuffle,  color: 'teal',    category: 'attention', emoji: '🔀', skillLabel: 'Memory',  cardGradient: 'linear-gradient(135deg, #14b8a6, #2dd4bf)' },
  { id: 'comprehension',     key: 'comprehension',    icon: BookOpen, color: 'emerald', category: 'language',  emoji: '📖', skillLabel: 'Reading', cardGradient: 'linear-gradient(135deg, #10b981, #34d399)' },
  { id: 'speed-summary',     key: 'speedSummary',     icon: Zap,      color: 'purple',  category: 'language',  emoji: '⚡', skillLabel: 'Writing', cardGradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
  { id: 'tense-rewrite',    key: 'tenseRewrite',     icon: RefreshCw, color: 'rose',   category: 'language',  emoji: '🔄', skillLabel: 'Grammar', cardGradient: 'linear-gradient(135deg, #f43f5e, #fb7185)' },
  { id: 'verb-fill',        key: 'verbFill',         icon: PenLine,   color: 'amber',  category: 'language',  emoji: '✏️', skillLabel: 'Conjugation', cardGradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  { id: 'card-recall',      key: 'cardRecall',       icon: Layers,    color: 'violet', category: 'attention', emoji: '🃏', skillLabel: 'Recall',      cardGradient: 'linear-gradient(135deg, #8b5cf6, #c084fc)' },
  { id: 'sentence-memory',  key: 'sentenceMemory',   icon: Type,      color: 'cyan',   category: 'language',  emoji: '💬', skillLabel: 'Memory',      cardGradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
  { id: 'oral-writing',    key: 'oralWriting',      icon: Headphones, color: 'sky',   category: 'language',  emoji: '🎧', skillLabel: 'Listening',   cardGradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' },
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
  rose:    { iconBg: 'bg-rose-100',    iconText: 'text-rose-600',    border: 'border-rose-200',    hoverBorder: 'hover:border-rose-400',    gradientFrom: 'from-rose-50' },
  amber:   { iconBg: 'bg-amber-100',   iconText: 'text-amber-600',   border: 'border-amber-200',   hoverBorder: 'hover:border-amber-400',   gradientFrom: 'from-amber-50' },
  violet:  { iconBg: 'bg-violet-100',  iconText: 'text-violet-600',  border: 'border-violet-200',  hoverBorder: 'hover:border-violet-400',  gradientFrom: 'from-violet-50' },
  cyan:    { iconBg: 'bg-cyan-100',    iconText: 'text-cyan-600',    border: 'border-cyan-200',    hoverBorder: 'hover:border-cyan-400',    gradientFrom: 'from-cyan-50' },
  sky:     { iconBg: 'bg-sky-100',     iconText: 'text-sky-600',     border: 'border-sky-200',     hoverBorder: 'hover:border-sky-400',     gradientFrom: 'from-sky-50' },
}

export function getGamesByCategory(category: GameCategory): GameConfig[] {
  return GAMES.filter(g => g.category === category)
}

export function getGameClasses(game: GameConfig): GameClassSet {
  return GAME_CLASS_MAP[game.color]
}
