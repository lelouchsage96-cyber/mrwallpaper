import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Sql } from "@/lib/db";
import { bytesFromUnknown } from "@/lib/media";

export type DuplicateHit = {
  id: string;
  creatorId: string | null;
};

let catalogHashed = false;

export function sha256Buffer(buf: Uint8Array): string {
  return createHash("sha256").update(buf).digest("hex");
}

async function ensureSourceColumn(sql: Sql) {
  await sql.query(`alter table wallpapers add column if not exists source_sha256 text`);
}

async function hashFromPath(sql: Sql, path: string | null): Promise<string | null> {
  if (!path) return null;
  try {
    if (path.startsWith("/api/media/")) {
      const mediaId = path.slice("/api/media/".length);
      if (!mediaId) return null;
      const media = await sql.query<{ data: unknown; storage: string | null; storage_key: string | null }>(
        `select data, storage, storage_key from media_files where id = $1 limit 1`,
        [mediaId],
      );
      const row = media[0];
      if (!row) return null;
      if ((row.storage === "supabase" || row.storage === "r2") && row.storage_key) {
        const { downloadStored } = await import("./storage");
        const stored = await downloadStored(row.storage, row.storage_key, row.data);
        if (!stored) return null;
        return sha256Buffer(stored.bytes);
      }
      if (row.data == null) return null;
      return sha256Buffer(bytesFromUnknown(row.data));
    }
    if (path.startsWith("https://") || path.startsWith("http://")) {
      const res = await fetch(path, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) return null;
      return sha256Buffer(Buffer.from(await res.arrayBuffer()));
    }
    if (path.startsWith("/wallpapers/")) {
      const file = await readFile(join(process.cwd(), "public", path.slice(1)));
      return sha256Buffer(file);
    }
  } catch (err) {
    console.error("[dupes] hash failed", path, err);
  }
  return null;
}

export async function ensureCatalogHashes(sql: Sql) {
  if (catalogHashed) return;
  catalogHashed = true;
  try {
    await ensureSourceColumn(sql);
    const missing = await sql.query<{ id: string; path: string | null }>(
      `select w.id,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'original' limit 1) as path
       from wallpapers w
       where w.sha256 is null`,
    );

    for (const row of missing) {
      const hash = await hashFromPath(sql, row.path);
      if (!hash) continue;
      await sql.query(
        `update wallpapers
            set sha256 = $1, source_sha256 = coalesce(source_sha256, $1)
          where id = $2 and sha256 is null`,
        [hash, row.id],
      );
    }

    await sql.query(
      `update wallpapers w
          set status = 'removed', updated_at = now()
        where w.status in ('draft', 'pending', 'approved')
          and w.sha256 is not null
          and exists (
            select 1 from wallpapers o
            where o.status in ('draft', 'pending', 'approved')
              and o.id <> w.id
              and (
                o.sha256 = w.sha256
                or (w.source_sha256 is not null and o.source_sha256 = w.source_sha256)
                or o.source_sha256 = w.sha256
                or (w.source_sha256 is not null and o.sha256 = w.source_sha256)
              )
              and (o.created_at < w.created_at or (o.created_at = w.created_at and o.id < w.id))
          )`,
    );
  } catch (err) {
    catalogHashed = false;
    console.error("[dupes] catalog hash failed", err);
    throw err;
  }
}

export async function findDuplicate(
  sql: Sql,
  hashes: string[],
  excludeId?: string | null,
): Promise<DuplicateHit | null> {
  await ensureCatalogHashes(sql);
  const unique = [...new Set(hashes.filter((h) => /^[a-f0-9]{64}$/.test(h)))];
  if (unique.length === 0) return null;
  const a = unique[0];
  const b = unique[1] ?? unique[0];
  const skip = excludeId && excludeId.length > 0 ? excludeId : "";
  const rows = await sql.query<{ id: string; creator_id: string | null }>(
    `select id, creator_id
     from wallpapers
     where status in ('draft', 'pending', 'approved')
       and (sha256 = $1 or sha256 = $2 or source_sha256 = $1 or source_sha256 = $2)
       and id <> $3
     order by created_at asc, id asc
     limit 1`,
    [a, b, skip],
  );
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, creatorId: row.creator_id };
}
