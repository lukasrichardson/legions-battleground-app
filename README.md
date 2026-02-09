# Legions Battleground

**Legions Battleground** is a real-time multiplayer card game simulator for "Legions Realms At War" built as a full-stack Next.js monorepo. Players can authenticate with OAuth, manage personal deck libraries, create game rooms, and play against each other with live synchronization via Socket.IO real-time chat.

---

## 🎮 Features

- **User Authentication:** OAuth sign-in with GitHub and Google via NextAuth.js
- **Personal Deck Libraries:** User-specific deck ownership and management with inline editing
- **Real-time Multiplayer:** Live game state synchronization via Socket.IO
- **Dual Game Modes:** Normal structured gameplay and Sandbox mode for unrestricted testing
- **Deck Integration:** Import decks from Legions ToolBox API to personal libraries
- **Card Game Engine:** Full digital card simulation with drag-and-drop interactions and zone index tracking
- **Advanced Card Filtering:** Multi-criteria search and filtering by legion, type, rarity, and set (restricted to development mode in Home page)
- **Enhanced Deck Builder:** Intuitive deck management with real-time filtering, responsive layout, and card hover preview
- **Deck Deletion:** Delete decks from both deck list and deck editor with hover-to-reveal delete buttons and ownership validation
- **Game Zones:** Hand, Deck, Discard, Eradication, Warriors, Fortified, Warlord, VeilRealm, Synergy, Guardian, Tokens, Revealed
- **Room Management:** Create/join password-protected game sessions (requires authentication)
- **Live Chat:** In-game chat system with real-time messaging
- **Card Interactions:** Right-click menus, modifiers, flipping, targeting, cooldowns
- **Deck Name Editing:** Inline deck renaming with real-time updates
- **Health & AP Tracking:** Live player health and action point management
- **Dice Rolling System:** Built-in dice rolling with game log integration
- **Rock Paper Scissors:** Turn order determination system
- **Card Modifiers:** Attack, defense, and other modifiers with visual indicators
- **Mulligan System:** Pre-game hand selection phase
- **Game Sequences:** Complex card effect resolution system
- **Breadcrumb Navigation:** Enhanced navigation with breadcrumb components
- **Responsive Design:** Mobile-friendly interface with adaptive layouts and automatic scaling for play area

> **⚡ Latest:** Enhanced performance with intelligent image preloading system featuring connection-aware throttling, Service Worker integration, and memory management. Added client settings slice for UI preferences and improved modal system with streamlined components.

---

## 🏗️ Architecture

**Full-Stack Monorepo:**
- **Frontend:** Next.js 15+ with TypeScript, Tailwind CSS, Redux Toolkit
- **Backend:** Express.js 5.1+ server with Socket.IO and MongoDB
- **Authentication:** NextAuth.js with OAuth (GitHub/Google) and user-specific data isolation
- **Real-time:** WebSocket communication for live multiplayer
- **Database:** MongoDB for persistent game rooms, user decks, and state (using 'test' database for development)
- **Shared Types:** Consolidated TypeScript interfaces and enums between client/server
- **Deployment:** Single process hybrid Next.js + Express setup

---

## 📁 Project Structure

