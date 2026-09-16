import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { validateLanguage } from './validate.js'

initializeApp()

/**
 * Publisher RSS feeds per language. Several per language so one outage or
 * block doesn't take out live news, and so consecutive sessions vary.
 *
 * Google News RSS was the previous source; it started returning 503 / timing
 * out for every request from Cloud Run egress IPs in September 2026. Direct
 * publisher feeds are keyless, want to be consumed, and don't block cloud IPs.
 * All entries below were verified as RSS 2.0 with pubDate on 2026-09-16.
 */
const NEWS_FEEDS: Record<string, { name: string; url: string }[]> = {
  en: [
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
    { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml' },
    { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
  ],
  fr: [
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml' },
    { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss' },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml' },
    { name: 'RFI', url: 'https://www.rfi.fr/fr/rss' },
  ],
  de: [
    { name: 'Tagesschau', url: 'https://www.tagesschau.de/xml/rss2/' },
    { name: 'Der Spiegel', url: 'https://www.spiegel.de/schlagzeilen/index.rss' },
    { name: 'Die Zeit', url: 'https://newsfeed.zeit.de/index' },
    { name: 'Deutsche Welle', url: 'https://rss.dw.com/xml/rss-de-all' },
  ],
  it: [
    { name: 'ANSA', url: 'https://www.ansa.it/sito/notizie/topnews/topnews_rss.xml' },
    { name: 'La Repubblica', url: 'https://www.repubblica.it/rss/homepage/rss2.0.xml' },
    { name: 'Corriere della Sera', url: 'https://xml2.corriereobjects.it/rss/homepage.xml' },
  ],
  // Simplified only. BBC's /zhongwen/simp/ feed now 301s to /trad/ and serves
  // Traditional characters, so it is deliberately absent.
  zh: [
    { name: '德国之声', url: 'https://rss.dw.com/xml/rss-chi-all' },
    { name: '法广', url: 'https://www.rfi.fr/cn/rss' },
    { name: '纽约时报中文网', url: 'https://cn.nytimes.com/rss/' },
    { name: 'FT中文网', url: 'https://www.ftchinese.com/rss/news' },
  ],
  he: [
    { name: 'ynet', url: 'https://www.ynet.co.il/Integration/StoryRss2.xml' },
    { name: 'וואלה', url: 'https://rss.walla.co.il/feed/1?type=main' },
    { name: 'ישראל היום', url: 'https://www.israelhayom.co.il/rss' },
    { name: 'N12', url: 'https://rcs.mako.co.il/rss/news-israel.xml' },
    { name: 'גלובס', url: 'https://www.globes.co.il/webservice/rss/rssfeeder.asmx/FeederNode?iID=1725' },
  ],
}

// Max age of headlines in milliseconds (3 days)
const MAX_ARTICLE_AGE_MS = 3 * 24 * 60 * 60 * 1000

// Try several distinct publishers before giving up on live headlines.
const MAX_FEED_ATTEMPTS = 3
const RETRY_DELAY_MS = 400
const REQUEST_TIMEOUT_MS = 8000

function shuffleAndTake<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

/** Unwrap <![CDATA[...]]>, which many publisher feeds use for titles. */
function stripCdata(s: string): string {
  const m = s.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/)
  return m ? m[1] : s
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

/**
 * Parse an RSS 2.0 feed. Returns items filtered to the last 3 days.
 *
 * When `publisher` is given it is used as every item's source. Publisher feeds
 * don't need an in-item <source>, and some (RFI) repurpose that tag for photo
 * credits, so it is only consulted for aggregator feeds where it is the only
 * way to learn the origin.
 */
function parseRssFeed(xml: string, publisher = ''): { title: string; description: string; source: string }[] {
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

    let rawTitle = decodeEntities(stripCdata(titleMatch[1].trim()).trim())
    const source = publisher || (sourceMatch ? decodeEntities(stripCdata(sourceMatch[1].trim()).trim()) : '')

    // Aggregator-style titles are formatted "Headline - Source". Strip the suffix if present.
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
      description: '', // Feed descriptions are teasers or HTML; the headline alone is the topic seed
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
 * Fetch one publisher feed. Returns null on any failure so the caller can try
 * another publisher rather than falling straight back to canned headlines.
 */
async function fetchFeed(
  feed: { name: string; url: string },
): Promise<{ title: string; description: string; source: string }[] | null> {
  try {
    const response = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EveilableBot/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      console.warn(`News feed ${feed.name} returned ${response.status}`)
      return null
    }

    const items = parseRssFeed(await response.text(), feed.name)
    if (items.length === 0) {
      console.warn(`News feed ${feed.name} returned no items within the freshness window`)
      return null
    }

    return items
  } catch (error: unknown) {
    console.warn(`News feed ${feed.name} fetch failed:`, error)
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
    const feeds = NEWS_FEEDS[language] || NEWS_FEEDS['en']

    // Each attempt uses a different publisher: it varies the content across
    // sessions and routes around a single feed being down.
    const attempts = shuffleAndTake(feeds, MAX_FEED_ATTEMPTS)
    for (let i = 0; i < attempts.length; i++) {
      const items = await fetchFeed(attempts[i])
      if (items) {
        return { headlines: shuffleAndTake(items, 5), source: 'live' as const }
      }
      if (i < attempts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
      }
    }

    // Every attempt failed. Serve canned headlines so the games still work, but
    // say so loudly — this line means users are reading stale sample content.
    console.error(
      `[NEWS FALLBACK] All ${attempts.length} publisher feeds failed for ` +
      `${language}; serving static fallback headlines.`,
    )
    return {
      headlines: FALLBACK_HEADLINES[language] || FALLBACK_HEADLINES['en'],
      source: 'fallback' as const,
    }
  }
)
