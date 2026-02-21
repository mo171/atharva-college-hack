import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const heroBadgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider",
  {
    variants: {
      variant: {
        default:
          "rounded-full border border-[#ced3ff]/50 bg-[#e8ecff] text-[#4a4a7a] shadow-sm",
        muted: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function HeroBadge({ children, variant = "default", className, ...props }) {
  return (
    <span
      className={cn(heroBadgeVariants({ variant }), className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { HeroBadge, heroBadgeVariants };
