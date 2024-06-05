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
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assetsToCache);
    })
  );
});

self.addEventListener('activate', event => {
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
      return fetch(event.request);
    }).catch(error => {
      console.error('Cache match error:', error);
      // You can handle errors here, such as returning a custom offline page
    })
  );
});

