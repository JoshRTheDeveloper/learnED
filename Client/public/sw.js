const CACHE_NAME = 'my-pwa-cache-v1';
const assetsToCache = [
  '/',
  '/index.html',
  '/assets/invoicinator192.png',
  '/assets/invoicinator512.png',
  '/assets/comp.jpg',
  '/assets/download.svg',
  '/assets/github.svg',
  '/assets/longScreenshot.png',
  '/assets/noLogo.svg',
  '/assets/screenshot1.png',
  '/assets/index-819f58vf.css',
  '/assets/index-c4501783.js',
  '/assets/vendor-9c95d55e.js',
];

self.addEventListener('install', event => {
  console.info("Service Worker: Installed");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.info("Caching assets");
      return cache.addAll(assetsToCache);
    }).catch(error => {
      console.error("Error caching assets during install:", error);
    })
  );
});

self.addEventListener('activate', event => {
  console.info("Service Worker: Activated");
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.info(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).catch(error => {
      console.error("Error during activation:", error);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        console.info(`Serving from cache: ${event.request.url}`);
        return response;
      }
      console.info(`Fetching from network: ${event.request.url}`);
      return fetch(event.request).then(fetchResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      }).catch(error => {
        console.error("Fetch error:", error);
        // Optionally return a fallback offline page here
      });
    }).catch(error => {
      console.error("Cache match error:", error);
    })
  );
});
