const CACHE_NAME = 'tkh-bible-v9.5';
const FILES = ["/", "/index.html", "/kjv.json", "/manifest.json", "/icon-192.png", "/icon-512.png"];
const ASSETS = [
  './',
  './index.html',
  './crossrefs.json',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/lucide@0.293.0/dist/umd/lucide.min.js'
];

// Install Service Worker
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Service Worker & Clean Old Caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch Assets from Cache first, fallback to Network
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
