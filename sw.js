const CACHE_NAME = 'ttm-v3';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/script.js',
  '/style.css',
  '/three.min.js',
  '/habits.js',
  '/focus.js',
  '/loot.js',
  '/quests.js',
  '/skills.js',
  '/stats.js',
  '/mood.js',
  '/manifest.json',
  '/icon.svg',
];

// Assets that rarely change — serve cache-first
const STATIC_EXTS = ['.woff', '.woff2', '.png', '.jpg', '.jpeg', '.svg', '.ico'];

function isStatic(url) {
  return STATIC_EXTS.some(ext => url.pathname.endsWith(ext));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch(() => console.warn('[SW] Failed to cache:', url))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Don't intercept API calls — always go to network
  if (url.pathname.startsWith('/api/')) return;

  // Static assets: cache-first
  if (isStatic(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // App shell (HTML, JS, CSS): network-first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((cached) =>
          cached || (event.request.mode === 'navigate'
            ? caches.match('/index.html')
            : new Response('Offline', { status: 503 }))
        )
      )
  );
});
