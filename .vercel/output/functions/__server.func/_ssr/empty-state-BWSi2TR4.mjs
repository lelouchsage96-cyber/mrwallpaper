import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { K as t } from "./router-DQ8icHtZ.mjs";
import { t as Button } from "./button-CNkutHzj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/empty-state-BWSi2TR4.js
var import_jsx_runtime = require_jsx_runtime();
function EmptyState({ title, body, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-2xl text-fg",
				children: title
			}),
			body ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-sm text-sm text-muted",
				children: body
			}) : null,
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: action.onClick,
				className: "mt-2",
				children: action.label
			}) : null
		]
	});
}
function ErrorState({ onRetry }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		title: t.errors.generic,
		action: {
			label: t.errors.retry,
			onClick: onRetry
		}
	});
}
//#endregion
export { ErrorState as n, EmptyState as t };
