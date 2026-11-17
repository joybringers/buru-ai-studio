import ToolPage from "@/components/ToolPage";
export const metadata = { title: "Lip Sync — BuruStudio" };
export default function LipSyncPage() {
  return (
    <ToolPage config={{
      modelId: "tool-lipsync",
      title: "Lip Sync",
      description: "Animate a portrait photo to lip-sync with any audio track. Upload a face photo and an audio clip.",
      apiRoute: "/api/tools/lipsync",
      inputLabel: "Portrait photo",
      hasAudio: true,
      outputIsVideo: true,
      badge: "NEW",
    }} />
  );
}
