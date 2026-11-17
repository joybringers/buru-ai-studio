import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import QuoteClient from "./QuoteClient";

export const metadata = { title: "Film Quote — BuruStudio" };

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: { quote: { include: { lineItems: { orderBy: { id: "asc" } } } } },
  });
  if (!project) notFound();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { creditBalance: true },
  });

  return (
    <QuoteClient
      project={{
        id: project.id,
        title: project.title,
        status: project.status,
        targetLength: project.targetLength,
        quote: project.quote ? {
          id: project.quote.id,
          totalCredits: project.quote.totalCredits,
          hardCap: project.quote.hardCap,
          spentCredits: project.quote.spentCredits,
          acceptedAt: project.quote.acceptedAt?.toISOString() ?? null,
          lockedUntil: project.quote.lockedUntil?.toISOString() ?? null,
          lineItems: project.quote.lineItems.map(l => ({
            stage: l.stage,
            description: l.description,
            credits: l.credits,
          })),
        } : null,
      }}
      creditBalance={user?.creditBalance ?? 0}
    />
  );
}
