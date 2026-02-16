import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { callFunction } from '../services/api'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'

export function ContactPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [name, setName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    try {
      await callFunction('submitContact', { name, email, message })
      setStatus('success')
      setMessage('')
    } catch (err) {
      console.error('Contact submit error:', err)
      setStatus('error')
      setErrorMsg(t('contact.errorMessage'))
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('contact.title')}</h1>
      <p className="text-gray-500 mb-8">{t('contact.subtitle')}</p>

      {status === 'success' ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle size={48} className="text-emerald-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('contact.successTitle')}</h2>
          <p className="text-gray-500 mb-6">{t('contact.successMessage')}</p>
          <button
            onClick={() => setStatus('idle')}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
          >
            {t('contact.sendAnother')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('contact.name')}
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder={t('contact.namePlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('contact.email')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder={t('contact.emailPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              {t('contact.message')}
            </label>
            <textarea
              id="message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              placeholder={t('contact.messagePlaceholder')}
            />
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
            {status === 'sending' ? t('contact.sending') : t('contact.send')}
          </button>
        </form>
      )}
    </div>
  )
}
