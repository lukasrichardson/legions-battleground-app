# Copilot Instructions for Legions Battleground

## Project Overview
- **Full-Stack Next.js Monorepo** for "Legions Realms At War" card game battleground
- **Frontend:** Next.js 15+ with TypeScript, Tailwind CSS 4.1+, Redux Toolkit, and React DnD
- **Backend:** Express.js 5.1+ server with Socket.IO 4.8+ real-time multiplayer and MongoDB 6.20+ database
- **Authentication:** NextAuth.js 4.24+ OAuth (GitHub/Google/Discord) with user-specific deck ownership
- **Architecture:** Hybrid Next.js + Express setup with shared TypeScript interfaces
- **Game Type:** Real-time multiplayer digital card game simulator with personal deck management
- **Game Modes:** Dual-mode system with Normal (structured) and Sandbox (unrestricted) gameplay

## Monorepo Structure
```
scripts/                   # Utility scripts (fetchCards.ts for MongoDB card data seeding, updateCardsInDecks.ts for card updates)
src/
├── app/                    # Next.js App Router frontend
│   ├── api/auth/          # NextAuth authentication routes
│   ├── cards/             # Card browsing pages with advanced filtering
│   ├── components/        # UI components organized by feature
│   │   ├── Card/          # Card display components (Card.tsx, CardImage.tsx, CardInner.tsx, CardMenu.tsx, CardPreview.tsx)
│   │   ├── Modals/        # Modal components (Create/Join Room, Deck Management, Card Pile, Help, PerformanceDashboard, etc.)
│   │   ├── PlayArea/      # Game interface components (PlayArea.tsx, Toolbar.tsx, Components.tsx, CardZone.tsx, DeckZone.tsx, GameLog.tsx, GridItem.tsx, Hand.tsx)
│   │   ├── Table/         # Room table display components
│   │   ├── auth/          # Authentication UI components (AuthButtons.tsx)
│   │   ├── Multiselect.tsx # Multi-selection dropdown component
│   │   ├── Breadcrumbs.tsx # Breadcrumb navigation component  
│   │   └── Select.tsx     # Select dropdown component
│   ├── decks/             # Deck management pages with components
│   │   ├── components/    # Deck page components (currently empty)
│   │   ├── [deckId]/      # Dynamic deck editing pages with sub-components
│   │   │   ├── components/ # Deck builder components (CardTile.tsx, DeckEditorHeader.tsx, DeckGrid.tsx, SearchPane.tsx)
│   │   │   ├── DeckBuilder.tsx # Main deck builder component
│   │   │   ├── Preview.tsx # Card preview component for deck builder
│   │   │   └── page.tsx   # Deck editing page
│   │   ├── DecksList.tsx  # Deck library listing component
│   │   ├── DecksPageHeader.tsx # Deck page header with actions
│   │   └── page.tsx       # Deck management main page
│   ├── play/              # Game interface pages
│   │   ├── clientLayout.tsx # Client-side responsive scaling layout
│   │   ├── layout.tsx     # Play area specific layout with ClientLayout wrapper
│   │   ├── page.tsx       # Main game interface with modals
│   │   └── play.module.css # Play area specific styles
│   ├── providers/         # React context providers (SessionProvider)
│   ├── styles/            # CSS modules (modals.module.css, toolbar.module.css)
│   ├── fonts/             # Custom fonts (Geist)
│   ├── globals.css        # Global styles with Tailwind imports
│   ├── Home.tsx           # Home page component with room management
│   ├── layout.tsx         # Root layout with SessionProvider and StoreProvider
│   └── page.tsx           # Main page with modal management
├── client/                 # Client-side utilities (shared between frontend/backend)
│   ├── constants/         # Game constants and initial state (InitialGameState.ts, cardMenu.constants.ts)
│   ├── enums/             # Client-specific enums (GameEvent, MenuItemAction, RoomEvent)
│   ├── hooks/             # Custom React hooks (useSocket, useAuth, useClickOutside, useEffectAsync, useWindowSize, useClientSettings, useBackgroundPreload, useHandleCardEvents, useHandlePlayerEvents)
│   ├── interfaces/        # TypeScript interfaces (Card, GameState, IMenuItem)
│   ├── lib/               # Utility functions (utils.ts for className merging)
│   ├── redux/             # State management with multiple slices
│   │   ├── store.ts       # Redux store configuration
│   │   ├── hooks.ts       # Typed Redux hooks
│   │   ├── gameStateSlice.ts # Game state management
│   │   ├── modalsSlice.ts # Modal state management
│   │   ├── phaseSlice.ts  # Game phase management
│   │   ├── sequenceSlice.ts # Game sequence management
│   │   ├── clientSettingsSlice.ts # Client-side UI settings management
│   │   └── StoreProvider.tsx # Redux provider component
│   ├── ui/                # Shared UI primitives (shadcn/ui components)
│   │   ├── breadcrumb.tsx # Breadcrumb navigation component
│   │   ├── button.tsx     # Button component
│   │   ├── card.tsx       # Card UI component
│   │   ├── dropdown-menu.tsx # Dropdown menu component
│   │   ├── input.tsx      # Input field component
│   │   ├── multiselect.tsx # Multi-selection component
│   │   ├── navigation-menu.tsx # Navigation menu component
│   │   └── select.tsx     # Select dropdown component
│   ├── utils/             # Client utilities (API, gameState, string utils, emitEvent, image preloading)
│   │   ├── api.utils.ts   # API communication utilities
│   │   ├── emitEvent.ts   # Socket event emission utilities
│   │   ├── gameState.utils.ts # Game state manipulation utilities
│   │   ├── imagePreloader.ts  # Intelligent image preloading with connection awareness
│   │   ├── serviceWorkerMonitor.ts # Service Worker performance monitoring
│   │   └── string.util.ts # Client string utilities
│   └── socket.js          # Socket.IO client setup
├── server/                 # Express backend with Socket.IO and MongoDB
│   ├── cards/             # Card effects and keywords
│   │   ├── CardEffects.constants.ts # Card effect definitions
│   │   └── Keywords.ts    # Keyword system implementation
│   ├── enums/             # Server-side enums (phases, events)
│   │   ├── GameEvent.ts   # Game event enumeration
│   │   ├── Phases.ts      # Game phases enumeration
│   │   └── RoomEvent.ts   # Room event enumeration
│   ├── events/            # Socket event handlers (card, player)
│   │   ├── cardEvents.ts  # Card-related event handlers
│   │   └── playerEvents.ts # Player action event handlers
│   ├── game/              # Game logic and state management
│   │   └── game.ts        # Core game logic and state
│   ├── services/          # Business logic services (NEW: service-based architecture)
│   │   ├── CardService.ts # Card manipulation service
│   │   ├── EventHandler.ts # Centralized event handling service
│   │   ├── GameService.ts # Game state management service
│   │   ├── RoomService.ts # Room management service
│   │   ├── ValidatorService.ts # Validation service
│   │   └── interfaces/    # Service interfaces
│   ├── interfaces/        # Server-side interfaces
│   │   ├── CardInterface.ts # Server card interface
│   │   ├── ExpressTypes.ts # Express app and request type extensions
│   │   ├── GameState.ts   # Server game state interface
│   │   ├── SequenceInterfaces.ts # Game sequence interfaces
│   │   └── SocketTypes.ts # Socket.IO server and event payload types
│   ├── middleware/        # Authentication middleware (requireAuth, optionalAuth)
│   │   └── auth.ts        # Authentication middleware
│   ├── network/           # API routes and socket handlers
│   │   ├── routes.ts      # REST API endpoints
│   │   └── socketHandler.ts # Socket.IO event handling
│   ├── utils/             # Server utilities (database, game, card generation, sandbox validation)
│   │   ├── cardZone.util.ts # Card zone management utilities
│   │   ├── database.util.ts # MongoDB connection and utilities
│   │   ├── game.util.ts   # Game-specific utilities
│   │   ├── generateCards.util.ts # Card generation utilities
│   │   ├── generateGameLog.ts # Game log generation
│   │   ├── sandboxValidator.util.ts # Sandbox mode validation
│   │   ├── shuffleDeck.util.ts # Deck shuffling utilities
│   │   └── string.utils.ts # Server string utilities
│   └── server.ts          # Main server entry with Next.js integration
├── shared/                 # Shared enums and interfaces between client/server
│   ├── enums/             # Common enumerations (CardTarget, CardType)
│   │   ├── CardTarget.ts  # Card targeting enumeration
│   │   └── CardType.ts    # Card type enumeration
│   └── interfaces/        # Common TypeScript interfaces (DeckResponse, RoomInterface)
│       ├── DeckResponse.ts # Deck response interface
│       └── RoomInterface.ts # Room and player management interface
└── middleware.ts           # Next.js middleware for route protection
```

