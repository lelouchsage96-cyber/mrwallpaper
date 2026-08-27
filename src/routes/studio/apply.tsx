import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n/en";
import { applyToStudio } from "@/lib/server/studio";
import { slugify } from "@/lib/utils";

export const Route = createFileRoute("/studio/apply")({ component: StudioApply });

function StudioApply() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slugEdit, setSlugEdit] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const slug = useMemo(() => (slugEdit !== null ? slugEdit : slugify(name)), [name, slugEdit]);

  async function submit() {
    if (name.trim().length < 2) {
      setMsg(t.studio.needName);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await applyToStudio({
        data: { displayName: name.trim(), slug, bio: bio.trim() },
      });
      if (!res.ok) {
        setMsg(res.error === "taken" ? t.studio.slugTaken : t.studio.needName);
        return;
      }
      void navigate({ to: "/studio" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs tracking-[0.2em] text-muted uppercase">{t.studio.brand}</p>
      <h1 className="mt-2 font-display text-4xl text-fg">{t.studio.applyTitle}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{t.studio.applyBody}</p>

      <label className="mt-8 block text-sm text-muted">
        {t.studio.name}
        <Input
          className="mt-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoComplete="organization"
        />
      </label>
      <label className="mt-4 block text-sm text-muted">
        {t.studio.slug}
        <Input
          className="mt-2"
          value={slug}
          onChange={(e) => setSlugEdit(e.target.value.toLowerCase())}
          maxLength={32}
        />
      </label>
      <label className="mt-4 block text-sm text-muted">
        {t.studio.bio}
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={280}
          rows={4}
          className="mt-2 w-full rounded-[12px] bg-elevated px-4 py-3 text-sm text-fg placeholder:text-subtle shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder={t.studio.bioHint}
        />
      </label>
      {msg ? <p className="mt-3 text-sm text-danger">{msg}</p> : null}
      <Button className="mt-6 w-full" disabled={busy} onClick={() => void submit()}>
        {busy ? t.studio.applying : t.studio.apply}
      </Button>
    </div>
  );
}
