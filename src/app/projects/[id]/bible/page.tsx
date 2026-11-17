import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import BibleEditor from "./BibleEditor";

export default async function BiblePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: { bible: true, script: true },
  });
  if (!project) redirect("/projects");

  const hasScript = !!(project.script && (project.script.scenes as unknown[]).length > 0);

  return (
    <BibleEditor
      projectId={project.id}
      projectTitle={project.title}
      hasScript={hasScript}
      initialBible={project.bible ? {
        characters: project.bible.characters as Character[],
        locations: project.bible.locations as Location[],
        props: project.bible.props as Prop[],
        styleNotes: project.bible.styleNotes,
      } : null}
    />
  );
}

type Character = {
  id: string; name: string; role: string; age: string;
  description: string; personality: string; motivation: string;
};
type Location = {
  id: string; name: string; type: string; description: string;
  mood: string; timeOfDay: string;
};
type Prop = {
  id: string; name: string; description: string; usedBy: string; scenes: string[];
};
