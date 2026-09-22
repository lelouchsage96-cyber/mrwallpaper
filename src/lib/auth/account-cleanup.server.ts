import { getSql } from "@/lib/db";

/**
 * Remove or unlink app-owned data before the Better Auth user is deleted.
 * Authentication records (account/session/user) are owned by Better Auth.
 */
export async function cleanupAccountData(userId: string): Promise<void> {
  const sql = await getSql();

  // Keep already-uploaded submission records for moderation/provenance, but
  // sever their link to the deleted account. Pending submissions should not
  // continue through review after the submitter deletes their account.
  await sql.query(
    `update wallpaper_submissions
     set user_id = 'deleted',
         status = case when status = 'pending' then 'rejected' else status end,
         review_note = case
           when status = 'pending' and coalesce(review_note, '') = '' then 'Submitter deleted their account.'
           else review_note
         end,
         updated_at = now()
     where user_id = $1`,
    [userId],
  );

  await sql.query(
    `update wallpapers set creator_id = null, updated_at = now() where creator_id = $1`,
    [userId],
  );

  const tables = [
    "favorites",
    "downloads",
    "download_authorizations",
    "push_subscriptions",
    "notifications",
    "user_tastes",
    "wallpaper_views",
    "reports",
    "subscriptions",
    "creator_profiles",
    "search_events",
    "ad_impressions",
    "ai_generation_events",
    "profiles",
  ] as const;

  for (const table of tables) {
    await sql.query(`delete from ${table} where user_id = $1`, [userId]);
  }
}
