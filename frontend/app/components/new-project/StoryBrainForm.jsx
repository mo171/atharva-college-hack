"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import toast from "react-hot-toast";

import { Progress } from "@/app/components/ui/progress";
import { Button } from "@/app/components/ui/button";
import { FoundationSection } from "./FoundationSection";
import { KeyCastSection } from "./KeyCastSection";
import { AtmosphereSection } from "./AtmosphereSection";
import { StylePrimingSection } from "./StylePrimingSection";
import { WorldDescriptionSection } from "./WorldDescriptionSection";
import { cn } from "@/lib/utils";
import { createStoryBrain, analyzeBehavior } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function StoryBrainForm({ className, ...props }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [storyTitle, setStoryTitle] = useState("");
  const [genre, setGenre] = useState("Cyberpunk Noir");
  const [characters, setCharacters] = useState([
    { name: "Commander Vane", variant: "purple" },
    { name: "Aria-7 (Android)", variant: "green" },
  ]);
  const [characterInput, setCharacterInput] = useState("");
  const [toneValues, setToneValues] = useState([75, 25, 65]);
  const [worldDescription, setWorldDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [styleFile, setStyleFile] = useState(null);
  const [styleAnalysis, setStyleAnalysis] = useState(null);

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

  const deriveTone = (values) => {
    if (!values || values.length < 3) return "Balanced";
    const [whimsical, tone, pace] = values;
    if (tone < 30) return "Dark / Gritty";
    if (tone > 70) return "Light / Hopeful";
    if (whimsical > 70) return "Whimsical";
    if (pace > 70) return "Action Oriented";
    if (pace < 30) return "Poetic / Prose";
    return "Balanced";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!storyTitle.trim()) {
      toast.error("Please enter a story title.");
      return;
    }
    if (characters.length === 0) {
      toast.error("Please add at least one character.");
      return;
    }
    if (!worldDescription.trim()) {
      toast.error("Please describe the world setting.");
      return;
    }

    setIsSubmitting(true);
    try {
      // const userId = user?.id ?? "00000000-0000-0000-0000-000000000000";
      if (!user?.id) {
        toast.error("Please log in before creating a project.");
        return;
      }
      const userId = user.id;
      const { project_id } = await createStoryBrain({
        userId,
        title: storyTitle.trim(),
        genre,
        perspective: "Third Person",
        tone: deriveTone(toneValues),
        characters: characters.map((c) => ({ name: c.name, description: "" })),
        worldSetting: worldDescription.trim(),
      });

      if (styleFile) {
        toast.loading("Analyzing writing style... this may take a moment", {
          id: "style-analysis",
        });
        const res = await analyzeBehavior(project_id, styleFile);
        setStyleAnalysis(res.blueprint);
        toast.success("Style Blueprint generated!", { id: "style-analysis" });
      }

      toast.success("Story Brain initialized!");
      router.push(`/editor?projectId=${project_id}`);
    } catch (err) {
      const msg =
        err.response?.data?.detail ??
        err.message ??
        "Failed to create project.";
      toast.error(typeof msg === "string" ? msg : "Failed to create project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-8", className)}
      onSubmit={handleSubmit}
      {...props}
    >
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

      <AtmosphereSection values={toneValues} onValueChange={setToneValues} />

      <WorldDescriptionSection
        value={worldDescription}
        onChange={setWorldDescription}
      />

      <StylePrimingSection
        file={styleFile}
        onFileChange={setStyleFile}
        analysisResult={styleAnalysis}
      />

      <div className="space-y-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-14 w-full gap-2 rounded-xl bg-[#ced3ff] py-6 text-base font-medium text-[#4a4a7a] shadow-md shadow-[#ced3ff]/30 transition-colors hover:bg-[#b8bff5] disabled:opacity-70"
        >
          {isSubmitting
            ? "Initializing..."
            : "Initialize Brain & Start Writing"}
          <Zap className="h-4 w-4" />
        </Button>
        <p className="text-center text-xs text-[#888]">
          Takes approx. 12 seconds to generate synapses.
        </p>
      </div>
    </form>
  );
}

export { StoryBrainForm };
