import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import NewProjectButton from "./NewProjectButton";

export const metadata = { title: "Projects — BuruStudio" };

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: { quote: { select: { totalCredits: true, spentCredits: true, hardCap: true, acceptedAt: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Films</h1>
          <p className="text-sm text-[#A8B0D8] mt-1">Each project has its own quote before anything is generated.</p>
        </div>
        <NewProjectButton />
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 text-[#4A5280]">
          <p className="text-lg mb-2">No films yet.</p>
          <p className="text-sm">Create a project to get a locked quote before spending any credits.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((p) => {
            const q = p.quote;
            const pct = q ? Math.round((q.spentCredits / q.hardCap) * 100) : 0;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}/quote`}
                className="bg-[#121530] border border-[#1E2244] rounded-xl p-5 hover:border-[#6A4CFF]/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate group-hover:text-[#A5B4FC] transition-colors">
                      {p.title}
                    </p>
                    <p className="text-xs text-[#4A5280] mt-0.5">
                      {Math.floor(p.targetLength / 60)}m {p.targetLength % 60}s target
                    </p>
                  </div>
                  <StatusBadge status={p.status} accepted={!!q?.acceptedAt} />
                </div>
                {q && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-[#4A5280] mb-1.5">
                      <span>{q.spentCredits} / {q.hardCap} credits</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1E2244] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: pct >= 90 ? "#F87171" : "linear-gradient(90deg, #6A4CFF, #2F6BFF)",
                        }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, accepted }: { status: string; accepted: boolean }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft:      { label: "Draft",      cls: "bg-[#1E2244] text-[#7B84B5]" },
    quoted:     { label: accepted ? "Locked" : "Quoted",  cls: accepted ? "bg-[#022B1E] text-emerald-400" : "bg-[#2D1E00] text-amber-400" },
    rendering:  { label: "Rendering",  cls: "bg-[#1A1660] text-[#A5B4FC]" },
    done:       { label: "Done",       cls: "bg-[#022B1E] text-emerald-400" },
  };
  const s = map[status] ?? map.draft;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  );
}
