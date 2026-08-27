/**
 * Central brand configuration for Mr Wallpapers.
 * Change identity here — do not scatter name, tagline, or links in widgets.
 */
export const brand = {
  name: "Mr Wallpapers",
  shortName: "MW",
  tagline: "Your Screen. Your Style.",
  positioning: "High-quality wallpapers for your phone and tablet.",
  supportEmail: "support@mrwallpapers.app",
  website: "https://mrwallpapers.app",
  legal: {
    privacy: "/legal/privacy",
    terms: "/legal/terms",
    copyright: "/legal/copyright",
    guidelines: "/legal/guidelines",
  },
  social: {
    instagram: "https://instagram.com/mrwallpapers",
    x: "https://x.com/mrwallpapers",
  },
  deepLinkScheme: "mrwallpapers",
  shareBaseUrl: "https://mrwallpapers.app",
} as const;

export type Brand = typeof brand;
