import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSessionUser } from "@/lib/auth/verify.server";
import { getSql } from "@/lib/db";
import type { OpsSession } from "@/lib/types";

class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

export const secureClaimOpsAccess = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<OpsSession> => {
    const expected = process.env.OPS_ADMIN_EMAIL?.trim().toLowerCase();
    if (!expected) throw new ForbiddenError();

    const sessionUser = await getSessionUser();
    const email = sessionUser?.email?.trim().toLowerCase();
    if (!email || email !== expected || sessionUser?.id !== context.userId) {
      throw new ForbiddenError();
    }

    const sql = await getSql();
    await sql.query(
      `insert into profiles (user_id) values ($1) on conflict (user_id) do nothing`,
      [context.userId],
    );
    const existing = await sql.query<{ n: number }>(
      `select count(*)::int as n from profiles where role in ('admin', 'moderator')`,
    );
    if ((existing[0]?.n ?? 0) > 0) throw new ForbiddenError();

    await sql.query(
      `update profiles set role = 'admin', status = 'active', updated_at = now() where user_id = $1`,
      [context.userId],
    );

    return {
      role: "admin",
      canClaim: false,
      canModerate: true,
      canAdmin: true,
    };
  });
