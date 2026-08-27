import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, b as useRouter, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { O as Check } from "../_libs/lucide-react.mjs";
import { K as t, O as getTaste, P as saveTaste, T as getExploreMeta, z as cn } from "./router-DQ8icHtZ.mjs";
import { t as useCurrentUserState } from "./use-current-user-DF_8Asza.mjs";
import { n as LazyImage } from "./lazy-CeFyYund.mjs";
import { t as Button } from "./button-CNkutHzj.mjs";
import { n as ErrorState } from "./empty-state-BWSi2TR4.mjs";
import { n as writeLocalTaste, t as readLocalTaste } from "./taste-aiRPFToT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/taste-DmhS8VHI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function TastePage() {
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const router = useRouter();
	const [categories, setCategories] = (0, import_react.useState)([]);
	const [picked, setPicked] = (0, import_react.useState)(() => readLocalTaste());
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(false);
	const [msg, setMsg] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		getExploreMeta().then((meta) => setCategories(meta.categories)).catch(() => setError(true)).finally(() => setLoading(false));
	}, []);
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!user) {
			setPicked((prev) => prev.length ? prev : readLocalTaste());
			return;
		}
		getTaste().then((taste) => {
			setPicked((prev) => {
				if (prev.length) return prev;
				return taste.categoryIds.length ? taste.categoryIds : readLocalTaste();
			});
		}).catch(() => void 0);
	}, [user, isPending]);
	function toggle(id) {
		setMsg(null);
		setPicked((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
	}
	async function save() {
		if (picked.length < 3) {
			setMsg(t.taste.needThree);
			return;
		}
		setBusy(true);
		writeLocalTaste(picked);
		try {
			if (user) {
				if (!(await saveTaste({ data: { categoryIds: picked } })).ok) {
					setMsg(t.taste.needThree);
					return;
				}
			}
			await router.invalidate();
			navigate({ to: "/app" });
		} catch {
			setMsg(t.errors.generic);
		} finally {
			setBusy(false);
		}
	}
	const ready = picked.length >= 3;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 pt-5 pb-36",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-[0.2em] text-muted uppercase",
				children: t.preview.live
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-3xl text-fg",
				children: t.taste.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-md text-sm text-muted",
				children: t.taste.hint
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: () => {
					setError(false);
					setLoading(true);
					getExploreMeta().then((meta) => setCategories(meta.categories)).catch(() => setError(true)).finally(() => setLoading(false));
				} })
			}) : loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3",
				children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "aspect-[4/5] animate-pulse rounded-xl bg-elevated" }, i))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3",
				children: categories.map((c) => {
					const on = picked.includes(c.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => toggle(c.id),
						"aria-pressed": on,
						className: cn("relative block w-full overflow-hidden rounded-xl text-left shadow-[var(--shadow-border)] transition-[opacity,transform] duration-150 ease-out active:scale-[0.98]", on ? "ring-2 ring-fg ring-offset-2 ring-offset-bg" : "opacity-80"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "relative block aspect-[4/5] bg-elevated",
							children: [
								c.coverUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
									src: c.coverUrl,
									alt: "",
									className: "size-full object-cover"
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/85 to-transparent px-3 py-2.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-medium text-fg",
										children: c.name
									})
								}),
								on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-fg text-bg",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
										className: "size-3.5",
										strokeWidth: 2.4
									})
								}) : null
							]
						})
					}) }, c.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none fixed inset-x-0 bottom-20 z-30 px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-auto mx-auto flex max-w-5xl items-center gap-3 rounded-xl bg-bg/90 p-3 shadow-[var(--shadow-border)] backdrop-blur-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "min-w-0 flex-1 text-sm text-muted",
						children: [ready ? t.taste.picked.replace("{n}", String(picked.length)) : t.taste.needThree, msg ? ` · ${msg}` : ""]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "shrink-0",
						disabled: busy || loading || !ready,
						onClick: () => void save(),
						children: t.taste.save
					})]
				})
			})
		]
	});
}
//#endregion
export { TastePage as component };
