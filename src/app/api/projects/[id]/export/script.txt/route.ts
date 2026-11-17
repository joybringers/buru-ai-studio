import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: { script: true },
  });
  if (!project) return new NextResponse("Not found", { status: 404 });

  type Scene = {
    title: string; location: string; timeOfDay: string;
    action: string; estimatedDuration: number;
    dialogue: { character: string; line: string }[];
  };

  const scenes = (project.script?.scenes ?? []) as Scene[];
  const lines: string[] = [
    project.title.toUpperCase(),
    "=".repeat(project.title.length),
    "",
    `Target length: ${project.targetLength}s`,
    "",
  ];

  scenes.forEach((scene, i) => {
    lines.push(`SCENE ${i + 1}: ${scene.title.toUpperCase()}`);
    lines.push(`${scene.location.toUpperCase()} - ${scene.timeOfDay.toUpperCase()} (${scene.estimatedDuration}s)`);
    lines.push("");
    lines.push(scene.action);
    lines.push("");
    (scene.dialogue ?? []).forEach((d) => {
      lines.push(`\t\t\t${d.character.toUpperCase()}`);
      lines.push(`\t\t${d.line}`);
      lines.push("");
    });
    lines.push("");
  });

  const text = lines.join("\n");
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${project.title.replace(/[^a-z0-9]/gi, "_")}_script.txt"`,
    },
  });
}
