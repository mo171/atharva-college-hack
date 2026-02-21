import Link from "next/link";

import { Logo } from "@/app/components/landing/Logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/start-writing", label: "Dashboard" },
  { href: "/start-writing", label: "Projects" },
  { href: "#", label: "Library" },
];

function NewProjectNavbar({ className, ...props }) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b border-[#e8e8e0] bg-white/95 px-6 shadow-sm backdrop-blur",
        className,
      )}
      {...props}
    >
      <Logo variant="compact" />
      <nav className="flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-sm font-medium text-[#4a4a4a] hover:text-[#1a1a1a]"
          >
            {link.label}
          </Link>
        ))}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8deff] shadow-sm"
          aria-label="User menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8b6b9e"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </nav>
    </header>
  );
}

export { NewProjectNavbar };
