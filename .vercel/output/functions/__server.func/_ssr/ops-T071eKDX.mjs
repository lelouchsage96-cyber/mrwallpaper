import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, d as useRouterState, m as Outlet, v as Link, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { S as Flag, _ as LayoutDashboard, c as SlidersHorizontal, p as Palette, r as Users, v as Image } from "../_libs/lucide-react.mjs";
import { K as t, v as MwMark, z as cn } from "./router-DQ8icHtZ.mjs";
import { t as useCurrentUserState } from "./use-current-user-DF_8Asza.mjs";
import { t as Button } from "./button-CNkutHzj.mjs";
import { t as EmptyState } from "./empty-state-BWSi2TR4.mjs";
import { i as getOpsSession, t as claimOpsAccess } from "./ops-C_QDXn1-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ops-T071eKDX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OpsShell() {
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [session, setSession] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(false);
	const [claiming, setClaiming] = (0, import_react.useState)(false);
	function load() {
		setError(false);
		getOpsSession().then(setSession).catch(() => setError(true));
	}
	(0, import_react.useEffect)(() => {
		if (isPending || !user) return;
		load();
	}, [user, isPending]);
	const nav = [
		{
			to: "/ops",
			label: t.ops.overview,
			exact: true,
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutDashboard, { className: "size-4" })
		},
		{
			to: "/ops/wallpapers",
			label: t.ops.wallpapers,
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "size-4" })
		},
		{
			to: "/ops/reports",
			label: t.ops.reports,
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "size-4" })
		},
		{
			to: "/ops/creators",
			label: t.ops.creators,
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, { className: "size-4" })
		},
		...session?.canAdmin ? [{
			to: "/ops/users",
			label: t.ops.users,
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4" })
		}, {
			to: "/ops/settings",
			label: t.ops.settings,
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "size-4" })
		}] : []
	];
	const roleLabel = session?.role && session.role in t.ops.roleLabels ? t.ops.roleLabels[session.role] : session?.role;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg lg:grid lg:grid-cols-[240px_minmax(0,1fr)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "sticky top-0 hidden h-dvh flex-col border-r border-border px-4 py-5 lg:flex",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/ops",
					className: "flex items-center gap-2.5 px-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MwMark, { className: "size-8 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate font-display text-xl leading-none text-fg",
							children: t.ops.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 block text-xs text-muted",
							children: t.ops.studio
						})]
					})]
				}),
				session?.canModerate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "mt-8 flex flex-1 flex-col gap-1",
					children: nav.map((item) => {
						const active = item.exact ? pathname === item.to || pathname === `${item.to}/` : pathname === item.to || pathname.startsWith(`${item.to}/`);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							className: cn("flex h-11 items-center gap-3 rounded-lg px-3 text-sm", active ? "bg-elevated text-fg" : "text-muted hover:text-fg"),
							children: [item.icon, item.label]
						}, item.to);
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-t border-border pt-4",
					children: [user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "truncate px-3 text-sm text-fg",
						children: [user.displayName ?? user.primaryEmail, session?.canModerate && roleLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 block text-xs text-muted",
							children: roleLabel
						}) : null]
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/app",
						className: "mt-2 flex h-11 items-center rounded-lg px-3 text-sm text-muted hover:text-fg",
						children: t.ops.backToApp
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b border-border lg:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 items-center gap-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MwMark, { className: "size-8 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-display text-xl text-fg",
							children: t.ops.brand
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/app",
						className: "shrink-0 text-sm text-muted hover:text-fg",
						children: t.ops.backToApp
					})]
				}), session?.canModerate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "flex gap-1 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					children: nav.map((item) => {
						const active = item.exact ? pathname === item.to || pathname === `${item.to}/` : pathname === item.to || pathname.startsWith(`${item.to}/`);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: item.to,
							className: cn("h-9 shrink-0 rounded-full px-4 text-sm leading-9", active ? "bg-fg text-bg" : "text-muted hover:text-fg"),
							children: item.label
						}, item.to);
					})
				}) : null]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8",
				children: isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 animate-pulse rounded-xl bg-elevated" }) : !user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					title: t.ops.signIn,
					action: {
						label: t.auth.signIn,
						onClick: () => {
							navigate({
								to: "/login",
								search: { next: "/ops" }
							});
						}
					}
				}) : error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					title: t.errors.generic,
					action: {
						label: t.errors.retry,
						onClick: load
					}
				}) : !session ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 animate-pulse rounded-xl bg-elevated" }) : session.canModerate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) : session.canClaim ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-md rounded-xl bg-elevated p-6 sm:p-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MwMark, { className: "size-12" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-5 text-xs font-medium tracking-widest text-subtle uppercase",
							children: t.ops.studio
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-2 font-display text-4xl text-fg",
							children: t.ops.claimTitle
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-relaxed text-muted",
							children: t.ops.claimBody
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-6 w-full",
							disabled: claiming,
							onClick: async () => {
								setClaiming(true);
								try {
									setSession(await claimOpsAccess());
								} catch {
									setError(true);
								} finally {
									setClaiming(false);
								}
							},
							children: t.ops.claim
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					title: t.ops.denied,
					action: {
						label: t.ops.backToApp,
						onClick: () => {
							navigate({ to: "/app" });
						}
					}
				})
			})]
		})]
	});
}
//#endregion
export { OpsShell as component };
