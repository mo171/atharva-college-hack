import { cva } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const characterTagVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
  {
    variants: {
      variant: {
        purple: "bg-[#f8deff]/60 text-[#4a4a7a]",
        green: "bg-[#e0ffe3]/60 text-[#2d5a42]",
      },
    },
    defaultVariants: { variant: "purple" },
  }
);

function CharacterTag({ label, variant = "purple", onRemove, className, ...props }) {
  return (
    <span
      className={cn(characterTagVariants({ variant }), className)}
      {...props}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-0.5 hover:bg-black/10"
          aria-label={`Remove ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

export { CharacterTag, characterTagVariants };
