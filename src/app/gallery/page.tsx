import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { GalleryAsset } from "@/types/gallery";
import GalleryClient from "./GalleryClient";

export default async function GalleryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const rows = await prisma.asset.findMany({
    where: { userId: session.user.id },
    include: { job: { select: { prompt: true, modelId: true } } },
    orderBy: { createdAt: "desc" },
  });

  const assets: GalleryAsset[] = rows
    .filter((r) => r.job !== null)
    .map((r) => ({
      id: r.id,
      url: r.url,
      mimeType: r.mimeType,
      createdAt: r.createdAt.toISOString(),
      job: { prompt: r.job!.prompt, modelId: r.job!.modelId },
    }));

  return <GalleryClient assets={assets} />;
}
