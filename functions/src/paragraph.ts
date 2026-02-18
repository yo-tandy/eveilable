import { onCall, HttpsError } from 'firebase-functions/v2/https'
import Anthropic from '@anthropic-ai/sdk'

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  })
}

const SECRETS = ['ANTHROPIC_API_KEY'] as const

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  zh: 'Chinese (Simplified)',
  he: 'Hebrew',
  de: 'German',
  it: 'Italian',
}

function langName(code: string): string {
  return LANGUAGE_NAMES[code] || 'English'
}

function subLevelDescription(level: string, subLevel?: string): string {
  if (!subLevel) return level
  const desc = subLevel === 'novice' ? 'lower range' : subLevel === 'advanced' ? 'upper range' : 'mid range'
  return `${level} (${desc})`
}

/** Strip markdown code fences that Claude sometimes wraps around JSON */
function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match ? match[1].trim() : text.trim()
}

export const generateParagraph = onCall(
  { timeoutSeconds: 60, memory: '256MiB', secrets: [...SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const { headline, language, level, subLevel } = request.data as {
      headline: string
      language: string
      level: string
      subLevel?: string
    }

    try {
      const response = await getClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Write a single news paragraph based on this headline: "${headline}"

Requirements:
- Language: ${langName(language)}
- CEFR language level: ${subLevelDescription(level, subLevel)} (adjust vocabulary and sentence complexity accordingly)
- Exactly ONE paragraph, 80-120 words
- Dense and informative — pack in key facts
- The paragraph should be self-contained and understandable without prior knowledge

Return ONLY a JSON object with this structure (no markdown, no explanation):
{"title": "...", "paragraph": "..."}`
        }],
      })

      const raw = response.content[0].type === 'text' ? response.content[0].text : ''
      const result = JSON.parse(extractJSON(raw))
      const wordCount = result.paragraph.split(/\s+/).length

      return {
        title: result.title,
        paragraph: result.paragraph,
        wordCount,
        language,
        level,
      }
    } catch (error: unknown) {
      console.error('Function error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpsError('internal', message)
    }
  }
)
