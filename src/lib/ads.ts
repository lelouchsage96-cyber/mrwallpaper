export type AdPlacement = "banner" | "feed" | "anchor" | "detail" | "rewarded";

export type AdNetworkId =
  | "adsense"
  | "admob"
  | "applovin_max"
  | "levelplay"
  | "meta"
  | "house";

export type AdNetworkSurface = "web" | "native" | "all";

export type AdNetworkConfig = {
  id: AdNetworkId;
  enabled: boolean;
  priority: number;
  timeoutMs: number;
  ecpmFloor: number;
  publisherId: string;
  sdkKey: string;
  bannerUnit: string;
  feedUnit: string;
  anchorUnit: string;
  rewardedUnit: string;
};

export const AD_NETWORK_META: Record<
  AdNetworkId,
  { label: string; surface: AdNetworkSurface; hint: string }
> = {
  adsense: {
    label: "Google AdSense",
    surface: "web",
    hint: "Serves in this web app. Publisher ID looks like ca-pub-…",
  },
  admob: {
    label: "Google AdMob",
    surface: "native",
    hint: "Mediation host for iPhone and Android. App ID looks like ca-app-pub-…~…",
  },
  applovin_max: {
    label: "AppLovin MAX",
    surface: "native",
    hint: "Highest-yield waterfall for rewarded and banners on device.",
  },
  levelplay: {
    label: "Unity LevelPlay",
    surface: "native",
    hint: "ironSource mediation. Strong on rewarded video.",
  },
  meta: {
    label: "Meta Audience Network",
    surface: "native",
    hint: "Usually added under MAX or AdMob, not as the only SDK.",
  },
  house: {
    label: "House ads",
    surface: "all",
    hint: "Always fills. Promotes Premium, Live, and Studio when networks miss.",
  },
};

export const DEFAULT_MEDIATION: AdNetworkConfig[] = [
  {
    id: "adsense",
    enabled: true,
    priority: 1,
    timeoutMs: 2500,
    ecpmFloor: 2,
    publisherId: "",
    sdkKey: "",
    bannerUnit: "",
    feedUnit: "",
    anchorUnit: "",
    rewardedUnit: "",
  },
  {
    id: "admob",
    enabled: false,
    priority: 2,
    timeoutMs: 3000,
    ecpmFloor: 4,
    publisherId: "",
    sdkKey: "",
    bannerUnit: "",
    feedUnit: "",
    anchorUnit: "",
    rewardedUnit: "",
  },
  {
    id: "applovin_max",
    enabled: false,
    priority: 3,
    timeoutMs: 3000,
    ecpmFloor: 6,
    publisherId: "",
    sdkKey: "",
    bannerUnit: "",
    feedUnit: "",
    anchorUnit: "",
    rewardedUnit: "",
  },
  {
    id: "levelplay",
    enabled: false,
    priority: 4,
    timeoutMs: 3000,
    ecpmFloor: 5,
    publisherId: "",
    sdkKey: "",
    bannerUnit: "",
    feedUnit: "",
    anchorUnit: "",
    rewardedUnit: "",
  },
  {
    id: "meta",
    enabled: false,
    priority: 5,
    timeoutMs: 2500,
    ecpmFloor: 3,
    publisherId: "",
    sdkKey: "",
    bannerUnit: "",
    feedUnit: "",
    anchorUnit: "",
    rewardedUnit: "",
  },
  {
    id: "house",
    enabled: true,
    priority: 99,
    timeoutMs: 0,
    ecpmFloor: 0,
    publisherId: "",
    sdkKey: "",
    bannerUnit: "",
    feedUnit: "",
    anchorUnit: "",
    rewardedUnit: "",
  },
];

export function mergeMediation(stored: unknown): AdNetworkConfig[] {
  const list = Array.isArray(stored) ? stored : [];
  const byId = new Map<string, Partial<AdNetworkConfig>>();
  for (const row of list) {
    if (row && typeof row === "object" && "id" in row) {
      byId.set(String((row as AdNetworkConfig).id), row as AdNetworkConfig);
    }
  }
  return DEFAULT_MEDIATION.map((base) => {
    const extra = byId.get(base.id) ?? {};
    return { ...base, ...extra, id: base.id };
  }).sort((a, b) => a.priority - b.priority);
}

export function webWaterfall(networks: AdNetworkConfig[]): AdNetworkConfig[] {
  return networks.filter((n) => n.enabled && (n.id === "adsense" || n.id === "house"));
}

export function unitFor(network: AdNetworkConfig, placement: AdPlacement): string {
  if (placement === "feed") return network.feedUnit;
  if (placement === "anchor") return network.anchorUnit;
  if (placement === "rewarded") return network.rewardedUnit;
  return network.bannerUnit;
}

export type HouseCreative = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  href: string;
  tone: string;
};

export const HOUSE_ADS: HouseCreative[] = [
  {
    id: "premium",
    kicker: "Mr Wallpapers",
    title: "Go Premium",
    body: "Remove ads. Unlock every plate.",
    href: "/app/premium",
    tone: "from-[#2a2c32] via-[#1a1b1f] to-[#0c0c0e]",
  },
  {
    id: "studio",
    kicker: "Studio",
    title: "Publish plates",
    body: "Creators keep 80% of download share.",
    href: "/studio",
    tone: "from-[#32281f] via-[#1c1814] to-[#0e0c0a]",
  },
];

export function pickHouseAd(seed: string): HouseCreative {
  let n = 0;
  for (let i = 0; i < seed.length; i += 1) n = (n + seed.charCodeAt(i) * (i + 1)) % HOUSE_ADS.length;
  return HOUSE_ADS[n] ?? HOUSE_ADS[0];
}

export function ecpmToMicros(ecpm: number): number {
  return Math.max(0, Math.round(ecpm * 1000));
}