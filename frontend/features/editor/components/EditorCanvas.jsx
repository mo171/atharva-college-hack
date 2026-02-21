"use client";

import { cn } from "@/lib/utils";

function EditorCanvas({
  editorRef,
  initialHtml,
  onInput,
  placeholder = "Start writing your story...",
  isEmpty,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "relative min-h-[200px]",
        className
      )}
      {...props}
    >
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Document content"
        data-placeholder={placeholder}
        className={cn(
          "focus:outline-none focus:ring-2 focus:ring-[#ced3ff] focus:ring-offset-0 rounded",
          "space-y-4 text-[15px] leading-relaxed text-[#2e2e2e]",
          "min-h-[200px] w-full"
        )}
        onInput={onInput}
        style={{ caretColor: "#2e2e2e" }}
      />
      {isEmpty && (
        <div
          className="pointer-events-none absolute inset-0 flex items-start pt-0 text-[15px] leading-relaxed text-[#888]"
          aria-hidden
        >
          {placeholder}
        </div>
      )}
    </div>
  );
}

export { EditorCanvas };
