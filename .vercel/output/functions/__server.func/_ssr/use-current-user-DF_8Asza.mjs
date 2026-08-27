import { o as __toESM } from "../_runtime.mjs";
import { U as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as authClient } from "./client-BXBOTlUB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-current-user-DF_8Asza.js
var import_react = /* @__PURE__ */ __toESM(require_react());
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const raw = data?.user;
	return {
		user: (0, import_react.useMemo)(() => {
			if (!raw) return null;
			return {
				id: raw.id,
				displayName: raw.name ?? null,
				primaryEmail: raw.email ?? null,
				profileImageUrl: raw.image ?? null,
				isDevFallback: false
			};
		}, [
			raw?.id,
			raw?.name,
			raw?.email,
			raw?.image
		]),
		isPending
	};
}
//#endregion
export { useCurrentUserState as t };
