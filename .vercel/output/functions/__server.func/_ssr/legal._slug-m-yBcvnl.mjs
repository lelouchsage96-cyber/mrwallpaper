import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { K as t, c as pages, s as Route$16 } from "./router-DQ8icHtZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/legal._slug-m-yBcvnl.js
var import_jsx_runtime = require_jsx_runtime();
function LegalPage() {
	const { slug } = Route$16.useParams();
	const page = pages[slug];
	if (!page) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-2xl px-5 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "/",
				className: "text-sm text-muted hover:text-fg",
				children: "Home"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-4 font-display text-4xl text-fg",
				children: page.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs uppercase tracking-[0.16em] text-subtle",
				children: t.legal.draft
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 space-y-4 text-sm leading-relaxed text-muted",
				children: page.body.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: p }, p))
			})
		]
	});
}
//#endregion
export { LegalPage as component };
