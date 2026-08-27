import { MAX_ORIGINAL_BYTES } from "@/lib/upload-limit";
import { getSql, type Sql } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import { pingR2, r2Config, r2Configured, r2Delete, r2Get, r2PublicUrlFor, r2Put } from "./r2";
import { SUPABASE_ACTIVE } from "./supabase";

export type StoredPlate = {
  originalId: string;
  previewId: string;
  thumbId: string;
  originalPath: string;
  previewPath: string;
  thumbPath: string;
};

export type StorageBackend = "r2" | "supabase" | "database";

export async function storageBackend(): Promise<StorageBackend> {
  if (await r2Configured()) return "r2";
  if (SUPABASE_ACTIVE) return "supabase";
  return "database";
}

export async function downloadStored(
  storage: string | null | undefined,
  storageKey: string | null | undefined,
  data: unknown,
): Promise<{ bytes: Buffer; mime?: string } | null> {
  if (storage === "r2" && storageKey) {
    try {
      const obj = await r2Get(storageKey);
      if (obj) return obj;
    } catch (err) {
      console.error("[storage] r2 get", storageKey, err);
    }
  }
  if (storage === "supabase" && storageKey && SUPABASE_ACTIVE) {
    console.error("[storage] supabase download skipped (paused)", storageKey);
  }
  if (data == null) return null;
  const { bytesFromUnknown } = await import("@/lib/media");
  try {
    const bytes = Buffer.from(bytesFromUnknown(data));
    if (!bytes.length) return null;
    return { bytes };
  } catch (err) {
    console.error("[storage] decode", err);
    return null;
  }
}

