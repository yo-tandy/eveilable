import { useTranslation } from 'react-i18next'

export function PrivacyPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="glass rounded-2xl p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('privacy.title')}</h1>
      <p className="text-sm text-gray-400 mb-8">Effective Date: February 15, 2026</p>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <p>
          Eveilable (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the cognitive training platform at eveilable.com. This Privacy Policy explains what data we collect, how we use it, and your rights.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>

          <h3 className="font-semibold text-gray-800 mb-2">Account Information</h3>
          <p className="mb-2">When you create an account, we collect:</p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>Email address</li>
            <li>Display name</li>
            <li>Authentication method (email/password or Google sign-in)</li>
          </ul>

          <h3 className="font-semibold text-gray-800 mb-2">Game Performance Data</h3>
          <p className="mb-2">When you play games, we collect:</p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>Game scores, accuracy rates, and response times</li>
            <li>Difficulty level progression</li>
            <li>Number of trials and sessions played</li>
            <li>Session timestamps and duration</li>
          </ul>

          <h3 className="font-semibold text-gray-800 mb-2">Comprehension Game Data</h3>
          <p className="mb-2">When you play the Comprehension game, we additionally collect:</p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>Your selected language and CEFR level</li>
            <li>Reading time and words-per-minute metrics</li>
            <li>Quiz answers and scores</li>
            <li>Written summaries (sent to our AI service for evaluation)</li>
            <li>Writing time</li>
          </ul>

          <h3 className="font-semibold text-gray-800 mb-2">Data We Do Not Collect</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Payment or financial information</li>
            <li>Location data</li>
            <li>Device identifiers or advertising IDs</li>
            <li>Cookies for tracking (we only use essential session cookies)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Data</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Provide the service</strong>: Track your progress, adapt game difficulty, and deliver personalized feedback</li>
            <li><strong>AI evaluation</strong>: Your written summaries are sent to Anthropic&apos;s Claude API for grammar, vocabulary, and accuracy evaluation. This data is not used to train AI models</li>
            <li><strong>Performance analytics</strong>: Calculate aggregate statistics and display progress charts</li>
            <li><strong>Account management</strong>: Authenticate you and manage your preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Third-Party Services</h2>

          <h3 className="font-semibold text-gray-800 mb-2">Firebase (Google)</h3>
          <p className="mb-4">
            We use Firebase for authentication and data storage. Your account information and game data are stored in Google Cloud Firestore. See{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
              Google&apos;s Privacy Policy
            </a>.
          </p>

          <h3 className="font-semibold text-gray-800 mb-2">Anthropic Claude API</h3>
          <p className="mb-4">
            Written summaries and AI-generated article text are processed through Anthropic&apos;s API for evaluation. Anthropic does not use API inputs to train models. See{' '}
            <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
              Anthropic&apos;s Privacy Policy
            </a>.
          </p>

          <h3 className="font-semibold text-gray-800 mb-2">NewsAPI.org</h3>
          <p className="mb-4">We fetch news headlines using NewsAPI. Only a language preference is sent; no personal data is shared with NewsAPI.</p>

          <h3 className="font-semibold text-gray-800 mb-2">Google OAuth</h3>
          <p>If you sign in with Google, we receive your name and email through Google&apos;s standard OAuth flow. We do not access your Google contacts, calendar, or other data.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Storage and Security</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>All data is stored in Google Cloud Firestore with per-user isolation</li>
            <li>Data is encrypted in transit (HTTPS) and at rest (Google Cloud encryption)</li>
            <li>API keys are stored as Firebase secrets, never exposed to the client</li>
            <li>Cloud Functions require authentication for all requests</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Retention</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Your data is retained for as long as your account is active</li>
            <li>You may request deletion of your account and all associated data at any time</li>
            <li>AI-processed summaries are not stored by Anthropic beyond the API request</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Access</strong> your personal data</li>
            <li><strong>Delete</strong> your account and all associated data</li>
            <li><strong>Export</strong> your game performance data</li>
            <li><strong>Correct</strong> inaccurate personal information</li>
          </ul>
          <p className="mt-2">To exercise these rights, contact us at the email below.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Children&apos;s Privacy</h2>
          <p>Eveilable is not directed at children under 13. We do not knowingly collect data from children under 13. If you believe a child has provided us with personal data, please contact us.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact</h2>
          <p>
            For privacy-related questions or requests, contact:{' '}
            <a href="mailto:privacy@eveilable.com" className="text-brand-600 hover:underline">privacy@eveilable.com</a>
          </p>
        </section>
      </div>
      </div>
    </div>
  )
}
