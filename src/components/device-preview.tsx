import {
  Battery,
  Camera,
  FileText,
  Flashlight,
  Mail,
  Map,
  Music2,
  Phone,
  Settings,
  Sun,
  Wifi,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { t } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";

export type PreviewMode = "lock" | "home";

function clockParts(now: Date | null) {
  const d = now ?? new Date(2000, 0, 1, 9, 41);
  const minutes = d.getMinutes();
  const hours = d.getHours() % 12;
  return {
    minuteDeg: minutes * 6,
    hourDeg: hours * 30 + minutes * 0.5,
  };
}

function AnalogClock({ now, className }: { now: Date | null; className?: string }) {
  const { hourDeg, minuteDeg } = clockParts(now);
  return (
    <span className={cn("mw-clock-face", className)}>
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className="mw-clock-tick" style={{ transform: `rotate(${i * 30}deg)` }} />
      ))}
      <span className="mw-clock-hour" style={{ transform: `rotate(${hourDeg}deg)` }} />
      <span className="mw-clock-minute" style={{ transform: `rotate(${minuteDeg}deg)` }} />
      <span className="mw-clock-dot" />
    </span>
  );
}

function CalendarFace({ now }: { now: Date | null }) {
  const d = now ?? new Date(2000, 7, 26);
  return (
    <span className="mw-app-icon mw-app-cal">
      <span className="mw-cal-month">
        {d.toLocaleDateString(undefined, { month: "short" }).toUpperCase()}
      </span>
      <span className="mw-cal-day">{d.getDate()}</span>
    </span>
  );
}

function PhotosGlyph() {
  const petals = ["#ff375f", "#ff9f0a", "#ffd60a", "#30d158", "#64d2ff", "#0a84ff", "#5e5ce6", "#bf5af2"];
  return (
    <svg viewBox="0 0 32 32" className="relative z-[1] size-[70%]" aria-hidden>
      <g transform="translate(16 16)">
        {petals.map((c, i) => (
          <ellipse
            key={c}
            cx="0"
            cy="-6.6"
            rx="3.2"
            ry="6.8"
            fill={c}
            transform={`rotate(${i * 45})`}
          />
        ))}
        <circle r="2.6" fill="white" />
      </g>
    </svg>
  );
}

function SafariGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="relative z-[1] size-[72%]" aria-hidden>
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.7" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x="15.35"
          y="3.1"
          width="1.3"
          height={i % 3 === 0 ? 3.1 : 1.7}
          rx="0.4"
          fill="currentColor"
          transform={`rotate(${i * 30} 16 16)`}
        />
      ))}
      <polygon points="16,5 18.8,16 16,14.5 13.2,16" fill="#ff3b30" />
      <polygon points="16,27 13.2,16 16,17.5 18.8,16" fill="currentColor" opacity="0.88" />
      <circle cx="16" cy="16" r="1.35" fill="currentColor" />
    </svg>
  );
}

function HomeApp({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mw-home-app">
      {children}
      <span className="mw-app-label">{label}</span>
    </div>
  );
}

function GlassIcon({ children }: { children: ReactNode }) {
  return <span className="mw-app-icon">{children}</span>;
}

