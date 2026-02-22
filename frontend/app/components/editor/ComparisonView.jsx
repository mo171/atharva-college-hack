"use client";

import { useState } from "react";
import { GitCompare, Check, X, FileText } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { cn } from "@/lib/utils";

function ComparisonView({ open, onOpenChange, originalText, suggestedText, onApply }) {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply?.(suggestedText);
      onOpenChange?.(false);
    } catch (err) {
      console.error("Failed to apply changes:", err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-[#5a5fd8]" />
          AI Insights Comparison
        </DialogTitle>
        <DialogDescription>
          Review the suggested improvements. Click "Apply Changes" to update your text.
        </DialogDescription>
        <DialogClose onClose={() => onOpenChange?.(false)} />
      </DialogHeader>
      
      <DialogContent className="max-w-6xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Version Card */}
          <Card className="p-6 border-2 border-[#e8e8e0]">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-[#888]" />
              <h3 className="text-sm font-semibold text-[#2e2e2e] uppercase tracking-wider">
                Current Version
              </h3>
            </div>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="text-[15px] leading-relaxed text-[#2e2e2e] whitespace-pre-wrap">
                {originalText || "No content"}
              </div>
            </div>
          </Card>

          {/* Suggested Version Card */}
          <Card className="p-6 border-2 border-[#ced3ff] bg-[#f8f7ff]">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-[#5a5fd8]" />
              <h3 className="text-sm font-semibold text-[#5a5fd8] uppercase tracking-wider">
                Suggested Version
              </h3>
            </div>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="text-[15px] leading-relaxed text-[#2e2e2e] whitespace-pre-wrap">
                {suggestedText || "No suggestions"}
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange?.(false)}
          className="gap-2"
          disabled={isApplying}
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          disabled={isApplying}
          className="gap-2 bg-[#5a5fd8] text-white hover:bg-[#4a4fcf]"
        >
          <Check className="h-4 w-4" />
          {isApplying ? "Applying..." : "Apply Changes"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export { ComparisonView };
