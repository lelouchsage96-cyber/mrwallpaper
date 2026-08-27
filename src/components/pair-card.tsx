import { LazyImage } from "@/components/lazy";
import type { WallpaperPair } from "@/lib/types";
import { t } from "@/lib/i18n/en";

export function PairCard({ pair }: { pair: WallpaperPair }) {
  return (
    <a href={`/pair/${pair.slug}`} className="block w-44 shrink-0">
      <div className="relative h-52">
        <LazyImage
          src={pair.home.thumbnailUrl}
          alt={`${pair.home.title} home screen wallpaper`}
          width={pair.home.width}
          height={pair.home.height}
          fallback={pair.home.thumbnailUrl}
          className="wallpaper-img absolute top-4 left-10 h-44 w-24 rounded-md object-cover shadow-[var(--shadow-border)]"
        />
        <LazyImage
          src={pair.lock.thumbnailUrl}
          alt={`${pair.lock.title} lock screen wallpaper`}
          width={pair.lock.width}
          height={pair.lock.height}
          fallback={pair.lock.thumbnailUrl}
          className="wallpaper-img absolute top-0 left-0 h-48 w-[6.75rem] rounded-md object-cover shadow-[var(--shadow-border)]"
        />
        {pair.suggested ? (
          <span className="absolute left-1 top-1 rounded-full bg-bg/75 px-2 py-0.5 text-[10px] tracking-wide text-fg backdrop-blur-sm">
            {t.pairs.today}
          </span>
        ) : null}
      </div>
      <span className="mt-2 block truncate text-sm font-medium text-fg">{pair.name}</span>
      <span className="block text-xs text-muted">
        {t.pairs.lock} + {t.pairs.home}
      </span>
    </a>
  );
}
