import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Prisma before importing ledger ───────────────────────────────────────
const mockTx = {
  user: {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  creditLedgerEntry: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn().mockImplementation(async (arg: unknown) => {
      if (typeof arg === "function") {
        return arg(mockTx);
      }
      // array form: execute sequentially and return results
      return Promise.all((arg as Array<Promise<unknown>>));
    }),
    user: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    creditLedgerEntry: {
      create: vi.fn(),
    },
  },
}));

import { creditUser, debitUser, InsufficientBalanceError } from "@/lib/ledger";

describe("ledger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── debitUser ───────────────────────────────────────────────────────────────

  describe("debitUser", () => {
    it("throws InsufficientBalanceError when balance < required", async () => {
      mockTx.user.findUniqueOrThrow.mockResolvedValue({ creditBalance: 5 });

      await expect(debitUser("u1", 10, "image_gen")).rejects.toThrow(
        InsufficientBalanceError
      );
    });

    it("throws InsufficientBalanceError with correct message", async () => {
      mockTx.user.findUniqueOrThrow.mockResolvedValue({ creditBalance: 3 });

      await expect(debitUser("u1", 20, "image_gen")).rejects.toThrow(
        "need 20 cr, have 3 cr"
      );
    });

    it("throws when balance is exactly 0 and delta > 0", async () => {
      mockTx.user.findUniqueOrThrow.mockResolvedValue({ creditBalance: 0 });

      await expect(debitUser("u1", 1, "image_gen")).rejects.toThrow(
        InsufficientBalanceError
      );
    });

    it("does not throw when balance equals required", async () => {
      mockTx.user.findUniqueOrThrow.mockResolvedValue({ creditBalance: 15 });
      mockTx.creditLedgerEntry.create.mockResolvedValue({});
      mockTx.user.update.mockResolvedValue({});

      await expect(debitUser("u1", 15, "image_gen")).resolves.toBeUndefined();
    });

    it("throws if delta is 0", async () => {
      await expect(debitUser("u1", 0, "image_gen")).rejects.toThrow(
        "delta must be positive"
      );
    });

    it("throws if delta is negative", async () => {
      await expect(debitUser("u1", -5, "image_gen")).rejects.toThrow(
        "delta must be positive"
      );
    });
  });

  // ── creditUser ──────────────────────────────────────────────────────────────

  describe("creditUser", () => {
    it("throws if delta is 0", async () => {
      await expect(creditUser("u1", 0, "stripe_topup")).rejects.toThrow(
        "delta must be positive"
      );
    });

    it("throws if delta is negative", async () => {
      await expect(creditUser("u1", -100, "stripe_topup")).rejects.toThrow(
        "delta must be positive"
      );
    });
  });

  // ── InsufficientBalanceError ────────────────────────────────────────────────

  describe("InsufficientBalanceError", () => {
    it("is an instance of Error", () => {
      const err = new InsufficientBalanceError(5, 20);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("InsufficientBalanceError");
    });
  });
});
