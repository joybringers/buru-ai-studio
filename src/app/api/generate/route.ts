import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { debitUser, creditUser, InsufficientBalanceError } from "@/lib/ledger";
import { submitJob } from "@/lib/providers/index";
import { MODELS } from "@/config";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { prompt, modelId } = body as { prompt?: unknown; modelId?: unknown };

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }
  if (!modelId || typeof modelId !== "string") {
    return NextResponse.json({ error: "modelId is required" }, { status: 400 });
  }

  const model = MODELS.find((m) => m.id === modelId);
  if (!model) {
    return NextResponse.json({ error: `Unknown model: ${modelId}` }, { status: 400 });
  }

  // Create the job record first so the ledger entry can reference it.
  const job = await prisma.job.create({
    data: {
      userId,
      prompt: prompt.trim(),
      modelId,
      creditsCharged: model.credits,
      status: "pending",
    },
  });

  // Debit credits server-side — cost comes from config, never the request.
  try {
    await debitUser(userId, model.credits, "image_gen", job.id);
  } catch (err) {
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "failed", errorMessage: "Insufficient balance" },
    });
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    return NextResponse.json({ error: "Failed to charge credits" }, { status: 500 });
  }

  // Submit to the provider; refund on failure.
  try {
    const providerJobId = await submitJob(prompt.trim(), modelId);
    await prisma.job.update({
      where: { id: job.id },
      data: { providerJobId, status: "running" },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[generate] submitJob failed:", errMsg, err);
    await creditUser(userId, model.credits, "admin", job.id);
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "failed", errorMessage: errMsg },
    });
    const detail = process.env.NODE_ENV === "development" ? errMsg : undefined;
    return NextResponse.json(
      { error: "Failed to submit generation job", detail },
      { status: 500 }
    );
  }

  return NextResponse.json({ jobId: job.id });
}
