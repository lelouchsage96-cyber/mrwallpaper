import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, b as useRouter, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { K as t, M as markNotificationsRead, R as updateNotificationPref, j as listNotifications, z as cn } from "./router-DQ8icHtZ.mjs";
import { t as useCurrentUserState } from "./use-current-user-DF_8Asza.mjs";
import { n as LazyImage } from "./lazy-CeFyYund.mjs";
import { n as ErrorState, t as EmptyState } from "./empty-state-BWSi2TR4.mjs";
import { n as formatDistanceToNow } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications-BkR6lEAX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function NotificationsPage() {
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const router = useRouter();
	const [items, setItems] = (0, import_react.useState)([]);
	const [on, setOn] = (0, import_react.useState)(true);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(false);
	const userId = user?.id ?? null;
	function load() {
		setError(false);
		listNotifications().then((r) => {
			setItems(r.items);
			setOn(r.notificationsOn);
		}).catch(() => setError(true)).finally(() => setLoading(false));
	}
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!userId) {
			setLoading(false);
			return;
		}
		load();
	}, [userId, isPending]);
	const unread = items.some((n) => !n.read);
	const showSkeleton = (isPending || loading) && items.length === 0 && Boolean(userId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 pt-5 pb-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl text-fg",
				children: t.notifications.title
			}), user && unread ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "min-h-11 text-sm text-muted hover:text-fg",
				onClick: async () => {
					await markNotificationsRead({ data: {} });
					setItems((prev) => prev.map((n) => ({
						...n,
						read: true
					})));
				},
				children: t.notifications.markAll
			}) : null]
		}), showSkeleton ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-6 h-40 rounded-xl bg-elevated" }) : error && items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: load })
		}) : !user && !isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: t.notifications.signInTitle,
			body: t.notifications.signIn,
			action: {
				label: t.auth.signIn,
				onClick: () => void navigate({
					to: "/login",
					search: { next: "/app/notifications" }
				})
			}
		}) : !on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: t.notifications.off,
			action: {
				label: t.notifications.turnOn,
				onClick: async () => {
					await updateNotificationPref({ data: { on: true } });
					setOn(true);
				}
			}
		}) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { title: t.notifications.empty }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-5 divide-y divide-border overflow-hidden rounded-xl bg-elevated",
			children: items.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex min-h-16 w-full items-center gap-3 px-3 py-3 text-left",
				onClick: () => {
					if (!n.read) {
						markNotificationsRead({ data: { id: n.id } });
						setItems((prev) => prev.map((x) => x.id === n.id ? {
							...x,
							read: true
						} : x));
					}
					if (n.href) router.history.push(n.href);
				},
				children: [
					n.thumbnailUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
						src: n.thumbnailUrl,
						alt: "",
						width: 32,
						height: 56,
						fallback: n.wallpaperId ? `/wallpapers/${n.wallpaperId}.jpg` : void 0,
						className: "wallpaper-img h-14 w-8 shrink-0 rounded-sm object-cover"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-14 w-8 shrink-0 place-items-center rounded-sm bg-surface text-[10px] tracking-wide text-muted uppercase",
						children: "MW"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("block truncate text-sm", n.read ? "text-fg" : "font-medium text-fg"),
								children: n.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-0.5 block truncate text-xs text-muted",
								children: n.body
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-0.5 block text-xs text-subtle",
								children: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })
							})
						]
					}),
					n.read ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 shrink-0 rounded-full bg-fg" })
				]
			}) }, n.id))
		})]
	});
}
//#endregion
export { NotificationsPage as component };
