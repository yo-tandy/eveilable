import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './config/firebase'
import { useAuthStore } from './stores/authStore'
import { useSettingsStore } from './stores/settingsStore'
import { useTranslation } from 'react-i18next'
import { Navbar } from './components/common/Navbar'
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
const ProgressPage = lazy(() =>
  import('./pages/ProgressPage').then((m) => ({ default: m.ProgressPage }))
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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
    </div>
  )
}

export default App
