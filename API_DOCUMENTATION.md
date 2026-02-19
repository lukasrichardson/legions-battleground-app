# API Documentation
## Legions Battleground - REST API & WebSocket Events

**Last Updated**: February 19, 2026

---

## Authentication

All authenticated endpoints require a valid session token. Authentication is handled via NextAuth.js with OAuth providers.

### OAuth Providers
- **GitHub**: `/api/auth/signin/github`
- **Google**: `/api/auth/signin/google` 
- **Discord**: `/api/auth/signin/discord`

### Session Management
- **Get Session**: `GET /api/auth/session`
- **Sign Out**: `POST /api/auth/signout`

---

## REST API Endpoints

### Health & Monitoring

#### Health Check
```http
GET /healthz
```
Returns server health status for monitoring services.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-02-19T10:30:00Z"
}
```

---

### Room Management

#### Create Room
```http
POST /createRoom
```

**Body:**
```json
{
  "roomName": "string",
  "password": "string (optional)",
  "playerName": "string",
  "deckId": "string",
  "sandboxMode": "boolean"
}
```

**Response:**
```json
{
  "success": true,
  "roomId": "string",
  "message": "Room created successfully"
}
```

#### Join Room
```http
POST /joinRoom
```

**Body:**
```json
{
  "roomId": "string",
  "password": "string (optional)", 
  "playerName": "string",
  "deckId": "string"
}
```

---

### Deck Management

#### Get User Decks
```http
GET /api/decks
Authorization: Bearer <session_token>
```

**Query Parameters:**
- `userId` - Filter by user ID (optional, requires admin)

**Response:**
```json
{
  "decks": [
    {
      "_id": "string",
      "name": "string",
      "userId": "string", 
      "cards": [...],
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

#### Get Specific Deck
```http
GET /api/decks/:deckId
Authorization: Bearer <session_token>
```

#### Create Deck
```http
POST /api/decks
Authorization: Bearer <session_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "string",
  "cards": "array",
  "description": "string (optional)"
}
```

#### Update Deck
```http
PATCH /api/decks/:deckId  
Authorization: Bearer <session_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "string (optional)",
  "cards": "array (optional)"
}
```

#### Delete Deck
```http
DELETE /api/decks/:deckId
Authorization: Bearer <session_token>
```

---

### External Deck Import

#### Get Toolbox Deck
```http
GET /api/toolboxDecks/:deckId
```

Fetches deck data from Legions ToolBox API for import.

**Response:**
```json
{
  "success": true,
  "deck": {
    "name": "string",
    "cards": [...],
    "description": "string"
  }
}
```

---

### Card Data

#### Get Cards
```http
GET /api/cards
```

**Query Parameters:**
- `query` - Text search (title, text, code)
- `legion` - Filter by legion (comma-separated)
- `type` - Filter by card type (comma-separated)  
- `rarity` - Filter by rarity (comma-separated)
- `set` - Filter by set (comma-separated)
- `page` - Page number (default: 1)
- `pageSize` - Results per page (default: 20, max: 100)

**Response:**
```json
{
  "cards": [...],
  "totalCount": "number",
  "page": "number",
  "pageSize": "number",
  "totalPages": "number"
}
```

#### Get Filter Options
```http
GET /api/filterOptions
```

Returns available filter values for cards.

**Response:**
```json
{
  "legions": ["string"],
  "types": ["string"],
  "rarities": ["string"], 
  "sets": ["string"]
}
```

---

## WebSocket Events

### Connection
Connect to: `ws://localhost:3000` (development) or `wss://your-domain.com` (production)

### Room Events (`roomEvent`)

#### Join Room
```javascript
socket.emit('roomEvent', {
  type: 'JOIN_ROOM',
  roomId: 'string',
  playerName: 'string',
  deckId: 'string',
  password: 'string' // optional
});
```

#### Leave Room
```javascript
socket.emit('roomEvent', {
  type: 'LEAVE_ROOM',
  roomId: 'string'
});
```

#### Switch Sides
```javascript
socket.emit('roomEvent', {
  type: 'SWITCH_SIDES',
  roomId: 'string'
});
```

### Game Events (`gameEvent`)

#### Move Card
```javascript
socket.emit('gameEvent', {
  type: 'MOVE_CARD',
  roomId: 'string',
  cardId: 'string|number',
  source: 'HAND|DECK|DISCARD|...',
  target: 'HAND|DECK|DISCARD|...',
  zoneIndex: 'number' // optional, for multi-zone arrays
});
```

#### Modify Health/AP
```javascript
socket.emit('gameEvent', {
  type: 'MODIFY_HEALTH', // or MODIFY_AP
  roomId: 'string', 
  playerId: 'string',
  amount: 'number' // positive or negative
});
```

#### Roll Dice
```javascript
socket.emit('gameEvent', {
  type: 'ROLL_DICE',
  roomId: 'string',
  sides: 'number' // 6, 8, 10, 12, 20
});
```

#### Reset Game
```javascript
socket.emit('gameEvent', {
  type: 'RESET_GAME',
  roomId: 'string'
});
```

### Phase Events (`phaseEvent`)

#### Go Next Phase
```javascript
socket.emit('phaseEvent', {
  type: 'GO_NEXT_PHASE',
  roomId: 'string'
});
```

#### Rock Paper Scissors
```javascript
socket.emit('phaseEvent', {
  type: 'ROCK_PAPER_SCISSORS',
  roomId: 'string',
  choice: 'rock|paper|scissors'
});
```

---

## Response Events (Client Receives)

### Room Updates
- `rooms` - Updated list of available rooms
- `joinedGame` - Successful room join confirmation
- `roomEvent` - Room state changes

### Game State Updates  
- `gameEvent` - Game state synchronization
- `phaseEvent` - Phase transition updates

### Error Handling
- `error` - Error messages with details
- `validation_error` - Validation failures

---

## Error Codes  

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (permission denied)
- `404` - Not Found
- `500` - Internal Server Error

### Custom Error Types
- `ROOM_NOT_FOUND` - Requested room does not exist
- `ROOM_FULL` - Room has maximum players
- `INVALID_PASSWORD` - Incorrect room password
- `DECK_NOT_FOUND` - Specified deck not found
- `UNAUTHORIZED_ACCESS` - User lacks permission
- `VALIDATION_ERROR` - Request data validation failed

---

## Rate Limiting

- **API Endpoints**: 100 requests per minute per IP
- **WebSocket Events**: 50 events per second per connection  
- **Room Creation**: 5 rooms per hour per user

---

## Development Environment

### Base URLs
- **Development**: `http://localhost:3000`
- **Production**: `https://legions-battleground.onrender.com`

### Testing
Use tools like Postman, curl, or socket.io-client for API testing.

### Authentication in Development
OAuth providers require proper redirect URLs configured:
- **GitHub**: `http://localhost:3000/api/auth/callback/github`
- **Google**: `http://localhost:3000/api/auth/callback/google`

---

*This API documentation reflects the current implementation as of February 19, 2026.*