// sw.js
const CACHE_NAME = 'planifyx-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  console.log('Service Worker instalado 🛠️');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker activo 🚀');
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
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { event: eventData } = event.data;
    const now = Date.now();
    const delay = eventData.timestamp - now;
    
    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification('PlanifyX Recordatorio', {
          body: `Evento: ${eventData.title}\nHora: ${eventData.time}`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `event-${eventData.id}`
        });
      }, delay);
    }
  }
});

self.addEventListener('sync', event => {
  if (event.tag === 'check-events') {
    event.waitUntil(checkScheduledEvents());
  }
});

function checkScheduledEvents() {
  // Aquí iría la lógica para verificar eventos programados
  // y mostrar notificaciones si es necesario
  console.log('Verificando eventos programados...');
  return Promise.resolve();
}

self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-events') {
    event.waitUntil(checkScheduledEvents());
  }
});