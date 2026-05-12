import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { validateLanguage } from './validate.js'

initializeApp()

const NEWS_API_KEY = process.env.NEWS_API_KEY || ''

const LANGUAGE_MAP: Record<string, string> = {
  en: 'en',
  fr: 'fr',
  zh: 'zh',
  he: 'he',
  de: 'de',
  it: 'it',
}

// Broad topic queries per language — a random one is picked each request for variety
const TOPIC_QUERIES: Record<string, string[]> = {
  en: ['technology', 'health', 'science', 'environment', 'business', 'culture', 'sports', 'education', 'travel', 'food', 'space', 'climate', 'innovation', 'wildlife', 'music'],
  fr: ['technologie', 'santé', 'science', 'environnement', 'économie', 'culture', 'sport', 'éducation', 'voyage', 'alimentation', 'espace', 'climat', 'innovation', 'nature', 'musique'],
  zh: ['科技', '健康', '科学', '环境', '经济', '文化', '体育', '教育', '旅游', '美食', '太空', '气候', '创新', '自然', '音乐'],
  he: ['טכנולוגיה', 'בריאות', 'מדע', 'סביבה', 'כלכלה', 'תרבות', 'ספורט', 'חינוך', 'טיולים', 'אוכל', 'חלל', 'אקלים', 'חדשנות', 'טבע', 'מוזיקה'],
  de: ['Technologie', 'Gesundheit', 'Wissenschaft', 'Umwelt', 'Wirtschaft', 'Kultur', 'Sport', 'Bildung', 'Reisen', 'Ernährung', 'Weltraum', 'Klima', 'Innovation', 'Natur', 'Musik'],
  it: ['tecnologia', 'salute', 'scienza', 'ambiente', 'economia', 'cultura', 'sport', 'educazione', 'viaggi', 'alimentazione', 'spazio', 'clima', 'innovazione', 'natura', 'musica'],
}

function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0] // YYYY-MM-DD
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffleAndTake<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

// Fallback headlines when NEWS_API_KEY is not configured
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

export const fetchNews = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const language = validateLanguage(request.data.language ?? 'en')

    const apiLang = LANGUAGE_MAP[language] || 'en'

    // If no NEWS_API_KEY, return fallback headlines
    if (!NEWS_API_KEY) {
      const headlines = FALLBACK_HEADLINES[apiLang] || FALLBACK_HEADLINES['en']
      return { headlines }
    }

    // Pick a random topic to get diverse content across sessions
    const topics = TOPIC_QUERIES[apiLang] || TOPIC_QUERIES['en']
    const topic = pickRandom(topics)
    const fromDate = getDateDaysAgo(3)

    // Use "everything" endpoint for date filtering and much larger article pool
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&language=${apiLang}&from=${fromDate}&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`

    try {
      const response = await fetch(url)
      const data = await response.json()

      if (data.status !== 'ok' || !data.articles?.length) {
        // Fall back to top-headlines if everything returns nothing
        console.warn(`NewsAPI everything returned no results for "${topic}" in ${apiLang}, trying top-headlines`)
        const fallbackUrl = `https://newsapi.org/v2/top-headlines?language=${apiLang}&pageSize=10&apiKey=${NEWS_API_KEY}`
        const fallbackResp = await fetch(fallbackUrl)
        const fallbackData = await fallbackResp.json()

        if (fallbackData.status === 'ok' && fallbackData.articles?.length) {
          const headlines = fallbackData.articles
            .filter((a: { title: string }) => a.title && a.title !== '[Removed]')
            .map((article: { title: string; description: string; source: { name: string } }) => ({
              title: article.title,
              description: article.description || '',
              source: article.source?.name || '',
            }))
          return { headlines: shuffleAndTake(headlines, 5) }
        }

        // Last resort: hardcoded fallbacks
        const staticHeadlines = FALLBACK_HEADLINES[apiLang] || FALLBACK_HEADLINES['en']
        return { headlines: staticHeadlines }
      }

      // Filter out removed/empty articles and pick 5 random ones from the 20
      const validArticles = data.articles.filter(
        (a: { title: string; description: string }) =>
          a.title && a.title !== '[Removed]' && a.description
      )

      const headlines = validArticles.map(
        (article: { title: string; description: string; source: { name: string } }) => ({
          title: article.title,
          description: article.description,
          source: article.source?.name || '',
        })
      )

      return { headlines: shuffleAndTake(headlines, 5) }
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error
      console.error('fetchNews error:', error)
      // On any error, return static fallbacks instead of failing
      const staticHeadlines = FALLBACK_HEADLINES[apiLang] || FALLBACK_HEADLINES['en']
      return { headlines: staticHeadlines }
    }
  }
)
