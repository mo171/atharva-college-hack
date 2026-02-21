"use client";

import { useState } from "react";
import { AlertTriangle, Wand2, Target, Square } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

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
};

const DEFAULT_STYLE = {
  subLabel: "Suggestion",
  headerBg: "bg-[#e8ecff]/60",
  icon: AlertTriangle,
  iconColor: "text-[#5a5fd8]",
  primaryAction: "REVIEW",
};

function InsightCard({
  type,
  subLabel,
  headerBg,
  icon: Icon,
  iconColor,
  text,
  primaryAction,
  onDismiss,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8e8e0] bg-white shadow-md shadow-black/5">
      <div className={cn("px-4 py-3", headerBg)}>
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", iconColor)} />
          <span className="font-semibold text-[#2e2e2e]">{type}</span>
        </div>
        <p className="mt-0.5 text-xs text-[#666]">{subLabel}</p>
      </div>
      <div className="p-4">
        <p className="text-sm leading-relaxed text-[#2e2e2e]">{text}</p>
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onDismiss}
          >
            DISMISS
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-[#ced3ff] text-[#4a4a7a] transition-colors hover:bg-[#b8bff5]"
          >
            {primaryAction}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AIInsightsSidebar({ alerts = [], className, ...props }) {
  const [dismissed, setDismissed] = useState(new Set());

  const visibleAlerts = alerts
    .map((a, i) => ({ ...a, _idx: i }))
    .filter((a) => !dismissed.has(a._idx));
  const count = visibleAlerts.length;

  const handleDismiss = (idx) => {
    setDismissed((prev) => new Set([...prev, idx]));
  };

  return (
    <aside
      className={cn(
        "custom-scrollbar flex w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l border-[#e8e8e0] bg-[#f8f7ff] p-4",
        className,
      )}
      {...props}
    >
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#2e2e2e]">
          AI Insights
        </h2>
        <p className="mt-1 text-xs text-[#888]">
          {count} active alert{count !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-4">
        {visibleAlerts.map((alert) => {
          const style = ALERT_STYLES[alert.type] ?? DEFAULT_STYLE;
          return (
            <InsightCard
              key={`${alert.type}-${alert._idx}-${(alert.explanation || "").slice(0, 20)}`}
              type={alert.type ?? "Alert"}
              subLabel={style.subLabel}
              headerBg={style.headerBg}
              icon={style.icon}
              iconColor={style.iconColor}
              text={alert.explanation ?? "—"}
              primaryAction={style.primaryAction}
              onDismiss={() => handleDismiss(alert._idx)}
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
    </aside>
  );
}

export { AIInsightsSidebar };