## Backend Architecture (`src/server/`)
- **Express Server:** `server.ts` - Main server with Next.js integration and hybrid routing
- **Socket.IO:** Real-time game events and room management via `network/socketHandler.ts`
- **MongoDB:** Database using centralized client management via `utils/database.util.ts`
- **Authentication:** JWT-based auth middleware (`middleware/auth.ts`) for user session validation
- **API Routes:** `network/routes.ts` - REST endpoints for room/deck management with user authorization
- **Game Logic:** Server-side game state validation and card effects in `events/` and `game/`
- **Service Architecture:** Modular business logic with `GameService`, `RoomService`, `CardService`, `ValidatorService`
- **Event Handling:** Centralized `EventHandler` service for consistent Socket.IO event processing
- **Validation System:** Sandbox mode validation bypass utilities in `utils/sandboxValidator.util.ts`
- **Database Utils:** Centralized MongoDB connection management and queries
- **Cron Jobs:** Health check pings for production deployment (every 14 minutes)

## Frontend Architecture (`src/app/`)
- **App Router:** Next.js 15+ routing with layouts and pages
- **Components:** Card game UI organized by feature (Card, Modals, PlayArea, Table, auth)
- **Authentication:** NextAuth.js integration with OAuth sign-in components and protected routes
- **Session Provider:** NextAuthSessionProvider wrapped in root layout for app-wide auth context
- **Redux Store:** Client-side state management with game state synchronization
- **Socket Client:** Real-time event handling via `useSocket.ts` hook
- **React DnD:** Drag-and-drop card interactions

