//#region node_modules/.nitro/vite/services/ssr/assets/hash-DS_bR68I.js
async function sha256Hex(data) {
	const buf = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
async function sha256Blob(file) {
	return sha256Hex(await file.arrayBuffer());
}
var SHA256 = /^[a-f0-9]{64}$/;
//#endregion
export { sha256Blob as n, SHA256 as t };
