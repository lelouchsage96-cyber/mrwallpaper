import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MwMark } from "@/components/mw-mark";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/en";
import { noindexHead } from "@/lib/seo";
import { ONBOARDING_KEY } from "@/lib/storage-keys";

export const Route = createFileRoute("/onboarding")({
  head: () => noindexHead("Welcome", "/onboarding"),
  component: Onboarding,
});

const previews = [
  ["/wallpapers/ridge-line.jpg", "/wallpapers/after-rain-sky.jpg", "/wallpapers/true-black.jpg"],
  ["/wallpapers/paper-moon.jpg", "/wallpapers/late-grid.jpg", "/wallpapers/crane-hour.jpg"],
  ["/wallpapers/lock-dune.jpg", "/wallpapers/kepler-dust.jpg", "/wallpapers/thin-cross.jpg"],
];

function complete() {
  localStorage.setItem(ONBOARDING_KEY, "1");
}

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const screens = t.onboarding.screens;
  const last = step === screens.length - 1;
  const screen = screens[step];
  const shots = previews[step] ?? previews[0];

  function skip() {
    complete();
    void navigate({ to: "/app" });
  }

  function finish() {
    complete();
    void navigate({ to: "/login", search: { next: "/app" } });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-10 pt-8">
      <div className="flex items-center justify-between">
        <MwMark className="size-9" />
        <button
          type="button"
          className="min-h-11 px-2 text-sm text-muted"
          onClick={skip}
        >
          {t.onboarding.skip}
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center mw-enter">
        <div className="relative mx-auto mb-8 h-56 w-full max-w-xs">
          {shots.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className="absolute top-0 aspect-[9/16] w-28 rounded-[20px] object-cover shadow-[var(--shadow-border)]"
              style={{
                left: `${18 + i * 22}%`,
                zIndex: i === 1 ? 3 : 1,
                transform: `rotate(${(i - 1) * 8}deg) translateY(${i === 1 ? 0 : 12}px)`,
              }}
            />
          ))}
        </div>
        <p className="text-xs tracking-[0.2em] text-muted uppercase">
          {String(step + 1).padStart(2, "0")} / {String(screens.length).padStart(2, "0")}
        </p>
        <h1 className="mt-4 font-display text-4xl text-fg md:text-5xl">
          {screen.headline}
        </h1>
        <p className="mt-4 max-w-sm text-base text-muted">{screen.description}</p>
      </div>

      <div className="flex items-center gap-2 pb-4">
        {screens.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-fg" : "bg-elevated"}`}
          />
        ))}
      </div>

      <Button
        className="w-full"
        onClick={() => {
          if (last) finish();
          else setStep((s) => s + 1);
        }}
      >
        {last ? t.onboarding.getStarted : t.onboarding.next}
      </Button>
    </main>
  );
}
