import { CharacterItem } from "./CharacterItem";
import { PlotArcsPlaceholder } from "./PlotArcsPlaceholder";
import { cn } from "@/lib/utils";

const DEFAULT_CHARACTERS = [
  { name: "Elara Vance", isActive: true },
  { name: "Kaelen Thorne", isActive: false },
];

function EditorSidebar({
  characters = DEFAULT_CHARACTERS,
  className,
  ...props
}) {
  return (
    <aside
      className={cn(
        "flex w-56 shrink-0 flex-col gap-6 border-r border-[#e8e8e0] bg-[#f8f7ff] p-4",
        className
      )}
      {...props}
    >
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#888]">
          Characters
        </h3>
        <div className="space-y-1">
          {characters.map((char) => (
            <CharacterItem
              key={char.name}
              name={char.name}
              isActive={char.isActive}
            />
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#888]">
          Plot Arcs
        </h3>
        <PlotArcsPlaceholder />
      </section>
    </aside>
  );
}

export { EditorSidebar };
