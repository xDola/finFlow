
const CACHE_NAME = 'finflow-cache-v1';
const OFFLINE_URL = 'index.html';
const ASSETS = [
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  // navigation requests -> network-first, fallback to cache
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(request).then(response => { caches.open(CACHE_NAME).then(cache=>cache.put(request, response.clone())); return response; }).catch(()=>caches.match(OFFLINE_URL))
    );
    return;
  }

  // for other requests -> cache-first
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => { 
      if (request.url.startsWith(self.location.origin)) { caches.open(CACHE_NAME).then(cache=>cache.put(request, response.clone())); }
      return response;
    }).catch(()=>{}))
  );
});
