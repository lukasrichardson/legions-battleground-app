// Service Worker Performance Monitor
// Provides simple cache analytics

interface ImageLoadMetric {
  url: string;
  loadTime: number;
  fromCache: boolean;
  timestamp: number;
}

// Detect if image was served from cache using Performance API
function detectCacheHit(imageUrl: string): boolean {
  try {
    const entries = performance.getEntriesByName(imageUrl);
    const entry = entries[entries.length - 1]; // Most recent entry
    // transferSize = 0 typically means served from cache
    return entry && (entry as PerformanceResourceTiming).transferSize === 0;
  } catch {
    return false; // Fallback if Performance API not available
  }
}

class ServiceWorkerMonitor {
  private static instance: ServiceWorkerMonitor;
  private loadMetrics: ImageLoadMetric[] = [];

  static getInstance(): ServiceWorkerMonitor {
    if (!ServiceWorkerMonitor.instance) {
      ServiceWorkerMonitor.instance = new ServiceWorkerMonitor();
    }
    return ServiceWorkerMonitor.instance;
  }

  // Track image load performance
  trackImageLoad(url: string, startTime: number, fromCache: boolean) {
    const loadTime = Date.now() - startTime;
    
    const metric: ImageLoadMetric = {
      url,
      loadTime,
      fromCache,
      timestamp: Date.now()
    };

    this.loadMetrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.loadMetrics.length > 1000) {
      this.loadMetrics = this.loadMetrics.slice(-500);
    }
  }

  // Get recent performance metrics
  getRecentMetrics(): ImageLoadMetric[] {
    return this.loadMetrics.slice(-20); // Last 20 loads
  }

  // Calculate performance summary
  getPerformanceSummary() {
    if (this.loadMetrics.length === 0) {
      return {
        avgLoadTime: 0,
        cacheHitRate: 0,
        totalRequests: 0,
        networkSavings: '0 KB'
      };
    }

    const totalRequests = this.loadMetrics.length;
    const cacheHits = this.loadMetrics.filter(m => m.fromCache).length;
    const avgLoadTime = this.loadMetrics.reduce((sum, m) => sum + m.loadTime, 0) / totalRequests;
    const cacheHitRate = (cacheHits / totalRequests) * 100;

    return {
      avgLoadTime: Math.round(avgLoadTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      totalRequests,
      networkSavings: `${Math.round(cacheHits * 0.1)} KB`
    };
  }

  // Clear metrics
  clearMetrics() {
    this.loadMetrics = [];
  }

  // Check if service worker is active
  isActive(): boolean {
    return 'serviceWorker' in navigator;
  }

  // Detect cache hit using Performance API
  detectCacheHit(imageUrl: string): boolean {
    return detectCacheHit(imageUrl);
  }
}

export const serviceWorkerMonitor = ServiceWorkerMonitor.getInstance();
export type { ImageLoadMetric };