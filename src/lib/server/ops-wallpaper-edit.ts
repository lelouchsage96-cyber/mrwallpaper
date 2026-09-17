import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { parseDeviceType, type DeviceType } from "@/lib/device";
import { resolveOwnedThumb } from "@/lib/media";
import { slugify } from "@/lib/seo";
import type { Category } from "@/lib/types";
import {
  MAX_WALLPAPER_TAGS,
  cleanWallpaperDescription,
  cleanWallpaperTitle,
  normalizeWallpaperTags,
  slugifyWallpaperTag,
} from "@/lib/wallpaper-metadata";
import { fetchCategories } from "./queries";

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

async function replaceTags(sql: Sql, wallpaperId: string, names: string[]) {
  await sql.query(`delete from wallpaper_tags where wallpaper_id = $1`, [wallpaperId]);
  for (const name of names) {
    const slug = slugifyWallpaperTag(name);
    if (!slug) continue;
    const id = `tag-${slug}`;
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
  slug: string;
  seoTitle: string;
  seoDescription: string;
  altText: string;
  robots: "index" | "noindex";
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
      seo_title: string | null;
      seo_description: string | null;
      alt_text: string | null;
      robots: string | null;
    }>(
      `select w.id, w.title, w.description, w.category_id, c.name as category_name,
              w.device_type, w.status, w.slug, w.seo_title, w.seo_description,
              w.alt_text, w.robots,
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
        slug: row.slug || row.id,
        seoTitle: row.seo_title || "",
        seoDescription: row.seo_description || "",
        altText: row.alt_text || row.title,
        robots: row.robots === "noindex" ? "noindex" : "index",
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
      tags: z.array(z.string()).max(MAX_WALLPAPER_TAGS),
      slug: z.string().trim().min(2).max(96),
      seoTitle: z.string().trim().max(75),
      seoDescription: z.string().trim().max(180),
      altText: z.string().trim().max(180),
      robots: z.enum(["index", "noindex"]),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    const cats = await fetchCategories();
    if (!cats.some((c) => c.id === data.categoryId)) {
      return { ok: false as const, error: "category" as const };
    }

    const currentRows = await sql.query<{ slug: string | null }>(
      `select slug from wallpapers where id = $1 limit 1`,
      [data.wallpaperId],
    );
    const current = currentRows[0];
    if (!current) return { ok: false as const, error: "missing" as const };

    const title = cleanWallpaperTitle(data.title);
    if (title.length < 2) return { ok: false as const, error: "title" as const };
    const description = cleanWallpaperDescription(data.description);
    const desiredSlug = slugify(data.slug || title);
    if (!desiredSlug) return { ok: false as const, error: "slug" as const };

    const slugHit = await sql.query<{ id: string }>(
      `select id from wallpapers where slug = $1 and id <> $2 limit 1`,
      [desiredSlug, data.wallpaperId],
    );
    if (slugHit[0]) return { ok: false as const, error: "slug" as const };

    const oldSlug = current.slug || data.wallpaperId;
    const oldPath = `/wallpaper/${oldSlug}`;
    const newPath = `/wallpaper/${desiredSlug}`;
    const tags = normalizeWallpaperTags(data.tags);
    const altText = cleanWallpaperTitle(data.altText) || title;
    const seoTitle = data.seoTitle.trim() || null;
    const seoDescription = data.seoDescription.trim() || null;

    await sql.query(
      `update wallpapers
       set title = $1,
           description = $2,
           category_id = $3,
           device_type = $4,
           status = $5,
           slug = $6,
           seo_title = $7,
           seo_description = $8,
           alt_text = $9,
           robots = $10,
           canonical_path = case
             when canonical_path is null or canonical_path = '' or canonical_path = $11 then null
             else canonical_path
           end,
           updated_at = now()
       where id = $12`,
      [
        title,
        description,
        data.categoryId,
        data.deviceType,
        data.status,
        desiredSlug,
        seoTitle,
        seoDescription,
        altText,
        data.robots,
        oldPath,
        data.wallpaperId,
      ],
    );

    if (oldPath !== newPath) {
      await sql.query(
        `insert into seo_redirects (from_path, to_path, status)
         values ($1, $2, 301)
         on conflict (from_path)
         do update set to_path = excluded.to_path, status = 301`,
        [oldPath, newPath],
      );
      await sql.query(
        `update seo_redirects
         set to_path = $1
         where to_path = $2 and from_path <> $1`,
        [newPath, oldPath],
      );
    }

    await replaceTags(sql, data.wallpaperId, tags);
    return { ok: true as const, slug: desiredSlug };
  });