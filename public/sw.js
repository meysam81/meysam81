var CACHE_NAME = 'cv-app-v1';
var urlsToCache = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/App.vue',
  '/src/style.css',
  '/src/data/candidate.js'
];

self.addEventListener('install', function handleInstall(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function openCache(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function handleFetch(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function checkCacheResponse(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
