"use client";

import { useState } from "react";
import { AlertTriangle, Wand2, Target, Square, FileText } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { SuggestionDialog } from "./SuggestionDialog";
import { cn } from "@/lib/utils";
import { fixSpelling, getGrammarSuggestion } from "@/lib/api";

const ALERT_STYLES = {
  INCONSISTENCY: {
    subLabel: "Continuity",
    headerBg: "bg-[#fff5e1]/80",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    primaryAction: "REVIEW",
  },
  POV_SHIFT: {
    subLabel: "Point of View",
    headerBg: "bg-[#f8deff]/60",
    icon: Wand2,
    iconColor: "text-[#5a5fd8]",
    primaryAction: "FIX",
  },
  TONE_CLASH: {
    subLabel: "Tone",
    headerBg: "bg-[#cff8ff]/60",
    icon: Target,
    iconColor: "text-[#1e88e5]",
    primaryAction: "ANALYZE",
  },
  SPELLING: {
    subLabel: "Spelling",
    headerBg: "bg-red-50/60",
    icon: AlertTriangle,
    iconColor: "text-red-500",
    primaryAction: "FIX",
  },
  GRAMMAR: {
    subLabel: "Grammar",
    headerBg: "bg-blue-50/60",
    icon: FileText,
    iconColor: "text-blue-500",
    primaryAction: "REVIEW",
  },
};

const DEFAULT_STYLE = {
  subLabel: "Suggestion",
  headerBg: "bg-[#e8ecff]/60",
  icon: AlertTriangle,
  iconColor: "text-[#5a5fd8]",
  primaryAction: "REVIEW",
};

