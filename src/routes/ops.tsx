import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Flag,
  Image,
  LayoutDashboard,
  Palette,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { MwMark } from "@/components/mw-mark";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { t } from "@/lib/i18n/en";
import { noindexHead } from "@/lib/seo";
import { claimOpsAccess, getOpsSession } from "@/lib/server/ops";
import type { OpsSession } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ops")({
  head: () => noindexHead("Admin", "/ops"),
  component: OpsShell,
});

type NavItem = {
  to: "/ops" | "/ops/wallpapers" | "/ops/reports" | "/ops/creators" | "/ops/users" | "/ops/settings";
  label: string;
  exact?: boolean;
  icon: ReactNode;
};

function OpsShell() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [session, setSession] = useState<OpsSession | null>(null);
  const [error, setError] = useState(false);
  const [claiming, setClaiming] = useState(false);

  function load() {
    setError(false);
    void getOpsSession()
      .then(setSession)
      .catch(() => setError(true));
  }

  useEffect(() => {
    if (isPending || !user) return;
    load();
  }, [user, isPending]);

  const nav: NavItem[] = [
    { to: "/ops", label: t.ops.overview, exact: true, icon: <LayoutDashboard className="size-4" /> },
    { to: "/ops/wallpapers", label: t.ops.wallpapers, icon: <Image className="size-4" /> },
    { to: "/ops/reports", label: t.ops.reports, icon: <Flag className="size-4" /> },
    { to: "/ops/creators", label: t.ops.creators, icon: <Palette className="size-4" /> },
    ...(session?.canAdmin
      ? [
          { to: "/ops/users" as const, label: t.ops.users, icon: <Users className="size-4" /> },
          {
            to: "/ops/settings" as const,
            label: t.ops.settings,
            icon: <SlidersHorizontal className="size-4" />,
          },
        ]
      : []),
  ];

  const roleLabel =
    session?.role && session.role in t.ops.roleLabels
      ? t.ops.roleLabels[session.role]
      : session?.role;

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border px-4 py-5 lg:flex">
        <Link to="/ops" className="flex items-center gap-2.5 px-1">
          <MwMark className="size-8 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate font-display text-xl leading-none text-fg">
              {t.ops.title}
            </span>
            <span className="mt-1 block text-xs text-muted">{t.ops.studio}</span>
          </span>
        </Link>
        {session?.canModerate ? (
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {nav.map((item) => {
              const active = item.exact
                ? pathname === item.to || pathname === `${item.to}/`
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-lg px-3 text-sm",
                    active ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : (
          <div className="flex-1" />
        )}
        <div className="border-t border-border pt-4">
          {user ? (
            <p className="truncate px-3 text-sm text-fg">
              {user.displayName ?? user.primaryEmail}
              {session?.canModerate && roleLabel ? (
                <span className="mt-0.5 block text-xs text-muted">{roleLabel}</span>
              ) : null}
            </p>
          ) : null}
          <Link
            to="/app"
            className="mt-2 flex h-11 items-center rounded-lg px-3 text-sm text-muted hover:text-fg"
          >
            {t.ops.backToApp}
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-border lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <MwMark className="size-8 shrink-0" />
              <p className="truncate font-display text-xl text-fg">{t.ops.brand}</p>
            </div>
            <Link to="/app" className="shrink-0 text-sm text-muted hover:text-fg">
              {t.ops.backToApp}
            </Link>
          </div>
          {session?.canModerate ? (
            <nav className="flex gap-1 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {nav.map((item) => {
                const active = item.exact
                  ? pathname === item.to || pathname === `${item.to}/`
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "h-9 shrink-0 rounded-full px-4 text-sm leading-9",
                      active ? "bg-fg text-bg" : "text-muted hover:text-fg",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
          {isPending ? (
            <div className="h-40 animate-pulse rounded-xl bg-elevated" />
          ) : !user ? (
            <EmptyState
              title={t.ops.signIn}
              action={{
                label: t.auth.signIn,
                onClick: () => {
                  void navigate({ to: "/login", search: { next: "/ops" } });
                },
              }}
            />
          ) : error ? (
            <EmptyState title={t.errors.generic} action={{ label: t.errors.retry, onClick: load }} />
          ) : !session ? (
            <div className="h-40 animate-pulse rounded-xl bg-elevated" />
          ) : session.canModerate ? (
            <Outlet />
          ) : session.canClaim ? (
            <div className="mx-auto max-w-md rounded-xl bg-elevated p-6 sm:p-8">
              <MwMark className="size-12" />
              <p className="mt-5 text-xs font-medium tracking-widest text-subtle uppercase">
                {t.ops.studio}
              </p>
              <h1 className="mt-2 font-display text-4xl text-fg">{t.ops.claimTitle}</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t.ops.claimBody}</p>
              <Button
                className="mt-6 w-full"
                disabled={claiming}
                onClick={async () => {
                  setClaiming(true);
                  try {
                    setSession(await claimOpsAccess());
                  } catch {
                    setError(true);
                  } finally {
                    setClaiming(false);
                  }
                }}
              >
                {t.ops.claim}
              </Button>
            </div>
          ) : (
            <EmptyState
              title={t.ops.denied}
              action={{
                label: t.ops.backToApp,
                onClick: () => {
                  void navigate({ to: "/app" });
                },
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
