import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function CTAButtons({
  primaryLabel = "Start Writing Free",
  primaryHref = "/start-writing",
  secondaryLabel = "Watch Demo",
  secondaryHref = "#demo",
  className,
  ...props
}) {
  return (
    <div
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-center", className)}
      {...props}
    >
      <Link href={primaryHref}>
        <Button
          className="h-12 rounded-xl bg-[#ced3ff] px-6 text-base font-medium text-[#4a4a7a] shadow-md shadow-[#ced3ff]/30 transition-colors hover:bg-[#b8bff5]"
          size="lg"
        >
          {primaryLabel}
        </Button>
      </Link>
      <Link href={secondaryHref}>
        <Button
          variant="outline"
          className="h-12 rounded-xl border-[#e0dfd8] bg-white/80 px-6 text-base font-medium text-[#2e2e2e] shadow-sm transition-colors hover:border-[#ced3ff] hover:bg-[#f8f7ff]"
          size="lg"
        >
          {secondaryLabel}
        </Button>
      </Link>
    </div>
  );
}

export { CTAButtons };