```
public/                    # Static assets (card images)
scripts/                   # Utility scripts (fetchCards.ts for MongoDB card data seeding)
src/
├── app/                   # Next.js App Router (Frontend)
│   ├── api/auth/         # NextAuth authentication routes
│   ├── cards/           # Card browsing pages with advanced filtering
│   ├── components/       # UI components (Card, Modals, PlayArea, Table, auth)
│   │   ├── Card/        # Card display components (Card.tsx, CardInner.tsx, CardMenu.tsx, CardPreview.tsx)
│   │   ├── Modals/      # Modal components (Create/Join Room, Deck Management, Card Pile, Help, Preview Deck with Import)
│   │   ├── PlayArea/    # Game interface components (PlayArea.tsx, Toolbar.tsx, Components.tsx)
│   │   ├── Table/       # Room table display components
│   │   ├── auth/        # Authentication UI components (AuthButtons.tsx)
│   │   ├── Multiselect.tsx  # Multi-selection dropdown component
│   │   └── Select.tsx   # Select dropdown component
│   ├── decks/           # Deck management pages with components
│   │   ├── components/  # Deck page components (Breadcrumbs.tsx)
│   │   ├── [deckId]/    # Dynamic deck editing pages
│   │   │   ├── components/  # Deck builder components (CardTile.tsx, DeckEditorHeader.tsx, DeckGrid.tsx, SearchPane.tsx)
│   │   │   ├── DeckBuilder.tsx  # Main deck builder component
│   │   │   ├── Preview.tsx # Card preview component for deck builder
│   │   │   └── page.tsx # Deck editing page
│   │   ├── DecksList.tsx # Deck library listing component
│   │   ├── DecksPageHeader.tsx # Deck page header with actions
│   │   └── page.tsx     # Deck management main page
│   ├── play/            # Game interface pages
│   │   ├── clientLayout.tsx   # Client-side responsive scaling layout
│   │   ├── layout.tsx   # Play area specific layout with ClientLayout wrapper
│   │   ├── page.tsx     # Main game interface
│   │   └── play.module.css # Play area specific styles
│   ├── providers/       # React context providers (SessionProvider)
│   ├── styles/          # CSS modules (modals.module.css, toolbar.module.css)
│   ├── fonts/           # Custom fonts (Geist)
│   ├── globals.css      # Global styles with Tailwind imports
│   ├── Home.tsx         # Home page component with room management
│   ├── layout.tsx       # Root layout with SessionProvider and StoreProvider
│   └── page.tsx         # Main page with modal management
├── client/              # Client-side utilities (shared between frontend/backend)
│   ├── constants/       # Game constants and initial state (InitialGameState.ts, cardMenu.constants.ts)
│   ├── data/           # Card data (cards.ts)
│   ├── enums/          # Client-specific enums (GameEvent, MenuItemAction, RoomEvent)
│   ├── hooks/          # Custom React hooks (useSocket, useAuth, useClickOutside, useEffectAsync, useWindowSize)
│   ├── interfaces/     # TypeScript interfaces (Card, GameState, IMenuItem)
│   ├── lib/            # Utility functions (utils.ts for className merging)
│   ├── redux/          # State management (store, slices for game, modals, phases, sequences, client settings)
│   │   ├── store.ts    # Redux store configuration
│   │   ├── hooks.ts    # Typed Redux hooks
│   │   ├── gameStateSlice.ts  # Game state management
│   │   ├── modalsSlice.ts     # Modal state management
│   │   ├── phaseSlice.ts      # Game phase management
│   │   ├── sequenceSlice.ts   # Game sequence management
│   │   ├── clientSettingsSlice.ts # Client-side UI settings management
│   │   └── StoreProvider.tsx  # Redux provider component
│   ├── ui/             # Shared UI primitives (shadcn/ui components)
│   │   ├── breadcrumb.tsx     # Breadcrumb navigation component
│   │   ├── button.tsx         # Button component
│   │   ├── card.tsx           # Card UI component
│   │   ├── dropdown-menu.tsx  # Dropdown menu component
│   │   ├── input.tsx          # Input field component
│   │   ├── multiselect.tsx    # Multi-selection component
│   │   ├── navigation-menu.tsx # Navigation menu component
│   │   └── select.tsx         # Select dropdown component
│   ├── utils/          # Client utilities (API, gameState, string utils, emitEvent, image preloading)
│   │   ├── api.utils.ts       # API communication utilities
│   │   ├── emitEvent.ts       # Socket event emission utilities
│   │   ├── gameState.utils.ts # Game state manipulation utilities
│   │   ├── imagePreloader.ts  # Intelligent image preloading with connection awareness
│   │   ├── serviceWorkerMonitor.ts # Service Worker performance monitoring
│   │   └── string.util.ts     # String utility functions
├── server/             # Backend (Express + Socket.IO)
│   ├── cards/          # Card schema, effects, keywords, utilities
│   │   ├── card.schema.ts        # Card data schema
│   │   ├── CardEffects.constants.ts  # Card effect definitions
│   │   ├── generateCards.util.ts # Card generation utilities
│   │   ├── Keywords.ts           # Keyword system implementation
│   │   ├── new_card.schema.ts    # New card schema definitions
│   │   ├── shuffleDeck.util.ts   # Deck shuffling utilities
│   │   └── string.utils.ts       # Card-specific string utilities
│   ├── enums/          # Server-side enums (phases, events)
│   │   ├── GameEvent.ts          # Game event enumeration
│   │   ├── Phases.ts             # Game phases enumeration
│   │   └── RoomEvent.ts          # Room event enumeration
│   ├── events/         # Socket event handlers (card, health, player, room)
│   │   ├── cardEvents.ts         # Card-related event handlers
│   │   ├── healthApEvents.ts     # Health and AP event handlers
│   │   ├── playerEvents.ts       # Player action event handlers
│   │   └── roomEvents.ts         # Room management event handlers
│   ├── game/           # Game logic and state management
│   │   └── game.ts               # Core game logic and state
│   ├── interfaces/     # Server-side interfaces
│   │   ├── CardInterface.ts      # Server card interface
│   │   ├── ExpressTypes.ts       # Express app and request type extensions
│   │   ├── GameState.ts          # Server game state interface
│   │   ├── SequenceInterfaces.ts # Game sequence interfaces
│   │   └── SocketTypes.ts        # Socket.IO server and event payload types
│   ├── middleware/     # Authentication middleware (requireAuth, optionalAuth)
│   │   └── auth.ts               # Authentication middleware
│   ├── network/        # API routes and socket handlers
│   │   ├── routes.ts             # REST API endpoints
│   │   └── socketHandler.ts      # Socket.IO event handling
│   ├── utils/          # Server utilities (database, game, card generation, sandbox validation)
│   │   ├── cardZone.util.ts      # Card zone management utilities
│   │   ├── database.util.ts      # MongoDB connection and utilities
│   │   ├── game.util.ts          # Game-specific utilities
│   │   ├── generateCards.util.ts # Card generation utilities
│   │   ├── generateGameLog.ts    # Game log generation
│   │   ├── sandboxValidator.util.ts # Sandbox mode validation
│   │   ├── shuffleDeck.util.ts   # Deck shuffling utilities
│   │   └── string.utils.ts       # Server string utilities
│   └── server.ts       # Main server entry with Next.js integration
├── shared/             # Shared enums and interfaces between client/server
│   ├── enums/          # Common enumerations (CardTarget, CardType)
│   │   ├── CardTarget.ts         # Card targeting enumeration
│   │   └── CardType.ts           # Card type enumeration
│   └── interfaces/     # Common TypeScript interfaces (DeckResponse, RoomInterface)
│       ├── DeckResponse.ts       # Deck response interface
│       └── RoomInterface.ts      # Room and player management interface
└── middleware.ts       # Next.js middleware for route protection
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   This starts both the Next.js frontend and Express backend on `http://localhost:3000`

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Start production server:**
   ```bash
   npm start
   ```

