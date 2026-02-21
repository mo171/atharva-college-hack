import { cva } from "class-variance-authority";
import { User } from "lucide-react";

import { cn } from "@/lib/utils";

const characterItemVariants = cva(
  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer",
  {
    variants: {
      variant: {
        default: "text-[#4a4a4a] hover:bg-[#e8ecff]",
        active: "bg-[#e8ecff] text-[#5a5fd8]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function CharacterItem({
  name,
  isActive = false,
  icon: Icon = User,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        characterItemVariants({ variant: isActive ? "active" : "default" }),
        className
      )}
      {...props}
    >
      <Icon className="h-4 w-4 shrink-0 text-[#5a5fd8]" />
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}

export { CharacterItem, characterItemVariants };
