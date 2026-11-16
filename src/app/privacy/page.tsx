import Link from "next/link";

export const metadata = { title: "Privacy Policy — BuruStudio" };

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-14 space-y-10">
      <div className="space-y-3">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors tracking-wider">← Back</Link>
        <h1 className="text-4xl font-black tracking-tighter text-white">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm">Last updated: November 2025</p>
      </div>

      <div className="space-y-8 text-zinc-500 text-sm leading-relaxed">

        <Section title="1. Who we are">
          BuruStudio is operated by Elmorilx Ltd. We are committed to protecting your privacy and handling your data responsibly. This policy explains what data we collect, why, and your rights over it.
        </Section>

        <Section title="2. Data we collect">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-zinc-300">Account data</strong> — your email address, used to identify your account and send magic-link sign-in emails.</li>
            <li><strong className="text-zinc-300">Usage data</strong> — the prompts you submit, models used, credits consumed, and timestamps of generations.</li>
            <li><strong className="text-zinc-300">Generated content</strong> — images, videos, and audio you create are stored in our database and linked to your account.</li>
            <li><strong className="text-zinc-300">Payment data</strong> — payment transactions are processed by Stripe. We store only a reference to your Stripe customer ID; we never store card numbers.</li>
            <li><strong className="text-zinc-300">Technical data</strong> — standard server logs including IP address, browser type, and pages visited.</li>
          </ul>
        </Section>

        <Section title="3. How we use your data">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To provide and operate the BuruStudio service.</li>
            <li>To process payments and manage your credit balance.</li>
            <li>To send transactional emails (sign-in links, receipts).</li>
            <li>To detect and prevent abuse or misuse of the platform.</li>
            <li>To improve the service (aggregate, anonymised usage analytics only).</li>
          </ul>
          We do not sell your data to third parties. We do not use your prompts or generated content to train AI models.
        </Section>

        <Section title="4. Third-party services">
          We share limited data with:
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li><strong className="text-zinc-300">fal.ai</strong> — your prompts are sent to fal.ai to generate content. Their <a href="https://fal.ai/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">privacy policy</a> applies.</li>
            <li><strong className="text-zinc-300">Anthropic</strong> — prompts sent to Chat Mode are processed by Anthropic&apos;s Claude API. Their <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">privacy policy</a> applies.</li>
            <li><strong className="text-zinc-300">Stripe</strong> — payment processing. Your card data never touches our servers.</li>
            <li><strong className="text-zinc-300">Resend</strong> — transactional email delivery.</li>
          </ul>
        </Section>

        <Section title="5. Data retention">
          We retain your account and generation history for as long as your account is active. You may delete your account and all associated data at any time by emailing us. We will process deletion requests within 30 days.
        </Section>

        <Section title="6. Your rights">
          Under UK GDPR, you have the right to:
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Object to processing or request restriction.</li>
            <li>Data portability (receive your data in a machine-readable format).</li>
          </ul>
          To exercise any of these rights, email us at{" "}
          <a href="mailto:hello@elmorilx.com" className="text-indigo-400 hover:text-indigo-300 underline">hello@elmorilx.com</a>.
        </Section>

        <Section title="7. Cookies">
          We use a single session cookie to keep you signed in. We do not use tracking or advertising cookies. No cookie banner is shown because we only use strictly necessary cookies.
        </Section>

        <Section title="8. Security">
          We use industry-standard security practices including HTTPS, encrypted database connections, and secrets management. Passwords are never stored — we use magic-link authentication only.
        </Section>

        <Section title="9. Changes to this policy">
          We may update this policy. If we make material changes, we will notify you by email. The latest version is always available at this URL.
        </Section>

        <Section title="10. Contact">
          For privacy questions or data requests:{" "}
          <a href="mailto:hello@elmorilx.com" className="text-indigo-400 hover:text-indigo-300 underline">hello@elmorilx.com</a>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-zinc-200">{title}</h2>
      <div>{children}</div>
    </div>
  );
}
