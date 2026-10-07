const CACHE_NAME = 'allset-pos-cache-v5';
const ASSETS_TO_CACHE = [
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass cache completely for local print services, external APIs, and dev tools
  if (
    url.origin !== self.location.origin ||
    url.hostname === '127.0.0.1' ||
    url.hostname === 'localhost' ||
    url.port === '9100' ||
    url.port === '8181' ||
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/health') ||
    url.pathname.includes('@vite') || 
    url.pathname.includes('node_modules') || 
    url.host.includes('supabase.co')
  ) {
    return;
  }

  // 1. Navigation requests (HTML pages) -> NETWORK-FIRST
  // Ensures clients always load the latest index.html with up-to-date JS bundle hashes
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(event.request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // 2. Static Assets -> Cache-First with MIME validation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Guard: Never cache HTML when a script or stylesheet was requested
          const contentType = networkResponse.headers.get('content-type') || '';
          if (url.pathname.endsWith('.js') && !contentType.includes('javascript')) {
            return networkResponse;
          }
          if (url.pathname.endsWith('.css') && !contentType.includes('css')) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch((err) => {
          return new Response('Network error occurred', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
    })
  );
});
