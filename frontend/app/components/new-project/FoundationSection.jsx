import { Sparkles } from "lucide-react";

import { FormSection } from "./FormSection";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { cn } from "@/lib/utils";

const GENRE_OPTIONS = [
  "Cyberpunk Noir",
  "Sci-Fi",
  "Fantasy",
  "Romance",
  "Thriller",
  "Literary Fiction",
  "Historical",
  "Mystery",
];

function FoundationSection({
  storyTitle = "",
  genre = "Cyberpunk Noir",
  onStoryTitleChange,
  onGenreChange,
  className,
  ...props
}) {
  return (
    <FormSection
      number={1}
      title="Foundation"
      icon={Sparkles}
      className={cn(className)}
      {...props}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="story-title" className="text-[#4a4a4a]">
            Story Title
          </Label>
          <Input
            id="story-title"
            placeholder="e.g. The Last Echo of Saturn"
            value={storyTitle}
            onChange={(e) => onStoryTitleChange?.(e.target.value)}
            className="rounded-xl border-[#e8e8e0] bg-white shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="genre" className="text-[#4a4a4a]">
            Genre / Story Type
          </Label>
          <select
            id="genre"
            value={genre}
            onChange={(e) => onGenreChange?.(e.target.value)}
            className="flex h-9 w-full rounded-xl border border-[#e8e8e0] bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#ced3ff]"
          >
            {GENRE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    </FormSection>
  );
}

export { FoundationSection, GENRE_OPTIONS };
