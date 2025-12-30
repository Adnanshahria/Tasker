// Enhanced Service Worker for Offline-First PWA
// Caches static assets and provides offline fallback

const CACHE_NAME = 'ogrogoti-v6';
const STATIC_CACHE = 'ogrogoti-static-v6';
const DYNAMIC_CACHE = 'ogrogoti-dynamic-v6';

// ... (keep install/activate same)

// Fetch event - Network First for HTML, Stale-While-Revalidate for others
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip Supabase API requests
    if (url.hostname.includes('supabase.co')) {
        return;
    }

    // Skip browser extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }

    // Skip WebSocket and HMR requests (dev mode)
    if (url.pathname.includes('__vite') ||
        url.pathname.includes('@vite') ||
        url.pathname.includes('@react-refresh') ||
        url.protocol === 'ws:' ||
        url.protocol === 'wss:') {
        return;
    }

    // Skip external CDN requests
    if (url.hostname !== self.location.hostname) {
        return;
    }

    // Strategy 1: Network First for HTML (Navigation)
    // Ensures we always get the latest index.html with latest JS hashes
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    // Cache the new HTML
                    const responseToCache = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then((cache) => cache.put(request, responseToCache));
                    return networkResponse;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(request)
                        .then((cachedResponse) => {
                            if (cachedResponse) return cachedResponse;
                            return caches.match('/index.html');
                        });
                })
        );
        return;
    }

    // Strategy 2: Stale-While-Revalidate for Assets (JS, CSS, Images)
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached response and update cache in background
                    event.waitUntil(
                        fetch(request)
                            .then((networkResponse) => {
                                if (networkResponse && networkResponse.ok) {
                                    caches.open(DYNAMIC_CACHE)
                                        .then((cache) => cache.put(request, networkResponse));
                                }
                            })
                            .catch(() => { })
                    );
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(request)
                    .then((networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        if (networkResponse.type === 'basic' || networkResponse.type === 'cors') {
                            const responseToCache = networkResponse.clone();
                            caches.open(DYNAMIC_CACHE)
                                .then((cache) => cache.put(request, responseToCache))
                                .catch(() => { });
                        }

                        return networkResponse;
                    })
                    .catch(() => {
                        // Return generic offline response if needed
                        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
                    });
            })
    );
});

// Handle messages from main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
        });
    }
});

// Background sync for pending operations
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);

    if (event.tag === 'sync-pending-operations') {
        event.waitUntil(
            // Notify all clients to process pending operations
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'SYNC_PENDING',
                    });
                });
            })
        );
    }
});

console.log('[SW] Service worker loaded');
