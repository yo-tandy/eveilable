import type { LucideIcon } from 'lucide-react'
import { Eye, Car, BookOpen, Zap, Shuffle, RefreshCw, PenLine, Focus, Languages, Layers, Type, Headphones, Puzzle } from 'lucide-react'
import type { GameType } from '../types/game'

export type GameCategory = 'attention' | 'language' | 'puzzles'

export interface GameConfig {
  id: GameType
  key: string
  icon: LucideIcon
  category: GameCategory
  skillLabel: string
}

/**
 * Category-level visual identity. Every card, tag and icon derives its colour
 * from the category, never from the individual game, so the palette stays at
 * three accents.
 */
export interface CategoryConfig {
  key: GameCategory
  i18nKey: string
  descriptionKey: string
  /** Short playful label shown as a tilted tag next to the section title. */
  tagKey: string
  icon: LucideIcon
  /** Tailwind class for the category accent as text colour. */
  text: string
  /** Tailwind class for the category accent as background colour. */
  bg: string
  /** Sticker art panel utility (see index.css). */
  art: string
  /** Tilted tag utility (see index.css). */
  tag: string
}

export const CATEGORIES: CategoryConfig[] = [
  {
    key: 'attention',
    i18nKey: 'categories.attention',
    descriptionKey: 'categories.attentionDescription',
    tagKey: 'categories.attentionTag',
    icon: Focus,
    text: 'text-coral',
    bg: 'bg-coral',
    art: 'art-attention',
    tag: 'tag-attention',
  },
  {
    key: 'language',
    i18nKey: 'categories.language',
    descriptionKey: 'categories.languageDescription',
    tagKey: 'categories.languageTag',
    icon: Languages,
    text: 'text-blue',
    bg: 'bg-blue',
    art: 'art-language',
    tag: 'tag-language',
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
  icon: LucideIcon
  skillLabel: string
}

export const PUZZLE_CATEGORY: CategoryConfig = {
  key: 'puzzles',
  i18nKey: 'categories.puzzles',
  descriptionKey: 'categories.puzzlesDescription',
  tagKey: 'categories.puzzlesTag',
  icon: Puzzle,
  text: 'text-mint',
  bg: 'bg-mint',
  art: 'art-puzzles',
  tag: 'tag-puzzles',
}

export const PUZZLES: PuzzleConfig[] = [
  {
    id: 'wolves-and-wool',
    key: 'wolvesAndWool',
    // Explicit index.html: a bare directory URL falls through to the SPA rewrite in dev.
    href: '/puzzles/wolves-and-wool/index.html',
    icon: Puzzle,
    skillLabel: 'Planning',
  },
]

export const GAMES: GameConfig[] = [
  { id: 'divided-attention', key: 'dividedAttention', icon: Eye,        category: 'attention', skillLabel: 'Focus' },
  { id: 'double-decision',   key: 'doubleDecision',   icon: Car,        category: 'attention', skillLabel: 'Speed' },
  { id: 'icon-swap',         key: 'iconSwap',         icon: Shuffle,    category: 'attention', skillLabel: 'Memory' },
  { id: 'card-recall',       key: 'cardRecall',       icon: Layers,     category: 'attention', skillLabel: 'Recall' },
  { id: 'comprehension',     key: 'comprehension',    icon: BookOpen,   category: 'language',  skillLabel: 'Reading' },
  { id: 'speed-summary',     key: 'speedSummary',     icon: Zap,        category: 'language',  skillLabel: 'Writing' },
  { id: 'tense-rewrite',     key: 'tenseRewrite',     icon: RefreshCw,  category: 'language',  skillLabel: 'Grammar' },
  { id: 'verb-fill',         key: 'verbFill',         icon: PenLine,    category: 'language',  skillLabel: 'Conjugation' },
  { id: 'sentence-memory',   key: 'sentenceMemory',   icon: Type,       category: 'language',  skillLabel: 'Memory' },
  { id: 'oral-writing',      key: 'oralWriting',      icon: Headphones, category: 'language',  skillLabel: 'Listening' },
]

export function getGamesByCategory(category: GameCategory): GameConfig[] {
  return GAMES.filter(g => g.category === category)
}

export function getGame(id: string): GameConfig | undefined {
  return GAMES.find(g => g.id === id)
}

export function getCategory(key: GameCategory): CategoryConfig {
  return key === 'puzzles' ? PUZZLE_CATEGORY : CATEGORIES.find(c => c.key === key)!
}
