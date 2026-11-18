"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import BuruLogo from "@/components/BuruLogo";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // Phone OTP state
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [phoneEmail, setPhoneEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/studio" });
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setPhoneLoading(true);
    setPhoneError("");
    const res = await fetch("/api/auth/phone/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, email: phoneEmail }),
    });
    const data = await res.json() as { error?: string };
    setPhoneLoading(false);
    if (!res.ok) { setPhoneError(data.error ?? "Failed to send code"); return; }
    setOtpSent(true);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setVerifyLoading(true);
    setPhoneError("");
    const result = await signIn("phone-otp", { phone, code: otp, email: phoneEmail, redirect: false });
    if (result?.error) {
      setPhoneError("Invalid or expired code — please try again.");
      setVerifyLoading(false);
      return;
    }
    window.location.href = "/studio";
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await signIn("nodemailer", { email, redirect: false });
    setLoading(false);
    setSentTo(email);
    setSent(true);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090B1A]">

      {/* ── Left panel: form ──────────────────────────────────────── */}
      <div className="relative flex flex-col justify-center w-full md:w-1/2 px-8 sm:px-16 lg:px-20 py-10 z-10">

        {/* Logo */}
        <div className="mb-10">
          <BuruLogo className="text-xl" />
        </div>

        {sent ? (
          /* ── Sent state ───────────────────────────────────────── */
          <div className="max-w-sm space-y-6">
            <div className="w-12 h-12 rounded-full bg-[#6A4CFF]/15 border border-[#6A4CFF]/30 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A88FFF" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F2F6FF]" style={{ fontFamily: "var(--font-poppins), Poppins, sans-serif" }}>
                Check your inbox
              </h1>
              <p className="text-sm text-[#A8B0D8] mt-2">
                We emailed a sign-in link to
              </p>
              <p className="text-sm font-semibold text-[#A88FFF] mt-0.5 break-all">{sentTo}</p>
            </div>
            <p className="text-xs text-[#4A5280] leading-relaxed">
              The link expires in 24 hours. Check your spam folder if you don&apos;t see it.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="text-xs text-[#A8B0D8] hover:text-[#F2F6FF] transition-colors underline underline-offset-2"
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* ── Sign-in form ─────────────────────────────────────── */
          <div className="max-w-sm space-y-6">
            <div>
              <h1
                className="text-3xl font-bold text-[#F2F6FF] leading-tight"
                style={{ fontFamily: "var(--font-poppins), Poppins, sans-serif" }}
              >
                Sign in to BuruStudio
              </h1>
              <p className="text-sm text-[#A8B0D8] mt-2 leading-relaxed">
                New or returning, it&apos;s the same page. Create anything with AI.
              </p>
            </div>

            {/* Age confirmation */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 accent-indigo-500"
              />
              <span className="text-xs text-[#A8B0D8] group-hover:text-[#F2F6FF] transition-colors leading-relaxed">
                I confirm I am 18 or older and accept the{" "}
                <a href="/terms" className="text-[#7B84B5] hover:text-[#A8B0D8] underline underline-offset-2" onClick={(e) => e.stopPropagation()}>Terms</a>
                {" "}and{" "}
                <a href="/privacy" className="text-[#7B84B5] hover:text-[#A8B0D8] underline underline-offset-2" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>
              </span>
            </label>

            {/* Google */}
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || !ageConfirmed}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#F2F6FF] text-[#090B1A] font-semibold text-sm py-3.5 rounded-full transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <svg className="animate-spin w-4 h-4 text-zinc-600" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.7 2.3 30.2 0 24 0 14.7 0 6.7 5.5 2.9 13.5l7.9 6.1C12.6 13.4 17.9 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
                  <path fill="#FBBC05" d="M10.8 28.6A14.3 14.3 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A23.8 23.8 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l8.3-6.1z"/>
                  <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2.1 1.4-4.7 2.3-7.7 2.3-6.1 0-11.4-3.9-13.3-9.4l-8.3 6.1C6.7 42.5 14.7 48 24 48z"/>
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-[#1E2140]" />
              <span className="text-xs text-[#4A5280] font-medium whitespace-nowrap">or continue with</span>
              <div className="flex-1 h-px bg-[#1E2140]" />
            </div>

            {/* Email / Phone tabs */}
            <div className="flex rounded-xl overflow-hidden border border-[#1E2140]" style={{ background: "#0E1128" }}>
              {(["email", "phone"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); setPhoneError(""); setOtpSent(false); setOtp(""); setPhoneEmail(""); }}
                  className="flex-1 py-2 text-xs font-semibold transition-all"
                  style={tab === t ? {
                    background: "linear-gradient(100deg, #6A4CFF, #2F6BFF)",
                    color: "#F2F6FF",
                  } : { color: "#4A5280" }}
                >
                  {t === "email" ? "Email" : "📱 Mobile (NG)"}
                </button>
              ))}
            </div>

            {tab === "email" ? (
              <>
                {/* Email form */}
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs text-[#A8B0D8] block mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl bg-[#121530] border border-[#1E2140] focus:border-[#6A4CFF] text-[#F2F6FF] placeholder-[#4A5280] px-4 py-3 text-sm focus:outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email.trim() || !ageConfirmed}
                    className="w-full py-3.5 rounded-full text-sm font-bold tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
                    style={{
                      background: loading || !email.trim()
                        ? "#1E2140"
                        : "linear-gradient(100deg, #6A4CFF 0%, #2F6BFF 100%)",
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Sending…
                      </span>
                    ) : "Send magic link →"}
                  </button>
                </form>
                <p className="text-xs text-[#4A5280] leading-relaxed">
                  No password to remember. We email you a one-time link.
                </p>
              </>
            ) : (
              /* Phone OTP form */
              <div className="space-y-3">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div>
                      <label className="text-xs text-[#A8B0D8] block mb-1.5">Nigerian mobile number</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 08012345678"
                        className="w-full rounded-xl bg-[#121530] border border-[#1E2140] focus:border-[#6A4CFF] text-[#F2F6FF] placeholder-[#4A5280] px-4 py-3 text-sm focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#A8B0D8] block mb-1.5">Email — we&apos;ll send the code here</label>
                      <input
                        type="email"
                        required
                        value={phoneEmail}
                        onChange={(e) => setPhoneEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl bg-[#121530] border border-[#1E2140] focus:border-[#6A4CFF] text-[#F2F6FF] placeholder-[#4A5280] px-4 py-3 text-sm focus:outline-none transition-colors"
                      />
                    </div>
                    {phoneError && <p className="text-xs text-red-400">{phoneError}</p>}
                    <button
                      type="submit"
                      disabled={phoneLoading || !phone.trim() || !phoneEmail.trim() || !ageConfirmed}
                      className="w-full py-3.5 rounded-full text-sm font-bold tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
                      style={{ background: phoneLoading || !phone.trim() ? "#1E2140" : "linear-gradient(100deg, #6A4CFF 0%, #2F6BFF 100%)" }}
                    >
                      {phoneLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          Sending…
                        </span>
                      ) : "Send code →"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <div>
                      <p className="text-xs text-[#A8B0D8] mb-3">
                        We emailed a 6-digit code to <span className="font-semibold text-[#A88FFF]">{phoneEmail}</span>
                      </p>
                      <label className="text-xs text-[#A8B0D8] block mb-1.5">Verification code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        required
                        autoFocus
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="w-full rounded-xl bg-[#121530] border border-[#1E2140] focus:border-[#6A4CFF] text-[#F2F6FF] placeholder-[#4A5280] px-4 py-3 text-sm text-center tracking-[0.4em] font-mono focus:outline-none transition-colors"
                      />
                    </div>
                    {phoneError && <p className="text-xs text-red-400">{phoneError}</p>}
                    <button
                      type="submit"
                      disabled={verifyLoading || otp.length < 6}
                      className="w-full py-3.5 rounded-full text-sm font-bold tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
                      style={{ background: verifyLoading || otp.length < 6 ? "#1E2140" : "linear-gradient(100deg, #6A4CFF 0%, #2F6BFF 100%)" }}
                    >
                      {verifyLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          Verifying…
                        </span>
                      ) : "Verify & sign in →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(""); setPhoneError(""); setPhoneEmail(""); }}
                      className="text-xs text-[#4A5280] hover:text-[#A8B0D8] transition-colors underline underline-offset-2 w-full text-center"
                    >
                      Change number
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── Right panel: AI sci-fi artwork ──────────────────────── */}
      <div className="hidden md:block relative w-1/2 overflow-hidden">
        {/* Sky gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(170deg, #1a0a2e 0%, #2d1472 20%, #4a1fa8 40%, #3730a3 60%, #1e1b4b 80%, #0d0b1e 100%)",
          }}
        />

        {/* Stars */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(1px 1px at 15% 12%, rgba(255,255,255,0.7) 0%, transparent 100%), radial-gradient(1px 1px at 35% 8%, rgba(255,255,255,0.5) 0%, transparent 100%), radial-gradient(1.5px 1.5px at 60% 15%, rgba(255,255,255,0.6) 0%, transparent 100%), radial-gradient(1px 1px at 80% 6%, rgba(255,255,255,0.4) 0%, transparent 100%), radial-gradient(1px 1px at 25% 30%, rgba(255,255,255,0.3) 0%, transparent 100%), radial-gradient(1.5px 1.5px at 70% 25%, rgba(255,255,255,0.5) 0%, transparent 100%), radial-gradient(1px 1px at 88% 35%, rgba(255,255,255,0.4) 0%, transparent 100%), radial-gradient(1px 1px at 45% 20%, rgba(255,255,255,0.3) 0%, transparent 100%)" }} />

        {/* Glowing cyan orb */}
        <div
          className="absolute"
          style={{
            right: "22%",
            top: "28%",
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "radial-gradient(circle, #ffffff 0%, #2BE4FF 25%, #00c8e8 50%, transparent 70%)",
            boxShadow: "0 0 60px 30px rgba(43,228,255,0.35), 0 0 120px 60px rgba(43,228,255,0.15)",
            animation: "float-blob 8s ease-in-out infinite",
          }}
        />

        {/* Lightning bolt SVG */}
        <svg
          className="absolute"
          style={{ top: 0, left: "50%", transform: "translateX(-50%)" }}
          width="120"
          height="65%"
          viewBox="0 0 120 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMin meet"
        >
          <defs>
            <filter id="bolt-glow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <path
            d="M68 0 L40 220 L62 220 L38 500 L82 180 L58 180 L85 0 Z"
            fill="white"
            fillOpacity="0.95"
            filter="url(#bolt-glow)"
          />
        </svg>

        {/* Mountain silhouettes */}
        <svg
          className="absolute bottom-0 left-0 right-0"
          viewBox="0 0 800 320"
          preserveAspectRatio="xMidYMax meet"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "auto" }}
        >
          {/* Back mountains — slightly lighter */}
          <polygon points="0,320 180,80 360,320" fill="#0d0b1e" />
          <polygon points="160,320 340,60 520,320" fill="#0f0d20" />
          <polygon points="400,320 580,90 760,320" fill="#0d0b1e" />
          <polygon points="600,320 740,110 900,320" fill="#0f0d20" />
          {/* Front mountains — darkest */}
          <polygon points="-40,320 120,160 300,320" fill="#090B1A" />
          <polygon points="260,320 460,120 660,320" fill="#090B1A" />
          <polygon points="560,320 720,140 900,320" fill="#090B1A" />
          <rect x="0" y="300" width="900" height="40" fill="#090B1A" />
        </svg>

        {/* Prompt card */}
        <div
          className="absolute bottom-10 left-8 right-8 rounded-2xl px-5 py-4"
          style={{
            background: "rgba(18, 21, 48, 0.75)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(106, 76, 255, 0.25)",
          }}
        >
          <p className="text-sm text-[#F2F6FF] leading-relaxed mb-3">
            A lighthouse keeper climbs the stairs as a storm breaks, cinematic, violet lightning
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7B84B5]">16:9 · Quick</span>
            <button
              className="text-xs font-semibold px-4 py-1.5 rounded-full text-white"
              style={{ background: "linear-gradient(100deg, #6A4CFF 0%, #2F6BFF 100%)" }}
            >
              Generate · 3 cr
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
