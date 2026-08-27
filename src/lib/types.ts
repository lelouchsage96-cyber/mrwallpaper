import type { DeviceType } from "@/lib/device";
import type { AdNetworkConfig, AdNetworkId } from "@/lib/ads";

export type AccessType = "free" | "premium";
export type { DeviceType };

export type WallpaperCard = {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  accessType: AccessType;
  thumbnailUrl: string;
  downloadCount: number;
  favoriteCount: number;
  isFavorite: boolean;
  isLive: boolean;
  deviceType: DeviceType;
  width: number;
  height: number;
  altText: string;
};

export type WallpaperDetail = WallpaperCard & {
  description: string;
  previewUrl: string;
  fileSizeBytes: number;
  format: string;
  tags: string[];
  creatorName: string | null;
  creatorSlug: string | null;
  videoUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalPath: string | null;
  robots: string;
};

export type WallpaperPair = {
  id: string;
  slug: string;
  name: string;
  description: string;
  lock: WallpaperCard;
  home: WallpaperCard;
  suggested?: boolean;
};

export type AppNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  wallpaperId: string | null;
  thumbnailUrl: string | null;
  read: boolean;
  createdAt: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverUrl: string | null;
  sortOrder: number;
  isFeatured: boolean;
  intro: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalPath: string | null;
  robots: string;
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverUrl: string | null;
  wallpaperCount: number;
};

export type CreatorCard = {
  slug: string;
  displayName: string;
  bio: string;
  coverUrl: string;
  pieceCount: number;
};

export type CreatorPage = {
  slug: string;
  displayName: string;
  bio: string;
  pieceCount: number;
  items: WallpaperCard[];
  pairs: WallpaperPair[];
};

export type CreatorStatus = "pending" | "approved" | "rejected" | "suspended";

export type StudioPiece = {
  id: string;
  title: string;
  status: string;
  accessType: AccessType;
  thumbnailUrl: string;
  downloadCount: number;
};

export type StudioPieceDetail = StudioPiece & {
  description: string;
  categoryId: string;
  tags: string[];
  previewUrl: string;
  deviceType: DeviceType;
};

export type StudioPlate = {
  id: string;
  thumbnailUrl: string;
  categoryName: string;
};

export type StudioDashboard = {
  marketplaceOn: boolean;
  status: CreatorStatus | "none";
  slug: string | null;
  displayName: string | null;
  bio: string;
  liveCount: number;
  pendingCount: number;
  downloads: number;
  estimatedShare: number;
  creatorSharePercent: number;
  minPayout: number;
  pieces: StudioPiece[];
  platesLeft: number;
};

export type PremiumPlan = {
  id: string;
  label: string;
  period: "month" | "year" | "lifetime";
  displayPrice: string;
  productId: string;
};

export type FeatureFlags = {
  creator_marketplace_enabled: boolean;
  premium_enabled: boolean;
  rewarded_downloads_enabled: boolean;
  notifications_enabled: boolean;
  recommendations_enabled: boolean;
  lifetime_purchase_enabled: boolean;
};

export type AppConfig = {
  freeDownloadMode: "direct" | "rewarded_ad";
  maintenanceMode: boolean;
  adsEnabled: boolean;
  rewardedDownloadsEnabled: boolean;
  dailyDownloadLimit: number;
  featureFlags: FeatureFlags;
  premiumPlans: PremiumPlan[];
  isPremium: boolean;
  adsenseClient: string;
  adsenseBannerSlot: string;
  adsenseFeedSlot: string;
  adsenseAnchorSlot: string;
};

export type AdContext = {
  showAds: boolean;
  adsEnabled: boolean;
  isPremium: boolean;
  adsenseClient: string;
  adsenseBannerSlot: string;
  adsenseFeedSlot: string;
  adsenseAnchorSlot: string;
  displayEcpm: number;
  rewardedEcpm: number;
  networks: AdNetworkConfig[];
};

export type HomePayload = {
  wotd: WallpaperCard | null;
  trending: WallpaperCard[];
  fresh: WallpaperCard[];
  recommended: WallpaperCard[];
  editors: WallpaperCard[];
  premium: WallpaperCard[];
  live: WallpaperCard[];
  recent: WallpaperCard[];
  tablet: WallpaperCard[];
  categories: Category[];
  collections: Collection[];
  pairs: WallpaperPair[];
  creators: CreatorCard[];
  unreadCount: number;
  hasTaste: boolean;
  notificationsOn: boolean;
  marketplaceOn: boolean;
};

