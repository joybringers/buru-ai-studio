import ToolPage from "@/components/ToolPage";
export const metadata = { title: "Relight — BuruStudio" };
export default function RelightPage() {
  return (
    <ToolPage config={{
      modelId: "tool-relight",
      title: "Relight",
      description: "Change the lighting of any portrait or product photo using AI. Describe the light you want.",
      apiRoute: "/api/tools/relight",
      inputLabel: "Photo to relight",
      hasPrompt: true,
      promptLabel: "Lighting description",
      promptPlaceholder: "e.g. dramatic side lighting from the left, golden hour warm glow, studio softbox…",
      badge: "NEW",
    }} />
  );
}
