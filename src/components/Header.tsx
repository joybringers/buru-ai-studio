"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { creditsToGBP } from "@/config";
import { useUser } from "@/context/UserContext";
import TopUpModal from "@/components/TopUpModal";
import BuruLogo from "@/components/BuruLogo";
import { useSignInModal } from "@/context/SignInModalContext";

export default function Header() {
  const { balance, monthlySpent, monthlyCap } = useUser();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showTopUp, setShowTopUp] = useState(false);
  const { open: openSignIn } = useSignInModal();
  const capPct = Math.min((monthlySpent / monthlyCap) * 100, 100);
  const nearCap = capPct >= 80;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#1E2140] bg-[#090B1A]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Left: logo + nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center text-sm" style={{ textDecoration: "none" }}>
              <BuruLogo />
            </Link>

            <nav className="hidden sm:flex items-center gap-1 text-sm">
              {[
                { href: "/studio", label: "Studio" },
                { href: "/pricing", label: "Pricing" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    isActive(href)
                      ? "text-[#F2F6FF] bg-[#1E2140]"
                      : "text-[#A8B0D8] hover:text-[#F2F6FF] hover:bg-[#1E2140]/60"
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
                  <div className="w-16 h-1 rounded-full bg-[#1E2140] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${nearCap ? "bg-amber-500" : "bg-[#6A4CFF]"}`}
                      style={{ width: `${capPct}%` }}
                    />
                  </div>
                  <span className={`text-xs ${nearCap ? "text-amber-400" : "text-[#4A5280]"}`}>
                    {monthlySpent}/{monthlyCap}
                  </span>
                </div>

                {/* Credits */}
                <button
                  onClick={() => setShowTopUp(true)}
                  className="flex items-center gap-1.5 bg-[#121530] hover:bg-[#1E2140] border border-[#1E2140] hover:border-[#6A4CFF]/30 px-3 py-1.5 rounded-lg transition-all"
                >
                  <span className="font-semibold text-[#F2F6FF] text-xs">{balance} cr</span>
                  <span className="text-[#4A5280] text-xs">{creditsToGBP(balance)}</span>
                  <span className="text-xs text-[#6A4CFF] border-l border-[#1E2140] pl-1.5 ml-0.5">+ Top up</span>
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-[#1E2140]">
                  <span className="text-xs text-[#4A5280] max-w-[100px] truncate hidden lg:block">
                    {session.user.email}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    className="text-xs text-[#4A5280] hover:text-[#F2F6FF] transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}

            {!session?.user && (
              <div className="flex items-center gap-2">
                <button
                  onClick={openSignIn}
                  className="text-xs text-[#A8B0D8] hover:text-[#F2F6FF] transition-colors px-3 py-1.5"
                >
                  Sign in
                </button>
                <button
                  onClick={openSignIn}
                  className="text-xs font-semibold bg-white hover:bg-[#F2F6FF] text-[#090B1A] px-4 py-1.5 rounded-lg transition-colors"
                >
                  Start for free →
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
    </>
  );
}
