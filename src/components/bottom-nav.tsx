import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Heart, Home, User } from "lucide-react";
import { t } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app", label: t.nav.home, icon: Home, exact: true },
  { to: "/app/explore", label: t.nav.explore, icon: Compass },
  { to: "/app/favorites", label: t.nav.favorites, icon: Heart },
  { to: "/app/profile", label: t.nav.profile, icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 backdrop-blur-md"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {items.map((item) => {
          const active =
            "exact" in item && item.exact
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-150 ease-out",
                  active ? "text-fg" : "text-muted",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2 : 1.7} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}