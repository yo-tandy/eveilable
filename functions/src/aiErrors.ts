import { HttpsError } from 'firebase-functions/v2/https'

/**
 * Translate an error from the Anthropic API into an HttpsError the client can
 * act on, and log it with enough detail to diagnose from Cloud Logging alone.
 *
 * Every AI-backed callable used to collapse every failure into
 * HttpsError('internal', 'Failed to generate X'), which the games render
 * verbatim. A billing outage, an overloaded API and a genuine bug all looked
 * identical to the user and to the logs, so a whole-site outage read as a
 * per-game bug. Transient conditions now get their own status codes and a
 * message that tells the user whether retrying is worth it.
 *
 * Errors are inspected structurally rather than with `instanceof
 * Anthropic.APIError` so this keeps working across SDK upgrades.
 */

/** HTTP status carried by an Anthropic SDK APIError, if this is one. */
function statusOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const status = (error as { status?: unknown }).status
  return typeof status === 'number' ? status : undefined
}

/** The API's own error message, e.g. "Your credit balance is too low...". */
function apiMessageOf(error: unknown): string {
  if (typeof error !== 'object' || error === null) return ''
  const body = (error as { error?: { error?: { message?: unknown } } }).error
  const message = body?.error?.message
  if (typeof message === 'string') return message
  const top = (error as { message?: unknown }).message
  return typeof top === 'string' ? top : ''
}

/** Network-level failures (DNS, socket, abort) surface without an HTTP status. */
function isConnectionError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const name = (error as { name?: unknown }).name
  return typeof name === 'string' &&
    (name === 'AbortError' || name === 'APIConnectionError' || name === 'APIConnectionTimeoutError')
}

const BUSY = 'The AI service is busy right now. Please wait a moment and try again.'
const UNAVAILABLE = 'The AI service is temporarily unavailable. Please try again in a few minutes.'

/**
 * Log `error` under `context` and return the HttpsError to throw.
 *
 * @param context         - Callable name, for the log line (e.g. 'generateArticle')
 * @param fallbackMessage - User-facing message for genuine bugs (e.g. 'Failed to generate article')
 */
export function aiHttpsError(error: unknown, context: string, fallbackMessage: string): HttpsError {
  const status = statusOf(error)
  const apiMessage = apiMessageOf(error)

  console.error(`${context} error:`, error)

  if (status === 429) {
    return new HttpsError('resource-exhausted', BUSY)
  }

  // 529 is Anthropic's "overloaded"; any 5xx is transient on their side.
  if (status !== undefined && status >= 500) {
    return new HttpsError('unavailable', UNAVAILABLE)
  }

  if (isConnectionError(error)) {
    return new HttpsError('unavailable', UNAVAILABLE)
  }

  // Account-level failures: nothing the user did, and retrying won't help until
  // an operator acts. Flag them unmistakably in the logs — this is the line to
  // grep for when every AI game goes down at once.
  if (status === 400 && /credit balance is too low/i.test(apiMessage)) {
    console.error(
      '[ANTHROPIC BILLING] Credit balance exhausted — all AI-backed games are down. ' +
      'Top up at https://console.anthropic.com → Plans & Billing.',
    )
    return new HttpsError('unavailable', UNAVAILABLE)
  }

  if (status === 401 || status === 403) {
    console.error(
      '[ANTHROPIC AUTH] API key rejected (status ' + status + ') — check the ' +
      'ANTHROPIC_API_KEY secret bound to this function.',
    )
    return new HttpsError('unavailable', UNAVAILABLE)
  }

  return new HttpsError('internal', fallbackMessage)
}
