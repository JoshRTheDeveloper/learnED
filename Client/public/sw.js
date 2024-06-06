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

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
