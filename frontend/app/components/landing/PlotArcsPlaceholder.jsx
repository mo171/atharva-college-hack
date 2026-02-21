"use client";

import { BarChart3, Star, Sparkles, Binary } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

function FloatingElement({ children, className, delay = 0, duration = 4 }) {
  return (
    <div
      className={cn("absolute animate-bounce", className)}
      style={{
        animation: `float ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function PlotArcsPlaceholder({ className, ...props }) {
  return (
    <Reveal mode="pop" threshold={0.2} once={false} className="w-full">
      <Card
        className={cn(
          "group relative flex min-h-[160px] items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#f8f7ff]/40 via-[#ffffff]/60 to-[#f0f4ff]/40 backdrop-blur-md transition-all duration-700 hover:shadow-2xl hover:shadow-lavender-200/50",
          "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_3s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          className
        )}
        {...props}
      >
        {/* Floating Background Decorations */}
        <FloatingElement className="left-6 top-6 text-lavender-400/30" duration={5}>
          <Star className="h-6 w-6" />
        </FloatingElement>
        <FloatingElement className="bottom-8 right-10 text-cyan-400/30" delay={1} duration={6}>
          <Binary className="h-5 w-5" />
        </FloatingElement>
        <FloatingElement className="right-12 top-8 text-blue-400/30" delay={2} duration={7}>
          <Sparkles className="h-4 w-4" />
        </FloatingElement>

        <CardContent className="relative z-10 flex flex-col items-center justify-center gap-3 p-8">
          <div className="relative">
            <div className="absolute -inset-4 animate-pulse rounded-full bg-lavender-100/50 blur-xl group-hover:bg-lavender-200/80" />
            <BarChart3 className="relative h-10 w-10 text-[#a0a0f0] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" />
          </div>
          <div className="flex flex-col items-center">
            <span className="bg-gradient-to-r from-[#666] to-[#999] bg-clip-text text-sm font-medium text-transparent">
              Plot Arcs Visualization
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-widest text-[#bbb]">
              Intelligence Layer Active
            </span>
          </div>
        </CardContent>

        <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(-10px) rotate(5deg); }
          }
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}</style>
      </Card>
    </Reveal>
  );
}

export { PlotArcsPlaceholder };
