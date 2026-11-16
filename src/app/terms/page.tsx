import Link from "next/link";

export const metadata = { title: "Terms of Service — BuruStudio" };

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-14 space-y-10">
      <div className="space-y-3">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors tracking-wider">← Back</Link>
        <h1 className="text-4xl font-black tracking-tighter text-white">Terms of Service</h1>
        <p className="text-zinc-500 text-sm">Last updated: November 2025</p>
      </div>

      <div className="prose prose-invert prose-sm max-w-none space-y-8 text-zinc-400 leading-relaxed">

        <Section title="1. Acceptance of terms">
          By creating an account or using BuruStudio, you agree to these Terms of Service. If you do not agree, please do not use the service.
        </Section>

        <Section title="2. What BuruStudio does">
          BuruStudio is an AI-powered creative platform that lets you generate images, videos, and audio using third-party AI models. Generated content is stored in your personal gallery and can be downloaded.
        </Section>

        <Section title="3. Credits and payments">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Credits are purchased in advance and consumed when you generate content.</li>
            <li>Credit balances are non-refundable once consumed.</li>
            <li>Unused purchased credits expire after 12 months from the date of purchase.</li>
            <li>Welcome credits are non-transferable and expire after 90 days.</li>
            <li>Prices are displayed in GBP and include VAT where applicable.</li>
          </ul>
        </Section>

        <Section title="4. Acceptable use">
          You must not use BuruStudio to generate content that:
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Depicts or sexualises minors in any way.</li>
            <li>Incites violence, hatred, or discrimination against any group.</li>
            <li>Infringes the intellectual property rights of others.</li>
            <li>Is designed to deceive, defraud, or impersonate real people without consent.</li>
            <li>Violates any applicable law or regulation.</li>
          </ul>
          We reserve the right to suspend or terminate accounts that violate these rules.
        </Section>

        <Section title="5. Ownership of generated content">
          You own the content you generate through BuruStudio, subject to the terms of the underlying AI model providers. We do not claim any ownership over your creations. You are responsible for ensuring your use of generated content complies with applicable laws.
        </Section>

        <Section title="6. Service availability">
          We aim to maintain high availability but cannot guarantee uninterrupted access. We are not liable for losses caused by downtime, errors, or failures in third-party AI model services.
        </Section>

        <Section title="7. Privacy">
          Your use of BuruStudio is also governed by our <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 underline">Privacy Policy</Link>, which is incorporated into these terms by reference.
        </Section>

        <Section title="8. Changes to these terms">
          We may update these terms from time to time. We will notify you of material changes by email. Continued use after changes take effect constitutes acceptance.
        </Section>

        <Section title="9. Governing law">
          These terms are governed by the laws of England and Wales. Any disputes will be subject to the exclusive jurisdiction of the English courts.
        </Section>

        <Section title="10. Contact">
          For questions about these terms, contact us at{" "}
          <a href="mailto:hello@elmorilx.com" className="text-indigo-400 hover:text-indigo-300 underline">hello@elmorilx.com</a>.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-zinc-200">{title}</h2>
      <div className="text-zinc-500 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
