import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/**
 * Vercel may cache public catalog HTML. Its server-rendered content must never
 * contain a user's session data, even if the visitor sends auth cookies.
 * Server-function requests use a different URL and still resolve the session.
 */
function isPublicCatalogDocumentRequest(): boolean {
  let request: Request;
  try {
    request = getRequest();
  } catch {
    return false;
  }
  if (!request || request.method !== "GET") return false;
  const pathname = new URL(request.url).pathname;
  return (
    pathname === "/" ||
    pathname === "/wallpapers" ||
    pathname === "/wallpapers/" ||
    /^\/wallpaper\/[^/]+\/?$/.test(pathname) ||
    /^\/wallpapers\/[^/]+\/?$/.test(pathname)
  );
}

/** Like authMiddleware, but signed-out callers get userId: null instead of 401. */
export const optionalAuthMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const user = isPublicCatalogDocumentRequest()
      ? null
      : await getSessionUser(context.bearerToken);
    return next({ context: { userId: user?.id ?? null } });
  });
