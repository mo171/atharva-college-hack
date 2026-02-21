import Link from "next/link";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const sidebarNavItemVariants = cva(
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "text-[#666] hover:bg-[#e8ecff] hover:text-[#4a4a7a]",
        active: "bg-[#e8ecff] text-[#4a4a7a]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isActive = false,
  className,
  ...props
}) {
  return (
    <Link
      href={href}
      className={cn(
        sidebarNavItemVariants({ variant: isActive ? "active" : "default" }),
        className
      )}
      {...props}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            isActive ? "text-[#5a5fd8]" : "text-[#888]"
          )}
        />
      )}
      {label}
    </Link>
  );
}

export { SidebarNavItem, sidebarNavItemVariants };
