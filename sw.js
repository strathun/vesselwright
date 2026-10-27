// Offline support. Network first for the game's own files (so a push shows up on next open),
// falling back to the cache when offline or slow. Fonts are cached once and reused.
// Supabase requests are never touched.
importScripts('./version.js');
const CACHE = 'vw-' + self.VW_VERSION;
const FONT_CACHE = 'vw-fonts';
const TIMEOUT_MS = 3500;

// Every file the game needs to start offline. tools/check.mjs fails if a js/ file is missing here.
const SHELL = [
  './', './index.html', './version.js', './manifest.webmanifest', './css/game.css', './vendor/supabase.min.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  './js/main.js', './js/bus.js', './js/data.js', './js/util.js', './js/state.js', './js/cloud.js',
  './js/engine/rites.js', './js/engine/discovery.js', './js/engine/growth.js',
  './js/ui/app.js', './js/ui/ui-state.js', './js/ui/tiles.js', './js/ui/toast.js', './js/ui/bench.js', './js/ui/fuse.js',
  './js/ui/codex.js', './js/ui/shop.js', './js/ui/descend.js', './js/ui/save.js',
  './js/trial/combat.js', './js/trial/hud.js', './js/trial/view.js', './js/trial/input.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('vw-') && k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)); }

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await Promise.race([fetch(req), timeout(TIMEOUT_MS)]);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') { const shell = await cache.match('./index.html'); if (shell) return shell; }
    throw err;
  }
}
async function cacheFirst(req) {
  const cache = await caches.open(FONT_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) { e.respondWith(networkFirst(req)); return; }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') { e.respondWith(cacheFirst(req)); return; }
});
