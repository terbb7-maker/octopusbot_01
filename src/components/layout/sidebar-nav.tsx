"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavigation } from "@/config/navigation";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  onNavigate?: () => void;
};

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-1">
      {dashboardNavigation.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={`${item.href}-${item.title}`}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "border border-primary/25 bg-primary/12 font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "text-muted-foreground hover:bg-white/[0.055] hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.title}
          </Link>
        );
      })}
    </div>
  );
}
