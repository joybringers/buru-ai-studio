import Link from "next/link";
import BuruLogo from "@/components/BuruLogo";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-[#090B1A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        <BuruLogo className="text-xl" />

        <div className="w-12 h-12 rounded-full bg-[#6A4CFF]/15 border border-[#6A4CFF]/30 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A88FFF" strokeWidth="1.5">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        <div>
          <h1
            className="text-2xl font-bold text-[#F2F6FF]"
            style={{ fontFamily: "var(--font-poppins), Poppins, sans-serif" }}
          >
            Check your inbox
          </h1>
          <p className="text-sm text-[#A8B0D8] mt-2">
            A sign-in link was sent. Click it to continue.
          </p>
        </div>

        <p className="text-xs text-[#4A5280] leading-relaxed">
          Running locally? The link is printed in the{" "}
          <span className="font-mono text-[#7B84B5]">npm run dev</span> terminal.
        </p>

        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-1.5 text-xs text-[#6A4CFF] hover:text-[#A88FFF] transition-colors"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
