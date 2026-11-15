import { prisma } from "@/lib/prisma";

export class InsufficientBalanceError extends Error {
  constructor(available: number, required: number) {
    super(`Insufficient balance: need ${required} cr, have ${available} cr`);
    this.name = "InsufficientBalanceError";
  }
}

export async function creditUser(
  userId: string,
  delta: number,
  reason: string,
  jobId?: string
): Promise<void> {
  if (delta <= 0) throw new Error("delta must be positive");

  await prisma.$transaction([
    prisma.creditLedgerEntry.create({ data: { userId, delta, reason, jobId } }),
    prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: delta } },
    }),
  ]);
}

export async function debitUser(
  userId: string,
  delta: number,
  reason: string,
  jobId?: string
): Promise<void> {
  if (delta <= 0) throw new Error("delta must be positive");

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { creditBalance: true },
    });

    if (user.creditBalance < delta) {
      throw new InsufficientBalanceError(user.creditBalance, delta);
    }

    await tx.creditLedgerEntry.create({
      data: { userId, delta: -delta, reason, jobId },
    });

    await tx.user.update({
      where: { id: userId },
      data: { creditBalance: { decrement: delta } },
    });
  });
}

export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { creditBalance: true },
  });
  return user.creditBalance;
}
