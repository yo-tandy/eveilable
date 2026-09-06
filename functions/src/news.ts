import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { validateLanguage } from './validate.js'

initializeApp()

const GOOGLE_NEWS_TOPICS = ['WORLD', 'BUSINESS', 'TECHNOLOGY', 'SCIENCE', 'SPORTS', 'HEALTH', 'ENTERTAINMENT']

const GOOGLE_NEWS_LOCALES: Record<string, { hl: string; gl: string; ceid: string }> = {
  en: { hl: 'en', gl: 'US', ceid: 'US:en' },
  fr: { hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  de: { hl: 'de', gl: 'DE', ceid: 'DE:de' },
  it: { hl: 'it', gl: 'IT', ceid: 'IT:it' },
  zh: { hl: 'zh-Hans', gl: 'CN', ceid: 'CN:zh-Hans' },
  he: { hl: 'he', gl: 'IL', ceid: 'IL:he' },
}

// Max age of headlines in milliseconds (3 days)
const MAX_ARTICLE_AGE_MS = 3 * 24 * 60 * 60 * 1000

// Google News intermittently 503s requests from Cloud Run IPs, so retry across
// distinct topic feeds before giving up on live headlines.
const MAX_TOPIC_ATTEMPTS = 3
const RETRY_DELAY_MS = 400
const REQUEST_TIMEOUT_MS = 8000

function shuffleAndTake<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

/** Decode common HTML/XML entities in RSS content */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

/** Parse a Google News RSS feed. Returns items filtered to last 3 days. */
function parseRssFeed(xml: string): { title: string; description: string; source: string }[] {
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
  const now = Date.now()
  const items: { title: string; description: string; source: string }[] = []

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/)
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)
    const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)

    if (!titleMatch) continue

    // Filter by age (last 3 days)
    if (pubDateMatch) {
      const pubDate = new Date(pubDateMatch[1].trim()).getTime()
      if (!isNaN(pubDate) && now - pubDate > MAX_ARTICLE_AGE_MS) continue
    }

    let rawTitle = decodeEntities(titleMatch[1].trim())
    const source = sourceMatch ? decodeEntities(sourceMatch[1].trim()) : ''

    // Google News titles are formatted "Headline - Source". Strip the source suffix.
    if (source) {
      const suffix = ` - ${source}`
      if (rawTitle.endsWith(suffix)) {
        rawTitle = rawTitle.slice(0, -suffix.length)
      }
    }

    // Filter out empty / removed articles
    if (!rawTitle || rawTitle === '[Removed]') continue

    items.push({
      title: rawTitle,
      description: '', // Google News description is just a related-articles list; not useful as a topic seed
      source,
    })
  }

  return items
}

