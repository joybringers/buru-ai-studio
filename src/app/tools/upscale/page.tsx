import ToolPage from "@/components/ToolPage";
export const metadata = { title: "Image Upscale — BuruStudio" };
export default function UpscalePage() {
  return (
    <ToolPage config={{
      modelId: "tool-upscale",
      title: "Image Upscale",
      description: "Enhance and upscale your image to 4× resolution with AI detail restoration.",
      apiRoute: "/api/tools/upscale",
      inputLabel: "Image to upscale",
      badge: "4×",
    }} />
  );
}
