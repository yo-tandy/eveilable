import { Component, type ErrorInfo, type ReactNode } from 'react'
import { withTranslation, type WithTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { RotateCcw, Home } from 'lucide-react'

interface Props extends WithTranslation {
  children: ReactNode
  /** Changing this value (e.g. the route) clears a caught error. */
  resetKey?: string
}

interface State {
  error: Error | null
}

/**
 * Catches render errors below it so a bad API payload or a bug in one game
 * shows a retry card instead of blanking the whole app.
 */
class ErrorBoundaryInner extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    const { t } = this.props
    if (!this.state.error) return this.props.children

    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="sticker p-8 text-center" role="alert">
          <h2 className="display text-[30px] mb-2">{t('common.error')}</h2>
          <p className="text-ink-2 font-bold text-sm mb-6 break-words">{this.state.error.message}</p>
          <div className="flex gap-3 justify-center">
            <button type="button" className="btn btn-sun" onClick={() => this.setState({ error: null })}>
              <RotateCcw size={18} aria-hidden="true" />
              {t('common.retry')}
            </button>
            <Link to="/" className="btn btn-ghost" onClick={() => this.setState({ error: null })}>
              <Home size={18} aria-hidden="true" />
              {t('nav.play')}
            </Link>
          </div>
        </div>
      </div>
    )
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryInner)
