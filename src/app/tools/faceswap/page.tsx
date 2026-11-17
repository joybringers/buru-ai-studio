import ToolPage from "@/components/ToolPage";
export const metadata = { title: "Face Swap — BuruStudio" };
export default function FaceSwapPage() {
  return (
    <ToolPage config={{
      modelId: "tool-faceswap",
      title: "Face Swap",
      description: "Swap a face in any photo with another. Upload the base image and the face photo.",
      apiRoute: "/api/tools/faceswap",
      inputLabel: "Base image",
      hasSecondImage: true,
      secondInputLabel: "Face to swap in",
      badge: "HOT",
    }} />
  );
}
