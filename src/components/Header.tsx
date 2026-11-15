"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { PRODUCT_NAME, creditsToGBP } from "@/config";
import { useUser } from "@/context/UserContext";
import TopUpModal from "@/components/TopUpModal";

export default function Header() {
  const { balance, monthlySpent, monthlyCap } = useUser();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showTopUp, setShowTopUp] = useState(false);
  const capPct = Math.min((monthlySpent / monthlyCap) * 100, 100);
  const nearCap = capPct >= 80;

  return (
    <>
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/studio"
            className="font-semibold text-zinc-100 tracking-tight"
          >
            {PRODUCT_NAME}
          </Link>
          <nav className="flex gap-4 text-sm">
            {[
              { href: "/studio", label: "Studio" },
              { href: "/gallery", label: "Gallery" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`transition-colors ${
                  pathname === href
                    ? "text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 text-xs">Monthly</span>
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    nearCap ? "bg-amber-500" : "bg-indigo-500"
                  }`}
                  style={{ width: `${capPct}%` }}
                />
              </div>
              <span
                className={`text-xs ${
                  nearCap ? "text-amber-400" : "text-zinc-500"
                }`}
              >
                {monthlySpent}&thinsp;/&thinsp;{monthlyCap}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowTopUp(true)}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <span className="font-medium text-zinc-100">{balance} cr</span>
            <span className="text-zinc-600 text-xs ml-0.5">
              {creditsToGBP(balance)}
            </span>
            {session?.user && (
              <span className="text-xs text-indigo-400 ml-1">+ Top up</span>
            )}
          </button>

          {session?.user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
              <span className="text-xs text-zinc-500 max-w-[120px] truncate">
                {session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors pl-4 border-l border-zinc-800"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>

    {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
  </>
  );
}
