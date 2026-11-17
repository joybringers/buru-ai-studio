import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : null;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name || null },
  });

  return NextResponse.json({ ok: true });
}
