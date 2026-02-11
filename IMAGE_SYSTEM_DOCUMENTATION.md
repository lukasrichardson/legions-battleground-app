# Image System Documentation
## Legions Battleground - Complete Image Architecture Guide

### Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Image Components](#image-components)
3. [Service Worker System](#service-worker-system)
4. [Performance Monitoring](#performance-monitoring)
5. [Image Preloading](#image-preloading)
6. [Configuration & Setup](#configuration--setup)
7. [File Structure](#file-structure)
8. [Performance Strategy](#performance-strategy)
9. [Development Patterns](#development-patterns)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The Legions Battleground image system is designed around **card images** served from external sources with aggressive caching and performance monitoring. The system prioritizes **zero hosting costs** while providing optimal user experience through intelligent preloading and caching strategies.

### Core Principles
- **Cost-Free Optimization**: All images use `unoptimized={true}` to avoid Next.js processing fees
- **Service Worker Caching**: Aggressive client-side caching for repeat visits
- **Performance Visibility**: Real-time monitoring of cache effectiveness
- **Progressive Enhancement**: Images work without JavaScript, enhanced with caching
- **Zero Breaking Changes**: Maintains existing visual appearance and behavior

### Image Sources
- **Primary**: `https://legionstoolbox.com/` - Card images (PNG/JPG)
- **Local**: `PUBLIC/back_of_card.jpg` - Fallback card back image
- **External API**: Legions ToolBox API for card data and image URLs

---

## Image Components

### CardImage.tsx
**Location**: `src/app/components/Card/CardImage.tsx`

Current enhanced component with performance monitoring and service worker integration:

```tsx
export default function CardImage({ src, alt, className }: CardImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadStartTime] = useState(Date.now());

  const handleLoad = () => {
    setImageLoaded(true);
    // Detect actual cache status using Performance API
    if (typeof src === 'string') {
      setTimeout(() => {
        const fromCache = serviceWorkerMonitor.detectCacheHit(src);
        serviceWorkerMonitor.trackImageLoad(src, loadStartTime, fromCache);
      }, 10);
    }
  };

  return (
    <>
      <Image
        className={className}
        style={{ opacity: imageLoaded ? 1 : 0.5 }}
        fill
        src={src}
        alt={alt}
        unoptimized
        onLoad={handleLoad}
        onError={handleError}
      />
      {!imageLoaded && <div className="card-image-loading" />}
    </>
  );
}
```

**Features**:
- Performance tracking with service worker monitoring
- Cache hit detection using Performance API
- Load time measurement for optimization
- Fade-in transition on load (opacity 0.5 → 1.0)
- Loading placeholder with consistent styling
- Error handling with fallback placeholder
- `unoptimized={true}` for cost control

**Usage Pattern**:
```tsx
<CardImage
  src={card.img}
  alt="Card Image"
  className="object-contain w-full h-full"
/>
```

### Component Migration Status
All components now use `CardImage`:
- ✅ `CardInner.tsx` - Main game cards
- ✅ `CardPreview.tsx` - Card focus preview
- ✅ `CardGallery.tsx` - Card browser preview
- ✅ `PreviewDeckModal.tsx` - Deck preview cards
- ✅ `Preview.tsx` - Deck builder preview
- ✅ `CardTile.tsx` - Deck builder card tiles

---

## Service Worker System

### Service Worker Implementation
**Location**: `public/sw.js`

Comprehensive caching system with performance analytics:

#### Cache Strategy
```javascript
// Cache-first with freshness checks
const CACHE_NAME = 'legions-card-images-v1';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CONCURRENT_REQUESTS = 5;
```

#### Key Features
- **Cache-First Strategy**: Serves cached images immediately when available
- **Freshness Validation**: Checks cache timestamps against 7-day TTL
- **Throttled Requests**: Limits concurrent network requests to prevent overload
- **Storage Management**: Automatic cache cleanup when storage quota exceeded
- **Batch Preloading**: Processes image preloading in configurable batches

#### Request Handling
```javascript
// Only caches legionstoolbox.com images
if (url.hostname === 'legionstoolbox.com' && 
    (url.pathname.includes('.png') || url.pathname.includes('.jpg'))) {
  event.respondWith(handleImageRequest(request));
}
```

#### Performance Tracking
- **Cache Hit/Miss Counting**: Tracks effectiveness metrics
- **Load Time Recording**: Measures network vs cache performance
- **Storage Quota Monitoring**: Prevents storage overflow
- **Client Communication**: Broadcasts metrics to performance dashboard

### Registration & Activation
Service worker automatically:
1. **Installs** and skips waiting for immediate activation
2. **Cleans** old cache versions on activation
3. **Claims** existing clients for immediate caching
4. **Handles** fetch events for image requests only

---

## Performance Monitoring

### ServiceWorkerMonitor.ts
**Location**: `src/client/utils/serviceWorkerMonitor.ts`

Lightweight client-side monitoring system:

#### Metrics Tracked
```typescript
interface ImageLoadMetric {
  url: string;
  loadTime: number;
  fromCache: boolean;
  timestamp: number;
}
```

#### Performance Summary
- **Average Load Time**: Mean time across all image loads
- **Cache Hit Rate**: Percentage of requests served from cache
- **Total Requests**: Number of images loaded since session start
- **Network Savings**: Estimated bandwidth savings from caching

#### Memory Management
- Maintains **maximum 50 recent metrics** to prevent memory bloat
- **Automatic cleanup** of oldest entries
- **Session-based tracking** (resets on page reload)

### PerformanceDashboard.tsx
**Location**: `src/app/components/Modals/PerformanceDashboard.tsx`

Visual interface for monitoring cache effectiveness:

#### Dashboard Features
- **Real-time Statistics**: Live cache hit rates and load times
- **Recent Activity Log**: Last 20 image loads with cache status
- **Color-coded Indicators**: Green = cache hit, Red = network request
- **Cache Management**: Clear metrics and refresh stats
- **Performance Tips**: Guidelines for optimal cache performance

#### Access Method
Available via **"📊 Image Performance"** button on Home page:
```tsx
<Button onClick={() => setShowPerformanceDashboard(true)}>
  📊 Image Performance
</Button>
```

---

## Image Preloading

### ImagePreloader.ts
**Location**: `src/client/utils/imagePreloader.ts`

Intelligent preloading system with connection awareness:

#### Connection Adaptation
```typescript
// Adjusts concurrent requests based on network quality
if (connectionInfo.effectiveType === 'slow-2g' || connectionInfo.effectiveType === '2g') {
  this.maxConcurrentRequests = 2;
} else if (connectionInfo.effectiveType === '3g') {
  this.maxConcurrentRequests = 3;
} else {
  this.maxConcurrentRequests = 5;
}
```

#### Preloading Functions
- **`preloadDeckImages()`**: Loads deck card images on deck view
- **`preloadGameImages()`**: Loads game state card images
- **`preloadSearchResults()`**: Loads search result card images
- **`preloadAllCardsBackground()`**: Background loading of all cards

#### Integration Points
- **Home.tsx**: Background preload all cards on app load
- **DeckBuilder.tsx**: Preload deck images when deck loads
- **SearchPane.tsx**: Preload search results on query
- **Play Area**: Preload game state images

#### Performance Monitoring Integration
```typescript
// Tracks preload performance
serviceWorkerMonitor.trackImageLoad(url, startTime, false);
```

---

## Configuration & Setup

### Next.js Configuration
**Location**: `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Prevents Next.js optimization costs
    remotePatterns: [
      {
        protocol: "https",
        hostname: "legionstoolbox.com",
      }
    ]
  }
};
```

#### Key Settings
- **`unoptimized: true`**: Disables Next.js image optimization to avoid hosting fees
- **Remote Patterns**: Allows images from legionstoolbox.com domain
- **No Size Restrictions**: Allows any image dimensions
- **No Format Conversion**: Serves original image formats

### Service Worker Registration
**Location**: App automatically registers service worker if supported

```javascript
// Automatic registration on app load
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

---

### File Structure

#### Image Component Hierarchy

```
src/app/components/Card/
├── CardImage.tsx              # Enhanced Component
└── CardInner.tsx             # Uses CardImage
    ├── CardPreview.tsx       # Uses CardImage
    └── CardMenu.tsx          # No direct image usage
```

#### Usage Locations

```
Card Images Used In:
├── Game Interface
│   ├── PlayArea/Components.tsx    # Game zone cards
│   ├── Card/CardInner.tsx         # Individual game cards
│   └── Card/CardPreview.tsx       # Focused card preview
├── Card Browser
│   └── cards/CardGallery.tsx      # Card hover preview
├── Deck Management
│   ├── decks/[deckId]/Preview.tsx # Deck builder preview
│   ├── decks/[deckId]/CardTile.tsx # Deck card grid
│   └── Modals/PreviewDeckModal.tsx # Deck preview modal
└── Asset Files
    └── PUBLIC/back_of_card.jpg    # Local card back image
```

### Supporting Systems

```
Image System Files:
├── public/sw.js                          # Service worker cache logic
├── src/client/utils/
│   ├── imagePreloader.ts                 # Intelligent preloading
│   └── serviceWorkerMonitor.ts           # Performance tracking
├── src/app/components/Modals/
│   └── PerformanceDashboard.tsx          # Monitoring interface
└── next.config.ts                        # Image optimization config
```

---

## Performance Strategy

### Caching Layers
1. **Browser Cache**: Standard HTTP caching from server
2. **Service Worker Cache**: Aggressive client-side caching (7 days)
3. **Image Preloading**: Predictive loading based on user context
4. **Memory Cache**: In-memory tracking of loaded images (3000 max)

### Loading Priorities
```typescript
// High Priority (Immediate Load)
- Focused/selected cards (CardPreview)
- Cards in current play area
- Hover preview images

// Normal Priority (Lazy Load)
- Cards in hand
- Visible deck cards
- Search results (first 20)

// Low Priority (Background)
- Off-screen deck cards
- Complete card database
- Future search pages
```

### Optimization Techniques
- **Connection Awareness**: Fewer concurrent requests on slow connections
- **Data Saver Respect**: Reduced preloading when user has data saver enabled
- **Memory Management**: Automatic cleanup of old cached references
- **Storage Quotas**: Intelligent cache cleanup when storage limits reached

### Performance Targets
- **Cache Hit Rate**: Target >70% for good performance
- **Load Times**: Target <200ms for cached images
- **Network Savings**: Minimize redundant image downloads
- **Storage Usage**: Stay under 80% of available storage quota

---

## Development Patterns

### Adding New Image Usage
```tsx
// 1. Import the component
import CardImage from '@/app/components/Card/CardImage';

// 2. Use with identical props to CardImage
<CardImage
  src={imageUrl}
  alt="Description"
  className="your-styling"
/>

// 3. Add preloading for predictable image sets
useEffect(() => {
  preloadDeckImages(cardArray);
}, [cardArray]);
```

### Performance Monitoring Integration
```tsx
// Track custom image loading scenarios
serviceWorkerMonitor.trackImageLoad(url, startTime, fromCache);

// Access performance data
const stats = serviceWorkerMonitor.getPerformanceSummary();
const recentLoads = serviceWorkerMonitor.getRecentMetrics();
```

### Service Worker Communication
```javascript
// Send preload requests to service worker
navigator.serviceWorker.ready.then(registration => {
  registration.active.postMessage({
    type: 'PRELOAD_IMAGES',
    imageUrls: [...],
    priority: 'high'
  });
});
```

### Styling Consistency
All image components maintain:
- **Fade-in transitions**: `opacity: imageLoaded ? 1 : 0`
- **Loading placeholders**: `.card-image-loading` class
- **Aspect ratios**: Typically `aspect-[3/4]` for cards
- **Object fitting**: `object-contain` for card images

---

## Troubleshooting

### Common Issues

#### Service Worker Not Working
**Symptoms**: Cache hit rate always 0%, all requests show as network
**Solutions**:
1. Check browser developer tools > Application > Service Workers
2. Verify service worker is registered and active
3. Ensure HTTPS in production (service workers require secure context)
4. Check console for service worker errors

#### Images Loading Slowly
**Symptoms**: Long load times, poor user experience
**Solutions**:
1. Open Performance Dashboard to check cache effectiveness
2. Verify image preloading is working in relevant components
3. Check network conditions (service worker adapts to slow connections)
4. Clear service worker cache and test fresh load vs cached load

#### Performance Dashboard Shows No Data
**Symptoms**: Dashboard shows 0 total requests
**Solutions**:
1. Navigate to pages with images (Cards, Decks, Play area)
2. Ensure CardImage components are being used
3. Check browser console for JavaScript errors
4. Verify serviceWorkerMonitor is being imported correctly

#### Memory Issues
**Symptoms**: Browser tab becomes slow or crashes
**Solutions**:
1. Check if image preloading is too aggressive
2. Reduce concurrent request limits in imagePreloader
3. Clear performance monitoring metrics
4. Restart browser tab to reset memory state

### Debug Tools

#### Performance Dashboard
- **Access**: Home page > "📊 Image Performance" button
- **Shows**: Cache rates, load times, recent activity
- **Actions**: Refresh stats, clear metrics

#### Browser Developer Tools
- **Network Tab**: Monitor actual network requests vs cached responses
- **Application Tab**: Inspect service worker status and cache contents
- **Console**: Check for service worker and image loading errors

#### Service Worker Logging
```javascript
// Enable verbose logging in sw.js
console.log('[SW] Cache hit:', url);
console.log('[SW] Network fetch:', url);
console.log('[SW] Preloading batch:', imageUrls.length);
```

### Performance Validation

#### Expected Behavior
- **First Visit**: Images load from network, populate cache
- **Return Visit**: 70%+ cache hit rate, faster load times
- **Preloading**: Background loading on deck/game page loads
- **Dashboard**: Activity shows mix of cache hits (green) and network (red)

#### Testing Checklist
1. ✅ Clear browser cache and reload app
2. ✅ Navigate to different sections (Home, Cards, Decks, Play)
3. ✅ Open Performance Dashboard and verify activity
4. ✅ Reload pages and check for improved cache hit rates
5. ✅ Test with different network conditions (slow/fast)

---

## Future Enhancements

### Potential Improvements
- **Image Format Optimization**: WebP/AVIF conversion via service worker
- **Predictive Preloading**: ML-based prediction of next images needed
- **Cache Analytics**: Detailed analytics dashboard with historical data
- **Progressive Loading**: Different quality levels based on connection
- **Offline Support**: Fallback images when network unavailable

### Monitoring Enhancements
- **Real-time Metrics**: Live dashboard updates via WebSocket
- **Performance Alerts**: Notifications when cache hit rate drops
- **Historical Tracking**: Long-term performance trend analysis
- **User Experience Metrics**: Correlation between cache performance and UX

---

*This documentation covers the complete image system architecture as of February 2026. All components maintain backward compatibility while providing enhanced performance monitoring and caching capabilities.*