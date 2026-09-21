# Image System

## Source and rendering

Card images and card data come from `https://api.legionstoolbox.com`. `next.config.ts` permits that host and uses unoptimized images. Card display components live under `src/app/components/Card/`; `CardImage.tsx` is the shared rendering and fallback component.

## Caching and preloading

`public/sw.js` applies a cache-first strategy only to PNG, JPG, and JPEG images from the API host. The cache has a seven-day freshness window, limits concurrent requests to 20, and clears older entries when browser storage is constrained.

`src/client/utils/imagePreloader.ts` preloads predictable image sets. `src/client/utils/serviceWorkerMonitor.ts` receives service-worker metrics, and `PerformanceDashboard.tsx` presents the current-session summary.

## Change checklist

When changing image behavior:

1. Update `next.config.ts` if the remote host changes.
2. Update the service-worker host filter and cache version when cache semantics change.
3. Confirm the card component fallback still works for a broken URL.
4. Test a first visit, a cached revisit, and a browser with the service worker disabled.

## Troubleshooting

- Check the browser Application panel for service-worker registration and cache entries.
- Check Network for API-host image requests and cache headers.
- Clear the service-worker cache before comparing first-load and cached behavior.
- Treat reported metrics as session-local diagnostics, not long-term analytics.
