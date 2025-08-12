
const CACHE_NAME = 'library-attendance-v3';
const STATIC_CACHE = 'static-v3';
const DYNAMIC_CACHE = 'dynamic-v3';

// Essential static files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

// Install event - cache essential static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache the main app shell
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Opened main cache');
        return cache.add('/');
      })
    ]).catch(error => {
      console.error('Failed to cache files during install:', error);
    })
  );
  self.skipWaiting();
});

// Fetch event - comprehensive caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Supabase API requests - let them fail gracefully
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Handle different types of requests
  if (request.mode === 'navigate') {
    // For navigation requests, use cache-first strategy with fallback to app shell
    event.respondWith(handleNavigationRequest(request));
  } else if (url.pathname.startsWith('/assets/')) {
    // For assets, use cache-first strategy
    event.respondWith(handleAssetRequest(request));
  } else {
    // For other requests, use network-first strategy
    event.respondWith(handleOtherRequest(request));
  }
});

// Handle navigation requests (page loads)
async function handleNavigationRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful navigation responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('Navigation request failed, serving app shell');
  }

  // Fallback to app shell (index.html)
  const appShell = await caches.match('/index.html');
  return appShell || new Response('Offline', { status: 503 });
}

// Handle asset requests (JS, CSS, images)
async function handleAssetRequest(request) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network and cache on success
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return cached version if available, otherwise let it fail
    return caches.match(request) || new Response('Asset not available offline', { status: 503 });
  }
}

// Handle other requests
async function handleOtherRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Content not available offline', { status: 503 });
  }
}

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});
