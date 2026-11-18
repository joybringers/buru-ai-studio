"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

const MARKETING_PATHS = ["/"];
const AUTH_PATHS = ["/auth/signin", "/auth/verify-request", "/auth/error"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMarketing = MARKETING_PATHS.includes(pathname);

  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  if (isMarketing) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-8 overflow-x-hidden">{children}</main>
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative inset-y-0 left-0 z-30 w-56 transition-transform duration-200 ease-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <div className="md:hidden h-12 border-b border-[#1E2140]/60 bg-[#0E1128] flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="text-[#4A5280] hover:text-[#F2F6FF] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path d="M2 4h14v1.5H2V4Zm0 4.25h14v1.5H2v-1.5Zm0 4.25h14V14H2v-1.5Z"/>
            </svg>
          </button>
          <span className="text-sm font-bold text-white">BuruStudio</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}
