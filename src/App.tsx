import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './config/firebase'
import { useAuthStore } from './stores/authStore'
import { useSettingsStore } from './stores/settingsStore'
import { useTranslation } from 'react-i18next'
import { Navbar } from './components/common/Navbar'
import { Footer } from './components/common/Footer'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { LoadingSpinner } from './components/common/LoadingSpinner'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './components/auth/LoginPage'
import { RegisterPage } from './components/auth/RegisterPage'

const GameSelectPage = lazy(() =>
  import('./pages/GameSelectPage').then((m) => ({ default: m.GameSelectPage }))
)
const DividedAttentionPage = lazy(() =>
  import('./pages/DividedAttentionPage').then((m) => ({ default: m.DividedAttentionPage }))
)
const DoubleDecisionPage = lazy(() =>
  import('./pages/DoubleDecisionPage').then((m) => ({ default: m.DoubleDecisionPage }))
)
const ComprehensionPage = lazy(() =>
  import('./pages/ComprehensionPage').then((m) => ({ default: m.ComprehensionPage }))
)
const SpeedSummaryPage = lazy(() =>
  import('./pages/SpeedSummaryPage').then((m) => ({ default: m.SpeedSummaryPage }))
)
const IconSwapPage = lazy(() =>
  import('./pages/IconSwapPage').then((m) => ({ default: m.IconSwapPage }))
)
const TenseRewritePage = lazy(() =>
  import('./pages/TenseRewritePage').then((m) => ({ default: m.TenseRewritePage }))
)
const ProgressPage = lazy(() =>
  import('./pages/ProgressPage').then((m) => ({ default: m.ProgressPage }))
)
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
)
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
)
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
)
const TermsPage = lazy(() =>
  import('./pages/TermsPage').then((m) => ({ default: m.TermsPage }))
)

function App() {
  const { setUser } = useAuthStore()
  const { uiLanguage } = useSettingsStore()
  const { i18n } = useTranslation()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return unsubscribe
  }, [setUser])

  // Sync UI language and RTL direction
  useEffect(() => {
    i18n.changeLanguage(uiLanguage)
    document.documentElement.lang = uiLanguage
    document.documentElement.dir = uiLanguage === 'he' ? 'rtl' : 'ltr'
  }, [uiLanguage, i18n])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route
              path="/games"
              element={
                <ProtectedRoute>
                  <GameSelectPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/divided-attention"
              element={
                <ProtectedRoute>
                  <DividedAttentionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/double-decision"
              element={
                <ProtectedRoute>
                  <DoubleDecisionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/comprehension"
              element={
                <ProtectedRoute>
                  <ComprehensionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/speed-summary"
              element={
                <ProtectedRoute>
                  <SpeedSummaryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/icon-swap"
              element={
                <ProtectedRoute>
                  <IconSwapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/tense-rewrite"
              element={
                <ProtectedRoute>
                  <TenseRewritePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <ProgressPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default App
