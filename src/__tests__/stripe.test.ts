import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoist shared mocks ────────────────────────────────────────────────────────
const { mockSessionsCreate, mockConstructEvent } = vi.hoisted(() => ({
  mockSessionsCreate: vi.fn(),
  mockConstructEvent: vi.fn(),
}));

// ── Mock Stripe ───────────────────────────────────────────────────────────────
vi.mock("stripe", () => {
  const MockStripe = vi.fn().mockImplementation(() => ({
    checkout: { sessions: { create: mockSessionsCreate } },
    webhooks: { constructEvent: mockConstructEvent },
  }));
  return { default: MockStripe };
});

// ── Mock auth ─────────────────────────────────────────────────────────────────
vi.mock("@/auth", () => ({ auth: vi.fn() }));

// ── Mock ledger ───────────────────────────────────────────────────────────────
vi.mock("@/lib/ledger", () => ({ creditUser: vi.fn() }));

import { auth } from "@/auth";
import { creditUser } from "@/lib/ledger";
import { POST as checkoutPOST } from "@/app/api/checkout/route";
import { POST as webhookPOST } from "@/app/api/webhooks/stripe/route";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockCreditUser = creditUser as ReturnType<typeof vi.fn>;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/checkout
// ─────────────────────────────────────────────────────────────────────────────

function makeCheckoutRequest(body: unknown) {
  return new Request("http://localhost/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/pay/cs_test_abc" });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await checkoutPOST(makeCheckoutRequest({ packId: "pack-50" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when packId is missing", async () => {
    const res = await checkoutPOST(makeCheckoutRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/packId/i);
  });

  it("returns 400 for an unknown packId", async () => {
    const res = await checkoutPOST(makeCheckoutRequest({ packId: "pack-9999" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/unknown pack/i);
  });

  it("returns the Stripe checkout URL on success", async () => {
    const res = await checkoutPOST(makeCheckoutRequest({ packId: "pack-50" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/pay/cs_test_abc");
  });

  it("passes price from server config — not from the request", async () => {
    await checkoutPOST(makeCheckoutRequest({ packId: "pack-50" }));
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 150, // 50-credit pack costs £1.50 = 150 pence per config.ts
            }),
          }),
        ]),
      })
    );
  });

  it("embeds userId and credits in Stripe session metadata", async () => {
    await checkoutPOST(makeCheckoutRequest({ packId: "pack-200" }));
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { userId: "user-1", credits: "200" },
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/stripe
// ─────────────────────────────────────────────────────────────────────────────

function makeWebhookRequest(body: string, signature?: string) {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(signature ? { "stripe-signature": signature } : {}),
    },
    body,
  });
}

function makeSessionEvent(metadata: Record<string, string>): Stripe.Event {
  return {
    type: "checkout.session.completed",
    data: { object: { metadata } as Stripe.Checkout.Session },
  } as unknown as Stripe.Event;
}

import type Stripe from "stripe";

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreditUser.mockResolvedValue(undefined);
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const res = await webhookPOST(makeWebhookRequest("{}"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });
    const res = await webhookPOST(makeWebhookRequest("{}", "bad-sig"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/no signatures found/i);
  });

  it("credits user on checkout.session.completed", async () => {
    mockConstructEvent.mockReturnValue(
      makeSessionEvent({ userId: "user-1", credits: "200" })
    );
    const res = await webhookPOST(makeWebhookRequest("{}", "valid-sig"));
    expect(res.status).toBe(200);
    expect(mockCreditUser).toHaveBeenCalledWith("user-1", 200, "stripe_topup");
  });

  it("returns 400 when metadata is missing userId", async () => {
    mockConstructEvent.mockReturnValue(
      makeSessionEvent({ credits: "200" })
    );
    const res = await webhookPOST(makeWebhookRequest("{}", "valid-sig"));
    expect(res.status).toBe(400);
    expect(mockCreditUser).not.toHaveBeenCalled();
  });

  it("returns 400 when metadata is missing credits", async () => {
    mockConstructEvent.mockReturnValue(
      makeSessionEvent({ userId: "user-1" })
    );
    const res = await webhookPOST(makeWebhookRequest("{}", "valid-sig"));
    expect(res.status).toBe(400);
    expect(mockCreditUser).not.toHaveBeenCalled();
  });

  it("acknowledges and ignores unrecognised event types", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.created",
      data: { object: {} },
    } as unknown as Stripe.Event);
    const res = await webhookPOST(makeWebhookRequest("{}", "valid-sig"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(mockCreditUser).not.toHaveBeenCalled();
  });
});
