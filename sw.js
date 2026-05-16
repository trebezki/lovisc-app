const CACHE = 'ld-v2';

const STATIC = [
  '/lovisc-app/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC).catch(()=>{})));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Map tile-i - cache ko jih enkrat naloži
  if (url.includes('maptiler.com')) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const resp = await fetch(e.request);
          if (resp.ok) cache.put(e.request, resp.clone());
          return resp;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // App datoteke - cache first
  if (url.includes('/lovisc-app/')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
    return;
  }

  // Vse ostalo - normalen fetch
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
