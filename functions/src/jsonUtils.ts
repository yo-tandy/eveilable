/**
 * Shared utilities for getting structured JSON from the Anthropic Claude API.
 *
 * Uses Claude's tool_use feature to guarantee properly serialized JSON output.
 * The SDK handles all JSON escaping, eliminating parse errors from unescaped
 * quotes, special characters, etc.
 */

import type Anthropic from '@anthropic-ai/sdk'
import type { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages'

/**
 * Call Claude and get a structured JSON response using tool_use.
 *
 * Instead of asking Claude to output raw JSON text (which it often mangles),
 * we define a tool with the desired output schema and force Claude to "call"
 * it. The SDK returns the tool input as a properly parsed JS object.
 *
 * @param client  - Anthropic client instance
 * @param prompt  - The user message content
 * @param schema  - JSON Schema describing the expected output shape
 * @param options - Optional overrides (model, max_tokens)
 */
export async function callClaudeStructured(
  client: Anthropic,
  prompt: string,
  schema: Record<string, unknown>,
  options: {
    model?: string
    maxTokens?: number
  } = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const params: MessageCreateParamsNonStreaming = {
    model: options.model ?? 'claude-sonnet-4-20250514',
    max_tokens: options.maxTokens ?? 4096,
    tools: [{
      name: 'structured_output',
      description: 'Return the structured result.',
      input_schema: schema as Anthropic.Tool['input_schema'],
    }],
    tool_choice: { type: 'tool' as const, name: 'structured_output' },
    messages: [{ role: 'user', content: prompt }],
  }

  const response = await client.messages.create(params)

  // Find the tool_use content block
  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  )

  if (!toolBlock) {
    // Fallback: try parsing text response (shouldn't happen with tool_choice forced)
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    )
    if (textBlock) {
      return JSON.parse(textBlock.text)
    }
    throw new Error('Claude returned no tool_use or text content')
  }

  return toolBlock.input
}
