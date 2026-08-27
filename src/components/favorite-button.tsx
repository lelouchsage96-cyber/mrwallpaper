import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { toggleFavorite } from "@/lib/server/api";
import { t } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  wallpaperId,
  isFavorite,
  onChange,
  className,
}: {
  wallpaperId: string;
  isFavorite: boolean;
  onChange?: (next: boolean) => void;
  className?: string;
}) {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(isFavorite);

  useEffect(() => {
    setLocal(isFavorite);
  }, [isFavorite]);

  return (
    <button
      type="button"
      aria-label={local ? t.wallpaper.unfavorite : t.wallpaper.favorite}
      aria-pressed={local}
      disabled={busy}
      className={cn(
        "grid size-11 place-items-center rounded-full bg-bg/55 text-fg backdrop-blur-sm",
        "transition-transform duration-150 ease-out active:scale-[0.96]",
        className,
      )}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isPending) return;
        if (!user) {
          void navigate({ to: "/login", search: { next: `/wallpaper/${wallpaperId}` } });
          return;
        }
        setBusy(true);
        const prev = local;
        setLocal(!prev);
        onChange?.(!prev);
        try {
          const res = await toggleFavorite({ data: { wallpaperId } });
          setLocal(res.isFavorite);
          onChange?.(res.isFavorite);
        } catch {
          setLocal(prev);
          onChange?.(prev);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Heart
        className={cn(
          "size-5 transition-transform duration-150 ease-out",
          local ? "scale-110" : "scale-100",
        )}
        strokeWidth={1.75}
        fill={local ? "currentColor" : "none"}
      />
    </button>
  );
}
