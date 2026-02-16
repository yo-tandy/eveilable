# Eveilable

A cognitive training platform with interactive brain games designed to boost thought processing abilities, attention, and language comprehension.

**Live at [eveilable.com](https://eveilable.com)**

## Games

### Divided Attention
Track central and peripheral objects simultaneously. Identify stimuli appearing across the screen while managing split focus.

### Double Decision
Make quick directional decisions under time pressure. Tests reaction speed and accuracy in high-stakes scenarios.

### Comprehension
Read AI-generated news articles, answer comprehension questions, and write summaries. Get detailed AI feedback on accuracy, vocabulary, and grammar. Supports English, French, Chinese, and Hebrew at CEFR levels A1-C2.

## Features

- **Adaptive Difficulty** - 20-level staircase system that adjusts to your performance
- **Progress Tracking** - Charts and stats for accuracy, response time, and difficulty trends
- **Multilingual** - English, French, Chinese, Hebrew with RTL support
- **AI-Powered Feedback** - Detailed sentence-level evaluation for comprehension summaries
- **Google Sign-In** - Quick authentication alongside email/password

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS 4
- **State**: Zustand
- **Backend**: Firebase (Auth, Firestore, Cloud Functions v2)
- **AI**: Anthropic Claude API (article generation, question creation, summary evaluation)
- **News**: NewsAPI.org (with fallback headlines)
- **Charts**: Recharts
- **Icons**: Lucide React
- **i18n**: react-i18next

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase project on Blaze plan
- Anthropic API key
- (Optional) NewsAPI key

### Installation

```bash
git clone https://github.com/yo-tandy/eveilable.git
cd eveilable
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and fill in your Firebase config:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Firebase Cloud Functions Setup

```bash
cd functions
npm install
```

Set the Anthropic API key as a Firebase secret:

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
```

Optionally set a NewsAPI key (falls back to built-in headlines if not set):

```bash
firebase functions:secrets:set NEWS_API_KEY
```

### Development

```bash
npm run dev
```

### Build & Deploy

```bash
# Build client + deploy everything
npm run build
firebase deploy

# Re-apply CORS fix for Cloud Run (required after each function deploy)
gcloud run services update fetchnews --region us-central1 --no-invoker-iam-check --project YOUR_PROJECT_ID
gcloud run services update generatearticle --region us-central1 --no-invoker-iam-check --project YOUR_PROJECT_ID
gcloud run services update generatequestions --region us-central1 --no-invoker-iam-check --project YOUR_PROJECT_ID
gcloud run services update evaluatesummary --region us-central1 --no-invoker-iam-check --project YOUR_PROJECT_ID
```

## Project Structure

```
src/
  components/
    auth/           # Login, Register pages
    common/         # Navbar, ProtectedRoute, GameCanvas, Timer
    games/
      divided-attention/
      double-decision/
      comprehension/
    progress/       # Charts, history, goal tracking
    stats/          # Session stats, performance ratings
  config/           # Firebase initialization
  hooks/            # useGameSession, useVisualGameLoop
  i18n/             # Translation files (en, fr, zh, he)
  pages/            # Route pages
  services/         # API client, Firestore, Claude, News
  stores/           # Zustand stores (auth, game, settings)
  types/            # TypeScript interfaces
  utils/            # Adaptive difficulty, geometry, stats

functions/
  src/
    index.ts        # Function exports
    news.ts         # fetchNews (NewsAPI + fallbacks)
    claude.ts       # generateArticle, generateQuestions, evaluateSummary
```

## License

MIT
