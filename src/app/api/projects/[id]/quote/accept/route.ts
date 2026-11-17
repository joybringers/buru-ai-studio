import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: { quote: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!project.quote) return NextResponse.json({ error: "No quote to accept" }, { status: 400 });
  if (project.quote.acceptedAt) {
    return NextResponse.json({ error: "Quote already accepted" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  // User may set a custom hard cap (must be >= 1 and <= totalCredits)
  const rawCap = body.hardCap as number | undefined;
  const hardCap = rawCap && rawCap > 0 && rawCap <= project.quote.totalCredits
    ? rawCap
    : project.quote.totalCredits;

  const now = new Date();
  const lockedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const quote = await prisma.filmQuote.update({
    where: { projectId: id },
    data: { acceptedAt: now, lockedUntil, hardCap },
    include: { lineItems: true },
  });

  await prisma.project.update({ where: { id }, data: { status: "rendering" } });

  return NextResponse.json(quote);
}
