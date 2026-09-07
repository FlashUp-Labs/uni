// ============================================================
// FLASH LAB UNI - SERVICE WORKER
// Per PWA: cache e funzionamento offline
// ============================================================

const CACHE_NAME = 'flashlab-uni-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// ============ INSTALLAZIONE ============
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Pre-cache asset...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// ============ ATTIVAZIONE ============
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Elimino cache vecchia:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ============ FETCH (Offline Strategy) ============
self.addEventListener('fetch', (event) => {
    // Ignora richieste non GET
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Cache first - restituisci subito se in cache
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Network fallback
                return fetch(event.request)
                    .then((response) => {
                        // Salva in cache per futuro offline
                        if (response && response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Offline - restituisci la home se è una navigazione
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// ============ PUSH NOTIFICATIONS (opzionale) ============
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Nuova notifica',
        icon: '/icon-192.png',
        badge: '/icon-192.png'
    };
    
    event.waitUntil(
        self.registration.showNotification('Flash Lab Uni', options)
    );
});
