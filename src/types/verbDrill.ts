export interface TenseOption {
  id: string
  /** Name as learners of the language are usually taught it. */
  label: string
  /** Short English gloss, shown under the label and sent to the generator. */
  description: string
  tier: 'beginner' | 'intermediate' | 'advanced'
}

export interface VerbDrillSentence {
  before: string
  after: string
  correctForm: string
  acceptedForms: string[]
  infinitive: string
  tenseId: string
  tenseLabel: string
}

export type AnswerStatus = 'correct' | 'accent' | 'wrong'

export interface VerbDrillAnswer {
  userAnswer: string
  status: AnswerStatus
  timeMs: number
  tenseRevealed: boolean
}

export interface VerbDrillReview {
  index: number
  acceptable: boolean
  note: string
}

export interface VerbDrillEvaluation {
  reviews: VerbDrillReview[]
  feedback: string
}

/** Grade after the end-of-drill review, which can accept answers the exact match rejected. */
export type FinalStatus = 'correct' | 'accepted' | 'accent' | 'wrong'

export interface ScoredItem {
  sentence: VerbDrillSentence
  answer: VerbDrillAnswer
  status: FinalStatus
  review?: VerbDrillReview
}
