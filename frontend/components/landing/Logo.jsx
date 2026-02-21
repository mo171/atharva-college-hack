import Link from "next/link";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const logoVariants = cva("flex items-center gap-3 group", {
  variants: {
    variant: {
      default: "gap-3",
      compact: "gap-2",
    },
  },
  defaultVariants: { variant: "default" },
});

function Logo({ className, variant = "default", ...props }) {
  return (
    <Link
      href="/"
      className={cn(logoVariants({ variant }), className)}
      {...props}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-[#ced3ff] p-2 shadow-md shadow-[#ced3ff]/30",
          variant === "compact" && "p-1.5"
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("text-[#5a5fd8]", variant === "default" ? "h-6 w-6" : "h-4 w-4")}
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </div>
      <span
        className={cn(
          "font-semibold tracking-tight text-[#1a1a1a]",
          variant === "compact" ? "text-base" : "text-xl"
        )}
      >
        Inkwell
      </span>
    </Link>
  );
}

export { Logo, logoVariants };
