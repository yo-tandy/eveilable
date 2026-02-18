export type TransformationType =
  | 'future-tense'
  | 'past-tense'
  | 'present-tense'
  | 'negation'
  | 'question-form'
  | 'active-voice'
  | 'passive-voice'
  | 'conditional'
  | 'reported-speech'
  | 'subjunctive'
  | 'literary-past'

export interface TenseExercise {
  original: string
  taskDescription: string
  transformationType: TransformationType
  referenceSolution: string
}

export interface SentenceScore {
  index: number
  score: number
  correct: boolean
  feedback: string
  suggestion: string
}

export interface TenseRewriteEvaluation {
  sentenceScores: SentenceScore[]
  overallScore: number
  feedback: string
}