async function insertPointer(
  sql: Sql,
  id: string,
  mime: string,
  bytes: number,
  width: number,
  height: number,
  data: Buffer | null,
  storage: string,
  storageKey: string | null,
) {
  await sql.query(
    `insert into media_files (id, mime, bytes, width, height, data, storage, storage_key)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, mime, bytes, width, height, data ?? Buffer.alloc(0), storage, storageKey],
  );
}

export async function storeStudioOriginal(opts: {
  userId: string;
  bytes: Buffer;
  mime: string;
  ext: string;
}): Promise<{ key: string; bytes: number }> {
  if (opts.bytes.length > MAX_ORIGINAL_BYTES) throw new Error("size");
  const stamp = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  const ext = opts.ext.replace(/^\./, "") || "jpg";
  const key = `originals/inbox/${opts.userId}-${stamp}.${ext}`;
  if (await r2Configured()) {
    await r2Put(key, opts.bytes, opts.mime);
    return { key, bytes: opts.bytes.length };
  }
  const sql = await getSql();
  const id = `inbox-${stamp}`;
  await insertPointer(sql, id, opts.mime, opts.bytes.length, 0, 0, opts.bytes, "db", null);
  return { key: `media:${id}`, bytes: opts.bytes.length };
}

const g = globalThis as typeof globalThis & {
  __mwUploadParts?: Map<string, { userId: string; mime: string; count: number; parts: Array<Buffer | null> }>;
};

function partMap() {
  g.__mwUploadParts ??= new Map();
  return g.__mwUploadParts;
}

export async function storeStudioPart(opts: {
  userId: string;
  uploadId: string;
  index: number;
  count: number;
  mime: string;
  ext: string;
  bytes: Buffer;
}): Promise<{ key?: string; bytes?: number; pending?: boolean }> {
  if (opts.count < 1 || opts.count > 8 || opts.index < 0 || opts.index >= opts.count) {
    throw new Error("chunk");
  }
  const id = `${opts.userId}:${opts.uploadId}`;
  if (await r2Configured()) {
    await r2Put(`tmp/${id}/${opts.index}`, opts.bytes, "application/octet-stream");
    if (opts.index < opts.count - 1) return { pending: true };
    const parts: Buffer[] = [];
    for (let i = 0; i < opts.count; i += 1) {
      const got = await r2Get(`tmp/${id}/${i}`);
      if (!got) throw new Error("chunk");
      parts.push(got.bytes);
      await r2Delete(`tmp/${id}/${i}`).catch(() => undefined);
    }
    return storeStudioOriginal({
      userId: opts.userId,
      bytes: Buffer.concat(parts),
      mime: opts.mime,
      ext: opts.ext,
    });
  }
  const map = partMap();
  const slot = map.get(id) ?? { userId: opts.userId, mime: opts.mime, count: opts.count, parts: Array(opts.count).fill(null) };
  if (slot.userId !== opts.userId || slot.count !== opts.count) throw new Error("chunk");
  slot.parts[opts.index] = opts.bytes;
  map.set(id, slot);
  if (slot.parts.some((p) => !p)) return { pending: true };
  const bytes = Buffer.concat(slot.parts as Buffer[]);
  map.delete(id);
  return storeStudioOriginal({ userId: opts.userId, bytes, mime: opts.mime, ext: opts.ext });
}

export async function persistPlateMedia(
  sql: Sql,
  opts: {
    wallpaperId: string;
    original: Buffer;
    originalKey?: string | null;
    originalBytes?: number;
    preview: Buffer;
    thumb: Buffer;
    mime: string;
    format: string;
    width: number;
    height: number;
    previewWidth: number;
    previewHeight: number;
    thumbWidth: number;
    thumbHeight: number;
  },
): Promise<StoredPlate> {
  const stamp = crypto.randomUUID().replaceAll("-", "").slice(0, 8);
  const originalId = `${opts.wallpaperId}-orig-${stamp}`;
  const previewId = `${opts.wallpaperId}-prev-${stamp}`;
  const thumbId = `${opts.wallpaperId}-thumb-${stamp}`;
  const ext = opts.format === "png" ? "png" : opts.format === "webp" ? "webp" : "jpg";
  const inboxKey = opts.originalKey?.startsWith("originals/") ? opts.originalKey : null;
  const mediaKey = opts.originalKey?.startsWith("media:") ? opts.originalKey.slice(6) : null;
  const originalKey = inboxKey ?? `originals/${opts.wallpaperId}-${stamp}.${ext}`;
  const previewKey = `previews/${opts.wallpaperId}-${stamp}.jpg`;
  const thumbKey = `thumbs/${opts.wallpaperId}-${stamp}.jpg`;

  const originalBytes = opts.originalBytes || opts.original.length || 0;
  const useR2 = await r2Configured();
  if (useR2 && !mediaKey) {
    try {
      if (!inboxKey) await r2Put(originalKey, opts.original, opts.mime);
      await r2Put(previewKey, opts.preview, "image/jpeg");
      await r2Put(thumbKey, opts.thumb, "image/jpeg");
      const cfg = await r2Config();
      await insertPointer(sql, originalId, opts.mime, originalBytes, opts.width, opts.height, null, "r2", originalKey);
      await insertPointer(sql, previewId, "image/jpeg", opts.preview.length, opts.previewWidth, opts.previewHeight, null, "r2", previewKey);
      await insertPointer(sql, thumbId, "image/jpeg", opts.thumb.length, opts.thumbWidth, opts.thumbHeight, null, "r2", thumbKey);
      return {
        originalId,
        previewId,
        thumbId,
        originalPath: mediaUrl(originalId),
        previewPath: r2PublicUrlFor(previewKey, cfg) ?? mediaUrl(previewId),
        thumbPath: r2PublicUrlFor(thumbKey, cfg) ?? mediaUrl(thumbId),
      };
    } catch (err) {
      console.error("[storage] r2 persist failed, using database", err);
    }
  }

  if (mediaKey) {
    await sql.query(
      `update media_files set id = $1, width = $2, height = $3 where id = $4`,
      [originalId, opts.width, opts.height, mediaKey],
    );
  } else {
    await insertPointer(sql, originalId, opts.mime, opts.original.length, opts.width, opts.height, opts.original, "db", null);
  }
  await insertPointer(sql, previewId, "image/jpeg", opts.preview.length, opts.previewWidth, opts.previewHeight, opts.preview, "db", null);
  await insertPointer(sql, thumbId, "image/jpeg", opts.thumb.length, opts.thumbWidth, opts.thumbHeight, opts.thumb, "db", null);
  return {
    originalId,
    previewId,
    thumbId,
    originalPath: mediaUrl(originalId),
    previewPath: mediaUrl(previewId),
    thumbPath: mediaUrl(thumbId),
  };
}

export async function removePlateMedia(sql: Sql, wallpaperId: string) {
  const files = await sql.query<{ id: string; storage: string | null; storage_key: string | null }>(
    `select id, storage, storage_key from media_files where id like $1`,
    [`${wallpaperId}-%`],
  );
  for (const file of files) {
    if (file.storage === "r2" && file.storage_key) {
      try {
        await r2Delete(file.storage_key);
      } catch (err) {
        console.error("[storage] r2 delete", file.storage_key, err);
      }
    }
  }
  if (files.length) {
    await sql.query(`delete from media_files where id like $1`, [`${wallpaperId}-%`]);
  }
}

export async function loadMediaFile(id: string) {
  const sql = await getSql();
  try {
    const rows = await sql.query<{
      mime: string;
      data: unknown;
      storage: string | null;
      storage_key: string | null;
    }>(
      `select mime, data, storage, storage_key from media_files where id = $1 limit 1`,
      [id],
    );
    const row = rows[0];
    if (!row) return null;
    const stored = await downloadStored(row.storage, row.storage_key, row.data);
    if (!stored) return null;
    return { mime: stored.mime || row.mime, bytes: stored.bytes };
  } catch {
    const rows = await sql.query<{ mime: string; data: unknown }>(
      `select mime, data from media_files where id = $1 limit 1`,
      [id],
    );
    const row = rows[0];
    if (!row || row.data == null) return null;
    const { bytesFromUnknown } = await import("@/lib/media");
    try {
      return { mime: row.mime, bytes: Buffer.from(bytesFromUnknown(row.data)) };
    } catch (err) {
      console.error("[storage] load", id, err);
      return null;
    }
  }
}

export async function r2Status() {
  const configured = await r2Configured();
  if (!configured) return { configured: false, ok: false as const };
  const ping = await pingR2();
  const cfg = await r2Config();
  return {
    configured: true,
    ok: ping.ok,
    error: ping.error,
    bucket: cfg.bucket,
    publicUrl: cfg.publicUrl,
    accountId: cfg.accountId,
  };
}