5. **Lint code:**
   ```bash
   npm run lint
   ```

6. **Seed MongoDB with card data:**
   ```bash
   node scripts/fetchCards.ts
   ```

---

## 🎲 How to Play

1. **Sign In:** Click "Sign In" to authenticate with GitHub or Google (required for deck management and room creation)

2. **Create a Room:** Click "Create New Game" and provide:
   - Room name and password
   - Your player name  
   - Deck ID from your personal deck library or [Legions ToolBox](https://legionstoolbox.com/my-decks)
   - **Game Mode:** Choose between Normal (structured) or Sandbox (unrestricted) mode

3. **Join a Game:** Select a room from the list and enter:
   - Player name
   - Deck ID from your personal collection
   - Room password (if required)

4. **Game Modes:**
   - **Normal Mode:** Standard gameplay with turn-based phases, restrictions, and win conditions
   - **Sandbox Mode:** Unrestricted gameplay after initial setup - take any action at any time for testing and experimentation

5. **Game Interface:**
   - **Drag & Drop:** Move cards between zones with precise zone index tracking
   - **Right-click:** Access card context menus
   - **Chat:** Type and press Enter to chat
   - **Toolbar:** Reset game, switch sides, roll dice
   - **Visual Indicators:** Orange "🔧 Sandbox Mode" banners when in sandbox mode
   - **Conditional Display:** Game log view in sandbox mode, sequence state in normal mode
   - **Auto-scroll:** Game log automatically scrolls to show latest entries

6. **Deck Management:** 
   - Import decks from Legions ToolBox to build your personal library
   - Edit deck names inline with real-time updates
   - Switch between decks using the deck selector dropdown
   - **Advanced Deck Builder:** Full-featured deck editor with multi-criteria card filtering
   - **Enhanced Search:** Filter cards by legion, type, rarity, set, and text search
   - **Responsive Layout:** Optimized interface for both desktop and mobile deck building

---

## 🔐 Authentication Features

- **OAuth Integration:** Sign in with GitHub or Google accounts
- **Personal Deck Libraries:** Each user has their own private deck collection
- **Session Management:** Secure JWT-based authentication with automatic session persistence
- **Protected Actions:** Room creation, deck importing, and deck management require authentication
- **Data Privacy:** Users can only access and modify their own decks
- **Graceful UX:** Clear sign-in prompts when authentication is required

---

## 🔧 Tech Stack

- **Frontend:**
  - Next.js 15+ (App Router)
  - TypeScript 5+
  - Tailwind CSS 4.1+
  - shadcn/ui (UI component library)
  - Custom MultiSelect component for advanced filtering
  - Redux Toolkit 2.3+
  - React DnD 16+ (drag and drop)
  - Ant Design 6.2+ (select components)
  - Radix UI 2+ (dropdown, navigation, select)
  - NextAuth.js 4.24+ (authentication)

- **Backend:**
  - Express.js 5.1+
  - Socket.IO 4.8+ (real-time)
  - MongoDB 6.20+ (native client + Mongoose 8.18+)
  - Node.js
  - TypeScript 5+
  - Node-cron 4.2+ (health monitoring)
  - NextAuth.js (JWT session management)
  - Cookie-parser 1.4+ (session token handling)
  - Body-parser 2.2+ (request parsing)
  - Dotenv 17.2+ (environment configuration)
  - Axios 1.7+ (API requests)

- **External APIs:**
  - Legions ToolBox API (deck imports)
  - Remote card images

---

## 💎 TypeScript Architecture

**Full Type Safety Implementation:**
- **Strict Mode Enabled:** Zero compilation errors with comprehensive type checking
- **Foundational Types:** Custom interfaces for Socket.IO, Express, and game state management
- **Type-Safe Networking:** Socket events and Express routes with proper parameter typing
- **Shared Interface System:** Consolidated types between client/server preventing drift
- **Index Signature Safety:** Game state property access with proper type assertions
- **Error Handling:** Proper `unknown` type usage instead of `any` for safe error handling

### Key Type Files
```
src/
├── shared/
│   ├── enums/              # Shared enumerations (CARD_TARGET, CardType)
│   └── interfaces/         # Common interfaces (DeckResponse)
├── server/interfaces/
│   ├── SocketTypes.ts      # Socket.IO server and custom socket types
│   ├── ExpressTypes.ts     # Express app and request extensions
│   ├── GameState.ts        # Server-side game state interface
│   └── CardInterface.ts    # Server card data structure
├── client/interfaces/
│   ├── GameState.ts        # Client-side game state interface
│   ├── CardInterface.ts    # Client card data structure
│   └── Card.mongo.ts       # MongoDB card document interface
└── shared/interfaces/
    └── RoomInterface.ts    # Room and player info types
```

### Type Safety Features
- **Socket.IO Typing:** Custom `IOServer` and `CustomSocket` interfaces with room property extensions
- **Express Middleware:** `AuthenticatedRequest` interface with user context
- **Game State Indexing:** Safe property access with `[key: string]: unknown` and type assertions
- **API Callbacks:** Proper typing for async operations and data fetching
- **Error Boundaries:** Type-safe error handling with proper catch clause typing
- **Card Type Flexibility:** Union types supporting both `string` and `number` ID formats
- **Build Validation:** Zero TypeScript errors in production builds

---

## 🖼️ Intelligent Image Preloading System

### Performance Optimization
- **Connection Awareness:** Automatically adjusts batch size and concurrent requests based on user's network connection
- **Throttled Loading:** Prevents browser overload with configurable concurrent request limits
- **Memory Management:** Intelligent cache management with size limits to prevent memory leaks
- **Service Worker Integration:** Background caching for improved performance
- **Priority-based Loading:** High, normal, and low priority preloading for optimal user experience

### Smart Features
- **Data Saver Respect:** Reduces preloading when user has data saver enabled
- **Connection Type Detection:** Adapts behavior for 2G, 3G, 4G connections
- **Background Preloading:** Non-blocking image preloading for better UX
- **Batch Processing:** Intelligent batching with pauses between batches for lower priority loads
- **Cache Statistics:** Built-in monitoring and statistics for debugging and optimization

### Implementation
- **Singleton Pattern:** Single instance manages all image preloading across the application
- **Promise-based API:** Clean async/await interface for easy integration
- **Utility Functions:** Pre-built functions for common use cases (deck images, game state, search results)
- **Error Handling:** Graceful failure handling with retry mechanisms

### Files
- `src/client/utils/imagePreloader.ts` - Core preloading system with NetworkInformation API integration
- Usage in deck builder, game interface, and card browsing components
- Service Worker integration for offline-capable image caching

---

## 🎯 Enhanced Drag & Drop System

### Zone Index Architecture
- **Multi-Zone Support:** Cards can be organized in multiple zones (Warriors, Fortified, Unified arrays)
- **Index Tracking:** `zoneIndex` parameter tracks card position within multi-dimensional card arrays
- **Source Tracking:** Drag operations include both `cardTarget` and `zoneIndex` for precise card movement
- **Type Safety:** TypeScript interfaces ensure proper zone index handling across client/server operations

### Implementation Details
- **Card Component:** `CardInner.tsx` includes `zoneIndex` in drag item data for accurate positioning
- **Drop Targets:** `GridItem.tsx` and `Hand.tsx` handle zone index in drop event data
- **Event Emission:** Socket events include zone index information for server-side validation
- **State Management:** Redux actions support zone index for precise card state updates

### Technical Files
- `src/app/components/Card/Card.tsx` - Zone index prop passing and event handling
- `src/app/components/Card/CardInner.tsx` - Drag item data with zone index support
- `src/app/components/PlayArea/GridItem.tsx` - Drop target with zone index processing
- `src/app/components/PlayArea/Hand.tsx` - Hand zone drop handling with index support

---

## 🎯 Game Logic & State Flow

### Game Modes
- **Normal Mode:** 
  - Structured turn-based gameplay with phase restrictions
  - Rock Paper Scissors → Mulligan → Guardian → Pre-game → Turn-based War phases
  - All actions validated against current phase and turn ownership
  - Win/loss conditions and game completion (planned)

- **Sandbox Mode:**
  - Unrestricted gameplay after initial Rock Paper Scissors setup
  - No phase restrictions - players can take any action at any time
  - Automatic resolution of card effects requiring player input
  - Ideal for deck testing, experimentation, and learning card interactions
  - Visual indicators show when sandbox mode is active

### State Management
- **Client State:** Redux slices for game state, modals, UI, phases, sequences, and client settings
- **Server State:** Authoritative game state in MongoDB with real-time synchronization
- **Shared Types:** Consolidated TypeScript interfaces and enums in `src/shared/`
- **User Authentication:** JWT sessions with user-specific data isolation
- **Sync Pattern:** Client action → Socket event → Server validation → Database → Broadcast
- **Database Integration:** Local MongoDB for game rooms and user decks, external API for deck imports
- **Game Mode Persistence:** Sandbox mode setting persists through game resets

### Socket Events
- **Game Events:** Card movements, health/AP changes, dice rolls, modifier updates
- **Phase Events:** Game phase transitions and turn management
- **Room Events:** Player joins/leaves, side switching, room configuration updates
- **Chat Events:** Real-time messaging and game log updates

### Card System
- **Multiple Zones:** Hand, Deck, Discard, Eradication, Warriors, Fortified, Warlord, VeilRealm, Synergy, Guardian, Tokens, Revealed
- **Card Actions:** Move, flip, modify attack/counters/cooldowns, target, select
- **Card Interactions:** Right-click context menus, drag-and-drop, modifier management
- **Zone Index Tracking:** Enhanced drag-and-drop with zone index support for multi-zone card arrays
- **Game Mechanics:** Health/AP tracking, turn phases, dice rolling, RPS determination
- **Action Validation:** Context-aware validation system with sandbox mode bypasses
- **Sequence Resolution:** Complex card effect chains with automatic sandbox auto-resolution
- **Modifier System:** Visual attack/defense/other modifiers with increment/decrement controls
- **Cooldown Management:** Cooldown tracking for special card types (VeilRealm, Warlord, Synergy)
- **Game Log System:** Real-time game log tracking with conditional display in sandbox mode

---

## 🌐 API Endpoints

### REST API
- `GET /healthz` - Health check endpoint for monitoring
- `POST /createRoom` - Create a new game room (requires authentication for certain features)
- `POST /joinRoom` - Join an existing game room
- `GET /api/toolboxDecks/:deckId` - Fetch deck data from Legions ToolBox API
- `POST /api/decks` - Create a new deck (requires authentication)
- `GET /api/decks` - Get user's deck library (optionally filtered by user)
- `GET /api/decks/:deckId` - Get specific deck by ID (with ownership validation)
- `PATCH /api/decks/:deckId` - Update deck information (requires authentication and ownership)
- `DELETE /api/decks/:deckId` - Delete a deck (requires authentication and ownership)
- `GET /api/cards` - Get cards with filtering support (legion, type, rarity, set, pagination)
- `GET /api/filterOptions` - Get available filter options for cards

### NextAuth API Routes
- `/api/auth/[...nextauth]` - Authentication endpoints (Google, GitHub OAuth)
- `/api/auth/signin` - Sign in page
- `/api/auth/signout` - Sign out endpoint
- `/api/auth/session` - Current session information

### Socket Events
- `gameEvent` - Game state changes (card moves, health, AP, modifiers, etc.)
- `phaseEvent` - Game phase transitions (pregame, RPS, main phases)
- `roomEvent` - Room management (join, leave, switch sides)
- `rooms` - Available rooms list updates
- `joinedGame` - Successful room join confirmation

---

## ⚙️ Sandbox Mode Technical Details

### Architecture
- **Single Boolean Flag:** `sandboxMode: boolean` added to game state interfaces
- **Room Configuration:** Sandbox mode set during room creation and inherited by game state
- **Client-Side Indicators:** Orange "🔧 Sandbox Mode" banners in UI when active
- **Server-Side Logic:** Phase progression disabled after RPS, validation bypassed
- **Sequence System:** Auto-resolves player input requirements in sandbox mode
- **Game Log Integration:** Dedicated game log display in Toolbar when sandbox mode is active
- **Default Configuration:** Sandbox mode defaults to `true` in initial game state for development

### Implementation Files
- **State Interfaces:** `src/server/interfaces/GameState.ts`, `src/client/interfaces/GameState.ts`
- **Room Creation:** `src/app/components/Modals/CreateRoomModal.tsx`
- **Game Initialization:** `src/server/game/game.ts` (startGame function)
- **Phase Management:** `src/server/events/playerEvents.ts` (goNextPhase function)
- **Validation System:** `src/server/utils/sandboxValidator.util.ts`
- **UI Components:** `src/app/play/page.tsx`, `src/app/components/PlayArea/Toolbar.tsx`
- **Sequence Resolution:** `src/server/utils/game.util.ts` (resolveFirstItemInSequence function)

### Safety Features
- **Zero Breaking Changes:** Normal mode gameplay completely unchanged
- **Opt-in Only:** Sandbox mode must be explicitly selected during room creation
- **State Persistence:** Sandbox mode setting maintained through game resets and reconnections
- **Clear Visual Feedback:** Users always know which mode they're in with orange banners

---

## 🔄 Development Workflow

### Adding New Features

1. **New Card Action:**
   - Update `GAME_EVENT` enum in `src/shared/enums/`
   - Add reducer in `gameStateSlice.ts` with proper typing
   - Create server-side validation in event handlers
   - Add type-safe Socket.IO event parameters
   - Consider sandbox mode bypass if needed
   - Update UI components with proper TypeScript interfaces

2. **New Socket Event:**
   - Add to shared enums or appropriate client/server enums
   - Update socket handlers in `src/server/network/socketHandler.ts` with typed parameters
   - Add client-side event emission with type-safe payloads
   - Test in both normal and sandbox modes
   - Ensure proper `IOServer` and `CustomSocket` type usage

3. **Database Changes:**
   - Update MongoDB queries in `src/server/utils/database.util.ts`
   - Modify shared TypeScript interfaces in `src/shared/interfaces/`
   - Use proper type assertions for game state property access
   - Test with existing data and ensure type safety
   - Ensure compatibility with sandbox mode state

4. **New Shared Type:**
   - Add to `src/shared/interfaces/` or `src/shared/enums/`
   - Update imports in both client and server code
   - Maintain strict TypeScript compliance with zero compilation errors
   - Use proper type guards and assertions where needed

### TypeScript Best Practices
- **Avoid `any` Types:** Use `unknown` with proper type guards or specific interfaces
- **Index Signatures:** Use `(object as SpecificType[])` for safe property access on game state
- **Error Handling:** Catch clauses should use `unknown` type with proper type checking
- **API Callbacks:** Define specific callback interfaces rather than generic functions
- **Build Validation:** Run `npm run build` to ensure zero TypeScript compilation errors
   - Ensure type consistency across the application
   - Update both game modes if applicable

---

## 📦 Deployment

### Docker
```bash
docker build -t legions-battleground .
docker run -p 3000:3000 legions-battleground
```

### Environment Variables
- `NODE_ENV` - Development/production mode
- `PORT` - Server port (default: 3000)
- `MONGO_URL` - MongoDB connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret key for JWT signing
- `NEXTAUTH_URL` - Application URL for OAuth redirects
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret  
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret

### Production Setup
- **Platform:** Render.com (current deployment)
- **Database:** MongoDB Atlas
- **Health Monitoring:** Automated cron job pings
- **CDN:** Card images served from legionstoolbox.com

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🔗 Links

- **Live Demo:** [Legions Battleground](https://legions-battleground.onrender.com)
- **Legions ToolBox:** [Create Decks](https://legionstoolbox.com/my-decks)
- **Game Rules:** [Legions Realms At War Official](https://www.legionsrealmsatwar.ca)

---

## 🐛 Issues & Support

For bug reports, feature requests, or questions:
- Open an issue on GitHub
- Check existing issues before creating new ones
- Provide detailed reproduction steps for bugs

---

*Built with ❤️ for the Legions Realms At War community*
