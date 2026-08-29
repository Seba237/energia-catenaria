// ── VERSIÓN — incrementar con cada deploy ──────────────────
const VERSION = '5.71';
const CACHE = 'catenaria-' + VERSION;

// Archivos a cachear en la instalación
const ASSETS = [
  './catenaria-v1.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// ── INSTALL: pre-cachear assets principales ─────────────────
self.addEventListener('install', function(e) {
  self.skipWaiting(); // Activar inmediatamente
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(err) {
        console.log('Cache install error:', err);
      });
    })
  );
});

// ── ACTIVATE: borrar cachés viejos ───────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) {
              console.log('Borrando caché viejo:', k);
              return caches.delete(k);
            })
      );
    }).then(function() {
      return self.clients.claim(); // Tomar control de todas las pestañas
    })
  );
});

// ── FETCH: red primero, caché como respaldo ──────────────────
self.addEventListener('fetch', function(e) {
  // Para el HTML principal: siempre intentar red primero
  if (e.request.url.includes('catenaria-v1.html')) {
    e.respondWith(
      fetch(e.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        return response;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }
  // Para el resto: red primero, caché como respaldo
  e.respondWith(
    fetch(e.request).then(function(response) {
      var clone = response.clone();
      caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
      return response;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});

// ── MENSAJE: forzar activación ───────────────────────────────
self.addEventListener('message', function(e) {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
