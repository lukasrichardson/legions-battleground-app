# UI Tweaks Branch – Change Log

This file tracks changes made on the UI tweaks branch for clear commit messages and PR descriptions. Only UI-related or setup fixes that unblock UI work are listed here.

---

## 2025-02-24

### Fix: SSR crash – `navigator is not defined` (image preloader)

**File:** `src/client/utils/imagePreloader.ts`

**Problem:** The app crashed on load with `navigator is not defined` when Next.js rendered the home page on the server. The `ImagePreloader` singleton is created at module load time (`export const imagePreloader = ImagePreloader.getInstance()`). Its constructor calls `adjustForConnection()`, which uses `navigator` and `navigator.connection` — both are undefined during server-side rendering.

**Change:** Guard `adjustForConnection()` so it only runs in the browser:

- At the start of `adjustForConnection()`, added: `if (typeof navigator === 'undefined') return;`
- On the server, the preloader still initializes but keeps default concurrency (5); connection-based tuning runs only in the client.

**Reason:** Enables the app to run locally (e.g. localhost:3000) so UI work can proceed. No behavior change in the browser; purely an SSR safety fix.

## 2025-02-24
### Setup: Dev vs production database selection

**File:** `src/server/utils/database.util.ts`

**Change:** `getDatabase()` now chooses the database by environment:

- **Development** (`NODE_ENV` not `production`, e.g. `npm run dev`): uses the `test` database.
- **Production** (`npm start` / `NODE_ENV=production`): uses the `legions_battleground_db` database.

**Reason:** Unblocks UI work by keeping dev data separate from production; local runs hit the test DB only.

---

*(Add new entries above this line, newest first.)*
