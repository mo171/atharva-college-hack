"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

function ToneSlider({
  leftLabel,
  rightLabel,
  value = [50],
  onValueChange,
  className,
  ...props
}) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      <div className="flex items-center justify-between text-xs text-[#666]">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <SliderPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        max={100}
        step={1}
        className="relative flex w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[#e8e8e0]">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-[#ced3ff]" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-[#ced3ff] bg-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ced3ff] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    </div>
  );
}

export { ToneSlider };
