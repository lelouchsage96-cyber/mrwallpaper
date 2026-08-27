import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ErrorState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n/en";
import { getOpsSession, listOpsUsers, updateOpsUser } from "@/lib/server/ops";
import type { OpsUserRow } from "@/lib/types";

export const Route = createFileRoute("/ops/users")({ component: OpsUsersPage });

function OpsUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<OpsUserRow[] | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function load() {
    setError(false);
    void getOpsSession()
      .then((s) => {
        if (!s.canAdmin) {
          void navigate({ to: "/ops" });
          return;
        }
        return listOpsUsers();
      })
      .then((res) => {
        if (!res) return;
        setUsers(res.items);
      })
      .catch(() => setError(true));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!users) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((u) =>
      [u.name, u.email, u.role, u.status, u.userId].some((v) => v?.toLowerCase().includes(needle)),
    );
  }, [users, q]);

  if (error) return <ErrorState onRetry={load} />;
  if (!users) return <div className="h-48 animate-pulse rounded-xl bg-elevated" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-fg">{t.ops.users}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">{t.ops.usersHint}</p>
        {msg ? <p className="mt-2 text-sm text-muted">{msg}</p> : null}
      </div>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t.ops.searchAccounts}
        aria-label={t.ops.searchAccounts}
        type="search"
      />
      {filtered.length === 0 ? (
        <p className="rounded-xl bg-elevated px-4 py-10 text-center text-sm text-muted">{t.ops.noUsers}</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-elevated">
          {filtered.map((u) => (
            <li key={u.userId} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-medium text-fg">
                {(u.name || u.email || "A").charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 text-sm text-fg">
                {u.name || u.email || u.userId}
                {u.isPremium ? (
                  <span className="ml-2 text-xs text-muted">{t.ops.premiumMember}</span>
                ) : null}
                {u.email ? <span className="mt-0.5 block text-xs text-muted">{u.email}</span> : null}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={
                    u.isPremium
                      ? "h-11 rounded-md bg-fg px-3 text-sm text-bg"
                      : "h-11 rounded-md bg-surface px-3 text-sm text-fg"
                  }
                  onClick={async () => {
                    const next = !u.isPremium;
                    const res = await updateOpsUser({ data: { userId: u.userId, premium: next } });
                    if (res.ok) {
                      setUsers((prev) =>
                        prev ? prev.map((x) => (x.userId === u.userId ? { ...x, isPremium: next } : x)) : prev,
                      );
                    } else {
                      setMsg(res.message ?? t.ops.failed);
                    }
                  }}
                >
                  {u.isPremium ? t.ops.revokePremium : t.ops.giftPremium}
                </button>
                <select
                  aria-label={t.ops.role}
                  value={u.role}
                  className="h-11 rounded-md bg-surface px-3 text-sm text-fg"
                  onChange={async (e) => {
                    const role = e.target.value as OpsUserRow["role"];
                    const res = await updateOpsUser({ data: { userId: u.userId, role } });
                    if (res.ok) {
                      setUsers((prev) =>
                        prev ? prev.map((x) => (x.userId === u.userId ? { ...x, role } : x)) : prev,
                      );
                    } else {
                      setMsg(res.message ?? t.ops.failed);
                    }
                  }}
                >
                  <option value="user">{t.ops.roleLabels.user}</option>
                  <option value="creator">{t.ops.roleLabels.creator}</option>
                  <option value="moderator">{t.ops.roleLabels.moderator}</option>
                  <option value="admin">{t.ops.roleLabels.admin}</option>
                </select>
                <select
                  aria-label={t.ops.accountStatus}
                  value={u.status}
                  className="h-11 rounded-md bg-surface px-3 text-sm text-fg"
                  onChange={async (e) => {
                    const status = e.target.value as "active" | "suspended";
                    await updateOpsUser({ data: { userId: u.userId, status } });
                    setUsers((prev) =>
                      prev ? prev.map((x) => (x.userId === u.userId ? { ...x, status } : x)) : prev,
                    );
                  }}
                >
                  <option value="active">active</option>
                  <option value="suspended">suspended</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
