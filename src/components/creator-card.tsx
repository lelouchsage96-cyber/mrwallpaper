import { LazyImage } from "@/components/lazy";
import { t } from "@/lib/i18n/en";
import { plateFallback } from "@/lib/media";
import type { CreatorCard as Card } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CreatorCard({ creator, className }: { creator: Card; className?: string }) {
  return (
    <a
      href={`/creator/${creator.slug}`}
      className={cn(
        "relative block aspect-[4/5] w-full overflow-hidden rounded-xl bg-elevated",
        className,
      )}
    >
      <LazyImage
        src={creator.coverUrl}
        alt={`${creator.displayName} wallpapers`}
        width={800}
        height={1000}
        fallback={plateFallback(creator.coverUrl)}
        className="wallpaper-img size-full object-cover"
      />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/90 to-transparent px-3 pb-2.5 pt-10">
        <span className="block truncate font-medium text-fg">{creator.displayName}</span>
        <span className="mt-0.5 block text-xs text-fg/70">
          {t.creators.pieces.replace("{n}", String(creator.pieceCount))}
        </span>
      </span>
    </a>
  );
}
