import { Cloud, Bell, Search } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";

function StudioHeader({ className, ...props }) {
  return (
    <header
      className={cn(
        "flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-6",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="font-playfair text-3xl font-medium tracking-tight text-slate-900">
          Studio Gallery
        </h1>
        <div className="flex items-center gap-2">
          <Badge
            className="w-fit gap-1.5 rounded-full border-0 bg-slate-100 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-600 uppercase"
            variant="secondary"
          >
            <Cloud className="h-3 w-3" />
            Cloud Synchronized
          </Badge>
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-1 sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search manuscripts..."
            className="h-10 pl-10 border-slate-100 bg-white/50 backdrop-blur-sm focus:bg-white transition-all text-sm rounded-xl placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm transition-all hover:border-slate-200 hover:text-slate-900 text-slate-500"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <div className="h-10 w-10 rounded-full border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-200 shadow-sm flex items-center justify-center p-1 cursor-pointer">
            <div className="h-full w-full rounded-full bg-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
}

export { StudioHeader };
