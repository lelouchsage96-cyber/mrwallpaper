import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, d as useRouterState, m as Outlet, v as Link, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { T as Compass, b as Heart, i as User, y as House } from "../_libs/lucide-react.mjs";
import { C as ensureProfile, K as t, w as getAppConfig, z as cn } from "./router-DQ8icHtZ.mjs";
import { t as useCurrentUserState } from "./use-current-user-DF_8Asza.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-qHsQdln4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var items = [
	{
		to: "/app",
		label: t.nav.home,
		icon: House,
		exact: true
	},
	{
		to: "/app/explore",
		label: t.nav.explore,
		icon: Compass
	},
	{
		to: "/app/favorites",
		label: t.nav.favorites,
		icon: Heart
	},
	{
		to: "/app/profile",
		label: t.nav.profile,
		icon: User
	}
];
function BottomNav() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		"aria-label": "Main",
		className: "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 backdrop-blur-md",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mx-auto grid max-w-lg grid-cols-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1",
			children: items.map((item) => {
				const active = "exact" in item && item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
				const Icon = item.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: item.to,
					"aria-current": active ? "page" : void 0,
					className: cn("flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-150 ease-out", active ? "text-fg" : "text-muted"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						className: "size-5",
						strokeWidth: active ? 2 : 1.7
					}), item.label]
				}) }, item.to);
			})
		})
	});
}
function AppShell() {
	const { user, isPending } = useCurrentUserState();
	const [maintenance, setMaintenance] = (0, import_react.useState)(false);
	const userId = user?.id ?? null;
	(0, import_react.useEffect)(() => {
		if (isPending || !userId) return;
		ensureProfile().catch(() => void 0);
	}, [userId, isPending]);
	(0, import_react.useEffect)(() => {
		getAppConfig().then((c) => setMaintenance(c.maintenanceMode)).catch(() => void 0);
	}, []);
	if (maintenance) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center px-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-sm font-display text-3xl text-fg",
			children: t.maintenance.title
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto max-w-5xl pb-24",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})]
	});
}
//#endregion
export { AppShell as component };
