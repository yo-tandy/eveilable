import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'

initializeApp()

const NEWS_API_KEY = process.env.NEWS_API_KEY || ''

const LANGUAGE_MAP: Record<string, string> = {
  en: 'en',
  fr: 'fr',
  zh: 'zh',
  he: 'he',
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
}

export const fetchNews = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const { language = 'en' } = request.data as { language?: string }

    // If no NEWS_API_KEY, return fallback headlines
    if (!NEWS_API_KEY) {
      const lang = LANGUAGE_MAP[language] || 'en'
      const headlines = FALLBACK_HEADLINES[lang] || FALLBACK_HEADLINES['en']
      return { headlines }
    }

    const apiLang = LANGUAGE_MAP[language] || 'en'
    const url = `https://newsapi.org/v2/top-headlines?language=${apiLang}&pageSize=5&apiKey=${NEWS_API_KEY}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'ok') {
      throw new HttpsError('internal', data.message || 'News API error')
    }

    const headlines = data.articles.map((article: { title: string; description: string; source: { name: string } }) => ({
      title: article.title,
      description: article.description,
      source: article.source?.name,
    }))

    return { headlines }
  }
)
