import { Link } from "@tanstack/react-router";
import { LazyImage } from "@/components/lazy";
import { t } from "@/lib/i18n/en";
import type { DownloadHistoryItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function typeLabel(type: string) {
  if (type === "premium") return t.history.types.premium;
  if (type === "rewarded") return t.history.types.rewarded;
  return t.history.types.free;
}

export function DownloadHistoryList({ items }: { items: DownloadHistoryItem[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-[20px] bg-elevated">
      {items.map((item) => (
        <li key={`${item.id}-${item.downloadedAt}`}>
          <Link
            to="/wallpaper/$id"
            params={{ id: item.id }}
            className="flex min-h-16 items-center gap-3 px-3 py-2.5"
          >
            <LazyImage
              src={item.thumbnailUrl}
              alt=""
              width={40}
              height={71}
              className="wallpaper-img h-14 w-8 shrink-0 rounded-[8px] object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-fg">{item.title}</span>
              <span className="mt-0.5 block text-xs text-muted">
                {formatDate(item.downloadedAt)}
                {" · "}
                {typeLabel(item.downloadType)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
