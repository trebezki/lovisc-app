const CACHE = 'ld-v4';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Samo GET requeste
  if (e.request.method !== 'GET') return;
  
  const url = e.request.url;
  
  // Tile-i - cache first, potem network
  if (url.includes('maptiler.com')) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const resp = await fetch(e.request);
          if (resp && resp.ok) cache.put(e.request, resp.clone());
          return resp;
        } catch {
          return cached || new Response('', {status: 503});
        }
      })
    );
    return;
  }

  // App datoteke - network first, cache fallback
  if (url.includes('lovisc-app') || url.includes('leaflet') || url.includes('googleapis') || url.includes('gstatic')) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          if (resp && resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
});
