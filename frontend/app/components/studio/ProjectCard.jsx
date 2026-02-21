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
          "group overflow-hidden rounded-2xl border border-[#e8e8e0] bg-white shadow-md shadow-black/5 transition-all hover:shadow-lg hover:shadow-black/8",
          className,
        )}
        {...props}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f8f7ff]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <Badge
            className="absolute bottom-2 left-2 border-0 bg-black/90 text-xs font-medium text-white"
            variant="secondary"
          >
            {genre}
          </Badge>
        </div>
        <CardContent className="flex flex-col gap-3 p-4">
          <h3 className="font-semibold text-[#1a1a1a]">{title}</h3>
          <p className="text-xs text-[#888]">{lastEdited}</p>
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[#888]">
              Consistency
            </p>
            <p className="mb-1.5 text-sm font-medium text-[#1a1a1a]">
              {consistency}%
            </p>
            <Progress
              value={consistency}
              className="h-1.5 rounded-full bg-[#e8e8e0] [&>div]:bg-[#7cb87c]"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8ecff] text-[#5a5fd8] transition-colors hover:bg-[#ced3ff]"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
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
          "flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e0e0d8] bg-white/60 transition-all hover:border-[#ced3ff] hover:bg-[#f8f7ff]",
          className,
        )}
        {...props}
      >
        <CardContent className="flex flex-col items-center gap-3 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8ecff]">
            <Plus className="h-7 w-7 text-[#5a5fd8]" />
          </div>
          <p className="text-sm font-medium text-[#666]">
            Start New Manuscript
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
