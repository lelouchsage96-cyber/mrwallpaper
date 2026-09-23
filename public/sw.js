const VERSION = "mrwallpapers-v27";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const APP_SHELL = ["/app", "/manifest.webmanifest?v=20", "/mrwallpaper-favicon-v20.ico", "/apple-touch-icon.png?v=20", "/mrwallpaper-icon-192-v20.png", "/mrwallpaper-icon-512-v20.png"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.add(new Request("/app", { cache: "reload" }));
    await Promise.allSettled(APP_SHELL.filter((url) => url !== "/app").map((url) => cache.add(new Request(url, { cache: "reload" }))));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("mrwallpapers-") && !key.startsWith(VERSION)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    try {
      data = { body: event.data ? event.data.text() : "" };
    } catch {
      data = {};
    }
  }

  const title = data.title || "Mr Wallpapers";
  const rawUrl = typeof data.url === "string" ? data.url : "/app";
  let targetUrl = "/app";
  try {
    const resolved = new URL(rawUrl, self.location.origin);
    if (resolved.origin === self.location.origin) {
      targetUrl = resolved.pathname + resolved.search + resolved.hash;
    }
  } catch {}

  const options = {
    body: data.body || "A new wallpaper is ready.",
    icon: "/mrwallpaper-icon-192-v20.png",
    badge: "/mrwallpaper-icon-192-v20.png",
    tag: data.tag || "mrwallpapers",
    renotify: false,
    data: { url: targetUrl },
  };

  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    try {
      if (self.navigator && typeof self.navigator.setAppBadge === "function") {
        await self.navigator.setAppBadge(1);
      }
    } catch {}
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  try {
    if (self.navigator && typeof self.navigator.clearAppBadge === "function") {
      void self.navigator.clearAppBadge();
    }
  } catch {}
  const rawUrl = event.notification?.data?.url || "/app";
  let target = new URL("/app", self.location.origin).href;
  try {
    const resolved = new URL(rawUrl, self.location.origin);
    if (resolved.origin === self.location.origin) target = resolved.href;
  } catch {}

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (!("focus" in client)) continue;
      try {
        if ("navigate" in client) await client.navigate(target);
      } catch {}
      await client.focus();
      return;
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await caches.match(request)) || (request.mode === "navigate" ? await caches.match("/app") : undefined) || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    fetch(request).then(async (response) => {
      if (!response || !response.ok) return;
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }).catch(() => undefined);
    return cached;
  }
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/") || url.pathname.startsWith("/media/")) return;
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.pathname.startsWith("/assets/") || url.pathname === "/favicon.ico" || url.pathname === "/mrwallpaper-favicon-v20.ico" || url.pathname === "/apple-touch-icon.png" || url.pathname === "/icon-192.png" || url.pathname === "/icon-512.png" || url.pathname === "/mrwallpaper-icon-192-v20.png" || url.pathname === "/mrwallpaper-icon-512-v20.png" || url.pathname === "/manifest.webmanifest") {
    event.respondWith(cacheFirst(request));
  }
});
