import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ExportPanel from "./ExportPanel";

export default async function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: {
      quote: true,
      script: true,
      bible: true,
      storyboard: true,
      timeline: true,
    },
  });
  if (!project) redirect("/projects");

  type Shot = { id: string; status: string; estimatedDuration: number };
  const shots = (project.storyboard?.shots ?? []) as Shot[];
  const approvedShots = shots.filter((s) => s.status === "approved").length;
  const totalDuration = shots.reduce((s, sh) => s + (sh.estimatedDuration ?? 0), 0);

  const checklist = {
    quote: !!project.quote?.acceptedAt,
    script: !!(project.script && (project.script.scenes as unknown[]).length > 0),
    bible: !!(project.bible && (
      (project.bible.characters as unknown[]).length > 0 ||
      (project.bible.locations as unknown[]).length > 0
    )),
    storyboard: approvedShots > 0 && approvedShots === shots.length,
    timeline: !!project.timeline?.lockedAt,
  };

  return (
    <ExportPanel
      projectId={project.id}
      projectTitle={project.title}
      reviewToken={project.reviewToken}
      checklist={checklist}
      stats={{
        scenes: (project.script?.scenes as unknown[] ?? []).length,
        shots: shots.length,
        approvedShots,
        totalDuration,
        spentCredits: project.quote?.spentCredits ?? 0,
        hardCap: project.quote?.hardCap ?? 0,
      }}
      timelineLocked={!!project.timeline?.lockedAt}
    />
  );
}
