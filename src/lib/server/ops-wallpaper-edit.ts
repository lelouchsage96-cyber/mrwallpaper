import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { parseDeviceType, type DeviceType } from "@/lib/device";
import { resolveOwnedThumb } from "@/lib/media";
import { fetchCategories } from "./queries";
import type { Category } from "@/lib/types";

const MAX_TAGS = 8;

class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

async function requireAdmin(userId: string): Promise<Sql> {
  const sql = await getSql();
  const rows = await sql.query<{ role: string; status: string }>(
    `select role, status from profiles where user_id = $1 limit 1`,
    [userId],
  );
  const row = rows[0];
  if (!row || row.role !== "admin" || row.status !== "active") throw new ForbiddenError();
  return sql;
}

function slugifyTag(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function normalizeTags(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const name = value.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 24);
    if (name.length < 2) continue;
    const slug = slugifyTag(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(name);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

async function replaceTags(sql: Sql, wallpaperId: string, names: string[]) {
  await sql.query(`delete from wallpaper_tags where wallpaper_id = $1`, [wallpaperId]);
  for (const name of names) {
    const slug = slugifyTag(name);
    if (!slug) continue;
    const id = `tag-${slug}`.slice(0, 40);
    await sql.query(
      `insert into tags (id, slug, name) values ($1, $2, $3)
       on conflict (slug) do update set name = excluded.name`,
      [id, slug, name],
    );
    const rows = await sql.query<{ id: string }>(`select id from tags where slug = $1 limit 1`, [slug]);
    if (!rows[0]?.id) continue;
    await sql.query(
      `insert into wallpaper_tags (wallpaper_id, tag_id) values ($1, $2) on conflict do nothing`,
      [wallpaperId, rows[0].id],
    );
  }
}

export type OpsWallpaperEditData = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  deviceType: DeviceType;
  status: "draft" | "pending" | "approved" | "rejected" | "removed";
  thumbnailUrl: string | null;
  tags: string[];
};

export const getOpsWallpaperEdit = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ wallpaperId: z.string().min(1) }))
  .handler(async ({ context, data }): Promise<{ wallpaper: OpsWallpaperEditData | null; categories: Category[] }> => {
    const sql = await requireAdmin(context.userId);
    const rows = await sql.query<{
      id: string;
      title: string;
      description: string | null;
      category_id: string;
      category_name: string;
      device_type: string | null;
      status: string;
      slug: string | null;
      thumbnail_url: string | null;
    }>(
      `select w.id, w.title, w.description, w.category_id, c.name as category_name,
              w.device_type, w.status, w.slug,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
       from wallpapers w
       join categories c on c.id = w.category_id
       where w.id = $1
       limit 1`,
      [data.wallpaperId],
    );
    const row = rows[0];
    const categories = await fetchCategories();
    if (!row) return { wallpaper: null, categories };
    const tagRows = await sql.query<{ name: string }>(
      `select t.name
       from wallpaper_tags wt
       join tags t on t.id = wt.tag_id
       where wt.wallpaper_id = $1
       order by t.name`,
      [data.wallpaperId],
    );
    const allowedStatus = ["draft", "pending", "approved", "rejected", "removed"] as const;
    const status = allowedStatus.includes(row.status as (typeof allowedStatus)[number])
      ? (row.status as OpsWallpaperEditData["status"])
      : "draft";
    return {
      categories,
      wallpaper: {
        id: row.id,
        title: row.title,
        description: row.description || "",
        categoryId: row.category_id,
        categoryName: row.category_name,
        deviceType: parseDeviceType(row.device_type),
        status,
        thumbnailUrl: resolveOwnedThumb(row.id, row.thumbnail_url, row.slug),
        tags: tagRows.map((t) => t.name),
      },
    };
  });

export const updateOpsWallpaperMetadata = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      wallpaperId: z.string().min(1),
      title: z.string().trim().min(2).max(60),
      description: z.string().trim().max(280),
      categoryId: z.string().min(1),
      deviceType: z.enum(["phone", "tablet", "both"]),
      status: z.enum(["draft", "pending", "approved", "rejected", "removed"]),
      tags: z.array(z.string()).max(MAX_TAGS),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    const cats = await fetchCategories();
    if (!cats.some((c) => c.id === data.categoryId)) {
      return { ok: false as const, error: "category" as const };
    }
    const tags = normalizeTags(data.tags);
    await sql.query(
      `update wallpapers
       set title = $1,
           description = $2,
           category_id = $3,
           device_type = $4,
           status = $5,
           updated_at = now()
       where id = $6`,
      [data.title.trim(), data.description.trim(), data.categoryId, data.deviceType, data.status, data.wallpaperId],
    );
    await replaceTags(sql, data.wallpaperId, tags);
    return { ok: true as const };
  });
