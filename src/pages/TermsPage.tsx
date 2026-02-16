import { useTranslation } from 'react-i18next'

export function TermsPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('terms.title')}</h1>
      <p className="text-sm text-gray-400 mb-8">Effective Date: February 15, 2026</p>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <p>
          Please read these Terms of Service (&quot;Terms&quot;) carefully before using Eveilable (&quot;the Service&quot;), operated at eveilable.com.
          By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Service Description</h2>
          <p className="mb-3">
            Eveilable is a cognitive training platform that provides interactive brain games designed to improve thought processing abilities, attention, and language comprehension. The Service includes:
          </p>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li><strong>Divided Attention</strong> — visual tracking exercises</li>
            <li><strong>Double Decision</strong> — reaction speed and decision-making exercises</li>
            <li><strong>Comprehension</strong> — reading, quiz, and summary writing exercises with AI-powered feedback</li>
          </ul>
          <p className="font-medium text-gray-800">
            Important: Eveilable is an educational and recreational tool. It is not a medical device, therapy, or substitute for professional medical advice, diagnosis, or treatment. No claims are made regarding clinical or therapeutic outcomes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Accounts</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>You must create an account to use the Service</li>
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You must provide accurate information during registration</li>
            <li>You may not share your account or let others access it</li>
            <li>You must be at least 13 years old to create an account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Acceptable Use</h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Interfere with or disrupt the Service or its infrastructure</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            <li>Use automated tools (bots, scrapers) to access the Service</li>
            <li>Misrepresent your identity or impersonate another person</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. AI-Generated Content</h2>
          <p className="mb-3">The Comprehension game uses artificial intelligence (Anthropic&apos;s Claude API) to:</p>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li>Generate news-style articles based on real headlines</li>
            <li>Create comprehension questions</li>
            <li>Evaluate written summaries and provide feedback</li>
          </ul>
          <p className="font-medium text-gray-800">
            Disclaimer: AI-generated articles are created for educational purposes and may not be fully accurate. They should not be relied upon as factual news sources. AI-generated feedback on summaries is provided as a learning aid and may not always be correct.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Intellectual Property</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>The Service, including its design, code, and branding, is owned by Eveilable</li>
            <li>AI-generated content (articles, questions, feedback) is provided for your personal educational use</li>
            <li>You retain ownership of any content you create (e.g., written summaries)</li>
            <li>You may not reproduce, distribute, or commercially exploit any part of the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Third-Party Services</h2>
          <p className="mb-3">The Service relies on third-party providers:</p>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li><strong>Firebase (Google)</strong> — authentication and data storage</li>
            <li><strong>Anthropic Claude API</strong> — AI content generation and evaluation</li>
            <li><strong>NewsAPI.org</strong> — news headline data</li>
            <li><strong>Google OAuth</strong> — optional sign-in method</li>
          </ul>
          <p>Your use of these services is also subject to their respective terms and policies. We are not responsible for the availability or conduct of third-party services.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Privacy</h2>
          <p>
            Your use of the Service is also governed by our{' '}
            <a href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</a>,
            which describes how we collect, use, and protect your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Availability and Modifications</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>We may modify, suspend, or discontinue the Service at any time without notice</li>
            <li>We do not guarantee uninterrupted or error-free operation</li>
            <li>We may update these Terms from time to time; continued use after changes constitutes acceptance</li>
            <li>We may add, remove, or modify games and features at our discretion</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind</li>
            <li>We disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement</li>
            <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages</li>
            <li>Our total liability for any claim arising from the Service shall not exceed the amount you paid us (if any) in the 12 months preceding the claim</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Termination</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>You may delete your account at any time by contacting us</li>
            <li>We may suspend or terminate your account if you violate these Terms</li>
            <li>Upon termination, your right to use the Service ceases immediately</li>
            <li>Sections that by their nature should survive termination will survive (including Limitation of Liability and Intellectual Property)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Governing Law</h2>
          <p>These Terms are governed by and construed in accordance with applicable law. Any disputes arising from these Terms or the Service shall be resolved through good-faith negotiation before pursuing formal proceedings.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact</h2>
          <p>
            For questions about these Terms, contact:{' '}
            <a href="mailto:legal@eveilable.com" className="text-brand-600 hover:underline">legal@eveilable.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}
