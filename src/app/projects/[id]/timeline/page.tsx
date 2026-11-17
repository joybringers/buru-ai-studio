import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TimelineEditor from "./TimelineEditor";

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: { timeline: true, storyboard: true },
  });
  if (!project) redirect("/projects");

  type RawShot = {
    id: string; sceneId: string; sceneTitle: string; shotNumber: number;
    shotType: string; cameraAngle: string; cameraMove: string;
    description: string; dialogue: string; estimatedDuration: number;
    imageUrl?: string; status: string;
  };

  const allShots = (project.storyboard?.shots ?? []) as RawShot[];
  const shotOrder = (project.timeline?.shotOrder ?? []) as string[];

  // Seed order from approved shots if timeline has no order yet
  const approvedIds = allShots.filter((s) => s.status === "approved").map((s) => s.id);
  const effectiveOrder = shotOrder.length > 0
    ? [...shotOrder.filter((sid) => approvedIds.includes(sid)),
       ...approvedIds.filter((sid) => !shotOrder.includes(sid))]
    : approvedIds;

  return (
    <TimelineEditor
      projectId={project.id}
      projectTitle={project.title}
      allShots={allShots}
      initialOrder={effectiveOrder}
      initialVoiceTrack={(project.timeline?.voiceTrack ?? []) as VoiceClip[]}
      initialMusicTrack={(project.timeline?.musicTrack ?? []) as MusicClip[]}
      lockedAt={project.timeline?.lockedAt?.toISOString() ?? null}
    />
  );
}

type VoiceClip = { id: string; label: string; startSec: number; durationSec: number; character: string };
type MusicClip = { id: string; label: string; startSec: number; durationSec: number };
