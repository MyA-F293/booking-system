// Service Worker for EYSA Language Center PWA
const CACHE_NAME = 'eysa-v1.0.5'; // Updated version for new PWA icons
const RUNTIME_CACHE = 'eysa-runtime-v1.0.5';
const IMAGE_CACHE = 'eysa-images-v1.0.5';

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/eysa-logo.svg',
    '/icon-192.png',
    '/icon-512.png',
    '/icon-maskable-192.png',
    '/icon-maskable-512.png',
    '/apple-touch-icon.png',
    '/booking-illustration.png',
    '/manifest.json'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker v1.0.4...');
    // Force immediate activation
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker v1.0.4...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== IMAGE_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Skip Supabase API calls (always fetch fresh)
    if (url.hostname.includes('supabase')) {
        return;
    }

    // Stale-while-revalidate for images (fast load + background update)
    if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
        event.respondWith(
            caches.open(IMAGE_CACHE).then(async (cache) => {
                const cachedResponse = await cache.match(request);

                // Fetch in background and update cache
                const fetchPromise = fetch(request).then((response) => {
                    if (response.ok) {
                        cache.put(request, response.clone());
                    }
                    return response;
                }).catch(() => cachedResponse); // Fallback to cache on error

                // Return cached immediately if available, otherwise wait for fetch
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // Network-first strategy for API calls
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache successful responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request);
                })
        );
        return;
    }

    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[SW] Serving from cache:', request.url);
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clone and cache the response
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });

                        return response;
                    })
                    .catch((error) => {
                        console.error('[SW] Fetch failed:', error);

                        // Return offline page for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }

                        throw error;
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-bookings') {
        event.waitUntil(syncBookings());
    }

    if (event.tag === 'sync-attendance') {
        event.waitUntil(syncAttendance());
    }
});

// Push notification handler
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    const data = event.data ? event.data.json() : {};
    const title = data.title || 'EYSA Language Center';
    const options = {
        body: data.body || 'You have a new notification',
        icon: '/eysa-logo.svg',
        badge: '/eysa-logo.svg',
        vibrate: [200, 100, 200],
        data: data.url || '/',
        actions: [
            {
                action: 'open',
                title: 'Open App'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);

    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data || '/')
        );
    }
});

// Helper functions for background sync
async function syncBookings() {
    try {
        // Get pending bookings from IndexedDB
        const pendingBookings = await getPendingBookings();

        if (pendingBookings.length === 0) {
            return;
        }

        // Sync each booking
        for (const booking of pendingBookings) {
            try {
                await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(booking)
                });

                // Remove from pending after successful sync
                await removePendingBooking(booking.id);
            } catch (error) {
                console.error('[SW] Failed to sync booking:', error);
            }
        }
    } catch (error) {
        console.error('[SW] Sync bookings failed:', error);
    }
}

async function syncAttendance() {
    try {
        // Get pending attendance from IndexedDB
        const pendingAttendance = await getPendingAttendance();

        if (pendingAttendance.length === 0) {
            return;
        }

        // Sync each attendance record
        for (const record of pendingAttendance) {
            try {
                await fetch('/api/attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(record)
                });

                // Remove from pending after successful sync
                await removePendingAttendance(record.id);
            } catch (error) {
                console.error('[SW] Failed to sync attendance:', error);
            }
        }
    } catch (error) {
        console.error('[SW] Sync attendance failed:', error);
    }
}

// IndexedDB helpers (placeholder - implement as needed)
async function getPendingBookings() {
    // TODO: Implement IndexedDB query
    return [];
}

async function removePendingBooking(id) {
    // TODO: Implement IndexedDB delete
}

async function getPendingAttendance() {
    // TODO: Implement IndexedDB query
    return [];
}

async function removePendingAttendance(id) {
    // TODO: Implement IndexedDB delete
}

console.log('[SW] Service Worker loaded');
