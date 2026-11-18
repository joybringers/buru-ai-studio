import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import BuruLogo from "@/components/BuruLogo";

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const project = await prisma.project.findUnique({
    where: { reviewToken: token },
    include: {
      script: true,
      bible: true,
      storyboard: true,
      timeline: true,
    },
  });
  if (!project) notFound();

  type Scene = { id: string; title: string; location: string; timeOfDay: string; action: string; dialogue: { character: string; line: string }[]; estimatedDuration: number };
  type Shot = { id: string; sceneTitle: string; shotType: string; cameraAngle: string; cameraMove: string; description: string; dialogue: string; estimatedDuration: number; status: string };
  type Character = { id: string; name: string; role: string; age: string; description: string; personality: string; motivation: string };
  type Location = { id: string; name: string; type: string; description: string; mood: string };

  const scenes = (project.script?.scenes ?? []) as Scene[];
  const shots = (project.storyboard?.shots ?? []) as Shot[];
  const characters = (project.bible?.characters ?? []) as Character[];
  const locations = (project.bible?.locations ?? []) as Location[];
  const shotOrder = (project.timeline?.shotOrder ?? []) as string[];
  const totalDuration = shots.reduce((s, sh) => s + (sh.estimatedDuration ?? 0), 0);

  const orderedShots = shotOrder.length > 0
    ? shotOrder.map((sid) => shots.find((s) => s.id === sid)).filter(Boolean) as Shot[]
    : shots;

  return (
    <div className="min-h-screen bg-[#090B1A] text-[#F2F6FF] font-sans">
      {/* Header */}
      <div className="border-b border-[#1E2140] bg-[#121530] px-6 py-6 text-center relative">
        <Link href="/" className="absolute left-6 top-1/2 -translate-y-1/2" style={{ textDecoration: "none" }}>
          <BuruLogo />
        </Link>
        <div className="text-xs text-[#6A4CFF] uppercase tracking-widest mb-2">Film Review</div>
        <h1 className="text-2xl font-bold text-[#F2F6FF]">{project.title}</h1>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-[#A8B0D8]">
          <span>{scenes.length} scene{scenes.length !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>{shots.length} shots</span>
          <span>·</span>
          <span>{totalDuration}s total</span>
          {project.timeline?.lockedAt && <><span>·</span><span className="text-emerald-400">Timeline locked</span></>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-12">

        {/* Characters */}
        {characters.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-[#A8B0D8] uppercase tracking-wide mb-4">Characters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {characters.map((c) => (
                <div key={c.id} className="bg-[#121530] border border-[#1E2140] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[#F2F6FF]">{c.name}</span>
                    <span className="text-xs bg-[#1E2140] text-[#A8B0D8] px-1.5 py-0.5 rounded-full">{c.role}</span>
                    {c.age && <span className="text-xs text-[#4A5280]">{c.age}</span>}
                  </div>
                  {c.description && <p className="text-xs text-[#A8B0D8] mb-1">{c.description}</p>}
                  {c.motivation && <p className="text-xs text-[#6A4CFF] italic">&ldquo;{c.motivation}&rdquo;</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Locations */}
        {locations.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-[#A8B0D8] uppercase tracking-wide mb-4">Locations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {locations.map((l) => (
                <div key={l.id} className="bg-[#121530] border border-[#1E2140] rounded-xl p-4">
                  <div className="font-semibold text-sm text-[#F2F6FF] mb-1">{l.name}</div>
                  <div className="text-xs text-[#A8B0D8]">{l.type} · {l.mood}</div>
                  {l.description && <p className="text-xs text-[#A8B0D8] mt-1">{l.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Script */}
        {scenes.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-[#A8B0D8] uppercase tracking-wide mb-4">Script</h2>
            <div className="space-y-6">
              {scenes.map((scene, i) => (
                <div key={scene.id} className="bg-[#121530] border border-[#1E2140] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono text-[#6A4CFF]">SCENE {i + 1}</span>
                    <span className="font-semibold text-[#F2F6FF]">{scene.title}</span>
                    <span className="text-xs text-[#A8B0D8] ml-auto">{scene.location} · {scene.timeOfDay} · {scene.estimatedDuration}s</span>
                  </div>
                  <p className="text-sm text-[#A8B0D8] mb-4 italic">{scene.action}</p>
                  {scene.dialogue?.map((line, j) => (
                    <div key={j} className="mb-2">
                      <div className="text-xs font-semibold text-[#6A4CFF] uppercase tracking-wide mb-0.5">{line.character}</div>
                      <div className="text-sm text-[#F2F6FF] pl-4 border-l-2 border-[#6A4CFF]/40">{line.line}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Shot list */}
        {orderedShots.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-[#A8B0D8] uppercase tracking-wide mb-4">Shot List</h2>
            <div className="space-y-2">
              {orderedShots.map((shot, i) => (
                <div key={shot.id} className="flex items-start gap-3 bg-[#121530] border border-[#1E2140] rounded-xl px-4 py-3">
                  <span className="text-xs font-mono text-[#6A4CFF] w-6 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-[#F2F6FF]">{shot.shotType.toUpperCase()}</span>
                      <span className="text-xs text-[#A8B0D8]">{shot.cameraAngle} · {shot.cameraMove}</span>
                      <span className="text-xs text-[#4A5280] ml-auto">{shot.estimatedDuration}s</span>
                    </div>
                    <p className="text-xs text-[#A8B0D8]">{shot.description}</p>
                    {shot.dialogue && <p className="text-xs text-[#2BE4FF] italic mt-0.5">&ldquo;{shot.dialogue}&rdquo;</p>}
                  </div>
                  {shot.status === "approved" && <span className="text-emerald-400 text-xs flex-shrink-0">✓</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="text-center text-xs text-[#4A5280] pt-4 border-t border-[#1E2140]">
          Generated with BuruStudio · This link is view-only
        </div>
      </div>
    </div>
  );
}
