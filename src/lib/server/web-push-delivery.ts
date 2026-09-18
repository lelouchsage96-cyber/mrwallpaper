import {
  createCipheriv,
  createECDH,
  createHmac,
  createPrivateKey,
  generateKeyPairSync,
  randomBytes,
  sign,
} from "node:crypto";
import { getSql, type Sql } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

type EcJwk = {
  kty: "EC";
  crv: "P-256";
  x: string;
  y: string;
  d?: string;
};

type VapidKeys = {
  publicKey: string;
  publicJwk: EcJwk;
  privateJwk: EcJwk;
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_secret: string;
};

export type PushMessage = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

function parseJson<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function toBase64Url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

function hmacSha256(key: Buffer, data: Buffer): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function hkdfExpand(prk: Buffer, info: Buffer, length: number): Buffer {
  return hmacSha256(prk, Buffer.concat([info, Buffer.from([1])])).subarray(0, length);
}

function isVapidKeys(value: VapidKeys | null): value is VapidKeys {
  return Boolean(
    value?.publicKey &&
      value.publicJwk?.kty === "EC" &&
      value.publicJwk?.crv === "P-256" &&
      value.publicJwk.x &&
      value.publicJwk.y &&
      value.privateJwk?.kty === "EC" &&
      value.privateJwk?.crv === "P-256" &&
      value.privateJwk.d,
  );
}

function generateVapidKeys(): VapidKeys {
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const publicJwk = publicKey.export({ format: "jwk" }) as EcJwk;
  const privateJwk = privateKey.export({ format: "jwk" }) as EcJwk;
  const rawPublic = Buffer.concat([
    Buffer.from([4]),
    fromBase64Url(publicJwk.x),
    fromBase64Url(publicJwk.y),
  ]);
  return {
    publicKey: toBase64Url(rawPublic),
    publicJwk,
    privateJwk,
  };
}

export async function ensureVapidKeys(sql?: Sql): Promise<VapidKeys> {
  const db = sql ?? (await getSql());
  const rows = await db.query<{ value: unknown }>(
    `select value from app_settings where key = 'web_push_vapid' limit 1`,
  );
  const existing = parseJson<VapidKeys>(rows[0]?.value);
  if (isVapidKeys(existing)) return existing;

  const generated = generateVapidKeys();
  if (rows[0]) {
    await db.query(
      `update app_settings set value = $1::jsonb, updated_at = now()
       where key = 'web_push_vapid'`,
      [JSON.stringify(generated)],
    );
    return generated;
  }

  await db.query(
    `insert into app_settings (key, value) values ('web_push_vapid', $1::jsonb)
     on conflict (key) do nothing`,
    [JSON.stringify(generated)],
  );
  const after = await db.query<{ value: unknown }>(
    `select value from app_settings where key = 'web_push_vapid' limit 1`,
  );
  const persisted = parseJson<VapidKeys>(after[0]?.value);
  return isVapidKeys(persisted) ? persisted : generated;
}

export async function notificationsFeatureEnabled(sql?: Sql): Promise<boolean> {
  const db = sql ?? (await getSql());
  const rows = await db.query<{ value: unknown }>(
    `select value from app_settings where key = 'feature_flags' limit 1`,
  );
  const flags = parseJson<{ notifications_enabled?: boolean }>(rows[0]?.value);
  return flags?.notifications_enabled !== false;
}

