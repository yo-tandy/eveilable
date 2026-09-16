import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="mx-3 sm:mx-4 mb-4 mt-auto">
      <div className="max-w-5xl mx-auto px-2 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm font-bold text-ink-2">
        <span>&copy; {new Date().getFullYear()} Taveyo SARL</span>
        <nav className="flex items-center gap-5">
          <Link to="/about" className="text-ink hover:underline underline-offset-4 decoration-2 decoration-coral">
            {t('footer.about')}
          </Link>
          <Link to="/contact" className="text-ink hover:underline underline-offset-4 decoration-2 decoration-coral">
            {t('footer.contact')}
          </Link>
          <Link to="/privacy" className="text-ink hover:underline underline-offset-4 decoration-2 decoration-coral">
            {t('footer.privacy')}
          </Link>
          <Link to="/terms" className="text-ink hover:underline underline-offset-4 decoration-2 decoration-coral">
            {t('footer.terms')}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
