import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import StoryboardGrid from "./StoryboardGrid";

export default async function StoryboardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: { storyboard: true, script: true },
  });
  if (!project) redirect("/projects");

  const hasScript = !!(project.script && (project.script.scenes as unknown[]).length > 0);

  return (
    <StoryboardGrid
      projectId={project.id}
      projectTitle={project.title}
      hasScript={hasScript}
      initialShots={(project.storyboard?.shots ?? []) as Shot[]}
    />
  );
}

type Shot = {
  id: string;
  sceneId: string;
  sceneTitle: string;
  shotNumber: number;
  shotType: string;
  cameraAngle: string;
  cameraMove: string;
  description: string;
  dialogue: string;
  estimatedDuration: number;
  imageUrl?: string;
  status: "draft" | "approved";
};
