import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, v as Link, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as AD_NETWORK_META } from "./ads-DoVQGCTt.mjs";
import { S as Flag, b as Heart, v as Image, w as Download } from "../_libs/lucide-react.mjs";
import { K as t, V as formatCount, W as formatUsdMoney, z as cn } from "./router-DQ8icHtZ.mjs";
import { n as ErrorState } from "./empty-state-BWSi2TR4.mjs";
import { l as listOpsFeatured, r as getOpsOverview, u as listOpsReports } from "./ops-C_QDXn1-.mjs";
import { r as format, t as parseISO } from "../_libs/date-fns.mjs";
import { a as CartesianGrid, i as Area, n as YAxis, o as ResponsiveContainer, r as XAxis, s as Tooltip, t as AreaChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ops-BEaVlYhx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function DownloadChart({ series }) {
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setReady(true);
	}, []);
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-56 animate-pulse rounded-lg bg-surface" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-56 w-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
			width: "100%",
			height: "100%",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
				data: series,
				margin: {
					top: 8,
					right: 4,
					left: 0,
					bottom: 0
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
						id: "opsDlFill",
						x1: "0",
						y1: "0",
						x2: "0",
						y2: "1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0%",
							stopColor: "var(--color-fg)",
							stopOpacity: .28
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "100%",
							stopColor: "var(--color-fg)",
							stopOpacity: 0
						})]
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
						vertical: false,
						stroke: "var(--color-border)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
						dataKey: "date",
						tickLine: false,
						axisLine: false,
						tickMargin: 8,
						minTickGap: 28,
						tick: {
							fill: "var(--color-muted)",
							fontSize: 11
						},
						tickFormatter: (d) => {
							try {
								return format(parseISO(d), "d MMM");
							} catch {
								return d;
							}
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
						width: 32,
						tickLine: false,
						axisLine: false,
						tick: {
							fill: "var(--color-muted)",
							fontSize: 11
						},
						tickFormatter: (n) => formatCount(n)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
						cursor: { stroke: "var(--color-border)" },
						contentStyle: {
							background: "var(--color-elevated)",
							border: "1px solid var(--color-border)",
							borderRadius: 12,
							fontSize: 12,
							color: "var(--color-fg)"
						},
						labelFormatter: (d) => {
							try {
								return format(parseISO(String(d)), "EEE d MMM");
							} catch {
								return String(d);
							}
						},
						formatter: (value, name) => [formatCount(Number(value) || 0), String(name)]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
						type: "monotone",
						dataKey: "total",
						name: "Downloads",
						stroke: "var(--color-fg)",
						strokeWidth: 1.75,
						fill: "url(#opsDlFill)",
						activeDot: {
							r: 3,
							fill: "var(--color-fg)"
						}
					})
				]
			})
		})
	});
}
function StatCard({ label, value, hint, delta, to, icon }) {
	const body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium tracking-widest text-subtle uppercase",
				children: label
			}), icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-subtle",
				children: icon
			}) : null]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 font-display text-3xl tabular-nums text-fg",
			children: formatCount(value)
		}),
		delta !== void 0 && delta !== 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: cn("mt-1 text-xs tabular-nums", delta > 0 ? "text-success" : "text-danger"),
			children: [
				delta > 0 ? "+" : "",
				delta,
				" ",
				t.ops.vsYesterday
			]
		}) : hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xs text-muted",
			children: hint
		}) : null
	] });
	const className = "block rounded-xl bg-elevated px-4 py-4";
	if (to) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to,
		className: cn(className, "transition-opacity hover:opacity-90"),
		children: body
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className,
		children: body
	});
}
function OpsOverviewPage() {
	const [data, setData] = (0, import_react.useState)(null);
	const [featured, setFeatured] = (0, import_react.useState)([]);
	const [reports, setReports] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)(false);
	function load() {
		setError(false);
		Promise.all([
			getOpsOverview(),
			listOpsFeatured(),
			listOpsReports()
		]).then(([o, f, r]) => {
			setData(o);
			setFeatured(f.items);
			setReports(r.items.filter((x) => x.status === "open").slice(0, 5));
		}).catch(() => setError(true));
	}
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: load });
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-16 animate-pulse rounded-xl bg-elevated" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-2.5 sm:grid-cols-4",
				children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-28 animate-pulse rounded-xl bg-elevated" }, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-elevated" })
		]
	});
	const slotLabel = (slot) => slot === "wotd" ? t.ops.wotd : slot === "editors_choice" ? t.ops.editors : t.ops.spotlight;
	const mixMax = Math.max(...data.byType.map((x) => x.count), 1);
	const typeLabel = (type) => type === "premium" ? t.history.types.premium : type === "rewarded" ? t.history.types.rewarded : t.history.types.free;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8 mw-enter",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-widest text-subtle uppercase",
						children: t.ops.studio
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-display text-4xl text-fg",
						children: t.ops.overview
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm text-muted",
						children: t.ops.previewNote
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: format(/* @__PURE__ */ new Date(), "EEEE, d MMM")
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid grid-cols-2 gap-2.5 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: t.ops.stats.downloadsToday,
						value: data.downloadsToday,
						delta: data.downloadsToday - data.downloadsYesterday,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: t.ops.stats.reports,
						value: data.openReports,
						hint: t.ops.openQueue,
						to: "/ops/reports",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: t.ops.stats.approved,
						value: data.approved,
						hint: `${formatCount(data.wallpapers)} ${t.ops.stats.wallpapers.toLowerCase()}`,
						to: "/ops/wallpapers",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: t.ops.stats.premiumSubs,
						value: data.premiumSubs,
						hint: `${formatCount(data.favorites)} ${t.ops.favorites.toLowerCase()}`,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "size-4" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid grid-cols-2 gap-2.5 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-elevated px-4 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs tracking-widest text-subtle uppercase",
								children: t.ops.adRevenue
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 font-display text-2xl tabular-nums text-fg",
								children: formatUsdMoney(data.adRevenueTodayMicros / 1e6)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted",
								children: t.ops.adToday
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-elevated px-4 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs tracking-widest text-subtle uppercase",
								children: t.ops.adImpressions
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 font-display text-2xl tabular-nums text-fg",
								children: formatCount(data.adImpressionsToday)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted",
								children: t.ops.adToday
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-elevated px-4 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs tracking-widest text-subtle uppercase",
								children: t.ops.adRevenue
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 font-display text-2xl tabular-nums text-fg",
								children: formatUsdMoney(data.adRevenueAllMicros / 1e6)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted",
								children: t.ops.stats.downloads
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-elevated px-4 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs tracking-widest text-subtle uppercase",
								children: "CTR"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 font-display text-2xl tabular-nums text-fg",
								children: data.adImpressionsToday ? `${(data.adClicksToday / data.adImpressionsToday * 100).toFixed(1)}%` : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-muted",
								children: [formatCount(data.adClicksToday), " clicks"]
							})
						]
					})
				]
			}),
			data.adByNetwork.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-elevated p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl text-fg",
					children: t.ops.byNetwork
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-3",
					children: data.adByNetwork.map((row) => {
						const id = row.network;
						const label = AD_NETWORK_META[id]?.label ?? row.network;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-baseline justify-between gap-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums text-fg",
								children: [
									formatCount(row.impressions),
									" · ",
									formatUsdMoney(row.revenueMicros / 1e6)
								]
							})]
						}, row.network);
					})
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid grid-cols-2 gap-2.5 sm:grid-cols-4",
				children: [
					{
						label: t.ops.stats.downloads,
						value: data.downloadsAll
					},
					{
						label: t.ops.stats.premium,
						value: data.premium
					},
					{
						label: t.ops.stats.pending,
						value: data.pending
					},
					{
						label: t.ops.stats.users,
						value: data.users
					}
				].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-elevated px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-widest text-subtle uppercase",
						children: s.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-display text-2xl tabular-nums text-fg",
						children: formatCount(s.value)
					})]
				}, s.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-elevated p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl text-fg",
						children: t.ops.last14
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadChart, { series: data.series })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-elevated p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl text-fg",
						children: t.ops.downloadMix
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-5 space-y-4",
						children: data.byType.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg",
								children: typeLabel(row.type)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums text-muted",
								children: formatCount(row.count)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 h-1.5 overflow-hidden rounded-full bg-surface",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full rounded-full bg-fg",
								style: { width: `${Math.round(row.count / mixMax * 100)}%` }
							})
						})] }, row.type))
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-8 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-end justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl text-fg",
						children: t.ops.topWallpapers
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/ops/wallpapers",
						className: "text-sm text-muted hover:text-fg",
						children: t.ops.seeCatalog
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "divide-y divide-border overflow-hidden rounded-xl bg-elevated",
					children: data.topWallpapers.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/wallpaper/$id",
						params: { id: w.id },
						className: "flex min-h-14 items-center gap-3 px-3 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-5 text-center text-xs tabular-nums text-subtle",
								children: i + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: w.thumbnailUrl,
								alt: "",
								className: "wallpaper-img h-12 w-7 shrink-0 rounded-sm object-cover"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm font-medium text-fg",
									children: w.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-muted",
									children: [
										formatCount(w.downloadCount),
										" ",
										t.wallpaper.downloads
									]
								})]
							})
						]
					}) }, w.id))
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-end justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl text-fg",
						children: t.ops.openReports
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/ops/reports",
						className: "text-sm text-muted hover:text-fg",
						children: t.ops.seeReports
					})]
				}), reports.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-xl bg-elevated px-4 py-8 text-center text-sm text-muted",
					children: t.ops.noReports
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-border overflow-hidden rounded-xl bg-elevated",
					children: reports.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex min-h-14 items-center gap-3 px-3 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: r.thumbnailUrl,
								alt: "",
								className: "wallpaper-img h-12 w-7 shrink-0 rounded-sm object-cover"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 flex-1 truncate text-sm text-fg",
								children: r.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs capitalize text-muted",
								children: r.reason
							})
						]
					}, r.id))
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-end justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl text-fg",
					children: t.ops.featured
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/ops/wallpapers",
					className: "text-sm text-muted hover:text-fg",
					children: t.ops.seeCatalog
				})]
			}), featured.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl bg-elevated px-4 py-8 text-center text-sm text-muted",
				children: t.ops.emptyFeatured
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
				children: featured.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/wallpaper/$id",
					params: { id: f.wallpaperId },
					className: "flex items-center gap-3 rounded-lg bg-elevated p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: f.thumbnailUrl,
						alt: "",
						className: "wallpaper-img h-14 w-8 shrink-0 rounded-sm object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-xs tracking-wide text-subtle uppercase",
							children: slotLabel(f.slot)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 block truncate text-sm font-medium text-fg",
							children: f.title
						})]
					})]
				}) }, f.id))
			})] })
		]
	});
}
//#endregion
export { OpsOverviewPage as component };
