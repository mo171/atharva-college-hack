import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function ConsistencyAlert({
  badges = [
    { label: "auto_awesome", className: "bg-[#cff8ff]/80 text-[#3d7ab8]" },
    {
      label: "Consistency Alert",
      className: "bg-[#ced3ff]/60 text-[#5a5fd8]",
    },
  ],
  message = "In Chapter 2, Kaelen stated the gates only open during the Eclipse, not dawn.",
  highlightText = "Eclipse",
  highlightClassName = "bg-[#ced3ff]/60 px-1 rounded",
  className,
  ...props
}) {
  const parts = message.split(new RegExp(`(${highlightText})`, "i"));
  const highlightIndex = parts.findIndex(
    (p) => p.toLowerCase() === highlightText.toLowerCase()
  );

  return (
    <div
      className={cn(
        "rounded-xl border border-[#e8e8e0] bg-[#f8deff]/30 p-4 shadow-sm",
        className
      )}
      {...props}
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {badges.map((badge, i) => (
          <Badge
            key={i}
            variant="secondary"
            className={cn("border-0 font-medium", badge.className)}
          >
            {badge.label}
          </Badge>
        ))}
      </div>
      <p className="text-sm text-[#4a4a4a]">
        {parts.map((part, i) =>
          i === highlightIndex ? (
            <span key={i} className={highlightClassName}>
              {part}
            </span>
          ) : (
            part
          )
        )}
      </p>
    </div>
  );
}

export { ConsistencyAlert };
