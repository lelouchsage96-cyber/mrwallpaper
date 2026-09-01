import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { MwMark } from "@/components/mw-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { brand } from "@/lib/brand";
import { noindexHead } from "@/lib/seo";

type ResetSearch = { token?: string; error?: string };

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>): ResetSearch => ({
    token: typeof s.token === "string" ? s.token : undefined,
    error: typeof s.error === "string" ? s.error : undefined,
  }),
  head: () => noindexHead(`Reset password | ${brand.name}`, "/reset-password"),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token, error: tokenError } = Route.useSearch();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(
    tokenError || !token ? "This reset link is invalid or has expired." : null,
  );
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await authClient.resetPassword({ newPassword: password, token });
      if (err) throw new Error(err.message ?? "Reset failed");
      setDone(true);
    } catch (err) {
      console.error("[auth] reset-password", err);
      setError("This reset link is invalid, expired, or already used. Request a new one.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <MwMark className="size-12" />
      <h1 className="mt-6 font-display text-4xl text-fg">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted">Create a new password for your Mr Wallpapers account.</p>

      {done ? (
        <div className="mt-8 rounded-xl bg-elevated p-5">
          <p className="text-sm text-fg">Your password has been changed successfully.</p>
          <Button className="mt-4 w-full" onClick={() => router.history.push("/login")}>
            Sign in
          </Button>
        </div>
      ) : (
        <form className="mt-8 space-y-3" onSubmit={(e) => void submit(e)}>
          <Input
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!token}
          />
          <Input
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={!token}
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={busy || !token}>
            {busy ? "Changing…" : "Change password"}
          </Button>
        </form>
      )}

      {!done ? (
        <Link to="/login" className="mt-6 text-center text-sm text-muted hover:text-fg">
          Back to sign in
        </Link>
      ) : null}
    </main>
  );
}
