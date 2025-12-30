// Enhanced Service Worker for Offline-First PWA
// Caches static assets and provides offline fallback

const CACHE_NAME = 'ogrogoti-v5';
const STATIC_CACHE = 'ogrogoti-static-v5';
const DYNAMIC_CACHE = 'ogrogoti-dynamic-v5';

// Static assets to cache on install (only essential ones)
const urlsToCache = [
    '/',
    '/index.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(async (cache) => {
                console.log('[SW] Caching static assets');
                // Cache each URL individually, ignore failures
                for (const url of urlsToCache) {
                    try {
                        await cache.add(url);
                    } catch (error) {
                        console.warn('[SW] Failed to cache:', url, error);
                        // Continue with other URLs
                    }
                }
            })
            .then(() => {
                // Force waiting service worker to become active
                return self.skipWaiting();
            })
            .catch((error) => {
                console.warn('[SW] Install failed:', error);
                // Still skip waiting even on error
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip Firebase API requests (let them go through normally)
    if (url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis') ||
        url.hostname.includes('firestore')) {
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
                            .catch(() => {
                                // Network failed, but we served from cache
                            })
                    );
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(request)
                    .then((networkResponse) => {
                        // Don't cache if not a valid response
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        // Only cache same-origin responses
                        if (networkResponse.type === 'basic' || networkResponse.type === 'cors') {
                            const responseToCache = networkResponse.clone();
                            caches.open(DYNAMIC_CACHE)
                                .then((cache) => cache.put(request, responseToCache))
                                .catch(() => { });
                        }

                        return networkResponse;
                    })
                    .catch(() => {
                        // Network failed and not in cache
                        // Return fallback for HTML pages
                        if (request.headers.get('accept')?.includes('text/html')) {
                            return caches.match('/index.html');
                        }

                        // For other resources, return a generic offline response
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
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
