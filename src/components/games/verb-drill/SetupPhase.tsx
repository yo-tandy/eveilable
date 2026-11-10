import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X, Sparkles, Clock3, ListOrdered, Play } from 'lucide-react'
import { VERB_DRILL_TENSES, TIER_ORDER } from '../../../config/verbDrillTenses'
import { suggestVerbs } from '../../../services/verbDrillService'
import { levelTier } from '../../../utils/levelScale'
import type { TenseOption } from '../../../types/verbDrill'
import type { SupportedLanguage, LanguageLevel, LanguageSubLevel } from '../../../types/user'

const MAX_VERBS = 15
const SUGGEST_COUNT = 8
const SENTENCE_COUNTS = [5, 10, 15]

export interface DrillSetup {
  verbs: string[]
  tenses: TenseOption[]
  count: number
}

interface SetupPhaseProps {
  language: SupportedLanguage
  level: LanguageLevel
  subLevel: LanguageSubLevel
  error?: string | null
  onStart: (setup: DrillSetup) => void
}

const storageKey = (language: string) => `verbDrill.setup.${language}`

/** Last setup for this language, so a replay starts where the learner left off. */
function loadSaved(language: SupportedLanguage): { verbs: string[]; tenseIds: string[]; count: number } | null {
  try {
    const raw = localStorage.getItem(storageKey(language))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function save(language: SupportedLanguage, setup: DrillSetup) {
  try {
    localStorage.setItem(storageKey(language), JSON.stringify({
      verbs: setup.verbs,
      tenseIds: setup.tenses.map(t => t.id),
      count: setup.count,
    }))
  } catch { /* storage unavailable: setup just won't be remembered */ }
}

/** Split typed or pasted input on commas, semicolons, and newlines. */
function parseVerbs(input: string): string[] {
  return input.split(/[,;\n،、，]+/).map(v => v.trim()).filter(Boolean)
}

export function SetupPhase({ language, level, subLevel, error, onStart }: SetupPhaseProps) {
  const { t } = useTranslation()
  const tenseOptions = VERB_DRILL_TENSES[language]
  const isRTL = language === 'he'

  const [saved] = useState(() => loadSaved(language))
  const [verbs, setVerbs] = useState<string[]>(() => saved?.verbs?.slice(0, MAX_VERBS) ?? [])
  const [draft, setDraft] = useState('')
  const [selectedTenses, setSelectedTenses] = useState<Set<string>>(() => {
    const valid = saved?.tenseIds?.filter(id => tenseOptions.some(o => o.id === id))
    if (valid && valid.length > 0) return new Set(valid)
    // Default to the tenses taught at the learner's band
    const tier = levelTier(level)
    return new Set(tenseOptions.filter(o => o.tier === tier).map(o => o.id))
  })
  const [count, setCount] = useState(() => SENTENCE_COUNTS.includes(saved?.count ?? 0) ? saved!.count : 10)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)

  const addVerbs = useCallback((incoming: string[]) => {
    setVerbs(prev => {
      const seen = new Set(prev.map(v => v.toLowerCase()))
      const next = [...prev]
      for (const v of incoming) {
        if (next.length >= MAX_VERBS) break
        if (v.length > 40 || seen.has(v.toLowerCase())) continue
        seen.add(v.toLowerCase())
        next.push(v)
      }
      return next
    })
  }, [])

  const commitDraft = useCallback(() => {
    addVerbs(parseVerbs(draft))
    setDraft('')
  }, [draft, addVerbs])

  const handleDraftChange = useCallback((value: string) => {
    // A pasted list or a typed separator commits everything before it
    if (/[,;\n،、，]/.test(value)) {
      const parts = value.split(/[,;\n،、，]/)
      addVerbs(parseVerbs(parts.slice(0, -1).join(',')))
      setDraft(parts[parts.length - 1])
    } else {
      setDraft(value)
    }
  }, [addVerbs])

  const handleSuggest = useCallback(async () => {
    setSuggesting(true)
    setSuggestError(null)
    try {
      const room = MAX_VERBS - verbs.length
      const suggested = await suggestVerbs(language, level, subLevel, Math.min(SUGGEST_COUNT, room), verbs)
      addVerbs(suggested)
    } catch (err: unknown) {
      setSuggestError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSuggesting(false)
    }
  }, [language, level, subLevel, verbs, addVerbs, t])

  const toggleTense = useCallback((id: string) => {
    setSelectedTenses(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const tenses = tenseOptions.filter(o => selectedTenses.has(o.id))
  const pendingDraft = parseVerbs(draft)
  const canStart = (verbs.length > 0 || pendingDraft.length > 0) && tenses.length > 0

  const handleStart = useCallback(() => {
    if (!canStart) return
    // Include whatever is still in the input box
    const seen = new Set(verbs.map(v => v.toLowerCase()))
    const allVerbs = [...verbs, ...pendingDraft.filter(v => !seen.has(v.toLowerCase()))].slice(0, MAX_VERBS)
    const setup = { verbs: allVerbs, tenses, count }
    save(language, setup)
    onStart(setup)
  }, [canStart, verbs, pendingDraft, tenses, count, language, onStart])

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-8">
      <div className="text-center">
        <h2 className="display text-[34px] leading-tight mb-2">{t('games.verbDrill.setupTitle')}</h2>
        <span className="chip">
          {t(`languages.${language}`)} · {level}
        </span>
      </div>

      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      {/* Verbs */}
      <section aria-labelledby="verb-drill-verbs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 id="verb-drill-verbs" className="display text-[24px]">
            {t('games.verbDrill.verbsHeading')}
          </h3>
          <span className="text-sm font-bold text-ink-2">{verbs.length}/{MAX_VERBS}</span>
        </div>
        <p className="text-sm text-ink-2 font-bold mb-3">{t('games.verbDrill.verbsHint')}</p>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={draft}
            onChange={e => handleDraftChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitDraft()
              }
            }}
            className="field flex-1 min-w-0 px-4 py-2.5"
            placeholder={t('games.verbDrill.verbPlaceholder')}
            aria-label={t('games.verbDrill.verbPlaceholder')}
            dir={isRTL ? 'rtl' : 'ltr'}
            disabled={verbs.length >= MAX_VERBS}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={commitDraft}
            disabled={pendingDraft.length === 0 || verbs.length >= MAX_VERBS}
            className="btn btn-ghost btn-sm"
            aria-label={t('games.verbDrill.addVerb')}
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>

        {verbs.length > 0 && (
          <ul className="flex flex-wrap gap-2 mb-3">
            {verbs.map(v => (
              <li key={v} className="chip" dir={isRTL ? 'rtl' : 'ltr'}>
                {v}
                <button
                  type="button"
                  onClick={() => setVerbs(prev => prev.filter(x => x !== v))}
                  className="-me-1 rounded-full hover:bg-black/10 p-0.5"
                  aria-label={t('games.verbDrill.removeVerb', { verb: v })}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSuggest}
            disabled={suggesting || verbs.length >= MAX_VERBS}
            className="btn btn-blue btn-sm"
          >
            <Sparkles size={16} aria-hidden="true" />
            {suggesting ? t('games.verbDrill.suggesting') : t('games.verbDrill.suggestVerbs')}
          </button>
          {verbs.length > 0 && (
            <button type="button" onClick={() => setVerbs([])} className="chip chip-muted">
              {t('games.verbDrill.clear')}
            </button>
          )}
        </div>
        {suggestError && (
          <p className="mt-2 text-sm font-bold text-red-600" role="alert">{suggestError}</p>
        )}
      </section>

      {/* Tenses */}
      <section aria-labelledby="verb-drill-tenses">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 id="verb-drill-tenses" className="display text-[24px] flex items-center gap-2">
            <Clock3 size={22} aria-hidden="true" />
            {t(language === 'zh' ? 'games.verbDrill.aspectsHeading' : 'games.verbDrill.tensesHeading')}
          </h3>
          <div className="flex gap-1">
            <button type="button" className="chip chip-muted" onClick={() => setSelectedTenses(new Set(tenseOptions.map(o => o.id)))}>
              {t('games.verbDrill.all')}
            </button>
            <button type="button" className="chip chip-muted" onClick={() => setSelectedTenses(new Set())}>
              {t('games.verbDrill.none')}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {TIER_ORDER.map(tier => {
            const options = tenseOptions.filter(o => o.tier === tier)
            if (options.length === 0) return null
            return (
              <div key={tier}>
                <h4 className="text-xs font-black uppercase tracking-wider text-ink-2 mb-2">
                  {t(`games.verbDrill.tier.${tier}`)}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label={t(`games.verbDrill.tier.${tier}`)}>
                  {options.map(o => {
                    const selected = selectedTenses.has(o.id)
                    return (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleTense(o.id)}
                        className={`option text-start px-3 py-2 ${selected ? 'option-selected' : ''}`}
                      >
                        <span className="block font-extrabold text-sm" dir="auto">{o.label}</span>
                        <span className="block text-xs font-bold text-ink-2" dir="auto">{o.description}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Length */}
      <section aria-labelledby="verb-drill-count">
        <h3 id="verb-drill-count" className="display text-[24px] mb-3 flex items-center gap-2">
          <ListOrdered size={22} aria-hidden="true" />
          {t('games.verbDrill.countHeading')}
        </h3>
        <div className="grid grid-cols-3 gap-3" role="group" aria-labelledby="verb-drill-count">
          {SENTENCE_COUNTS.map(n => (
            <button
              key={n}
              type="button"
              aria-pressed={count === n}
              onClick={() => setCount(n)}
              className={`option p-3 text-center ${count === n ? 'option-selected' : ''}`}
            >
              <span className="display text-xl">{n}</span>
              <span className="block text-xs font-bold text-ink-2">{t('games.verbDrill.sentences')}</span>
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={handleStart}
        disabled={!canStart}
        className="w-full btn btn-sun"
      >
        <Play size={18} aria-hidden="true" />
        {t('games.verbDrill.start')}
      </button>
      {!canStart && (
        <p className="-mt-5 text-center text-sm font-bold text-ink-2">
          {t('games.verbDrill.needVerbAndTense')}
        </p>
      )}
    </div>
  )
}
