export type DeviceType = "phone" | "tablet" | "both";
export type DeviceFilter = "all" | "phone" | "tablet";

export function parseDeviceType(value: unknown): DeviceType {
  return value === "tablet" || value === "both" ? value : "phone";
}

export function parseDeviceFilter(value: unknown): DeviceFilter {
  return value === "tablet" || value === "all" ? value : "phone";
}

/** SQL fragment — phone is the default catalog. */
export function deviceWhere(device?: DeviceFilter | null): string | null {
  if (!device || device === "all") return null;
  if (device === "tablet") return `(w.device_type in ('tablet', 'both'))`;
  return `(w.device_type in ('phone', 'both'))`;
}

export function isLandscape(width: number, height: number): boolean {
  return width > height;
}

export function orientationOf(width: number, height: number): "portrait" | "landscape" {
  return width > height ? "landscape" : "portrait";
}

export function designedFor(device: DeviceType): string {
  if (device === "tablet") return "Designed for iPad & Tablets";
  if (device === "both") return "Available for Phone & Tablet";
  return "Designed for Phones";
}

export function downloadLabel(device: DeviceType): string {
  if (device === "tablet") return "Download Tablet Wallpaper";
  if (device === "both") return "Download for Phone & Tablet";
  return "Download Phone Wallpaper";
}

export function seoDevicePhrase(device: DeviceType): string {
  if (device === "tablet") return "iPad Wallpaper";
  if (device === "both") return "Phone & iPad Wallpaper";
  return "Phone Wallpaper";
}

export function wallpaperSeoTitle(title: string, device: DeviceType, brand = "Mr Wallpapers"): string {
  return `${title} ${seoDevicePhrase(device)} | ${brand}`;
}

export function wallpaperSeoDescription(
  title: string,
  device: DeviceType,
  category: string,
  extra?: string,
): string {
  const kind =
    device === "tablet"
      ? "iPad and tablet wallpaper"
      : device === "both"
        ? "phone and tablet wallpaper"
        : "phone wallpaper";
  const body = extra?.trim();
  return body
    ? `${title} — ${kind} in ${category}. ${body}`
    : `${title} — high-quality ${kind} in ${category}. For iPhone, Android, and iPad.`;
}

export function inferDeviceType(width: number, height: number): DeviceType {
  if (!width || !height) return "phone";
  if (width > height) return "tablet";
  const r = height / width;
  if (r >= 1.65) return "phone";
  if (r <= 1.45) return "tablet";
  return "phone";
}

export function usesPhonePreview(device: DeviceType): boolean {
  return device !== "tablet";
}

export function deviceBadge(device: DeviceType): string | null {
  if (device === "tablet") return "iPad";
  if (device === "both") return "Phone + iPad";
  return null;
}

export const DEVICE_KEYWORDS =
  "mobile wallpapers, phone wallpapers, 4K phone wallpapers, iPhone wallpapers, Android wallpapers, iPad wallpapers, tablet wallpapers";
