import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoist shared mocks so vi.mock factories can reference them ────────────────
const { mockPrismaJob, mockPrismaAsset, mockPrismaUser, mockTransaction } = vi.hoisted(() => ({
  mockPrismaJob: { findFirst: vi.fn(), update: vi.fn() },
  mockPrismaAsset: { create: vi.fn() },
  mockPrismaUser: { findUnique: vi.fn() },
  mockTransaction: vi.fn(),
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    job: mockPrismaJob,
    asset: mockPrismaAsset,
    user: mockPrismaUser,
    $transaction: mockTransaction,
  },
}));

vi.mock("@/lib/email", () => ({ sendGenerationComplete: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/providers/index", () => ({ pollJob: vi.fn() }));

import { auth } from "@/auth";
import { pollJob } from "@/lib/providers/index";
import { GET } from "@/app/api/jobs/[id]/route";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockPollJob = pollJob as ReturnType<typeof vi.fn>;

const BASE_JOB = {
  id: "job-1",
  userId: "user-1",
  prompt: "a cat",
  modelId: "flux-schnell",
  status: "running",
  providerJobId: "prov-1",
  creditsCharged: 3,
  resultUrl: null,
  errorMessage: null,
};

function makeRequest() {
  return new Request("http://localhost/api/jobs/job-1");
}
const PARAMS = { params: { id: "job-1" } };

describe("GET /api/jobs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrismaJob.findFirst.mockResolvedValue(BASE_JOB);
    mockPrismaJob.update.mockResolvedValue({});
    mockPrismaAsset.create.mockResolvedValue({});
    mockTransaction.mockResolvedValue([{}, {}]);
    mockPollJob.mockResolvedValue({ status: "pending" });
  });

  // ── Auth / ownership ───────────────────────────────────────────────────────

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest(), PARAMS);
    expect(res.status).toBe(401);
  });

  it("returns 404 when job not found", async () => {
    mockPrismaJob.findFirst.mockResolvedValue(null);
    const res = await GET(makeRequest(), PARAMS);
    expect(res.status).toBe(404);
  });

  it("returns 404 when job belongs to another user (findFirst returns null)", async () => {
    // Prisma findFirst with { id, userId } returns null if userId doesn't match.
    mockPrismaJob.findFirst.mockResolvedValue(null);
    const res = await GET(makeRequest(), PARAMS);
    expect(res.status).toBe(404);
  });

  // ── Cached settled states ──────────────────────────────────────────────────

  it("returns cached done result without calling pollJob", async () => {
    mockPrismaJob.findFirst.mockResolvedValue({
      ...BASE_JOB,
      status: "done",
      resultUrl: "https://cdn.fal.ai/out.jpg",
    });
    const res = await GET(makeRequest(), PARAMS);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("done");
    expect(body.resultUrl).toBe("https://cdn.fal.ai/out.jpg");
    expect(mockPollJob).not.toHaveBeenCalled();
  });

  it("returns cached failed result without calling pollJob", async () => {
    mockPrismaJob.findFirst.mockResolvedValue({
      ...BASE_JOB,
      status: "failed",
      errorMessage: "provider error",
    });
    const res = await GET(makeRequest(), PARAMS);
    const body = await res.json();
    expect(body.status).toBe("failed");
    expect(body.errorMessage).toBe("provider error");
    expect(mockPollJob).not.toHaveBeenCalled();
  });

  // ── Provider polling ───────────────────────────────────────────────────────

  it("returns running when provider returns pending", async () => {
    mockPollJob.mockResolvedValue({ status: "pending" });
    const res = await GET(makeRequest(), PARAMS);
    const body = await res.json();
    expect(body.status).toBe("running");
    expect(mockPrismaJob.update).not.toHaveBeenCalled();
  });

  it("updates job and creates asset when provider returns done", async () => {
    mockPollJob.mockResolvedValue({
      status: "done",
      result: { url: "https://cdn.fal.ai/out.jpg", mimeType: "image/jpeg" },
    });
    const res = await GET(makeRequest(), PARAMS);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("done");
    expect(body.resultUrl).toBe("https://cdn.fal.ai/out.jpg");
    expect(mockTransaction).toHaveBeenCalledOnce();
  });

  it("updates job to failed and returns error when provider returns failed", async () => {
    mockPollJob.mockResolvedValue({ status: "failed", error: "fal.ai job failed" });
    const res = await GET(makeRequest(), PARAMS);
    const body = await res.json();
    expect(body.status).toBe("failed");
    expect(body.errorMessage).toBe("fal.ai job failed");
    expect(mockPrismaJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "failed", errorMessage: "fal.ai job failed" }),
      })
    );
  });

  it("returns pending status immediately when providerJobId is null", async () => {
    mockPrismaJob.findFirst.mockResolvedValue({ ...BASE_JOB, status: "pending", providerJobId: null });
    const res = await GET(makeRequest(), PARAMS);
    const body = await res.json();
    expect(body.status).toBe("pending");
    expect(mockPollJob).not.toHaveBeenCalled();
  });
});
