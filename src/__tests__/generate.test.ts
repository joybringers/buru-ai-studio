import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoist shared values so vi.mock factories can reference them ───────────────
const { MockInsufficientBalanceError, mockPrismaJob } = vi.hoisted(() => {
  class MockInsufficientBalanceError extends Error {
    constructor(available: number, required: number) {
      super(`Insufficient balance: need ${required} cr, have ${available} cr`);
      this.name = "InsufficientBalanceError";
    }
  }
  const mockPrismaJob = { create: vi.fn(), update: vi.fn() };
  return { MockInsufficientBalanceError, mockPrismaJob };
});

// ── Mock auth ─────────────────────────────────────────────────────────────────
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// ── Mock Prisma ───────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: { job: mockPrismaJob },
}));

// ── Mock ledger ───────────────────────────────────────────────────────────────
vi.mock("@/lib/ledger", () => ({
  debitUser: vi.fn(),
  creditUser: vi.fn(),
  InsufficientBalanceError: MockInsufficientBalanceError,
}));

// ── Mock providers ────────────────────────────────────────────────────────────
vi.mock("@/lib/providers/index", () => ({
  submitJob: vi.fn(),
}));

import { auth } from "@/auth";
import { debitUser, creditUser } from "@/lib/ledger";
import { submitJob } from "@/lib/providers/index";
import { POST } from "@/app/api/generate/route";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockDebitUser = debitUser as ReturnType<typeof vi.fn>;
const mockCreditUser = creditUser as ReturnType<typeof vi.fn>;
const mockSubmitJob = submitJob as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrismaJob.create.mockResolvedValue({ id: "job-1" });
    mockPrismaJob.update.mockResolvedValue({});
    mockDebitUser.mockResolvedValue(undefined);
    mockCreditUser.mockResolvedValue(undefined);
    mockSubmitJob.mockResolvedValue("provider-req-1");
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest({ prompt: "a cat", modelId: "flux-schnell" }));
    expect(res.status).toBe(401);
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it("returns 400 when prompt is missing", async () => {
    const res = await POST(makeRequest({ modelId: "flux-schnell" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/prompt/i);
  });

  it("returns 400 when prompt is an empty string", async () => {
    const res = await POST(makeRequest({ prompt: "   ", modelId: "flux-schnell" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when modelId is missing", async () => {
    const res = await POST(makeRequest({ prompt: "a cat" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/modelId/i);
  });

  it("returns 400 for an unrecognised model ID", async () => {
    const res = await POST(makeRequest({ prompt: "a cat", modelId: "made-up-model" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/unknown model/i);
  });

  // ── Credit charging ───────────────────────────────────────────────────────

  it("debits the credit cost from config — not from the request", async () => {
    await POST(makeRequest({ prompt: "a cat", modelId: "flux-schnell" }));
    // flux-schnell costs 3 credits per src/config.ts
    expect(mockDebitUser).toHaveBeenCalledWith("user-1", 3, "image_gen", "job-1");
  });

  it("returns 402 when user has insufficient balance", async () => {
    mockDebitUser.mockRejectedValue(new MockInsufficientBalanceError(0, 3));
    const res = await POST(makeRequest({ prompt: "a cat", modelId: "flux-schnell" }));
    expect(res.status).toBe(402);
  });

  it("marks job failed when balance is insufficient", async () => {
    mockDebitUser.mockRejectedValue(new MockInsufficientBalanceError(0, 3));
    await POST(makeRequest({ prompt: "a cat", modelId: "flux-schnell" }));
    expect(mockPrismaJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "failed" }) })
    );
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it("returns 200 with jobId on success", async () => {
    const res = await POST(makeRequest({ prompt: "a cat", modelId: "flux-schnell" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.jobId).toBe("job-1");
  });

  it("updates the job to running with the provider job ID", async () => {
    await POST(makeRequest({ prompt: "a cat", modelId: "flux-schnell" }));
    expect(mockPrismaJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "running", providerJobId: "provider-req-1" }),
      })
    );
  });

  // ── Provider failure ──────────────────────────────────────────────────────

  it("returns 500 when submitJob throws", async () => {
    mockSubmitJob.mockRejectedValue(new Error("provider down"));
    const res = await POST(makeRequest({ prompt: "a cat", modelId: "flux-schnell" }));
    expect(res.status).toBe(500);
  });

  it("refunds credits when submitJob throws", async () => {
    mockSubmitJob.mockRejectedValue(new Error("provider down"));
    await POST(makeRequest({ prompt: "a cat", modelId: "flux-schnell" }));
    expect(mockCreditUser).toHaveBeenCalledWith("user-1", 3, "admin", "job-1");
  });

  it("marks job failed when submitJob throws", async () => {
    mockSubmitJob.mockRejectedValue(new Error("provider down"));
    await POST(makeRequest({ prompt: "a cat", modelId: "flux-schnell" }));
    expect(mockPrismaJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "failed" }) })
    );
  });
});
