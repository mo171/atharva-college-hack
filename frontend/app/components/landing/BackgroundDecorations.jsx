"use client";

import React, { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const FloatingBlob = ({ className, delay = 0, duration = 20, size = "h-96 w-96" }) => (
  <div
    className={cn(
      "pointer-events-none absolute rounded-full mix-blend-multiply filter blur-3xl opacity-20 transition-all duration-1000",
      size,
      className
    )}
    style={{
      animation: `blob-move ${duration}s infinite alternate ease-in-out`,
      animationDelay: `${delay}s`,
    }}
  />
);

const Particle = ({ style }) => (
  <div
    className="absolute h-1.5 w-1.5 rounded-full bg-slate-400"
    style={{
      ...style,
      animation: `particle-float 20s linear infinite`,
    }}
  />
);

export const BackgroundDecorations = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 25 }).map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * -20}s`,
      opacity: 0.15 + Math.random() * 0.2,
      scale: 0.5 + Math.random(),
    }));
  }, [mounted]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none bg-[#fffff2]">
      {/* Dynamic Mesh Gradients / Blobs */}
      <FloatingBlob
        className="bg-purple-200 -left-20 -top-20"
        duration={18}
        size="h-[500px] w-[500px]"
      />
      <FloatingBlob
        className="bg-cyan-100 -right-20 top-1/4"
        delay={-5}
        duration={25}
        size="h-[600px] w-[600px]"
      />
      <FloatingBlob
        className="bg-pink-100 left-1/4 -bottom-20"
        delay={-2}
        duration={22}
        size="h-[550px] w-[550px]"
      />
      <FloatingBlob
        className="bg-blue-100 bottom-1/4 right-[10%]"
        delay={-8}
        duration={30}
        size="h-[450px] w-[450px]"
      />

      {/* Extra Subtle Center Glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-white opacity-40 blur-[120px]" />

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {particles.map((p, i) => (
          <Particle key={i} style={p} />
        ))}
      </div>

      {/* Noise Texture Overlay - Slightly more visible */}
      <div className="absolute inset-0 opacity-[0.05] contrast-150 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <style jsx global>{`
        @keyframes blob-move {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(100px, 50px) scale(1.1) rotate(15deg);
          }
          66% {
            transform: translate(-50px, 100px) scale(0.9) rotate(-15deg);
          }
          100% {
            transform: translate(50px, -50px) scale(1.05) rotate(5deg);
          }
        }

        @keyframes particle-float {
          0% {
            transform: translateY(110vh) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: var(--p-opacity, 0.3);
          }
          90% {
            opacity: var(--p-opacity, 0.3);
          }
          100% {
            transform: translateY(-10vh) translateX(40px) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
