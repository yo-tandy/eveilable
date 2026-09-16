import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { signOut } from 'firebase/auth'
import { auth } from '../../config/firebase'
import { Gamepad2, BarChart3, LogOut, LogIn, Menu, X, Flame, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getCurrentStreak } from '../../utils/streak'
import type { SupportedLanguage } from '../../types/user'

const UI_LANGUAGES: SupportedLanguage[] = ['en', 'fr', 'de', 'it', 'zh', 'he']

function LogoMark() {
  return (
    <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true" className="-rotate-6">
      <rect x="4" y="4" width="56" height="56" rx="16" fill="#ff5c5c" stroke="#1b1a2e" strokeWidth="4" />
      <path
        d="M32 16c-7 0-12 4.5-12 11-5 0-8.5 4-8.5 8.5 0 3.5 2 6 4.5 7.5-1 3 0 7 3.5 9 1.5 4 5.5 6.5 10 5.5 1 1.5 2 2 2.5 2s1.5-.5 2.5-2c4.5 1 8.5-1.5 10-5.5 3.5-2 4.5-6 3.5-9 2.5-1.5 4.5-4 4.5-7.5 0-4.5-3.5-8.5-8.5-8.5 0-6.5-5-11-12-11z"
        fill="#fffdf7" stroke="#1b1a2e" strokeWidth="3.5" strokeLinejoin="round"
      />
      <path d="M32 16v42" stroke="#1b1a2e" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="26" cy="36" r="2.6" fill="#1b1a2e" /><circle cx="38" cy="36" r="2.6" fill="#1b1a2e" />
      <path d="M27 45c2.5 3 7.5 3 10 0" fill="none" stroke="#1b1a2e" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Navbar() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { uiLanguage, setUiLanguage } = useSettingsStore()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [streak, setStreak] = useState(0)

  // Refresh streak when location changes (e.g., navigating away from a game)
  useEffect(() => {
    if (user) setStreak(getCurrentStreak())
    setMobileOpen(false)
  }, [user, location.pathname])

  const handleLogout = async () => {
    await signOut(auth)
    setMobileOpen(false)
  }

  const isActive = (path: string) => location.pathname.startsWith(path)
  const linkClass = (active: boolean) =>
    `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-extrabold text-[15px] no-underline text-ink transition-colors ${
      active ? 'bg-sun border-3 border-ink shadow-[2px_2px_0_#1b1a2e]' : 'hover:bg-butter'
    }`

  const languagePicker = (
    <label className="chip relative cursor-pointer">
      <span className="sr-only">{t('nav.language')}</span>
      <span aria-hidden="true">{uiLanguage.toUpperCase()}</span>
      <ChevronDown size={14} aria-hidden="true" />
      <select
        value={uiLanguage}
        onChange={(e) => setUiLanguage(e.target.value as SupportedLanguage)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full"
      >
        {UI_LANGUAGES.map((code) => (
          <option key={code} value={code}>{t(`languages.${code}`)}</option>
        ))}
      </select>
    </label>
  )

  const navLinks = user ? (
    <>
      <Link to="/games" className={linkClass(isActive('/games'))}>
        <Gamepad2 size={18} aria-hidden="true" />
        {t('nav.play')}
      </Link>
      <Link to="/progress" className={linkClass(isActive('/progress'))}>
        <BarChart3 size={18} aria-hidden="true" />
        {t('nav.progress')}
      </Link>
      <button onClick={handleLogout} className={linkClass(false)} type="button">
        <LogOut size={18} aria-hidden="true" />
        {t('nav.logout')}
      </button>
    </>
  ) : (
    <Link to="/login" className={linkClass(isActive('/login'))}>
      <LogIn size={18} aria-hidden="true" />
      {t('nav.login')}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 mx-3 sm:mx-4 mt-3">
      <div className="sticker !rounded-2xl">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 display text-[26px] text-ink no-underline">
            <LogoMark />
            Eveilable
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-2">
            {user && streak > 0 && (
              <span
                className="chip bg-[#ffd9a8]"
                title={t('nav.streakTooltip', { count: streak })}
                aria-label={t('nav.streakTooltip', { count: streak })}
              >
                <Flame size={15} className="text-coral" aria-hidden="true" />
                {streak}
              </span>
            )}
            {navLinks}
            {languagePicker}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 rounded-xl hover:bg-butter"
            aria-label={t('nav.menu')}
            aria-expanded={mobileOpen}
            type="button"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t-3 border-ink px-4 py-3 flex flex-col gap-1.5">
            {user && streak > 0 && (
              <span className="chip self-start bg-[#ffd9a8]">
                <Flame size={15} className="text-coral" aria-hidden="true" />
                {t('nav.streakTooltip', { count: streak })}
              </span>
            )}
            {navLinks}
            <div className="pt-1">{languagePicker}</div>
          </div>
        )}
      </div>
    </nav>
  )
}
