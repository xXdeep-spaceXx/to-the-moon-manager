const CACHE_NAME = 'ttm-v1';

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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache each asset individually so one 404 doesn't fail everything
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            console.warn('[SW] Failed to cache:', url);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache successful responses for same-origin requests
        if (
          networkResponse.ok &&
          event.request.url.startsWith(self.location.origin)
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If both cache and network fail for a navigation request, return index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
