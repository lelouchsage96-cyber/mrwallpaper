import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { K as t, z as cn } from "./router-DQ8icHtZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-badge-B69raXn-.js
var import_jsx_runtime = require_jsx_runtime();
var tones = {
	approved: "bg-success/15 text-success",
	resolved: "bg-success/15 text-success",
	pending: "bg-warn/15 text-warn",
	open: "bg-warn/15 text-warn",
	draft: "bg-elevated text-muted",
	dismissed: "bg-elevated text-muted",
	rejected: "bg-danger/15 text-danger",
	removed: "bg-danger/15 text-danger",
	suspended: "bg-danger/15 text-danger"
};
function StatusBadge({ status }) {
	const label = status in t.ops.status ? t.ops.status[status] : status;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex h-7 items-center rounded-full px-2.5 text-xs font-medium capitalize", tones[status] ?? "bg-elevated text-muted"),
		children: label
	});
}
//#endregion
export { StatusBadge as t };
