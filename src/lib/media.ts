/** Compact card/list preview. Full plates stay at `/wallpapers/{id}.jpg`. */
export function cardThumb(id: string) {
  return `/wallpapers/thumbs/${id}.webp`;
}

export function wallpaperFile(id: string) {
  return `/wallpapers/${id}.jpg`;
}

const CATEGORY_PREVIEW_IDS: Record<string, string> = {
  minimal: "quiet-orbit",
  aesthetic: "paper-moon",
  nature: "ridge-line",
  cars: "afterglow-run",
  anime: "after-rain-sky",
  space: "silent-satellite",
  dark: "low-light",
  abstract: "overlap-two",
  motivational: "begin-again",
  "bible-verse": "be-still",
  "bible-verses": "be-still",
  love: "two-points",
  city: "late-grid",
  animals: "crane-hour",
  vintage: "sepia-room",
  amoled: "true-black",
  iphone: "soft-lock",
  android: "quiet-orbit",
  ipad: "wide-ridge",
};

/** Bundled category art used only when the catalog has no usable cover. */
export function categoryPreview(slug: string) {
  return cardThumb(CATEGORY_PREVIEW_IDS[slug] ?? "quiet-orbit");
}

/** Full-size counterpart used if a bundled thumbnail itself cannot paint. */
export function categoryPreviewFallback(slug: string) {
  return wallpaperFile(CATEGORY_PREVIEW_IDS[slug] ?? "quiet-orbit");
}

export function mediaUrl(id: string) {
  return `/api/media/${id}`;
}

function isSupabaseUrl(url: string) {
  return url.includes("supabase.co") || url.includes("/storage/v1/object/");
}

function prettyName(id: string, slug?: string | null) {
  return (slug && slug.trim()) || id;
}

export function resolveThumb(id: string, stored?: string | null, slug?: string | null) {
  // Creator plates live behind a private bucket — expose a crawlable pretty filename.
  if (stored?.startsWith("/api/media/")) return `/media/${prettyName(id, slug)}-thumb.jpg`;
  if (stored && isSupabaseUrl(stored)) return cardThumb(id);
  if (stored?.startsWith("https://") || stored?.startsWith("http://")) return stored;
  return cardThumb(id);
}

/** Signed-in studio/admin: keep private media paths so pending plates still preview. */
export function resolveOwnedThumb(id: string, stored?: string | null, slug?: string | null) {
  if (stored?.startsWith("/api/media/")) return stored;
  if (stored?.startsWith("/wallpapers/")) return stored;
  return resolveThumb(id, stored, slug);
}

export function resolveOwnedPreview(id: string, stored?: string | null, slug?: string | null) {
  if (stored?.startsWith("/api/media/")) return stored;
  if (stored?.startsWith("/wallpapers/")) return stored;
  return resolvePreview(id, stored, slug);
}

/** Lock-screen / detail preview — always a full plate, never a 360px thumb. */
export function resolvePreview(id: string, stored?: string | null, slug?: string | null) {
  if (stored?.startsWith("/api/media/") || (slug && !stored)) {
    return `/media/${prettyName(id, slug)}-preview.jpg`;
  }
  if (stored?.startsWith("https://") || stored?.startsWith("http://")) return stored;
  return wallpaperFile(id);
}

/** Sharp plate for heroes. Thumbs are ~360px and look muddy past a phone. */
export function resolveHero(id: string, thumbUrl?: string | null, slug?: string | null): string {
  if (thumbUrl?.startsWith("/api/media/") || thumbUrl?.startsWith("/media/")) {
    const name = prettyName(id, slug);
    return `/media/${name}-preview.jpg`;
  }
  if (thumbUrl?.startsWith("https://") || thumbUrl?.startsWith("http://")) return thumbUrl;
  return wallpaperFile(id);
}

export function resolveOriginal(id: string, stored?: string | null): string {
  if (stored?.startsWith("/api/media/")) {
    return stored.replace("-thumb", "-orig").replace("-prev", "-orig");
  }
  return wallpaperFile(id);
}

