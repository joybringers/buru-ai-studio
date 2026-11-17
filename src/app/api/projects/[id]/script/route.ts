import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: {
      script: {
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

// Initialise an empty script for a project
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const script = await prisma.script.upsert({
    where: { projectId: id },
    create: { projectId: id, scenes: [] },
    update: {},
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(script, { status: 201 });
}

// Update scenes directly (from the scene editor)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { scenes } = await req.json();
  const script = await prisma.script.update({
    where: { projectId: id },
    data: { scenes, version: { increment: 1 }, updatedAt: new Date() },
  });
  return NextResponse.json(script);
}
