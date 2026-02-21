import { Globe } from "lucide-react";

import { FormSection } from "./FormSection";
import { cn } from "@/lib/utils";

function WorldDescriptionSection({
  value = "",
  onChange,
  className,
  ...props
}) {
  return (
    <FormSection
      number={4}
      title="World Description"
      icon={Globe}
      className={cn(className)}
      {...props}
    >
      <textarea
        placeholder="Describe the setting, history, and physical laws of your world..."
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        rows={6}
        className={cn(
          "w-full rounded-xl border border-[#e8e8e0] bg-white px-3 py-2 text-sm shadow-sm",
          "placeholder:text-[#888] focus:outline-none focus:ring-2 focus:ring-[#ced3ff]",
          "resize-y min-h-[120px]"
        )}
      />
    </FormSection>
  );
}

export { WorldDescriptionSection };
