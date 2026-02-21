"use client";

import { EditorContent } from "./EditorContent";
import { EditorSidebar } from "./EditorSidebar";
import { Reveal } from "./Reveal";

import { Card } from "@/app/components/ui/card";
import { cn } from "@/lib/utils";

function EditorMockup({ className, ...props }) {
  return (
    <Reveal mode="pop" width="100%" threshold={0.2} initialY={40} delay={0.2}>
      <Card
        className={cn(
          "overflow-hidden rounded-2xl border border-[#e8e8e0] bg-white shadow-lg shadow-black/5",
          "transition-all duration-500 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl hover:shadow-black/10",
          className,
        )}
        {...props}
      >
        <div className="flex min-h-[400px]">
          <EditorSidebar />
          <EditorContent />
        </div>
      </Card>
    </Reveal>
  );
}

export { EditorMockup };
