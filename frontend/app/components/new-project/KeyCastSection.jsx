import { Users } from "lucide-react";

import { FormSection } from "./FormSection";
import { CharacterTag } from "./CharacterTag";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

function KeyCastSection({
  characters = [],
  onAddCharacter,
  onRemoveCharacter,
  inputValue = "",
  onInputChange,
  onInputKeyDown,
  className,
  ...props
}) {
  return (
    <FormSection
      number={2}
      title="Key Cast"
      icon={Users}
      subtitle="Add Characters (Protagonists & NPCs)"
      className={cn(className)}
      {...props}
    >
      <div className="space-y-4">
        {characters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {characters.map((char, i) => (
              <CharacterTag
                key={`${char.name}-${i}`}
                label={char.name}
                variant={char.variant || "purple"}
                onRemove={() => onRemoveCharacter?.(i)}
              />
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddCharacter?.()}
          className="rounded-xl border-[#e0ffe3] bg-transparent text-[#2d5a42] transition-colors hover:bg-[#e0ffe3]"
        >
          + Add name
        </Button>
        <Input
          placeholder="Type a name and press Enter..."
          value={inputValue}
          onChange={(e) => onInputChange?.(e.target.value)}
          onKeyDown={onInputKeyDown}
          className="rounded-xl border-[#e8e8e0] bg-white shadow-sm"
        />
      </div>
    </FormSection>
  );
}

export { KeyCastSection };