export type DownloadHistoryItem = WallpaperCard & {
  downloadedAt: string;
  downloadType: string;
};

export type ExploreMeta = {
  categories: Category[];
  popular: string[];
};

export type DownloadRequestResult =
  | {
      status: "ok";
      url: string;
      filename: string;
      mime: string;
      isLive: boolean;
      stillUrl: string | null;
      stillFilename: string | null;
    }
  | { status: "needs_auth" }
  | { status: "needs_ad" }
  | { status: "needs_premium" }
  | { status: "rate_limited" }
  | { status: "error"; message: string };

export type OpsRole = "user" | "creator" | "moderator" | "admin";

export type OpsSession = {
  role: OpsRole | "user";
  canClaim: boolean;
  canModerate: boolean;
  canAdmin: boolean;
};

export type OpsOverview = {
  wallpapers: number;
  approved: number;
  premium: number;
  pending: number;
  downloadsToday: number;
  downloadsYesterday: number;
  downloadsAll: number;
  openReports: number;
  users: number;
  premiumSubs: number;
  favorites: number;
  series: OpsSeriesPoint[];
  topWallpapers: OpsTopWallpaper[];
  byType: { type: "free" | "rewarded" | "premium"; count: number }[];
  adImpressionsToday: number;
  adRevenueTodayMicros: number;
  adRevenueAllMicros: number;
  adClicksToday: number;
  adByNetwork: { network: AdNetworkId | string; impressions: number; revenueMicros: number }[];
};

export type OpsSeriesPoint = {
  date: string;
  total: number;
  free: number;
  rewarded: number;
  premium: number;
};

export type OpsTopWallpaper = {
  id: string;
  title: string;
  thumbnailUrl: string;
  downloadCount: number;
  favoriteCount: number;
};

export type OpsWallpaperRow = {
  id: string;
  slug: string;
  title: string;
  categoryName: string;
  accessType: AccessType;
  status: string;
  thumbnailUrl: string;
  downloadCount: number;
  favoriteCount: number;
  deviceType: DeviceType;
  seoTitle: string;
  seoDescription: string;
  altText: string;
  canonicalPath: string;
  robots: string;
};

export type OpsFeaturedRow = {
  id: string;
  slot: string;
  wallpaperId: string;
  title: string;
  thumbnailUrl: string;
};

export type OpsReportRow = {
  id: string;
  wallpaperId: string;
  title: string;
  thumbnailUrl: string;
  reason: string;
  status: string;
  createdAt: string;
};

export type OpsUserRow = {
  userId: string;
  email: string | null;
  name: string | null;
  role: OpsRole;
  status: string;
  isPremium: boolean;
};

export type OpsCategoryRow = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  isVisible: boolean;
  isFeatured: boolean;
  intro: string;
  seoTitle: string;
  seoDescription: string;
  altText: string;
  canonicalPath: string;
  robots: string;
};

export type OpsCollectionRow = {
  id: string;
  slug: string;
  name: string;
  isVisible: boolean;
  wallpaperCount: number;
};

export type OpsSettings = {
  freeDownloadMode: "direct" | "rewarded_ad";
  maintenanceMode: boolean;
  adsEnabled: boolean;
  rewardedDownloadsEnabled: boolean;
  dailyDownloadLimit: number;
  creatorSharePercent: number;
  platformSharePercent: number;
  featureFlags: FeatureFlags;
  adsenseClient: string;
  adsenseBannerSlot: string;
  adsenseFeedSlot: string;
  adsenseAnchorSlot: string;
  displayEcpm: number;
  rewardedEcpm: number;
  mediation: AdNetworkConfig[];
  storageBackend: "r2" | "supabase" | "database";
  supabaseUrl: string;
  supabaseProjectRef: string;
  storageHasKey: boolean;
  storageBuckets: string[];
  r2AccountId: string;
  r2Bucket: string;
  r2PublicUrl: string;
  r2HasKey: boolean;
  gaId: string;
  gscVerification: string;
  ogImage: string;
};

export type OpsCreatorRow = {
  userId: string;
  slug: string;
  displayName: string;
  bio: string;
  status: string;
  appliedAt: string;
  pieceCount: number;
};

export type OpsSubmissionRow = {
  id: string;
  title: string;
  creatorName: string;
  creatorSlug: string;
  thumbnailUrl: string;
  status: string;
  accessType: AccessType;
  createdAt: string;
};
