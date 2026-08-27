import { useEffect, useRef, useState } from "react";
import {
  pickHouseAd,
  unitFor,
  webWaterfall,
  type AdPlacement,
} from "@/lib/ads";
import { getAdContext, recordAdEvent } from "@/lib/server/api";
import { t } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";
import type { AdContext } from "@/lib/types";

export function AdSlot({
  placement,
  className,
}: {
  placement: AdPlacement;
  className?: string;
}) {
  const [ctx, setCtx] = useState<AdContext | null>(null);
  useEffect(() => {
    void getAdContext().then(setCtx).catch(() => undefined);
  }, []);
  if (!ctx?.showAds) return null;
  return <MediatedAd placement={placement} className={className} ctx={ctx} />;
}

function MediatedAd({
  placement,
  className,
  ctx,
}: {
  placement: AdPlacement;
  className?: string;
  ctx: AdContext;
}) {
  const stack = webWaterfall(ctx.networks);
  const adsense = stack.find((n) => n.id === "adsense");
  const canAdsense = Boolean(adsense && adsense.publisherId && unitFor(adsense, placement));
  const [winner, setWinner] = useState<"adsense" | "house">(canAdsense ? "adsense" : "house");
  const insRef = useRef<HTMLModElement | null>(null);
  const logged = useRef(false);
  const creative = pickHouseAd(placement);

  useEffect(() => {
    if (!canAdsense || !adsense) {
      if (!logged.current) {
        logged.current = true;
        void recordAdEvent({
          data: { placement, format: "display", creativeId: creative.id, network: "house" },
        }).catch(() => undefined);
      }
      return;
    }
    const id = "mw-adsense";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsense.publisherId)}`;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    const push = window.setTimeout(() => {
      try {
        ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle ??= []).push({});
      } catch {
        /* empty */
      }
    }, 200);
    const tmr = window.setTimeout(() => {
      const filled = (insRef.current?.offsetHeight ?? 0) > 40;
      const network = filled ? "adsense" : "house";
      if (!filled) setWinner("house");
      if (!logged.current) {
        logged.current = true;
        void recordAdEvent({
          data: {
            placement,
            format: "display",
            creativeId: filled ? "adsense" : creative.id,
            network,
          },
        }).catch(() => undefined);
      }
    }, adsense.timeoutMs || 2500);
    return () => {
      window.clearTimeout(push);
      window.clearTimeout(tmr);
    };
  }, [adsense, canAdsense, creative.id, placement]);

  const house = (
    <a
      href={creative.href}
      onClick={() => {
        void recordAdEvent({
          data: { placement, format: "display", creativeId: creative.id, clicked: true, network: "house" },
        }).catch(() => undefined);
      }}
      className={cn(
        "relative block overflow-hidden bg-gradient-to-br text-left",
        creative.tone,
        placement === "feed" ? "aspect-[9/16] rounded-[16px]" : placement === "anchor" ? "h-14 w-full" : "min-h-20 w-full rounded-[16px]",
        className,
      )}
    >
      <span className="absolute left-2.5 top-2.5 rounded-full bg-bg/55 px-2 py-0.5 text-[10px] font-medium tracking-wide text-fg/80 backdrop-blur-sm">
        {t.ads.sponsored}
      </span>
      <span
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/80 to-transparent px-3",
          placement === "anchor" ? "py-1.5" : "py-3",
        )}
      >
        <span className="block text-[10px] tracking-[0.16em] text-fg/60 uppercase">{creative.kicker}</span>
        <span className={cn("block font-medium text-fg", placement === "feed" ? "mt-1 font-display text-2xl" : "text-sm")}>
          {creative.title}
        </span>
        {placement !== "anchor" ? <span className="mt-0.5 block text-xs text-fg/70">{creative.body}</span> : null}
      </span>
    </a>
  );

  if (winner === "house" || !canAdsense || !adsense) return house;

  return (
    <div className={cn("overflow-hidden bg-elevated", placement === "feed" ? "aspect-[9/16] rounded-[16px]" : "rounded-[16px]", className)}>
      <ins
        ref={insRef}
        className="adsbygoogle block min-h-20 w-full"
        style={{ display: "block" }}
        data-ad-client={adsense.publisherId}
        data-ad-slot={unitFor(adsense, placement)}
        data-ad-format={placement === "feed" ? "fluid" : "auto"}
        data-full-width-responsive="true"
      />
    </div>
  );
}

export function AdAnchor() {
  const [ctx, setCtx] = useState<AdContext | null>(null);
  const [path, setPath] = useState("");
  useEffect(() => {
    setPath(window.location.pathname);
    void getAdContext().then(setCtx).catch(() => undefined);
  }, []);
  if (!ctx?.showAds || path.includes("/premium")) return null;
  return (
    <div className="fixed inset-x-0 bottom-[4.25rem] z-30 px-2 sm:px-3">
      <div className="mx-auto max-w-lg overflow-hidden rounded-xl shadow-[var(--shadow-border)]">
        <MediatedAd placement="anchor" ctx={ctx} />
      </div>
    </div>
  );
}