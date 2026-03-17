"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutList, PlusCircle, User } from "lucide-react";
import type { ReactNode } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  emphasized?: boolean;
}

const navItems: NavItem[] = [
  { label: "POLLS", href: "/", icon: <LayoutList className="h-5 w-5" /> },
  { label: "EXPLORE", href: "/explore", icon: <Compass className="h-5 w-5" /> },
  {
    label: "CREATE",
    href: "/create",
    icon: <PlusCircle className="h-7 w-7" />,
    emphasized: true,
  },
  { label: "PROFILE", href: "/profile", icon: <User className="h-5 w-5" /> },
];

export default function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] lg:hidden">
      <ul className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors ${
                  item.emphasized ? "relative -top-1" : ""
                } ${active ? "text-primary" : "text-text-muted hover:text-text-secondary"}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
