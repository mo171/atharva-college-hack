import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const tabVariants = cva(
  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        active: "bg-[#ced3ff] text-[#4a4a7a]",
        default: "text-[#666] hover:bg-[#e8ecff]",
        outline: "border border-[#ced3ff] text-[#5a5fd8] hover:bg-[#e8ecff]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const TABS = [
  { id: "recent", label: "Recent", inactiveVariant: "default" },
  { id: "shared", label: "Shared with me", inactiveVariant: "default" },
  { id: "drafts", label: "Drafts", inactiveVariant: "outline" },
];

function ProjectTabs({
  activeTab = "recent",
  onTabChange,
  className,
  ...props
}) {
  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange?.(tab.id)}
          className={tabVariants({
            variant:
              activeTab === tab.id ? "active" : tab.inactiveVariant,
          })}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export { ProjectTabs, tabVariants };
