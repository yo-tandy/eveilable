import type { AnswerStatus, FinalStatus, VerbDrillSentence } from '../types/verbDrill'

function normalize(s: string): string {
  return s
    .normalize('NFC')
    .replace(/[’‘`´]/g, "'")
    .replace(/[.!?。！？,，]+$/u, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

/** Drop accents and Hebrew niqqud so a near miss can be told apart from a wrong answer. */
function stripMarks(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC')
}

/**
 * Exact-match check against the expected form and its accepted variants.
 * Hebrew is compared without niqqud, since learners type it without.
 * Answers that only differ by accents are flagged as 'accent'.
 */
export function checkAnswer(answer: string, sentence: VerbDrillSentence, language: string): AnswerStatus {
  const prep = (s: string) => (language === 'he' ? stripMarks(normalize(s)) : normalize(s))
  const given = prep(answer)
  const targets = [sentence.correctForm, ...sentence.acceptedForms].map(prep)
  if (targets.includes(given)) return 'correct'
  const bare = stripMarks(given)
  if (targets.some((t) => stripMarks(t) === bare)) return 'accent'
  return 'wrong'
}

/** Full credit for correct and reviewer-accepted answers, half for accent-only slips. */
export function itemCredit(status: FinalStatus): number {
  return status === 'correct' || status === 'accepted' ? 1 : status === 'accent' ? 0.5 : 0
}
