# Manual Test Instructions for Sandbox Mode Implementation

## Test 1: Normal Mode (Default)
1. Go to http://localhost:3000
2. Click "Create New Game"
3. Fill in room name, your name, select a deck
4. Leave "Sandbox Mode" unchecked (should be default)
5. Create the game
6. Expected: RPS modal should appear
7. Choose Rock/Paper/Scissors 
8. Expected: RPS result modal should appear
9. After RPS, expect Mulligan modal to appear for winner
10. Expected: Standard game flow with phase restrictions

## Test 2: Sandbox Mode
1. Go to http://localhost:3000 
2. Click "Create New Game"
3. Fill in room name, your name, select a deck
4. Check "Sandbox Mode" checkbox
5. Create the game
6. Expected: RPS modal should appear (this is allowed)
7. Choose Rock/Paper/Scissors
8. Expected: After RPS resolution, NO mulligan modal should appear
9. Expected: Orange "🔧 Sandbox Mode" indicator in top-right
10. Expected: Orange "🔧 Sandbox Mode Active" indicator in toolbar
11. Expected: All card interactions should work freely
12. Expected: No phase-based restrictions

## Test 3: Game State Persistence
1. Create a sandbox mode game
2. Use "Reset Game" button in toolbar
3. Expected: Game should remain in sandbox mode after reset
4. Expected: Indicators should still show sandbox mode active

## Test 4: Action Validation
1. In sandbox mode, try actions that would normally be restricted
2. Expected: Actions should succeed without validation errors
3. In normal mode, same actions should be properly validated

## Console Logs to Check

- "Sandbox mode: Manual phase control - skipping auto-progression" 
- No validation warnings for sandbox mode actions
- Proper phase progression logs for normal mode

## UI Elements to Verify

- ✅ Sandbox checkbox in CreateRoomModal (unchecked by default)
- ✅ Orange indicator in top-right of game screen (sandbox only)
- ✅ Orange indicator in toolbar (sandbox only)
- ✅ No mulligan modal in sandbox mode (after RPS)
- ✅ RPS modal still works in both modes
