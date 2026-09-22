import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronLeft, ChevronRight, Compass, Heart, Home, User } from "lucide-react";
import { useRef } from "react";
import { DesktopSearch } from "@/components/smart-search";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app", label: t.nav.home, icon: Home, exact: true },
  { to: "/app/explore", label: t.nav.explore, icon: Compass },
  { to: "/app/favorites", label: t.nav.favorites, icon: Heart },
  { to: "/app/profile", label: t.nav.profile, icon: User },
] as const;

function useActivePath() {
  return useRouterState({ select: (s) => s.location.pathname });
}

function isActivePath(pathname: string, item: (typeof items)[number]) {
  return "exact" in item && item.exact
    ? pathname === item.to
    : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

const browseChipClass =
  "shrink-0 rounded-full border border-border bg-elevated/55 px-3.5 py-1.5 text-sm text-muted transition-colors duration-150 hover:bg-surface hover:text-fg";

export function DesktopNav() {
  const pathname = useActivePath();
  const showHomeBrowse = pathname === "/app";
  const browseRef = useRef<HTMLDivElement | null>(null);

  function scrollBrowse(direction: -1 | 1) {
    browseRef.current?.scrollBy({ left: direction * 420, behavior: "smooth" });
  }

  return (
    <nav
      aria-label="Main"
      className="sticky top-0 z-40 hidden border-b border-border/80 bg-bg/90 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-xl lg:block"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6 xl:px-8">
        <Link to="/app" activeOptions={{ exact: true }} className="shrink-0 font-display text-2xl text-fg">
          {brand.name}
        </Link>
        <div className="mx-auto min-w-0 max-w-2xl flex-1">
          <DesktopSearch />
        </div>
        <ul className="flex shrink-0 items-center gap-1.5">
          {items.map((item) => {
            const active = isActivePath(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: "exact" in item && item.exact }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-150 ease-out",
                    active
                      ? "bg-fg text-bg"
                      : "text-muted hover:bg-elevated hover:text-fg",
                  )}
                >
                  <Icon className="size-4" strokeWidth={active ? 2 : 1.7} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          to="/app/notifications"
          aria-label={t.home.notifications}
          className="grid size-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-elevated hover:text-fg"
        >
          <Bell className="size-4.5" strokeWidth={1.7} />
        </Link>
      </div>

      {showHomeBrowse ? (
        <div className="border-t border-border/70">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 xl:px-6">
            <button
              type="button"
              onClick={() => scrollBrowse(-1)}
              aria-label="Scroll browse filters left"
              className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-elevated/70 text-muted transition-colors hover:bg-surface hover:text-fg"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div
              ref={browseRef}
              className="flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <Link to="/app/fresh" className={browseChipClass}>
                Fresh
              </Link>
              <Link to="/app/tablet" className={browseChipClass}>
                iPad &amp; Tablets
              </Link>
              <Link to="/app/explore" search={{ category: "motivational" }} className={browseChipClass}>
                Motivational
              </Link>
              <Link to="/app/explore" search={{ category: "bible-verse" }} className={browseChipClass}>
                Bible Verses
              </Link>
              <Link to="/app/explore" search={{ category: "aesthetic" }} className={browseChipClass}>
                Aesthetic
              </Link>
              <Link to="/app/explore" search={{ category: "amoled" }} className={browseChipClass}>
                AMOLED
              </Link>
              <Link to="/app/explore" search={{ category: "minimal" }} className={browseChipClass}>
                Minimal
              </Link>
              <Link to="/app/explore" search={{ category: "anime" }} className={browseChipClass}>
                Anime
              </Link>
              <Link to="/app/explore" search={{ category: "cars" }} className={browseChipClass}>
                Cars
              </Link>
              <Link to="/app/explore" search={{ category: "nature" }} className={browseChipClass}>
                Nature
              </Link>
              <Link to="/app/explore" search={{ category: "dark" }} className={browseChipClass}>
                Dark
              </Link>
              <Link to="/app/explore" search={{ category: "space" }} className={browseChipClass}>
                Space
              </Link>
            </div>
            <button
              type="button"
              onClick={() => scrollBrowse(1)}
              aria-label="Scroll browse filters right"
              className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-elevated/70 text-muted transition-colors hover:bg-surface hover:text-fg"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </nav>
  );
}

export function BottomNav() {
  const pathname = useActivePath();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {items.map((item) => {
          const active = isActivePath(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                activeOptions={{ exact: "exact" in item && item.exact }}
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
