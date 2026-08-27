import type { WallpaperCard, WallpaperPair } from "@/lib/types";

const LOCK_HINT =
  /\b(lock|orbit|moon|night|black|ridge|quiet|dusk|still|grain|dust|shadow|void|ink|soft)\b/i;
const HOME_HINT =
  /\b(home|line|water|harbour|harbor|grid|cross|widget|icon|paper|dune|thin|light|harbour|fresh|colour|color)\b/i;

export function duoSlug(lockId: string, homeId: string) {
  return `duo-${lockId}--${homeId}`;
}

export function parseDuoSlug(slug: string): { lockId: string; homeId: string } | null {
  if (!slug.startsWith("duo-")) return null;
  const rest = slug.slice(4);
  const at = rest.indexOf("--");
  if (at <= 0 || at >= rest.length - 2) return null;
  const lockId = rest.slice(0, at);
  const homeId = rest.slice(at + 2);
  if (!lockId || !homeId || lockId === homeId) return null;
  return { lockId, homeId };
}

export function daySeed(extra = "") {
  return `${new Date().toISOString().slice(0, 10)}:${extra}`;
}

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hay(w: WallpaperCard) {
  return `${w.id} ${w.title} ${w.categoryName}`;
}

function lockFit(w: WallpaperCard) {
  const text = hay(w);
  let score = Math.log10((w.downloadCount || 0) + (w.favoriteCount || 0) + 2);
  if (LOCK_HINT.test(text)) score += 5;
  if (HOME_HINT.test(text)) score -= 2;
  if (w.categorySlug === "black" || w.categorySlug === "minimal") score += 1;
  return score;
}

function homeFit(w: WallpaperCard) {
  const text = hay(w);
  let score = Math.log10((w.downloadCount || 0) + (w.favoriteCount || 0) + 2);
  if (HOME_HINT.test(text)) score += 5;
  if (LOCK_HINT.test(text)) score -= 2;
  if (w.categorySlug === "abstract" || w.categorySlug === "nature") score += 1;
  return score;
}

function pairScore(lock: WallpaperCard, home: WallpaperCard) {
  let score = lockFit(lock) + homeFit(home);
  if (lock.categoryId === home.categoryId) score += 4;
  else score += 1;
  score += Math.log10(lock.downloadCount + home.downloadCount + 2);
  return score;
}

function namedPair(lock: WallpaperCard, home: WallpaperCard, suggested: boolean): WallpaperPair {
  return {
    id: duoSlug(lock.id, home.id),
    slug: duoSlug(lock.id, home.id),
    name: `${lock.title} + ${home.title}`,
    description: "Suggested lock and home, composed to live together.",
    lock,
    home,
    suggested,
  };
}

export function suggestDuos(
  pool: WallpaperCard[],
  opts: { count: number; seed: string; used?: Set<string> },
): WallpaperPair[] {
  const still = pool.filter((w) => !w.isLive && w.deviceType !== "tablet");
  if (still.length < 2) return [];
  const used = new Set(opts.used);
  const candidates: { lock: WallpaperCard; home: WallpaperCard; score: number }[] = [];

  for (let i = 0; i < still.length; i += 1) {
    for (let j = 0; j < still.length; j += 1) {
      if (i === j) continue;
      const a = still[i];
      const b = still[j];
      const lock = lockFit(a) >= lockFit(b) ? a : b;
      const home = lock.id === a.id ? b : a;
      if (lock.id === home.id) continue;
      if (used.has(lock.id) && used.has(home.id)) continue;
      candidates.push({ lock, home, score: pairScore(lock, home) });
    }
  }

  candidates.sort((x, y) => y.score - x.score);
  const rotate = candidates.length ? hash(opts.seed) % Math.min(candidates.length, 12) : 0;
  const ranked = rotate ? [...candidates.slice(rotate), ...candidates.slice(0, rotate)] : candidates;

  const out: WallpaperPair[] = [];
  const taken = new Set(used);
  for (const row of ranked) {
    if (out.length >= opts.count) break;
    if (taken.has(row.lock.id) || taken.has(row.home.id)) continue;
    taken.add(row.lock.id);
    taken.add(row.home.id);
    out.push(namedPair(row.lock, row.home, true));
  }
  return out;
}

export function suggestCompanion(plate: WallpaperCard, pool: WallpaperCard[]): WallpaperPair | null {
  const still = pool.filter((w) => w.id !== plate.id && !w.isLive && w.deviceType !== "tablet");
  if (!still.length) return null;
  const asLock = lockFit(plate) >= homeFit(plate);
  let best: WallpaperCard | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const other of still) {
    const lock = asLock ? plate : other;
    const home = asLock ? other : plate;
    let score = pairScore(lock, home);
    score += asLock ? homeFit(other) : lockFit(other);
    if (score > bestScore) {
      bestScore = score;
      best = other;
    }
  }
  if (!best) return null;
  return namedPair(asLock ? plate : best, asLock ? best : plate, true);
}

export function mergeHomeDuos(curated: WallpaperPair[], suggested: WallpaperPair[], limit = 6) {
  const used = new Set<string>();
  const out: WallpaperPair[] = [];
  function take(pair: WallpaperPair) {
    if (out.length >= limit) return;
    if (used.has(pair.lock.id) || used.has(pair.home.id)) return;
    used.add(pair.lock.id);
    used.add(pair.home.id);
    out.push(pair);
  }
  if (suggested[0]) take({ ...suggested[0], suggested: true });
  const day = hash(daySeed("home")) % Math.max(curated.length, 1);
  const rotated = curated.length ? [...curated.slice(day), ...curated.slice(0, day)] : [];
  for (const pair of rotated) take(pair);
  for (const pair of suggested.slice(1)) take({ ...pair, suggested: true });
  if (out[0]) out[0] = { ...out[0], suggested: true };
  return out;
}