// Fallback headlines when RSS fetch fails
const FALLBACK_HEADLINES: Record<string, { title: string; description: string; source: string }[]> = {
  en: [
    { title: 'Scientists Discover New Species in Deep Ocean Trench', description: 'Marine biologists have identified several previously unknown organisms living at extreme depths.', source: 'Science Daily' },
    { title: 'Global Renewable Energy Investment Reaches Record High', description: 'Clean energy spending surpassed $500 billion for the first time, driven by solar and wind expansion.', source: 'Reuters' },
    { title: 'New Study Links Exercise to Improved Memory in Older Adults', description: 'Research shows that regular physical activity can help maintain cognitive function as we age.', source: 'Health News' },
    { title: 'Urban Farming Movement Grows as Cities Embrace Rooftop Gardens', description: 'City governments are incentivizing green spaces on buildings to improve food security.', source: 'The Guardian' },
    { title: 'International Space Station Marks 25 Years of Continuous Habitation', description: 'Astronauts celebrate a quarter century of living and working in orbit.', source: 'NASA' },
  ],
  fr: [
    { title: 'Des scientifiques font une percée dans le stockage d\'énergie solaire', description: 'Une nouvelle technologie de batterie pourrait révolutionner l\'utilisation de l\'énergie renouvelable.', source: 'Le Monde' },
    { title: 'Le tourisme durable en pleine croissance en Europe', description: 'Les voyageurs choisissent de plus en plus des options respectueuses de l\'environnement.', source: 'Le Figaro' },
    { title: 'Nouvelle découverte archéologique dans le sud de la France', description: 'Des artefacts datant de l\'ère romaine ont été mis au jour lors de travaux de construction.', source: 'France Info' },
    { title: 'L\'intelligence artificielle transforme le secteur de la santé', description: 'Les hôpitaux français adoptent de nouveaux outils de diagnostic assisté par IA.', source: 'Les Échos' },
    { title: 'Record de participation au marathon de Paris', description: 'Plus de 60 000 coureurs ont participé à l\'édition de cette année.', source: 'L\'Équipe' },
  ],
  zh: [
    { title: '中国科学家在量子计算领域取得重大突破', description: '新型量子处理器的性能超越了传统超级计算机。', source: '新华社' },
    { title: '全球气候变化峰会达成新减排协议', description: '各国承诺在未来十年内大幅减少碳排放。', source: '人民日报' },
    { title: '人工智能技术在医疗诊断中的应用前景广阔', description: '研究表明AI辅助诊断的准确率已超过人类医生。', source: '科技日报' },
    { title: '新型电动汽车电池续航里程突破一千公里', description: '这项技术有望彻底改变电动汽车市场。', source: '经济观察报' },
    { title: '城市绿化工程改善居民生活质量', description: '研究显示城市绿地面积增加与居民健康水平提升密切相关。', source: '中国环境报' },
  ],
  he: [
    { title: 'חוקרים ישראלים פיתחו טכנולוגיה חדשה להתפלת מים', description: 'השיטה החדשה יעילה יותר ב-30% מהטכנולוגיות הקיימות.', source: 'הארץ' },
    { title: 'עלייה חדה בהשקעות בתחום האנרגיה המתחדשת', description: 'ישראל מובילה במחקר ופיתוח של פתרונות אנרגיה ירוקה.', source: 'גלובס' },
    { title: 'מחקר חדש: פעילות גופנית מסייעת בשיפור הזיכרון', description: 'אימון קבוע מראה שיפור משמעותי בתפקוד הקוגניטיבי.', source: 'ידיעות אחרונות' },
    { title: 'חינוך דיגיטלי: בתי ספר אומצים כלים טכנולוגיים חדשים', description: 'מערכת החינוך עוברת שינוי משמעותי עם שילוב בינה מלאכותית.', source: 'מעריב' },
    { title: 'ממצא ארכיאולוגי חשוב נחשף בחפירות בנגב', description: 'שרידים בני אלפי שנים שופכים אור חדש על ההיסטוריה של האזור.', source: 'כאן' },
  ],
  de: [
    { title: 'Durchbruch in der Batterietechnologie verspricht längere Laufzeiten', description: 'Forscher haben eine neue Festkörperbatterie entwickelt, die doppelt so lange hält wie herkömmliche Lithium-Ionen-Akkus.', source: 'Der Spiegel' },
    { title: 'Europäische Städte setzen verstärkt auf autofreie Innenstädte', description: 'Immer mehr Großstädte schränken den Autoverkehr im Zentrum ein und fördern den öffentlichen Nahverkehr.', source: 'Die Zeit' },
    { title: 'Neue Studie zeigt Vorteile von mehrsprachiger Erziehung', description: 'Kinder, die mit mehreren Sprachen aufwachsen, zeigen bessere kognitive Fähigkeiten und Problemlösungskompetenz.', source: 'Süddeutsche Zeitung' },
    { title: 'Künstliche Intelligenz revolutioniert die medizinische Diagnostik', description: 'KI-Systeme können bestimmte Krankheiten schneller und genauer erkennen als erfahrene Ärzte.', source: 'FAZ' },
    { title: 'Rekordinvestitionen in erneuerbare Energien in Deutschland', description: 'Die Bundesregierung hat neue Förderprogramme für Solar- und Windenergie angekündigt.', source: 'Handelsblatt' },
  ],
  it: [
    { title: 'Scoperta archeologica rivoluzionaria a Pompei', description: 'Gli scavi hanno rivelato un intero quartiere residenziale perfettamente conservato sotto la cenere vulcanica.', source: 'Corriere della Sera' },
    { title: 'L\'Italia guida la transizione verso l\'energia solare in Europa', description: 'Il paese ha installato più pannelli solari pro capite di qualsiasi altra nazione europea quest\'anno.', source: 'La Repubblica' },
    { title: 'Nuovo studio collega la dieta mediterranea alla longevità', description: 'I ricercatori confermano che l\'alimentazione tradizionale italiana riduce il rischio di malattie cardiovascolari.', source: 'La Stampa' },
    { title: 'Le città italiane adottano sistemi di trasporto intelligente', description: 'Milano e Roma implementano tecnologie avanzate per ridurre il traffico e l\'inquinamento.', source: 'Il Sole 24 Ore' },
    { title: 'Innovazione nel settore agroalimentare italiano', description: 'Le startup agricole utilizzano droni e intelligenza artificiale per migliorare la produzione sostenibile.', source: 'ANSA' },
  ],
}

/**
 * Fetch one Google News RSS topic feed.
 *
 * Google serves 503 to Cloud Run egress IPs intermittently, and the topic URL
 * now 302-redirects to /rss/topics/<id> (fetch follows it). Returns null on any
 * failure so the caller can try another topic rather than falling straight back
 * to canned headlines.
 */
async function fetchTopic(
  topic: string,
  locale: { hl: string; gl: string; ceid: string },
): Promise<{ title: string; description: string; source: string }[] | null> {
  const url = `https://news.google.com/rss/headlines/section/topic/${topic}?hl=${locale.hl}&gl=${locale.gl}&ceid=${encodeURIComponent(locale.ceid)}`

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EveilableBot/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      console.warn(`Google News RSS ${topic} returned ${response.status}`)
      return null
    }

    const items = parseRssFeed(await response.text())
    if (items.length === 0) {
      console.warn(`Google News RSS ${topic} returned no items within the freshness window`)
      return null
    }

    return items
  } catch (error: unknown) {
    console.warn(`Google News RSS ${topic} fetch failed:`, error)
    return null
  }
}

export const fetchNews = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const language = validateLanguage(request.data.language ?? 'en')
    const locale = GOOGLE_NEWS_LOCALES[language] || GOOGLE_NEWS_LOCALES['en']

    // Each attempt uses a different topic: it varies the content across sessions
    // and routes around a single topic feed being unavailable.
    const topics = shuffleAndTake(GOOGLE_NEWS_TOPICS, MAX_TOPIC_ATTEMPTS)
    for (let i = 0; i < topics.length; i++) {
      const items = await fetchTopic(topics[i], locale)
      if (items) {
        return { headlines: shuffleAndTake(items, 5), source: 'live' as const }
      }
      if (i < topics.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
      }
    }

    // Every attempt failed. Serve canned headlines so the games still work, but
    // say so loudly — this line means users are reading stale sample content.
    console.error(
      `[NEWS FALLBACK] All ${MAX_TOPIC_ATTEMPTS} Google News attempts failed for ` +
      `${language}; serving static fallback headlines.`,
    )
    return {
      headlines: FALLBACK_HEADLINES[language] || FALLBACK_HEADLINES['en'],
      source: 'fallback' as const,
    }
  }
)
