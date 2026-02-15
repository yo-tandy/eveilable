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
}
