import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { signOut } from 'firebase/auth'
import { auth } from '../../config/firebase'
import { Brain, Gamepad2, BarChart3, LogOut, LogIn, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await signOut(auth)
    setMobileOpen(false)
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

  const navLinks = user ? (
    <>
      <Link
        to="/games"
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive('/games') ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Gamepad2 size={18} />
        {t('nav.games')}
      </Link>
      <Link
        to="/progress"
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive('/progress') ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <BarChart3 size={18} />
        {t('nav.progress')}
      </Link>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <LogOut size={18} />
        {t('nav.logout')}
      </button>
    </>
  ) : (
    <Link
      to="/login"
      onClick={() => setMobileOpen(false)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
    >
      <LogIn size={18} />
      {t('nav.login')}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-brand-700">
          <Brain size={24} />
          Eveilable
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden p-2 text-gray-600"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
          {navLinks}
        </div>
      )}
    </nav>
  )
}
