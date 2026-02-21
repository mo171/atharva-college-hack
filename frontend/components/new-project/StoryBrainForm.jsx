"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FoundationSection } from "./FoundationSection";
import { KeyCastSection } from "./KeyCastSection";
import { AtmosphereSection } from "./AtmosphereSection";
import { WorldDescriptionSection } from "./WorldDescriptionSection";
import { cn } from "@/lib/utils";

function StoryBrainForm({ className, ...props }) {
  const [storyTitle, setStoryTitle] = useState("");
  const [genre, setGenre] = useState("Cyberpunk Noir");
  const [characters, setCharacters] = useState([
    { name: "Commander Vane", variant: "purple" },
    { name: "Aria-7 (Android)", variant: "green" },
  ]);
  const [characterInput, setCharacterInput] = useState("");
  const [toneValues, setToneValues] = useState([75, 25, 65]);
  const [worldDescription, setWorldDescription] = useState("");

  const handleAddCharacter = () => {
    const trimmed = characterInput.trim();
    if (trimmed) {
      setCharacters((prev) => [...prev, { name: trimmed, variant: "purple" }]);
      setCharacterInput("");
    }
  };

  const handleRemoveCharacter = (index) => {
    setCharacters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCharacter();
    }
  };

  return (
    <form className={cn("flex flex-col gap-8", className)} {...props}>
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">
          Create Your Story Brain
        </h1>
        <p className="mt-1 text-sm text-[#666]">
          Initialize the narrative engine with your core foundations.
        </p>
        <div className="mt-4 flex items-end gap-4">
          <Progress
            value={45}
            className="h-2 flex-1 rounded-full bg-[#e8e8e0] [&>div]:bg-[#ced3ff]"
          />
          <div className="text-right">
            <p className="text-lg font-bold text-[#4a3f6a]">45%</p>
            <p className="text-xs text-[#888]">CHARGED</p>
          </div>
        </div>
      </div>

      <FoundationSection
        storyTitle={storyTitle}
        genre={genre}
        onStoryTitleChange={setStoryTitle}
        onGenreChange={setGenre}
      />

      <KeyCastSection
        characters={characters}
        onAddCharacter={handleAddCharacter}
        onRemoveCharacter={handleRemoveCharacter}
        inputValue={characterInput}
        onInputChange={setCharacterInput}
        onInputKeyDown={handleKeyDown}
      />

      <AtmosphereSection
        values={toneValues}
        onValueChange={setToneValues}
      />

      <WorldDescriptionSection
        value={worldDescription}
        onChange={setWorldDescription}
      />

      <div className="space-y-2">
        <Link href="/editor">
          <Button
            type="button"
            className="h-14 w-full gap-2 rounded-xl bg-[#ced3ff] py-6 text-base font-medium text-[#4a4a7a] shadow-md shadow-[#ced3ff]/30 transition-colors hover:bg-[#b8bff5]"
          >
            Initialize Brain & Start Writing
            <Zap className="h-4 w-4" />
          </Button>
        </Link>
        <p className="text-center text-xs text-[#888]">
          Takes approx. 12 seconds to generate synapses.
        </p>
      </div>
    </form>
  );
}

export { StoryBrainForm };
