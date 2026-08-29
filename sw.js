// ── VERSIÓN — incrementar con cada deploy ──────────────────
const VERSION = '5.74';
const CACHE = 'catenaria-' + VERSION;

// ── INSTALL ─────────────────────────────────────────────────
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

// ── ACTIVATE: borrar cachés viejos ───────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── FETCH: solo cachear GET, nunca POST ──────────────────────
self.addEventListener('fetch', function(e) {
  // Ignorar requests que no son GET
  if (e.request.method !== 'GET') return;

  // Para el HTML principal: siempre red primero
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

  // Para el resto de GET: red primero, caché como respaldo
  e.respondWith(
    fetch(e.request).then(function(response) {
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
      }
      return response;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});

// ── MENSAJE ──────────────────────────────────────────────────
self.addEventListener('message', function(e) {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
