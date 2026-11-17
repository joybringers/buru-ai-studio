import ToolPage from "@/components/ToolPage";
export const metadata = { title: "Voice Clone — BuruStudio" };
export default function VoiceClonePage() {
  return (
    <ToolPage config={{
      modelId: "tool-voice-clone",
      title: "Voice Clone",
      description: "Clone any voice from a short audio sample and make it say anything. Upload 5–30 seconds of clear speech.",
      apiRoute: "/api/tools/voice-clone",
      audioOnlyInput: true,
      inputLabel: "Voice sample (5–30 sec, clear speech)",
      promptLabel: "Script to generate",
      promptPlaceholder: "Type the words you want spoken in the cloned voice…",
      secondaryPromptLabel: "Reference transcription",
      secondaryPromptPlaceholder: "Paste what is said in the voice sample — improves accuracy",
      outputIsAudio: true,
      badge: "NEW",
    }} />
  );
}
