const CACHE = 'programme-sport-v4';

function precacheUrls() {
  const root = new URL('.', self.location).href;
  return [
    new URL('index.html', root).href,
    new URL('manifest.webmanifest', root).href,
    new URL('icons/icon-192.png', root).href,
    new URL('icons/icon-512.png', root).href,
    new URL('icons/icon-180.png', root).href,
    new URL('icons/icon-48.png', root).href,
    new URL('icons/icon-32.png', root).href,
    new URL('icons/icon-16.png', root).href,
  ];
}

function indexUrl() {
  return new URL('index.html', self.location).href;
}

function isMainDocument(request) {
  if (request.mode === 'navigate') return true;
  const u = new URL(request.url);
  return u.pathname.endsWith('index.html');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(precacheUrls()))
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const idx = indexUrl();

  if (isMainDocument(request)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(idx, copy));
          }
          return res;
        })
        .catch(() => caches.match(idx))
    );
    return;
  }

  event.respondWith(
    (async () => {
      const fromCache = await caches.match(request, { ignoreSearch: true });
      if (fromCache) return fromCache;
      try {
        return await fetch(request);
      } catch {
        const fallback = await caches.match(idx);
        if (fallback) return fallback;
        return new Response('Hors ligne', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    })()
  );
});
