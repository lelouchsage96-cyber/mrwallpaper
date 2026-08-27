import { b as TASTE_KEY } from "./router-DQ8icHtZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/taste-aiRPFToT.js
function readLocalTaste() {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(TASTE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
	} catch {
		return [];
	}
}
function writeLocalTaste(ids) {
	localStorage.setItem(TASTE_KEY, JSON.stringify(ids));
}
//#endregion
export { writeLocalTaste as n, readLocalTaste as t };
