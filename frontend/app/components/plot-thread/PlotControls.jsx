"use client";

import { GitBranch, Sparkles, Download, Filter } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

function PlotControls({
  onExtract,
  isExtracting,
  hasData,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-[#e8e8e0] bg-white px-6 py-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <GitBranch className="h-5 w-5 text-[#5a5fd8]" />
        <h1 className="text-lg font-semibold text-[#2e2e2e]">Plot Thread</h1>
      </div>

      <div className="flex items-center gap-2">
        {!hasData && (
          <Button
            onClick={onExtract}
            disabled={isExtracting}
            className="gap-2 rounded-xl bg-[#5a5fd8] text-white hover:bg-[#4a4fcf]"
          >
            <Sparkles
              className={cn("h-4 w-4", isExtracting && "animate-pulse")}
            />
            {isExtracting ? "Extracting..." : "Extract Plot Points"}
          </Button>
        )}
        {hasData && (
          <>
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-[#e8e8e0]"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-[#e8e8e0]"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export { PlotControls };
