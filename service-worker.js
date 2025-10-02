/* Minimal service worker for offline support and SPA fallback */
const STATIC_CACHE = 'we-static-v2';
const DYNAMIC_CACHE = 'we-dyn-v2';
const APP_SHELL = [
  '/World-Engine/',
  '/World-Engine/index.html',
  '/World-Engine/manifest.json',
  '/World-Engine/favicon.ico',
  '/World-Engine/logo192.png',
  '/World-Engine/logo512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => ![STATIC_CACHE, DYNAMIC_CACHE].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Helper: cache-first for static; network-first for data (worlds.json)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // SPA navigation fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/World-Engine/index.html'))
    );
    return;
  }

  // Network-first for worlds.json
  if (url.pathname.endsWith('/worlds.json') || url.pathname === '/worlds.json') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(DYNAMIC_CACHE).then((c) => c.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for other GET requests (static assets)
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const resClone = res.clone();
      caches.open(DYNAMIC_CACHE).then((c) => c.put(req, resClone));
      return res;
    }))
  );
});

// Optional: allow immediate activation when updated
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
