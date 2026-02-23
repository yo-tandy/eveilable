export interface VerbFillSegment {
  type: 'text' | 'verb'
  content?: string
  infinitive?: string
  correctForm?: string
  index?: number
}

export interface VerbFillExercise {
  title: string
  segments: VerbFillSegment[]
  verbCount: number
}

export interface VerbScore {
  index: number
  score: number
  correct: boolean
  feedback: string
  correctForm: string
  userAnswer: string
}

export interface VerbFillEvaluation {
  verbScores: VerbScore[]
  overallScore: number
  feedback: string
}
