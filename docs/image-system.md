# Image System

## Source and rendering

Card data comes from `https://api.legionstoolbox.com`; migrated card images are delivered from the public R2 host in `R2_PUBLIC_BASE_URL`. `next.config.ts` permits both hosts during the migration and uses unoptimized images. Card display components live under `src/app/components/Card/`; `CardImage.tsx` is the shared rendering and fallback component.

`R2_PUBLIC_BASE_URL` is the only Cloudflare setting required in the deployed app. R2 upload credentials remain local-only and are required by the Toolbox card import plus the migration script.

## Caching and preloading

`public/sw.js` applies a cache-first strategy only to PNG, JPG, JPEG, WebP, and AVIF images under `/cards/` on the configured R2 host. The cache has a seven-day freshness window, limits concurrent requests to 20, and clears older entries when browser storage is constrained.

`src/client/utils/imagePreloader.ts` preloads predictable image sets. `src/client/utils/serviceWorkerMonitor.ts` receives service-worker metrics, and `PerformanceDashboard.tsx` presents the current-session summary.

The homepage background preload is intentionally limited to the first 50 cards. Do not make every card eager or high priority: reserve that behavior for the visible gameplay state and focused previews.

## Migration

Run `npm run syncCardImages` for a non-writing report, then `npm run syncCardImages -- --apply` to upload missing R2 objects and update `cards.featured_image` plus `decks.cards_in_deck[].featured_image` in the configured Mongo database. The script scans both the current Toolbox catalogue and legacy Toolbox URLs still stored in Mongo, so historical image variants are not missed.

`npm run importToolboxCardsDev` and `npm run importToolboxCardsProd` are R2-first: they upload (or confirm) every image belonging to a new card before inserting any new card documents. New cards therefore store public R2 URLs directly; the sync command remains the repair path for historical card and deck references.

## Change checklist

When changing image behavior:

1. Update `next.config.ts` if the remote host changes.
2. Update the service-worker host filter and cache version when cache semantics change.
3. Confirm the card component fallback still works for a broken URL.
4. Test a first visit, a cached revisit, and a browser with the service worker disabled.

## Troubleshooting

- Check the browser Application panel for service-worker registration and cache entries.
- Check Network for R2-host card-image requests and cache headers.
- Clear the service-worker cache before comparing first-load and cached behavior.
- Treat reported metrics as session-local diagnostics, not long-term analytics.