## Key Game Features
- **User Authentication:** OAuth sign-in with GitHub/Google for deck ownership and room access
- **Personal Deck Libraries:** User-specific deck collections with ownership validation and inline editing
- **Multiplayer Rooms:** Create/join password-protected game sessions (requires authentication)
- **Real-time Sync:** Live game state across all players via Socket.IO
- **Card Game Engine:** Full digital card simulation with multiple zones (Hand, Deck, Discard, Eradication, Warriors, Fortified, Warlord, VeilRealm, Synergy, Guardian, Tokens, Revealed)
- **Advanced Card Filtering:** Multi-criteria search and filtering by legion, type, rarity, and set (restricted to development mode in Home page)
- **Enhanced Deck Builder:** Intuitive deck management with real-time filtering, responsive layout, and card hover preview
- **Deck Integration:** Import decks from Legions ToolBox API to personal library
- **Deck Management:** Inline deck name editing with real-time UI updates and deck deletion functionality
- **Deck Deletion:** Delete decks from both deck list and deck editor with hover-to-reveal delete buttons and ownership validation
- **Game Mechanics:** Health/AP tracking, card modifiers (attack/defense/cooldown), dice rolling, chat
- **Dual Game Modes:** Normal (structured turn-based) and Sandbox (unrestricted testing) modes
- **Card Interactions:** Right-click context menus, drag-and-drop, modifier controls with zone index support
- **Breadcrumb Navigation:** Enhanced navigation with breadcrumb components for better UX
- **Responsive Design:** Mobile-friendly interface with adaptive layouts and hidden elements on smaller screens
- **Game Log System:** Auto-scrolling game log display with conditional rendering based on game mode
- **Intelligent Image Preloading:** Connection-aware image preloading system with Service Worker integration and memory management
- **Client Settings:** Configurable UI preferences including hover menu controls and other client-side settings with localStorage persistence

## Database & External APIs
- **MongoDB:** Game rooms, player data, and persistent game states with user-specific deck collections (using 'legions_battleground_db' database in production, previously 'test' for development)
- **Legions ToolBox API:** External deck data integration for importing to personal libraries with enhanced field mapping
- **Images:** Remote card images from api.legionstoolbox.com

## Development Workflows
```bash
npm install              # Install dependencies
npm run dev             # Start Next.js + Express dev server (port 3000)
npm run build           # Build Next.js frontend + compile TypeScript server
npm run start           # Start production server
npm run lint            # ESLint checking
node scripts/fetchCards.ts  # Seed MongoDB with card data from Legions ToolBox API
node scripts/updateCardsInDecks.ts  # Update card data in existing decks with latest card information
```

## Shared Architecture Patterns
- **TypeScript Interfaces:** Consolidated shared types in `src/shared/interfaces/` used by both client and server
- **Enums:** Common enums in `src/shared/enums/` (CardTarget, CardType), with additional client/server specific enums
- **Socket Events:** Real-time communication via `GAME_EVENT` and `ROOM_EVENT` enums
- **Authentication:** User session management with NextAuth.js JWT tokens and server middleware
- **Database Integration:** Local MongoDB for game rooms and user decks, external API for imports
- **State Sync:** Client Redux ↔ Socket.IO ↔ Express backend ↔ MongoDB

