import { AlertTriangle, Wand2, Target, Square } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

const INSIGHT_CARDS = [
  {
    type: "Inconsistency Alert",
    subLabel: "Spatial Logic",
    headerBg: "bg-[#fff5e1]/80",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    text: "The cellar was described as having a single entrance in Chapter 3. This passage implies multiple possible exits. Consider reconciling the spatial layout.",
    primaryAction: "JUMP TO",
  },
  {
    type: "Clarity Suggestion",
    subLabel: "Word Choice",
    headerBg: "bg-[#f8deff]/60",
    icon: Wand2,
    iconColor: "text-[#5a5fd8]",
    text: "The phrase 'the kind of silence that seemed to listen' is evocative. Consider reinforcing this motif in the following paragraph for stronger atmosphere.",
    primaryAction: "APPLY",
  },
  {
    type: "Tone Alignment",
    subLabel: "Sentiment Shift",
    headerBg: "bg-[#cff8ff]/60",
    icon: Target,
    iconColor: "text-[#1e88e5]",
    text: "The tension dips briefly in the third paragraph. A subtle sensory detail—sound, temperature—could maintain momentum before the final line.",
    primaryAction: "ANALYZE",
  },
];

function InsightCard({
  type,
  subLabel,
  headerBg,
  icon: Icon,
  iconColor,
  text,
  primaryAction,
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
          <Button variant="outline" size="sm" className="flex-1">
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

function AIInsightsSidebar({ className, ...props }) {
  return (
    <aside
      className={cn(
        "flex w-80 shrink-0 flex-col gap-6 border-l border-[#e8e8e0] bg-[#f8f7ff] p-4",
        className,
      )}
      {...props}
    >
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#2e2e2e]">
          AI Insights
        </h2>
        <p className="mt-1 text-xs text-[#888]">3 active alerts</p>
      </div>

      <div className="space-y-4">
        {INSIGHT_CARDS.map((card) => (
          <InsightCard key={card.type} {...card} />
        ))}
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
