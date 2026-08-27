import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { recordAdEvent } from "@/lib/server/api";
import { t } from "@/lib/i18n/en";

const SECONDS = 8;

export function RewardedAd({
  onComplete,
  onCancel,
}: {
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [left, setLeft] = useState(SECONDS);

  useEffect(() => {
    void recordAdEvent({
      data: { placement: "rewarded", format: "rewarded", creativeId: "premium", network: "house" },
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (left <= 0) return;
    const id = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left]);

  const progress = ((SECONDS - left) / SECONDS) * 100;

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#2a2c32] via-[#14151a] to-[#0a0a0c] px-5 py-8 text-center">
        <p className="text-[10px] tracking-[0.2em] text-fg/50 uppercase">{t.ads.ad}</p>
        <p className="mt-4 font-display text-3xl text-fg">{t.ads.rewardedTitle}</p>
        <p className="mx-auto mt-2 max-w-[16rem] text-sm text-fg/70">{t.ads.rewardedBody}</p>
        <div className="mx-auto mt-6 h-1.5 w-full max-w-[14rem] overflow-hidden rounded-full bg-fg/15">
          <div className="h-full bg-fg transition-[width] duration-1000 ease-linear" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-sm tabular-nums text-fg/80">
          {left > 0 ? t.ads.remaining.replace("{n}", String(left)) : t.ads.ready}
        </p>
      </div>
      <Button className="w-full" disabled={left > 0} onClick={onComplete}>
        {left > 0 ? t.ads.wait : t.download.skipWait}
      </Button>
      <Button variant="ghost" className="w-full" onClick={onCancel}>
        {t.cancel}
      </Button>
    </div>
  );
}