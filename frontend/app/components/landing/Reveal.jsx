"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const Reveal = ({
    children,
    width = "fit-content",
    className,
    delay = 0,
    duration = 0.5,
    initialY = 20,
    initialX = 0,
    threshold = 0.1,
    once = false,
    mode = "slide", // "slide" or "pop"
}) => {
    const ref = useRef(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                } else if (!once) {
                    setIsInView(false);
                }
            },
            { threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [once, threshold]);

    return (
        <div
            ref={ref}
            style={{
                width,
                transition: `opacity ${duration}s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s, transform ${duration}s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s`,
                opacity: isInView ? 1 : 0,
                transform: isInView
                    ? "none"
                    : mode === "pop"
                        ? "scale(0.8) translateY(20px)"
                        : `translateX(${initialX}px) translateY(${initialY}px)`,
            }}
            className={cn("relative", className)}
        >
            {children}
        </div>
    );
};
