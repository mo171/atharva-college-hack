import { ProjectCard } from "./ProjectCard";
import { cn } from "@/lib/utils";

const MOCK_PROJECTS = [
  {
    id: "1",
    title: "The Silent Nebula",
    genre: "SCI-FI",
    lastEdited: "Last edited 1 hour ago",
    consistency: 88,
    imageSrc: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=300&fit=crop",
    imageAlt: "Nebula",
    href: "#",
  },
  {
    id: "2",
    title: "Midnight in Kyoto",
    genre: "DRAMA",
    lastEdited: "Last edited 2 days ago",
    consistency: 94,
    imageSrc: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop",
    imageAlt: "Kyoto neon",
    href: "#",
  },
  {
    id: "3",
    title: "Shadow of Icarus",
    genre: "THRILLER",
    lastEdited: "Last edited 3 days ago",
    consistency: 76,
    imageSrc: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
    imageAlt: "Forest path",
    href: "#",
  },
  {
    id: "4",
    title: "Neon Whisper",
    genre: "ROMANCE",
    lastEdited: "Last edited 1 week ago",
    consistency: 91,
    imageSrc: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=300&fit=crop",
    imageAlt: "Abstract gradient",
    href: "#",
  },
  {
    id: "5",
    title: "The Last Frame",
    genre: "MYSTERY",
    lastEdited: "Last edited 2 weeks ago",
    consistency: 82,
    imageSrc: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop",
    imageAlt: "Vintage camera",
    href: "#",
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
