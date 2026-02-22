"use client";

import { useState, useEffect } from "react";
import { FileText, Edit2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { cn } from "@/lib/utils";

function SuggestionDialog({
  open,
  onOpenChange,
  originalText,
  suggestedText: initialSuggestedText,
  explanation,
  alertType,
  onApply,
}) {
  const [editedSuggestion, setEditedSuggestion] = useState(initialSuggestedText || "");
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (open) {
      setEditedSuggestion(initialSuggestedText || "");
    }
  }, [open, initialSuggestedText]);

  const handleApply = async () => {
    if (!editedSuggestion.trim()) {
      return;
    }
    setIsApplying(true);
    try {
      await onApply(editedSuggestion);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to apply suggestion:", error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-[#5a5fd8]" />
            {alertType === "GRAMMAR" ? "Grammar Suggestion" : "Text Suggestion"}
          </DialogTitle>
          <DialogDescription>
            Review and edit the suggested text before applying. You can modify the suggestion to better match your writing style.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Explanation */}
          {explanation && (
            <Card className="p-4 bg-[#f8f7ff] border-[#ced3ff]">
              <p className="text-sm text-[#2e2e2e]">
                <span className="font-semibold">Issue: </span>
                {explanation}
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
            {/* Original Text */}
            <Card className="p-4 border-2 border-[#e8e8e0] flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-[#888]" />
                <h3 className="text-sm font-semibold text-[#2e2e2e] uppercase tracking-wider">
                  Original Text
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="text-[15px] leading-relaxed text-[#2e2e2e] whitespace-pre-wrap">
                  {originalText || "No text"}
                </div>
              </div>
            </Card>

            {/* Suggested Text (Editable) */}
            <Card className="p-4 border-2 border-[#ced3ff] bg-[#f8f7ff] flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <Edit2 className="h-4 w-4 text-[#5a5fd8]" />
                <h3 className="text-sm font-semibold text-[#5a5fd8] uppercase tracking-wider">
                  Suggested Text (Editable)
                </h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <textarea
                  value={editedSuggestion}
                  onChange={(e) => setEditedSuggestion(e.target.value)}
                  className={cn(
                    "w-full h-full p-3 text-[15px] leading-relaxed text-[#2e2e2e]",
                    "border border-[#e8e8e0] rounded-lg resize-none",
                    "focus:outline-none focus:ring-2 focus:ring-[#5a5fd8] focus:border-transparent",
                    "custom-scrollbar"
                  )}
                  placeholder="Edit the suggestion here..."
                />
              </div>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isApplying || !editedSuggestion.trim()}
            className="bg-[#5a5fd8] text-white hover:bg-[#4a4fcf]"
          >
            <Check className="h-4 w-4 mr-2" />
            {isApplying ? "Applying..." : "Apply Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { SuggestionDialog };
