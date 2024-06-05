const CACHE_NAME = 'my-pwa-cache-v1';
const assetsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.css',
  '/index.css',
  '/rest.css',
  '/manifest.json',
  '/assets/invoicinator192.png',
  '/assets/invoicinator512.png',
  '/assets/comp.jpg',
  '/assets/download.svg',
  '/assets/github.svg',
  '/assets/longScreenshot.png',
  '/assets/noLogo.svg',
  '/assets/screenshot1.png',
  '/pages/createinvoices.css',
  '/pages/createinvoices.jsx',
  '/pages/dashboard.css',
  '/pages/dashboard.jsx',
  '/pages/error.jsx',
  '/pages/home.css',
  '/pages/home.jsx',
  '/pages/profile.css',
  '/pages/profile.jsx',
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
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        console.log('Cache hit for', event.request.url);
        return response;
      }
      console.log('Cache miss for', event.request.url);
      return fetch(event.request);
    }).catch(error => {
      console.error('Cache match error:', error);
      // If an error occurs while fetching from cache, try fetching from network
      return fetch(event.request);
    })
  );
});
