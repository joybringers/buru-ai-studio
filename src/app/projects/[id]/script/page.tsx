import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ScriptEditor from "./ScriptEditor";

export default async function ScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: {
      script: { include: { messages: { orderBy: { createdAt: "asc" } } } },
      quote: true,
    },
  });
  if (!project) redirect("/projects");

  const initialData = {
    id: project.id,
    title: project.title,
    targetLength: project.targetLength,
    scenes: (project.script?.scenes ?? []) as Scene[],
    messages: (project.script?.messages ?? []).map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    spentCredits: project.quote?.spentCredits ?? 0,
    hardCap: project.quote?.hardCap ?? null,
  };

  return <ScriptEditor initialData={initialData} />;
}

type Scene = {
  id: string;
  title: string;
  location: string;
  timeOfDay: string;
  characters: string[];
  action: string;
  dialogue: { character: string; line: string }[];
  estimatedDuration: number;
};