function encryptPayload(payload: Buffer, p256dh: string, auth: string): Buffer {
  const uaPublic = fromBase64Url(p256dh);
  const authSecret = fromBase64Url(auth);
  if (uaPublic.length !== 65 || uaPublic[0] !== 4) throw new Error("Invalid push public key.");
  if (authSecret.length < 16) throw new Error("Invalid push auth secret.");

  const ephemeral = createECDH("prime256v1");
  const appPublic = ephemeral.generateKeys();
  const sharedSecret = ephemeral.computeSecret(uaPublic);

  const prkKey = hmacSha256(authSecret, sharedSecret);
  const keyInfo = Buffer.concat([
    Buffer.from("WebPush: info"),
    Buffer.from([0]),
    uaPublic,
    appPublic,
  ]);
  const ikm = hkdfExpand(prkKey, keyInfo, 32);

  const salt = randomBytes(16);
  const prk = hmacSha256(salt, ikm);
  const cek = hkdfExpand(
    prk,
    Buffer.concat([Buffer.from("Content-Encoding: aes128gcm"), Buffer.from([0])]),
    16,
  );
  const nonce = hkdfExpand(
    prk,
    Buffer.concat([Buffer.from("Content-Encoding: nonce"), Buffer.from([0])]),
    12,
  );

  const plaintext = Buffer.concat([payload, Buffer.from([2])]);
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  const recordSize = 4096;
  const header = Buffer.alloc(21);
  salt.copy(header, 0);
  header.writeUInt32BE(recordSize, 16);
  header[20] = appPublic.length;
  return Buffer.concat([header, appPublic, ciphertext]);
}

function vapidJwt(endpoint: string, keys: VapidKeys): string {
  const audience = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const claims = toBase64Url(
    JSON.stringify({
      aud: audience,
      exp: now + 12 * 60 * 60,
      sub: SITE_URL,
    }),
  );
  const unsigned = `${header}.${claims}`;
  const signature = sign("sha256", Buffer.from(unsigned), {
    key: createPrivateKey({ key: keys.privateJwk, format: "jwk" }),
    dsaEncoding: "ieee-p1363",
  });
  return `${unsigned}.${toBase64Url(signature)}`;
}

