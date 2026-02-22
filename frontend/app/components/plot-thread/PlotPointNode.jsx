"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import { cn } from "@/lib/utils";
import { User, Zap, Search, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

const EVENT_TYPE_ICONS = {
  ACTION: Zap,
  DIALOGUE: User,
  DISCOVERY: Search,
  CONFLICT: AlertCircle,
  RESOLUTION: CheckCircle,
  TRANSITION: ArrowRight,
  OTHER: Zap,
};

const EVENT_TYPE_COLORS = {
  ACTION: "bg-blue-100 border-blue-300 text-blue-800",
  DIALOGUE: "bg-purple-100 border-purple-300 text-purple-800",
  DISCOVERY: "bg-green-100 border-green-300 text-green-800",
  CONFLICT: "bg-red-100 border-red-300 text-red-800",
  RESOLUTION: "bg-emerald-100 border-emerald-300 text-emerald-800",
  TRANSITION: "bg-gray-100 border-gray-300 text-gray-800",
  OTHER: "bg-slate-100 border-slate-300 text-slate-800",
};

function PlotPointNode({ data, selected }) {
  const eventType = data.event_type || "OTHER";
  const Icon = EVENT_TYPE_ICONS[eventType] || Zap;
  const colorClass = EVENT_TYPE_COLORS[eventType] || EVENT_TYPE_COLORS.OTHER;
  const characters = data.characters || [];
  const threadColor = data.threadColor || "#5a5fd8";

  return (
    <div
      className={cn(
        "rounded-lg border-2 shadow-md bg-white min-w-[200px] max-w-[250px]",
        selected ? "ring-2 ring-[#5a5fd8] ring-offset-2" : "",
        colorClass
      )}
      style={{ borderTopColor: threadColor, borderTopWidth: "4px" }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{data.title}</div>
            {data.description && (
              <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                {data.description}
              </div>
            )}
          </div>
        </div>

        {characters.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Characters:</div>
            <div className="flex flex-wrap gap-1">
              {characters.slice(0, 3).map((char, idx) => (
                <span
                  key={idx}
                  className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700"
                >
                  {char.entities?.name || "Unknown"}
                </span>
              ))}
              {characters.length > 3 && (
                <span className="text-xs text-gray-500">+{characters.length - 3}</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-2 text-xs text-gray-400">
          #{data.timeline_position}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

const PlotPointNodeMemo = memo(PlotPointNode);
export { PlotPointNodeMemo as PlotPointNode };
