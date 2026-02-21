import { Cloud, Bell, Search } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";

function StudioHeader({ className, ...props }) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">
          Your Creative Studio
        </h1>
        <Badge
          className="w-fit gap-1.5 rounded-lg border-0 bg-[#ced3ff] px-3 py-1 text-xs font-medium text-[#4a4a7a]"
          variant="secondary"
        >
          <Cloud className="h-3.5 w-3.5" />
          PRO CLOUD SYNC ACTIVE
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" />
          <Input placeholder="Search manuscripts..." className="h-9 pl-9" />
        </div>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e8e8e0] bg-white shadow-sm transition-colors hover:bg-[#f8f7ff]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-[#666]" />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e8e8e0] bg-[#e8ecff] shadow-sm"
          aria-label="User menu"
        >
          <div className="h-4 w-4 rounded-full bg-[#888]" />
        </button>
      </div>
    </header>
  );
}

export { StudioHeader };
