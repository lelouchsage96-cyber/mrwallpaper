import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { brand } from "@/lib/brand";
import { noindexHead } from "@/lib/seo";
import { ensureProfile, getAppConfig } from "@/lib/server/api";
import { t } from "@/lib/i18n/en";

export const Route = createFileRoute("/app")({
  head: () => noindexHead(`${brand.name} app`, "/app"),
  component: AppShell,
});

function AppShell() {
  const { user, isPending } = useCurrentUserState();
  const [maintenance, setMaintenance] = useState(false);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (isPending || !userId) return;
    void ensureProfile().catch(() => undefined);
  }, [userId, isPending]);

  useEffect(() => {
    void getAppConfig()
      .then((c) => setMaintenance(c.maintenanceMode))
      .catch(() => undefined);
  }, []);

  if (maintenance) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <p className="max-w-sm font-display text-3xl text-fg">{t.maintenance.title}</p>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto max-w-5xl pb-24">
        <Outlet />
        <div className="px-4">
          <SiteFooter />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