## Key Integration Points
- **Real-time Multiplayer:** Socket.IO for game state synchronization
- **Database:** MongoDB for persistent rooms and game data
- **External API:** Legions ToolBox for deck imports and card data
- **Asset Loading:** Next.js Image optimization for remote card images
- **Deployment:** Dockerized with health check monitoring
- **Client Settings:** Persistent UI preferences via clientSettingsSlice and localStorage

## Game-Specific Patterns
- **Card Actions:** Client UI → Redux action → Socket event → Server validation → MongoDB → Broadcast
- **Room Management:** REST API for room creation, Socket.IO for real-time room events
- **Deck Loading:** MongoDB integration for game decks, external API for deck imports
- **User Authentication:** OAuth sign-in → JWT session → Server middleware → Database filtering
- **State Management:** Optimistic updates on client, authoritative server state

## Sandbox Mode Architecture
- **Dual-Mode System:** Single `sandboxMode: boolean` flag controls game behavior
- **Normal Mode:** Structured turn-based gameplay with phase restrictions and action validation
- **Sandbox Mode:** Unrestricted gameplay after RPS - skip phase progression, bypass validation, auto-resolve sequences
- **UI Indicators:** Orange "🔧 Sandbox Mode" banners when active for clear mode awareness
- **State Persistence:** Sandbox setting maintained through game resets and room reconnections
- **Zero Breaking Changes:** Normal mode functionality completely preserved
- **Current Default:** Sandbox mode defaults to `true` in InitialGameState.ts for development/testing
- **Game Log Integration:** Dedicated game log display in Toolbar when sandbox mode is active

## Enhanced Drag & Drop Architecture
- **Zone Index System:** Multi-dimensional card array support with `zoneIndex` parameter for precise positioning
- **Source Tracking:** Drag operations track both `cardTarget` and `zoneIndex` for accurate card movement
- **Type-Safe Events:** Socket events and Redux actions include zone index with proper TypeScript interfaces
- **Multi-Zone Support:** Warriors, Fortified, and Unified zones organized as arrays with individual zone management
- **Component Integration:** CardInner.tsx, GridItem.tsx, and Hand.tsx all support zone index in drag-and-drop operations

## Responsive Scaling Architecture
- **ClientLayout Component:** `src/app/play/clientLayout.tsx` - Provides responsive scaling for the play area interface
- **Window Size Hook:** `src/client/hooks/useWindowSize.ts` - Custom React hook for window dimension tracking
- **Scaling Logic:** Dynamic scale calculation based on target dimensions (880x815) with proportional scaling
- **Layout Integration:** Play area layout wraps children in ClientLayout for automatic responsive scaling
- **Transform Origin:** Left-top origin ensures proper scaling behavior for game interface
- **UI Improvements:** Fixed modal sizing from viewport units to percentage-based for better scaling
- **Global CSS:** Overflow hidden on html/body to prevent scrollbar issues during scaling
- **Toolbar Responsiveness:** Fixed text sizing from viewport units to pixel-based for consistency
- **Grid Optimization:** Reduced card pile modal grid columns for better mobile/scaled display

## Enhanced Card Filtering System
- **Multi-Criteria Filtering:** Support for legion, type, rarity, and set filters
- **Custom MultiSelect Component:** `src/client/ui/multiselect.tsx` - Reusable component for multi-selection
- **API Integration:** Enhanced `/api/cards` and `/api/filterOptions` endpoints with full filtering support
- **Responsive Design:** Filters hidden on mobile screens in SearchPane for space optimization
- **Real-time Search:** Text search across card title, text, and card code fields
- **Backend Query Building:** Dynamic MongoDB query construction for multiple filter criteria

