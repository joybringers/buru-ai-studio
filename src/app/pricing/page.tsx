"use client";
import { useState } from "react";
import { useSignInModal } from "@/context/SignInModalContext";

const GBP_TO_USD = 1.25;
const GBP_TO_NGN = 2000;

type Currency = "GBP" | "USD" | "NGN";

function fmt(gbp: number | null, currency: Currency): string {
  if (gbp === null) return "Free";
  if (currency === "GBP") return `£${gbp % 1 === 0 ? gbp : gbp.toFixed(2)}`;
  if (currency === "USD") {
    const v = gbp * GBP_TO_USD;
    return `$${v % 1 === 0 ? v : v.toFixed(2)}`;
  }
  const v = Math.round(gbp * GBP_TO_NGN);
  return `₦${v.toLocaleString()}`;
}

const PLANS = [
  {
    id: "free",
    name: "Free Trial",
    tagline: "Get started instantly",
    priceGBP: null as number | null,
    credits: 50,
    creditsNote: "one-time",
    highlight: false,
    cta: "Start for free",
    ctaHref: "/auth/signin",
    features: {
      images: true,
      videoStandard: false,
      videoPro: false,
      voiceTools: false,
      voiceClone: false,
      filmWorkflow: false,
      watermarkFree: false,
      rights: "Personal use only",
      expiry: "Credits valid 7 days",
    },
  },
  {
    id: "maker",
    name: "Maker",
    tagline: "For solo creators",
    priceGBP: 5 as number | null,
    credits: 200,
    creditsNote: "credits",
    highlight: false,
    cta: "Buy Maker pack",
    ctaHref: "/auth/signin",
    features: {
      images: true,
      videoStandard: true,
      videoPro: false,
      voiceTools: true,
      voiceClone: false,
      filmWorkflow: false,
      watermarkFree: true,
      rights: "Commercial (1 project)",
      expiry: "Credits never expire",
    },
  },
  {
    id: "film",
    name: "Film Pack",
    tagline: "For filmmakers",
    priceGBP: 11 as number | null,
    credits: 500,
    creditsNote: "credits",
    highlight: true,
    cta: "Get Film Pack",
    ctaHref: "/auth/signin",
    features: {
      images: true,
      videoStandard: true,
      videoPro: true,
      voiceTools: true,
      voiceClone: true,
      filmWorkflow: true,
      watermarkFree: true,
      rights: "Commercial (unlimited)",
      expiry: "Credits never expire",
    },
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "For production houses",
    priceGBP: 30 as number | null,
    credits: 1500,
    creditsNote: "credits",
    highlight: false,
    cta: "Get Studio pack",
    ctaHref: "/auth/signin",
    features: {
      images: true,
      videoStandard: true,
      videoPro: true,
      voiceTools: true,
      voiceClone: true,
      filmWorkflow: true,
      watermarkFree: true,
      rights: "Full commercial + licensing",
      expiry: "Credits never expire",
    },
  },
] as const;

const FEATURE_ROWS: { label: string; key: keyof (typeof PLANS)[0]["features"] }[] = [
  { label: "Image generation",        key: "images" },
  { label: "Video — standard (5s)",   key: "videoStandard" },
  { label: "Video — pro (10s)",        key: "videoPro" },
  { label: "Voice & audio tools",      key: "voiceTools" },
  { label: "Voice clone",              key: "voiceClone" },
  { label: "Film workflow (script, storyboard, bible)", key: "filmWorkflow" },
  { label: "Watermark-free export",   key: "watermarkFree" },
  { label: "Commercial rights",        key: "rights" },
  { label: "Credits",                  key: "expiry" },
];

