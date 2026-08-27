import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MwMark } from "@/components/mw-mark";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { t } from "@/lib/i18n/en";
import { noindexHead } from "@/lib/seo";

export const Route = createFileRoute("/studio")({
  head: () => noindexHead("Studio", "/studio"),
  component: StudioShell,
});

function StudioShell() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      void navigate({ to: "/login", search: { next: "/studio" } });
    }
  }, [user, isPending, navigate]);

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/studio" className="flex min-w-0 items-center gap-2.5">
            <MwMark className="size-8 shrink-0" />
            <span className="truncate font-display text-xl text-fg">{t.studio.brand}</span>
          </Link>
          <Link to="/app" className="shrink-0 text-sm text-muted hover:text-fg">
            {t.studio.back}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 pb-16">
        {isPending || !user ? (
          <div className="h-40 animate-pulse rounded-xl bg-elevated" />
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
