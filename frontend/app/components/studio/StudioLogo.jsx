import Link from "next/link";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const studioLogoVariants = cva("flex items-center gap-3", {
  variants: {
    variant: {
      sidebar: "flex-col items-start gap-1",
      default: "gap-3",
    },
  },
  defaultVariants: { variant: "sidebar" },
});

function StudioLogo({ className, variant = "sidebar", ...props }) {
  return (
    <Link
      href="/start-writing"
      className={cn(studioLogoVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-xl bg-slate-900 p-2.5 shadow-sm shadow-slate-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-playfair text-xl font-bold tracking-tight text-slate-900 leading-none">
            Inkwell
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
            Studio
          </span>
        </div>
      </div>
    </Link>
  );
}

export { StudioLogo, studioLogoVariants };
