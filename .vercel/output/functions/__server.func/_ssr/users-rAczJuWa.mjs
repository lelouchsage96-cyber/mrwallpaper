import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { K as t } from "./router-DQ8icHtZ.mjs";
import { n as ErrorState } from "./empty-state-BWSi2TR4.mjs";
import { t as Input } from "./input-BCaChIGK.mjs";
import { f as listOpsUsers, i as getOpsSession, x as updateOpsUser } from "./ops-C_QDXn1-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/users-rAczJuWa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OpsUsersPage() {
	const navigate = useNavigate();
	const [users, setUsers] = (0, import_react.useState)(null);
	const [q, setQ] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(false);
	const [msg, setMsg] = (0, import_react.useState)(null);
	function load() {
		setError(false);
		getOpsSession().then((s) => {
			if (!s.canAdmin) {
				navigate({ to: "/ops" });
				return;
			}
			return listOpsUsers();
		}).then((res) => {
			if (!res) return;
			setUsers(res.items);
		}).catch(() => setError(true));
	}
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	const filtered = (0, import_react.useMemo)(() => {
		if (!users) return [];
		const needle = q.trim().toLowerCase();
		if (!needle) return users;
		return users.filter((u) => [
			u.name,
			u.email,
			u.role,
			u.status,
			u.userId
		].some((v) => v?.toLowerCase().includes(needle)));
	}, [users, q]);
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: load });
	if (!users) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-48 animate-pulse rounded-xl bg-elevated" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl text-fg",
					children: t.ops.users
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-xl text-sm text-muted",
					children: t.ops.usersHint
				}),
				msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: msg
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: q,
				onChange: (e) => setQ(e.target.value),
				placeholder: t.ops.searchAccounts,
				"aria-label": t.ops.searchAccounts,
				type: "search"
			}),
			filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl bg-elevated px-4 py-10 text-center text-sm text-muted",
				children: t.ops.noUsers
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-border overflow-hidden rounded-xl bg-elevated",
				children: filtered.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-medium text-fg",
							children: (u.name || u.email || "A").charAt(0).toUpperCase()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1 text-sm text-fg",
							children: [
								u.name || u.email || u.userId,
								u.isPremium ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-2 text-xs text-muted",
									children: t.ops.premiumMember
								}) : null,
								u.email ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-0.5 block text-xs text-muted",
									children: u.email
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: u.isPremium ? "h-11 rounded-md bg-fg px-3 text-sm text-bg" : "h-11 rounded-md bg-surface px-3 text-sm text-fg",
									onClick: async () => {
										const next = !u.isPremium;
										const res = await updateOpsUser({ data: {
											userId: u.userId,
											premium: next
										} });
										if (res.ok) setUsers((prev) => prev ? prev.map((x) => x.userId === u.userId ? {
											...x,
											isPremium: next
										} : x) : prev);
										else setMsg(res.message ?? t.ops.failed);
									},
									children: u.isPremium ? t.ops.revokePremium : t.ops.giftPremium
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									"aria-label": t.ops.role,
									value: u.role,
									className: "h-11 rounded-md bg-surface px-3 text-sm text-fg",
									onChange: async (e) => {
										const role = e.target.value;
										const res = await updateOpsUser({ data: {
											userId: u.userId,
											role
										} });
										if (res.ok) setUsers((prev) => prev ? prev.map((x) => x.userId === u.userId ? {
											...x,
											role
										} : x) : prev);
										else setMsg(res.message ?? t.ops.failed);
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "user",
											children: t.ops.roleLabels.user
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "creator",
											children: t.ops.roleLabels.creator
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "moderator",
											children: t.ops.roleLabels.moderator
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "admin",
											children: t.ops.roleLabels.admin
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									"aria-label": t.ops.accountStatus,
									value: u.status,
									className: "h-11 rounded-md bg-surface px-3 text-sm text-fg",
									onChange: async (e) => {
										const status = e.target.value;
										await updateOpsUser({ data: {
											userId: u.userId,
											status
										} });
										setUsers((prev) => prev ? prev.map((x) => x.userId === u.userId ? {
											...x,
											status
										} : x) : prev);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "active",
										children: "active"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "suspended",
										children: "suspended"
									})]
								})
							]
						})
					]
				}, u.userId))
			})
		]
	});
}
//#endregion
export { OpsUsersPage as component };
