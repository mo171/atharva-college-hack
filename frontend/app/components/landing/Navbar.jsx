import Link from "next/link";

import { Logo } from "./Logo";
import { NavLink } from "./NavLink";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "#features", label: "Features" },
  { href: "#solutions", label: "Solutions" },
  { href: "#pricing", label: "Pricing" },
  { href: "#community", label: "Community" },
];

function Navbar({ className, ...props }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-[#e8e8e0] bg-[#fffff2]/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-[#fffff2]/90",
        className,
      )}
      {...props}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <NavLink href="/login" variant="default">
            Log In
          </NavLink>
          <Link href="/start-writing">
            <Button
              className="rounded-lg bg-[#ced3ff] px-4 py-2 text-[#4a4a7a] shadow-sm transition-colors hover:bg-[#b8bff5]"
              variant="ghost"
            >
              Start Writing
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export { Navbar };
