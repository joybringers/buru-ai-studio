import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock @fal-ai/client before importing providers ────────────────────────────
vi.mock("@fal-ai/client", () => ({
  fal: {
    config: vi.fn(),
    queue: {
      submit: vi.fn(),
      status: vi.fn(),
      result: vi.fn(),
    },
  },
}));

import { fal } from "@fal-ai/client";
import { submitJob, pollJob } from "@/lib/providers/index";
import { supportedModelIds } from "@/lib/providers/fal";

const mockFal = fal as unknown as {
  queue: {
    submit: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
    result: ReturnType<typeof vi.fn>;
  };
};

describe("providers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FAL_KEY = "test-key";
  });

  // ── Model map coverage ──────────────────────────────────────────────────────

  describe("image model IDs", () => {
    it("includes flux-schnell", () => {
      expect(supportedModelIds).toContain("flux-schnell");
    });

    it("includes flux-dev", () => {
      expect(supportedModelIds).toContain("flux-dev");
    });

    it("includes nano-banana-pro", () => {
      expect(supportedModelIds).toContain("nano-banana-pro");
    });
  });

  // ── Video models ────────────────────────────────────────────────────────────

  describe("submitJob — video models", () => {
    it("submits minimax-video and returns request_id", async () => {
      mockFal.queue.submit.mockResolvedValueOnce({ request_id: "vid-req-1" });
      const id = await submitJob("a cinematic scene", "minimax-video");
      expect(id).toBe("vid-req-1");
      expect(mockFal.queue.submit).toHaveBeenCalledWith(
        "fal-ai/minimax/video-01-live",
        expect.objectContaining({ input: { prompt: "a cinematic scene" } })
      );
    });

    it("throws for unknown video model", async () => {
      await expect(submitJob("a prompt", "gen4-turbo")).rejects.toThrow(
        "Unknown model"
      );
    });
  });

  describe("pollJob — video models", () => {
    it("returns done with video url for minimax-video", async () => {
      mockFal.queue.status.mockResolvedValueOnce({ status: "COMPLETED" });
      mockFal.queue.result.mockResolvedValueOnce({
        data: { video: { url: "https://example.com/clip.mp4" } },
      });
      const result = await pollJob("vid-req-1", "minimax-video");
      expect(result).toEqual({
        status: "done",
        result: { url: "https://example.com/clip.mp4", mimeType: "video/mp4" },
      });
    });

    it("throws for unknown video model", async () => {
      await expect(pollJob("req-1", "veo-31-fast")).rejects.toThrow(
        "Unknown model"
      );
    });
  });

  // ── Unknown model ───────────────────────────────────────────────────────────

  describe("submitJob — unknown model", () => {
    it("throws for an unrecognised model ID", async () => {
      await expect(submitJob("a prompt", "made-up-model")).rejects.toThrow(
        "Unknown model"
      );
    });
  });

  describe("pollJob — unknown model", () => {
    it("throws for an unrecognised model ID", async () => {
      await expect(pollJob("req-1", "made-up-model")).rejects.toThrow(
        "Unknown model"
      );
    });
  });

  // ── submitJob happy path ────────────────────────────────────────────────────

  describe("submitJob — image model", () => {
    it("returns the request_id from fal queue", async () => {
      mockFal.queue.submit.mockResolvedValue({ request_id: "fal-req-abc" });

      const id = await submitJob("a cat", "flux-schnell");
      expect(id).toBe("fal-req-abc");
      expect(mockFal.queue.submit).toHaveBeenCalledOnce();
    });
  });

  // ── pollJob happy paths ─────────────────────────────────────────────────────

  describe("pollJob — image model", () => {
    it("returns pending when fal status is IN_QUEUE", async () => {
      mockFal.queue.status.mockResolvedValue({ status: "IN_QUEUE" });

      const result = await pollJob("req-1", "flux-schnell");
      expect(result).toEqual({ status: "pending" });
    });

    it("returns done with url when fal status is COMPLETED", async () => {
      mockFal.queue.status.mockResolvedValue({ status: "COMPLETED" });
      mockFal.queue.result.mockResolvedValue({
        data: { images: [{ url: "https://cdn.fal.ai/out.jpg", content_type: "image/jpeg" }] },
      });

      const result = await pollJob("req-1", "flux-schnell");
      expect(result).toEqual({
        status: "done",
        result: { url: "https://cdn.fal.ai/out.jpg", mimeType: "image/jpeg" },
      });
    });

    it("returns failed when fal status is FAILED", async () => {
      mockFal.queue.status.mockResolvedValue({ status: "FAILED" });

      const result = await pollJob("req-1", "flux-schnell");
      expect(result).toEqual({ status: "failed", error: "fal.ai job failed" });
    });
  });
});
