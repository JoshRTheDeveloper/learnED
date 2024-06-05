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
      return cache.addAll(assetsToCache);
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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  console.log('Fetch event triggered:', event.request.url);
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        console.log('Cache match found for:', event.request.url);
        return response;
      }
      console.log('No cache match found. Fetching from network:', event.request.url);
      return fetch(event.request).then(networkResponse => {
        // Add fetched assets to the cache
        if (networkResponse && networkResponse.status === 200) {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
        }
        return networkResponse;
      }).catch(error => {
        console.error('Fetch error:', error);
        // You can handle fetch errors here, such as displaying a custom offline page
      });
    }).catch(cacheError => {
      console.error('Cache match error:', cacheError);
      // You can handle cache match errors here
    })
  );
});
