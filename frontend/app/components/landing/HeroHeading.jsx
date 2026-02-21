import { cn } from "@/lib/utils";

function HeroHeading({
  children,
  highlightText,
  highlightClassName = "text-[#5a5fd8] font-semibold italic",
  className,
  as: Comp = "h1",
  ...props
}) {
  if (!highlightText || !children) {
    return (
      <Comp
        className={cn(
          "text-4xl font-bold leading-tight tracking-tight text-[#1a1a1a] sm:text-5xl md:text-6xl",
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
        "text-4xl font-bold leading-tight tracking-tight text-[#1a1a1a] sm:text-5xl md:text-6xl",
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
