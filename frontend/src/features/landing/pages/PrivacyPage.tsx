import React from 'react'
import { LegalLayout } from './LegalLayout'

export const PrivacyPage: React.FC = () => {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="June 5, 2026">
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Introduction</h2>
        <p>
          Welcome to Routiq. We respect your privacy and are committed to protecting your personal data. 
          This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our services.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. Data We Collect</h2>
        <p>
          We collect information that you provide to us directly, including your email address, profile details, 
          and travel preferences when generating itineraries. We also collect trip plans, group invites, comments, 
          and votes that you create.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. How We Use Your Data</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To provide and maintain the Routiq application service.</li>
          <li>To customize your itineraries using third-party AI APIs (Google Gemini).</li>
          <li>To retrieve weather information (Google Weather) and attraction details (Google Places).</li>
          <li>To handle user authentication and session security via Supabase.</li>
          <li>To send invitation emails via Resend.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Third-Party Disclosures</h2>
        <p>
          We share relevant parameters (destination, trip dates, travel type) with Google APIs (Gemini, Places, Weather) 
          to construct your itineraries, and with Resend to transmit emails. Your exact location coordinates are only 
          sent to Google Maps JavaScript SDK on the client side for rendering maps. We do not sell your personal data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Cookies</h2>
        <p>
          Routiq uses essential session cookies (specifically the Supabase authentication access token) to maintain your login 
          session across page reloads. These cookies are required for the service to function and are automatically cleared 
          when you log out or close your browser tab.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. Your Rights</h2>
        <p>
          Under the General Data Protection Regulation (GDPR), you have the right to access your data, request 
          rectification, or completely delete your account. You can trigger complete profile and data erasure 
          from the Profile Settings page within the application.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">7. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, you can contact us at privacy@routiq.dev.
        </p>
      </section>
    </LegalLayout>
  )
}
