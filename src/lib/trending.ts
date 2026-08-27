import type { WallpaperCard } from "@/lib/types";

const SLOT_MS = 15_000;

export function trendingSlot(now = Date.now()): number {
  return Math.floor(now / SLOT_MS);
}

/** Deterministic weighted shuffle: higher-ranked (more viewed) plates appear more often. */
export function shuffleTrendingByViews(
  items: WallpaperCard[],
  slot: number,
  take = 8,
): WallpaperCard[] {
  if (items.length <= take) return items;
  const rng = mulberry32(slot ^ 0x9e3779b9);
  const pool = items.map((item, rank) => ({
    item,
    weight: (items.length - rank) ** 2,
  }));
  const picked: WallpaperCard[] = [];
  while (picked.length < take && pool.length > 0) {
    const total = pool.reduce((sum, row) => sum + row.weight, 0);
    let cursor = rng() * total;
    let index = pool.length - 1;
    for (let i = 0; i < pool.length; i += 1) {
      cursor -= pool[i].weight;
      if (cursor <= 0) {
        index = i;
        break;
      }
    }
    picked.push(pool[index].item);
    pool.splice(index, 1);
  }
  return picked;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
