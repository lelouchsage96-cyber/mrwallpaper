import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as AD_NETWORK_META } from "./ads-DoVQGCTt.mjs";
import { K as t, z as cn } from "./router-DQ8icHtZ.mjs";
import { t as Button } from "./button-CNkutHzj.mjs";
import { n as ErrorState } from "./empty-state-BWSi2TR4.mjs";
import { t as Input } from "./input-BCaChIGK.mjs";
import { a as getOpsSettings, b as updateOpsSettings, i as getOpsSession, n as connectR2Storage, o as listOpsCategories, s as listOpsCollections, v as updateOpsCategory, y as updateOpsCollection } from "./ops-C_QDXn1-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-3pyo0ew7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Toggle({ label, on, onToggle }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: onToggle,
		className: "flex min-h-12 w-full items-center justify-between gap-3 rounded-lg bg-elevated px-4 text-left",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm text-fg",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("grid h-7 w-12 place-items-center rounded-full text-xs font-medium", on ? "bg-fg text-bg" : "bg-surface text-muted"),
			children: on ? t.ops.on : t.ops.off
		})]
	});
}
function OpsSettingsPage() {
	const navigate = useNavigate();
	const [settings, setSettings] = (0, import_react.useState)(null);
	const [categories, setCategories] = (0, import_react.useState)([]);
	const [collections, setCollections] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)(false);
	const [msg, setMsg] = (0, import_react.useState)(null);
	const [r2Account, setR2Account] = (0, import_react.useState)("");
	const [r2Access, setR2Access] = (0, import_react.useState)("");
	const [r2Secret, setR2Secret] = (0, import_react.useState)("");
	const [r2Bucket, setR2Bucket] = (0, import_react.useState)("mrwallpaper");
	const [r2Public, setR2Public] = (0, import_react.useState)("");
	const [connecting, setConnecting] = (0, import_react.useState)(false);
	function load() {
		setError(false);
		getOpsSession().then((s) => {
			if (!s.canAdmin) {
				navigate({ to: "/ops" });
				return;
			}
			return Promise.all([
				getOpsSettings(),
				listOpsCategories(),
				listOpsCollections()
			]);
		}).then((res) => {
			if (!res) return;
			const [s, c, col] = res;
			setSettings(s);
			setCategories(c.items);
			setCollections(col.items);
			if (s.r2AccountId) setR2Account(s.r2AccountId);
			if (s.r2Bucket) setR2Bucket(s.r2Bucket);
			if (s.r2PublicUrl) setR2Public(s.r2PublicUrl);
		}).catch(() => setError(true));
	}
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	async function save(patch) {
		const res = await updateOpsSettings({ data: patch });
		setMsg(res.ok ? t.ops.saved : res.message ?? t.ops.failed);
		if (res.ok) {
			const next = await getOpsSettings();
			setSettings(next);
		}
	}
	function patchNet(id, patch) {
		setSettings((s) => s ? {
			...s,
			mediation: s.mediation.map((n) => n.id === id ? {
				...n,
				...patch
			} : n)
		} : s);
	}
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: load });
	if (!settings) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-48 animate-pulse rounded-xl bg-elevated" });
	const flags = settings.featureFlags;
	function setFlag(key, value) {
		const next = {
			...flags,
			[key]: value
		};
		setSettings((s) => s ? {
			...s,
			featureFlags: next
		} : s);
		save({ featureFlags: next });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl text-fg",
					children: t.ops.settings
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-xl text-sm text-muted",
					children: t.ops.settingsHint
				}),
				msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: msg
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-[16px] bg-elevated px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-[0.18em] text-muted uppercase",
						children: t.ops.storage
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-display text-2xl text-fg",
						children: settings.storageBackend === "r2" ? t.ops.storageR2 : t.ops.storageDatabase
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: settings.storageBackend === "r2" ? t.ops.storageR2Connected : t.ops.storageR2Hint
					}),
					settings.r2HasKey ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-xs text-subtle",
						children: [
							t.ops.r2Bucket,
							": ",
							settings.r2Bucket || "mrwallpaper",
							settings.r2PublicUrl ? ` · ${settings.r2PublicUrl}` : ""
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-4 space-y-3",
						onSubmit: (e) => {
							e.preventDefault();
							if (!r2Account.trim() || !r2Access.trim() || !r2Secret.trim() || connecting) return;
							setConnecting(true);
							setMsg(null);
							connectR2Storage({ data: {
								accountId: r2Account.trim(),
								accessKeyId: r2Access.trim(),
								secretAccessKey: r2Secret.trim(),
								bucket: r2Bucket.trim() || "mrwallpaper",
								publicUrl: r2Public.trim() || void 0
							} }).then((res) => {
								if (!res.ok) {
									setMsg(res.message ?? t.ops.r2Failed);
									return;
								}
								setR2Secret("");
								setMsg(t.ops.saved);
								return getOpsSettings().then(setSettings);
							}).catch(() => setMsg(t.ops.r2Failed)).finally(() => setConnecting(false));
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1.5 block text-xs tracking-[0.14em] text-muted uppercase",
									children: t.ops.r2Account
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: r2Account,
									onChange: (e) => setR2Account(e.target.value),
									autoComplete: "off"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1.5 block text-xs tracking-[0.14em] text-muted uppercase",
									children: t.ops.r2Access
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: r2Access,
									onChange: (e) => setR2Access(e.target.value),
									autoComplete: "off"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1.5 block text-xs tracking-[0.14em] text-muted uppercase",
									children: t.ops.r2Secret
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "password",
									value: r2Secret,
									onChange: (e) => setR2Secret(e.target.value),
									autoComplete: "off"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1.5 block text-xs tracking-[0.14em] text-muted uppercase",
									children: t.ops.r2Bucket
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: r2Bucket,
									onChange: (e) => setR2Bucket(e.target.value),
									autoComplete: "off"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mb-1.5 block text-xs tracking-[0.14em] text-muted uppercase",
										children: t.ops.r2Public
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: r2Public,
										onChange: (e) => setR2Public(e.target.value),
										placeholder: "https://cdn.yourdomain.com",
										autoComplete: "off"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-1.5 block text-xs text-subtle",
										children: t.ops.r2PublicHint
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: connecting || r2Account.trim().length < 8 || r2Secret.trim().length < 8,
								children: connecting ? t.ops.storageConnecting : t.ops.r2Connect
							})
						]
					})
				]
			}),
			settings.maintenanceMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-lg bg-warn/15 px-4 py-3 text-sm text-warn",
				children: t.ops.maintenanceOn
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl text-fg",
						children: t.ops.seo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: t.ops.seoHint
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm text-muted",
						children: [t.ops.gsc, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-2",
							defaultValue: settings.gscVerification,
							placeholder: "google-site-verification token",
							onBlur: (e) => void save({ gscVerification: e.target.value })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm text-muted",
						children: [t.ops.ga, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-2",
							defaultValue: settings.gaId,
							placeholder: "G-XXXXXXXX",
							onBlur: (e) => void save({ gaId: e.target.value })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm text-muted",
						children: [t.ops.ogImage, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-2",
							defaultValue: settings.ogImage,
							placeholder: "/og.jpg",
							onBlur: (e) => void save({ ogImage: e.target.value })
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl text-fg",
						children: t.ops.downloadMode
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2",
						children: ["rewarded_ad", "direct"].map((mode) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setSettings((s) => s ? {
									...s,
									freeDownloadMode: mode
								} : s);
								save({ freeDownloadMode: mode });
							},
							className: cn("h-11 rounded-full px-4 text-sm", settings.freeDownloadMode === mode ? "bg-fg text-bg" : "bg-elevated text-muted"),
							children: mode === "direct" ? t.ops.direct : t.ops.rewarded
						}, mode))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: t.ops.ads,
						on: settings.adsEnabled,
						onToggle: () => {
							const next = !settings.adsEnabled;
							setSettings((s) => s ? {
								...s,
								adsEnabled: next
							} : s);
							save({ adsEnabled: next });
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: t.ops.rewardedFlag,
						on: settings.rewardedDownloadsEnabled,
						onToggle: () => {
							const next = !settings.rewardedDownloadsEnabled;
							setSettings((s) => s ? {
								...s,
								rewardedDownloadsEnabled: next
							} : s);
							save({ rewardedDownloadsEnabled: next });
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: t.ops.maintenance,
						on: settings.maintenanceMode,
						onToggle: () => {
							const next = !settings.maintenanceMode;
							setSettings((s) => s ? {
								...s,
								maintenanceMode: next
							} : s);
							save({ maintenanceMode: next });
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl text-fg",
						children: t.ops.mediation
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: t.ops.mediationHint
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "text-sm text-muted",
							children: [t.ops.displayEcpm, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-2",
								type: "number",
								min: 0,
								step: .1,
								value: settings.displayEcpm,
								onChange: (e) => setSettings((s) => s ? {
									...s,
									displayEcpm: Number(e.target.value) || 0
								} : s),
								onBlur: () => void save({ displayEcpm: settings.displayEcpm })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "text-sm text-muted",
							children: [t.ops.rewardedEcpm, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-2",
								type: "number",
								min: 0,
								step: .1,
								value: settings.rewardedEcpm,
								onChange: (e) => setSettings((s) => s ? {
									...s,
									rewardedEcpm: Number(e.target.value) || 0
								} : s),
								onBlur: () => void save({ rewardedEcpm: settings.rewardedEcpm })
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-3",
						children: settings.mediation.map((net) => {
							const meta = AD_NETWORK_META[net.id];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "rounded-[16px] bg-elevated p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-start justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium text-fg",
										children: meta.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-0.5 text-xs text-muted",
										children: [
											meta.surface === "web" ? t.ops.surfaceWeb : meta.surface === "native" ? t.ops.surfaceNative : `${t.ops.surfaceWeb} · ${t.ops.surfaceNative}`,
											" · ",
											meta.hint
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => {
											const next = settings.mediation.map((n) => n.id === net.id ? {
												...n,
												enabled: !n.enabled
											} : n);
											setSettings((s) => s ? {
												...s,
												mediation: next
											} : s);
											save({ mediation: next });
										},
										className: cn("h-8 rounded-full px-3 text-xs font-medium", net.enabled ? "bg-fg text-bg" : "bg-surface text-muted"),
										children: net.enabled ? t.ops.networkOn : t.ops.off
									})]
								}), net.id !== "house" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "text-xs text-muted",
											children: [t.ops.appId, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												className: "mt-1",
												value: net.publisherId,
												onChange: (e) => patchNet(net.id, { publisherId: e.target.value }),
												onBlur: () => void save({ mediation: settings.mediation })
											})]
										}),
										net.id !== "adsense" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "text-xs text-muted",
											children: [t.ops.sdkKey, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												className: "mt-1",
												value: net.sdkKey,
												onChange: (e) => patchNet(net.id, { sdkKey: e.target.value }),
												onBlur: () => void save({ mediation: settings.mediation })
											})]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "text-xs text-muted",
											children: [t.ops.bannerUnit, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												className: "mt-1",
												value: net.bannerUnit,
												onChange: (e) => patchNet(net.id, { bannerUnit: e.target.value }),
												onBlur: () => void save({ mediation: settings.mediation })
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "text-xs text-muted",
											children: [t.ops.feedUnit, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												className: "mt-1",
												value: net.feedUnit,
												onChange: (e) => patchNet(net.id, { feedUnit: e.target.value }),
												onBlur: () => void save({ mediation: settings.mediation })
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "text-xs text-muted",
											children: [t.ops.rewardedUnit, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												className: "mt-1",
												value: net.rewardedUnit,
												onChange: (e) => patchNet(net.id, { rewardedUnit: e.target.value }),
												onBlur: () => void save({ mediation: settings.mediation })
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "text-xs text-muted",
											children: [t.ops.ecpmFloor, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												className: "mt-1",
												type: "number",
												min: 0,
												step: .1,
												value: net.ecpmFloor,
												onChange: (e) => patchNet(net.id, { ecpmFloor: Number(e.target.value) || 0 }),
												onBlur: () => void save({ mediation: settings.mediation })
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "text-xs text-muted",
											children: [t.ops.timeout, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												className: "mt-1",
												type: "number",
												min: 0,
												step: 100,
												value: net.timeoutMs,
												onChange: (e) => patchNet(net.id, { timeoutMs: Number(e.target.value) || 0 }),
												onBlur: () => void save({ mediation: settings.mediation })
											})]
										})
									]
								}) : null]
							}, net.id);
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm text-muted",
						children: [t.ops.dailyLimit, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-2",
							type: "number",
							min: 1,
							max: 500,
							value: settings.dailyDownloadLimit,
							onChange: (e) => setSettings((s) => s ? {
								...s,
								dailyDownloadLimit: Number(e.target.value) || 1
							} : s),
							onBlur: () => void save({ dailyDownloadLimit: settings.dailyDownloadLimit })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "text-sm text-muted",
							children: [t.ops.creatorShare, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-2",
								type: "number",
								min: 0,
								max: 100,
								value: settings.creatorSharePercent,
								onChange: (e) => setSettings((s) => s ? {
									...s,
									creatorSharePercent: Number(e.target.value) || 0
								} : s)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "text-sm text-muted",
							children: [t.ops.platformShare, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-2",
								type: "number",
								min: 0,
								max: 100,
								value: settings.platformSharePercent,
								onChange: (e) => setSettings((s) => s ? {
									...s,
									platformSharePercent: Number(e.target.value) || 0
								} : s)
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => void save({
							creatorSharePercent: settings.creatorSharePercent,
							platformSharePercent: settings.platformSharePercent
						}),
						children: t.save
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl text-fg",
					children: t.ops.flags
				}), [
					["premium_enabled", t.premium.brand],
					["rewarded_downloads_enabled", t.ops.rewardedFlag],
					["lifetime_purchase_enabled", t.premium.lifetime],
					["recommendations_enabled", t.home.recommended],
					["notifications_enabled", t.profile.notifications],
					["creator_marketplace_enabled", t.ops.marketplace]
				].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
					label,
					on: flags[key],
					onToggle: () => setFlag(key, !flags[key])
				}, key))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 font-display text-xl text-fg",
				children: t.ops.categories
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-border overflow-hidden rounded-xl bg-elevated",
				children: categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "space-y-2 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-h-14 items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-fg",
							children: c.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: cn("h-11 rounded-full px-4 text-sm", c.isVisible ? "bg-fg text-bg" : "bg-surface text-muted"),
								onClick: async () => {
									await updateOpsCategory({ data: {
										id: c.id,
										isVisible: !c.isVisible
									} });
									setCategories((prev) => prev.map((x) => x.id === c.id ? {
										...x,
										isVisible: !x.isVisible
									} : x));
								},
								children: c.isVisible ? t.ops.visible : t.ops.hidden
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: cn("h-11 rounded-full px-4 text-sm", c.isFeatured ? "bg-fg text-bg" : "bg-surface text-muted"),
								onClick: async () => {
									await updateOpsCategory({ data: {
										id: c.id,
										isFeatured: !c.isFeatured
									} });
									setCategories((prev) => prev.map((x) => x.id === c.id ? {
										...x,
										isFeatured: !x.isFeatured
									} : x));
								},
								children: t.ops.featuredFlag
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2 pb-2 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								defaultValue: c.slug,
								"aria-label": t.ops.seoSlug,
								onBlur: (e) => void updateOpsCategory({ data: {
									id: c.id,
									slug: e.target.value
								} })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								defaultValue: c.intro,
								"aria-label": t.ops.seoIntro,
								placeholder: t.ops.seoIntro,
								onBlur: (e) => void updateOpsCategory({ data: {
									id: c.id,
									intro: e.target.value
								} })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								defaultValue: c.seoTitle,
								placeholder: t.ops.seoTitle,
								onBlur: (e) => void updateOpsCategory({ data: {
									id: c.id,
									seoTitle: e.target.value
								} })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								defaultValue: c.seoDescription,
								placeholder: t.ops.seoDescription,
								onBlur: (e) => void updateOpsCategory({ data: {
									id: c.id,
									seoDescription: e.target.value
								} })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								defaultValue: c.canonicalPath,
								placeholder: t.ops.seoCanonical,
								"aria-label": t.ops.seoCanonical,
								onBlur: (e) => void updateOpsCategory({ data: {
									id: c.id,
									canonicalPath: e.target.value
								} })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: cn("h-11 rounded-full px-4 text-sm", c.robots === "index" ? "bg-fg text-bg" : "bg-elevated text-muted"),
								onClick: () => void updateOpsCategory({ data: {
									id: c.id,
									robots: c.robots === "index" ? "noindex" : "index"
								} }).then(() => setCategories((prev) => prev.map((x) => x.id === c.id ? {
									...x,
									robots: x.robots === "index" ? "noindex" : "index"
								} : x))),
								children: [
									t.ops.seoIndex,
									": ",
									c.robots
								]
							})
						]
					})]
				}, c.id))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 font-display text-xl text-fg",
				children: t.ops.collections
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-border overflow-hidden rounded-xl bg-elevated",
				children: collections.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex min-h-14 items-center justify-between gap-3 px-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-sm text-fg",
						children: [c.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 text-muted",
							children: c.wallpaperCount
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: cn("h-11 rounded-full px-4 text-sm", c.isVisible ? "bg-fg text-bg" : "bg-surface text-muted"),
						onClick: async () => {
							await updateOpsCollection({ data: {
								id: c.id,
								isVisible: !c.isVisible
							} });
							setCollections((prev) => prev.map((x) => x.id === c.id ? {
								...x,
								isVisible: !x.isVisible
							} : x));
						},
						children: c.isVisible ? t.ops.visible : t.ops.hidden
					})]
				}, c.id))
			})] })
		]
	});
}
//#endregion
export { OpsSettingsPage as component };
