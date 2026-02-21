import Link from "next/link";
import { FolderOpen, Users, Archive, Settings, Plus } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { StudioLogo } from "./StudioLogo";
import { SidebarNavItem } from "./SidebarNavItem";
import { StorageSection } from "./StorageSection";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/start-writing",
    label: "Projects",
    icon: FolderOpen,
    isActive: true,
  },
  {
    href: "/start-writing/shared",
    label: "Shared",
    icon: Users,
    isActive: false,
  },
  {
    href: "/start-writing/archive",
    label: "Archive",
    icon: Archive,
    isActive: false,
  },
  {
    href: "/start-writing/settings",
    label: "Settings",
    icon: Settings,
    isActive: false,
  },
];

function StudioSidebar({ className, ...props }) {
  return (
    <aside
      className={cn(
        "flex w-64 shrink-0 flex-col gap-10 border-r border-slate-200/60 bg-white/40 backdrop-blur-xl p-8 shadow-[1px_0_10px_rgba(0,0,0,0.02)] transition-all duration-300",
        className,
      )}
      {...props}
    >
      <div className="px-2">
        <StudioLogo />
      </div>

      <div className="flex flex-col gap-10">
        <nav className="flex flex-col gap-2">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Navigation
          </p>
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={item.isActive}
            />
          ))}
        </nav>

        <div className="space-y-6">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Workspace
          </p>
          <StorageSection used="1.2GB" total="2.0GB" value={60} />
          <Link href="/new-project">
            <Button
              className="w-full gap-2 rounded-xl bg-slate-900 text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-slate-800 active:scale-95"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-auto px-2">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100/50 border border-slate-200/50">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 shadow-sm" />
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-slate-900 truncate">Author Profile</span>
            <span className="text-[10px] text-slate-500 font-medium truncate">Premium Member</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export { StudioSidebar };
