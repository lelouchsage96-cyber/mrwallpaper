import { getSql } from "@/lib/db";
import { loadMediaFile } from "./storage";

const LEGACY_ORIGINAL = /\/originals\//i;

export async function loadOptimizedLegacyPlate(filename: string): Promise<{
  bytes: Buffer;
  mime: string;
  downloadName: string;
} | null> {
  const hit = /^(.*)-(thumb|preview)\.(?:jpe?g|png|webp)$/i.exec(filename);
  if (!hit) return null;

  const slug = hit[1];
  const variant = hit[2] === "thumb" ? "thumbnail" : "preview";
  const sql = await getSql();
  const rows = await sql.query<{
    id: string;
    requested_path: string | null;
    original_path: string | null;
  }>(
    `select w.id,
            (select a.path from wallpaper_assets a
              where a.wallpaper_id = w.id and a.kind = $2 limit 1) as requested_path,
            (select a.path from wallpaper_assets a
              where a.wallpaper_id = w.id and a.kind = 'original' limit 1) as original_path
     from wallpapers w
     where (w.slug = $1 or w.id = $1) and w.status = 'approved'
     limit 1`,
    [slug, variant],
  );
  const row = rows[0];
  if (!row?.requested_path || !LEGACY_ORIGINAL.test(row.requested_path)) return null;

  let source: Buffer | null = null;
  const originalPath = row.original_path;
  if (originalPath?.startsWith("/api/media/")) {
    const file = await loadMediaFile(originalPath.slice("/api/media/".length));
    source = file?.bytes ?? null;
  } else if (originalPath?.startsWith("/media/")) {
    source = null;
  }

  if (!source) {
    try {
      const response = await fetch(row.requested_path);
      if (!response.ok) return null;
      const length = Number(response.headers.get("content-length") ?? 0);
      if (length > 30 * 1024 * 1024) return null;
      source = Buffer.from(await response.arrayBuffer());
    } catch {
      return null;
    }
  }
  if (!source.length || source.length > 30 * 1024 * 1024) return null;

  const sharp = (await import("sharp")).default;
  const maxEdge = variant === "thumbnail" ? 480 : 1280;
  const quality = variant === "thumbnail" ? 74 : 84;
  const bytes = await sharp(source)
    .rotate()
    .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  return {
    bytes: Buffer.from(bytes),
    mime: "image/jpeg",
    downloadName: `${slug}-${variant === "thumbnail" ? "thumb" : "preview"}.jpg`,
  };
}
