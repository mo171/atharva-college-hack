"use client";

import { useState } from "react";
import { GitBranch, Sparkles, Plus, Filter } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

function PlotThreadSidebar({
  plotThreads = [],
  selectedThread,
  onThreadSelect,
  onExtract,
  isExtracting,
  className,
  ...props
}) {
  return (
    <aside
      className={cn(
        "custom-scrollbar flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-[#e8e8e0] bg-[#f8f7ff] p-4",
        className
      )}
      {...props}
    >
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#2e2e2e] flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Plot Threads
        </h2>
        <p className="mt-1 text-xs text-[#888]">
          {plotThreads.length} thread{plotThreads.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-2">
        {plotThreads.map((thread) => (
          <button
            key={thread.id}
            onClick={() => onThreadSelect?.(thread.id)}
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-colors",
              selectedThread === thread.id
                ? "bg-[#ced3ff] border-[#5a5fd8]"
                : "bg-white border-[#e8e8e0] hover:bg-[#f0f0f0]"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: thread.color || "#5a5fd8" }}
              />
              <span className="font-semibold text-sm text-[#2e2e2e]">
                {thread.title}
              </span>
            </div>
            {thread.description && (
              <p className="text-xs text-[#888] line-clamp-2">
                {thread.description}
              </p>
            )}
          </button>
        ))}
      </div>

      <div className="mt-auto space-y-3">
        <Button
          onClick={onExtract}
          disabled={isExtracting}
          className="w-full gap-2 rounded-xl bg-[#5a5fd8] text-white hover:bg-[#4a4fcf]"
        >
          <Sparkles
            className={cn("h-4 w-4", isExtracting && "animate-pulse")}
          />
          {isExtracting ? "Extracting..." : "Extract Plot Points"}
        </Button>
        <p className="text-xs text-[#888] text-center">
          AI will analyze your narrative chunks and extract key plot points
        </p>
      </div>
    </aside>
  );
}

export { PlotThreadSidebar };