function Check() {
  return (
    <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l3.5 3.5L13 5" stroke="#2BE4FF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Cross() {
  return <span className="text-[#2A2F4A] text-sm font-bold mx-auto block text-center">—</span>;
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") return value ? <Check /> : <Cross />;
  return <span className="text-[10px] text-[#A8B0D8] leading-tight block text-center px-1">{value}</span>;
}

export default function PricingPage() {
  const [currency, setCurrency] = useState<Currency>("GBP");
  const { open: openSignIn } = useSignInModal();

  return (
    <div className="min-h-screen bg-[#090B1A] pb-24">

      {/* Top glow */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-72"
        style={{ background: "radial-gradient(80% 60% at 50% 0%, rgba(106,76,255,.35) 0%, transparent 100%)" }} />

      <div className="relative max-w-5xl mx-auto px-4 pt-16">

        {/* Header */}
        <div className="text-center space-y-4 mb-10">
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#4A5280]">Pricing</p>
          <h1
            className="font-bold text-[#F2F6FF] tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-poppins)", fontSize: "clamp(2rem, 5vw, 3.2rem)" }}
          >
            Pay once.{" "}
            <span style={{
              background: "linear-gradient(100deg, #6A4CFF, #2F6BFF 55%, #A88FFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Create forever.
            </span>
          </h1>
          <p className="text-[#A8B0D8] max-w-md mx-auto text-sm leading-relaxed">
            Credits never expire. No subscriptions, no hidden fees. Buy more whenever you need.
          </p>
        </div>

        {/* Currency toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-lg p-1 gap-0.5"
            style={{ background: "#121530", border: "1px solid #1E2140" }}>
            {(["GBP", "USD", "NGN"] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={currency === c ? {
                  background: "linear-gradient(100deg, #6A4CFF, #2F6BFF)",
                  color: "#F2F6FF",
                } : {
                  color: "#4A5280",
                }}
              >
                {c === "GBP" ? "£ GBP" : c === "USD" ? "$ USD" : "₦ NGN"}
              </button>
            ))}
          </div>
        </div>

        {currency === "NGN" && (
          <p className="text-center text-xs text-[#4A5280] mb-6">
            NGN prices are approximate · rate £1 ≈ ₦2,000 · final charge at card rate
          </p>
        )}

        {/* Plan cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-2xl p-6 flex flex-col"
              style={plan.highlight ? {
                background: "linear-gradient(160deg, #0E1128 0%, #121530 100%)",
                border: "1px solid rgba(106,76,255,.55)",
                boxShadow: "0 0 0 1px rgba(106,76,255,.1), 0 24px 60px rgba(106,76,255,.14)",
              } : {
                background: "#0E1128",
                border: "1px solid #1E2140",
              }}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase text-[#F2F6FF]"
                  style={{ background: "linear-gradient(100deg, #6A4CFF, #2F6BFF)" }}>
                  Most popular
                </div>
              )}

              <div className="mb-4">
                <p className="font-semibold text-[#F2F6FF] text-sm mb-0.5"
                  style={{ fontFamily: "var(--font-poppins)" }}>{plan.name}</p>
                <p className="text-[#4A5280] text-xs">{plan.tagline}</p>
              </div>

              <div className="mb-5">
                <p className="font-bold text-[#F2F6FF] leading-none mb-1"
                  style={{ fontFamily: "var(--font-poppins)", fontSize: "2rem" }}>
                  {fmt(plan.priceGBP, currency)}
                </p>
                <p className="text-[#4A5280] text-xs">
                  {plan.priceGBP === null ? "no card needed" : `${plan.credits} ${plan.creditsNote}`}
                </p>
              </div>

              {/* Credits pill */}
              <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg"
                style={{ background: "rgba(106,76,255,.08)", border: "1px solid rgba(106,76,255,.15)" }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#6A4CFF]"
                  style={{ boxShadow: "0 0 6px #6A4CFF" }} />
                <span className="text-xs font-semibold text-[#A88FFF]">
                  {plan.credits} credits
                </span>
                {plan.priceGBP !== null && (
                  <span className="text-xs text-[#4A5280] ml-auto">
                    {currency === "GBP"
                      ? `£${(plan.priceGBP / plan.credits * 100).toFixed(1)}p ea`
                      : currency === "USD"
                        ? `$${((plan.priceGBP * GBP_TO_USD) / plan.credits).toFixed(3)} ea`
                        : `₦${Math.round(plan.priceGBP * GBP_TO_NGN / plan.credits)} ea`}
                  </span>
                )}
              </div>

              {/* Quick feature list */}
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  plan.features.images             && "Image generation",
                  plan.features.videoStandard       && "5s video generation",
                  plan.features.videoPro            && "10s pro video",
                  plan.features.voiceTools          && "Voice & audio tools",
                  plan.features.voiceClone          && "Voice clone",
                  plan.features.filmWorkflow        && "Film workflow suite",
                  plan.features.watermarkFree       && "No watermarks",
                  !plan.features.watermarkFree      && "Personal use / watermark",
                ].filter(Boolean).map((item) => (
                  <li key={item as string} className="flex items-start gap-2 text-xs text-[#A8B0D8]">
                    <span className="mt-0.5 shrink-0 text-[#2BE4FF] font-bold">✓</span>
                    {item}
                  </li>
                ))}
                <li className="flex items-start gap-2 text-xs"
                  style={{ color: plan.id === "free" ? "#6A5AFF" : "#2BE4FF" }}>
                  <span className="mt-0.5 shrink-0 font-bold">✓</span>
                  {plan.features.rights}
                </li>
              </ul>

              <button
                onClick={openSignIn}
                className="block w-full text-center rounded-xl py-2.5 text-sm font-semibold transition-all cursor-pointer"
                style={plan.highlight ? {
                  background: "linear-gradient(100deg, #6A4CFF, #2F6BFF)",
                  color: "#F2F6FF",
                } : {
                  background: "#1E2140",
                  color: "#A8B0D8",
                  border: "1px solid #2A2F4A",
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Feature comparison table */}
        <div className="rounded-2xl overflow-hidden mb-14"
          style={{ border: "1px solid #1E2140" }}>
          <div className="px-6 py-4 border-b border-[#1E2140]"
            style={{ background: "#0E1128" }}>
            <h2 className="text-sm font-semibold text-[#F2F6FF]"
              style={{ fontFamily: "var(--font-poppins)" }}>
              Full feature comparison
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ background: "#090B1A" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1E2140" }}>
                  <th className="text-left px-5 py-3 text-[#4A5280] font-medium w-48">Feature</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="px-3 py-3 text-center font-semibold w-28"
                      style={{ color: p.highlight ? "#A88FFF" : "#7B84B5" }}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((row, i) => (
                  <tr key={row.key}
                    style={{
                      borderBottom: "1px solid #1E2140",
                      background: i % 2 === 0 ? "transparent" : "rgba(30,33,64,.25)",
                    }}>
                    <td className="px-5 py-3 text-[#7B84B5]">{row.label}</td>
                    {PLANS.map((p) => (
                      <td key={p.id} className="px-3 py-3">
                        <FeatureValue value={p.features[row.key] as boolean | string} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Film cost guide */}
        <div className="mb-14">
          <h2 className="text-center text-sm font-semibold text-[#F2F6FF] mb-2"
            style={{ fontFamily: "var(--font-poppins)" }}>
            What does a typical project cost?
          </h2>
          <p className="text-center text-xs text-[#4A5280] mb-8">
            Rough estimates based on standard quality settings
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Social Ad",
                desc: "30s product ad",
                breakdown: "4 product images · 2 short videos",
                credits: 150,
                pack: "Maker",
                packColor: "#7B84B5",
              },
              {
                label: "Short Film",
                desc: "2-min narrative",
                breakdown: "6 stills · 8 video clips",
                credits: 870,
                pack: "Film Pack",
                packColor: "#6A4CFF",
              },
              {
                label: "Music Video",
                desc: "3-min single",
                breakdown: "15 video clips · 5 images",
                credits: 1540,
                pack: "Studio",
                packColor: "#2F6BFF",
              },
              {
                label: "UGC Creator Pack",
                desc: "20 short-form ads",
                breakdown: "40 images · 10 short videos",
                credits: 920,
                pack: "Film Pack +",
                packColor: "#6A4CFF",
              },
            ].map((item) => (
              <div key={item.label}
                className="rounded-2xl p-5 flex flex-col gap-3"
                style={{ background: "#0E1128", border: "1px solid #1E2140" }}>
                <div>
                  <p className="text-sm font-semibold text-[#F2F6FF] mb-0.5"
                    style={{ fontFamily: "var(--font-poppins)" }}>{item.label}</p>
                  <p className="text-xs text-[#4A5280]">{item.desc}</p>
                </div>
                <p className="text-[10px] text-[#7B84B5] leading-relaxed">{item.breakdown}</p>
                <div className="mt-auto">
                  <p className="text-2xl font-bold text-[#F2F6FF] leading-none mb-1"
                    style={{ fontFamily: "var(--font-poppins)" }}>
                    ~{item.credits.toLocaleString()}
                    <span className="text-xs font-normal text-[#4A5280] ml-1">credits</span>
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: item.packColor }}>
                    → {item.pack} covers this
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-[#4A5280] mt-4">
            Draft images ≈ 3 cr · Standard images ≈ 8 cr · Cinema images ≈ 25 cr · 5s video ≈ 60–100 cr · 10s pro video ≈ 150 cr
          </p>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className="text-center text-sm font-semibold text-[#F2F6FF] mb-6"
            style={{ fontFamily: "var(--font-poppins)" }}>
            Common questions
          </h2>
          {[
            {
              q: "Do credits expire?",
              a: "Free trial credits expire after 7 days. All purchased credits never expire — use them at your own pace.",
            },
            {
              q: "Can I use my creations commercially?",
              a: "Maker pack covers commercial rights for a single project. Film Pack and Studio give unlimited commercial rights. Free trial is personal use only.",
            },
            {
              q: "How do I pay in Naira?",
              a: "Select Paystack at checkout to pay in NGN with your Nigerian debit or credit card. The displayed NGN price is approximate — your bank applies the live rate.",
            },
            {
              q: "What counts as one credit?",
              a: "Credits are consumed per generation. A quick image costs 3 cr, a pro image up to 25 cr, a 5-second video 60–150 cr depending on model quality.",
            },
            {
              q: "Can I buy more credits later?",
              a: "Yes — credits stack. Buy any pack at any time and they add to your existing balance.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl px-5 py-4"
              style={{ background: "#0E1128", border: "1px solid #1E2140" }}>
              <p className="text-[#F2F6FF] text-sm font-medium mb-1.5">{q}</p>
              <p className="text-[#7B84B5] text-xs leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center rounded-2xl py-14 px-8 relative overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(106,76,255,.2) 0%, #121530 65%)",
            border: "1px solid #1E2140",
          }}>
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(106,76,255,.55), transparent)" }} />
          <h2 className="font-bold text-[#F2F6FF] mb-3 tracking-tight"
            style={{ fontFamily: "var(--font-poppins)", fontSize: "1.75rem" }}>
            Start with 50 free credits
          </h2>
          <p className="text-[#A8B0D8] text-sm max-w-sm mx-auto mb-7">
            No card required. Sign in with your email and get creating in seconds.
          </p>
          <button
            onClick={openSignIn}
            className="inline-block rounded-xl px-10 py-3.5 font-semibold text-sm text-[#F2F6FF] transition-all hover:opacity-90 cursor-pointer"
            style={{
              background: "linear-gradient(100deg, #6A4CFF 0%, #2F6BFF 100%)",
              boxShadow: "0 8px 32px rgba(106,76,255,.35)",
            }}
          >
            Create free account →
          </button>
          <p className="text-xs text-[#4A5280] mt-4">
            Secure payments via Stripe &amp; Paystack
          </p>
        </div>

      </div>
    </div>
  );
}
