import { TASTE_KEY } from "./storage-keys";

export function readLocalTaste(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TASTE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function writeLocalTaste(ids: string[]) {
  localStorage.setItem(TASTE_KEY, JSON.stringify(ids));
}
