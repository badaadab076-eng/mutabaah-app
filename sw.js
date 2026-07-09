// Service Worker — Mutaba'ah Yaumiyah
// Strategi: app shell di-cache saat install, lalu "stale-while-revalidate" —
// selalu tampilkan versi cache dulu (cepat & tetap jalan offline), sambil
// diam-diam mengambil versi terbaru dari jaringan untuk kunjungan berikutnya.
// Kalau tidak ada jaringan sama sekali, cache jadi andalan (offline-first).

const CACHE_VERSION = "mutabaah-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Jangan campur tangan permintaan ke server Google Apps Script (data kelompok) —
  // itu harus selalu langsung ke jaringan, ditangani oleh logic offline-queue di app,
  // bukan oleh cache service worker (data bisa jadi basi/salah kalau di-cache di sini).
  if (req.method !== "GET" || req.url.includes("script.google.com")) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(req);
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      // Tampilkan cache dulu kalau ada (instan), fallback ke jaringan kalau belum ada.
      return cached || (await networkFetch) || new Response("Offline", { status: 503 });
    })
  );
});
