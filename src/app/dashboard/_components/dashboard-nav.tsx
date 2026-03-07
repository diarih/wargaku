"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Users } from "lucide-react";

import { cn } from "~/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/kk", label: "Kartu Keluarga", icon: Users },
  { href: "/dashboard/pencarian", label: "Pencarian", icon: Search },
] as const;

type DashboardNavProps = {
  orientation: "horizontal" | "vertical";
};

function isActivePath(
  pathname: string,
  href: (typeof navItems)[number]["href"],
) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav({ orientation }: DashboardNavProps) {
  const pathname = usePathname();
  const isVertical = orientation === "vertical";

  return (
    <>
      {navItems.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-sm font-medium transition-colors",
              isVertical ? "w-full justify-start" : "justify-center",
              active
                ? "bg-primary/12 text-foreground ring-primary/25 ring-1"
                : "hover:bg-muted",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
