import { n as createMiddleware } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/optional-auth-yQgEKcq6.js
/** Like authMiddleware, but signed-out callers get userId: null instead of 401. */
var optionalAuthMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-BXBOTlUB.mjs").then((n) => n.n).then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { getSessionUser } = await import("./verify.server-DYWA13FN.mjs").then((n) => n.n);
	return next({ context: { userId: (await getSessionUser(context.bearerToken))?.id ?? null } });
});
//#endregion
export { optionalAuthMiddleware as t };
