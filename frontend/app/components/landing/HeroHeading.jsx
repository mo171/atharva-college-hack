"use client";

import { cn } from "@/lib/utils";

function HeroHeading({
  children,
  highlightText,
  highlightClassName = "text-[#9d8df1] italic",
  className,
  as: Comp = "h1",
  ...props
}) {
  if (!highlightText || !children) {
    return (
      <Comp
        className={cn(
          "font-playfair text-5xl font-bold leading-[1.1] tracking-tight text-[#1a1a1a] sm:text-7xl md:text-8xl",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  const parts = String(children).split(new RegExp(`(${highlightText})`, "i"));
  const highlightIndex = parts.findIndex(
    (p) => p.toLowerCase() === highlightText.toLowerCase()
  );

  return (
    <Comp
      className={cn(
        "font-playfair text-5xl font-bold leading-[1.1] tracking-tight text-[#1a1a1a] sm:text-7xl md:text-8xl",
        className
      )}
      {...props}
    >
      {parts.map((part, i) =>
        i === highlightIndex ? (
          <span key={i} className={highlightClassName}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </Comp>
  );
}

export { HeroHeading };
