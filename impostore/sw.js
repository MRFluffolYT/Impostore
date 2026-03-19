const CACHE = 'impostore-v1';
const FILES = [
  './impostor.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache all files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cache what we can, ignore missing icons
      return Promise.allSettled(
        FILES.map(f => cache.add(f).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first strategy
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache new successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback — serve the main HTML
        return caches.match('./impostor.html');
      });
    })
  );
});