export function DevicePreview({
  src,
  videoSrc,
  alt,
  mode,
  onModeChange,
  hideToggle = false,
  variant = "phone",
  landscape = false,
}: {
  src: string;
  videoSrc?: string | null;
  alt: string;
  mode: PreviewMode;
  onModeChange?: (mode: PreviewMode) => void;
  hideToggle?: boolean;
  variant?: "phone" | "tablet";
  landscape?: boolean;
}) {
  const [now, setNow] = useState<Date | null>(null);
  const [plateSrc, setPlateSrc] = useState(src);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setPlateSrc(src);
  }, [src]);

  function onPlateError() {
    if (plateSrc.endsWith(".jpg")) {
      setPlateSrc(plateSrc.replace(/\.jpg$/i, ".svg"));
      return;
    }
    if (plateSrc.endsWith(".webp")) {
      setPlateSrc(plateSrc.replace(/\/thumbs\/([^/.]+)\.webp$/i, "/$1.jpg"));
    }
  }

  const time = now
    ? now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/i, "")
    : "9:41";
  const date = now
    ? now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
    : "Wednesday, August 26";
  const weekday = now
    ? now.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()
    : "WED";
  const monthLong = now
    ? now.toLocaleDateString(undefined, { month: "long" })
    : "August";
  const dayNum = now ? String(now.getDate()) : "26";

  const plate = videoSrc ? (
              <video
                src={videoSrc}
                poster={plateSrc}
                className="size-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={plateSrc}
                alt={alt}
                width={landscape ? 2048 : 1080}
                height={landscape ? 1536 : 1920}
                className="size-full object-cover"
                decoding="async"
                fetchPriority="high"
                onError={onPlateError}
              />
            );

  if (variant === "tablet") {
    return (
      <div>
        <div className="px-3">
          <div className={landscape ? "mw-tablet" : "mw-tablet is-portrait"}>
            <div className="mw-tablet-screen">
              {plate}
              <span className="mw-tablet-cam" aria-hidden />
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 flex flex-col transition-opacity duration-200 ease-out",
                  mode === "lock" ? "opacity-100" : "hidden",
                )}
                aria-hidden={mode !== "lock"}
              >
                <p className="mt-10 text-center text-sm font-medium tracking-wide text-on-photo">
                  {date}
                </p>
                <p className="mt-1 text-center font-sans text-6xl font-light leading-none tracking-tight text-on-photo tabular-nums sm:text-7xl">
                  {time}
                </p>
                <div className="mt-auto flex flex-col items-center gap-4 pb-3">
                  <span className="mw-tablet-home-bar" />
                </div>
              </div>
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 flex flex-col transition-opacity duration-200 ease-out",
                  mode === "home" ? "opacity-100" : "hidden",
                )}
                aria-hidden={mode !== "home"}
              >
                <div className="mw-home-shade" />
                <div className="relative mw-home-status">
                  <span className="text-xs font-semibold tabular-nums">{time}</span>
                  <span />
                  <span className="flex items-center justify-end gap-1">
                    <Wifi className="size-3.5" strokeWidth={2.4} />
                    <Battery className="size-4" strokeWidth={2.2} />
                  </span>
                </div>
                <div className="relative mt-auto flex flex-col items-center gap-2.5 pb-3">
                  <div className="mw-dock">
                    <GlassIcon>
                      <SafariGlyph />
                    </GlassIcon>
                    <GlassIcon>
                      <Mail className="size-5" fill="currentColor" strokeWidth={1.6} />
                    </GlassIcon>
                    <GlassIcon>
                      <PhotosGlyph />
                    </GlassIcon>
                    <GlassIcon>
                      <Music2 className="size-5" fill="currentColor" strokeWidth={1.6} />
                    </GlassIcon>
                  </div>
                  <span className="mw-tablet-home-bar" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {hideToggle ? null : (
          <div className="mx-auto mt-5 grid max-w-xs grid-cols-2 gap-2">
            {(["lock", "home"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onModeChange?.(m)}
                className={cn(
                  "h-11 rounded-full text-sm",
                  mode === m ? "bg-fg text-bg" : "bg-elevated text-muted",
                )}
              >
                {m === "lock" ? t.preview.lock : t.preview.home}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="px-3">
        <div className="mw-phone">
          <span className="mw-phone-silent" aria-hidden />
          <span className="mw-phone-vol-up" aria-hidden />
          <span className="mw-phone-vol-down" aria-hidden />
          <span className="mw-phone-power" aria-hidden />
          <div className="mw-phone-screen">
            {videoSrc ? (
              <video
                src={videoSrc}
                poster={plateSrc}
                className="size-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={plateSrc}
                alt={alt}
                width={1080}
                height={1920}
                className="size-full object-cover"
                decoding="async"
                fetchPriority="high"
                onError={onPlateError}
              />
            )}
            <div className="mw-phone-island" aria-hidden />

            <div
              className={cn(
                "pointer-events-none absolute inset-0 z-[4] flex flex-col overflow-hidden transition-opacity duration-200 ease-out",
                mode === "lock" ? "opacity-100" : "hidden",
              )}
              aria-hidden={mode !== "lock"}
            >
              <p className="mt-14 whitespace-nowrap px-3 text-center text-sm font-medium tracking-wide text-on-photo">
                {date}
              </p>
              <p className="mt-1 whitespace-nowrap text-center font-sans text-7xl font-light leading-none tracking-tight text-on-photo tabular-nums sm:text-8xl">
                {time}
              </p>
              <div className="mt-auto flex flex-col items-center gap-5 pb-3">
                <div className="flex w-full justify-between px-8">
                  <span className="grid size-12 place-items-center rounded-full bg-on-photo/20 text-on-photo backdrop-blur-md">
                    <Flashlight className="size-5" strokeWidth={1.6} />
                  </span>
                  <span className="grid size-12 place-items-center rounded-full bg-on-photo/20 text-on-photo backdrop-blur-md">
                    <Camera className="size-5" strokeWidth={1.6} />
                  </span>
                </div>
                <span className="mw-phone-home-bar" />
              </div>
            </div>

            <div
              className={cn(
                "pointer-events-none absolute inset-0 z-[4] flex flex-col overflow-hidden gap-5 transition-opacity duration-200 ease-out",
                mode === "home" ? "opacity-100" : "hidden",
              )}
              aria-hidden={mode !== "home"}
            >
              <div className="mw-home-shade" />
              <div className="relative mw-home-status">
                <span className="text-xs font-semibold tabular-nums">{time}</span>
                <span />
                <span className="flex items-center justify-end gap-1">
                  <span className="flex items-end gap-px" aria-hidden>
                    <span className="mw-status-glyph h-1 w-0.5 rounded-sm" />
                    <span className="mw-status-glyph h-1.5 w-0.5 rounded-sm" />
                    <span className="mw-status-glyph h-2 w-0.5 rounded-sm" />
                    <span className="mw-status-glyph h-2.5 w-0.5 rounded-sm" />
                  </span>
                  <Wifi className="size-3.5" strokeWidth={2.4} />
                  <Battery className="size-4" strokeWidth={2.2} />
                </span>
              </div>

              <div className="relative mw-home-widgets">
                <div className="mw-widget">
                  <p className="mw-widget-kicker">{weekday}</p>
                  <p className="mw-widget-day">{dayNum}</p>
                  <p className="mw-widget-sub">{monthLong}</p>
                </div>
                <div className="mw-widget mw-widget-clock">
                  <AnalogClock now={now} />
                </div>
              </div>

              <div className="relative mw-home-apps">
                <HomeApp label="Calendar">
                  <CalendarFace now={now} />
                </HomeApp>
                <HomeApp label="Photos">
                  <GlassIcon>
                    <PhotosGlyph />
                  </GlassIcon>
                </HomeApp>
                <HomeApp label="Camera">
                  <GlassIcon>
                    <Camera className="size-5" fill="currentColor" strokeWidth={1.6} />
                  </GlassIcon>
                </HomeApp>
                <HomeApp label="Clock">
                  <GlassIcon>
                    <AnalogClock now={now} />
                  </GlassIcon>
                </HomeApp>
                <HomeApp label="Maps">
                  <GlassIcon>
                    <Map className="size-5" fill="currentColor" strokeWidth={1.6} />
                  </GlassIcon>
                </HomeApp>
                <HomeApp label="Weather">
                  <GlassIcon>
                    <Sun className="size-5" fill="currentColor" strokeWidth={1.6} />
                  </GlassIcon>
                </HomeApp>
                <HomeApp label="Notes">
                  <GlassIcon>
                    <FileText className="size-5" fill="currentColor" strokeWidth={1.6} />
                  </GlassIcon>
                </HomeApp>
                <HomeApp label="Settings">
                  <GlassIcon>
                    <Settings className="size-5" fill="currentColor" strokeWidth={1.6} />
                  </GlassIcon>
                </HomeApp>
              </div>

              <div className="relative mt-auto flex flex-col items-center gap-2.5 pb-3">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="size-1.5 rounded-full bg-on-photo" />
                  <span className="size-1.5 rounded-full bg-on-photo/35" />
                </span>
                <div className="mw-dock">
                  <GlassIcon>
                    <Phone className="size-5" fill="currentColor" strokeWidth={1.4} />
                  </GlassIcon>
                  <GlassIcon>
                    <Mail className="size-5" fill="currentColor" strokeWidth={1.6} />
                  </GlassIcon>
                  <GlassIcon>
                    <SafariGlyph />
                  </GlassIcon>
                  <GlassIcon>
                    <Music2 className="size-5" fill="currentColor" strokeWidth={1.6} />
                  </GlassIcon>
                </div>
                <span className="mw-phone-home-bar" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {hideToggle ? null : (
        <div className="mx-auto mt-5 grid max-w-xs grid-cols-2 gap-2">
          {(["lock", "home"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange?.(m)}
              className={cn(
                "h-11 rounded-full text-sm",
                mode === m ? "bg-fg text-bg" : "bg-elevated text-muted",
              )}
            >
              {m === "lock" ? t.preview.lock : t.preview.home}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
