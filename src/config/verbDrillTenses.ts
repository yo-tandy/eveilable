import type { SupportedLanguage } from '../types/user'
import type { TenseOption } from '../types/verbDrill'

/**
 * Tenses offered in Verb Drill, per language, grouped by the level at which
 * they are usually taught. Chinese has no conjugation, so it drills aspect
 * markers instead, and the answer is the verb plus its marker.
 */
export const VERB_DRILL_TENSES: Record<SupportedLanguage, TenseOption[]> = {
  en: [
    { id: 'present-simple', label: 'Present simple', description: 'I eat', tier: 'beginner' },
    { id: 'present-continuous', label: 'Present continuous', description: 'I am eating', tier: 'beginner' },
    { id: 'past-simple', label: 'Past simple', description: 'I ate', tier: 'beginner' },
    { id: 'future-going-to', label: 'Future (going to)', description: 'I am going to eat', tier: 'beginner' },
    { id: 'future-will', label: 'Future (will)', description: 'I will eat', tier: 'beginner' },
    { id: 'imperative', label: 'Imperative', description: 'Eat!', tier: 'beginner' },
    { id: 'past-continuous', label: 'Past continuous', description: 'I was eating', tier: 'intermediate' },
    { id: 'present-perfect', label: 'Present perfect', description: 'I have eaten', tier: 'intermediate' },
    { id: 'present-perfect-continuous', label: 'Present perfect continuous', description: 'I have been eating', tier: 'intermediate' },
    { id: 'past-perfect', label: 'Past perfect', description: 'I had eaten', tier: 'intermediate' },
    { id: 'conditional', label: 'Conditional', description: 'I would eat', tier: 'intermediate' },
    { id: 'past-perfect-continuous', label: 'Past perfect continuous', description: 'I had been eating', tier: 'advanced' },
    { id: 'future-continuous', label: 'Future continuous', description: 'I will be eating', tier: 'advanced' },
    { id: 'future-perfect', label: 'Future perfect', description: 'I will have eaten', tier: 'advanced' },
    { id: 'conditional-perfect', label: 'Conditional perfect', description: 'I would have eaten', tier: 'advanced' },
  ],
  fr: [
    { id: 'present', label: 'Présent', description: 'je mange', tier: 'beginner' },
    { id: 'passe-compose', label: 'Passé composé', description: "j'ai mangé", tier: 'beginner' },
    { id: 'futur-proche', label: 'Futur proche', description: 'je vais manger', tier: 'beginner' },
    { id: 'imperatif', label: 'Impératif', description: 'mange !', tier: 'beginner' },
    { id: 'imparfait', label: 'Imparfait', description: 'je mangeais', tier: 'intermediate' },
    { id: 'futur-simple', label: 'Futur simple', description: 'je mangerai', tier: 'intermediate' },
    { id: 'conditionnel-present', label: 'Conditionnel présent', description: 'je mangerais', tier: 'intermediate' },
    { id: 'plus-que-parfait', label: 'Plus-que-parfait', description: "j'avais mangé", tier: 'intermediate' },
    { id: 'subjonctif-present', label: 'Subjonctif présent', description: 'que je mange', tier: 'intermediate' },
    { id: 'conditionnel-passe', label: 'Conditionnel passé', description: "j'aurais mangé", tier: 'advanced' },
    { id: 'futur-anterieur', label: 'Futur antérieur', description: "j'aurai mangé", tier: 'advanced' },
    { id: 'subjonctif-passe', label: 'Subjonctif passé', description: "que j'aie mangé", tier: 'advanced' },
    { id: 'passe-simple', label: 'Passé simple', description: 'je mangeai (literary)', tier: 'advanced' },
  ],
  de: [
    { id: 'praesens', label: 'Präsens', description: 'ich esse', tier: 'beginner' },
    { id: 'perfekt', label: 'Perfekt', description: 'ich habe gegessen', tier: 'beginner' },
    { id: 'imperativ', label: 'Imperativ', description: 'iss!', tier: 'beginner' },
    { id: 'praeteritum', label: 'Präteritum', description: 'ich aß', tier: 'intermediate' },
    { id: 'futur-1', label: 'Futur I', description: 'ich werde essen', tier: 'intermediate' },
    { id: 'plusquamperfekt', label: 'Plusquamperfekt', description: 'ich hatte gegessen', tier: 'intermediate' },
    { id: 'konjunktiv-2', label: 'Konjunktiv II', description: 'ich äße / ich würde essen', tier: 'intermediate' },
    { id: 'futur-2', label: 'Futur II', description: 'ich werde gegessen haben', tier: 'advanced' },
    { id: 'konjunktiv-1', label: 'Konjunktiv I', description: 'er esse (reported speech)', tier: 'advanced' },
    { id: 'konjunktiv-2-vergangenheit', label: 'Konjunktiv II Vergangenheit', description: 'ich hätte gegessen', tier: 'advanced' },
  ],
  it: [
    { id: 'presente', label: 'Presente', description: 'io mangio', tier: 'beginner' },
    { id: 'passato-prossimo', label: 'Passato prossimo', description: 'ho mangiato', tier: 'beginner' },
    { id: 'futuro-semplice', label: 'Futuro semplice', description: 'mangerò', tier: 'beginner' },
    { id: 'imperativo', label: 'Imperativo', description: 'mangia!', tier: 'beginner' },
    { id: 'imperfetto', label: 'Imperfetto', description: 'mangiavo', tier: 'intermediate' },
    { id: 'condizionale-presente', label: 'Condizionale presente', description: 'mangerei', tier: 'intermediate' },
    { id: 'congiuntivo-presente', label: 'Congiuntivo presente', description: 'che io mangi', tier: 'intermediate' },
    { id: 'trapassato-prossimo', label: 'Trapassato prossimo', description: 'avevo mangiato', tier: 'intermediate' },
    { id: 'congiuntivo-imperfetto', label: 'Congiuntivo imperfetto', description: 'che io mangiassi', tier: 'advanced' },
    { id: 'congiuntivo-passato', label: 'Congiuntivo passato', description: 'che io abbia mangiato', tier: 'advanced' },
    { id: 'condizionale-passato', label: 'Condizionale passato', description: 'avrei mangiato', tier: 'advanced' },
    { id: 'futuro-anteriore', label: 'Futuro anteriore', description: 'avrò mangiato', tier: 'advanced' },
    { id: 'passato-remoto', label: 'Passato remoto', description: 'mangiai', tier: 'advanced' },
  ],
  he: [
    { id: 'present', label: 'הווה', description: 'Present — אוכל / אוכלת', tier: 'beginner' },
    { id: 'past', label: 'עבר', description: 'Past — אכלתי', tier: 'beginner' },
    { id: 'future', label: 'עתיד', description: 'Future — אוכל / תאכל', tier: 'beginner' },
    { id: 'imperative', label: 'ציווי', description: 'Imperative — אכול! / תאכל!', tier: 'intermediate' },
  ],
  zh: [
    { id: 'perfective-le', label: '了', description: 'Completed action — 吃了', tier: 'beginner' },
    { id: 'progressive-zai', label: '在 / 正在', description: 'In progress — 在吃', tier: 'beginner' },
    { id: 'negative-past-mei', label: '没(有)', description: 'Did not happen — 没吃', tier: 'beginner' },
    { id: 'future-hui', label: '会 / 要', description: 'Future — 会吃', tier: 'beginner' },
    { id: 'experiential-guo', label: '过', description: 'Have ever done — 吃过', tier: 'intermediate' },
    { id: 'durative-zhe', label: '着', description: 'Ongoing state — 坐着', tier: 'intermediate' },
  ],
}

export const TIER_ORDER: TenseOption['tier'][] = ['beginner', 'intermediate', 'advanced']
