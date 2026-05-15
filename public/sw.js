const CACHE_NAME = 'dm-frotas-v1.1.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo_dm.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const files = formData.getAll('files');
          
          if (files.length > 0) {
            // Store files in IndexedDB to survive the redirect
            const dbRequest = indexedDB.open('dm-frotas-share', 1);
            dbRequest.onupgradeneeded = (e) => {
              const db = e.target.result;
              if (!db.objectStoreNames.contains('files')) {
                db.createObjectStore('files', { autoIncrement: true });
              }
            };

            const db = await new Promise((resolve, reject) => {
              dbRequest.onsuccess = () => resolve(dbRequest.result);
              dbRequest.onerror = () => reject(dbRequest.error);
            });

            const transaction = db.transaction('files', 'readwrite');
            const store = transaction.objectStore('files');
            
            for (const file of files) {
              store.add({
                file,
                name: file.name,
                type: file.type,
                timestamp: Date.now()
              });
            }

            await new Promise((resolve) => {
              transaction.oncomplete = resolve;
            });
          }
        } catch (err) {
          console.error('Error handling share target:', err);
        }
        
        return Response.redirect('/?shared=true', 303);
      })()
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Only cache valid responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});
