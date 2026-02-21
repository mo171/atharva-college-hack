"use client";

import { HeroBadge } from "./HeroBadge";
import { HeroHeading } from "./HeroHeading";
import { CTAButtons } from "./CTAButtons";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

function HeroSection({
  badge = "AI-POWERED NARRATIVE INTELLIGENCE",
  headline = "The editor that thinks alongside you",
  highlightText = "thinks",
  description = "An intelligent writing environment that understands your story, remembers your characters, and guides your narrative in real-time.",
  primaryCta = { label: "Start Writing Free", href: "/signup" },
  secondaryCta = { label: "Watch Demo", href: "#demo" },
  className,
  ...props
}) {
  return (
    <section
      className={cn(
        "flex flex-col items-center gap-8 px-4 py-16 text-center sm:py-20",
        className
      )}
      {...props}
    >
      <Reveal mode="pop" width="100%" className="flex justify-center" delay={0.1}>
        <HeroBadge>{badge}</HeroBadge>
      </Reveal>

      <Reveal mode="pop" width="100%" className="flex flex-col items-center" delay={0.25}>
        <HeroHeading highlightText={highlightText} className="mb-2">
          The editor that thinks
        </HeroHeading>
        <HeroHeading className="mb-6">
          alongside you
        </HeroHeading>
      </Reveal>

      <Reveal mode="pop" width="100%" className="flex justify-center" delay={0.45}>
        <p className="max-w-2xl text-lg leading-relaxed text-[#5a5a5a] sm:text-xl">
          {description}
        </p>
      </Reveal>

      <Reveal mode="pop" width="100%" className="flex justify-center" delay={0.55}>
        <CTAButtons
          primaryLabel={primaryCta.label}
          primaryHref={primaryCta.href}
          secondaryLabel={secondaryCta.label}
          secondaryHref={secondaryCta.href}
        />
      </Reveal>
    </section>
  );
}

export { HeroSection };
