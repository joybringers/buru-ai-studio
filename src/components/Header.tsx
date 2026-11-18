"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { creditsToGBP } from "@/config";
import { useUser } from "@/context/UserContext";
import TopUpModal from "@/components/TopUpModal";
import BuruLogo from "@/components/BuruLogo";

export default function Header() {
  const { balance, monthlySpent, monthlyCap } = useUser();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showTopUp, setShowTopUp] = useState(false);
  const capPct = Math.min((monthlySpent / monthlyCap) * 100, 100);
  const nearCap = capPct >= 80;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-black/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Left: logo + nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center text-sm" style={{ textDecoration: "none" }}>
              <BuruLogo />
            </Link>

            <nav className="hidden sm:flex items-center gap-1 text-sm">
              {[
                { href: "/studio", label: "Studio" },
                { href: "/#pricing", label: "Pricing" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    isActive(href)
                      ? "text-zinc-100 bg-zinc-800"
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: balance + auth */}
          <div className="flex items-center gap-3 text-sm">
            {session?.user && (
              <>
                {/* Monthly cap bar */}
                <div className="hidden lg:flex items-center gap-2">
                  <div className="w-16 h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${nearCap ? "bg-amber-500" : "bg-indigo-500"}`}
                      style={{ width: `${capPct}%` }}
                    />
                  </div>
                  <span className={`text-xs ${nearCap ? "text-amber-400" : "text-zinc-600"}`}>
                    {monthlySpent}/{monthlyCap}
                  </span>
                </div>

                {/* Credits */}
                <button
                  onClick={() => setShowTopUp(true)}
                  className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-all"
                >
                  <span className="font-semibold text-zinc-100 text-xs">{balance} cr</span>
                  <span className="text-zinc-600 text-xs">{creditsToGBP(balance)}</span>
                  <span className="text-xs text-indigo-400 border-l border-zinc-700 pl-1.5 ml-0.5">+ Top up</span>
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                  <span className="text-xs text-zinc-600 max-w-[100px] truncate hidden lg:block">
                    {session.user.email}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}

            {!session?.user && (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/signin"
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-1.5"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signin"
                  className="text-xs font-semibold bg-white hover:bg-zinc-100 text-zinc-900 px-4 py-1.5 rounded-lg transition-colors"
                >
                  Start for free →
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
    </>
  );
}