## Component Architecture Patterns
- **Card Components:** Modular card display system with CardInner.tsx for reusable card logic and CardImage.tsx for optimized image rendering
- **Performance Monitoring:** PerformanceDashboard.tsx modal for real-time service worker telemetry and image preloading statistics
- **Service Worker Integration:** Enhanced image caching and performance monitoring via serviceWorkerMonitor.ts utility
- **Drag & Drop System:** React DnD integration with zone index tracking for multi-zone card arrays
- **Modals:** Centralized modal components with consistent styling and behavior, streamlined UI without header icons for cleaner presentation
- **Deck Builder Components:** Specialized components for deck editing (CardTile.tsx, DeckEditorHeader.tsx, DeckGrid.tsx, SearchPane.tsx)
- **Authentication Flow:** OAuth integration with AuthButtons.tsx and protected route middleware
- **Import Deck Flow:** Import deck functionality integrated within PreviewDeckModal for seamless deck management
- **Breadcrumb Navigation:** Reusable breadcrumb system for hierarchical navigation
- **Multiselect Pattern:** Custom multiselect component for filter management across the app
- **Toolbar Integration:** Conditional UI display based on game mode with game log and sequence state management

## Adding New Features
- **New Socket Event:** Add to enums in both `src/client/enums/` and `src/server/enums/`, update handlers with proper typing
- **New API Endpoint:** Add to `src/server/network/routes.ts` with `ExpressApp` and `AuthenticatedRequest` types
- **New Game Action:** Update Redux slice, socket events, and server-side game logic with type-safe parameters
- **Database Changes:** Update MongoDB queries and shared TypeScript interfaces with proper type validation
- **New Shared Type:** Add to `src/shared/interfaces/` or `src/shared/enums/` for consistency and type safety

## Sandbox Mode Development Patterns
- **Action Validation:** Use `validateForSandbox()` wrapper from `src/server/utils/sandboxValidator.util.ts`
- **Phase Control:** Check `games[roomId].sandboxMode` before auto-progressing phases
- **UI Components:** Add conditional sandbox indicators using `gameState.sandboxMode`
- **Sequence Resolution:** Auto-resolve player input requirements in sandbox mode
- **State Interfaces:** Include `sandboxMode: boolean` in both client/server GameState interfaces
- **Game Log Display:** Use conditional rendering for game log vs sequence state in Toolbar component
- **Zone Index Tracking:** Include `zoneIndex` parameter in drag-and-drop event data for accurate card positioning

## Enhanced Filtering Development Patterns
- **MultiSelect Usage:** Import from `src/client/ui/multiselect.tsx` for consistent multi-selection UI
- **API Filtering:** Use `fetchCards({legion, query, page, pageSize, type, rarity, set})` pattern
- **Filter State Management:** Maintain separate state arrays for each filter type (legion, type, rarity, set)
- **Responsive Filters:** Use conditional rendering `hidden sm:block` for mobile optimization
- **Backend Integration:** Extend routes with filter parameter validation and MongoDB query building
- **Filter Options:** Use `fetchFilterOptions()` to populate available filter values dynamically

## Client Settings Architecture
- **Settings Store:** `clientSettingsSlice.ts` manages UI preferences with Redux Toolkit
- **Persistent Storage:** `useClientSettings()` hook provides localStorage integration
- **Available Settings:** `hoverMenu` (boolean), `legacyMenu` (boolean), `transparentOnBlur` (boolean) for UI behavior control
- **Real-time Updates:** Settings changes immediately affect UI without page refresh
- **Hook Pattern:** Custom hook manages both state access and localStorage persistence
- **Default Values:** `hoverMenu` and `legacyMenu` default to `true`, `transparentOnBlur` defaults to `false`

## Image Preloading Development Patterns
- **Preloader Import:** Import `imagePreloader` singleton from `src/client/utils/imagePreloader.ts`
- **Utility Functions:** Use `preloadDeckImages()`, `preloadGameImages()`, `preloadSearchResults()` for common scenarios
- **Priority Levels:** Set appropriate priority ('high', 'normal', 'low') based on user interaction context
- **Connection Awareness:** System automatically adapts to user's network conditions and data saver preferences
- **Memory Management:** Built-in cache size limits and cleanup to prevent memory leaks
- **Background Loading:** Use `preloadAllCardsBackground()` for non-critical preloading with delays
- **Performance Monitoring:** Use `imagePreloader.getStats()` for debugging and optimization
- **Service Worker Integration:** Automatic background caching when Service Worker is available

## Client Settings Development Patterns
- **Settings Import:** Import from `src/client/redux/clientSettingsSlice.ts` for UI preference management
- **Settings Hook:** Use `useClientSettings()` hook from `src/client/hooks/useClientSettings.ts` for full settings management
- **State Access:** Use `useAppSelector((state) => state.clientSettings)` to access current settings
- **Settings Updates:** Dispatch `setHoverMenu()`, `setLegacyMenu()`, `setTransparentOnBlur()` actions or use hook methods for real-time UI changes
- **Persistent Settings:** Automatic localStorage persistence via useClientSettings hook
- **Available Settings:** `hoverMenu` (boolean), `legacyMenu` (boolean), and `transparentOnBlur` (boolean) for UI behavior control
- **Component Integration:** Add settings controls in toolbar or settings modals with immediate effect