function InsightCard({
  id,
  type,
  subLabel,
  headerBg,
  icon: Icon,
  iconColor,
  text,
  primaryAction,
  onDismiss,
  onFix,
  onHighlight,
  disabled,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8e8e0] bg-white shadow-md shadow-black/5 transition-all hover:shadow-lg hover:shadow-black/10">
      <div
        className={cn("flex items-center justify-between px-4 py-3", headerBg)}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg bg-white/50",
              iconColor,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2e2e2e]">
              {type}
            </span>
            <p className="text-[10px] font-medium text-[#666]">{subLabel}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full hover:bg-black/5"
          onClick={(e) => {
            e.stopPropagation();
            onHighlight?.(id);
          }}
          title="Locate in text"
        >
          <Target className="h-3.5 w-3.5 text-[#5a5fd8]" />
        </Button>
      </div>
      <div className="p-4">
        <p className="text-sm leading-relaxed text-[#2e2e2e]">{text}</p>
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 flex-1 rounded-xl text-[11px] font-bold tracking-tight"
            onClick={onDismiss}
            disabled={disabled}
          >
            DISMISS
          </Button>
          <Button
            size="sm"
            className="h-8 flex-1 rounded-xl bg-[#ced3ff] text-[11px] font-bold tracking-tight text-[#4a4a7a] transition-colors hover:bg-[#5a5fd8] hover:text-white"
            onClick={onFix}
            disabled={disabled}
          >
            {primaryAction}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AIInsightsSidebar({
  alerts = [],
  projectId,
  editorContent,
  onApplyFix,
  onHighlight,
  className,
  ...props
}) {
  const [dismissed, setDismissed] = useState(new Set());
  const [suggestionDialog, setSuggestionDialog] = useState(null);
  const [isFixing, setIsFixing] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, POLISH, NARRATIVE

  const visibleAlerts = alerts
    .map((a, i) => ({ ...a, _idx: i }))
    .filter((a) => !dismissed.has(a._idx));

  const filteredAlerts = visibleAlerts.filter((alert) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "POLISH") {
      return ["SPELLING", "GRAMMAR", "STYLE"].includes(alert.type);
    }
    if (activeTab === "NARRATIVE") {
      return ["INCONSISTENCY", "POV_SHIFT", "TONE_CLASH"].includes(alert.type);
    }
    return true;
  });

  const count = filteredAlerts.length;
  const totalCount = visibleAlerts.length;

  const handleDismiss = (idx) => {
    setDismissed((prev) => new Set([...prev, idx]));
  };

  const handleFix = async (alert) => {
    if (!projectId || !editorContent || isFixing) return;

    const alertType = alert.type;

    // Handle spelling errors - direct fix
    if (alertType === "SPELLING") {
      setIsFixing(true);
      try {
        const originalWord = alert.original_text || "";
        const explanation = alert.explanation || "";

        // Extract suggestion from explanation
        let suggestion = "";
        if (explanation.includes("Did you mean:")) {
          const suggestionsText = explanation
            .split("Did you mean:")[1]
            .split("?")[0]
            .trim();
          suggestion = suggestionsText.split(",")[0].trim();
        }

        if (!suggestion) {
          console.error("No suggestion found for spelling error");
          return;
        }

        const result = await fixSpelling({
          projectId,
          content: editorContent,
          word: originalWord,
          suggestion: suggestion,
        });

        if (result.status === "success" && onApplyFix) {
          onApplyFix(result.corrected_text);
          handleDismiss(alert._idx);
        }
      } catch (error) {
        console.error("Failed to fix spelling:", error);
      } finally {
        setIsFixing(false);
      }
    }
    // Handle grammar errors - show suggestion dialog
    else if (alertType === "GRAMMAR" || alertType === "STYLE") {
      setIsFixing(true);
      try {
        const result = await getGrammarSuggestion({
          projectId,
          content: editorContent,
          alert: alert,
        });

        if (result.status === "success") {
          setSuggestionDialog({
            originalText: result.original_text || "",
            suggestedText: result.suggested_text || "",
            explanation: result.explanation || alert.explanation || "",
            alertType: alertType,
            alert: alert,
          });
        }
      } catch (error) {
        console.error("Failed to get grammar suggestion:", error);
      } finally {
        setIsFixing(false);
      }
    }
  };

  const handleApplySuggestion = async (finalText) => {
    if (!suggestionDialog || !onApplyFix) return;

    try {
      // Find the original text in the editor content and replace it
      const originalText = suggestionDialog.originalText;
      const editorText = editorContent;

      // Try to find and replace the original text
      let correctedText = editorText;

      // First try exact match
      if (editorText.includes(originalText)) {
        // Replace first occurrence
        correctedText = editorText.replace(originalText, finalText);
      } else {
        // Try case-insensitive match
        const regex = new RegExp(
          originalText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i",
        );
        if (regex.test(editorText)) {
          correctedText = editorText.replace(regex, finalText);
        } else {
          // If no match found, try to find similar text or just replace the whole content
          // For now, we'll try to be smart about it - find the sentence containing the original
          const sentences = editorText.split(/[.!?]+/);
          const matchingSentence = sentences.find((s) =>
            s.toLowerCase().includes(originalText.toLowerCase()),
          );

          if (matchingSentence) {
            const sentenceIndex = editorText.indexOf(matchingSentence);
            const beforeSentence = editorText.substring(0, sentenceIndex);
            const afterSentence = editorText.substring(
              sentenceIndex + matchingSentence.length,
            );
            correctedText = beforeSentence + finalText + afterSentence;
          } else {
            // Last resort: append the suggestion
            correctedText = editorText + " " + finalText;
          }
        }
      }

      onApplyFix(correctedText);

      // Dismiss the alert
      if (suggestionDialog.alert) {
        handleDismiss(suggestionDialog.alert._idx);
      }

      setSuggestionDialog(null);
    } catch (error) {
      console.error("Failed to apply suggestion:", error);
    }
  };

  const TabButton = ({ id, label, active }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "relative flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
        active ? "text-[#5a5fd8]" : "text-[#888] hover:text-[#666]",
      )}
    >
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5a5fd8]" />
      )}
    </button>
  );

  return (
    <aside
      className={cn(
        "custom-scrollbar flex w-80 shrink-0 flex-col gap-0 overflow-y-auto border-l border-[#e8e8e0] bg-[#f8f7ff]",
        className,
      )}
      {...props}
    >
      <div className="border-b border-[#e8e8e0] bg-white p-4 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#2e2e2e]">
              AI Insights
            </h2>
            <p className="mt-0.5 text-[10px] text-[#888]">
              {totalCount} active alert{totalCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f2ff] text-[#5a5fd8]">
            <span className="text-xs font-bold">{totalCount}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <TabButton id="ALL" label="All" active={activeTab === "ALL"} />
          <TabButton
            id="POLISH"
            label="Polish"
            active={activeTab === "POLISH"}
          />
          <TabButton
            id="NARRATIVE"
            label="Narrative"
            active={activeTab === "NARRATIVE"}
          />
        </div>
      </div>

      <div className="flex-1 space-y-4 p-4">
        {filteredAlerts.map((alert) => {
          const style = ALERT_STYLES[alert.type] ?? DEFAULT_STYLE;
          return (
            <InsightCard
              key={`${alert.type}-${alert._idx}-${(alert.explanation || "").slice(0, 20)}`}
              id={alert.id}
              type={alert.type ?? "Alert"}
              subLabel={style.subLabel}
              headerBg={style.headerBg}
              icon={style.icon}
              iconColor={style.iconColor}
              text={alert.explanation ?? "—"}
              primaryAction={style.primaryAction}
              onDismiss={() => handleDismiss(alert._idx)}
              onFix={() => handleFix(alert)}
              onHighlight={onHighlight}
              disabled={isFixing}
            />
          );
        })}
        {count === 0 && (
          <p className="text-xs text-[#888]">
            No alerts. Keep writing to get real-time consistency feedback.
          </p>
        )}
      </div>

      <div className="mt-auto space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2e2e2e]">
          Engagement Heatmap
        </h3>
        <div className="flex h-24 items-end justify-between gap-1 rounded-xl border border-[#e8e8e0] bg-white p-4 shadow-sm">
          {[40, 65, 45, 80, 55, 70, 60, 90, 75, 85].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-[#ced3ff]"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <Button className="w-full gap-2 rounded-xl bg-[#ced3ff] text-[#4a4a7a] transition-colors hover:bg-[#b8bff5]">
          <Square className="h-3.5 w-3.5" />
          FOCUS MODE
        </Button>
      </div>

      {/* Suggestion Dialog */}
      {suggestionDialog && (
        <SuggestionDialog
          open={!!suggestionDialog}
          onOpenChange={(open) => {
            if (!open) setSuggestionDialog(null);
          }}
          originalText={suggestionDialog.originalText}
          suggestedText={suggestionDialog.suggestedText}
          explanation={suggestionDialog.explanation}
          alertType={suggestionDialog.alertType}
          onApply={handleApplySuggestion}
        />
      )}
    </aside>
  );
}

export { AIInsightsSidebar };
