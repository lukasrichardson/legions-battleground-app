// Intelligent Image Preloader for Card Images
// Provides connection-aware preloading with throttling

interface NetworkInformation {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  saveData?: boolean;
}

interface PreloadOptions {
  priority?: 'high' | 'normal' | 'low';
  maxConcurrent?: number;
}

class ImagePreloader {
  private static instance: ImagePreloader;
  private loadedImages = new Set<string>();
  private loadingImages = new Map<string, Promise<void>>();
  private activeRequests = 0;
  private maxConcurrentRequests = 5;
  private requestQueue: Array<() => void> = [];

  static getInstance(): ImagePreloader {
    if (!ImagePreloader.instance) {
      ImagePreloader.instance = new ImagePreloader();
    }
    return ImagePreloader.instance;
  }

  private constructor() {
    this.adjustForConnection();
  }

  // Adjust behavior based on user's connection
  private adjustForConnection(): void {
    const nav = navigator as { connection?: NetworkInformation };
    const connection = nav.connection;
    
    if (connection) {
      const connectionInfo = connection as NetworkInformation;
      
      // Reduce concurrent requests on slower connections
      if (connectionInfo.effectiveType === 'slow-2g' || connectionInfo.effectiveType === '2g') {
        this.maxConcurrentRequests = 2;
      } else if (connectionInfo.effectiveType === '3g') {
        this.maxConcurrentRequests = 3;
      } else {
        this.maxConcurrentRequests = 5;
      }
      
      // Respect user's data saver preference
      if (connectionInfo.saveData) {
        this.maxConcurrentRequests = Math.min(this.maxConcurrentRequests, 2);
      }
      
      console.log(`[Preloader] Adjusted for connection: ${connectionInfo.effectiveType}, maxConcurrent: ${this.maxConcurrentRequests}`);
    }
  }

  // Preload single image
  async preloadImage(url: string): Promise<void> {
    if (!url || this.loadedImages.has(url)) {
      return Promise.resolve();
    }

    if (this.loadingImages.has(url)) {
      return this.loadingImages.get(url)!;
    }

    const promise = this.loadImageWithThrottling(url);
    this.loadingImages.set(url, promise);

    try {
      await promise;
      // Add memory management - limit to 500 cached items
      if (this.loadedImages.size > 500) {
        const firstItem = this.loadedImages.values().next().value;
        this.loadedImages.delete(firstItem);
      }
      this.loadedImages.add(url);
    } finally {
      this.loadingImages.delete(url);
    }
  }

  // Throttled image loading
  private loadImageWithThrottling(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const executeLoad = () => {
        if (this.activeRequests >= this.maxConcurrentRequests) {
          this.requestQueue.push(executeLoad);
          return;
        }

        this.activeRequests++;
        
        const img = new Image();
        
        const cleanup = () => {
          this.activeRequests--;
          // Process next request in queue
          if (this.requestQueue.length > 0) {
            const nextRequest = this.requestQueue.shift()!;
            setTimeout(nextRequest, 10); // Small delay between requests
          }
        };

        img.onload = () => {
          cleanup();
          resolve();
        };

        img.onerror = () => {
          cleanup();
          reject(new Error(`Failed to load image: ${url}`));
        };

        // Set loading attributes for better performance
        img.decoding = 'async';
        img.src = url;
      };

      executeLoad();
    });
  }

  // Preload multiple images with Service Worker integration
  async preloadImages(urls: string[], options: PreloadOptions = {}): Promise<void> {
    const { priority = 'normal' } = options;
    
    if (!urls.length) return;

    // Filter out already loaded images
    const unloadedUrls = urls.filter(url => url && !this.loadedImages.has(url));
    
    if (!unloadedUrls.length) {
      console.log(`[Preloader] All ${urls.length} images already cached`);
      return;
    }

    console.log(`[Preloader] Preloading ${unloadedUrls.length} images with ${priority} priority`);

    // Use Service Worker for background caching if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PRELOAD_IMAGES',
        imageUrls: unloadedUrls,
        priority
      });
    }

    // Also preload in main thread for immediate availability
    const batchSize = this.getBatchSize(priority);
    const batches: string[][] = [];
    
    for (let i = 0; i < unloadedUrls.length; i += batchSize) {
      batches.push(unloadedUrls.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(url => 
        this.preloadImage(url).catch(error => {
          console.warn(`[Preloader] Failed to preload: ${url}`, error);
        })
      );
      
      await Promise.allSettled(batchPromises);
      
      // Brief pause between batches for lower priority
      if (priority !== 'high' && batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, priority === 'low' ? 200 : 50));
      }
    }

    console.log(`[Preloader] Completed preloading ${unloadedUrls.length} images`);
  }

  // Get appropriate batch size based on priority and connection
  private getBatchSize(priority: string): number {
    const nav = navigator as { connection?: NetworkInformation };
    const connection = nav.connection;
    let baseSize = 10;
    
    if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
      baseSize = 3;
    } else if (connection?.effectiveType === '3g') {
      baseSize = 5;
    }
    
    switch (priority) {
      case 'high': return Math.min(baseSize * 2, 20);
      case 'normal': return baseSize;
      case 'low': return Math.max(Math.floor(baseSize / 2), 2);
      default: return baseSize;
    }
  }

  // Check if image is ready (cached or loaded)
  isImageReady(url: string): boolean {
    return this.loadedImages.has(url);
  }

  // Get preloader statistics
  getStats() {
    return {
      loaded: this.loadedImages.size,
      loading: this.loadingImages.size,
      queued: this.requestQueue.length,
      maxConcurrent: this.maxConcurrentRequests
    };
  }

  // Clear cache (for memory management)
  clearCache(): void {
    this.loadedImages.clear();
    this.loadingImages.clear();
    this.requestQueue = [];
  }
}

// Export singleton instance and utility functions
export const imagePreloader = ImagePreloader.getInstance();

// Utility functions for common use cases
export const preloadDeckImages = async (cards: Array<{ featured_image?: string; img?: string; image?: string }>) => {
  const imageUrls = cards
    .map(card => card.featured_image || card.img || card.image)
    .filter((url): url is string => !!url);
  
  await imagePreloader.preloadImages(imageUrls, { priority: 'high' });
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const preloadGameImages = async (gameState: any) => {
  if (!gameState) return;
  
  const allCards = [
    ...(gameState.hand || []),
    ...(gameState.warriors?.flat() || []),
    ...(gameState.fortifieds?.flat() || []),
    ...(gameState.unifieds?.flat() || []),
    gameState.warlord,
    gameState.guardian
  ].filter(Boolean);

  const imageUrls = allCards
    .map(card => card.img || card.image)
    .filter((url): url is string => !!url);

  await imagePreloader.preloadImages(imageUrls, { priority: 'high' });
};

export const preloadSearchResults = async (searchResults: Array<{ featured_image?: string }>) => {
  const imageUrls = searchResults
    .slice(0, 20) // Only preload first 20 results
    .map(card => card.featured_image)
    .filter((url): url is string => !!url);
  
  await imagePreloader.preloadImages(imageUrls, { priority: 'normal' });
};

export const preloadAllCardsBackground = async (allCards: Array<{ featured_image?: string }>) => {
  const imageUrls = allCards
    .map(card => card.featured_image)
    .filter((url): url is string => !!url);
  
  // Start background preloading after a delay
  setTimeout(async () => {
    await imagePreloader.preloadImages(imageUrls, { priority: 'low' });
  }, 3000);
};