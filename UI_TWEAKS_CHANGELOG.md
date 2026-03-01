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

## 2026-02-26

### UI: Active game sidebar controls + tools modal refresh

**Files:**  
`src/app/components/PlayArea/Toolbar.tsx`  
`src/app/components/Modals/ToolsSettingsModal.tsx`  
`src/app/components/AppIcon.tsx`  
`src/client/redux/modalsSlice.ts`  
`src/app/play/page.tsx`

**Change:** Reworked the bottom controls in the in-game left sidebar into 3 rows and moved utility actions/settings into a dedicated modal.

- **Row 1 (icon-only):** Tools & Settings, Roll D6, Help
- **Row 2:** Mulligan, dynamic Switch button (`Switch to P1` / `Switch to P2`)
- **Row 3:** full-width Leave Game
- Added new `Tools & Settings` modal using existing modal infrastructure (no new modal library)
- Modal **Tools** section: Change Deck(s), Edit Deck, Reset Game
- Modal **Settings** section: Show Menu On Hover, Use Legacy Menu, Transparent Card Modals, Open Hand
- Added explicit modal `Close` button
- Preserved all original button/toggle functionality and event wiring

**Reason:** Improves control hierarchy and reduces sidebar clutter while keeping all existing gameplay actions available.

### UI: Icons, hover labels, chat input, and scrollbar polish

**Files:**  
`src/app/components/PlayArea/Toolbar.tsx`  
`src/app/components/Modals/ToolsSettingsModal.tsx`  
`src/app/components/Card/CardPreview.tsx`  
`src/app/globals.css`  
`src/app/components/AppIcon.tsx`

**Change:** Added lightweight icon support and improved sidebar readability/scroll behavior.

- Added reusable `AppIcon` wrapper based on existing `lucide-react` dependency
- Introduced color-coded action button styles for faster visual scanning
- Reused app tooltip system (`antd`) for button hover labels
- Icon-only top-row buttons now show text on hover via tooltip
- Restyled chat box to be visually clearer and usable (larger height, padding, focus treatment)
- Removed horizontal scrolling in selected-card text preview (`overflow-x-hidden` + wrapping)
- Added dark semi-transparent custom scrollbar style (`.sidebar-scrollbar`) and applied to sidebar scroll areas

**Reason:** Increases usability on narrow sidebars/mobile-like widths and makes frequent actions easier to identify and interact with.

---

*(Add new entries above this line, newest first.)*
