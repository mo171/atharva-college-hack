import { LayoutGrid, List } from "lucide-react";

import { cn } from "@/lib/utils";

function ViewToggle({
  view = "grid",
  onViewChange,
  className,
  ...props
}) {
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-[#888]">
        View:
      </span>
      <div className="flex rounded-xl border border-[#e8e8e0] p-0.5">
        <button
          type="button"
          onClick={() => onViewChange?.("grid")}
          className={cn(
            "rounded-lg p-1.5 transition-colors",
            view === "grid"
              ? "bg-[#e8ecff] text-[#5a5fd8]"
              : "text-[#888] hover:bg-[#f8f7ff]"
          )}
          aria-label="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onViewChange?.("list")}
          className={cn(
            "rounded-lg p-1.5 transition-colors",
            view === "list"
              ? "bg-[#e8ecff] text-[#5a5fd8]"
              : "text-[#888] hover:bg-[#f8f7ff]"
          )}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export { ViewToggle };
