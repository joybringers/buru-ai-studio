# BuruStudio — Requirements Tracker

Last updated: 2026-11-18

## Legend
- ✅ Done
- ~ Partial
- ❌ Not started

---

## Accounts

### FR-ACC-01 — Sign-up options
| Item | Status |
|------|--------|
| Email magic link | ✅ |
| Google OAuth | ✅ |
| Nigerian mobile + SMS code | ✅ Done 2026-11-18 (add Twilio env vars to Vercel to activate) |
| 18+ confirmation checkbox at sign-up (FR-RSP-10) | ✅ Done 2026-11-18 |

### FR-ACC-02 — Trial credits on first sign-up
| Item | Status |
|------|--------|
| 50 free credits awarded on first sign-up | ✅ Done (createUser event in auth.ts) |

---

## Pricing & Quoting

### FR-ACC-03 / FR-QUO-01 — Pricing page
| Item | Status |
|------|--------|
| /pricing route | ✅ |
| GBP / USD / NGN currency toggle | ✅ |
| Free Trial / Maker / Film Pack / Studio plan tiers | ✅ |
| Rights clearly stated per plan | ✅ |
| Feature comparison table | ✅ |
| FAQ | ✅ |
| Typical film cost per template | ✅ Done 2026-11-18 |

---

## Generation

### FR-GEN-01 — Provider layer
| Item | Status |
|------|--------|
| fal.ai abstraction | ✅ |
| Quality tiers (Draft / Standard / Cinema) for image models | ✅ Done 2026-11-18 |
| Quality tiers for video (720p Standard / 1080p Cinema) via Kling standard/pro | ✅ Done 2026-11-18 |
| Provider switching from admin console | ❌ |
| Error/retry routing to equivalent provider | ❌ |
| Fallback provider (beyond fal.ai) | ❌ |

---

## Responsible Use

### FR-RSP-05 — Voice clone consent
| Item | Status |
|------|--------|
| Consent checkbox before voice clone processing | ✅ |

### FR-RSP-10 — Age verification
| Item | Status |
|------|--------|
| 18+ confirmation checkbox at sign-up | ✅ Done 2026-11-18 |

---

## Studio

### FR-STU-01 — Duration + quality controls
| Item | Status |
|------|--------|
| Duration selector in Studio | ✅ |
| Quality selector in Studio | ✅ |

---

## Homepage / Discovery

### FR-HOM-01 — Feature showcase
| Item | Status |
|------|--------|
| Feature tabs (Film/Video/Image/Audio/Tools) | ✅ |
| Social proof strip | ✅ |
| Model cards with direct "Create →" CTA | ✅ |
| FAQ accordion | ✅ |

---

## Credit Ledger

### FR-CRD-01 — Project tracking
| Item | Status |
|------|--------|
| projectId on credit ledger entries | ✅ |
| Pass projectId through generate API | ✅ |

---

## Tools

### FR-TOL-01 — Image & Video Tools
| Tool | Route | Status |
|------|-------|--------|
| Image Upscale (4×) | /tools/upscale | ✅ |
| Remove Background | /tools/background | ✅ |
| Edit Image (inpaint) | /tools/inpaint | ✅ |
| Lip Sync | /tools/lipsync | ✅ |
| Face Swap | /tools/faceswap | ✅ |
| Voice Over (TTS) | /tools/voiceover | ✅ |
| Expand/Outpaint | /tools/expand | ✅ Done 2026-11-18 |

## Inspiration

### FR-INS-01 — /inspire page
| Item | Status |
|------|--------|
| Category tabs (8 categories) | ✅ |
| 30-prompt gallery with gradient thumbnails | ✅ |
| "Use this prompt →" CTA linking to Studio | ✅ |

---

## Pending / In Progress

| ID | Description | Priority |
|----|-------------|----------|
| FR-ACC-01 | Add TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER to Vercel + run Supabase SQL migration | Medium |
| FR-GEN-01 | Provider switching + fallback | Low |
