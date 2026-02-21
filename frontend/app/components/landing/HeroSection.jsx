import { HeroBadge } from "./HeroBadge";
import { HeroHeading } from "./HeroHeading";
import { CTAButtons } from "./CTAButtons";
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
      <HeroBadge>{badge}</HeroBadge>
      <HeroHeading highlightText={highlightText}>{headline}</HeroHeading>
      <p className="max-w-2xl text-lg leading-relaxed text-[#5a5a5a]">
        {description}
      </p>
      <CTAButtons
        primaryLabel={primaryCta.label}
        primaryHref={primaryCta.href}
        secondaryLabel={secondaryCta.label}
        secondaryHref={secondaryCta.href}
      />
    </section>
  );
}

export { HeroSection };
