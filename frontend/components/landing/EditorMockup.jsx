import { EditorContent } from "./EditorContent";
import { EditorSidebar } from "./EditorSidebar";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function EditorMockup({ className, ...props }) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-[#e8e8e0] bg-white shadow-lg shadow-black/5",
        className
      )}
      {...props}
    >
      <div className="flex min-h-[400px]">
        <EditorSidebar />
        <EditorContent />
      </div>
    </Card>
  );
}

export { EditorMockup };
