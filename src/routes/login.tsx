import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { MwMark } from "@/components/mw-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n/en";
import { noindexHead } from "@/lib/seo";

type LoginSearch = { next?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    next: typeof s.next === "string" && s.next.startsWith("/") ? s.next : "/app",
  }),
  head: () => noindexHead(`Sign in | ${brand.name}`, "/login"),
  component: Login,
});

function Login() {
  const { next } = Route.useSearch();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "reset") {
        // Email delivery is not wired in this preview. Confirm without claiming a send.
        setInfo(t.auth.resetSent);
        return;
      }
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0] || "Member",
        });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message);
      }
      router.history.push(next ?? "/app");
    } catch {
      setError(mode === "signin" ? t.auth.invalid : t.auth.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <MwMark className="size-12" />
      <h1 className="mt-6 font-display text-4xl text-fg">
        {mode === "signup" ? t.auth.needAccount : mode === "reset" ? t.auth.resetTitle : t.auth.title}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {mode === "reset" ? t.auth.resetHint : t.auth.subtitle}
      </p>

      {authEnabled ? (
        <div className="mt-8 space-y-3">
          {GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              variant="secondary"
              className="w-full"
              onClick={() =>
                void signIn(p.providerId, {
                  callbackURL: next ?? "/app",
                  errorCallbackURL: "/login",
                })
              }
            >
              {t.auth.continueWith} {p.label}
            </Button>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">Sign-in is disabled.</p>
      )}

      <p className="my-6 text-center text-xs uppercase tracking-[0.18em] text-subtle">
        {t.auth.orEmail}
      </p>

      <form className="space-y-3" onSubmit={(e) => void onEmail(e)}>
        {mode === "signup" ? (
          <Input
            name="name"
            autoComplete="name"
            placeholder={t.auth.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        ) : null}
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t.auth.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {mode !== "reset" ? (
          <Input
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={8}
            placeholder={t.auth.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {info ? <p className="text-sm text-muted">{info}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "reset"
            ? t.auth.resetSend
            : mode === "signup"
              ? t.auth.signUp
              : t.auth.signIn}
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-muted">
        {mode === "signin" ? (
          <>
            <button type="button" className="min-h-11 text-fg" onClick={() => setMode("reset")}>
              {t.auth.forgot}
            </button>
            <p>
              {t.auth.noAccount}{" "}
              <button type="button" className="text-fg underline-offset-4 hover:underline" onClick={() => setMode("signup")}>
                {t.auth.signUp}
              </button>
            </p>
          </>
        ) : (
          <p>
            {t.auth.hasAccount}{" "}
            <button type="button" className="text-fg underline-offset-4 hover:underline" onClick={() => setMode("signin")}>
              {t.auth.signIn}
            </button>
          </p>
        )}
        <Link to="/app" className="block min-h-11 pt-2 text-muted hover:text-fg">
          {t.auth.guest}
        </Link>
      </div>

      <p className="mt-8 text-center text-xs text-subtle">
        {brand.name}. {brand.tagline}
      </p>
    </main>
  );
}
