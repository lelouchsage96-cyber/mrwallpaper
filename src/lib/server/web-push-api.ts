import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

const subscriptionSchema = z.object({
  endpoint: z.string().min(10).max(2048),
  p256dh: z.string().min(40).max(256),
  auth: z.string().min(16).max(128),
  userAgent: z.string().max(500).optional(),
});

function validEndpoint(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validSubscriptionKeys(p256dh: string, auth: string): boolean {
  try {
    const publicKey = Buffer.from(p256dh, "base64url");
    const authSecret = Buffer.from(auth, "base64url");
    return publicKey.length === 65 && publicKey[0] === 4 && authSecret.length >= 16;
  } catch {
    return false;
  }
}

export const getPushConfig = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const { ensureVapidKeys, notificationsFeatureEnabled } = await import("./web-push-delivery");
    const enabled = await notificationsFeatureEnabled(sql);
    const keys = await ensureVapidKeys(sql);
    const subscriptions = await sql.query<{ n: number }>(
      `select count(*)::int as n from push_subscriptions where user_id = $1`,
      [context.userId],
    );
    const pref = await sql.query<{ notifications_on: boolean | number }>(
      `select notifications_on from profiles where user_id = $1 limit 1`,
      [context.userId],
    );
    return {
      enabled,
      publicKey: keys.publicKey,
      hasSubscription: (subscriptions[0]?.n ?? 0) > 0,
      notificationsOn:
        !pref[0] || pref[0].notifications_on === true || pref[0].notifications_on === 1,
    };
  });

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(subscriptionSchema)
  .handler(async ({ context, data }) => {
    if (!validEndpoint(data.endpoint) || !validSubscriptionKeys(data.p256dh, data.auth)) {
      return { ok: false as const, error: "invalid_subscription" as const };
    }

    const sql = await getSql();
    const { notificationsFeatureEnabled } = await import("./web-push-delivery");
    if (!(await notificationsFeatureEnabled(sql))) {
      return { ok: false as const, error: "disabled" as const };
    }

    await sql.query(
      `insert into profiles (user_id, notifications_on)
       values ($1, true)
       on conflict (user_id) do update
         set notifications_on = true, updated_at = now()`,
      [context.userId],
    );
    await sql.query(
      `insert into push_subscriptions
         (id, user_id, endpoint, p256dh, auth_secret, user_agent)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (endpoint) do update
         set user_id = excluded.user_id,
             p256dh = excluded.p256dh,
             auth_secret = excluded.auth_secret,
             user_agent = excluded.user_agent,
             failure_count = 0,
             updated_at = now()`,
      [
        crypto.randomUUID(),
        context.userId,
        data.endpoint,
        data.p256dh,
        data.auth,
        data.userAgent || null,
      ],
    );
    return { ok: true as const };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ endpoint: z.string().min(10).max(2048) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql.query(
      `delete from push_subscriptions where user_id = $1 and endpoint = $2`,
      [context.userId, data.endpoint],
    );
    return { ok: true as const };
  });

export const sendPushTest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { sendPushToUser } = await import("./web-push-delivery");
    const sent = await sendPushToUser(context.userId, {
      title: "Mr Wallpapers notifications are on",
      body: "You’re ready to receive new wallpapers and featured picks.",
      url: "/app/notifications",
      tag: "push-test",
    });
    return { ok: sent > 0, sent };
  });
