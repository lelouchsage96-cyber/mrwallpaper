import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { z as cn } from "./router-DQ8icHtZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/button-CNkutHzj.js
var import_jsx_runtime = require_jsx_runtime();
var buttonVariants = cva("inline-flex items-center justify-center gap-2 font-medium transition-[opacity,transform,background-color,color] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg", {
	variants: {
		variant: {
			primary: "bg-fg text-bg hover:opacity-90",
			secondary: "bg-elevated text-fg shadow-[var(--shadow-border)] hover:bg-surface",
			ghost: "bg-transparent text-fg hover:bg-elevated",
			danger: "bg-danger text-fg hover:opacity-90"
		},
		size: {
			md: "h-11 px-5 text-sm rounded-[12px]",
			sm: "h-9 px-3.5 text-sm rounded-[10px]",
			icon: "size-11 rounded-[12px]",
			pill: "h-9 px-4 text-sm rounded-full"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
//#endregion
export { Button as t };
