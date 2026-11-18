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
| Nigerian mobile + SMS code | ❌ |
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
| Typical film cost per template | ❌ |

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

## Pending / In Progress

| ID | Description | Priority |
|----|-------------|----------|
| FR-ACC-01 | Nigerian mobile + SMS sign-up | Medium |
| FR-QUO-01 | Typical film cost per template on pricing page | Low |
| FR-GEN-01 | Quality tiers in generation flow | High |
| FR-GEN-01 | Provider switching + fallback | Low |
| FR-INS-01 | /inspire page | Medium |
| FR-TOL-01 | Expand/Outpaint tool (/tools/expand) | Medium |
| FR-LSP-01 | Lip-sync tool | Medium |
| FR-FSW-01 | Face swap tool | Low |
