"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSignInModal } from "@/context/SignInModalContext";
import BuruLogo from "@/components/BuruLogo";

export default function SignInModal() {
  const { isOpen, close } = useSignInModal();
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // Phone OTP
  const [phone, setPhone] = useState("");
  const [phoneEmail, setPhoneEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSent(false); setEmail(""); setPhone(""); setPhoneEmail("");
      setOtp(""); setOtpSent(false); setPhoneError(""); setTab("email");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: window.location.pathname });
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
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={close}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 space-y-5 shadow-2xl"
        style={{ background: "#0E1128", border: "1px solid rgba(106,76,255,0.3)" }}
      >
        {/* Close */}
        <button
          onClick={close}
          className="absolute top-4 right-4 text-[#4A5280] hover:text-[#F2F6FF] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>

        {sent ? (
          <div className="space-y-4 text-center pt-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#6A4CFF]/15 border border-[#6A4CFF]/30 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A88FFF" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#F2F6FF]">Check your inbox</p>
              <p className="text-xs text-[#A8B0D8] mt-1">We sent a sign-in link to</p>
              <p className="text-sm font-semibold text-[#A88FFF] mt-0.5 break-all">{sentTo}</p>
            </div>
            <button onClick={() => { setSent(false); setEmail(""); }}
              className="text-xs text-[#A8B0D8] hover:text-[#F2F6FF] underline underline-offset-2">
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <div className="pr-6">
              <BuruLogo className="text-base mb-3" />
              <p className="text-sm font-semibold text-[#F2F6FF]">Sign in to create</p>
              <p className="text-xs text-[#A8B0D8] mt-0.5">Free to join — no password needed</p>
            </div>

            {/* Age confirmation */}
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 accent-indigo-500" />
              <span className="text-xs text-[#A8B0D8] leading-relaxed">
                I am 18+ and accept the{" "}
                <a href="/terms" className="text-[#7B84B5] hover:text-[#A8B0D8] underline" onClick={(e) => e.stopPropagation()}>Terms</a>
                {" "}&amp;{" "}
                <a href="/privacy" className="text-[#7B84B5] hover:text-[#A8B0D8] underline" onClick={(e) => e.stopPropagation()}>Privacy</a>
              </span>
            </label>

            {/* Google */}
            <button onClick={handleGoogleSignIn} disabled={googleLoading || !ageConfirmed}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#F2F6FF] text-[#090B1A] font-semibold text-sm py-3 rounded-full transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
              {googleLoading ? (
                <svg className="animate-spin w-4 h-4 text-zinc-600" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.7 2.3 30.2 0 24 0 14.7 0 6.7 5.5 2.9 13.5l7.9 6.1C12.6 13.4 17.9 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
                  <path fill="#FBBC05" d="M10.8 28.6A14.3 14.3 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A23.8 23.8 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l8.3-6.1z"/>
                  <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2.1 1.4-4.7 2.3-7.7 2.3-6.1 0-11.4-3.9-13.3-9.4l-8.3 6.1C6.7 42.5 14.7 48 24 48z"/>
                </svg>
              )}
              Continue with Google
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-[#1E2140]" />
              <span className="text-xs text-[#4A5280]">or</span>
              <div className="flex-1 h-px bg-[#1E2140]" />
            </div>

            {/* Email / Phone tabs */}
            <div className="flex rounded-xl overflow-hidden border border-[#1E2140]" style={{ background: "#090B1A" }}>
              {(["email", "phone"] as const).map((t) => (
                <button key={t} type="button"
                  onClick={() => { setTab(t); setPhoneError(""); setOtpSent(false); setOtp(""); }}
                  className="flex-1 py-2 text-xs font-semibold transition-all"
                  style={tab === t
                    ? { background: "linear-gradient(100deg, #6A4CFF, #2F6BFF)", color: "#F2F6FF" }
                    : { color: "#4A5280" }}>
                  {t === "email" ? "Email" : "📱 Mobile (NG)"}
                </button>
              ))}
            </div>

            {tab === "email" ? (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl bg-[#121530] border border-[#1E2140] focus:border-[#6A4CFF] text-[#F2F6FF] placeholder-[#4A5280] px-4 py-3 text-sm focus:outline-none transition-colors" />
                <button type="submit" disabled={loading || !email.trim() || !ageConfirmed}
                  className="w-full py-3 rounded-full text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: loading || !email.trim() ? "#1E2140" : "linear-gradient(100deg, #6A4CFF 0%, #2F6BFF 100%)" }}>
                  {loading ? "Sending…" : "Send magic link →"}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="w-full rounded-xl bg-[#121530] border border-[#1E2140] focus:border-[#6A4CFF] text-[#F2F6FF] placeholder-[#4A5280] px-4 py-3 text-sm focus:outline-none transition-colors" />
                    <input type="email" required value={phoneEmail} onChange={(e) => setPhoneEmail(e.target.value)}
                      placeholder="Email for the code"
                      className="w-full rounded-xl bg-[#121530] border border-[#1E2140] focus:border-[#6A4CFF] text-[#F2F6FF] placeholder-[#4A5280] px-4 py-3 text-sm focus:outline-none transition-colors" />
                    {phoneError && <p className="text-xs text-red-400">{phoneError}</p>}
                    <button type="submit" disabled={phoneLoading || !phone.trim() || !phoneEmail.trim() || !ageConfirmed}
                      className="w-full py-3 rounded-full text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: phoneLoading ? "#1E2140" : "linear-gradient(100deg, #6A4CFF 0%, #2F6BFF 100%)" }}>
                      {phoneLoading ? "Sending…" : "Send code →"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <p className="text-xs text-[#A8B0D8]">Code sent to <span className="text-[#A88FFF]">{phoneEmail}</span></p>
                    <input type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoFocus
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="w-full rounded-xl bg-[#121530] border border-[#1E2140] focus:border-[#6A4CFF] text-[#F2F6FF] placeholder-[#4A5280] px-4 py-3 text-sm text-center tracking-[0.4em] font-mono focus:outline-none transition-colors" />
                    {phoneError && <p className="text-xs text-red-400">{phoneError}</p>}
                    <button type="submit" disabled={verifyLoading || otp.length < 6}
                      className="w-full py-3 rounded-full text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: verifyLoading ? "#1E2140" : "linear-gradient(100deg, #6A4CFF 0%, #2F6BFF 100%)" }}>
                      {verifyLoading ? "Verifying…" : "Verify & sign in →"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
