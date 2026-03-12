export interface SentenceScore {
  correct: boolean
  similarity: number // 0-1
  original: string
  userInput: string
}

export interface SentenceMemoryResult {
  sentences: string[]
  userInputs: string[]
  scores: SentenceScore[]
  overallScore: number // 0-10
  correctCount: number
}