async function sendOne(
  sql: Sql,
  subscription: PushSubscriptionRow,
  message: PushMessage,
  keys: VapidKeys,
): Promise<boolean> {
  const payload = Buffer.from(
    JSON.stringify({
      title: message.title,
      body: message.body,
      url: message.url,
      tag: message.tag || "mrwallpapers",
    }),
    "utf8",
  );
  if (payload.length > 3000) throw new Error("Push payload is too large.");

  const encrypted = encryptPayload(payload, subscription.p256dh, subscription.auth_secret);
  let response: Response;
  try {
    response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${vapidJwt(subscription.endpoint, keys)}, k=${keys.publicKey}`,
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: "86400",
        Urgency: "normal",
      },
      body: encrypted as unknown as BodyInit,
    });
  } catch (error) {
    await sql.query(
      `update push_subscriptions
          set failure_count = failure_count + 1, updated_at = now()
        where id = $1`,
      [subscription.id],
    );
    console.error("[push] network", error);
    return false;
  }

  if (response.ok) {
    await sql.query(
      `update push_subscriptions
          set last_success_at = now(), failure_count = 0, updated_at = now()
        where id = $1`,
      [subscription.id],
    );
    return true;
  }

  if (response.status === 404 || response.status === 410) {
    await sql.query(`delete from push_subscriptions where id = $1`, [subscription.id]);
    return false;
  }

  await sql.query(
    `update push_subscriptions
        set failure_count = failure_count + 1, updated_at = now()
      where id = $1`,
    [subscription.id],
  );
  console.error("[push] delivery", response.status, await response.text().catch(() => ""));
  return false;
}

export async function sendPushToUser(userId: string, message: PushMessage): Promise<number> {
  const sql = await getSql();
  if (!(await notificationsFeatureEnabled(sql))) return 0;
  const prefs = await sql.query<{ notifications_on: boolean | number }>(
    `select notifications_on from profiles
     where user_id = $1 and status = 'active' limit 1`,
    [userId],
  );
  if (prefs[0] && prefs[0].notifications_on !== true && prefs[0].notifications_on !== 1) return 0;

  const subscriptions = await sql.query<PushSubscriptionRow>(
    `select id, user_id, endpoint, p256dh, auth_secret
     from push_subscriptions
     where user_id = $1 and failure_count < 5
     order by updated_at desc`,
    [userId],
  );
  if (!subscriptions.length) return 0;

  const keys = await ensureVapidKeys(sql);
  const results = await Promise.allSettled(
    subscriptions.map((subscription) => sendOne(sql, subscription, message, keys)),
  );
  return results.reduce(
    (count, result) => count + (result.status === "fulfilled" && result.value ? 1 : 0),
    0,
  );
}

async function createNotificationAndPush(input: {
  userId: string;
  kind: "wotd" | "pair" | "collection" | "premium" | "taste" | "report" | "system";
  title: string;
  body: string;
  href: string;
  wallpaperId?: string | null;
  dedupeKey: string;
}) {
  const sql = await getSql();
  const inserted = await sql.query<{ id: string }>(
    `insert into notifications
       (id, user_id, kind, title, body, href, wallpaper_id, dedupe_key)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict do nothing
     returning id`,
    [
      crypto.randomUUID(),
      input.userId,
      input.kind,
      input.title,
      input.body,
      input.href,
      input.wallpaperId ?? null,
      input.dedupeKey,
    ],
  );
  if (!inserted[0]) return false;
  await sendPushToUser(input.userId, {
    title: input.title,
    body: input.body,
    url: input.href,
    tag: input.dedupeKey,
  });
  return true;
}

async function forUsersInBatches(userIds: string[], task: (userId: string) => Promise<unknown>) {
  for (let i = 0; i < userIds.length; i += 20) {
    await Promise.allSettled(userIds.slice(i, i + 20).map(task));
  }
}

export async function notifyTasteSubscribersForWallpaper(input: {
  wallpaperId: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
}) {
  const sql = await getSql();
  if (!(await notificationsFeatureEnabled(sql))) return;
  const rows = await sql.query<{ user_id: string }>(
    `select distinct ut.user_id
     from user_tastes ut
     join profiles p on p.user_id = ut.user_id
     where ut.category_id = $1
       and p.status = 'active'
       and p.notifications_on = true`,
    [input.categoryId],
  );
  if (!rows.length) return;
  const date = new Date().toISOString().slice(0, 10);
  const href = `/wallpapers/${input.categorySlug}`;
  await forUsersInBatches(
    rows.map((row) => row.user_id),
    (userId) =>
      createNotificationAndPush({
        userId,
        kind: "taste",
        title: `New ${input.categoryName} wallpapers`,
        body: `Fresh picks from ${input.categoryName} are now available.`,
        href,
        wallpaperId: input.wallpaperId,
        dedupeKey: `taste:${input.categoryId}:${date}`,
      }),
  );
}

export async function notifyWallpaperOfDay(input: {
  wallpaperId: string;
  title: string;
  slug: string;
}) {
  const sql = await getSql();
  if (!(await notificationsFeatureEnabled(sql))) return;
  const rows = await sql.query<{ user_id: string }>(
    `select user_id from profiles
     where status = 'active' and notifications_on = true`,
  );
  if (!rows.length) return;
  const href = `/wallpaper/${input.slug || input.wallpaperId}`;
  await forUsersInBatches(
    rows.map((row) => row.user_id),
    (userId) =>
      createNotificationAndPush({
        userId,
        kind: "wotd",
        title: "Wallpaper of the Day",
        body: input.title,
        href,
        wallpaperId: input.wallpaperId,
        dedupeKey: `wotd:${input.wallpaperId}`,
      }),
  );
}

export async function notifyCollectionDrop(input: {
  collectionId: string;
  name: string;
  slug: string;
}) {
  const sql = await getSql();
  if (!(await notificationsFeatureEnabled(sql))) return;
  const rows = await sql.query<{ user_id: string }>(
    `select user_id from profiles
     where status = 'active' and notifications_on = true`,
  );
  if (!rows.length) return;
  const href = `/collection/${input.slug}`;
  await forUsersInBatches(
    rows.map((row) => row.user_id),
    (userId) =>
      createNotificationAndPush({
        userId,
        kind: "collection",
        title: "New wallpaper collection",
        body: `${input.name} is now available.`,
        href,
        wallpaperId: null,
        dedupeKey: `collection:${input.collectionId}`,
      }),
  );
}
