import { NextRequest } from "next/server";
import { submitTool } from "@/lib/submitTool";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { imageUrl, lightingPrompt } = body as { imageUrl?: string; lightingPrompt?: string };

  return submitTool({
    modelId: "tool-relight",
    imageUrl,
    opts: { lightingPrompt },
  });
}
