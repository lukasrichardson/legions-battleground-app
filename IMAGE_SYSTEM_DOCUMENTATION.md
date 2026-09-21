# Image System

The canonical concise reference is [docs/image-system.md](./docs/image-system.md). This document gives the operational details that are useful when maintaining the R2 migration.

## Delivery architecture

```text
Toolbox card catalogue / legacy Mongo URLs
              │
              ▼
syncCardImagesToR2.ts (local only; authenticated R2 writes)
              │
              ▼
R2 bucket: legions-battleground-images/cards/<filename>
              │
              ▼
R2_PUBLIC_BASE_URL → browser → service-worker Cache Storage
```

- Toolbox remains the card-data and deck-import source.
- R2 is the browser-facing card-image source.
- The production app requires only `R2_PUBLIC_BASE_URL`.
- `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY` are local migration configuration and must never be deployed to the browser.

## Image migration

The migration script is [scripts/syncCardImagesToR2.ts](./scripts/syncCardImagesToR2.ts).

```powershell
# Safe report: no R2 or Mongo writes.
npm run syncCardImages

# Upload missing objects and update the configured Mongo database.
npm run syncCardImages -- --apply

# Re-upload existing objects only when deliberately refreshing them.
npm run syncCardImages -- --apply --refresh
```

Each Toolbox image is stored as `cards/<filename>`, for example:

```text
https://api.legionstoolbox.com/wp-content/uploads/2023/07/RVL-128-450x616.png
→
https://<r2-public-host>/cards/RVL-128-450x616.png
```

The script combines current catalogue URLs with historical Toolbox URLs found in `cards.featured_image` and `decks.cards_in_deck[].featured_image`. It refuses same-filename collisions and updates Mongo only after its R2 object is confirmed present.

## Browser cache

[public/sw.js](./public/sw.js) provides a cache-first, seven-day Cache Storage layer for `GET` requests to `/cards/` images on the configured R2 host. It accepts PNG, JPEG, WebP, and AVIF; it ignores Toolbox URLs, non-card paths, and non-GET requests.

The cache name is `legions-card-images-v2`. A new worker activation removes older cache versions. When changing an R2 hostname, set `R2_PUBLIC_BASE_URL`, rebuild, and redeploy so service-worker registration and Next image configuration agree.

## Performance rules

- Use R2 image URLs for all browser-facing cards.
- Limit homepage background preload to 50 cards.
- Reserve image priority/eager loading for visible gameplay and focused previews.
- Keep deck grids and galleries lazy; virtualize long lists when needed.
- Verify a fresh load and a cached revisit in DevTools Network and Application panels.

## Tests

- [tests/r2-card-image-sync.test.ts](./tests/r2-card-image-sync.test.ts) validates R2 object keys, collision detection, and historical URL inclusion.
- [tests/service-worker.test.ts](./tests/service-worker.test.ts) validates R2 worker routing and rejected request classes.
- [tests/toolbox-deck-client.test.ts](./tests/toolbox-deck-client.test.ts) validates the direct browser Toolbox deck request and response parsing.
