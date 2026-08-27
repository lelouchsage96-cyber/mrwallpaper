import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { k as getSql, o as authMiddleware } from "./queries-bIh47-yB.mjs";
import { t as optionalAuthMiddleware } from "./optional-auth-yQgEKcq6.mjs";
import { gn as object, un as array, yn as string } from "../_libs/@better-auth/core+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/studio-B5cbP66D.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
async function notify(userId, title, body, href, wallpaperId = null) {
	await (await getSql()).query(`insert into notifications (id, user_id, kind, title, body, href, wallpaper_id)
     values ($1, $2, 'system', $3, $4, $5, $6)`, [
		crypto.randomUUID(),
		userId,
		title,
		body,
		href,
		wallpaperId
	]);
}
var listCreators = createServerFn({ method: "GET" }).handler(createSsrRpc("44dbf2d375a90bc52d01f9258fa1be2bab28e7ae402e3f4638b3979e85014c5d"));
var getCreatorPage = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).validator(object({ slug: string() })).handler(createSsrRpc("6f9cbaa11f2694f2073332a3ddb40877137464849f374546a7daec6341a8b98b"));
var getStudioDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("53e7c756528605e719cc540d4691eb0ec489d177447ab478ec0b549da1ec816e"));
var applyToStudio = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	displayName: string().trim().min(2).max(40),
	slug: string().trim().min(3).max(32),
	bio: string().trim().max(280).optional()
})).handler(createSsrRpc("4bad9d66b6debb590e6fa38b25502c05546e9ffe63f7eee00b3a9a99279ec7d9"));
var listStudioPlates = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("930e8c0fd7f8e6c7437827e257e9de8daa6e21cdf1d3f4b7db90f0e63ec4b97a"));
var checkStudioDuplicate = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	hashes: array(string().regex(/^[a-f0-9]{64}$/)).min(1).max(4),
	excludeId: string().min(1).nullish()
})).handler(createSsrRpc("0362c0535c5c3ae998836e8cc123daa35ee102ac157f615f36e20eb593455c69"));
var getStudioPiece = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ id: string().min(1) })).handler(createSsrRpc("ec34752662581a89c192d07295104972ce1bac2af98770ddd70999b3d5a24203"));
var uploadStudioPlate = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	if (typeof FormData !== "undefined" && input instanceof FormData) return input;
	throw new Error("Expected FormData");
}).handler(createSsrRpc("cdfe48d0bbccc4a8f284660a011fc44322c5109c09f830a9193575f8764567ab"));
var updateStudioPlate = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	if (typeof FormData !== "undefined" && input instanceof FormData) return input;
	throw new Error("Expected FormData");
}).handler(createSsrRpc("943ac75d56c4910f93e9fc01e57cb651f81a8c91dc99b7e08f2a986a2e91fcb9"));
//#endregion
export { getStudioDashboard as a, listStudioPlates as c, uploadStudioPlate as d, getCreatorPage as i, notify as l, checkStudioDuplicate as n, getStudioPiece as o, createSsrRpc as r, listCreators as s, applyToStudio as t, updateStudioPlate as u };