## Authentication & User Management
- **Frontend Auth:** Use `useAuth` hook from `src/client/hooks/useAuth.ts` for session state
- **Protected Routes:** Add authentication checks to modals and forms before API calls
- **Server Middleware:** Use `requireAuth` or `optionalAuth` from `src/server/middleware/auth.ts`
- **Data Isolation:** Filter database queries by `userId` for user-specific data
- **Session Management:** NextAuth.js handles OAuth flow, JWT tokens, and session persistence

## TypeScript Architecture & Best Practices
- **Zero Compilation Errors:** Project maintains strict TypeScript compliance with comprehensive type safety
- **Foundational Type System:** Custom interfaces for Socket.IO, Express middleware, and game state management
- **Shared Type Architecture:** Consolidated interfaces in `src/shared/` prevent client-server type drift
- **Type-Safe Networking:** Socket events and Express routes use proper parameter typing with custom extensions

### Key Type Interfaces
```typescript
// Socket.IO Extensions
interface IOServer extends Server { }
interface CustomSocket extends Socket { room?: string; }

// Express Extensions
interface ExpressApp extends Express { }
interface AuthenticatedRequest extends Request { userId?: string; user?: object; }

// Game State with Safe Property Access
interface GameStateData {
  // ... game properties
  [key: string]: unknown; // Safe index signature for CARD_TARGET access
}
```

### Type Safety Patterns
- **Index Signatures:** Use `(games[roomId][target] as CardInterface[])` for safe property access on game state
- **Error Handling:** Catch clauses use `unknown` type with proper type guards instead of `any`
- **API Callbacks:** Define specific callback interfaces: `(data: unknown) => void` with proper casting
- **Socket Events:** Type-safe event payloads with custom Socket.IO interfaces
- **Card Type Flexibility:** Union types `id: string | number` support both MongoDB ObjectId and numeric formats
- **Build Validation:** `npm run build` ensures zero TypeScript compilation errors before deployment

### Critical Type Files
- `src/server/interfaces/SocketTypes.ts` - Socket.IO server and event payload types
- `src/server/interfaces/ExpressTypes.ts` - Express app and authenticated request extensions
- `src/shared/interfaces/RoomInterface.ts` - Room and player management types
- `src/server/interfaces/GameState.ts` - Server-side game state with index signature
- `src/client/interfaces/GameState.ts` - Client-side game state interface
- `src/client/interfaces/Card.mongo.ts` - MongoDB card document interface

### TypeScript Development Rules
- **Never use `any`:** Always prefer `unknown` with type guards or specific interfaces
- **Type Assertions:** Use `as Type` casting for safe property access on indexed game state
- **Import Consistency:** Import from `@/shared/` for common types, maintain client/server separation
- **Error Safety:** Use `error: unknown` in catch blocks with proper type checking
- **Build Testing:** Run `npm run build` after type changes to ensure zero compilation errors

## Modern Development Patterns
- **TypeScript Strict Mode:** Project uses strict TypeScript configuration for better type safety
- **Optional Chaining:** Use `?.()` syntax for safe function calls and property access
- **Nullish Coalescing:** Use `??` operator for precise fallback handling (preserves falsy but defined values)
- **React Suspense:** Implement Suspense boundaries for loading states and code splitting
- **Error Boundaries:** (Recommended) Add error boundaries for graceful error handling
- **Custom Hooks:** Consistent patterns with useAuth, useSocket, useClickOutside, useEffectAsync, useWindowSize, useClientSettings, useBackgroundPreload, useHandleCardEvents, useHandlePlayerEvents

## Environment & Configuration
- **Production API:** `https://lrawbook-service.onrender.com`
- **Development API:** `http://localhost:3000` (configurable port)
- **MongoDB:** Atlas cluster with connection string in server environment
- **External Images:** Configured in `next.config.ts` for api.legionstoolbox.com

## Deployment Architecture
- **Single Process:** Next.js and Express run together via hybrid setup
- **Docker:** Containerized deployment with `Dockerfile`
- **Health Monitoring:** Cron job for keep-alive pings in production
- **Static Assets:** Next.js handles frontend, Express handles API and Socket.IO

---

