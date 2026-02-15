export interface Article {
  title: string
  paragraphs: string[]
  wordCount: number
  language: string
  level: string
  source?: string
}

export interface ComprehensionQuestion {
  question: string
  options: string[]
  correctIndex: number
}

export interface SummaryScore {
  summaryText: string
  wordCount: number
  accuracyScore: number
  vocabularyScore: number
  grammarScore: number
  overallScore: number
  feedback: string
  readingTimeSeconds: number
}
