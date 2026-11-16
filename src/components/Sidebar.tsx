"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { PRODUCT_NAME, creditsToGBP } from "@/config";
import { useUser } from "@/context/UserContext";
import TopUpModal from "./TopUpModal";

function isActivePath(pathname: string, href: string): boolean {
  const hrefPath = href.split("?")[0];
  if (hrefPath === "/studio") return pathname === "/studio";
  if (hrefPath === "/create") return pathname === "/create";
  return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
}

function NavLink({
  href, label, icon, badge, onNavigate,
}: {
  href: string; label: string; icon: React.ReactNode; badge?: string; onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
        active
          ? "bg-indigo-500/12 text-indigo-300 border border-indigo-500/20"
          : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
      }`}
    >
      <span className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-indigo-400" : "text-zinc-600 group-hover:text-zinc-400"}`}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[9px] font-bold tracking-widest bg-indigo-600 text-white px-1.5 py-0.5 rounded-full leading-none">
          {badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.25em] px-3 pt-1 pb-1">
      {label}
    </p>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChatIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 8c0 3.314-2.686 6-6 6a5.97 5.97 0 0 1-3.5-1.13L1 14l1.13-3.5A5.97 5.97 0 0 1 2 8c0-3.314 2.686-6 6-6s6 2.686 6 6Z"/>
    </svg>
  );
}

function StudioIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 2 11 4.5l2.5.5-1.8 1.8.4 2.5L9.5 8 7 9.3l.4-2.5L5.6 5l2.5-.5L9.5 2ZM2 12l3-3M2 12h3v3"/>
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" strokeLinecap="round"/>
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" strokeLinecap="round"/>
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" strokeLinecap="round"/>
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" strokeLinecap="round"/>
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" strokeLinecap="round"/>
      <circle cx="5.5" cy="6" r="1.5"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="m1.5 11 3.5-3.5 2.5 2.5 2-2 4.5 4.5"/>
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.4">
      <rect x="1" y="3.5" width="10" height="9" rx="1.5"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 6.5 15 4v8l-4-2.5"/>
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.5 12 4.5v5.5M6 6.5v6M6 12.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm6-2.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/>
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.4">
      <rect x="1" y="1" width="6" height="6" rx="1"/>
      <rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/>
      <rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="6" r="3"/>
      <path strokeLinecap="round" d="M2 14c0-3.314 2.686-4 6-4s6 .686 6 4"/>
    </svg>
  );
}

function PricingIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v12M5 5h4.5a2 2 0 1 1 0 4H5m0 0h4.5a2.5 2.5 0 0 1 0 5H5"/>
    </svg>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { balance } = useUser();
  const { data: session } = useSession();
  const [showTopUp, setShowTopUp] = useState(false);

  return (
    <>
      <div className="h-full w-56 bg-[#0a0a0a] border-r border-zinc-800/50 flex flex-col overflow-hidden">

        {/* Logo */}
        <div className="px-4 py-4 border-b border-zinc-800/50 shrink-0">
          <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5">
            <span className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0">
              B
            </span>
            <span className="font-bold text-white text-sm tracking-tight">{PRODUCT_NAME}</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">

          <div className="space-y-0.5">
            <SectionLabel label="Create" />
            <NavLink href="/chat" label="Chat Mode" icon={<ChatIcon />} badge="AI" onNavigate={onNavigate} />
            <NavLink href="/studio" label="Studio" icon={<StudioIcon />} onNavigate={onNavigate} />
            <NavLink href="/create" label="Quick Starts" icon={<GridIcon />} onNavigate={onNavigate} />
          </div>

          <div className="space-y-0.5">
            <SectionLabel label="Tools" />
            <NavLink href="/create/image" label="Image" icon={<ImageIcon />} onNavigate={onNavigate} />
            <NavLink href="/create/text-to-video" label="Video" icon={<VideoIcon />} onNavigate={onNavigate} />
            <NavLink href="/studio?model=stable-audio" label="Audio" icon={<AudioIcon />} onNavigate={onNavigate} />
          </div>

          <div className="space-y-0.5">
            <SectionLabel label="Library" />
            <NavLink href="/gallery" label="Gallery" icon={<GalleryIcon />} onNavigate={onNavigate} />
          </div>

          {session?.user && (
            <div className="space-y-0.5">
              <SectionLabel label="Account" />
              <NavLink href="/admin" label="Admin" icon={<AdminIcon />} onNavigate={onNavigate} />
              <NavLink href="/#pricing" label="Pricing" icon={<PricingIcon />} onNavigate={onNavigate} />
            </div>
          )}

        </nav>

        {/* Bottom: balance + auth */}
        <div className="shrink-0 px-2 py-3 border-t border-zinc-800/50 space-y-1.5">
          {session?.user ? (
            <>
              <button
                onClick={() => setShowTopUp(true)}
                className="w-full flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-3 py-2.5 rounded-xl transition-all"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-zinc-100 leading-none">{balance} cr</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{creditsToGBP(balance)}</p>
                </div>
                <span className="text-xs font-semibold text-indigo-400">+ Top up</span>
              </button>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-zinc-700 truncate max-w-[130px]">{session.user.email}</span>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="text-xs text-zinc-600 hover:text-red-400 shrink-0 ml-2 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                onClick={onNavigate}
                className="block w-full text-center px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors"
              >
                Start for free
              </Link>
              <Link
                href="/auth/signin"
                onClick={onNavigate}
                className="block w-full text-center px-3 py-2 rounded-xl text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

      </div>

      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
    </>
  );
}
