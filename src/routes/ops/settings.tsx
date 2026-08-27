import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n/en";
import {
  connectR2Storage,
  getOpsSession,
  getOpsSettings,
  listOpsCategories,
  listOpsCollections,
  updateOpsCategory,
  updateOpsCollection,
  updateOpsSettings,
} from "@/lib/server/ops";
import type { FeatureFlags, OpsCategoryRow, OpsCollectionRow, OpsSettings } from "@/lib/types";
import { AD_NETWORK_META, type AdNetworkConfig } from "@/lib/ads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ops/settings")({ component: OpsSettingsPage });

function Toggle({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg bg-elevated px-4 text-left"
    >
      <span className="text-sm text-fg">{label}</span>
      <span
        className={cn(
          "grid h-7 w-12 place-items-center rounded-full text-xs font-medium",
          on ? "bg-fg text-bg" : "bg-surface text-muted",
        )}
      >
        {on ? t.ops.on : t.ops.off}
      </span>
    </button>
  );
}

function OpsSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<OpsSettings | null>(null);
  const [categories, setCategories] = useState<OpsCategoryRow[]>([]);
  const [collections, setCollections] = useState<OpsCollectionRow[]>([]);
  const [error, setError] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [r2Account, setR2Account] = useState("");
  const [r2Access, setR2Access] = useState("");
  const [r2Secret, setR2Secret] = useState("");
  const [r2Bucket, setR2Bucket] = useState("mrwallpaper");
  const [r2Public, setR2Public] = useState("");
  const [connecting, setConnecting] = useState(false);

  function load() {
    setError(false);
    void getOpsSession()
      .then((s) => {
        if (!s.canAdmin) {
          void navigate({ to: "/ops" });
          return;
        }
        return Promise.all([getOpsSettings(), listOpsCategories(), listOpsCollections()]);
      })
      .then((res) => {
        if (!res) return;
        const [s, c, col] = res;
        setSettings(s);
        setCategories(c.items);
        setCollections(col.items);
        if (s.r2AccountId) setR2Account(s.r2AccountId);
        if (s.r2Bucket) setR2Bucket(s.r2Bucket);
        if (s.r2PublicUrl) setR2Public(s.r2PublicUrl);
      })
      .catch(() => setError(true));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(patch: Parameters<typeof updateOpsSettings>[0]["data"]) {
    const res = await updateOpsSettings({ data: patch });
    setMsg(res.ok ? t.ops.saved : res.message ?? t.ops.failed);
    if (res.ok) {
      const next = await getOpsSettings();
      setSettings(next);
    }
  }

  function patchNet(id: AdNetworkConfig["id"], patch: Partial<AdNetworkConfig>) {
    setSettings((s) =>
      s
        ? {
            ...s,
            mediation: s.mediation.map((n) => (n.id === id ? { ...n, ...patch } : n)),
          }
        : s,
    );
  }

  if (error) return <ErrorState onRetry={load} />;
  if (!settings) return <div className="h-48 animate-pulse rounded-xl bg-elevated" />;

  const flags = settings.featureFlags;
  function setFlag(key: keyof FeatureFlags, value: boolean) {
    const next = { ...flags, [key]: value };
    setSettings((s) => (s ? { ...s, featureFlags: next } : s));
    void save({ featureFlags: next });
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-4xl text-fg">{t.ops.settings}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">{t.ops.settingsHint}</p>
        {msg ? <p className="mt-2 text-sm text-muted">{msg}</p> : null}
      </div>

      <section className="rounded-[16px] bg-elevated px-4 py-4">
        <p className="text-xs tracking-[0.18em] text-muted uppercase">{t.ops.storage}</p>
        <p className="mt-2 font-display text-2xl text-fg">
          {settings.storageBackend === "r2" ? t.ops.storageR2 : t.ops.storageDatabase}
        </p>
        <p className="mt-2 text-sm text-muted">
          {settings.storageBackend === "r2" ? t.ops.storageR2Connected : t.ops.storageR2Hint}
        </p>
        {settings.r2HasKey ? (
          <p className="mt-3 text-xs text-subtle">
            {t.ops.r2Bucket}: {settings.r2Bucket || "mrwallpaper"}
            {settings.r2PublicUrl ? ` · ${settings.r2PublicUrl}` : ""}
          </p>
        ) : null}
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!r2Account.trim() || !r2Access.trim() || !r2Secret.trim() || connecting) return;
            setConnecting(true);
            setMsg(null);
            void connectR2Storage({
              data: {
                accountId: r2Account.trim(),
                accessKeyId: r2Access.trim(),
                secretAccessKey: r2Secret.trim(),
                bucket: r2Bucket.trim() || "mrwallpaper",
                publicUrl: r2Public.trim() || undefined,
              },
            })
              .then((res) => {
                if (!res.ok) {
                  setMsg(res.message ?? t.ops.r2Failed);
                  return;
                }
                setR2Secret("");
                setMsg(t.ops.saved);
                return getOpsSettings().then(setSettings);
              })
              .catch(() => setMsg(t.ops.r2Failed))
              .finally(() => setConnecting(false));
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-xs tracking-[0.14em] text-muted uppercase">{t.ops.r2Account}</span>
            <Input value={r2Account} onChange={(e) => setR2Account(e.target.value)} autoComplete="off" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs tracking-[0.14em] text-muted uppercase">{t.ops.r2Access}</span>
            <Input value={r2Access} onChange={(e) => setR2Access(e.target.value)} autoComplete="off" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs tracking-[0.14em] text-muted uppercase">{t.ops.r2Secret}</span>
            <Input type="password" value={r2Secret} onChange={(e) => setR2Secret(e.target.value)} autoComplete="off" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs tracking-[0.14em] text-muted uppercase">{t.ops.r2Bucket}</span>
            <Input value={r2Bucket} onChange={(e) => setR2Bucket(e.target.value)} autoComplete="off" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs tracking-[0.14em] text-muted uppercase">{t.ops.r2Public}</span>
            <Input
              value={r2Public}
              onChange={(e) => setR2Public(e.target.value)}
              placeholder="https://cdn.yourdomain.com"
              autoComplete="off"
            />
            <span className="mt-1.5 block text-xs text-subtle">{t.ops.r2PublicHint}</span>
          </label>
          <Button type="submit" disabled={connecting || r2Account.trim().length < 8 || r2Secret.trim().length < 8}>
            {connecting ? t.ops.storageConnecting : t.ops.r2Connect}
          </Button>
        </form>
      </section>

      {settings.maintenanceMode ? (
        <p className="rounded-lg bg-warn/15 px-4 py-3 text-sm text-warn">{t.ops.maintenanceOn}</p>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl text-fg">{t.ops.seo}</h2>
        <p className="text-sm text-muted">{t.ops.seoHint}</p>
        <label className="block text-sm text-muted">
          {t.ops.gsc}
          <Input
            className="mt-2"
            defaultValue={settings.gscVerification}
            placeholder="google-site-verification token"
            onBlur={(e) => void save({ gscVerification: e.target.value })}
          />
        </label>
        <label className="block text-sm text-muted">
          {t.ops.ga}
          <Input
            className="mt-2"
            defaultValue={settings.gaId}
            placeholder="G-XXXXXXXX"
            onBlur={(e) => void save({ gaId: e.target.value })}
          />
        </label>
        <label className="block text-sm text-muted">
          {t.ops.ogImage}
          <Input
            className="mt-2"
            defaultValue={settings.ogImage}
            placeholder="/og.jpg"
            onBlur={(e) => void save({ ogImage: e.target.value })}
          />
        </label>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-fg">{t.ops.downloadMode}</h2>
        <div className="flex gap-2">
          {(["rewarded_ad", "direct"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setSettings((s) => (s ? { ...s, freeDownloadMode: mode } : s));
                void save({ freeDownloadMode: mode });
              }}
              className={cn(
                "h-11 rounded-full px-4 text-sm",
                settings.freeDownloadMode === mode ? "bg-fg text-bg" : "bg-elevated text-muted",
              )}
            >
              {mode === "direct" ? t.ops.direct : t.ops.rewarded}
            </button>
          ))}
        </div>
        <Toggle
          label={t.ops.ads}
          on={settings.adsEnabled}
          onToggle={() => {
            const next = !settings.adsEnabled;
            setSettings((s) => (s ? { ...s, adsEnabled: next } : s));
            void save({ adsEnabled: next });
          }}
        />
        <Toggle
          label={t.ops.rewardedFlag}
          on={settings.rewardedDownloadsEnabled}
          onToggle={() => {
            const next = !settings.rewardedDownloadsEnabled;
            setSettings((s) => (s ? { ...s, rewardedDownloadsEnabled: next } : s));
            void save({ rewardedDownloadsEnabled: next });
          }}
        />
        <Toggle
          label={t.ops.maintenance}
          on={settings.maintenanceMode}
          onToggle={() => {
            const next = !settings.maintenanceMode;
            setSettings((s) => (s ? { ...s, maintenanceMode: next } : s));
            void save({ maintenanceMode: next });
          }}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl text-fg">{t.ops.mediation}</h2>
          <p className="mt-1 text-sm text-muted">{t.ops.mediationHint}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm text-muted">
            {t.ops.displayEcpm}
            <Input
              className="mt-2"
              type="number"
              min={0}
              step={0.1}
              value={settings.displayEcpm}
              onChange={(e) =>
                setSettings((s) => (s ? { ...s, displayEcpm: Number(e.target.value) || 0 } : s))
              }
              onBlur={() => void save({ displayEcpm: settings.displayEcpm })}
            />
          </label>
          <label className="text-sm text-muted">
            {t.ops.rewardedEcpm}
            <Input
              className="mt-2"
              type="number"
              min={0}
              step={0.1}
              value={settings.rewardedEcpm}
              onChange={(e) =>
                setSettings((s) => (s ? { ...s, rewardedEcpm: Number(e.target.value) || 0 } : s))
              }
              onBlur={() => void save({ rewardedEcpm: settings.rewardedEcpm })}
            />
          </label>
        </div>
        <ul className="space-y-3">
          {settings.mediation.map((net) => {
            const meta = AD_NETWORK_META[net.id];
            return (
              <li key={net.id} className="rounded-[16px] bg-elevated p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-fg">{meta.label}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {meta.surface === "web" ? t.ops.surfaceWeb : meta.surface === "native" ? t.ops.surfaceNative : `${t.ops.surfaceWeb} · ${t.ops.surfaceNative}`}
                      {" · "}
                      {meta.hint}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = settings.mediation.map((n) =>
                        n.id === net.id ? { ...n, enabled: !n.enabled } : n,
                      );
                      setSettings((s) => (s ? { ...s, mediation: next } : s));
                      void save({ mediation: next });
                    }}
                    className={cn(
                      "h-8 rounded-full px-3 text-xs font-medium",
                      net.enabled ? "bg-fg text-bg" : "bg-surface text-muted",
                    )}
                  >
                    {net.enabled ? t.ops.networkOn : t.ops.off}
                  </button>
                </div>
                {net.id !== "house" ? (
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="text-xs text-muted">
                      {t.ops.appId}
                      <Input
                        className="mt-1"
                        value={net.publisherId}
                        onChange={(e) => patchNet(net.id, { publisherId: e.target.value })}
                        onBlur={() => void save({ mediation: settings.mediation })}
                      />
                    </label>
                    {net.id !== "adsense" ? (
                      <label className="text-xs text-muted">
                        {t.ops.sdkKey}
                        <Input
                          className="mt-1"
                          value={net.sdkKey}
                          onChange={(e) => patchNet(net.id, { sdkKey: e.target.value })}
                          onBlur={() => void save({ mediation: settings.mediation })}
                        />
                      </label>
                    ) : (
                      <label className="text-xs text-muted">
                        {t.ops.bannerUnit}
                        <Input
                          className="mt-1"
                          value={net.bannerUnit}
                          onChange={(e) => patchNet(net.id, { bannerUnit: e.target.value })}
                          onBlur={() => void save({ mediation: settings.mediation })}
                        />
                      </label>
                    )}
                    <label className="text-xs text-muted">
                      {t.ops.feedUnit}
                      <Input
                        className="mt-1"
                        value={net.feedUnit}
                        onChange={(e) => patchNet(net.id, { feedUnit: e.target.value })}
                        onBlur={() => void save({ mediation: settings.mediation })}
                      />
                    </label>
                    <label className="text-xs text-muted">
                      {t.ops.rewardedUnit}
                      <Input
                        className="mt-1"
                        value={net.rewardedUnit}
                        onChange={(e) => patchNet(net.id, { rewardedUnit: e.target.value })}
                        onBlur={() => void save({ mediation: settings.mediation })}
                      />
                    </label>
                    <label className="text-xs text-muted">
                      {t.ops.ecpmFloor}
                      <Input
                        className="mt-1"
                        type="number"
                        min={0}
                        step={0.1}
                        value={net.ecpmFloor}
                        onChange={(e) => patchNet(net.id, { ecpmFloor: Number(e.target.value) || 0 })}
                        onBlur={() => void save({ mediation: settings.mediation })}
                      />
                    </label>
                    <label className="text-xs text-muted">
                      {t.ops.timeout}
                      <Input
                        className="mt-1"
                        type="number"
                        min={0}
                        step={100}
                        value={net.timeoutMs}
                        onChange={(e) => patchNet(net.id, { timeoutMs: Number(e.target.value) || 0 })}
                        onBlur={() => void save({ mediation: settings.mediation })}
                      />
                    </label>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-2">
        <label className="block text-sm text-muted">
          {t.ops.dailyLimit}
          <Input
            className="mt-2"
            type="number"
            min={1}
            max={500}
            value={settings.dailyDownloadLimit}
            onChange={(e) =>
              setSettings((s) =>
                s ? { ...s, dailyDownloadLimit: Number(e.target.value) || 1 } : s,
              )
            }
            onBlur={() => void save({ dailyDownloadLimit: settings.dailyDownloadLimit })}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm text-muted">
            {t.ops.creatorShare}
            <Input
              className="mt-2"
              type="number"
              min={0}
              max={100}
              value={settings.creatorSharePercent}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, creatorSharePercent: Number(e.target.value) || 0 } : s,
                )
              }
            />
          </label>
          <label className="text-sm text-muted">
            {t.ops.platformShare}
            <Input
              className="mt-2"
              type="number"
              min={0}
              max={100}
              value={settings.platformSharePercent}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, platformSharePercent: Number(e.target.value) || 0 } : s,
                )
              }
            />
          </label>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            void save({
              creatorSharePercent: settings.creatorSharePercent,
              platformSharePercent: settings.platformSharePercent,
            })
          }
        >
          {t.save}
        </Button>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-fg">{t.ops.flags}</h2>
        {(
          [
            ["premium_enabled", t.premium.brand],
            ["rewarded_downloads_enabled", t.ops.rewardedFlag],
            ["lifetime_purchase_enabled", t.premium.lifetime],
            ["recommendations_enabled", t.home.recommended],
            ["notifications_enabled", t.profile.notifications],
            ["creator_marketplace_enabled", t.ops.marketplace],
          ] as const
        ).map(([key, label]) => (
          <Toggle key={key} label={label} on={flags[key]} onToggle={() => setFlag(key, !flags[key])} />
        ))}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl text-fg">{t.ops.categories}</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-elevated">
          {categories.map((c) => (
            <li key={c.id} className="space-y-2 px-4 py-3">
              <div className="flex min-h-14 items-center justify-between gap-3">
              <span className="text-sm text-fg">{c.name}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={cn(
                    "h-11 rounded-full px-4 text-sm",
                    c.isVisible ? "bg-fg text-bg" : "bg-surface text-muted",
                  )}
                  onClick={async () => {
                    await updateOpsCategory({ data: { id: c.id, isVisible: !c.isVisible } });
                    setCategories((prev) =>
                      prev.map((x) => (x.id === c.id ? { ...x, isVisible: !x.isVisible } : x)),
                    );
                  }}
                >
                  {c.isVisible ? t.ops.visible : t.ops.hidden}
                </button>
                <button
                  type="button"
                  className={cn(
                    "h-11 rounded-full px-4 text-sm",
                    c.isFeatured ? "bg-fg text-bg" : "bg-surface text-muted",
                  )}
                  onClick={async () => {
                    await updateOpsCategory({ data: { id: c.id, isFeatured: !c.isFeatured } });
                    setCategories((prev) =>
                      prev.map((x) => (x.id === c.id ? { ...x, isFeatured: !x.isFeatured } : x)),
                    );
                  }}
                >
                  {t.ops.featuredFlag}
                </button>
              </div>
              </div>
              <div className="grid gap-2 pb-2 sm:grid-cols-2">
                <Input
                  defaultValue={c.slug}
                  aria-label={t.ops.seoSlug}
                  onBlur={(e) => void updateOpsCategory({ data: { id: c.id, slug: e.target.value } })}
                />
                <Input
                  defaultValue={c.intro}
                  aria-label={t.ops.seoIntro}
                  placeholder={t.ops.seoIntro}
                  onBlur={(e) => void updateOpsCategory({ data: { id: c.id, intro: e.target.value } })}
                />
                <Input
                  defaultValue={c.seoTitle}
                  placeholder={t.ops.seoTitle}
                  onBlur={(e) => void updateOpsCategory({ data: { id: c.id, seoTitle: e.target.value } })}
                />
                <Input
                  defaultValue={c.seoDescription}
                  placeholder={t.ops.seoDescription}
                  onBlur={(e) => void updateOpsCategory({ data: { id: c.id, seoDescription: e.target.value } })}
                />
                <Input
                  defaultValue={c.canonicalPath}
                  placeholder={t.ops.seoCanonical}
                  aria-label={t.ops.seoCanonical}
                  onBlur={(e) => void updateOpsCategory({ data: { id: c.id, canonicalPath: e.target.value } })}
                />
                <button
                  type="button"
                  className={cn(
                    "h-11 rounded-full px-4 text-sm",
                    c.robots === "index" ? "bg-fg text-bg" : "bg-elevated text-muted",
                  )}
                  onClick={() =>
                    void updateOpsCategory({
                      data: { id: c.id, robots: c.robots === "index" ? "noindex" : "index" },
                    }).then(() =>
                      setCategories((prev) =>
                        prev.map((x) =>
                          x.id === c.id ? { ...x, robots: x.robots === "index" ? "noindex" : "index" } : x,
                        ),
                      ),
                    )
                  }
                >
                  {t.ops.seoIndex}: {c.robots}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl text-fg">{t.ops.collections}</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-elevated">
          {collections.map((c) => (
            <li key={c.id} className="flex min-h-14 items-center justify-between gap-3 px-4">
              <span className="text-sm text-fg">
                {c.name}
                <span className="ml-2 text-muted">{c.wallpaperCount}</span>
              </span>
              <button
                type="button"
                className={cn(
                  "h-11 rounded-full px-4 text-sm",
                  c.isVisible ? "bg-fg text-bg" : "bg-surface text-muted",
                )}
                onClick={async () => {
                  await updateOpsCollection({ data: { id: c.id, isVisible: !c.isVisible } });
                  setCollections((prev) =>
                    prev.map((x) => (x.id === c.id ? { ...x, isVisible: !x.isVisible } : x)),
                  );
                }}
              >
                {c.isVisible ? t.ops.visible : t.ops.hidden}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
