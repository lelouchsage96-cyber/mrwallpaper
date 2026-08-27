import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { K as t, k as listDownloads } from "./router-DQ8icHtZ.mjs";
import { t as useCurrentUserState } from "./use-current-user-DF_8Asza.mjs";
import { n as ErrorState, t as EmptyState } from "./empty-state-BWSi2TR4.mjs";
import { t as DownloadHistoryList } from "./download-history-BONSxlt6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/downloads-OtAvqZgT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function DownloadsPage() {
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const [items, setItems] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(false);
	const userId = user?.id ?? null;
	function load() {
		setError(false);
		listDownloads().then((r) => setItems(r.items)).catch(() => setError(true)).finally(() => setLoading(false));
	}
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!userId) {
			setLoading(false);
			return;
		}
		load();
	}, [userId, isPending]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 pt-5 pb-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl text-fg",
			children: t.history.title
		}), isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-5 h-40 animate-pulse rounded-[20px] bg-elevated" }) : !user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: t.history.signIn,
			action: {
				label: t.auth.signIn,
				onClick: () => {
					navigate({
						to: "/login",
						search: { next: "/app/downloads" }
					});
				}
			}
		}) : error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: load }) : loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-5 h-40 animate-pulse rounded-[20px] bg-elevated" }) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: t.history.empty,
			action: {
				label: t.nav.explore,
				onClick: () => {
					navigate({ to: "/app/explore" });
				}
			}
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadHistoryList, { items })
		})]
	});
}
//#endregion
export { DownloadsPage as component };
