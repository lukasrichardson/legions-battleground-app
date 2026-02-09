// Service Worker for Card Image Caching
// Provides cache-first strategy with intelligent preloading

const CACHE_NAME = 'legions-card-images-v1';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CONCURRENT_REQUESTS = 5;
const BATCH_SIZE = 20;
const STORAGE_QUOTA_THRESHOLD = 0.8; // Use max 80% of available storage

// Track concurrent requests to avoid overwhelming network
let activeRequests = 0;
const requestQueue = [];

// Performance tracking
let cacheHits = 0;
let cacheMisses = 0;
let totalRequests = 0;
const loadMetrics = [];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle card image requests from legionstoolbox.com
  if (url.hostname === 'legionstoolbox.com' && 
      (url.pathname.includes('.png') || url.pathname.includes('.jpg') || url.pathname.includes('.jpeg'))) {
    
    event.respondWith(handleImageRequest(request));
  }
});

// Cache-first strategy with freshness checks
async function handleImageRequest(request) {
  const startTime = Date.now();
  totalRequests++;
  
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cache is still fresh
      const cacheTime = cachedResponse.headers.get('sw-cache-time');
      if (cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION) {
        cacheHits++;
        recordLoadMetric(request.url, startTime, true);
        return cachedResponse;
      }
    }

    // Fetch from network with throttling
    cacheMisses++;
    const networkResponse = await fetchWithThrottling(request);
    recordLoadMetric(request.url, startTime, false);
    
    if (networkResponse && networkResponse.ok) {
      // Cache the response with timestamp
      const responseClone = networkResponse.clone();
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cache-time': Date.now().toString()
        }
      });
      
      // Check storage quota before caching
      if (await hasStorageSpace()) {
        await cache.put(request, responseWithTimestamp);
      } else {
        console.warn('[SW] Storage quota exceeded, cleaning cache');
        await cleanOldCache();
        // Try caching again after cleanup
        if (await hasStorageSpace()) {
          await cache.put(request, responseWithTimestamp);
        }
      }
    }
    
    return networkResponse || cachedResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    // Return cached version if available
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(request);
  }
}

// Throttled fetch to prevent network overload
async function fetchWithThrottling(request) {
  return new Promise((resolve, reject) => {
    const executeRequest = async () => {
      if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
        requestQueue.push(() => executeRequest());
        return;
      }
      
      activeRequests++;
      try {
        const response = await fetch(request);
        resolve(response);
      } catch (error) {
        reject(error);
      } finally {
        activeRequests--;
        // Process next request in queue
        if (requestQueue.length > 0) {
          const nextRequest = requestQueue.shift();
          setTimeout(nextRequest, 10); // Small delay between requests
        }
      }
    };
    
    executeRequest();
  });
}

// Check available storage space
async function hasStorageSpace() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usageRatio = estimate.usage / estimate.quota;
      return usageRatio < STORAGE_QUOTA_THRESHOLD;
    } catch (error) {
      console.warn('[SW] Could not estimate storage:', error);
      return true; // Assume we have space if we can't check
    }
  }
  return true; // Fallback for browsers without storage estimation
}

// Clean old cached items (LRU-style)
async function cleanOldCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    // Sort by cache time (oldest first)
    const requestsWithTime = await Promise.all(
      requests.map(async (request) => {
        const response = await cache.match(request);
        const cacheTime = response ? response.headers.get('sw-cache-time') : 0;
        return { request, cacheTime: parseInt(cacheTime) || 0 };
      })
    );
    
    requestsWithTime.sort((a, b) => a.cacheTime - b.cacheTime);
    
    // Delete oldest 25% of cached items
    const itemsToDelete = Math.floor(requestsWithTime.length * 0.25);
    for (let i = 0; i < itemsToDelete; i++) {
      await cache.delete(requestsWithTime[i].request);
    }
    
    console.log(`[SW] Cleaned ${itemsToDelete} old cache entries`);
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}

// Handle preloading requests from main thread
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'PRELOAD_IMAGES') {
    const { imageUrls, priority = 'normal' } = event.data;
    console.log(`[SW] Preloading ${imageUrls.length} images with ${priority} priority`);
    
    await preloadImages(imageUrls, priority);
  }
});

// Preload images in batches
async function preloadImages(urls, priority) {
  const cache = await caches.open(CACHE_NAME);
  
  // Filter out already cached images
  const uncachedUrls = [];
  for (const url of urls) {
    const cached = await cache.match(url);
    if (!cached) {
      uncachedUrls.push(url);
    }
  }
  
  if (uncachedUrls.length === 0) {
    console.log('[SW] All images already cached');
    return;
  }
  
  console.log(`[SW] Preloading ${uncachedUrls.length} uncached images`);
  
  // Process in batches to avoid overwhelming the network
  const batchSize = priority === 'high' ? BATCH_SIZE : Math.floor(BATCH_SIZE / 2);
  
  for (let i = 0; i < uncachedUrls.length; i += batchSize) {
    const batch = uncachedUrls.slice(i, i + batchSize);
    
    // Check storage space before each batch
    if (!(await hasStorageSpace())) {
      console.warn('[SW] Storage full, stopping preload');
      await cleanOldCache();
      if (!(await hasStorageSpace())) {
        break;
      }
    }
    
    // Process batch
    const batchPromises = batch.map(url => 
      fetchWithThrottling(new Request(url))
        .then(response => {
          if (response && response.ok) {
            const responseWithTimestamp = new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: {
                ...Object.fromEntries(response.headers.entries()),
                'sw-cache-time': Date.now().toString()
              }
            });
            return cache.put(url, responseWithTimestamp);
          }
        })
        .catch(error => {
          console.warn(`[SW] Failed to preload: ${url}`, error);
        })
    );
    
    await Promise.allSettled(batchPromises);
    
    // Small delay between batches for lower priority
    if (priority !== 'high' && i + batchSize < uncachedUrls.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`[SW] Preload batch complete`);
}

// Record performance metrics
function recordLoadMetric(url, startTime, fromCache) {
  const loadTime = Date.now() - startTime;
  const metric = { url, loadTime, fromCache, timestamp: Date.now() };
  
  loadMetrics.push(metric);
  // Keep only last 100 metrics to manage memory
  if (loadMetrics.length > 100) {
    loadMetrics.shift();
  }
  
  // Broadcast to clients
  broadcastToClients({
    type: 'IMAGE_LOAD_METRIC',
    metric
  });
}

// Broadcast message to all clients
function broadcastToClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

// Handle analytics requests
self.addEventListener('message', async (event) => {
  const { data } = event;
  
  if (data.type === 'GET_CACHE_STATS') {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    const stats = {
      totalRequests,
      cacheHits,
      cacheMisses,
      cacheSize: keys.length,
      hitRate: totalRequests > 0 ? cacheHits / totalRequests : 0,
      avgLoadTime: loadMetrics.length > 0 ? 
        loadMetrics.reduce((sum, m) => sum + m.loadTime, 0) / loadMetrics.length : 0,
      networkSavings: Math.round((cacheHits / Math.max(totalRequests, 1)) * 100)
    };
    
    event.ports[0]?.postMessage({
      type: 'CACHE_STATS_RESPONSE',
      messageId: data.messageId,
      stats
    });
  } else if (data.type === 'PRELOAD_IMAGES') {
    const { imageUrls, priority = 'normal' } = data;
    console.log(`[SW] Preloading ${imageUrls.length} images with ${priority} priority`);
    
    await preloadImages(imageUrls, priority);
  }
});