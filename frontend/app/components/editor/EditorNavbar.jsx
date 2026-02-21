import Link from "next/link";
import { Search, Cloud, Settings } from "lucide-react";

import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "#", label: "File" },
  { href: "#", label: "Edit" },
  { href: "#", label: "Story Brain", isActive: true },
  { href: "#", label: "Insights" },
];

function EditorNavbar({ className, ...props }) {
  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between border-b border-[#e8e8e0] bg-white px-6 shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ced3ff]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5a5fd8"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <span className="font-semibold text-[#2e2e2e]">Inkwell Core</span>
        </Link>
        <nav className="flex gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "text-sm font-medium text-[#2e2e2e] transition-colors hover:text-[#5a5fd8]",
                item.isActive && "border-b-2 border-[#ced3ff] text-[#5a5fd8]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" />
          <Input placeholder="Search manuscript..." className="h-9 pl-9" />
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#888] transition-colors hover:bg-[#e8ecff]"
          aria-label="Cloud"
        >
          <Cloud className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#888] transition-colors hover:bg-[#e8ecff]"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8ecff]"
          aria-label="User"
        >
          <div className="h-4 w-4 rounded-full bg-[#888]" />
        </button>
      </div>
    </header>
  );
}

export { EditorNavbar };
