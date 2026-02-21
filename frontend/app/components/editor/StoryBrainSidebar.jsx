"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  MapPin,
  GitBranch,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { refreshCharacterSummary } from "@/lib/api";

const sidebarItemVariants = cva(
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "text-[#2e2e2e] hover:bg-[#e8ecff]",
        active: "bg-[#e8ecff] text-[#5a5fd8]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const SIDEBAR_ITEMS = [
  { label: "Characters", icon: Users, isActive: true },
  { label: "Timeline", icon: TrendingUp, isActive: false },
  { label: "Locations", icon: MapPin, isActive: false },
  { label: "Plot Threads", icon: GitBranch, isActive: false },
];

function StoryBrainSidebar({
  projectId,
  entities = [],
  activeEntityNames = [],
  recentHistory = [],
  onStoryBrainUpdate,
  className,
  ...props
}) {
  const [refreshingId, setRefreshingId] = useState(null);

  const allCharacters = entities.filter((e) => e.entity_type === "CHARACTER");
  const allLocations = entities.filter((e) => e.entity_type === "LOCATION");

  const hasActiveFilter = activeEntityNames && activeEntityNames.length > 0;

  const characters = hasActiveFilter
    ? allCharacters.filter((c) => activeEntityNames.includes(c.name))
    : allCharacters;

  const locations = hasActiveFilter
    ? allLocations.filter((l) => activeEntityNames.includes(l.name))
    : allLocations;

  const handleRefreshSummary = async (entityId) => {
    if (!projectId || !entityId || !onStoryBrainUpdate) return;
    setRefreshingId(entityId);
    try {
      const { metadata } = await refreshCharacterSummary({
        projectId,
        entityId,
      });
      onStoryBrainUpdate((prev) => ({
        entities: (prev.entities ?? []).map((e) =>
          e.id === entityId ? { ...e, metadata } : e,
        ),
        recentHistory: prev.recentHistory ?? [],
      }));
    } catch (err) {
      console.error("Refresh summary failed:", err);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <aside
      className={cn(
        "custom-scrollbar flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-[#e8e8e0] bg-[#f8f7ff] p-4",
        className,
      )}
      {...props}
    >
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#2e2e2e]">
          Story Brain
        </h2>
        <div className="mt-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#5a5fd8]" />
          <span className="text-xs text-[#5a5fd8]">LIVE</span>
        </div>
      </div>

      <nav className="space-y-1">
        {SIDEBAR_ITEMS.map((item) => (
          <Link
            key={item.label}
            href="#"
            className={sidebarItemVariants({
              variant: item.isActive ? "active" : "default",
            })}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2e2e2e]">
          {hasActiveFilter ? "Active Context" : "Project Overview"}
        </h3>
        <div className="space-y-3">
          {characters.length > 0 &&
            characters.map((char) => (
              <div
                key={char.id}
                className="rounded-xl border border-[#e8e8e0] bg-[#e0ffe3]/60 p-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-wider text-[#666]">
                    Character
                  </p>
                  {projectId && (
                    <button
                      type="button"
                      onClick={() => handleRefreshSummary(char.id)}
                      disabled={refreshingId === char.id}
                      className="rounded p-1 text-[#666] transition-colors hover:bg-[#e8ecff] disabled:opacity-50"
                      aria-label="Refresh summary"
                    >
                      <RefreshCw
                        className={cn(
                          "h-3 w-3",
                          refreshingId === char.id && "animate-spin",
                        )}
                      />
                    </button>
                  )}
                </div>
                <p className="mt-1 font-semibold text-[#2e2e2e]">{char.name}</p>
                <p className="mt-1 line-clamp-3 text-xs text-[#666]">
                  {char.metadata?.persona_summary ||
                    char.metadata?.story_summary ||
                    char.description ||
                    "No summary yet. Keep writing to build character context."}
                </p>
              </div>
            ))}

          {locations.length > 0 &&
            locations.map((loc) => (
              <div
                key={loc.id}
                className="rounded-xl border border-[#e8e8e0] bg-[#f8deff]/40 p-3 shadow-sm"
              >
                <p className="text-[10px] uppercase tracking-wider text-[#666]">
                  Location
                </p>
                <p className="mt-1 font-semibold text-[#2e2e2e]">{loc.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-[#666]">
                  {loc.metadata?.description || loc.description || "—"}
                </p>
              </div>
            ))}

          {characters.length === 0 && locations.length === 0 && (
            <p className="text-xs text-[#888]">
              Add characters and locations by writing in the editor.
            </p>
          )}
        </div>
      </div>

      <Link
        href="#"
        className="mt-auto flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#2e2e2e] transition-colors hover:bg-[#e8ecff]"
      >
        Manuscript Settings
        <ChevronRight className="h-4 w-4" />
      </Link>
    </aside>
  );
}

export { StoryBrainSidebar };
