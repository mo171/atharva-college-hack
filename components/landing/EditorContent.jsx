import { ConsistencyAlert } from "./ConsistencyAlert";
import { cn } from "@/lib/utils";

const DEFAULT_CHAPTER = {
  title: "Chapter Four: The Silent Meridian",
  text: "The courtyard lay in shadow as Elara approached the northern gate. Kaelen mentioned the gates would open at dawn, but something in his tone had made her uneasy.",
  highlightPhrase: "Kaelen mentioned the gates would open at dawn",
};

function EditorContent({
  chapter = DEFAULT_CHAPTER,
  className,
  ...props
}) {
  return (
    <div
      className={cn("flex flex-1 flex-col gap-6 overflow-auto p-6", className)}
      {...props}
    >
      <h2 className="text-xl font-bold text-[#1a1a1a]">{chapter.title}</h2>
      <p className="text-[15px] leading-relaxed text-[#4a4a4a]">
        {chapter.text.split(chapter.highlightPhrase)[0]}
        <span className="text-[#5a6fd8] underline decoration-[#ced3ff] decoration-2">
          {chapter.highlightPhrase}
        </span>
        {chapter.text.split(chapter.highlightPhrase)[1]}
      </p>
      <ConsistencyAlert />
    </div>
  );
}

export { EditorContent };
