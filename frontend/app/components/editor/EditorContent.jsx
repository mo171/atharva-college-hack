import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  User,
  FileText,
  Clock,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { EditorContainer } from "@/features/editor";
import { cn } from "@/lib/utils";

function EditorContent({ className, ...props }) {
  return (
    <main
      className={cn(
        "flex flex-1 flex-col overflow-auto bg-[#fffff2] p-8",
        className,
      )}
      {...props}
    >
      <div className="mx-auto w-full max-w-3xl">
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-[#e8e8e0] pb-4">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Underline className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-4 w-px bg-[#e8e8e0]" />
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <List className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-[#e8e8e0]" />
          <Button className="gap-2 rounded-xl bg-[#ced3ff] px-4 py-2 text-sm text-[#4a4a7a] transition-colors hover:bg-[#b8bff5]">
            <User className="h-3.5 w-3.5" />
            POV: ELIAS
          </Button>
          <Button className="gap-2 rounded-xl bg-[#ced3ff] px-4 py-2 text-sm text-[#4a4a7a] transition-colors hover:bg-[#b8bff5]">
            STYLE GUIDE
          </Button>
        </div>

        {/* Chapter title */}
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-[#2e2e2e]">
            Chapter Five:
          </h1>
          <h2 className="text-4xl font-bold text-[#5a5fd8]">
            The Apothecary&apos;s Silence
          </h2>
        </div>
        <div className="mb-8 flex gap-6 text-xs text-[#888]">
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            1,240 words
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />6 min read
          </span>
        </div>

        {/* Chapter body */}
        <div className="space-y-4 text-[15px] leading-relaxed text-[#2e2e2e]">
          <EditorContainer />
        </div>

        {/* Footer */}
        <div className="mt-12 flex flex-wrap gap-2 text-[11px] text-[#888]">
          <span>DRAFT 0.4.2</span>
          <span>•</span>
          <span>SYNC: COMPLETE</span>
          <span>•</span>
          <span>READING LEVEL: GRADE 9</span>
          <span>•</span>
          <span>SENTIMENT: 42% SUSPENSE</span>
        </div>
      </div>
    </main>
  );
}

export { EditorContent };
