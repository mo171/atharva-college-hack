"use client";

import { useEffect } from "react";
import { ProjectCard } from "./ProjectCard";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store/projectStore";
import { useAuth } from "@/store/authStore";

function ProjectGrid({ className, ...props }) {
  const { user } = useAuth();
  const { projects, fetchProjects, loading } = useProjectStore();

  useEffect(() => {
    if (user?.id) {
      fetchProjects(user.id);
    }
  }, [user?.id, fetchProjects]);

  if (loading && projects.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ced3ff] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      {...props}
    >
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          variant="project"
          title={project.title}
          genre={project.genre || "GENERAL"}
          lastEdited={
            project.updated_at
              ? `Last edited ${new Date(project.updated_at).toLocaleDateString()}`
              : "New project"
          }
          consistency={85} // Fallback until consistency is implemented
          imageSrc={
            project.image_url ||
            "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=800&q=80"
          }
          imageAlt={project.title}
          href={`/editor?projectId=${project.id}`}
        />
      ))}
      <ProjectCard variant="newManuscript" />
    </div>
  );
}

export { ProjectGrid };
