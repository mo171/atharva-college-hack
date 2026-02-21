import { Palette } from "lucide-react";

import { FormSection } from "./FormSection";
import { ToneSlider } from "./ToneSlider";
import { cn } from "@/lib/utils";

const TONE_SLIDERS = [
  { id: "whimsical", left: "WHIMSICAL", right: "SERIOUS", defaultVal: 75 },
  { id: "tone", left: "DARK / GRITTY", right: "LIGHT / HOPEFUL", defaultVal: 25 },
  { id: "pace", left: "ACTION ORIENTED", right: "POETIC / PROSE", defaultVal: 65 },
];

function AtmosphereSection({
  values = [75, 25, 65],
  onValueChange,
  className,
  ...props
}) {
  return (
    <FormSection
      number={3}
      title="Atmosphere & Tone"
      icon={Palette}
      className={cn(className)}
      {...props}
    >
      <div className="space-y-6">
        {TONE_SLIDERS.map((slider, i) => (
          <ToneSlider
            key={slider.id}
            leftLabel={slider.left}
            rightLabel={slider.right}
            value={[values[i] ?? slider.defaultVal]}
            onValueChange={(v) => {
              const next = [...values];
              next[i] = v[0];
              onValueChange?.(next);
            }}
          />
        ))}
      </div>
    </FormSection>
  );
}

export { AtmosphereSection, TONE_SLIDERS };