export function asCardThumb(url: string | null | undefined): string | null {
  if (!url) return null;
  if (isSupabaseUrl(url)) {
    const m = url.match(/\/([^/.]+)\.(?:jpg|jpeg|png|webp)$/i);
    return m ? cardThumb(m[1]) : url;
  }
  if (url.startsWith("/api/media/")) {
    const mediaId = url.slice("/api/media/".length);
    const base = mediaId.replace(/-(?:thumb|prev|orig)(?:-[a-z0-9]+)?$/i, "");
    return `/media/${base}-thumb.jpg`;
  }
  if (url.startsWith("/media/") || url.startsWith("https://") || url.startsWith("http://")) return url;
  const m = url.match(/\/wallpapers\/(?:thumbs\/)?([^/.]+)\.(?:jpg|jpeg|png|webp)$/i);
  return m ? cardThumb(m[1]) : url;
}

/** Full plate for a catalog thumb path, used when a 360px webp fails to paint. */
export function plateFallback(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const pretty = url.match(/\/media\/(.+)-(?:thumb|preview)\.(?:jpe?g|png|webp)$/i);
  if (pretty) return `/media/${pretty[1]}-preview.jpg`;
  if (url.startsWith("/api/media/")) {
    return url.replace("-thumb", "-prev").replace("-orig", "-prev");
  }
  const m = url.match(/\/wallpapers\/(?:thumbs\/)?([^/.]+)\./i);
  return m ? wallpaperFile(m[1]) : undefined;
}

export function downloadExt(format: string | null | undefined): "jpg" | "png" | "webp" | "mp4" | "mov" | "webm" {
  if (format === "png") return "png";
  if (format === "webp") return "webp";
  if (format === "mov") return "mov";
  if (format === "webm") return "webm";
  if (format === "mp4") return "mp4";
  return "jpg";
}

export function isLiveFormat(format: string | null | undefined): boolean {
  return format === "mp4" || format === "mov" || format === "webm";
}

export function bytesFromUnknown(data: unknown): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
    return new Uint8Array(data);
  }
  if (typeof data === "string") {
    if (data.startsWith("\\x")) {
      const hex = data.slice(2);
      const out = new Uint8Array(hex.length / 2);
      for (let i = 0; i < out.length; i += 1) {
        out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      }
      return out;
    }
    const bin = atob(data);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  }
  throw new Error("bad media");
}

export function sniffImage(
  buf: Uint8Array,
): { mime: string; format: "jpg" | "png" | "webp"; width: number; height: number } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8) {
    const size = jpegSize(buf);
    return size ? { mime: "image/jpeg", format: "jpg", ...size } : null;
  }
  if (
    buf.length >= 24 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return {
      mime: "image/png",
      format: "png",
      width: view.getUint32(16),
      height: view.getUint32(20),
    };
  }
  if (
    buf.length >= 30 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    const size = webpSize(buf);
    return size ? { mime: "image/webp", format: "webp", ...size } : null;
  }
  return null;
}

function jpegSize(buf: Uint8Array): { width: number; height: number } | null {
  let i = 2;
  while (i + 8 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    const len = (buf[i + 2] << 8) | buf[i + 3];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (i + 8 >= buf.length) return null;
      return { height: (buf[i + 5] << 8) | buf[i + 6], width: (buf[i + 7] << 8) | buf[i + 8] };
    }
    i += 2 + len;
  }
  return null;
}

function webpSize(buf: Uint8Array): { width: number; height: number } | null {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const chunk = String.fromCharCode(buf[12], buf[13], buf[14], buf[15]);
  if (chunk === "VP8X" && buf.length >= 30) {
    return {
      width: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
      height: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
    };
  }
  if (chunk === "VP8 " && buf.length >= 30) {
    return {
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    };
  }
  if (chunk === "VP8L" && buf.length >= 25) {
    const bits = view.getUint32(21, true);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}
