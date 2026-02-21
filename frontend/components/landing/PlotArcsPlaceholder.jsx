import { BarChart3 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function PlotArcsPlaceholder({ className, ...props }) {
  return (
    <Card
      className={cn(
        "flex min-h-[120px] items-center justify-center rounded-xl border-2 border-dashed border-[#e8e8e0] bg-[#f8f7ff]/60 shadow-sm",
        className
      )}
      {...props}
    >
      <CardContent className="flex flex-col items-center justify-center gap-2 p-6">
        <BarChart3 className="h-8 w-8 text-[#b0b0b0]" />
        <span className="text-xs text-[#888]">Plot arcs visualization</span>
      </CardContent>
    </Card>
  );
}

export { PlotArcsPlaceholder };
