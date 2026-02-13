# Cleanup Plan for Server Refactoring

## Files to Remove After Testing

### 1. Old Socket Utils
- `src/server/utils/socket.util.ts` (original implementation)

### 2. Temporary Files
- `src/server/utils/socket.util.clean.ts` (rename to socket.util.ts after testing)

## Files to Modify

### 1. Update Imports
Search and replace these imports across the codebase:

```typescript
// OLD:
import { startGame } from '../game/game';

// NEW:  
import { GameService } from '../services/GameService';
const gameService = new GameService();
// Use: gameService.startGame(roomId, deckId)
```

### 2. Update game.ts
Simplify `src/server/game/game.ts`:
- Keep `games` and `users` exports for backward compatibility
- Remove `startGame` function (moved to GameService)
- Keep `gameEventMap` and `roomEventMap` until all events are migrated

### 3. Optional: Gradual Event Migration
Events can be moved one by one from the old event handlers to the new EventHandler service.

## Testing Checklist

Before removing old files:
- [ ] All socket events work correctly
- [ ] Room creation and joining works
- [ ] Game start/reset works
- [ ] Player disconnect cleanup works
- [ ] Error handling provides meaningful messages
- [ ] No memory leaks in room/game cleanup 
- [ ] Performance is maintained

## Migration Steps

1. **Test Phase**: Use clean socket handlers, run comprehensive tests
2. **Deploy Phase**: Deploy with new handlers but keep old files
3. **Monitor Phase**: Monitor for any issues in production  
4. **Cleanup Phase**: Remove old files once stability is confirmed

## Rollback Plan

If issues arise:
1. Revert `src/server/network/socketHandler.ts` to use old socket.util import
2. Fix issues in new implementation
3. Re-test and retry migration

## Benefits After Cleanup

- **Reduced Code**: ~200 lines removed from socket.util.ts
- **Better Error Handling**: Consistent error responses to clients  
- **Easier Testing**: Services can be unit tested independently
- **Clearer Structure**: Business logic separated from socket handling
- **Maintainable**: Each service has a single responsibility