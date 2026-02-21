import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { cn } from "@/lib/utils";

function ProjectCardProject({
  title,
  genre,
  lastEdited,
  consistency,
  imageSrc,
  imageAlt,
  href = "#",
  className,
  ...props
}) {
  return (
    <Link href={href}>
      <Card
        className={cn(
          "group flex flex-col h-full overflow-hidden rounded-2xl border border-white/40 bg-white/70 backdrop-blur-md shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5",
          className,
        )}
        {...props}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <Badge
            className="absolute bottom-3 left-3 border-0 bg-white/90 backdrop-blur-md text-[9px] font-bold tracking-[0.1em] text-slate-800 px-2.5 py-1 uppercase"
            variant="secondary"
          >
            {genre}
          </Badge>
        </div>
        <CardContent className="flex flex-1 flex-col justify-between p-5">
          <div className="space-y-4">
            <div>
              <h3 className="font-playfair text-xl font-medium tracking-tight text-slate-900 line-clamp-1 mb-1">{title}</h3>
              <p className="text-[11px] text-slate-500 font-medium">{lastEdited}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Consistency
                </p>
                <p className="text-xs font-bold text-slate-700">
                  {consistency}%
                </p>
              </div>
              <div className="relative h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-800 transition-all duration-1000 ease-out"
                  style={{ width: `${consistency}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-50">
            <span className="text-[10px] text-slate-400 font-medium">Open Manuscript</span>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProjectCardNewManuscript({
  href = "/new-project",
  className,
  ...props
}) {
  return (
    <Link href={href}>
      <Card
        className={cn(
          "group flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 transition-all duration-300 hover:border-slate-900 hover:bg-white hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5",
          className,
        )}
        {...props}
      >
        <div className="relative aspect-[4/3] w-full flex items-center justify-center bg-slate-100 transition-colors duration-300 group-hover:bg-slate-50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white text-slate-400">
            <Plus className="h-6 w-6" />
          </div>
        </div>
        <CardContent className="flex flex-1 flex-col items-center justify-center p-5 text-center">
          <h3 className="font-playfair text-lg font-medium text-slate-900 mb-1">
            Start New Manuscript
          </h3>
          <p className="text-[11px] text-slate-500 max-w-[160px]">
            Begin your next masterpiece with specialized AI assistance
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProjectCard({ variant = "project", ...props }) {
  if (variant === "newManuscript") {
    return <ProjectCardNewManuscript {...props} />;
  }
  return <ProjectCardProject {...props} />;
}

export { ProjectCard, ProjectCardProject, ProjectCardNewManuscript };
