import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: { quote: { select: { totalCredits: true, spentCredits: true, hardCap: true, acceptedAt: true, lockedUntil: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, targetLength } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      title: title.trim().slice(0, 100),
      targetLength: Number(targetLength) || 180,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
