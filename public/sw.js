/**
 * SestaKıbrıs Service Worker
 *
 * Strategy:
 * - On install: pre-cache the offline fallback page.
 * - On fetch: network-first for navigation requests.
 *   If the network fails (offline), serve /offline as the fallback.
 * - Non-navigation requests: pass through to network only (no caching).
 *
 * Registered from the root layout via a <script> tag.
 */

const CACHE_NAME = "sestakibris-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then(
        (cached) =>
          cached ??
          new Response("Çevrimdışı", {
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          }),
      ),
    ),
  );
});
