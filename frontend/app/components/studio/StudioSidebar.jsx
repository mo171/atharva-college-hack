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
        "flex w-60 shrink-0 flex-col gap-8 border-r border-[#e8e8e0] bg-white p-6 shadow-sm",
        className,
      )}
      {...props}
    >
      <StudioLogo />
      <nav className="flex flex-col gap-1">
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
      <div className="mt-auto space-y-6">
        <StorageSection used="1.2GB" total="2.0GB" value={60} />
        <Link href="/new-project">
          <Button
            className="w-full gap-2 rounded-xl bg-[#ced3ff] text-[#4a4a7a] shadow-sm transition-colors hover:bg-[#b8bff5]"
            size="lg"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>
    </aside>
  );
}

export { StudioSidebar };
