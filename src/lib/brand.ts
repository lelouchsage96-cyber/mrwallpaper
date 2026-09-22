/**
 * Central brand configuration for MrWallpaper.
 * Change identity here — do not scatter name, tagline, or links in widgets.
 */
export const brand = {
  name: "MrWallpaper",
  shortName: "MW",
  tagline: "Your Screen. Your Style.",
  positioning: "Free HD and 4K wallpapers for iPhone, Android, iPad and tablets.",
  supportEmail: "support@mrwallpapers.app",
  website: "https://mrwallpaper.org",
  legal: {
    privacy: "/legal/privacy",
    terms: "/legal/terms",
    copyright: "/legal/copyright",
    guidelines: "/legal/guidelines",
  },
  social: {
    instagram: "https://www.instagram.com/mr_wallpaper_0/",
    x: "https://x.com/Mrwallpaper_0",
    tiktok: "https://www.tiktok.com/@mr.wallpaper__",
    pinterest: "https://www.pinterest.com/mrwallpaper_/",
  },
  support: {
    kofi: "https://ko-fi.com/mrwallpaper/tip",
  },
  shop: {
    fourthwall: "https://mrwallpaper-shop.fourthwall.com",
  },
  deepLinkScheme: "mrwallpapers",
  shareBaseUrl: "https://mrwallpaper.org",
} as const;

export type Brand = typeof brand;
