// Caches the app shell so the page opens with no internet.
// Word data is handled by script.js (saved copy in localStorage).
// Bump CACHE whenever a cached front-end asset changes.
const CACHE = "sabda-ghar-v27";
const ASSETS = ["./", "index.html", "json.js", "css/style.css", "scripts/script.js", "manifest.json",
  "learn.html", "css/learn.css", "data/cards.json", "scripts/engine.js", "scripts/learn.js",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/")) return; // API goes straight to the network
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).catch(() =>
    e.request.mode === "navigate" ? caches.match("index.html") : undefined)));
});