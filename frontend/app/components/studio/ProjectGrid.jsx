import { ProjectCard } from "./ProjectCard";
import { cn } from "@/lib/utils";

const MOCK_PROJECTS = [
  // Recent - 3 projects
  {
    id: "1",
    title: "The Silent Nebula",
    genre: "SCI-FI",
    lastEdited: "Last edited 1 hour ago",
    consistency: 88,
    imageSrc: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=800&q=80",
    imageAlt: "Deep space photography",
    href: "#",
    category: "recent",
  },
  {
    id: "2",
    title: "Midnight in Kyoto",
    genre: "DRAMA",
    lastEdited: "Last edited 2 days ago",
    consistency: 94,
    imageSrc: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    imageAlt: "Kyoto architectural minimal",
    href: "#",
    category: "recent",
  },
  {
    id: "3",
    title: "Shadow of Icarus",
    genre: "THRILLER",
    lastEdited: "Last edited 3 days ago",
    consistency: 76,
    imageSrc: "https://images.unsplash.com/photo-1505144808419-1957a94ca61e?w=800&q=80",
    imageAlt: "Dramatic landscape with shadows",
    href: "#",
    category: "recent",
  },
  // Shared - 2 projects
  {
    id: "4",
    title: "Neon Whisper",
    genre: "ROMANCE",
    lastEdited: "Last edited 1 week ago",
    consistency: 91,
    imageSrc: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80",
    imageAlt: "Cinematic film grain minimal",
    href: "#",
    category: "shared",
  },
  {
    id: "5",
    title: "The Last Frame",
    genre: "MYSTERY",
    lastEdited: "Last edited 2 weeks ago",
    consistency: 82,
    imageSrc: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80",
    imageAlt: "Noir photography vintage camera",
    href: "#",
    category: "shared",
  },
  // Drafts - 1 project
  {
    id: "6",
    title: "Echoes of Time",
    genre: "FANTASY",
    lastEdited: "Started yesterday",
    consistency: 45,
    imageSrc: "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=800&q=80",
    imageAlt: "Minimalist desk with manuscript",
    href: "#",
    category: "drafts",
  },
];

function ProjectGrid({ projects = MOCK_PROJECTS, className, ...props }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
      {...props}
    >
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          variant="project"
          title={project.title}
          genre={project.genre}
          lastEdited={project.lastEdited}
          consistency={project.consistency}
          imageSrc={project.imageSrc}
          imageAlt={project.imageAlt}
          href={project.href}
        />
      ))}
      <ProjectCard variant="newManuscript" />
    </div>
  );
}

export { ProjectGrid, MOCK_PROJECTS };
