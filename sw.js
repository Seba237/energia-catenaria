// Incrementar este número cada vez que se actualiza la app
const VERSION = '1.1';
const CACHE = 'energia-catenaria-' + VERSION;

self.addEventListener('install', e => {
  // Activar inmediatamente sin esperar
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Borrar todos los cachés viejos
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('Borrando caché viejo:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Para el HTML principal: siempre buscar en red primero
  if (e.request.url.includes('catenaria-v1.html')) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Para el resto: red primero, caché como respaldo
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// Notificar a todos los clientes cuando hay actualización
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
