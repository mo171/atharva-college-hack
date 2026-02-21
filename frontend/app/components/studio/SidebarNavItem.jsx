import Link from "next/link";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const sidebarNavItemVariants = cva(
  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300",
  {
    variants: {
      variant: {
        default: "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 hover:translate-x-1",
        active: "bg-slate-900 text-white shadow-sm shadow-slate-200",
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
