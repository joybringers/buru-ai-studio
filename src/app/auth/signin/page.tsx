"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { PRODUCT_NAME } from "@/config";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await signIn("nodemailer", { email, redirect: false });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-100">{PRODUCT_NAME}</h1>
          <p className="text-sm text-zinc-500 mt-2">Sign in with a magic link — no password needed.</p>
        </div>

        {sent ? (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 text-center space-y-2">
            <p className="text-zinc-100 font-medium">Check your email</p>
            <p className="text-sm text-zinc-500">We sent a sign-in link to <span className="text-zinc-300">{email}</span>.</p>
            <p className="text-xs text-zinc-600 pt-2">
              Running locally? The link is printed in the{" "}
              <span className="font-mono">npm run dev</span> terminal.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-zinc-400">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                loading || !email.trim()
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
              }`}
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
