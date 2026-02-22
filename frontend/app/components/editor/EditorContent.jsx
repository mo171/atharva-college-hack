"use client";

import { useRef, useEffect, useCallback, useMemo, useState } from "react";
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
  Zap,
  GitCompare,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { EditorContainer } from "@/features/editor";
import { ComparisonView } from "./ComparisonView";
import { cn } from "@/lib/utils";
import { analyzeWriting, saveWriting, generateSuggestions } from "@/lib/api";

function EditorContent({
  projectId,
  alerts,
  onAnalysis,
  onStoryBrainRefresh,
  className,
  ...props
}) {
  const debounceRef = useRef(null);
  const lastContentRef = useRef("");
  const [editorText, setEditorText] = useState("");
  const [syncStatus, setSyncStatus] = useState("Idle");
  const [chapter, setChapter] = useState("Chapter Five:");
  const [title, setTitle] = useState("The Apothecary's Silence");

  const wordCount = useMemo(() => {
    const words = editorText.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [editorText]);

  const readingMinutes = useMemo(() => {
    if (!wordCount) return 0;
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const editorContainerRef = useRef(null);

  const handleContentChange = useCallback(
    (text) => {
      if (!projectId || !text?.trim()) return;
      lastContentRef.current = text;
      setEditorText(text);
      setSyncStatus("Typing...");

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        debounceRef.current = null;
        try {
          // Auto-save only, no analysis
          setSyncStatus("Analyzing...");
          await saveWriting({
            projectId,
            content: lastContentRef.current,
          });
          onStoryBrainRefresh?.();
          setSyncStatus("Synced");
        } catch (err) {
          console.error("Auto-save failed:", err);
          setSyncStatus("Sync error");
        }
      }, 900); // 2 second debounce for auto-save
    },
    [projectId, onAnalysis, onStoryBrainRefresh],
  );

  const handleManualAnalyze = async () => {
    if (!projectId || !lastContentRef.current.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const payload = await analyzeWriting({
        projectId,
        content: lastContentRef.current,
      });
      onAnalysis?.(payload);
      onStoryBrainRefresh?.();
    } catch (err) {
      console.error("Manual analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCompare = async () => {
    if (!projectId || !lastContentRef.current.trim() || isComparing) return;

    setIsComparing(true);
    try {
      const result = await generateSuggestions({
        projectId,
        content: lastContentRef.current,
      });

      if (result && result.status === "success") {
        setComparisonData({
          original: result.original_text || lastContentRef.current,
          suggested: result.suggested_text || lastContentRef.current,
        });
        setComparisonOpen(true);
      } else {
        console.error("Comparison failed: Invalid response", result);
        alert("Failed to generate suggestions. Please try again.");
      }
    } catch (err) {
      console.error("Comparison failed:", err);
      const status = err.response?.status;
      const errorMessage =
        err.response?.data?.detail || err.message || "Unknown error";

      if (status === 404) {
        alert(
          "Endpoint not found (404). Please restart your backend server to register the new /editor/generate-suggestions endpoint.\n\n" +
            "Error: " +
            errorMessage,
        );
      } else {
        alert(`Failed to generate suggestions: ${errorMessage}`);
      }
    } finally {
      setIsComparing(false);
    }
  };

  const handleApplyChanges = useCallback(
    (newText) => {
      if (editorContainerRef.current) {
        editorContainerRef.current.setContent(newText);
        // Trigger content change to save
        handleContentChange(newText);
      }
    },
    [handleContentChange],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
          <Button
            onClick={handleManualAnalyze}
            disabled={isAnalyzing}
            className={cn(
              "gap-2 rounded-xl px-4 py-2 text-sm transition-all",
              isAnalyzing
                ? "bg-[#e8ecff] text-[#888]"
                : "bg-[#5a5fd8] text-white hover:bg-[#4a4fcf] shadow-md shadow-[#5a5fd8]/20",
            )}
          >
            <Zap
              className={cn("h-3.5 w-3.5", isAnalyzing && "animate-pulse")}
            />
            {isAnalyzing ? "ANALYZING..." : "ANALYZE"}
          </Button>
          <Button
            onClick={handleCompare}
            disabled={isComparing || !lastContentRef.current.trim()}
            className={cn(
              "gap-2 rounded-xl px-4 py-2 text-sm transition-all",
              isComparing
                ? "bg-[#e8ecff] text-[#888]"
                : "bg-[#ced3ff] text-[#4a4a7a] hover:bg-[#b8bff5] shadow-sm",
            )}
          >
            <GitCompare
              className={cn("h-3.5 w-3.5", isComparing && "animate-pulse")}
            />
            {isComparing ? "COMPARING..." : "COMPARE"}
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
        <div className="mb-2 flex flex-col">
          <input
            type="text"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            className="w-full border-none bg-transparent p-0 text-2xl font-semibold text-[#2e2e2e] focus:outline-none focus:ring-0"
            placeholder="Chapter..."
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-none bg-transparent p-0 text-4xl font-bold text-[#5a5fd8] focus:outline-none focus:ring-0"
            placeholder="Title..."
          />
        </div>
        <div className="mb-8 flex gap-6 text-xs text-[#888]">
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {wordCount.toLocaleString()} words
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />6 min read
          </span>
        </div>

        {/* Chapter body */}
        <div className="space-y-4 text-[15px] leading-relaxed text-[#2e2e2e]">
          <EditorContainer
            ref={editorContainerRef}
            onContentChange={handleContentChange}
            alerts={alerts}
          />
        </div>

        {/* Comparison Modal */}
        {comparisonData && (
          <ComparisonView
            open={comparisonOpen}
            onOpenChange={setComparisonOpen}
            originalText={comparisonData.original}
            suggestedText={comparisonData.suggested}
            onApply={handleApplyChanges}
          />
        )}

        {/* Footer */}
        <div className="mt-12 flex flex-wrap gap-2 text-[11px] text-[#888]">
          <span>DRAFT 0.4.2</span>
          <span>•</span>
          <span>SYNC: {syncStatus.toLowerCase()}</span>

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
