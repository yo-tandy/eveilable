/** Where a generated story came from and who it was written for. */
export interface StoryMeta {
  /** Publisher of the headline the story was generated from. */
  source?: string
  /** Original article URL. */
  sourceUrl?: string
  /** Original article publication time, ISO-8601. */
  publishedAt?: string
  /** Level the story was written for (CEFR, or HSK for Chinese). */
  level: string
  subLevel?: string
}

export interface Article extends StoryMeta {
  title: string
  paragraphs: string[]
  wordCount: number
  language: string
}

export interface ComprehensionQuestion {
  question: string
  options: string[]
  correctIndex: number
  supportingQuote?: string
}

export interface SentenceIssue {
  sentence: string
  issueType: 'grammar' | 'vocabulary' | 'accuracy'
  explanation: string
  suggestion: string
}

export interface SummaryScore {
  summaryText: string
  wordCount: number
  accuracyScore: number
  vocabularyScore: number
  grammarScore: number
  overallScore: number
  feedback: string
  sentenceIssues: SentenceIssue[]
  readingTimeSeconds: number
  /** Level the summary itself demonstrates on the language's scale, e.g. "A2+", "B1", "HSK4-". */
  assessedLevel?: string
}
