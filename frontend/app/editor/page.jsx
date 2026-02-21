import {
  EditorNavbar,
  StoryBrainSidebar,
  EditorContent,
  AIInsightsSidebar,
} from "@/app/components/editor";

export default function EditorPage() {
  return (
    <div className="flex h-screen flex-col">
      <EditorNavbar />
      <div className="flex flex-1 overflow-hidden">
        <StoryBrainSidebar className="hidden lg:flex" />
        <EditorContent />
        <AIInsightsSidebar className="hidden xl:flex" />
      </div>
    </div>
  );
}
