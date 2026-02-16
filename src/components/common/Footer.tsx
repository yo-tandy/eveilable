import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-gray-200 bg-white/80 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
        <span>© {new Date().getFullYear()} Taveyo SARL</span>
        <nav className="flex items-center gap-4">
          <Link to="/about" className="hover:text-brand-600 transition-colors">
            {t('footer.about')}
          </Link>
          <Link to="/contact" className="hover:text-brand-600 transition-colors">
            {t('footer.contact')}
          </Link>
          <Link to="/privacy" className="hover:text-brand-600 transition-colors">
            {t('footer.privacy')}
          </Link>
          <Link to="/terms" className="hover:text-brand-600 transition-colors">
            {t('footer.terms')}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
