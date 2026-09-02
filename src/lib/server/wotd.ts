import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import type { WallpaperCard } from "@/lib/types";
import { optionalAuthMiddleware } from "./optional-auth";
import { fetchCardsByIds } from "./queries";

export const getSelectedWallpaperOfDay = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .handler(async ({ context }): Promise<WallpaperCard | null> => {
    try {
      const sql = await getSql();
      const rows = await sql.query<{ wallpaper_id: string }>(
        `select f.wallpaper_id
         from featured_wallpapers f
         join wallpapers w on w.id = f.wallpaper_id
         where f.slot = 'wotd'
           and f.starts_at <= now()
           and (f.ends_at is null or f.ends_at > now())
           and w.status = 'approved'
         order by f.priority desc, f.starts_at desc
         limit 1`,
      );
      const wallpaperId = rows[0]?.wallpaper_id;
      if (!wallpaperId) return null;
      const cards = await fetchCardsByIds([wallpaperId], context.userId);
      return cards[0] ?? null;
    } catch (err) {
      console.error("[wotd] selected wallpaper", err);
      return null;
    }
  });
