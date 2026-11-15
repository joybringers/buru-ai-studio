import { describe, it, expect } from "vitest";
import { MODELS, DRAFT_MODEL_ID, DRAFT_TOTAL_CREDITS, creditsToGBP, CREDIT_VALUE_GBP } from "@/config";

describe("config", () => {
  it("every model has id, name, provider, type, and positive credits", () => {
    for (const model of MODELS) {
      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(["image", "video"]).toContain(model.type);
      expect(model.credits).toBeGreaterThan(0);
    }
  });

  it("draft model exists in MODELS", () => {
    expect(MODELS.find((m) => m.id === DRAFT_MODEL_ID)).toBeDefined();
  });

  it("creditsToGBP formats correctly", () => {
    const result = creditsToGBP(100);
    expect(result).toMatch(/^£\d+\.\d{2}$/);
    expect(result).toBe(`£${(100 * CREDIT_VALUE_GBP).toFixed(2)}`);
  });

  it("DRAFT_TOTAL_CREDITS is positive", () => {
    expect(DRAFT_TOTAL_CREDITS).toBeGreaterThan(0);
  });
});
