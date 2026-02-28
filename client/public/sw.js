const CACHE_NAME = 'sehat-saathi-v3';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-http(s) schemes (chrome-extension, etc.)
    if (!url.protocol.startsWith('http')) return;

    // Skip WebSocket upgrade requests
    if (request.headers.get('Upgrade') === 'websocket') return;

    // Skip Vite HMR and dev-server requests
    if (url.pathname.includes('/@') || url.pathname.includes('__vite') ||
        url.pathname.startsWith('/node_modules/') || url.pathname.startsWith('/src/')) {
        return;
    }

    // Skip cross-origin API requests entirely (ML service, etc.) — let browser handle CORS
    if (url.origin !== self.location.origin && !url.pathname.includes('/api/')) {
        return;
    }

    const offline503 = () => new Response(
        JSON.stringify({ error: 'Offline — no cached response available.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
    );

    if (request.url.includes('/api/')) {
        // Network-first for API calls
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response && response.ok &&
                        (request.url.includes('/chat/history') || request.url.includes('/emergency'))) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(request).then(cached => cached || offline503()))
        );
    } else {
        // Network-first for static assets, fall back to cache then 503
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response && response.ok && response.type === 'basic') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(request).then(cached => cached || offline503()))
        );
    }
});
