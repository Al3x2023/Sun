const CACHE_NAME = 'sun-pwa-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  // Estilos/recursos externos críticos
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  // Apps hijas (HTML)
  '/Postify/index.html',
  '/Daree/index.html',
  '/Taskee/index.html',
  '/Calcify/index.html',
  '/Lockify/index.html',
  '/Planify/index.html',
  '/Arcadito/index.html',
  '/Spendly/index.html',
  '/Memefy/index.html',
  '/Quizzy/index.html',
  '/Convertify/index.html',
  '/Drawify/index.html',
  '/Weathery/index.html',
  // Recursos de apps con archivos adicionales
  '/Convertify/style.css',
  '/Convertify/app.js',
  '/Drawify/style.css',
  '/Drawify/app.js',
  '/Weathery/style.css',
  '/Weathery/app.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
  // Habilitar navigation preload si está disponible
  if (self.registration.navigationPreload) {
    self.registration.navigationPreload.enable().catch(() => {});
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Navegaciones: network-first, fallback al shell
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            const clone = preloadResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
            return preloadResponse;
          }
          const networkResponse = await fetch(request);
          const netClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, netClone)).catch(() => {});
          return networkResponse;
        } catch (err) {
          const cache = await caches.open(CACHE_NAME);
          // Fallback: intenta emparejar el path con un index.html conocido
          const url = new URL(request.url);
          const path = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
          return (await cache.match(path))
              || (await cache.match('/index.html'))
              || (await cache.match('/'))
              || Response.error();
        }
      })()
    );
    return;
  }

  // Recursos: cache-first con fallback a red y cacheo dinámico
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const network = await fetch(request);
        const clone = network.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
        return network;
      } catch (err) {
        // Si es un recurso de una app, intenta fallback al HTML de esa app
        const url = new URL(request.url);
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 1) {
          const appRoot = `/${parts[0]}/index.html`;
          const byApp = await caches.match(appRoot);
          if (byApp) return byApp;
        }
        return (await caches.match('/index.html')) || Response.error();
      }
    })()
  );
});