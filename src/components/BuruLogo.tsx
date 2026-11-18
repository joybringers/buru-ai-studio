import React from "react";

export default function BuruLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      {/* Lightning bolt */}
      <svg
        width="16"
        height="22"
        viewBox="0 0 12 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bolt-g" x1="3" y1="0" x2="10" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A88FFF" />
            <stop offset="100%" stopColor="#2F6BFF" />
          </linearGradient>
        </defs>
        <path
          d="M8.5 0.5L2 11H6.5L4 19.5L11.5 8.5H7L9.5 0.5H8.5Z"
          fill="url(#bolt-g)"
        />
      </svg>

      {/* Wordmark */}
      <span
        style={{
          fontFamily: "var(--font-poppins), Poppins, sans-serif",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        <span style={{ color: "#F2F6FF" }}>Buru</span>
        <span
          style={{
            background: "linear-gradient(100deg, #6A4CFF, #2F6BFF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Studio
        </span>
      </span>
    </span>
  );
}
