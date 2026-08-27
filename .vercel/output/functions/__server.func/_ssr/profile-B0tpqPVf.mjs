import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, v as Link, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { ot as brand } from "./queries-bIh47-yB.mjs";
import { a as getStudioDashboard } from "./studio-B5cbP66D.mjs";
import { E as ChevronRight } from "../_libs/lucide-react.mjs";
import { D as getPremiumStatus, K as t, R as updateNotificationPref, S as deleteAccountData, _ as useTheme, j as listNotifications, k as listDownloads, v as MwMark, w as getAppConfig, z as cn } from "./router-DQ8icHtZ.mjs";
import { a as signOut } from "./client-BXBOTlUB.mjs";
import { t as useCurrentUserState } from "./use-current-user-DF_8Asza.mjs";
import { t as Button } from "./button-CNkutHzj.mjs";
import { i as getOpsSession } from "./ops-C_QDXn1-.mjs";
import { t as DownloadHistoryList } from "./download-history-BONSxlt6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-B0tpqPVf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProfilePage() {
	const { user, isPending } = useCurrentUserState();
	const { theme, setTheme } = useTheme();
	const navigate = useNavigate();
	const [showOps, setShowOps] = (0, import_react.useState)(false);
	const [downloads, setDownloads] = (0, import_react.useState)([]);
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
	const [notifyOn, setNotifyOn] = (0, import_react.useState)(true);
	const [studioOn, setStudioOn] = (0, import_react.useState)(false);
	const [studioStatus, setStudioStatus] = (0, import_react.useState)("none");
	const [isPremium, setIsPremium] = (0, import_react.useState)(false);
	const userId = user?.id ?? null;
	(0, import_react.useEffect)(() => {
		if (isPending || !userId) return;
		getPremiumStatus().then((s) => setIsPremium(s.isPremium)).catch(() => void 0);
		getOpsSession().then((s) => setShowOps(s.canModerate || s.canClaim)).catch(() => void 0);
		listDownloads().then((r) => setDownloads(r.items)).catch(() => void 0);
		listNotifications().then((r) => setNotifyOn(r.notificationsOn)).catch(() => void 0);
		getAppConfig().then((c) => {
			const on = c.featureFlags.creator_marketplace_enabled;
			setStudioOn(on);
			if (on) getStudioDashboard().then((d) => setStudioStatus(d.status)).catch(() => void 0);
		}).catch(() => void 0);
	}, [userId, isPending]);
	const themes = [
		{
			id: "system",
			label: t.profile.themeSystem
		},
		{
			id: "dark",
			label: t.profile.themeDark
		},
		{
			id: "light",
			label: t.profile.themeLight
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 pt-5 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl text-fg",
				children: t.profile.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-6 rounded-[20px] bg-elevated p-5",
				children: isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-16 animate-pulse rounded-[12px] bg-surface" }) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center justify-between gap-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-11 shrink-0 place-items-center rounded-full bg-surface text-sm font-medium",
							children: (user.displayName ?? user.primaryEmail ?? "M").charAt(0).toUpperCase()
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-medium text-fg",
								children: user.displayName ?? t.profile.guest
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "truncate text-sm text-muted",
								children: [user.primaryEmail, isPremium ? ` · ${t.ops.premiumMember}` : ""]
							})]
						})]
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium text-fg",
						children: t.profile.guest
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: t.profile.guestHint
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-4",
						onClick: () => navigate({
							to: "/login",
							search: { next: "/app/profile" }
						}),
						children: t.auth.signIn
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl text-fg",
					children: t.profile.appearance
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid grid-cols-3 gap-2",
					children: themes.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setTheme(opt.id),
						className: cn("h-11 rounded-[12px] text-sm", theme === opt.id ? "bg-fg text-bg" : "bg-elevated text-muted"),
						children: opt.label
					}, opt.id))
				})]
			}),
			user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl text-fg",
						children: t.profile.settings
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/app/taste",
						className: "flex items-center justify-between rounded-xl bg-elevated px-4 py-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-sm font-medium text-fg",
							children: t.profile.taste
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: t.profile.tasteHint
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 shrink-0 text-subtle" })]
					}),
					studioOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/studio",
						className: "flex items-center justify-between rounded-xl bg-elevated px-4 py-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-sm font-medium text-fg",
							children: t.profile.studio
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: studioStatus === "pending" ? t.profile.studioPending : studioStatus === "approved" ? t.studio.dashboard : t.profile.studioHint
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 shrink-0 text-subtle" })]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: async () => {
							const next = !notifyOn;
							setNotifyOn(next);
							await updateNotificationPref({ data: { on: next } });
						},
						className: "flex min-h-12 w-full items-center justify-between rounded-xl bg-elevated px-4 text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-fg",
							children: t.profile.notificationsOn
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("grid h-7 w-12 place-items-center rounded-full text-xs font-medium", notifyOn ? "bg-fg text-bg" : "bg-surface text-muted"),
							children: notifyOn ? t.ops.on : t.ops.off
						})]
					})
				]
			}) : null,
			user && showOps ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/ops",
					className: "flex items-center gap-3 rounded-xl bg-elevated p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MwMark, { className: "size-10 shrink-0" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-sm font-medium text-fg",
								children: t.profile.ops
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted",
								children: t.profile.opsHint
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 shrink-0 text-subtle" })
					]
				})
			}) : null,
			user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-end justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl text-fg",
						children: t.profile.downloads
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/app/downloads",
						className: "text-sm text-muted hover:text-fg",
						children: t.profile.seeHistory
					})]
				}), downloads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: t.profile.emptyDownloads
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadHistoryList, { items: downloads.slice(0, 4) })]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl text-fg",
					children: t.profile.legal
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 divide-y divide-border rounded-[16px] bg-elevated",
					children: [
						{
							to: "/legal/privacy",
							label: t.profile.privacy
						},
						{
							to: "/legal/terms",
							label: t.profile.terms
						},
						{
							to: "/legal/copyright",
							label: t.profile.copyright
						},
						{
							to: "/legal/guidelines",
							label: t.profile.guidelines
						}
					].map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: row.to,
						className: "flex min-h-12 items-center px-4 text-sm text-fg",
						children: row.label
					}) }, row.to))
				})]
			}),
			user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					className: "w-full",
					onClick: () => void signOut().catch(() => void 0),
					children: t.auth.signOut
				}), confirmDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-[16px] bg-elevated p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-fg",
							children: t.profile.deleteConfirm
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted",
							children: t.profile.deleteHint
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "danger",
								className: "flex-1",
								onClick: async () => {
									await deleteAccountData();
									await signOut().catch(() => void 0);
									navigate({ to: "/app" });
								},
								children: t.profile.delete
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								className: "flex-1",
								onClick: () => setConfirmDelete(false),
								children: t.cancel
							})]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					className: "w-full text-danger",
					onClick: () => setConfirmDelete(true),
					children: t.profile.delete
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-10 text-center text-xs text-subtle",
				children: [
					brand.name,
					" · ",
					brand.tagline
				]
			})
		]
	});
}
//#endregion
export { ProfilePage as component };
