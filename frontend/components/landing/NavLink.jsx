import Link from "next/link";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const navLinkVariants = cva(
  "text-sm font-medium transition-colors hover:text-[#5a6fd8]",
  {
    variants: {
      variant: {
        default: "text-[#4a4a4a]",
        highlighted:
          "rounded-lg bg-[#ced3ff]/40 px-4 py-2 text-[#2e2e2e] hover:bg-[#ced3ff]/60",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function NavLink({ href, children, variant = "default", className, ...props }) {
  return (
    <Link
      href={href}
      className={cn(navLinkVariants({ variant }), className)}
      {...props}
    >
      {children}
    </Link>
  );
}

export { NavLink, navLinkVariants };
